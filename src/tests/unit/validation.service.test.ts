import { validationService } from '@/modules/validation/validation.service'

const schema = {
  type: 'object',
  required: ['name', 'email', 'age'],
  additionalProperties: false,
  properties: {
    name:  { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    age:   { type: 'integer', minimum: 18 },
    note:  { type: 'string' },
  },
}

describe('validationService', () => {
  it('accepts a valid payload', () => {
    const result = validationService.validate(schema, {
      name: 'Alice',
      email: 'alice@example.com',
      age: 25,
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a payload missing required fields', () => {
    const result = validationService.validate(schema, { name: 'Alice' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'email' || e.message.includes('email'))).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = validationService.validate(schema, {
      name: 'Alice',
      email: 'not-an-email',
      age: 25,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'email')).toBe(true)
  })

  it('rejects age below minimum', () => {
    const result = validationService.validate(schema, {
      name: 'Alice',
      email: 'alice@example.com',
      age: 16,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'age')).toBe(true)
  })

  it('rejects additional properties when not allowed', () => {
    const result = validationService.validate(schema, {
      name: 'Alice',
      email: 'alice@example.com',
      age: 25,
      hackerField: 'injected',
    })
    expect(result.valid).toBe(false)
  })

  it('returns all errors at once (allErrors mode)', () => {
    const result = validationService.validate(schema, {})
    expect(result.errors.length).toBeGreaterThan(1)
  })
})
