---
name: phaser-intro
description: Introducción completa a Phaser.js con métodos comunes y útiles. Use esta skill cuando el usuario necesite conocer la estructura básica de Phaser, métodos fundamentales, sistema de escenas, manejo de sprites, input, audio, o cualquier concepto básico de la librería.
---

# Introducción a Phaser.js

## ¿Qué es Phaser?

Phaser es un framework de desarrollo de juegos 2D en JavaScript de código abierto. Soporta Canvas y WebGL, tiene un sistema de física integrado, y es ideal para crear juegos de navegador.

**Versión recomendada:** Phaser 3 (actual)

## Estructura básica de un juego

### Setup HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.js"></script>
  </head>
  <body>
    <script src="game.js"></script>
  </body>
</html>
```

### Configuración del juego

```javascript
const config = {
  type: Phaser.AUTO, // AUTO, CANVAS, o WEBGL
  width: 800, // Ancho del canvas
  height: 600, // Alto del canvas
  parent: "game-container", // ID del contenedor HTML (opcional)
  backgroundColor: "#000000", // Color de fondo
  pixelArt: true, // Para gráficos pixelados
  physics: {
    default: "arcade", // 'arcade', 'matter', o 'impact'
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [MenuScene, GameScene], // Array de escenas
};

const game = new Phaser.Game(config);
```

### Anatomía de una Scene

```javascript
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    // Cargar assets: imágenes, audio, sprites
    this.load.image("player", "assets/player.png");
    this.load.audio("jump", "assets/jump.mp3");
    this.load.spritesheet("enemy", "assets/enemy.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    // Inicializar el juego: crear objetos, configurar física
    this.player = this.add.sprite(100, 100, "player");
  }

  update(time, delta) {
    // Lógica de juego ejecutada cada frame
    // time: tiempo total transcurrido (ms)
    // delta: tiempo desde el último frame (ms)
  }
}
```

## Métodos comunes y útiles

### Sistema de Escenas

```javascript
// Iniciar una escena
this.scene.start('GameScene');

// Pausar la escena actual
this.scene.pause();

// Reanudar escena pausada
this.scene.resume();

// Reiniciar la escena actual
this.scene.restart();

// Detener y remover una escena
this.scene.stop('MenuScene');

// Ejecutar múltiples escenas simultáneamente
this.scene.launch('UIScene'); // Corre en paralelo

// Pasar datos entre escenas
this.scene.start('GameScene', { level: 1, score: 100 });

// Recibir datos en la nueva escena
create(data) {
    console.log(data.level); // 1
    console.log(data.score); // 100
}
```

### Game Objects (add)

```javascript
// Imagen estática
this.add.image(x, y, "key");

// Sprite (con animaciones)
this.add.sprite(x, y, "key");

// Texto
this.add.text(x, y, "Hello World", {
  fontSize: "32px",
  fill: "#fff",
  fontFamily: "Arial",
});

// Formas geométricas
this.add.rectangle(x, y, width, height, color);
this.add.circle(x, y, radius, color);
this.add.ellipse(x, y, width, height, color);
this.add.triangle(x1, y1, x2, y2, x3, y3, color);
this.add.line(x, y, x1, y1, x2, y2, color);

// Graphics (dibujo libre)
const graphics = this.add.graphics();
graphics.fillStyle(0xff0000, 1);
graphics.fillRect(0, 0, 100, 100);

// Contenedor (agrupar objetos)
const container = this.add.container(x, y);
container.add([sprite1, sprite2, text]);

// Tilemap (mapas de tiles)
const map = this.make.tilemap({ key: "map" });
```

### Manipulación de Game Objects

```javascript
// Posición
objeto.x = 100;
objeto.y = 200;
objeto.setPosition(100, 200);

// Escala
objeto.setScale(2); // 200% de tamaño
objeto.setScale(0.5, 1); // 50% ancho, 100% alto

// Rotación
objeto.rotation = Math.PI / 4; // Radianes
objeto.angle = 45; // Grados
objeto.setRotation(1.57);

// Origen (punto de referencia)
objeto.setOrigin(0.5, 0.5); // Centro (default)
objeto.setOrigin(0, 0); // Esquina superior izquierda
objeto.setOrigin(1, 1); // Esquina inferior derecha

// Visibilidad
objeto.setVisible(false);
objeto.visible = true;

// Transparencia
objeto.setAlpha(0.5); // 50% transparente
objeto.alpha = 1; // Opaco

// Profundidad (z-index)
objeto.setDepth(10); // Mayor = más adelante

// Destruir objeto
objeto.destroy();

// Flip (voltear)
objeto.setFlipX(true);
objeto.setFlipY(true);
```

### Input (Teclado)

```javascript
// Método 1: Cursor keys
create() {
    this.cursors = this.input.keyboard.createCursorKeys();
}

update() {
    if (this.cursors.left.isDown) { }
    if (this.cursors.right.isDown) { }
    if (this.cursors.up.isDown) { }
    if (this.cursors.down.isDown) { }
    if (this.cursors.space.isDown) { }
}

// Método 2: Teclas específicas
create() {
    this.keyW = this.input.keyboard.addKey('W');
    this.keyA = this.input.keyboard.addKey('A');
    this.keyS = this.input.keyboard.addKey('S');
    this.keyD = this.input.keyboard.addKey('D');
}

