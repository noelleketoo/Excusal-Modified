'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function StaffDashboard() {
  const [tab, setTab] = useState<'pending' | 'history' | 'tracker'>('pending');
  const [excusals, setExcusals] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [cadetStats, setCadetStats] = useState<{name: string; count: number}[]>([]);
  const [resetDate, setResetDate] = useState<string | null>(null);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      const query =
        tab === 'pending'
          ? supabase
              .from('excusals')
              .select(`
                id,
                event_id,
                reason,
                makeup,
                submitted_at,
                status,
                cadets(name, email),
                events(id, name, start_date)
              `)
              .eq('status', 'pending')
          : supabase
              .from('excusals')
              .select(`
                id,
                event_id,
                reason,
                makeup,
                submitted_at,
                status,
                cadets(name, email),
                events(id, name, start_date)
              `)
              .in('status', ['approved', 'denied'])
              .order('submitted_at', { ascending: false });

      const { data, error } = await query;
      if (error) console.error(error);
      else setExcusals(data || []);
    }

    fetchData();
  }, [tab]);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .order('name');
      if (error) console.error(error);
      else setEvents(data || []);
    }
    fetchEvents();
  }, []);

  // Fetch tracker data when tracker tab is active
  useEffect(() => {
    if (tab !== 'tracker') return;

    async function fetchTrackerData() {
      setLoadingTracker(true);

      // 1. Get the reset date
      const { data: settings, error: settingsError } = await supabase
        .from('tracker_settings')
        .select('reset_date')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let currentResetDate = '2000-01-01';
      if (settingsError) {
        // If table doesn't exist yet, use a default date
        setResetDate('All time');
      } else {
        currentResetDate = settings?.reset_date || '2000-01-01';
        setResetDate(new Date(currentResetDate).toLocaleDateString());
      }

      // 2. Get all cadets
      const { data: cadets, error: cadetsError } = await supabase
        .from('cadets')
        .select('id, name');

      if (cadetsError) {
        console.error('Error fetching cadets:', cadetsError);
        setLoadingTracker(false);
        return;
      }

      // 3. Get approved AND denied excusals since reset date
      const { data: excusalsData, error: excusalsError } = await supabase
        .from('excusals')
        .select('cadet_id')
        .in('status', ['approved', 'denied'])
        .gte('submitted_at', currentResetDate);

      if (excusalsError) {
        console.error('Error fetching excusals:', excusalsError);
        setLoadingTracker(false);
        return;
      }

      // 4. Count excusals per cadet
      const countMap = new Map<string, number>();
      excusalsData?.forEach((ex) => {
        countMap.set(ex.cadet_id, (countMap.get(ex.cadet_id) || 0) + 1);
      });

      // 5. Build stats array with all cadets
      const stats = cadets?.map((cadet) => ({
        name: cadet.name,
        count: countMap.get(cadet.id) || 0,
      })) || [];

      // Sort by count descending, then by name
      stats.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      setCadetStats(stats);
      setLoadingTracker(false);
    }

    fetchTrackerData();
  }, [tab]);

  async function exportToCSV() {
    // Fetch all cadets
    const { data: allCadets, error: cadetsError } = await supabase
      .from('cadets')
      .select('id, name, email')
      .order('name');

    if (cadetsError) {
      alert('Error fetching cadets: ' + cadetsError.message);
      return;
    }

    // Fetch excusals for the selected event
    const { data: eventExcusals, error: excusalsError } = await supabase
      .from('excusals')
      .select('cadet_id, status')
      .eq('event_id', selectedEventId);

    if (excusalsError) {
      alert('Error fetching excusals: ' + excusalsError.message);
      return;
    }

    // Create a map of cadet_id -> status
    const excusalMap = new Map();
    eventExcusals?.forEach((ex) => {
      excusalMap.set(ex.cadet_id, ex.status);
    });

    // Build rows for all cadets
    const eventName = events.find((e) => e.id === selectedEventId)?.name || 'event';
    const headers = ['Name', 'Email', 'Status'];
    const rows = allCadets?.map((cadet) => {
      const excusalStatus = excusalMap.get(cadet.id);
      let status = 'Present';
      if (excusalStatus === 'approved') status = 'Excused';
      else if (excusalStatus === 'denied') status = 'Denied';
      else if (excusalStatus === 'pending') status = 'Pending';
      
      return [cadet.name, cadet.email, status];
    }) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${eventName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    setSelectedEventId('');
  }

  async function handleResetTracker() {
    const confirmReset = confirm(
      'Are you sure you want to reset the tracker for a new semester? ' +
      'This will reset all counts to zero. No data will be deleted.'
    );

    if (!confirmReset) return;

    const { error } = await supabase
      .from('tracker_settings')
      .insert([{ reset_date: new Date().toISOString(), reset_by: 'staff' }]);

    if (error) {
      alert('Error resetting tracker: ' + error.message);
      return;
    }

    // Refresh the tracker data
    setTab('pending');
    setTimeout(() => setTab('tracker'), 100);

    alert('Tracker has been reset for the new semester!');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">
          Staff Dashboard
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/roster-update')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
          >
            Update Roster
          </button>
          <button
            onClick={() => router.push('/manage-events')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm"
          >
            Manage Events
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-6 mt-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-6 py-2 font-semibold rounded-t-lg border-b-4 ${
            tab === 'pending'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Excusals
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-6 py-2 font-semibold rounded-t-lg border-b-4 ${
            tab === 'history'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Excusal History
        </button>
        <button
          onClick={() => setTab('tracker')}
          className={`px-6 py-2 font-semibold rounded-t-lg border-b-4 ${
            tab === 'tracker'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Accountability Tracker
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === 'pending' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              Pending Excusals
            </h2>
            {excusals.length === 0 ? (
              <p className="text-gray-600 italic">
                No pending excusals right now.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {excusals.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-blue-800">
                      {item.cadets?.name || 'Unknown Cadet'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Event:</span>{' '}
                      {item.events?.name || 'N/A'}
                      {item.events?.start_date && (
                        <span className="text-gray-500"> ({item.events.start_date})</span>
                      )}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Reason:</span>{' '}
                      {item.reason}
                    </p>
                    {item.makeup && (
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">Makeup Plan:</span>{' '}
                        {item.makeup}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs">
                      Submitted: {new Date(item.submitted_at).toLocaleString()}
                    </p>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={async () => {
                          // Update status to approved
                          await supabase
                            .from('excusals')
                            .update({ status: 'approved' })
                            .eq('id', item.id);

                          // Send approval email
                          try {
                            const emailRes = await fetch('/api/send-excusal-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                cadetEmail: item.cadets?.email,
                                cadetName: item.cadets?.name,
                                eventName: item.events?.name,
                                eventDate: item.events?.start_date,
                                status: 'approved',
                              }),
                            });
                            if (!emailRes.ok) {
                              console.error('Email failed:', await emailRes.text());
                            }
                          } catch (err) {
                            console.error('Email error:', err);
                          }

                          setExcusals(excusals.filter((e) => e.id !== item.id));
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow-sm"
                      >
                        Approve
                      </button>

                      <button
                        onClick={async () => {
                          const denialReason = prompt('Please provide a reason for denial (optional):');

                          // Update status to denied with optional reason
                          await supabase
                            .from('excusals')
                            .update({
                              status: 'denied',
                              denial_reason: denialReason || null
                            })
                            .eq('id', item.id);

                          // Send denial email
                          try {
                            const emailRes = await fetch('/api/send-excusal-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                cadetEmail: item.cadets?.email,
                                cadetName: item.cadets?.name,
                                eventName: item.events?.name,
                                eventDate: item.events?.start_date,
                                status: 'denied',
                                denialReason: denialReason || undefined,
                              }),
                            });
                            if (!emailRes.ok) {
                              console.error('Email failed:', await emailRes.text());
                            }
                          } catch (err) {
                            console.error('Email error:', err);
                          }

                          setExcusals(excusals.filter((e) => e.id !== item.id));
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold shadow-sm"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              Excusal History
            </h2>
            {excusals.length === 0 ? (
              <p className="text-gray-600 italic">
                No previous excusals to show.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-blue-100 text-blue-800">
                      <th className="px-4 py-2 text-left">Cadet</th>
                      <th className="px-4 py-2 text-left">Event</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                      <th className="px-4 py-2 text-left">Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excusals.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2">{item.cadets?.name}</td>
                        <td className="px-4 py-2">
                          {item.events?.name}
                          {item.events?.start_date && (
                            <span className="text-gray-500 text-sm"> ({item.events.start_date})</span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-2 font-medium ${
                            item.status === 'approved'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.status}
                        </td>
                        <td className="px-4 py-2">{item.reason}</td>
                        <td className="px-4 py-2 text-gray-500 text-sm">
                          {new Date(item.submitted_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'tracker' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-700">
                  Accountability Tracker
                </h2>
                <p className="text-gray-500 text-sm">
                  Counting excusals since: {resetDate || 'Loading...'}
                </p>
              </div>
              <button
                onClick={handleResetTracker}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm"
              >
                Reset for New Semester
              </button>
            </div>

            {loadingTracker ? (
              <p className="text-gray-600 italic">Loading tracker data...</p>
            ) : (
              <>
                {/* Top 10 Bar Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-8">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    Top 10 Cadets by Excusal Count
                  </h3>
                  {cadetStats.slice(0, 10).every(s => s.count === 0) ? (
                    <p className="text-gray-500 italic">No excusals recorded since last reset.</p>
                  ) : (
                    <div className="space-y-3">
                      {cadetStats.slice(0, 10).map((stat, index) => {
                        const maxCount = cadetStats[0]?.count || 1;
                        const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                        return (
                          <div key={stat.name} className="flex items-center gap-3">
                            <span className="w-6 text-gray-500 text-sm">{index + 1}.</span>
                            <span className="w-40 truncate text-gray-800 font-medium">
                              {stat.name}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                                style={{ width: `${Math.max(percentage, stat.count > 0 ? 10 : 0)}%` }}
                              >
                                {stat.count > 0 && (
                                  <span className="text-white text-xs font-semibold">
                                    {stat.count}
                                  </span>
                                )}
                              </div>
                            </div>
                            {stat.count === 0 && (
                              <span className="text-gray-400 text-sm">0</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Full Cadet List Table */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    All Cadets ({cadetStats.length})
                  </h3>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-blue-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-blue-800">Rank</th>
                          <th className="px-4 py-2 text-left text-blue-800">Cadet Name</th>
                          <th className="px-4 py-2 text-left text-blue-800">Excusal Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cadetStats.map((stat, index) => (
                          <tr
                            key={stat.name}
                            className={`border-t hover:bg-gray-50 transition-colors ${
                              stat.count >= 3 ? 'bg-red-50' : ''
                            }`}
                          >
                            <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                            <td className="px-4 py-2 font-medium text-gray-800">{stat.name}</td>
                            <td className={`px-4 py-2 font-semibold ${
                              stat.count >= 3 ? 'text-red-600' : 'text-gray-700'
                            }`}>
                              {stat.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Export Excusals</h2>
            <p className="text-gray-600 mb-4">Select an event to export:</p>
            
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none mb-6"
            >
              <option value="">-- Select Event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedEventId('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={exportToCSV}
                disabled={!selectedEventId}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-lg"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
