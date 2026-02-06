/**
 * Enhanced Cloudflare Worker API
 * 完整电商系统后端API - 基于BeikeShop架构
 */

import { authenticate, authorize, hashPassword, verifyPassword, generateToken } from './utils/auth';
import { validateRegistration, validateProduct, validateSKU, validateOrderCreation, generateSlug, validatePagination } from './utils/validation';
import { createPaginatedResponse, getPaginationSQL } from './utils/pagination';
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse, corsResponse } from './utils/response';

export interface Env {
  DB: any; // D1Database type
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ========================================
      // Health Check
      // ========================================
      if (path === '/api/health') {
        return successResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // ========================================
      // Authentication Routes
      // ========================================
      if (path === '/api/auth/register' && method === 'POST') {
        return await handleRegister(request, env);
      }

      if (path === '/api/auth/login' && method === 'POST') {
        return await handleLogin(request, env);
      }

      if (path === '/api/auth/me' && method === 'GET') {
        return await handleGetCurrentUser(request, env);
      }

      // ========================================
      // Product Routes
      // ========================================
      if (path === '/api/products' && method === 'GET') {
        return await handleGetProducts(request, env);
      }

      if (path === '/api/products' && method === 'POST') {
        return await handleCreateProduct(request, env);
      }

      if (path.match(/^\/api\/products\/\d+$/) && method === 'GET') {
        const id = parseInt(path.split('/').pop()!);
        return await handleGetProduct(env, id);
      }

      if (path.match(/^\/api\/products\/\d+$/) && method === 'PUT') {
        const id = parseInt(path.split('/').pop()!);
        return await handleUpdateProduct(request, env, id);
      }

      if (path.match(/^\/api\/products\/\d+$/) && method === 'DELETE') {
        const id = parseInt(path.split('/').pop()!);
        return await handleDeleteProduct(request, env, id);
      }

      // ========================================
      // Cart Routes
      // ========================================
      if (path === '/api/cart' && method === 'GET') {
        return await handleGetCart(request, env);
      }

      if (path === '/api/cart/items' && method === 'POST') {
        return await handleAddToCart(request, env);
      }

      if (path.match(/^\/api\/cart\/items\/\d+$/) && method === 'PUT') {
        const id = parseInt(path.split('/').pop()!);
        return await handleUpdateCartItem(request, env, id);
      }

      if (path.match(/^\/api\/cart\/items\/\d+$/) && method === 'DELETE') {
        const id = parseInt(path.split('/').pop()!);
        return await handleRemoveCartItem(request, env, id);
      }

      if (path === '/api/cart' && method === 'DELETE') {
        return await handleClearCart(request, env);
      }

      // ========================================
      // Order Routes
      // ========================================
      if (path === '/api/orders' && method === 'POST') {
        return await handleCreateOrder(request, env);
      }

      if (path === '/api/orders' && method === 'GET') {
        return await handleGetOrders(request, env);
      }

      if (path.match(/^\/api\/orders\/\d+$/) && method === 'GET') {
        const id = parseInt(path.split('/').pop()!);
        return await handleGetOrder(request, env, id);
      }

      if (path.match(/^\/api\/orders\/\d+\/cancel$/) && method === 'PUT') {
        const id = parseInt(path.split('/').pop()!);
        return await handleCancelOrder(request, env, id);
      }

      // ========================================
      // Admin Routes
      // ========================================
      if (path === '/api/admin/dashboard' && method === 'GET') {
        return await handleAdminDashboard(request, env);
      }

      if (path === '/api/admin/orders' && method === 'GET') {
        return await handleAdminGetOrders(request, env);
      }

      if (path.match(/^\/api\/admin\/orders\/\d+\/status$/) && method === 'PUT') {
        const id = parseInt(path.split('/').pop()!);
        return await handleAdminUpdateOrderStatus(request, env, id);
      }

      if (path === '/api/admin/users' && method === 'GET') {
        return await handleAdminGetUsers(request, env);
      }

      if (path.match(/^\/api\/admin\/users\/\d+\/status$/) && method === 'PATCH') {
        const id = parseInt(path.split('/')[4]);
        return await handleAdminUpdateUserStatus(request, env, id);
      }

      if (path.match(/^\/api\/admin\/products\/\d+$/) && method === 'DELETE') {
        const id = parseInt(path.split('/').pop()!);
        return await handleAdminDeleteProduct(request, env, id);
      }

      // ========================================
      // Address Routes
      // ========================================
      if (path === '/api/addresses' && method === 'GET') {
        return await handleGetAddresses(request, env);
      }

      if (path === '/api/addresses' && method === 'POST') {
        return await handleCreateAddress(request, env);
      }

      if (path.match(/^\/api\/addresses\/\d+$/) && method === 'DELETE') {
        const id = parseInt(path.split('/').pop()!);
        return await handleDeleteAddress(request, env, id);
      }

      if (path.match(/^\/api\/addresses\/\d+\/default$/) && method === 'PATCH') {
        const id = parseInt(path.split('/')[3]);
        return await handleSetDefaultAddress(request, env, id);
      }

      // 404 Not Found
      return notFoundResponse('Endpoint');

    } catch (error) {
      console.error('API Error:', error);
      return serverErrorResponse(error instanceof Error ? error.message : 'Unknown error');
    }
  }
};

