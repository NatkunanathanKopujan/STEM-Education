import { Button } from '../ui/Button';

export function PageHeader({ eyebrow = 'Super Admin', title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange-600">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
