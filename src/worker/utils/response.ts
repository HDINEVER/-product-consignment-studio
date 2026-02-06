/**
 * API Response Utilities
 * API响应工具函数
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Success response
 */
export function successResponse<T>(
  data: T,
  meta?: any,
  status: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta })
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

/**
 * Error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

/**
 * Validation error response
 */
export function validationErrorResponse(errors: any[]): Response {
  return errorResponse(
    'VALIDATION_ERROR',
    'Validation failed',
    errors,
    400
  );
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string = 'Resource'): Response {
  return errorResponse(
    'NOT_FOUND',
    `${resource} not found`,
    undefined,
    404
  );
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return errorResponse(
    'UNAUTHORIZED',
    message,
    undefined,
    401
  );
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): Response {
  return errorResponse(
    'FORBIDDEN',
    message,
    undefined,
    403
  );
}

/**
 * Server error response
 */
export function serverErrorResponse(message: string = 'Internal server error'): Response {
  return errorResponse(
    'SERVER_ERROR',
    message,
    undefined,
    500
  );
}

/**
 * CORS preflight response
 */
export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}
