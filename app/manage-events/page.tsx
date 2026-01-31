'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  // Fetch events (only non-archived)
  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('archived', false)
        .order('start_date', { ascending: true });
      if (error) console.error(error);
      else setEvents(data || []);
    }
    loadEvents();
  }, []);

  // Add new event
  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !eventDate) return alert('Please fill out both fields.');

    const { error } = await supabase.from('events').insert([
      {
        name: eventName,
        start_date: eventDate,
      },
    ]);

    if (error) alert('Error adding event: ' + error.message);
    else {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('archived', false)
        .order('start_date', { ascending: true });
      setEvents(data || []);
      setEventName('');
      setEventDate('');
    }
  }

  // Archive event (soft delete)
  async function handleArchiveEvent(id: string) {
    const confirmArchive = confirm('Archive this event? It will be hidden from the list but excusal history will be preserved.');
    if (!confirmArchive) return;

    const { error } = await supabase
      .from('events')
      .update({ archived: true })
      .eq('id', id);

    if (error) alert('Error archiving event: ' + error.message);
    else setEvents(events.filter((e) => e.id !== id));
  }

  // Load attendance for selected event
  async function handleViewAttendance(eventId: string) {
    setSelectedEvent(eventId);

    // 1️⃣ Get all cadets
    const { data: cadets, error: cadetError } = await supabase
      .from('cadets')
      .select('id, name, email');

    // 2️⃣ Get all excusals for that event
    const { data: excusals, error: excusalError } = await supabase
      .from('excusals')
      .select('cadet_id, status, reason')
      .eq('event_id', eventId);

    if (cadetError || excusalError) {
      console.error(cadetError || excusalError);
      return;
    }

    // 3️⃣ Merge both
    const attendanceList = cadets.map((c) => {
      const excusal = excusals.find((e) => e.cadet_id === c.id);
      return {
        name: c.name,
        email: c.email,
        status: excusal ? excusal.status : 'attending',
        reason: excusal?.reason || '',
      };
    });

    setAttendance(attendanceList);
  }

  // 📤 Download CSV
  function handleDownloadCsv() {
    if (attendance.length === 0)
      return alert('No attendance records to export.');

    const headers = ['Name', 'Email', 'Status', 'Reason'];
    const rows = attendance.map((a) => [
      a.name,
      a.email,
      a.status,
      a.reason.replace(/\n/g, ' '),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_${selectedEvent}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">Manage Events</h1>
        <button
          onClick={() => router.push('/staff-dashboard')}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Add Event Form */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Add an Event</h2>
        <form
          onSubmit={handleAddEvent}
          className="flex flex-col md:flex-row gap-3 mb-8"
        >
          <input
            type="text"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
          >
            Add Event
          </button>
        </form>

        {/* Event List */}
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Current Events</h2>
        {events.length === 0 ? (
          <p className="text-gray-600 italic">No events found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-blue-800">
                  {event.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Date: {new Date(event.start_date).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewAttendance(event.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow-sm"
                  >
                    View Attendance
                  </button>
                  <button
                    onClick={() => handleArchiveEvent(event.id)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold shadow-sm"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attendance Table */}
        {selectedEvent && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-blue-700 mb-3">
              Attendance for Selected Event
            </h2>
            {attendance.length === 0 ? (
              <p className="text-gray-600 italic">No cadets found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 bg-white rounded-lg shadow-sm">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, i) => (
                      <tr key={i} className="border-t hover:bg-blue-50">
                        <td className="py-3 px-4">{a.name}</td>
                        <td className="py-3 px-4">{a.email}</td>
                        <td
                          className={`py-3 px-4 font-medium ${
                            a.status === 'approved'
                              ? 'text-green-600'
                              : a.status === 'denied'
                              ? 'text-red-600'
                              : 'text-gray-700'
                          }`}
                        >
                          {a.status}
                        </td>
                        <td className="py-3 px-4">{a.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Download CSV */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDownloadCsv}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Download Attendance CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
