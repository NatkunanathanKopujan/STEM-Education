import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ROLE_LABELS } from '../utils/constants';

export function PlaceholderPage({ title = 'Dashboard Foundation', role }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          AI Smart LMS
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Foundation route prepared for {role ? ROLE_LABELS[role] : 'authorized users'}.
          Dashboards and business logic will be added in the upcoming prompts.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {['Architecture', 'Routing', 'RBAC'].map((item) => (
            <div key={item} className="rounded-lg border border-line bg-page p-4">
              <p className="text-sm font-semibold text-ink">{item}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Ready for extension.</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
