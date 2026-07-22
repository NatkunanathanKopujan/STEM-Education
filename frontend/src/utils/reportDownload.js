export function downloadReportExport(data) {
  if (!data?.content) {
    throw new Error('Export file content is missing.');
  }

  const content =
    data.encoding === 'base64'
      ? Uint8Array.from(atob(data.content), (character) => character.charCodeAt(0))
      : data.content;
  const blob = new Blob([content], { type: data.mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = data.fileName || `report.${data.format || 'csv'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
