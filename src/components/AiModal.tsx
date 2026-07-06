import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock, HelpCircle, X } from 'lucide-react';
import { AiGenerationTask } from '../types';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (task: AiGenerationTask) => void;
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

const DOCS = ['港股股权激励处理方案', '上市公司2023年报披露要求.pdf', '各类理财产品质检规划_v2.docx', '债券存续期规则v1.1.pdf'];
const PRIORITIES = ['A股-研发支出1', 'A股-研发支出2'];

export default function AiModal({ isOpen, onClose, onStart }: AiModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [timingStrategy, setTimingStrategy] = useState('09:00:00');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(selectedType && selectedDoc && selectedPriority && timingStrategy.trim()),
    [selectedType, selectedDoc, selectedPriority, timingStrategy],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedType('');
      setSelectedDoc('');
      setSelectedPriority('');
      setTimingStrategy('09:00:00');
      setIsTypeDropdownOpen(false);
      setHasSubmitted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        handleStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSubmit, isOpen, onClose, selectedDoc, selectedPriority, selectedType, timingStrategy]);

  const handleStart = () => {
    setHasSubmitted(true);
    if (!canSubmit) return;

    onStart({
      qualityType: selectedType,
      documentName: selectedDoc,
      priority: selectedPriority,
      timingStrategy: timingStrategy.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative z-10 w-[700px] max-w-[calc(100vw-40px)] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[18px] font-semibold text-[#1f1f1f]">AI 新建语句</h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-7 pb-7">
          <div className="space-y-7">
            <Field label="质检语句类型" required invalid={hasSubmitted && !selectedType}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTypeDropdownOpen((open) => !open)}
                  className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-left text-[14px] outline-none transition ${
                    hasSubmitted && !selectedType ? 'border-red-300' : 'border-[#d9d9d9] focus:border-[#1677ff]'
                  } ${selectedType ? 'text-[#262626]' : 'text-[#bfbfbf]'}`}
                >
                  <span>{selectedType || '请选择质检语句类型'}</span>
                  <ChevronDown className="h-4 w-4 text-[#bfbfbf]" />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute left-0 top-[42px] z-20 max-h-[230px] w-full overflow-y-auto rounded-md border border-[#d9d9d9] bg-white py-1 shadow-lg">
                    {QUALITY_TYPES.map((type) => (
                      <button
                        key={type.label}
                        type="button"
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
                  {DOCS.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bfbfbf]" />
              </div>
            </Field>

            <div className="grid grid-cols-[1fr_136px] gap-48">
              <Field label="优先级" required invalid={hasSubmitted && !selectedPriority}>
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(event) => setSelectedPriority(event.target.value)}
                    className={`h-9 w-full appearance-none rounded-md border bg-white px-3 text-[14px] outline-none transition ${
                      selectedPriority ? 'text-[#262626]' : 'text-[#bfbfbf]'
                    } ${hasSubmitted && !selectedPriority ? 'border-red-300' : 'border-[#d9d9d9] focus:border-[#1677ff]'}`}
                  >
                    <option value="">请选择优先级</option>
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bfbfbf]" />
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
              onClick={onClose}
              className="h-9 rounded-md border border-[#d9d9d9] bg-white px-5 text-[14px] text-[#262626] transition hover:border-[#1677ff] hover:text-[#1677ff]"
            >
              取消
            </button>
            <button
              onClick={handleStart}
              className="h-9 rounded-md bg-[#1677ff] px-5 text-[14px] text-white transition hover:bg-[#0958d9]"
            >
              生成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  invalid,
  children,
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-[14px] font-medium text-[#262626]">
        {required && <span className="text-red-500">*</span>}
        <span>{label}</span>
        {label === '质检语句类型' && <HelpCircle className="h-3.5 w-3.5 text-[#8c8c8c]" />}
      </label>
      {children}
      {invalid && <div className="text-xs text-red-500">请选择{label}</div>}
    </div>
  );
}
