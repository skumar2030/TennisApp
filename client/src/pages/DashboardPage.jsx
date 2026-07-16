import { useState } from 'react'
import MyColleges from '../components/MyColleges'

const TABS = [
  { id: 'players', label: 'Featured Players' },
  { id: 'resources', label: 'College Resources' },
  { id: 'college', label: 'College Path' },
  { id: 'mycolleges', label: 'My Colleges' },
  { id: 'pro', label: 'Pro Journey' },
]

const ATP_PLAYERS = [
  {
    name: 'Jannik Sinner',
    country: 'Italy', flag: '🇮🇹', ranking: 1,
    titles: 'Australian Open 2024 & 2025, US Open 2024',
    style: 'Baseline Powerhouse',
    bio: 'Relentless from the back of the court with a two-handed backhand that is one of the best in the game.',
    bg: 'from-sky-500 to-blue-700',
    accent: 'bg-sky-100 text-sky-700',
    wiki: 'https://en.wikipedia.org/wiki/Jannik_Sinner',
  },
  {
    name: 'Carlos Alcaraz',
    country: 'Spain', flag: '🇪🇸', ranking: 2,
    titles: 'Wimbledon 2023 & 2024, Roland Garros 2024, US Open 2022',
    style: 'All-Court Attacker',
    bio: 'Explosive athleticism, elite drop shots, and the ability to dominate on every surface at just 21 years old.',
    bg: 'from-orange-400 to-red-600',
    accent: 'bg-orange-100 text-orange-700',
    wiki: 'https://en.wikipedia.org/wiki/Carlos_Alcaraz',
  },
  {
    name: 'Novak Djokovic',
    country: 'Serbia', flag: '🇷🇸', ranking: 3,
    titles: '24 Grand Slam titles — most in history',
    style: 'Strategic Baseline Master',
    bio: 'The greatest returner of all time. Exceptional flexibility, mental strength, and match IQ built over 20 years at the top.',
    bg: 'from-emerald-500 to-green-700',
    accent: 'bg-emerald-100 text-emerald-700',
    wiki: 'https://en.wikipedia.org/wiki/Novak_Djokovic',
  },
  {
    name: 'Alexander Zverev',
    country: 'Germany', flag: '🇩🇪', ranking: 4,
    titles: 'Olympic Gold 2021, Roland Garros 2025',
    style: 'Big Server & Baseline',
    bio: 'One of the tallest players on tour with a devastating serve and a complete game from the baseline.',
    bg: 'from-yellow-400 to-amber-600',
    accent: 'bg-yellow-100 text-yellow-700',
    wiki: 'https://en.wikipedia.org/wiki/Alexander_Zverev',
  },
  {
    name: 'Daniil Medvedev',
    country: 'Russia', flag: '🇷🇺', ranking: 5,
    titles: 'US Open 2021, Australian Open finalist 2021 & 2022',
    style: 'Counter-Punching Tactician',
    bio: 'Unusual but highly effective flat ball-striking and exceptional ability to neutralize power players from the baseline.',
    bg: 'from-violet-500 to-purple-700',
    accent: 'bg-violet-100 text-violet-700',
    wiki: 'https://en.wikipedia.org/wiki/Daniil_Medvedev',
  },
]

