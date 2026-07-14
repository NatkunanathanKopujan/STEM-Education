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

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      const data = await notificationService.getPreferences();

      if (isMounted) {
        setPreferences(data);
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setPreferences(await notificationService.updatePreferences(preferences));
    setMessage('Notification preferences updated.');
  };

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
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {preferenceItems.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-xl border border-line p-4">
              <span>
                <span className="font-semibold text-ink">{label}</span>
                <span className="block text-sm text-muted">Enable or disable this communication channel.</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(preferences[key])}
                onChange={(event) =>
                  setPreferences((value) => ({ ...value, [key]: event.target.checked }))
                }
                className="size-5 accent-primary"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleSave}>Save Preferences</Button>
          {message ? <span className="text-sm font-semibold text-primary">{message}</span> : null}
        </div>
      </Card>
    </div>
  );
}
