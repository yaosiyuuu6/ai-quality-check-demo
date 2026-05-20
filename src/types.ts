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