const WTA_PLAYERS = [
  {
    name: 'Aryna Sabalenka',
    country: 'Belarus', flag: '🇧🇾', ranking: 1,
    titles: 'Australian Open 2023 & 2024, US Open 2023',
    style: 'Aggressive Baseliner',
    bio: 'Thunderous serve and forehand paired with improved consistency make her the most dominant player on tour.',
    bg: 'from-pink-500 to-rose-600',
    accent: 'bg-pink-100 text-pink-700',
    wiki: 'https://en.wikipedia.org/wiki/Aryna_Sabalenka',
  },
  {
    name: 'Iga Swiatek',
    country: 'Poland', flag: '🇵🇱', ranking: 2,
    titles: 'Roland Garros 2020, 2022, 2023, 2024 · US Open 2022',
    style: 'Heavy Topspin Baseline',
    bio: 'Relentless topspin forehand and elite movement. Dominated clay court tennis for multiple years with a 37-match win streak.',
    bg: 'from-red-500 to-rose-700',
    accent: 'bg-red-100 text-red-700 dark:text-red-400',
    wiki: 'https://en.wikipedia.org/wiki/Iga_%C5%9Bwi%C4%85tek',
  },
  {
    name: 'Coco Gauff',
    country: 'USA', flag: '🇺🇸', ranking: 3,
    titles: 'US Open 2023',
    style: 'All-Court Power Player',
    bio: 'Exceptional serve, powerful groundstrokes and elite athleticism. A leader on and off court, representing the next generation.',
    bg: 'from-indigo-500 to-blue-700',
    accent: 'bg-indigo-100 text-indigo-700',
    wiki: 'https://en.wikipedia.org/wiki/Coco_Gauff',
  },
  {
    name: 'Elena Rybakina',
    country: 'Kazakhstan', flag: '🇰🇿', ranking: 4,
    titles: 'Wimbledon 2022, Australian Open finalist 2023',
    style: 'Big Serve & Flat Striker',
    bio: 'One of the biggest serves in women\'s tennis combined with flat, penetrating groundstrokes that overwhelm opponents.',
    bg: 'from-teal-500 to-cyan-700',
    accent: 'bg-teal-100 text-teal-700',
    wiki: 'https://en.wikipedia.org/wiki/Elena_Rybakina',
  },
  {
    name: 'Madison Keys',
    country: 'USA', flag: '🇺🇸', ranking: 5,
    titles: 'Australian Open 2025, US Open 2017',
    style: 'Flat Ball Striker',
    bio: 'Powerful flat groundstrokes and a booming serve. A veteran who found her best tennis later in her career.',
    bg: 'from-amber-500 to-orange-600',
    accent: 'bg-amber-100 text-amber-700',
    wiki: 'https://en.wikipedia.org/wiki/Madison_Keys',
  },
]

const RESOURCES = [
  {
    category: 'Recruiting & Ratings',
    color: 'border-green-400',
    headerBg: 'bg-green-50',
    items: [
      {
        name: 'TennisRecruiting.net',
        url: 'https://www.tennisrecruiting.net',
        desc: 'The go-to recruiting platform. Build a profile, connect with college coaches, and see commit announcements.',
        tag: 'Must-Have',
        tagColor: 'bg-green-600 text-white',
      },
      {
        name: 'UTR Sports',
        url: 'https://www.utrsports.net',
        desc: 'Universal Tennis Rating — the most widely accepted rating system by college coaches. Create a free profile and track your UTR.',
        tag: 'Essential',
        tagColor: 'bg-blue-600 text-white',
      },
      {
        name: 'College Tennis Online',
        url: 'https://www.collegetennisonline.com',
        desc: 'Comprehensive database of D1/D2/D3 college tennis programs, rankings, and scholarship information.',
        tag: 'Research',
        tagColor: 'bg-purple-600 text-white',
      },
    ],
  },
  {
    category: 'Official Governing Bodies',
    color: 'border-blue-400',
    headerBg: 'bg-blue-50',
    items: [
      {
        name: 'USTA College Tennis',
        url: 'https://www.usta.com/en/home/play/college-tennis.html',
        desc: 'USTA\'s official college tennis hub — pathways, scholarships, and support for players pursuing college tennis.',
        tag: 'Official',
        tagColor: 'bg-sky-600 text-white',
      },
      {
        name: 'ITA — Intercollegiate Tennis Association',
        url: 'https://www.wearecollegetennis.com',
        desc: 'The national governing body for college tennis. Rankings, tournaments, All-American awards, and coaching resources.',
        tag: 'Official',
        tagColor: 'bg-sky-600 text-white',
      },
      {
        name: 'NCAA Eligibility Center',
        url: 'https://web3.ncaa.org/ecwr3/',
        desc: 'Register here to be certified as eligible to play D1/D2 college sports. Required for all prospective student-athletes.',
        tag: 'Required',
        tagColor: 'bg-red-600 text-white',
      },
    ],
  },
  {
    category: 'Professional Tours',
    color: 'border-amber-400',
    headerBg: 'bg-amber-50',
    items: [
      {
        name: 'ATP Tour',
        url: 'https://www.atptour.com',
        desc: 'Official men\'s professional tennis tour. Rankings, tournament draws, player profiles, and match stats.',
        tag: 'ATP',
        tagColor: 'bg-green-700 text-white',
      },
      {
        name: 'WTA Tour',
        url: 'https://www.wtatennis.com',
        desc: 'Official women\'s professional tennis tour. Rankings, tournament draws, player profiles, and match stats.',
        tag: 'WTA',
        tagColor: 'bg-pink-600 text-white',
      },
      {
        name: 'ITF Junior Rankings',
        url: 'https://www.itftennis.com/en/players/junior/rankings/',
        desc: 'International Tennis Federation junior world rankings. Target for players aiming to turn pro directly from juniors.',
        tag: 'Juniors',
        tagColor: 'bg-orange-600 text-white',
      },
    ],
  },
]

