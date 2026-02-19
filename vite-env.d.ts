/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_PRODUCTS_COLLECTION_ID: string
  readonly VITE_APPWRITE_USERS_COLLECTION_ID: string
  readonly VITE_APPWRITE_ORDERS_COLLECTION_ID: string
  readonly VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID: string
  readonly VITE_APPWRITE_ADDRESSES_COLLECTION_ID: string
  readonly VITE_APPWRITE_CART_ITEMS_COLLECTION_ID: string
  readonly VITE_APPWRITE_STORAGE_BUCKET_ID: string
  readonly VITE_APPWRITE_ADMIN_TEAM_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