// ============================================================================
// Authentication Handlers
// ============================================================================

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await request.json();
  const errors = validateRegistration(body);
  
  if (errors.length > 0) {
    return validationErrorResponse(errors);
  }

  // Check if email already exists
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(body.email).first();

  if (existing) {
    return errorResponse('EMAIL_EXISTS', 'Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(body.password);

  // Create user
  const result = await env.DB.prepare(`
    INSERT INTO users (email, password_hash, name, phone, role, status)
    VALUES (?, ?, ?, ?, 'customer', 'active')
  `).bind(
    body.email,
    passwordHash,
    body.name || null,
    body.phone || null
  ).run();

  const userId = result.meta.last_row_id as number;

  // Generate token
  const token = await generateToken(userId, body.email, 'customer', env.JWT_SECRET);

  return successResponse({
    user: {
      id: userId,
      email: body.email,
      name: body.name,
      role: 'customer'
    },
    token
  }, undefined, 201);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await request.json();

  if (!body.email || !body.password) {
    return errorResponse('INVALID_CREDENTIALS', 'Email and password are required');
  }

  // Find user
  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, name, role, status FROM users WHERE email = ?'
  ).bind(body.email).first() as any;

  if (!user) {
    return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status !== 'active') {
    return errorResponse('ACCOUNT_DISABLED', 'Your account has been disabled');
  }

  // Verify password
  const isValid = await verifyPassword(body.password, user.password_hash);
  
  if (!isValid) {
    return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Generate token
  const token = await generateToken(user.id, user.email, user.role, env.JWT_SECRET);

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  });
}

async function handleGetCurrentUser(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  const user = await env.DB.prepare(
    'SELECT id, email, name, phone, role, avatar_url, created_at FROM users WHERE id = ?'
  ).bind(auth.user.userId).first();

  if (!user) {
    return notFoundResponse('User');
  }

  return successResponse(user);
}

// ============================================================================
// Product Handlers
// ============================================================================

async function handleGetProducts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { page, limit } = validatePagination(url.searchParams);
  const { limit: sqlLimit, offset } = getPaginationSQL(page, limit);

  // Build filters
  const filters: string[] = ['p.status = ?'];
  const params: any[] = ['active'];

  const categoryId = url.searchParams.get('category_id');
  if (categoryId) {
    filters.push('p.category_id = ?');
    params.push(parseInt(categoryId));
  }

  const ipCategory = url.searchParams.get('ip_category');
  if (ipCategory && ipCategory !== '全部') {
    filters.push('p.ip_category = ?');
    params.push(ipCategory);
  }

  const search = url.searchParams.get('search');
  if (search) {
    filters.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  // Get total count
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as total FROM products p ${whereClause}
  `).bind(...params).first() as any;

  const total = countResult.total;

  // Get products with default SKU
  const products = await env.DB.prepare(`
    SELECT 
      p.*,
      ps.id as sku_id,
      ps.price,
      ps.stock_quantity,
      pi.image_url
    FROM products p
    LEFT JOIN product_skus ps ON p.id = ps.product_id AND ps.is_default = 1
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, sqlLimit, offset).all();

  return successResponse(
    createPaginatedResponse(products.results || [], page, limit, total)
  );
}

