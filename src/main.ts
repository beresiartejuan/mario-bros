import './style.css'
import Phaser from 'phaser'

// Colores del juego
const COLORS = {
	bg: 0x87ceeb, // Azul cielo
	player: 0xff0000, // Rojo para el jugador
	platform: 0x8b4513, // Marrón para plataformas
	platformMoving: 0xa0522d, // Marrón más oscuro para plataformas móviles
	platformBreakable: 0x696969, // Gris para plataformas quebradizas
	enemy: 0x800080, // Púrpura para enemigos
	enemyPatrol: 0xff4500, // Naranja rojizo para enemigos patrulla
	enemyFlying: 0x00ced1, // Cyan oscuro para enemigos voladores
	ground: 0x228b22, // Verde para el suelo
	text: '#ffffff',
	coin: 0xffd700, // Oro para monedas
	powerupInvincible: 0x00ffff, // Cyan para invencibilidad
	powerupJump: 0xff69b4, // Rosa para salto mejorado
	powerupSpeed: 0xffa500, // Naranja para velocidad
	particleStar: 0xffd700, // Dorado para partículas de moneda
	particleEnemy: 0x800080, // Púrpura para partículas de enemigo
	particleJump: 0xffffff, // Blanco para partículas de salto
}

// Tipos de power-ups - const object en lugar de enum (erasableSyntaxOnly)
const PowerUpType = {
	INVINCIBLE: 'invincible',
	SUPER_JUMP: 'superJump',
	SUPER_SPEED: 'superSpeed',
} as const

type PowerUpType = (typeof PowerUpType)[keyof typeof PowerUpType]

// Duración de power-ups en ms
const POWERUP_DURATION = 5000

// Valor de monedas
const COIN_VALUE = 50

// Constantes para localStorage
const STORAGE_KEYS = {
	HIGH_SCORE: 'mario_high_score',
	GAMES_PLAYED: 'mario_games_played',
	TOTAL_COINS: 'mario_total_coins',
}

// Crear texturas para objetos del juego
function createGameTextures(scene: Phaser.Scene) {
	// Textura para moneda (círculo dorado con símbolo $)
	if (!scene.textures.exists('coin')) {
		const coinCanvas = document.createElement('canvas')
		coinCanvas.width = 32
		coinCanvas.height = 32
		const coinCtx = coinCanvas.getContext('2d')
		if (coinCtx) {
			// Fondo dorado brillante
			const gradient = coinCtx.createRadialGradient(16, 16, 2, 16, 16, 14)
			gradient.addColorStop(0, '#FFD700')
			gradient.addColorStop(0.7, '#FFA500')
			gradient.addColorStop(1, '#B8860B')
			coinCtx.fillStyle = gradient
			coinCtx.beginPath()
			coinCtx.arc(16, 16, 14, 0, Math.PI * 2)
			coinCtx.fill()
			
			// Borde brillante
			coinCtx.strokeStyle = '#FFF8DC'
			coinCtx.lineWidth = 2
			coinCtx.stroke()
			
			// Símbolo $
			coinCtx.fillStyle = '#8B4513'
			coinCtx.font = 'bold 18px Arial'
			coinCtx.textAlign = 'center'
			coinCtx.textBaseline = 'middle'
			coinCtx.fillText('$', 16, 17)
			
			scene.textures.addCanvas('coin', coinCanvas)
		}
	}
	
	// Textura para power-up de invencibilidad (estrella)
	if (!scene.textures.exists('powerup_invincible')) {
		const canvas = document.createElement('canvas')
		canvas.width = 32
		canvas.height = 32
		const ctx = canvas.getContext('2d')
		if (ctx) {
			// Fondo cyan
			ctx.fillStyle = '#00FFFF'
			ctx.fillRect(4, 4, 24, 24)
			
			// Borde
			ctx.strokeStyle = '#FFFFFF'
			ctx.lineWidth = 2
			ctx.strokeRect(4, 4, 24, 24)
			
			// Estrella ⭐
			ctx.fillStyle = '#FFFFFF'
			ctx.font = '16px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText('⭐', 16, 16)
			
			scene.textures.addCanvas('powerup_invincible', canvas)
		}
	}
	
	// Textura para power-up de super salto (triángulo rosa)
	if (!scene.textures.exists('powerup_jump')) {
		const canvas = document.createElement('canvas')
		canvas.width = 32
		canvas.height = 32
		const ctx = canvas.getContext('2d')
		if (ctx) {
			// Triángulo rosa
			ctx.fillStyle = '#FF69B4'
			ctx.beginPath()
			ctx.moveTo(16, 4)
			ctx.lineTo(28, 28)
			ctx.lineTo(4, 28)
			ctx.closePath()
			ctx.fill()
			
			// Borde
			ctx.strokeStyle = '#FFFFFF'
			ctx.lineWidth = 2
			ctx.stroke()
			
			// Flecha ↑
			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 14px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText('↑', 16, 19)
			
			scene.textures.addCanvas('powerup_jump', canvas)
		}
	}
	
	// Textura para power-up de velocidad (círculo naranja con rayo)
	if (!scene.textures.exists('powerup_speed')) {
		const canvas = document.createElement('canvas')
		canvas.width = 32
		canvas.height = 32
		const ctx = canvas.getContext('2d')
		if (ctx) {
			// Círculo naranja
			ctx.fillStyle = '#FFA500'
			ctx.beginPath()
			ctx.arc(16, 16, 12, 0, Math.PI * 2)
			ctx.fill()
			
			// Rayo ⚡
			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 16px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText('⚡', 16, 17)
			
			scene.textures.addCanvas('powerup_speed', canvas)
		}
	}
	
	// Textura para enemigo (rombo púrpura con cara enojada)
	if (!scene.textures.exists('enemy')) {
		const canvas = document.createElement('canvas')
		canvas.width = 32
		canvas.height = 32
		const ctx = canvas.getContext('2d')
		if (ctx) {
			// Rombo púrpura
			ctx.fillStyle = '#800080'
			ctx.beginPath()
			ctx.moveTo(16, 2)
			ctx.lineTo(30, 16)
			ctx.lineTo(16, 30)
			ctx.lineTo(2, 16)
			ctx.closePath()
			ctx.fill()
			
			// Cara enojada >:|
			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 10px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText('>:|', 16, 16)
			
			scene.textures.addCanvas('enemy', canvas)
		}
	}
	
	// Textura para enemigo patrulla (pentágono naranja)
	if (!scene.textures.exists('enemy_patrol')) {
		const canvas = document.createElement('canvas')
		canvas.width = 32
		canvas.height = 32
		const ctx = canvas.getContext('2d')
		if (ctx) {
			// Pentágono naranja
			ctx.fillStyle = '#FF4500'
			ctx.beginPath()
			for (let i = 0; i < 5; i++) {
				const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
				const x = 16 + 14 * Math.cos(angle)
				const y = 16 + 14 * Math.sin(angle)
				if (i === 0) ctx.moveTo(x, y)
				else ctx.lineTo(x, y)
			}
			ctx.closePath()
			ctx.fill()
			
			// Letra P
			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 12px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText('P', 16, 16)
			
			scene.textures.addCanvas('enemy_patrol', canvas)
		}
	}
	
	// Textura para enemigo volador (hexágono cyan)
	if (!scene.textures.exists('enemy_flying')) {
		const canvas = document.createElement('canvas')
		canvas.width = 32
		canvas.height = 32
		const ctx = canvas.getContext('2d')
		if (ctx) {
			// Hexágono cyan
			ctx.fillStyle = '#00CED1'
			ctx.beginPath()
			for (let i = 0; i < 6; i++) {
				const angle = (i * 2 * Math.PI) / 6
				const x = 16 + 12 * Math.cos(angle)
				const y = 16 + 12 * Math.sin(angle)
				if (i === 0) ctx.moveTo(x, y)
				else ctx.lineTo(x, y)
			}
			ctx.closePath()
			ctx.fill()
			
			// Letra F
			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 12px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText('F', 16, 16)
			
			scene.textures.addCanvas('enemy_flying', canvas)
		}
	}
}

