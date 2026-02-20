import React, { useState } from 'react';
import { X, Plus, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, TagType } from '../hooks/useTags';
import AnimatedButton from './AnimatedButton';

interface TagManagerProps {
  tags: Tag[];
  type: TagType;
  typeName: string; // "分类" or "IP"
  onAdd: (name: string) => Promise<boolean>;
  onDelete: (tagId: string, tagName: string) => Promise<boolean>;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  vertical?: boolean; // 垂直布局模式（用于侧边栏）
  selectedTag?: string; // 当前选中的标签名称
  onSelectTag?: (tagName: string) => void; // 点击标签时的回调
}

/**
 * TagManager 组件
 * 用于管理分类标签和IP标签的添加、删除
 */
export default function TagManager({
  tags,
  type,
  typeName,
  onAdd,
  onDelete,
  isEditMode,
  vertical = false,
  onToggleEditMode,
  selectedTag,
  onSelectTag,
}: TagManagerProps) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [adding, setAdding] = useState(false);

  /**
   * 处理添加标签
   */
  const handleAdd = async () => {
    if (!newTagName.trim()) {
      alert('请输入标签名称');
      return;
    }

    setAdding(true);
    const success = await onAdd(newTagName.trim());
    setAdding(false);

    if (success) {
      setNewTagName('');
      setShowAddInput(false);
    }
  };

  /**
   * 处理删除标签
   */
  const handleDelete = async (tagId: string, tagName: string) => {
    if (!confirm(`确认删除"${tagName}"？\n\n删除后，该${typeName}下的所有商品将归类为"未分类"。`)) {
      return;
    }

    await onDelete(tagId, tagName);
  };

  return (
    <div className="relative">
      {/* 标签列表 */}
      <div className={vertical ? "flex flex-col gap-2" : "flex flex-wrap gap-2 items-center"}>
        {tags.map((tag) => (
          <div key={tag.$id} className="relative group">
            <button
              onClick={() => !isEditMode && onSelectTag && onSelectTag(tag.name)}
              disabled={isEditMode}
              className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm transition-all ${vertical ? 'w-full text-center' : ''} ${
                selectedTag === tag.name
                  ? 'bg-brutal-black text-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
              } ${isEditMode ? 'cursor-default' : 'cursor-pointer'}`}
              title={!isEditMode ? `筛选 ${tag.name}` : ''}
            >
              {tag.name}
            </button>
            
            {/* 删除按钮 (仅编辑模式显示) */}
            {isEditMode && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => handleDelete(tag.$id, tag.name)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-brutal hover:bg-red-600 transition-colors border-2 border-black"
                title={`删除 ${tag.name}`}
              >
                <X size={14} strokeWidth={3} />
              </motion.button>
            )}
          </div>
        ))}

        {/* 添加按钮 */}
        {!showAddInput && (
          <button
            onClick={() => setShowAddInput(true)}
            className={`px-4 py-2 rounded-full border-2 border-dashed border-gray-400 bg-white font-bold text-sm text-gray-500 hover:text-black hover:border-black transition-colors flex items-center gap-1 ${vertical ? 'w-full justify-center' : ''}`}
            title={`添加新${typeName}`}
          >
            <Plus size={16} />
            添加{typeName}
          </button>
        )}

        {/* 添加输入框 */}
        <AnimatePresence>
          {showAddInput && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={vertical ? "flex flex-col gap-2" : "flex items-center gap-2"}
            >
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') {
                    setShowAddInput(false);
                    setNewTagName('');
                  }
                }}
                placeholder={`新${typeName}名称`}
                className={`px-4 py-2 rounded-full border-2 border-black bg-white font-bold text-sm outline-none focus:shadow-brutal transition-shadow ${vertical ? 'w-full' : 'w-40'}`}
                autoFocus
                disabled={adding}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 px-4 py-2 rounded-full border-2 border-black bg-brutal-yellow font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {adding ? '添加中...' : '确认'}
                </button>
                <button
                  onClick={() => {
                    setShowAddInput(false);
                    setNewTagName('');
                  }}
                  disabled={adding}
                  className="flex-1 px-4 py-2 rounded-full border-2 border-black bg-white font-bold text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  取消
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 编辑模式切换按钮 */}
        {!showAddInput && (
          <button
            onClick={onToggleEditMode}
            className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm flex items-center gap-1 transition-all ${vertical ? 'w-full justify-center' : ''} ${
              isEditMode
                ? 'bg-brutal-black text-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-gray-600 hover:text-black hover:shadow-brutal'
            }`}
            title={isEditMode ? '退出编辑模式' : '编辑标签'}
          >
            {isEditMode ? (
              <>
                <X size={16} />
                完成编辑
              </>
            ) : (
              <>
                <Edit3 size={16} />
                编辑
              </>
            )}
          </button>
        )}
      </div>

      {/* 提示信息 */}
      {isEditMode && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs font-bold text-orange-600 flex items-center gap-1"
        >
          <Trash2 size={12} />
          点击标签右上角的 ✕ 删除标签
        </motion.p>
      )}
    </div>
  );
}
