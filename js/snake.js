/**
 * SNAKE EVOLUTION - Snake Entity
 * Handles snake movement, rendering, and state
 */

import { Vector2 } from './utils.js';
import { GAME_CONFIG, DIRECTIONS, EVOLUTION_STAGES, COLOR_PALETTE } from './constants.js';
import { audio } from './audio.js';

// ========================================
// Snake Class
// ========================================

export class Snake {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        
        // Body segments (head first)
        this.body = [];
        
        // Movement
        this.direction = DIRECTIONS.right;
        this.nextDirection = DIRECTIONS.right;
        this.moveTimer = 0;
        this.moveInterval = GAME_CONFIG.INITIAL_SPEED;
        
        // State
        this.alive = true;
        this.growing = 0;
        this.score = 0;
        this.combo = 0;
        this.lastFoodTime = 0;
        
        // Evolution
        this.evolutionLevel = 1;
        this.evolutionProgress = 0; // 0-1
        this.nextEvolutionThreshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[0];
        
        // Boost
        this.boost = GAME_CONFIG.INITIAL_BOOST;
        this.maxBoost = GAME_CONFIG.INITIAL_BOOST;
        this.boosting = false;
        this.boostTimer = 0;
        this.boostRechargeRate = GAME_CONFIG.BOOST_RECHARGE_RATE;
        
        // Abilities
        this.abilities = {
            dash: false,
            shield: false,
            ghost: false,
            magnet: false,
        };
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.ghostActive = false;
        this.ghostTimer = 0;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.slowmoActive = false;
        this.slowmoTimer = 0;
        this.doublePointsActive = false;
        this.doublePointsTimer = 0;
        
        // Visual
        this.headRotation = 0;
        this.targetHeadRotation = 0;
        this.bodyColors = [];
        this.colorPhase = 0;
        this.segmentPositions = []; // For smooth interpolation
        this.prevSegmentPositions = [];
        
        // Callbacks
        this.onEvolution = null;
        this.onDeath = null;
        this.onScoreChange = null;
        this.onBoostChange = null;
        
