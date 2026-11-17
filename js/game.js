/**
 * SNAKE EVOLUTION - Main Game Engine
 * Orchestrates all game systems
 */

import { GAME_CONFIG, GAME_STATES, EVENTS, STORAGE_KEYS, DEFAULT_STATS, COLOR_PALETTE } from './constants.js';
import { Snake } from './snake.js';
import { FoodManager } from './food.js';
import { EvolutionManager } from './evolution.js';
import { ParticleSystem, createParticleSystem } from './particles.js';
import { audio, initAudio } from './audio.js';
import { storageGet, storageSet, formatScore, formatTime, clamp } from './utils.js';
import { EventEmitter } from './utils.js';

export class Game extends EventEmitter {
    constructor(canvas, particleCanvas, bgCanvas) {
        super();
        
        this.canvas = canvas;
        this.particleCanvas = particleCanvas;
        this.bgCanvas = bgCanvas;
        
        this.ctx = canvas.getContext('2d');
        this.bgCtx = bgCanvas.getContext('2d');
        
        // Game state
        this.state = GAME_STATES.MENU;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.cellSize = GAME_CONFIG.GRID_SIZE;
        
        // Core systems
        this.snake = null;
        this.foodManager = null;
        this.evolutionManager = null;
        this.particleSystem = null;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.paused = false;
        
        // Stats
        this.stats = { ...DEFAULT_STATS };
        this.highScore = 0;
        
        // Settings
        this.settings = {
            soundEnabled: true,
            musicEnabled: true,
            masterVolume: 0.7,
            sfxVolume: 0.8,
            musicVolume: 0.4,
            showGrid: false,
            reducedMotion: false,
        };
        
        // Callbacks for UI
        this.onStateChange = null;
        this.onScoreUpdate = null;
        this.onHighScore = null;
        this.onEvolution = null;
        this.onGameOver = null;
        
        // HUD offset for game area
        this.hudHeight = 72; // Default, updated in resize
        
        this.init();
    }
    
    init() {
        // Load saved data
        this.loadData();
        
        // Initialize audio
        initAudio();
        
        // Create particle system
        this.particleSystem = createParticleSystem(this.particleCanvas);
        
        // Apply settings
        this.applySettings();
        
        // Handle resize
        window.addEventListener('resize', () => this.resize());
        this.resize();
        
        // Start background rendering
        this.renderBackground();
    }
    
    loadData() {
        this.highScore = storageGet(STORAGE_KEYS.HIGH_SCORE, 0);
        this.stats = { ...DEFAULT_STATS, ...storageGet(STORAGE_KEYS.STATS, {}) };
        this.settings = { ...this.settings, ...storageGet(STORAGE_KEYS.SETTINGS, {}) };
    }
    
    saveData() {
        storageSet(STORAGE_KEYS.HIGH_SCORE, this.highScore);
        storageSet(STORAGE_KEYS.STATS, this.stats);
        storageSet(STORAGE_KEYS.SETTINGS, this.settings);
    }
    
    applySettings() {
        audio.setMasterVolume(this.settings.masterVolume);
        audio.setSfxVolume(this.settings.sfxVolume);
        audio.setMusicVolume(this.settings.musicVolume);
        
        if (!this.settings.soundEnabled) {
            audio.enabled = false;
        }
        
        if (this.settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        }
    }
    
    resize() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Get actual HUD height from computed styles
        const hudElement = document.getElementById('hud');
        if (hudElement && !hudElement.classList.contains('hidden')) {
            this.hudHeight = hudElement.offsetHeight;
        } else {
            // Fallback based on viewport
            if (width <= 479) this.hudHeight = 60;
            else if (width <= 575) this.hudHeight = 64;
            else if (width <= 767) this.hudHeight = 68;
            else if (width <= 1023) this.hudHeight = 72;
            else if (width <= 1439) this.hudHeight = 76;
            else this.hudHeight = 80;
        }
        
        // Available game area (subtract HUD and some padding)
        const gameAreaHeight = height - this.hudHeight - 24; // 24px for bottom padding/mobile controls space
        const gameAreaWidth = width - 24; // 24px horizontal padding
        
