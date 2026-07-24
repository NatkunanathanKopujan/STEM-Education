import dbitLogo from '../assets/dbit-logo.png';
import { useBranding } from '../hooks/useBranding';

export function BrandLogo({ inverse = false, compact = false }) {
  const { branding } = useBranding();
  const logoSource = branding.logoUrl
    ? `${branding.logoUrl}${branding.logoUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(branding.logoVersion || '')}`
    : dbitLogo;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`${compact ? 'size-11' : 'size-14'} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white shadow-sm`}
      >
        <img
          src={logoSource}
          alt={`${branding.universityName} logo`}
          className="size-full object-cover"
        />
      </span>
      {!compact ? <div className="min-w-0 leading-tight">
        <p className={`truncate ${inverse ? 'text-lg text-black' : 'text-base text-ink'} font-bold`}>
          {branding.universityName}
        </p>
        <p className={`truncate ${inverse ? 'text-sm text-black' : 'text-xs text-muted'} font-medium`}>
          {branding.subtitle}
        </p>
      </div> : null}
    </div>
  );
}
