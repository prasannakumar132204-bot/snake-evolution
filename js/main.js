/**
 * SNAKE EVOLUTION - Main Entry Point
 * Initializes the game and UI
 */

import { Game } from './game.js';
import { UIController } from './ui.js';
import { GAME_STATES } from './constants.js';

// ========================================
// Initialize Game
// ========================================

let game = null;
let ui = null;

async function init() {
    // Get canvas elements
    const canvas = document.getElementById('game-canvas');
    const particleCanvas = document.getElementById('particle-canvas');
    const bgCanvas = document.getElementById('bg-canvas');
    
    if (!canvas || !particleCanvas || !bgCanvas) {
        console.error('Canvas elements not found!');
        return;
    }
    
    // Create game instance
    game = new Game(canvas, particleCanvas, bgCanvas);
    
    // Create UI controller
    ui = new UIController(game);
    
    // Make globally accessible for debugging
    window.snakeGame = game;
    window.snakeUI = ui;
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.getState() === GAME_STATES.PLAYING) {
            game.pause();
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            game.resize();
            ui.checkMobileControls();
        }, 100);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        game.resize();
        ui.checkMobileControls();
    });
    
    // Preload audio on first interaction
    document.addEventListener('click', () => {
        import('./audio.js').then(({ initAudio }) => initAudio());
    }, { once: true });
    
    document.addEventListener('keydown', () => {
        import('./audio.js').then(({ initAudio }) => initAudio());
    }, { once: true });
    
    console.log('Snake Evolution initialized!');
    
    // Show start screen
    ui.showScreen('start');
}

// ========================================
// Error Handling
// ========================================

window.addEventListener('error', (e) => {
    console.error('Game error:', e.error);
    
    // Try to recover
    if (game && game.getState() === GAME_STATES.PLAYING) {
        game.pause();
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ========================================
// Start
// ========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========================================
// Export for modules
// ========================================

export { game, ui };