/**
 * SNAKE EVOLUTION - Game Constants
 * Centralized configuration for easy tuning
 */

// ========================================
// Game Configuration
// ========================================
export const GAME_CONFIG = {
    // Grid
    GRID_SIZE: 20,
    INITIAL_SPEED: 150,        // ms per tick
    MIN_SPEED: 50,             // fastest speed
    SPEED_INCREMENT: 2,        // ms faster per food
    
    // Snake
    INITIAL_LENGTH: 3,
    MAX_LENGTH: 500,
    INITIAL_DIRECTION: 'right',
    
    // Evolution
    EVOLUTION_THRESHOLDS: [10, 25, 50, 80, 120, 170, 230, 300, 380, 470], // score thresholds
    EVOLUTION_SPEED_BONUS: 5,  // ms faster per evolution
    EVOLUTION_BOOST_BONUS: 0.15, // boost recharge rate increase
    
    // Boost
    INITIAL_BOOST: 100,        // boost meter (0-100)
    BOOST_COST: 25,            // cost per boost use
    BOOST_RECHARGE_RATE: 0.8,  // per tick
    BOOST_SPEED_MULTIPLIER: 2.5,
    BOOST_DURATION: 3,         // ticks
    
    // Scoring
    BASE_FOOD_POINTS: 10,
    COMBO_MULTIPLIER: 1.5,
    COMBO_WINDOW: 2000,        // ms
    EVOLUTION_BONUS: 500,
    
    // Food
    FOOD_SPAWN_DELAY: 0,       // instant spawn
    MAX_FOOD_TYPES: 5,
    SPECIAL_FOOD_CHANCE: 0.15, // 15% chance for special food
    GOLDEN_FOOD_CHANCE: 0.03,  // 3% chance for golden food
    
    // Power-ups
    POWERUP_SPAWN_CHANCE: 0.08,
    POWERUP_DURATION: 5000,    // ms
    
    // Particles
    PARTICLE_COUNT_EAT: 12,
    PARTICLE_COUNT_EVOLVE: 30,
    PARTICLE_COUNT_BOOST: 8,
    PARTICLE_COUNT_DEATH: 40,
    PARTICLE_LIFETIME: 800,    // ms
    
    // Visual
    CELL_PADDING: 1,           // px between cells
    SNAKE_BORDER_RADIUS: 3,
    FOOD_PULSE_SPEED: 3,
    
    // Difficulty scaling
    DIFFICULTY_RAMP: 0.0005,   // speed increase per point
};

// ========================================
// Direction Vectors
// ========================================
export const DIRECTIONS = {
    up: { x: 0, y: -1, angle: -Math.PI / 2, opposite: 'down' },
    down: { x: 0, y: 1, angle: Math.PI / 2, opposite: 'up' },
    left: { x: -1, y: 0, angle: Math.PI, opposite: 'right' },
    right: { x: 1, y: 0, angle: 0, opposite: 'left' },
};

export const DIR_KEYS = ['up', 'down', 'left', 'right'];

// ========================================
// Food Types
// ========================================
export const FOOD_TYPES = {
    normal: {
        id: 'normal',
        name: 'Normal',
        color: '#00ff88',
        glowColor: 'rgba(0, 255, 136, 0.6)',
        points: 10,
        lengthGain: 1,
        probability: 0.7,
        effect: null,
    },
    speed: {
        id: 'speed',
        name: 'Speed',
        color: '#00d4ff',
        glowColor: 'rgba(0, 212, 255, 0.6)',
        points: 15,
        lengthGain: 1,
        probability: 0.1,
        effect: 'speed_boost',
        effectDuration: 3000,
    },
    shield: {
        id: 'shield',
        name: 'Shield',
        color: '#ffaa00',
        glowColor: 'rgba(255, 170, 0, 0.6)',
        points: 20,
        lengthGain: 1,
        probability: 0.08,
        effect: 'shield',
        effectDuration: 5000,
    },
    shrink: {
        id: 'shrink',
        name: 'Shrink',
        color: '#ff3366',
        glowColor: 'rgba(255, 51, 102, 0.6)',
        points: 25,
        lengthGain: -2, // reduces length
        probability: 0.05,
        effect: 'shrink',
        effectDuration: 0,
    },
    golden: {
        id: 'golden',
        name: 'Golden',
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.8)',
        points: 100,
        lengthGain: 3,
        probability: 0.02,
        effect: 'score_multiplier',
        effectDuration: 10000,
    },
};

// Food type array for weighted random selection
export const FOOD_TYPE_ARRAY = Object.values(FOOD_TYPES);

// ========================================
// Power-up Types
// ========================================
export const POWERUP_TYPES = {
    magnet: {
        id: 'magnet',
        name: 'Magnet',
        icon: '🧲',
        color: '#ff6b35',
        duration: 5000,
        description: 'Attracts nearby food',
    },
    slowmo: {
        id: 'slowmo',
        name: 'Slow Motion',
        icon: '⏱',
        color: '#00d4ff',
        duration: 5000,
        description: 'Slows game speed by 50%',
    },
    ghost: {
        id: 'ghost',
        name: 'Ghost Mode',
        icon: '👻',
        color: '#bb86fc',
        duration: 5000,
        description: 'Pass through walls once',
    },
    double: {
        id: 'double',
        name: 'Double Points',
        icon: '2×',
        color: '#ffd700',
        duration: 10000,
        description: 'Doubles all points',
    },
};

