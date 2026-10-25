'use client';

import { useState } from 'react';
import {
  Heart,
  Sparkles,
  Flame,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  Coffee,
  Moon,
  Info,
  Smile,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  calculateCycleInfo,
  COMMON_SYMPTOMS,
  QUICK_COMFORT_SIGNALS,
  PhaseInfo,
} from '@/lib/utils/cycle';
import LogCycleModal from './LogCycleModal';
import { sendComfortSignalAction } from '@/lib/actions/cycle';

interface CycleTrackerViewProps {
  user: { id: string; displayName: string };
  partner?: { id: string; displayName: string } | null;
  initialCycle: any | null;
  onCycleUpdated?: (cycle: any) => void;
  showToast?: (msg: string) => void;
}

export default function CycleTrackerView({
  user,
  partner,
  initialCycle,
  onCycleUpdated,
  showToast,
}: CycleTrackerViewProps) {
  const [cycle, setCycle] = useState<any | null>(initialCycle);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendingSignal, setSendingSignal] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<Record<string, boolean>>({});

  // Default to a 28-day cycle starting 3 days ago if not yet logged
  const defaultStartDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const startDate = cycle?.startDate || defaultStartDate;
  const periodLength = cycle?.periodLength || 5;
  const cycleLength = cycle?.cycleLength || 28;

  const cycleInfo: PhaseInfo = calculateCycleInfo(startDate, periodLength, cycleLength);

  let loggedSymptoms: string[] = [];
  try {
    loggedSymptoms = typeof cycle?.symptoms === 'string'
      ? JSON.parse(cycle.symptoms)
      : (cycle?.symptoms || []);
  } catch {
    loggedSymptoms = [];
  }

  const toggleChecklist = (item: string) => {
    setActiveChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSendComfortSignal = async (signal: string) => {
    if (!cycle?.id) {
      if (showToast) showToast('Please log the period cycle first!');
      setIsModalOpen(true);
      return;
    }

    setSendingSignal(true);
    const res = await sendComfortSignalAction(cycle.id, signal);
    setSendingSignal(false);

    if (res.success) {
      if (showToast) showToast(`🌸 Care request sent to ${partner?.displayName || 'your partner'}!`);
      if (res.data && onCycleUpdated) {
        setCycle(res.data);
        onCycleUpdated(res.data);
      }
    } else {
      if (showToast) showToast(res.error || 'Failed to send signal');
    }
  };

  const partnerName = partner?.displayName || 'Your Partner';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-warmth-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-rosewood-50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rosewood-100 border border-rosewood-200 flex items-center justify-center text-rosewood-800 shadow-xs">
              <span className="text-2xl">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-warmth-900 tracking-tight">
                  Cycle Sanctuary & Partner Care
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rosewood-100 text-rosewood-800 border border-rosewood-200">
                  Private for Two
                </span>
              </div>
              <p className="text-xs text-warmth-600 mt-0.5">
                Biological rhythm tracking with gentle, empathetic advice for your partner
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rosewood-700 hover:bg-rosewood-800 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{cycle ? 'Update Cycle & Symptoms' : 'Log First Cycle'}</span>
          </button>
        </div>
      </div>

      {/* Main Cycle Status & Phase Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cycle Phase Indicator */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-warmth-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-warmth-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-warmth-500 uppercase tracking-wider block mb-0.5">
                Current Biological Phase
              </span>
              <h2 className="text-xl font-serif font-bold text-warmth-900">
                {cycleInfo.phaseName}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-2xl font-serif font-bold text-rosewood-700">
                Day {cycleInfo.dayOfCycle}
              </span>
              <span className="text-xs text-warmth-500 block">
                of {cycleInfo.totalCycleDays} days
              </span>
            </div>
          </div>

          {/* Progress Bar of Cycle */}
          <div>
            <div className="flex items-center justify-between text-xs text-warmth-600 mb-2">
              <span className="font-medium">
                {cycleInfo.dayOfCycle <= periodLength ? '🩸 Period active' : 'Next period predicted:'}
              </span>
              <span className="font-semibold text-rosewood-800">
                {cycleInfo.dayOfCycle <= periodLength
                  ? `${periodLength - cycleInfo.dayOfCycle + 1} days remaining`
                  : `In ~${cycleInfo.daysUntilNextPeriod} days (${cycleInfo.nextPeriodDate})`}
              </span>
            </div>

            <div className="w-full h-3 bg-warmth-100 rounded-full overflow-hidden p-0.5 border border-warmth-200">
              <div
                className="h-full bg-gradient-to-r from-rosewood-500 to-rosewood-700 rounded-full transition-all duration-500"
                style={{ width: `${cycleInfo.progressPercent}%` }}
              />
            </div>

            {/* Cycle Phases Pill Map */}
            <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
              {[
                { name: 'Menstrual', range: `Days 1–${periodLength}`, isCurrent: cycleInfo.phase === 'menstrual', color: 'rosewood' },
                { name: 'Follicular', range: `Days ${periodLength + 1}–13`, isCurrent: cycleInfo.phase === 'follicular', color: 'emerald' },
                { name: 'Ovulation', range: 'Days 14–16', isCurrent: cycleInfo.phase === 'ovulation', color: 'amber' },
                { name: 'Luteal', range: `Days 17–${cycleLength}`, isCurrent: cycleInfo.phase === 'luteal', color: 'purple' },
              ].map((p) => (
                <div
                  key={p.name}
                  className={`p-2 rounded-xl text-center border transition ${
                    p.isCurrent
                      ? 'bg-rosewood-50 border-rosewood-300 font-semibold text-rosewood-900 shadow-xs'
                      : 'bg-warmth-50/60 border-warmth-200/70 text-warmth-600'
                  }`}
                >
                  <p className="text-[11px] font-serif">{p.name}</p>
                  <p className="text-[9px] text-warmth-500">{p.range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Biological & Emotional Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-warmth-50 border border-warmth-200/80">
              <h3 className="text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>🧬</span>
                <span>Inside Her Body</span>
              </h3>
              <p className="text-xs text-warmth-700 leading-relaxed">
                {cycleInfo.physicalState}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-warmth-50 border border-warmth-200/80">
              <h3 className="text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>💭</span>
                <span>Emotional Rhythm</span>
              </h3>
              <p className="text-xs text-warmth-700 leading-relaxed">
                {cycleInfo.emotionalState}
              </p>
            </div>
          </div>

          {/* Logged Symptoms & Flow */}
          <div className="pt-2 border-t border-warmth-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-warmth-700">Logged Symptoms:</span>
              {loggedSymptoms.length > 0 ? (
                loggedSymptoms.map((symId) => {
                  const sym = COMMON_SYMPTOMS.find((s) => s.id === symId);
                  return (
                    <span
                      key={symId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-warmth-100 text-warmth-800 border border-warmth-200 font-medium"
                    >
                      <span>{sym?.emoji || '✨'}</span>
                      <span>{sym?.label || symId}</span>
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-warmth-500 italic">No symptoms recorded yet</span>
              )}
            </div>

            {cycle?.flow && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-rosewood-50 text-rosewood-800 border border-rosewood-200 font-semibold">
                Flow: {cycle.flow}
              </span>
            )}
          </div>
        </div>

        {/* Right Col: Instant Comfort Signal Beacon */}
        <div className="bg-white rounded-2xl p-6 border border-warmth-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💌</span>
              <h3 className="text-sm font-serif font-bold text-warmth-900">
                Comfort Signal Beacon
              </h3>
            </div>
            <p className="text-xs text-warmth-600 leading-relaxed">
              Tap any craving or comfort request to alert {partnerName} instantly:
            </p>

            <div className="space-y-2 mt-4">
              {QUICK_COMFORT_SIGNALS.map((sig) => (
                <button
                  key={sig.id}
                  disabled={sendingSignal}
                  onClick={() => handleSendComfortSignal(sig.label)}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl border border-warmth-200 bg-warmth-50/70 hover:bg-rosewood-50 hover:border-rosewood-300 text-warmth-800 transition active:scale-[0.98] group text-xs"
                >
                  <span className="font-medium group-hover:text-rosewood-800 transition">
                    {sig.label}
                  </span>
                  <Send className="w-3.5 h-3.5 text-warmth-400 group-hover:text-rosewood-700 transition" />
                </button>
              ))}
            </div>
          </div>

          {cycle?.comfortRequest && (
            <div className="p-3.5 rounded-xl bg-rosewood-50 border border-rosewood-200/80">
              <span className="text-[10px] font-bold text-rosewood-700 uppercase tracking-wider block mb-1">
                Active Partner Request:
              </span>
              <p className="text-xs font-serif font-semibold text-rosewood-900 italic">
                “{cycle.comfortRequest}”
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🌟 BOYFRIEND'S CARE & ADVICE GUIDE (Play Store Highlight) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-warmth-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative washi tape */}
        <div className="w-24 h-4 bg-rosewood-200/60 rounded-xs mx-auto -mt-6 mb-4 shadow-2xs rotate-1" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warmth-200 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warmth-100 border border-warmth-300 flex items-center justify-center text-warmth-800 shadow-xs">
              <span className="text-xl">🤝</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-rosewood-700 uppercase tracking-wider">
                Gentle Partner Insights
              </span>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-warmth-900">
                Boyfriend’s Care Guide for {partnerName}
              </h2>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-warmth-50 border border-warmth-200 text-xs text-warmth-700 font-medium">
            Today’s Focus: <span className="font-bold text-rosewood-700">{cycleInfo.boyfriendAdvice.headline}</span>
          </div>
        </div>

        {/* Mindset Callout */}
        <div className="mb-6 p-4 rounded-xl bg-rosewood-50/70 border border-rosewood-200 text-left">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rosewood-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-serif font-bold text-rosewood-900">
                How to show up for her today:
              </h4>
              <p className="text-xs text-warmth-800 leading-relaxed mt-1">
                {cycleInfo.boyfriendAdvice.mindset}
              </p>
            </div>
          </div>
        </div>

        {/* Do's and Don'ts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* DO's */}
          <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-left space-y-3">
            <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>✅</span>
              <span>Loving Things to Do (Green Flags)</span>
            </h4>
            <ul className="space-y-2 text-xs text-warmth-800">
              {cycleInfo.boyfriendAdvice.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-700 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DON'Ts */}
          <div className="p-5 rounded-xl bg-rose-50/60 border border-rose-200/80 text-left space-y-3">
            <h4 className="text-xs font-semibold text-rosewood-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>❌</span>
              <span>What to Avoid Today</span>
            </h4>
            <ul className="space-y-2 text-xs text-warmth-800">
              {cycleInfo.boyfriendAdvice.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-rosewood-700 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Interactive Boyfriend Care Checklist */}
        <div className="p-5 rounded-xl bg-warmth-50 border border-warmth-200 text-left space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-warmth-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>🧸</span>
              <span>Boyfriend’s Active Comfort Checklist</span>
            </h4>
            <span className="text-[11px] text-warmth-500">
              Tap to check off loving gestures
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cycleInfo.boyfriendAdvice.comfortKit.map((item, idx) => {
              const checked = !!activeChecklist[item];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleChecklist(item)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs text-left transition ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                      : 'bg-white border-warmth-200 text-warmth-800 hover:bg-warmth-100/70'
                  }`}
                >
                  {checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-warmth-400 shrink-0" />
                  )}
                  <span className={checked ? 'line-through text-warmth-500' : ''}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested Sweet Text Message */}
        <div className="mt-5 p-4 rounded-xl bg-warmth-100/80 border border-warmth-300/80 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-warmth-600 uppercase tracking-wider block mb-0.5">
              Sweet Text to Send Her Right Now:
            </span>
            <p className="text-xs font-serif italic text-warmth-900">
              “{cycleInfo.boyfriendAdvice.sweetMessageSuggestion}”
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(cycleInfo.boyfriendAdvice.sweetMessageSuggestion);
              if (showToast) showToast('Copied sweet text to clipboard! Paste in WhatsApp or chat.');
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-warmth-200 hover:bg-warmth-300 text-warmth-800 text-xs font-semibold transition"
          >
            Copy Sweet Text
          </button>
        </div>
      </div>

      {/* Modal */}
      <LogCycleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        latestCycle={cycle}
        onCycleSaved={(newCycle) => {
          setCycle(newCycle);
          if (onCycleUpdated) onCycleUpdated(newCycle);
          if (showToast) showToast('🌸 Period & cycle rhythm updated!');
        }}
      />
    </div>
  );
}