        // Calculate cell size based on available area
        // Target ~30 cells across the smaller dimension
        const targetCells = 30;
        this.cellSize = Math.max(16, Math.min(28, Math.floor(Math.min(gameAreaWidth, gameAreaHeight) / targetCells)));
        
        // Calculate grid dimensions
        this.gridWidth = Math.floor(gameAreaWidth / this.cellSize);
        this.gridHeight = Math.floor(gameAreaHeight / this.cellSize);
        
        // Ensure minimum grid size for playability
        if (this.gridWidth < 20) this.gridWidth = 20;
        if (this.gridHeight < 15) this.gridHeight = 15;
        
        // Maximum grid size for performance
        if (this.gridWidth > 60) this.gridWidth = 60;
        if (this.gridHeight > 60) this.gridHeight = 60;
        
        // Actual canvas dimensions
        const canvasWidth = this.gridWidth * this.cellSize;
        const canvasHeight = this.gridHeight * this.cellSize;
        
        // Resize canvases
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.particleCanvas.width = canvasWidth;
        this.particleCanvas.height = canvasHeight;
        this.bgCanvas.width = canvasWidth;
        this.bgCanvas.height = canvasHeight;
        
        // Update particle system
        this.particleSystem.setCellSize(this.cellSize);
        this.particleSystem.resize(canvasWidth, canvasHeight);
        
        // Center canvas in the available game area (below HUD)
        const leftOffset = Math.max(12, Math.floor((width - canvasWidth) / 2));
        const topOffset = this.hudHeight + Math.max(12, Math.floor((gameAreaHeight - canvasHeight) / 2));
        
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        this.canvas.style.left = `${leftOffset}px`;
        this.canvas.style.top = `${topOffset}px`;
        this.canvas.style.position = 'absolute';
        
        this.particleCanvas.style.width = `${canvasWidth}px`;
        this.particleCanvas.style.height = `${canvasHeight}px`;
        this.particleCanvas.style.left = `${leftOffset}px`;
        this.particleCanvas.style.top = `${topOffset}px`;
        this.particleCanvas.style.position = 'absolute';
        
        this.bgCanvas.style.width = `${canvasWidth}px`;
        this.bgCanvas.style.height = `${canvasHeight}px`;
        this.bgCanvas.style.left = `${leftOffset}px`;
        this.bgCanvas.style.top = `${topOffset}px`;
        this.bgCanvas.style.position = 'absolute';
        
        // Store offsets for collision calculations
        this.canvasOffsetX = leftOffset;
        this.canvasOffsetY = topOffset;
        
