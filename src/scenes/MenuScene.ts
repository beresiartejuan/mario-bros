import Phaser from 'phaser'
import { GAME_WIDTH, GROUND_TOP, textStyle } from '../constants'
import {
	createCubeVisual,
	createGameTextures,
	createGround,
	createScenery,
	lookCube,
	type Scenery,
	updateScenery,
} from '../graphics'
import { sfx } from '../sfx'
import { loadStats } from '../storage'

export class MenuScene extends Phaser.Scene {
	private scenery!: Scenery
	private muteText!: Phaser.GameObjects.Text
	private starting = false

	constructor() {
		super({ key: 'MenuScene' })
	}

	create() {
		this.starting = false
		createGameTextures(this)
		sfx.bind(this.sound)

		this.scenery = createScenery(this)
		createGround(this)

		const cx = GAME_WIDTH / 2

		// Título
		const title = this.add
			.text(cx, 105, 'EL CUBO ROJO', textStyle(68, '#ff2d2d', 10))
			.setOrigin(0.5)
		this.tweens.add({
			targets: title,
			y: 113,
			duration: 1400,
			yoyo: true,
			repeat: -1,
			ease: 'Sine.inOut',
		})
		this.add
			.text(cx, 168, 'Sobrevive, salta y recolecta', textStyle(22))
			.setOrigin(0.5)

		// Controles
		this.add
			.graphics()
			.fillStyle(0x000000, 0.3)
			.fillRoundedRect(cx - 250, 200, 500, 180, 14)
		const controls = [
			'← →  /  A D   ·   Moverse',
			'↑  /  W  /  ESPACIO   ·   Saltar (doble salto)',
			'Mantén el salto para llegar más alto',
			'Salta sobre los enemigos · 25 monedas = +1 vida',
			'P / ESC   ·   Pausa          M   ·   Sonido',
		]
		controls.forEach((line, i) => {
			this.add
				.text(cx, 225 + i * 32, line, textStyle(18, '#ffffff', 3))
				.setOrigin(0.5)
		})

		// Estadísticas guardadas
		const stats = loadStats()
		this.add
			.text(
				cx,
				405,
				`Récord: ${stats.highScore}   ·   Mejor tiempo: ${stats.bestTime}s   ·   Partidas: ${stats.gamesPlayed}`,
				textStyle(17, '#FFD700', 3)
			)
			.setOrigin(0.5)

		const prompt = this.add
			.text(cx, 448, 'Pulsa ESPACIO o haz clic para jugar', textStyle(24))
			.setOrigin(0.5)
		this.tweens.add({
			targets: prompt,
			alpha: 0.35,
			duration: 650,
			yoyo: true,
			repeat: -1,
		})

		this.muteText = this.add
			.text(GAME_WIDTH - 12, 590, '', textStyle(13, '#ffffff', 3))
			.setOrigin(1, 1)
			.setAlpha(0.85)
		this.refreshMuteText()

		// El protagonista saltando sobre el suelo
		const cube = createCubeVisual(this, cx, GROUND_TOP)
		this.tweens.add({
			targets: cube.root,
			y: GROUND_TOP - 45,
			duration: 380,
			yoyo: true,
			repeat: -1,
			ease: 'Quad.out',
		})
		this.time.addEvent({
			delay: 900,
			loop: true,
			callback: () =>
				lookCube(cube, Phaser.Math.Between(-1, 1), Phaser.Math.Between(-1, 1)),
		})

		const keyboard = this.input.keyboard
		keyboard?.on('keydown-SPACE', this.startGame, this)
		keyboard?.on('keydown-ENTER', this.startGame, this)
		keyboard?.on('keydown-M', this.toggleMute, this)
		this.input.on('pointerdown', this.startGame, this)

		this.cameras.main.fadeIn(250, 0, 0, 0)
	}

	update(_time: number, delta: number) {
		updateScenery(this.scenery, delta)
	}

	private refreshMuteText() {
		this.muteText.setText(sfx.muted ? 'M: activar sonido 🔇' : 'M: silenciar 🔊')
	}

	private toggleMute() {
		sfx.toggleMute()
		this.refreshMuteText()
		sfx.select()
	}

	private startGame() {
		if (this.starting) return
		this.starting = true
		sfx.select()
		this.cameras.main.fadeOut(220, 0, 0, 0)
		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
			this.scene.start('GameScene')
		)
	}
}
