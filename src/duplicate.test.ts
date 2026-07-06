import assert from 'node:assert/strict';
import { findDuplicateMatches, applyDuplicateCheck } from './duplicate';
import { Rule } from './types';

const baseRule: Rule = {
  id: 'base-1',
  name: '(T+1)通用语句--编码不存在pub201',
  fieldName: 'F013V_STK487',
  groupCategory: '国财-A股组',
  priority: 4,
  qualityType: '规则质检',
  debugStatus: '未调试',
  errorType: '肯定错误',
  status: '正常',
  isValid: true,
  author: '关玉阁',
  createdAt: '2023/8/16 16:43:43',
};

const differentRule: Rule = {
  ...baseRule,
  id: 'base-2',
  name: '(T+1)日期范围校验',
  fieldName: 'F021D_STK487',
  errorType: '可疑错误',
};

const generatedDuplicate: Rule = {
  ...baseRule,
  id: 'AI-1',
  name: '(AI生成) 编码不存在检查',
  source: 'AI_GENERATED',
  isGenerated: true,
};

const generatedDistinct: Rule = {
  ...generatedDuplicate,
  id: 'AI-2',
  name: '(AI生成) 标签文本长度检查',
  fieldName: 'F099V_STK487',
  errorType: '可疑错误',
};

const matches = findDuplicateMatches(generatedDuplicate, [baseRule, differentRule]);
assert.equal(matches.length, 1);
assert.equal(matches[0].ruleId, 'base-1');
assert.match(matches[0].reason, /字段名称相同/);
assert.match(matches[0].reason, /编码不存在/);
assert.equal('score' in matches[0], false);

const checkedDuplicate = applyDuplicateCheck(generatedDuplicate, [baseRule, differentRule], '2026-06-18 10:00:00');
assert.equal(checkedDuplicate.duplicateRisk, 'possible');
assert.deepEqual(checkedDuplicate.duplicateMatchIds, ['base-1']);
assert.equal(checkedDuplicate.duplicateCheckedAt, '2026-06-18 10:00:00');

const checkedDistinct = applyDuplicateCheck(generatedDistinct, [baseRule, differentRule], '2026-06-18 10:01:00');
assert.equal(checkedDistinct.duplicateRisk, 'none');
assert.deepEqual(checkedDistinct.duplicateMatchIds, []);
assert.equal(checkedDistinct.duplicateReason, undefined);

console.log('duplicate checks passed');
