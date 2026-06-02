import './style.css'
import Phaser from 'phaser'

// Colores del juego
const COLORS = {
  bg: 0x87CEEB,      // Azul cielo
  player: 0xFF0000,   // Rojo para el jugador
  platform: 0x8B4513, // Marrón para plataformas
  enemy: 0x800080,    // Púrpura para enemigos
  ground: 0x228B22,   // Verde para el suelo
  text: '#ffffff'
}

// Interfaces para object pooling
interface PoolableEnemy extends Phaser.GameObjects.Rectangle {
  body: Phaser.Physics.Arcade.Body
  isActive: boolean
  currentPlatform: Phaser.GameObjects.Rectangle | null
  aiUpdateTimer: number
}

interface PoolablePlatform extends Phaser.GameObjects.Rectangle {
  lifetime: number
  createdAt: number
}

class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private dynamicPlatforms!: PoolablePlatform[]
  private platformLifetimes!: Map<PoolablePlatform, { createdAt: number, lifetime: number }>
  private enemies!: Phaser.Physics.Arcade.Group
  private enemyPool: PoolableEnemy[] = []
  private lives: number = 3
  private score: number = 0
  private survivalTime: number = 0
  private livesText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private platformTimer: number = 0
  private gameStartTime: number = 0
  private jumpsAvailable: number = 2
  private enemySpawnTimer!: Phaser.Time.TimerEvent
  private scoreTimer!: Phaser.Time.TimerEvent
  private lastSurvivalTime: number = -1

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.gameStartTime = this.time.now
    this.lastSurvivalTime = -1

    // Fondo
    this.add.rectangle(400, 300, 800, 600, COLORS.bg)

    // Crear suelo permanente
    this.platforms = this.physics.add.staticGroup()
    const ground = this.add.rectangle(400, 580, 800, 40, COLORS.ground)
    this.physics.add.existing(ground, true)
    this.platforms.add(ground)

    // Array para plataformas dinámicas
    this.dynamicPlatforms = []
    this.platformLifetimes = new Map()

    // Crear plataformas iniciales
    this.createPlatform(200, 450, 150, 20)
    this.createPlatform(500, 350, 150, 20)
    this.createPlatform(150, 250, 120, 20)
    this.createPlatform(600, 200, 130, 20)

    // Crear jugador
    this.player = this.add.rectangle(100, 500, 30, 40, COLORS.player) as any
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)
    this.player.body.setBounce(0.1)

    // Crear pool de enemigos
    this.enemies = this.physics.add.group()
    this.initializeEnemyPool(8)
    
    // Spawn enemigos iniciales
    this.spawnEnemy(700, 500)
    this.spawnEnemy(400, 300)

    // Colisiones
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.enemies, this.enemies)
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this)

    // Controles
    this.cursors = this.input.keyboard!.createCursorKeys()

    // UI
    this.createUI()

    // Timer para incrementar score
    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: this.incrementScore,
      callbackScope: this,
      loop: true
    })

    // Timer para spawn de enemigos (cada 15 segundos)
    this.enemySpawnTimer = this.time.addEvent({
      delay: 15000,
      callback: this.spawnEnemyIfNeeded,
      callbackScope: this,
      loop: true
    })
  }

  private createUI() {
    this.livesText = this.add.text(16, 16, `Vidas: ${this.lives}`, {
      fontSize: '20px',
      color: COLORS.text,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })

    this.scoreText = this.add.text(16, 46, `Puntos: ${this.score}`, {
      fontSize: '20px',
      color: COLORS.text,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })

    this.timeText = this.add.text(16, 76, `Tiempo: 0s`, {
      fontSize: '20px',
      color: COLORS.text,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
  }

  private incrementScore() {
    this.score += 10
    this.scoreText.setText(`Puntos: ${this.score}`)
  }

  private initializeEnemyPool(size: number) {
    for (let i = 0; i < size; i++) {
      const enemy = this.add.rectangle(-100, -100, 35, 35, COLORS.enemy) as PoolableEnemy
      this.physics.add.existing(enemy)
      enemy.body.setBounce(0.2)
      enemy.body.setCollideWorldBounds(true)
      enemy.isActive = false
      enemy.currentPlatform = null
      enemy.aiUpdateTimer = 0
      enemy.setActive(false)
      enemy.setVisible(false)
      this.enemyPool.push(enemy)
      this.enemies.add(enemy)
    }
  }

  private spawnEnemy(x: number, y: number): PoolableEnemy | null {
    // Buscar enemigo inactivo en el pool
    const enemy = this.enemyPool.find(e => !e.isActive)
    if (enemy) {
      enemy.setPosition(x, y)
      enemy.body.setVelocity(0, 0)
      enemy.isActive = true
      enemy.currentPlatform = null
      enemy.aiUpdateTimer = 0
      enemy.setActive(true)
      enemy.setVisible(true)
      return enemy
    }
    return null
  }

  private spawnEnemyIfNeeded() {
    const activeEnemies = this.enemyPool.filter(e => e.isActive).length
    if (activeEnemies < 4) {
      const spawnX = Math.random() < 0.5 ? 50 : 750
      this.spawnEnemy(spawnX, 100)
    }
  }

  private despawnEnemy(enemy: PoolableEnemy) {
    enemy.isActive = false
    enemy.currentPlatform = null
    enemy.setActive(false)
    enemy.setVisible(false)
    enemy.setPosition(-100, -100)
    enemy.body.setVelocity(0, 0)
  }

  createPlatform(x: number, y: number, width: number, height: number) {
    const platform = this.add.rectangle(x, y, width, height, COLORS.platform) as PoolablePlatform
    this.physics.add.existing(platform, true)
    this.platforms.add(platform)
    this.dynamicPlatforms.push(platform)

    const lifetime = Phaser.Math.Between(10000, 15000)
    platform.lifetime = lifetime
    platform.createdAt = this.time.now
    this.platformLifetimes.set(platform, {
      createdAt: this.time.now,
      lifetime: lifetime
    })

    this.time.delayedCall(lifetime, () => {
      this.tweens.add({
        targets: platform,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          platform.destroy()
          const index = this.dynamicPlatforms.indexOf(platform)
          if (index > -1) {
            this.dynamicPlatforms.splice(index, 1)
          }
          this.platformLifetimes.delete(platform)
          
          // Limpiar referencias de enemigos a esta plataforma
          this.enemyPool.forEach(enemy => {
            if (enemy.currentPlatform === platform) {
              enemy.currentPlatform = null
            }
          })
        }
      })
    })
  }

  private getEnemyCurrentPlatform(enemy: PoolableEnemy): PoolablePlatform | null {
    if (!enemy.body.touching.down) return enemy.currentPlatform
    
    // Solo verificar si está tocando el suelo
    const enemyBottom = enemy.y + enemy.height / 2
    
    for (const platform of this.dynamicPlatforms) {
      const platformTop = platform.y - platform.height / 2
      
      if (Math.abs(enemyBottom - platformTop) < 5 &&
          enemy.x > platform.x - platform.width / 2 &&
          enemy.x < platform.x + platform.width / 2) {
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

  hitEnemy(player: any, enemy: PoolableEnemy) {
    const playerBottom = player.y + (player.height / 2)

    if (player.body.velocity.y > 0 && playerBottom < enemy.y + 5) {
      this.despawnEnemy(enemy)
      player.body.setVelocityY(-300)
      this.score += 100
      this.scoreText.setText(`Puntos: ${this.score}`)
    } else {
      this.lives--
      this.livesText.setText(`Vidas: ${this.lives}`)

      player.setPosition(100, 500)
      player.body.setVelocity(0, 0)

      this.tweens.add({
        targets: player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 5
      })

      if (this.lives <= 0) {
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

    this.add.text(400, 250, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5)

    this.add.text(400, 320, `Puntuación Final: ${this.score}`, {
      fontSize: '32px',
      color: COLORS.text,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(400, 370, 'Presiona ESPACIO para reiniciar', {
      fontSize: '20px',
      color: COLORS.text,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.restart()
    })
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
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-200)
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(200)
    } else {
      this.player.body.setVelocityX(0)
    }

    // Resetear saltos cuando toca el suelo
    if (this.player.body.touching.down) {
      this.jumpsAvailable = 2
    }

    // Salto del jugador con doble salto
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.jumpsAvailable > 0) {
      this.player.body.setVelocityY(-400)
      this.jumpsAvailable--
    }

    // IA de enemigos optimizada
    this.updateEnemiesAI(delta)

    // Generar nuevas plataformas
    this.platformTimer += delta
    if (this.platformTimer > 5000 && this.dynamicPlatforms.length < 6) {
      this.platformTimer = 0
      this.spawnNewPlatform()
    }
  }

  private updateEnemiesAI(delta: number) {
    const activeEnemies = this.enemyPool.filter(e => e.isActive)
    
    for (const enemy of activeEnemies) {
      const speed = 100
      const onGround = enemy.body.touching.down

      // Actualizar plataforma actual solo cada 200ms o cuando cambia el estado
      enemy.aiUpdateTimer += delta
      if (enemy.aiUpdateTimer > 200 || (onGround && !enemy.currentPlatform)) {
        enemy.aiUpdateTimer = 0
        const newPlatform = this.getEnemyCurrentPlatform(enemy)
        if (newPlatform !== enemy.currentPlatform) {
          enemy.currentPlatform = newPlatform
        }
      }

      let shouldJump = false

      if (onGround && enemy.currentPlatform) {
        const platformTimeLeft = this.getPlatformTimeLeft(enemy.currentPlatform)
        const platformDangerous = platformTimeLeft < 3000

        if (platformDangerous) {
          shouldJump = true
        } else if (Math.abs(enemy.y - this.player.y) > 60 && Math.random() < 0.02) {
          shouldJump = true
        } else if (Math.abs(enemy.x - this.player.x) < 40 && enemy.y > this.player.y) {
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
  }

  private spawnNewPlatform() {
    let validPosition = false
    let attempts = 0
    let x = 0
    let y = 0

    while (!validPosition && attempts < 10) {
      x = Phaser.Math.Between(100, 700)
      const nearGround = Math.random() < 0.5
      y = nearGround ? Phaser.Math.Between(420, 500) : Phaser.Math.Between(150, 380)

      validPosition = true
      for (const platform of this.dynamicPlatforms) {
        const distance = Phaser.Math.Distance.Between(x, y, platform.x, platform.y)
        if (distance < 120) {
          validPosition = false
          break
        }
      }
      attempts++
    }

    if (validPosition) {
      const width = Phaser.Math.Between(100, 180)
      this.createPlatform(x, y, width, 20)
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
      debug: false
    }
  },
  scene: [GameScene]
}

new Phaser.Game(config)
