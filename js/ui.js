/**
 * SNAKE EVOLUTION - UI Controller
 * Manages all UI screens, HUD, and user interactions
 */

import { GAME_STATES, EVENTS, STORAGE_KEYS, EVOLUTION_STAGES, GAME_CONFIG } from './constants.js';
import { formatScore, formatTime, storageGet, storageSet, $, $$ } from './utils.js';
import { audio } from './audio.js';

// ========================================
// UI Controller
// ========================================

export class UIController {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTapTime = 0;
        this.keyDownHandler = null;
        this.keyUpHandler = null;
        this.touchStartHandler = null;
        this.touchMoveHandler = null;
        this.touchEndHandler = null;
        this.dpadHandlers = [];
        this.gameEventHandlers = [];
        
        this.cacheElements();
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.updateStatsDisplay();
        this.checkMobileControls();
    }
    
    cacheElements() {
        // Screens
        this.elements.startScreen = $('#start-screen');
        this.elements.controlsScreen = $('#controls-screen');
        this.elements.statsScreen = $('#stats-screen');
        this.elements.pauseOverlay = $('#pause-overlay');
        this.elements.gameOverOverlay = $('#game-over-overlay');
        
        // Buttons
        this.elements.btnStart = $('#btn-start');
        this.elements.btnControls = $('#btn-controls');
        this.elements.btnStats = $('#btn-stats');
        this.elements.btnBackFromControls = $('#btn-back-from-controls');
        this.elements.btnBackFromStats = $('#btn-back-from-stats');
        this.elements.btnResume = $('#btn-resume');
        this.elements.btnRestartPause = $('#btn-restart-pause');
        this.elements.btnQuitPause = $('#btn-quit-pause');
        this.elements.btnRestart = $('#btn-restart');
        this.elements.btnMenu = $('#btn-menu');
        
        // HUD - Updated for new structure
        this.elements.hud = $('#hud');
        this.elements.hudScore = $('#hud-score');
        this.elements.hudLength = $('#hud-length');
        this.elements.hudHighScore = $('#hud-highscore');
        this.elements.evolutionBar = $('#evolution-bar');
        this.elements.evolutionCurrent = $('#evolution-current');
        this.elements.evolutionNext = $('#evolution-next');
        this.elements.evolutionProgressText = $('#evolution-progress-text');
        this.elements.boostBar = $('#boost-bar');
        
        // Pause overlay
        this.elements.pauseScore = $('#pause-score');
        this.elements.pauseLength = $('#pause-length');
        this.elements.pauseEvolution = $('#pause-evolution');
        
        // Game over overlay
        this.elements.finalScore = $('#final-score');
        this.elements.finalLength = $('#final-length');
        this.elements.finalEvolution = $('#final-evolution');
        this.elements.finalTime = $('#final-time');
        this.elements.newRecord = $('#new-record');
        
        // Mobile controls
        this.elements.mobileControls = $('#mobile-controls');
        this.elements.dpadButtons = $$('.dpad-btn');
        
        // High score display
        this.elements.highScoreDisplay = $('#high-score');
        
        // Stats
        this.elements.statGames = $('#stat-games');
        this.elements.statTotalScore = $('#stat-total-score');
        this.elements.statBestLength = $('#stat-best-length');
        this.elements.statEvolutions = $('#stat-evolutions');
        this.elements.statFoodEaten = $('#stat-food-eaten');
        this.elements.statPlaytime = $('#stat-playtime');
    }
    
    bindEvents() {
        // Menu buttons
        this.addHandler(this.elements.btnStart, 'click', () => this.startGame());
        this.addHandler(this.elements.btnControls, 'click', () => this.showScreen('controls'));
        this.addHandler(this.elements.btnStats, 'click', () => this.showScreen('stats'));
        this.addHandler(this.elements.btnBackFromControls, 'click', () => this.showScreen('start'));
        this.addHandler(this.elements.btnBackFromStats, 'click', () => this.showScreen('start'));
        
        // Pause buttons
        this.addHandler(this.elements.btnResume, 'click', () => this.game.resume());
        this.addHandler(this.elements.btnRestartPause, 'click', () => this.restartGame());
        this.addHandler(this.elements.btnQuitPause, 'click', () => this.quitToMenu());
        
        // Game over buttons
        this.addHandler(this.elements.btnRestart, 'click', () => this.restartGame());
        this.addHandler(this.elements.btnMenu, 'click', () => this.quitToMenu());
        
        // Keyboard
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        // Touch for mobile
        const canvas = this.game.canvas;
        this.touchStartHandler = (e) => this.handleTouchStart(e);
        this.touchMoveHandler = (e) => this.handleTouchMove(e);
        this.touchEndHandler = (e) => this.handleTouchEnd(e);
        canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
        
        // Mobile D-pad
        this.elements.dpadButtons.forEach(btn => {
            const pressHandler = (e) => {
                e.preventDefault();
                this.handleDpadPress(btn.dataset.dir);
            };
            const releaseHandler = (e) => {
                e.preventDefault();
                this.handleDpadRelease(btn.dataset.dir);
            };
            const leaveHandler = () => this.handleDpadRelease(btn.dataset.dir);
            
            this.dpadHandlers.push({ btn, pressHandler, releaseHandler, leaveHandler });
            
            btn.addEventListener('touchstart', pressHandler, { passive: false });
            btn.addEventListener('touchend', releaseHandler, { passive: false });
            btn.addEventListener('mousedown', pressHandler);
            btn.addEventListener('mouseup', releaseHandler);
            btn.addEventListener('mouseleave', leaveHandler);
        });
        
        // Game event listeners
        this.gameEventHandlers.push(
            this.game.on(EVENTS.GAME_START + ':playing', () => this.onGameStart()),
            this.game.on(EVENTS.GAME_START + ':paused', () => this.onGamePause()),
            this.game.on(EVENTS.GAME_START + ':game_over', () => this.onGameOver()),
            this.game.on(EVENTS.GAME_START + ':menu', () => this.onGameMenu()),
            this.game.on(EVENTS.SCORE_UPDATE, (data) => this.updateHUD(data)),
            this.game.on(EVENTS.EVOLUTION, (data) => this.onEvolution(data)),
            this.game.on(EVENTS.HIGH_SCORE, (data) => this.onHighScore(data)),
            this.game.on(EVENTS.BOOST_USED, (data) => this.updateBoostBar(data))
        );
        
        // Game callbacks
        this.game.onStateChange = (state) => this.onStateChange(state);
        this.game.onScoreUpdate = (score, points, combo) => this.onScoreUpdate(score, points, combo);
        this.game.onHighScore = (score) => this.onNewHighScore(score);
        this.game.onEvolution = (level, stage) => this.onEvolutionUI(level, stage);
        this.game.onGameOver = (score, evolution, length, isNewRecord) => this.showGameOver(score, evolution, length, isNewRecord);
    }
    
    addHandler(element, event, handler, options) {
        if (!element) return;
        element.addEventListener(event, handler, options);
    }
    
    get canvas() {
        return this.game.canvas;
    }
    
    // ========================================
    // Screen Management
    // ========================================
    
    showScreen(screenName) {
        const screens = ['start', 'controls', 'stats'];
        screens.forEach(name => {
            const el = this.elements[`${name}Screen`];
            if (el) {
                el.classList.toggle('active', name === screenName);
            }
        });
        
        audio.playClick();
        
        if (screenName === 'stats') {
            this.updateStatsDisplay();
        }
    }
    
    hideAllScreens() {
        ['start', 'controls', 'stats'].forEach(name => {
            const el = this.elements[`${name}Screen`];
            if (el) el.classList.remove('active');
        });
    }
    
    // ========================================
    // Game Flow
    // ========================================
    
    startGame() {
        this.hideAllScreens();
        this.game.start();
    }
    
    restartGame() {
        this.hideOverlays();
        this.game.restart();
    }
    
    quitToMenu() {
        this.hideOverlays();
        this.hideAllScreens();
        this.showScreen('start');
        this.game.quit();
    }
    
    hideOverlays() {
        this.elements.pauseOverlay.classList.add('hidden');
        this.elements.gameOverOverlay.classList.add('hidden');
    }
    
    // ========================================
    // Event Handlers
    // ========================================
    
    handleKeyDown(e) {
        // Don't handle keys if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.code;
        
        switch (key) {
            case 'Space':
                e.preventDefault();
                this.game.handleKeyDown(key);
                break;
            case 'KeyP':
            case 'Escape':
                if (this.game.getState() === GAME_STATES.PLAYING) {
                    this.game.pause();
                } else if (this.game.getState() === GAME_STATES.PAUSED) {
                    this.game.resume();
                }
                break;
            default:
                this.game.handleKeyDown(key);
        }
    }
    
    handleKeyUp(e) {
        // Could handle key release if needed
    }
    
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            
            // Double tap detection for boost
            const now = Date.now();
            if (now - this.lastTapTime < 300) {
                this.game.handleTouchBoost();
            }
            this.lastTapTime = now;
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault(); // Prevent scrolling
    }
    
    handleTouchEnd(e) {
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            
            // Minimum swipe distance
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
            
            // Determine direction
            if (Math.abs(dx) > Math.abs(dy)) {
                this.game.handleTouchDirection(dx > 0 ? 'right' : 'left');
            } else {
                this.game.handleTouchDirection(dy > 0 ? 'down' : 'up');
            }
        }
    }
    
    handleDpadPress(dir) {
        if (dir === 'boost') {
            this.game.handleTouchBoost();
        } else {
            this.game.handleTouchDirection(dir);
            // Visual feedback
            const btn = $(`.dpad-btn[data-dir="${dir}"]`);
            if (btn) btn.classList.add('active');
        }
    }
    
    handleDpadRelease(dir) {
        if (dir !== 'boost') {
            const btn = $(`.dpad-btn[data-dir="${dir}"]`);
            if (btn) btn.classList.remove('active');
        }
    }
    
    // ========================================
    // Game State Callbacks
    // ========================================
    
    onStateChange(state) {
        switch (state) {
            case GAME_STATES.PLAYING:
                this.onGameStart();
                break;
            case GAME_STATES.PAUSED:
                this.onGamePause();
                break;
            case GAME_STATES.GAME_OVER:
                this.onGameOver();
                break;
            case GAME_STATES.MENU:
                this.onGameMenu();
                break;
        }
    }
    
    onGameStart() {
        this.hideAllScreens();
        this.hideOverlays();
        this.elements.hud.classList.remove('hidden');
        this.checkMobileControls();
        this.updateHUD({ score: 0, points: 0, combo: 0 });
    }
    
    onGamePause() {
        this.elements.pauseOverlay.classList.remove('hidden');
        this.updatePauseInfo();
    }
    
    onGameOver() {
        // Handled by showGameOver callback
    }
    
    onGameMenu() {
        this.hideAllScreens();
        this.hideOverlays();
        this.elements.hud.classList.add('hidden');
        this.elements.mobileControls.classList.add('hidden');
        this.showScreen('start');
        this.updateHighScoreDisplay();
        this.updateStatsDisplay();
    }
    
    // ========================================
    // HUD Updates
    // ========================================
    
    updateHUD(data) {
        this.elements.hudScore.textContent = formatScore(data.score);
        this.elements.hudLength.textContent = this.game.getLength();
        this.elements.hudHighScore.textContent = formatScore(this.game.getHighScore());
        
        // Evolution bar
        const progress = this.game.getEvolutionProgress();
        this.elements.evolutionBar.style.setProperty('--progress', `${progress * 100}%`);
        
        // Evolution level display
        const currentLevel = this.game.getEvolutionLevel();
        this.elements.evolutionCurrent.textContent = `EVOLUTION ${currentLevel}`;
        
        // Next evolution name
        if (currentLevel < EVOLUTION_STAGES.length) {
            const nextStage = EVOLUTION_STAGES[currentLevel];
            this.elements.evolutionNext.textContent = nextStage.name.toUpperCase();
            this.elements.evolutionNext.classList.remove('hidden');
        } else {
            this.elements.evolutionNext.textContent = 'MAX LEVEL';
            this.elements.evolutionNext.classList.remove('hidden');
        }
        
        // Progress text (current / next threshold)
        const currentThreshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[currentLevel - 1] || 0;
        const nextThreshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[currentLevel] || currentThreshold;
        this.elements.evolutionProgressText.textContent = `${data.score} / ${nextThreshold}`;
        
        // Boost bar
        this.updateBoostBar({
            boost: this.game.getBoost(),
            maxBoost: this.game.getMaxBoost()
        });
    }
    
    updateBoostBar(data) {
        const percent = (data.boost / data.maxBoost) * 100;
        this.elements.boostBar.style.width = `${percent}%`;
        
        if (data.boost < 25) {
            this.elements.boostBar.classList.add('depleted');
        } else {
            this.elements.boostBar.classList.remove('depleted');
        }
    }
    
    updatePauseInfo() {
        this.elements.pauseScore.textContent = formatScore(this.game.getScore());
        this.elements.pauseLength.textContent = this.game.getLength();
        this.elements.pauseEvolution.textContent = this.game.getEvolutionLevel();
    }
    
    // ========================================
    // Game Over
    // ========================================
    
    showGameOver(score, evolution, length, isNewRecord) {
        this.elements.finalScore.textContent = formatScore(score);
        this.elements.finalLength.textContent = length;
        this.elements.finalEvolution.textContent = evolution;
        this.elements.finalTime.textContent = formatTime(this.game.getGameTime());
        
        this.elements.newRecord.classList.toggle('hidden', !isNewRecord);
        
        this.elements.gameOverOverlay.classList.remove('hidden');
        this.elements.hud.classList.add('hidden');
        this.elements.mobileControls.classList.add('hidden');
    }
    
    // ========================================
    // Evolution UI
    // ========================================
    
    onEvolution(data) {
        // Flash evolution level
        this.elements.evolutionCurrent.textContent = `EVOLUTION ${data.level}`;
        this.elements.evolutionCurrent.classList.add('evolved');
        setTimeout(() => {
            this.elements.evolutionCurrent.classList.remove('evolved');
        }, 500);
        
        // Update next evolution label
        if (data.level < EVOLUTION_STAGES.length) {
            const nextStage = EVOLUTION_STAGES[data.level];
            this.elements.evolutionNext.textContent = nextStage.name.toUpperCase();
        }
    }
    
    onEvolutionUI(level, stage) {
        // Could add special effects here
    }
    
    // ========================================
    // High Score & Stats
    // ========================================
    
    onHighScore(data) {
        this.elements.highScoreDisplay.textContent = formatScore(data.score);
    }
    
    onNewHighScore(score) {
        this.elements.highScoreDisplay.textContent = formatScore(score);
        this.elements.hudHighScore.textContent = formatScore(score);
    }
    
    updateHighScoreDisplay() {
        this.elements.highScoreDisplay.textContent = formatScore(this.game.getHighScore());
        this.elements.hudHighScore.textContent = formatScore(this.game.getHighScore());
    }
    
    updateStatsDisplay() {
        const stats = this.game.getStats();
        this.elements.statGames.textContent = stats.gamesPlayed;
        this.elements.statTotalScore.textContent = formatScore(stats.totalScore);
        this.elements.statBestLength.textContent = stats.bestLength;
        this.elements.statEvolutions.textContent = stats.totalEvolutions;
        this.elements.statFoodEaten.textContent = stats.totalFoodEaten || 0;
        this.elements.statPlaytime.textContent = formatTime(stats.totalPlayTime);
    }
    
    onScoreUpdate(score, points, combo) {
        // Could show floating combo text here
    }
    
    // ========================================
    // Mobile Controls
    // ========================================
    
    checkMobileControls() {
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        this.elements.mobileControls.classList.toggle('hidden', !isMobile);
    }
    
    // ========================================
    // Settings UI (for future settings screen)
    // ========================================
    
    updateSetting(key, value) {
        this.game.updateSetting(key, value);
    }
    
    // ========================================
    // Cleanup
    // ========================================
    
    destroy() {
        // Remove all event listeners
        if (this.keyDownHandler) document.removeEventListener('keydown', this.keyDownHandler);
        if (this.keyUpHandler) document.removeEventListener('keyup', this.keyUpHandler);
        if (this.touchStartHandler) this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        if (this.touchMoveHandler) this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        if (this.touchEndHandler) this.canvas.removeEventListener('touchend', this.touchEndHandler);
        
        // D-pad handlers
        this.dpadHandlers.forEach(({ btn, pressHandler, releaseHandler, leaveHandler }) => {
            btn.removeEventListener('touchstart', pressHandler);
            btn.removeEventListener('touchend', releaseHandler);
            btn.removeEventListener('mousedown', pressHandler);
            btn.removeEventListener('mouseup', releaseHandler);
            btn.removeEventListener('mouseleave', leaveHandler);
        });
        
        // Game event handlers
        this.gameEventHandlers.forEach(handler => this.game.off(handler));
        this.gameEventHandlers = [];
    }
}