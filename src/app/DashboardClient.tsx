'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { logOutAction, unlinkCoupleAction } from '@/lib/actions/auth';
import {
  Heart,
  Calendar as CalendarIcon,
  CheckSquare,
  Camera,
  User,
  LogOut,
  Download,
  AlertTriangle,
  Clock,
  MapPin,
  Smile,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Bell,
  LayoutDashboard,
  Coffee,
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Lock,
  MessageCircle,
  Headphones,
  Check,
  Plus,
  Trash2,
  PenLine,
  Flower2,
  Moon,
} from 'lucide-react';
import CalendarView from '@/components/calendar/CalendarView';
import ListsView from '@/components/lists/ListsView';
import CheckinView from '@/components/checkin/CheckinView';
import MemoriesView from '@/components/memories/MemoriesView';
import PreferencesView from '@/components/preferences/PreferencesView';
import CycleTrackerView from '@/components/cycle/CycleTrackerView';
import CoupleKeyModal from '@/components/couple/CoupleKeyModal';
import LoveNoteComposerModal from '@/components/notes/LoveNoteComposerModal';
import DailyPromptModal from '@/components/prompts/DailyPromptModal';
import { calculateCycleInfo } from '@/lib/utils/cycle';
import {
  tapLoveNoteAction,
  replyLoveNoteAction,
  deleteLoveNoteAction,
} from '@/lib/actions/loveNotes';
import { answerDailyPromptAction } from '@/lib/actions/dailyPrompts';
import { updatePartnerMoodAction } from '@/lib/actions/mood';
import { useCoupleRealtime } from '@/lib/realtime/useCoupleRealtime';
import { CoupleRealtimeEvent } from '@/lib/realtime/bus';

interface DashboardProps {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  coupleInfo: {
    couple: {
      id: string;
      anniversaryDate: string | null;
      inviteCode: string;
      status: string;
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
  initialEvents: any[];
  initialLists: any[];
  initialCheckin: any;
  initialMemories: any[];
  initialPreferences: any[];
  initialLoveNotes?: any[];
  initialDailyPrompt?: any;
  initialPartnerMoods?: any[];
  initialCycle?: any;
}

export default function DashboardClient({
  user,
  coupleInfo,
  initialEvents,
  initialLists,
  initialCheckin,
  initialMemories,
  initialPreferences,
  initialLoveNotes = [],
  initialDailyPrompt = null,
  initialPartnerMoods = [],
  initialCycle = null,
}: DashboardProps) {
  const router = useRouter();
  const [currentCycle, setCurrentCycle] = useState<any>(initialCycle);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cycle' | 'calendar' | 'lists' | 'checkin' | 'memories' | 'preferences'
  >('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        ['overview', 'cycle', 'calendar', 'lists', 'checkin', 'memories', 'preferences'].includes(tabParam)
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const handleTabChange = useCallback(
    (newTab: 'overview' | 'cycle' | 'calendar' | 'lists' | 'checkin' | 'memories' | 'preferences') => {
      setActiveTab(newTab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (newTab === 'overview') {
          url.searchParams.delete('tab');
        } else {
          url.searchParams.set('tab', newTab);
        }
        window.history.replaceState({}, '', url.toString());
      }
    },
    []
  );


  const [events, setEvents] = useState(initialEvents);
  const [lists, setLists] = useState(initialLists);
  const [checkin, setCheckin] = useState(initialCheckin);
  const [memories, setMemories] = useState(initialMemories);
  const [preferences, setPreferences] = useState(initialPreferences);

  // Love Notes, Daily Prompts, and Partner Moods state
  const [loveNotesList, setLoveNotesList] = useState<any[]>(initialLoveNotes);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [showWriteNoteModal, setShowWriteNoteModal] = useState(false);

  const [dailyPromptData, setDailyPromptData] = useState<any>(initialDailyPrompt);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptAnswerInput, setPromptAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const uniqueEvents = useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const e of events) {
      if (e.id && !seen.has(e.id)) {
        seen.add(e.id);
        unique.push(e);
      }
    }
    return unique;
  }, [events]);

