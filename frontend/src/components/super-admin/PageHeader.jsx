import { Button } from '../ui/Button';

export function PageHeader({ eyebrow = 'Super Admin', title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-5 shadow-soft lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </div>
  );
}
