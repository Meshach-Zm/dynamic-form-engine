// Dynamic AJV-based validation — the core engine capability.
// The schema comes from the database; no field rules are hardcoded here.
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
      field: err.instancePath?.replace(/^\//, '') || err.params?.missingProperty || 'unknown',
      message: err.message ?? 'Invalid value',
    }))

    return { valid: false, errors }
  },
}
