import Phaser from 'phaser'
import { COLORS, GAME_WIDTH, GROUND_TOP, textStyle } from '../constants'
import {
	CUBE_HEIGHT,
	CUBE_WIDTH,
	type CubeVisual,
	createCubeVisual,
	createGameTextures,
	createGround,
	createScenery,
	lookCube,
	type Scenery,
	updateScenery,
} from '../graphics'
import { sfx } from '../sfx'
import { loadStats, recordGame, type Stats } from '../storage'

// ---------------------------------------------------------------------------
// Ajustes de jugabilidad
// ---------------------------------------------------------------------------

const PLAYER_SPAWN = { x: 100, y: 500 }

const MOVE = {
	speed: 200,
	superSpeed: 400,
	groundAccel: 2400,
	airAccel: 1500,
	groundDecel: 3000,
	airDecel: 900,
	turnBoost: 1.6, // aceleración extra al cambiar de sentido
}

const JUMP = {
	velocity: -400,
	superVelocity: -600,
	cutFactor: 0.45, // al soltar el salto antes de tiempo se recorta la subida
	coyoteMs: 100, // margen para saltar justo después de dejar una plataforma
	bufferMs: 120, // margen para pulsar salto justo antes de aterrizar
	stompBounce: -300,
	stompBounceHeld: -460,
}

const HURT = {
	invulnerableMs: 1500,
	controlLockMs: 220,
	knockbackX: 260,
	knockbackY: -280,
}

const START_LIVES = 3
const MAX_LIVES = 5
const COINS_PER_LIFE = 25
const COIN_VALUE = 50
const COIN_SCALE = 0.7
const STOMP_POINTS = 100
const STOMP_GRACE_MS = 150
const LEVEL_DURATION = 30000

const POWERUP_DURATION = 5000
const POWERUP_LIFETIME = 10000 // tiempo que un power-up espera a ser recogido

const ENEMY_POOL_SIZE = 8
const COIN_POOL_SIZE = 20
const POWERUP_POOL_SIZE = 3
const SPAWN_SAFE_MS = 600 // los enemigos recién aparecidos no hacen daño

const PLATFORM_HEIGHT = 20
const PLATFORM_WARNING_MS = 2500
const PLATFORM_SPAWN_INTERVAL = 4000
const MAX_DYNAMIC_PLATFORMS = 6
const BREAK_DELAY_MS = 450

// ---------------------------------------------------------------------------
// Tipos (const objects en lugar de enums por erasableSyntaxOnly)
// ---------------------------------------------------------------------------

const PowerUpType = {
	INVINCIBLE: 'invincible',
	SUPER_JUMP: 'superJump',
	SUPER_SPEED: 'superSpeed',
} as const
type PowerUpType = (typeof PowerUpType)[keyof typeof PowerUpType]
const POWERUP_KINDS = Object.values(PowerUpType)

const POWERUP_INFO: Record<
	PowerUpType,
	{ texture: string; color: number; label: string }
> = {
	[PowerUpType.INVINCIBLE]: {
		texture: 'powerup_invincible',
		color: COLORS.powerupInvincible,
		label: '⭐ INVENCIBLE ⭐',
	},
	[PowerUpType.SUPER_JUMP]: {
		texture: 'powerup_jump',
		color: COLORS.powerupJump,
		label: '🚀 SUPER SALTO 🚀',
	},
	[PowerUpType.SUPER_SPEED]: {
		texture: 'powerup_speed',
		color: COLORS.powerupSpeed,
		label: '⚡ VELOCIDAD ⚡',
	},
}

const EnemyType = {
	CHASER: 'chaser', // Persigue al jugador
	PATROL: 'patrol', // Patrulla una zona
	FLYING: 'flying', // Vuela hacia el jugador
} as const
type EnemyType = (typeof EnemyType)[keyof typeof EnemyType]

const ENEMY_INFO: Record<EnemyType, { texture: string; color: number }> = {
	[EnemyType.CHASER]: { texture: 'enemy', color: COLORS.enemy },
	[EnemyType.PATROL]: { texture: 'enemy_patrol', color: COLORS.enemyPatrol },
	[EnemyType.FLYING]: { texture: 'enemy_flying', color: COLORS.enemyFlying },
}

const PlatformType = {
	STATIC: 'static',
	MOVING: 'moving',
	BREAKABLE: 'breakable',
} as const
type PlatformType = (typeof PlatformType)[keyof typeof PlatformType]

const PLATFORM_COLORS: Record<PlatformType, number> = {
	[PlatformType.STATIC]: COLORS.platform,
	[PlatformType.MOVING]: COLORS.platformMoving,
	[PlatformType.BREAKABLE]: COLORS.platformBreakable,
}

type PlayerBody = Phaser.GameObjects.Rectangle & {
	body: Phaser.Physics.Arcade.Body
}

interface GamePlatform extends Phaser.GameObjects.Rectangle {
	body: Phaser.Physics.Arcade.StaticBody
	kind: PlatformType
	baseColor: number
	lifetime: number
	age: number
	isRemoving: boolean
	isBreaking: boolean
	// Sólo plataformas móviles
	startX: number
	endX: number
	speed: number
	direction: number
}

interface Enemy extends Phaser.Physics.Arcade.Image {
	body: Phaser.Physics.Arcade.Body
	kind: EnemyType
	safeUntil: number
	patrolStart: number
	patrolEnd: number
	patrolDir: number
}

interface Coin extends Phaser.Physics.Arcade.Image {
	body: Phaser.Physics.Arcade.Body
	baseY: number
	floatOffset: number
	appear: number // 0..1, animación de aparición
}

interface PowerUp extends Phaser.Physics.Arcade.Image {
	body: Phaser.Physics.Arcade.Body
	kind: PowerUpType
	baseY: number
	expiresAt: number
}

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter

interface ExtraKeys {
	w: Phaser.Input.Keyboard.Key
	a: Phaser.Input.Keyboard.Key
	d: Phaser.Input.Keyboard.Key
}

// Dificultad progresiva: sube un nivel cada LEVEL_DURATION ms
interface Difficulty {
	maxEnemies: number
	minEnemies: number
	spawnInterval: number
	enemySpeed: number
	chaserJump: number
	platformLifetime: number
}

function getDifficulty(level: number): Difficulty {
	const step = level - 1
	return {
		maxEnemies: Math.min(3 + level, ENEMY_POOL_SIZE),
		minEnemies: Math.min(2 + Math.floor(step / 2), 5),
		spawnInterval: Math.max(15000 - step * 2000, 5000),
		enemySpeed: Math.min(1 + step * 0.08, 1.6),
		chaserJump: Math.min(250 + step * 30, 420),
		platformLifetime: Math.max(1 - step * 0.05, 0.6),
	}
}

/** Acerca `value` a `target` como máximo `step` unidades. */
function approach(value: number, target: number, step: number): number {
	if (value < target) return Math.min(value + step, target)
	return Math.max(value - step, target)
}

const RAINBOW = [0xff0000, 0xff8800, 0xffee00, 0x00dd55, 0x00bbff, 0xaa44ff]

