import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../constants'
import { sfx } from '../sfx'

/** Capa que se muestra encima de GameScene mientras está en pausa. */
export class PauseScene extends Phaser.Scene {
	private soundText!: Phaser.GameObjects.Text
	private closing = false

	constructor() {
		super({ key: 'PauseScene' })
	}

	create() {
		this.closing = false
		const cx = GAME_WIDTH / 2

		this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
		this.add.text(cx, 220, 'PAUSA', textStyle(60, '#ffffff', 8)).setOrigin(0.5)

		this.add
			.text(cx, 300, 'P / ESC / clic: continuar', textStyle(20))
			.setOrigin(0.5)
		this.soundText = this.add.text(cx, 335, '', textStyle(20)).setOrigin(0.5)
		this.add.text(cx, 370, 'Q: salir al menú', textStyle(20)).setOrigin(0.5)
		this.refreshSoundText()

		const keyboard = this.input.keyboard
		keyboard?.on('keydown-P', this.resumeGame, this)
		keyboard?.on('keydown-ESC', this.resumeGame, this)
		keyboard?.on('keydown-M', this.toggleMute, this)
		keyboard?.on('keydown-Q', this.quitToMenu, this)
		this.input.on('pointerdown', this.resumeGame, this)
	}

	private refreshSoundText() {
		this.soundText.setText(`M: sonido ${sfx.muted ? 'OFF 🔇' : 'ON 🔊'}`)
	}

	private toggleMute() {
		sfx.toggleMute()
		this.refreshSoundText()
		sfx.select()
	}

	private resumeGame() {
		if (this.closing) return
		this.closing = true
		sfx.pause()
		this.scene.resume('GameScene')
		this.scene.stop()
	}

	private quitToMenu() {
		if (this.closing) return
		this.closing = true
		this.scene.stop('GameScene')
		this.scene.start('MenuScene')
	}
}
