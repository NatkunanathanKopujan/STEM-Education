import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { useLanguage } from '../../hooks/useLanguage';

const formatSegment = (segment) =>
  segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export function Breadcrumb() {
  const location = useLocation();
  const { t } = useLanguage();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      <Link to="/app" className="inline-flex items-center gap-1 transition hover:text-primary">
        <FiHome className="size-4" />
        {t('Home')}
      </Link>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;

        return (
          <span key={path} className="inline-flex items-center gap-2">
            <FiChevronRight className="size-4 text-slate-400" />
            {isLast ? (
              <span className="font-medium text-ink">{t(formatSegment(segment))}</span>
            ) : (
              <Link to={path} className="transition hover:text-primary">
                {t(formatSegment(segment))}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
