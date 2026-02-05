-- Consignment Items 寄售物品表
CREATE TABLE IF NOT EXISTS consignment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'sold', 'returned')),
  seller_name TEXT NOT NULL,
  seller_contact TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按状态查询
CREATE INDEX IF NOT EXISTS idx_items_status ON consignment_items(status);

-- 索引：按创建时间查询
CREATE INDEX IF NOT EXISTS idx_items_created_at ON consignment_items(created_at DESC);

-- 索引：按卖家查询
CREATE INDEX IF NOT EXISTS idx_items_seller ON consignment_items(seller_name);
