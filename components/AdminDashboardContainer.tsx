import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import ShadcnDashboard from './ShadcnDashboard';

/**
 * 管理员仪表板容器组件
 * 支持在原始界面和 Shadcn 界面之间切换
 */
const AdminDashboardContainer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'original' | 'shadcn'>('original');

  // 从 localStorage 恢复用户偏好
  useEffect(() => {
    const savedMode = localStorage.getItem('adminDashboardMode');
    if (savedMode === 'shadcn' || savedMode === 'original') {
      setViewMode(savedMode);
    }
  }, []);

  // 保存用户偏好到 localStorage
  const switchToOriginal = () => {
    setViewMode('original');
    localStorage.setItem('adminDashboardMode', 'original');
  };

  const switchToShadcn = () => {
    setViewMode('shadcn');
    localStorage.setItem('adminDashboardMode', 'shadcn');
  };

  if (viewMode === 'shadcn') {
    return <ShadcnDashboard onSwitchToOriginal={switchToOriginal} />;
  }

  return <AdminDashboard onSwitchToShadcn={switchToShadcn} />;
};

export default AdminDashboardContainer;