// Interfaces para object pooling
interface PoolableEnemy extends Phaser.GameObjects.Image {
	body: Phaser.Physics.Arcade.Body
	isActive: boolean
	currentPlatform: PoolablePlatform | null
	aiUpdateTimer: number
}

interface PoolablePlatform extends Phaser.GameObjects.Rectangle {
	lifetime: number
	createdAt: number
}

interface PoolableCoin extends Phaser.GameObjects.Image {
	isActive: boolean
	spawnTime: number
	floatOffset: number
}

interface PoolablePowerUp extends Phaser.GameObjects.Image {
	isActive: boolean
	type: PowerUpType
	spawnTime: number
}

// Tipos de enemigos - const object en lugar de enum
const EnemyType = {
	CHASER: 'chaser', // Persigue al jugador
	PATROL: 'patrol', // Patrulla una área
	FLYING: 'flying', // Vuela hacia el jugador
} as const

type EnemyType = (typeof EnemyType)[keyof typeof EnemyType]

// Tipos de plataformas - const object en lugar de enum
const PlatformType = {
	STATIC: 'static', // Plataforma estática normal
	MOVING: 'moving', // Plataforma móvil horizontal
	BREAKABLE: 'breakable', // Plataforma que se rompe al pisar
} as const

type PlatformType = (typeof PlatformType)[keyof typeof PlatformType]

interface MovingPlatform extends PoolablePlatform {
	isMoving: boolean
	startX: number
	endX: number
	speed: number
	direction: number
}

interface BreakablePlatform extends PoolablePlatform {
	isBreakable: boolean
	isBreaking: boolean
	health: number
}

class GameScene extends Phaser.Scene {
	private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
	private platforms!: Phaser.Physics.Arcade.StaticGroup
	private dynamicPlatforms!: PoolablePlatform[]
	private platformLifetimes!: Map<
		PoolablePlatform,
		{ createdAt: number; lifetime: number }
	>
	private enemies!: Phaser.Physics.Arcade.Group
	private enemyPool: PoolableEnemy[] = []
	private enemyTypes: Map<PoolableEnemy, EnemyType> = new Map()
	private enemyPatrolData: Map<
		PoolableEnemy,
		{ startX: number; endX: number; direction: number }
	> = new Map()
	private lives = 3
	private score = 0
	private survivalTime = 0
	private movingPlatforms: MovingPlatform[] = []
	private breakablePlatforms: BreakablePlatform[] = []
	private livesText!: Phaser.GameObjects.Text
	private scoreText!: Phaser.GameObjects.Text
	private timeText!: Phaser.GameObjects.Text
	private platformTimer = 0
	private gameStartTime = 0
	private jumpsAvailable = 2
	private enemySpawnTimer!: Phaser.Time.TimerEvent
	private scoreTimer!: Phaser.Time.TimerEvent
	private lastSurvivalTime = -1

	// Sistema de monedas
	private coins!: Phaser.Physics.Arcade.Group
	private coinPool: PoolableCoin[] = []
	private coinsText!: Phaser.GameObjects.Text
	private coinsCollected = 0

	// Sistema de power-ups
	private powerUps!: Phaser.Physics.Arcade.Group
	private powerUpPool: PoolablePowerUp[] = []
	private activePowerUp: PowerUpType | null = null
	private powerUpTimer: Phaser.Time.TimerEvent | null = null
	private powerUpIndicator!: Phaser.GameObjects.Text
	private isInvincible = false

	// Sistema de partículas
	private coinParticles!: Phaser.GameObjects.Particles.ParticleEmitter
	private enemyParticles!: Phaser.GameObjects.Particles.ParticleEmitter
	private powerUpParticles!: Phaser.GameObjects.Particles.ParticleEmitter
	private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter

	constructor() {
		super({ key: 'GameScene' })
	}

