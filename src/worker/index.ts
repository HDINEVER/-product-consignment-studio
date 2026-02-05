/**
 * Cloudflare Worker - D1 数据库 API
 * 用于处理 consignment (寄售) 数据的 CRUD 操作
 */

export interface Env {
  DB: D1Database;
}

interface ConsignmentItem {
  id?: number;
  name: string;
  description?: string;
  price: number;
  status: "pending" | "approved" | "sold" | "returned";
  seller_name: string;
  seller_contact?: string;
  created_at?: string;
  updated_at?: string;
}

// CORS 头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 路由处理
      if (path === "/api/items" && request.method === "GET") {
        return await getItems(env.DB);
      }

      if (path === "/api/items" && request.method === "POST") {
        const body = (await request.json()) as ConsignmentItem;
        return await createItem(env.DB, body);
      }

      if (path.startsWith("/api/items/") && request.method === "GET") {
        const id = parseInt(path.split("/").pop() || "0");
        return await getItem(env.DB, id);
      }

      if (path.startsWith("/api/items/") && request.method === "PUT") {
        const id = parseInt(path.split("/").pop() || "0");
        const body = (await request.json()) as ConsignmentItem;
        return await updateItem(env.DB, id, body);
      }

      if (path.startsWith("/api/items/") && request.method === "DELETE") {
        const id = parseInt(path.split("/").pop() || "0");
        return await deleteItem(env.DB, id);
      }

      // 健康检查
      if (path === "/api/health") {
        return jsonResponse({ status: "ok", database: "connected" });
      }

      return jsonResponse({ error: "Not Found" }, 404);
    } catch (error) {
      console.error("Error:", error);
      return jsonResponse({ error: "Internal Server Error" }, 500);
    }
  },
};

// 获取所有物品
async function getItems(db: D1Database): Promise<Response> {
  const { results } = await db
    .prepare("SELECT * FROM consignment_items ORDER BY created_at DESC")
    .all();
  return jsonResponse(results);
}

// 获取单个物品
async function getItem(db: D1Database, id: number): Promise<Response> {
  const result = await db
    .prepare("SELECT * FROM consignment_items WHERE id = ?")
    .bind(id)
    .first();

  if (!result) {
    return jsonResponse({ error: "Item not found" }, 404);
  }
  return jsonResponse(result);
}

// 创建物品
async function createItem(
  db: D1Database,
  item: ConsignmentItem,
): Promise<Response> {
  const result = await db
    .prepare(
      `INSERT INTO consignment_items (name, description, price, status, seller_name, seller_contact, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    )
    .bind(
      item.name,
      item.description || null,
      item.price,
      item.status || "pending",
      item.seller_name,
      item.seller_contact || null,
    )
    .run();

  return jsonResponse({ success: true, id: result.meta.last_row_id }, 201);
}

// 更新物品
async function updateItem(
  db: D1Database,
  id: number,
  item: ConsignmentItem,
): Promise<Response> {
  const result = await db
    .prepare(
      `UPDATE consignment_items 
     SET name = ?, description = ?, price = ?, status = ?, seller_name = ?, seller_contact = ?, updated_at = datetime('now')
     WHERE id = ?`,
    )
    .bind(
      item.name,
      item.description || null,
      item.price,
      item.status,
      item.seller_name,
      item.seller_contact || null,
      id,
    )
    .run();

  if (result.meta.changes === 0) {
    return jsonResponse({ error: "Item not found" }, 404);
  }
  return jsonResponse({ success: true });
}

// 删除物品
async function deleteItem(db: D1Database, id: number): Promise<Response> {
  const result = await db
    .prepare("DELETE FROM consignment_items WHERE id = ?")
    .bind(id)
    .run();

  if (result.meta.changes === 0) {
    return jsonResponse({ error: "Item not found" }, 404);
  }
  return jsonResponse({ success: true });
}

// JSON 响应工具函数
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