export class GameScene extends Phaser.Scene {
	// --- Jugador ---
	private player!: PlayerBody
	private cube!: CubeVisual
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
	private keys!: ExtraKeys
	private facing = 1
	private jumpsAvailable = 2
	private lastGroundedAt = 0
	private jumpBufferedAt = Number.NEGATIVE_INFINITY
	private isJumping = false
	private wasGrounded = false
	private prevVelocityY = 0
	private invulnerableUntil = 0
	private controlLockedUntil = 0
	private lastStompAt = Number.NEGATIVE_INFINITY
	private combo = 0
	private squashTween: Phaser.Tweens.Tween | null = null

	// --- Estado de la partida ---
	private lives = START_LIVES
	private score = 0
	private coinsCollected = 0
	private elapsed = 0 // ms jugados (no avanza en pausa)
	private survivalTime = 0
	private level = 1
	private difficulty = getDifficulty(1)
	private isGameOver = false
	private canRestart = false
	private isLeaving = false
	private resumeFrame = -1
	private stats!: Stats

	// --- Mundo ---
	private scenery!: Scenery
	private platforms!: Phaser.Physics.Arcade.StaticGroup
	private dynamicPlatforms: GamePlatform[] = []
	private platformTimer = 0

	// --- Enemigos ---
	private enemies!: Phaser.Physics.Arcade.Group
	private enemyPool: Enemy[] = []
	private enemySpawnTimer = 0

	// --- Monedas ---
	private coins!: Phaser.Physics.Arcade.Group
	private coinPool: Coin[] = []

	// --- Power-ups ---
	private powerUps!: Phaser.Physics.Arcade.Group
	private powerUpPool: PowerUp[] = []
	private activePowerUp: PowerUpType | null = null
	private powerUpTimer: Phaser.Time.TimerEvent | null = null
	private isInvincible = false

	// --- Partículas ---
	private coinParticles!: Emitter
	private enemyParticles!: Emitter
	private powerUpParticles!: Emitter
	private jumpParticles!: Emitter
	private dustParticles!: Emitter
	private debrisParticles!: Emitter

	// --- HUD ---
	private hearts: Phaser.GameObjects.Image[] = []
	private scoreText!: Phaser.GameObjects.Text
	private timeText!: Phaser.GameObjects.Text
	private coinsText!: Phaser.GameObjects.Text
	private levelText!: Phaser.GameObjects.Text
	private recordText!: Phaser.GameObjects.Text
	private muteText!: Phaser.GameObjects.Text
	private powerUpIndicator!: Phaser.GameObjects.Text
	private powerUpBar!: Phaser.GameObjects.Graphics

	constructor() {
		super({ key: 'GameScene' })
	}

	// Phaser llama a init() en cada arranque/reinicio de la escena, antes de
	// create(). Los campos de clase NO se reinician solos con scene.restart().
	init() {
		this.facing = 1
		this.jumpsAvailable = 2
		this.lastGroundedAt = 0
		this.jumpBufferedAt = Number.NEGATIVE_INFINITY
		this.isJumping = false
		this.wasGrounded = false
		this.prevVelocityY = 0
		this.invulnerableUntil = 0
		this.controlLockedUntil = 0
		this.lastStompAt = Number.NEGATIVE_INFINITY
		this.combo = 0
		this.squashTween = null

		this.lives = START_LIVES
		this.score = 0
		this.coinsCollected = 0
		this.elapsed = 0
		this.survivalTime = 0
		this.level = 1
		this.difficulty = getDifficulty(1)
		this.isGameOver = false
		this.canRestart = false
		this.isLeaving = false
		this.resumeFrame = -1

		this.dynamicPlatforms = []
		this.platformTimer = 0
		this.enemyPool = []
		this.enemySpawnTimer = 0
		this.coinPool = []
		this.powerUpPool = []
		this.activePowerUp = null
		this.powerUpTimer = null
		this.isInvincible = false
		this.hearts = []
	}

	create() {
		createGameTextures(this)
		sfx.bind(this.sound)
		this.stats = loadStats()

		this.scenery = createScenery(this)
		this.createParticleSystems()
		this.createWorld()
		this.createPlayer()
		this.createPools()
		this.setupCollisions()
		this.setupInput()
		this.createHud()
		this.setupTimers()
		this.setupSceneEvents()

		// Contenido inicial
		this.createPlatform(200, 450, 150, PlatformType.STATIC)
		this.createPlatform(500, 350, 150, PlatformType.STATIC)
		this.createPlatform(150, 250, 120, PlatformType.MOVING)
		this.createPlatform(600, 200, 130, PlatformType.BREAKABLE)

		this.spawnEnemy(700, 500, EnemyType.CHASER)
		this.spawnEnemy(400, 300, EnemyType.PATROL)
		this.spawnEnemy(600, 100, EnemyType.FLYING)
		this.spawnInitialCoins()

		this.cameras.main.fadeIn(250, 0, 0, 0)
	}

	update(_time: number, delta: number) {
		updateScenery(this.scenery, delta)
		if (this.isGameOver) return

		// Limitar delta evita saltos enormes tras un tirón o al volver a la pestaña
		const dt = Math.min(delta, 100)
		this.elapsed += dt

		this.updateClock()
		this.updatePlayer(dt)
		this.updateEnemiesAI(dt)
		this.updatePlatforms(dt)
		this.updateCoins()
		this.updatePowerUps()
		this.updatePowerUpBar()

		this.enemySpawnTimer += dt
		if (this.enemySpawnTimer >= this.difficulty.spawnInterval) {
			this.enemySpawnTimer = 0
			this.spawnEnemyIfNeeded()
		}
	}

	// -------------------------------------------------------------------------
	// Creación
	// -------------------------------------------------------------------------

	private createParticleSystems() {
		const make = (
			config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
		) =>
			this.add
				.particles(0, 0, 'particle', { emitting: false, ...config })
				.setDepth(4)

		this.coinParticles = make({
			speed: { min: 50, max: 150 },
			scale: { start: 0.8, end: 0 },
			lifespan: 600,
			gravityY: 300,
			tint: COLORS.coin,
		})
		this.enemyParticles = make({
			speed: { min: 40, max: 140 },
			scale: { start: 0.8, end: 0 },
			lifespan: 500,
			gravityY: 200,
			tint: COLORS.enemy,
		})
		this.powerUpParticles = make({
			speed: { min: 20, max: 80 },
			scale: { start: 0.6, end: 0 },
			lifespan: 800,
			gravityY: 0,
		})
		this.jumpParticles = make({
			speed: { min: 20, max: 50 },
			scale: { start: 0.5, end: 0 },
			lifespan: 350,
			gravityY: 100,
			tint: COLORS.particleJump,
			angle: { min: 60, max: 120 },
		})
		this.dustParticles = make({
			speed: { min: 30, max: 90 },
			scale: { start: 0.5, end: 0 },
			lifespan: 400,
			gravityY: -20,
			tint: COLORS.dust,
			angle: { min: 200, max: 340 },
		})
		this.debrisParticles = make({
			speed: { min: 60, max: 200 },
			scale: { start: 0.7, end: 0.2 },
			lifespan: 700,
			gravityY: 900,
			tint: COLORS.platformBreakable,
			angle: { min: 200, max: 340 },
		})
	}

	private createWorld() {
		this.platforms = this.physics.add.staticGroup()
		this.platforms.add(createGround(this))
	}