	create() {
		// Reiniciar todas las variables del juego
		this.resetGameState()

		this.gameStartTime = this.time.now
		this.lastSurvivalTime = -1

		// Crear texturas del juego
		createGameTextures(this)

		// Limpiar pools y arrays al reiniciar
		this.cleanupPools()

		// Fondo con gradiente - siempre recrearlo al reiniciar
		this.createGradientBackground()

		// Crear sistemas de partículas
		this.createParticleSystems()

		// Crear suelo permanente
		this.platforms = this.physics.add.staticGroup()
		const ground = this.add.rectangle(400, 580, 800, 40, COLORS.ground)
		this.physics.add.existing(ground, true)
		this.platforms.add(ground)

		// Array para plataformas dinámicas
		this.dynamicPlatforms = []
		this.platformLifetimes = new Map()

		// Crear plataformas iniciales
		this.createPlatform(200, 450, 150, 20, PlatformType.STATIC)
		this.createPlatform(500, 350, 150, 20, PlatformType.STATIC)
		this.createPlatform(150, 250, 120, 20, PlatformType.MOVING)
		this.createPlatform(600, 200, 130, 20, PlatformType.BREAKABLE)

		// Crear jugador
		const playerRect = this.add.rectangle(
			100,
			500,
			30,
			40,
			COLORS.player
		) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
		this.player = playerRect
		this.physics.add.existing(this.player)
		this.player.body.setCollideWorldBounds(true)
		this.player.body.setBounce(0.1)

		// Crear pool de enemigos
		this.enemies = this.physics.add.group()
		this.initializeEnemyPool(8)

		// Spawn enemigos iniciales con variedad
		this.spawnEnemy(700, 500, EnemyType.CHASER)
		this.spawnEnemy(400, 300, EnemyType.PATROL)
		this.spawnEnemy(600, 100, EnemyType.FLYING)

		// Crear pool de monedas
		this.coins = this.physics.add.group()
		this.initializeCoinPool(15)
		this.spawnInitialCoins()

		// Crear pool de power-ups
		this.powerUps = this.physics.add.group()
		this.initializePowerUpPool(5)

		// Colisiones
		this.physics.add.collider(this.player, this.platforms)
		this.physics.add.collider(this.enemies, this.platforms)
		this.physics.add.collider(this.enemies, this.enemies)
		this.physics.add.overlap(
			this.player,
			this.enemies,
			this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
			undefined,
			this
		)
		this.physics.add.overlap(
			this.player,
			this.coins,
			this.collectCoin as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
			undefined,
			this
		)
		this.physics.add.overlap(
			this.player,
			this.powerUps,
			this
				.collectPowerUp as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
			undefined,
			this
		)

		// Controles
		const keyboard = this.input.keyboard
		if (keyboard) {
			this.cursors = keyboard.createCursorKeys()
		}

		// UI
		this.createUI()

		// Timer para incrementar score
		this.scoreTimer = this.time.addEvent({
			delay: 1000,
			callback: this.incrementScore,
			callbackScope: this,
			loop: true,
		})

		// Timer para spawn de enemigos (cada 15 segundos)
		this.enemySpawnTimer = this.time.addEvent({
			delay: 15000,
			callback: this.spawnEnemyIfNeeded,
			callbackScope: this,
			loop: true,
		})

		// Timer para spawn de monedas (cada 3 segundos)
		this.time.addEvent({
			delay: 3000,
			callback: this.spawnCoinIfNeeded,
			callbackScope: this,
			loop: true,
		})

		// Timer para spawn de power-ups (cada 20 segundos)
		this.time.addEvent({
			delay: 20000,
			callback: this.spawnPowerUpIfNeeded,
			callbackScope: this,
			loop: true,
		})
	}

	private cleanupPools() {
		// Destruir enemigos existentes
		if (this.enemyPool) {
			this.enemyPool.forEach((enemy) => {
				if (enemy) enemy.destroy()
			})
			this.enemyPool = []
		}
		this.enemyTypes.clear()
		this.enemyPatrolData.clear()

		// Destruir monedas existentes
		if (this.coinPool) {
			this.coinPool.forEach((coin) => {
				if (coin) coin.destroy()
			})
			this.coinPool = []
		}

		// Destruir power-ups existentes
		if (this.powerUpPool) {
			this.powerUpPool.forEach((powerUp) => {
				if (powerUp) powerUp.destroy()
			})
			this.powerUpPool = []
		}

		// Limpiar plataformas
		this.movingPlatforms = []
		this.breakablePlatforms = []

		// Resetear power-up
		this.activePowerUp = null
		this.isInvincible = false
	}

	private resetGameState() {
		// Reiniciar todas las variables del juego
		this.lives = 3
		this.score = 0
		this.survivalTime = 0
		this.coinsCollected = 0
		this.platformTimer = 0
		this.jumpsAvailable = 2
		this.lastSurvivalTime = -1
		this.activePowerUp = null
		this.isInvincible = false

		// Resetear power-up timer
		if (this.powerUpTimer) {
			this.powerUpTimer.remove()
			this.powerUpTimer = null
		}

		// NOTA: La limpieza de grupos se hace en cleanupPools() después de inicializar
	}

	private createGradientBackground() {
		// Crear un gráfico con gradiente para el fondo
		// Eliminar textura existente si ya existe para poder recrearla
		if (this.textures.exists('gradientBg')) {
			this.textures.remove('gradientBg')
		}
		
		// Crear textura con gradiente
		const canvas = document.createElement('canvas')
		canvas.width = 800
		canvas.height = 600
		const ctx = canvas.getContext('2d')

		if (!ctx) return

		const gradient = ctx.createLinearGradient(0, 0, 0, 600)
		gradient.addColorStop(0, '#87CEEB')
		gradient.addColorStop(0.7, '#B0E0E6')
		gradient.addColorStop(1, '#E0F6FF')

		ctx.fillStyle = gradient
		ctx.fillRect(0, 0, 800, 600)

		this.textures.addCanvas('gradientBg', canvas)
		this.add.image(400, 300, 'gradientBg')
	}

	private createParticleSystems() {
		// Crear textura para partículas
		const canvas = document.createElement('canvas')
		canvas.width = 16
		canvas.height = 16
		const ctx = canvas.getContext('2d')

		if (!ctx) return

		// Partícula circular
		ctx.beginPath()
		ctx.arc(8, 8, 6, 0, Math.PI * 2)
		ctx.fillStyle = '#ffffff'
		ctx.fill()
		this.textures.addCanvas('particle', canvas)

		// Sistema de partículas para monedas
		this.coinParticles = this.add.particles(0, 0, 'particle', {
			speed: { min: 50, max: 150 },
			scale: { start: 1, end: 0 },
			lifespan: 600,
			gravityY: 300,
			quantity: 8,
			emitting: false,
			tint: COLORS.coin,
		})

		// Sistema de partículas para enemigos
		this.enemyParticles = this.add.particles(0, 0, 'particle', {
			speed: { min: 30, max: 100 },
			scale: { start: 0.8, end: 0 },
			lifespan: 500,
			gravityY: 200,
			quantity: 10,
			emitting: false,
			tint: COLORS.enemy,
		})

		// Sistema de partículas para power-ups
		this.powerUpParticles = this.add.particles(0, 0, 'particle', {
			speed: { min: 20, max: 60 },
			scale: { start: 0.5, end: 0 },
			lifespan: 800,
			gravityY: 0,
			quantity: 15,
			emitting: false,
		})

		// Sistema de partículas para saltos
		this.jumpParticles = this.add.particles(0, 0, 'particle', {
			speed: { min: 20, max: 50 },
			scale: { start: 0.6, end: 0 },
			lifespan: 400,
			gravityY: 100,
			quantity: 6,
			emitting: false,
			tint: COLORS.particleJump,
			angle: { min: 80, max: 100 },
		})
	}

