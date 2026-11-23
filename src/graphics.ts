import Phaser from 'phaser'
import {
	COLORS,
	GAME_HEIGHT,
	GAME_WIDTH,
	GROUND_HEIGHT,
	GROUND_TOP,
	GROUND_Y,
} from './constants'

// ---------------------------------------------------------------------------
// Texturas generadas con Canvas (no hay assets externos)
// ---------------------------------------------------------------------------

function addCanvasTexture(
	scene: Phaser.Scene,
	key: string,
	width: number,
	height: number,
	draw: (ctx: CanvasRenderingContext2D) => void
) {
	if (scene.textures.exists(key)) return
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) return
	draw(ctx)
	scene.textures.addCanvas(key, canvas)
}

function drawCenteredText(
	ctx: CanvasRenderingContext2D,
	text: string,
	font: string,
	y = 16
) {
	ctx.fillStyle = '#FFFFFF'
	ctx.font = font
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillText(text, 16, y)
}

function drawPolygon(
	ctx: CanvasRenderingContext2D,
	sides: number,
	radius: number,
	rotation: number
) {
	ctx.beginPath()
	for (let i = 0; i < sides; i++) {
		const angle = (i * 2 * Math.PI) / sides + rotation
		const x = 16 + radius * Math.cos(angle)
		const y = 16 + radius * Math.sin(angle)
		if (i === 0) ctx.moveTo(x, y)
		else ctx.lineTo(x, y)
	}
	ctx.closePath()
	ctx.fill()
}

