'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function StaffDashboard() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [excusals, setExcusals] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const query =
        tab === 'pending'
          ? supabase
              .from('excusals')
              .select(`
                id,
                reason,
                submitted_at,
                status,
                cadets(name, email),
                events(name)
              `)
              .eq('status', 'pending')
          : supabase
              .from('excusals')
              .select(`
                id,
                reason,
                submitted_at,
                status,
                cadets(name, email),
                events(name)
              `)
              .in('status', ['approved', 'denied'])
              .order('submitted_at', { ascending: false });

      const { data, error } = await query;
      if (error) console.error(error);
      else setExcusals(data || []);
    }

    fetchData();
  }, [tab]);

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
    </div>
  );
}