	private emitCoinParticles(x: number, y: number) {
		this.coinParticles.emitParticleAt(x, y)
	}

	private emitEnemyParticles(x: number, y: number) {
		this.enemyParticles.emitParticleAt(x, y)
	}

	private emitPowerUpParticles(x: number, y: number, color: number) {
		this.powerUpParticles.setParticleTint(color)
		this.powerUpParticles.emitParticleAt(x, y)
	}

	private emitJumpParticles(x: number, y: number) {
		this.jumpParticles.emitParticleAt(x, y)
	}

	private shakeCamera(intensity = 0.01, duration = 200) {
		this.cameras.main.shake(duration, intensity)
	}

	private createUI() {
		this.livesText = this.add.text(16, 16, `Vidas: ${this.lives}`, {
			fontSize: '20px',
			color: COLORS.text,
			fontStyle: 'bold',
			stroke: '#000000',
			strokeThickness: 4,
		})

		this.scoreText = this.add.text(16, 46, `Puntos: ${this.score}`, {
			fontSize: '20px',
			color: COLORS.text,
			fontStyle: 'bold',
			stroke: '#000000',
			strokeThickness: 4,
		})

		this.timeText = this.add.text(16, 76, `Tiempo: ${this.survivalTime}s`, {
			fontSize: '20px',
			color: COLORS.text,
			fontStyle: 'bold',
			stroke: '#000000',
			strokeThickness: 4,
		})

		this.coinsText = this.add.text(16, 106, `Monedas: ${this.coinsCollected}`, {
			fontSize: '20px',
			color: '#FFD700',
			fontStyle: 'bold',
			stroke: '#000000',
			strokeThickness: 4,
		})

		this.powerUpIndicator = this.add
			.text(400, 120, '', {
				fontSize: '24px',
				color: '#ffffff',
				fontStyle: 'bold',
				stroke: '#000000',
				strokeThickness: 4,
			})
			.setOrigin(0.5)
			.setVisible(false)
	}

	private incrementScore() {
		this.score += 10
		this.scoreText.setText(`Puntos: ${this.score}`)
	}

	private initializeEnemyPool(size: number) {
		for (let i = 0; i < size; i++) {
			const enemy = this.add.image(-100, -100, 'enemy') as PoolableEnemy
			this.physics.add.existing(enemy)
			enemy.body.setBounce(0.2)
			enemy.body.setCollideWorldBounds(true)
			enemy.setDisplaySize(35, 35)
			enemy.isActive = false
			enemy.currentPlatform = null
			enemy.aiUpdateTimer = 0
			enemy.setActive(false)
			enemy.setVisible(false)
			this.enemyPool.push(enemy)
			this.enemies.add(enemy)
		}
	}

	private spawnEnemy(
		x: number,
		y: number,
		type: EnemyType = EnemyType.CHASER
	): PoolableEnemy | null {
		// Buscar enemigo inactivo en el pool
		const enemy = this.enemyPool.find((e) => !e.isActive)
		if (enemy) {
			enemy.setPosition(x, y)
			enemy.isActive = true
			enemy.currentPlatform = null
			enemy.aiUpdateTimer = 0
			enemy.setActive(true)
			enemy.setVisible(true)

			// Verificar que el body existe antes de usarlo
			if (enemy.body) {
				enemy.body.setVelocity(0, 0)
			}

			// Configurar tipo de enemigo
			this.enemyTypes.set(enemy, type)

			// Configurar color y textura según tipo
			switch (type) {
				case EnemyType.PATROL: {
					// Asignar textura de patrulla
					enemy.setTexture('enemy_patrol')
					// Configurar patrulla
					const patrolRange = 150
					this.enemyPatrolData.set(enemy, {
						startX: Math.max(50, x - patrolRange),
						endX: Math.min(750, x + patrolRange),
						direction: 1,
					})
					break
				}
				case EnemyType.FLYING:
					// Asignar textura de volador
					enemy.setTexture('enemy_flying')
					// Los enemigos voladores no tienen gravedad
					enemy.body.setAllowGravity(false)
					break
				default:
					// Asignar textura de enemigo base
					enemy.setTexture('enemy')
					enemy.body.setAllowGravity(true)
			}

			return enemy
		}
		return null
	}

	private spawnEnemyIfNeeded() {
		const activeEnemies = this.enemyPool.filter((e) => e.isActive).length
		if (activeEnemies < 4) {
			const spawnX = Math.random() < 0.5 ? 50 : 750
			// Elegir tipo aleatorio
			const types = [EnemyType.CHASER, EnemyType.PATROL, EnemyType.FLYING]
			const type = types[Math.floor(Math.random() * types.length)]
			this.spawnEnemy(spawnX, 100, type)
		}
	}

	private despawnEnemy(enemy: PoolableEnemy) {
		enemy.isActive = false
		enemy.currentPlatform = null
		enemy.setActive(false)
		enemy.setVisible(false)
		enemy.setPosition(-100, -100)
		enemy.body.setVelocity(0, 0)
		enemy.body.setAllowGravity(true)

		// Limpiar datos del enemigo
		this.enemyTypes.delete(enemy)
		this.enemyPatrolData.delete(enemy)

		// Spawnear monedas al matar enemigo
		this.spawnEnemyDeathCoins(enemy.x, enemy.y)

		// Verificar si hay pocos enemigos y spawnear más
		this.checkAndSpawnEnemies()
	}

	private spawnEnemyDeathCoins(x: number, y: number) {
		// Spawnear 3 monedas en forma de arco alrededor de la posición del enemigo
		const coinPositions = [
			{ x: x, y: y - 30 },
			{ x: x - 25, y: y - 15 },
			{ x: x + 25, y: y - 15 },
		]

		for (const pos of coinPositions) {
			// Asegurar que las monedas estén dentro de la pantalla
			const clampedX = Phaser.Math.Clamp(pos.x, 50, 750)
			const clampedY = Phaser.Math.Clamp(pos.y, 100, 550)
			this.spawnCoin(clampedX, clampedY)
		}
	}

