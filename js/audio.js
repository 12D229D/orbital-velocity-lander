/**
 * AudioSynth class for dynamic thruster sound generation using Web Audio API
 */
class AudioSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        
        // Settings for thruster sound
        this.baseFreq = 50; // Low rumble
    }
    
    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        if (!this.oscillator) {
            this.oscillator = this.ctx.createOscillator();
            this.gainNode = this.ctx.createGain();
            
            // Use a combination of sawtooth and lowpass filter for a rumbling sound
            this.oscillator.type = 'sawtooth';
            
            // Filter to muffle the harsh sawtooth
            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 400; // Cut off high frequencies
            
            this.oscillator.connect(this.filter);
            this.filter.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);
            
            this.oscillator.frequency.value = this.baseFreq;
            this.gainNode.gain.value = 0; // Start silent
            
            this.oscillator.start();
        }
    }
    
    setThrust(thrustLevel) {
        if (!this.oscillator) return;
        
        // thrustLevel should be 0 to 1
        if (thrustLevel > 0) {
            this.isPlaying = true;
            // Ramp up gain based on thrust
            const targetGain = thrustLevel * 0.3; // max volume 0.3
            this.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
            
            // Modulate frequency slightly based on thrust
            const targetFreq = this.baseFreq + (thrustLevel * 30);
            this.oscillator.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
            this.filter.frequency.setTargetAtTime(400 + (thrustLevel * 600), this.ctx.currentTime, 0.1);
        } else {
            if (this.isPlaying) {
                // Ramp down quickly
                this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
                this.isPlaying = false;
            }
        }
    }
    
    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const noiseBufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < noiseBufferSize; i++) {
            // White noise
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;
        
        // Envelope for explosion
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        
        noise.start();
    }
    
    playSuccess() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, this.ctx.currentTime + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.2); // E5
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.6);
    }
}
