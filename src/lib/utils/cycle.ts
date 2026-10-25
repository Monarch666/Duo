/**
 * Duo Sanctuary - Menstrual Cycle & Partner Care Intelligence
 * 
 * Provides cycle phase calculation, symptom translation, and
 * deeply empathetic, actionable guidance for partners ("Advice for BF").
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface PhaseInfo {
  phase: CyclePhase;
  phaseName: string;
  badgeColor: string;
  badgeBg: string;
  dayOfCycle: number;
  totalCycleDays: number;
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  progressPercent: number;
  overview: string;
  physicalState: string;
  emotionalState: string;
  
  // Boyfriend Care & Advice Guide
  boyfriendAdvice: {
    headline: string;
    mindset: string;
    dos: string[];
    donts: string[];
    comfortKit: string[];
    sweetMessageSuggestion: string;
  };
}

export function calculateCycleInfo(
  startDateStr: string,
  periodLength = 5,
  cycleLength = 28
): PhaseInfo {
  const start = new Date(startDateStr);
  const now = new Date();
  
  // Normalize dates to midnight UTC to prevent time zone drift
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const dayOfCycle = (diffDays % cycleLength) + 1;
  const daysUntilNextPeriod = cycleLength - dayOfCycle;
  
  const nextDate = new Date(start);
  const cyclesCompleted = Math.floor(diffDays / cycleLength);
  nextDate.setDate(start.getDate() + (cyclesCompleted + 1) * cycleLength);
  const nextPeriodDate = nextDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const progressPercent = Math.min(100, Math.round((dayOfCycle / cycleLength) * 100));

  let phase: CyclePhase = 'luteal';
  let phaseName = 'Luteal Phase';
  let badgeColor = 'text-rosewood-800';
  let badgeBg = 'bg-rosewood-100 border-rosewood-300';
  let overview = 'Her body is preparing for the next cycle. Progesterone rises then dips.';
  let physicalState = 'Possible mild bloating, skin sensitivity, breast tenderness, or sweet cravings.';
  let emotionalState = 'Heightened emotional sensitivity. Desires safety, low-stress surroundings, and validation.';

  let boyfriendAdvice = {
    headline: 'Validation Over Solutions',
    mindset: 'Her brain chemistry is adapting to dropping progesterone. Be her calm anchor.',
    dos: [
      'Listen without immediately trying to "fix" everything — hold space for her feelings.',
      'Surprise her with cozy comfort foods (mac & cheese, dark chocolate, warm pastries).',
      'Take initiative on dinner or cleaning so she can rest guilt-free.',
      'Offer forehead kisses and unprompted cuddles.',
    ],
    donts: [
      'Never ask "Are you PMSing?" during a disagreement.',
      'Do not dismiss her worries as "irrational" — they feel very real to her.',
      'Avoid high-pressure social obligations if she wants a quiet night in.',
    ],
    comfortKit: ['Warm fleece blanket', 'Dark chocolates / favorite sweet', 'Cozy movie night in', 'Unprompted hug'],
    sweetMessageSuggestion: 'Hey my love, thinking of you. You do so much every day — tonight dinner and relaxing is on me. Love you ❤️',
  };

  if (dayOfCycle <= periodLength) {
    phase = 'menstrual';
    phaseName = 'Menstrual Phase';
    badgeColor = 'text-rosewood-700';
    badgeBg = 'bg-rosewood-50 border-rosewood-200';
    overview = 'Her uterine lining is shedding. Estrogen and progesterone are at their lowest baseline.';
    physicalState = 'Uterine cramping, lower back fatigue, low physical stamina, headaches or body chills.';
    emotionalState = 'Quiet, reflective, tender. Needs physical warmth and unconditional emotional safety.';

    boyfriendAdvice = {
      headline: 'Maximum Warmth & Gentle Nurturing',
      mindset: 'Her body is working as hard as running an endurance marathon right now. Pamper her completely.',
      dos: [
        'Prepare or recharge her heating pad / hot water bottle without being asked.',
        'Brew warm soothing teas (chamomile, peppermint, or fresh ginger tea).',
        'Offer a gentle lower back or foot rub while watching something comforting.',
        'Keep her favorite pain relief and snacks within easy reach.',
        'Be extra soft in your tone and embrace her gently.',
      ],
      donts: [
        'Do not expect high energy, long walks, or heavy physical activities.',
        'Never make her feel guilty for resting in bed or canceling plans.',
        'Do not start stressful financial or logistical arguments.',
      ],
      comfortKit: ['Heating pad / hot water bottle', 'Warm chamomile or ginger tea', 'Soft socks', 'Lower back massage'],
      sweetMessageSuggestion: 'Rest your body, my heart. I’m here to take care of anything you need today. Just cozy up and let me look after you 🌸',
    };
  } else if (dayOfCycle <= 13) {
    phase = 'follicular';
    phaseName = 'Follicular Phase';
    badgeColor = 'text-emerald-800';
    badgeBg = 'bg-emerald-50 border-emerald-200';
    overview = 'Estrogen is steadily climbing. Energy, curiosity, and mental clarity rebound beautifully.';
    physicalState = 'Energy levels rising, lighter body feel, refreshed stamina.';
    emotionalState = 'Optimistic, open to adventure, playful, and creative.';

    boyfriendAdvice = {
      headline: 'Match Her Creative Energy & Plan Fun Dates',
      mindset: 'She is feeling refreshed, energized, and excited for new experiences together.',
      dos: [
        'Plan a spontaneous outdoor date, exciting dinner, or weekend mini-adventure.',
        'Support her creative projects and brainstorm dreams together.',
        'Engage in fun, playful banter and active quality time.',
      ],
      donts: [
        'Do not stay locked inside all day when she is eager to explore.',
        'Do not let routines get monotonous — try a new recipe or coffee spot.',
      ],
      comfortKit: ['Fresh flowers', 'Trying a new dessert place', 'Outdoor sunset stroll', 'Spontaneous date night'],
      sweetMessageSuggestion: 'You look radiant today! How about we try that new dinner place you wanted to visit tonight? 😊',
    };
  } else if (dayOfCycle <= 16) {
    phase = 'ovulation';
    phaseName = 'Ovulation Phase';
    badgeColor = 'text-amber-800';
    badgeBg = 'bg-amber-50 border-amber-200';
    overview = 'Peak estrogen and luteinizing hormone release. Peak vitality, charisma, and attraction.';
    physicalState = 'Peak physical strength, vibrant skin glow, heightened sensory perception.';
    emotionalState = 'Confident, magnetic, deeply affectionate, craving close romantic intimacy.';

    boyfriendAdvice = {
      headline: 'Deep Romance & Romantic Intimacy',
      mindset: 'Her romantic attraction, confidence, and desire for deep connection are at their monthly peak.',
      dos: [
        'Compliment her specifically — how gorgeous she looks and how much you admire her.',
        'Dress up nicely and take her on an intimate, candlelit date.',
        'Show deep physical affection and romantic attention.',
      ],
      donts: [
        'Do not be glued to your phone; give her 100% undivided romantic presence.',
      ],
      comfortKit: ['Candlelit dinner', 'Heartfelt love note', 'Romantic playlist', 'Her favorite perfume/scent'],
      sweetMessageSuggestion: 'I can’t stop smiling thinking about you today. You take my breath away, truly. Can’t wait to hold you tonight ❤️',
    };
  }

  return {
    phase,
    phaseName,
    badgeColor,
    badgeBg,
    dayOfCycle,
    totalCycleDays: cycleLength,
    daysUntilNextPeriod,
    nextPeriodDate,
    progressPercent,
    overview,
    physicalState,
    emotionalState,
    boyfriendAdvice,
  };
}

export const COMMON_SYMPTOMS = [
  { id: 'cramps', label: 'Cramps', emoji: '⚡' },
  { id: 'backache', label: 'Backache', emoji: '🩹' },
  { id: 'headache', label: 'Headache', emoji: '💆‍♀️' },
  { id: 'fatigue', label: 'Exhausted', emoji: '😴' },
  { id: 'sweet_cravings', label: 'Sweet Tooth', emoji: '🍫' },
  { id: 'bloating', label: 'Bloating', emoji: '🫧' },
  { id: 'sensitive', label: 'Tender Heart', emoji: '🥺' },
  { id: 'low_energy', label: 'Low Battery', emoji: '🪫' },
  { id: 'snuggly', label: 'Wants Cuddles', emoji: '🧸' },
];

export const QUICK_COMFORT_SIGNALS = [
  { id: 'heating_pad', label: 'Heating pad needed ⚡', emoji: '🔥' },
  { id: 'chocolate', label: 'Craving chocolate / sweets 🍫', emoji: '🍫' },
  { id: 'tea', label: 'Warm tea request ☕', emoji: '☕' },
  { id: 'cuddles', label: 'Silent cuddles & back rub 🧸', emoji: '🧸' },
  { id: 'space', label: 'Quiet nap / recharge time 🌿', emoji: '🌿' },
];
