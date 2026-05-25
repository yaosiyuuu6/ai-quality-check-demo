import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
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

const DOCS = ['上市公司2023年报披露要求.pdf', '各类理财产品质检规划_v2.docx', '债券存续期规则v1.1.pdf'];
const GENERATED_AUTHORS = ['张三', '李四', '王五', '赵六', '钱七'];

const generateMockRule = (index: number, type: string): Rule => ({
  id: Math.floor(Math.random() * 100000).toString(),
  name: `(AI生成) ${type} - 质检规则 ${index + 1}`,
  fieldName: ['F013V_STK487', 'F010V_STK487', 'F012N_STK487'][index % 3],
  groupCategory: type,
  priority: [1, 2, 3, 4][index % 4] as any,
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
  const [step, setStep] = useState<'form' | 'generating' | 'completed'>('form');
  
  // Form State
  const [selectedType, setSelectedType] = useState(QUALITY_TYPES[0].label);
  const [selectedDoc, setSelectedDoc] = useState(DOCS[0]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  // Generation State
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setLogs([]);
      setElapsedTime(0);
      setIsTypeDropdownOpen(false);
      clearTimer();
    }
  }, [isOpen]);

  useEffect(() => {
    if (logsContainerRef.current) {
        logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

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

  const startGeneration = () => {
    setStep('generating');
    setLogs([]);
    setElapsedTime(0);
    
    const startTime = Date.now();
    elapsedTimeTimerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    let rulesGenerated = 0;
    const totalRules = 10;
    let logCounter = 0;
    
    timerRef.current = setInterval(() => {
      logCounter++;
      
      let newLog = "";
      if (logCounter === 1) newLog = `解析规划文档: ${selectedDoc}`;
      else if (logCounter === 2) newLog = `开始批量生成 ${selectedType} 的质检语句...`;
      else if (logCounter > 2 && rulesGenerated < totalRules) {
          newLog = `生成第 ${rulesGenerated + 1} 条质检语句...`;
          const newRule = generateMockRule(rulesGenerated, selectedType);
          onRuleGenerated(newRule);
          rulesGenerated++;
      } else if (rulesGenerated >= totalRules && logCounter === totalRules + 3) {
          newLog = "所有语句生成校验完成。";
      } else if (logCounter > totalRules + 3) {
          clearTimer();
          setStep('completed');
          return;
      }

      if (newLog) {
          setLogs(prev => [...prev, newLog]);
      }
    }, 600); 
  };

  const handleCancel = () => {
    clearTimer();
    setStep('form');
    setLogs([]);
    setElapsedTime(0);
  };

  const handleComplete = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={step === 'form' ? onClose : undefined} />
      
      <div className="bg-white rounded-lg shadow-xl w-[600px] flex flex-col relative z-10 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[17px] font-medium text-gray-900">
            AI新建语句
          </h2>
          {step === 'form' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-md">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-8 py-8 min-h-[300px]">
          {step === 'form' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-gray-700 font-medium">质检语句类型</label>
                <div 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 cursor-pointer flex justify-between items-center"
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                >
                  <span className="text-[14px] text-gray-800">{selectedType}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                
                {isTypeDropdownOpen && (
                  <div className="absolute top-[70px] left-0 w-full max-h-[220px] overflow-y-auto bg-white border border-gray-200 rounded shadow-lg z-20">
                    {QUALITY_TYPES.map((type) => (
                      <div 
                        key={type.label}
                        onClick={() => {
                          setSelectedType(type.label);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`px-4 py-2 cursor-pointer text-[14px] transition-colors
                          ${type.group % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'} 
                          hover:bg-blue-50 hover:text-blue-600
                        `}
                      >
                        {type.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium">规划文档</label>
                <div className="relative">
                  <select 
                    value={selectedDoc}
                    onChange={(e) => setSelectedDoc(e.target.value)}
                    className="w-full appearance-none px-3 py-2 border border-gray-300 rounded text-[14px] text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {DOCS.map(doc => <option key={doc} value={doc}>{doc}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Status Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  {step === 'generating' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                  {step === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  <span>{step === 'generating' ? '正在生成...' : '生成完成'}</span>
                </div>
                <div className="text-[13px] text-gray-500 font-mono">
                  运行时间: {elapsedTime}s
                </div>
              </div>

              {/* Streaming Logs Box */}
              <div 
                ref={logsContainerRef}
                className="flex-1 bg-[#1E1E1E] rounded-md p-4 h-[200px] overflow-y-auto font-mono text-[13px] scroll-smooth"
              >
                {logs.map((log, i) => (
                  <div key={i} className="text-emerald-400 opacity-90 leading-relaxed animate-in fade-in slide-in-from-bottom-1 blur-in">
                    <span className="text-gray-500 mr-2">&gt;</span> {log}
                  </div>
                ))}
                {step === 'generating' && (
                  <div className="text-gray-400 mt-2 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> 处理中...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-lg">
          {step === 'form' ? (
            <>
              <button onClick={onClose} className="px-6 py-1.5 text-[14px] text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition">
                取消
              </button>
              <button onClick={startGeneration} className="px-6 py-1.5 text-[14px] text-white bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-2">
                生成
              </button>
            </>
          ) : step === 'generating' ? (
            <button onClick={handleCancel} className="px-6 py-1.5 text-[14px] text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition">
              取消生成
            </button>
          ) : step === 'completed' ? (
            <button onClick={handleComplete} className="px-6 py-1.5 text-[14px] text-white bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-2">
              完成
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}
