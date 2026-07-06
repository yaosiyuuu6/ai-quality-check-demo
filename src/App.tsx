import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, X, Play, Copy, RefreshCw, Settings2, Trash2, Edit } from 'lucide-react';
import { AiGenerationTask, Rule, RuleFormData } from './types';
import RuleModal from './components/RuleModal';
import AiModal from './components/AiModal';
import PlannerWorkbench from './components/PlannerWorkbench';
import { mockRules } from './data';
import { applyDuplicateCheck, findDuplicateMatches } from './duplicate';

type RuleSource = 'AI_GENERATED' | 'MANUAL';

const getRuleSource = (rule: Rule): RuleSource => rule.source || (rule.isGenerated ? 'AI_GENERATED' : 'MANUAL');
const getSourceLabel = (source: RuleSource) => (source === 'AI_GENERATED' ? 'AI生成' : '人工新建');

export default function App() {
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [sourceFilter, setSourceFilter] = useState<'全部' | RuleSource>('全部');
  
  // Modals state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [plannerTask, setPlannerTask] = useState<AiGenerationTask | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [compareRuleId, setCompareRuleId] = useState<string | null>(null);
  const [compareNameKeyword, setCompareNameKeyword] = useState('');
  const [compareFieldKeyword, setCompareFieldKeyword] = useState('');
  const [isSuspectFirst, setIsSuspectFirst] = useState(true);

  // New Rule Dropdown state
  const [isNewRuleMenuOpen, setIsNewRuleMenuOpen] = useState(false);
  const newRuleMenuRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<Rule[]>(mockRules);

  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

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

  const handleEditAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEdit(id);
  };

  const handleCompareAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareRuleId(id);
    setCompareNameKeyword('');
    setCompareFieldKeyword('');
    setIsSuspectFirst(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteRule(id);
  };

  const handleDeleteRule = (id: string) => {
    const rule = rulesRef.current.find((item) => item.id === id);
    if (!rule) return;
    if (!window.confirm(`确认删除语句「${rule.name}」吗？`)) return;

    const nextRules = rulesRef.current.filter((item) => item.id !== id);
    rulesRef.current = nextRules;
    setRules(nextRules);
    if (compareRuleId === id) setCompareRuleId(null);
    if (editingRuleId === id) setEditingRuleId(null);
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              status: rule.status === '停用' ? '正常' : '停用',
              isValid: true,
            }
          : rule,
      ),
    );
  };

  const handleCloseRuleModal = () => {
    setIsRuleModalOpen(false);
    setEditingRuleId(null);
  };
  
  const handleSaveRuleModal = (data: RuleFormData) => {
    console.log('Saved Data:', data);
    const existingRule = editingRuleId ? rules.find((rule) => rule.id === editingRuleId) : undefined;
    if (existingRule) {
      setRules((prev) =>
        {
          const nextRules = prev.map((rule) =>
          rule.id === editingRuleId
            ? {
                ...rule,
                name: data.name || rule.name,
                groupCategory: data.categoryValue || rule.groupCategory,
                fieldName: data.fieldName || rule.fieldName,
                priority: data.priority || rule.priority,
                errorType: data.errorType || rule.errorType,
                qualityType: data.qualityType || rule.qualityType,
                source: getRuleSource(rule),
              }
            : rule,
          );
          rulesRef.current = nextRules;
          return nextRules;
        },
      );
    } else {
      const manualRule: Rule = {
        id: Math.floor(Math.random() * 100000).toString(),
        name: data.name || '(人工新建) 质检规则',
        fieldName: data.fieldName || 'F013V_STK487',
        groupCategory: data.categoryValue || '财务分部/国财-A股组',
        priority: data.priority || 4,
        qualityType: data.qualityType || '规则质检',
        debugStatus: '未调试',
        errorType: data.errorType || '肯定错误',
        status: '正常',
        isValid: true,
        author: '人工录入',
        createdAt: new Date().toLocaleString(),
        source: 'MANUAL',
        isGenerated: false,
        isRead: true,
      };
      setRules((prev) => {
        const nextRules = [...prev, manualRule];
        rulesRef.current = nextRules;
        return nextRules;
      });
    }
    setIsRuleModalOpen(false);
    setEditingRuleId(null);
  };

  const handleAiStart = (task: AiGenerationTask) => {
    setIsAiModalOpen(false);
    setPlannerTask(task);
  };

  const handleRuleGenerated = (rule: Rule) => {
    const checkedRule = applyDuplicateCheck(rule, rulesRef.current);
    const nextRules = [...rulesRef.current, checkedRule];
    rulesRef.current = nextRules;
    setRules(nextRules);
    return checkedRule;
  };

  const handleRunDuplicateCheck = (id: string) => {
    const target = rulesRef.current.find((rule) => rule.id === id);
    if (!target) return;

    const checkedRule = applyDuplicateCheck(
      target,
      rulesRef.current.filter((rule) => rule.id !== id),
    );
    const nextRules = rulesRef.current.map((rule) => (rule.id === id ? checkedRule : rule));
    rulesRef.current = nextRules;
    setRules(nextRules);
  };

  const handleKeepRule = (id: string) => {
    const nextRules = rulesRef.current.map((rule) =>
      rule.id === id
        ? {
            ...rule,
            duplicateRisk: 'none' as const,
            duplicateReason: undefined,
            duplicateMatchIds: [],
            manualReviewStatus: 'kept' as const,
            isRead: true,
          }
        : rule,
    );
    rulesRef.current = nextRules;
    setRules(nextRules);
  };

  const filteredRules = rules.filter((rule) => sourceFilter === '全部' || getRuleSource(rule) === sourceFilter);
  const compareRule = compareRuleId ? rules.find((rule) => rule.id === compareRuleId) : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-sm text-gray-800">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
          <SourceFilter value={sourceFilter} onChange={setSourceFilter} />
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
      <div className="min-h-0 flex-1 overflow-hidden p-6">
        <div className="h-full min-w-0 overflow-auto">
        <div className="w-full max-w-full overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
          <table className="min-w-[1500px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded text-blue-600 border-gray-300" /></th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">语句名称</th>
                <th className="px-4 py-3">字段名称</th>
                <th className="px-4 py-3">组或分类</th>
                <th className="px-4 py-3">优先级</th>
                <th className="px-4 py-3">质检类型</th>
                <th className="px-4 py-3">来源</th>
                <th className="px-4 py-3">疑似重复</th>
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
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                    暂无数据，请尝试新建语句
                  </td>
                </tr>
              )}
              {filteredRules.map((rule) => {
                const isGeneratedUnread = rule.isGenerated && !rule.isRead;
                const source = getRuleSource(rule);
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
                    <td className="px-4 py-3">
                      <span className={`rounded border px-2 py-0.5 text-xs ${
                        source === 'AI_GENERATED'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}>
                        {getSourceLabel(source)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rule.duplicateRisk === 'possible' && (
                        <div className="max-w-[260px]">
                          <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                            疑似重复
                          </span>
                          {rule.duplicateReason && <div className="mt-1 truncate text-xs text-orange-700" title={rule.duplicateReason}>{rule.duplicateReason}</div>}
                        </div>
                      )}
                      {rule.manualReviewStatus === 'kept' && rule.duplicateRisk !== 'possible' && (
                        <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">已保留</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rule.debugStatus}</td>
                    <td className="px-4 py-3 text-gray-600">{rule.errorType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs leading-tight ${
                        rule.status === '正常'
                          ? 'bg-green-100/60 text-green-700 border border-green-200/50'
                          : rule.status === '停用'
                            ? 'bg-gray-100 text-gray-600 border border-gray-200'
                            : 'bg-red-100 text-red-700'
                      }`}>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-center text-[13px] text-blue-600">
                        <button onClick={(e) => handleToggleStatus(rule.id, e)} className="hover:text-blue-800 transition">
                          {rule.status === '停用' ? '启用' : '停用'}
                        </button>
                        <button onClick={(e) => handleEditAction(rule.id, e)} className="hover:text-blue-800 transition">编辑</button>
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
        onStart={handleAiStart}
      />
      </div>

      {plannerTask && (
        <PlannerWorkbench
          task={plannerTask}
          onClose={() => setPlannerTask(null)}
          onRuleGenerated={handleRuleGenerated}
        />
      )}

      <ComparePanel
        rule={compareRule}
        rules={rules}
        nameKeyword={compareNameKeyword}
        fieldKeyword={compareFieldKeyword}
        isSuspectFirst={isSuspectFirst}
        onNameKeywordChange={setCompareNameKeyword}
        onFieldKeywordChange={setCompareFieldKeyword}
        onSuspectFirstChange={setIsSuspectFirst}
        onClose={() => setCompareRuleId(null)}
        onRunDuplicateCheck={handleRunDuplicateCheck}
        onKeep={handleKeepRule}
        onEdit={(id) => {
          setCompareRuleId(null);
          handleEdit(id);
        }}
        onDelete={handleDeleteRule}
      />
    </div>
  );
}

function ComparePanel({
  rule,
  rules,
  nameKeyword,
  fieldKeyword,
  isSuspectFirst,
  onNameKeywordChange,
  onFieldKeywordChange,
  onSuspectFirstChange,
  onClose,
  onRunDuplicateCheck,
  onKeep,
  onEdit,
  onDelete,
}: {
  rule?: Rule;
  rules: Rule[];
  nameKeyword: string;
  fieldKeyword: string;
  isSuspectFirst: boolean;
  onNameKeywordChange: (value: string) => void;
  onFieldKeywordChange: (value: string) => void;
  onSuspectFirstChange: (value: boolean) => void;
  onClose: () => void;
  onRunDuplicateCheck: (id: string) => void;
  onKeep: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!rule) return null;

  const matches = findDuplicateMatches(
    rule,
    rules.filter((item) => item.id !== rule.id),
  );
  const matchMap = new Map(matches.map((match) => [match.ruleId, match]));
  const filteredCandidates = rules
    .filter((item) => item.id !== rule.id)
    .filter((item) => item.name.toLowerCase().includes(nameKeyword.trim().toLowerCase()))
    .filter((item) => item.fieldName.toLowerCase().includes(fieldKeyword.trim().toLowerCase()))
    .sort((left, right) => {
      if (!isSuspectFirst) return 0;
      const leftMatched = matchMap.has(left.id);
      const rightMatched = matchMap.has(right.id);
      if (leftMatched === rightMatched) return 0;
      return leftMatched ? -1 : 1;
    });

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-[1120px] max-w-[96vw] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-medium text-gray-900">语句对比</h2>
            <p className="mt-1 text-xs text-gray-500">左侧为当前语句；右侧为其他语句，疑似候选置顶但不截断全量列表。</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[420px_minmax(0,1fr)] gap-4 overflow-hidden p-6">
          <div className="flex min-h-0 flex-col rounded-lg border border-blue-100 bg-blue-50/70">
            <div className="border-b border-blue-100 px-4 py-3">
              <div className="text-xs font-medium uppercase text-blue-700">当前语句</div>
              <h3 className="mt-2 text-base font-semibold text-gray-900">{rule.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <InfoLine label="ID" value={rule.id} />
              <InfoLine label="字段名称" value={rule.fieldName} />
              <InfoLine label="组或分类" value={rule.groupCategory} />
              <InfoLine label="质检类型" value={rule.qualityType} />
              <InfoLine label="错误类型" value={rule.errorType} />
              <InfoLine label="状态" value={rule.status} />
              <InfoLine label="来源" value={getSourceLabel(getRuleSource(rule))} />
              <InfoLine label="最近筛查" value={rule.duplicateCheckedAt || '未筛查'} />
              {rule.duplicateRisk === 'possible' && rule.duplicateReason && (
                <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-xs leading-5 text-orange-700">
                  <div className="mb-1 font-medium">疑似重复原因</div>
                  {rule.duplicateReason}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-blue-100 bg-white/70 px-4 py-3">
              <button onClick={() => onRunDuplicateCheck(rule.id)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700">
                重复筛查当前语句
              </button>
              <button onClick={() => onKeep(rule.id)} className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700 transition hover:bg-green-100">
                保留
              </button>
              <button onClick={() => onEdit(rule.id)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:border-blue-400 hover:text-blue-600">
                编辑
              </button>
              <button onClick={() => onDelete(rule.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-100">
                删除
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">其他语句列表</div>
                  <div className="mt-1 text-xs text-gray-500">当前命中 {matches.length} 条疑似候选，右侧筛选只作用于此列表。</div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={isSuspectFirst} onChange={(event) => onSuspectFirstChange(event.target.checked)} />
                  疑似优先
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  value={nameKeyword}
                  onChange={(event) => onNameKeywordChange(event.target.value)}
                  placeholder="搜索语句名称"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <input
                  value={fieldKeyword}
                  onChange={(event) => onFieldKeywordChange(event.target.value)}
                  placeholder="筛选字段名称"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {filteredCandidates.length === 0 && <div className="py-12 text-center text-sm text-gray-400">暂无匹配语句</div>}
              <div className="space-y-3">
                {filteredCandidates.map((candidate) => {
                  const match = matchMap.get(candidate.id);
                  return (
                    <div key={candidate.id} className={`rounded-lg border p-4 ${match ? 'border-orange-200 bg-orange-50/70' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {match && <span className="rounded border border-orange-200 bg-orange-100 px-2 py-0.5 text-xs text-orange-700">疑似候选</span>}
                            {candidate.manualReviewStatus === 'kept' && <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">已保留</span>}
                            <h4 className="truncate text-sm font-medium text-gray-900">{candidate.name}</h4>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <span>ID：{candidate.id}</span>
                            <span>字段：{candidate.fieldName}</span>
                            <span>分类：{candidate.groupCategory}</span>
                            <span>错误类型：{candidate.errorType}</span>
                            <span>来源：{getSourceLabel(getRuleSource(candidate))}</span>
                            <span>状态：{candidate.status}</span>
                          </div>
                          {match && <div className="mt-3 rounded border border-orange-200 bg-white/80 px-3 py-2 text-xs leading-5 text-orange-700">相似原因：{match.reason}</div>}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button onClick={() => onKeep(candidate.id)} className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700 transition hover:bg-green-100">保留</button>
                          <button onClick={() => onEdit(candidate.id)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition hover:border-blue-400 hover:text-blue-600">编辑</button>
                          <button onClick={() => onDelete(candidate.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-100">删除</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
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
        <select defaultValue="" className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-gray-700">
          <option value="" disabled className="text-gray-400">{placeholder}</option>
          <option value="1">Option 1</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function SourceFilter({
  value,
  onChange,
}: {
  value: '全部' | RuleSource;
  onChange: (value: '全部' | RuleSource) => void;
}) {
  return (
    <div className="flex items-center text-sm gap-2 whitespace-nowrap">
      <span className="text-gray-600 min-w-16 text-right">来源:</span>
      <div className="relative flex-1 min-w-32">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as '全部' | RuleSource)}
          className="w-full appearance-none px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-gray-700"
        >
          <option value="全部">全部</option>
          <option value="AI_GENERATED">AI生成</option>
          <option value="MANUAL">人工新建</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
