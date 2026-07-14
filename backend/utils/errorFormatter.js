export function formatError(error) {
  return {
    name: error.name || 'Error',
    message: error.message || 'Unexpected error',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  };
}
