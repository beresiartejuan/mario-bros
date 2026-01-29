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

class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private dynamicPlatforms!: Phaser.GameObjects.Rectangle[]
  private platformLifetimes!: Map<Phaser.GameObjects.Rectangle, { createdAt: number, lifetime: number }>
  private enemies!: Phaser.Physics.Arcade.Group
  private lives: number = 3
  private score: number = 0
  private survivalTime: number = 0
  private livesText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private platformTimer: number = 0
  private gameStartTime: number = 0
  private jumpsAvailable: number = 2 // Para doble salto

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.gameStartTime = this.time.now

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

    // Crear enemigos
    this.enemies = this.physics.add.group()
    this.createEnemy(700, 500)
    this.createEnemy(400, 300)

    // Colisiones
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.enemies, this.enemies) // Enemigos colisionan entre sí
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this)

    // Controles
    this.cursors = this.input.keyboard!.createCursorKeys()

    // UI
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

    // Incrementar score por tiempo
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.score += 10
        this.scoreText.setText(`Puntos: ${this.score}`)
      },
      loop: true
    })
  }

  createPlatform(x: number, y: number, width: number, height: number) {
    const platform = this.add.rectangle(x, y, width, height, COLORS.platform)
    this.physics.add.existing(platform, true)
    this.platforms.add(platform)
    this.dynamicPlatforms.push(platform)

    // Las plataformas desaparecen después de 10-15 segundos
    const lifetime = Phaser.Math.Between(10000, 15000)
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
        }
      })
    })
  }

  createEnemy(x: number, y: number) {
    const enemy = this.add.rectangle(x, y, 35, 35, COLORS.enemy) as any
    this.physics.add.existing(enemy)
    enemy.body.setBounce(0.2)
    enemy.body.setCollideWorldBounds(true)
    this.enemies.add(enemy)
  }

  hitEnemy(player: any, enemy: any) {
    // Si el jugador está cayendo sobre el enemigo (más margen de detección)
    const playerBottom = player.y + (player.height / 2)
    const enemyTop = enemy.y - (enemy.height / 2)

    // El jugador mata al enemigo si está cayendo y su parte inferior está por encima del centro del enemigo
    if (player.body.velocity.y > 0 && playerBottom < enemy.y + 5) {
      enemy.destroy()
      player.body.setVelocityY(-300)
      this.score += 100
      this.scoreText.setText(`Puntos: ${this.score}`)
    } else {
      // Jugador pierde vida
      this.lives--
      this.livesText.setText(`Vidas: ${this.lives}`)

      player.setPosition(100, 500)
      player.body.setVelocity(0, 0)

      // Efecto de parpadeo
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

    const gameOverText = this.add.text(400, 250, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5)

    const finalScore = this.add.text(400, 320, `Puntuación Final: ${this.score}`, {
      fontSize: '32px',
      color: COLORS.text,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5)

    const restartText = this.add.text(400, 370, 'Presiona ESPACIO para reiniciar', {
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
    // Actualizar tiempo de supervivencia
    this.survivalTime = Math.floor((time - this.gameStartTime) / 1000)
    this.timeText.setText(`Tiempo: ${this.survivalTime}s`)

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

    // IA de enemigos - seguir al jugador de manera inteligente
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        const speed = 100
        const onGround = enemy.body.touching.down

        // Encontrar la plataforma en la que está el enemigo
        let currentPlatform: Phaser.GameObjects.Rectangle | null = null
        let platformTimeLeft = Infinity

        for (const platform of this.dynamicPlatforms) {
          if (enemy.body.touching.down) {
            const platformBody = platform.body as Phaser.Physics.Arcade.Body
            const enemyBottom = enemy.y + enemy.height / 2
            const platformTop = platform.y - platform.height / 2

            if (Math.abs(enemyBottom - platformTop) < 5 &&
              enemy.x > platform.x - platform.width / 2 &&
              enemy.x < platform.x + platform.width / 2) {
              currentPlatform = platform
              const lifetimeInfo = this.platformLifetimes.get(platform)
              if (lifetimeInfo) {
                const elapsed = this.time.now - lifetimeInfo.createdAt
                platformTimeLeft = lifetimeInfo.lifetime - elapsed
              }
              break
            }
          }
        }

        // Si está en una plataforma que está por desaparecer (menos de 3 segundos)
        const platformDangerous = platformTimeLeft < 3000

        // Decidir si necesita saltar
        let shouldJump = false

        if (onGround && platformDangerous && currentPlatform) {
          // Saltar de plataforma peligrosa
          shouldJump = true
        } else if (onGround && Math.abs(enemy.y - this.player.y) > 60) {
          // Saltar si el jugador está significativamente más arriba
          if (Math.random() < 0.02) { // Salto ocasional
            shouldJump = true
          }
        } else if (onGround && Math.abs(enemy.x - this.player.x) < 40 && enemy.y > this.player.y) {
          // Saltar si está muy cerca horizontalmente pero abajo del jugador
          shouldJump = true
        }

        // Ejecutar salto leve
        if (shouldJump) {
          enemy.body.setVelocityY(-250) // Salto leve (menos que el jugador que salta a -400)
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
    })

    // Generar nuevas plataformas más espaciadas
    this.platformTimer += delta
    if (this.platformTimer > 5000 && this.dynamicPlatforms.length < 6) {
      this.platformTimer = 0

      // Intentar encontrar una posición válida (no muy cerca de otras plataformas)
      let validPosition = false
      let attempts = 0
      let x = 0
      let y = 0

      while (!validPosition && attempts < 10) {
        x = Phaser.Math.Between(100, 700)
        // 50% de las plataformas cerca del suelo (entre 420-500) para escapar
        // 50% más altas (entre 150-380)
        const nearGround = Math.random() < 0.5
        y = nearGround ? Phaser.Math.Between(420, 500) : Phaser.Math.Between(150, 380)

        // Verificar distancia mínima con otras plataformas (120px)
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

    // Generar enemigos adicionales ocasionalmente
    if (this.survivalTime % 15 === 0 && this.survivalTime > 0) {
      // Contar solo enemigos activos (vivos)
      const activeEnemies = this.enemies.children.entries.filter((e: any) => e.active).length
      if (activeEnemies < 4) {
        const spawnX = Phaser.Math.Between(0, 1) === 0 ? 50 : 750
        this.createEnemy(spawnX, 100)
      }
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
