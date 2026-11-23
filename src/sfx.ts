import type Phaser from 'phaser'
import { loadMuted, saveMuted } from './storage'

// Efectos de sonido sintetizados con Web Audio: no hace falta cargar archivos.
// Se reutiliza el AudioContext de Phaser, que ya se encarga de desbloquearlo
// con la primera interacción del usuario y de suspenderlo al perder el foco.

interface ToneOptions {
	freq: number
	to?: number
	duration: number
	type?: OscillatorType
	volume?: number
	delay?: number
}

interface NoiseOptions {
	duration: number
	volume?: number
	delay?: number
	filter?: number
}

class SoundEffects {
	private ctx: AudioContext | null = null
	private output: GainNode | null = null
	private noiseBuffer: AudioBuffer | null = null
	muted = loadMuted()

	bind(sound: Phaser.Sound.BaseSoundManager) {
		if (this.ctx) return
		// Sólo el gestor Web Audio expone un AudioContext (HTML5 Audio / NoAudio no)
		if (!('context' in sound)) return
		const context = (sound as Phaser.Sound.WebAudioSoundManager).context
		if (!context) return
		this.ctx = context
		this.output = context.createGain()
		this.output.gain.value = 0.35
		this.output.connect(context.destination)
	}

	toggleMute(): boolean {
		this.muted = !this.muted
		saveMuted(this.muted)
		return this.muted
	}

	private ready(): AudioContext | null {
		const ctx = this.ctx
		if (this.muted || !ctx || !this.output) return null
		if (ctx.state === 'suspended') {
			ctx.resume().catch(() => undefined)
			return null
		}
		return ctx.state === 'running' ? ctx : null
	}

	private tone({
		freq,
		to,
		duration,
		type = 'square',
		volume = 0.1,
		delay = 0,
	}: ToneOptions) {
		const ctx = this.ready()
		if (!ctx || !this.output) return
		const start = ctx.currentTime + delay
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = type
		osc.frequency.setValueAtTime(freq, start)
		if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration)
		gain.gain.setValueAtTime(0.0001, start)
		gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
		osc.connect(gain)
		gain.connect(this.output)
		osc.start(start)
		osc.stop(start + duration + 0.05)
	}

	private noise({
		duration,
		volume = 0.1,
		delay = 0,
		filter = 1800,
	}: NoiseOptions) {
		const ctx = this.ready()
		if (!ctx || !this.output) return
		if (!this.noiseBuffer) {
			const length = Math.floor(ctx.sampleRate * 0.5)
			this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate)
			const data = this.noiseBuffer.getChannelData(0)
			for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
		}
		const start = ctx.currentTime + delay
		const source = ctx.createBufferSource()
		source.buffer = this.noiseBuffer
		const lowpass = ctx.createBiquadFilter()
		lowpass.type = 'lowpass'
		lowpass.frequency.value = filter
		const gain = ctx.createGain()
		gain.gain.setValueAtTime(volume, start)
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
		source.connect(lowpass)
		lowpass.connect(gain)
		gain.connect(this.output)
		source.start(start)
		source.stop(start + duration)
	}

	private arpeggio(
		freqs: number[],
		step: number,
		options: Omit<ToneOptions, 'freq'>
	) {
		for (let i = 0; i < freqs.length; i++) {
			this.tone({ ...options, freq: freqs[i], delay: i * step })
		}
	}

	jump() {
		this.tone({ freq: 280, to: 560, duration: 0.12, volume: 0.08 })
	}

	airJump() {
		this.tone({ freq: 420, to: 880, duration: 0.12, volume: 0.07 })
	}

	coin() {
		this.tone({ freq: 988, duration: 0.07, volume: 0.06 })
		this.tone({ freq: 1319, duration: 0.2, volume: 0.06, delay: 0.07 })
	}

	stomp(combo = 1) {
		const base = 180 * (1 + 0.12 * (combo - 1))
		this.tone({ freq: base * 2, to: base * 0.5, duration: 0.14, volume: 0.1 })
		this.noise({ duration: 0.08, volume: 0.12 })
	}

	hurt() {
		this.tone({
			freq: 320,
			to: 80,
			duration: 0.35,
			type: 'sawtooth',
			volume: 0.1,
		})
	}

	powerUp() {
		this.arpeggio([523, 659, 784, 1047], 0.06, {
			duration: 0.1,
			type: 'triangle',
			volume: 0.14,
		})
	}

	powerDown() {
		this.tone({
			freq: 700,
			to: 300,
			duration: 0.25,
			type: 'triangle',
			volume: 0.1,
		})
	}

	crack() {
		this.noise({ duration: 0.12, volume: 0.1, filter: 3000 })
	}

	breakPlatform() {
		this.noise({ duration: 0.3, volume: 0.18, filter: 1200 })
		this.tone({
			freq: 140,
			to: 60,
			duration: 0.2,
			type: 'triangle',
			volume: 0.1,
		})
	}

	levelUp() {
		this.arpeggio([392, 523, 659, 784, 1047], 0.08, {
			duration: 0.12,
			volume: 0.06,
		})
	}

	extraLife() {
		this.arpeggio([659, 784, 988, 1319], 0.07, {
			duration: 0.14,
			type: 'triangle',
			volume: 0.14,
		})
	}

	gameOver() {
		this.arpeggio([392, 330, 262, 196], 0.2, {
			duration: 0.3,
			type: 'triangle',
			volume: 0.14,
		})
	}

	select() {
		this.tone({ freq: 660, to: 990, duration: 0.08, volume: 0.06 })
	}

	pause() {
		this.tone({ freq: 520, duration: 0.06, volume: 0.05 })
		this.tone({ freq: 390, duration: 0.08, volume: 0.05, delay: 0.06 })
	}
}

export const sfx = new SoundEffects()
