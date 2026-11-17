/**
 * SNAKE EVOLUTION - Utility Functions
 * Common helpers used across the game
 */

// ========================================
// Math Utilities
// ========================================

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Linear interpolation with clamping
 */
export function lerpClamped(start, end, t) {
    return lerp(start, end, clamp(t, 0, 1));
}

/**
 * Map value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random choice from array with optional weights
 */
export function weightedRandom(items, weightFn = () => 1) {
    const totalWeight = items.reduce((sum, item) => sum + weightFn(item), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= weightFn(item);
        if (random <= 0) return item;
    }
    return items[items.length - 1];
}

/**
 * Distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manhattan distance (grid distance)
 */
export function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Wrap value around min/max (for toroidal grids)
 */
export function wrap(value, min, max) {
    const range = max - min + 1;
    if (range <= 0) return min;
    let result = ((value - min) % range + range) % range + min;
    return result;
}

// ========================================
// Array Utilities
// ========================================

/**
 * Shuffle array in place (Fisher-Yates)
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Get random element from array
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Remove item from array by reference
 */
export function removeFromArray(array, item) {
    const index = array.indexOf(item);
    if (index !== -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if arrays are equal
 */
export function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, i) => val === arr2[i]);
}

// ========================================
// Color Utilities
// ========================================

/**
 * Convert hex to RGB object
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(clamp(x, 0, 255)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Interpolate between two colors
 */
export function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    if (!c1 || !c2) return color1;
    
    const r = lerp(c1.r, c2.r, t);
    const g = lerp(c1.g, c2.g, t);
    const b = lerp(c1.b, c2.b, t);
    
    return rgbToHex(r, g, b);
}

/**
 * Generate gradient color stops
 */
export function generateGradientStops(colors, steps) {
    const stops = [];
    const segmentSteps = steps / (colors.length - 1);
    
    for (let i = 0; i < colors.length - 1; i++) {
        for (let j = 0; j < segmentSteps; j++) {
            const t = j / segmentSteps;
            stops.push(lerpColor(colors[i], colors[i + 1], t));
        }
    }
    stops.push(colors[colors.length - 1]);
    return stops;
}

// ========================================
// Time Utilities
// ========================================

/**
 * Format milliseconds as MM:SS or HH:MM:SS
 */
export function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format score with commas
 */
export function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle function
 */
export function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// DOM Utilities
// ========================================

/**
 * Create element with attributes and children
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

/**
 * Query selector with optional context
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Query selector all with optional context
 */
export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

/**
 * Add multiple event listeners
 */
export function on(element, events, handler, options) {
    events.split(' ').forEach(event => {
        element.addEventListener(event, handler, options);
    });
}

/**
 * Remove multiple event listeners
 */
export function off(element, events, handler, options) {
    events.split(' ').forEach(event => {
        element.removeEventListener(event, handler, options);
    });
}

// ========================================
// Storage Utilities
// ========================================

/**
 * Safe localStorage get
 */
export function storageGet(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Safe localStorage set
 */
export function storageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/**
 * Safe localStorage remove
 */
export function storageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

// ========================================
// Device Detection
// ========================================

/**
 * Check if device is mobile
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
           window.innerWidth <= 768;
}

/**
 * Check if device supports touch
 */
export function isTouchDevice() {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           navigator.msMaxTouchPoints > 0;
}

/**
 * Check if prefers reduced motion
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if prefers high contrast
 */
export function prefersHighContrast() {
    return window.matchMedia('(prefers-contrast: high)').matches;
}

// ========================================
// Performance
// ========================================

/**
 * Request animation frame polyfill with timestamp
 */
export function raf(callback) {
    return requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 */
export function caf(id) {
    cancelAnimationFrame(id);
}

/**
 * Simple performance timer
 */
export class Timer {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.running = false;
    }
    
    start() {
        this.startTime = performance.now();
        this.running = true;
    }
    
    stop() {
        this.endTime = performance.now();
        this.running = false;
    }
    
    getElapsed() {
        const end = this.running ? performance.now() : this.endTime;
        return end - this.startTime;
    }
    
    reset() {
        this.startTime = 0;
        this.endTime = 0;
        this.running = false;
    }
}

// ========================================
// Easing Functions
// ========================================

export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
        ? Math.pow(2, 20 * t - 10) / 2 
        : (2 - Math.pow(2, -20 * t + 10)) / 2,
    easeInBack: t => t * t * (2.70158 * t - 1.70158),
    easeOutBack: t => 1 + --t * t * (2.70158 * t + 1.70158),
    easeInOutBack: t => t < 0.5 
        ? t * t * (7 * t - 2.5) * 2 
        : 1 + --t * t * 2 * (7 * t + 2.5),
    easeOutElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 0.75) + 1;
    },
    easeOutBounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
};

// ========================================
// Vector2 Class
// ========================================

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    static fromAngle(angle, length = 1) {
        return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    
    clone() {
        return new Vector2(this.x, this.y);
    }
    
    copy(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }
    
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    
    subtract(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    divide(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }
    
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }
    
    distanceTo(other) {
        return Math.sqrt(this.distanceToSq(other));
    }
    
    distanceToSq(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return dx * dx + dy * dy;
    }
    
    lerp(other, t) {
        this.x = lerp(this.x, other.x, t);
        this.y = lerp(this.y, other.y, t);
        return this;
    }
    
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    
    toString() {
        return `(${this.x}, ${this.y})`;
    }
}

// ========================================
// Event Emitter
// ========================================

export class EventEmitter {
    constructor() {
        this.events = new Map();
    }
    
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(listener);
        return this;
    }
    
    off(event, listener) {
        if (this.events.has(event)) {
            this.events.get(event).delete(listener);
        }
        return this;
    }
    
    emit(event, ...args) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(listener => {
                try {
                    listener(...args);
                } catch (e) {
                    console.error(`Error in event listener for ${event}:`, e);
                }
            });
        }
        return this;
    }
    
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
    }
    
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
        return this;
    }
}