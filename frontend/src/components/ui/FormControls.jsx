import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Input } from './Input';

export function PasswordInput(props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input type={showPassword ? 'text' : 'password'} className="pr-11" {...props} />
      <button
        type="button"
        className="absolute right-3 top-9 text-muted transition hover:text-primary"
        onClick={() => setShowPassword((value) => !value)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <FiEyeOff className="size-5" /> : <FiEye className="size-5" />}
      </button>
    </div>
  );
}

export function Textarea({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name;

  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <textarea
        id={inputId}
        className={`focus-ring min-h-28 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm placeholder:text-muted transition focus:border-primary focus:bg-white ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function SelectBox({ label, error, id, options = [], className = '', ...props }) {
  const inputId = id || props.name;

  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <select
        id={inputId}
        className={`focus-ring w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm transition focus:border-primary focus:bg-white ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`flex items-center gap-3 text-sm font-medium text-ink ${className}`}>
      <input
        type="checkbox"
        className="size-4 rounded border-line text-primary focus:ring-primary"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function RadioButton({ label, className = '', ...props }) {
  return (
    <label className={`flex items-center gap-3 text-sm font-medium text-ink ${className}`}>
      <input
        type="radio"
        className="size-4 border-line text-primary focus:ring-primary"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function DatePicker(props) {
  return <Input type="date" {...props} />;
}
