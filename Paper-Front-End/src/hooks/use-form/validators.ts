import type { Validator } from './types'

const required = (message = 'Campo obrigatório.'): Validator => {
  return { keyword: 'required', required: true, fragment: { minLength: 1 }, message }
}

const email = (message = 'Informe um e-mail válido.'): Validator => {
  return { keyword: 'format', fragment: { format: 'email' }, message }
}

const minLength = (length: number, message = `Deve ter no mínimo ${length} caracteres.`): Validator => {
  return { keyword: 'minLength', fragment: { minLength: length }, message }
}

const maxLength = (length: number, message = `Deve ter no máximo ${length} caracteres.`): Validator => {
  return { keyword: 'maxLength', fragment: { maxLength: length }, message }
}

const pattern = (expression: RegExp, message: string): Validator => {
  return { keyword: 'pattern', fragment: { pattern: expression.source }, message }
}

const custom = (predicate: (value: unknown) => boolean, message: string): Validator => {
  return { keyword: 'custom', predicate, message }
}

export const Validators = { required, email, minLength, maxLength, pattern, custom }
