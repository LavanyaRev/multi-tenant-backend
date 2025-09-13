'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState('acme');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark/light mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('bg-gray-900', 'text-white');
      document.body.classList.remove('bg-gray-50', 'text-gray-900');
    } else {
      document.body.classList.remove('bg-gray-900', 'text-white');
      document.body.classList.add('bg-gray-50', 'text-gray-900');
    }
  }, [darkMode]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenantSlug: tenant }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Internal error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div
        className={`w-full max-w-md rounded-2xl shadow-lg p-8 space-y-6 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center">
            Create Your Account
          </h1>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
            }`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
            }`}
          >
            <option value="acme">Acme</option>
            <option value="globex">Globex</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transition-colors shadow"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-blue-500 hover:underline dark:text-blue-400"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
