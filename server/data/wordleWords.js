// Tennis Boggle Word Dictionary
// Flat list of all valid tennis-related words (3+ letters)
// Used for grid generation and word validation

const dictionary = [
  // === 3-letter words ===
  'ACE', 'LET', 'SET', 'LOB', 'NET', 'OUT', 'GUT', 'RUN', 'HIT', 'WIN',
  'CUP', 'TIE', 'TOP', 'ADS', 'BAG', 'BOX', 'CUT', 'DIP', 'END',

  // === 4-letter words ===
  'LOVE', 'CLAY', 'DROP', 'SPIN', 'SEED', 'DRAW', 'FLAT', 'GRIP', 'HOLD',
  'KICK', 'LINE', 'WIDE', 'GAME', 'BALL', 'LOBS', 'PASS', 'CHIP', 'TAPE',
  'PACE', 'HARD', 'CORD', 'SETS', 'NETS', 'ACES', 'LETS', 'WINS', 'HITS',
  'LOFT', 'SHOT', 'TOUR', 'SLAM', 'RANK', 'TOSS', 'ZONE', 'FOOT', 'HAND',
  'BACK', 'FORE', 'HALF', 'OPEN', 'PLAY', 'PAIR', 'OVAL', 'CUPS', 'CLAY',
  'SPIN', 'EDGE', 'FADE', 'FELT', 'FOUL', 'HAWK', 'HEEL', 'JUMP', 'KNEE',
  'LOOP', 'MISS', 'PACE', 'RACK', 'RUSH', 'SAVE', 'SEAL', 'SWAP', 'TEAM',
  'TURN', 'WHIP',

  // === 5-letter words ===
  'SERVE', 'DEUCE', 'RALLY', 'MATCH', 'FAULT', 'COURT', 'SLICE', 'BREAK',
  'SMASH', 'SWING', 'COACH', 'LINES', 'POINT', 'GRASS', 'MIXED', 'CROSS',
  'CHAIR', 'GAMES', 'BALLS', 'SHOTS', 'DRIVE', 'TITLE', 'ROUND', 'FINAL',
  'SCORE', 'TURNS', 'PLAYS', 'GRAND', 'SEEDS', 'SPINS', 'GRIPS', 'DROPS',
  'CHIPS', 'BLOCK', 'ANGLE', 'POWER', 'TOUCH', 'FRAME', 'HEADS', 'SETUP',
  'REACH', 'SPLIT', 'BLADE', 'BANDS', 'TRACK', 'SPEED', 'TRAIN', 'SWIPE',
  'SWEEP', 'CATCH', 'CURVE', 'DRIFT', 'LEVEL', 'MARKS', 'PAINT', 'PIVOT',
  'PRESS', 'TEAMS', 'TWIST', 'UNDER', 'VIGOR',

  // === 6-letter words ===
  'VOLLEY', 'RACKET', 'DOUBLE', 'RETURN', 'WINNER', 'UMPIRE', 'PUSHER',
  'TENNIS', 'GROUND', 'SINGLE', 'SERVES', 'FAULTS', 'COURTS', 'SCORES',
  'SLICES', 'BREAKS', 'POINTS', 'ROUNDS', 'FINALS', 'DRIVES', 'TITLES',
  'TROPHY', 'SMACKS', 'RECORD', 'STRING', 'PLAYER', 'STROKE', 'RUBBER',
  'JUNIOR', 'SENIOR', 'LADDER', 'LEAGUE', 'SEASON', 'SWITCH', 'TARGET',
  'HANDLE', 'BOUNCE', 'TUMBLE', 'CORNER',

  // === 7+ letter words ===
  'TOPSPIN', 'DROPSHOT', 'FOREHAND', 'BACKHAND', 'BASELINE', 'APPROACH',
  'TIEBREAK', 'VOLLEYS', 'RACKETS', 'DOUBLES', 'RETURNS', 'WINNERS',
  'SERVICE', 'SERVERS', 'PLAYERS', 'STROKES', 'MATCHES', 'RALLIES',
  'OVERHAND', 'PASSING', 'NETTING', 'SERVING', 'SCORING', 'SEEDING',
  'RANKING', 'SMASHES', 'COACHING', 'TRAINING', 'SPINNING', 'SLICING',
  'GRIPPING', 'LOBBING', 'CHIPPING', 'DRIVING', 'HITTING', 'PLAYING',
  'BOUNCING', 'SWINGING',
]

// Remove duplicates and sort
const wordSet = new Set(dictionary.map(w => w.toUpperCase()))
const allWords = [...wordSet].sort()

// Index by length for quick lookup
const wordsByLength = {}
for (const word of allWords) {
  const len = word.length
  if (!wordsByLength[len]) wordsByLength[len] = []
  wordsByLength[len].push(word)
}

// Short words used for embedding into the grid (3-5 letters work best)
const embeddableWords = allWords.filter(w => w.length >= 3 && w.length <= 6)

module.exports = { allWords, wordSet, wordsByLength, embeddableWords }
