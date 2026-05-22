import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { AiGenerationSession, AiUsageEvent, Employee, Rule } from '../types';

interface UsageDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  rules: Rule[];
  sessions: AiGenerationSession[];
  events: AiUsageEvent[];
}

const pct = (value: number, total: number) => (total === 0 ? '0.0%' : `${((value / total) * 100).toFixed(1)}%`);
const fmtSeconds = (ms?: number) => (ms ? `${(ms / 1000).toFixed(1)}s` : '0.0s');

export default function UsageDashboard({ isOpen, onClose, employees, rules, sessions, events }: UsageDashboardProps) {
  const [departmentFilter, setDepartmentFilter] = useState('全部');
  const [qualityFilter, setQualityFilter] = useState('全部');
  const [batchFilter, setBatchFilter] = useState('全部');

  const departmentOptions = ['全部', ...Array.from(new Set(employees.map((item) => item.departmentName)))];
  const qualityOptions = ['全部', ...Array.from(new Set(rules.map((rule) => rule.qualityCategory || rule.qualityType).filter(Boolean)))];
  const batchOptions = ['全部', ...Array.from(new Set(sessions.map((session) => session.businessBatchId)))];

  const scoped = useMemo(() => {
    const filteredSessions = sessions.filter((session) => {
      const matchDepartment = departmentFilter === '全部' || session.departmentName === departmentFilter;
      const matchQuality = qualityFilter === '全部' || session.qualityCategory === qualityFilter;
      const matchBatch = batchFilter === '全部' || session.businessBatchId === batchFilter;
      return matchDepartment && matchQuality && matchBatch;
    });
    const sessionIds = new Set(filteredSessions.map((session) => session.sessionId));
    const batchIds = new Set(filteredSessions.map((session) => session.businessBatchId));
    const filteredRules = rules.filter((rule) => {
      const fromSession = rule.relatedSessionId ? sessionIds.has(rule.relatedSessionId) : false;
      const fromBatch = rule.businessBatchId ? batchIds.has(rule.businessBatchId) : false;
      if (rule.source === 'AI_GENERATED' || rule.source === 'MANUAL') {
        return filteredSessions.length === 0 ? sessions.length === 0 : fromSession || fromBatch;
      }
      return false;
    });
    const filteredEvents = events.filter((event) => {
      const matchDepartment = departmentFilter === '全部' || event.departmentName === departmentFilter;
      const matchBatch = batchFilter === '全部' || event.businessBatchId === batchFilter;
      const matchSession = !event.sessionId || sessionIds.has(event.sessionId);
      return matchDepartment && matchBatch && matchSession;
    });
    return { filteredSessions, filteredRules, filteredEvents };
  }, [batchFilter, departmentFilter, events, qualityFilter, rules, sessions]);

  const metrics = useMemo(() => {
    const { filteredSessions, filteredRules, filteredEvents } = scoped;
    const aiRules = filteredRules.filter((rule) => rule.source === 'AI_GENERATED');
    const manualRules = filteredRules.filter((rule) => rule.source === 'MANUAL');
    const completedSessions = filteredSessions.filter((session) => session.status === 'completed');
    const canceledSessions = filteredSessions.filter((session) => session.status === 'canceled');
    const savedAiRules = aiRules.filter((rule) => rule.savedAt || rule.enabledAt);
    const modifiedAiRules = aiRules.filter((rule) => rule.wasModified);
    const deletedAiRules = aiRules.filter((rule) => rule.deletedAt);
    const usedEmployees = new Set(filteredEvents.map((event) => event.employeeId));
    const usedDepartments = new Set(filteredEvents.map((event) => event.departmentId));
    const avgDuration =
      completedSessions.reduce((sum, session) => sum + (session.durationMs || 0), 0) / Math.max(completedSessions.length, 1);
    const totalCoverageBase = aiRules.length + manualRules.length;

    return {
      usedEmployees: usedEmployees.size,
      usedDepartments: usedDepartments.size,
      entryClicks: filteredEvents.filter((event) => event.eventType === 'ai_entry_click').length,
      generationStarts: filteredSessions.length,
      completedSessions: completedSessions.length,
      canceledSessions: canceledSessions.length,
      generatedRules: aiRules.length,
      acceptedRules: savedAiRules.length,
      modifiedRules: modifiedAiRules.length,
      deletedRules: deletedAiRules.length,
      manualRules: manualRules.length,
      avgDuration,
      completionRate: pct(completedSessions.length, filteredSessions.length),
      cancelRate: pct(canceledSessions.length, filteredSessions.length),
      acceptanceRate: pct(savedAiRules.length, aiRules.length),
      modificationRate: pct(modifiedAiRules.length, savedAiRules.length),
      deletionRate: pct(deletedAiRules.length, aiRules.length),
      manualSupplementRate: pct(manualRules.length, totalCoverageBase),
      aiCoverageRate: pct(aiRules.length, totalCoverageBase),
    };
  }, [scoped]);

  const funnel = [
    { label: '入口点击', value: metrics.entryClicks },
    { label: '开始生成', value: metrics.generationStarts },
    { label: '生成完成', value: metrics.completedSessions },
    { label: '查看规则', value: scoped.filteredEvents.filter((event) => event.eventType === 'ai_rule_view').length },
    { label: '保存规则', value: metrics.acceptedRules },
    { label: '启用/运行', value: scoped.filteredEvents.filter((event) => event.eventType === 'ai_rule_enable').length },
  ];
  const maxFunnel = Math.max(...funnel.map((item) => item.value), 1);

  const recallRows = scoped.filteredSessions.map((session) => {
    const aiRules = scoped.filteredRules.filter((rule) => rule.source === 'AI_GENERATED' && rule.relatedSessionId === session.sessionId);
    const manualRules = scoped.filteredRules.filter(
      (rule) => rule.source === 'MANUAL' && rule.businessBatchId === session.businessBatchId,
    );
    const total = aiRules.length + manualRules.length;
    return {
      session,
      aiCount: aiRules.length,
      manualCount: manualRules.length,
      coverage: pct(aiRules.length, total),
    };
  });

  const distribution = Array.from(
    scoped.filteredRules.reduce((map, rule) => {
      const key = rule.groupCategory || '未分组';
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex h-[88vh] w-[1180px] flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900">AI质检统计看板</h2>
            <p className="mt-1 text-xs text-gray-500">管理层/产品视角：使用、采纳、修改、人工补充与召回缺口</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-3 text-sm">
          <DashboardSelect label="部门" value={departmentFilter} options={departmentOptions} onChange={setDepartmentFilter} />
          <DashboardSelect label="质检类型" value={qualityFilter} options={qualityOptions} onChange={setQualityFilter} />
          <DashboardSelect label="业务批次" value={batchFilter} options={batchOptions} onChange={setBatchFilter} />
          <div className="ml-auto text-xs text-gray-500">数据源：前端模拟 SSO + 埋点事件流</div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="grid grid-cols-5 gap-3">
            <MetricCard label="使用人数" value={metrics.usedEmployees} />
            <MetricCard label="使用部门数" value={metrics.usedDepartments} />
            <MetricCard label="入口点击" value={metrics.entryClicks} />
            <MetricCard label="生成会话" value={metrics.generationStarts} sub={`完成率 ${metrics.completionRate}`} />
            <MetricCard label="平均生成耗时" value={fmtSeconds(metrics.avgDuration)} sub={`取消率 ${metrics.cancelRate}`} />
            <MetricCard label="AI生成规则" value={metrics.generatedRules} />
            <MetricCard label="AI采纳率" value={metrics.acceptanceRate} sub={`${metrics.acceptedRules} 条已保存/启用`} />
            <MetricCard label="AI修改率" value={metrics.modificationRate} sub={`${metrics.modifiedRules} 条发生修改`} />
            <MetricCard label="AI删除率" value={metrics.deletionRate} sub={`${metrics.deletedRules} 条已删除`} />
            <MetricCard label="人工补充率" value={metrics.manualSupplementRate} sub={`人工 ${metrics.manualRules} 条 / 覆盖 ${metrics.aiCoverageRate}`} />
          </div>

          <div className="mt-5 grid grid-cols-[1.1fr_0.9fr] gap-5">
            <section className="rounded border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-gray-900">转化漏斗</div>
              <div className="space-y-3">
                {funnel.map((item) => (
                  <div key={item.label} className="grid grid-cols-[86px_1fr_48px] items-center gap-3 text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <div className="h-7 overflow-hidden rounded bg-gray-100">
                      <div className="h-full rounded bg-blue-500" style={{ width: `${Math.max((item.value / maxFunnel) * 100, 3)}%` }} />
                    </div>
                    <span className="text-right font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-gray-900">规则分布</div>
              <div className="space-y-2">
                {distribution.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">暂无规则数据</div>
                ) : (
                  distribution.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                      <span className="text-gray-700">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="mt-5 rounded border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">召回分析</div>
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">业务批次</th>
                  <th className="px-4 py-3">规划文档</th>
                  <th className="px-4 py-3">组</th>
                  <th className="px-4 py-3">字段范围</th>
                  <th className="px-4 py-3">AI生成</th>
                  <th className="px-4 py-3">人工补充</th>
                  <th className="px-4 py-3">AI覆盖率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recallRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无生成会话</td>
                  </tr>
                ) : (
                  recallRows.map((row) => (
                    <tr key={row.session.sessionId}>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.session.businessBatchId}</td>
                      <td className="px-4 py-3 text-gray-600">{row.session.planningDocId}</td>
                      <td className="px-4 py-3 text-gray-600">{row.session.groupName}</td>
                      <td className="px-4 py-3 text-gray-600">{row.session.fieldScope.join(', ')}</td>
                      <td className="px-4 py-3 text-gray-900">{row.aiCount}</td>
                      <td className="px-4 py-3 text-gray-900">{row.manualCount}</td>
                      <td className="px-4 py-3 text-blue-600">{row.coverage}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="mt-5 rounded border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">AI/人工规则明细</div>
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">来源</th>
                  <th className="px-4 py-3">规则ID</th>
                  <th className="px-4 py-3">语句名称</th>
                  <th className="px-4 py-3">字段</th>
                  <th className="px-4 py-3">组</th>
                  <th className="px-4 py-3">添加人</th>
                  <th className="px-4 py-3">业务批次</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">是否修改</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scoped.filteredRules.map((rule) => (
                  <tr key={rule.id} className={rule.deletedAt ? 'bg-red-50/50 text-gray-400' : ''}>
                    <td className="px-4 py-3">{rule.source === 'MANUAL' ? '人工补充' : 'AI生成'}</td>
                    <td className="px-4 py-3">{rule.id}</td>
                    <td className="px-4 py-3">{rule.name}</td>
                    <td className="px-4 py-3">{rule.fieldName}</td>
                    <td className="px-4 py-3">{rule.groupCategory}</td>
                    <td className="px-4 py-3">{rule.author}</td>
                    <td className="px-4 py-3">{rule.businessBatchId || '-'}</td>
                    <td className="px-4 py-3">{rule.deletedAt ? '已删除' : rule.status}</td>
                    <td className="px-4 py-3">{rule.wasModified ? '是' : '否'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-gray-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-800 outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
