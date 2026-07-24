import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { profileService } from '../../services/profileService';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

const notificationKeys = [
  ['quizNotifications', 'Quiz Notifications'],
  ['announcementNotifications', 'Announcements'],
  ['materialUploadNotifications', 'Learning Material Notifications'],
  ['reminderNotifications', 'Reminder Notifications'],
  ['securityNotifications', 'Security Notifications'],
];

const historyPageSize = 20;

export function UserSettingsPage() {
  const { setThemePreference } = useTheme();
  const { setLanguagePreference, t } = useLanguage();
  const [preferences, setPreferences] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginHistoryMeta, setLoginHistoryMeta] = useState({ total: 0, limit: historyPageSize, offset: 0 });
  const [historyFilters, setHistoryFilters] = useState({ search: '', status: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isFilteringHistory, setIsFilteringHistory] = useState(false);

  const loadSettings = async (filters = {}, { initial = false } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsFilteringHistory(true);
    }
    setError('');

    try {
      const [prefs, history] = await Promise.all([
        profileService.getPreferences(),
        profileService.getLoginHistory({ limit: historyPageSize, ...filters }),
      ]);
      const savedPreferences = prefs.preferences || {};
      const loadedPreferences = {
        themePreference: 'light',
        languagePreference: 'en',
        timezone: '',
        ...savedPreferences,
        preferences: {
          profileVisibility: 'role_members',
          phoneVisibility: true,
          emailVisibility: true,
          ...(savedPreferences.preferences || {}),
        },
      };

      setPreferences(loadedPreferences);
      setNotificationPreferences(prefs.notificationPreferences || {});
      setLoginHistory(history.history || []);
      setLoginHistoryMeta({
        total: history.total || 0,
        limit: history.limit || historyPageSize,
        offset: history.offset || 0,
      });

      if (loadedPreferences.themePreference) {
        setThemePreference(loadedPreferences.themePreference);
      }
      if (loadedPreferences.languagePreference) {
        setLanguagePreference(loadedPreferences.languagePreference);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load settings.');
    } finally {
      setIsLoading(false);
      setIsFilteringHistory(false);
    }
  };

  useEffect(() => {
    loadSettings({}, { initial: true });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const data = await profileService.updatePreferences({
        ...preferences,
        notificationPreferences,
      });
      setPreferences(data.preferences);
      setNotificationPreferences(data.notificationPreferences);
      setThemePreference(data.preferences.themePreference);
      setLanguagePreference(data.preferences.languagePreference);
      setMessage('Settings saved successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError('');
    setMessage('');

    try {
      const data = await profileService.resetPreferences();
      setPreferences(data.preferences);
      setNotificationPreferences(data.notificationPreferences);
      setThemePreference(data.preferences.themePreference);
      setLanguagePreference(data.preferences.languagePreference);
      setMessage('Settings reset to defaults successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to reset settings.');
    } finally {
      setIsResetting(false);
    }
  };

  const applyHistoryFilters = () => {
    loadSettings({ ...historyFilters, offset: 0 });
  };

  const refreshHistory = () => {
    loadSettings({ ...historyFilters, offset: loginHistoryMeta.offset });
  };

  const previousHistoryPage = () => {
    loadSettings({
      ...historyFilters,
      offset: Math.max(loginHistoryMeta.offset - loginHistoryMeta.limit, 0),
    });
  };

  const nextHistoryPage = () => {
    loadSettings({
      ...historyFilters,
      offset: loginHistoryMeta.offset + loginHistoryMeta.limit,
    });
  };

  if (isLoading) {
    return <Loader label="Loading settings" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('Settings')}
        title={t('User Settings')}
        description="Manage theme, language, privacy, notification preferences, and login history."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">{t('Theme & Language')}</h2>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-ink">
              {t('Theme Preference')}
              <select
                value={preferences.themePreference}
                onChange={(event) => {
                  const nextTheme = event.target.value;
                  setPreferences((value) => ({ ...value, themePreference: nextTheme }));
                  setThemePreference(nextTheme);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="light">{t('Light Mode')}</option>
                <option value="dark">{t('Dark Mode')}</option>
                <option value="system">{t('System Default')}</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-ink">
              {t('Language')}
              <select
                value={preferences.languagePreference}
                onChange={(event) => {
                  const nextLanguage = event.target.value;
                  setPreferences((value) => ({ ...value, languagePreference: nextLanguage }));
                  setLanguagePreference(nextLanguage);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="en">{t('English')}</option>
                <option value="ta">{t('Tamil')}</option>
                <option value="si">{t('Sinhala')}</option>
              </select>
            </label>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">{t('Notification Preferences')}</h2>
          <div className="mt-5 grid gap-3">
            {notificationKeys.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                <span className="font-semibold text-ink">{t(label)}</span>
                <input
                  type="checkbox"
                  checked={Boolean(notificationPreferences[key])}
                  onChange={(event) =>
                    setNotificationPreferences((value) => ({ ...value, [key]: event.target.checked }))
                  }
                  className="size-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">{t('Privacy Settings')}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-ink">
            {t('Profile Visibility')}
            <select
              value={preferences.preferences?.profileVisibility || 'role_members'}
              onChange={(event) =>
                setPreferences((value) => ({
                  ...value,
                  preferences: { ...(value.preferences || {}), profileVisibility: event.target.value },
                }))
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
            >
              <option value="private">{t('Private')}</option>
              <option value="role_members">{t('Role Members')}</option>
              <option value="public">{t('Public Profile')}</option>
            </select>
          </label>
          {[
            ['phoneVisibility', 'Phone Visibility'],
            ['emailVisibility', 'Email Visibility'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
              <span className="font-semibold text-ink">{t(label)}</span>
              <input
                type="checkbox"
                checked={Boolean(preferences.preferences?.[key] ?? true)}
                onChange={(event) =>
                  setPreferences((value) => ({
                    ...value,
                    preferences: { ...(value.preferences || {}), [key]: event.target.checked },
                  }))
                }
                className="size-5 accent-primary"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={isSaving || isResetting}>
            {isSaving ? `${t('Saving')}...` : t('Save Settings')}
          </Button>
          <Button variant="secondary" onClick={handleReset} disabled={isSaving || isResetting}>
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-ink">{t('Login History')}</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={historyFilters.search}
                onChange={(event) => setHistoryFilters((value) => ({ ...value, search: event.target.value }))}
                placeholder="Search IP, browser, reason"
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              />
              <select
                value={historyFilters.status}
                onChange={(event) => setHistoryFilters((value) => ({ ...value, status: event.target.value }))}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="">{t('All Status')}</option>
                <option value="successful">{t('Successful')}</option>
                <option value="failed">{t('Failed')}</option>
              </select>
              <Button variant="secondary" disabled={isFilteringHistory} onClick={applyHistoryFilters}>
                {isFilteringHistory ? `${t('Filtering')}...` : t('Filter')}
              </Button>
              <Button variant="secondary" disabled={isFilteringHistory} onClick={refreshHistory}>
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>{['Login Date', 'Logout Date', 'IP Address', 'Browser', 'Status', 'Reason'].map((heading) => <th key={heading} className="px-4 py-3">{t(heading)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loginHistory.map((item) => (
                <tr key={item.id || `${item.loginDate}-${item.ipAddress}-${item.status}`}>
                  <td className="px-4 py-3">{item.loginDate ? new Date(item.loginDate).toLocaleString() : t('Unknown')}</td>
                  <td className="px-4 py-3">{item.logoutDate ? new Date(item.logoutDate).toLocaleString() : t('Active')}</td>
                  <td className="px-4 py-3">{item.ipAddress || t('Unknown')}</td>
                  <td className="px-4 py-3 text-muted">{item.browser || t('Unknown')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${
                      item.status === 'successful' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.failureReason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loginHistory.length ? (
            <p className="p-4 text-sm text-muted">No login history found.</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 border-t border-line p-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {loginHistory.length ? loginHistoryMeta.offset + 1 : 0}
            {' - '}
            {Math.min(loginHistoryMeta.offset + loginHistory.length, loginHistoryMeta.total)}
            {' of '}
            {loginHistoryMeta.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={isFilteringHistory || loginHistoryMeta.offset === 0}
              onClick={previousHistoryPage}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={
                isFilteringHistory
                || loginHistoryMeta.offset + loginHistoryMeta.limit >= loginHistoryMeta.total
              }
              onClick={nextHistoryPage}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
