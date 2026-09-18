/**
 * Game identity, kept separate from any one life path.
 *
 * The game is "Meritocracy". "Ten Digits" is the first path inside it -- one
 * authored life, replayable with a different opening roll every time. Keeping
 * these apart matters as soon as there is a second path.
 */
export const GAME = {
  title: 'Meritocracy',
  tagline: 'A game about the part you did not do',
} as const
