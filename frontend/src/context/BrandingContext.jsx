import { useCallback, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../hooks/useAuth';
import { BrandingContext } from './brandingContextValue';

const defaultBranding = {
  universityName: 'DBIT LMS',
  subtitle: 'Learning Management System',
  logoUrl: '',
  logoVersion: '',
};

function resolveAssetUrl(value) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const assetBase = apiBase.startsWith('http')
    ? apiBase.replace(/\/api\/?$/, '')
    : 'http://localhost:5000';
  return `${assetBase}${value.startsWith('/') ? value : `/${value}`}`;
}

function mapSettingsToBranding(settings = []) {
  const byKey = Object.fromEntries(settings.map((setting) => [setting.settingKey, setting]));
  const logoSetting = byKey['branding.logoUrl'];

  return {
    universityName: byKey['branding.universityName']?.settingValue || defaultBranding.universityName,
    subtitle: byKey['branding.universityName']?.settingValue ? 'Learning Management System' : defaultBranding.subtitle,
    logoUrl: resolveAssetUrl(logoSetting?.settingValue),
    logoVersion: logoSetting?.updatedAt || '',
  };
}

export function BrandingProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [branding, setBranding] = useState(defaultBranding);

  const refreshBranding = useCallback(async (optimisticBranding = {}) => {
    if (!isAuthenticated || !['super-admin', 'admin'].includes(role)) {
      setBranding(defaultBranding);
      return;
    }

    if (optimisticBranding.logoUrl) {
      setBranding((currentBranding) => ({
        ...currentBranding,
        logoUrl: resolveAssetUrl(optimisticBranding.logoUrl),
        logoVersion: optimisticBranding.logoVersion || String(Date.now()),
      }));
    }

    if (optimisticBranding.universityName) {
      setBranding((currentBranding) => ({
        ...currentBranding,
        universityName: optimisticBranding.universityName,
        subtitle: 'Learning Management System',
      }));
    }

    try {
      const data = await settingsService.list({ search: 'branding.', limit: 20 });
      const nextBranding = mapSettingsToBranding(data.settings || []);
      const optimisticLogoUrl = optimisticBranding.logoUrl
        ? resolveAssetUrl(optimisticBranding.logoUrl)
        : '';

      setBranding({
        ...nextBranding,
        universityName: optimisticBranding.universityName || nextBranding.universityName,
        subtitle: optimisticBranding.universityName ? 'Learning Management System' : nextBranding.subtitle,
        logoUrl: optimisticLogoUrl || nextBranding.logoUrl,
        logoVersion: optimisticBranding.logoVersion || nextBranding.logoVersion,
      });
    } catch {
      if (!optimisticBranding.logoUrl) {
        setBranding(defaultBranding);
      }
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
