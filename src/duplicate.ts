import { DuplicateMatch, Rule } from './types';

const DUPLICATE_KEYWORDS = ['编码不存在', '不存在', '为空', '日期', '合计值', '格式异常', '机构ID', '报表类型'];

const normalizeName = (name: string) =>
  name
    .replace(/\(AI生成\)/g, '')
    .replace(/\(T\+1\)/g, '')
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '')
    .toLowerCase();

const getMatchedKeywords = (leftName: string, rightName: string) => {
  const left = normalizeName(leftName);
  const right = normalizeName(rightName);
  return DUPLICATE_KEYWORDS.filter((keyword) => left.includes(normalizeName(keyword)) && right.includes(normalizeName(keyword)));
};

const buildReason = (target: Rule, candidate: Rule) => {
  const reasons: string[] = [];
  const matchedKeywords = getMatchedKeywords(target.name, candidate.name);

  if (target.fieldName === candidate.fieldName) reasons.push('字段名称相同');
  if (matchedKeywords.length > 0) reasons.push(`语句名称均包含“${matchedKeywords[0]}”`);
  if (target.errorType === candidate.errorType) reasons.push('错误类型相同');
  if (target.groupCategory === candidate.groupCategory) reasons.push('分类相同');

  return reasons;
};

const isDuplicateCandidate = (target: Rule, candidate: Rule) => {
  if (target.id === candidate.id) return false;
  const reasons = buildReason(target, candidate);
  const hasSameField = reasons.includes('字段名称相同');
  const hasNameSignal = reasons.some((reason) => reason.startsWith('语句名称均包含'));

  return (hasSameField && hasNameSignal) || (hasSameField && reasons.includes('错误类型相同') && reasons.includes('分类相同'));
};

export const findDuplicateMatches = (target: Rule, candidates: Rule[]): DuplicateMatch[] =>
  candidates
    .filter((candidate) => isDuplicateCandidate(target, candidate))
    .map((candidate) => ({
      ruleId: candidate.id,
      ruleName: candidate.name,
      fieldName: candidate.fieldName,
      reason: buildReason(target, candidate).join('；'),
    }));

export const applyDuplicateCheck = (target: Rule, candidates: Rule[], checkedAt = new Date().toLocaleString()): Rule => {
  const matches = findDuplicateMatches(target, candidates);

  if (matches.length === 0) {
    const { duplicateReason, ...rest } = target;
    return {
      ...rest,
      duplicateRisk: 'none',
      duplicateMatchIds: [],
      duplicateCheckedAt: checkedAt,
    };
  }

  return {
    ...target,
    duplicateRisk: 'possible',
    duplicateReason: matches[0].reason,
    duplicateMatchIds: matches.map((match) => match.ruleId),
    duplicateCheckedAt: checkedAt,
  };
};
