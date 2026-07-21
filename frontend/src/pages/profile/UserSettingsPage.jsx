import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { profileService } from '../../services/profileService';
import { useTheme } from '../../hooks/useTheme';

const notificationKeys = [
  ['quizNotifications', 'Quiz Notifications'],
  ['announcementNotifications', 'Announcements'],
  ['materialUploadNotifications', 'Learning Material Notifications'],
  ['reminderNotifications', 'Reminder Notifications'],
  ['securityNotifications', 'Security Notifications'],
];

export function UserSettingsPage() {
  const { setThemePreference, themePreference } = useTheme();
  const [preferences, setPreferences] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({ search: '', status: '' });
  const [message, setMessage] = useState('');

  const loadSettings = async (filters = {}) => {
    const [prefs, history] = await Promise.all([
      profileService.getPreferences(),
      profileService.getLoginHistory({ limit: 20, ...filters }),
    ]);

    setPreferences({ ...prefs.preferences, themePreference });
    setNotificationPreferences(prefs.notificationPreferences);
    setLoginHistory(history.history || []);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    const data = await profileService.updatePreferences({
      ...preferences,
      notificationPreferences,
    });
    setPreferences(data.preferences);
    setNotificationPreferences(data.notificationPreferences);
    setThemePreference(data.preferences.themePreference);
    setMessage('Settings saved successfully.');
  };

  if (!preferences || !notificationPreferences) {
    return <Loader label="Loading settings" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="User Settings"
        description="Manage theme, language, privacy, notification preferences, and login history."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Theme & Language</h2>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-ink">
              Theme Preference
              <select
                value={preferences.themePreference}
                onChange={(event) => {
                  const nextTheme = event.target.value;
                  setPreferences((value) => ({ ...value, themePreference: nextTheme }));
                  setThemePreference(nextTheme);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-ink">
              Language
              <select
                value={preferences.languagePreference}
                onChange={(event) => setPreferences((value) => ({ ...value, languagePreference: event.target.value }))}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="si">Sinhala</option>
              </select>
            </label>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Notification Preferences</h2>
          <div className="mt-5 grid gap-3">
            {notificationKeys.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                <span className="font-semibold text-ink">{label}</span>
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
        <h2 className="text-lg font-bold text-ink">Privacy Settings</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-ink">
            Profile Visibility
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
              <option value="private">Private</option>
              <option value="role_members">Role Members</option>
              <option value="public">Public Profile</option>
            </select>
          </label>
          {[
            ['phoneVisibility', 'Phone Visibility'],
            ['emailVisibility', 'Email Visibility'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
              <span className="font-semibold text-ink">{label}</span>
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
        <Button className="mt-5" onClick={handleSave}>Save Settings</Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-ink">Login History</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={historyFilters.search}
                onChange={(event) => setHistoryFilters((value) => ({ ...value, search: event.target.value }))}
                placeholder="Search IP, browser, location"
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              />
              <select
                value={historyFilters.status}
                onChange={(event) => setHistoryFilters((value) => ({ ...value, status: event.target.value }))}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="">All Status</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="secondary" onClick={() => loadSettings(historyFilters)}>Filter</Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>{['Login Date', 'Logout Date', 'IP Address', 'Browser', 'Status'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loginHistory.map((item) => (
                <tr key={`${item.loginDate}-${item.ipAddress}`}>
                  <td className="px-4 py-3">{item.loginDate ? new Date(item.loginDate).toLocaleString() : 'Unknown'}</td>
                  <td className="px-4 py-3">{item.logoutDate ? new Date(item.logoutDate).toLocaleString() : 'Active'}</td>
                  <td className="px-4 py-3">{item.ipAddress || 'Unknown'}</td>
                  <td className="px-4 py-3 text-muted">{item.browser || 'Unknown'}</td>
                  <td className="px-4 py-3 capitalize">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
