import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, X, Play, Copy, RefreshCw, Settings2, Trash2, Edit } from 'lucide-react';
import { Rule, RuleFormData } from './types';
import RuleModal from './components/RuleModal';
import AiModal from './components/AiModal';

export default function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  
  // Modals state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // New Rule Dropdown state
  const [isNewRuleMenuOpen, setIsNewRuleMenuOpen] = useState(false);
  const newRuleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newRuleMenuRef.current && !newRuleMenuRef.current.contains(event.target as Node)) {
        setIsNewRuleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSingle = () => {
    setEditingRuleId(null);
    setIsNewRuleMenuOpen(false);
    setIsRuleModalOpen(true);
  };

  const handleCreateAi = () => {
    setIsNewRuleMenuOpen(false);
    setIsAiModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingRuleId(id);
    
    // Mark as read if generated
    setRules(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r));
    setIsRuleModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleCloseRuleModal = () => {
    setIsRuleModalOpen(false);
    setEditingRuleId(null);
  };
  
  const handleSaveRuleModal = (data: RuleFormData) => {
    console.log('Saved Data:', data);
    setIsRuleModalOpen(false);
  };

  const handleAiComplete = () => {
    setIsAiModalOpen(false);
  };

  const handleRuleGenerated = (rule: Rule) => {
    setRules(prev => [...prev, rule]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-sm text-gray-800">
      <div className="bg-white px-6 py-4 shadow-sm z-10 flex flex-col gap-4">
        {/* Top Filter Area */}
        <div className="grid grid-cols-5 2xl:grid-cols-8 gap-x-6 gap-y-4">
          <FilterInput label="语句名称" placeholder="请输入" />
          <FilterInput label="ID" placeholder="请输入" />
          <FilterInput label="字段名称" placeholder="请输入" />
          <FilterSelect label="组" placeholder="请选择" />
          <FilterSelect label="优先级" placeholder="请选择" />
          <FilterSelect label="错误类型" placeholder="请选择" />
          <FilterSelect label="状态" placeholder="请选择" />
          <FilterSelect label="有效" placeholder="请选择" />
          <FilterInput label="添加人" placeholder="请输入" />
          <FilterSelect label="质检类型" placeholder="请选择" />
        </div>
        
        <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded -mx-2">
          {/* Action Area */}
          <div className="flex gap-2.5 relative">
            <div ref={newRuleMenuRef} className="relative">
              <button 
                onClick={() => setIsNewRuleMenuOpen(!isNewRuleMenuOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded transition shadow-sm text-sm flex items-center gap-1.5"
              >
                新建语句 <ChevronDown className="w-3.5 h-3.5" />
              </button>
              
              {isNewRuleMenuOpen && (
                <div className="absolute top-full mt-1 left-0 w-36 bg-white border border-gray-200 rounded shadow-lg overflow-hidden z-20">
                  <button 
                    onClick={handleCreateSingle}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    新建单条语句
                  </button>
                  <button 
                    onClick={handleCreateAi}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    AI新建语句
                  </button>
                </div>
              )}
            </div>

            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded transition shadow-sm text-sm">
              运行
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded transition shadow-sm text-sm">
              运行全部
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded transition shadow-sm text-sm">
              ai调试
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded transition shadow-sm text-sm">
              样例数据
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded text-sm transition">重置</button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded text-sm transition shadow-sm">查询</button>
            <button className="text-blue-600 hover:text-blue-700 flex items-center text-sm gap-1 transition">
              收起 <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white border border-gray-200 rounded shadow-sm w-max min-w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded text-blue-600 border-gray-300" /></th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">语句名称</th>
                <th className="px-4 py-3">字段名称</th>
                <th className="px-4 py-3">组或分类</th>
                <th className="px-4 py-3">优先级</th>
                <th className="px-4 py-3">质检类型</th>
                <th className="px-4 py-3">调试状态</th>
                <th className="px-4 py-3">错误类型</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">是否有效</th>
                <th className="px-4 py-3">添加人</th>
                <th className="px-4 py-3">添加时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    暂无数据，请尝试新建语句
                  </td>
                </tr>
              )}
              {rules.map((rule) => {
                const isGeneratedUnread = rule.isGenerated && !rule.isRead;
                return (
                  <tr 
                    key={rule.id} 
                    className={`transition group cursor-pointer
                      ${isGeneratedUnread ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB]' : 'hover:bg-blue-50/30'}
                    `}
                    onClick={() => handleEdit(rule.id)}
                  >
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded text-blue-600 border-gray-300" />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{rule.id}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {isGeneratedUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" title="新生成" />}
                      {rule.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rule.fieldName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex flex-col text-xs leading-snug">
                        <span className="text-gray-900">{rule.groupCategory}</span>
                        <span>组</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rule.priority}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.qualityType}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.debugStatus}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.errorType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs leading-tight ${rule.status === '正常' ? 'bg-green-100/60 text-green-700 border border-green-200/50' : 'bg-red-100 text-red-700'}`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rule.isValid ? '是' : '否'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex flex-col text-xs leading-snug">
                        <span>{rule.author}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity">关注栏</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{rule.createdAt}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3 justify-center text-[13px] text-blue-600">
                        <button className="hover:text-blue-800 transition">停用</button>
                        <button onClick={() => handleEdit(rule.id)} className="hover:text-blue-800 transition">编辑</button>
                        <button onClick={(e) => handleDelete(rule.id, e)} className="text-red-500 hover:text-red-700 transition">删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end text-xs text-gray-400">
           watermark simulation ~ yaochenkai@myhexin...
        </div>
      </div>

      <RuleModal 
        isOpen={isRuleModalOpen} 
        onClose={handleCloseRuleModal} 
        onSave={handleSaveRuleModal}
        initialData={editingRuleId ? rules.find(r => r.id === editingRuleId) : undefined} 
      />

      <AiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onRuleGenerated={handleRuleGenerated}
        onComplete={handleAiComplete}
      />
    </div>
  );
}

function FilterInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex items-center text-sm gap-2 whitespace-nowrap">
      <span className="text-gray-600 min-w-16 text-right">{label}:</span>
      <input 
        type="text" 
        placeholder={placeholder} 
        className="flex-1 w-full min-w-32 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-gray-400"
      />
    </div>
  );
}

function FilterSelect({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex items-center text-sm gap-2 whitespace-nowrap">
      <span className="text-gray-600 min-w-16 text-right">{label}:</span>
      <div className="relative flex-1 min-w-32">
        <select className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-gray-700">
          <option value="" disabled selected className="text-gray-400">{placeholder}</option>
          <option value="1">Option 1</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
