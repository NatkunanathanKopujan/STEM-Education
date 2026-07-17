import { FiLoader } from 'react-icons/fi';

export function Loader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-muted">
      <FiLoader className="size-5 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonLoader({ lines = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-xl bg-slate-200"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}
