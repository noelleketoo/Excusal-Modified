'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type PageState = 'waiting' | 'ready' | 'done';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pageState, setPageState] = useState<PageState>('waiting');
  const router = useRouter();

  const inputClass =
    'w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-900';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
      }
    });

    const timeout = setTimeout(() => {
      setPageState((current) => {
        if (current === 'waiting') {
          setErrorMsg('This reset link is invalid or has expired. Please request a new one.');
          return 'ready';
        }
        return current;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setPageState('done');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-3xl p-10 w-[90%] max-w-md border border-gray-200 text-center">

        {/* WAITING */}
        {pageState === 'waiting' && (
          <>
            <h1 className="text-2xl font-bold text-blue-700 mb-3">Verifying Reset Link...</h1>
            <p className="text-gray-500 text-sm mb-6">Please wait while we verify your reset link.</p>
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </>
        )}

        {/* READY (set new password form) */}
        {pageState === 'ready' && (
          <>
            {errorMsg && !password ? (
              // Link was expired/invalid
              <>
                <h1 className="text-2xl font-bold text-blue-700 mb-3">Link Expired</h1>
                <p className="text-red-500 text-sm mb-6">{errorMsg}</p>
                <button
                  onClick={() => router.push('/cadet-auth')}
                  className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md"
                >
                  Request New Reset Link
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-blue-700 mb-1">Set New Password</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your new password below</p>
                {errorMsg && (
                  <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
                )}
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 text-left">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md disabled:opacity-60"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {/* DONE */}
        {pageState === 'done' && (
          <>
            <h1 className="text-2xl font-bold text-blue-700 mb-3">Password Updated!</h1>
            <p className="text-gray-500 text-sm mb-6">Your password has been successfully changed.</p>
            <button
              onClick={() => router.push('/cadet-auth')}
              className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md"
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
