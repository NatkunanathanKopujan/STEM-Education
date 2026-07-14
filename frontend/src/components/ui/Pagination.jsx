import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from './Button';

export function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  return (
    <nav className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="px-3"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft className="size-4" />
        </Button>
        <Button
          variant="secondary"
          className="px-3"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next page"
        >
          <FiChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
