import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Plus, Edit, Trash2, ArrowLeft, Save, Image as ImageIcon, LayoutGrid, List, Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Product, CATEGORIES, IPS, Category } from '../types';
import { useProducts } from '../hooks/useProducts';
import { Link } from 'react-router-dom';
import AdminLogin from './AdminLogin';

const columnHelper = createColumnHelper<Product>();

const AdminDashboard: React.FC = () => {
  // ALL HOOKS MUST BE AT THE TOP
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [view, setView] = useState<'list' | 'gallery' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const initialFormState: Product = {
    id: '',
    title: '',
    ip: IPS[1], 
    category: CATEGORIES[1], 
    image: '',
    description: '',
    basePrice: 0,
    stockQuantity: 1,
    materialType: '纸制品',
    variants: [{ name: 'Default', price: 0 }]
  };
  const [formData, setFormData] = useState<Product>(initialFormState);

  // TanStack Table columns
  const columns = useMemo(() => [
    columnHelper.accessor('image', {
      header: '',
      cell: info => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm">
          <img src={info.getValue()} alt="" className="w-full h-full object-cover" />
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('title', {
      header: '产品名称',
      cell: info => (
        <div>
          <div className="font-semibold text-gray-900">{info.getValue()}</div>
          <div className="text-xs text-gray-400 truncate max-w-[200px]">{info.row.original.description}</div>
        </div>
      ),
    }),
    columnHelper.accessor('ip', {
      header: 'IP',
      cell: info => (
        <span className="px-2.5 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('basePrice', {
      header: '价格',
      cell: info => (
        <span className="font-mono text-sm font-semibold text-emerald-600">
          ¥{info.getValue().toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor('stockQuantity', {
      header: '库存',
      cell: info => {
        const stock = info.getValue() || 0;
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            stock === 0 ? 'bg-red-100 text-red-600' : 
            stock < 5 ? 'bg-amber-100 text-amber-600' : 
            'bg-emerald-100 text-emerald-600'
          }`}>
            {stock}
          </span>
        );
      },
    }),
    columnHelper.accessor('materialType', {
      header: '材质',
      cell: info => (
        <span className="text-gray-500 text-sm">{info.getValue() || '-'}</span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={() => handleEdit(info.row.original)}
            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => {
              if(window.confirm('确定要删除这个产品吗?')) deleteProduct(info.row.original.id);
            }}
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }),
  ], [deleteProduct]);

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('admin_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setView('form');
  };

  const handleCreate = () => {
    setFormData({ ...initialFormState, id: '' });
    setEditingId(null);
    setView('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateProduct(formData);
    } else {
      await addProduct(formData);
    }
    setView('list');
  };

  // Form View
  if (view === 'form') {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 font-medium text-gray-600 mb-6 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} /> 返回列表
          </button>
          
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">
              {editingId ? '✏️ 编辑产品' : '✨ 新增产品'}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-2">产品名称</label>
                  <input 
                    required
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="输入产品名称..."
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-2">价格 (CNY)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    value={formData.basePrice}
                    onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-2">库存数量</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    value={formData.stockQuantity || 0}
                    onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-2">材质类型</label>
                  <input 
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    value={formData.materialType || ''}
                    placeholder="e.g. 珠光纸, 亚克力"
                    onChange={e => setFormData({...formData, materialType: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-2">所属 IP</label>
                  <select 
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    value={formData.ip}
                    onChange={e => setFormData({...formData, ip: e.target.value})}
                  >
                    {IPS.filter(ip => ip !== '全部').map(ip => (
                      <option key={ip} value={ip}>{ip}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-2">产品分类</label>
                  <select 
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  >
                    {CATEGORIES.filter(c => c !== '全部').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 text-sm mb-2">图片链接</label>
                <div className="flex gap-4">
                  <input 
                    required
                    placeholder="https://..."
                    className="flex-1 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    value={formData.image}
                    onChange={e => setFormData({...formData, image: e.target.value})}
                  />
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                    {formData.image ? (
                      <img src={formData.image} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-400"/>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 text-sm mb-2">产品描述</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-gray-50 focus:bg-white"
                  placeholder="描述您的产品..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setView('list')}
                  className="px-6 py-3 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Save size={18} /> 保存
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                控制台
              </h1>
              <p className="text-sm text-gray-500">库存与寄售管理</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ← 返回商店
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总产品</div>
            <div className="text-3xl font-bold text-gray-900">{products.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总库存</div>
            <div className="text-3xl font-bold text-emerald-600">
              {products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">缺货商品</div>
            <div className="text-3xl font-bold text-red-500">
              {products.filter(p => !p.stockQuantity).length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总估值</div>
            <div className="text-3xl font-bold text-indigo-600">
              ¥{products.reduce((sum, p) => sum + p.basePrice * (p.stockQuantity || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索产品..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="bg-gray-100 rounded-xl p-1 flex items-center">
                <button 
                  onClick={() => setView('list')}
                  className={`p-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view !== 'gallery' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setView('gallery')}
                  className={`p-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'gallery' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>

              {/* Add New */}
              <button 
                onClick={handleCreate}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> 新增产品
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : view === 'gallery' ? (
            // Gallery View
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {table.getRowModel().rows.map(row => {
                const product = row.original;
                return (
                  <div key={product.id} className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <button onClick={() => handleEdit(product)} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg hover:bg-white transition-colors" title="编辑"><Edit size={16}/></button>
                        <button onClick={() => { if(window.confirm('删除?')) deleteProduct(product.id)}} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg hover:bg-red-50 text-red-500 transition-colors" title="删除"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{product.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-indigo-600">¥{product.basePrice}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${!product.stockQuantity ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          库存: {product.stockQuantity || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg font-medium">还没有产品</p>
                  <p className="text-sm">点击上方"新增产品"开始添加</p>
                </div>
              )}
            </div>
          ) : (
            // Table View
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id} className="bg-gray-50/80 border-b border-gray-100">
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id}
                            className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {header.isPlaceholder ? null : (
                              <div 
                                className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-900 transition-colors' : ''}`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <span className="text-gray-300">
                                    {{
                                      asc: <ChevronUp size={14} className="text-indigo-600" />,
                                      desc: <ChevronDown size={14} className="text-indigo-600" />,
                                    }[header.column.getIsSorted() as string] ?? <ChevronsUpDown size={14} />}
                                  </span>
                                )}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="group hover:bg-indigo-50/30 transition-colors">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-5 py-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {products.length === 0 && (
                <div className="py-20 text-center text-gray-400">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg font-medium">还没有产品</p>
                  <p className="text-sm">点击上方"新增产品"开始添加</p>
                </div>
              )}

              {/* Pagination */}
              {products.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    显示 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, products.length)} 条，共 {products.length} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">
                      {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                    </span>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
