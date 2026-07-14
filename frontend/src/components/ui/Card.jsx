export function Card({ children, className = '' }) {
  return (
    <section className={`rounded-xl border border-line bg-white shadow-soft ${className}`}>
      {children}
    </section>
  );
}

export function DashboardCard({ title, value, icon: Icon, footer, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
        </div>
        {Icon ? (
          <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
      </div>
      {footer ? <div className="mt-4 text-sm text-muted">{footer}</div> : null}
    </Card>
  );
}
