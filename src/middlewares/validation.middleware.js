// ====================================================
// REQUEST VALIDATION MIDDLEWARE (Fastify Format)
// ====================================================
// Schema-based request validation using custom validators.

import { ValidationError } from '../utils/errors.js';

/**
 * Validate request body against schema (Fastify preHandler)
 */
export const validateBody = (schema) => {
  return async (request, reply) => {
    const result = validateSchema(request.body, schema);
    if (!result.valid) {
      throw new ValidationError('Validation failed', result.errors);
    }
    request.validatedBody = result.data;
  };
};

/**
 * Validate request query parameters (Fastify preHandler)
 */
export const validateQuery = (schema) => {
  return async (request, reply) => {
    const result = validateSchema(request.query, schema);
    if (!result.valid) {
      throw new ValidationError('Invalid query parameters', result.errors);
    }
    request.validatedQuery = result.data;
  };
};

/**
 * Validate request params (Fastify preHandler)
 */
export const validateParams = (schema) => {
  return async (request, reply) => {
    const result = validateSchema(request.params, schema);
    if (!result.valid) {
      throw new ValidationError('Invalid route parameters', result.errors);
    }
    request.validatedParams = result.data;
  };
};

/**
 * Schema validation function
 */
function validateSchema(data, schema) {
  const errors = [];
  const validated = {};

  for (const [field, rules] of Object.entries(schema)) {
    let value = data[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} is required` });
      continue;
    }

    // Skip optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      if (rules.default !== undefined) {
        validated[field] = rules.default;
      }
      continue;
    }

    // Type coercion
    if (rules.type === 'number') {
      value = Number(value);
      if (isNaN(value)) {
        errors.push({ field, message: `${field} must be a number` });
        continue;
      }
    } else if (rules.type === 'boolean') {
      if (typeof value === 'string') {
        value = value === 'true';
      }
    } else if (rules.type === 'string') {
      value = String(value).trim();
    }

    // Length validation for strings
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({ 
          field, 
          message: `${field} must be at least ${rules.minLength} characters` 
        });
        continue;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({ 
          field, 
          message: `${field} must not exceed ${rules.maxLength} characters` 
        });
        continue;
      }
    }

    // Min/max validation for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}` });
        continue;
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push({ field, message: `${field} must not exceed ${rules.max}` });
        continue;
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({ 
        field, 
        message: rules.patternMessage || `${field} has invalid format` 
      });
      continue;
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({ 
        field, 
        message: `${field} must be one of: ${rules.enum.join(', ')}` 
      });
      continue;
    }

    // Custom validator
    if (rules.validate) {
      const customResult = rules.validate(value, data);
      if (customResult !== true) {
        errors.push({ field, message: customResult || `${field} is invalid` });
        continue;
      }
    }

    // Transform if provided
    if (rules.transform) {
      value = rules.transform(value);
    }

    validated[field] = value;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
    data: validated,
  };
}

// Common validation schemas
export const schemas = {
  pagination: {
    page: { type: 'number', default: 1, min: 1 },
    limit: { type: 'number', default: 20, min: 1, max: 100 },
  },
  
  id: {
    id: { 
      type: 'string', 
      required: true, 
      minLength: 20, 
      maxLength: 50 
    },
  },
};
