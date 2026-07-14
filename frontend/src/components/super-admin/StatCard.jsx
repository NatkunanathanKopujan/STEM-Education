import { motion } from 'framer-motion';
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
    <motion.article
      whileHover={{ y: -5 }}
      className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-orange-50 text-primary">
          <Icon className="size-6" />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          <FiTrendingUp className="size-3" />
          {stat.trend}
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold text-ink">{stat.count.toLocaleString()}</p>
      <h3 className="mt-2 text-sm font-semibold text-muted">{stat.title}</h3>
    </motion.article>
  );
}
