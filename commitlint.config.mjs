import { RuleConfigSeverity } from '@commitlint/types';

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-empty': [RuleConfigSeverity.Warning, 'never'],
    'type-empty': [RuleConfigSeverity.Warning, 'never'],
  },
};
