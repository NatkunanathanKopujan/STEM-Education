export function formatDate(date = new Date(), locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
}

export const toMysqlDateTime = (date = new Date()) =>
  new Date(date).toISOString().slice(0, 19).replace('T', ' ');