update() {
    if (this.keyW.isDown) { }
}

// Eventos de teclado
this.input.keyboard.on('keydown-SPACE', () => {
    console.log('Espacio presionado');
});

// Una sola vez
this.input.keyboard.once('keydown-ENTER', () => {
    console.log('Enter presionado una vez');
});

// Verificar si una tecla se acaba de presionar
if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
    // Se presionó en este frame
}
```

### Input (Mouse/Touch)

```javascript
// Click en cualquier parte
this.input.on("pointerdown", (pointer) => {
  console.log(pointer.x, pointer.y);
});

// Click en un objeto específico
sprite.setInteractive();
sprite.on("pointerdown", () => {
  console.log("Sprite clickeado");
});

// Hover
sprite.on("pointerover", () => {
  console.log("Mouse encima");
});

sprite.on("pointerout", () => {
  console.log("Mouse salió");
});

// Drag and drop
sprite.setInteractive({ draggable: true });
this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
  gameObject.x = dragX;
  gameObject.y = dragY;
});
```

### Animaciones

```javascript
// Crear animación
this.anims.create({
  key: "walk",
  frames: this.anims.generateFrameNumbers("player", {
    start: 0,
    end: 7,
  }),
  frameRate: 10,
  repeat: -1, // -1 = loop infinito
});

// Reproducir animación
sprite.anims.play("walk");

// Parar animación
sprite.anims.stop();

// Pausar animación
sprite.anims.pause();

// Eventos de animación
sprite.on("animationcomplete", () => {
  console.log("Animación terminó");
});
```

### Audio

```javascript
// Reproducir sonido
const sound = this.sound.add("jump");
sound.play();

// Con configuración
sound.play({
  volume: 0.5,
  loop: false,
});

// Música de fondo
const music = this.sound.add("bgMusic", {
  loop: true,
  volume: 0.3,
});
music.play();

// Controles
sound.pause();
sound.resume();
sound.stop();

// Volumen global
this.sound.volume = 0.5;

// Mutear todo
this.sound.mute = true;
```

### Cámaras

```javascript
// Cámara principal
const camera = this.cameras.main;

// Seguir un objeto
camera.startFollow(player);

// Seguir con suavizado
camera.startFollow(player, true, 0.1, 0.1);

// Límites de la cámara
camera.setBounds(0, 0, 2000, 1000);

// Zoom
camera.setZoom(2);

// Efectos de cámara
camera.shake(500); // Duración en ms
camera.flash(1000);
camera.fade(2000);

// Parar de seguir
camera.stopFollow();
```

### Timers y Eventos

```javascript
// Timer de una sola vez
this.time.delayedCall(1000, () => {
  console.log("Ejecutado después de 1 segundo");
});

// Timer repetitivo
this.time.addEvent({
  delay: 2000, // Cada 2 segundos
  callback: () => {
    console.log("Ejecutado cada 2 segundos");
  },
  loop: true,
});

// Timer con límite de repeticiones
this.time.addEvent({
  delay: 1000,
  callback: spawnEnemy,
  repeat: 5, // Se ejecuta 6 veces total
});
```

### Tweens (Animaciones de propiedades)

```javascript
// Mover objeto
this.tweens.add({
  targets: sprite,
  x: 400,
  duration: 2000,
  ease: "Power2",
});

// Múltiples propiedades
this.tweens.add({
  targets: sprite,
  x: 400,
  y: 300,
  alpha: 0,
  scale: 2,
  rotation: Math.PI,
  duration: 1000,
  ease: "Linear",
  yoyo: true, // Regresa al inicio
  repeat: -1, // Loop infinito
});

// Callback al terminar
this.tweens.add({
  targets: sprite,
  x: 400,
  duration: 1000,
  onComplete: () => {
    console.log("Tween completado");
  },
});

// Easing comunes: 'Linear', 'Power2', 'Bounce', 'Elastic', 'Back'
```

### Grupos

```javascript
// Crear grupo
const enemies = this.add.group();

// Agregar objetos
enemies.add(enemy1);
enemies.add(enemy2);

// Crear y agregar en una línea
const enemy = enemies.create(100, 100, "enemy");

// Iterar sobre el grupo
enemies.children.iterate((enemy) => {
  enemy.x += 1;
});

// Eliminar del grupo
enemies.remove(enemy1);

// Limpiar grupo completo
enemies.clear(true, true); // Destruir objetos también
```

## Ciclo de vida del juego

1. **Constructor** - Se ejecuta una vez al crear la escena
2. **init(data)** - Recibe datos de la escena anterior
3. **preload()** - Carga de assets
4. **create(data)** - Inicialización del juego
5. **update(time, delta)** - Loop principal del juego (60 FPS)

## Tips importantes

- `this.add.*` crea objetos visuales
- `this.physics.add.*` crea objetos con física
- `this.input.*` maneja input del usuario
- `this.sound.*` maneja audio
- `this.time.*` maneja timers
- `this.tweens.*` maneja animaciones de propiedades
- `this.cameras.*` maneja cámaras
- `this.scene.*` maneja escenas

## Coordenadas

- Origen (0, 0) está en la esquina superior izquierda
- X aumenta hacia la derecha
- Y aumenta hacia abajo
- Rotación en radianes (0 a 2π) o grados (0 a 360)
