import Ajv from 'ajv'
import addFormats from 'ajv-formats'

// Single shared AJV instance — compiling schemas is expensive.
// AJV handles DYNAMIC validation (submission payload vs stored JSON Schema).
// Zod handles STATIC validation (API request body structure).
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export { ajv }