async function handleGetProduct(env: Env, id: number): Promise<Response> {
  // Get product
  const product = await env.DB.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).bind(id).first();

  if (!product) {
    return notFoundResponse('Product');
  }

  // Get SKUs
  const skus = await env.DB.prepare(
    'SELECT * FROM product_skus WHERE product_id = ? ORDER BY is_default DESC, id ASC'
  ).bind(id).all();

  // Get images
  const images = await env.DB.prepare(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC'
  ).bind(id).all();

  return successResponse({
    ...product,
    skus: skus.results || [],
    images: images.results || []
  });
}

async function handleCreateProduct(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin', 'seller'])) {
    return forbiddenResponse('Only admins and sellers can create products');
  }

  const body = await request.json();
  const errors = validateProduct(body);
  
  if (errors.length > 0) {
    return validationErrorResponse(errors);
  }

  // Generate slug if not provided
  if (!body.slug) {
    body.slug = generateSlug(body.name);
  }

  // Create product
  const productResult = await env.DB.prepare(`
    INSERT INTO products (
      name, slug, description, category_id, brand, ip_category, 
      material_type, status, is_featured, seller_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.name,
    body.slug,
    body.description || null,
    body.category_id || null,
    body.brand || null,
    body.ip_category || null,
    body.material_type || null,
    body.status || 'active',
    body.is_featured ? 1 : 0,
    auth.user.userId
  ).run();

  const productId = productResult.meta.last_row_id as number;

  // Create default SKU if provided
  if (body.default_sku) {
    await env.DB.prepare(`
      INSERT INTO product_skus (
        product_id, sku_code, variant_name, price, stock_quantity, is_default
      ) VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
      productId,
      body.default_sku.sku_code || `SKU-${productId}-001`,
      body.default_sku.variant_name || 'Default',
      body.default_sku.price,
      body.default_sku.stock_quantity || 0
    ).run();
  }

  return successResponse({ id: productId }, undefined, 201);
}

async function handleUpdateProduct(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  // Check if product exists
  const product = await env.DB.prepare(
    'SELECT seller_id FROM products WHERE id = ?'
  ).bind(id).first() as any;

  if (!product) {
    return notFoundResponse('Product');
  }

  // Check permissions
  if (auth.user.role !== 'admin' && product.seller_id !== auth.user.userId) {
    return forbiddenResponse('You can only update your own products');
  }

  const body = await request.json();

  await env.DB.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      category_id = COALESCE(?, category_id),
      material_type = COALESCE(?, material_type),
      ip_category = COALESCE(?, ip_category),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.description,
    body.category_id,
    body.material_type,
    body.ip_category,
    body.status,
    id
  ).run();

  return successResponse({ success: true });
}

async function handleDeleteProduct(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Only admins can delete products');
  }

  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

  return successResponse({ success: true });
}

// ============================================================================
// Cart Handlers
// ============================================================================

async function getCartIdentifier(request: Request, env: Env): Promise<{ userId?: number; sessionId?: string }> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (!auth.error && auth.user) {
    return { userId: auth.user.userId };
  }

  // For anonymous users, use session ID from header
  const sessionId = request.headers.get('X-Session-ID') || crypto.randomUUID();
  return { sessionId };
}

async function handleGetCart(request: Request, env: Env): Promise<Response> {
  const { userId, sessionId } = await getCartIdentifier(request, env);

  const whereClause = userId 
    ? 'c.user_id = ?'
    : 'c.session_id = ?';
  
  const identifier = userId || sessionId;

  const items = await env.DB.prepare(`
    SELECT 
      c.*,
      ps.variant_name,
      ps.price,
      ps.stock_quantity,
      ps.image_url as sku_image,
      p.name as product_name,
      p.slug as product_slug,
      pi.image_url as product_image
    FROM carts c
    JOIN product_skus ps ON c.sku_id = ps.id
    JOIN products p ON ps.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE ${whereClause}
    ORDER BY c.created_at DESC
  `).bind(identifier).all();

  const cartItems = items.results || [];
  const subtotal = cartItems.reduce((sum: number, item: any) => 
    sum + (item.price * item.quantity), 0
  );

  return successResponse({
    items: cartItems,
    subtotal,
    total_items: cartItems.length
  });
}

