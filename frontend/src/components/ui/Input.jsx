export function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name;

  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <input
        id={inputId}
        className={`focus-ring w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm placeholder:text-muted transition focus:border-primary ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
