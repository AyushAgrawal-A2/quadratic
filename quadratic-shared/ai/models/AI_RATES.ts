import type { AIRates } from 'quadratic-shared/typesAndSchemasAI';

// Pre-margin rates: $3 / $15 / $0.30 / $3.75
// https://docs.anthropic.com/en/docs/about-claude/pricing
export const claude_sonnet_4_6_20260217_rate: AIRates = {
  rate_per_million_input_tokens: 3.6,
  rate_per_million_output_tokens: 18,
  rate_per_million_cache_read_tokens: 0.36,
  rate_per_million_cache_write_tokens: 4.5,
};

// Pre-margin rates: $1.25 / $10 / $0.125 / $4.50
// https://cloud.google.com/vertex-ai/generative-ai/pricing
// https://ai.google.dev/gemini-api/docs/pricing
export const gemini_2_5_pro_rate: AIRates = {
  rate_per_million_input_tokens: 1.5,
  rate_per_million_output_tokens: 12,
  rate_per_million_cache_read_tokens: 0.15,
  rate_per_million_cache_write_tokens: 5.4,
};

// Pre-margin rates: $0.50 / $3 / $0.05 / $1
// https://cloud.google.com/vertex-ai/generative-ai/pricing
// https://ai.google.dev/gemini-api/docs/pricing
export const gemini_3_flash_rate: AIRates = {
  rate_per_million_input_tokens: 0.6,
  rate_per_million_output_tokens: 3.6,
  rate_per_million_cache_read_tokens: 0.06,
  rate_per_million_cache_write_tokens: 1.2,
};

// Pre-margin rates: $2 / $12 / $0.20 / $4.50
// https://cloud.google.com/vertex-ai/generative-ai/pricing
// https://ai.google.dev/gemini-api/docs/pricing
export const gemini_3_1_pro_rate: AIRates = {
  rate_per_million_input_tokens: 2.4,
  rate_per_million_output_tokens: 14.4,
  rate_per_million_cache_read_tokens: 0.24,
  rate_per_million_cache_write_tokens: 5.4,
};

// Pre-margin rates: $0.30 / $2.50 / $0.03 / $1
// https://cloud.google.com/vertex-ai/generative-ai/pricing
// https://ai.google.dev/gemini-api/docs/pricing
export const gemini_2_5_flash_rate: AIRates = {
  rate_per_million_input_tokens: 0.36,
  rate_per_million_output_tokens: 3,
  rate_per_million_cache_read_tokens: 0.036,
  rate_per_million_cache_write_tokens: 1.2,
};

// Pre-margin rates: $0.10 / $0.40 / $0.01 / $1
// https://cloud.google.com/vertex-ai/generative-ai/pricing
// https://ai.google.dev/gemini-api/docs/pricing
export const gemini_2_5_flash_lite_rate: AIRates = {
  rate_per_million_input_tokens: 0.12,
  rate_per_million_output_tokens: 0.48,
  rate_per_million_cache_read_tokens: 0.012,
  rate_per_million_cache_write_tokens: 1.2,
};

// Pre-margin rates: $1 / $5 / $0.10 / $1.25
// https://docs.anthropic.com/en/docs/about-claude/pricing
export const claude_haiku_4_5_20251001_rate: AIRates = {
  rate_per_million_input_tokens: 1.2,
  rate_per_million_output_tokens: 6,
  rate_per_million_cache_read_tokens: 0.12,
  rate_per_million_cache_write_tokens: 1.5,
};

// Pre-margin rates: $5 / $25 / $0.50 / $6.25
// https://docs.anthropic.com/en/docs/about-claude/pricing
export const claude_opus_4_5_20251101_rate: AIRates = {
  rate_per_million_input_tokens: 6,
  rate_per_million_output_tokens: 30,
  rate_per_million_cache_read_tokens: 0.6,
  rate_per_million_cache_write_tokens: 7.5,
};

// Pre-margin rates: $5 / $25 / $0.50 / $6.25
// https://docs.anthropic.com/en/docs/about-claude/pricing
export const claude_opus_4_6_20260205_rate: AIRates = {
  rate_per_million_input_tokens: 6,
  rate_per_million_output_tokens: 30,
  rate_per_million_cache_read_tokens: 0.6,
  rate_per_million_cache_write_tokens: 7.5,
};

// Pre-margin rates: $1.75 / $14 / $0.175 / $0
// https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service
// https://platform.openai.com/docs/pricing
export const gpt_5_2_rate: AIRates = {
  rate_per_million_input_tokens: 2.1,
  rate_per_million_output_tokens: 16.8,
  rate_per_million_cache_read_tokens: 0.21,
  rate_per_million_cache_write_tokens: 0,
};