const COLLEGE_TIMELINE = [
  {
    age: '8–12',
    phase: 'Build the Foundation',
    color: 'bg-sky-500',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-300',
    bgLight: 'bg-sky-50',
    utr: 'UTR 1–6',
    milestones: [
      'Learn proper technique — forehand, backhand, serve, volley',
      'Enter USTA Junior tournaments in your section',
      'Work with a coach consistently',
      'Focus on fun and love of the game',
    ],
    tip: 'Consistency and enjoyment at this stage matter more than winning.',
  },
  {
    age: '13–14',
    phase: 'Build Your Rating',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    bgLight: 'bg-emerald-50',
    utr: 'UTR 6–10',
    milestones: [
      'Create a UTR Sports profile — coaches look at this',
      'Compete in USTA 14s/16s sectional tournaments',
      'Attend ITF or national junior tournaments',
      'Start tracking your stats and match history',
    ],
    tip: 'A UTR of 10+ opens doors to many D1 programs. Top D1 programs look for UTR 12–14+.',
  },
  {
    age: '15',
    phase: 'Start the Recruiting Process',
    color: 'bg-violet-500',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-300',
    bgLight: 'bg-violet-50',
    utr: 'UTR 10–12',
    milestones: [
      'Research 20–30 college programs that fit your level and interests',
      'Create a recruiting profile on TennisRecruiting.net',
      'Send introductory emails to coaches with video highlights',
      'Attend college tennis camps for exposure',
      'Register with the NCAA Eligibility Center',
    ],
    tip: 'NCAA rules allow coaches to email/text you once you\'re in 9th grade. Reach out first — coaches appreciate it.',
  },
  {
    age: '16',
    phase: 'Official Visits & Narrowing Down',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    bgLight: 'bg-amber-50',
    utr: 'UTR 12–14',
    milestones: [
      'Take official and unofficial campus visits',
      'Compete in ITA Regional events for college coach visibility',
      'Respond to scholarship offers and compare packages',
      'Talk to current players on teams you\'re considering',
      'Maintain strong GPA — academic requirements matter for D1',
    ],
    tip: 'You get 5 official paid visits (D1 rules). Use them wisely — unofficial visits are unlimited.',
  },
  {
    age: '17',
    phase: 'Commit & Sign',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    bgLight: 'bg-orange-50',
    utr: 'UTR 13–15',
    milestones: [
      'Verbal commitment (non-binding — can be made any time)',
      'National Letter of Intent (NLI) signing period: November (early) or April',
      'Finalize financial aid and scholarship details',
      'Continue competing to maintain/improve your ranking',
    ],
    tip: 'A verbal commit is not binding for either side. The NLI signing period is when it becomes official.',
  },
  {
    age: '18+',
    phase: 'D1 College Tennis',
    color: 'bg-green-600',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    bgLight: 'bg-green-50',
    utr: 'UTR 14–16+',
    milestones: [
      'Compete for your college team (fall season: ITA events; spring: conference + NCAA)',
      'NCAA D1 scholarships can cover up to 100% of costs (4.5 scholarships per team)',
      'Dual matches, ITA Regionals/Nationals, NCAA Championships',
      'Balance academics and athletics with team support',
    ],
    tip: 'The D1 season is April–May. Fall is for development tournaments. Use all 4 years (5 with redshirt) wisely.',
  },
]

