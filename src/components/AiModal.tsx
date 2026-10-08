import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, CheckCircle2, Clock, Info, ExternalLink, HelpCircle, RotateCcw, Square } from 'lucide-react';
import { Rule } from '../types';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleGenerated: (rule: Rule) => void;
  onComplete: () => void;
}

const QUALITY_TYPES = [
  { label: '常规', group: 0 },
  { label: '法规', group: 0 },
  { label: 'A股', group: 1 },
  { label: 'A股_股转', group: 1 },
  { label: '港股', group: 1 },
  { label: '股转', group: 1 },
  { label: '美股', group: 1 },
  { label: '国际__台湾', group: 1 },
  { label: '大陆公募基金', group: 2 },
  { label: '券商理财产品', group: 2 },
  { label: '银行理财', group: 2 },
  { label: '港财', group: 3 },
  { label: '美财', group: 3 },
  { label: '研报', group: 3 },
  { label: '债券', group: 4 },
  { label: '债券ABS', group: 4 },
  { label: '债券海外', group: 4 },
  { label: '债券交易所', group: 4 },
  { label: '债券银行间', group: 4 },
  { label: '指数', group: 5 },
];

const A_SHARE_DISCLOSURE_DOC = '上市公司2023年报披露要求.pdf';
const DOCS = ['港股股权激励处理方案', A_SHARE_DISCLOSURE_DOC, '各类理财产品质检规划_v2.docx', '债券存续期规则v1.1.pdf'];
const GENERATED_AUTHORS = ['张三', '李四', '王五', '赵六', '钱七'];

type TableField = {
  code: string;
  name: string;
  dataType: string;
  description: string;
};

type PriorityOption = {
  value: string;
  fields: TableField[];
};

type AgentConversation = {
  id: string;
  title: string;
  projectName: string;
  attempt: number;
};

const AGENT_PROJECT_NAME = 'AI质检语句生成';
const AGENT_DETAIL_URL = 'https://yaosiyuuu6.github.io/plannerai-demo/demo/agent-workbench.html';
const TABLE_NAME = 'STK250';

const A_SHARE_PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'A股-研发支出1',
    fields: [
      { code: 'F001V_STK487', name: '机构ID', dataType: 'VARCHAR', description: '上市公司唯一标识' },
      { code: 'F010V_STK487', name: '项目公布名称', dataType: 'VARCHAR', description: '研发项目公开披露名称' },
      { code: 'F012N_STK487', name: '本期研发支出', dataType: 'DECIMAL', description: '本期研发项目支出金额' },
      { code: 'F013V_STK487', name: '币种编码', dataType: 'VARCHAR', description: '金额对应币种' },
    ],
  },
  {
    value: 'A股-研发支出2',
    fields: [
      { code: 'F001V_STK488', name: '机构ID', dataType: 'VARCHAR', description: '上市公司唯一标识' },
      { code: 'F006V_STK488', name: '报表类型', dataType: 'VARCHAR', description: '合并或母公司报表' },
      { code: 'F011V_STK488', name: '研发支出类型', dataType: 'VARCHAR', description: '资本化或费用化类型' },
      { code: 'F020V_STK488', name: '备注', dataType: 'VARCHAR', description: '研发支出补充说明' },
    ],
  },
];

const DEFAULT_FIELDS: TableField[] = [
  { code: 'F001V_BASE', name: '业务主键', dataType: 'VARCHAR', description: '当前业务数据唯一标识' },
  { code: 'F002V_BASE', name: '业务名称', dataType: 'VARCHAR', description: '规划文档对应业务名称' },
  { code: 'F003D_BASE', name: '披露日期', dataType: 'DATE', description: '数据披露或发布日期' },
  { code: 'F004N_BASE', name: '数值', dataType: 'DECIMAL', description: '待质检业务数值' },
];

const getDocumentTopic = (documentName: string) => {
  if (documentName.includes('理财')) return '理财产品';
  if (documentName.includes('债券')) return '存续期';
  return '年报披露';
};

