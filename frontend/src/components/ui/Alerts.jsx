import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export function ErrorAlert({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <FiAlertCircle className="mt-0.5 size-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function SuccessAlert({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
      <FiCheckCircle className="mt-0.5 size-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
