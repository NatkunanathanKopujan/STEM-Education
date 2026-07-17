import { FiCheckCircle } from 'react-icons/fi';

export function SuccessMessage({ title = 'Success', message }) {
  return (
    <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm">
      <FiCheckCircle className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {message ? <p className="mt-1 text-sm">{message}</p> : null}
      </div>
    </div>
  );
}
