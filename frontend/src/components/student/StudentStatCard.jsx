import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

export function StudentStatCard({ title, value, suffix = '' }) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-soft"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-primary">
        <FiTrendingUp className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-bold text-ink">
        {value}
        {suffix}
      </p>
      <h2 className="mt-2 text-sm font-semibold text-muted">{title}</h2>
    </motion.article>
  );
}
