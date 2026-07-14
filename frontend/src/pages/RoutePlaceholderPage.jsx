import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';

export function RoutePlaceholderPage({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-6"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Frontend Foundation
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description ||
            'This route is prepared with protected layout, navigation, and reusable UI architecture. Business features will be added in upcoming prompts.'}
        </p>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {['Protected Route', 'Dashboard Layout', 'Reusable Components'].map((item) => (
            <div key={item} className="rounded-xl border border-line bg-page p-4">
              <p className="text-sm font-semibold text-ink">{item}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Ready for extension.</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
