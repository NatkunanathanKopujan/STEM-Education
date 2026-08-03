export function Card({ children, className = '' }) {
  return (
    <section
      className={`enterprise-panel rounded-2xl ring-1 ring-white/60 transition duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </section>
  );
}

export function DashboardCard({ title, value, icon: Icon, footer, className = '' }) {
  return (
    <Card className={`overflow-hidden p-5 hover:border-primary/45 ${className}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-primary/35 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
          <p className="mt-3 text-3xl font-black text-ink">{value}</p>
        </div>
        {Icon ? (
          <span className="grid size-12 place-items-center rounded-2xl border border-primary/25 bg-orange-50 text-primary shadow-md">
            <Icon className="size-5" />
          </span>
        ) : null}
      </div>
      {footer ? <div className="mt-4 text-sm text-muted">{footer}</div> : null}
    </Card>
  );
}