	private checkAndSpawnEnemies() {
		const activeEnemies = this.enemyPool.filter((e) => e.isActive).length
		// Si quedan menos de 2 enemigos, spawnear inmediatamente
		if (activeEnemies < 2) {
			// Spawnear hasta tener al menos 3 enemigos
			const enemiesToSpawn = 3 - activeEnemies
			for (let i = 0; i < enemiesToSpawn; i++) {
				const spawnX = Math.random() < 0.5 ? 50 : 750
				const spawnY = Phaser.Math.Between(100, 400)
				// Elegir tipo aleatorio, favoreciendo CHASER
				const rand = Math.random()
				let type: EnemyType
				if (rand < 0.5) {
					type = EnemyType.CHASER
				} else if (rand < 0.8) {
					type = EnemyType.PATROL
				} else {
					type = EnemyType.FLYING
				}
				this.spawnEnemy(spawnX, spawnY, type)
			}
		}
	}

	createPlatform(
		x: number,
		y: number,
		width: number,
		height: number,
		type: PlatformType = PlatformType.STATIC
	) {
		let color = COLORS.platform
		if (type === PlatformType.MOVING) color = COLORS.platformMoving
		if (type === PlatformType.BREAKABLE) color = COLORS.platformBreakable

		const platform = this.add.rectangle(
			x,
			y,
			width,
			height,
			color
		) as PoolablePlatform
		this.physics.add.existing(platform, true)
		this.platforms.add(platform)
		this.dynamicPlatforms.push(platform)

		const lifetime = Phaser.Math.Between(10000, 15000)
		platform.lifetime = lifetime
		platform.createdAt = this.time.now
		this.platformLifetimes.set(platform, {
			createdAt: this.time.now,
			lifetime: lifetime,
		})

		// Configurar comportamiento especial según tipo
		if (type === PlatformType.MOVING) {
			const movingPlatform = platform as MovingPlatform
			movingPlatform.isMoving = true
			movingPlatform.startX = x - 100
			movingPlatform.endX = x + 100
			movingPlatform.speed = 80
			movingPlatform.direction = 1
			this.movingPlatforms.push(movingPlatform)
		} else if (type === PlatformType.BREAKABLE) {
			const breakablePlatform = platform as BreakablePlatform
			breakablePlatform.isBreakable = true
			breakablePlatform.isBreaking = false
			breakablePlatform.health = 1
			this.breakablePlatforms.push(breakablePlatform)
		}

		this.time.delayedCall(lifetime, () => {
			this.tweens.add({
				targets: platform,
				alpha: 0,
				duration: 500,
				onComplete: () => {
					this.removePlatform(platform)
				},
			})
		})
	}

	private removePlatform(platform: PoolablePlatform) {
		platform.destroy()
		const index = this.dynamicPlatforms.indexOf(platform)
		if (index > -1) {
			this.dynamicPlatforms.splice(index, 1)
		}

		// Remover de arrays específicos
		const movingIndex = this.movingPlatforms.indexOf(platform as MovingPlatform)
		if (movingIndex > -1) {
			this.movingPlatforms.splice(movingIndex, 1)
		}

		const breakableIndex = this.breakablePlatforms.indexOf(
			platform as BreakablePlatform
		)
		if (breakableIndex > -1) {
			this.breakablePlatforms.splice(breakableIndex, 1)
		}

		this.platformLifetimes.delete(platform)

		// Limpiar referencias de enemigos a esta plataforma
		this.enemyPool.forEach((enemy) => {
			if (enemy.currentPlatform === platform) {
				enemy.currentPlatform = null
			}
		})
	}

	private updateMovingPlatforms(delta: number) {
		const deltaSeconds = delta / 1000
		this.movingPlatforms.forEach((platform) => {
			if (platform.active) {
				// Mover plataforma
				platform.x += platform.speed * platform.direction * deltaSeconds

				// Cambiar dirección al llegar a los límites
				if (platform.x >= platform.endX) {
					platform.direction = -1
				} else if (platform.x <= platform.startX) {
					platform.direction = 1
				}

				// Actualizar el body de física para que coincida con la nueva posición
				const body = platform.body as Phaser.Physics.Arcade.Body & {
					updateFromGameObject: () => void
				}
				body.updateFromGameObject()
			}
		})
	}

	private getEnemyCurrentPlatform(
		enemy: PoolableEnemy
	): PoolablePlatform | null {
		if (!enemy.body.touching.down) return enemy.currentPlatform

		// Solo verificar si está tocando el suelo
		const enemyBottom = enemy.y + enemy.height / 2

		for (const platform of this.dynamicPlatforms) {
			const platformTop = platform.y - platform.height / 2

			if (
				Math.abs(enemyBottom - platformTop) < 5 &&
				enemy.x > platform.x - platform.width / 2 &&
				enemy.x < platform.x + platform.width / 2
			) {
				return platform
			}
		}

		return null
	}

	private getPlatformTimeLeft(platform: PoolablePlatform): number {
		const lifetimeInfo = this.platformLifetimes.get(platform)
		if (lifetimeInfo) {
			const elapsed = this.time.now - lifetimeInfo.createdAt
			return lifetimeInfo.lifetime - elapsed
		}
		return Infinity
	}

	hitEnemy(
		player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
		enemy: PoolableEnemy
	) {
		// Si es invencible, matar al enemigo automáticamente
		if (this.isInvincible) {
			this.emitEnemyParticles(enemy.x, enemy.y)
			this.despawnEnemy(enemy)
			this.score += 100
			this.scoreText.setText(`Puntos: ${this.score}`)
			return
		}

		const playerBody = player as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
		const playerBottom = playerBody.y + playerBody.height / 2

		if (playerBody.body.velocity.y > 0 && playerBottom < enemy.y + 5) {
			// Efectos visuales al matar enemigo
			this.emitEnemyParticles(enemy.x, enemy.y)
			this.shakeCamera(0.005, 100)

			this.despawnEnemy(enemy)
			playerBody.body.setVelocityY(-300)
			this.score += 100
			this.scoreText.setText(`Puntos: ${this.score}`)
		} else {
			// Efecto visual al recibir daño
			this.shakeCamera(0.02, 300)

			this.lives--
			this.livesText.setText(`Vidas: ${this.lives}`)

			playerBody.setPosition(100, 500)
			playerBody.body.setVelocity(0, 0)

			this.tweens.add({
				targets: playerBody,
				alpha: 0.3,
				duration: 100,
				yoyo: true,
				repeat: 5,
			})

			if (this.lives <= 0) {
				this.saveHighScore()
				this.gameOver()
			}
		}
	}

