const styles = {
  Active: 'border-green-200 bg-green-50 text-green-800',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-800',
  Danger: 'border-red-200 bg-red-50 text-red-800',
  Warning: 'border-amber-200 bg-amber-50 text-amber-800',
  Success: 'border-green-200 bg-green-50 text-green-800',
  Info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || styles.Info}`}>
      {status}
    </span>
  );
}
