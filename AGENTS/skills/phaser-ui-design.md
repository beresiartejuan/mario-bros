---
name: phaser-ui-design
description: Guía para crear interfaces de usuario bonitas en Phaser.js sin necesidad de sprites o imágenes. Use esta skill cuando el usuario necesite crear menús, HUD, barras de vida, botones, paneles, efectos visuales, texto estilizado, o cualquier elemento de interfaz usando solo código y formas geométricas.
---

# UI Bonita sin Sprites en Phaser.js

## Principios de diseño sin assets

Crear UI atractiva usando solo código requiere:

- **Formas geométricas** bien combinadas
- **Colores armoniosos** con paletas definidas
- **Tipografía clara** con jerarquía
- **Efectos sutiles** (sombras, gradientes simulados, animaciones)
- **Espaciado consistente** y alineación

## Paletas de colores

### Paletas predefinidas

```javascript
// Paleta oscura moderna
const COLORS = {
  bg: 0x1a1a2e,
  primary: 0x16213e,
  secondary: 0x0f3460,
  accent: 0xe94560,
  text: 0xffffff,
  textDark: 0xa0a0a0,
};

// Paleta clara y vibrante
const COLORS = {
  bg: 0xf0f0f0,
  primary: 0x667eea,
  secondary: 0x764ba2,
  accent: 0xf093fb,
  text: 0x2d3436,
  textLight: 0x636e72,
};

// Paleta neón retro
const COLORS = {
  bg: 0x0a0e27,
  primary: 0xff006e,
  secondary: 0x8338ec,
  accent: 0x3a86ff,
  highlight: 0xffbe0b,
  text: 0xffffff,
};

// Paleta natural
const COLORS = {
  bg: 0x264653,
  primary: 0x2a9d8f,
  secondary: 0xe76f51,
  accent: 0xf4a261,
  text: 0xe9c46a,
};
```

## Botones bonitos

### Botón básico con hover

```javascript
class Button {
  constructor(scene, x, y, text, onClick) {
    this.scene = scene;

    // Contenedor para agrupar elementos
    this.container = scene.add.container(x, y);

    // Fondo del botón
    this.bg = scene.add.rectangle(0, 0, 200, 60, 0x667eea);
    this.bg.setStrokeStyle(3, 0x764ba2);

    // Texto del botón
    this.text = scene.add
      .text(0, 0, text, {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Agregar al contenedor
    this.container.add([this.bg, this.text]);

    // Hacer interactivo
    this.bg
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.onHover())
      .on("pointerout", () => this.onOut())
      .on("pointerdown", () => this.onDown())
      .on("pointerup", () => {
        this.onUp();
        onClick();
      });
  }

  onHover() {
    this.bg.setFillStyle(0x764ba2);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
    });
  }

  onOut() {
    this.bg.setFillStyle(0x667eea);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
    });
  }

  onDown() {
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
    });
  }

  onUp() {
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 50,
    });
  }
}

// Uso
const playButton = new Button(this, 400, 300, "PLAY", () => {
  this.scene.start("GameScene");
});
```

### Botones con efectos avanzados

```javascript
// Botón con borde brillante
createGlowButton(x, y, text) {
    const button = this.add.container(x, y);

    // Glow exterior (simulado con múltiples rectángulos)
    const glow = this.add.rectangle(0, 0, 210, 70, 0x667eea, 0.3);
    const bg = this.add.rectangle(0, 0, 200, 60, 0x667eea);
    const border = this.add.rectangle(0, 0, 200, 60);
    border.setStrokeStyle(2, 0xffffff, 0.8);

    const btnText = this.add.text(0, 0, text, {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([glow, bg, border, btnText]);

    // Animación de glow pulsante
    this.tweens.add({
        targets: glow,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });

    return button;
}

// Botón con gradiente simulado
createGradientButton(x, y, text) {
    const button = this.add.container(x, y);

    // Simular gradiente con múltiples rectángulos
    const layers = 5;
    for (let i = 0; i < layers; i++) {
        const alpha = 1 - (i / layers) * 0.5;
        const height = 60 - (i * 3);
        const layer = this.add.rectangle(0, -i * 1.5, 200, height, 0x667eea, alpha);
        button.add(layer);
    }

    const btnText = this.add.text(0, 0, text, {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add(btnText);
    return button;
}
```

