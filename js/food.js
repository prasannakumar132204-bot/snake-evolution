/**
 * SNAKE EVOLUTION - Food System
 * Handles food spawning, types, and power-ups
 */

import { randomInt, randomFloat, randomChoice, weightedRandom, distance } from './utils.js';
import { GAME_CONFIG, FOOD_TYPES, FOOD_TYPE_ARRAY, POWERUP_TYPES } from './constants.js';
import { audio } from './audio.js';

// ========================================
// Food Class
// ========================================

export class Food {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        
        this.x = 0;
        this.y = 0;
        this.type = FOOD_TYPES.normal;
        this.active = false;
        this.spawnTime = 0;
        
        // Animation
        this.pulsePhase = 0;
        this.pulseSpeed = GAME_CONFIG.FOOD_PULSE_SPEED;
        this.rotation = 0;
        this.floatOffset = 0;
        this.appearProgress = 0;
        this.appearing = true;
        
        // Special effects
        this.particles = [];
    }
    
    spawn(snakeBody, obstacles = []) {
        const position = this.findValidPosition(snakeBody, obstacles);
        if (!position) return false;
        
        this.x = position.x;
        this.y = position.y;
        this.type = this.selectFoodType();
        this.active = true;
        this.spawnTime = performance.now();
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.appearProgress = 0;
        this.appearing = true;
        
        return true;
    }
    
    findValidPosition(snakeBody, obstacles) {
        const occupied = new Set();
        
        // Snake body
        snakeBody.forEach(seg => {
            occupied.add(`${seg.x},${seg.y}`);
        });
        
        // Obstacles
        obstacles.forEach(obs => {
            occupied.add(`${obs.x},${obs.y}`);
        });
        
        // Find all valid positions
        const validPositions = [];
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    validPositions.push({ x, y });
                }
            }
        }
        
        if (validPositions.length === 0) return null;
        
        return randomChoice(validPositions);
    }
    
    selectFoodType() {
        // Weighted random selection based on probabilities
        return weightedRandom(FOOD_TYPE_ARRAY, food => food.probability);
    }
    
    despawn() {
        this.active = false;
    }
    
    update(dt) {
        if (!this.active) return;
        
        // Appear animation
        if (this.appearing) {
            this.appearProgress = Math.min(1, this.appearProgress + dt / 300);
            if (this.appearProgress >= 1) this.appearing = false;
        }
        
        this.pulsePhase += dt * this.pulseSpeed * 0.001;
        this.rotation += dt * 0.0005;
        this.floatOffset += dt * 0.002;
    }
    
    draw(ctx, cellSize, padding = 1) {
        if (!this.active) return;
        
        const x = this.x * cellSize + cellSize / 2;
        const y = this.y * cellSize + cellSize / 2;
        const baseSize = (cellSize - padding * 2) * 0.55;
        
        // Pulse animation
        const pulse = Math.sin(this.pulsePhase) * 0.12 + 1;
        const floatY = Math.sin(this.floatOffset) * 2.5;
        const size = baseSize * pulse * this.appearProgress;
        
        if (size <= 0) return;
        
        ctx.save();
        ctx.translate(x, y + floatY);
        ctx.rotate(this.rotation);
        
        // Glow
        const glowIntensity = 16 * pulse * this.appearProgress;
        ctx.shadowColor = this.type.glowColor;
        ctx.shadowBlur = glowIntensity;
        
        // Main food shape
        this.drawFoodShape(ctx, size, this.type.color);
        
        // Special type indicators
        if (this.type.id !== 'normal') {
            this.drawTypeIndicator(ctx, size);
        }
        
        // Golden food sparkle
        if (this.type.id === 'golden') {
            this.drawSparkles(ctx, size);
        }
        
        ctx.restore();
    }
    
    drawFoodShape(ctx, size, color) {
        // Premium food shape - rounded diamond with gradient
        const gradient = ctx.createRadialGradient(0, -size * 0.2, 0, 0, 0, size);
        gradient.addColorStop(0, this.lightenColor(color, 40));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));
        
        ctx.fillStyle = gradient;
        
        // Rounded diamond shape for food
        ctx.beginPath();
        const roundness = size * 0.25;
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(size * 0.6, -size * 0.4, size * 0.85, 0);
        ctx.quadraticCurveTo(size * 0.6, size * 0.4, 0, size);
        ctx.quadraticCurveTo(-size * 0.6, size * 0.4, -size * 0.85, 0);
        ctx.quadraticCurveTo(-size * 0.6, -size * 0.4, 0, -size);
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.55);
        ctx.quadraticCurveTo(size * 0.35, -size * 0.2, size * 0.5, 0);
        ctx.quadraticCurveTo(size * 0.35, size * 0.2, 0, size * 0.35);
        ctx.quadraticCurveTo(-size * 0.35, size * 0.2, -size * 0.5, 0);
        ctx.quadraticCurveTo(-size * 0.35, -size * 0.2, 0, -size * 0.55);
        ctx.closePath();
        ctx.fill();
        
        // Subtle rim highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(size * 0.6, -size * 0.4, size * 0.85, 0);
        ctx.quadraticCurveTo(size * 0.6, size * 0.4, 0, size);
        ctx.quadraticCurveTo(-size * 0.6, size * 0.4, -size * 0.85, 0);
        ctx.quadraticCurveTo(-size * 0.6, -size * 0.4, 0, -size);
        ctx.closePath();
        ctx.stroke();
    }
    
    drawTypeIndicator(ctx, size) {
        const indicatorSize = size * 0.45;
        
        switch (this.type.id) {
            case 'speed':
                // Lightning bolt - premium
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.moveTo(0, -indicatorSize);
                ctx.lineTo(indicatorSize * 0.3, -indicatorSize * 0.15);
                ctx.lineTo(-indicatorSize * 0.1, -indicatorSize * 0.15);
                ctx.lineTo(0, indicatorSize);
                ctx.lineTo(-indicatorSize * 0.3, indicatorSize * 0.15);
                ctx.lineTo(indicatorSize * 0.1, indicatorSize * 0.15);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'shield':
                // Shield icon - premium
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -indicatorSize);
                ctx.lineTo(indicatorSize * 0.7, indicatorSize * 0.3);
                ctx.lineTo(0, indicatorSize * 0.8);
                ctx.lineTo(-indicatorSize * 0.7, indicatorSize * 0.3);
                ctx.closePath();
                ctx.stroke();
                
                // Shield center dot
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, -indicatorSize * 0.2, indicatorSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'shrink':
                // Down arrow - premium
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.moveTo(0, indicatorSize * 0.7);
                ctx.lineTo(-indicatorSize * 0.5, -indicatorSize * 0.2);
                ctx.lineTo(-indicatorSize * 0.2, -indicatorSize * 0.2);
                ctx.lineTo(-indicatorSize * 0.2, -indicatorSize * 0.7);
                ctx.lineTo(indicatorSize * 0.2, -indicatorSize * 0.7);
                ctx.lineTo(indicatorSize * 0.2, -indicatorSize * 0.2);
                ctx.lineTo(indicatorSize * 0.5, -indicatorSize * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
    
    drawSparkles(ctx, size) {
        const time = performance.now() * 0.005;
        for (let i = 0; i < 6; i++) {
            const angle = time + i * Math.PI * 2 / 6;
            const dist = size * 1.3;
            const sparkleSize = 2.5 + Math.sin(time * 4 + i) * 1;
            
            ctx.save();
            ctx.translate(Math.cos(angle) * dist, Math.sin(angle) * dist);
            ctx.rotate(angle + time);
            ctx.fillStyle = '#ffd700';
            ctx.globalAlpha = 0.6 + Math.sin(time * 5 + i) * 0.4;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            // 4-pointed star
            for (let j = 0; j < 4; j++) {
                const a = j * Math.PI / 2;
                const r = j % 2 === 0 ? sparkleSize : sparkleSize * 0.4;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    
    lightenColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        return `rgb(${Math.min(255, rgb.r + amount)}, ${Math.min(255, rgb.g + amount)}, ${Math.min(255, rgb.b + amount)})`;
    }
    
    darkenColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        return `rgb(${Math.max(0, rgb.r - amount)}, ${Math.max(0, rgb.g - amount)}, ${Math.max(0, rgb.b - amount)})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    }
    
    // Check if position matches this food
    isAt(x, y) {
        return this.active && this.x === x && this.y === y;
    }
    
    getPoints() {
        return this.type.points || GAME_CONFIG.BASE_FOOD_POINTS;
    }
    
    getLengthGain() {
        return this.type.lengthGain || 1;
    }
    
    getEffect() {
        return this.type.effect;
    }
    
    getEffectDuration() {
        return this.type.effectDuration || 0;
    }
}

// ========================================
// Power-up Class
// ========================================

export class Powerup {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        
        this.x = 0;
        this.y = 0;
        this.type = null;
        this.active = false;
        this.spawnTime = 0;
        this.lifetime = 10000; // ms before despawn
        
        // Animation
        this.pulsePhase = 0;
        this.rotation = 0;
        this.bobOffset = 0;
        this.scale = 0;
        this.appearing = true;
        this.appearTime = 400;
    }
    
    spawn(snakeBody, food, obstacles = []) {
        const occupied = new Set();
        
        snakeBody.forEach(seg => occupied.add(`${seg.x},${seg.y}`));
        if (food && food.active) occupied.add(`${food.x},${food.y}`);
        obstacles.forEach(obs => occupied.add(`${obs.x},${obs.y}`));
        
        const validPositions = [];
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    validPositions.push({ x, y });
                }
            }
        }
        
        if (validPositions.length === 0) return false;
        
        const pos = randomChoice(validPositions);
        this.x = pos.x;
        this.y = pos.y;
        
        // Select random power-up type
        const types = Object.values(POWERUP_TYPES);
        this.type = randomChoice(types);
        
        this.active = true;
        this.spawnTime = performance.now();
        this.pulsePhase = 0;
        this.rotation = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.scale = 0;
        this.appearing = true;
        
        return true;
    }
    
    update(dt) {
        if (!this.active) return;
        
        const age = performance.now() - this.spawnTime;
        
        // Despawn after lifetime
        if (age > this.lifetime) {
            this.despawn();
            return;
        }
        
        // Appear animation
        if (this.appearing) {
            this.scale = Math.min(1, this.scale + dt / this.appearTime);
            if (this.scale >= 1) this.appearing = false;
        }
        
        // Fade out near end
        if (age > this.lifetime - 2000) {
            this.scale = Math.max(0, 1 - (age - (this.lifetime - 2000)) / 2000);
        }
        
        this.pulsePhase += dt * 0.005;
        this.rotation += dt * 0.001;
        this.bobOffset += dt * 0.003;
    }
    
    despawn() {
        this.active = false;
    }
    
    draw(ctx, cellSize, padding = 1) {
        if (!this.active || !this.type) return;
        
        const x = this.x * cellSize + cellSize / 2;
        const y = this.y * cellSize + cellSize / 2;
        const baseSize = (cellSize - padding * 2) * 0.65;
        const size = baseSize * this.scale;
        
        if (size <= 0) return;
        
        const bob = Math.sin(this.bobOffset) * 3;
        const pulse = Math.sin(this.pulsePhase) * 0.08 + 1;
        
        ctx.save();
        ctx.translate(x, y + bob);
        ctx.rotate(this.rotation);
        ctx.scale(pulse, pulse);
        
        // Glow
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 20;
        
        // Background circle with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, this.type.color);
        gradient.addColorStop(0.7, this.adjustColor(this.type.color, -20));
        gradient.addColorStop(1, this.adjustColor(this.type.color, -50));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Border ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Icon/Text
        ctx.fillStyle = '#0a0f1a';
        ctx.font = `bold ${size * 0.55}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, 0, size * 0.08);
        
        ctx.restore();
    }
    
    adjustColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        const r = Math.max(0, Math.min(255, rgb.r + amount));
        const g = Math.max(0, Math.min(255, rgb.g + amount));
        const b = Math.max(0, Math.min(255, rgb.b + amount));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    }
    
    collect() {
        const type = this.type;
        this.despawn();
        audio.playPowerup();
        return type;
    }
    
    isAt(x, y) {
        return this.active && this.x === x && this.y === y;
    }
}

