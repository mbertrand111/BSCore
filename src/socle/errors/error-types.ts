import { AppError, type ErrorMeta } from './app-error'
import { ERROR_CODES } from './error-codes'

export class ValidationError extends AppError {
  constructor(message: string, meta?: ErrorMeta) {
    super(message, ERROR_CODES.VALIDATION_ERROR, meta)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, meta?: ErrorMeta) {
    super(message, ERROR_CODES.NOT_FOUND, meta)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, meta?: ErrorMeta) {
    super(message, ERROR_CODES.UNAUTHORIZED, meta)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, meta?: ErrorMeta) {
    super(message, ERROR_CODES.FORBIDDEN, meta)
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred', meta?: ErrorMeta) {
    super(message, ERROR_CODES.INTERNAL_ERROR, meta)
  }
}