	gameOver() {
		this.physics.pause()

		if (this.scoreTimer) {
			this.scoreTimer.remove()
		}
		if (this.enemySpawnTimer) {
			this.enemySpawnTimer.remove()
		}
		if (this.powerUpTimer) {
			this.powerUpTimer.remove()
		}

		// Obtener high score
		const highScore = this.getHighScore()
		const isNewRecord = this.score > highScore

		this.add
			.text(400, 200, 'GAME OVER', {
				fontSize: '64px',
				color: '#ff0000',
				fontStyle: 'bold',
				stroke: '#000000',
				strokeThickness: 8,
			})
			.setOrigin(0.5)

		this.add
			.text(400, 270, `Puntuación Final: ${this.score}`, {
				fontSize: '32px',
				color: COLORS.text,
				fontStyle: 'bold',
				stroke: '#000000',
				strokeThickness: 6,
			})
			.setOrigin(0.5)

		if (isNewRecord) {
			this.add
				.text(400, 310, '¡NUEVO RÉCORD!', {
					fontSize: '28px',
					color: '#FFD700',
					fontStyle: 'bold',
					stroke: '#000000',
					strokeThickness: 4,
				})
				.setOrigin(0.5)
		}

		this.add
			.text(400, 350, `Mejor Puntuación: ${Math.max(highScore, this.score)}`, {
				fontSize: '24px',
				color: '#FFD700',
				fontStyle: 'bold',
				stroke: '#000000',
				strokeThickness: 4,
			})
			.setOrigin(0.5)

		this.add
			.text(400, 390, `Monedas: ${this.coinsCollected}`, {
				fontSize: '20px',
				color: '#FFD700',
				stroke: '#000000',
				strokeThickness: 4,
			})
			.setOrigin(0.5)

		this.add
			.text(400, 430, 'Presiona ESPACIO para reiniciar', {
				fontSize: '20px',
				color: COLORS.text,
				stroke: '#000000',
				strokeThickness: 4,
			})
			.setOrigin(0.5)

		const keyboard = this.input.keyboard
		if (keyboard) {
			keyboard.once('keydown-SPACE', () => {
				this.scene.restart()
			})
		}
	}

