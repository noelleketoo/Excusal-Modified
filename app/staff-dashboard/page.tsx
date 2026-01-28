'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function StaffDashboard() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [excusals, setExcusals] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
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
                submitted_at,
                status,
                cadets(name, email),
                events(id, name)
              `)
              .eq('status', 'pending')
          : supabase
              .from('excusals')
              .select(`
                id,
                event_id,
                reason,
                submitted_at,
                status,
                cadets(name, email),
                events(id, name)
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
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === 'pending' ? (
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
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Reason:</span>{' '}
                      {item.reason}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Submitted: {new Date(item.submitted_at).toLocaleString()}
                    </p>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={async () => {
                          await supabase
                            .from('excusals')
                            .update({ status: 'approved' })
                            .eq('id', item.id);
                          setExcusals(excusals.filter((e) => e.id !== item.id));
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow-sm"
                      >
                        Approve
                      </button>

                      <button
                        onClick={async () => {
                          await supabase
                            .from('excusals')
                            .update({ status: 'denied' })
                            .eq('id', item.id);
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
        ) : (
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
                        <td className="px-4 py-2">{item.events?.name}</td>
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