// ========================================
// Food Manager
// ========================================

export class FoodManager {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        
        this.food = new Food(gridWidth, gridHeight);
        this.powerup = new Powerup(gridWidth, gridHeight);
        
        this.powerupSpawnTimer = 0;
        this.powerupSpawnInterval = 15000; // ms
        
        this.onFoodEaten = null;
        this.onPowerupCollected = null;
    }
    
    init(snakeBody) {
        this.food.spawn(snakeBody);
    }
    
    update(dt, snakeBody) {
        // Update food
        this.food.update(dt);
        
        // Update powerup
        this.powerup.update(dt);
        this.powerupSpawnTimer += dt;
        
        // Spawn powerup periodically
        if (this.powerupSpawnTimer >= this.powerupSpawnInterval && !this.powerup.active) {
            if (Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE) {
                this.powerup.spawn(snakeBody, this.food);
            }
            this.powerupSpawnTimer = 0;
        }
    }
    
    checkCollision(snake) {
        const head = snake.getHead();
        if (!head) return null;
        
        // Check food
        if (this.food.active && this.food.isAt(head.x, head.y)) {
            const foodType = this.food.type;
            const foodData = {
                x: this.food.x,
                y: this.food.y,
                type: foodType,
                points: this.food.getPoints(),
                lengthGain: this.food.getLengthGain(),
                effect: this.food.getEffect(),
                effectDuration: this.food.getEffectDuration(),
            };
            
            this.food.despawn();
            
            // Spawn new food after delay
            setTimeout(() => {
                this.food.spawn(snake.body);
            }, GAME_CONFIG.FOOD_SPAWN_DELAY);
            
            if (this.onFoodEaten) this.onFoodEaten(foodData);
            return { type: 'food', data: foodData };
        }
        
        // Check powerup
        if (this.powerup.active && this.powerup.isAt(head.x, head.y)) {
            const powerupType = this.powerup.collect();
            this.powerupSpawnTimer = 0;
            
            if (this.onPowerupCollected) this.onPowerupCollected(powerupType);
            return { type: 'powerup', data: powerupType };
        }
        
        return null;
    }
    
    draw(ctx, cellSize, padding) {
        if (this.food.active) {
            this.food.draw(ctx, cellSize, padding);
        }
        if (this.powerup.active) {
            this.powerup.draw(ctx, cellSize, padding);
        }
    }
    
    getFoodPosition() {
        return this.food.active ? { x: this.food.x, y: this.food.y } : null;
    }
    
    getPowerupPosition() {
        return this.powerup.active ? { x: this.powerup.x, y: this.powerup.y } : null;
    }
    
    reset(snakeBody) {
        this.food.spawn(snakeBody);
        this.powerup.despawn();
        this.powerupSpawnTimer = 0;
    }
}