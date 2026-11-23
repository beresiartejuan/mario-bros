import './style.css'
import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './scenes/MenuScene'
import { PauseScene } from './scenes/PauseScene'

// Añade ?debug a la URL para ver las cajas de colisión
const debugPhysics = new URLSearchParams(window.location.search).has('debug')

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	parent: 'app',
	backgroundColor: '#87ceeb',
	scale: {
		// Se adapta al tamaño de la ventana manteniendo la proporción
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 800, x: 0 },
			debug: debugPhysics,
		},
	},
	scene: [MenuScene, GameScene, PauseScene],
}

new Phaser.Game(config)
