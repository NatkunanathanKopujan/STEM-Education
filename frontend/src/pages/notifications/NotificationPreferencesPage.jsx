import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { notificationService } from '../../services/notificationService';

const preferenceItems = [
  ['quizNotifications', 'Quiz Notifications'],
  ['announcementNotifications', 'Announcement Notifications'],
  ['materialUploadNotifications', 'Material Upload Notifications'],
  ['reminderNotifications', 'Reminder Notifications'],
  ['securityNotifications', 'Security Notifications'],
  ['emailNotifications', 'Future Email Notifications'],
  ['pushNotifications', 'Future Push Notifications'],
  ['smsNotifications', 'Future SMS Notifications'],
];

export function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const data = await notificationService.getPreferences();

        if (isMounted) {
          setPreferences(data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load notification preferences.');
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePreference = async (key, value) => {
    const previousPreferences = preferences;
    const nextPreferences = { ...preferences, [key]: value };

    setPreferences(nextPreferences);
    setSavingKey(key);
    setError('');
    setMessage('');

    try {
      const saved = await notificationService.updatePreferences({ [key]: value });
      setPreferences(saved);
      setMessage('Notification preference saved.');
    } catch (apiError) {
      setPreferences(previousPreferences);
      setError(apiError.response?.data?.message || 'Unable to save notification preference.');
    } finally {
      setSavingKey('');
    }
  };

  if (!preferences && error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Communication"
          title="Notification Preferences"
          description="Control in-app notification categories and future-ready Email, SMS, and Push channels."
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
      </div>
    );
  }

  if (!preferences) {
    return <Loader label="Loading preferences" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Notification Preferences"
        description="Control in-app notification categories and future-ready Email, SMS, and Push channels."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {preferenceItems.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-xl border border-line p-4">
              <span>
                <span className="font-semibold text-ink">{label}</span>
                <span className="block text-sm text-muted">
                  {savingKey === key ? 'Saving...' : 'Saved directly to your account.'}
                </span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(preferences[key])}
                disabled={Boolean(savingKey)}
                onChange={(event) => updatePreference(key, event.target.checked)}
                className="size-5 accent-primary"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button variant="secondary" disabled={Boolean(savingKey)} onClick={async () => {
            setSavingKey('all');
            setError('');
            setMessage('');
            try {
              setPreferences(await notificationService.updatePreferences(preferences));
              setMessage('All notification preferences saved.');
            } catch (apiError) {
              setError(apiError.response?.data?.message || 'Unable to save notification preferences.');
            } finally {
              setSavingKey('');
            }
          }}>
            {savingKey === 'all' ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
