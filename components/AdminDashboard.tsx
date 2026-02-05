import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, X, Image as ImageIcon, LayoutGrid, List } from 'lucide-react';
import { Product, ProductVariant, CATEGORIES, IPS, Category } from '../types';

interface AdminDashboardProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onExit
}) => {
  const [view, setView] = useState<'list' | 'gallery' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const initialFormState: Product = {
    id: '',
    title: '',
    ip: IPS[1], 
    category: CATEGORIES[1], 
    image: '',
    description: '',
    basePrice: 0,
    stockQuantity: 1,
    materialType: '纸制品', // Default
    variants: [{ name: 'Default', price: 0 }]
  };
  const [formData, setFormData] = useState<Product>(initialFormState);

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setView('form');
  };

  const handleCreate = () => {
    setFormData({ ...initialFormState, id: '' }); // ID handles by backend usually, but for local state we relied on Date.now(). Backend will assign ID.
    setEditingId(null);
    setView('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateProduct(formData);
    } else {
      onAddProduct(formData);
    }
    setView('list');
  };

  // Legacy variants handler if needed, currently we focus on top-level props
  // But for compatibility with existing UI (if it uses variants), we keep this.
  // Ideally backend should support variants table, but for now we map single price.
  
  if (view === 'form') {
    return (
      <div className="bg-[#f3f3f3] min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 font-bold mb-6 hover:underline"
          >
            <ArrowLeft size={20} /> 返回列表
          </button>
          
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 animate-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black mb-8 border-b-4 border-black pb-4">
              {editingId ? '编辑产品' : '新增产品'}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-bold text-sm uppercase mb-2">产品名称</label>
                  <input 
                    required
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm uppercase mb-2">价格 (CNY)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none"
                    value={formData.basePrice}
                    onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className="block font-bold text-sm uppercase mb-2">库存数量</label>
                  <input 
                    type="number"
                    required
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none"
                    value={formData.stockQuantity || 0}
                    onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})}
                  />
                </div>
                 <div>
                  <label className="block font-bold text-sm uppercase mb-2">材质类型</label>
                  <input 
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none"
                    value={formData.materialType || ''}
                    placeholder="e.g. 珠光纸, 亚克力"
                    onChange={e => setFormData({...formData, materialType: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-bold text-sm uppercase mb-2">所属 IP</label>
                  <select 
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none bg-white"
                    value={formData.ip}
                    onChange={e => setFormData({...formData, ip: e.target.value})}
                  >
                    {IPS.filter(ip => ip !== '全部').map(ip => (
                      <option key={ip} value={ip}>{ip}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-sm uppercase mb-2">产品分类 (Tags)</label>
                  <select 
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none bg-white"
                    value={formData.category} // Mapping category to material type roughly or keeping generic
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  >
                    {CATEGORIES.filter(c => c !== '全部').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-sm uppercase mb-2">图片链接</label>
                <div className="flex gap-4">
                  <input 
                    required
                    placeholder="https://..."
                    className="flex-1 border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none"
                    value={formData.image}
                    onChange={e => setFormData({...formData, image: e.target.value})}
                  />
                  <div className="w-12 h-12 border-2 border-black rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-400"/>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-sm uppercase mb-2">产品描述</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setView('list')}
                  className="px-6 py-3 font-bold border-2 border-transparent hover:bg-gray-100 rounded"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-yellow-400 border-2 border-black text-black font-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                >
                  <Save size={20} /> 保存更改
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Main View (List or Gallery) ---

  return (
    <div className="bg-[#f3f3f3] min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Admin Dashboard</h1>
            <p className="font-bold text-gray-500">Inventory & Consignment Management</p>
          </div>
          <div className="flex gap-4 items-center">
             {/* View Toggle */}
             <div className="bg-white border-2 border-black rounded-lg p-1 flex items-center mr-4 shadow-sm">
                <button 
                  onClick={() => setView('list')}
                  className={`p-2 rounded flex items-center gap-2 text-sm font-bold transition-all ${view !== 'gallery' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                >
                  <List size={16} /> 表格
                </button>
                <button 
                  onClick={() => setView('gallery')}
                  className={`p-2 rounded flex items-center gap-2 text-sm font-bold transition-all ${view === 'gallery' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                >
                  <LayoutGrid size={16} /> 画廊
                </button>
             </div>

            <button 
              onClick={onExit}
              className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-gray-100 bg-white"
            >
              Back to Shop
            </button>
            <button 
              onClick={handleCreate}
              className="px-6 py-3 bg-black text-white font-bold rounded shadow-[4px_4px_0px_0px_rgba(255,255,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus size={20} /> New Item
            </button>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden min-h-[600px]">
          
          {/* Gallery View */}
          {view === 'gallery' && (
             <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {products.map(product => (
                 <div key={product.id} className="group relative border-2 border-gray-200 hover:border-black rounded-lg overflow-hidden transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col">
                    {/* Cover Image */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(product)} className="p-1.5 bg-white border border-black rounded shadow hover:bg-gray-100"><Edit size={14}/></button>
                         <button onClick={() => { if(window.confirm('Delete?')) onDeleteProduct(product.id)}} className="p-1.5 bg-white border border-black rounded shadow hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    {/* Card Content (Notion style) */}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                       <h3 className="font-bold text-lg leading-tight">{product.title}</h3>
                       
                       <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-12 shrink-0">IP</span>
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 truncate">{product.ip}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-12 shrink-0">价格</span>
                            <span className="font-mono">¥{product.basePrice}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-12 shrink-0">库存</span>
                            <span className={`font-mono ${!product.stockQuantity ? 'text-red-500' : ''}`}>
                               {product.stockQuantity || 0}
                            </span>
                          </div>
                           <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-12 shrink-0">材质</span>
                            <span className="truncate text-gray-600">{product.materialType || '-'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
               
               {products.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>No items in gallery.</p>
                 </div>
               )}
             </div>
          )}

          {/* Table View */}
          {view !== 'gallery' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-black text-xs uppercase text-gray-500 font-bold tracking-wider">
                  <tr>
                    <th className="p-4 text-left w-16">Cover</th>
                    <th className="p-4 text-left">Product Name</th>
                    <th className="p-4 text-left w-32">Attributes</th>
                    <th className="p-4 text-left w-24">Price</th>
                    <th className="p-4 text-left w-24">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="w-10 h-10 border border-black rounded overflow-hidden bg-gray-100">
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm">{product.title}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-600">{product.ip}</span>
                          {product.materialType && <span className="text-[10px] text-gray-400">{product.materialType}</span>}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">¥{product.basePrice}</td>
                      <td className="p-4 font-mono text-sm">
                        {product.stockQuantity || 0}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="p-1.5 hover:bg-black hover:text-white rounded transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm('Delete?')) onDeleteProduct(product.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="p-12 text-center text-gray-400 font-bold">
                  No products found.
                </div>
              )}
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
