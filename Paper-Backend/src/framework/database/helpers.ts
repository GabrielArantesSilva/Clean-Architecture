import { customAlphabet } from 'nanoid'

// Gerador de id curto (mesmo do tecnoflow): alfabeto alfanumérico de 62
// caracteres, 11 posições — URL-safe, sem hífen/underscore no corpo (o
// underscore separa o prefixo da entidade, ex.: usr_a1B2c3D4e5F).
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const SIZE = 11

export const generateRandomId = customAlphabet(ALPHABET, SIZE)
