// ─────────────────────────────────────────────────────────────────────────────
// FILE: types/form.ts
//
// One canonical type file. The API returns FormTemplate with versions[]
// (not latestVersion / status / submissionCount) per Journey 1.
// lib/dashboard.ts derives stats from that shape. lib/api.ts (getForms) is
// fixed below to match. The richer per-form detail shape (with latestVersion)
// is used only on the detail/fill/submissions pages where GET /api/forms/:id
// is called — that endpoint returns both.
// ─────────────────────────────────────────────────────────────────────────────

export interface FormVersion {
    id: string
    versionNumber: number
    createdAt: string
}

// Returned by GET /api/forms (list endpoint — Journey 1)
export interface FormTemplate {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    versions: FormVersion[]
}

// Returned by GET /api/forms/:id (detail endpoint — Journey 2)
// latestVersion includes schema so FormRenderer / fill page can use it.
export interface FormVersionDetail extends FormVersion {
    schema: JsonSchema
    isLatest: boolean
}

export interface FormTemplateDetail {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    latestVersion: FormVersionDetail | null
    versions: Pick<FormVersion, 'id' | 'versionNumber'>[]
}

// ── Dashboard helpers ──────────────────────────────────────────────────────

export interface DashboardStats {
    totalForms: number
    totalSubmissions: number   // 0 until API includes _count; see note in getForms
    latestVersion: number
}

export interface ActivityItem {
    id: string
    type: 'submission' | 'version_published' | 'form_created'
    formName: string
    versionNumber: number
    timestamp: string
}

// ── Form renderer ──────────────────────────────────────────────────────────

export interface FieldSchema {
    type?: 'string' | 'number' | 'integer' | 'boolean'
    description?: string
    minLength?: number
    maxLength?: number
    minimum?: number
    maximum?: number
    format?: string
    enum?: string[]
}

export interface JsonSchema {
    type?: string
    required?: string[]
    properties: Record<string, FieldSchema>
}

export interface ValidationError {
    field: string
    message: string
}

// ── Shared API envelope ────────────────────────────────────────────────────

export interface ApiError {
    error: string
    details?: unknown
}

export interface ApiSuccess<T> {
    data: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError