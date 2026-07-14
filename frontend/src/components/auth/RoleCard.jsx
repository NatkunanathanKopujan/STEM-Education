import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Button } from '../ui/Button';

export function RoleCard({ role, title, description, icon: Icon }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      className="rounded-xl border border-line bg-white p-6 shadow-sm transition hover:border-primary hover:shadow-soft"
    >
      <span className="grid size-14 place-items-center rounded-xl bg-orange-50 text-primary">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-6 text-xl font-bold text-ink">{title}</h2>
      <p className="mt-3 min-h-16 text-sm leading-6 text-muted">{description}</p>
      <Link to={`/login/${role}`} className="mt-6 block">
        <Button className="w-full">
          Continue
          <FiArrowRight className="size-4" />
        </Button>
      </Link>
    </motion.article>
  );
}
