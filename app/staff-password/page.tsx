'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const CORRECT_PASSWORD = 'noelleketo';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === CORRECT_PASSWORD) {
      router.push('/staff-dashboard');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-lg rounded-3xl p-10 w-[90%] max-w-md text-center border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Staff Access</h1>
        <p className="text-gray-600 mb-8">
          Enter the staff password to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-xl px-4 py-2 text-center text-gray-600 placeholder-gray-200 focus:ring-2 focus:ring-blue-400 outline-none"
          />


          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 mt-2 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Continue
          </button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="mt-6 text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
