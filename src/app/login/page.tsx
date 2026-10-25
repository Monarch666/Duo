'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logInAction } from '@/lib/actions/auth';
import {
  Heart,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';

interface CoupleQuestion {
  question: string;
  options: { label: string; role: 'gf' | 'bf' | 'both'; note: string }[];
}

const COUPLE_VERIFICATION_QUESTIONS: CoupleQuestion[] = [
  {
    question: 'Who is stepping into the sanctuary today?',
    options: [
      { label: 'The Queen / Girlfriend 👑', role: 'gf', note: 'Prepared to be pampered and loved.' },
      { label: 'The Caring Boyfriend 🌿', role: 'bf', note: 'Ready to care, listen, and support.' },
      { label: 'Both of us together right now! 💕', role: 'both', note: 'Cuddling side-by-side.' },
    ],
  },
  {
    question: 'What is our golden rule of love?',
    options: [
      { label: 'Never go to bed angry ❤️', role: 'both', note: 'Always talk it out gently.' },
      { label: 'Warm hugs and heating pads on tough days ☕', role: 'both', note: 'Care over conflict.' },
      { label: 'Love each other more every single sunrise 🌅', role: 'both', note: 'Forever and always.' },
    ],
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  // Q&A Identity Step State
  const [step, setStep] = useState<'credentials' | 'qna'>('credentials');
  const [selectedRole, setSelectedRole] = useState<'gf' | 'bf' | 'both' | null>(null);
  const [qnaAnswered, setQnaAnswered] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Preload remembered email if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('duo_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, []);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await logInAction({ email, password });
      if (res.success) {
        if (rememberMe) {
          localStorage.setItem('duo_remembered_email', email.trim());
        } else {
          localStorage.removeItem('duo_remembered_email');
        }

        // Move to intimate Q&A step to verify who is logging in!
        setStep('qna');
      } else {
        setError(res.error || 'Failed to log in.');
        if (res.retryAfterSeconds) {
          setRetryAfter(res.retryAfterSeconds);
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQnaComplete = () => {
    if (!selectedRole) {
      setError('Please select who you are to enter your sanctuary.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('duo_active_role', selectedRole);
    }

    setQnaAnswered(true);
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 600);
  };

  const handleDemoLogin = async (demoEmail: string, role: 'gf' | 'bf') => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    setLoading(true);

    try {
      const res = await logInAction({ email: demoEmail, password: 'Password123!' });
      if (res.success) {
        setSelectedRole(role);
        setStep('qna');
      } else {
        setError(res.error || 'Demo login failed.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = COUPLE_VERIFICATION_QUESTIONS[activeQuestionIdx];

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 bg-warmth-100 text-warmth-900 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rosewood-700 text-white mb-3 shadow-md shadow-rosewood-700/20">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warmth-900 tracking-tight">
            Duo Sanctuary
          </h1>
          <p className="mt-1 text-xs text-warmth-600 font-medium">
            An intimate, private sanctuary designed exclusively for two
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-warmth-200/90 shadow-sm relative overflow-hidden">
          {/* Subtle washi tape decoration */}
          <div className="w-20 h-3 bg-rosewood-200/50 rounded-xs mx-auto -mt-8 mb-6 shadow-2xs rotate-1" />

          {/* STEP 1: CREDENTIALS LOGIN */}
          {step === 'credentials' && (
            <div className="space-y-5">
              <div className="text-left border-b border-warmth-100 pb-3">
                <h2 className="text-sm font-serif font-bold text-warmth-900">
                  Sign In to Your Shared Space
                </h2>
                <p className="text-[11px] text-warmth-500">
                  Enter your couple credentials to open your sanctuary
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rosewood-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-rosewood-900 text-left">
                    <p className="font-semibold">{error}</p>
                    {retryAfter && (
                      <p className="mt-0.5 text-xs text-rosewood-700">
                        Safety lockout: retry in {retryAfter}s
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleCredentialSubmit} className="space-y-4 text-left">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-warmth-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-rosewood-400 transition"
                    />
                  </div>
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div>
                  <label className="block text-[11px] font-semibold text-warmth-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-rosewood-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-warmth-400 hover:text-warmth-700 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-warmth-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-rosewood-700 focus:ring-rosewood-400 accent-rosewood-700"
                    />
                    <span className="text-[11px] font-medium">Remember my email</span>
                  </label>

                  <span className="text-[11px] text-warmth-500">2-Partner Encrypted</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-[0.98] transition shadow-sm disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue into Sanctuary</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Redirect */}
              <div className="pt-4 text-center border-t border-warmth-100">
                <p className="text-xs text-warmth-600">
                  New couple?{' '}
                  <Link href="/signup" className="font-semibold text-rosewood-700 hover:underline">
                    Create your shared space
                  </Link>
                </p>
              </div>

              {/* Collapsible Demo Quick Sign-In (For Play Store Reviewers & Quick Tests) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoLogins(!showDemoLogins)}
                  className="w-full flex items-center justify-between py-2 text-[11px] font-medium text-warmth-500 hover:text-warmth-800 transition"
                >
                  <span>App Review / Demo One-Tap Sign In</span>
                  {showDemoLogins ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDemoLogins && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-warmth-100 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('shivani@example.com', 'gf')}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg border border-warmth-200 bg-warmth-50 hover:bg-warmth-100 text-warmth-800 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-rosewood-700" />
                      <span>Shivani (Girlfriend)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('aadarsh@example.com', 'bf')}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg border border-warmth-200 bg-warmth-50 hover:bg-warmth-100 text-warmth-800 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-rosewood-700" />
                      <span>Aadarsh (Boyfriend)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: INTIMATE Q&A PARTNER VERIFICATION */}
          {step === 'qna' && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="text-center pb-2 border-b border-warmth-100">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rosewood-100 text-rosewood-800 mb-1.5">
                  <Sparkles className="w-3 h-3 text-rosewood-600" />
                  Intimate Verification
                </span>
                <h2 className="text-base font-serif font-bold text-warmth-900">
                  {currentQuestion.question}
                </h2>
                <p className="text-[11px] text-warmth-600 mt-0.5">
                  Confirm who is holding the phone so Duo can tailor your experience
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rosewood-800">
                  {error}
                </div>
              )}

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedRole === opt.role;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedRole(opt.role);
                        setError(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-rosewood-50 border-rosewood-400 ring-2 ring-rosewood-300 shadow-sm'
                          : 'bg-warmth-50/60 border-warmth-200 hover:bg-warmth-100/70 text-warmth-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-warmth-900">
                          {opt.label}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-rosewood-700 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-warmth-300 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-warmth-500 mt-1">
                        {opt.note}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleQnaComplete}
                disabled={!selectedRole || qnaAnswered}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-[0.98] transition shadow-sm disabled:opacity-50 mt-2"
              >
                {qnaAnswered ? (
                  <span>Opening Sanctuary... 🌸</span>
                ) : (
                  <>
                    <span>Confirm & Enter Sanctuary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Play Store Trust & Security Guarantee */}
        <div className="mt-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-warmth-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Play Store Certified • 100% Private for Exactly Two</span>
          </div>
          <p className="text-[10px] text-warmth-400 leading-tight">
            Zero third-party trackers. Zero social sharing. Your shared reflections, memories, and cycle logs belong exclusively to the two of you.
          </p>
        </div>
      </div>
    </div>
  );
}
