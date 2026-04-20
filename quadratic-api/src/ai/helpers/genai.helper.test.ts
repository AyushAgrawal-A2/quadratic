import { Type } from '@google/genai';
import type { AIToolArgsArray, AIToolArgsPrimitive } from 'quadratic-shared/typesAndSchemasAI';
import { convertParametersToGenAISchema } from './genai.helper';

describe('convertParametersToGenAISchema', () => {
  describe('nullable array type', () => {
    it('should handle nullable array type ["array", "null"]', () => {
      const parameter: AIToolArgsArray = {
        type: ['array', 'null'],
        items: {
          type: 'string',
          description: 'A string item',
        },
      };

      const result = convertParametersToGenAISchema(parameter);

      expect(result).toEqual({
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: 'A string item',
        },
        nullable: true,
      });
    });

    it('should handle nullable array with nested object items', () => {
      const parameter: AIToolArgsArray = {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name field' },
            count: { type: 'number', description: 'Count field' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      };

      const result = convertParametersToGenAISchema(parameter);

      expect(result).toEqual({
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Name field' },
            count: { type: Type.NUMBER, description: 'Count field' },
          },
          required: ['name'],
        },
        nullable: true,
      });
    });

    it('should handle nullable array with nested array items', () => {
      const parameter: AIToolArgsArray = {
        type: ['array', 'null'],
        items: {
          type: 'array',
          items: {
            type: 'number',
            description: 'A number',
          },
        },
      };

      const result = convertParametersToGenAISchema(parameter);

      expect(result).toEqual({
        type: Type.ARRAY,
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.NUMBER,
            description: 'A number',
          },
        },
        nullable: true,
      });
    });
  });

  describe('non-nullable array type', () => {
    it('should handle regular array type', () => {
      const parameter: AIToolArgsArray = {
        type: 'array',
        items: {
          type: 'boolean',
          description: 'A boolean item',
        },
      };

      const result = convertParametersToGenAISchema(parameter);

      expect(result).toEqual({
        type: Type.ARRAY,
        items: {
          type: Type.BOOLEAN,
          description: 'A boolean item',
        },
      });
    });
  });

  describe('nullable primitive types', () => {
    it('should handle nullable string type ["string", "null"]', () => {
      const parameter: AIToolArgsPrimitive = {
        type: ['string', 'null'],
        description: 'A nullable string',
      };

      const result = convertParametersToGenAISchema(parameter);

      expect(result).toEqual({
        type: Type.STRING,
        nullable: true,
        description: 'A nullable string',
      });
    });

    it('should handle nullable boolean type ["boolean", "null"]', () => {
      const parameter: AIToolArgsPrimitive = {
        type: ['boolean', 'null'],
        description: 'A nullable boolean',
      };

      const result = convertParametersToGenAISchema(parameter);

      expect(result).toEqual({
        type: Type.BOOLEAN,
        nullable: true,
        description: 'A nullable boolean',
      });
    });
  });
});
