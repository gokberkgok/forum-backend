// ====================================================
// RESPONSE HELPER UTILITIES (Fastify)
// ====================================================
// Standardized API response format for consistency.

/**
 * Success response format
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.code(statusCode).send({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Created response format
 */
export const createdResponse = (res, data, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response
 */
export const noContentResponse = (res) => {
  return res.code(204).send();
};

/**
 * Paginated response format
 */
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.code(200).send({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response format
 */
export const errorResponse = (res, message, statusCode = 500, code = 'ERROR', details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };

  return res.code(statusCode).send(response);
};