async function handleAddToCart(request: Request, env: Env): Promise<Response> {
  const { userId, sessionId } = await getCartIdentifier(request, env);
  const body = await request.json();

  if (!body.sku_id || !body.quantity) {
    return errorResponse('INVALID_INPUT', 'SKU ID and quantity are required');
  }

  // Check if SKU exists and has stock
  const sku = await env.DB.prepare(
    'SELECT stock_quantity FROM product_skus WHERE id = ?'
  ).bind(body.sku_id).first() as any;

  if (!sku) {
    return notFoundResponse('SKU');
  }

  if (sku.stock_quantity < body.quantity) {
    return errorResponse('INSUFFICIENT_STOCK', 'Insufficient stock');
  }

  // Check if item already in cart
  const whereClause = userId 
    ? 'user_id = ? AND sku_id = ?'
    : 'session_id = ? AND sku_id = ?';
  
  const identifier = userId || sessionId;
  
  const existing = await env.DB.prepare(
    `SELECT id, quantity FROM carts WHERE ${whereClause}`
  ).bind(identifier, body.sku_id).first() as any;

  if (existing) {
    // Update quantity
    await env.DB.prepare(
      'UPDATE carts SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(body.quantity, existing.id).run();
  } else {
    // Insert new item
    if (userId) {
      await env.DB.prepare(
        'INSERT INTO carts (user_id, sku_id, quantity) VALUES (?, ?, ?)'
      ).bind(userId, body.sku_id, body.quantity).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO carts (session_id, sku_id, quantity) VALUES (?, ?, ?)'
      ).bind(sessionId, body.sku_id, body.quantity).run();
    }
  }

  return successResponse({ success: true }, undefined, 201);
}

async function handleUpdateCartItem(request: Request, env: Env, id: number): Promise<Response> {
  const body = await request.json();

  if (!body.quantity || body.quantity < 1) {
    return errorResponse('INVALID_QUANTITY', 'Quantity must be at least 1');
  }

  await env.DB.prepare(
    'UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(body.quantity, id).run();

  return successResponse({ success: true });
}

async function handleRemoveCartItem(request: Request, env: Env, id: number): Promise<Response> {
  await env.DB.prepare('DELETE FROM carts WHERE id = ?').bind(id).run();
  return successResponse({ success: true });
}

async function handleClearCart(request: Request, env: Env): Promise<Response> {
  const { userId, sessionId } = await getCartIdentifier(request, env);

  const whereClause = userId ? 'user_id = ?' : 'session_id = ?';
  const identifier = userId || sessionId;

  await env.DB.prepare(`DELETE FROM carts WHERE ${whereClause}`).bind(identifier).run();
  
  return successResponse({ success: true });
}

// ============================================================================
// Order Handlers
// ============================================================================

async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse('You must be logged in to create an order');
  }

  const body = await request.json();
  const errors = validateOrderCreation(body);
  
  if (errors.length > 0) {
    return validationErrorResponse(errors);
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Calculate totals
  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of body.items) {
    const sku = await env.DB.prepare(`
      SELECT ps.*, p.name as product_name
      FROM product_skus ps
      JOIN products p ON ps.product_id = p.id
      WHERE ps.id = ?
    `).bind(item.sku_id).first() as any;

    if (!sku) {
      return errorResponse('INVALID_SKU', `SKU ${item.sku_id} not found`);
    }

    if (sku.stock_quantity < item.quantity) {
      return errorResponse('INSUFFICIENT_STOCK', `Insufficient stock for ${sku.product_name}`);
    }

    const itemSubtotal = sku.price * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product_id: sku.product_id,
      sku_id: sku.id,
      product_name: sku.product_name,
      variant_name: sku.variant_name,
      sku_code: sku.sku_code,
      price: sku.price,
      quantity: item.quantity,
      subtotal: itemSubtotal
    });
  }

  const shippingCost = body.shipping_cost || 10; // Default shipping
  const total = subtotal + shippingCost;

  // Create order
  const orderResult = await env.DB.prepare(`
    INSERT INTO orders (
      order_number, user_id, status, payment_status, payment_method,
      subtotal, shipping_cost, total,
      customer_name, customer_email, customer_phone,
      shipping_address, shipping_province, shipping_city, shipping_district,
      notes
    ) VALUES (?, ?, 'pending', 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    orderNumber,
    auth.user.userId,
    body.payment_method || 'pending',
    subtotal,
    shippingCost,
    total,
    body.customer_name,
    body.customer_email,
    body.customer_phone || null,
    body.shipping_address?.address || null,
    body.shipping_address?.province || null,
    body.shipping_address?.city || null,
    body.shipping_address?.district || null,
    body.notes || null
  ).run();

  const orderId = orderResult.meta.last_row_id as number;

  // Create order items and update stock
  for (const item of orderItems) {
    await env.DB.prepare(`
      INSERT INTO order_items (
        order_id, product_id, sku_id, product_name, variant_name, sku_code,
        price, quantity, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      item.product_id,
      item.sku_id,
      item.product_name,
      item.variant_name,
      item.sku_code,
      item.price,
      item.quantity,
      item.subtotal
    ).run();

    // Update stock
    await env.DB.prepare(
      'UPDATE product_skus SET stock_quantity = stock_quantity - ? WHERE id = ?'
    ).bind(item.quantity, item.sku_id).run();

    // Log stock change
    await env.DB.prepare(`
      INSERT INTO stock_logs (
        sku_id, change_quantity, before_quantity, after_quantity,
        type, reference_id, operator_id
      )
      SELECT
        ?, ?, stock_quantity + ?, stock_quantity, 'sale', ?, ?
      FROM product_skus WHERE id = ?
    `).bind(
      item.sku_id,
      -item.quantity,
      item.quantity,
      orderId,
      auth.user.userId,
      item.sku_id
    ).run();
  }

  // Clear cart
  await env.DB.prepare('DELETE FROM carts WHERE user_id = ?').bind(auth.user.userId).run();

  return successResponse({
    order_id: orderId,
    order_number: orderNumber,
    total
  }, undefined, 201);
}

