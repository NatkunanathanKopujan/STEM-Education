const styles = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  Danger: 'bg-red-50 text-red-700 border-red-200',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  Success: 'bg-green-50 text-green-700 border-green-200',
  Info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Info}`}>
      {status}
    </span>
  );
}
