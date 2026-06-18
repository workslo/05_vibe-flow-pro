import type { ValidationVerdict } from './schemas';
import type { DevelopmentExecutionAdapter } from './engine';

export function createScriptedDevelopmentAdapter(
  verdicts: ValidationVerdict[] = ['revise', 'pass'],
): DevelopmentExecutionAdapter {
  return {
    async createTestPlan({ iteration }) {
      return {
        strategy: `Test the feature contract in iteration ${iteration}.`,
        cases: [
          {
            id: `case-${iteration}`,
            name: 'Feature meets acceptance criteria',
            level: 'integration',
            expectedBehavior: 'The requested behavior is observable.',
          },
        ],
      };
    },
    async createCodeProposal({ iteration, priorFeedback }) {
      return {
        summary: `Code proposal for iteration ${iteration}`,
        files: [
          {
            path: 'src/feature.ts',
            change: priorFeedback.length
              ? `Address feedback: ${priorFeedback.join('; ')}`
              : 'Implement the requested behavior.',
          },
        ],
        assumptions: [],
      };
    },
    async executeTests({ iteration, testPlan }) {
      const verdict = verdicts[Math.min(iteration - 1, verdicts.length - 1)];
      return {
        status: verdict === 'pass' ? 'passed' : 'failed',
        cases: testPlan.cases.map((testCase) => ({
          testCaseId: testCase.id,
          status: verdict === 'pass' ? 'passed' : 'failed',
          evidence:
            verdict === 'pass'
              ? 'Scripted evidence confirms the behavior.'
              : 'Scripted evidence requests one revision.',
        })),
      };
    },
    async validateResult({ iteration }) {
      const verdict = verdicts[Math.min(iteration - 1, verdicts.length - 1)];
      return {
        verdict,
        rationale:
          verdict === 'pass'
            ? 'All acceptance evidence passed.'
            : 'The implementation needs one focused revision.',
        feedback:
          verdict === 'revise'
            ? ['Handle the failed scripted acceptance case.']
            : [],
      };
    },
  };
}
