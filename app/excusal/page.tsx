'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ExcusalOverlayForm() {
  const [form, setForm] = useState({
    name: '',
    event: '',
    reason: '',
    makeup: '',
    contact: '',
    date: '',
    cpt: '',
    co: '',
  });
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date')
        .order('start_date', { ascending: true });
      if (error) console.error(error);
      else setEvents(data || []);
    };
    fetchEvents();
  }, []);

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

    // Verify event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .ilike('name', form.event.trim())
      .single();

    if (!event || eventError) {
      alert('Error: Event not found.');
      setLoading(false);
      return;
    }

    // Insert excusal
    const { error } = await supabase.from('excusals').insert([
      {
        cadet_id: cadet.id,
        event_id: event.id,
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
    <div className="relative flex justify-center bg-gray-100 min-h-screen py-8">
      <div className="relative w-full max-w-[650px] aspect-[8.5/11]">
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
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-[0.7vw] text-gray-900 focus:ring-2 focus:ring-blue-400"
            style={{
              top: '66%',
              left: '67%',
              width: '12%',
              height: '6%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Event dropdown */}
          <select
            name="event"
            value={form.event}
            onChange={handleChange}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-[0.7vw] text-gray-900 focus:ring-2 focus:ring-blue-400"
            style={{
              top: '38%',
              left: '40%',
              width: '30%',
              height: '2%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <option value="">Select Event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.name}>
                {ev.name}
              </option>
            ))}
          </select>

          {/* Reason */}
          <textarea
            name="reason"
            placeholder="Reason for Excusal"
            value={form.reason}
            onChange={handleChange}
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-[0.7vw] text-gray-900 focus:ring-2 focus:ring-blue-400"
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
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-[0.7vw] text-gray-900 focus:ring-2 focus:ring-blue-400"
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
            className="absolute border border-gray-400 rounded bg-white/85 px-2 text-[0.7vw] text-gray-900 focus:ring-2 focus:ring-blue-400"
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
            className="absolute text-center border border-gray-400 rounded bg-white/85 text-[0.6vw] text-gray-900 focus:ring-1 focus:ring-blue-400"
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
            className="absolute text-center border border-gray-400 rounded bg-white/85 text-[0.6vw] text-gray-900 focus:ring-1 focus:ring-blue-400"
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
            className="absolute text-center border border-gray-400 rounded bg-white/85 text-[0.6vw] text-gray-900 focus:ring-1 focus:ring-blue-400"
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
    </div>
  );
}
