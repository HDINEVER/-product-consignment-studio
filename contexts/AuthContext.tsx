import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID } from '../lib/appwrite';
import { getGuestCart, clearGuestCart, hasGuestCartItems, GuestCartItem } from '../utils/guestCart';

interface User {
  $id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  syncGuestCart: () => Promise<void>;
  hasGuestCart: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasGuestCart, setHasGuestCart] = useState(false);

  // 检查游客购物车
  useEffect(() => {
    setHasGuestCart(hasGuestCartItems());
  }, []);

  // 页面加载时检查是否已登录
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 尝试获取当前会话用户
        const currentUser = await account.get();
        
        // 获取用户详细信息（从数据库）
        try {
          const userDoc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            currentUser.$id
          );
          
          setUser({
            $id: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name || userDoc.name,
            role: userDoc.role as string,
            phone: userDoc.phone as string,
          });
        } catch {
          // 如果用户文档不存在，只使用账号信息
          setUser({
            $id: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            role: 'user',
          });
        }
      } catch (error) {
        // 用户未登录，这是正常的
        console.log('用户未登录（游客模式）');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 同步游客购物车到数据库
  const syncGuestCart = async () => {
    if (!user) return;
    
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;

    console.log('🔄 正在同步游客购物车...', guestItems);

    try {
      // 遍历游客购物车并写入数据库
      for (const item of guestItems) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          ID.unique(),
          {
            user_id: user.$id,
            product_id: item.product_id,
            quantity: item.quantity,
            created_at: new Date().toISOString(),
          }
        );
      }

      // 清空游客购物车
      clearGuestCart();
      setHasGuestCart(false);
      console.log('✅ 游客购物车同步完成');
    } catch (error) {
      console.error('❌ 同步购物车失败:', error);
    }
  };

  // 登录
  const login = async (email: string, password: string) => {
    try {
      // 创建会话
      await account.createEmailPasswordSession(email, password);
      
      // 获取用户信息
      const currentUser = await account.get();
      
      // 获取用户详细信息
      let userRole = 'user';
      let userName = currentUser.name;
      let userPhone = '';
      
      try {
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          currentUser.$id
        );
        userRole = userDoc.role as string || 'user';
        userName = userDoc.name as string || currentUser.name;
        userPhone = userDoc.phone as string || '';
      } catch {
        // 用户文档不存在，使用默认值
      }

      const loggedInUser = {
        $id: currentUser.$id,
        email: currentUser.email,
        name: userName,
        role: userRole,
        phone: userPhone,
      };

      setUser(loggedInUser);

      // 登录成功后同步游客购物车
      if (hasGuestCartItems()) {
        setTimeout(() => syncGuestCart(), 500);
      }

      console.log('✅ 登录成功:', loggedInUser.email);
    } catch (error: any) {
      console.error('❌ 登录失败:', error);
      throw new Error(error.message || '登录失败，请检查邮箱和密码');
    }
  };

  // 注册
  const register = async (email: string, password: string, name: string) => {
    try {
      // 创建账号
      const newUser = await account.create(ID.unique(), email, password, name);

      // 在用户集合中创建用户文档
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        newUser.$id,
        {
          email: email,
          name: name,
          phone: '',
          role: 'user',
          created_at: new Date().toISOString(),
        }
      );

      // 自动登录
      await account.createEmailPasswordSession(email, password);

      setUser({
        $id: newUser.$id,
        email: email,
        name: name,
        role: 'user',
      });

      // 注册成功后同步游客购物车
      if (hasGuestCartItems()) {
        setTimeout(() => syncGuestCart(), 500);
      }

      console.log('✅ 注册成功:', email);
    } catch (error: any) {
      console.error('❌ 注册失败:', error);
      throw new Error(error.message || '注册失败，该邮箱可能已被使用');
    }
  };

  // Google OAuth 登录（预留接口）
  const loginWithGoogle = async () => {
    try {
      // TODO: 配置 Google OAuth 后启用
      // account.createOAuth2Session(
      //   'google',
      //   'http://localhost:5173/auth/callback', // 成功回调
      //   'http://localhost:5173/auth/failure',  // 失败回调
      // );
      
      alert('🚧 Google 登录功能即将上线，敬请期待！');
      console.log('Google OAuth 预留接口');
    } catch (error: any) {
      console.error('❌ Google 登录失败:', error);
      throw new Error(error.message || 'Google 登录失败');
    }
  };

  // 登出
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      console.log('✅ 已登出');
    } catch (error: any) {
      console.error('❌ 登出失败:', error);
      // 即使API失败，也清除本地状态
      setUser(null);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        isAuthenticated,
        isAdmin,
        syncGuestCart,
        hasGuestCart,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
