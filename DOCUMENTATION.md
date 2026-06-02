# 📚 Documentación Técnica - Mario Bros

## Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Sistemas Principales](#sistemas-principales)
3. [Gestión de Objetos](#gestión-de-objetos)
4. [Flujo del Juego](#flujo-del-juego)
5. [Optimizaciones](#optimizaciones)

---

## Arquitectura del Sistema

### Patrón de Diseño

El juego sigue una arquitectura basada en **escenas de Phaser** con los siguientes patrones:

- **Singleton Pattern**: La escena `GameScene` actúa como controlador principal
- **Object Pooling**: Reutilización de objetos para minimizar garbage collection
- **State Management**: Variables de estado centralizadas en la clase principal

### Estructura de Clases

```
GameScene (Phaser.Scene)
├── Propiedades del Jugador
├── Sistemas de Juego
│   ├── Plataformas (StaticGroup + Arrays dinámicos)
│   ├── Enemigos (Group + Pool)
│   ├── Monedas (Group + Pool)
│   └── Power-ups (Group + Pool)
├── Sistema de Partículas
└── UI y HUD
```

---

## Sistemas Principales

### 1. Sistema de Plataformas

**Tipos de Plataformas:**

- **STATIC**: Plataformas estáticas con tiempo de vida limitado (10-15 segundos)
- **MOVING**: Plataformas horizontales con movimiento automático
- **BREAKABLE**: Plataformas que se destruyen al ser pisadas

**Implementación:**

```typescript
interface MovingPlatform extends PoolablePlatform {
  isMoving: boolean
  startX: number
  endX: number
  speed: number
  direction: number
}
```

**Gestión de Ciclo de Vida:**
- Cada plataforma tiene un `lifetime` y `createdAt`
- Al expirar, se desvanece gradualmente (alpha → 0)
- Luego se elimina del array y del grupo

### 2. Sistema de Enemigos (Object Pooling)

**Tipos de Enemigos:**

| Tipo | IA | Prioridad |
|------|-----|-----------|
| CHASER | Persigue al jugador | Media |
| PATROL | Patrulla entre dos puntos | Baja |
| FLYING | Vuela directo al jugador | Alta |

**Object Pool Pattern:**

```typescript
private enemyPool: PoolableEnemy[] = []

// Al spawnear: buscar enemigo inactivo
const enemy = this.enemyPool.find(e => !e.isActive)
if (enemy) {
  enemy.setPosition(x, y)
  enemy.isActive = true
  // ... configurar
}

// Al despawnear: marcar como inactivo
enemy.isActive = false
enemy.setVisible(false)
enemy.setPosition(-100, -100) // Fuera de pantalla
```

**Ventajas:**
- Reduce llamadas a `new` y `destroy`
- Minimiza garbage collection pauses
- Mantiene rendimiento constante

### 3. Sistema de IA

**Update Rate Optimizado:**

```typescript
// Solo actualizar plataforma actual cada 200ms
enemy.aiUpdateTimer += delta
if (enemy.aiUpdateTimer > 200) {
  enemy.aiUpdateTimer = 0
  enemy.currentPlatform = this.getEnemyCurrentPlatform(enemy)
}
```

**Decisiones de Salto (Chaser):**

1. Plataforma a punto de desaparecer (`timeLeft < 3000ms`)
2. Jugador está más de 60px arriba
3. Jugador está cerca horizontalmente y arriba

### 4. Sistema de Monedas

**Spawn Locations:**
- Posiciones fijas iniciales
- Spawn aleatorio cuando hay menos de 8 monedas activas
- Spawn al matar enemigos (3 monedas en arco)

**Animación:**
- Flotación: `sin(time/500 + offset) * 5`
- Rotación constante: `rotation += 0.02`

### 5. Sistema de Power-ups

**Duración:** 5000ms

**Efectos:**

| Tipo | Implementación |
|------|----------------|
| INVINCIBLE | `this.isInvincible = true` + animación alpha |
| SUPER_JUMP | `player.body.setGravityY(-400)` |
| SUPER_SPEED | Velocidad base 400 vs 200 normal |

**Timer Management:**

```typescript
if (this.powerUpTimer) {
  this.powerUpTimer.remove()
}
this.powerUpTimer = this.time.delayedCall(POWERUP_DURATION, () => {
  this.deactivatePowerUp()
})
```

---

## Gestión de Objetos

### Interfaces Poolables

```typescript
interface PoolableEnemy extends Phaser.GameObjects.Image {
  body: Phaser.Physics.Arcade.Body
  isActive: boolean
  currentPlatform: PoolablePlatform | null
  aiUpdateTimer: number
}

interface PoolableCoin extends Phaser.GameObjects.Image {
  isActive: boolean
  spawnTime: number
  floatOffset: number
}
```

### Creación de Texturas

**Canvas API para texturas personalizadas:**

```typescript
const canvas = document.createElement('canvas')
canvas.width = 32
canvas.height = 32
const ctx = canvas.getContext('2d')
// ... dibujar forma personalizada
this.textures.addCanvas('textureKey', canvas)
```

---

## Flujo del Juego

### Ciclo de Vida de la Escena

```
constructor()
    ↓
create()
    ├── resetGameState()
    ├── createGameTextures()
    ├── cleanupPools()
    ├── createGradientBackground()
    ├── createParticleSystems()
    ├── setupPhysics()
    └── createUI()
    ↓
update(time, delta) ← loop 60fps
    ├── updatePlayerMovement()
    ├── updateEnemiesAI()
    ├── updateMovingPlatforms()
    ├── spawnNewPlatform()
    └── animateCoins()
    ↓
hitEnemy() / collectCoin() / collectPowerUp()
    ↓
gameOver()
    ├── physics.pause()
    ├── remove timers
    ├── show UI
    └── wait for SPACE → scene.restart()
```

### Reinicio de Escena

**Problema resuelto:** Variables no se reiniciaban correctamente.

**Solución:**

```typescript
create() {
  this.resetGameState() // ← Al inicio de todo
  // ... resto de inicialización
}

private resetGameState() {
  this.lives = 3
  this.score = 0
  this.survivalTime = 0
  this.coinsCollected = 0
  // Limpiar grupos y timers
}
```

---

## Optimizaciones

### 1. Delta Time Usage

```typescript
// Plataformas móviles
const deltaSeconds = delta / 1000
platform.x += platform.speed * platform.direction * deltaSeconds
```

### 2. Conditional Updates

```typescript
// Solo actualizar tiempo de supervivencia cuando cambia
const currentSurvivalTime = Math.floor((time - this.gameStartTime) / 1000)
if (currentSurvivalTime !== this.lastSurvivalTime) {
  this.survivalTime = currentSurvivalTime
  this.timeText.setText(`Tiempo: ${this.survivalTime}s`)
  this.lastSurvivalTime = currentSurvivalTime
}
```

### 3. Spatial Checks

```typescript
// Enemigos solo saltan si el jugador está cerca
if (Math.abs(enemy.x - this.player.x) < 80) {
  // ... lógica de salto
}
```

### 4. Physics Groups

- Uso de `Phaser.Physics.Arcade.Group` para colisiones eficientes
- `overlap` en lugar de `collider` cuando no necesitamos respuesta física

---

## Debugging

### Habilitar Debug Physics

```typescript
// En config:
physics: {
  arcade: {
    debug: true // Muestra hitboxes y vectores
  }
}
```

### Logs Útiles

```typescript
// Contar objetos activos
console.log('Active enemies:', this.enemyPool.filter(e => e.isActive).length)
console.log('Pool size:', this.enemyPool.length)
```

---

## Extensiones Posibles

### Añadir Nuevo Enemigo

1. Crear textura en `createGameTextures()`
2. Añadir tipo a `EnemyType`
3. Implementar lógica en `updateEnemiesAI()`
4. Añadir comportamiento específico

### Añadir Nuevo Power-up

1. Crear textura
2. Añadir a `PowerUpType`
3. Implementar `activate[Name]()` y `deactivate[Name]()`
4. Añadir case en `activatePowerUp()`

---

## Referencias

- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Arcade Physics](https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.html)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig/#strict)

---

*Documentación generada para el proyecto Mario Bros*
*Última actualización: Junio 2026*
