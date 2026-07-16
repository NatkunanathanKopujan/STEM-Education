import dbitLogo from '../assets/dbit-logo.png';
import { useBranding } from '../hooks/useBranding';

export function BrandLogo({ inverse = false, compact = false }) {
  const { branding } = useBranding();
  const logoSource = branding.logoUrl || dbitLogo;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={logoSource}
        alt={`${branding.universityName} logo`}
        className={`${compact ? 'size-11' : 'size-14'} shrink-0 rounded-full object-contain`}
      />
      {!compact ? <div className="min-w-0 leading-tight">
        <p className={`truncate text-base font-bold ${inverse ? 'text-white' : 'text-ink'}`}>
          {branding.universityName}
        </p>
        <p className={`truncate text-xs font-medium ${inverse ? 'text-orange-50' : 'text-muted'}`}>
          {branding.subtitle}
        </p>
      </div> : null}
    </div>
  );
}
