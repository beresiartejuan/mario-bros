import type Phaser from 'phaser'

// Dimensiones del mundo
export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600
export const GROUND_HEIGHT = 40
export const GROUND_Y = GAME_HEIGHT - GROUND_HEIGHT / 2 // centro del suelo
export const GROUND_TOP = GAME_HEIGHT - GROUND_HEIGHT // borde superior del suelo

export const FONT_FAMILY =
	'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

// Colores del juego
export const COLORS = {
	player: 0xff0000, // Rojo para el jugador
	playerOutline: 0x8b0000,
	platform: 0x8b4513, // Marrón para plataformas
	platformMoving: 0xa0522d, // Marrón más claro para plataformas móviles
	platformBreakable: 0x696969, // Gris para plataformas quebradizas
	platformCracked: 0xd8d8d8, // Destello cuando se está rompiendo
	enemy: 0x800080, // Púrpura para enemigos
	enemyPatrol: 0xff4500, // Naranja rojizo para enemigos patrulla
	enemyFlying: 0x00ced1, // Cyan oscuro para enemigos voladores
	ground: 0x228b22, // Verde para el suelo
	groundTop: 0x2fbf4f, // Franja de césped
	coin: 0xffd700, // Oro para monedas
	powerupInvincible: 0x00ffff, // Cyan para invencibilidad
	powerupJump: 0xff69b4, // Rosa para salto mejorado
	powerupSpeed: 0xffa500, // Naranja para velocidad
	particleJump: 0xffffff, // Blanco para partículas de salto
	dust: 0xf4ecd8, // Polvo al aterrizar
}

export function textStyle(
	size: number,
	color = '#ffffff',
	strokeThickness = 4
): Phaser.Types.GameObjects.Text.TextStyle {
	return {
		fontFamily: FONT_FAMILY,
		fontSize: `${size}px`,
		color,
		fontStyle: 'bold',
		stroke: '#000000',
		strokeThickness,
	}
}
