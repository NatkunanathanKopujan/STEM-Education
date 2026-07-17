import { FiUploadCloud } from 'react-icons/fi';

export function FileUpload({ label = 'Upload file', helperText, onChange, accept, multiple }) {
  return (
    <label className="focus-within:ring-primary block cursor-pointer rounded-xl border border-dashed border-line bg-white p-6 text-center shadow-sm transition hover:border-primary hover:bg-slate-50 focus-within:ring-2">
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
      />
      <FiUploadCloud className="mx-auto size-8 text-primary" />
      <span className="mt-3 block text-sm font-semibold text-ink">{label}</span>
      {helperText ? <span className="mt-1 block text-xs text-muted">{helperText}</span> : null}
    </label>
  );
}
