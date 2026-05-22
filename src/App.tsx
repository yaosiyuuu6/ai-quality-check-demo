import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, X, Play, Copy, RefreshCw, Settings2, Trash2, Edit } from 'lucide-react';
import { AiGenerationSession, AiUsageEvent, AiUsageEventType, Employee, Rule, RuleFormData, RuleSnapshot } from './types';
import RuleModal from './components/RuleModal';
import AiModal from './components/AiModal';
import UsageDashboard from './components/UsageDashboard';

const employees: Employee[] = [
  { employeeId: 'E1001', employeeName: '关玉阁', departmentId: 'D01', departmentName: '数据质检一组', role: 'manager' },
  { employeeId: 'E1002', employeeName: '姚晨凯', departmentId: 'D02', departmentName: '产品平台组', role: 'product' },
  { employeeId: 'E1003', employeeName: '李明', departmentId: 'D01', departmentName: '数据质检一组', role: 'employee' },
];

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const snapshotRule = (rule: Rule): RuleSnapshot => ({
  name: rule.name,
  fieldName: rule.fieldName,
  groupCategory: rule.groupCategory,
  priority: rule.priority,
  errorType: rule.errorType,
  qualityType: rule.qualityType,
  isValid: rule.isValid,
  status: rule.status,
});

const snapshotFromForm = (data: RuleFormData, fallback?: Rule): RuleSnapshot => ({
  name: data.name || fallback?.name || '',
  fieldName: data.fieldName || fallback?.fieldName || '',
  groupCategory: data.categoryValue || fallback?.groupCategory || '财务分部/国财-A股组',
  priority: data.priority || fallback?.priority || 4,
  errorType: data.errorType || fallback?.errorType || '肯定错误',
  qualityType: data.qualityType || fallback?.qualityType || '规则质检',
  isValid: fallback?.isValid ?? true,
  status: fallback?.status || '正常',
});

const hasSnapshotChanged = (before?: RuleSnapshot, after?: RuleSnapshot) => {
  if (!before || !after) return false;
  return JSON.stringify(before) !== JSON.stringify(after);
};

