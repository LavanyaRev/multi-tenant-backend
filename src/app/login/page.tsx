'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Persist dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) setDarkMode(savedMode === 'true');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('bg-gray-900', darkMode);
    document.body.classList.toggle('bg-gray-50', !darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) setError(data.error || 'Login failed');
      else {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      }
    } catch {
      setError('Internal error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors duration-300';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl space-y-6 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:opacity-80 transition"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className={`${inputClass} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={`${inputClass} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow hover:from-green-600 hover:to-blue-600 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 dark:text-gray-300">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