        this.reset();
    }
    
    reset() {
        // Clear body
        this.body.length = 0;
        this.segmentPositions.length = 0;
        this.prevSegmentPositions.length = 0;
        
        // Start in center
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        
        // Create initial body
        for (let i = 0; i < GAME_CONFIG.INITIAL_LENGTH; i++) {
            const pos = new Vector2(startX - i, startY);
            this.body.push(pos);
            this.segmentPositions.push({ x: pos.x, y: pos.y });
            this.prevSegmentPositions.push({ x: pos.x, y: pos.y });
        }
        
        // Reset state
        this.direction = DIRECTIONS.right;
        this.nextDirection = DIRECTIONS.right;
        this.moveTimer = 0;
        this.moveInterval = GAME_CONFIG.INITIAL_SPEED;
        this.alive = true;
        this.growing = 0;
        this.score = 0;
        this.combo = 0;
        this.lastFoodTime = 0;
        
        // Evolution
        this.evolutionLevel = 1;
        this.evolutionProgress = 0;
        this.nextEvolutionThreshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[0];
        
        // Boost
        this.boost = GAME_CONFIG.INITIAL_BOOST;
        this.maxBoost = GAME_CONFIG.INITIAL_BOOST;
        this.boosting = false;
        this.boostTimer = 0;
        this.boostRechargeRate = GAME_CONFIG.BOOST_RECHARGE_RATE;
        
        // Abilities
        this.abilities = { dash: false, shield: false, ghost: false, magnet: false };
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.ghostActive = false;
        this.ghostTimer = 0;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.slowmoActive = false;
        this.slowmoTimer = 0;
        this.doublePointsActive = false;
        this.doublePointsTimer = 0;
        
        // Visual
        this.headRotation = 0;
        this.targetHeadRotation = 0;
        this.colorPhase = 0;
        
        this.updateColors();
    }
    
    // ========================================
    // Input Handling
    // ========================================
    
    setDirection(dir) {
        if (!this.alive) return false;
        
        const newDir = DIRECTIONS[dir];
        if (!newDir) return false;
        
        // Prevent 180-degree turns
        if (newDir.opposite === this.direction.opposite) return false;
        
        this.nextDirection = newDir;
        return true;
    }
    
    tryBoost() {
        if (!this.alive || this.boosting) return false;
        if (this.boost < GAME_CONFIG.BOOST_COST) return false;
        if (!this.abilities.dash && this.evolutionLevel < 2) return false;
        
        this.boosting = true;
        this.boostTimer = GAME_CONFIG.BOOST_DURATION;
        this.boost -= GAME_CONFIG.BOOST_COST;
        this.moveInterval = Math.max(GAME_CONFIG.MIN_SPEED, this.moveInterval / GAME_CONFIG.BOOST_SPEED_MULTIPLIER);
        
        if (this.onBoostChange) this.onBoostChange(this.boost, this.maxBoost);
        
        audio.playBoost();
        return true;
    }
    
    // ========================================
    // Update
    // ========================================
    
    update(dt, food = null) {
        if (!this.alive) return;
        
        this.moveTimer += dt;
        this.colorPhase += dt * 0.001;
        
        // Update ability timers
        this.updateAbilities(dt);
        
        // Update boost
        this.updateBoost(dt);
        
        // Update head rotation smoothly
        this.headRotation = this.lerpAngle(this.headRotation, this.targetHeadRotation, 0.15);
        
        // Check for move
        const effectiveInterval = this.slowmoActive ? this.moveInterval * 2 : this.moveInterval;
        if (this.moveTimer >= effectiveInterval) {
            this.moveTimer -= effectiveInterval;
            this.move(food);
        }
        
        // Update evolution progress
        this.updateEvolutionProgress();
    }
    
    updateAbilities(dt) {
        // Shield
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }
        
        // Ghost
        if (this.ghostActive) {
            this.ghostTimer -= dt;
            if (this.ghostTimer <= 0) {
                this.ghostActive = false;
            }
        }
        
        // Magnet
        if (this.magnetActive) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) {
                this.magnetActive = false;
            }
        }
        
        // Slowmo
        if (this.slowmoActive) {
            this.slowmoTimer -= dt;
            if (this.slowmoTimer <= 0) {
                this.slowmoActive = false;
            }
        }
        
        // Double points
        if (this.doublePointsActive) {
            this.doublePointsTimer -= dt;
            if (this.doublePointsTimer <= 0) {
                this.doublePointsActive = false;
            }
        }
    }
    
    updateBoost(dt) {
        if (this.boosting) {
            this.boostTimer -= dt;
            if (this.boostTimer <= 0) {
                this.boosting = false;
                this.moveInterval *= GAME_CONFIG.BOOST_SPEED_MULTIPLIER;
            }
        } else {
            // Recharge boost
            if (this.boost < this.maxBoost) {
                this.boost = Math.min(this.maxBoost, this.boost + this.boostRechargeRate * dt / 16.67);
                if (this.onBoostChange) this.onBoostChange(this.boost, this.maxBoost);
            }
        }
    }
    
    updateEvolutionProgress() {
        if (this.evolutionLevel >= EVOLUTION_STAGES.length) {
            this.evolutionProgress = 1;
            return;
        }
        
        const currentThreshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[this.evolutionLevel - 1] || 0;
        const nextThreshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[this.evolutionLevel] || currentThreshold + 100;
        
        this.evolutionProgress = (this.score - currentThreshold) / (nextThreshold - currentThreshold);
        this.evolutionProgress = Math.max(0, Math.min(1, this.evolutionProgress));
    }
    
    move(food) {
        // Store previous positions for interpolation
        this.prevSegmentPositions = this.segmentPositions.map(p => ({ x: p.x, y: p.y }));
        
        // Apply direction change
        this.direction = this.nextDirection;
        this.targetHeadRotation = this.direction.angle;
        
        // Calculate new head position
        const head = this.body[0];
        let newX = head.x + this.direction.x;
        let newY = head.y + this.direction.y;
        
        // Wall collision (wrap or die based on ghost mode)
        if (this.ghostActive) {
            // Ghost mode: wrap around
            newX = (newX + this.gridWidth) % this.gridWidth;
            newY = (newY + this.gridHeight) % this.gridHeight;
        } else {
            // Normal mode: check boundaries
            if (newX < 0 || newX >= this.gridWidth || newY < 0 || newY >= this.gridHeight) {
                this.die();
                return;
            }
        }
        
        const newHead = new Vector2(newX, newY);
        
        // Self collision
        if (this.checkSelfCollision(newHead)) {
            if (this.shieldActive) {
                // Shield protects once
                this.shieldActive = false;
                this.shieldTimer = 0;
            } else {
                this.die();
                return;
            }
        }
        
        // Add new head
        this.body.unshift(newHead);
        this.segmentPositions.unshift({ x: newX, y: newY });
        
        // Check food collision
        let ateFood = false;
        if (food && this.checkFoodCollision(food)) {
            ateFood = this.eatFood(food);
        }
        
        // Handle growth
        if (this.growing > 0) {
            this.growing--;
        } else if (!ateFood) {
            // Remove tail if not growing
            this.body.pop();
            this.segmentPositions.pop();
            this.prevSegmentPositions.pop();
        } else {
            // Keep the tail position for the new segment
            this.prevSegmentPositions.push({ ...this.prevSegmentPositions[this.prevSegmentPositions.length - 1] });
        }
        
        // Limit segment positions array length
        while (this.segmentPositions.length > this.body.length) {
            this.segmentPositions.pop();
        }
        while (this.prevSegmentPositions.length > this.body.length) {
            this.prevSegmentPositions.pop();
        }
        
        // Play movement sound occasionally
        if (this.body.length % 5 === 0) {
            audio.playMoveSound(this.body.length);
        }
    }
    
    checkSelfCollision(pos) {
        // Skip head (index 0)
        for (let i = 1; i < this.body.length; i++) {
            if (this.body[i].x === pos.x && this.body[i].y === pos.y) {
                return true;
            }
        }
        return false;
    }
    
    checkFoodCollision(food) {
        const head = this.body[0];
        return head.x === food.x && head.y === food.y;
    }
    
    eatFood(food) {
        // Calculate points
        let points = food.points || GAME_CONFIG.BASE_FOOD_POINTS;
        
        // Combo system
        const now = performance.now();
        if (now - this.lastFoodTime < GAME_CONFIG.COMBO_WINDOW) {
            this.combo++;
            points = Math.round(points * Math.pow(GAME_CONFIG.COMBO_MULTIPLIER, Math.min(this.combo, 5)));
        } else {
            this.combo = 1;
        }
        this.lastFoodTime = now;
        
        // Double points power-up
        if (this.doublePointsActive) {
            points *= 2;
        }
        
        // Apply score
        this.score += points;
        if (this.onScoreChange) this.onScoreChange(this.score, points, this.combo);
        
        // Grow snake
        const lengthGain = food.lengthGain || 1;
        this.growing += Math.max(0, lengthGain);
        
        // Handle shrink food
        if (lengthGain < 0) {
            this.shrink(-lengthGain);
        }
        
        // Play eat sound with pitch based on combo
        const pitch = 1 + Math.min(this.combo * 0.1, 0.5);
        audio.playEat(pitch);
        
        // Check evolution
        this.checkEvolution();
        
        // Trigger food effects
        if (food.effect) {
            this.applyFoodEffect(food.effect, food.effectDuration);
        }
        
        return true;
    }
    
    shrink(amount) {
        // Remove segments from tail
        for (let i = 0; i < amount && this.body.length > 3; i++) {
            this.body.pop();
            this.segmentPositions.pop();
            this.prevSegmentPositions.pop();
        }
    }
    
    checkEvolution() {
        if (this.evolutionLevel >= EVOLUTION_STAGES.length) return;
        
        const threshold = GAME_CONFIG.EVOLUTION_THRESHOLDS[this.evolutionLevel - 1];
        if (this.score >= threshold) {
            this.evolve();
        }
    }
    
    evolve() {
        if (this.evolutionLevel >= EVOLUTION_STAGES.length) return;
        
        this.evolutionLevel++;
        this.evolutionProgress = 0;
        
        // Increase speed
        this.moveInterval = Math.max(GAME_CONFIG.MIN_SPEED, this.moveInterval - GAME_CONFIG.EVOLUTION_SPEED_BONUS);
        
        // Increase boost recharge
        this.boostRechargeRate += GAME_CONFIG.EVOLUTION_BOOST_BONUS;
        this.maxBoost = Math.min(100, this.maxBoost + 10);
        this.boost = this.maxBoost;
        
        // Unlock abilities based on evolution
        const stage = EVOLUTION_STAGES[this.evolutionLevel - 1];
        if (stage.ability !== 'none' && stage.ability !== 'all') {
            this.abilities[stage.ability] = true;
        } else if (stage.ability === 'all') {
            Object.keys(this.abilities).forEach(key => this.abilities[key] = true);
        }
        
        // Update colors
        this.updateColors();
        
        // Play evolution sound
        audio.playEvolve();
        
        // Callback
        if (this.onEvolution) this.onEvolution(this.evolutionLevel, stage);
    }
    
    applyFoodEffect(effect, duration) {
        switch (effect) {
            case 'speed_boost':
                this.activateSlowmo(duration);
                break;
            case 'shield':
                this.activateShield(duration);
                break;
            case 'shrink':
                // Handled in eatFood
                break;
            case 'score_multiplier':
                this.activateDoublePoints(duration);
                break;
        }
    }
    
    activateShield(duration = 5000) {
        this.shieldActive = true;
        this.shieldTimer = duration;
    }
    
    activateGhost(duration = 5000) {
        this.ghostActive = true;
        this.ghostTimer = duration;
    }
    
    activateMagnet(duration = 5000) {
        this.magnetActive = true;
        this.magnetTimer = duration;
    }
    
    activateSlowmo(duration = 5000) {
        this.slowmoActive = true;
        this.slowmoTimer = duration;
    }
    
    activateDoublePoints(duration = 10000) {
        this.doublePointsActive = true;
        this.doublePointsTimer = duration;
    }
    
    // ========================================
    // Power-ups
    // ========================================
    
    collectPowerup(type) {
        switch (type) {
            case 'magnet':
                this.activateMagnet(5000);
                break;
            case 'slowmo':
                this.activateSlowmo(5000);
                break;
            case 'ghost':
                this.activateGhost(5000);
                break;
            case 'double':
                this.activateDoublePoints(10000);
                break;
        }
        audio.playPowerup();
    }
    
    // ========================================
    // Death
    // ========================================
    
    die() {
        this.alive = false;
        audio.playGameOver();
        if (this.onDeath) this.onDeath(this.score, this.evolutionLevel, this.body.length);
    }
    
    // ========================================
    // Rendering - Premium Visuals
    // ========================================
    
    updateColors() {
        const stageIndex = Math.min(this.evolutionLevel - 1, COLOR_PALETTE.snakeColors.length - 1);
        this.bodyColors = COLOR_PALETTE.snakeColors[stageIndex];
    }
    
    getSegmentColor(index) {
        if (this.bodyColors.length === 0) return '#00ff88';
        
        // Color gradient along body
        const progress = index / Math.max(1, this.body.length - 1);
        const colorIndex = progress * (this.bodyColors.length - 1);
        const i = Math.floor(colorIndex);
        const t = colorIndex - i;
        
        if (i >= this.bodyColors.length - 1) return this.bodyColors[this.bodyColors.length - 1];
        
        return this.lerpColor(this.bodyColors[i], this.bodyColors[i + 1], t);
    }
    
    lerpColor(c1, c2, t) {
        const rgb1 = this.hexToRgb(c1);
        const rgb2 = this.hexToRgb(c2);
        if (!rgb1 || !rgb2) return c1;
        
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
        
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
    
    lerpAngle(from, to, t) {
        let diff = to - from;
        // Normalize to -PI to PI
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return from + diff * t;
    }
    
    // Smooth interpolation for rendering
    getInterpolatedPosition(index, interpolation) {
        if (index >= this.segmentPositions.length) return null;
        if (index >= this.prevSegmentPositions.length) return this.segmentPositions[index];
        
        const curr = this.segmentPositions[index];
        const prev = this.prevSegmentPositions[index];
        
        return {
            x: prev.x + (curr.x - prev.x) * interpolation,
            y: prev.y + (curr.y - prev.y) * interpolation
        };
    }
    
    draw(ctx, cellSize, padding = 1) {
        if (!this.alive && this.body.length === 0) return;
        
        const stage = EVOLUTION_STAGES[Math.min(this.evolutionLevel - 1, EVOLUTION_STAGES.length - 1)];
        const glowColor = stage.glow;
        const isBoosting = this.boosting;
        const isShielded = this.shieldActive;
        const isGhost = this.ghostActive;
        
        // Use interpolation for smooth movement (0-1 based on moveTimer)
        const interpolation = this.moveInterval > 0 ? Math.min(1, this.moveTimer / this.moveInterval) : 0;
        
        // Draw body segments (tail to head)
        for (let i = this.body.length - 1; i >= 0; i--) {
            // Get interpolated position
            const interpPos = this.getInterpolatedPosition(i, interpolation);
            if (!interpPos) continue;
            
            const x = interpPos.x * cellSize + padding;
            const y = interpPos.y * cellSize + padding;
            const size = cellSize - padding * 2;
            
            const isHead = i === 0;
            const color = this.getSegmentColor(i);
            
            ctx.save();
            
            // Head gets special treatment
            if (isHead) {
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                
                ctx.translate(centerX, centerY);
                ctx.rotate(this.headRotation);
                
                // Glow effects
                if (isBoosting) {
                    ctx.shadowColor = '#00d4ff';
                    ctx.shadowBlur = 24;
                } else if (isShielded) {
                    ctx.shadowColor = '#ffaa00';
                    ctx.shadowBlur = 18;
                } else if (isGhost) {
                    ctx.shadowColor = '#bb86fc';
                    ctx.shadowBlur = 18;
                    ctx.globalAlpha = 0.75;
                } else {
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 16;
                }
                
                // Head shape - premium design
                ctx.fillStyle = color;
                ctx.beginPath();
                
                // Draw snake head (rounded diamond with pointed snout)
                const headSize = size * 0.55;
                const snoutLength = headSize * 0.8;
                const headWidth = headSize * 0.85;
                
                // Snout
                ctx.moveTo(snoutLength, 0);
                // Right side curve
                ctx.bezierCurveTo(
                    headSize * 0.3, headWidth * 0.2,
                    -headSize * 0.3, headWidth * 0.6,
                    -headSize * 0.7, headWidth * 0.4
                );
                // Back right curve
                ctx.bezierCurveTo(
                    -headSize * 0.5, headWidth * 0.2,
                    -headSize * 0.5, -headWidth * 0.2,
                    -headSize * 0.7, -headWidth * 0.4
                );
                // Back left curve
                ctx.bezierCurveTo(
                    -headSize * 0.3, -headWidth * 0.6,
                    headSize * 0.3, -headWidth * 0.2,
                    snoutLength, 0
                );
                ctx.closePath();
                ctx.fill();
                
                // Head highlight (top reflection)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.beginPath();
                ctx.moveTo(snoutLength * 0.3, -headWidth * 0.15);
                ctx.bezierCurveTo(
                    headSize * 0.1, -headWidth * 0.05,
                    -headSize * 0.2, -headWidth * 0.2,
                    -headSize * 0.5, -headWidth * 0.1
                );
                ctx.bezierCurveTo(
                    -headSize * 0.3, -headWidth * 0.25,
                    headSize * 0.1, -headWidth * 0.25,
                    snoutLength * 0.3, -headWidth * 0.15
                );
                ctx.closePath();
                ctx.fill();
                
                // Eyes - premium design
                const eyeOffset = headSize * 0.25;
                const eyeSize = headSize * 0.12;
                const pupilSize = eyeSize * 0.5;
                
                // Eye whites
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(eyeOffset, -eyeOffset * 0.8, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
                ctx.ellipse(eyeOffset, eyeOffset * 0.8, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Pupils
                ctx.fillStyle = '#0a0f1a';
                ctx.beginPath();
                ctx.arc(eyeOffset + pupilSize * 0.3, -eyeOffset * 0.8, pupilSize, 0, Math.PI * 2);
                ctx.arc(eyeOffset + pupilSize * 0.3, eyeOffset * 0.8, pupilSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Eye highlights (small white dots)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(eyeOffset + pupilSize * 0.5, -eyeOffset * 0.8 - pupilSize * 0.3, pupilSize * 0.35, 0, Math.PI * 2);
                ctx.arc(eyeOffset + pupilSize * 0.5, eyeOffset * 0.8 - pupilSize * 0.3, pupilSize * 0.35, 0, Math.PI * 2);
                ctx.fill();
                
                // Boost indicator
                if (isBoosting) {
                    ctx.fillStyle = '#00d4ff';
                    ctx.shadowColor = '#00d4ff';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(-headSize * 0.55, 0, headSize * 0.18, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Boost particles trail hint
                    ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
                    for (let j = 1; j <= 3; j++) {
                        ctx.beginPath();
                        ctx.arc(-headSize * (0.55 + j * 0.3), 0, headSize * (0.18 - j * 0.04), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            } else {
                // Body segment - smooth rounded rectangles with gradient
                const segmentProgress = i / Math.max(1, this.body.length - 1);
                const segmentSize = size * (0.75 + 0.25 * (1 - segmentProgress));
                const offset = (size - segmentSize) / 2;
                
                // Segment glow
                if (isBoosting) {
                    ctx.shadowColor = '#00d4ff';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 6;
                }
                
                if (isGhost) {
                    ctx.globalAlpha = 0.55;
                }
                
                // Create gradient for segment
                const segmentGradient = ctx.createLinearGradient(
                    x + offset, y + offset,
                    x + offset + segmentSize, y + offset + segmentSize
                );
                segmentGradient.addColorStop(0, color);
                segmentGradient.addColorStop(1, this.lerpColor(color, '#0a0f1a', 0.3));
                
                ctx.fillStyle = segmentGradient;
                
                // Rounded rectangle for body
                const radius = Math.min(segmentSize / 2, 5);
                this.roundRect(ctx, x + offset, y + offset, segmentSize, segmentSize, radius);
                ctx.fill();
                
                // Segment highlight (top edge)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                this.roundRect(ctx, x + offset + 1, y + offset + 1, segmentSize - 2, segmentSize * 0.35, radius);
                ctx.fill();
                
                // Subtle segment divider (for long snakes)
                if (this.body.length > 10 && i % 3 === 0 && i !== this.body.length - 1) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + offset + radius, y + offset + segmentSize);
                    ctx.lineTo(x + offset + segmentSize - radius, y + offset + segmentSize);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        }
        
        // Draw ability indicators
        this.drawAbilityIndicators(ctx, cellSize, padding, interpolation);
    }
    
    drawAbilityIndicators(ctx, cellSize, padding, interpolation) {
        const headPos = this.getInterpolatedPosition(0, interpolation);
        if (!headPos) return;
        
        const x = headPos.x * cellSize + cellSize / 2;
        const y = headPos.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.9;
        
        let indicatorCount = 0;
        
        if (this.shieldActive) {
            this.drawIndicator(ctx, x, y, radius, indicatorCount, '#ffaa00', '⛨');
            indicatorCount++;
        }
        if (this.ghostActive) {
            this.drawIndicator(ctx, x, y, radius, indicatorCount, '#bb86fc', '👻');
            indicatorCount++;
        }
        if (this.magnetActive) {
            this.drawIndicator(ctx, x, y, radius, indicatorCount, '#ff6b35', '🧲');
            indicatorCount++;
        }
        if (this.doublePointsActive) {
            this.drawIndicator(ctx, x, y, radius, indicatorCount, '#ffd700', '2×');
            indicatorCount++;
        }
        if (this.slowmoActive) {
            this.drawIndicator(ctx, x, y, radius, indicatorCount, '#00d4ff', '⏱');
            indicatorCount++;
        }
    }
    
    drawIndicator(ctx, cx, cy, radius, index, color, symbol) {
        const angle = (index - (this.getActiveIndicators() - 1) / 2) * 0.9;
        const dist = radius + 18;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Background circle with glow
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        // Symbol/text
        ctx.fillStyle = '#0a0f1a';
        ctx.font = 'bold 11px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 1);
        
        ctx.restore();
    }
    
    getActiveIndicators() {
        let count = 0;
        if (this.shieldActive) count++;
        if (this.ghostActive) count++;
        if (this.magnetActive) count++;
        if (this.doublePointsActive) count++;
        if (this.slowmoActive) count++;
        return count;
    }
    
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    // ========================================
    // Getters
    // ========================================
    
    getHead() {
        return this.body[0];
    }
    
    getLength() {
        return this.body.length;
    }
    
    getScore() {
        return this.score;
    }
    
    getEvolutionLevel() {
        return this.evolutionLevel;
    }
    
    getEvolutionProgress() {
        return this.evolutionProgress;
    }
    
    getBoost() {
        return this.boost;
    }
    
    getMaxBoost() {
        return this.maxBoost;
    }
    
    isBoosting() {
        return this.boosting;
    }
    
    hasAbility(ability) {
        return this.abilities[ability] === true;
    }
    
    // For magnet effect
    getMagnetRange() {
        return this.magnetActive ? 8 : 0;
    }
}