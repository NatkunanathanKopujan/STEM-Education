import { FiTrendingUp } from 'react-icons/fi';

export function AdminStatCard({ title, count, trend }) {
  return (
    <article className="group rounded-xl border border-line bg-white p-5 shadow-soft transition duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <span className="inline-flex rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-primary shadow-sm transition group-hover:border-primary/50">
        <FiTrendingUp className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-bold text-ink">{count.toLocaleString()}</p>
      <h2 className="mt-2 text-sm font-semibold text-muted">{title}</h2>
      <p className="mt-3 inline-flex rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-primary">{trend}</p>
    </article>
  );
}
