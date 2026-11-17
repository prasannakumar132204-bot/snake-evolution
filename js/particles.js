/**
 * SNAKE EVOLUTION - Particle System
 * High-performance particle effects for game events
 */

import { randomFloat, randomInt, lerp, clamp, Easing, lerpColor, randomChoice } from './utils.js';
import { GAME_CONFIG, COLOR_PALETTE } from './constants.js';

// ========================================
// Particle Class
// ========================================

class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.size = 0;
        this.startSize = 0;
        this.endSize = 0;
        this.color = '#ffffff';
        this.startColor = '#ffffff';
        this.endColor = '#ffffff';
        this.alpha = 1;
        this.startAlpha = 1;
        this.endAlpha = 0;
        this.life = 0;
        this.maxLife = 1;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.shape = 'circle'; // circle, square, triangle, star, diamond
        this.glow = false;
        this.glowColor = null;
        this.active = false;
        this.isRing = false;
        this.maxRadius = 0;
    }
    
    init(options = {}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.ax = options.ax || 0;
        this.ay = options.ay || 0;
        this.startSize = options.startSize || 4;
        this.endSize = options.endSize || 0;
        this.size = this.startSize;
        this.startColor = options.startColor || '#ffffff';
        this.endColor = options.endColor || this.startColor;
        this.color = this.startColor;
        this.startAlpha = options.startAlpha !== undefined ? options.startAlpha : 1;
        this.endAlpha = options.endAlpha !== undefined ? options.endAlpha : 0;
        this.alpha = this.startAlpha;
        this.maxLife = options.life || 1000;
        this.life = this.maxLife;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.shape = options.shape || 'circle';
        this.glow = options.glow || false;
        this.glowColor = options.glowColor || this.startColor;
        this.active = true;
        this.isRing = options.isRing || false;
        this.maxRadius = options.maxRadius || 0;
        return this;
    }
    
    update(dt) {
        if (!this.active) return false;
        
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return false;
        }
        
        const progress = 1 - this.life / this.maxLife;
        const easedProgress = Easing.easeOutCubic(progress);
        
        // Physics
        this.vx += this.ax * dt * 0.06; // Scale for ms
        this.vy += this.ay * dt * 0.06;
        this.x += this.vx * dt * 0.06;
        this.y += this.vy * dt * 0.06;
        
        // Visual interpolation
        this.size = lerp(this.startSize, this.endSize, easedProgress);
        this.color = this.interpolateColor(this.startColor, this.endColor, easedProgress);
        this.alpha = lerp(this.startAlpha, this.endAlpha, easedProgress);
        this.rotation += this.rotationSpeed * dt * 0.06;
        
        return true;
    }
    
    interpolateColor(c1, c2, t) {
        const rgb1 = this.hexToRgb(c1);
        const rgb2 = this.hexToRgb(c2);
        if (!rgb1 || !rgb2) return c1;
        
        const r = Math.round(lerp(rgb1.r, rgb2.r, t));
        const g = Math.round(lerp(rgb1.g, rgb2.g, t));
        const b = Math.round(lerp(rgb1.b, rgb2.b, t));
        
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
    
    draw(ctx, cellSize = 1) {
        if (!this.active || this.alpha <= 0 || this.size <= 0) return;
        
        // Custom draw for ring particles
        if (this.isRing && this.drawRing) {
            this.drawRing(ctx, cellSize);
            return;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        if (this.glow) {
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = this.size * cellSize * 0.8;
        }
        
        ctx.fillStyle = this.color;
        
        const halfSize = this.size * cellSize * 0.5;
        
        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'square':
                ctx.fillRect(-halfSize, -halfSize, this.size * cellSize, this.size * cellSize);
                break;
                
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -halfSize);
                ctx.lineTo(halfSize, halfSize);
                ctx.lineTo(-halfSize, halfSize);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'star':
                this.drawStar(ctx, 0, 0, halfSize * 0.4, halfSize, 5);
                break;
                
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(0, -halfSize);
                ctx.lineTo(halfSize, 0);
                ctx.lineTo(0, halfSize);
                ctx.lineTo(-halfSize, 0);
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, innerRadius, outerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}

// ========================================
// Particle Pool
// ========================================

class ParticlePool {
    constructor(initialSize = 500) {
        this.pool = [];
        this.active = [];
        this.expand(initialSize);
    }
    
    expand(count) {
        for (let i = 0; i < count; i++) {
            this.pool.push(new Particle());
        }
    }
    
    acquire() {
        let particle = this.pool.pop();
        if (!particle) {
            particle = new Particle();
        }
        this.active.push(particle);
        return particle;
    }
    
    release(particle) {
        particle.active = false;
        const index = this.active.indexOf(particle);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(particle);
        }
    }
    
    getActive() {
        return this.active;
    }
    
    clear() {
        this.active.forEach(p => this.pool.push(p));
        this.active.length = 0;
    }
    
    getStats() {
        return {
            active: this.active.length,
            pooled: this.pool.length,
            total: this.active.length + this.pool.length,
        };
    }
}