async function handleGetOrders(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  const url = new URL(request.url);
  const { page, limit } = validatePagination(url.searchParams);
  const { limit: sqlLimit, offset } = getPaginationSQL(page, limit);

  const countResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM orders WHERE user_id = ?'
  ).bind(auth.user.userId).first() as any;

  const orders = await env.DB.prepare(`
    SELECT * FROM orders 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(auth.user.userId, sqlLimit, offset).all();

  return successResponse(
    createPaginatedResponse(orders.results || [], page, limit, countResult.total)
  );
}

async function handleGetOrder(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  const order = await env.DB.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?'
  ).bind(id, auth.user.userId).first();

  if (!order) {
    return notFoundResponse('Order');
  }

  const items = await env.DB.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).bind(id).all();

  return successResponse({
    ...order,
    items: items.results || []
  });
}

async function handleCancelOrder(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  const order = await env.DB.prepare(
    'SELECT status, user_id FROM orders WHERE id = ?'
  ).bind(id).first() as any;

  if (!order) {
    return notFoundResponse('Order');
  }

  if (order.user_id !== auth.user.userId && auth.user.role !== 'admin') {
    return forbiddenResponse('You can only cancel your own orders');
  }

  if (order.status !== 'pending' && order.status !== 'paid') {
    return errorResponse('CANNOT_CANCEL', 'Order cannot be cancelled');
  }

  await env.DB.prepare(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind('cancelled', id).run();

  // Restore stock
  const items = await env.DB.prepare(
    'SELECT sku_id, quantity FROM order_items WHERE order_id = ?'
  ).bind(id).all();

  for (const item of items.results || []) {
    await env.DB.prepare(
      'UPDATE product_skus SET stock_quantity = stock_quantity + ? WHERE id = ?'
    ).bind((item as any).quantity, (item as any).sku_id).run();
  }

  return successResponse({ success: true });
}

// ============================================================================
// Admin Handlers
// ============================================================================

async function handleAdminDashboard(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Admin access required');
  }

  // Get stats
  const [orders, revenue, products, lowStock] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as total FROM orders').first() as any,
    env.DB.prepare('SELECT SUM(total) as total FROM orders WHERE payment_status = "paid"').first() as any,
    env.DB.prepare('SELECT COUNT(*) as total FROM products').first() as any,
    env.DB.prepare('SELECT COUNT(*) as total FROM product_skus WHERE stock_quantity < low_stock_threshold').first() as any,
  ]);

  const todayOrders = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = DATE("now")'
  ).first() as any;

  const todayRevenue = await env.DB.prepare(
    'SELECT SUM(total) as total FROM orders WHERE DATE(created_at) = DATE("now") AND payment_status = "paid"'
  ).first() as any;

  return successResponse({
    total_orders: orders.total,
    total_revenue: revenue.total || 0,
    total_products: products.total,
    low_stock_products: lowStock.total,
    today_orders: todayOrders.total,
    today_revenue: todayRevenue.total || 0
  });
}

async function handleAdminGetOrders(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Admin access required');
  }

  const url = new URL(request.url);
  const { page, limit } = validatePagination(url.searchParams);
  const { limit: sqlLimit, offset } = getPaginationSQL(page, limit);

  const status = url.searchParams.get('status');
  const whereClause = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM orders ${whereClause}`
  ).bind(...params).first() as any;

  const orders = await env.DB.prepare(`
    SELECT * FROM orders 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, sqlLimit, offset).all();

  return successResponse(
    createPaginatedResponse(orders.results || [], page, limit, countResult.total)
  );
}

async function handleAdminUpdateOrderStatus(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Admin access required');
  }

  const body = await request.json();

  if (!body.status) {
    return errorResponse('INVALID_INPUT', 'Status is required');
  }

  const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [body.status];

  if (body.status === 'paid') {
    updateFields.push('payment_status = "paid"', 'paid_at = CURRENT_TIMESTAMP');
  } else if (body.status === 'shipped') {
    updateFields.push('shipped_at = CURRENT_TIMESTAMP');
  } else if (body.status === 'completed') {
    updateFields.push('completed_at = CURRENT_TIMESTAMP');
  }

  if (body.tracking_number) {
    updateFields.push('tracking_number = ?');
    params.push(body.tracking_number);
  }

  params.push(id);

  await env.DB.prepare(`
    UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?
  `).bind(...params).run();

  return successResponse({ success: true });
}
// ============================================================================
// Admin User Management Handlers
// ============================================================================

async function handleAdminGetUsers(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Admin access required');
  }

  const users = await env.DB.prepare(`
    SELECT id, email, name, phone, role, status, created_at 
    FROM users 
    ORDER BY created_at DESC
  `).all();

  return successResponse(users.results || []);
}

async function handleAdminUpdateUserStatus(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Admin access required');
  }

  const body = await request.json();

  if (!body.status || !['active', 'inactive'].includes(body.status)) {
    return errorResponse('INVALID_INPUT', 'Invalid status');
  }

  await env.DB.prepare(`
    UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(body.status, id).run();

  return successResponse({ success: true });
}

