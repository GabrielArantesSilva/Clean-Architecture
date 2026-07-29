export type ValidatorKeyword =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'format'
  | 'custom'

export type SchemaFragment = {
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
}

export type Validator = {
  keyword: ValidatorKeyword
  message: string
  fragment?: SchemaFragment
  required?: boolean
  predicate?: (value: unknown) => boolean
}

export type Control<V> = {
  value: V
  validators: Validator[]
}

export type ControlsMap = Record<string, Control<unknown>>

export type FormValues<C extends ControlsMap> = {
  [K in keyof C]: C[K] extends Control<infer V> ? V : never
}

export type FormErrors<C extends ControlsMap> = Partial<Record<keyof C, string>>
