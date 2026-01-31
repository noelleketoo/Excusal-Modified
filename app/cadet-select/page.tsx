'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CadetSelectPage() {
  const [cadets, setCadets] = useState<{ id: string; name: string; email: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCadet, setSelectedCadet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch cadets from database
  useEffect(() => {
    async function loadCadets() {
      const { data, error } = await supabase
        .from('cadets')
        .select('id, name, email')
        .order('name');

      if (error) {
        console.error('Error loading cadets:', error);
        alert('Error loading cadet list. Please try again.');
      } else {
        setCadets(data || []);
      }
      setLoading(false);
    }
    loadCadets();
  }, []);

  // Filter cadets based on search term
  const filteredCadets = cadets.filter((cadet) =>
    cadet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCadet) {
      alert('Please select a cadet from the list.');
      return;
    }

    // Navigate to excusal form with cadet name as URL parameter
    router.push(`/excusal?name=${encodeURIComponent(selectedCadet)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-3xl p-8 w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-bold text-blue-700 mb-2 text-center">
          Select Your Name
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Search for and select your name to continue
        </p>

        <form onSubmit={handleSubmit}>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 mb-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-900"
          />

          {/* Cadet List */}
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading cadets...</div>
          ) : (
            <div className="border-2 border-gray-300 rounded-lg mb-6 max-h-96 overflow-y-auto">
              {filteredCadets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No cadets found matching your search.' : 'No cadets in the roster.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredCadets.map((cadet) => (
                    <label
                      key={cadet.id}
                      className={`flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedCadet === cadet.name ? 'bg-blue-100' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="cadet"
                        value={cadet.name}
                        checked={selectedCadet === cadet.name}
                        onChange={(e) => setSelectedCadet(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="ml-3 text-gray-900 font-medium">
                        {cadet.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-3 text-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all duration-200 shadow-sm"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!selectedCadet}
              className={`flex-1 py-3 text-lg font-semibold text-white rounded-xl transition-all duration-200 shadow-md ${
                selectedCadet
                  ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
