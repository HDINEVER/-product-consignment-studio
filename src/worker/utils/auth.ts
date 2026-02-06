/**
 * JWT Authentication Utilities
 * JWT认证工具函数
 */

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token
 */
export async function generateToken(
  userId: number,
  email: string,
  role: string,
  secret: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    userId,
    email,
    role,
    iat: now,
    exp: now + expiresIn
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = await sign(
      `${encodedHeader}.${encodedPayload}`,
      secret
    );
    
    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Hash password using bcrypt-like algorithm
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Authentication middleware
 */
export async function authenticate(
  request: Request,
  secret: string
): Promise<{ user: JWTPayload; error?: never } | { user?: never; error: string }> {
  const token = extractToken(request);
  
  if (!token) {
    return { error: 'No token provided' };
  }

  const payload = await verifyToken(token, secret);
  
  if (!payload) {
    return { error: 'Invalid or expired token' };
  }

  return { user: payload };
}

/**
 * Role-based authorization
 */
export function authorize(
  user: JWTPayload,
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(user.role);
}

// ===================================================================
// Helper Functions
// ===================================================================

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  const signatureArray = Array.from(new Uint8Array(signature));
  return base64UrlEncode(
    String.fromCharCode.apply(null, signatureArray as any)
  );
}
