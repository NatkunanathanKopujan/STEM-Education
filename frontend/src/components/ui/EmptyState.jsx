import { FiInbox } from 'react-icons/fi';
import { Button } from './Button';

export function EmptyState({ title = 'No data found', description, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center shadow-sm">
      <span className="mx-auto grid size-12 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-primary">
        <FiInbox className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
