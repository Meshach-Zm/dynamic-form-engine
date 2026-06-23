// Shared TypeScript types used across modules.
// Keep domain types here; Prisma-generated types live in @prisma/client.

export interface ApiError {
  error: string
  details?: unknown
}

export interface ApiSuccess<T> {
  data: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
