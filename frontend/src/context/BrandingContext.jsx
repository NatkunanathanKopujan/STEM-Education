import { useCallback, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../hooks/useAuth';
import { BrandingContext } from './brandingContextValue';

const defaultBranding = {
  universityName: 'DBIT LMS',
  subtitle: 'Learning Management System',
  logoUrl: '',
};

function resolveAssetUrl(value) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const assetBase = apiBase.replace(/\/api\/?$/, '');
  return `${assetBase}${value.startsWith('/') ? value : `/${value}`}`;
}

function mapSettingsToBranding(settings = []) {
  const byKey = Object.fromEntries(settings.map((setting) => [setting.settingKey, setting.settingValue]));

  return {
    universityName: byKey['branding.universityName'] || defaultBranding.universityName,
    subtitle: byKey['branding.universityName'] ? 'Learning Management System' : defaultBranding.subtitle,
    logoUrl: resolveAssetUrl(byKey['branding.logoUrl']),
  };
}

export function BrandingProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [branding, setBranding] = useState(defaultBranding);

  const refreshBranding = useCallback(async () => {
    if (!isAuthenticated || !['super-admin', 'admin'].includes(role)) {
      setBranding(defaultBranding);
      return;
    }

    try {
      const data = await settingsService.list({ search: 'branding.', limit: 20 });
      setBranding(mapSettingsToBranding(data.settings || []));
    } catch {
      setBranding(defaultBranding);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  const value = useMemo(
    () => ({
      branding,
      refreshBranding,
    }),
    [branding, refreshBranding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
