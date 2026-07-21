export function Card({ children, className = '' }) {
  return (
    <section className={`rounded-xl border border-line bg-white shadow-soft ring-1 ring-primary/[0.04] ${className}`}>
      {children}
    </section>
  );
}

export function DashboardCard({ title, value, icon: Icon, footer, className = '' }) {
  return (
    <Card className={`p-5 transition duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
        </div>
        {Icon ? (
          <span className="grid size-11 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-primary shadow-sm">
            <Icon className="size-5" />
          </span>
        ) : null}
      </div>
      {footer ? <div className="mt-4 text-sm text-muted">{footer}</div> : null}
    </Card>
  );
}
