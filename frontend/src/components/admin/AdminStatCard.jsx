import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

export function AdminStatCard({ title, count, trend }) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-soft"
    >
      <span className="inline-flex rounded-xl bg-orange-50 px-3 py-2 text-primary">
        <FiTrendingUp className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-bold text-ink">{count.toLocaleString()}</p>
      <h2 className="mt-2 text-sm font-semibold text-muted">{title}</h2>
      <p className="mt-3 text-xs font-semibold text-green-700">{trend}</p>
    </motion.article>
  );
}