const PRO_TIMELINE = [
  {
    phase: 'Junior Development',
    ageRange: 'Ages 8–14',
    icon: '🌱',
    color: 'bg-sky-500',
    bgLight: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
    steps: [
      'USTA Junior tournaments (10s, 12s, 14s)',
      'USTA sectional and national championships',
      'Build UTR rating and USTA national ranking',
      'Focus on all-around development',
    ],
    goal: 'Build technical foundation and competitive experience',
  },
  {
    phase: 'Advanced Junior',
    ageRange: 'Ages 15–17',
    icon: '⭐',
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    steps: [
      'USTA 18s Nationals — top benchmark event',
      'ITF Junior Circuit (Grade 1–5 events worldwide)',
      'Build ITF Junior World Ranking (target top 100)',
      'Orange Bowl, Eddie Herr, other Grade A events',
    ],
    goal: 'Break into ITF Junior Top 50 to attract pro support',
  },
  {
    phase: 'Decision Point',
    ageRange: 'Age 17–18',
    icon: '🔀',
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    steps: [
      'College Route: D1 scholarship → turn pro at 21–22 with team, network, and maturity',
      'Direct Pro Route: Skip college → ITF Futures circuit immediately',
      'Hybrid: 1–2 years college → leave early to turn pro',
      'Factors: ranking, financial backing, physical readiness, support team',
    ],
    goal: 'Choose the path that gives you the best chance at a professional career',
    isDecision: true,
  },
  {
    phase: 'ITF Futures / $15K–$25K Events',
    ageRange: 'Ages 18–21',
    icon: '🎾',
    color: 'bg-violet-500',
    bgLight: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    steps: [
      'Entry level of professional tennis',
      'Prize money: $15,000–$25,000 per tournament',
      'Win matches to earn ATP/WTA ranking points',
      'Travel heavy — mostly domestic and regional events',
    ],
    goal: 'Break into ATP/WTA rankings (target Top 500)',
  },
  {
    phase: 'ATP Challenger / WTA 125',
    ageRange: 'Ages 20–24',
    icon: '🔥',
    color: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    steps: [
      'Mid-tier pro circuit — one step below the main tour',
      'Prize money: $50K–$200K per event',
      'Ranked ATP Top 250 / WTA Top 150 to compete regularly',
      'Where most careers are made or broken',
    ],
    goal: 'Break into ATP Top 100 / WTA Top 100 to access main draws',
  },
  {
    phase: 'ATP / WTA Main Tour',
    ageRange: 'Ages 22+',
    icon: '🏆',
    color: 'bg-green-600',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    steps: [
      'ATP 250, 500, 1000 / WTA 250, 500, 1000 events',
      'Direct entry to Grand Slams (US Open, Wimbledon, Roland Garros, AO)',
      'ATP Top 100: earn $500K+ per year in prize money',
      'Team: coach, physiotherapist, fitness trainer, agent',
    ],
    goal: 'Sustain a top ranking, win titles, compete at Grand Slams',
  },
  {
    phase: 'Grand Slam Contender',
    ageRange: 'Elite Level',
    icon: '👑',
    color: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    steps: [
      'ATP Top 20 / WTA Top 20 — elite tier',
      'Grand Slams: Australian Open, Roland Garros, Wimbledon, US Open',
      'Davis Cup / Billie Jean King Cup — national team competition',
      'Olympic Games — pinnacle of national representation',
    ],
    goal: 'Compete for Grand Slams and cement a legacy in the sport',
  },
]

