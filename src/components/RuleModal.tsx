import React, { useState, useEffect } from 'react';
import { X, Clock, ChevronDown } from 'lucide-react';
import { Rule, RuleFormData } from '../types';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RuleFormData) => void;
  initialData?: Rule;
}

export default function RuleModal({ isOpen, onClose, onSave, initialData }: RuleModalProps) {
  const [formData, setFormData] = useState<Partial<RuleFormData>>({
    qualityType: '规则质检',
    categoryType: '组',
    sqlTab: '基础语句',
    priority: 4,
    errorType: '肯定错误',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        categoryType: '组',
        categoryValue: initialData.groupCategory,
        fieldName: initialData.fieldName,
        priority: initialData.priority,
        errorType: initialData.errorType,
        qualityType: initialData.qualityType,
        timingStrategy: '09:05:15',
        sqlTab: '基础语句',
        sqlContent: `with a as( select seq,regexp_split_to_table(F013V_STK487,',') xx from STK487 a where a.isvalid=1 and a.rtime>=current_date-5000) select * from a where not exists( select 1 from pub201 b where b.isvalid=1 and b.F002V_PUB201='518' and b.CODE_PUB201=a.xx)`,
      });
    } else {
      setFormData({
        qualityType: '规则质检',
        categoryType: '组',
        sqlTab: '基础语句',
        priority: 4,
        errorType: '肯定错误',
        timingStrategy: '09:05:15',
        sqlContent: '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (field: keyof RuleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[17px] font-medium text-gray-900">
            {initialData ? '修改语句' : '新建语句'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0 text-sm">
          <div className="px-8 py-6 space-y-8">
            
            {/* 1. 基本信息 Basic Info */}
            <div>
              <div className="text-gray-900 mb-4 font-medium">基本信息</div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                
                {/* 语句名称 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>语句名称
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    {formData.name && (
                      <button 
                        onClick={() => handleChange('name', '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5 bg-gray-200 rounded-full p-[1px] text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 分类 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>分类
                    <div className="flex items-center ml-4 gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="categoryType" 
                          checked={formData.categoryType === '组'}
                          onChange={() => handleChange('categoryType', '组')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-normal">组</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-gray-500">
                        <input 
                          type="radio" 
                          name="categoryType"
                          checked={formData.categoryType === '宏观节点'}
                          onChange={() => handleChange('categoryType', '宏观节点')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-normal">宏观节点</span>
                      </label>
                    </div>
                  </label>
                  <div className="relative">
                    <select className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                      <option>财务分部/国财-A股组</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 涉及字段名称 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>涉及字段名称
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.fieldName || ''}
                      onChange={(e) => handleChange('fieldName', e.target.value)}
                      className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="币种名称编码">币种名称编码</option>
                      <option value="F013V_STK487">F013V_STK487</option>
                      <option value="F001V_STK487">F001V_STK487</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 优先级 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>优先级
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.priority || 4}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChange('priority', /^\d+$/.test(value) ? Number(value) : value);
                      }}
                      className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value="A股-研发支出1">A股-研发支出1</option>
                      <option value="A股-研发支出2">A股-研发支出2</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 错误类型 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>错误类型
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.errorType || '肯定错误'}
                      onChange={(e) => handleChange('errorType', e.target.value)}
                      className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="肯定错误">肯定错误</option>
                      <option value="可疑错误">可疑错误</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 质检类型 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>质检类型
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.qualityType || '规则质检'}
                      onChange={(e) => handleChange('qualityType', e.target.value as any)}
                      className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="规则质检">规则质检</option>
                      <option value="AI质检">AI质检</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* 定时策略 */}
              <div className="mt-6 flex flex-col gap-2 max-w-[200px]">
                <label className="text-gray-700">定时策略</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.timingStrategy || '09:05:15'}
                    onChange={(e) => handleChange('timingStrategy', e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  />
                  <Clock className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* AI质检 - 质检Prompt (Only if AI质检) */}
            {formData.qualityType === 'AI质检' && (
              <div className="flex flex-col gap-3 mt-10">
                <label className="flex items-center gap-1 text-gray-700">
                  <span className="text-red-500">*</span>质检Prompt
                </label>
                <textarea 
                  value={formData.prompt || ''}
                  onChange={(e) => handleChange('prompt', e.target.value)}
                  placeholder="请输入"
                  className="w-full h-32 px-4 py-3 text-[14px] border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-300"
                />
              </div>
            )}

            {/* 2. SQL 语句 */}
            <div className="flex flex-col gap-4 pt-4">
              <label className="text-gray-900 font-medium">SQL语句</label>
              
              <div className="flex items-center gap-6 border-b border-gray-200">
                <button 
                  className={`pb-2 px-1 text-[13px] border-b-2 transition ${formData.sqlTab === '基础语句' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                  onClick={() => handleChange('sqlTab', '基础语句')}
                >
                  基础语句
                </button>
                <button 
                  className={`pb-2 px-1 text-[13px] border-b-2 transition ${formData.sqlTab === '日常语句' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                  onClick={() => handleChange('sqlTab', '日常语句')}
                >
                  日常语句
                </button>
              </div>

              <div className="relative rounded bg-[#F8F9FA] border border-gray-100 flex shadow-inner">
                {/* Line numbers mock */}
                <div className="w-10 bg-[#F8F9FA] text-right py-4 pr-3 text-gray-400 select-none text-[13px] border-r border-gray-100">
                  1<br/>2<br/>3
                </div>
                {/* Code Editor Mock */}
                <textarea 
                  value={formData.sqlContent}
                  onChange={(e) => handleChange('sqlContent', e.target.value)}
                  spellCheck={false}
                  className="flex-1 min-h-[160px] p-4 bg-transparent outline-none resize-y font-mono text-[13px] text-[#4B0082] leading-relaxed"
                  placeholder="请输入SQL代码..."
                />
              </div>

              {/* Validation tools under SQL area (conditional placement) */}
              {formData.qualityType === '规则质检' && (
                <div className="flex items-center gap-4 mt-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded transition !text-sm">
                    运行
                  </button>
                  <button className="bg-white border border-gray-300 text-gray-700 px-5 py-1.5 rounded hover:bg-gray-50 transition !text-sm">
                    语法校验
                  </button>
                  <span className="text-red-500 text-sm">修改sql后需点击校验才能保存数据</span>
                </div>
              )}
            </div>

            {/* AI质检 - 模型校验字段 & 语法校验 (Only if AI质检) */}
            {formData.qualityType === 'AI质检' && (
              <div className="flex flex-col gap-6 pt-4 pb-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-gray-700">
                    <span className="text-red-500">*</span>模型校验字段
                  </label>
                  <div className="relative max-w-sm">
                    <select 
                      value={formData.modelValidationField || ''}
                      onChange={(e) => handleChange('modelValidationField', e.target.value)}
                      className="w-full appearance-none px-4 py-2 text-[14px] border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-400"
                    >
                      <option value="" disabled>请选择字段</option>
                      <option value="test_field" className="text-gray-900">test_field</option>
                    </select>
                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button className="bg-white border border-gray-300 text-gray-700 px-5 py-1.5 rounded hover:bg-gray-50 transition !text-sm">
                    语法校验
                  </button>
                  <span className="text-red-500 text-sm">修改sql后需点击校验才能保存数据</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-6 py-1.5 text-[14px] text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button 
            onClick={() => onSave(formData as RuleFormData)}
            className="px-6 py-1.5 text-[14px] text-white bg-blue-600 hover:bg-blue-700 cursor-pointer rounded transition"
          >
            确定
          </button>
        </div>

      </div>
    </div>
  );
}
