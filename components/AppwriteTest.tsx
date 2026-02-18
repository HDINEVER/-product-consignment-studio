/**
 * Appwrite 连接测试组件
 * 用于验证 Appwrite 配置是否正确
 */
import React, { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';

const AppwriteTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('正在测试 Appwrite 连接...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('正在连接 Appwrite...');

      // 测试 1: 尝试获取账号信息（如果未登录会返回 401，但说明连接成功）
      try {
        const user = await account.get();
        setStatus('success');
        setMessage('✅ Appwrite 连接成功！你已登录');
        setDetails({
          userId: user.$id,
          email: user.email,
          name: user.name,
        });
      } catch (error: any) {
        // 401 错误是正常的（表示未登录，但连接成功）
        if (error.code === 401) {
          setStatus('success');
          setMessage('✅ Appwrite 连接成功！（未登录状态）');
          setDetails({
            endpoint: 'https://sgp.cloud.appwrite.io/v1',
            projectId: 'hdinever0428',
            note: '连接正常，可以注册或登录',
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Appwrite 连接失败');
      setDetails({
        error: error.message || '未知错误',
        code: error.code,
        type: error.type,
      });
      console.error('Appwrite 连接测试失败:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#fff3cd',
      border: `2px solid ${status === 'success' ? '#28a745' : status === 'error' ? '#dc3545' : '#ffc107'}`,
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
        🔍 Appwrite 连接测试
      </h3>
      
      <p style={{ margin: '10px 0', fontSize: '14px' }}>
        {message}
      </p>

      {details && (
        <div style={{
          background: 'rgba(0,0,0,0.05)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          marginTop: '10px',
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={testConnection}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        🔄 重新测试
      </button>

      {status === 'success' && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#155724' }}>
          <p style={{ margin: '5px 0' }}><strong>✅ 配置正确！</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Appwrite SDK 已正确配置</li>
            <li>可以进行注册/登录操作</li>
            <li>可以使用所有 Appwrite 功能</li>
          </ul>
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#721c24' }}>
          <p style={{ margin: '5px 0' }}><strong>❌ 需要检查：</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>检查 .env.local 配置</li>
            <li>确认 Appwrite 项目 ID 正确</li>
            <li>确认网络连接正常</li>
            <li>在 Appwrite 控制台添加 localhost:5173 平台</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AppwriteTest;