## Barras de vida/progreso

### Barra de vida simple

```javascript
class HealthBar {
  constructor(scene, x, y, maxHealth) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;

    // Fondo (rojo oscuro)
    this.bgBar = scene.add.rectangle(x, y, 200, 20, 0x8b0000);
    this.bgBar.setOrigin(0, 0.5);

    // Barra de vida (verde)
    this.healthBar = scene.add.rectangle(x, y, 200, 20, 0x00ff00);
    this.healthBar.setOrigin(0, 0.5);

    // Borde
    this.border = scene.add.rectangle(x + 100, y, 200, 20);
    this.border.setStrokeStyle(2, 0xffffff);
    this.border.setOrigin(0.5);
  }

  setHealth(value) {
    this.currentHealth = Phaser.Math.Clamp(value, 0, this.maxHealth);
    const percentage = this.currentHealth / this.maxHealth;
    const newWidth = 200 * percentage;

    // Animar cambio de vida
    this.scene.tweens.add({
      targets: this.healthBar,
      width: newWidth,
      duration: 300,
      ease: "Power2",
    });

    // Cambiar color según vida restante
    if (percentage > 0.5) {
      this.healthBar.setFillStyle(0x00ff00); // Verde
    } else if (percentage > 0.25) {
      this.healthBar.setFillStyle(0xffff00); // Amarillo
    } else {
      this.healthBar.setFillStyle(0xff0000); // Rojo
    }
  }
}

// Uso
const hpBar = new HealthBar(this, 50, 30, 100);
hpBar.setHealth(75); // Vida al 75%
```

### Barra de progreso con texto

```javascript
class ProgressBar {
  constructor(scene, x, y, width, height) {
    this.scene = scene;
    this.width = width;

    this.container = scene.add.container(x, y);

    // Fondo
    const bg = scene.add.rectangle(0, 0, width, height, 0x333333);

    // Barra de progreso
    this.bar = scene.add.rectangle(-width / 2, 0, 0, height, 0x00ff88);
    this.bar.setOrigin(0, 0.5);

    // Borde
    const border = scene.add.rectangle(0, 0, width, height);
    border.setStrokeStyle(3, 0xffffff);

    // Texto de porcentaje
    this.text = scene.add
      .text(0, 0, "0%", {
        fontSize: "16px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.container.add([bg, this.bar, border, this.text]);
  }

  setProgress(value) {
    // value debe ser entre 0 y 1
    const newWidth = this.width * value;

    this.scene.tweens.add({
      targets: this.bar,
      width: newWidth,
      duration: 300,
    });

    this.text.setText(`${Math.round(value * 100)}%`);
  }
}
```

### Barra circular (vida/cooldown)

```javascript
class CircularBar {
  constructor(scene, x, y, radius) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;

    // Background circle
    this.bgCircle = scene.add.circle(x, y, radius, 0x333333, 0.5);

    // Progress arc (usando Graphics)
    this.progressGraphics = scene.add.graphics();
    this.setProgress(1);
  }

  setProgress(value) {
    // value: 0 a 1
    this.progressGraphics.clear();

    // Dibujar arco de progreso
    this.progressGraphics.lineStyle(8, 0x00ff88, 1);
    this.progressGraphics.beginPath();

    const startAngle = -Math.PI / 2; // Empezar arriba
    const endAngle = startAngle + Math.PI * 2 * value;

    this.progressGraphics.arc(
      this.x,
      this.y,
      this.radius,
      startAngle,
      endAngle,
      false,
    );

    this.progressGraphics.strokePath();
  }
}
```

