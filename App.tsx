import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { verifyConnection } from './lib/appwrite';
import AppwriteTest from './components/AppwriteTest';
import Shop from './components/Shop';
import AdminDashboard from './components/AdminDashboard';
import AdminOrders from './components/AdminOrders';
import AdminProducts from './components/AdminProducts';
import AdminUsers from './components/AdminUsers';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import UserProfile from './components/UserProfile';
import AddressList from './components/AddressList';

function App() {
  // 验证 Appwrite 连接
  useEffect(() => {
    verifyConnection();
  }, []);

  return (
    <AuthProvider>
      {/* Appwrite 连接测试组件（右上角浮动显示） */}
      <AppwriteTest />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<Orders />} />
          
          {/* User Profile Routes */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/addresses" element={<AddressList />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          
          {/* Redirect unknown routes to Shop */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;