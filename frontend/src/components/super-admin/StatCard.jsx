import {
  FiActivity,
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiCpu,
  FiLogIn,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';

const iconMap = {
  admins: FiUsers,
  teachers: FiClipboard,
  students: FiUsers,
  curriculums: FiBookOpen,
  materials: FiClipboard,
  quiz: FiCpu,
  active: FiCheckCircle,
  logins: FiLogIn,
  activity: FiActivity,
};

export function StatCard({ stat }) {
  const Icon = iconMap[stat.icon] || FiTrendingUp;

  return (
    <article className="group rounded-xl border border-line bg-white p-5 shadow-soft transition duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-primary shadow-sm transition group-hover:border-primary/50">
          <Icon className="size-6" />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-primary">
          <FiTrendingUp className="size-3" />
          {stat.trend}
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold text-ink">{stat.count.toLocaleString()}</p>
      <h3 className="mt-2 text-sm font-semibold text-muted">{stat.title}</h3>
    </article>
  );
}
