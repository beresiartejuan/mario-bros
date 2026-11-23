# 📚 Documentación Técnica - El Cubo Rojo

## Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Sistemas Principales](#sistemas-principales)
3. [Gestión de Objetos](#gestión-de-objetos)
4. [Flujo del Juego](#flujo-del-juego)
5. [Trampas de Phaser a tener en cuenta](#trampas-de-phaser-a-tener-en-cuenta)
6. [Extensiones Posibles](#extensiones-posibles)

---

## Arquitectura del Sistema

### Módulos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/main.ts` | Configuración de Phaser (escala FIT, físicas Arcade, escenas) |
| `src/constants.ts` | Dimensiones del mundo, paleta de colores y `textStyle()` |
| `src/graphics.ts` | Texturas generadas con Canvas, escenario (cielo, colinas, nubes), suelo y dibujo del cubo |
| `src/sfx.ts` | Efectos de sonido sintetizados con Web Audio (singleton `sfx`) |
| `src/storage.ts` | Récord, mejor tiempo, partidas, monedas totales y preferencia de sonido |
| `src/scenes/MenuScene.ts` | Pantalla de título con controles y estadísticas |
| `src/scenes/GameScene.ts` | Toda la lógica de juego |
| `src/scenes/PauseScene.ts` | Capa superpuesta mientras `GameScene` está pausada |

### Escenas

```
MenuScene ──(Espacio/clic)──▶ GameScene ──(P/Esc/perder foco)──▶ PauseScene
    ▲                            │  ▲                                  │
    │                            │  └────────(P/Esc/clic: resume)──────┤
    └──────(Esc en Game Over)────┘                                     │
    └────────────────────────────(Q: salir)────────────────────────────┘
```

`PauseScene` se lanza con `scene.launch()` y `GameScene` se detiene con
`scene.pause()`, lo que congela su `update`, físicas, timers y tweens a la vez.

### Estructura de `GameScene`

```
GameScene (Phaser.Scene)
├── Jugador (cuerpo físico invisible + CubeVisual que se deforma)
├── Plataformas (StaticGroup + array dynamicPlatforms)
├── Enemigos (Group + pool de 8)
├── Monedas (Group + pool de 20)
├── Power-ups (Group + pool de 3)
├── Partículas (monedas, enemigos, power-ups, salto, polvo, escombros)
├── Dificultad (nivel cada 30 s)
└── HUD (vidas, puntos, tiempo, monedas, nivel, récord, power-up)
```

---

## Sistemas Principales

### 1. Movimiento del jugador

Valores en las constantes `MOVE` y `JUMP` de `GameScene.ts`.

- **Aceleración/frenado**: la velocidad horizontal se acerca al objetivo con
  `approach()`, con más agarre en el suelo que en el aire y un extra al girar.
- **Doble salto**: un salto desde el suelo + uno en el aire. Si te caes de una
  plataforma sin saltar, sólo conservas el salto aéreo.
- **Coyote time** (`100 ms`): puedes saltar justo después de dejar el borde.
- **Buffer de salto** (`120 ms`): si pulsas justo antes de aterrizar, el salto
  se ejecuta al tocar el suelo.
- **Salto variable**: soltar el botón mientras subes multiplica la velocidad
  vertical por `0.45`.
- **Golpe**: retroceso, `220 ms` sin control y `1.5 s` de invulnerabilidad
  (el cubo parpadea).

El cuerpo físico es un rectángulo invisible de 30×40. Lo que se ve es un
`Container` (`CubeVisual`) que se sincroniza en `POST_UPDATE` (después del paso
de físicas) y puede estirarse/aplastarse sin alterar las colisiones.

### 2. Plataformas

| Tipo | Comportamiento |
|------|----------------|
| `STATIC` | Fija durante su vida útil |
| `MOVING` | Va y viene; transporta a quien esté encima |
| `BREAKABLE` | Al pisarla parpadea `450 ms` y se rompe |

- La vida útil (`lifetime`, 10–15 s, menor en niveles altos) se mide con `age`,
  que avanza con el `delta` del juego (no avanza en pausa).
- En los últimos `2.5 s` parpadean cada vez más rápido como aviso.
- Una plataforma estática que se mueve no arrastra a los cuerpos que tiene
  encima, por eso `movePlatform()` desplaza manualmente al jugador y a los
  enemigos terrestres que están sobre ella.

### 3. Enemigos

| Tipo | IA |
|------|----|
| `CHASER` | Corre hacia el jugador y salta si su plataforma va a desaparecer o si el jugador está encima |
| `PATROL` | Patrulla ±150 px y cambia de sentido al chocar |
| `FLYING` | Vuela directo hacia el jugador con una oscilación |

- Aparecen en el lado contrario al jugador y son inofensivos durante `600 ms`
  mientras se materializan.
- Las decisiones aleatorias usan probabilidad por milisegundo
  (`Math.random() < k * dt`) para no depender de los FPS.
- **Pisotón**: si el jugador cae y su base está por encima del centro del
  enemigo. Encadenar pisotones sin tocar el suelo multiplica los puntos
  (x2, x4, x8).

### 4. Dificultad progresiva

`getDifficulty(level)` calcula los parámetros de cada nivel (sube cada 30 s):

| Parámetro | Nivel 1 | Crecimiento | Tope |
|-----------|---------|-------------|------|
| Máx. enemigos | 4 | +1 por nivel | 8 |
| Mín. enemigos | 2 | +1 cada 2 niveles | 5 |
| Intervalo de spawn | 15 s | −2 s | 5 s |
| Velocidad enemigos | ×1 | +8 % | ×1.6 |
| Salto del chaser | 250 | +30 | 420 |
| Vida de plataformas | ×1 | −5 % | ×0.6 |

Los puntos por segundo sobrevivido también escalan: `10 × nivel`.

### 5. Monedas, vidas y power-ups

- Monedas: 50 puntos; cada 25 monedas, +1 vida (máx. 5) o +500 si ya estás al
  máximo. Flotan con `baseY + sin(t)` (posición absoluta, no acumulativa) y
  simulan un giro escalando el eje X.
- Power-ups (5 s): invencibilidad, super salto (`gravityY = -400`) y super
  velocidad. Si no se recogen, desaparecen a los 10 s (parpadean antes). Al
  terminar la invencibilidad hay `800 ms` de margen sin daño.

### 6. Sonido

`sfx.ts` sintetiza todos los efectos con osciladores y ruido filtrado,
reutilizando el `AudioContext` de Phaser (que se desbloquea con la primera
interacción y se suspende al perder el foco). La preferencia de silencio se
guarda en `localStorage`.

---

## Gestión de Objetos

### Object pooling correcto en Arcade Physics

```typescript
// Crear: añadir al grupo PRIMERO y configurar DESPUÉS
const coin = this.physics.add.image(0, 0, 'coin') as Coin
this.coins.add(coin) // ⚠️ aplica los valores por defecto del grupo
coin.body.setAllowGravity(false)
coin.disableBody(true, true) // inactivo, oculto y SIN cuerpo físico

// Activar
coin.enableBody(true, x, y, true, true)

// Desactivar
coin.disableBody(true, true)
```

Los objetos libres del pool se buscan con `pool.find((o) => !o.active)`.

### Texturas

Todas se generan una sola vez con `addCanvasTexture()` en `graphics.ts`
(si la clave ya existe no se vuelve a crear), por lo que reiniciar la escena
no produce avisos de "Texture key already in use".

---

## Flujo del Juego

```
init()            ← reinicia TODO el estado (Phaser lo llama en cada start/restart)
    ↓
create()
    ├── createGameTextures() / createScenery()
    ├── createParticleSystems() / createWorld() / createPlayer()
    ├── createPools() / setupCollisions() / setupInput()
    ├── createHud() / setupTimers() / setupSceneEvents()
    └── plataformas, enemigos y monedas iniciales
    ↓
update(time, delta)
    ├── updateClock()        → tiempo y subida de nivel
    ├── updatePlayer()       → input, saltos, aceleración
    ├── updateEnemiesAI()
    ├── updatePlatforms()    → vida útil, avisos, movimiento, nuevas plataformas
    ├── updateCoins() / updatePowerUps() / updatePowerUpBar()
    └── spawn periódico de enemigos
    ↓
POST_UPDATE → syncPlayerVisual()
    ↓
gameOver()
    ├── physics.pause() + time.removeAllEvents()
    ├── recordGame() → estadísticas previas para detectar récords
    └── panel: Espacio/Enter reintenta, Esc vuelve al menú
```

---

## Trampas de Phaser a tener en cuenta

1. **`setActive(false)` no desactiva el cuerpo físico.** Un objeto inactivo e
   invisible sigue colisionando. Usa `disableBody()` / `enableBody()`.
2. **`group.add()` sobrescribe la configuración del cuerpo** (gravedad, rebote,
   límites del mundo...) con los valores por defecto del grupo.
3. **Los campos de clase no se reinician con `scene.restart()`.** Reinícialos
   en `init()`.
4. **Los listeners de `this.events` y `this.game.events` sobreviven al
   reinicio.** Quítalos en `SHUTDOWN` (los del teclado y del input de la escena
   sí se limpian solos).
5. **`body.touching.down` puede seguir a `true` en fotogramas sin paso de
   físicas** (monitores de más de 60 Hz). Comprueba también `velocity.y >= 0`
   antes de recargar saltos.
6. **`this.time.now` sigue avanzando durante la pausa.** Para medir tiempo de
   juego acumula el `delta` de `update()`.

---

## Extensiones Posibles

### Añadir un nuevo enemigo

1. Crear su textura en `createGameTextures()`
2. Añadir el tipo a `EnemyType` y a `ENEMY_INFO`
3. Implementar su IA y añadir el `case` en `updateEnemiesAI()`
4. Incluirlo en `randomEnemyKind()`

### Añadir un nuevo power-up

1. Crear su textura
2. Añadirlo a `PowerUpType` y a `POWERUP_INFO`
3. Aplicar el efecto en `activatePowerUp()` y revertirlo en `deactivatePowerUp()`

### Depuración

Abre el juego con `?debug` en la URL para ver los cuerpos de colisión.

---

## Referencias

- [Phaser 3 Docs](https://docs.phaser.io/)
- [Arcade Physics](https://docs.phaser.io/phaser/concepts/physics/arcade)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig/#strict)
