import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, Copy, ExternalLink, FileText, PanelRightClose, Plus, Send, Sparkles, X } from 'lucide-react';
import { buildGeneratedRule, buildPlannerInputSentence, buildPlannerTaskSummary } from '../aiGeneration';
import { AiGenerationTask, Rule } from '../types';

interface PlannerWorkbenchProps {
  task: AiGenerationTask;
  onClose: () => void;
  onRuleGenerated: (rule: Rule) => Rule;
}

type PlannerMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  detail?: string;
  duplicateReason?: string;
};

const TOTAL_RULES = 10;
const PLANNER_URL = 'https://yaosiyuuu6.github.io/plannerai-demo/';

export default function PlannerWorkbench({ task, onClose, onRuleGenerated }: PlannerWorkbenchProps) {
  const [messages, setMessages] = useState<PlannerMessage[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [draft, setDraft] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const onRuleGeneratedRef = useRef(onRuleGenerated);
  const taskSummary = useMemo(() => buildPlannerTaskSummary(task), [task]);
  const taskInputSentence = useMemo(() => buildPlannerInputSentence(task), [task]);

  useEffect(() => {
    onRuleGeneratedRef.current = onRuleGenerated;
  }, [onRuleGenerated]);

  useEffect(() => {
    clearTimer();
    setMessages([]);
    setGeneratedCount(0);
    setIsRunning(false);
    setIsCompleted(false);
    setHasStarted(false);
    setDraft(taskInputSentence);
  }, [task, taskInputSentence]);

  useEffect(() => {
    if (!isRunning) return;

    let step = 0;
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      step += 1;

      if (step === 1) {
        appendAiMessage('解析规划文档', `读取「${task.documentName}」，提取字段范围、错误类型和已知规则。`);
        return;
      }

      if (step === 2) {
        appendAiMessage('匹配质检语句类型', `已锁定 ${task.qualityType}，本批候选默认使用优先级 ${task.priority}。`);
        return;
      }

      const ruleIndex = step - 3;
      if (ruleIndex >= 0 && ruleIndex < TOTAL_RULES) {
        const checkedRule = onRuleGeneratedRef.current(buildGeneratedRule(ruleIndex, task, startedAt));
        setGeneratedCount((count) => count + 1);
        appendAiMessage(
          `生成第 ${ruleIndex + 1} 条候选语句`,
          checkedRule.duplicateRisk === 'possible'
            ? `已写入规则列表。重复筛查结果：疑似重复，${checkedRule.duplicateReason}`
            : '已写入规则列表。重复筛查结果：暂未发现疑似重复。',
          checkedRule.duplicateReason,
        );
        return;
      }

      appendAiMessage('生成完成', `本次共生成 ${TOTAL_RULES} 条候选语句，均已按「${task.priority}」回填。`);
      setIsRunning(false);
      setIsCompleted(true);
      clearTimer();
    }, 700);

    return clearTimer;
  }, [isRunning, task]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const appendAiMessage = (content: string, detail?: string, duplicateReason?: string) => {
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        role: 'ai',
        content,
        detail,
        duplicateReason,
      },
    ]);
  };

  const handleCancel = () => {
    clearTimer();
    setIsRunning(false);
    appendAiMessage('已取消生成', `当前已生成 ${generatedCount} 条候选语句，已生成内容保留在规则列表。`);
  };

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;

    if (!hasStarted) {
      setMessages([
        {
          id: `${Date.now()}-task`,
          role: 'user',
          content,
        },
        {
          id: `${Date.now()}-init`,
          role: 'ai',
          content: '已接收任务，开始调用质检语句生成 skill。',
          detail: '我会同步执行重复筛查，并把结构化结果回传到规则列表。',
        },
      ]);
      setHasStarted(true);
      setIsCompleted(false);
      setIsRunning(true);
      setDraft('');
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        content,
      },
      {
        id: `${Date.now()}-ai`,
        role: 'ai',
        content: '已记录补充需求',
        detail: 'v1 原型中先展示 PlannerAI 工作台态交互，真实接入后会将该需求传给 PlannerAI skill。',
      },
    ]);
    setDraft('');
  };

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l border-[#dcdcdc] bg-white shadow-[-4px_0_12px_rgba(15,23,42,0.04)] xl:w-[520px]">
      <div className="flex h-[46px] items-center justify-between border-b border-[#dcdcdc] px-4 shadow-[0_1px_5px_rgba(0,0,0,0.08)]">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/plannerai-logo.jpg" alt="PlannerAI" className="h-7 w-8 shrink-0 object-contain" />
          <div className="min-w-0">
            <div className="font-semibold text-[#1f1f1f]">业务管理平台</div>
            <div className="truncate text-xs text-[#8c8c8c]" title={taskSummary}>PlannerAI 工作台</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => window.open(PLANNER_URL, '_blank', 'noopener,noreferrer')}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d9d9d9] bg-white px-2.5 text-xs text-[#595959] transition hover:border-[#1677ff] hover:text-[#1677ff]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            打开平台
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-[#595959] transition hover:bg-[#f5f5f5] hover:text-[#1677ff]" aria-label="收起 PlannerAI">
            <PanelRightClose className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#8c8c8c] transition hover:bg-[#f5f5f5] hover:text-[#262626]"
            aria-label="关闭 PlannerAI"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex items-center gap-3 text-[22px] font-bold text-[#1f1f1f]">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
                  <img src="/plannerai-logo.jpg" alt="" className="h-8 w-8 object-contain" />
                </span>
                早上好，有什么我能帮你的吗？
              </div>
              <p className="max-w-[380px] text-sm leading-6 text-[#8c8c8c]">
                任务已填入下方输入框，点击发送后我再开始执行 skill。
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              <MessageBubble message={message} />
            </div>
          ))}

          {isRunning && (
            <details open className="border-y border-[#f0f0f0] py-3 text-[13px] text-[#8c8c8c]">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[#595959]">
                <Bot className="h-4 w-4 text-[#1677ff]" />
                PlannerAI 正在执行 skill
              </summary>
              <div className="mt-3 grid gap-2 pl-6">
                <WorkStep done label="解析规划文档" />
                <WorkStep done={generatedCount > 0} label="生成质检语句" />
                <WorkStep done={generatedCount > 0} label="执行重复筛查" />
                <WorkStep done={isCompleted} label="回传候选规则" />
              </div>
            </details>
          )}
        </div>
      </div>

      <div className="border-t border-[#f0f0f0] bg-white px-4 py-4">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="继续补充需求，Shift + Enter 换行，支持粘贴上传附件"
            className="h-16 w-full resize-none border-0 text-[14px] text-[#262626] outline-none placeholder:text-[#bfbfbf]"
          />
          <div className="flex h-8 items-center justify-between">
            <div className="flex items-center gap-2 text-[#8c8c8c]">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#f5f5f5] hover:text-[#1677ff]" aria-label="添加附件">
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs">Agent Mode</span>
            </div>
            <div className="flex items-center gap-2">
              {isRunning && (
                <button onClick={handleCancel} className="h-8 rounded-md border border-[#d9d9d9] px-3 text-xs text-[#595959] transition hover:border-[#1677ff] hover:text-[#1677ff]">
                  取消生成
                </button>
              )}
              <button onClick={handleSend} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1677ff] text-white transition hover:bg-[#0958d9]" aria-label="发送">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: PlannerMessage }) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto max-w-[86%] rounded-[10px] bg-[#e6f4ff] px-3.5 py-3 text-[14px] leading-6 text-[#262626]">
        <div>{message.content}</div>
        {message.detail && <div className="mt-1 text-xs text-[#595959]">{message.detail}</div>}
      </div>
    );
  }

  return (
    <div className="w-full py-1 text-[14px] leading-7 text-[#262626]">
      <div className="flex items-start gap-2">
        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6f4ff] text-[#1677ff]">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{message.content}</div>
          {message.detail && <div className="mt-1 text-[13px] text-[#595959]">{message.detail}</div>}
          {message.duplicateReason && (
            <div className="mt-2 rounded-md border border-[#ffd591] bg-[#fff7e6] px-3 py-2 text-xs leading-5 text-[#ad6800]">
              <div className="mb-1 font-medium">疑似重复</div>
              {message.duplicateReason}
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-[#8c8c8c]">
            <button className="rounded-md p-1 transition hover:bg-[#f5f5f5] hover:text-[#595959]" aria-label="复制">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkStep({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-[18px] w-[18px] items-center justify-center rounded border text-[10px] ${done ? 'border-[#1677ff] bg-[#e6f4ff] text-[#1677ff]' : 'border-[#d9d9d9] text-[#8c8c8c]'}`}>
        {done ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
      </span>
      <span className={done ? 'text-[#595959]' : 'text-[#8c8c8c]'}>{label}</span>
    </div>
  );
}
