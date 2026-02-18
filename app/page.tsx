'use client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
      {/* Container */}
      <div className="bg-white shadow-lg rounded-3xl p-10 w-[90%] max-w-md text-center border border-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">
          Welcome to the Excusal Portal
        </h1>
        <p className="mb-8 text-gray-600">
          Please select your role to continue
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-5">
          <button
            onClick={() => router.push('/cadet-auth')}
            className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            I&apos;m a Cadet
          </button>

          <button
            onClick={() => router.push('/staff-password')}
            className="w-full py-3 text-lg font-semibold text-blue-700 bg-white border-2 border-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            I&apos;m Battalion Staff
          </button>
        </div>
      </div>
    </div>
  );
}
