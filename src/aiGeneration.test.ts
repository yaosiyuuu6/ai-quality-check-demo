import assert from 'node:assert/strict';
import { buildGeneratedRule, buildPlannerInputSentence, buildPlannerTaskSummary } from './aiGeneration';

const task = {
  qualityType: 'A股',
  documentName: '港股股权激励处理方案',
  priority: 'A股-研发支出1',
  timingStrategy: '09:00:00',
};

const firstRule = buildGeneratedRule(0, task, 1710000000000);
const secondRule = buildGeneratedRule(1, task, 1710000000000);

assert.equal(firstRule.priority, 'A股-研发支出1');
assert.equal(secondRule.priority, 'A股-研发支出1');
assert.equal(firstRule.qualityType, 'AI质检');
assert.equal(firstRule.source, 'AI_GENERATED');
assert.equal(firstRule.isRead, false);
assert.equal(firstRule.groupCategory, '国财-A股组');
assert.equal(secondRule.groupCategory, '国财-A股组');

assert.equal(buildPlannerTaskSummary(task), 'A股 / 港股股权激励处理方案 / 优先级 A股-研发支出1 / 09:00:00');
assert.equal(
  buildPlannerInputSentence(task),
  '基于港股股权激励处理方案规划文档和A股-研发支出1的优先级，使用质检语句生成 skill，模式为Agent mode，生成A股质检语句，不要出现和当前表下已有语句重复的语句。',
);

console.log('ai generation task checks passed');
