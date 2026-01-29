---
name: phaser-physics
description: Guía completa sobre cómo hacer físicas buenas en Phaser.js. Use esta skill cuando el usuario necesite implementar física, colisiones, gravedad, velocidad, fuerzas, detección de contacto, cuerpos físicos, o cualquier comportamiento relacionado con el sistema de física de Phaser (Arcade, Matter, Impact).
---

# Físicas en Phaser.js

## Sistemas de física disponibles

Phaser 3 incluye tres motores de física:

1. **Arcade Physics** - Simple, rápido, ideal para la mayoría de juegos (recomendado)
2. **Matter.js** - Física realista, rotación, formas complejas
3. **Impact Physics** - Física basada en tiles, menos usado

**Recomendación:** Usa Arcade para juegos 2D simples y Matter solo si necesitas física avanzada.

## Arcade Physics (Recomendado)

### Configuración básica

```javascript
const config = {
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 }, // Gravedad hacia abajo
      debug: true, // Mostrar hitboxes (development)
      debugShowBody: true, // Mostrar cuerpos
      debugShowStaticBody: true, // Mostrar cuerpos estáticos
      debugShowVelocity: true, // Mostrar vectores de velocidad
    },
  },
};
```

### Habilitar física en objetos

```javascript
// Crear objeto con física
const player = this.physics.add.sprite(100, 100, "player");

// Agregar física a objeto existente
const box = this.add.rectangle(200, 200, 50, 50, 0xff0000);
this.physics.add.existing(box);

// Objeto estático (no se mueve)
const platform = this.physics.add.staticSprite(400, 500, "ground");

// O agregar física estática a objeto existente
const wall = this.add.rectangle(400, 300, 20, 200, 0x00ff00);
this.physics.add.existing(wall, true); // true = estático
```

### Propiedades del cuerpo físico

```javascript
// Acceder al cuerpo físico
const body = player.body;

// Velocidad (píxeles por segundo)
player.setVelocity(100, -200); // x: derecha, y: arriba
player.setVelocityX(150);
player.setVelocityY(-300);

// Obtener velocidad actual
console.log(body.velocity.x);
console.log(body.velocity.y);

// Velocidad máxima
player.setMaxVelocity(200, 400); // Limitar velocidad

// Aceleración
player.setAcceleration(50, 0); // Acelerar gradualmente
player.setAccelerationX(100);
player.setAccelerationY(-50);

// Fricción/Arrastre (desaceleración)
player.setDrag(100); // Desacelera en ambas direcciones
player.setDragX(150); // Solo horizontal
player.setDragY(50); // Solo vertical

// Gravedad individual (suma a la global)
player.setGravity(0, 500); // Cae más rápido
player.setGravityY(200);
player.body.allowGravity = false; // Desactivar gravedad para este objeto

// Rebote (bounce)
player.setBounce(0.5); // Rebota 50% al colisionar
player.setBounce(0.3, 0.8); // x: 30%, y: 80%
player.body.bounce.x = 1; // Rebote 100% horizontal

// Masa (afecta colisiones)
player.body.mass = 2; // Objeto más pesado

// Fricción con superficies
player.body.friction.x = 0.1;
player.body.friction.y = 0;
```

### Colisiones y límites

```javascript
// Colisionar con los bordes del mundo
player.setCollideWorldBounds(true);

// Callback cuando toca el borde
player.body.onWorldBounds = true;
this.physics.world.on("worldbounds", (body) => {
  console.log("Objeto tocó el borde");
});

// Ajustar límites del mundo
this.physics.world.setBounds(0, 0, 2000, 1000);

// Configurar qué bordes colisionan
this.physics.world.setBoundsCollision(true, true, true, false);
// (left, right, top, bottom)
```

### Colisiones entre objetos

```javascript
// Colisión simple (con física)
this.physics.add.collider(player, platforms);

// Colisión con callback
this.physics.add.collider(player, enemies, hitEnemy, null, this);

function hitEnemy(player, enemy) {
  enemy.destroy();
  player.setTint(0xff0000);
}

// Colisión con condición
this.physics.add.collider(
  player,
  doors,
  enterDoor,
  (p, d) => {
    return d.isOpen; // Solo colisiona si la puerta está abierta
  },
  this,
);

// Overlap (detectar sin física - no empuja)
this.physics.add.overlap(player, coins, collectCoin, null, this);

function collectCoin(player, coin) {
  coin.destroy();
  score += 10;
}

// Colisión entre grupos
this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
```

