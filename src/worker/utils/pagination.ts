/**
 * Pagination Utilities
 * 分页工具函数
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const total_pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1
  };
}

/**
 * Get SQL LIMIT and OFFSET
 */
export function getPaginationSQL(page: number, limit: number): {
  limit: number;
  offset: number;
} {
  return {
    limit,
    offset: (page - 1) * limit
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResult<T> {
  return {
    items,
    pagination: calculatePagination(page, limit, total)
  };
}
