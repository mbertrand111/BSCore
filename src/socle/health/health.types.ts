export type HealthStatus = 'ok' | 'degraded'

export type HealthCheck = {
  readonly name: string
  readonly status: HealthStatus
  readonly message?: string
}

export type HealthReport = {
  readonly status: HealthStatus
  readonly timestamp: string  // ISO 8601
  readonly service: string
  readonly checks: readonly HealthCheck[]
}
