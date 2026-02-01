'use client';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

function ExcusalFormContent() {
  const [form, setForm] = useState({
    name: '',
    eventId: '',
    eventName: '',
    reason: '',
    makeup: '',
    contact: '',
    date: new Date().toLocaleDateString('en-US'),
    cpt: '',
    co: '',
  });
  const [events, setEvents] = useState<{ id: string; name: string; start_date: string; type: string }[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<'LLAB' | 'PT' | 'Other' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load cadet name from URL parameter
  useEffect(() => {
    const nameParam = searchParams.get('name');
    if (nameParam) {
      setForm((prev) => ({ ...prev, name: nameParam }));
    }
  }, [searchParams]);

  // Load events (only non-archived)
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, type')
        .eq('archived', false)
        .order('start_date', { ascending: true });
      if (error) console.error(error);
      else setEvents(data || []);
    };
    fetchEvents();
  }, []);

  // Handle event selection from modal
  const handleEventSelect = (eventId: string, eventName: string) => {
    setForm({ ...form, eventId, eventName });
    setShowEventModal(false);
    setSelectedEventType(null);
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Verify cadet name
    const { data: cadet, error: cadetError } = await supabase
      .from('cadets')
      .select('id')
      .ilike('name', form.name.trim())
      .maybeSingle();

    if (!cadet || cadetError) {
      alert(
        'Error: No matching cadet name found. Please check the spelling or update the roster.'
      );
      setLoading(false);
      return;
    }

    // Check if event is selected
    if (!form.eventId) {
      alert('Please select an event.');
      setLoading(false);
      return;
    }

    // Insert excusal
    const { error } = await supabase.from('excusals').insert([
      {
        cadet_id: cadet.id,
        event_id: form.eventId,
        reason: form.reason,
        makeup: form.makeup,
        contact: form.contact,
        date: form.date,
        cpt: form.cpt,
        co: form.co,
        status: 'pending',
      },
    ]);

    setLoading(false);
    if (error) {
      alert('Error submitting excusal: ' + error.message);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white shadow-lg rounded-3xl p-10 text-center border border-gray-200 max-w-md">
          <h1 className="text-2xl font-bold text-blue-700 mb-3">
            Excusal Submitted
          </h1>
          <p className="text-gray-600 mb-6">
            Your request has been sent for review.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="relative flex justify-center bg-gray-100 min-h-screen py-8 overflow-x-auto">
      <div className="relative w-full min-w-[650px] max-w-[650px] aspect-[8.5/11]">
        {/* Background PDF */}
        <Image
          src="/images/excusal_template.png"
          alt="Excusal Form"
          fill
          className="rounded-lg shadow-md border object-contain pointer-events-none"
        />

        {/* Form Overlay */}
        <form onSubmit={handleSubmit} className="absolute inset-0">
          {/* Cadet Name */}
          <input
            name="name"
            placeholder="Cadet Name"
            value={form.name}
            onChange={handleChange}
            readOnly={!!searchParams.get('name')}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-400"
            style={{
              top: '66%',
              left: '67%',
              width: '12%',
              height: '6%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Event selection button */}
          <button
            type="button"
            onClick={() => setShowEventModal(true)}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-xs text-gray-900 hover:bg-white focus:ring-2 focus:ring-blue-400 cursor-pointer"
            style={{
              top: '38%',
              left: '40%',
              width: '30%',
              height: '2%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {form.eventName || 'Select Event'}
          </button>

          {/* Reason */}
          <textarea
            name="reason"
            placeholder="Reason for Excusal"
            value={form.reason}
            onChange={handleChange}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-400"
            style={{
              top: '43%',
              left: '50%',
              width: '60%',
              height: '5%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Makeup plan */}
          <textarea
            name="makeup"
            placeholder="Makeup Plan"
            value={form.makeup}
            onChange={handleChange}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-400"
            style={{
              top: '50%',
              left: '50%',
              width: '60%',
              height: '5%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Contact info */}
          <textarea
            name="contact"
            placeholder="Contact Info"
            value={form.contact}
            onChange={handleChange}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-400"
            style={{
              top: '57%',
              left: '50%',
              width: '60%',
              height: '3%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Date */}
          <input
            name="date"
            placeholder="Date"
            value={form.date}
            onChange={handleChange}
            className="absolute text-center border border-gray-400 rounded bg-white/85 text-[10px] text-gray-900 focus:ring-1 focus:ring-blue-400"
            style={{
              top: '15.5%',
              left: '72%',
              width: '15%',
              height: '2.5%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* CPT */}
          <input
            name="cpt"
            placeholder="CPT"
            value={form.cpt}
            onChange={handleChange}
            className="absolute text-center border border-gray-400 rounded bg-white/85 text-[10px] text-gray-900 focus:ring-1 focus:ring-blue-400"
            style={{
              top: '20.5%',
              left: '40.5%',
              width: '4%',
              height: '2%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* CO */}
          <input
            name="co"
            placeholder="CO"
            value={form.co}
            onChange={handleChange}
            className="absolute text-center border border-gray-400 rounded bg-white/85 text-[10px] text-gray-900 focus:ring-1 focus:ring-blue-400"
            style={{
              top: '20.5%',
              left: '49%',
              width: '3%',
              height: '2%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Buttons */}
          <div className="absolute bottom-[4%] left-0 w-full flex justify-between px-[5%]">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-md shadow-md text-sm"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-md text-sm"
            >
              {loading ? 'Submitting...' : 'Submit Excusal'}
            </button>
          </div>
        </form>
      </div>

      {/* Event Selection Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl">
            {!selectedEventType ? (
              <>
                <h2 className="text-2xl font-bold text-blue-700 mb-6">Select Event Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setSelectedEventType('LLAB')}
                    className="p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg shadow-md transition-all"
                  >
                    LLAB
                  </button>
                  <button
                    onClick={() => setSelectedEventType('PT')}
                    className="p-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg shadow-md transition-all"
                  >
                    PT
                  </button>
                  <button
                    onClick={() => setSelectedEventType('Other')}
                    className="p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg shadow-md transition-all"
                  >
                    Other
                  </button>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="mt-6 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg w-full"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue-700">
                    Select {selectedEventType} Date
                  </h2>
                  <button
                    onClick={() => setSelectedEventType(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {events
                    .filter((ev) => ev.type === selectedEventType)
                    .map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => handleEventSelect(ev.id, `${ev.type} - ${ev.start_date}`)}
                        className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg text-left transition-all"
                      >
                        <div className="font-semibold text-gray-900">{ev.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </button>
                    ))}
                  {events.filter((ev) => ev.type === selectedEventType).length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No {selectedEventType} events available
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedEventType(null);
                    setShowEventModal(false);
                  }}
                  className="mt-6 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg w-full"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExcusalOverlayForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading form...</div>
      </div>
    }>
      <ExcusalFormContent />
    </Suspense>
  );
}
