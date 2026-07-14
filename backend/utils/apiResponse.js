const buildResponse = ({ success, message, data = null, errors = [], statusCode }) => ({
  success,
  message,
  data,
  errors,
  timestamp: new Date().toISOString(),
  statusCode,
});

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    ...buildResponse({ success: true, message, data, statusCode }),
  });
};

export const sendError = (res, message = 'Request failed', statusCode = 400, errors = []) => {
  res.status(statusCode).json({
    ...buildResponse({ success: false, message, errors, statusCode }),
  });
};

export const formatResponse = buildResponse;