### Detección de contacto

```javascript
update() {
    // Verificar qué lados están tocando algo
    if (player.body.touching.down) {
        console.log('Tocando el suelo');
    }

    if (player.body.touching.up) {
        console.log('Tocando el techo');
    }

    if (player.body.touching.left) {
        console.log('Tocando por la izquierda');
    }

    if (player.body.touching.right) {
        console.log('Tocando por la derecha');
    }

    // Verificar si está bloqueado (más confiable)
    if (player.body.blocked.down) {
        console.log('Bloqueado abajo - puede saltar');
    }

    // Verificar si está en el suelo (método más seguro)
    if (player.body.onFloor()) {
        // Permitir salto
    }
}
```

### Tamaño y offset del cuerpo físico

```javascript
// Ajustar tamaño del hitbox
player.body.setSize(20, 30);

// Con offset (útil para ajustar a sprites)
player.body.setSize(20, 30, true); // true = centrar
player.body.setOffset(6, 2); // Mover hitbox

// Para círculos
player.body.setCircle(16); // Radio 16
player.body.setCircle(16, 8, 8); // Radio 16, offset x:8, y:8

// Mostrar el hitbox real en debug mode
player.body.debugShowBody = true;
```

### Cuerpos estáticos vs dinámicos

```javascript
// Objeto dinámico (default)
const player = this.physics.add.sprite(100, 100, "player");
player.body.moves = true; // Se mueve
player.body.allowGravity = true; // Tiene gravedad

// Objeto estático (plataformas, paredes)
const platform = this.physics.add.staticSprite(400, 500, "ground");
platform.body.moves = false; // No se mueve
platform.body.allowGravity = false; // Sin gravedad

// Hacer inmovible (no es empujado por colisiones)
platform.setImmovable(true);

// Grupos estáticos (más eficiente)
const platforms = this.physics.add.staticGroup();
platforms.create(400, 568, "ground");
platforms.create(600, 400, "ground");
platforms.refresh(); // IMPORTANTE: actualizar después de crear
```

### Movimiento controlado por física

```javascript
update() {
    const cursors = this.cursors;

    // Método 1: Velocidad directa (más común)
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    // Método 2: Aceleración (más suave)
    if (cursors.left.isDown) {
        player.setAccelerationX(-300);
    } else if (cursors.right.isDown) {
        player.setAccelerationX(300);
    } else {
        player.setAccelerationX(0);
        player.setDragX(500); // Desacelerar
    }

    // Salto (solo si está en el suelo)
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    // Salto variable (mantener presionado = más alto)
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
        this.isJumping = true;
    }

    if (this.isJumping && cursors.up.isUp) {
        player.setVelocityY(player.body.velocity.y * 0.5);
        this.isJumping = false;
    }
}
```

### Fuerzas y empuje

```javascript
// Aplicar fuerza (más realista que velocidad directa)
player.body.setAllowDrag(true);
player.body.setDrag(0.99); // Fricción atmosférica

// Push (empujar)
player.body.velocity.x += 50;
player.body.velocity.y -= 100;

// Impulso instantáneo
if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
  player.body.velocity.y = -400;
}
```

### Físicas personalizadas avanzadas

```javascript
// Doble salto
create() {
    this.jumpsRemaining = 2;
}

update() {
    if (player.body.touching.down) {
        this.jumpsRemaining = 2;
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpsRemaining > 0) {
        player.setVelocityY(-330);
        this.jumpsRemaining--;
    }
}

// Dash (movimiento rápido)
dash() {
    if (this.canDash) {
        const dashSpeed = 500;
        const direction = player.flipX ? -1 : 1;
        player.setVelocityX(dashSpeed * direction);
        player.setVelocityY(0);

        this.canDash = false;
        this.time.delayedCall(1000, () => {
            this.canDash = true;
        });
    }
}

// Wall jump
update() {
    if (cursors.up.isDown && player.body.touching.left) {
        player.setVelocity(200, -300); // Saltar a la derecha
    }

    if (cursors.up.isDown && player.body.touching.right) {
        player.setVelocity(-200, -300); // Saltar a la izquierda
    }
}
```

