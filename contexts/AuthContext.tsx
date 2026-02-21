import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, teams, DATABASE_ID, COLLECTIONS, ID, Permission, Role } from '../lib/appwrite';
import { getGuestCart, clearGuestCart, hasGuestCartItems, GuestCartItem } from '../utils/guestCart';

// ========== 类型定义 ==========
interface User {
  $id: string;
  email: string;
  name: string;
  phone?: string;
  role?: 'guest' | 'user' | 'admin';
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 用户角色枚举
export type UserRole = 'guest' | 'user' | 'admin';

interface AuthContextType {
  // 用户状态
  user: User | null;
  loading: boolean;
  
  // 角色判断 (三个状态互斥)
  role: UserRole;
  isGuest: boolean;      // 未登录
  isUser: boolean;       // 已登录普通用户
  isAdmin: boolean;      // 管理员
  isAuthenticated: boolean; // 是否已登录 (isUser || isAdmin)
  
  // 认证方法
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  
  // 购物车同步
  syncGuestCart: () => Promise<void>;
  hasGuestCart: boolean;
  
  // 刷新用户状态
  refreshAuth: () => Promise<void>;
}

// ========== 管理员团队 ID ==========
// 在 Appwrite Console 创建 Admins 团队后，将 Team ID 填入环境变量
const ADMIN_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID || 'admins';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasGuestCart, setHasGuestCart] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  // ========== 检查用户是否属于 Admins 团队 ==========
  const checkAdminStatus = async (): Promise<boolean> => {
    try {
      // 获取当前用户所属的所有团队
      const userTeams = await teams.list();
      
      // 检查是否属于 Admins 团队
      const isInAdminTeam = userTeams.teams.some(
        (team) => team.$id === ADMIN_TEAM_ID || team.name.toLowerCase() === 'admins'
      );
      
      console.log('👑 管理员状态检查:', isInAdminTeam ? '是管理员' : '普通用户');
      return isInAdminTeam;
    } catch (error) {
      console.log('⚠️ 无法检查团队状态，默认为普通用户');
      return false;
    }
  };

  // 检查游客购物车
  useEffect(() => {
    setHasGuestCart(hasGuestCartItems());
  }, []);

  // ========== 初始化认证状态 ==========
  const initAuth = async () => {
    setLoading(true);
    try {
      // 尝试获取当前会话用户
      const currentUser = await account.get();
      
      // 检查是否是管理员
      const adminStatus = await checkAdminStatus();
      setIsAdminVerified(adminStatus);
      
      // 获取用户详细信息（从数据库）
      let userName = currentUser.name;
      let userPhone = '';
      let userRole: 'guest' | 'user' | 'admin' = 'user';
      let userDateOfBirth = '';
      let userCreatedAt = '';
      let userUpdatedAt = '';
      
      try {
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          currentUser.$id
        );
        userName = userDoc.name as string || currentUser.name;
        userPhone = userDoc.phone as string || '';
        userRole = userDoc.role as 'guest' | 'user' | 'admin' || 'user';
        userDateOfBirth = userDoc.dateOfBirth as string || '';
        userCreatedAt = userDoc.createdAt as string || '';
        userUpdatedAt = userDoc.updatedAt as string || '';
      } catch (err) {
        console.log('⚠️ 用户文档不存在或读取失败，使用默认值:', err);
      }
      
      setUser({
        $id: currentUser.$id,
        email: currentUser.email,
        name: userName,
        phone: userPhone,
        role: userRole,
        dateOfBirth: userDateOfBirth,
        createdAt: userCreatedAt,
        updatedAt: userUpdatedAt,
      });
      
      console.log('✅ 用户已登录:', currentUser.email, adminStatus ? '(管理员)' : '(普通用户)');
    } catch (error) {
      // 用户未登录，这是正常的
      console.log('👤 用户未登录（游客模式）');
      setUser(null);
      setIsAdminVerified(false);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时检查是否已登录
  useEffect(() => {
    initAuth();
  }, []);
  
  // 刷新认证状态（可手动调用）
  const refreshAuth = async () => {
    await initAuth();
  };

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
            userId: user.$id,                      // ✅ 使用驼峰命名
            productId: item.productId,             // ✅ 使用驼峰命名
            quantity: item.quantity,
            createdAt: new Date().toISOString(),   // ✅ 使用驼峰命名
            isActive: true,                        // ✅ 添加必填字段
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
      
      // 检查管理员状态
      const adminStatus = await checkAdminStatus();
      setIsAdminVerified(adminStatus);
      
      // 获取用户详细信息
      let userName = currentUser.name;
      let userPhone = '';
      
      try {
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          currentUser.$id
        );
        userName = userDoc.name as string || currentUser.name;
        userPhone = userDoc.phone as string || '';
      } catch {
        // 用户文档不存在，使用默认值
      }

      const loggedInUser = {
        $id: currentUser.$id,
        email: currentUser.email,
        name: userName,
        phone: userPhone,
      };

      setUser(loggedInUser);

      // 登录成功后同步游客购物车
      if (hasGuestCartItems()) {
        setTimeout(() => syncGuestCart(), 500);
      }

      console.log('✅ 登录成功:', loggedInUser.email, adminStatus ? '(管理员)' : '(普通用户)');
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
          role: 'user',                           // ✅ 添加必填字段
          createdAt: new Date().toISOString(),    // ✅ 使用驼峰命名
          updatedAt: new Date().toISOString(),    // ✅ 使用驼峰命名
        }
      );

      // 自动登录
      await account.createEmailPasswordSession(email, password);

      setUser({
        $id: newUser.$id,
        email: email,
        name: name,
      });
      
      // 新注册用户默认为普通用户
      setIsAdminVerified(false);

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
      setIsAdminVerified(false);
      console.log('✅ 已登出');
    } catch (error: any) {
      console.error('❌ 登出失败:', error);
      // 即使API失败，也清除本地状态
      setUser(null);
      setIsAdminVerified(false);
    }
  };

  // ========== 计算角色状态 ==========
  const isAuthenticated = !!user;
  const isGuest = !user;
  const isAdmin = isAuthenticated && isAdminVerified;
  const isUser = isAuthenticated && !isAdminVerified;
  
  // 统一角色标识
  const role: UserRole = isAdmin ? 'admin' : isUser ? 'user' : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        isGuest,
        isUser,
        isAdmin,
        isAuthenticated,
        login,
        register,
        logout,
        loginWithGoogle,
        syncGuestCart,
        hasGuestCart,
        refreshAuth,
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
