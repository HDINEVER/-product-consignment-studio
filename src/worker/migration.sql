-- ===================================================================
-- Data Migration Script
-- 从旧的 consignment_items 表迁移数据到新的数据库结构
-- ===================================================================

-- 建议：在执行此脚本前，请先备份数据库！
-- 执行命令: wrangler d1 backup create hdin-consignment-studio

-- ===================================================================
-- Step 1: 创建默认管理员账户
-- ===================================================================

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status) VALUES
(1, 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'admin', 'active');
-- 默认密码: admin123
-- 生产环境请务必修改！

-- ===================================================================
-- Step 2: 分类数据已在 schema-enhanced.sql 中初始化
-- ===================================================================

-- 获取分类ID的映射（用于下一步）
-- '纸制品' -> 1
-- '3D打印制品' -> 2
-- '角色手办定制' -> 3
-- '吧唧制品' -> 4
-- '雪弗板定制' -> 5
-- 'Cos道具/3D代打' -> 6

-- ===================================================================
-- Step 3: 迁移商品数据从 consignment_items 到 products
-- ===================================================================

-- 如果旧表存在，执行迁移
INSERT INTO products (
  name,
  slug,
  description,
  category_id,
  ip_category,
  material_type,
  status,
  seller_id
)
SELECT
  name,
  LOWER(REPLACE(name, ' ', '-')) || '-' || id,  -- 生成slug
  description,
  -- 根据 material_type 映射到 category_id
  CASE 
    WHEN material_type LIKE '%纸%' THEN 1
    WHEN material_type LIKE '%3D%' OR material_type LIKE '%打印%' THEN 2
    WHEN material_type LIKE '%手办%' THEN 3
    WHEN material_type LIKE '%吧唧%' OR material_type LIKE '%徽章%' THEN 4
    WHEN material_type LIKE '%雪弗%' OR material_type LIKE '%亚克力%' THEN 5
    WHEN material_type LIKE '%Cos%' OR material_type LIKE '%道具%' THEN 6
    ELSE 1  -- 默认纸制品
  END,
  ip_category,
  material_type,
  CASE status
    WHEN 'approved' THEN 'active'
    WHEN 'pending' THEN 'inactive'
    WHEN 'sold' THEN 'out_of_stock'
    ELSE 'inactive'
  END,
  1  -- seller_id = 1 (admin)
FROM consignment_items
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE products.slug = LOWER(REPLACE(consignment_items.name, ' ', '-')) || '-' || consignment_items.id
);

-- ===================================================================
-- Step 4: 为每个商品创建默认SKU
-- ===================================================================

INSERT INTO product_skus (
  product_id,
  sku_code,
  variant_name,
  price,
  stock_quantity,
  is_default
)
SELECT
  p.id,
  'SKU-' || p.id || '-001',
  'Default',
  CAST(ci.price AS REAL),
  COALESCE(ci.stock_quantity, 0),
  1
FROM products p
JOIN consignment_items ci ON (
  LOWER(REPLACE(ci.name, ' ', '-')) || '-' || ci.id = p.slug
)
WHERE NOT EXISTS (
  SELECT 1 FROM product_skus WHERE product_skus.product_id = p.id
);

-- ===================================================================
-- Step 5: 迁移商品图片
-- ===================================================================

INSERT INTO product_images (
  product_id,
  image_url,
  sort_order,
  is_primary
)
SELECT
  p.id,
  ci.image_url,
  0,
  1
FROM products p
JOIN consignment_items ci ON (
  LOWER(REPLACE(ci.name, ' ', '-')) || '-' || ci.id = p.slug
)
WHERE ci.image_url IS NOT NULL
AND ci.image_url != ''
AND NOT EXISTS (
  SELECT 1 FROM product_images WHERE product_images.product_id = p.id
);

-- ===================================================================
-- Step 6: 创建初始库存日志
-- ===================================================================

INSERT INTO stock_logs (
  sku_id,
  change_quantity,
  before_quantity,
  after_quantity,
  type,
  notes,
  operator_id
)
SELECT
  sku.id,
  sku.stock_quantity,
  0,
  sku.stock_quantity,
  'adjust',
  'Initial stock from migration',
  1
FROM product_skus sku
WHERE sku.stock_quantity > 0
AND NOT EXISTS (
  SELECT 1 FROM stock_logs WHERE stock_logs.sku_id = sku.id
);

-- ===================================================================
-- Step 7: 数据验证查询
-- ===================================================================

-- 查询迁移后的数据统计
SELECT 'Migration Summary' as report;

SELECT 
  'Total Products Migrated' as metric,
  COUNT(*) as count
FROM products;

SELECT 
  'Total SKUs Created' as metric,
  COUNT(*) as count
FROM product_skus;

SELECT 
  'Total Images Migrated' as metric,
  COUNT(*) as count
FROM product_images;

SELECT 
  'Total Stock' as metric,
  SUM(stock_quantity) as count
FROM product_skus;

-- 查询可能的问题
SELECT 'Validation Checks' as report;

-- 检查没有SKU的商品
SELECT 
  'Products without SKU' as issue,
  COUNT(*) as count
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_skus WHERE product_id = p.id
);

-- 检查没有图片的商品
SELECT 
  'Products without Images' as issue,
  COUNT(*) as count
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_images WHERE product_id = p.id
);

-- 检查低库存商品
SELECT 
  'Low Stock Products' as issue,
  COUNT(*) as count
FROM product_skus
WHERE stock_quantity < 5;

-- ===================================================================
-- Step 8: 清理（可选）
-- ===================================================================

-- 如果迁移成功，可以考虑重命名旧表而不是删除
-- ALTER TABLE consignment_items RENAME TO consignment_items_backup;

-- 或者创建备份表
-- CREATE TABLE consignment_items_backup AS SELECT * FROM consignment_items;

-- 如果确认不再需要旧表，可以删除（请谨慎！）
-- DROP TABLE IF EXISTS consignment_items;

-- ===================================================================
-- Step 9: 重建索引（如果需要）
-- ===================================================================

-- 所有索引已在 schema-enhanced.sql 中定义
-- 如果遇到性能问题，可以使用 ANALYZE 命令优化查询计划
-- ANALYZE;

SELECT 'Migration Complete!' as status;
SELECT 'Please verify the data before dropping the old table.' as warning;
