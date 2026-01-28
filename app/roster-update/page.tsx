'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RosterUpdatePage() {
  const [cadets, setCadets] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Fetch roster from Supabase
  useEffect(() => {
    async function loadRoster() {
      const { data, error } = await supabase
        .from('cadets')
        .select('*')
        .order('name');
      if (error) console.error(error);
      else setCadets(data || []);
    }
    loadRoster();
  }, []);

  // Add new cadet
  async function handleAddCadet(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return alert('Please fill out both fields.');

    setLoading(true);
    const { error } = await supabase.from('cadets').insert([{ name, email }]);
    setLoading(false);

    if (error) alert('Error adding cadet: ' + error.message);
    else {
      setCadets([...cadets, { name, email }]);
      setName('');
      setEmail('');
    }
  }

  // Delete cadet
  async function handleDeleteCadet(id: string) {
    const confirmDelete = confirm('Are you sure you want to remove this cadet?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('cadets').delete().eq('id', id);
    if (error) alert('Error deleting cadet: ' + error.message);
    else setCadets(cadets.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">Update Roster</h1>
        <button
          onClick={() => router.push('/staff-dashboard')}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Add Form */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Add a Cadet</h2>
        <form
          onSubmit={handleAddCadet}
          className="flex flex-col md:flex-row gap-3 mb-8"
        >
          <input
            type="text"
            placeholder="Cadet Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="email"
            placeholder="Cadet Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="text"
            placeholder="Search cadets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>

        {/* Roster Table */}
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Current Roster
        </h2>
        {cadets.length === 0 ? (
          <p className="text-gray-600 italic">No cadets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 bg-white rounded-lg shadow-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cadets
                  .filter((cadet) =>
                    cadet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cadet.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((cadet) => (
                  <tr
                    key={cadet.id}
                    className="border-t hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-4">{cadet.name}</td>
                    <td className="py-3 px-4">{cadet.email}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteCadet(cadet.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
