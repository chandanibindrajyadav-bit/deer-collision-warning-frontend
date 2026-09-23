export interface ApiError {
  detail: string
  code?: string
  requestId?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
