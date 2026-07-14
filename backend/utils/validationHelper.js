export const optionalString = (value) => value === undefined || typeof value === 'string';

export const sanitizeLikeSearch = (value = '') =>
  String(value).trim().replace(/[%_]/g, '\\$&');
