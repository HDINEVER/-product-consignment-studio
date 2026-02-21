import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Package, ShoppingCart, Users, DollarSign, 
  TrendingUp, AlertCircle, Clock, CheckCircle, ArrowUpRight,
  Activity, CreditCard, Download, MoreHorizontal, Plus,
  ArrowDownRight, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import AdminLogin from './AdminLogin';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  user_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface ShadcnDashboardProps {
  onSwitchToOriginal: () => void;
}

const ShadcnDashboard: React.FC<ShadcnDashboardProps> = ({ onSwitchToOriginal }) => {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const dashboardResponse = await adminAPI.getDashboard();
      const apiStats = dashboardResponse.data.stats as any;
      
      // 将 API 返回的 camelCase 转换为我们的接口格式
      setStats({
        total_products: apiStats.totalProducts || 0,
        total_orders: apiStats.totalOrders || 0,
        total_users: apiStats.totalUsers || 0,
        total_revenue: apiStats.totalRevenue || 0,
        pending_orders: apiStats.pendingOrders || 0,
        low_stock_products: apiStats.lowStockProducts || 0,
      });
      setRecentOrders((dashboardResponse.data.recentOrders || []) as unknown as RecentOrder[]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待付款',
      paid: '已付款',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  // 计算增长率（模拟数据）
  const calculateGrowth = (current: number) => {
    const growth = Math.floor(Math.random() * 30) - 10; // -10% to +20%
    return { value: growth, isPositive: growth > 0 };
  };

  const revenueGrowth = calculateGrowth(stats?.total_revenue || 0);
  const ordersGrowth = calculateGrowth(stats?.total_orders || 0);
  const usersGrowth = calculateGrowth(stats?.total_users || 0);
  const productsGrowth = calculateGrowth(stats?.total_products || 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <LayoutDashboard className="h-6 w-6 md:h-8 md:w-8" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Shadcn Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  欢迎回来，{user.name || user.email}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 sm:flex-none sm:min-w-[100px] md:min-w-[140px] h-9 md:h-10 px-3 md:px-4 font-medium text-xs sm:text-sm"
                onClick={onSwitchToOriginal}
              >
                <LayoutDashboard className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">切换界面</span>
                <span className="sm:hidden">切换</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 sm:flex-none sm:min-w-[90px] md:min-w-[120px] h-9 md:h-10 px-3 md:px-4 font-medium text-xs sm:text-sm"
                asChild
              >
                <Link to="/">
                  <Package className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">返回前台</span>
                  <span className="sm:hidden">前台</span>
                </Link>
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                className="flex-1 sm:flex-none sm:min-w-[90px] md:min-w-[120px] h-9 md:h-10 px-3 md:px-4 font-medium text-xs sm:text-sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">退出登录</span>
                <span className="sm:hidden">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载数据中...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="analytics">分析</TabsTrigger>
              <TabsTrigger value="reports">报告</TabsTrigger>
              <TabsTrigger value="notifications">通知</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* 总营收 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总营收</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ¥{(stats?.total_revenue || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {revenueGrowth.isPositive ? (
                        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                      )}
                      <span className={revenueGrowth.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(revenueGrowth.value)}%
                      </span>
                      <span className="ml-1">与上月相比</span>
                    </p>
                  </CardContent>
                </Card>

                {/* 总订单数 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总订单数</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {ordersGrowth.isPositive ? (
                        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                      )}
                      <span className={ordersGrowth.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(ordersGrowth.value)}%
                      </span>
                      <span className="ml-1">与上月相比</span>
                    </p>
                  </CardContent>
                </Card>

                {/* 总用户数 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {usersGrowth.isPositive ? (
                        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                      )}
                      <span className={usersGrowth.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(usersGrowth.value)}%
                      </span>
                      <span className="ml-1">与上月相比</span>
                    </p>
                  </CardContent>
                </Card>

                {/* 总商品数 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总商品数</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {productsGrowth.isPositive ? (
                        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                      )}
                      <span className={productsGrowth.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(productsGrowth.value)}%
                      </span>
                      <span className="ml-1">与上月相比</span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Card for Low Stock */}
              {stats && stats.low_stock_products > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <CardTitle>库存警告</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      有 <span className="font-bold text-destructive">{stats.low_stock_products}</span> 件商品库存不足，请及时补货
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" variant="destructive" asChild>
                      <Link to="/admin/products">查看商品</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}

              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Recent Sales Chart Placeholder */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>近期销售趋势</CardTitle>
                    <CardDescription>
                      最近30天的销售数据
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">图表组件位置</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          可集成 Recharts 或其他图表库
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>最近活动</CardTitle>
                    <CardDescription>最近的系统操作</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4">
                        {recentOrders.slice(0, 5).map((order, index) => (
                          <div key={order.id} className="flex items-center gap-4">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                {(order.user_email || 'UN').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {order.order_number}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.user_email}
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              ¥{(order.total_amount || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>最近订单</CardTitle>
                    <CardDescription>
                      您有 {stats?.pending_orders || 0} 个待处理订单
                    </CardDescription>
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/admin/orders">
                      查看全部
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>订单号</TableHead>
                        <TableHead>客户邮箱</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>日期</TableHead>
                        <TableHead className="text-right">金额</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.user_email}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(order.status)}>
                              {statusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('zh-CN')}
                          </TableCell>
                          <TableCell className="text-right">
                            ¥{(order.total_amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/orders/${order.id}`}>查看详情</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>标记为已发货</DropdownMenuItem>
                                <DropdownMenuItem>打印订单</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  取消订单
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
                <Link to="/admin/products">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <CardTitle>商品管理</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        管理所有商品和库存信息
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/admin/orders">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <CardTitle>订单管理</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        处理和跟踪客户订单
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/admin/users">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>用户管理</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        查看和管理用户信息
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>数据分析</CardTitle>
                  <CardDescription>详细的业务数据分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">高级分析图表</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        可添加更多分析维度和可视化
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>销售报告</CardTitle>
                      <CardDescription>生成和下载各类报告</CardDescription>
                    </div>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      导出报告
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">月度销售报告</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            本月销售概况和趋势分析
                          </p>
                          <Button size="sm" variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            下载PDF
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">库存报告</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            当前库存状况和预警信息
                          </p>
                          <Button size="sm" variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            下载Excel
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">用户分析报告</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            用户行为和购买偏好分析
                          </p>
                          <Button size="sm" variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            下载PDF
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">财务报告</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            收入、支出和利润统计
                          </p>
                          <Button size="sm" variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            下载Excel
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>通知中心</CardTitle>
                  <CardDescription>系统通知和待办事项</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats && stats.pending_orders > 0 && (
                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">待处理订单</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            您有 {stats.pending_orders} 个订单等待处理
                          </p>
                          <Button size="sm" variant="link" className="px-0 mt-2" asChild>
                            <Link to="/admin/orders">立即查看</Link>
                          </Button>
                        </div>
                        <Badge>重要</Badge>
                      </div>
                    )}

                    {stats && stats.low_stock_products > 0 && (
                      <div className="flex items-start gap-4 p-4 border rounded-lg border-destructive">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">库存警告</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stats.low_stock_products} 件商品库存不足
                          </p>
                          <Button size="sm" variant="link" className="px-0 mt-2" asChild>
                            <Link to="/admin/products">查看商品</Link>
                          </Button>
                        </div>
                        <Badge variant="destructive">紧急</Badge>
                      </div>
                    )}

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">系统运行正常</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          所有系统服务运行正常
                        </p>
                      </div>
                      <Badge variant="outline">信息</Badge>
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">销售增长</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          本月销售额较上月增长 15.3%
                        </p>
                      </div>
                      <Badge variant="outline">趋势</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ShadcnDashboard;
