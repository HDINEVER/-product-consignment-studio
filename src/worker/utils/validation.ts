/**
 * Data Validation Utilities
 * 数据验证工具函数
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
  }
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password validation
 * At least 6 characters
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Phone validation (Chinese format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate user registration data
 */
export function validateRegistration(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (!isValidPassword(data.password)) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone format' });
  }

  return errors;
}

/**
 * Validate product data
 */
export function validateProduct(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required' });
  }

  if (!data.slug || data.slug.trim().length === 0) {
    errors.push({ field: 'slug', message: 'Product slug is required' });
  }

  if (data.category_id && typeof data.category_id !== 'number') {
    errors.push({ field: 'category_id', message: 'Invalid category_id' });
  }

  return errors;
}

/**
 * Validate SKU data
 */
export function validateSKU(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.sku_code || data.sku_code.trim().length === 0) {
    errors.push({ field: 'sku_code', message: 'SKU code is required' });
  }

  if (!data.variant_name || data.variant_name.trim().length === 0) {
    errors.push({ field: 'variant_name', message: 'Variant name is required' });
  }

  if (!data.price || typeof data.price !== 'number' || data.price < 0) {
    errors.push({ field: 'price', message: 'Valid price is required' });
  }

  if (data.stock_quantity !== undefined && (typeof data.stock_quantity !== 'number' || data.stock_quantity < 0)) {
    errors.push({ field: 'stock_quantity', message: 'Invalid stock quantity' });
  }

  return errors;
}

/**
 * Validate order creation data
 */
export function validateOrderCreation(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push({ field: 'items', message: 'Order items are required' });
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item.sku_id || typeof item.sku_id !== 'number') {
        errors.push({ field: `items[${index}].sku_id`, message: 'Invalid SKU ID' });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: 'Invalid quantity' });
      }
    });
  }

  if (!data.customer_name || data.customer_name.trim().length === 0) {
    errors.push({ field: 'customer_name', message: 'Customer name is required' });
  }

  if (!data.customer_email || !isValidEmail(data.customer_email)) {
    errors.push({ field: 'customer_email', message: 'Valid email is required' });
  }

  if (data.customer_phone && !isValidPhone(data.customer_phone)) {
    errors.push({ field: 'customer_phone', message: 'Invalid phone format' });
  }

  return errors;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Generate slug from string
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate and parse pagination params
 */
export function validatePagination(params: URLSearchParams): {
  page: number;
  limit: number;
} {
  let page = parseInt(params.get('page') || '1');
  let limit = parseInt(params.get('limit') || '20');

  // Constraints
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(100, limit)); // Max 100 per page

  return { page, limit };
}