        // Recreate game objects if playing
        if (this.snake) {
            this.snake.gridWidth = this.gridWidth;
            this.snake.gridHeight = this.gridHeight;
        }
        if (this.foodManager) {
            this.foodManager.gridWidth = this.gridWidth;
            this.foodManager.gridHeight = this.gridHeight;
        }
    }
    
    // ========================================
    // Game Flow
    // ========================================
    
    start() {
        if (this.state === GAME_STATES.PLAYING) return;
        
        // Initialize game objects
        this.snake = new Snake(this.gridWidth, this.gridHeight);
        this.foodManager = new FoodManager(this.gridWidth, this.gridHeight);
        this.evolutionManager = new EvolutionManager();
        
        // Set up callbacks
        this.setupCallbacks();
        
        // Spawn initial food
        this.foodManager.init(this.snake.body);
        
        // Reset timing
        this.lastTime = performance.now();
        this.gameTime = 0;
        this.paused = false;
        
        // Start particle system
        this.particleSystem.start();
        
        // Start music
        if (this.settings.musicEnabled) {
            audio.playMusic();
        }
        
        // Change state
        this.setState(GAME_STATES.PLAYING);
        
        // Start game loop
        this.gameLoop();
    }
    
    setupCallbacks() {
        // Snake callbacks
        this.snake.onScoreChange = (score, points, combo) => {
            this.handleScoreChange(score, points, combo);
        };
        
        this.snake.onEvolution = (level, stage) => {
            this.handleEvolution(level, stage);
        };
        
        this.snake.onDeath = (score, evolution, length) => {
            this.handleGameOver(score, evolution, length);
        };
        
        this.snake.onBoostChange = (boost, maxBoost) => {
            this.emit(EVENTS.BOOST_USED, { boost, maxBoost });
        };
        
        // Food manager callbacks
        this.foodManager.onFoodEaten = (foodData) => {
            this.handleFoodEaten(foodData);
        };
        
        this.foodManager.onPowerupCollected = (powerupType) => {
            this.handlePowerupCollected(powerupType);
        };
    }
    
    pause() {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.paused = true;
        this.setState(GAME_STATES.PAUSED);
        audio.pauseMusic();
    }
    
    resume() {
        if (this.state !== GAME_STATES.PAUSED) return;
        this.paused = false;
        this.lastTime = performance.now();
        this.setState(GAME_STATES.PLAYING);
        if (this.settings.musicEnabled) {
            audio.playMusic();
        }
    }
    
    restart() {
        // Stop current game
        this.particleSystem.stop();
        audio.stopMusic();
        
        // Reset stats for this game
        this.gameTime = 0;
        
        // Start new game
        this.start();
    }
    
    quit() {
        this.particleSystem.stop();
        audio.stopMusic();
        this.setState(GAME_STATES.MENU);
    }
    
    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.emit(EVENTS.GAME_START + ':' + newState, newState);
        if (this.onStateChange) this.onStateChange(newState);
    }
    
    // ========================================
    // Game Loop
    // ========================================
    
    gameLoop() {
        if (this.state !== GAME_STATES.PLAYING) return;
        
        const now = performance.now();
        this.deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        // Cap delta time
        this.deltaTime = Math.min(this.deltaTime, 100);
        
        if (!this.paused) {
            this.gameTime += this.deltaTime;
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(dt) {
        // Update snake
        this.snake.update(dt, this.foodManager.food);
        
        // Check collisions
        const collision = this.foodManager.checkCollision(this.snake);
        if (collision) {
            // Handled in callbacks
        }
        
        // Update food manager
        this.foodManager.update(dt, this.snake.body);
        
        // Update evolution progress
        const progress = this.evolutionManager.calculateProgressFromScore(this.snake.getScore());
        this.evolutionManager.setProgress(progress);
        
        // Update particles
        this.particleSystem.update(dt);
    }
    
    // ========================================
    // Event Handlers
    // ========================================
    
    handleScoreChange(score, points, combo) {
        if (this.onScoreUpdate) this.onScoreUpdate(score, points, combo);
        this.emit(EVENTS.SCORE_UPDATE, { score, points, combo });
    }
    
    handleEvolution(level, stage) {
        this.evolutionManager.evolve();
        
        // Particle effect at snake head
        const head = this.snake.getHead();
        if (head) {
            const x = head.x * this.cellSize + this.cellSize / 2;
            const y = head.y * this.cellSize + this.cellSize / 2;
            this.particleSystem.evolutionBurst(x, y, level);
        }
        
        // Update background
        this.renderBackground();
        
        if (this.onEvolution) this.onEvolution(level, stage);
        this.emit(EVENTS.EVOLUTION, { level, stage });
    }
    
    handleFoodEaten(foodData) {
        const x = foodData.x * this.cellSize + this.cellSize / 2;
        const y = foodData.y * this.cellSize + this.cellSize / 2;
        
        this.particleSystem.foodBurst(x, y, foodData.type.id);
        
        this.emit(EVENTS.FOOD_EATEN, foodData);
    }
    
    handlePowerupCollected(powerupType) {
        this.snake.collectPowerup(powerupType.id);
        
        const head = this.snake.getHead();
        if (head) {
            const x = head.x * this.cellSize + this.cellSize / 2;
            const y = head.y * this.cellSize + this.cellSize / 2;
            this.particleSystem.powerupBurst(x, y, powerupType.color);
        }
        
        this.emit(EVENTS.POWERUP_COLLECTED, powerupType);
    }
    
    handleGameOver(score, evolution, length) {
        // Update stats
        this.stats.gamesPlayed++;
        this.stats.totalScore += score;
        this.stats.bestLength = Math.max(this.stats.bestLength, length);
        this.stats.totalEvolutions += evolution - 1;
        this.stats.totalPlayTime += this.gameTime;
        this.stats.bestEvolution = Math.max(this.stats.bestEvolution, evolution);
        
        // Check high score
        const isNewHighScore = score > this.highScore;
        if (isNewHighScore) {
            this.highScore = score;
            this.emit(EVENTS.HIGH_SCORE, { score, previous: this.highScore });
            if (this.onHighScore) this.onHighScore(score);
        }
        
        // Save data
        this.saveData();
        
        // Death particles
        this.particleSystem.deathExplosion(this.snake.body);
        
        // Stop music
        audio.stopMusic();
        
        // Trigger game over
        this.setState(GAME_STATES.GAME_OVER);
        if (this.onGameOver) this.onGameOver(score, evolution, length, isNewHighScore);
        this.emit(EVENTS.GAME_OVER, { score, evolution, length, isNewHighScore });
    }
    
    // ========================================
    // Input Handling
    // ========================================
    
    handleKeyDown(key) {
        if (this.state !== GAME_STATES.PLAYING) return;
        
        const keyMap = {
            'ArrowUp': 'up', 'KeyW': 'up',
            'ArrowDown': 'down', 'KeyS': 'down',
            'ArrowLeft': 'left', 'KeyA': 'left',
            'ArrowRight': 'right', 'KeyD': 'right',
            'Space': 'boost',
            'KeyP': 'pause',
            'Escape': 'pause',
        };
        
        const action = keyMap[key];
        if (!action) return;
        
        switch (action) {
            case 'boost':
                this.snake.tryBoost();
                break;
            case 'pause':
                this.pause();
                break;
            default:
                this.snake.setDirection(action);
        }
    }
    
    handleTouchDirection(dir) {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.snake.setDirection(dir);
    }
    
    handleTouchBoost() {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.snake.tryBoost();
    }
    
    // ========================================
    // Rendering
    // ========================================
    
    render() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (optional)
        if (this.settings.showGrid) {
            this.drawGrid();
        }
        
        // Draw food and powerups
        this.foodManager.draw(this.ctx, this.cellSize, 1);
        
        // Draw snake
        if (this.snake) {
            this.snake.draw(this.ctx, this.cellSize, 1);
        }
    }
    
    renderBackground() {
        // Clear background canvas
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        
        // Draw evolution-based background gradient
        const gradient = this.evolutionManager?.getBackgroundGradient() || COLOR_PALETTE.bgGradients[0];
        this.bgCanvas.style.background = gradient;
        
        // Draw subtle grid pattern
        this.bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        this.bgCtx.lineWidth = 1;
        
        const spacing = this.cellSize * 5;
        for (let x = 0; x <= this.bgCanvas.width; x += spacing) {
            this.bgCtx.beginPath();
            this.bgCtx.moveTo(x, 0);
            this.bgCtx.lineTo(x, this.bgCanvas.height);
            this.bgCtx.stroke();
        }
        for (let y = 0; y <= this.bgCanvas.height; y += spacing) {
            this.bgCtx.beginPath();
            this.bgCtx.moveTo(0, y);
            this.bgCtx.lineTo(this.bgCanvas.width, y);
            this.bgCtx.stroke();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // ========================================
    // Getters for UI
    // ========================================
    
    getScore() {
        return this.snake ? this.snake.getScore() : 0;
    }
    
    getLength() {
        return this.snake ? this.snake.getLength() : 3;
    }
    
    getEvolutionLevel() {
        return this.evolutionManager ? this.evolutionManager.getLevel() : 1;
    }
    
    getEvolutionProgress() {
        return this.evolutionManager ? this.evolutionManager.getProgress() : 0;
    }
    
    getBoost() {
        return this.snake ? this.snake.getBoost() : 100;
    }
    
    getMaxBoost() {
        return this.snake ? this.snake.getMaxBoost() : 100;
    }
    
    getHighScore() {
        return this.highScore;
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    getGameTime() {
        return this.gameTime;
    }
    
    getState() {
        return this.state;
    }
    
    isPaused() {
        return this.paused;
    }
    
    // Settings
    updateSetting(key, value) {
        this.settings[key] = value;
        this.applySettings();
        this.saveData();
    }
    
    getSettings() {
        return { ...this.settings };
    }
    
    // Cleanup
    destroy() {
        this.particleSystem.stop();
        audio.stopMusic();
        audio.destroy();
        window.removeEventListener('resize', () => this.resize());
    }
}