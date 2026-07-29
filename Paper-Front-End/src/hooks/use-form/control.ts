import type { Control, Validator } from './types'

export function control<V>(value: V, validators: Validator[] = []): Control<V> {
  return { value, validators }
}