  const uniqueLists = useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const l of lists) {
      if (l.id && !seen.has(l.id)) {
        seen.add(l.id);
        unique.push(l);
      }
    }
    return unique;
  }, [lists]);

  const uniqueMemories = useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const m of memories) {
      if (m.id && !seen.has(m.id)) {
        seen.add(m.id);
        unique.push(m);
      }
    }
    return unique;
  }, [memories]);

  const uniquePreferences = useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const p of preferences) {
      if (p.id && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }
    return unique;
  }, [preferences]);

  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [showCoupleKeyModal, setShowCoupleKeyModal] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const partnerName = coupleInfo.partner?.displayName || 'Your Partner';

  // Handle incoming realtime SSE / Polling events
  const handleRealtimeEvent = useCallback(
    (event: CoupleRealtimeEvent) => {
      // Ignore self-dispatched events — the local client action already updated the UI
      if (event.actorUserId && event.actorUserId === user.id) {
        return;
      }

      const isFromPartner = true;

      switch (event.type) {
        case 'calendar:event_created':
          setEvents((prev) => {
            if (prev.some((e) => e.id === event.payload.id)) return prev;
            return [event.payload, ...prev];
          });
          if (isFromPartner) {
            showNotification(`${partnerName} added a new date: "${event.payload.title}"`);
          }
          break;

        case 'calendar:event_updated':
          setEvents((prev) =>
            prev.map((e) => (e.id === event.payload.id ? event.payload : e))
          );
          if (isFromPartner) {
            showNotification(`${partnerName} updated "${event.payload.title}"`);
          }
          break;

        case 'calendar:event_deleted':
          setEvents((prev) => prev.filter((e) => e.id !== event.payload.id));
          if (isFromPartner) {
            showNotification(`${partnerName} removed an event`);
          }
          break;

        case 'list:created':
          setLists((prev) => {
            if (prev.some((l) => l.id === event.payload.id)) return prev;
            return [event.payload, ...prev];
          });
          if (isFromPartner) {
            showNotification(`${partnerName} created list: "${event.payload.title}"`);
          }
          break;

        case 'list:deleted':
          setLists((prev) => prev.filter((l) => l.id !== event.payload.id));
          break;

        case 'list:item_added':
          setLists((prev) =>
            prev.map((l) =>
              l.id === event.payload.listId
                ? { ...l, totalItems: (l.totalItems || 0) + 1 }
                : l
            )
          );
          if (isFromPartner) {
            showNotification(`${partnerName} added an item: "${event.payload.content}"`);
          }
          break;

        case 'list:item_toggled':
          setLists((prev) =>
            prev.map((l) =>
              l.id === event.payload.listId
                ? {
                    ...l,
                    completedItems: event.payload.isCompleted
                      ? (l.completedItems || 0) + 1
                      : Math.max(0, (l.completedItems || 1) - 1),
                  }
                : l
            )
          );
          if (isFromPartner) {
            showNotification(
              `${partnerName} marked an item ${event.payload.isCompleted ? 'complete' : 'incomplete'}`
            );
          }
          break;

        case 'checkin:submitted':
          setCheckin((prev: any) => ({
            ...prev,
            partnerSubmitted: true,
          }));
          if (isFromPartner) {
            showNotification(`${partnerName} submitted their weekly reflection`);
          }
          break;

        case 'checkin:revealed':
          setCheckin(event.payload);
          if (isFromPartner) {
            showNotification(`Both reflections completed. This week is now revealed.`);
          }
          break;

        case 'memory:created':
          setMemories((prev) => {
            if (prev.some((m) => m.id === event.payload.id)) return prev;
            return [event.payload, ...prev];
          });
          if (isFromPartner) {
            showNotification(`${partnerName} added a new memory: "${event.payload.title}"`);
          }
          break;

        case 'preference:updated':
          setPreferences((prev) => {
            const exists = prev.some((p) => p.id === event.payload.id);
            if (exists) {
              return prev.map((p) => (p.id === event.payload.id ? event.payload : p));
            }
            return [event.payload, ...prev];
          });
          if (isFromPartner) {
            showNotification(`${partnerName} updated "${event.payload.title}"`);
          }
          break;

        case 'love_note:created':
          setLoveNotesList((prev) => [
            event.payload,
            ...prev.filter((n) => n.id !== event.payload.id),
          ]);
          setActiveNoteIndex(0);
          if (isFromPartner) {
            showNotification(`${partnerName} left a new love note for you! 💌`);
            triggerFloatingHeart('💌');
          }
          break;

        case 'love_note:tapped':
          setLoveNotesList((prev) =>
            prev.map((n) =>
              n.id === event.payload.id ? { ...n, tapsCount: event.payload.tapsCount } : n
            )
          );
          if (isFromPartner) {
            triggerFloatingHeart('❤️');
            showNotification(`${partnerName} tapped love on your note!`);
          }
          break;

        case 'love_note:reply_added':
          setLoveNotesList((prev) =>
            prev.map((n) =>
              n.id === event.payload.noteId
                ? {
                    ...n,
                    replies: [...(n.replies || []), event.payload].filter(
                      (r, idx, arr) => arr.findIndex((x) => x.id === r.id) === idx
                    ),
                  }
                : n
            )
          );
          if (isFromPartner) {
            triggerFloatingHeart('💌');
            showNotification(`${partnerName} scribbled a reply on the love note!`);
          }
          break;

        case 'love_note:deleted':
          setLoveNotesList((prev) => prev.filter((n) => n.id !== event.payload.id));
          setActiveNoteIndex(0);
          break;

        case 'daily_prompt:created':
          setDailyPromptData(event.payload);
          if (isFromPartner) {
            triggerFloatingHeart('✨');
            showNotification(`${partnerName} set a new Daily Question for Two!`);
          }
          break;

        case 'daily_prompt:answered':
          setDailyPromptData((prev: any) => {
            if (!prev) return prev;
            const updatedAnswers = [
              ...(prev.answers || []).filter((a: any) => a.id !== event.payload.id),
              event.payload,
            ];
            return { ...prev, answers: updatedAnswers };
          });
          if (isFromPartner) {
            triggerFloatingHeart('✨');
            showNotification(`${partnerName} answered today's question!`);
          }
          break;

        case 'partner_mood:updated':
          if (event.payload.userId === user.id) {
            setMyMood({
              emoji: event.payload.emoji,
              label: event.payload.label,
              note: event.payload.note || '',
            });
          } else {
            setPartnerMood({
              emoji: event.payload.emoji,
              label: event.payload.label,
              note: event.payload.note || '',
            });
            showNotification(
              `${partnerName} updated their mood to ${event.payload.emoji} ${event.payload.label}`
            );
            triggerFloatingHeart(event.payload.emoji);
          }
          break;

        case 'cycle:updated':
          setCurrentCycle(event.payload);
          if (isFromPartner) {
            showNotification(`${partnerName} updated the Cycle Sanctuary 🌸`);
            triggerFloatingHeart('🌸');
          }
          break;

        case 'cycle:comfort_signal':
          setCurrentCycle((prev: any) =>
            prev ? { ...prev, comfortRequest: event.payload.signalText } : prev
          );
          if (isFromPartner) {
            showNotification(`Comfort Signal from ${partnerName}: "${event.payload.signalText}" 🌸`);
            triggerFloatingHeart('🌸');
          }
          break;

        case 'cycle:deleted':
          setCurrentCycle(null);
          break;

        default:
          break;
      }
    },
    [user.id, partnerName]
  );

  const showNotification = (msg: string) => {
    setRealtimeNotification(msg);
    setTimeout(() => {
      setRealtimeNotification(null);
    }, 4000);
  };

  // Connect to Supabase Realtime + SSE + 5s polling fallback
  const { status: syncStatus } = useCoupleRealtime({
    coupleId: coupleInfo.couple.id,
    enabled: true,
    onEvent: handleRealtimeEvent,
  });

  // Calculate days together
  const daysTogether = coupleInfo.couple.anniversaryDate
    ? Math.floor(
        (Date.now() - new Date(coupleInfo.couple.anniversaryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Stitch Cute & Interactive Additions
  const [floatingHearts, setFloatingHearts] = useState<
    Array<{ id: number; x: number; emoji: string }>
  >([]);

  const triggerFloatingHeart = (emoji = '❤️') => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 60 + 20; // 20% to 80%
    setFloatingHearts((prev) => [...prev, { id, x, emoji }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  // Persistent moods
  const mySavedMood = initialPartnerMoods?.find((m: any) => m.userId === user.id);
  const partnerSavedMood = initialPartnerMoods?.find((m: any) => m.userId !== user.id);

  const [myMood, setMyMood] = useState({
    emoji: mySavedMood?.emoji || '☕',
    label: mySavedMood?.label || 'Cozy & Focused',
    note: mySavedMood?.note || 'Sipping coffee, thinking of you',
  });
  const [partnerMood, setPartnerMood] = useState({
    emoji: partnerSavedMood?.emoji || '🌸',
    label: partnerSavedMood?.label || 'Excited & Dreaming',
    note: partnerSavedMood?.note || 'Counting down the days to our date',
  });

  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState(myMood.emoji);
  const [selectedMoodLabel, setSelectedMoodLabel] = useState(myMood.label);
  const [customMoodNote, setCustomMoodNote] = useState(myMood.note);

  const [hasHeartReacted, setHasHeartReacted] = useState(false);
  const [replyInput, setReplyInput] = useState('');

  const currentNote = loveNotesList[activeNoteIndex] || loveNotesList[0] || null;

  const audioContextRef = useRef<AudioContext | null>(null);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  const toggleAmbientSound = () => {
    if (ambientPlaying) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setAmbientPlaying(false);
      return;
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.12;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      setAmbientPlaying(true);
      showNotification('Kyoto Rain Sanctuary soundscape playing');
    } catch {
      showNotification('Ambient audio enabled');
      setAmbientPlaying(!ambientPlaying);
    }
  };

  const handleTapLoveNote = async () => {
    if (!currentNote) return;
    setHasHeartReacted(true);
    triggerFloatingHeart('❤️');
    showNotification('You tapped love on the note!');

    setLoveNotesList((prev) =>
      prev.map((n) =>
        n.id === currentNote.id ? { ...n, tapsCount: (n.tapsCount || 0) + 1 } : n
      )
    );

    await tapLoveNoteAction(currentNote.id);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !currentNote) return;
    const text = replyInput.trim();
    setReplyInput('');
    triggerFloatingHeart('💌');

    const tempReply = {
      id: 'temp-' + Date.now(),
      noteId: currentNote.id,
      authorUserId: user.id,
      authorName: user.displayName,
      content: text,
      createdAt: new Date().toISOString(),
    };

    setLoveNotesList((prev) =>
      prev.map((n) =>
        n.id === currentNote.id
          ? { ...n, replies: [...(n.replies || []), tempReply] }
          : n
      )
    );

    const res = await replyLoveNoteAction({ noteId: currentNote.id, content: text });
    if (res.success && res.data) {
      setLoveNotesList((prev) =>
        prev.map((n) =>
          n.id === currentNote.id
            ? {
                ...n,
                replies: (n.replies || []).map((r: any) =>
                  r.id === tempReply.id ? res.data : r
                ),
              }
            : n
        )
      );
    }
  };

  const handleDeleteLoveNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this love note?')) return;
    setLoveNotesList((prev) => prev.filter((n) => n.id !== noteId));
    setActiveNoteIndex(0);
    showNotification('Love note removed');
    await deleteLoveNoteAction(noteId);
  };

  const handleAnswerPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptAnswerInput.trim() || !dailyPromptData) return;
    setSubmittingAnswer(true);

    try {
      const res = await answerDailyPromptAction({
        promptId: dailyPromptData.id,
        answer: promptAnswerInput.trim(),
      });

      if (res.success && res.data) {
        setDailyPromptData((prev: any) => ({
          ...prev,
          answers: [
            ...(prev?.answers || []).filter((a: any) => a.userId !== user.id),
            res.data,
          ],
        }));
        setPromptAnswerInput('');
        triggerFloatingHeart('✨');
        showNotification('Your reflection is saved for tonight!');
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    const noteText = customMoodNote.trim() || 'Feeling connected and warm';
    setMyMood({
      emoji: selectedMoodEmoji,
      label: selectedMoodLabel,
      note: noteText,
    });
    setShowMoodModal(false);
    triggerFloatingHeart(selectedMoodEmoji);
    showNotification(`Mood updated to ${selectedMoodEmoji} ${selectedMoodLabel}`);

    await updatePartnerMoodAction({
      emoji: selectedMoodEmoji,
      label: selectedMoodLabel,
      note: noteText,
    });
  };

  const handleLogout = async () => {
    await logOutAction();
    router.push('/login');
    router.refresh();
  };

  const handleExportZip = () => {
    const a = document.createElement('a');
    a.href = '/api/export';
    a.download = `duo-space-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      couple: coupleInfo.couple,
      members: coupleInfo.members,
      events,
      lists,
      checkin,
      memories,
      preferences,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duo-space-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUnlink = async () => {
    if (
      !confirm(
        'This will permanently delete your couple space and all shared events, lists, check-ins, and memories for both partners. A complete backup archive (.zip) will be downloaded first.'
      )
    ) {
      return;
    }

    setUnlinking(true);
    try {
      handleExportZip();
      await new Promise((r) => setTimeout(r, 800));
      await unlinkCoupleAction();
      router.push('/pair');
      router.refresh();
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmth-100 flex flex-col pb-16 md:pb-10 text-warmth-900 w-full max-w-full overflow-x-hidden">
      {/* Realtime Toast Notification - Clean and minimal */}
      {realtimeNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-warmth-900 text-white px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2 text-xs font-medium border border-warmth-800">
            <Bell className="w-3.5 h-3.5 text-rosewood-300" />
            <span>{realtimeNotification}</span>
          </div>
        </div>
      )}

      {/* Top Header - Solid, warm editorial with Kyoto rain & heartbeat */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b border-warmth-200 w-full max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => triggerFloatingHeart('❤️')}
              title="Click to flutter love hearts"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm transition group shrink-0"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white animate-heartbeat group-hover:scale-110 transition-transform" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-lg font-serif font-bold text-warmth-900 leading-tight truncate max-w-[150px] sm:max-w-none">
                  {user.displayName} & {partnerName}
                </h1>
                <button
                  type="button"
                  onClick={() => setShowCoupleKeyModal(true)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shrink-0 active:scale-95"
                  title="View Secret Couple Key & 2-Person Sync Chamber"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Paired</span>
                  <span className="text-[9px] bg-emerald-200/80 px-1 rounded text-emerald-900 font-mono font-bold">🔑 Key</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs text-warmth-600 truncate">
                {daysTogether !== null && daysTogether >= 0 && (
                  <span className="truncate">{daysTogether.toLocaleString()} days woven</span>
                )}
                <span className="text-warmth-300">•</span>
                <button
                  type="button"
                  onClick={() => setShowCoupleKeyModal(true)}
                  className="flex items-center gap-1 text-emerald-700 hover:underline shrink-0 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Sync</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Secret Couple Key button */}
            <button
              type="button"
              onClick={() => setShowCoupleKeyModal(true)}
              title="Our Unique Secret Couple Key"
              className="py-1.5 px-2 sm:px-2.5 rounded-lg text-rosewood-800 hover:text-rosewood-900 bg-rosewood-50 hover:bg-rosewood-100 transition text-xs font-semibold flex items-center gap-1 border border-rosewood-200 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-rosewood-700" />
              <span className="hidden sm:inline">Couple Key</span>
            </button>

            {/* Kyoto Rain Sanctuary Ambient Sound Toggle */}
            <button
              type="button"
              onClick={toggleAmbientSound}
              title={ambientPlaying ? 'Pause Kyoto Rain soundscape' : 'Play Kyoto Rain ambient soundscape'}
              className={`p-1.5 sm:py-1.5 sm:px-2.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition ${
                ambientPlaying
                  ? 'bg-rosewood-100 text-rosewood-800 border-rosewood-300 shadow-inner'
                  : 'bg-white text-warmth-700 hover:bg-warmth-100 border-warmth-300'
              }`}
            >
              {ambientPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-rosewood-700 animate-pulse" />
                  <span className="hidden md:inline text-[11px]">Kyoto Rain</span>
                </>
              ) : (
                <>
                  <Headphones className="w-3.5 h-3.5 text-warmth-600" />
                  <span className="hidden md:inline text-[11px]">Rain</span>
                </>
              )}
            </button>

            <Link
              href="/onboarding"
              title="Personalize Sanctuary with Love Blueprint Q&A"
              className="p-1.5 sm:py-1.5 sm:px-2.5 rounded-lg text-rosewood-800 hover:text-rosewood-900 bg-rosewood-50 hover:bg-rosewood-100 transition text-xs font-medium flex items-center gap-1 border border-rosewood-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-rosewood-700" />
              <span className="hidden md:inline">Blueprint</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowUnlinkModal(true)}
              title="Space Settings & Export"
              className="p-1.5 sm:py-1.5 sm:px-2.5 rounded-lg text-warmth-700 hover:text-warmth-900 hover:bg-warmth-200/80 transition text-xs font-medium flex items-center gap-1 border border-warmth-300 bg-white"
            >
              <Download className="w-3.5 h-3.5 text-warmth-500" />
              <span className="hidden md:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-warmth-600 hover:text-rosewood-700 hover:bg-warmth-200/80 transition border border-transparent hover:border-warmth-300"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Wrapped with strict overflow containment */}
        <div className="w-full max-w-full overflow-hidden border-t border-warmth-200/60 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto px-2 sm:px-6 flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2 no-scrollbar touch-pan-x min-w-0 w-full">
            {[
              { id: 'overview', label: 'Our Story', icon: LayoutDashboard },
              { id: 'cycle', label: 'Cycle & BF Care', icon: Flower2 },
              { id: 'calendar', label: 'Dates & Calendar', icon: CalendarIcon },
              { id: 'lists', label: 'Bucket Lists', icon: CheckSquare },
              { id: 'checkin', label: 'Weekly Rituals', icon: Smile },
              { id: 'memories', label: 'Polaroid Vault', icon: Camera },
              { id: 'preferences', label: 'Love Map', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-nav-${tab.id}`}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition shrink-0 ${
                    isActive
                      ? 'bg-rosewood-700 text-white shadow-sm font-semibold'
                      : 'text-warmth-700 hover:text-warmth-900 hover:bg-warmth-200/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-warmth-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full max-w-full px-3.5 sm:px-6 pt-5 sm:pt-6 flex-1 min-w-0 overflow-x-hidden">
        {/* TAB: OVERVIEW (Stitch Screen 1: Our Story & Dashboard) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* HERO KEEPSAKE BANNER (Taped at corners with washi tape) */}
            <div className="relative bg-white rounded-2xl border border-warmth-200 shadow-sm p-6 sm:p-8 overflow-hidden">
              {/* Corner Washi Tapes */}
              <div className="washi-tape-rose -top-2.5 left-6" />
              <div className="washi-tape-sage -top-2.5 right-6" />

              <div className="max-w-xl mx-auto text-center space-y-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rosewood-50 text-rosewood-800 border border-rosewood-200">
                  <Sparkles className="w-3.5 h-3.5 text-rosewood-600" />
                  Our Private Couple Sanctuary
                </span>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-warmth-900 tracking-tight">
                  {daysTogether !== null ? daysTogether.toLocaleString() : '1,222'} Days Woven in Love
                </h2>

                <p className="font-serif italic text-warmth-600 text-sm sm:text-base leading-relaxed">
                  &ldquo;In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.&rdquo;
                </p>
                <p className="text-[11px] font-sans uppercase tracking-widest text-warmth-400 font-semibold">
                  Maya Angelou
                </p>
              </div>

              {/* TACTILE PARTNER MOOD CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-warmth-100">
                {/* User Mood Card */}
                <div className="p-4 rounded-xl bg-warmth-50/70 border border-warmth-200 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-warmth-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {user.displayName} (You)
                    </span>
                    <button
                      onClick={() => setShowMoodModal(true)}
                      className="text-[11px] font-medium text-rosewood-700 hover:text-rosewood-800 underline decoration-rosewood-300 underline-offset-2"
                    >
                      Update Mood
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-white rounded-lg border border-warmth-200 shadow-2xs">
                      {myMood.emoji}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-warmth-900">{myMood.label}</p>
                      <p className="text-[11px] text-warmth-600 mt-0.5 italic">&ldquo;{myMood.note}&rdquo;</p>
                    </div>
                  </div>
                </div>

                {/* Partner Mood Card */}
                <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/80 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-warmth-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rosewood-500 animate-pulse" />
                      {partnerName}
                    </span>
                    <span className="text-[11px] text-rosewood-600 font-medium">Partner</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-white rounded-lg border border-rose-200 shadow-2xs">
                        {partnerMood.emoji}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-warmth-900">{partnerMood.label}</p>
                        <p className="text-[11px] text-warmth-600 mt-0.5 italic">&ldquo;{partnerMood.note}&rdquo;</p>
                      </div>
                    </div>
                    {/* Cute Quick Nudges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          triggerFloatingHeart('☕');
                          showNotification(`You sent a warm cup of coffee to ${partnerName}! ☕`);
                        }}
                        title="Nudge with warm coffee"
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1 transition shadow-2xs active:scale-95"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] font-semibold hidden md:inline">Coffee</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerFloatingHeart('🌸');
                          showNotification(`You fluttered love petals to ${partnerName}! 🌸`);
                        }}
                        title="Send fluttering blossom"
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rosewood-700 text-xs flex items-center gap-1 transition shadow-2xs active:scale-95"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rosewood-500 text-rosewood-500" />
                        <span className="text-[10px] font-semibold hidden md:inline">Flutter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* TACTILE CYCLE SANCTUARY & BF CARE OVERVIEW CARD */}
              {(() => {
                const cStartDate = currentCycle?.startDate || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const cInfo = calculateCycleInfo(cStartDate, currentCycle?.periodLength || 5, currentCycle?.cycleLength || 28);
                return (
                  <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-warmth-50 to-warmth-100/60 border border-rose-200/80 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100/80 border border-rose-200 flex items-center justify-center text-rosewood-700 shrink-0 shadow-2xs">
                          <Flower2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-serif font-bold text-warmth-900">
                              Cycle Sanctuary & BF Care
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cInfo.badgeBg} ${cInfo.badgeColor}`}>
                              {cInfo.phaseName} • Day {cInfo.dayOfCycle}
                            </span>
                          </div>
                          <p className="text-xs text-warmth-600 mt-0.5">
                            {cInfo.daysUntilNextPeriod === 0
                              ? 'Period expected today'
                              : `${cInfo.daysUntilNextPeriod} days until next cycle (${cInfo.nextPeriodDate})`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTabChange('cycle')}
                        className="px-3 py-1.5 rounded-lg bg-rosewood-700 hover:bg-rosewood-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                      >
                        <span>Open Sanctuary</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Girlfriend's Active Comfort Signal or BF Tip */}
                    {currentCycle?.comfortRequest ? (
                      <div className="mt-3.5 p-3 rounded-xl bg-white border border-rose-200 shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-rosewood-900 font-medium">
                          <span className="text-base">🌸</span>
                          <span><strong>{partnerName}&apos;s Signal:</strong> &ldquo;{currentCycle.comfortRequest}&rdquo;</span>
                        </div>
                        <span className="text-[10px] text-rosewood-600 font-semibold uppercase tracking-wider shrink-0 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Needs TLC
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3.5 pt-3 border-t border-rose-200/50 flex items-center gap-2 text-xs text-warmth-700">
                        <span className="text-rosewood-700 font-semibold shrink-0">💡 BF Tip:</span>
                        <span className="italic truncate">&ldquo;{cInfo.boyfriendAdvice.headline}&rdquo; — {cInfo.boyfriendAdvice.mindset}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* TWO-COLUMN EDITORIAL SCRAPBOOK GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Morning Love Capsule & Daily Reflection (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* MORNING LOVE CAPSULE LETTER */}
                {currentNote ? (
                  <div
                    className={`relative rounded-2xl border shadow-sm p-6 overflow-hidden transition-all ${
                      currentNote.paperStyle === 'rose'
                        ? 'bg-[#FFF5F5] border-rose-200'
                        : currentNote.paperStyle === 'sage'
                        ? 'bg-[#F4F8F4] border-emerald-200'
                        : currentNote.paperStyle === 'classic'
                        ? 'bg-[#FFFDF9] border-warmth-200'
                        : 'bg-[#FCF9EE] border-amber-200/90'
                    }`}
                  >
                    {/* Corner Washi Tape */}
                    <div
                      className={`${
                        currentNote.paperStyle === 'rose'
                          ? 'washi-tape-rose'
                          : currentNote.paperStyle === 'sage'
                          ? 'washi-tape-sage'
                          : 'washi-tape-butter'
                      } -top-2.5 left-1/2 -translate-x-1/2`}
                    />

                    <div className="flex items-center justify-between mb-4 pt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💌</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-serif font-bold text-warmth-900">
                              {currentNote.title || 'Morning Love Note'}
                            </h3>
                            <span className="text-[10px] text-rosewood-700 bg-white/80 px-1.5 py-0.5 rounded border border-rosewood-200 font-semibold">
                              {currentNote.authorUserId === user.id
                                ? 'From You'
                                : `From ${currentNote.authorName}`}
                            </span>
                          </div>
                          <p className="text-[11px] text-warmth-500 font-mono">
                            {new Date(currentNote.createdAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Header controls: Write Note & Navigation */}
                      <div className="flex items-center gap-1.5">
                        {loveNotesList.length > 1 && (
                          <div className="flex items-center gap-1 bg-white/80 border border-warmth-200 rounded-lg px-1.5 py-0.5 text-[11px] font-mono text-warmth-600">
                            <button
                              onClick={() =>
                                setActiveNoteIndex((prev) =>
                                  prev > 0 ? prev - 1 : loveNotesList.length - 1
                                )
                              }
                              title="Previous note"
                              className="p-0.5 hover:text-warmth-900 transition"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <span>
                              {activeNoteIndex + 1}/{loveNotesList.length}
                            </span>
                            <button
                              onClick={() =>
                                setActiveNoteIndex((prev) =>
                                  prev < loveNotesList.length - 1 ? prev + 1 : 0
                                )
                              }
                              title="Next note"
                              className="p-0.5 hover:text-warmth-900 transition"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setShowWriteNoteModal(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rosewood-700 hover:bg-rosewood-800 text-white shadow-2xs active:scale-95 transition"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          <span>Write Note</span>
                        </button>

                        {currentNote.authorUserId === user.id && (
                          <button
                            onClick={() => handleDeleteLoveNote(currentNote.id)}
                            title="Delete this note"
                            className="p-1 text-warmth-400 hover:text-rosewood-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Handwritten Note Body */}
                    <div className="p-4 rounded-xl bg-white/80 border border-warmth-200/70 shadow-inner">
                      <p className="font-handwriting text-2xl text-warmth-900 leading-relaxed tracking-wide whitespace-pre-line">
                        {currentNote.content}
                      </p>
                      <p className="font-handwriting text-xl text-right text-rosewood-800 mt-2">
                        {currentNote.signOff || '— Forever yours'}
                      </p>
                    </div>

                    {/* Interactive Heart Reaction & Replies */}
                    <div className="mt-4 pt-3 border-t border-warmth-200/60 flex items-center justify-between">
                      <button
                        onClick={handleTapLoveNote}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition active:scale-95 ${
                          hasHeartReacted
                            ? 'bg-rosewood-700 text-white shadow-sm'
                            : 'bg-white hover:bg-rose-50 text-rosewood-800 border border-rosewood-200'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            hasHeartReacted ? 'fill-white' : 'fill-rosewood-600 text-rosewood-600'
                          }`}
                        />
                        <span>{currentNote.tapsCount || 0} Love taps</span>
                      </button>
                      <span className="text-[11px] text-warmth-500 font-sans">
                        {(currentNote.replies || []).length} scribbles attached
                      </span>
                    </div>

                    {/* Handwritten Scribble Replies Thread */}
                    {(currentNote.replies || []).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {(currentNote.replies || []).map((reply: any, idx: number) => (
                          <div
                            key={reply.id || idx}
                            className="p-2.5 rounded-lg bg-white/95 border border-warmth-200 text-xs flex items-baseline justify-between gap-2"
                          >
                            <span className="font-handwriting text-lg text-warmth-800">
                              &ldquo;{reply.content}&rdquo;
                            </span>
                            <span className="text-[10px] text-warmth-400 font-sans shrink-0">
                              {reply.authorUserId === user.id ? 'You' : reply.authorName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scribble Reply Form */}
                    <form onSubmit={handleSendReply} className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Leave a quick handwritten scribble..."
                        className="flex-1 bg-white border border-warmth-300 rounded-lg px-3 py-1.5 text-xs text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-1 focus:ring-rosewood-400"
                      />
                      <button
                        type="submit"
                        disabled={!replyInput.trim()}
                        className="p-1.5 rounded-lg bg-rosewood-700 hover:bg-rosewood-800 disabled:opacity-40 text-white transition shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Empty state when no love note exists yet */
                  <div className="relative bg-[#FCF9EE] rounded-2xl border border-amber-200/90 shadow-sm p-7 text-center space-y-3 overflow-hidden">
                    <div className="washi-tape-butter -top-2.5 left-1/2 -translate-x-1/2" />
                    <span className="text-3xl block">💌</span>
                    <h3 className="text-base font-serif font-bold text-warmth-900">
                      Our Love Capsule is Waiting
                    </h3>
                    <p className="text-xs text-warmth-600 max-w-sm mx-auto">
                      Write a morning note, sweet thought, or little reminder to brighten {partnerName}&apos;s day.
                    </p>
                    <button
                      onClick={() => setShowWriteNoteModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rosewood-700 hover:bg-rosewood-800 text-white shadow-sm active:scale-95 transition"
                    >
                      <PenLine className="w-4 h-4" />
                      <span>Write Our First Note</span>
                    </button>
                  </div>
                )}

                {/* DAILY QUESTION FOR TWO */}
                <div className="bg-white rounded-2xl border border-warmth-200 shadow-sm p-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-warmth-900">
                          Daily Prompt for Two
                        </h3>
                        <p className="text-[10px] text-warmth-500 font-mono">
                          Day {dailyPromptData?.dayNumber || 312}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowPromptModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Ask New Question</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-warmth-50 border border-warmth-200">
                    <p className="font-serif italic text-warmth-900 text-sm sm:text-base leading-relaxed">
                      &ldquo;{dailyPromptData?.promptText ||
                        'If we could teleport to any little bakery or coffee shop anywhere in the world this evening, where would we sit and what treat would we share?'}&rdquo;
                    </p>
                  </div>

                  {/* Existing reflections from partners */}
                  {dailyPromptData?.answers && dailyPromptData.answers.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {dailyPromptData.answers.map((ans: any) => (
                        <div
                          key={ans.id}
                          className="p-3 rounded-xl bg-[#FAF7F2] border border-warmth-200 text-xs"
                        >
                          <span className="font-bold text-warmth-800 block mb-0.5">
                            {ans.userId === user.id ? `${user.displayName} (You)` : partnerName}
                          </span>
                          <p className="text-warmth-700 font-serif italic leading-relaxed">
                            &ldquo;{ans.answer}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline answer submission form */}
                  <form onSubmit={handleAnswerPrompt} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={promptAnswerInput}
                      onChange={(e) => setPromptAnswerInput(e.target.value)}
                      placeholder="Share your reflection for tonight..."
                      className="flex-1 bg-warmth-50 border border-warmth-200 rounded-lg px-3 py-2 text-xs text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={submittingAnswer || !promptAnswerInput.trim()}
                      className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-semibold transition shrink-0"
                    >
                      {submittingAnswer ? 'Saving...' : 'Reflect'}
                    </button>
                  </form>
                </div>
              </div>

              {/* RIGHT COLUMN: Next Date Postcard, Rituals Vault, Bucket List (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* NEXT DATE POSTCARD (Postage stamp aesthetic) */}
                <div
                  onClick={() => handleTabChange('calendar')}
                  className="cursor-pointer bg-white rounded-2xl border border-warmth-200 shadow-sm p-5 hover:border-warmth-400 transition group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-warmth-100 text-warmth-700">
                        <CalendarIcon className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-semibold text-warmth-900">
                        Next Date Postcard
                      </h3>
                    </div>
                    {/* Airmail Vintage Stamp */}
                    <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-rosewood-300 text-rosewood-700 bg-rose-50/50">
                      DATE AIR • 2026
                    </span>
                  </div>

                  {uniqueEvents.length > 0 ? (
                    <div className="space-y-2">
                      <div className="p-3.5 rounded-xl bg-warmth-50 border border-warmth-200 group-hover:bg-warmth-100/70 transition">
                        <div className="flex items-center justify-between text-xs font-bold text-warmth-900">
                          <span className="text-sm font-serif">{uniqueEvents[0].title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rosewood-100 text-rosewood-800">
                            {new Date(uniqueEvents[0].startAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {uniqueEvents[0].location && (
                          <p className="mt-1.5 text-xs text-warmth-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rosewood-600 shrink-0" />
                            <span>{uniqueEvents[0].location}</span>
                          </p>
                        )}
                        {uniqueEvents[0].notes && (
                          <p className="mt-1 text-xs text-warmth-500 italic line-clamp-1">
                            &ldquo;{uniqueEvents[0].notes}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-warmth-500 px-1">
                        <span>Excitement level: 100% ✨</span>
                        <span className="text-rosewood-700 font-medium group-hover:underline inline-flex items-center gap-0.5">
                          View Calendar <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-warmth-50 border border-warmth-200 text-center">
                      <p className="text-xs text-warmth-600">No date planned yet.</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabChange('calendar');
                        }}
                        className="mt-2 text-xs font-semibold text-rosewood-700 underline"
                      >
                        Schedule our next date
                      </button>
                    </div>
                  )}
                </div>

                {/* WEEKLY RITUALS & CHECK-IN VAULT (Wax Seal Emblem) */}
                <div
                  onClick={() => handleTabChange('checkin')}
                  className="cursor-pointer bg-white rounded-2xl border border-warmth-200 shadow-sm p-5 hover:border-warmth-400 transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Wax Seal Icon */}
                      <div className="w-7 h-7 rounded-full bg-rosewood-800 text-rosewood-100 flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                        ✦
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-warmth-900">
                          Weekly Check-in Vault
                        </h3>
                        <p className="text-[11px] text-warmth-500 font-mono">
                          {checkin?.weekNumber ? `Week ${checkin.weekNumber}` : 'Current Week'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-rosewood-700 inline-flex items-center group-hover:translate-x-0.5 transition-transform">
                      Open <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>

                  {checkin?.isRevealed ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">Both envelopes unsealed! Responses revealed.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-warmth-200 text-xs text-warmth-800 space-y-1">
                      <div className="flex items-center gap-2 text-warmth-900 font-medium">
                        <Lock className="w-3.5 h-3.5 text-rosewood-600" />
                        <span>Sealed until both partners answer</span>
                      </div>
                      <p className="text-[11px] text-warmth-500">
                        Take 5 quiet minutes to reflect on this week together.
                      </p>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-warmth-600 italic line-clamp-1 px-1">
                    &ldquo;{checkin?.promptOne || 'What made you feel loved and appreciated this past week?'}&rdquo;
                  </p>
                </div>

                {/* SHARED BUCKET LIST PREVIEW */}
                <div className="bg-white rounded-2xl border border-warmth-200 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-warmth-100 text-warmth-700">
                        <CheckSquare className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-semibold text-warmth-900">
                        Bucket List Dreams
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabChange('lists')}
                      className="text-xs font-medium text-rosewood-700 hover:underline"
                    >
                      View all ({uniqueLists.length})
                    </button>
                  </div>

                  {uniqueLists.length > 0 ? (
                    <div className="space-y-2">
                      {uniqueLists.slice(0, 3).map((list) => (
                        <div
                          key={list.id}
                          onClick={() => handleTabChange('lists')}
                          className="p-3 rounded-xl border border-warmth-200 bg-warmth-50/60 hover:bg-warmth-100/70 cursor-pointer transition flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Heart className="w-3.5 h-3.5 fill-rosewood-500 text-rosewood-500 shrink-0" />
                            <span className="text-xs font-semibold text-warmth-900 truncate">
                              {list.title}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-warmth-600 shrink-0">
                            {list.completedItems}/{list.totalItems} done
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-warmth-500 py-2">No lists created yet.</p>
                  )}
                </div>

                {/* POLAROID MEMORY KEEPSAKE */}
                <div
                  onClick={() => handleTabChange('memories')}
                  className="cursor-pointer bg-white rounded-2xl border border-warmth-200 shadow-sm p-5 hover:border-warmth-400 transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-warmth-100 text-warmth-700">
                        <Camera className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-semibold text-warmth-900">
                        Polaroid Keepsake
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-rosewood-700 inline-flex items-center">
                      Vault <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>

                  {uniqueMemories.length > 0 ? (
                    <div className="polaroid-frame relative">
                      <div className="washi-tape-rose -top-3 left-6 z-10" />
                      {uniqueMemories[0].photoPath ? (
                        <img
                          src={uniqueMemories[0].photoPath}
                          alt={uniqueMemories[0].title}
                          className="w-full h-36 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-28 bg-warmth-100 rounded flex items-center justify-center text-warmth-400">
                          <Camera className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <div className="mt-2 text-center">
                        <p className="font-handwriting text-lg text-warmth-900">
                          {uniqueMemories[0].title}
                        </p>
                        <p className="text-[10px] text-warmth-500 font-mono">
                          {new Date(uniqueMemories[0].memoryDate).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-warmth-500 py-2">Add your first polaroid photo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CYCLE SANCTUARY & BF CARE */}
        {activeTab === 'cycle' && (
          <CycleTrackerView
            user={{ id: user.id, displayName: user.displayName }}
            partner={coupleInfo.partner ? { id: coupleInfo.partner.id, displayName: coupleInfo.partner.displayName } : null}
            initialCycle={currentCycle}
            onCycleUpdated={(updated) => setCurrentCycle(updated)}
            showToast={(msg) => {
              showNotification(msg);
              triggerFloatingHeart('🌸');
            }}
          />
        )}

        {/* TAB: CALENDAR */}
        {activeTab === 'calendar' && (
          <CalendarView
            events={uniqueEvents}
            currentUserId={user.id}
            partnerName={partnerName}
            onEventCreated={(newEvent) => {
              setEvents((prev) => (prev.some((e) => e.id === newEvent.id) ? prev : [newEvent, ...prev]));
            }}
            onEventUpdated={(updatedEvent) => {
              setEvents((prev) =>
                prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
              );
            }}
            onEventDeleted={(id) => {
              setEvents((prev) => prev.filter((e) => e.id !== id));
            }}
          />
        )}

        {/* TAB: LISTS */}
        {activeTab === 'lists' && (
          <ListsView
            lists={uniqueLists}
            currentUserId={user.id}
            partnerName={partnerName}
            onListCreated={(newList) => {
              setLists((prev) => (prev.some((l) => l.id === newList.id) ? prev : [newList, ...prev]));
            }}
            onListDeleted={(listId) => {
              setLists((prev) => prev.filter((l) => l.id !== listId));
            }}
            onItemAdded={(item) => {
              setLists((prev) =>
                prev.map((l) =>
                  l.id === item.listId
                    ? { ...l, totalItems: (l.totalItems || 0) + 1 }
                    : l
                )
              );
            }}
            onItemToggled={(item) => {
              setLists((prev) =>
                prev.map((l) =>
                  l.id === item.listId
                    ? {
                        ...l,
                        completedItems: item.isCompleted
                          ? (l.completedItems || 0) + 1
                          : Math.max(0, (l.completedItems || 1) - 1),
                      }
                    : l
                )
              );
            }}
            onItemDeleted={(itemId) => {
              router.refresh();
            }}
          />
        )}

        {/* TAB: CHECKIN */}
        {activeTab === 'checkin' && (
          <CheckinView
            checkin={checkin}
            currentUserId={user.id}
            currentUserName={user.displayName}
            partnerName={partnerName}
            onCheckinUpdated={(updated) => {
              setCheckin(updated);
            }}
          />
        )}

        {/* TAB: MEMORIES */}
        {activeTab === 'memories' && (
          <MemoriesView
            memories={uniqueMemories}
            currentUserId={user.id}
            partnerName={partnerName}
            onMemoryCreated={(newMem) => {
              setMemories((prev) => (prev.some((m) => m.id === newMem.id) ? prev : [newMem, ...prev]));
            }}
            onMemoryDeleted={(id) => {
              setMemories((prev) => prev.filter((m) => m.id !== id));
            }}
          />
        )}

        {/* TAB: PREFERENCES */}
        {activeTab === 'preferences' && (
          <PreferencesView
            preferences={uniquePreferences}
            currentUserId={user.id}
            partnerName={partnerName}
            onPreferenceSaved={(saved) => {
              setPreferences((prev) => {
                const exists = prev.some((p) => p.id === saved.id);
                if (exists) {
                  return prev.map((p) => (p.id === saved.id ? saved : p));
                }
                return [saved, ...prev];
              });
            }}
            onPreferenceDeleted={(id) => {
              setPreferences((prev) => prev.filter((p) => p.id !== id));
            }}
          />
        )}
      </main>

      {/* Unlink & Export Modal - Solid clean dialog */}
      {showUnlinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-lg border border-warmth-300 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warmth-100 text-warmth-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-warmth-700" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-warmth-900">
                  Settings & Data Export
                </h3>
                <p className="text-xs text-warmth-600">
                  Manage backups and couple membership
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-warmth-50 border border-warmth-200 space-y-2.5">
              <span className="text-xs font-semibold text-warmth-800">
                Offline Space Export
              </span>
              <p className="text-xs text-warmth-600 leading-relaxed">
                Download a complete, offline archive of your shared space. Your photos and database records remain exclusively on your local machine.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handleExportZip}
                  className="flex-1 py-2 px-3 rounded-lg bg-warmth-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-warmth-300" />
                  <span>Full Archive (.zip)</span>
                </button>
                <button
                  onClick={handleExportData}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-warmth-100 border border-warmth-300 text-xs font-semibold text-warmth-900 flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-warmth-600" />
                  <span>JSON Only</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rosewood-900">
                Unlink Couple Space
              </span>
              <p className="text-xs text-warmth-700 leading-relaxed">
                Permanently deletes the couple record and associated data. A full backup archive (.zip) with photos is downloaded automatically before deletion.
              </p>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="w-full py-2 px-3 rounded-lg bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {unlinking ? 'Unlinking...' : 'Export Backup & Unlink'}
              </button>
            </div>

            <button
              onClick={() => setShowUnlinkModal(false)}
              className="w-full py-2 rounded-lg border border-warmth-300 text-xs font-semibold text-warmth-700 hover:bg-warmth-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating Emojis & Heart Particles Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute bottom-16 animate-float-heart text-3xl select-none"
            style={{ left: `${heart.x}%` }}
          >
            {heart.emoji}
          </div>
        ))}
      </div>

      {/* Cute Mood Update Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-warmth-200 space-y-4">
            <div className="text-center space-y-1">
              <span className="inline-block p-2 rounded-full bg-rosewood-50 border border-rosewood-200 text-2xl">
                {selectedMoodEmoji}
              </span>
              <h3 className="text-base font-serif font-bold text-warmth-900">
                How are you feeling today?
              </h3>
              <p className="text-xs text-warmth-600">
                Share your state of heart with {partnerName}
              </p>
            </div>

            <form onSubmit={handleSaveMood} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: '☕', label: 'Cozy & Focused' },
                  { emoji: '🌸', label: 'Joyful & Blooming' },
                  { emoji: '✨', label: 'Dreamy & Excited' },
                  { emoji: '🌙', label: 'Sleepy & Soft' },
                  { emoji: '🥰', label: 'Deeply in Love' },
                  { emoji: '🌿', label: 'Calm & Peaceful' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.emoji}
                    onClick={() => {
                      setSelectedMoodEmoji(item.emoji);
                      setSelectedMoodLabel(item.label);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                      selectedMoodEmoji === item.emoji
                        ? 'border-rosewood-600 bg-rose-50/60 shadow-2xs font-bold text-rosewood-900'
                        : 'border-warmth-200 hover:border-warmth-300 bg-white text-warmth-700'
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[10px] text-center leading-tight truncate w-full">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-warmth-800 mb-1">
                  Little note for {partnerName}
                </label>
                <input
                  type="text"
                  value={customMoodNote}
                  onChange={(e) => setCustomMoodNote(e.target.value)}
                  placeholder="e.g. Sipping tea and dreaming of our weekend..."
                  className="w-full bg-warmth-50 border border-warmth-200 rounded-lg px-3 py-2 text-xs text-warmth-900 focus:outline-none focus:ring-1 focus:ring-rosewood-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMoodModal(false)}
                  className="flex-1 py-2 rounded-lg border border-warmth-300 text-xs font-semibold text-warmth-700 hover:bg-warmth-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-rosewood-700 hover:bg-rosewood-800 text-white text-xs font-semibold transition shadow-sm active:scale-95"
                >
                  Update Mood
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Love Note Composer Modal */}
      {showWriteNoteModal && (
        <LoveNoteComposerModal
          isOpen={showWriteNoteModal}
          onClose={() => setShowWriteNoteModal(false)}
          partnerName={partnerName}
          onNoteCreated={(newNote) => {
            setLoveNotesList((prev) => [newNote, ...prev]);
            setActiveNoteIndex(0);
            triggerFloatingHeart('💌');
            showNotification('Love note sealed and sent!');
          }}
        />
      )}

      {/* Daily Prompt Modal */}
      {showPromptModal && (
        <DailyPromptModal
          isOpen={showPromptModal}
          onClose={() => setShowPromptModal(false)}
          partnerName={partnerName}
          onPromptCreated={(newPrompt) => {
            setDailyPromptData(newPrompt);
            triggerFloatingHeart('✨');
            showNotification('New question set for tonight!');
          }}
        />
      )}

      {/* Secret Couple Key & Sync Modal */}
      {showCoupleKeyModal && (
        <CoupleKeyModal
          isOpen={showCoupleKeyModal}
          onClose={() => setShowCoupleKeyModal(false)}
          coupleInfo={coupleInfo}
          currentUserName={user.displayName}
          syncStatus={syncStatus}
        />
      )}
    </div>
  );
}
