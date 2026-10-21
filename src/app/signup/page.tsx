'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpAction } from '@/lib/actions/auth';
import { Heart, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await signUpAction({ displayName, email, password });
      if (res.success) {
        router.push('/pair');
        router.refresh();
      } else {
        setError(res.error || 'Failed to create account.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 bg-warmth-100 text-warmth-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rosewood-700 text-white mb-3 shadow-sm">
          <Heart className="w-6 h-6 fill-white" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-warmth-900 tracking-tight">
          Create an Account
        </h1>
        <p className="mt-1 text-xs text-warmth-600">
          Sign up to link with your partner
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 rounded-xl sm:px-8 border border-warmth-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rosewood-700 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rosewood-900">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
                />
              </div>
              {fieldErrors.displayName && (
                <p className="mt-1 text-xs text-rosewood-700">{fieldErrors.displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                Email address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rosewood-700">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                Password (min 8 characters)
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rosewood-700">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-[0.98] transition shadow-sm disabled:opacity-50 mt-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-warmth-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-rosewood-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
