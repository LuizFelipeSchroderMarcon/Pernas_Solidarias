/**
 * Shirt sizes extracted and unified from official Corrida Inclusão sheets.
 * Includes infant sizes (4-16), adult standards (PP-XG), and special cuts (Baby Look, Unissex).
 */
export const SHIRT_SIZES = [
  '4',
  '6',
  '8',
  '10',
  '12',
  '14',
  '16',
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'Baby Look M',
  'Baby Look G',
  'P - Unissex',
] as const;

export type ShirtSize = (typeof SHIRT_SIZES)[number];

export const SHIRT_SIZE_OPTIONS = SHIRT_SIZES.map((size) => ({
  value: size,
  label: size,
}));