function PlayerCard({ player }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className={`bg-gradient-to-br ${player.bg} p-5 text-white`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-2xl mr-2">{player.flag}</span>
            <span className="text-xs font-medium opacity-80">{player.country}</span>
          </div>
          <span className="text-3xl font-black opacity-20">#{player.ranking}</span>
        </div>
        <h3 className="text-lg font-bold leading-tight">{player.name}</h3>
        <p className="text-xs opacity-80 mt-0.5">{player.style}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4">
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{player.bio}</p>
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Key Titles</p>
          <p className="text-xs text-gray-700 dark:text-gray-200">{player.titles}</p>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${player.accent}`}>
            Ranking #{player.ranking} in the world
          </span>
          <a
            href={player.wiki}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            Wikipedia →
          </a>
        </div>
      </div>
    </div>
  )
}

function ResourceCard({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-green-700 transition-colors">{item.name}</h4>
        <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${item.tagColor}`}>{item.tag}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
      <p className="text-xs text-green-600 mt-2 group-hover:underline">{item.url}</p>
    </a>
  )
}

function CollegeTimeline() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

      <div className="space-y-4">
        {COLLEGE_TIMELINE.map((step, i) => (
          <div key={i} className="relative sm:pl-16">
            {/* Circle marker */}
            <div className={`hidden sm:flex absolute left-0 top-4 w-12 h-12 rounded-full ${step.color} text-white items-center justify-center font-bold text-xs text-center leading-tight shadow-md`}>
              {step.age.split('–')[0]}
            </div>

            <div
              className={`border ${step.borderColor} ${step.bgLight} rounded-xl overflow-hidden cursor-pointer`}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`sm:hidden text-xs font-bold px-2 py-1 rounded-full text-white ${step.color}`}>
                    {step.age}
                  </span>
                  <div>
                    <h3 className={`font-bold text-sm ${step.textColor}`}>{step.phase}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Age {step.age} · <span className="font-semibold">{step.utr}</span></p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{openIndex === i ? '▲' : '▼'}</span>
              </div>

              {openIndex === i && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <ul className="mt-3 space-y-1.5">
                    {step.milestones.map((m, j) => (
                      <li key={j} className="flex gap-2 text-xs text-gray-700 dark:text-gray-200">
                        <span className={`${step.textColor} font-bold mt-0.5 shrink-0`}>✓</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-3 p-3 rounded-lg ${step.bgLight} border ${step.borderColor}`}>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Coach Tip</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{step.tip}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProJourney() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="space-y-3">
      {PRO_TIMELINE.map((step, i) => (
        <div
          key={i}
          className={`border ${step.borderColor} rounded-xl overflow-hidden cursor-pointer`}
          onClick={() => setOpenIndex(openIndex === i ? null : i)}
        >
          <div className={`p-4 ${step.bgLight} flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-lg shadow-sm shrink-0`}>
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-bold text-sm ${step.textColor}`}>{step.phase}</h3>
                  {step.isDecision && (
                    <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded">Decision Point</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.ageRange}</p>
              </div>
            </div>
            <span className="text-gray-400 text-sm shrink-0">{openIndex === i ? '▲' : '▼'}</span>
          </div>

          {openIndex === i && (
            <div className="px-4 pb-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <ul className="mt-3 space-y-1.5">
                {step.steps.map((s, j) => (
                  <li key={j} className="flex gap-2 text-xs text-gray-700 dark:text-gray-200">
                    <span className={`${step.textColor} font-bold shrink-0`}>→</span>
                    {s}
                  </li>
                ))}
              </ul>
              <div className={`mt-3 p-3 rounded-lg ${step.bgLight} border ${step.borderColor}`}>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Goal</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{step.goal}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('players')

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-6 mb-6 text-white shadow-md">
        <h1 className="text-3xl font-black tracking-tight">TennisApp</h1>
        <p className="text-green-100 mt-1 text-sm">
          Track your matches, explore the world of tennis, and plan your journey — from first rally to Grand Slam.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Players & Schedules</span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Score Tracking</span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Expense Management</span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Match History</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-green-700 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Featured Players */}
      {activeTab === 'players' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">ATP — Men's Top 5</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">The best men's players competing on the ATP Tour right now</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {ATP_PLAYERS.map(p => <PlayerCard key={p.name} player={p} />)}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">WTA — Women's Top 5</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">The best women's players competing on the WTA Tour right now</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WTA_PLAYERS.map(p => <PlayerCard key={p.name} player={p} />)}
          </div>
        </div>
      )}

      {/* Tab: College Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-8">
          {RESOURCES.map(section => (
            <div key={section.category}>
              <div className={`border-l-4 ${section.color} pl-3 mb-4`}>
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{section.category}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {section.items.map(item => <ResourceCard key={item.name} item={item} />)}
              </div>
            </div>
          ))}

          {/* Quick tip box */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="font-bold text-green-800 text-sm mb-2">Quick Recruiting Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                'Create UTR Sports profile (free)',
                'Register on TennisRecruiting.net',
                'Register with NCAA Eligibility Center',
                'Film a 2–3 min highlight video',
                'Write a recruiting email template',
                'Build a target list of 15–25 programs',
                'Research academic requirements at each school',
                'Attend at least one college tennis camp',
              ].map(item => (
                <div key={item} className="flex gap-2 text-xs text-green-800">
                  <span className="text-green-500 font-bold shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: College Path */}
      {activeTab === 'college' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">D1 College Tennis Pathway</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              A step-by-step roadmap from junior tennis to earning a D1 scholarship. Click each phase to expand.
            </p>
          </div>

          {/* UTR Quick Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-blue-800 text-sm mb-3">UTR Targets by D1 Tier</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { tier: 'Top 25 D1', utr: '14–16+', color: 'bg-green-600' },
                { tier: 'Top 25–75 D1', utr: '12–14', color: 'bg-blue-600' },
                { tier: 'Top 75–125 D1', utr: '10–12', color: 'bg-violet-600' },
                { tier: 'D1 Programs', utr: '8–10', color: 'bg-gray-600' },
              ].map(t => (
                <div key={t.tier} className="text-center">
                  <div className={`${t.color} text-white text-xs font-bold py-1.5 px-2 rounded-t-lg`}>{t.utr}</div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg py-1.5 px-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300">{t.tier}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3">* UTR = Universal Tennis Rating. Women's UTR targets are typically 2–3 points lower.</p>
          </div>

          <CollegeTimeline />
        </div>
      )}

      {/* Tab: My Colleges */}
      {activeTab === 'mycolleges' && <MyColleges />}

      {/* Tab: Pro Journey */}
      {activeTab === 'pro' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">The Tennis Journey — Junior to Pro</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              What it takes to go from picking up a racket to competing on the ATP or WTA Tour. Click each stage to learn more.
            </p>
          </div>

          {/* Fast facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'ATP Top 100 players', value: '~100', sub: 'out of millions who play' },
              { label: 'Average age turning pro', value: '18–20', sub: 'for top juniors' },
              { label: 'D1 → Pro success rate', value: '~5%', sub: 'of D1 players turn pro' },
              { label: 'Grand Slams per year', value: '4', sub: 'AO, RG, Wimbledon, USO' },
            ].map(f => (
              <div key={f.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center shadow-sm">
                <p className="text-xl font-black text-green-700">{f.value}</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-0.5">{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>

          <ProJourney />

          {/* Bottom note */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-bold text-amber-800 text-sm mb-2">Reality Check for Parents & Juniors</h3>
            <div className="space-y-1.5">
              {[
                'Only ~1% of college tennis players go on to have professional careers. The goal should be to love the sport and compete at the highest level you can enjoy.',
                'A D1 scholarship (even partial) can save $20,000–$60,000+ per year in tuition. The college route is often smarter than turning pro at 17.',
                'Physical and mental maturity matters. Many players peak at 22–25 on the ATP/WTA Tour. College gives time to develop both.',
                'The journey is the reward. Discipline, teamwork, resilience, and excellence — tennis teaches life skills that go far beyond the court.',
              ].map((note, i) => (
                <div key={i} className="flex gap-2 text-xs text-amber-900">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