## Paneles y ventanas

### Panel con título

```javascript
class Panel {
  constructor(scene, x, y, width, height, title) {
    this.container = scene.add.container(x, y);

    // Sombra (offset)
    const shadow = scene.add.rectangle(5, 5, width, height, 0x000000, 0.3);

    // Fondo del panel
    const bg = scene.add.rectangle(0, 0, width, height, 0x2c3e50);

    // Barra de título
    const titleBar = scene.add.rectangle(
      0,
      -height / 2 + 20,
      width,
      40,
      0x34495e,
    );

    // Texto del título
    const titleText = scene.add
      .text(0, -height / 2 + 20, title, {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Borde
    const border = scene.add.rectangle(0, 0, width, height);
    border.setStrokeStyle(2, 0x7f8c8d);

    this.container.add([shadow, bg, titleBar, titleText, border]);
  }

  addContent(content) {
    this.container.add(content);
  }
}

// Uso
const panel = new Panel(this, 400, 300, 400, 300, "INVENTORY");
const itemText = this.add
  .text(0, 0, "Gold: 100\nPotions: 5", {
    fontSize: "16px",
    color: "#fff",
  })
  .setOrigin(0.5);
panel.addContent(itemText);
```

### Modal con overlay

```javascript
createModal(title, message, onConfirm) {
    // Overlay oscuro
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    overlay.setInteractive();

    // Panel del modal
    const modalBg = this.add.rectangle(400, 300, 400, 250, 0x2c3e50);
    const border = this.add.rectangle(400, 300, 400, 250);
    border.setStrokeStyle(3, 0xecf0f1);

    // Título
    const titleText = this.add.text(400, 220, title, {
        fontSize: '24px',
        color: '#fff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mensaje
    const messageText = this.add.text(400, 280, message, {
        fontSize: '16px',
        color: '#bdc3c7',
        align: 'center',
        wordWrap: { width: 350 }
    }).setOrigin(0.5);

    // Botón OK
    const btnBg = this.add.rectangle(400, 360, 120, 40, 0x27ae60);
    const btnText = this.add.text(400, 360, 'OK', {
        fontSize: '18px',
        color: '#fff'
    }).setOrigin(0.5);

    btnBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => btnBg.setFillStyle(0x2ecc71))
        .on('pointerout', () => btnBg.setFillStyle(0x27ae60))
        .on('pointerdown', () => {
            overlay.destroy();
            modalBg.destroy();
            border.destroy();
            titleText.destroy();
            messageText.destroy();
            btnBg.destroy();
            btnText.destroy();
            if (onConfirm) onConfirm();
        });
}
```

## HUD (Heads-Up Display)

### HUD completo de juego

```javascript
class GameHUD {
  constructor(scene) {
    this.scene = scene;

    // Panel superior (fondo semi-transparente)
    this.topBar = scene.add.rectangle(400, 30, 800, 60, 0x000000, 0.5);

    // Score
    this.scoreText = scene.add
      .text(50, 30, "SCORE: 0", {
        fontSize: "24px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    // Lives (corazones)
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      const heart = scene.add
        .text(700 + i * 30, 30, "♥", {
          fontSize: "28px",
          color: "#ff0000",
        })
        .setOrigin(0.5);
      this.hearts.push(heart);
    }

    // Timer
    this.timerText = scene.add
      .text(400, 30, "0:00", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.startTime = scene.time.now;
  }

  updateScore(score) {
    this.scoreText.setText(`SCORE: ${score}`);

    // Efecto de bounce en el texto
    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
    });
  }

  updateLives(lives) {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setAlpha(i < lives ? 1 : 0.2);
    }
  }

  updateTimer() {
    const elapsed = this.scene.time.now - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    this.timerText.setText(
      `${minutes}:${displaySeconds.toString().padStart(2, "0")}`,
    );
  }
}
```

## Texto estilizado

