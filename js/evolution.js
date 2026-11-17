/**
 * SNAKE EVOLUTION - Evolution System
 * Manages evolution stages, abilities, and visual progression
 */

import { EVOLUTION_STAGES, GAME_CONFIG, COLOR_PALETTE } from './constants.js';
import { lerp, clamp } from './utils.js';

// ========================================
// Evolution Manager
// ========================================

export class EvolutionManager {
    constructor() {
        this.currentLevel = 1;
        this.progress = 0; // 0-1 within current level
        this.totalEvolutions = 0;
        this.evolutionHistory = [];
        
        // Callbacks
        this.onEvolve = null;
        this.onProgressChange = null;
    }
    
    reset() {
        this.currentLevel = 1;
        this.progress = 0;
        // Keep totalEvolutions and history for stats
    }
    
    setLevel(level) {
        const clampedLevel = clamp(level, 1, EVOLUTION_STAGES.length);
        if (clampedLevel !== this.currentLevel) {
            this.currentLevel = clampedLevel;
            this.progress = 0;
            this.updateProgress();
        }
    }
    
    addScore(score) {
        // Update progress based on score
        this.updateProgress();
    }
    
    updateProgress() {
        if (this.currentLevel >= EVOLUTION_STAGES.length) {
            this.progress = 1;
            this.updateProgressCallback();
            return;
        }
        
        const thresholds = GAME_CONFIG.EVOLUTION_THRESHOLDS;
        const currentThreshold = thresholds[this.currentLevel - 1] || 0;
        const nextThreshold = thresholds[this.currentLevel] || currentThreshold + 100;
        
        // This would need the actual score - we'll calculate it differently
        // The snake class handles the actual score checking
    }
    
    setProgress(progress) {
        this.progress = clamp(progress, 0, 1);
        this.updateProgressCallback();
    }
    
    updateProgressCallback() {
        if (this.onProgressChange) {
            this.onProgressChange(this.currentLevel, this.progress);
        }
    }
    
    evolve() {
        if (this.currentLevel >= EVOLUTION_STAGES.length) return false;
        
        const oldLevel = this.currentLevel;
        this.currentLevel++;
        this.progress = 0;
        this.totalEvolutions++;
        
        const stage = this.getCurrentStage();
        this.evolutionHistory.push({
            level: this.currentLevel,
            name: stage.name,
            timestamp: Date.now(),
        });
        
        if (this.onEvolve) {
            this.onEvolve(this.currentLevel, stage, oldLevel);
        }
        
        this.updateProgressCallback();
        return true;
    }
    
    getCurrentStage() {
        const index = Math.min(this.currentLevel - 1, EVOLUTION_STAGES.length - 1);
        return EVOLUTION_STAGES[index];
    }
    
    getNextStage() {
        if (this.currentLevel >= EVOLUTION_STAGES.length) return null;
        return EVOLUTION_STAGES[this.currentLevel];
    }
    
    getStage(level) {
        const index = Math.min(level - 1, EVOLUTION_STAGES.length - 1);
        return EVOLUTION_STAGES[index];
    }
    
    getAllStages() {
        return EVOLUTION_STAGES;
    }
    
    // Ability checking
    hasAbility(ability) {
        const stage = this.getCurrentStage();
        if (stage.ability === 'all') return true;
        return stage.ability === ability;
    }
    
    getUnlockedAbilities() {
        const abilities = new Set();
        for (let i = 1; i <= this.currentLevel; i++) {
            const stage = this.getStage(i);
            if (stage.ability !== 'none' && stage.ability !== 'all') {
                abilities.add(stage.ability);
            } else if (stage.ability === 'all') {
                return ['dash', 'shield', 'ghost', 'magnet'];
            }
        }
        return Array.from(abilities);
    }
    
    // Visual properties
    getColors() {
        const index = Math.min(this.currentLevel - 1, COLOR_PALETTE.snakeColors.length - 1);
        return COLOR_PALETTE.snakeColors[index];
    }
    
    getGlowColor() {
        const stage = this.getCurrentStage();
        return stage.glow;
    }
    
    getBackgroundGradient() {
        const index = Math.min(this.currentLevel - 1, COLOR_PALETTE.bgGradients.length - 1);
        return COLOR_PALETTE.bgGradients[index];
    }
    
    getName() {
        return this.getCurrentStage().name;
    }
    
    getLevel() {
        return this.currentLevel;
    }
    
