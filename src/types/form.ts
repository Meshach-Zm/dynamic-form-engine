export type FormStatus = 'live' | 'draft'

export interface FormVersion {
    id: string
    versionNumber: number
    isLatest: boolean
    createdAt: string
}

export interface FormTemplate {
    id: string
    name: string
    status: FormStatus
    latestVersion: FormVersion | null
    submissionCount: number
    createdAt: string
    updatedAt: string
}

export interface DashboardStats {
    activeForms: number
    totalSubmissions: number
    latestVersion: number
}

export interface ActivityItem {
    id: string
    type: 'submission' | 'version_published' | 'form_created'
    formName: string
    versionNumber?: number
    isDraft: boolean
    timestamp: string
}

/* Form renderer */

export interface FieldSchema {
    type: string
    description?: string
    minLength?: number
    maxLength?: number
    minimum?: number
    maximum?: number
    format?: string
    enum?: string[]
}

export interface JsonSchema {
    type: string
    required?: string[]
    properties: Record<string, FieldSchema>
}

export interface ValidationError {
    field: string
    message: string
}