### Texto con sombra

```javascript
createTextWithShadow(x, y, text, fontSize) {
    // Sombra
    const shadow = this.add.text(x + 3, y + 3, text, {
        fontSize: fontSize,
        color: '#000000',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    shadow.setAlpha(0.5);

    // Texto principal
    const mainText = this.add.text(x, y, text, {
        fontSize: fontSize,
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    return { shadow, text: mainText };
}
```

### Texto con borde

```javascript
const text = this.add
  .text(400, 300, "GAME OVER", {
    fontSize: "72px",
    color: "#ffffff",
    fontStyle: "bold",
    stroke: "#000000",
    strokeThickness: 8,
  })
  .setOrigin(0.5);
```

### Texto animado (typewriter)

```javascript
typewriterText(x, y, fullText, speed = 50) {
    const text = this.add.text(x, y, '', {
        fontSize: '20px',
        color: '#fff'
    });

    let index = 0;

    const timer = this.time.addEvent({
        delay: speed,
        callback: () => {
            text.text += fullText[index];
            index++;
            if (index === fullText.length) {
                timer.remove();
            }
        },
        repeat: fullText.length - 1
    });

    return text;
}
```

## Efectos visuales

### Partículas simples (sin emitter)

```javascript
createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        const particle = this.add.circle(x, y, 3, 0xffa500);

        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 100;

        this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: 0,
            duration: 1000,
            onComplete: () => particle.destroy()
        });
    }
}
```

### Screen shake

```javascript
shakeScreen(duration = 300, intensity = 0.01) {
    this.cameras.main.shake(duration, intensity);
}
```

### Flash effect

```javascript
flashScreen(color = 0xffffff, duration = 200) {
    const flash = this.add.rectangle(400, 300, 800, 600, color, 0.7);

    this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: duration,
        onComplete: () => flash.destroy()
    });
}
```

### Fade transition

```javascript
fadeOut(callback) {
    const fade = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
    fade.setDepth(1000);

    this.tweens.add({
        targets: fade,
        alpha: 1,
        duration: 1000,
        onComplete: () => {
            if (callback) callback();
        }
    });
}
```

## Menú completo

```javascript
class MenuScene extends Phaser.Scene {
  create() {
    // Fondo degradado (simulado con múltiples rectángulos)
    for (let i = 0; i < 10; i++) {
      const alpha = 0.8 - i * 0.08;
      this.add.rectangle(400, 60 * i, 800, 60, 0x1a1a2e, alpha);
    }

    // Título con efecto
    const title = this.add
      .text(400, 150, "MY AWESOME GAME", {
        fontSize: "64px",
        color: "#fff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Animación de título
    this.tweens.add({
      targets: title,
      y: 140,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Botones
    const playBtn = new Button(this, 400, 300, "PLAY", () => {
      this.scene.start("GameScene");
    });

    const optionsBtn = new Button(this, 400, 380, "OPTIONS", () => {
      console.log("Options");
    });

    const quitBtn = new Button(this, 400, 460, "QUIT", () => {
      console.log("Quit game");
    });

    // Footer
    this.add
      .text(400, 560, "© 2025 - Made with Phaser 3", {
        fontSize: "14px",
        color: "#888",
      })
      .setOrigin(0.5);
  }
}
```

## Tips de diseño

1. **Jerarquía visual:** Usa tamaños de texto y colores para establecer importancia
2. **Consistencia:** Mantén el mismo estilo de botones/paneles en todo el juego
3. **Contraste:** Asegura que el texto sea legible sobre fondos
4. **Feedback:** Todos los elementos interactivos deben responder al hover/click
5. **Animaciones sutiles:** Usa tweens para transiciones suaves (100-300ms)
6. **Espaciado:** Deja espacio entre elementos (padding/margin)
7. **Paleta limitada:** Usa máximo 4-5 colores principales
8. **Profundidad:** Simula sombras con rectángulos offset semi-transparentes