/** Crea (una sola vez) todas las texturas que usan las escenas. */
export function createGameTextures(scene: Phaser.Scene) {
	// Moneda: círculo dorado con símbolo $
	addCanvasTexture(scene, 'coin', 32, 32, (ctx) => {
		const gradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 14)
		gradient.addColorStop(0, '#FFD700')
		gradient.addColorStop(0.7, '#FFA500')
		gradient.addColorStop(1, '#B8860B')
		ctx.fillStyle = gradient
		ctx.beginPath()
		ctx.arc(16, 16, 14, 0, Math.PI * 2)
		ctx.fill()
		ctx.strokeStyle = '#FFF8DC'
		ctx.lineWidth = 2
		ctx.stroke()
		ctx.fillStyle = '#8B4513'
		ctx.font = 'bold 18px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText('$', 16, 17)
	})

	// Power-up de invencibilidad: cuadrado cyan con estrella
	addCanvasTexture(scene, 'powerup_invincible', 32, 32, (ctx) => {
		ctx.fillStyle = '#00FFFF'
		ctx.fillRect(4, 4, 24, 24)
		ctx.strokeStyle = '#FFFFFF'
		ctx.lineWidth = 2
		ctx.strokeRect(4, 4, 24, 24)
		drawCenteredText(ctx, '⭐', '16px Arial')
	})

	// Power-up de super salto: triángulo rosa con flecha
	addCanvasTexture(scene, 'powerup_jump', 32, 32, (ctx) => {
		ctx.fillStyle = '#FF69B4'
		ctx.beginPath()
		ctx.moveTo(16, 4)
		ctx.lineTo(28, 28)
		ctx.lineTo(4, 28)
		ctx.closePath()
		ctx.fill()
		ctx.strokeStyle = '#FFFFFF'
		ctx.lineWidth = 2
		ctx.stroke()
		drawCenteredText(ctx, '↑', 'bold 14px Arial', 19)
	})

	// Power-up de velocidad: círculo naranja con rayo
	addCanvasTexture(scene, 'powerup_speed', 32, 32, (ctx) => {
		ctx.fillStyle = '#FFA500'
		ctx.beginPath()
		ctx.arc(16, 16, 12, 0, Math.PI * 2)
		ctx.fill()
		drawCenteredText(ctx, '⚡', 'bold 16px Arial', 17)
	})

	// Enemigo perseguidor: rombo púrpura con cara enojada
	addCanvasTexture(scene, 'enemy', 32, 32, (ctx) => {
		ctx.fillStyle = '#800080'
		ctx.beginPath()
		ctx.moveTo(16, 2)
		ctx.lineTo(30, 16)
		ctx.lineTo(16, 30)
		ctx.lineTo(2, 16)
		ctx.closePath()
		ctx.fill()
		drawCenteredText(ctx, '>:|', 'bold 10px Arial')
	})

	// Enemigo patrulla: pentágono naranja
	addCanvasTexture(scene, 'enemy_patrol', 32, 32, (ctx) => {
		ctx.fillStyle = '#FF4500'
		drawPolygon(ctx, 5, 14, -Math.PI / 2)
		drawCenteredText(ctx, 'P', 'bold 12px Arial')
	})

	// Enemigo volador: hexágono cyan
	addCanvasTexture(scene, 'enemy_flying', 32, 32, (ctx) => {
		ctx.fillStyle = '#00CED1'
		drawPolygon(ctx, 6, 12, 0)
		drawCenteredText(ctx, 'F', 'bold 12px Arial')
	})

	// Partícula genérica (se tiñe al emitir)
	addCanvasTexture(scene, 'particle', 16, 16, (ctx) => {
		ctx.beginPath()
		ctx.arc(8, 8, 6, 0, Math.PI * 2)
		ctx.fillStyle = '#ffffff'
		ctx.fill()
	})

	// Corazón para el HUD de vidas
	addCanvasTexture(scene, 'heart', 22, 20, (ctx) => {
		ctx.fillStyle = '#FF3B5C'
		ctx.strokeStyle = '#7A0020'
		ctx.lineWidth = 1.5
		ctx.beginPath()
		ctx.moveTo(11, 18)
		ctx.bezierCurveTo(-3, 9, 3, -1, 11, 5)
		ctx.bezierCurveTo(19, -1, 25, 9, 11, 18)
		ctx.closePath()
		ctx.fill()
		ctx.stroke()
		ctx.fillStyle = 'rgba(255,255,255,0.6)'
		ctx.beginPath()
		ctx.arc(7, 7, 2, 0, Math.PI * 2)
		ctx.fill()
	})

	// Fondo con gradiente de cielo
	addCanvasTexture(scene, 'gradientBg', GAME_WIDTH, GAME_HEIGHT, (ctx) => {
		const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
		gradient.addColorStop(0, '#87CEEB')
		gradient.addColorStop(0.7, '#B0E0E6')
		gradient.addColorStop(1, '#E0F6FF')
		ctx.fillStyle = gradient
		ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
	})

	// Nube
	addCanvasTexture(scene, 'cloud', 120, 64, (ctx) => {
		ctx.fillStyle = '#FFFFFF'
		const puffs = [
			[30, 40, 18],
			[55, 30, 24],
			[82, 38, 20],
			[60, 46, 18],
			[96, 46, 13],
		]
		for (const [x, y, r] of puffs) {
			ctx.beginPath()
			ctx.arc(x, y, r, 0, Math.PI * 2)
			ctx.fill()
		}
	})

	// Colinas lejanas (dos capas)
	addCanvasTexture(scene, 'hills', GAME_WIDTH, 200, (ctx) => {
		const layer = (color: string, height: (x: number) => number) => {
			ctx.fillStyle = color
			ctx.beginPath()
			ctx.moveTo(0, 200)
			for (let x = 0; x <= GAME_WIDTH; x += 10) ctx.lineTo(x, height(x))
			ctx.lineTo(GAME_WIDTH, 200)
			ctx.closePath()
			ctx.fill()
		}
		layer(
			'#BFE6D4',
			(x) => 95 - 40 * Math.sin(x / 130) - 18 * Math.sin(x / 57 + 1)
		)
		layer(
			'#94D1AE',
			(x) => 145 - 28 * Math.sin(x / 90 + 2) - 12 * Math.sin(x / 37)
		)
	})
}