async function handleAdminDeleteProduct(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  if (!authorize(auth.user, ['admin'])) {
    return forbiddenResponse('Admin access required');
  }

  await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();

  return successResponse({ success: true });
}

// ============================================================================
// Address Management Handlers
// ============================================================================

async function handleGetAddresses(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  const addresses = await env.DB.prepare(`
    SELECT * FROM addresses 
    WHERE user_id = ? 
    ORDER BY is_default DESC, created_at DESC
  `).bind(auth.user.userId).all();

  return successResponse(addresses.results || []);
}

async function handleCreateAddress(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  const body = await request.json();

  if (!body.contact_name || !body.contact_phone || !body.province || !body.city || !body.address) {
    return errorResponse('INVALID_INPUT', 'Required fields missing');
  }

  // If this is set as default, unset other default addresses
  if (body.is_default) {
    await env.DB.prepare(`
      UPDATE addresses SET is_default = 0 WHERE user_id = ?
    `).bind(auth.user.userId).run();
  }

  const result = await env.DB.prepare(`
    INSERT INTO addresses (
      user_id, contact_name, contact_phone, province, city, district, 
      address, zipcode, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    auth.user.userId,
    body.contact_name,
    body.contact_phone,
    body.province,
    body.city,
    body.district || '',
    body.address,
    body.zipcode || null,
    body.is_default ? 1 : 0
  ).run();

  return successResponse({ id: result.meta.last_row_id }, undefined, 201);
}

async function handleDeleteAddress(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  await env.DB.prepare(`
    DELETE FROM addresses WHERE id = ? AND user_id = ?
  `).bind(id, auth.user.userId).run();

  return successResponse({ success: true });
}

async function handleSetDefaultAddress(request: Request, env: Env, id: number): Promise<Response> {
  const auth = await authenticate(request, env.JWT_SECRET);
  
  if (auth.error || !auth.user) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  // Unset all default addresses for this user
  await env.DB.prepare(`
    UPDATE addresses SET is_default = 0 WHERE user_id = ?
  `).bind(auth.user.userId).run();

  // Set this address as default
  await env.DB.prepare(`
    UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?
  `).bind(id, auth.user.userId).run();

  return successResponse({ success: true });
}