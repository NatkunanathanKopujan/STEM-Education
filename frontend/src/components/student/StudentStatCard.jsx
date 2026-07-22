import { FiTrendingUp } from 'react-icons/fi';

export function StudentStatCard({ title, value, suffix = '' }) {
  return (
    <article className="group rounded-xl border border-line bg-white p-5 shadow-soft transition duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <span className="grid size-11 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-primary shadow-sm transition group-hover:border-primary/50">
        <FiTrendingUp className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-bold text-ink">
        {value}
        {suffix}
      </p>
      <h2 className="mt-2 text-sm font-semibold text-muted">{title}</h2>
    </article>
  );
}