// ---------------------------------------------------------------------------
// Escenario: cielo, colinas y nubes que se desplazan lentamente
// ---------------------------------------------------------------------------

export interface Scenery {
	clouds: { image: Phaser.GameObjects.Image; speed: number }[]
}

export function createScenery(scene: Phaser.Scene): Scenery {
	scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gradientBg').setDepth(-10)
	scene.add
		.image(GAME_WIDTH / 2, GROUND_TOP + 2, 'hills')
		.setOrigin(0.5, 1)
		.setDepth(-9)

	const clouds: Scenery['clouds'] = []
	for (let i = 0; i < 5; i++) {
		const image = scene.add
			.image(
				Phaser.Math.Between(0, GAME_WIDTH),
				Phaser.Math.Between(40, 240),
				'cloud'
			)
			.setDepth(-8)
			.setAlpha(Phaser.Math.FloatBetween(0.6, 0.9))
			.setScale(Phaser.Math.FloatBetween(0.6, 1.2))
		clouds.push({ image, speed: Phaser.Math.Between(6, 18) })
	}
	return { clouds }
}

export function updateScenery(scenery: Scenery, delta: number) {
	for (const cloud of scenery.clouds) {
		const image = cloud.image
		image.x += (cloud.speed * delta) / 1000
		if (image.x - image.displayWidth / 2 > GAME_WIDTH) {
			image.x = -image.displayWidth / 2
			image.y = Phaser.Math.Between(40, 240)
		}
	}
}

/** Dibuja el suelo y devuelve el rectángulo principal (para darle físicas). */
export function createGround(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
	const ground = scene.add.rectangle(
		GAME_WIDTH / 2,
		GROUND_Y,
		GAME_WIDTH,
		GROUND_HEIGHT,
		COLORS.ground
	)
	scene.add.rectangle(GAME_WIDTH / 2, GROUND_TOP + 3, GAME_WIDTH, 6, COLORS.groundTop)
	return ground
}

// ---------------------------------------------------------------------------
// El Cubo Rojo: dibujo del protagonista (separado de su cuerpo físico para
// poder deformarlo sin alterar las colisiones)
// ---------------------------------------------------------------------------

export const CUBE_WIDTH = 30
export const CUBE_HEIGHT = 40

const PUPIL_BASE = [
	{ x: -6, y: -26 },
	{ x: 6, y: -26 },
]

export interface CubeVisual {
	/** Contenedor con origen en los pies del cubo. */
	root: Phaser.GameObjects.Container
	body: Phaser.GameObjects.Rectangle
	pupils: Phaser.GameObjects.Rectangle[]
}

export function createCubeVisual(
	scene: Phaser.Scene,
	x: number,
	y: number
): CubeVisual {
	const body = scene.add
		.rectangle(0, -CUBE_HEIGHT / 2, CUBE_WIDTH, CUBE_HEIGHT, COLORS.player)
		.setStrokeStyle(2, COLORS.playerOutline)
	const shine = scene.add.rectangle(-8, -32, 5, 10, 0xffffff, 0.35)
	const eyes = PUPIL_BASE.map((p) => scene.add.rectangle(p.x, p.y, 8, 11, 0xffffff))
	const pupils = PUPIL_BASE.map((p) =>
		scene.add.rectangle(p.x, p.y, 4, 6, 0x111111)
	)
	const root = scene.add.container(x, y, [body, shine, ...eyes, ...pupils])
	return { root, body, pupils }
}

/** Mueve las pupilas hacia donde mira/se mueve el cubo. */
export function lookCube(cube: CubeVisual, dirX: number, dirY: number) {
	for (let i = 0; i < cube.pupils.length; i++) {
		cube.pupils[i].setPosition(
			PUPIL_BASE[i].x + dirX * 2,
			PUPIL_BASE[i].y + dirY
		)
	}
}