	private createPlayer() {
		// El cuerpo físico es un rectángulo invisible; lo que se ve es this.cube,
		// que puede estirarse/aplastarse sin afectar a las colisiones.
		const player = this.add.rectangle(
			PLAYER_SPAWN.x,
			PLAYER_SPAWN.y,
			CUBE_WIDTH,
			CUBE_HEIGHT
		) as PlayerBody
		player.setVisible(false)
		this.physics.add.existing(player)
		player.body.setCollideWorldBounds(true)
		player.body.setMaxVelocity(600, 900)
		this.player = player

		this.cube = createCubeVisual(
			this,
			player.x,
			player.y + CUBE_HEIGHT / 2
		)
		this.cube.root.setDepth(3)
	}

	private createPools() {
		// IMPORTANTE: al añadir un objeto a un grupo de físicas, el grupo le
		// aplica sus valores por defecto (gravedad, rebote, límites...). Por eso
		// cada cuerpo se configura DESPUÉS de group.add().
		this.enemies = this.physics.add.group()
		for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
			const enemy = this.physics.add.image(0, 0, 'enemy') as Enemy
			this.enemies.add(enemy)
			enemy.setDisplaySize(35, 35).setDepth(2)
			enemy.body.setCollideWorldBounds(true)
			enemy.kind = EnemyType.CHASER
			enemy.safeUntil = 0
			enemy.patrolStart = 0
			enemy.patrolEnd = 0
			enemy.patrolDir = 1
			// Desactivar también el cuerpo: un objeto inactivo pero con cuerpo
			// habilitado sigue colisionando aunque sea invisible.
			enemy.disableBody(true, true)
			this.enemyPool.push(enemy)
		}

		this.coins = this.physics.add.group()
		for (let i = 0; i < COIN_POOL_SIZE; i++) {
			const coin = this.physics.add.image(0, 0, 'coin') as Coin
			this.coins.add(coin)
			coin.body.setAllowGravity(false)
			coin.setDepth(1)
			coin.baseY = 0
			coin.floatOffset = Math.random() * Math.PI * 2
			coin.appear = 0
			coin.disableBody(true, true)
			this.coinPool.push(coin)
		}

