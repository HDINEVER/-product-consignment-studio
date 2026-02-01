import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, X, Image as ImageIcon } from 'lucide-react';
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
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const initialFormState: Product = {
    id: '',
    title: '',
    ip: IPS[1], // Default to first actual IP
    category: CATEGORIES[1], // Default to first actual category
    image: '',
    description: '',
    basePrice: 0,
    variants: [{ name: 'Default', price: 0 }]
  };
  const [formData, setFormData] = useState<Product>(initialFormState);

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setView('form');
  };

  const handleCreate = () => {
    setFormData({ ...initialFormState, id: Date.now().toString() });
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

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', price: 0 }]
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    });
  };

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
                  <label className="block font-bold text-sm uppercase mb-2">基础价格 (展示用)</label>
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
                  <label className="block font-bold text-sm uppercase mb-2">产品分类</label>
                  <select 
                    className="w-full border-2 border-black p-3 rounded font-bold focus:ring-4 focus:ring-yellow-400 outline-none bg-white"
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

              <div className="bg-gray-50 p-6 rounded-lg border-2 border-black border-dashed">
                <div className="flex justify-between items-center mb-4">
                  <label className="block font-black text-lg uppercase">SKU / 款式列表</label>
                  <button 
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1 text-sm font-bold bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                  >
                    <Plus size={14} /> 添加款式
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.variants.map((variant, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <input 
                        placeholder="款式名称 (e.g. A款)"
                        className="flex-1 border-2 border-gray-300 p-2 rounded font-bold focus:border-black outline-none"
                        value={variant.name}
                        onChange={e => handleVariantChange(idx, 'name', e.target.value)}
                      />
                      <input 
                        type="number"
                        placeholder="价格"
                        className="w-24 border-2 border-gray-300 p-2 rounded font-bold focus:border-black outline-none"
                        value={variant.price}
                        onChange={e => handleVariantChange(idx, 'price', Number(e.target.value))}
                      />
                      <button 
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        disabled={formData.variants.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
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

  return (
    <div className="bg-[#f3f3f3] min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">后台管理系统</h1>
            <p className="font-bold text-gray-500">产品数据库管理 v1.0</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onExit}
              className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-gray-100 bg-white"
            >
              退出系统
            </button>
            <button 
              onClick={handleCreate}
              className="px-6 py-3 bg-black text-white font-bold rounded shadow-[4px_4px_0px_0px_rgba(255,255,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus size={20} /> 新增产品
            </button>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 text-left font-black uppercase tracking-wider">图片</th>
                  <th className="p-4 text-left font-black uppercase tracking-wider">名称</th>
                  <th className="p-4 text-left font-black uppercase tracking-wider">IP / 分类</th>
                  <th className="p-4 text-left font-black uppercase tracking-wider">价格区间</th>
                  <th className="p-4 text-right font-black uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-yellow-50 transition-colors">
                    <td className="p-4 w-24">
                      <div className="w-16 h-16 border-2 border-black rounded overflow-hidden">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      {product.title}
                      <div className="text-xs text-gray-400 font-normal mt-1 truncate max-w-xs">{product.description}</div>
                    </td>
                    <td className="p-4">
                      <div className="inline-block px-2 py-1 bg-gray-100 rounded border border-black text-xs font-bold mb-1 mr-2">
                        {product.ip}
                      </div>
                      <div className="inline-block px-2 py-1 bg-yellow-200 rounded border border-black text-xs font-bold">
                        {product.category}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {product.variants.length > 1 
                        ? `¥${Math.min(...product.variants.map(v => v.price))} - ¥${Math.max(...product.variants.map(v => v.price))}`
                        : `¥${product.variants[0].price}`
                      }
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 border-2 border-black rounded hover:bg-black hover:text-white transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('确定要删除这个产品吗?')) onDeleteProduct(product.id);
                          }}
                          className="p-2 border-2 border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {products.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-bold">
              暂无数据，请点击右上角新增产品
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
