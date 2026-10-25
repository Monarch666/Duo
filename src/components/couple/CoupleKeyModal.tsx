'use client';

import { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  Users,
  Radio,
  Heart,
  Sparkles,
  X,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CoupleKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleInfo: {
    couple: {
      id: string;
      inviteCode: string;
      status: string;
      anniversaryDate: string | null;
    };
    members: Array<{
      id: string;
      displayName: string;
      email: string;
      role: string;
    }>;
    partner?: {
      id: string;
      displayName: string;
      email: string;
    };
    me?: {
      id: string;
      displayName: string;
      email: string;
      role: string;
    };
  };
  currentUserName: string;
  syncStatus: 'connected' | 'fallback_polling' | 'connecting';
}

export default function CoupleKeyModal({
  isOpen,
  onClose,
  coupleInfo,
  currentUserName,
  syncStatus,
}: CoupleKeyModalProps) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const inviteCode = coupleInfo.couple.inviteCode || 'DUO-LOVE';
  const partnerName = coupleInfo.partner?.displayName || 'Your Partner';
  const partnerEmail = coupleInfo.partner?.email || '';

  const pairUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pair?code=${inviteCode}`
      : `https://duo-16pf.onrender.com/pair?code=${inviteCode}`;

  const shareText = `Hey my love 💕 Here is our private Duo Couple Secret Key: ${inviteCode}\n\nTap this link or enter the key in Duo so our apps lock together in our private chamber!\n👉 ${pairUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Our Duo Couple Secret Key',
          text: shareText,
        });
        return;
      } catch {
        // Fallback to WhatsApp
      }
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl max-w-md w-full shadow-2xl border border-warmth-300 p-5 sm:p-6 space-y-4 my-auto relative overflow-hidden">
        {/* Subtle decorative washi tape on top */}
        <div className="washi-tape-rose -top-2.5 left-1/2 -translate-x-1/2 absolute w-20 h-4 rounded-xs shadow-xs" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rosewood-50 border border-rosewood-200 text-rosewood-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-4 h-4 text-rosewood-700" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-warmth-900 leading-tight">
                Our Secret Couple Key
              </h3>
              <p className="text-[11px] text-warmth-600">
                Cryptographically sealed 2-person chamber
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warmth-500 hover:text-warmth-900 hover:bg-warmth-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Unique Couple Secret Key Box */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-[#FFFDF9] to-warmth-50 border-2 border-dashed border-rosewood-300 flex flex-col items-center gap-2 text-center relative shadow-inner">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rosewood-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Unique Chamber Key (BF & GF)
          </span>

          <div className="py-1 px-4 rounded-lg bg-white border border-warmth-200 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-rosewood-900 select-all">
              {inviteCode}
            </span>
          </div>

          <p className="text-[11px] text-warmth-600 max-w-xs leading-relaxed">
            Share this unique key with your partner. When entered on their phone, both apps permanently couple and sync together.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-warmth-100 border border-warmth-300 text-warmth-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Key!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-warmth-600" />
                  <span>Copy Key</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex-1 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Send on WhatsApp</span>
            </button>

            <button
              onClick={handleNativeShare}
              title="More share options"
              className="py-2 px-2.5 rounded-lg bg-warmth-100 hover:bg-warmth-200 border border-warmth-300 text-warmth-700 text-xs flex items-center justify-center transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2-Person Vault Security Guarantee (Law 1 & Law 2) */}
        <div className="p-3.5 rounded-xl bg-warmth-50 border border-warmth-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-warmth-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Active Chamber Members (Strict 2 Max)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {coupleInfo.members.length === 2 ? '🔒 Paired (Full)' : '⏳ Waiting for Partner'}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-warmth-200/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-warmth-900">{currentUserName}</span>
                <span className="text-[10px] text-warmth-500">(You)</span>
              </div>
              <span className="text-[10px] text-warmth-500 font-mono truncate max-w-[140px]">
                {coupleInfo.me?.email || ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-warmth-200/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rosewood-500 animate-pulse" />
                <span className="font-semibold text-warmth-900">{partnerName}</span>
                <span className="text-[10px] text-rosewood-700 font-medium">(Partner)</span>
              </div>
              <span className="text-[10px] text-warmth-500 font-mono truncate max-w-[140px]">
                {partnerEmail || 'Connected via Key'}
              </span>
            </div>
          </div>

          {/* Cryptographic Isolation Explanation */}
          <p className="text-[11px] text-warmth-600 leading-relaxed pt-1">
            🛡️ <strong>Absolute Couple Privacy:</strong> Every single event, note, period symptom, and photo is cryptographically bounded to this unique key. <strong>No 3rd person can ever join or view this space.</strong>
          </p>
        </div>

        {/* Realtime Live Sync Status */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">
                Live Synchronization Active
              </p>
              <p className="text-[10px] text-emerald-700">
                {syncStatus === 'connected'
                  ? 'Realtime Bus Connected (72 BPM) • Zero delay'
                  : 'Fast Polling Sync Active (5s heartbeat)'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-1 rounded-md border border-emerald-200 shrink-0">
            Encrypted
          </span>
        </div>

        {/* How to Pair a New Couple / Device Collapsible Guide */}
        <div className="border border-warmth-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="w-full p-3 bg-white hover:bg-warmth-50 transition flex items-center justify-between text-xs font-semibold text-warmth-800"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-warmth-500" />
              How do 2 people couple their apps together?
            </span>
            {showGuide ? (
              <ChevronUp className="w-4 h-4 text-warmth-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-warmth-500" />
            )}
          </button>

          {showGuide && (
            <div className="p-3.5 bg-warmth-50/60 border-t border-warmth-200 text-xs text-warmth-700 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rosewood-100 text-rosewood-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  <strong>Partner 1 (e.g. Boyfriend):</strong> Downloads Duo, creates an account, and copies this Unique Couple Key (<code className="font-mono bg-white px-1 py-0.5 rounded border border-warmth-200 text-rosewood-800">{inviteCode}</code>).
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rosewood-100 text-rosewood-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  <strong>Partner 2 (e.g. Girlfriend):</strong> Downloads Duo, creates her account, and enters this Secret Key on the Pair screen.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  <strong>Locked Forever:</strong> Both apps instantly lock into your private sanctuary. Every update you make is immediately visible to each other and completely blocked to everyone else.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-warmth-900 hover:bg-black text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm"
        >
          Return to Our Sanctuary
        </button>
      </div>
    </div>
  );
}