const getPriorityOptions = (type: string, documentName: string): PriorityOption[] => {
  if (!type || !documentName) return [];
  if (type === 'A股' && documentName === A_SHARE_DISCLOSURE_DOC) return A_SHARE_PRIORITY_OPTIONS;

  return [
    {
      value: `${type}-${getDocumentTopic(documentName)}`,
      fields: DEFAULT_FIELDS.map((field) => ({
        ...field,
        description: `${type}${field.description}`,
      })),
    },
  ];
};

const formatConversationTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const createAgentConversation = (): AgentConversation => {
  const now = new Date();
  return {
    id: `quality-${now.getTime().toString(36)}`,
    title: `AI质检语句_${TABLE_NAME}_${formatConversationTime(now)}`,
    projectName: AGENT_PROJECT_NAME,
    attempt: 1,
  };
};

const generateMockRule = (index: number, type: string, priority: string): Rule => ({
  id: Math.floor(Math.random() * 100000).toString(),
  name: `(AI生成) ${type} - 质检规则 ${index + 1}`,
  fieldName: ['F013V_STK487', 'F010V_STK487', 'F012N_STK487'][index % 3],
  groupCategory: type,
  priority,
  qualityType: 'AI质检',
  debugStatus: '未调试',
  errorType: index % 2 === 0 ? '肯定错误' : '可疑错误',
  status: '停用',
  isValid: true,
  author: GENERATED_AUTHORS[index % GENERATED_AUTHORS.length],
  createdAt: new Date().toLocaleString(),
  source: 'AI_GENERATED',
  isGenerated: true,
  isRead: false
});