    getMaxLevel() {
        return EVOLUTION_STAGES.length;
    }
    
    getProgress() {
        return this.progress;
    }
    
    getTotalEvolutions() {
        return this.totalEvolutions;
    }
    
    getHistory() {
        return this.evolutionHistory;
    }
    
    // Check if can evolve based on score
    checkEvolution(score) {
        if (this.currentLevel >= EVOLUTION_STAGES.length) return false;
        
        const threshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[this.currentLevel - 1];
        if (score >= threshold) {
            return this.evolve();
        }
        return false;
    }
    
    // Get threshold for current level
    getCurrentThreshold() {
        return GAME_CONFIG.EVOLUTION_THRESHOLDS[this.currentLevel - 1] || 0;
    }
    
    getNextThreshold() {
        if (this.currentLevel >= EVOLUTION_STAGES.length) return null;
        return GAME_CONFIG.EVOLUTION_THRESHOLDS[this.currentLevel];
    }
    
    // Calculate progress from score
    calculateProgressFromScore(score) {
        if (this.currentLevel >= EVOLUTION_STAGES.length) return 1;
        
        const currentThreshold = this.getCurrentThreshold();
        const nextThreshold = this.getNextThreshold();
        
        if (!nextThreshold) return 1;
        
        return clamp((score - currentThreshold) / (nextThreshold - currentThreshold), 0, 1);
    }
    
    // Get evolution display info
    getDisplayInfo() {
        const stage = this.getCurrentStage();
        const nextStage = this.getNextStage();
        
        return {
            level: this.currentLevel,
            name: stage.name,
            color: stage.color,
            glow: stage.glow,
            ability: stage.ability,
            progress: this.progress,
            nextLevel: nextStage ? nextStage.name : 'MAX',
            nextThreshold: this.getNextThreshold(),
            currentThreshold: this.getCurrentThreshold(),
            totalEvolutions: this.totalEvolutions,
        };
    }
}

// ========================================
// Evolution UI Component
// ========================================

export class EvolutionUI {
    constructor(evolutionManager) {
        this.manager = evolutionManager;
        this.element = null;
        this.barElement = null;
        this.levelElement = null;
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'evolution-meter';
        
        this.barElement = document.createElement('div');
        this.barElement.className = 'evolution-bar';
        
        this.levelElement = document.createElement('span');
        this.levelElement.className = 'evolution-level';
        
        this.element.appendChild(this.barElement);
        this.element.appendChild(this.levelElement);
        
        return this.element;
    }
    
    update() {
        if (!this.barElement || !this.levelElement) return;
        
        const info = this.manager.getDisplayInfo();
        
        // Update progress bar
        this.barElement.style.setProperty('--progress', `${info.progress * 100}%`);
        
        // Update level text
        this.levelElement.textContent = `${info.name.toUpperCase()} ${info.level}`;
        
        // Update colors
        const root = document.documentElement;
        root.style.setProperty('--evolution-color', info.color);
        root.style.setProperty('--evolution-glow', info.glow);
    }
    
    animateEvolution(oldLevel, newLevel) {
        if (!this.element) return;
        
        this.element.classList.add('evolving');
        
        // Flash animation
        const flash = document.createElement('div');
        flash.className = 'evolution-flash';
        flash.style.cssText = `
            position: absolute;
            inset: -4px;
            border-radius: inherit;
            background: ${this.manager.getGlowColor()};
            opacity: 0;
            animation: evolveFlash 0.6s ease-out forwards;
            pointer-events: none;
            z-index: -1;
        `;
        
        this.element.appendChild(flash);
        
        setTimeout(() => {
            this.element.classList.remove('evolving');
            flash.remove();
            this.update();
        }, 600);
    }
}

// Add CSS for evolution flash animation
const style = document.createElement('style');
style.textContent = `
@keyframes evolveFlash {
    0% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(1.5); }
}

.evolution-meter.evolving .evolution-bar::after {
    animation: evolveBarPulse 0.6s ease-out;
}

@keyframes evolveBarPulse {
    0% { box-shadow: 0 0 12px rgba(0, 255, 136, 0.6); }
    50% { box-shadow: 0 0 32px rgba(0, 255, 136, 1), 0 0 64px rgba(0, 255, 136, 0.5); }
    100% { box-shadow: 0 0 12px rgba(0, 255, 136, 0.6); }
}
`;
document.head.appendChild(style);