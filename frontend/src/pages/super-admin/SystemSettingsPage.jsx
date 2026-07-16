import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiSave, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, SelectBox } from '../../components/ui/FormControls';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { settingsService } from '../../services/settingsService';
import { useBranding } from '../../hooks/useBranding';

const settingFields = [
  {
    key: 'branding.universityName',
    label: 'University Name',
    type: 'text',
    description: 'Displayed platform institution name.',
  },
  {
    key: 'branding.logoUrl',
    label: 'System Logo URL',
    type: 'url',
    description: 'Public logo URL or hosted asset path.',
  },
  {
    key: 'academic.year',
    label: 'Academic Year',
    type: 'text',
    description: 'Current academic year label.',
  },
  {
    key: 'system.timezone',
    label: 'Timezone',
    type: 'select',
    options: [
      { label: 'Asia/Colombo', value: 'Asia/Colombo' },
      { label: 'UTC', value: 'UTC' },
      { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
    ],
    description: 'Timezone used for platform dates.',
  },
  {
    key: 'email.smtpHost',
    label: 'Email Host',
    type: 'text',
    description: 'SMTP host used by notification email jobs.',
  },
  {
    key: 'backup.schedule',
    label: 'Backup Schedule',
    type: 'select',
    options: [
      { label: 'Manual only', value: 'manual' },
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
    ],
    description: 'Preferred backup schedule setting.',
  },
  {
    key: 'system.maintenanceMode',
    label: 'Maintenance Mode',
    type: 'boolean',
    description: 'When enabled, the app can show maintenance behavior.',
  },
];

function getApiErrorMessage(apiError, fallback) {
  const errors = apiError.response?.data?.errors || [];
  const detail = errors
    .map((item) => item.msg || item.message)
    .filter(Boolean)
    .join(', ');

  return detail || apiError.response?.data?.message || fallback;
}

function normalizeSettings(settings = []) {
  return Object.fromEntries(settings.map((setting) => [setting.settingKey, setting]));
}

function emptyForm() {
  return Object.fromEntries(
    settingFields.map((field) => [field.key, field.type === 'boolean' ? false : '']),
  );
}

export function SystemSettingsPage() {
  const { refreshBranding } = useBranding();
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const configuredCount = useMemo(
    () => settingFields.filter((field) => settings[field.key]).length,
    [settings],
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await settingsService.list({ limit: 100 });
      const byKey = normalizeSettings(data.settings || []);
      setSettings(byKey);
      setForm({
        ...emptyForm(),
        ...Object.fromEntries(
          settingFields.map((field) => [
            field.key,
            byKey[field.key]?.settingValue ?? (field.type === 'boolean' ? false : ''),
          ]),
        ),
      });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to load system settings.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      await settingsService.saveMany(
        settingFields.map((field) => ({
          settingKey: field.key,
          settingValue: form[field.key],
          description: field.description,
        })),
      );
      setMessage('System settings saved.');
      await loadSettings();
      await refreshBranding();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to save system settings.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function resetSetting(field) {
    if (!settings[field.key]) {
      updateField(field.key, field.type === 'boolean' ? false : '');
      return;
    }

    if (!window.confirm(`Delete setting "${field.label}"?`)) return;

    setMessage('');
    setError('');
    try {
      await settingsService.remove(field.key);
      setMessage(`${field.label} deleted.`);
      await loadSettings();
      await refreshBranding();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to delete setting.'));
    }
  }

  async function uploadLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setMessage('');
    setError('');
    setIsUploadingLogo(true);
    try {
      const data = await settingsService.uploadLogo(file);
      updateField('branding.logoUrl', data.logoUrl);
      setMessage('System logo uploaded.');
      await loadSettings();
      await refreshBranding();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to upload system logo.'));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function renderField(field) {
    if (field.type === 'boolean') {
      return (
        <div className="rounded-lg border border-line p-4">
          <Checkbox
            label={field.label}
            checked={Boolean(form[field.key])}
            onChange={(event) => updateField(field.key, event.target.checked)}
          />
          <p className="mt-2 text-xs text-muted">{field.description}</p>
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <SelectBox
          label={field.label}
          value={form[field.key] || ''}
          options={[{ label: 'Not configured', value: '' }, ...field.options]}
          onChange={(event) => updateField(field.key, event.target.value)}
        />
      );
    }

    if (field.key === 'branding.logoUrl') {
      return (
        <div className="space-y-3">
          <Input
            label={field.label}
            type={field.type}
            value={form[field.key] || ''}
            onChange={(event) => updateField(field.key, event.target.value)}
          />
          <label className="focus-within:ring-primary flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-primary hover:bg-orange-50/40 focus-within:ring-2">
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={uploadLogo}
              disabled={isUploadingLogo}
            />
            <FiUploadCloud className="size-5 text-primary" />
            {isUploadingLogo ? 'Uploading logo...' : 'Upload logo image'}
          </label>
        </div>
      );
    }

    return (
      <Input
        label={field.label}
        type={field.type}
        value={form[field.key] || ''}
        onChange={(event) => updateField(field.key, event.target.value)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure platform branding, academic year, timezone, email, backup, and maintenance values from the database."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{configuredCount}</p>
          <p className="text-sm text-muted">Configured Settings</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{settingFields.length}</p>
          <p className="text-sm text-muted">Managed Keys</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{isLoading ? 'Loading' : 'Live DB'}</p>
          <p className="text-sm text-muted">Settings Source</p>
        </Card>
      </div>

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="p-6">
        {isLoading ? (
          <Loader label="Loading settings" />
        ) : (
          <form className="space-y-5" onSubmit={saveSettings}>
            <div className="grid gap-5 lg:grid-cols-2">
              {settingFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  {renderField(field)}
                  {field.type !== 'boolean' ? (
                    <p className="text-xs text-muted">{field.description}</p>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 text-xs text-muted">
                    <span>{settings[field.key] ? `Updated ${new Date(settings[field.key].updatedAt).toLocaleString()}` : 'Not configured'}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-8 px-2 text-red-600"
                      onClick={() => resetSetting(field)}
                    >
                      <FiTrash2 />
                      Reset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-line pt-5">
              <Button type="button" variant="secondary" onClick={loadSettings}>
                <FiRefreshCw />
                Refresh
              </Button>
              <Button type="submit" isLoading={isSaving}>
                <FiSave />
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