### Grupos con física

```javascript
// Grupo dinámico
const enemies = this.physics.add.group({
  defaultKey: "enemy",
  maxSize: 10,
  bounceX: 0.5,
  bounceY: 0.3,
  collideWorldBounds: true,
});

// Crear múltiples enemigos
for (let i = 0; i < 5; i++) {
  const enemy = enemies.create(100 + i * 100, 300, "enemy");
  enemy.setVelocityX(Phaser.Math.Between(-50, 50));
}

// Grupo estático
const platforms = this.physics.add.staticGroup();
platforms.create(400, 500, "ground");
platforms.create(600, 400, "ledge");
platforms.refresh(); // Actualizar posiciones
```

### Debugging de física

```javascript
// Activar debug en config
physics: {
    arcade: {
        debug: true,
        debugShowBody: true,
        debugShowStaticBody: true,
        debugShowVelocity: true,
        debugVelocityColor: 0x00ff00,
        debugBodyColor: 0xff00ff,
        debugStaticBodyColor: 0x0000ff
    }
}

// Debug de objeto específico
player.body.debugShowBody = true;
player.body.debugBodyColor = 0xff0000;

// Pausar física
this.physics.pause();

// Reanudar física
this.physics.resume();

// Logging útil
console.log('Velocidad:', player.body.velocity);
console.log('Posición:', player.x, player.y);
console.log('En el suelo:', player.body.touching.down);
console.log('Gravedad:', player.body.gravity);
```

## Matter.js (Física avanzada)

### Configuración

```javascript
const config = {
  physics: {
    default: "matter",
    matter: {
      gravity: { y: 1 },
      debug: true,
    },
  },
};
```

### Uso básico

```javascript
// Crear objeto con física Matter
const player = this.matter.add.sprite(100, 100, "player");

// Forma del cuerpo
player.setRectangle(32, 48);
player.setCircle(16);
player.setPolygon(radius, sides);

// Propiedades Matter
player.setFriction(0.1); // Fricción
player.setFrictionAir(0.01); // Resistencia al aire
player.setMass(10); // Masa
player.setBounce(0.8); // Rebote
player.setDensity(0.001); // Densidad

// Aplicar fuerza
player.applyForce({ x: 0.05, y: -0.1 });

// Velocidad
player.setVelocity(5, -10);
player.setAngularVelocity(0.1); // Rotación

// Colisiones Matter
this.matter.world.on("collisionstart", (event) => {
  event.pairs.forEach((pair) => {
    console.log("Colisión detectada");
  });
});
```

## Best Practices

### Para Arcade Physics:

1. **Usa grupos estáticos** para objetos que no se mueven (plataformas, paredes)
2. **Llama `refresh()`** después de modificar grupos estáticos
3. **Usa `touching.down`** para detectar si está en el suelo antes de permitir saltos
4. **Ajusta el hitbox** con `setSize()` para que coincida con el sprite visual
5. **Activa debug** durante desarrollo para ver colisiones
6. **Usa `setDrag()`** para desaceleración natural al soltar controles
7. **Limita velocidad máxima** con `setMaxVelocity()` para evitar comportamiento errático

### Valores típicos:

- **Gravedad:** 300-800 (mayor = cae más rápido)
- **Velocidad caminar:** 100-200
- **Velocidad correr:** 200-400
- **Salto:** -250 a -400 (negativo = arriba)
- **Rebote:** 0-0.3 para personajes, 0.8-1 para pelotas
- **Drag:** 500-1000 para desaceleración natural

### Errores comunes:

❌ Olvidar `platforms.refresh()` en grupos estáticos
❌ No verificar `touching.down` antes de saltar (salta en el aire)
❌ Usar valores de velocidad demasiado altos
❌ No ajustar el hitbox al tamaño del sprite
❌ Mezclar movimiento directo (`x += 1`) con física (usar solo `setVelocity`)