// ========================================
// Evolution Stages
// ========================================
export const EVOLUTION_STAGES = [
    { level: 1, name: 'Hatchling', color: '#00ff88', glow: 'rgba(0, 255, 136, 0.5)', ability: 'none' },
    { level: 2, name: 'Serpent', color: '#00d4ff', glow: 'rgba(0, 212, 255, 0.5)', ability: 'dash' },
    { level: 3, name: 'Viper', color: '#00ffaa', glow: 'rgba(0, 255, 170, 0.5)', ability: 'dash' },
    { level: 4, name: 'Cobra', color: '#88ff00', glow: 'rgba(136, 255, 0, 0.5)', ability: 'dash' },
    { level: 5, name: 'Python', color: '#aaff00', glow: 'rgba(170, 255, 0, 0.5)', ability: 'shield' },
    { level: 6, name: 'Anaconda', color: '#ccff00', glow: 'rgba(204, 255, 0, 0.5)', ability: 'shield' },
    { level: 7, name: 'Basilisk', color: '#eeff00', glow: 'rgba(238, 255, 0, 0.5)', ability: 'ghost' },
    { level: 8, name: 'Hydra', color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.5)', ability: 'ghost' },
    { level: 9, name: 'Dragon', color: '#ff6b35', glow: 'rgba(255, 107, 53, 0.5)', ability: 'magnet' },
    { level: 10, name: 'LEVIATHAN', color: '#ff3366', glow: 'rgba(255, 51, 102, 0.5)', ability: 'all' },
];

// ========================================
// Color Palette (for dynamic theming)
// ========================================
export const COLOR_PALETTE = {
    // Snake body colors per evolution
    snakeColors: [
        ['#00ff88', '#00cc6a', '#009950'],      // 1: Green
        ['#00d4ff', '#00aacc', '#008099'],      // 2: Cyan
        ['#00ffaa', '#00cc88', '#009966'],      // 3: Mint
        ['#88ff00', '#66cc00', '#4d9900'],      // 4: Lime
        ['#aaff00', '#88cc00', '#669900'],      // 5: Yellow-Green
        ['#ccff00', '#aaaa00', '#808000'],      // 6: Yellow
        ['#eeff00', '#cccc00', '#999900'],      // 7: Bright Yellow
        ['#ffaa00', '#cc8800', '#996600'],      // 8: Orange
        ['#ff6b35', '#cc552a', '#994020'],      // 9: Red-Orange
        ['#ff3366', '#cc2952', '#991f3d'],      // 10: Red-Pink
    ],
    
    // Background gradients per evolution
    bgGradients: [
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0, 212, 255, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 212, 255, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0, 255, 170, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 255, 170, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(136, 255, 0, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(136, 255, 0, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(170, 255, 0, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(170, 255, 0, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(204, 255, 0, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(204, 255, 0, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(238, 255, 0, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(238, 255, 0, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255, 170, 0, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 170, 0, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255, 107, 53, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 107, 53, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255, 51, 102, 0.06) 0%, transparent 60%)',
        'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 51, 102, 0.1) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255, 0, 80, 0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(255, 51, 102, 0.08) 0%, transparent 50%)',
    ],
};

// ========================================
// Audio Configuration
// ========================================
export const AUDIO_CONFIG = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    enabled: true,
    
    // Generated tone frequencies (Hz)
    tones: {
        eat: [523.25, 659.25, 783.99],      // C5, E5, G5
        evolve: [261.63, 329.63, 392.00, 523.25, 659.25], // C4, E4, G4, C5, E5
        boost: [880, 1108.73, 1318.51],      // A5, C#6, E6
        gameover: [220, 174.61, 146.83, 110], // A3, F3, D3, A2
        click: [1046.50],                     // C6
        powerup: [783.99, 1046.50, 1318.51],  // G5, C6, E6
    },
};

// ========================================
// Storage Keys
// ========================================
export const STORAGE_KEYS = {
    HIGH_SCORE: 'snake_evolution_high_score',
    STATS: 'snake_evolution_stats',
    SETTINGS: 'snake_evolution_settings',
    BEST_LENGTH: 'snake_evolution_best_length',
    TOTAL_EVOLUTIONS: 'snake_evolution_total_evolutions',
};

// ========================================
// Default Stats
// ========================================
export const DEFAULT_STATS = {
    gamesPlayed: 0,
    totalScore: 0,
    bestLength: 3,
    totalEvolutions: 0,
    totalFoodEaten: 0,
    totalPlayTime: 0,
    bestEvolution: 1,
};

// ========================================
// Game States
// ========================================
export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
};

// ========================================
// Event Names
// ========================================
export const EVENTS = {
    GAME_START: 'game:start',
    GAME_OVER: 'game:over',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    SCORE_UPDATE: 'score:update',
    EVOLUTION: 'evolution:change',
    FOOD_EATEN: 'food:eaten',
    BOOST_USED: 'boost:used',
    POWERUP_COLLECTED: 'powerup:collected',
    HIGH_SCORE: 'highscore:new',
};