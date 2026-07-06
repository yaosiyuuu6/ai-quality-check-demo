import { AiGenerationTask, Rule } from './types';

const GENERATED_AUTHORS = ['张三', '李四', '王五', '赵六', '钱七'];

const GENERATED_RULES = [
  { name: '编码不存在检查', fieldName: 'F013V_STK487', errorType: '肯定错误' },
  { name: '项目公布名称为空检查', fieldName: 'F010V_STK487', errorType: '肯定错误' },
  { name: '报表类型编码不存在', fieldName: 'F006V_STK487', errorType: '肯定错误' },
  { name: '合计值为负数异常', fieldName: 'F012N_STK487', errorType: '可疑错误' },
  { name: '项目公布名称格式异常', fieldName: 'F010V_STK487', errorType: '可疑错误' },
  { name: '字段枚举值超出范围', fieldName: 'F030V_STK487', errorType: '可疑错误' },
  { name: '备注文本含特殊符号', fieldName: 'F031V_STK487', errorType: '可疑错误' },
  { name: '更新时间缺失检查', fieldName: 'F032D_STK487', errorType: '肯定错误' },
  { name: '扩展属性JSON解析失败', fieldName: 'F033V_STK487', errorType: '可疑错误' },
  { name: '来源系统编码为空', fieldName: 'F034V_STK487', errorType: '肯定错误' },
];

export const buildGeneratedRule = (index: number, task: AiGenerationTask, timestamp = Date.now()): Rule => {
  const template = GENERATED_RULES[index % GENERATED_RULES.length];

  return {
    id: `AI-${timestamp}-${index + 1}`,
    name: `(AI生成) ${template.name}`,
    fieldName: template.fieldName,
    groupCategory: index < 5 ? '国财-A股组' : task.qualityType,
    priority: task.priority,
    qualityType: 'AI质检',
    debugStatus: '未调试',
    errorType: template.errorType as Rule['errorType'],
    status: '停用',
    isValid: true,
    author: GENERATED_AUTHORS[index % GENERATED_AUTHORS.length],
    createdAt: new Date(timestamp + index * 1000).toLocaleString(),
    source: 'AI_GENERATED',
    isGenerated: true,
    isRead: false,
  };
};

export const buildPlannerTaskSummary = (task: AiGenerationTask) =>
  `${task.qualityType} / ${task.documentName} / 优先级 ${task.priority} / ${task.timingStrategy}`;

export const buildPlannerInputSentence = (task: AiGenerationTask) =>
  `基于${task.documentName}规划文档和${task.priority}的优先级，使用质检语句生成 skill，模式为Agent mode，生成${task.qualityType}质检语句，不要出现和当前表下已有语句重复的语句。`;
