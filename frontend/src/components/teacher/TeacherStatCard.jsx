import { motion } from 'framer-motion';
import { FiBookOpen } from 'react-icons/fi';

export function TeacherStatCard({ title, value, note }) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-soft"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-primary">
        <FiBookOpen className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-bold text-ink">{value.toLocaleString()}</p>
      <h2 className="mt-2 text-sm font-semibold text-muted">{title}</h2>
      <p className="mt-3 text-xs font-semibold text-green-700">{note}</p>
    </motion.article>
  );
}
