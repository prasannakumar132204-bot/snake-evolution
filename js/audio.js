/**
 * SNAKE EVOLUTION - Audio System
 * Web Audio API based sound generation and management
 */

import { AUDIO_CONFIG, EVENTS } from './constants.js';
import { EventEmitter } from './utils.js';

class AudioManager extends EventEmitter {
    constructor() {
        super();
        this.audioContext = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.enabled = AUDIO_CONFIG.enabled;
        this.masterVolume = AUDIO_CONFIG.masterVolume;
        this.sfxVolume = AUDIO_CONFIG.sfxVolume;
        this.musicVolume = AUDIO_CONFIG.musicVolume;
        this.musicSource = null;
        this.musicBuffer = null;
        this.soundCache = new Map();
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            
            // Connect graph
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set volumes
            this.masterGain.gain.value = this.masterVolume;
            this.sfxGain.gain.value = this.sfxVolume;
            this.musicGain.gain.value = this.musicVolume;
            
            // Generate built-in sounds
            this.generateSounds();
            
            // Resume context on user interaction
            document.addEventListener('click', () => this.resume(), { once: true });
            document.addEventListener('keydown', () => this.resume(), { once: true });
            
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    generateSounds() {
        // Generate all procedural sounds
        Object.entries(AUDIO_CONFIG.tones).forEach(([name, frequencies]) => {
            this.soundCache.set(name, this.createToneBuffer(frequencies));
        });
    }
    
    createToneBuffer(frequencies, duration = 0.3, type = 'sine') {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            frequencies.forEach((freq, idx) => {
                const amplitude = 1 / (idx + 1) / frequencies.length;
                sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
            });
            
            // Apply envelope (attack/decay)
            const attackTime = 0.01;
            const decayTime = duration - attackTime;
            let envelope = 1;
            
            if (t < attackTime) {
                envelope = t / attackTime;
            } else {
                envelope = Math.max(0, 1 - (t - attackTime) / decayTime);
            }
            
            // Add some harmonics for richer sound
            sample *= envelope * 0.3;
            data[i] = sample;
        }
        
        return buffer;
    }
    
    playSound(name, options = {}) {
        if (!this.enabled || !this.audioContext || !this.soundCache.has(name)) return;
        
        const buffer = this.soundCache.get(name);
        if (!buffer) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.playbackRate.value = options.pitch || 1;
        
        gainNode.gain.value = (options.volume !== undefined ? options.volume : 1) * this.sfxVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        if (options.loop) {
            source.loop = true;
        }
        
        source.start(this.audioContext.currentTime + (options.delay || 0));
        
        return { source, gainNode, stop: () => source.stop() };
    }
    
    playTone(frequency, duration = 0.2, type = 'sine', volume = 1, delay = 0) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.value = volume * this.sfxVolume;
        
        // Envelope
        const now = this.audioContext.currentTime + delay;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.sfxVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    playChord(frequencies, duration = 0.3, type = 'sine', volume = 1) {
        frequencies.forEach((freq, i) => {
            this.playTone(freq, duration, type, volume / frequencies.length, i * 0.02);
        });
    }
    
    // Specific game sounds
    playEat(pitch = 1) {
        this.playSound('eat', { pitch });
    }
    
    playEvolve() {
        this.playSound('evolve', { volume: 1.2 });
        // Add a chord for extra impact
        setTimeout(() => this.playChord([523.25, 659.25, 783.99, 1046.5], 0.5, 'sine', 0.5), 100);
    }
    
    playBoost() {
        this.playSound('boost', { pitch: 1.2 });
    }
    
    playGameOver() {
        this.playSound('gameover', { volume: 1 });
        // Descending tone
        setTimeout(() => this.playTone(174.61, 0.5, 'sine', 0.5), 200);
        setTimeout(() => this.playTone(146.83, 0.5, 'sine', 0.5), 400);
        setTimeout(() => this.playTone(110, 0.8, 'sine', 0.5), 600);
    }
    
    playClick() {
        this.playSound('click', { volume: 0.5 });
    }
    
    playPowerup() {
        this.playSound('powerup', { volume: 0.8 });
    }
    
    playMoveSound(step) {
        // Subtle movement sound every few steps
        if (step % 5 === 0) {
            this.playTone(200 + (step % 10) * 10, 0.05, 'square', 0.05);
        }
    }
    
    // Music
    async loadMusic(url) {
        if (!this.audioContext) return;
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.warn('Failed to load music:', e);
            // Generate procedural ambient music
            this.generateAmbientMusic();
        }
    }
    
    generateAmbientMusic() {
        if (!this.audioContext) return;
        
        // Create a simple procedural ambient loop
        const sampleRate = this.audioContext.sampleRate;
        const duration = 30; // 30 second loop
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        // Chord progression: Am - F - C - G
        const chords = [
            [220, 261.63, 329.63],    // Am
            [174.61, 220, 261.63],    // F
            [130.81, 164.81, 196],    // C
            [146.83, 196, 220],       // G
        ];
        
        const chordDuration = duration / chords.length;
        
        for (let ch = 0; ch < 2; ch++) { // stereo
            const data = buffer.getChannelData(ch);
            const panFactor = ch === 0 ? 0.3 : -0.3; // slight stereo spread
            
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const chordIndex = Math.floor(t / chordDuration) % chords.length;
                const chord = chords[chordIndex];
                const chordTime = t % chordDuration;
                
                let sample = 0;
                
                // Base notes
                chord.forEach((freq, idx) => {
                    const amplitude = 0.02 / (idx + 1);
                    sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
                });
                
                // Slow pad swell
                const swell = Math.sin(2 * Math.PI * t / chordDuration) * 0.5 + 0.5;
                sample *= swell * 0.3;
                
                // Add subtle noise for texture
                sample += (Math.random() - 0.5) * 0.001;
                
                data[i] = sample;
            }
        }
        
        this.musicBuffer = buffer;
    }
    
    playMusic() {
        if (!this.enabled || !this.audioContext || !this.musicBuffer) return;
        
        this.stopMusic();
        
        this.musicSource = this.audioContext.createBufferSource();
        this.musicSource.buffer = this.musicBuffer;
        this.musicSource.loop = true;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.musicVolume;
        
        this.musicSource.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        this.musicSource.start();
    }
    
    stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource = null;
        }
    }
    
    pauseMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
        }
    }
    
    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = clamp(volume, 0, 1);
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = clamp(volume, 0, 1);
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = clamp(volume, 0, 1);
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }
    
    toggleMute() {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.enabled ? this.masterVolume : 0;
        }
        return this.enabled;
    }
    
    // Cleanup
    destroy() {
        this.stopMusic();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.soundCache.clear();
        this.initialized = false;
    }
}

// Helper
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Singleton instance
export const audio = new AudioManager();

// Auto-initialize on first user interaction
let initPromise = null;
export function initAudio() {
    if (!initPromise) {
        initPromise = audio.init();
    }
    return initPromise;
}