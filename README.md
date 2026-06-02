# 🍄 Mario Bros - El Regreso del Fontanero

<div align="center">

[![Phaser](https://img.shields.io/badge/Phaser-3.90-9C27B0?style=for-the-badge&logo=html5)](https://phaser.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

**¡Una aventura arcade donde la plataforma es tu única esperanza y los enemigos son implacables!**

*[Aquí irán tus screenshots épicas]*

</div>

---

## 🎮 Sobre el Juego

**Mario Bros** es una reinterpretación moderna del clásico juego de plataformas, desarrollada con **Phaser 3** y **TypeScript**. En este frenético juego arcade, controlas a un intrépido personaje rojo que debe sobrevivir el mayor tiempo posible mientras recolecta monedas, esquiva (¡o elimina!) enemigos y salta entre plataformas que desaparecen misteriosamente.

### ⚡ Características Principales

- 🏃 **Movimiento Fluido**: Controles precisos con doble salto
- 🪙 **Sistema de Monedas**: Recolecta monedas doradas para aumentar tu puntuación
- ⚔️ **Tres Tipos de Enemigos**: Cada uno con IA única y comportamiento diferente
- 🎁 **Power-ups**: Invencibilidad, Super Salto y Super Velocidad
- 🎨 **Visuales Distintivos**: Cada objeto tiene su propio diseño único
- 📊 **High Scores**: Guarda tus mejores puntuaciones en localStorage
- 🔄 **Generación Infinita**: Plataformas y enemigos que nunca dejan de aparecer

---

## 🕹️ Cómo Jugar

### Controles

| Tecla | Acción |
|-------|--------|
| `←` `→` | Moverse izquierda/derecha |
| `↑` | Saltar (¡doble salto disponible!) |

### 🎯 Objetivo

- **Sobrevive** el mayor tiempo posible
- **Recolecta monedas** ($) para puntos extra
- **Elimina enemigos** saltando sobre ellos
- **Evita caer** al vacío
- **Aprovecha los power-ups** para ventajas temporales

### 👾 Enemigos

| Enemigo | Forma | Comportamiento |
|---------|-------|----------------|
| **Chaser** 🔷 | Rombo púrpura | Te persigue implacablemente |
| **Patrol** ⬠ | Pentágono naranja | Patrulla áreas específicas |
| **Flying** ⬡ | Hexágono cyan | Vuela hacia ti desde cualquier ángulo |

### 💎 Power-ups

| Power-up | Símbolo | Efecto | Duración |
|----------|---------|--------|----------|
| ⭐ **Invencible** | Estrella | Elimina enemigos al tocarlos | 5s |
| ↑ **Super Salto** | Triángulo rosa | Saltos más altos y potentes | 5s |
| ⚡ **Super Velocidad** | Rayo | Movimiento ultrarrápido | 5s |

---

## 🚀 Cómo Ejecutar

### Requisitos

- Node.js 18+
- pnpm (recomendado) o npm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/beresiartejuan/mario-bros.git

# Entrar al directorio
cd mario-bros

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

### Construcción para Producción

```bash
pnpm build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

---

## 🏗️ Arquitectura del Proyecto

```
mario-bros/
├── src/
│   ├── main.ts          # Lógica principal del juego
│   ├── style.css        # Estilos
│   └── counter.ts       # Utilidades
├── dist/                # Archivos construidos
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Sistemas Implementados

- **Object Pooling**: Reutilización eficiente de objetos para mejor rendimiento
- **Sistema de Partículas**: Efectos visuales al recolectar monedas y eliminar enemigos
- **IA de Enemigos**: Tres comportamientos distintos con pathfinding
- **Sistema de Eventos**: Timers para spawn de objetos y power-ups
- **Persistencia**: localStorage para high scores y estadísticas

---

## 🎨 Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| 🟥 Rojo | `#FF0000` | Jugador |
| 🟨 Dorado | `#FFD700` | Monedas |
| 🟪 Púrpura | `#800080` | Enemigo base |
| 🟧 Naranja | `#FF4500` | Enemigo patrulla |
| 🟦 Cyan | `#00CED1` | Enemigo volador |
| 🟫 Marrón | `#8B4513` | Plataformas |
| 🟩 Verde | `#228B22` | Suelo |

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. ¡Siéntete libre de usarlo y modificarlo!

---

<div align="center">

**⭐ Si te gustó el proyecto, ¡dale una estrella! ⭐**

*Desarrollado con ❤️ y mucha ☕*

</div>

---

## 📝 Roadmap

- [ ] Añadir más tipos de enemigos
- [ ] Implementar niveles con dificultad progresiva
- [ ] Sistema de logros/achievements
- [ ] Modo multijugador local
- [ ] Más power-ups y efectos
- [ ] Banda sonora y efectos de sonido
- [ ] Mobile-friendly (controles táctiles)

---

## 🐛 Bugs Conocidos

*Ninguno actualmente* ✅

Si encuentras algún bug, por favor abre un [issue](https://github.com/beresiartejuan/mario-bros/issues).

---

<div align="center">

**⭐ Si te gustó el proyecto, ¡dale una estrella! ⭐**

*Desarrollado con ❤️ y mucha ☕*

</div>

---

<div align="center">

**¡Gracias por jugar!** 🎮

*Proyecto completado y listo para disfrutar* ✨

</div>