export default function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [sessions, setSessions] = useState<AiGenerationSession[]>([]);
  const [events, setEvents] = useState<AiUsageEvent[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(employees[0]);
  
  // Modals state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
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

  const trackEvent = (
    eventType: AiUsageEventType,
    details: {
      employee?: Employee;
      sessionId?: string;
      ruleId?: string;
      businessBatchId?: string;
      payload?: AiUsageEvent['payload'];
    } = {},
  ) => {
    const employee = details.employee || currentEmployee;
    setEvents((prev) => [
      ...prev,
      {
        eventId: createId('EVT'),
        eventType,
        timestamp: new Date().toISOString(),
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        departmentId: employee.departmentId,
        departmentName: employee.departmentName,
        sessionId: details.sessionId,
        ruleId: details.ruleId,
        businessBatchId: details.businessBatchId,
        payload: details.payload,
      },
    ]);
  };

  const findRelatedSessionForManualRule = (data: RuleFormData) => {
    const completed = [...sessions]
      .filter((session) => session.status === 'completed')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return (
      completed.find((session) => session.fieldScope.includes(data.fieldName)) ||
      completed.find((session) => data.categoryValue?.includes(session.qualityCategory)) ||
      completed[0]
    );
  };

  const handleCreateSingle = () => {
    setEditingRuleId(null);
    setIsNewRuleMenuOpen(false);
    trackEvent('manual_rule_create');
    setIsRuleModalOpen(true);
  };

  const handleCreateAi = () => {
    setIsNewRuleMenuOpen(false);
    trackEvent('ai_entry_click');
    setIsAiModalOpen(true);
  };

  const handleEdit = (id: string) => {
    const rule = rules.find((item) => item.id === id);
    if (!rule || rule.deletedAt) return;
    setEditingRuleId(id);
    
    // Mark as read if generated
    setRules(prev => prev.map(r => r.id === id ? { ...r, isRead: true, viewedAt: r.viewedAt || new Date().toISOString(), editedAt: new Date().toISOString() } : r));
    if (rule.source === 'AI_GENERATED') {
      trackEvent('ai_rule_view', { sessionId: rule.relatedSessionId, ruleId: id, businessBatchId: rule.businessBatchId });
      trackEvent('ai_rule_edit_start', { sessionId: rule.relatedSessionId, ruleId: id, businessBatchId: rule.businessBatchId });
    }
    setIsRuleModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const deletedAt = new Date().toISOString();
    const target = rules.find((rule) => rule.id === id);
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, deletedAt } : rule)));
    if (target?.source === 'AI_GENERATED') {
      trackEvent('ai_rule_delete', { sessionId: target.relatedSessionId, ruleId: id, businessBatchId: target.businessBatchId });
    }
  };

  const handleToggleRule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const changedAt = new Date().toISOString();
    const target = rules.find((rule) => rule.id === id);
    if (!target) return;
    const nextIsValid = !target.isValid;
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              isValid: nextIsValid,
              enabledAt: nextIsValid ? changedAt : rule.enabledAt,
              disabledAt: nextIsValid ? rule.disabledAt : changedAt,
            }
          : rule,
      ),
    );
    if (target.source === 'AI_GENERATED') {
      trackEvent(nextIsValid ? 'ai_rule_enable' : 'ai_rule_disable', {
        sessionId: target.relatedSessionId,
        ruleId: id,
        businessBatchId: target.businessBatchId,
      });
    }
  };

  const handleCloseRuleModal = () => {
    setIsRuleModalOpen(false);
    setEditingRuleId(null);
  };
  
  const handleSaveRuleModal = (data: RuleFormData) => {
    console.log('Saved Data:', data);
    const savedAt = new Date().toISOString();
    const editingRule = editingRuleId ? rules.find((rule) => rule.id === editingRuleId) : undefined;
    const savedSnapshot = snapshotFromForm(data, editingRule);

    if (editingRule) {
      const generatedSnapshot = editingRule.generatedSnapshot || snapshotRule(editingRule);
      const wasModified = editingRule.source === 'AI_GENERATED' ? hasSnapshotChanged(generatedSnapshot, savedSnapshot) : editingRule.wasModified;
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...rule,
                name: savedSnapshot.name,
                fieldName: savedSnapshot.fieldName,
                groupCategory: savedSnapshot.groupCategory,
                priority: savedSnapshot.priority,
                errorType: savedSnapshot.errorType,
                qualityType: savedSnapshot.qualityType,
                savedAt,
                savedSnapshot,
                wasModified,
              }
            : rule,
        ),
      );
      if (editingRule.source === 'AI_GENERATED') {
        trackEvent('ai_rule_save', {
          sessionId: editingRule.relatedSessionId,
          ruleId: editingRule.id,
          businessBatchId: editingRule.businessBatchId,
          payload: { wasModified },
        });
      } else if (editingRule.source === 'MANUAL') {
        trackEvent('manual_rule_save', {
          sessionId: editingRule.relatedSessionId,
          ruleId: editingRule.id,
          businessBatchId: editingRule.businessBatchId,
        });
      }
    } else {
      const relatedSession = findRelatedSessionForManualRule(data);
      const rule: Rule = {
        id: createId('MANUAL'),
        name: savedSnapshot.name || '(人工)未命名质检规则',
        fieldName: savedSnapshot.fieldName || 'F013V_STK487',
        groupCategory: savedSnapshot.groupCategory || relatedSession?.groupName || '财务分部/国财-A股组',
        priority: savedSnapshot.priority,
        qualityType: savedSnapshot.qualityType,
        debugStatus: '未调试',
        errorType: savedSnapshot.errorType,
        status: '正常',
        isValid: true,
        author: currentEmployee.employeeName,
        createdAt: new Date().toLocaleString(),
        source: 'MANUAL',
        relatedSessionId: relatedSession?.sessionId,
        businessBatchId: relatedSession?.businessBatchId,
        planningDocId: relatedSession?.planningDocId,
        qualityCategory: relatedSession?.qualityCategory,
        creatorEmployeeId: currentEmployee.employeeId,
        creatorDepartmentId: currentEmployee.departmentId,
        savedAt,
        savedSnapshot,
      };
      setRules((prev) => [...prev, rule]);
      trackEvent('manual_rule_save', {
        sessionId: relatedSession?.sessionId,
        ruleId: rule.id,
        businessBatchId: relatedSession?.businessBatchId,
        payload: { attribution: relatedSession ? 'matched_business_batch' : 'unmatched' },
      });
    }
    setIsRuleModalOpen(false);
    setEditingRuleId(null);
  };

  const handleAiComplete = () => {
    setIsAiModalOpen(false);
  };

  const handleRuleGenerated = (rule: Rule) => {
    setRules(prev => [...prev, rule]);
  };

  const handleSessionStart = (session: AiGenerationSession) => {
    setSessions((prev) => [...prev, session]);
    trackEvent('ai_generation_start', {
      employee: employees.find((employee) => employee.employeeId === session.employeeId),
      sessionId: session.sessionId,
      businessBatchId: session.businessBatchId,
      payload: {
        qualityCategory: session.qualityCategory,
        planningDocId: session.planningDocId,
      },
    });
  };

  const handleSessionComplete = (sessionId: string, businessBatchId: string, endedAt: string, generatedCount: number, durationMs: number) => {
    setSessions((prev) =>
      prev.map((item) =>
        item.sessionId === sessionId ? { ...item, endedAt, status: 'completed', generatedCount, durationMs } : item,
      ),
    );
    trackEvent('ai_generation_complete', {
      sessionId,
      businessBatchId,
      payload: { generatedCount, durationMs },
    });
  };

  const handleSessionCancel = (sessionId: string, businessBatchId: string, endedAt: string, durationMs: number) => {
    setSessions((prev) =>
      prev.map((item) => (item.sessionId === sessionId ? { ...item, endedAt, status: 'canceled', durationMs } : item)),
    );
    trackEvent('ai_generation_cancel', {
      sessionId,
      businessBatchId,
      payload: { durationMs },
    });
  };

  const handleAiDebug = () => {
    trackEvent('ai_debug_run');
    window.setTimeout(() => trackEvent('ai_debug_success'), 350);
  };

  const visibleRules = rules.filter((rule) => !rule.deletedAt);

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
            <button onClick={handleAiDebug} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded transition shadow-sm text-sm">
              ai调试
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded transition shadow-sm text-sm">
              样例数据
            </button>
            <button onClick={() => setIsDashboardOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded transition shadow-sm text-sm">
              AI质检统计看板
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              当前员工
              <select
                value={currentEmployee.employeeId}
                onChange={(event) => {
                  const employee = employees.find((item) => item.employeeId === event.target.value);
                  if (employee) setCurrentEmployee(employee);
                }}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-700"
              >
                {employees.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.employeeName} / {employee.departmentName}
                  </option>
                ))}
              </select>
            </label>
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
              {visibleRules.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    暂无数据，请尝试新建语句
                  </td>
                </tr>
              )}
              {visibleRules.map((rule) => {
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
                        <button onClick={(e) => handleToggleRule(rule.id, e)} className="hover:text-blue-800 transition">
                          {rule.isValid ? '停用' : '启用'}
                        </button>
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
        currentEmployee={currentEmployee}
        onSessionStart={handleSessionStart}
        onSessionComplete={handleSessionComplete}
        onSessionCancel={handleSessionCancel}
      />

      <UsageDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        employees={employees}
        rules={rules}
        sessions={sessions}
        events={events}
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
