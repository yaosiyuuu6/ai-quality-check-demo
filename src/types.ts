export interface Rule {
  id: string;
  name: string;
  fieldName: string;
  groupCategory: string;
  priority: number | string;
  qualityType: '规则质检' | 'AI质检';
  debugStatus: string;
  errorType: string;
  status: '正常' | '异常' | '停用';
  isValid: boolean;
  author: string;
  createdAt: string;
  source?: 'AI_GENERATED' | 'MANUAL';
  isGenerated?: boolean;
  isRead?: boolean;
  duplicateRisk?: 'possible' | 'none';
  duplicateReason?: string;
  duplicateMatchIds?: string[];
  duplicateCheckedAt?: string;
  manualReviewStatus?: 'kept';
}

export interface DuplicateMatch {
  ruleId: string;
  ruleName: string;
  fieldName: string;
  reason: string;
}

export interface AiGenerationTask {
  qualityType: string;
  documentName: string;
  priority: string;
  timingStrategy: string;
}

export interface RuleFormData {
  name: string;
  categoryType: '组' | '宏观节点';
  categoryValue: string;
  fieldName: string;
  priority: number | string;
  errorType: string;
  qualityType: '规则质检' | 'AI质检';
  timingStrategy: string;
  prompt?: string;
  sqlTab: '基础语句' | '日常语句';
  sqlContent: string;
  modelValidationField?: string;
}