// ========================================
// Particle System
// ========================================

export class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pool = new ParticlePool(1000);
        this.cellSize = GAME_CONFIG.GRID_SIZE;
        this.timeScale = 1;
        this.running = false;
        this.lastTime = 0;
        
        // Emitters
        this.emitters = [];
        
        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = { x: 0, y: 0 };
    }
    
    setCellSize(size) {
        this.cellSize = size;
    }
    
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.animate();
    }
    
    stop() {
        this.running = false;
    }
    
    animate() {
        if (!this.running) return;
        
        const now = performance.now();
        const dt = (now - this.lastTime) * this.timeScale;
        this.lastTime = now;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame(() => this.animate());
    }
    
    update(dt) {
        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const progress = 1 - this.shakeDuration / Math.max(1, this.shakeDuration + dt);
            const intensity = this.shakeIntensity * (1 - progress) * Easing.easeOutQuad(progress);
            this.shakeOffset.x = (Math.random() - 0.5) * intensity;
            this.shakeOffset.y = (Math.random() - 0.5) * intensity;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
        
        // Update emitters
        this.emitters = this.emitters.filter(emitter => {
            emitter.update(dt);
            return emitter.active;
        });
        
        // Update particles
        const activeParticles = this.pool.getActive();
        for (let i = activeParticles.length - 1; i >= 0; i--) {
            const particle = activeParticles[i];
            if (!particle.update(dt)) {
                this.pool.release(particle);
            }
        }
    }
    
    draw() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        
        // Apply screen shake
        if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
            this.ctx.save();
            this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
        }
        
        // Draw particles
        const activeParticles = this.pool.getActive();
        activeParticles.forEach(particle => {
            particle.draw(this.ctx, this.cellSize);
        });
        
        if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
            this.ctx.restore();
        }
    }
    
    // ========================================
    // Burst Effects
    // ========================================
    
    burst(x, y, options = {}) {
        const {
            count = 12,
            colors = ['#00ff88'],
            speeds = [100, 300],
            sizes = [2, 6],
            life = 800,
            shapes = ['circle', 'square', 'triangle'],
            gravity = 200,
            spread = Math.PI * 2,
            startAngle = 0,
        } = options;
        
        for (let i = 0; i < count; i++) {
            const angle = startAngle + (Math.random() * spread);
            const speed = randomFloat(speeds[0], speeds[1]);
            const particle = this.pool.acquire();
            
            particle.init({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                ay: gravity,
                startSize: randomFloat(sizes[0], sizes[1]),
                endSize: 0,
                startColor: randomChoice(colors),
                endColor: randomChoice(colors),
                startAlpha: 1,
                endAlpha: 0,
                life: randomFloat(life * 0.7, life * 1.3),
                shape: randomChoice(shapes),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: randomFloat(-5, 5),
                glow: true,
                glowColor: randomChoice(colors),
            });
        }
    }
    
    // Food eaten burst
    foodBurst(x, y, foodType = 'normal') {
        const colors = this.getFoodColors(foodType);
        this.burst(x, y, {
            count: GAME_CONFIG.PARTICLE_COUNT_EAT,
            colors,
            speeds: [80, 220],
            sizes: [3, 7],
            life: 500,
            shapes: ['circle', 'diamond', 'star'],
            gravity: 120,
        });
        
        // Add ring effect
        this.ring(x, y, colors[0], 25, 400);
    }
    
    // Evolution burst
    evolutionBurst(x, y, level) {
        const stageColors = COLOR_PALETTE.snakeColors[level - 1] || ['#00ff88', '#00cc6a', '#009950'];
        
        // Main burst
        this.burst(x, y, {
            count: GAME_CONFIG.PARTICLE_COUNT_EVOLVE,
            colors: stageColors,
            speeds: [100, 350],
            sizes: [4, 10],
            life: 1000,
            shapes: ['circle', 'triangle', 'star', 'diamond'],
            gravity: 80,
        });
        
        // Expanding rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.ring(x, y, stageColors[i % stageColors.length], 35 + i * 20, 700);
            }, i * 80);
        }
        
        // Central flash
        this.flash(x, y, stageColors[0], 120, 180);
        
        // Screen shake
        this.shake(8, 300);
    }
    
    // Boost particles
    boostParticles(x, y, direction) {
        const angle = direction;
        const colors = ['#00d4ff', '#00ffaa', '#ffffff'];
        
        // Trail behind
        for (let i = 0; i < 5; i++) {
            const particle = this.pool.acquire();
            const offset = i * 10;
            particle.init({
                x: x - Math.cos(angle) * offset,
                y: y - Math.sin(angle) * offset,
                vx: Math.cos(angle + Math.PI) * randomFloat(50, 150),
                vy: Math.sin(angle + Math.PI) * randomFloat(50, 150),
                startSize: randomFloat(2, 5),
                endSize: 0,
                startColor: randomChoice(colors),
                endColor: colors[0],
                startAlpha: 0.7,
                endAlpha: 0,
                life: randomFloat(200, 350),
                shape: 'circle',
                glow: true,
                glowColor: colors[0],
            });
        }
        
        // Forward burst
        this.burst(x, y, {
            count: GAME_CONFIG.PARTICLE_COUNT_BOOST,
            colors,
            speeds: [180, 400],
            sizes: [2, 5],
            life: 250,
            shapes: ['triangle'],
            gravity: 0,
            spread: Math.PI / 3,
            startAngle: angle - Math.PI / 6,
        });
    }
    
    // Death explosion
    deathExplosion(snakeBody) {
        const colors = ['#ff3366', '#ff6b35', '#ffaa00', '#ffffff'];
        
        snakeBody.forEach((segment, index) => {
            setTimeout(() => {
                this.burst(segment.x, segment.y, {
                    count: Math.max(3, GAME_CONFIG.PARTICLE_COUNT_DEATH / snakeBody.length),
                    colors,
                    speeds: [50, 280],
                    sizes: [3, 9],
                    life: randomFloat(700, 1300),
                    shapes: ['circle', 'square', 'triangle'],
                    gravity: 180,
                });
                
                if (index === 0) {
                    // Head gets extra effect
                    this.flash(segment.x, segment.y, '#ff3366', 90, 250);
                    this.shake(12, 500);
                }
            }, index * 25);
        });
    }
    
    // Power-up collection
    powerupBurst(x, y, color) {
        this.burst(x, y, {
            count: 18,
            colors: [color, '#ffffff', lerpColor(color, '#ffffff', 0.5)],
            speeds: [100, 300],
            sizes: [3, 9],
            life: 900,
            shapes: ['star', 'diamond', 'circle'],
            gravity: 40,
        });
        
        this.ring(x, y, color, 30, 500);
        this.shake(4, 200);
    }
    
    // Combo text particles
    comboText(x, y, text, color = '#ffaa00') {
        // This would create text particles - simplified for now
        this.burst(x, y, {
            count: 10,
            colors: [color, '#ffffff'],
            speeds: [30, 100],
            sizes: [4, 8],
            life: 1000,
            shapes: ['circle'],
            gravity: -50, // float up
        });
    }
    
    // ========================================
    // Special Effects
    // ========================================
    
    ring(x, y, color, maxRadius, duration) {
        const particle = this.pool.acquire();
        particle.init({
            x, y,
            vx: 0, vy: 0,
            startSize: 2,
            endSize: maxRadius / this.cellSize,
            startColor: color,
            endColor: color,
            startAlpha: 0.7,
            endAlpha: 0,
            life: duration,
            shape: 'circle',
            glow: true,
            glowColor: color,
            isRing: true,
            maxRadius: maxRadius,
        });
        
        // Override draw for ring
        particle.drawRing = (ctx, cellSize) => {
            if (!particle.active || particle.alpha <= 0) return;
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.globalAlpha = particle.alpha;
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2 * cellSize;
            ctx.shadowColor = particle.glowColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size * cellSize / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        };
    }
    
    flash(x, y, color, maxSize, duration) {
        const particle = this.pool.acquire();
        particle.init({
            x, y,
            vx: 0, vy: 0,
            startSize: maxSize / this.cellSize,
            endSize: 0,
            startColor: color,
            endColor: color,
            startAlpha: 0.5,
            endAlpha: 0,
            life: duration,
            shape: 'circle',
            glow: true,
            glowColor: color,
        });
    }
    
    trail(x, y, color, size = 4, life = 300) {
        const particle = this.pool.acquire();
        particle.init({
            x, y,
            vx: randomFloat(-20, 20),
            vy: randomFloat(-20, 20),
            startSize: size / this.cellSize,
            endSize: 0,
            startColor: color,
            endColor: color,
            startAlpha: 0.4,
            endAlpha: 0,
            life,
            shape: 'circle',
            glow: true,
            glowColor: color,
        });
    }
    
    shake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }
    
    // ========================================
    // Continuous Emitters
    // ========================================
    
    createEmitter(options) {
        const emitter = {
            x: options.x || 0,
            y: options.y || 0,
            rate: options.rate || 10, // particles per second
            timer: 0,
            active: true,
            pool: this.pool,
            options: options,
            update(dt) {
                this.timer += dt;
                const interval = 1000 / this.rate;
                while (this.timer >= interval) {
                    this.timer -= interval;
                    this.emit();
                }
            },
            emit() {
                // Implemented by subclasses
            },
        };
        this.emitters.push(emitter);
        return emitter;
    }
    
    // Snake trail emitter
    createSnakeTrailEmitter(snake, color) {
        return this.createEmitter({
            x: 0, y: 0,
            rate: 25,
            snake,
            color,
            update(dt) {
                // Update position to snake head
                if (this.snake && this.snake.body.length > 0) {
                    const head = this.snake.body[0];
                    this.x = head.x;
                    this.y = head.y;
                }
                // Call parent update
                this.timer += dt;
                const interval = 1000 / this.rate;
                while (this.timer >= interval) {
                    this.timer -= interval;
                    this.emit();
                }
            },
            emit() {
                if (!this.snake || !this.snake.isBoosting) return;
                
                const particle = this.pool.acquire();
                particle.init({
                    x: this.x + randomFloat(-4, 4),
                    y: this.y + randomFloat(-4, 4),
                    vx: randomFloat(-25, 25),
                    vy: randomFloat(-25, 25),
                    startSize: randomFloat(1, 2.5),
                    endSize: 0,
                    startColor: this.color,
                    endColor: this.color,
                    startAlpha: 0.35,
                    endAlpha: 0,
                    life: randomFloat(200, 350),
                    shape: 'circle',
                    glow: true,
                    glowColor: this.color,
                });
            },
        });
    }
    
    // Food glow emitter
    createFoodGlowEmitter(food) {
        return this.createEmitter({
            x: food.x, y: food.y,
            rate: 4,
            food,
            update(dt) {
                if (this.food) {
                    this.x = this.food.x;
                    this.y = this.food.y;
                }
                this.timer += dt;
                const interval = 1000 / this.rate;
                while (this.timer >= interval) {
                    this.timer -= interval;
                    this.emit();
                }
            },
            emit() {
                if (!this.food) return;
                
                const particle = this.pool.acquire();
                const angle = Math.random() * Math.PI * 2;
                const radius = 10 + Math.random() * 6;
                
                particle.init({
                    x: this.x + Math.cos(angle) * radius,
                    y: this.y + Math.sin(angle) * radius,
                    vx: -Math.cos(angle) * 15,
                    vy: -Math.sin(angle) * 15,
                    startSize: randomFloat(0.8, 1.8),
                    endSize: 0,
                    startColor: this.food.type.color,
                    endColor: this.food.type.color,
                    startAlpha: 0.25,
                    endAlpha: 0,
                    life: randomFloat(400, 800),
                    shape: 'circle',
                    glow: true,
                    glowColor: this.food.type.color,
                });
            },
        });
    }
    
    removeEmitter(emitter) {
        emitter.active = false;
    }
    
    // ========================================
    // Helpers
    // ========================================
    
    getFoodColors(foodType) {
        const colorMap = {
            normal: ['#00ff88', '#00cc6a', '#009950'],
            speed: ['#00d4ff', '#00aacc', '#ffffff'],
            shield: ['#ffaa00', '#ffcc00', '#ffffff'],
            shrink: ['#ff3366', '#ff6688', '#ffffff'],
            golden: ['#ffd700', '#ffeb3b', '#ffffff'],
        };
        return colorMap[foodType] || colorMap.normal;
    }
    
    clear() {
        this.pool.clear();
        this.emitters.length = 0;
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    getStats() {
        return this.pool.getStats();
    }
}

// Singleton instance (initialized in main.js)
export let particleSystem = null;

export function createParticleSystem(canvas) {
    particleSystem = new ParticleSystem(canvas);
    return particleSystem;
}