	// SISTEMA DE HIGH SCORES
	private getHighScore(): number {
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)
			return saved ? Number.parseInt(saved, 10) : 0
		} catch {
			return 0
		}
	}

	private saveHighScore() {
		try {
			const currentHigh = this.getHighScore()
			if (this.score > currentHigh) {
				localStorage.setItem(
					STORAGE_KEYS.HIGH_SCORE,
					this.score.toString()
				)
			}

			// Guardar estadísticas
			const gamesPlayed =
				Number.parseInt(
					localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || '0',
					10
				) + 1
			localStorage.setItem(
				STORAGE_KEYS.GAMES_PLAYED,
				gamesPlayed.toString()
			)

			const totalCoins =
				Number.parseInt(
					localStorage.getItem(STORAGE_KEYS.TOTAL_COINS) || '0',
					10
				) + this.coinsCollected
			localStorage.setItem(
				STORAGE_KEYS.TOTAL_COINS,
				totalCoins.toString()
			)
		} catch {
			// Silenciar errores de localStorage
		}
	}

	update(time: number, delta: number) {
		// Actualizar tiempo de supervivencia (solo cuando cambia)
		const currentSurvivalTime = Math.floor((time - this.gameStartTime) / 1000)
		if (currentSurvivalTime !== this.lastSurvivalTime) {
			this.survivalTime = currentSurvivalTime
			this.timeText.setText(`Tiempo: ${this.survivalTime}s`)
			this.lastSurvivalTime = currentSurvivalTime
		}

		// Movimiento del jugador
		const speed =
			this.activePowerUp === PowerUpType.SUPER_SPEED ? 400 : 200
		if (this.cursors.left.isDown) {
			this.player.body.setVelocityX(-speed)
		} else if (this.cursors.right.isDown) {
			this.player.body.setVelocityX(speed)
		} else {
			this.player.body.setVelocityX(0)
		}

		// Resetear saltos cuando toca el suelo
		if (this.player.body.touching.down) {
			this.jumpsAvailable = 2
		}

		// Salto del jugador con doble salto
		const jumpVelocity =
			this.activePowerUp === PowerUpType.SUPER_JUMP ? -600 : -400
		if (
			Phaser.Input.Keyboard.JustDown(this.cursors.up) &&
			this.jumpsAvailable > 0
		) {
			this.player.body.setVelocityY(jumpVelocity)
			this.jumpsAvailable--

			// Efecto de partículas al saltar
			this.emitJumpParticles(this.player.x, this.player.y + 20)
		}

		// IA de enemigos optimizada
		this.updateEnemiesAI(delta)

		// Generar nuevas plataformas
		this.platformTimer += delta
		if (this.platformTimer > 5000 && this.dynamicPlatforms.length < 5) {
			this.platformTimer = 0
			this.spawnNewPlatform()
		}

		// Animación de monedas flotantes
		this.animateCoins(time)

		// Actualizar plataformas móviles
		this.updateMovingPlatforms(delta)
	}

	// SISTEMA DE MONEDAS
	private initializeCoinPool(size: number) {
		for (let i = 0; i < size; i++) {
			const coin = this.add.image(0, 0, 'coin') as PoolableCoin
			this.physics.add.existing(coin)
			;(coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
			coin.setDisplaySize(20, 20)
			coin.isActive = false
			coin.spawnTime = 0
			coin.floatOffset = Math.random() * Math.PI * 2
			coin.setActive(false)
			coin.setVisible(false)
			this.coinPool.push(coin)
			this.coins.add(coin)
		}
	}

	private spawnInitialCoins() {
		// Spawn algunas monedas iniciales en plataformas
		const positions = [
			{ x: 200, y: 420 },
			{ x: 500, y: 320 },
			{ x: 150, y: 220 },
			{ x: 600, y: 170 },
			{ x: 350, y: 500 },
			{ x: 650, y: 400 },
		]

		for (const pos of positions) {
			this.spawnCoin(pos.x, pos.y)
		}
	}

	private spawnCoin(x: number, y: number): PoolableCoin | null {
		const coin = this.coinPool.find((c) => !c.isActive)
		if (coin) {
			coin.setPosition(x, y)
			coin.isActive = true
			coin.spawnTime = this.time.now
			coin.setTexture('coin')
			coin.setActive(true)
			coin.setVisible(true)
			coin.setAlpha(1)

			// Animación de aparición
			this.tweens.add({
				targets: coin,
				scaleX: [0, 1],
				scaleY: [0, 1],
				duration: 300,
				ease: 'Back.out',
			})

			return coin
		}
		return null
	}

	private spawnCoinIfNeeded() {
		const activeCoins = this.coinPool.filter((c) => c.isActive).length
		if (activeCoins < 8) {
			// Spawn en posición aleatoria
			const x = Phaser.Math.Between(100, 700)
			const y = Phaser.Math.Between(150, 500)
			this.spawnCoin(x, y)
		}
	}

	private animateCoins(time: number) {
		this.coinPool.forEach((coin) => {
			if (coin.isActive) {
				// Efecto de flotación
				const floatY = Math.sin(time / 500 + coin.floatOffset) * 5
				coin.y +=
					floatY - Math.sin((time - 16) / 500 + coin.floatOffset) * 5

				// Rotación
				coin.rotation += 0.02
			}
		})
	}

	private collectCoin(
		_player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
		coin: PoolableCoin
	) {
		if (!coin.isActive) return

		// Efecto de partículas
		this.emitCoinParticles(coin.x, coin.y)

		// Desactivar moneda
		coin.isActive = false
		coin.setActive(false)
		coin.setVisible(false)

		// Actualizar score
		this.coinsCollected++
		this.score += COIN_VALUE
		this.coinsText.setText(`Monedas: ${this.coinsCollected}`)
		this.scoreText.setText(`Puntos: ${this.score}`)

		// Efecto visual de recolección
		this.tweens.add({
			targets: coin,
			scaleX: 1.5,
			scaleY: 1.5,
			alpha: 0,
			duration: 200,
			onComplete: () => {
				coin.setScale(1, 1)
			},
		})
	}

	// SISTEMA DE POWER-UPS
	private initializePowerUpPool(size: number) {
		const types = [
			PowerUpType.INVINCIBLE,
			PowerUpType.SUPER_JUMP,
			PowerUpType.SUPER_SPEED,
		]

		for (let i = 0; i < size; i++) {
			const type = types[i % types.length]
			const textureKey = this.getPowerUpTextureKey(type)

			const powerUp = this.add.image(0, 0, textureKey) as PoolablePowerUp
			this.physics.add.existing(powerUp)
			;(powerUp.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
			powerUp.setDisplaySize(30, 30)
			powerUp.isActive = false
			powerUp.type = type
			powerUp.spawnTime = 0
			powerUp.setActive(false)
			powerUp.setVisible(false)
			this.powerUpPool.push(powerUp)
			this.powerUps.add(powerUp)
		}
	}

	private getPowerUpColor(type: PowerUpType): number {
		switch (type) {
			case PowerUpType.INVINCIBLE:
				return COLORS.powerupInvincible
			case PowerUpType.SUPER_JUMP:
				return COLORS.powerupJump
			case PowerUpType.SUPER_SPEED:
				return COLORS.powerupSpeed
			default:
				return COLORS.powerupInvincible
		}
	}

	private getPowerUpTextureKey(type: PowerUpType): string {
		switch (type) {
			case PowerUpType.INVINCIBLE:
				return 'powerup_invincible'
			case PowerUpType.SUPER_JUMP:
				return 'powerup_jump'
			case PowerUpType.SUPER_SPEED:
				return 'powerup_speed'
			default:
				return 'powerup_invincible'
		}
	}

	private spawnPowerUpIfNeeded() {
		const activePowerUps = this.powerUpPool.filter((p) => p.isActive).length
		if (activePowerUps === 0 && !this.activePowerUp) {
			// Spawn power-up aleatorio
			const x = Phaser.Math.Between(150, 650)
			const y = Phaser.Math.Between(200, 450)
			this.spawnPowerUp(x, y)
		}
	}

	private spawnPowerUp(x: number, y: number): PoolablePowerUp | null {
		// Seleccionar tipo aleatorio
		const types = [
			PowerUpType.INVINCIBLE,
			PowerUpType.SUPER_JUMP,
			PowerUpType.SUPER_SPEED,
		]
		const type = types[Math.floor(Math.random() * types.length)]

		const powerUp = this.powerUpPool.find((p) => !p.isActive)
		if (powerUp) {
			powerUp.setPosition(x, y)
			powerUp.type = type
			powerUp.isActive = true
			powerUp.spawnTime = this.time.now

			// Asignar textura según el tipo
			switch (type) {
				case PowerUpType.INVINCIBLE:
					powerUp.setTexture('powerup_invincible')
					break
				case PowerUpType.SUPER_JUMP:
					powerUp.setTexture('powerup_jump')
					break
				case PowerUpType.SUPER_SPEED:
					powerUp.setTexture('powerup_speed')
					break
			}

			powerUp.setActive(true)
			powerUp.setVisible(true)

			// Animación de flotación
			this.tweens.add({
				targets: powerUp,
				y: y - 10,
				duration: 1000,
				yoyo: true,
				repeat: -1,
				ease: 'Sine.easeInOut',
			})

			return powerUp
		}
		return null
	}

	private collectPowerUp(
		_player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
		powerUp: PoolablePowerUp
	) {
		if (!powerUp.isActive || this.activePowerUp) return

		// Efecto de partículas
		this.emitPowerUpParticles(powerUp.x, powerUp.y, this.getPowerUpColor(powerUp.type))

		// Desactivar power-up
		powerUp.isActive = false
		powerUp.setActive(false)
		powerUp.setVisible(false)
		this.tweens.killTweensOf(powerUp)

		// Activar efecto
		this.activatePowerUp(powerUp.type)
	}

	private activatePowerUp(type: PowerUpType) {
		this.activePowerUp = type

		switch (type) {
			case PowerUpType.INVINCIBLE:
				this.activateInvincibility()
				break
			case PowerUpType.SUPER_JUMP:
				this.activateSuperJump()
				break
			case PowerUpType.SUPER_SPEED:
				this.activateSuperSpeed()
				break
		}

		// Timer para desactivar
		if (this.powerUpTimer) {
			this.powerUpTimer.remove()
		}

		this.powerUpTimer = this.time.delayedCall(POWERUP_DURATION, () => {
			this.deactivatePowerUp()
		})
	}

	private activateInvincibility() {
		this.isInvincible = true
		this.powerUpIndicator.setText('⭐ INVENCIBLE ⭐')
		this.powerUpIndicator.setVisible(true)

		// Efecto visual
		this.tweens.add({
			targets: this.player,
			alpha: 0.5,
			duration: 200,
			yoyo: true,
			repeat: -1,
		})
	}

	private activateSuperJump() {
		this.player.body.setGravityY(-400) // Salto más alto
		this.powerUpIndicator.setText('🚀 SUPER SALTO 🚀')
		this.powerUpIndicator.setVisible(true)
	}

	private activateSuperSpeed() {
		this.powerUpIndicator.setText('⚡ VELOCIDAD ⚡')
		this.powerUpIndicator.setVisible(true)
	}

	private deactivatePowerUp() {
		this.activePowerUp = null
		this.powerUpIndicator.setVisible(false)

		// Restaurar valores originales
		this.isInvincible = false
		this.player.clearAlpha()
		this.player.setAlpha(1)
		this.player.body.setGravityY(0)
	}

	private updateEnemiesAI(_delta: number) {
		const activeEnemies = this.enemyPool.filter((e) => e.isActive)

		for (const enemy of activeEnemies) {
			const enemyType = this.enemyTypes.get(enemy) || EnemyType.CHASER
			const onGround = enemy.body.touching.down

			// Actualizar plataforma actual solo cada 200ms o cuando cambia el estado
			enemy.aiUpdateTimer += _delta
			if (
				enemy.aiUpdateTimer > 200 ||
				(onGround && !enemy.currentPlatform)
			) {
				enemy.aiUpdateTimer = 0
				const newPlatform = this.getEnemyCurrentPlatform(enemy)
				if (newPlatform !== enemy.currentPlatform) {
					enemy.currentPlatform = newPlatform
				}
			}

			// Comportamiento según tipo de enemigo
			switch (enemyType) {
				case EnemyType.PATROL:
					this.updatePatrolEnemy(enemy, _delta)
					break
				case EnemyType.FLYING:
					this.updateFlyingEnemy(enemy)
					break
				default:
					this.updateChaserEnemy(enemy, _delta)
			}
		}
	}

	private updatePatrolEnemy(enemy: PoolableEnemy, _delta: number) {
		const patrolData = this.enemyPatrolData.get(enemy)
		if (!patrolData) return

		const speed = 60

		// Mover en la dirección actual usando velocidad
		enemy.body.setVelocityX(speed * patrolData.direction)

		// Cambiar dirección al llegar a los límites
		if (enemy.x >= patrolData.endX) {
			patrolData.direction = -1
		} else if (enemy.x <= patrolData.startX) {
			patrolData.direction = 1
		}

		// Salto ocasional si el jugador está cerca
		if (
			enemy.body.touching.down &&
			Math.abs(enemy.x - this.player.x) < 80 &&
			Math.random() < 0.01
		) {
			enemy.body.setVelocityY(-250)
		}
	}

	private updateFlyingEnemy(enemy: PoolableEnemy) {
		const speed = 120
		const verticalSpeed = 80

		// Movimiento hacia el jugador en ambos ejes
		const dx = this.player.x - enemy.x
		const dy = this.player.y - enemy.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		if (distance > 0) {
			enemy.body.setVelocityX((dx / distance) * speed)
			enemy.body.setVelocityY((dy / distance) * verticalSpeed)
		}

		// Oscilación adicional para hacerlo más interesante
		enemy.body.velocity.y += Math.sin(this.time.now / 200) * 20
	}

	private updateChaserEnemy(enemy: PoolableEnemy, _delta: number) {
		const speed = 100
		const onGround = enemy.body.touching.down

		// Lógica de salto
		let shouldJump = false

		if (onGround && enemy.currentPlatform) {
			const platformTimeLeft = this.getPlatformTimeLeft(enemy.currentPlatform)
			const platformDangerous = platformTimeLeft < 3000

			if (platformDangerous) {
				shouldJump = true
			} else if (
				Math.abs(enemy.y - this.player.y) > 60 &&
				Math.random() < 0.02
			) {
				shouldJump = true
			} else if (
				Math.abs(enemy.x - this.player.x) < 40 &&
				enemy.y > this.player.y
			) {
				shouldJump = true
			}
		}

		if (shouldJump) {
			enemy.body.setVelocityY(-250)
		}

		// Movimiento horizontal hacia el jugador
		if (enemy.x < this.player.x - 10) {
			enemy.body.setVelocityX(speed)
		} else if (enemy.x > this.player.x + 10) {
			enemy.body.setVelocityX(-speed)
		} else {
			enemy.body.setVelocityX(0)
		}
	}

	private spawnNewPlatform() {
		let validPosition = false
		let attempts = 0
		let x = 0
		let y = 0

		while (!validPosition && attempts < 20) {
			x = Phaser.Math.Between(100, 700)
			const nearGround = Math.random() < 0.5
			y = nearGround
				? Phaser.Math.Between(420, 500)
				: Phaser.Math.Between(150, 380)

			validPosition = true
			for (const platform of this.dynamicPlatforms) {
				const distance = Phaser.Math.Distance.Between(x, y, platform.x, platform.y)
				if (distance < 180) {
					validPosition = false
					break
				}
			}
			attempts++
		}

		if (validPosition) {
			const width = Phaser.Math.Between(100, 180)
			// 30% de probabilidad de plataforma especial
			const rand = Math.random()
			const type: PlatformType = rand < 0.15 ? PlatformType.MOVING : rand < 0.3 ? PlatformType.BREAKABLE : PlatformType.STATIC
			this.createPlatform(x, y, width, 20, type)
		}
	}
}

// Configuración del juego
const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	parent: 'app',
	backgroundColor: '#000000',
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 800, x: 0 },
			debug: false,
		},
	},
	scene: [GameScene],
}

// eslint-disable-next-line no-new
new Phaser.Game(config)
