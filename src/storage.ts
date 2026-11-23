// Persistencia en localStorage. Se mantienen las claves originales para no
// perder los récords guardados por versiones anteriores del juego.
export const STORAGE_KEYS = {
	HIGH_SCORE: 'mario_high_score',
	GAMES_PLAYED: 'mario_games_played',
	TOTAL_COINS: 'mario_total_coins',
	BEST_TIME: 'mario_best_time',
	MUTED: 'mario_muted',
} as const

export interface Stats {
	highScore: number
	bestTime: number
	gamesPlayed: number
	totalCoins: number
}

export interface GameResult {
	score: number
	time: number
	coins: number
}

function readNumber(key: string): number {
	try {
		const raw = localStorage.getItem(key)
		const value = raw ? Number.parseInt(raw, 10) : 0
		return Number.isFinite(value) ? value : 0
	} catch {
		return 0
	}
}

function write(key: string, value: string | number) {
	try {
		localStorage.setItem(key, String(value))
	} catch {
		// localStorage no disponible (modo privado, cuota llena...): se ignora
	}
}

export function loadStats(): Stats {
	return {
		highScore: readNumber(STORAGE_KEYS.HIGH_SCORE),
		bestTime: readNumber(STORAGE_KEYS.BEST_TIME),
		gamesPlayed: readNumber(STORAGE_KEYS.GAMES_PLAYED),
		totalCoins: readNumber(STORAGE_KEYS.TOTAL_COINS),
	}
}

/**
 * Guarda el resultado de una partida y devuelve las estadísticas que había
 * ANTES de guardarla (para poder detectar si hubo un nuevo récord).
 */
export function recordGame(result: GameResult): Stats {
	const previous = loadStats()
	write(STORAGE_KEYS.HIGH_SCORE, Math.max(previous.highScore, result.score))
	write(STORAGE_KEYS.BEST_TIME, Math.max(previous.bestTime, result.time))
	write(STORAGE_KEYS.GAMES_PLAYED, previous.gamesPlayed + 1)
	write(STORAGE_KEYS.TOTAL_COINS, previous.totalCoins + result.coins)
	return previous
}

export function loadMuted(): boolean {
	return readNumber(STORAGE_KEYS.MUTED) === 1
}

export function saveMuted(muted: boolean) {
	write(STORAGE_KEYS.MUTED, muted ? 1 : 0)
}
