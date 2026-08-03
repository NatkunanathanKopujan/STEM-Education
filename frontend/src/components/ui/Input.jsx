export function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name;

  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <input
        id={inputId}
        className={`focus-ring w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm placeholder:font-normal placeholder:text-muted transition duration-200 hover:border-primary/45 hover:shadow-md focus:border-primary focus:bg-white focus:shadow-md ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
