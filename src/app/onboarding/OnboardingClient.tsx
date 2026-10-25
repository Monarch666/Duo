'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingAction } from '@/lib/actions/onboarding';
import {
  Heart,
  Calendar,
  Sparkles,
  Compass,
  Utensils,
  Coffee,
  Mail,
  Check,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface OnboardingClientProps {
  userName: string;
  isPaired: boolean;
  existingAnniversary?: string | null;
}

const LOVE_LANGUAGES = [
  {
    id: 'Quality Time',
    title: 'Quality Time',
    desc: 'Uninterrupted long talks, device-free walks, and focused shared moments.',
    icon: Clock,
  },
  {
    id: 'Physical Touch',
    title: 'Physical Touch',
    desc: 'Long tight hugs, holding hands, sitting close, and comforting physical closeness.',
    icon: Heart,
  },
  {
    id: 'Words of Affirmation',
    title: 'Words of Affirmation',
    desc: 'Unexpected sweet notes, genuine compliments, and saying "I appreciate you".',
    icon: Mail,
  },
  {
    id: 'Acts of Service',
    title: 'Acts of Service',
    desc: 'Brewing morning coffee, running a helpful errand, and lightening the daily load.',
    icon: Coffee,
  },
  {
    id: 'Receiving Gifts',
    title: 'Receiving Gifts',
    desc: 'Thoughtful keepsakes, spontaneous treats, and meaningful tokens of affection.',
    icon: Sparkles,
  },
];

const SUGGESTED_DATES = [
  'Candlelight Italian dinner & vintage wine',
  'Stargazing picnic in the park with hot cider',
  'Pottery or acrylic painting workshop together',
  'Cozy weekend cabin getaway with a fireplace',
  'Sunday morning fluffy pancake breakfast in bed',
  'Late night spontaneous drive with our favorite playlist',
];

const COMFORT_FOOD_CHIPS = [
  'Woodfired Neapolitan pizza',
  'Warm chocolate chip cookies & milk',
  'Truffle mushroom pasta',
  'Iced vanilla matcha latte',
  'Comforting hot ramen with soft-boiled egg',
  'Pistachio gelato',
];

const BUCKET_LIST_CHIPS = [
  'See the Northern Lights from a glass igloo',
  'Road trip along the Amalfi Coast in a vintage car',
  'Adopt and raise a sweet rescue puppy together',
  'Learn how to make handmade pasta from an Italian nonna',
  'Hot air balloon ride at sunrise in Cappadocia',
];

export default function OnboardingClient({
  userName,
  isPaired,
  existingAnniversary,
}: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Step 1: Foundation
  const [anniversaryDate, setAnniversaryDate] = useState(existingAnniversary || '');
  const [meetPlace, setMeetPlace] = useState('');

  // Step 2: Love Map
  const [loveLanguage, setLoveLanguage] = useState('Quality Time');
  const [comfortFood, setComfortFood] = useState('');
  const [comfortCheerUp, setComfortCheerUp] = useState('');

  // Step 3: Shared Adventures
  const [selectedDates, setSelectedDates] = useState<string[]>([
    'Candlelight Italian dinner & vintage wine',
    'Stargazing picnic in the park with hot cider',
  ]);
  const [customDateInput, setCustomDateInput] = useState('');
  const [bucketListDream, setBucketListDream] = useState('');

  // Step 4: Next Date Night
  const [nextDateTitle, setNextDateTitle] = useState('Our First Sanctuary Date');
  const [nextDateStartAt, setNextDateStartAt] = useState('');
  const [nextDateCategory, setNextDateCategory] = useState<'date_night' | 'trip' | 'anniversary'>('date_night');

  // Step 5: Sealed Love Note
  const [welcomeNote, setWelcomeNote] = useState(
    'Welcome to our private little sanctuary. Here is to all the quiet moments, late-night talks, and adventures yet to come.'
  );
  const [welcomeNoteStyle, setWelcomeNoteStyle] = useState<'butter' | 'rose' | 'sage' | 'classic'>('butter');
  const [welcomeNoteSignOff, setWelcomeNoteSignOff] = useState('With all my heart,');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const toggleDate = (dateText: string) => {
    if (selectedDates.includes(dateText)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateText));
    } else {
      setSelectedDates([...selectedDates, dateText]);
    }
  };

  const addCustomDate = () => {
    if (customDateInput.trim() && !selectedDates.includes(customDateInput.trim())) {
      setSelectedDates([...selectedDates, customDateInput.trim()]);
      setCustomDateInput('');
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 2) {
      if (!comfortFood.trim()) {
        setError('Please share your favorite comfort food or treat.');
        return;
      }
    }
    if (step === 3) {
      if (selectedDates.length === 0) {
        setError('Please select or add at least one date idea.');
        return;
      }
      if (!bucketListDream.trim()) {
        setError('Please share one bucket list dream.');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        anniversaryDate: anniversaryDate || undefined,
        meetPlace: meetPlace.trim() || undefined,
        loveLanguage,
        comfortFood: comfortFood.trim() || 'Cozy home-cooked meal',
        comfortCheerUp: comfortCheerUp.trim() || undefined,
        dreamDates: selectedDates,
        bucketListDream: bucketListDream.trim() || 'Travel the world together',
        nextDateTitle: nextDateTitle.trim() || undefined,
        nextDateStartAt: nextDateStartAt || undefined,
        nextDateCategory,
        welcomeNote: welcomeNote.trim() || undefined,
        welcomeNoteStyle,
        welcomeNoteSignOff: welcomeNoteSignOff.trim() || 'Forever yours,',
      };

      const res = await submitOnboardingAction(payload);
      if (res.success) {
        setIsCompleted(true);
      } else {
        setError(res.error || 'Failed to complete setup.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterSanctuary = () => {
    if (isPaired) {
      router.push('/');
    } else {
      router.push('/pair');
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-warmth-100 flex flex-col justify-between p-4 sm:p-6 text-warmth-900">
      {/* Header bar */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-4 border-b border-warmth-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-rosewood-200 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs">
            <img
              src="/images/otter-mascot.png"
              alt="Duo Mascot Otters"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-warmth-900 leading-none">
              Duo Love Blueprint
            </h1>
            <p className="text-[11px] text-warmth-600 mt-0.5">
              Personalizing the sanctuary for {userName}
            </p>
          </div>
        </div>

        {!isCompleted && (
          <div className="text-right">
            <span className="text-xs font-serif font-semibold text-warmth-800">
              Step {step} of {totalSteps}
            </span>
            <div className="w-24 h-1.5 bg-warmth-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-rosewood-700 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Form Content */}
      <main className="max-w-2xl w-full mx-auto my-6 flex-1 flex flex-col justify-center">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rosewood-900 font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-rosewood-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================== SUCCESS SCREEN ==================== */}
        {isCompleted ? (
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-warmth-200 shadow-warm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-rosewood-200 p-1 mx-auto shadow-sm overflow-hidden flex items-center justify-center">
              <img
                src="/images/otter-mascot.png"
                alt="Duo Mascot Otters"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-warmth-900">
                Your Sanctuary is Ready
              </h2>
              <p className="text-xs text-warmth-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                Like sea otters holding hands, your shared calendar, dream dates, and love languages are now beautifully woven together.
              </p>
            </div>

            {/* Blueprint Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-warmth-50/70 border border-warmth-200/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warmth-500 block mb-1">
                  💖 Love Language
                </span>
                <p className="text-xs font-semibold text-warmth-900">{loveLanguage}</p>
                <p className="text-[11px] text-warmth-600 mt-0.5 truncate">Craves: {comfortFood || 'Cozy treats'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-warmth-50/70 border border-warmth-200/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warmth-500 block mb-1">
                  📜 Bucket List
                </span>
                <p className="text-xs font-semibold text-warmth-900">{selectedDates.length} Dream Dates Saved</p>
                <p className="text-[11px] text-warmth-600 mt-0.5 truncate">{bucketListDream || 'Worldwide adventures'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-warmth-50/70 border border-warmth-200/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warmth-500 block mb-1">
                  📅 First Calendar Date
                </span>
                <p className="text-xs font-semibold text-warmth-900">{nextDateTitle || 'Sanctuary Date'}</p>
                <p className="text-[11px] text-warmth-600 mt-0.5">
                  {nextDateStartAt ? new Date(nextDateStartAt).toLocaleDateString() : 'Scheduled'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-warmth-50/70 border border-warmth-200/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warmth-500 block mb-1">
                  💌 Sealed Love Note
                </span>
                <p className="text-xs font-semibold text-warmth-900">Waiting for Partner</p>
                <p className="text-[11px] text-warmth-600 mt-0.5">Wax-sealed on {welcomeNoteStyle} stationery</p>
              </div>
            </div>

            <button
              onClick={handleEnterSanctuary}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl text-sm font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition active:scale-[0.98] shadow-sm"
            >
              <span>{isPaired ? 'Enter Your Shared Sanctuary' : 'View Couple Space & Invite Partner'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ==================== 5-STEP QUESTIONNAIRE ==================== */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-warmth-200 shadow-warm">
            {/* STEP 1: FOUNDATION & ANNIVERSARY */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-warmth-200 pb-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rosewood-700">
                    Step 1 of 5 • Origins
                  </span>
                  <h2 className="text-xl font-serif font-bold text-warmth-900 mt-1">
                    When did your journey begin?
                  </h2>
                  <p className="text-xs text-warmth-600 mt-0.5">
                    This sets your couple anniversary countdown and marks your yearly milestone celebration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
                    Anniversary / Relationship Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={anniversaryDate}
                      onChange={(e) => setAnniversaryDate(e.target.value)}
                      className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                    />
                  </div>
                  {anniversaryDate && (
                    <p className="text-[11px] text-rosewood-700 font-serif mt-1">
                      ✨ We will honor this milestone every year on {new Date(anniversaryDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1">
                    Where did you first meet or fall in love? <span className="text-warmth-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={meetPlace}
                      onChange={(e) => setMeetPlace(e.target.value)}
                      placeholder="e.g. Under the city clocktower, rooftop cafe downtown, university library"
                      className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                    />
                  </div>
                  <p className="text-[11px] text-warmth-500 mt-1">
                    We’ll preserve this as your first memory polaroid on the timeline.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: LOVE MAP & PREFERENCES */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-warmth-200 pb-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rosewood-700">
                    Step 2 of 5 • Love Map
                  </span>
                  <h2 className="text-xl font-serif font-bold text-warmth-900 mt-1">
                    How do you feel most loved?
                  </h2>
                  <p className="text-xs text-warmth-600 mt-0.5">
                    Your partner will have access to your personal care guide whenever they want to spoil or comfort you.
                  </p>
                </div>

                {/* Love Language Cards */}
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-2">
                    Select Your Primary Love Language
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LOVE_LANGUAGES.map((lang) => {
                      const Icon = lang.icon;
                      const isSelected = loveLanguage === lang.id;
                      return (
                        <div
                          key={lang.id}
                          onClick={() => setLoveLanguage(lang.id)}
                          className={`cursor-pointer p-3 rounded-xl border transition text-left flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-rosewood-600 bg-rosewood-50/60 shadow-sm'
                              : 'border-warmth-200 bg-warmth-50/30 hover:border-warmth-300 hover:bg-warmth-50'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-rosewood-700 text-white'
                                : 'bg-warmth-200 text-warmth-700'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-warmth-900">{lang.title}</p>
                            <p className="text-[11px] text-warmth-600 mt-0.5 leading-snug">
                              {lang.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comfort Food */}
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1">
                    Your Comfort Food or Craving after a rough day
                  </label>
                  <input
                    type="text"
                    required
                    value={comfortFood}
                    onChange={(e) => setComfortFood(e.target.value)}
                    placeholder="e.g. Truffle mushroom pizza & cold brew"
                    className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {COMFORT_FOOD_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setComfortFood(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-warmth-100 hover:bg-warmth-200 text-warmth-800 border border-warmth-200 transition"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cheer up note */}
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1">
                    What is the best way for your partner to comfort you when stressed? <span className="text-warmth-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={comfortCheerUp}
                    onChange={(e) => setComfortCheerUp(e.target.value)}
                    placeholder="e.g. A 5-minute silent hug and putting on our favorite sitcom"
                    className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: ADVENTURES & BUCKET LIST */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-warmth-200 pb-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rosewood-700">
                    Step 3 of 5 • Shared Lists
                  </span>
                  <h2 className="text-xl font-serif font-bold text-warmth-900 mt-1">
                    What adventures shall we plan?
                  </h2>
                  <p className="text-xs text-warmth-600 mt-0.5">
                    Select date ideas you want to experience together. These will populate your interactive shared lists!
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-2">
                    Pick Dream Date Nights (Tap to toggle)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED_DATES.map((dateItem) => {
                      const isChecked = selectedDates.includes(dateItem);
                      return (
                        <div
                          key={dateItem}
                          onClick={() => toggleDate(dateItem)}
                          className={`cursor-pointer p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                            isChecked
                              ? 'border-rosewood-600 bg-rosewood-50/70 font-semibold text-rosewood-900'
                              : 'border-warmth-200 bg-warmth-50/30 text-warmth-800 hover:bg-warmth-50'
                          }`}
                        >
                          <span className="leading-snug pr-2">{dateItem}</span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isChecked
                                ? 'bg-rosewood-700 border-rosewood-700 text-white'
                                : 'border-warmth-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add custom date */}
                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      value={customDateInput}
                      onChange={(e) => setCustomDateInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDate())}
                      placeholder="Or type a custom dream date..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                    />
                    <button
                      type="button"
                      onClick={addCustomDate}
                      className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-warmth-200 hover:bg-warmth-300 text-warmth-900 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Big Bucket List Dream */}
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1">
                    One Big Shared Bucket List Dream
                  </label>
                  <input
                    type="text"
                    required
                    value={bucketListDream}
                    onChange={(e) => setBucketListDream(e.target.value)}
                    placeholder="e.g. See the Northern Lights from a glass igloo"
                    className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {BUCKET_LIST_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setBucketListDream(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-warmth-100 hover:bg-warmth-200 text-warmth-800 border border-warmth-200 transition"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: NEXT DATE NIGHT (CALENDAR) */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-warmth-200 pb-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rosewood-700">
                    Step 4 of 5 • Shared Calendar
                  </span>
                  <h2 className="text-xl font-serif font-bold text-warmth-900 mt-1">
                    Schedule your next special date
                  </h2>
                  <p className="text-xs text-warmth-600 mt-0.5">
                    Put an upcoming moment on the shared calendar so you both have something wonderful to look forward to.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1">
                    Date Title
                  </label>
                  <input
                    type="text"
                    value={nextDateTitle}
                    onChange={(e) => setNextDateTitle(e.target.value)}
                    placeholder="e.g. Candlelight Pasta Dinner"
                    className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-warmth-800 mb-1">
                      When? (Date & Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={nextDateStartAt}
                      onChange={(e) => setNextDateStartAt(e.target.value)}
                      className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-warmth-800 mb-1">
                      Category
                    </label>
                    <select
                      value={nextDateCategory}
                      onChange={(e) => setNextDateCategory(e.target.value as any)}
                      className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400"
                    >
                      <option value="date_night">🍷 Romantic Date Night</option>
                      <option value="trip">🏕️ Weekend Trip / Getaway</option>
                      <option value="anniversary">💍 Anniversary / Celebration</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-warmth-500">
                  Tip: You can always add, edit, or color-code more dates later inside the Calendar tab.
                </p>
              </div>
            )}

            {/* STEP 5: FIRST LOVE NOTE */}
            {step === 5 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-warmth-200 pb-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rosewood-700">
                    Step 5 of 5 • Love Capsule
                  </span>
                  <h2 className="text-xl font-serif font-bold text-warmth-900 mt-1">
                    Leave your partner a sealed welcome note
                  </h2>
                  <p className="text-xs text-warmth-600 mt-0.5">
                    This heartfelt note will be sealed with a digital wax seal, waiting for them on the Love Notes desk.
                  </p>
                </div>

                {/* Paper style selector */}
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
                    Stationery Texture
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'butter', label: 'Butter Ivory', color: 'bg-[#FCF9EE] border-warmth-300' },
                      { id: 'rose', label: 'Blush Rose', color: 'bg-[#FFE8E8] border-rose-200' },
                      { id: 'sage', label: 'Soft Sage', color: 'bg-[#EAF2EC] border-emerald-200' },
                      { id: 'classic', label: 'Parchment', color: 'bg-[#FAF6EF] border-warmth-300' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setWelcomeNoteStyle(item.id as any)}
                        className={`p-2 rounded-lg border text-[11px] font-medium text-center transition ${item.color} ${
                          welcomeNoteStyle === item.id ? 'ring-2 ring-rosewood-700 shadow-sm font-bold' : ''
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note content */}
                <div className="p-4 rounded-xl border border-warmth-300 shadow-sm relative bg-[#FCF9EE]">
                  <textarea
                    rows={4}
                    value={welcomeNote}
                    onChange={(e) => setWelcomeNote(e.target.value)}
                    placeholder="Write a sweet message for your partner to find..."
                    className="w-full bg-transparent border-none text-xs leading-relaxed text-warmth-900 placeholder-warmth-400 focus:outline-none resize-none font-serif italic"
                  />
                  <div className="mt-2 pt-2 border-t border-warmth-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-warmth-500 font-sans">Sign-off:</span>
                    <input
                      type="text"
                      value={welcomeNoteSignOff}
                      onChange={(e) => setWelcomeNoteSignOff(e.target.value)}
                      placeholder="Forever yours,"
                      className="text-right text-xs bg-transparent border-none text-warmth-800 font-serif italic focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-6 pt-4 border-t border-warmth-200 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="inline-flex items-center gap-1 py-2 px-3.5 rounded-lg text-xs font-semibold text-warmth-700 hover:text-warmth-900 hover:bg-warmth-100 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition active:scale-[0.98] shadow-sm ml-auto"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 py-2 px-5 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition active:scale-[0.98] shadow-sm disabled:opacity-50 ml-auto"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete & Seal Sanctuary</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center py-2 text-[11px] text-warmth-500">
        Duo • Private sanctuary exclusively for two
      </footer>
    </div>
  );
}
