-- 创建测试管理员账号和基础数据

-- 1. 创建管理员账号 (密码: admin123，SHA-256 哈希)
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@example.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Admin User', 'admin');

-- 2. 创建普通用户 (密码: user123)
INSERT INTO users (email, password_hash, name, role) VALUES 
('user@example.com', 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', 'Test User', 'customer');

-- 3. 创建测试商品
INSERT INTO products (name, slug, description, category_id, status) VALUES 
('测试纸制品', 'test-paper', '这是一个测试纸制品', 1, 'active'),
('测试3D打印', 'test-3d', '这是一个测试3D打印品', 2, 'active');

-- 4. 创建商品SKU
INSERT INTO product_skus (product_id, sku_code, variant_name, price, stock_quantity) VALUES 
(1, 'PAPER-001', '默认规格', 29.99, 100),
(2, '3D-001', '默认规格', 99.99, 50);

-- 5. 创建商品图片
INSERT INTO product_images (product_id, image_url, is_primary) VALUES 
(1, 'https://via.placeholder.com/600', 1),
(2, 'https://via.placeholder.com/600', 1);
