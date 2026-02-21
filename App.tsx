import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { verifyConnection } from './lib/appwrite';
import './utils/checkEnv'; // 导入环境变量检查工具
import Shop from './components/Shop';
import AdminDashboardContainer from './components/AdminDashboardContainer';
import AdminOrders from './components/AdminOrders';
import AdminProducts from './components/AdminProducts';
import AdminUsers from './components/AdminUsers';
import AdminTest from './components/AdminTest';
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
          <Route path="/admin" element={<AdminDashboardContainer />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/test" element={<AdminTest />} />
          
          {/* Redirect unknown routes to Shop */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;