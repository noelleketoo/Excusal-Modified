'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Mode = 'login' | 'signup' | 'forgot';

export default function CadetAuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const inputClass =
    'w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-900';

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const userEmail = data.user?.email ?? '';
    const { data: cadet } = await supabase
      .from('cadets')
      .select('name')
      .ilike('email', userEmail)
      .maybeSingle();

    if (!cadet) {
      setErrorMsg('Your email is not registered as a cadet. Contact your cadre.');
      setLoading(false);
      return;
    }

    router.push(`/excusal?name=${encodeURIComponent(cadet.name)}`);
  }

  async function handleSignup(e: React.FormEvent) {
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

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setSuccessMsg('Check your email to confirm your account, then sign in.');
    setLoading(false);
    setPassword('');
    setConfirmPassword('');
    setMode('login');
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSuccessMsg("If that email is registered, you'll receive a reset link shortly.");
    setLoading(false);
  }

  const titles: Record<Mode, string> = {
    login: 'Cadet Login',
    signup: 'Create Account',
    forgot: 'Reset Password',
  };

  const subtitles: Record<Mode, string> = {
    login: 'Sign in to submit an excusal',
    signup: 'Use your ROTC email to register',
    forgot: "Enter your email and we'll send a reset link",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-3xl p-10 w-[90%] max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold text-blue-700 mb-1 text-center">{titles[mode]}</h1>
        <p className="text-gray-500 text-sm text-center mb-6">{subtitles[mode]}</p>

        {errorMsg && (
          <p className="text-red-500 text-sm text-center mb-4">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="text-green-600 text-sm text-center mb-4">{successMsg}</p>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="flex flex-col items-center gap-1 mt-1 text-sm">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-blue-600 hover:underline"
              >
                Don&apos;t have an account? Create one
              </button>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-gray-500 hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Confirm Password"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <div className="flex justify-center mt-1 text-sm">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-600 hover:underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="flex justify-center mt-1 text-sm">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-gray-500 hover:underline"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
