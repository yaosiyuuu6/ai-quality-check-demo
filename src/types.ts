export interface Rule {
  id: string;
  name: string;
  fieldName: string;
  groupCategory: string;
  priority: number;
  qualityType: '规则质检' | 'AI质检';
  debugStatus: string;
  errorType: string;
  status: '正常' | '异常';
  isValid: boolean;
  author: string;
  createdAt: string;
  isGenerated?: boolean;
  isRead?: boolean;
  source?: 'AI_GENERATED' | 'MANUAL';
  relatedSessionId?: string;
  businessBatchId?: string;
  planningDocId?: string;
  qualityCategory?: string;
  creatorEmployeeId?: string;
  creatorDepartmentId?: string;
  viewedAt?: string;
  editedAt?: string;
  savedAt?: string;
  deletedAt?: string;
  enabledAt?: string;
  disabledAt?: string;
  wasModified?: boolean;
  generatedSnapshot?: RuleSnapshot;
  savedSnapshot?: RuleSnapshot;
}

export interface RuleFormData {
  name: string;
  categoryType: '组' | '宏观节点';
  categoryValue: string;
  fieldName: string;
  priority: number;
  errorType: string;
  qualityType: '规则质检' | 'AI质检';
  timingStrategy: string;
  prompt?: string;
  sqlTab: '基础语句' | '日常语句';
  sqlContent: string;
  modelValidationField?: string;
}

export interface Employee {
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  role: 'manager' | 'product' | 'employee';
}

export interface RuleSnapshot {
  name: string;
  fieldName: string;
  groupCategory: string;
  priority: number;
  errorType: string;
  qualityType: '规则质检' | 'AI质检';
  isValid: boolean;
  status: '正常' | '异常';
}

export type AiUsageEventType =
  | 'ai_entry_click'
  | 'ai_generation_start'
  | 'ai_generation_cancel'
  | 'ai_generation_complete'
  | 'ai_rule_view'
  | 'ai_rule_edit_start'
  | 'ai_rule_save'
  | 'ai_rule_delete'
  | 'ai_rule_enable'
  | 'ai_rule_disable'
  | 'manual_rule_create'
  | 'manual_rule_save'
  | 'ai_debug_run'
  | 'ai_debug_success'
  | 'ai_debug_fail';

export interface AiUsageEvent {
  eventId: string;
  eventType: AiUsageEventType;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  sessionId?: string;
  ruleId?: string;
  businessBatchId?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
}

export interface AiGenerationSession {
  sessionId: string;
  businessBatchId: string;
  planningDocId: string;
  qualityCategory: string;
  groupName: string;
  fieldScope: string[];
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  startedAt: string;
  endedAt?: string;
  status: 'started' | 'completed' | 'canceled' | 'failed';
  generatedCount: number;
  durationMs?: number;
}
