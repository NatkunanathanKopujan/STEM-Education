import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export function RoleCard({ role, title, description, icon: Icon }) {
  return (
    <Link
      to={`/login/${role}`}
      className="focus-ring group flex min-h-[260px] flex-col rounded-xl border border-line bg-white p-6 shadow-sm transition-all duration-300 hover:min-h-[360px] hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft focus:min-h-[360px] focus:-translate-y-1 focus:border-primary/40 focus:shadow-soft"
      aria-label={`Continue as ${title}`}
    >
      <span className="grid size-14 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-primary">
        <Icon className="size-7" />
      </span>

      <h2 className="mt-8 text-xl font-bold text-ink">{title}</h2>
      <p className="mt-0 max-h-0 overflow-hidden text-sm leading-6 text-muted opacity-0 transition-all duration-300 group-hover:mt-3 group-hover:max-h-32 group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:max-h-32 group-focus-within:opacity-100">
        {description}
      </p>
      <div className="min-h-8 flex-1" />
      <span className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[#171411] shadow-sm transition duration-150 group-hover:bg-primary-dark group-hover:text-white group-hover:shadow-md group-focus:bg-primary-dark group-focus:text-white group-focus:shadow-md">
        Continue
        <FiArrowRight className="size-4" />
      </span>
    </Link>
  );
}
