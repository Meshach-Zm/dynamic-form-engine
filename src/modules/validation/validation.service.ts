import { ajv } from '@/lib/ajv'

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}

export const validationService = {
  validate(schema: object, payload: unknown): ValidationResult {
    const validate = ajv.compile(schema)
    const valid = validate(payload)
    if (valid) return { valid: true, errors: [] }

    const errors = (validate.errors ?? []).map((err) => ({
      field: err.instancePath?.replace(/^\//, '') || (err.params as any)?.missingProperty || 'unknown',
      message: err.message ?? 'Invalid value',
    }))

    return { valid: false, errors }
  },
}
