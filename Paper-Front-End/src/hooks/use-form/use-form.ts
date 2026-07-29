'use client'

import { useCallback, useState, type ChangeEvent, type SubmitEvent } from 'react'

import { Type } from 'typebox'
import { Compile } from 'typebox/schema'

import type { ControlsMap, FormErrors, FormValues, Validator } from './types'

type CompiledValidator = {
  message: string
  isValid: (value: unknown) => boolean
}

type CompiledField = {
  required: boolean
  checks: CompiledValidator[]
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function compileValidator(validator: Validator): CompiledValidator {
  if (validator.required) {
    return { message: validator.message, isValid: (value) => !isEmpty(value) }
  }
  if (validator.predicate) {
    const { predicate } = validator
    return { message: validator.message, isValid: (value) => predicate(value) === true }
  }
  const check = Compile(Type.String(validator.fragment ?? {}))
  return { message: validator.message, isValid: (value) => check.Check(value) }
}

function resolveFieldError(field: CompiledField, value: unknown): string | undefined {
  if (!field.required && isEmpty(value)) return undefined
  for (const check of field.checks) {
    if (!check.isValid(value)) return check.message
  }
  return undefined
}

export function useForm<C extends ControlsMap>(controls: C) {
  type Values = FormValues<C>
  type Errors = FormErrors<C>
  type Field = keyof C

  // `controls` é capturado uma única vez, na montagem, pelo inicializador lazy
  // do useState. Evitamos useRef + leitura no render porque o React Compiler
  // proíbe ler refs durante o render — e a intenção aqui é exatamente um
  // snapshot imutável das controls iniciais (deriva uma vez e nunca recalcula).
  const [initialValues] = useState<Values>(() => {
    const values = {} as Values
    for (const [key, field] of Object.entries(controls)) {
      values[key as Field] = field.value as Values[Field]
    }
    return values
  })

  const [compiled] = useState<Record<Field, CompiledField>>(() => {
    const fields = {} as Record<Field, CompiledField>
    for (const [key, field] of Object.entries(controls)) {
      fields[key as Field] = {
        required: field.validators.some((validator) => validator.required),
        checks: field.validators.map(compileValidator),
      }
    }
    return fields
  })

  const [values, setValues] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Errors>({})

  const clearError = useCallback((field: Field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target
      setValues((prev) => ({ ...prev, [name]: value }) as Values)
      clearError(name as Field)
    },
    [clearError]
  )

  const setFieldValue = useCallback(
    <K extends Field>(field: K, value: Values[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError]
  )

  const validate = useCallback((): boolean => {
    const next = {} as Errors
    let valid = true
    for (const [key, field] of Object.entries(compiled) as [Field, CompiledField][]) {
      const message = resolveFieldError(field, values[key])
      if (message) {
        next[key] = message
        valid = false
      }
    }
    setErrors(next)
    return valid
  }, [compiled, values])

  const handleSubmit = useCallback(
    (onValid: (values: Values) => void | Promise<void>) =>
      async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (validate()) {
          await onValid(values)
        }
      },
    [validate, values]
  )

  const reset = useCallback((nextValues?: Values) => {
    setValues(nextValues ?? initialValues)
    setErrors({})
  }, [initialValues])

  return {
    values,
    errors,
    setValues,
    setFieldValue,
    handleChange,
    handleSubmit,
    validate,
    reset
  }
}
