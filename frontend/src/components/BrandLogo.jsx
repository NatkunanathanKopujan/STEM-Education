import dbitLogo from '../assets/dbit-logo.png';

export function BrandLogo({ inverse = false, compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={dbitLogo}
        alt="Don Bosco School of Excellence Kilinochchi logo"
        className={`${compact ? 'size-11' : 'size-14'} shrink-0 rounded-full object-contain`}
      />
      {!compact ? <div className="min-w-0 leading-tight">
        <p className={`truncate text-base font-bold ${inverse ? 'text-white' : 'text-ink'}`}>
          DBIT LMS
        </p>
        <p className={`truncate text-xs font-medium ${inverse ? 'text-orange-50' : 'text-muted'}`}>
          Don Bosco School of Excellence
        </p>
      </div> : null}
    </div>
  );
}