		this.powerUps = this.physics.add.group()
		for (let i = 0; i < POWERUP_POOL_SIZE; i++) {
			const powerUp = this.physics.add.image(
				0,
				0,
				'powerup_invincible'
			) as PowerUp
			this.powerUps.add(powerUp)
			powerUp.body.setAllowGravity(false)
			powerUp.setDepth(1)
			powerUp.kind = PowerUpType.INVINCIBLE
			powerUp.baseY = 0
			powerUp.expiresAt = 0
			powerUp.disableBody(true, true)
			this.powerUpPool.push(powerUp)
		}
	}

	private setupCollisions() {
		this.physics.add.collider(this.player, this.platforms, (_player, platform) =>
			this.onPlayerTouchPlatform(platform as GamePlatform)
		)
		this.physics.add.collider(this.enemies, this.platforms)
		this.physics.add.collider(this.enemies, this.enemies)
		this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
			this.onPlayerTouchEnemy(enemy as Enemy)
		)
		this.physics.add.overlap(this.player, this.coins, (_player, coin) =>
			this.collectCoin(coin as Coin)
		)
		this.physics.add.overlap(this.player, this.powerUps, (_player, powerUp) =>
			this.collectPowerUp(powerUp as PowerUp)
		)
	}

	private setupInput() {
		const keyboard = this.input.keyboard
		if (!keyboard) throw new Error('El juego necesita el plugin de teclado')

		this.cursors = keyboard.createCursorKeys()
		this.keys = keyboard.addKeys({
			w: Phaser.Input.Keyboard.KeyCodes.W,
			a: Phaser.Input.Keyboard.KeyCodes.A,
			d: Phaser.Input.Keyboard.KeyCodes.D,
		}) as ExtraKeys

		keyboard.on('keydown-P', this.openPause, this)
		keyboard.on('keydown-ESC', this.handleEscape, this)
		keyboard.on('keydown-M', this.toggleMute, this)
		keyboard.on('keydown-SPACE', this.tryRestart, this)
		keyboard.on('keydown-ENTER', this.tryRestart, this)
		this.input.on('pointerdown', this.tryRestart, this)
	}

	private setupTimers() {
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => this.addScore(10 * this.level),
		})
		this.time.addEvent({
			delay: 3000,
			loop: true,
			callback: this.spawnCoinIfNeeded,
			callbackScope: this,
		})
		this.time.addEvent({
			delay: 18000,
			loop: true,
			callback: this.spawnPowerUpIfNeeded,
			callbackScope: this,
		})
	}

	private setupSceneEvents() {
		// Los listeners de this.events y this.game.events sobreviven a
		// scene.restart(), así que se retiran explícitamente al cerrar la escena.
		this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncPlayerVisual, this)
		this.events.on(Phaser.Scenes.Events.RESUME, this.onResume, this)
		this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this)
		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.events.off(
				Phaser.Scenes.Events.POST_UPDATE,
				this.syncPlayerVisual,
				this
			)
			this.events.off(Phaser.Scenes.Events.RESUME, this.onResume, this)
			this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this)
		})
	}

	// -------------------------------------------------------------------------
	// HUD
	// -------------------------------------------------------------------------

	private createHud() {
		this.add
			.graphics()
			.setDepth(9)
			.fillStyle(0x000000, 0.28)
			.fillRoundedRect(8, 8, 196, 140, 10)

		for (let i = 0; i < MAX_LIVES; i++) {
			this.hearts.push(this.add.image(28 + i * 26, 28, 'heart').setDepth(10))
		}

		this.scoreText = this.add.text(18, 44, '', textStyle(18)).setDepth(10)
		this.timeText = this.add.text(18, 68, '', textStyle(18)).setDepth(10)
		this.coinsText = this.add
			.text(18, 92, '', textStyle(18, '#FFD700'))
			.setDepth(10)
		this.levelText = this.add.text(18, 116, '', textStyle(18)).setDepth(10)

		this.recordText = this.add
			.text(GAME_WIDTH - 16, 14, '', textStyle(18, '#FFD700'))
			.setOrigin(1, 0)
			.setDepth(10)
		this.muteText = this.add
			.text(GAME_WIDTH - 16, 40, '', textStyle(16))
			.setOrigin(1, 0)
			.setDepth(10)
		this.add
			.text(GAME_WIDTH - 12, 590, 'P: pausa · M: sonido', textStyle(13, '#ffffff', 3))
			.setOrigin(1, 1)
			.setAlpha(0.8)
			.setDepth(10)

		this.powerUpIndicator = this.add
			.text(GAME_WIDTH / 2, 26, '', textStyle(22))
			.setOrigin(0.5)
			.setDepth(10)
			.setVisible(false)
		this.powerUpBar = this.add.graphics().setDepth(10)

		this.refreshHud()
	}

	private refreshHud() {
		this.updateLivesHud()
		this.scoreText.setText(`Puntos: ${this.score}`)
		this.timeText.setText(`Tiempo: ${this.survivalTime}s`)
		this.coinsText.setText(`Monedas: ${this.coinsCollected}`)
		this.levelText.setText(`Nivel: ${this.level}`)
		this.updateRecordHud()
		this.muteText.setText(sfx.muted ? '🔇 Sin sonido' : '')
	}

	private updateLivesHud() {
		this.hearts.forEach((heart, i) => {
			heart.setAlpha(i < this.lives ? 1 : 0.2)
		})
	}

	private updateRecordHud() {
		const record = Math.max(this.stats.highScore, this.score)
		this.recordText.setText(`Récord: ${record}`)
	}

	private addScore(points: number) {
		this.score += points
		this.scoreText.setText(`Puntos: ${this.score}`)
		this.updateRecordHud()
	}

	private popText(x: number, y: number, text: string, color = '#ffffff') {
		const label = this.add
			.text(x, y, text, textStyle(18, color))
			.setOrigin(0.5)
			.setDepth(6)
		this.tweens.add({
			targets: label,
			y: y - 40,
			alpha: 0,
			duration: 800,
			ease: 'Cubic.out',
			onComplete: () => label.destroy(),
		})
	}

	private updateClock() {
		const seconds = Math.floor(this.elapsed / 1000)
		if (seconds !== this.survivalTime) {
			this.survivalTime = seconds
			this.timeText.setText(`Tiempo: ${seconds}s`)
		}

		const level = 1 + Math.floor(this.elapsed / LEVEL_DURATION)
		if (level !== this.level) this.levelUp(level)
	}

	private levelUp(level: number) {
		this.level = level
		this.difficulty = getDifficulty(level)
		this.levelText.setText(`Nivel: ${level}`)
		sfx.levelUp()

		const banner = this.add
			.text(GAME_WIDTH / 2, 210, `¡NIVEL ${level}!`, textStyle(48, '#FFD700', 8))
			.setOrigin(0.5)
			.setDepth(15)
			.setAlpha(0)
			.setScale(0.6)
		const subtitle = this.add
			.text(GAME_WIDTH / 2, 255, 'Los enemigos se vuelven más rápidos', textStyle(18))
			.setOrigin(0.5)
			.setDepth(15)
			.setAlpha(0)
		this.tweens.add({
			targets: banner,
			alpha: 1,
			scale: 1,
			duration: 250,
			ease: 'Back.out',
			hold: 1200,
			yoyo: true,
			onComplete: () => banner.destroy(),
		})
		this.tweens.add({
			targets: subtitle,
			alpha: 1,
			duration: 250,
			hold: 1200,
			yoyo: true,
			onComplete: () => subtitle.destroy(),
		})

		this.spawnEnemyIfNeeded()
	}

	// -------------------------------------------------------------------------
	// Jugador
	// -------------------------------------------------------------------------

	private updatePlayer(dt: number) {
		const body = this.player.body
		const JustDown = Phaser.Input.Keyboard.JustDown

		// "En el suelo" sólo si no está subiendo: evita recargar el doble salto
		// en fotogramas sin paso de física (monitores de más de 60 Hz).
		const grounded =
			(body.blocked.down || body.touching.down) && body.velocity.y >= 0

		const left = this.cursors.left.isDown || this.keys.a.isDown
		const right = this.cursors.right.isDown || this.keys.d.isDown
		// Cada JustDown se evalúa por separado para consumir su estado
		const pressedUp = JustDown(this.cursors.up)
		const pressedSpace = JustDown(this.cursors.space)
		const pressedW = JustDown(this.keys.w)
		const jumpPressed = pressedUp || pressedSpace || pressedW
		const jumpHeld = this.isJumpHeld()

		// Aterrizaje y recarga de saltos
		if (grounded) {
			if (!this.wasGrounded) this.onLand(this.prevVelocityY)
			this.lastGroundedAt = this.elapsed
			this.jumpsAvailable = 2
		} else if (
			this.jumpsAvailable === 2 &&
			this.elapsed - this.lastGroundedAt > JUMP.coyoteMs
		) {
			// Se cayó de una plataforma sin saltar: le queda sólo el salto aéreo
			this.jumpsAvailable = 1
		}

		// Salto con coyote time + buffer de salto + doble salto
		if (jumpPressed) this.jumpBufferedAt = this.elapsed
		if (this.elapsed - this.jumpBufferedAt <= JUMP.bufferMs) {
			const coyote = this.elapsed - this.lastGroundedAt <= JUMP.coyoteMs
			if ((grounded || coyote) && this.jumpsAvailable === 2) {
				this.jump(false)
				this.jumpsAvailable = 1
			} else if (!grounded && jumpPressed && this.jumpsAvailable > 0) {
				this.jump(true)
				this.jumpsAvailable = 0
			}
		}

		// Salto variable: soltar el botón recorta la subida
		if (this.isJumping && !jumpHeld && body.velocity.y < 0) {
			body.setVelocityY(body.velocity.y * JUMP.cutFactor)
			this.isJumping = false
		}
		if (body.velocity.y >= 0) this.isJumping = false

		// Movimiento horizontal con aceleración (bloqueado brevemente tras un golpe)
		const dir = (right ? 1 : 0) - (left ? 1 : 0)
		if (this.elapsed >= this.controlLockedUntil) {
			const maxSpeed =
				this.activePowerUp === PowerUpType.SUPER_SPEED
					? MOVE.superSpeed
					: MOVE.speed
			const vx = body.velocity.x
			let accel: number
			if (dir === 0) {
				accel = grounded ? MOVE.groundDecel : MOVE.airDecel
			} else {
				accel = grounded ? MOVE.groundAccel : MOVE.airAccel
				if (vx !== 0 && Math.sign(vx) !== dir) accel *= MOVE.turnBoost
			}
			body.setVelocityX(approach(vx, dir * maxSpeed, (accel * dt) / 1000))
			if (dir !== 0) this.facing = dir
		}

		this.wasGrounded = grounded
		this.prevVelocityY = body.velocity.y
	}

	private isJumpHeld(): boolean {
		return (
			this.cursors.up.isDown || this.cursors.space.isDown || this.keys.w.isDown
		)
	}

	private jump(inAir: boolean) {
		const velocity =
			this.activePowerUp === PowerUpType.SUPER_JUMP
				? JUMP.superVelocity
				: JUMP.velocity
		this.player.body.setVelocityY(velocity)
		this.isJumping = true
		this.jumpBufferedAt = Number.NEGATIVE_INFINITY
		this.squash(0.75, 1.25)
		this.jumpParticles.emitParticleAt(
			this.player.x,
			this.player.y + CUBE_HEIGHT / 2,
			inAir ? 8 : 6
		)
		if (inAir) sfx.airJump()
		else sfx.jump()
	}

	private onLand(fallSpeed: number) {
		this.combo = 0
		this.isJumping = false
		if (fallSpeed > 250) {
			this.squash(1.25, 0.78)
			this.dustParticles.emitParticleAt(
				this.player.x,
				this.player.y + CUBE_HEIGHT / 2,
				Math.min(10, Math.round(fallSpeed / 80))
			)
		}
	}

	private squash(scaleX: number, scaleY: number) {
		this.squashTween?.stop()
		this.cube.root.setScale(scaleX, scaleY)
		this.squashTween = this.tweens.add({
			targets: this.cube.root,
			scaleX: 1,
			scaleY: 1,
			duration: 180,
			ease: 'Back.out',
		})
	}

	/** Sincroniza el dibujo del cubo con su cuerpo físico (tras el paso de física). */
	private syncPlayerVisual() {
		const body = this.player.body
		const root = this.cube.root
		root.setPosition(this.player.x, this.player.y + CUBE_HEIGHT / 2)

		const lean = Phaser.Math.Clamp(body.velocity.x / 4000, -0.08, 0.08)
		root.rotation = Phaser.Math.Linear(root.rotation, lean, 0.25)
		lookCube(
			this.cube,
			this.facing,
			Phaser.Math.Clamp(body.velocity.y / 350, -1.5, 2)
		)

		const blinking = !this.isGameOver && this.elapsed < this.invulnerableUntil
		root.setAlpha(blinking && Math.floor(this.elapsed / 70) % 2 === 0 ? 0.25 : 1)

		const color = this.isInvincible
			? RAINBOW[Math.floor(this.elapsed / 80) % RAINBOW.length]
			: COLORS.player
		if (this.cube.body.fillColor !== color) this.cube.body.setFillStyle(color)
	}

	private hurtPlayer(enemy: Enemy) {
		this.lives--
		this.updateLivesHud()
		this.combo = 0
		sfx.hurt()
		this.shakeCamera(0.02, 300)

		if (this.lives <= 0) {
			this.gameOver()
			return
		}

		// Retroceso + invulnerabilidad temporal en lugar de teletransportar
		this.invulnerableUntil = this.elapsed + HURT.invulnerableMs
		this.controlLockedUntil = this.elapsed + HURT.controlLockMs
		const away = this.player.x < enemy.x ? -1 : 1
		this.player.body.setVelocity(away * HURT.knockbackX, HURT.knockbackY)
		this.isJumping = false
		this.popText(this.player.x, this.player.y - 30, '-1 VIDA', '#FF5C7A')
	}

	private gainLife() {
		if (this.lives < MAX_LIVES) {
			this.lives++
			this.updateLivesHud()
			this.popText(this.player.x, this.player.y - 50, '+1 VIDA', '#7CFF7C')
		} else {
			this.addScore(500)
			this.popText(this.player.x, this.player.y - 50, '+500', '#7CFF7C')
		}
		sfx.extraLife()
	}

	private shakeCamera(intensity = 0.01, duration = 200) {
		this.cameras.main.shake(duration, intensity)
	}

	// -------------------------------------------------------------------------
	// Enemigos
	// -------------------------------------------------------------------------

	private spawnEnemy(x: number, y: number, kind: EnemyType): Enemy | null {
		const enemy = this.enemyPool.find((e) => !e.active)
		if (!enemy) return null

		enemy.kind = kind
		enemy.setTexture(ENEMY_INFO[kind].texture)
		enemy.enableBody(true, x, y, true, true)
		enemy.setDisplaySize(35, 35)
		enemy.body.setAllowGravity(kind !== EnemyType.FLYING)
		enemy.safeUntil = this.elapsed + SPAWN_SAFE_MS

		if (kind === EnemyType.PATROL) {
			const patrolRange = 150
			enemy.patrolStart = Math.max(50, x - patrolRange)
			enemy.patrolEnd = Math.min(GAME_WIDTH - 50, x + patrolRange)
			enemy.patrolDir = x < GAME_WIDTH / 2 ? 1 : -1
		}

		// Aparición: se materializa poco a poco y no hace daño mientras tanto
		this.tweens.killTweensOf(enemy)
		enemy.setAlpha(0)
		this.tweens.add({ targets: enemy, alpha: 1, duration: SPAWN_SAFE_MS })
		this.enemyParticles.setParticleTint(ENEMY_INFO[kind].color)
		this.enemyParticles.emitParticleAt(x, y, 6)

		return enemy
	}

	private deactivateEnemy(enemy: Enemy) {
		this.tweens.killTweensOf(enemy)
		enemy.disableBody(true, true)
	}

	private activeEnemyCount(): number {
		return this.enemyPool.filter((e) => e.active).length
	}

	private randomEnemyKind(): EnemyType {
		const rand = Math.random()
		if (rand < 0.45) return EnemyType.CHASER
		if (rand < 0.75) return EnemyType.PATROL
		return EnemyType.FLYING
	}

	/** Aparecen por el lado contrario al jugador, para que sea justo. */
	private farSideX(): number {
		return this.player.x < GAME_WIDTH / 2 ? GAME_WIDTH - 50 : 50
	}

	private spawnEnemyIfNeeded() {
		if (this.activeEnemyCount() < this.difficulty.maxEnemies) {
			this.spawnEnemy(this.farSideX(), 100, this.randomEnemyKind())
		}
	}

	private checkAndSpawnEnemies() {
		const active = this.activeEnemyCount()
		if (active >= this.difficulty.minEnemies) return
		const toSpawn = this.difficulty.minEnemies + 1 - active
		for (let i = 0; i < toSpawn; i++) {
			this.spawnEnemy(
				this.farSideX(),
				Phaser.Math.Between(100, 400),
				this.randomEnemyKind()
			)
		}
	}

	private onPlayerTouchEnemy(enemy: Enemy) {
		if (this.isGameOver || !enemy.active) return
		if (this.elapsed < enemy.safeUntil) return

		if (this.isInvincible) {
			this.killEnemy(enemy, STOMP_POINTS, 1)
			return
		}

		const body = this.player.body
		// "Recién pisó" permite aplastar a dos enemigos en el mismo salto
		const justStomped = this.elapsed - this.lastStompAt < STOMP_GRACE_MS
		const falling = body.velocity.y > 0 || justStomped
		if (falling && body.bottom < enemy.body.center.y + 4) {
			this.stompEnemy(enemy)
			return
		}

		// Tras un pisotón, un roce lateral con otro enemigo pegado no hace daño
		if (justStomped || this.elapsed < this.invulnerableUntil) return
		this.hurtPlayer(enemy)
	}

	private stompEnemy(enemy: Enemy) {
		this.combo++
		this.lastStompAt = this.elapsed
		const multiplier = Math.min(2 ** (this.combo - 1), 8)
		this.killEnemy(enemy, STOMP_POINTS * multiplier, this.combo)

		// Rebote: más alto si se mantiene pulsado el salto
		this.player.body.setVelocityY(
			this.isJumpHeld() ? JUMP.stompBounceHeld : JUMP.stompBounce
		)
		this.isJumping = false
		this.jumpsAvailable = Math.max(this.jumpsAvailable, 1)
		this.squash(1.2, 0.8)
		this.shakeCamera(0.004, 90)
	}

	private killEnemy(enemy: Enemy, points: number, combo: number) {
		// Guardar la posición ANTES de desactivarlo
		const { x, y } = enemy
		this.enemyParticles.setParticleTint(ENEMY_INFO[enemy.kind].color)
		this.enemyParticles.emitParticleAt(x, y, 12)
		this.deactivateEnemy(enemy)

		this.addScore(points)
		this.popText(x, y - 20, combo > 1 ? `+${points} x${combo}` : `+${points}`)
		sfx.stomp(combo)

		this.spawnEnemyDeathCoins(x, y)
		this.checkAndSpawnEnemies()
	}

	private updateEnemiesAI(dt: number) {
		for (const enemy of this.enemyPool) {
			if (!enemy.active) continue
			switch (enemy.kind) {
				case EnemyType.PATROL:
					this.updatePatrolEnemy(enemy, dt)
					break
				case EnemyType.FLYING:
					this.updateFlyingEnemy(enemy)
					break
				default:
					this.updateChaserEnemy(enemy, dt)
			}
		}
	}

	private updatePatrolEnemy(enemy: Enemy, dt: number) {
		const body = enemy.body
		if (enemy.x >= enemy.patrolEnd || body.blocked.right) enemy.patrolDir = -1
		else if (enemy.x <= enemy.patrolStart || body.blocked.left)
			enemy.patrolDir = 1

		body.setVelocityX(60 * this.difficulty.enemySpeed * enemy.patrolDir)

		// Salto ocasional si el jugador está cerca (probabilidad por tiempo,
		// no por fotograma, para que no dependa de los FPS)
		if (
			body.blocked.down &&
			Math.abs(enemy.x - this.player.x) < 80 &&
			Math.random() < 0.0006 * dt
		) {
			body.setVelocityY(-250)
		}
	}

	private updateFlyingEnemy(enemy: Enemy) {
		const speed = 120 * this.difficulty.enemySpeed
		const verticalSpeed = 80 * this.difficulty.enemySpeed
		const dx = this.player.x - enemy.x
		const dy = this.player.y - enemy.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		if (distance > 0) {
			enemy.body.setVelocity(
				(dx / distance) * speed,
				(dy / distance) * verticalSpeed
			)
		}
		// Oscilación adicional para hacerlo más interesante
		enemy.body.velocity.y += Math.sin(this.elapsed / 200) * 20
	}

	private updateChaserEnemy(enemy: Enemy, dt: number) {
		const body = enemy.body
		const onGround = body.blocked.down || body.touching.down

		if (onGround) {
			const platform = this.platformUnder(body)
			const platformDangerous =
				platform !== null &&
				(platform.isBreaking || platform.lifetime - platform.age < 3000)
			const playerFarVertically = Math.abs(enemy.y - this.player.y) > 60
			const playerRightAbove =
				Math.abs(enemy.x - this.player.x) < 40 && enemy.y > this.player.y

			if (
				platformDangerous ||
				playerRightAbove ||
				(playerFarVertically && Math.random() < 0.0012 * dt)
			) {
				body.setVelocityY(-this.difficulty.chaserJump)
			}
		}

		const speed = 100 * this.difficulty.enemySpeed
		if (enemy.x < this.player.x - 10) body.setVelocityX(speed)
		else if (enemy.x > this.player.x + 10) body.setVelocityX(-speed)
		else body.setVelocityX(0)
	}

	// -------------------------------------------------------------------------
	// Plataformas
	// -------------------------------------------------------------------------

	private createPlatform(x: number, y: number, width: number, kind: PlatformType) {
		const color = PLATFORM_COLORS[kind]
		const platform = this.add.rectangle(
			x,
			y,
			width,
			PLATFORM_HEIGHT,
			color
		) as GamePlatform
		platform.setStrokeStyle(
			2,
			Phaser.Display.Color.IntegerToColor(color).darken(25).color
		)
		this.platforms.add(platform)

		platform.kind = kind
		platform.baseColor = color
		platform.lifetime =
			Phaser.Math.Between(10000, 15000) * this.difficulty.platformLifetime
		platform.age = 0
		platform.isRemoving = false
		platform.isBreaking = false
		platform.startX = Math.max(width / 2 + 4, x - 100)
		platform.endX = Math.min(GAME_WIDTH - width / 2 - 4, x + 100)
		platform.speed = 80
		platform.direction = 1
		this.dynamicPlatforms.push(platform)

		platform.setAlpha(0)
		this.tweens.add({ targets: platform, alpha: 1, duration: 250 })
	}

	private updatePlatforms(dt: number) {
		const dtSeconds = dt / 1000
		// Copia porque el array puede cambiar al eliminar plataformas
		for (const platform of [...this.dynamicPlatforms]) {
			platform.age += dt
			if (platform.kind === PlatformType.MOVING) {
				this.movePlatform(platform, dtSeconds)
			}
			if (platform.isBreaking || platform.isRemoving) continue

			const timeLeft = platform.lifetime - platform.age
			if (timeLeft <= 0) {
				this.expirePlatform(platform)
			} else if (timeLeft < PLATFORM_WARNING_MS) {
				// Aviso: parpadea cada vez más rápido antes de desaparecer
				const period = timeLeft < 1000 ? 45 : 90
				platform.setAlpha(0.55 + 0.45 * Math.cos(platform.age / period))
			}
		}

		this.platformTimer += dt
		if (
			this.platformTimer >= PLATFORM_SPAWN_INTERVAL &&
			this.dynamicPlatforms.length < MAX_DYNAMIC_PLATFORMS
		) {
			this.platformTimer = 0
			this.spawnNewPlatform()
		}
	}

	private movePlatform(platform: GamePlatform, dtSeconds: number) {
		let nextX = platform.x + platform.speed * platform.direction * dtSeconds
		if (nextX >= platform.endX) {
			nextX = platform.endX
			platform.direction = -1
		} else if (nextX <= platform.startX) {
			nextX = platform.startX
			platform.direction = 1
		}
		const dx = nextX - platform.x

		// Quien esté encima viaja con la plataforma (un cuerpo estático no
		// arrastra a los cuerpos que tiene encima por sí solo)
		if (this.isStandingOn(this.player.body, platform)) this.player.x += dx
		for (const enemy of this.enemyPool) {
			if (
				enemy.active &&
				enemy.kind !== EnemyType.FLYING &&
				this.isStandingOn(enemy.body, platform)
			) {
				enemy.x += dx
			}
		}

		platform.x = nextX
		platform.body.updateFromGameObject()
	}

	private isStandingOn(body: Phaser.Physics.Arcade.Body, platform: GamePlatform) {
		const top = platform.body.top
		return (
			(body.blocked.down || body.touching.down) &&
			Math.abs(body.bottom - top) <= 4 &&
			body.right > platform.body.left &&
			body.left < platform.body.right
		)
	}

	private platformUnder(body: Phaser.Physics.Arcade.Body): GamePlatform | null {
		return this.dynamicPlatforms.find((p) => this.isStandingOn(body, p)) ?? null
	}

	private onPlayerTouchPlatform(platform: GamePlatform) {
		if (
			platform.kind === PlatformType.BREAKABLE &&
			!platform.isBreaking &&
			!platform.isRemoving &&
			this.player.body.touching.down &&
			this.player.body.bottom <= platform.body.top + 4
		) {
			this.startBreaking(platform)
		}
	}

	private startBreaking(platform: GamePlatform) {
		platform.isBreaking = true
		platform.setAlpha(1)
		sfx.crack()
		this.debrisParticles.emitParticleAt(platform.x, platform.y, 4)

		// Parpadeo de "grietas" y luego se rompe
		let cracked = false
		this.time.addEvent({
			delay: BREAK_DELAY_MS / 6,
			repeat: 5,
			callback: () => {
				cracked = !cracked
				platform.setFillStyle(cracked ? COLORS.platformCracked : platform.baseColor)
			},
		})
		this.time.delayedCall(BREAK_DELAY_MS, () => this.breakPlatform(platform))
	}

	private breakPlatform(platform: GamePlatform) {
		const pieces = 5
		for (let i = 0; i < pieces; i++) {
			const x = platform.x - platform.width / 2 + (platform.width * (i + 0.5)) / pieces
			this.debrisParticles.emitParticleAt(x, platform.y, 3)
		}
		sfx.breakPlatform()
		this.removePlatform(platform)
	}

	private expirePlatform(platform: GamePlatform) {
		platform.isRemoving = true
		this.tweens.add({
			targets: platform,
			alpha: 0,
			duration: 300,
			onComplete: () => this.removePlatform(platform),
		})
	}

	private removePlatform(platform: GamePlatform) {
		const index = this.dynamicPlatforms.indexOf(platform)
		if (index === -1) return
		this.dynamicPlatforms.splice(index, 1)
		this.tweens.killTweensOf(platform)
		platform.destroy() // también lo saca del grupo estático
	}

	private spawnNewPlatform() {
		for (let attempt = 0; attempt < 20; attempt++) {
			const x = Phaser.Math.Between(100, 700)
			const y =
				Math.random() < 0.5
					? Phaser.Math.Between(420, 500)
					: Phaser.Math.Between(150, 380)
			const width = Phaser.Math.Between(100, 180)

			const tooClose = this.dynamicPlatforms.some(
				(p) => Phaser.Math.Distance.Between(x, y, p.x, p.y) < 180
			)
			// No aparecer encima del jugador (lo dejaría atrapado)
			const overlapsPlayer =
				Math.abs(x - this.player.x) < width / 2 + CUBE_WIDTH &&
				Math.abs(y - this.player.y) < CUBE_HEIGHT + PLATFORM_HEIGHT
			if (tooClose || overlapsPlayer) continue

			// 30% de probabilidad de plataforma especial
			const rand = Math.random()
			const kind =
				rand < 0.15
					? PlatformType.MOVING
					: rand < 0.3
						? PlatformType.BREAKABLE
						: PlatformType.STATIC
			this.createPlatform(x, y, width, kind)
			return
		}
	}

	// -------------------------------------------------------------------------
	// Monedas
	// -------------------------------------------------------------------------

	private spawnInitialCoins() {
		const positions = [
			{ x: 200, y: 420 },
			{ x: 500, y: 320 },
			{ x: 150, y: 220 },
			{ x: 600, y: 170 },
			{ x: 350, y: 500 },
			{ x: 650, y: 400 },
		]
		for (const pos of positions) this.spawnCoin(pos.x, pos.y)
	}

	private spawnCoin(x: number, y: number): Coin | null {
		const coin = this.coinPool.find((c) => !c.active)
		if (!coin) return null

		this.tweens.killTweensOf(coin)
		coin.enableBody(true, x, y, true, true)
		coin.setAlpha(1)
		coin.baseY = y
		coin.appear = 0
		coin.setScale(0)
		this.tweens.add({ targets: coin, appear: 1, duration: 300, ease: 'Back.out' })
		return coin
	}

	private spawnCoinIfNeeded() {
		const activeCoins = this.coinPool.filter((c) => c.active).length
		if (activeCoins >= 8) return

		// Buscar un hueco que no esté dentro de una plataforma
		for (let attempt = 0; attempt < 5; attempt++) {
			const x = Phaser.Math.Between(100, 700)
			const y = Phaser.Math.Between(150, 500)
			const insidePlatform = this.dynamicPlatforms.some(
				(p) =>
					Math.abs(x - p.x) < p.width / 2 + 14 &&
					Math.abs(y - p.y) < PLATFORM_HEIGHT / 2 + 14
			)
			if (!insidePlatform) {
				this.spawnCoin(x, y)
				return
			}
		}
	}

	private spawnEnemyDeathCoins(x: number, y: number) {
		const coinPositions = [
			{ x, y: y - 30 },
			{ x: x - 25, y: y - 15 },
			{ x: x + 25, y: y - 15 },
		]
		for (const pos of coinPositions) {
			this.spawnCoin(
				Phaser.Math.Clamp(pos.x, 50, GAME_WIDTH - 50),
				Phaser.Math.Clamp(pos.y, 100, GROUND_TOP - 20)
			)
		}
	}

	private updateCoins() {
		for (const coin of this.coinPool) {
			if (!coin.active) continue
			// Flotación absoluta (no acumulativa) y giro simulado con la escala X
			coin.y = coin.baseY + Math.sin(this.elapsed / 500 + coin.floatOffset) * 5
			const spin =
				0.35 + 0.65 * Math.abs(Math.cos(this.elapsed / 260 + coin.floatOffset))
			coin.setScale(COIN_SCALE * coin.appear * spin, COIN_SCALE * coin.appear)
		}
	}

	private collectCoin(coin: Coin) {
		if (!coin.active || this.isGameOver) return

		// Desactivar el cuerpo pero mantenerla visible para la animación
		coin.disableBody(true, false)
		this.coinParticles.emitParticleAt(coin.x, coin.y, 8)
		this.tweens.add({
			targets: coin,
			scale: coin.scaleY * 1.8,
			alpha: 0,
			y: coin.y - 16,
			duration: 220,
			onComplete: () => coin.setVisible(false),
		})

		this.coinsCollected++
		this.coinsText.setText(`Monedas: ${this.coinsCollected}`)
		this.addScore(COIN_VALUE)
		sfx.coin()

		if (this.coinsCollected % COINS_PER_LIFE === 0) this.gainLife()
	}

	// -------------------------------------------------------------------------
	// Power-ups
	// -------------------------------------------------------------------------

	private spawnPowerUpIfNeeded() {
		const anyActive = this.powerUpPool.some((p) => p.active)
		if (anyActive || this.activePowerUp) return
		this.spawnPowerUp(Phaser.Math.Between(150, 650), Phaser.Math.Between(200, 450))
	}

	private spawnPowerUp(x: number, y: number): PowerUp | null {
		const powerUp = this.powerUpPool.find((p) => !p.active)
		if (!powerUp) return null

		const kind = Phaser.Utils.Array.GetRandom(POWERUP_KINDS) as PowerUpType
		powerUp.kind = kind
		powerUp.setTexture(POWERUP_INFO[kind].texture)
		powerUp.enableBody(true, x, y, true, true)
		powerUp.setDisplaySize(30, 30)
		powerUp.setAlpha(1)
		powerUp.baseY = y
		powerUp.expiresAt = this.elapsed + POWERUP_LIFETIME

		this.powerUpParticles.setParticleTint(POWERUP_INFO[kind].color)
		this.powerUpParticles.emitParticleAt(x, y, 10)
		return powerUp
	}

	private updatePowerUps() {
		for (const powerUp of this.powerUpPool) {
			if (!powerUp.active) continue
			powerUp.y = powerUp.baseY + Math.sin(this.elapsed / 320) * 6

			const remaining = powerUp.expiresAt - this.elapsed
			if (remaining <= 0) {
				powerUp.disableBody(true, true)
			} else if (remaining < 3000) {
				powerUp.setAlpha(Math.floor(this.elapsed / 120) % 2 === 0 ? 0.3 : 1)
			}
		}
	}

	private collectPowerUp(powerUp: PowerUp) {
		if (!powerUp.active || this.isGameOver) return
		powerUp.disableBody(true, true)
		this.powerUpParticles.setParticleTint(POWERUP_INFO[powerUp.kind].color)
		this.powerUpParticles.emitParticleAt(powerUp.x, powerUp.y, 15)
		this.activatePowerUp(powerUp.kind)
	}

	private activatePowerUp(kind: PowerUpType) {
		if (this.activePowerUp) this.deactivatePowerUp(false)

		this.activePowerUp = kind
		if (kind === PowerUpType.INVINCIBLE) this.isInvincible = true
		if (kind === PowerUpType.SUPER_JUMP) this.player.body.setGravityY(-400)

		this.powerUpIndicator
			.setText(POWERUP_INFO[kind].label)
			.setVisible(true)
			.setAlpha(1)
		sfx.powerUp()

		this.powerUpTimer = this.time.delayedCall(POWERUP_DURATION, () =>
			this.deactivatePowerUp(true)
		)
	}

	private deactivatePowerUp(playSound: boolean) {
		if (!this.activePowerUp) return
		if (this.activePowerUp === PowerUpType.INVINCIBLE) {
			// Pequeño margen para no recibir daño justo al terminar
			this.invulnerableUntil = Math.max(this.invulnerableUntil, this.elapsed + 800)
		}

		this.powerUpTimer?.remove()
		this.powerUpTimer = null
		this.activePowerUp = null
		this.isInvincible = false
		this.player.body.setGravityY(0)
		this.powerUpIndicator.setVisible(false)
		this.powerUpBar.clear()
		if (playSound) sfx.powerDown()
	}

	private updatePowerUpBar() {
		this.powerUpBar.clear()
		if (!this.activePowerUp || !this.powerUpTimer) return

		const remaining = this.powerUpTimer.getRemaining()
		const fraction = Phaser.Math.Clamp(remaining / POWERUP_DURATION, 0, 1)
		const width = 200
		const x = GAME_WIDTH / 2 - width / 2
		this.powerUpBar
			.fillStyle(0x000000, 0.45)
			.fillRoundedRect(x - 2, 46, width + 4, 12, 6)
			.fillStyle(POWERUP_INFO[this.activePowerUp].color, 1)
			.fillRoundedRect(x, 48, Math.max(width * fraction, 1), 8, 4)

		// Aviso de que se acaba
		this.powerUpIndicator.setAlpha(
			remaining < 1500 && Math.floor(this.elapsed / 150) % 2 === 0 ? 0.4 : 1
		)
	}

	// -------------------------------------------------------------------------
	// Pausa, sonido y fin de partida
	// -------------------------------------------------------------------------

	private openPause() {
		// Ignorar la misma pulsación que acaba de reanudar la partida
		if (this.isGameOver || this.game.loop.frame === this.resumeFrame) return
		if (!this.scene.isActive()) return
		sfx.pause()
		this.scene.launch('PauseScene')
		this.scene.pause()
	}

	private handleEscape() {
		if (this.isGameOver) this.leaveToMenu()
		else this.openPause()
	}

	private onResume() {
		this.resumeFrame = this.game.loop.frame
		this.refreshHud()
	}

	private onBlur() {
		// Pausar automáticamente si la ventana pierde el foco
		if (!this.isGameOver) this.openPause()
	}

	private toggleMute() {
		sfx.toggleMute()
		this.muteText.setText(sfx.muted ? '🔇 Sin sonido' : '')
		sfx.select()
	}

	private gameOver() {
		this.isGameOver = true
		this.deactivatePowerUp(false)
		this.physics.pause()
		this.time.removeAllEvents()
		sfx.gameOver()

		const previous = recordGame({
			score: this.score,
			time: this.survivalTime,
			coins: this.coinsCollected,
		})
		this.showGameOverPanel(previous)
	}

	private showGameOverPanel(previous: Stats) {
		const isNewRecord = this.score > previous.highScore
		const isNewBestTime = this.survivalTime > previous.bestTime
		const cx = GAME_WIDTH / 2
		const depth = 50

		this.add
			.rectangle(cx, 300, GAME_WIDTH, 600, 0x000000, 0.55)
			.setDepth(depth)
		this.add
			.graphics()
			.setDepth(depth)
			.fillStyle(0x1b1f2e, 0.92)
			.fillRoundedRect(cx - 240, 110, 480, 380, 18)
			.lineStyle(3, 0xffffff, 0.15)
			.strokeRoundedRect(cx - 240, 110, 480, 380, 18)

		const title = this.add
			.text(cx, 165, 'GAME OVER', textStyle(56, '#ff3030', 8))
			.setOrigin(0.5)
			.setDepth(depth)
			.setScale(0.5)
		this.tweens.add({ targets: title, scale: 1, duration: 400, ease: 'Back.out' })

		this.add
			.text(cx, 230, `Puntuación: ${this.score}`, textStyle(30, '#ffffff', 6))
			.setOrigin(0.5)
			.setDepth(depth)

		if (isNewRecord) {
			const record = this.add
				.text(cx, 268, '¡NUEVO RÉCORD!', textStyle(26, '#FFD700'))
				.setOrigin(0.5)
				.setDepth(depth)
			this.tweens.add({
				targets: record,
				scale: 1.12,
				duration: 450,
				yoyo: true,
				repeat: -1,
				ease: 'Sine.inOut',
			})
		}

		const timeLabel = isNewBestTime
			? `${this.survivalTime}s (¡mejor marca!)`
			: `${this.survivalTime}s`
		const lines = [
			`Tiempo: ${timeLabel}`,
			`Monedas: ${this.coinsCollected}   ·   Nivel: ${this.level}`,
			`Mejor puntuación: ${Math.max(previous.highScore, this.score)}`,
		]
		lines.forEach((line, i) => {
			this.add
				.text(cx, 310 + i * 30, line, textStyle(19, i === 2 ? '#FFD700' : '#ffffff'))
				.setOrigin(0.5)
				.setDepth(depth)
		})

		const hint = this.add
			.text(
				cx,
				448,
				'ESPACIO / ENTER: reintentar   ·   ESC: menú',
				textStyle(17, '#ffffff', 3)
			)
			.setOrigin(0.5)
			.setDepth(depth)
			.setAlpha(0)

		// Pequeña espera para no reiniciar sin querer al estar pulsando salto
		this.time.delayedCall(700, () => {
			this.canRestart = true
			this.tweens.add({
				targets: hint,
				alpha: 1,
				duration: 300,
				onComplete: () =>
					this.tweens.add({
						targets: hint,
						alpha: 0.4,
						duration: 700,
						yoyo: true,
						repeat: -1,
					}),
			})
		})
	}

	private tryRestart() {
		if (!this.isGameOver || !this.canRestart || this.isLeaving) return
		this.isLeaving = true
		sfx.select()
		this.cameras.main.fadeOut(200, 0, 0, 0)
		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
			this.scene.restart()
		)
	}

	private leaveToMenu() {
		if (!this.canRestart || this.isLeaving) return
		this.isLeaving = true
		this.cameras.main.fadeOut(200, 0, 0, 0)
		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
			this.scene.start('MenuScene')
		)
	}
}
