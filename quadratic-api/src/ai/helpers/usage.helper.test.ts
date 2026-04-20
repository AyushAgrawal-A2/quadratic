import type { AIUsage } from 'quadratic-shared/typesAndSchemasAI';
import * as envVars from '../../env-vars';
import { calculateUsage } from './usage.helper';

// Claude Sonnet 4.6 rates:
//   rate_per_million_input_tokens: 3.6
//   rate_per_million_output_tokens: 18
//   rate_per_million_cache_read_tokens: 0.36
//   rate_per_million_cache_write_tokens: 4.5
const MODEL_KEY = 'vertexai-anthropic:claude-sonnet-4-6@20260217:thinking-toggle-off' as const;

const baseUsage: AIUsage = {
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens: 200,
  cacheWriteTokens: 100,
  modelKey: MODEL_KEY,
};

// (1000 * 3.6 + 500 * 18 + 200 * 0.36 + 100 * 4.5) / 1_000_000
const BASE_COST = 0.013122;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('calculateUsage', () => {
  it('returns 0 when modelKey is undefined', () => {
    const usage: AIUsage = { ...baseUsage, modelKey: undefined };
    expect(calculateUsage(usage)).toBe(0);
  });

  it('calculates cost correctly with no margin (default)', () => {
    expect(calculateUsage(baseUsage)).toBeCloseTo(BASE_COST, 10);
  });

  it('applies a 5% margin correctly', () => {
    jest.replaceProperty(envVars, 'AI_MARGIN', 0.05);
    const expected = BASE_COST * 1.05;
    expect(calculateUsage(baseUsage)).toBeCloseTo(expected, 10);
  });

  it('applies a 20% margin correctly', () => {
    jest.replaceProperty(envVars, 'AI_MARGIN', 0.2);
    const expected = BASE_COST * 1.2;
    expect(calculateUsage(baseUsage)).toBeCloseTo(expected, 10);
  });

  it('applies a 100% margin (doubles the cost)', () => {
    jest.replaceProperty(envVars, 'AI_MARGIN', 1);
    const expected = BASE_COST * 2;
    expect(calculateUsage(baseUsage)).toBeCloseTo(expected, 10);
  });

  it('returns 0 cost when all token counts are 0', () => {
    const usage: AIUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      modelKey: MODEL_KEY,
    };
    expect(calculateUsage(usage)).toBe(0);
  });

  it('margin does not affect zero cost', () => {
    jest.replaceProperty(envVars, 'AI_MARGIN', 0.5);
    const usage: AIUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      modelKey: MODEL_KEY,
    };
    expect(calculateUsage(usage)).toBe(0);
  });
});
