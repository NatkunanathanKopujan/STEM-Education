import { FiTrendingUp } from 'react-icons/fi';

export function AdminStatCard({ title, count, trend }) {
  return (
    <article className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-soft">
      <span className="inline-flex rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-primary">
        <FiTrendingUp className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-bold text-ink">{count.toLocaleString()}</p>
      <h2 className="mt-2 text-sm font-semibold text-muted">{title}</h2>
      <p className="mt-3 text-xs font-semibold text-green-700">{trend}</p>
    </article>
  );
}