export default function AiModal({ isOpen, onClose, onRuleGenerated, onComplete }: AiModalProps) {
  const [step, setStep] = useState<'form' | 'generating' | 'completed' | 'cancelled'>('form');
  
  // Form State
  const [selectedType, setSelectedType] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [timingStrategy, setTimingStrategy] = useState('09:00:00');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [previewOption, setPreviewOption] = useState<PriorityOption | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [agentConversation, setAgentConversation] = useState<AgentConversation | null>(null);
  
  // Generation State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const priorityOptions = getPriorityOptions(selectedType, selectedDoc);
  const canSubmit = Boolean(selectedType && selectedDoc && selectedPriority && timingStrategy.trim());

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setSelectedType('');
      setSelectedDoc('');
      setSelectedPriority('');
      setTimingStrategy('09:00:00');
      setElapsedTime(0);
      setIsTypeDropdownOpen(false);
      setIsPriorityDropdownOpen(false);
      setPreviewOption(null);
      setHasSubmitted(false);
      setAgentConversation(null);
      setGeneratedCount(0);
      clearTimer();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!selectedType || !selectedDoc) {
      setSelectedPriority('');
      return;
    }

    if (priorityOptions.length === 1) {
      setSelectedPriority(priorityOptions[0].value);
      return;
    }

    setSelectedPriority((current) =>
      priorityOptions.some((option) => option.value === current) ? current : '',
    );
  }, [isOpen, selectedDoc, selectedType]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (elapsedTimeTimerRef.current) {
      clearInterval(elapsedTimeTimerRef.current);
      elapsedTimeTimerRef.current = null;
    }
  };

  const startGeneration = (isRetry = false) => {
    setHasSubmitted(true);
    if (!canSubmit) return;

    setAgentConversation((current) =>
      isRetry && current
        ? {
            ...current,
            attempt: current.attempt + 1,
          }
        : createAgentConversation(),
    );

    setStep('generating');
    setElapsedTime(0);
    setGeneratedCount(0);
    
    const startTime = Date.now();
    elapsedTimeTimerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    let rulesGenerated = 0;
    const totalRules = 10;
    let logCounter = 0;
    
    timerRef.current = setInterval(() => {
      logCounter++;
      
      if (logCounter > 2 && rulesGenerated < totalRules) {
          const newRule = generateMockRule(rulesGenerated, selectedType, selectedPriority);
          onRuleGenerated(newRule);
          rulesGenerated++;
          setGeneratedCount(rulesGenerated);
      } else if (logCounter > totalRules + 3) {
          clearTimer();
          setStep('completed');
          return;
      }
    }, 600); 
  };

  const handleCancel = () => {
    clearTimer();
    setStep('cancelled');
  };

  const handleBackToForm = () => {
    setStep('form');
    setElapsedTime(0);
    setGeneratedCount(0);
    setAgentConversation(null);
  };

  const openAgentDetails = () => {
    if (!agentConversation) return;
    const url = new URL(AGENT_DETAIL_URL);
    url.searchParams.set('project', agentConversation.projectName);
    url.searchParams.set('conversationId', agentConversation.id);
    url.searchParams.set('run', String(agentConversation.attempt));
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const handleComplete = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={step === 'form' ? onClose : undefined} />
      
      <div className={`relative z-10 flex max-w-[calc(100vw-40px)] flex-col rounded-lg bg-white shadow-xl animate-in fade-in zoom-in duration-200 ${
        step === 'form' ? 'w-[700px]' : 'w-[600px]'
      }`}>
        
        <div className={`flex items-center justify-between px-6 py-4 ${step === 'form' ? '' : 'border-b border-gray-100'}`}>
          <h2 className={step === 'form' ? 'text-[18px] font-semibold text-[#1f1f1f]' : 'text-[17px] font-medium text-gray-900'}>
            {step === 'form' ? 'AI 新建语句' : '数据部Agent 生成质检语句'}
          </h2>
          {step === 'form' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {step === 'form' ? (
          <div className="px-7 pb-7">
            <div className="space-y-7">
              <Field label="质检语句类型" required invalid={hasSubmitted && !selectedType} showHelp>
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isTypeDropdownOpen}
                    onClick={() => {
                      setIsTypeDropdownOpen((open) => !open);
                      setIsPriorityDropdownOpen(false);
                    }}
                    className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-left text-[14px] outline-none transition ${
                      hasSubmitted && !selectedType ? 'border-red-300' : 'border-[#d9d9d9] focus:border-[#1677ff]'
                    } ${selectedType ? 'text-[#262626]' : 'text-[#bfbfbf]'}`}
                  >
                    <span>{selectedType || '请选择质检语句类型'}</span>
                    <ChevronDown className="h-4 w-4 text-[#bfbfbf]" />
                  </button>
                
                  {isTypeDropdownOpen && (
                    <div role="listbox" className="absolute left-0 top-[42px] z-20 max-h-[230px] w-full overflow-y-auto rounded-md border border-[#d9d9d9] bg-white py-1 shadow-lg">
                      {QUALITY_TYPES.map((type) => (
                        <button
                          key={type.label}
                          type="button"
                          role="option"
                          aria-selected={selectedType === type.label}
                          onClick={() => {
                            setSelectedType(type.label);
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`block w-full px-3 py-2 text-left text-[14px] transition hover:bg-[#e6f4ff] hover:text-[#0958d9] ${
                            type.group % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <Field label="规划文档" required invalid={hasSubmitted && !selectedDoc}>
                <div className="relative">
                  <select
                    value={selectedDoc}
                    onChange={(event) => setSelectedDoc(event.target.value)}
                    className={`h-9 w-full appearance-none rounded-md border bg-white px-3 text-[14px] outline-none transition ${
                      selectedDoc ? 'text-[#262626]' : 'text-[#bfbfbf]'
                    } ${hasSubmitted && !selectedDoc ? 'border-red-300' : 'border-[#d9d9d9] focus:border-[#1677ff]'}`}
                  >
                    <option value="">请选择规划文档</option>
                    {DOCS.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bfbfbf]" />
                </div>
              </Field>

              <div className="grid grid-cols-[minmax(0,1fr)_136px] gap-48">
                <Field label="优先级" required invalid={hasSubmitted && !selectedPriority}>
                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isPriorityDropdownOpen}
                      onClick={() => {
                        setIsPriorityDropdownOpen((open) => !open);
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-left text-[14px] outline-none transition ${
                        hasSubmitted && !selectedPriority ? 'border-red-300' : 'border-[#d9d9d9] focus:border-[#1677ff]'
                      } ${selectedPriority ? 'text-[#262626]' : 'text-[#bfbfbf]'}`}
                    >
                      <span>{selectedPriority || '请选择优先级'}</span>
                      <ChevronDown className="h-4 w-4 text-[#bfbfbf]" />
                    </button>

                    {isPriorityDropdownOpen && (
                      <div role="listbox" className="absolute left-0 top-[42px] z-30 w-full overflow-hidden rounded-md border border-[#d9d9d9] bg-white py-1 shadow-lg">
                        {priorityOptions.map((option) => (
                          <div key={option.value} className="flex items-center bg-white transition hover:bg-[#e6f4ff]">
                            <button
                              type="button"
                              role="option"
                              aria-selected={selectedPriority === option.value}
                              onClick={() => {
                                setSelectedPriority(option.value);
                                setIsPriorityDropdownOpen(false);
                              }}
                              className={`min-w-0 flex-1 px-3 py-2 text-left text-[14px] ${
                                selectedPriority === option.value ? 'font-medium text-[#0958d9]' : 'text-[#262626]'
                              }`}
                            >
                              {option.value}
                            </button>
                            <button
                              type="button"
                              aria-label={`预览 ${option.value} 表字段`}
                              title="预览表字段"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPreviewOption(option);
                              }}
                              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8c8c8c] transition hover:bg-white hover:text-[#1677ff]"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="定时策略" required invalid={hasSubmitted && !timingStrategy.trim()}>
                  <div className="relative">
                    <input
                      type="text"
                      value={timingStrategy}
                      onChange={(event) => setTimingStrategy(event.target.value)}
                      className={`h-9 w-full rounded-md border px-3 pr-9 text-[14px] text-[#262626] outline-none transition ${
                        hasSubmitted && !timingStrategy.trim() ? 'border-red-300' : 'border-[#d9d9d9] focus:border-[#1677ff]'
                      }`}
                    />
                    <Clock className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bfbfbf]" />
                  </div>
                </Field>
              </div>
            </div>

            {hasSubmitted && !canSubmit && <div className="mt-4 text-xs text-red-500">请先补全必填项。</div>}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-md border border-[#d9d9d9] bg-white px-5 text-[14px] text-[#262626] transition hover:border-[#1677ff] hover:text-[#1677ff]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => startGeneration()}
                className="h-9 rounded-md bg-[#1677ff] px-5 text-[14px] text-white transition hover:bg-[#0958d9]"
              >
                生成
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-[300px] px-8 py-8">
              {agentConversation && (
                <AgentRunPanel
                  status={step}
                  conversation={agentConversation}
                  generatedCount={generatedCount}
                  elapsedTime={elapsedTime}
                  onOpenAgent={openAgentDetails}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-lg border-t border-gray-100 bg-white px-6 py-4">
              {step === 'generating' ? (
                <button onClick={handleCancel} className="rounded border border-gray-300 px-6 py-1.5 text-[14px] text-gray-700 transition hover:bg-gray-50">
                  取消生成
                </button>
              ) : step === 'completed' ? (
                <button onClick={handleComplete} className="flex items-center gap-2 rounded bg-blue-600 px-6 py-1.5 text-[14px] text-white transition hover:bg-blue-700">
                  完成
                </button>
              ) : step === 'cancelled' ? (
                <>
                  <button onClick={handleBackToForm} className="rounded border border-gray-300 px-6 py-1.5 text-[14px] text-gray-700 transition hover:bg-gray-50">
                    返回修改
                  </button>
                  <button onClick={() => startGeneration(true)} className="flex items-center gap-2 rounded bg-blue-600 px-5 py-1.5 text-[14px] text-white transition hover:bg-blue-700">
                    <RotateCcw className="h-4 w-4" />
                    重新运行
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}

        {previewOption && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-5" onClick={() => setPreviewOption(null)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${previewOption.value} 表字段预览`}
              className="w-[720px] max-w-full overflow-hidden rounded-lg bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h3 className="text-[16px] font-medium text-gray-900">表字段预览</h3>
                  <p className="mt-1 text-xs text-gray-500">{selectedType} · {selectedDoc} · {previewOption.value}</p>
                </div>
                <button
                  type="button"
                  aria-label="关闭字段预览"
                  onClick={() => setPreviewOption(null)}
                  className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[420px] overflow-auto p-6">
                <div className="overflow-hidden rounded border border-gray-200">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-2.5 font-medium">字段名</th>
                        <th className="border-b border-gray-200 px-4 py-2.5 font-medium">中文名</th>
                        <th className="border-b border-gray-200 px-4 py-2.5 font-medium">类型</th>
                        <th className="border-b border-gray-200 px-4 py-2.5 font-medium">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewOption.fields.map((field) => (
                        <tr key={field.code} className="text-gray-700">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-blue-700">{field.code}</td>
                          <td className="whitespace-nowrap px-4 py-3">{field.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500">{field.dataType}</td>
                          <td className="px-4 py-3 text-gray-500">{field.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setPreviewOption(null)}
                  className="rounded border border-gray-300 px-5 py-1.5 text-[14px] text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Field({
  label,
  required,
  invalid,
  showHelp,
  children,
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
  showHelp?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-[14px] font-medium text-[#262626]">
        {required && <span className="text-red-500">*</span>}
        <span>{label}</span>
        {showHelp && <HelpCircle className="h-3.5 w-3.5 text-[#8c8c8c]" />}
      </label>
      {children}
      {invalid && <div className="text-xs text-red-500">请选择{label}</div>}
    </div>
  );
}

function AgentRunPanel({
  status,
  conversation,
  generatedCount,
  elapsedTime,
  onOpenAgent,
}: {
  status: 'generating' | 'completed' | 'cancelled';
  conversation: AgentConversation;
  generatedCount: number;
  elapsedTime: number;
  onOpenAgent: () => void;
}) {
  const isRunning = status === 'generating';
  const isCompleted = status === 'completed';

  const statusLabel = isRunning ? '运行中' : isCompleted ? '已完成' : '已停止';

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isCompleted ? 'bg-emerald-50 text-emerald-600' : status === 'cancelled' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'
          }`}>
            {isRunning ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Square className="h-4 w-4" />}
          </div>
        <span className="text-[15px] font-semibold text-gray-900">{statusLabel}</span>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500">
          <span className="h-3.5 w-px bg-gray-200" aria-hidden="true" />
          <span>{isRunning ? '已运行' : '用时'} <span className="font-mono tabular-nums text-gray-700">{elapsedTime}s</span></span>
          <span className="h-3.5 w-px bg-gray-200" aria-hidden="true" />
          <span>已生成 <span className="font-mono tabular-nums text-gray-700">{generatedCount}</span> 条语句</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white text-[13px]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <span className="w-16 shrink-0 text-gray-400">项目</span>
          <span className="min-w-0 flex-1 text-gray-700">{conversation.projectName}</span>
          <button
            type="button"
            onClick={onOpenAgent}
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded px-2.5 font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            查看 Agent 运行详情
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-start gap-3 px-4 py-3">
          <span className="w-16 shrink-0 text-gray-400">名称</span>
          <span className="min-w-0 break-all leading-5 text-gray-700" title={conversation.title}>{conversation.title}</span>
        </div>
      </div>
    </div>
  );
}
