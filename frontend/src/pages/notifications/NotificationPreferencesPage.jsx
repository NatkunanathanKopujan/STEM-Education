import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { notificationService } from '../../services/notificationService';

const preferenceItems = [
  ['quizNotifications', 'Quiz Notifications', 'Quiz creation, quiz attempts, and quiz result updates.'],
  ['announcementNotifications', 'Announcement Notifications', 'Published announcements for your role or account.'],
  ['materialUploadNotifications', 'Material Upload Notifications', 'PDF, notes, videos, assignments, and document uploads.'],
  ['reminderNotifications', 'Reminder Notifications', 'Academic reminders, deadlines, and scheduled alerts.'],
  ['securityNotifications', 'Security Notifications', 'Login, password, session, and account security alerts.'],
  ['emailNotifications', 'Email Notifications', 'Allow notification delivery by email when supported.'],
  ['pushNotifications', 'Push Notifications', 'Allow browser or device push notifications when supported.'],
  ['smsNotifications', 'SMS Notifications', 'Allow SMS notifications when supported.'],
];

const defaultPreferences = Object.fromEntries(preferenceItems.map(([key]) => [key, false]));

function normalizePreferences(value) {
  return {
    ...defaultPreferences,
    ...(value || {}),
  };
}

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
          setPreferences(normalizePreferences(data));
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
    const nextPreferences = normalizePreferences({ ...preferences, [key]: value });

    setPreferences(nextPreferences);
    setSavingKey(key);
    setError('');
    setMessage('');

    try {
      const saved = await notificationService.updatePreferences({ [key]: value });
      setPreferences(normalizePreferences(saved));
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
          description="Control the in-app notification categories saved to your account."
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
        description="Control the in-app notification categories saved to your account."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {preferenceItems.map(([key, label, description]) => (
            <label
              key={key}
              className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${
                preferences[key]
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-line bg-white hover:border-primary/30'
              }`}
            >
              <span>
                <span className="font-semibold text-ink">{label}</span>
                <span className="block text-sm text-muted">
                  {description}
                </span>
                <span className="mt-1 block text-xs font-semibold text-muted">
                  {savingKey === key ? 'Saving...' : preferences[key] ? 'Enabled' : 'Disabled'}
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
              setPreferences(normalizePreferences(await notificationService.updatePreferences(preferences)));
              setMessage('All notification preferences saved.');
            } catch (apiError) {
              setError(apiError.response?.data?.message || 'Unable to save notification preferences.');
            } finally {
              setSavingKey('');
            }
          }}>
            {savingKey === 'all' ? 'Saving...' : 'Save All'}
          </Button>
          <Button variant="secondary" disabled={Boolean(savingKey)} onClick={async () => {
            setSavingKey('reset');
            setError('');
            setMessage('');
            try {
              setPreferences(normalizePreferences(await notificationService.resetPreferences()));
              setMessage('Notification preferences reset to defaults.');
            } catch (apiError) {
              setError(apiError.response?.data?.message || 'Unable to reset notification preferences.');
            } finally {
              setSavingKey('');
            }
          }}>
            {savingKey === 'reset' ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
