import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiUploadCloud, FiX } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, SelectBox, Textarea } from '../../components/ui/FormControls';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { academicYearService } from '../../services/academicYearService';
import { settingsService } from '../../services/settingsService';
import { timezoneService } from '../../services/timezoneService';
import { useBranding } from '../../hooks/useBranding';

const settingFields = [
  {
    key: 'branding.universityName',
    label: 'University Name',
    group: 'Branding',
    type: 'text',
    description: 'Displayed platform institution name.',
  },
  {
    key: 'branding.logoUrl',
    label: 'System Logo',
    group: 'Branding',
    type: 'image',
    description: 'Uploaded system logo image.',
  },
  {
    key: 'email.smtpHost',
    label: 'Email Host',
    group: 'Email',
    type: 'text',
    description: 'SMTP host used by notification email jobs.',
  },
  {
    key: 'support.email',
    label: 'Support Email',
    group: 'Support',
    type: 'email',
    description: 'Support email shown across LMS pages.',
  },
  {
    key: 'support.phone',
    label: 'Support Phone Number',
    group: 'Support',
    type: 'tel',
    description: 'Support phone number shown across LMS pages.',
  },
  {
    key: 'backup.schedule',
    label: 'Backup Schedule',
    group: 'Backup',
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
    group: 'System',
    type: 'boolean',
    description: 'When enabled, the app can show maintenance behavior.',
  },
];

const supportSettingKeys = ['support.email', 'support.phone'];
const editableSettingFields = settingFields.filter((field) => !supportSettingKeys.includes(field.key));
const supportSettingFields = settingFields.filter((field) => supportSettingKeys.includes(field.key));

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

function resolveAssetUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const assetBase = apiBase.startsWith('http')
    ? apiBase.replace(/\/api\/?$/, '')
    : 'http://localhost:5000';
  return `${assetBase}${value.startsWith('/') ? value : `/${value}`}`;
}

function appendVersion(url, version) {
  if (!url || !version) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

function emptyAcademicYearForm() {
  return {
    name: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
    isCurrent: false,
    description: '',
  };
}

function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function normalizeAcademicYearPayload(formValue) {
  return {
    name: formValue.name.trim(),
    startDate: formValue.startDate || null,
    endDate: formValue.endDate || null,
    status: formValue.status,
    isCurrent: Boolean(formValue.isCurrent),
    description: formValue.description.trim() || null,
  };
}

function emptyTimezoneForm() {
  return {
    name: '',
    utcOffset: '',
    status: 'active',
    isDefault: false,
    description: '',
  };
}

function normalizeTimezonePayload(formValue) {
  return {
    name: formValue.name.trim(),
    utcOffset: formValue.utcOffset.trim() || null,
    status: formValue.status,
    isDefault: Boolean(formValue.isDefault),
    description: formValue.description.trim() || null,
  };
}

export function SystemSettingsPage() {
  const { refreshBranding } = useBranding();
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYearForm, setAcademicYearForm] = useState(emptyAcademicYearForm);
  const [editingAcademicYearId, setEditingAcademicYearId] = useState(null);
  const [isAcademicYearLoading, setIsAcademicYearLoading] = useState(true);
  const [savingAcademicYear, setSavingAcademicYear] = useState(false);
  const [deletingAcademicYearId, setDeletingAcademicYearId] = useState(null);
  const [timezones, setTimezones] = useState([]);
  const [timezoneForm, setTimezoneForm] = useState(emptyTimezoneForm);
  const [editingTimezoneId, setEditingTimezoneId] = useState(null);
  const [isTimezoneLoading, setIsTimezoneLoading] = useState(true);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [deletingTimezoneId, setDeletingTimezoneId] = useState(null);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [logoPreviewVersion, setLogoPreviewVersion] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const configuredCount = useMemo(
    () => settingFields.filter((field) => settings[field.key]).length,
    [settings],
  );
  const supportFields = supportSettingFields;
  const hasSupportChange = supportFields.some((field) => hasPendingChange(field));
  const logoPreviewUrl = useMemo(
    () => pendingLogoPreview || appendVersion(resolveAssetUrl(form['branding.logoUrl']), logoPreviewVersion),
    [form, logoPreviewVersion, pendingLogoPreview],
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

  const loadAcademicYears = useCallback(async () => {
    setIsAcademicYearLoading(true);
    setError('');
    try {
      const data = await academicYearService.list({ limit: 100 });
      setAcademicYears(data.academicYears || []);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to load academic years.'));
    } finally {
      setIsAcademicYearLoading(false);
    }
  }, []);

  const loadTimezones = useCallback(async () => {
    setIsTimezoneLoading(true);
    setError('');
    try {
      const data = await timezoneService.list({ limit: 100 });
      setTimezones(data.timezones || []);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to load timezones.'));
    } finally {
      setIsTimezoneLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadAcademicYears();
    loadTimezones();
  }, [loadAcademicYears, loadSettings, loadTimezones]);

  useEffect(() => () => {
    if (pendingLogoPreview) {
      URL.revokeObjectURL(pendingLogoPreview);
    }
  }, [pendingLogoPreview]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function getSavedValue(field) {
    return settings[field.key]?.settingValue ?? (field.type === 'boolean' ? false : '');
  }

  function hasPendingChange(field) {
    if (field.key === 'branding.logoUrl' && pendingLogoFile) return true;
    if (field.type === 'boolean') return Boolean(form[field.key]) !== Boolean(getSavedValue(field));
    return String(form[field.key] || '') !== String(getSavedValue(field) || '');
  }

  async function saveField(field) {
    setSavingKey(field.key);
    setMessage('');
    setError('');
    try {
      if (field.key === 'branding.logoUrl' && pendingLogoFile) {
        const data = await settingsService.uploadLogo(pendingLogoFile);
        const uploadedVersion = String(Date.now());
        const uploadedSetting = data.setting || {
          settingKey: 'branding.logoUrl',
          settingValue: data.logoUrl,
          updatedAt: new Date().toISOString(),
        };
        uploadedSetting.settingValue = data.logoUrl;
        uploadedSetting.updatedAt = uploadedSetting.updatedAt || new Date().toISOString();

        updateField('branding.logoUrl', data.logoUrl);
        setSettings((current) => ({
          ...current,
          'branding.logoUrl': uploadedSetting,
        }));
        setPendingLogoFile(null);
        setPendingLogoPreview('');
        setLogoPreviewVersion(uploadedVersion);
        setMessage('System logo uploaded.');
        await refreshBranding({ logoUrl: data.logoUrl, logoVersion: uploadedVersion });
        return;
      }

      await settingsService.saveMany([
        {
          settingKey: field.key,
          settingValue: form[field.key],
          description: field.description,
        },
      ]);
      setSettings((current) => ({
        ...current,
        [field.key]: {
          ...(current[field.key] || {}),
          settingKey: field.key,
          settingValue: form[field.key],
          description: field.description,
          updatedAt: new Date().toISOString(),
        },
      }));
      setMessage(`${field.label} uploaded.`);
      if (field.key === 'branding.universityName') {
        await refreshBranding({ universityName: form[field.key] });
      } else {
        await refreshBranding();
      }
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, `Unable to upload ${field.label}.`));
    } finally {
      setSavingKey('');
    }
  }

  async function saveSupportSettings() {
    setSavingKey('support.contact');
    setMessage('');
    setError('');
    try {
      const savedSettings = supportFields.map((field) => ({
        settingKey: field.key,
        settingValue: form[field.key],
        description: field.description,
      }));
      await settingsService.saveMany(savedSettings);
      setSettings((current) => ({
        ...current,
        ...Object.fromEntries(
          savedSettings.map((setting) => [
            setting.settingKey,
            {
              ...(current[setting.settingKey] || {}),
              settingKey: setting.settingKey,
              settingValue: setting.settingValue,
              description: setting.description,
              updatedAt: new Date().toISOString(),
            },
          ]),
        ),
      }));
      window.dispatchEvent(
        new CustomEvent('support-settings-changed', {
          detail: {
            email: form['support.email'] || '',
            phone: form['support.phone'] || '',
          },
        }),
      );
      setMessage('Support contact changed.');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to change support contact.'));
    } finally {
      setSavingKey('');
    }
  }

  function cancelSupportSettings() {
    supportFields.forEach((field) => updateField(field.key, getSavedValue(field)));
    setMessage('');
    setError('');
  }

  function cancelField(field) {
    updateField(field.key, getSavedValue(field));
    if (field.key === 'branding.logoUrl') {
      setPendingLogoFile(null);
      setPendingLogoPreview('');
    }
    setMessage('');
    setError('');
  }

  function stageLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setMessage('');
    setError('');
    if (pendingLogoPreview) {
      URL.revokeObjectURL(pendingLogoPreview);
    }
    setPendingLogoFile(file);
    setPendingLogoPreview(URL.createObjectURL(file));
  }

  function updateAcademicYearField(key, value) {
    setAcademicYearForm((current) => ({ ...current, [key]: value }));
  }

  function editAcademicYear(academicYear) {
    setEditingAcademicYearId(academicYear.id);
    setAcademicYearForm({
      name: academicYear.name || '',
      startDate: toDateInputValue(academicYear.startDate),
      endDate: toDateInputValue(academicYear.endDate),
      status: academicYear.status || 'upcoming',
      isCurrent: Boolean(academicYear.isCurrent),
      description: academicYear.description || '',
    });
    setMessage('');
    setError('');
  }

  function resetAcademicYearForm() {
    setEditingAcademicYearId(null);
    setAcademicYearForm(emptyAcademicYearForm());
  }

  async function saveAcademicYear(event) {
    event.preventDefault();
    setSavingAcademicYear(true);
    setMessage('');
    setError('');

    try {
      const payload = normalizeAcademicYearPayload(academicYearForm);
      const saved = editingAcademicYearId
        ? await academicYearService.update(editingAcademicYearId, payload)
        : await academicYearService.create(payload);

      setAcademicYears((current) => {
        const withoutSaved = current.filter((item) => Number(item.id) !== Number(saved.id));
        const next = saved.isCurrent
          ? withoutSaved.map((item) => ({ ...item, isCurrent: false }))
          : withoutSaved;
        return [saved, ...next].sort((a, b) => {
          if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
          return String(b.startDate || b.name).localeCompare(String(a.startDate || a.name));
        });
      });
      setSettings((current) => ({
        ...current,
        'academic.year': {
          ...(current['academic.year'] || {}),
          settingKey: 'academic.year',
          settingValue: saved.isCurrent ? saved.name : current['academic.year']?.settingValue,
          description: 'Current academic year label.',
          updatedAt: new Date().toISOString(),
        },
      }));
      setMessage(`Academic year ${editingAcademicYearId ? 'updated' : 'created'}.`);
      resetAcademicYearForm();
      await loadSettings();
      await loadAcademicYears();
    } catch (apiError) {
      setError(
        getApiErrorMessage(
          apiError,
          'Unable to save academic year. Check the name, dates, and whether the record already exists.',
        ),
      );
    } finally {
      setSavingAcademicYear(false);
    }
  }

  async function deleteAcademicYear(academicYear) {
    setDeletingAcademicYearId(academicYear.id);
    setMessage('');
    setError('');

    try {
      await academicYearService.remove(academicYear.id);
      setAcademicYears((current) => current.filter((item) => Number(item.id) !== Number(academicYear.id)));
      if (academicYear.isCurrent) {
        setSettings((current) => ({
          ...current,
          'academic.year': {
            ...(current['academic.year'] || {}),
            settingKey: 'academic.year',
            settingValue: '',
            description: 'Current academic year label.',
            updatedAt: new Date().toISOString(),
          },
        }));
      }
      setMessage('Academic year deleted.');
      if (Number(editingAcademicYearId) === Number(academicYear.id)) {
        resetAcademicYearForm();
      }
      await loadSettings();
      await loadAcademicYears();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to delete academic year.'));
    } finally {
      setDeletingAcademicYearId(null);
    }
  }

  function updateTimezoneField(key, value) {
    setTimezoneForm((current) => ({ ...current, [key]: value }));
  }

  function editTimezone(timezone) {
    setEditingTimezoneId(timezone.id);
    setTimezoneForm({
      name: timezone.name || '',
      utcOffset: timezone.utcOffset || '',
      status: timezone.status || 'active',
      isDefault: Boolean(timezone.isDefault),
      description: timezone.description || '',
    });
    setMessage('');
    setError('');
  }

  function resetTimezoneForm() {
    setEditingTimezoneId(null);
    setTimezoneForm(emptyTimezoneForm());
  }

  async function saveTimezone(event) {
    event.preventDefault();
    setSavingTimezone(true);
    setMessage('');
    setError('');

    try {
      const payload = normalizeTimezonePayload(timezoneForm);
      const saved = editingTimezoneId
        ? await timezoneService.update(editingTimezoneId, payload)
        : await timezoneService.create(payload);

      setTimezones((current) => {
        const withoutSaved = current.filter((item) => Number(item.id) !== Number(saved.id));
        const next = saved.isDefault
          ? withoutSaved.map((item) => ({ ...item, isDefault: false }))
          : withoutSaved;
        return [saved, ...next].sort((a, b) => {
          if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
          return String(a.name).localeCompare(String(b.name));
        });
      });
      if (saved.isDefault) {
        setSettings((current) => ({
          ...current,
          'system.timezone': {
            ...(current['system.timezone'] || {}),
            settingKey: 'system.timezone',
            settingValue: saved.name,
            description: 'Timezone used for platform dates.',
            updatedAt: new Date().toISOString(),
          },
        }));
      }
      setMessage(`Timezone ${editingTimezoneId ? 'updated' : 'created'}.`);
      resetTimezoneForm();
      await loadSettings();
      await loadTimezones();
    } catch (apiError) {
      setError(
        getApiErrorMessage(
          apiError,
          'Unable to save timezone. Check the timezone name, UTC offset, and whether the record already exists.',
        ),
      );
    } finally {
      setSavingTimezone(false);
    }
  }

  async function deleteTimezone(timezone) {
    setDeletingTimezoneId(timezone.id);
    setMessage('');
    setError('');

    try {
      await timezoneService.remove(timezone.id);
      setTimezones((current) => current.filter((item) => Number(item.id) !== Number(timezone.id)));
      if (timezone.isDefault) {
        setSettings((current) => ({
          ...current,
          'system.timezone': {
            ...(current['system.timezone'] || {}),
            settingKey: 'system.timezone',
            settingValue: '',
            description: 'Timezone used for platform dates.',
            updatedAt: new Date().toISOString(),
          },
        }));
      }
      setMessage('Timezone deleted.');
      if (Number(editingTimezoneId) === Number(timezone.id)) {
        resetTimezoneForm();
      }
      await loadSettings();
      await loadTimezones();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to delete timezone.'));
    } finally {
      setDeletingTimezoneId(null);
    }
  }

  function renderField(field) {
    if (field.type === 'boolean') {
      return (
        <div className="rounded-lg border border-line p-4">
          <Checkbox
            label="Enabled"
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
          value={form[field.key] || ''}
          options={[{ label: 'Not configured', value: '' }, ...field.options]}
          onChange={(event) => updateField(field.key, event.target.value)}
        />
      );
    }

    if (field.key === 'branding.logoUrl') {
      return (
        <div className="space-y-3">
          <label className="focus-within:ring-primary flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-primary hover:bg-slate-50 focus-within:ring-2">
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={stageLogo}
              disabled={savingKey === field.key}
            />
            <FiUploadCloud className="size-5 text-primary" />
            {pendingLogoFile ? pendingLogoFile.name : 'Choose logo image'}
          </label>
          {logoPreviewUrl ? (
            <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
              <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white shadow-sm">
                <img
                  src={logoPreviewUrl}
                  alt="Current system logo preview"
                  className="size-full object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Current logo preview</p>
                {!pendingLogoFile ? (
                  <a
                    href={logoPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    Open logo
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <Input
        type={field.type}
        value={form[field.key] || ''}
        onChange={(event) => updateField(field.key, event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (hasPendingChange(field) && !savingKey) {
              saveField(field);
            }
          }
        }}
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
          <p className="text-2xl font-bold text-ink">{settingFields.length + 2}</p>
          <p className="text-sm text-muted">Managed Keys</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">
            {isLoading || isAcademicYearLoading || isTimezoneLoading ? 'Loading' : 'Live DB'}
          </p>
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

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div className="min-w-0">
            <span className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-primary">
              Academic
            </span>
            <h3 className="text-lg font-bold text-ink">Academic Year</h3>
            <p className="mt-1 text-sm text-muted">
              Create, update, delete, and choose the current academic year from database records.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            {academicYears.length} Records
          </span>
        </div>

        <form onSubmit={saveAcademicYear} className="grid gap-4 lg:grid-cols-4">
          <Input
            label="Academic Year Name"
            value={academicYearForm.name}
            onChange={(event) => updateAcademicYearField('name', event.target.value)}
            placeholder="2026/2027"
            required
          />
          <Input
            label="Start Date"
            type="date"
            value={academicYearForm.startDate}
            onChange={(event) => updateAcademicYearField('startDate', event.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={academicYearForm.endDate}
            onChange={(event) => updateAcademicYearField('endDate', event.target.value)}
          />
          <SelectBox
            label="Status"
            value={academicYearForm.status}
            options={[
              { label: 'Upcoming', value: 'upcoming' },
              { label: 'Active', value: 'active' },
              { label: 'Archived', value: 'archived' },
            ]}
            onChange={(event) => updateAcademicYearField('status', event.target.value)}
          />
          <div className="lg:col-span-3">
            <Textarea
              label="Description"
              value={academicYearForm.description}
              onChange={(event) => updateAcademicYearField('description', event.target.value)}
              placeholder="Optional note"
              className="min-h-20"
            />
          </div>
          <div className="flex flex-col justify-end gap-3">
            <Checkbox
              label="Set as current"
              checked={academicYearForm.isCurrent}
              onChange={(event) => updateAcademicYearField('isCurrent', event.target.checked)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" isLoading={savingAcademicYear}>
                <FiCheck />
                {editingAcademicYearId ? 'Update' : 'Create'}
              </Button>
              {editingAcademicYearId ? (
                <Button type="button" variant="secondary" onClick={resetAcademicYearForm}>
                  <FiX />
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="mt-5 overflow-hidden rounded-xl border border-line">
          {isAcademicYearLoading ? (
            <div className="p-5">
              <Loader label="Loading academic years" />
            </div>
          ) : academicYears.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-left text-sm">
                <thead className="bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Dates</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {academicYears.map((academicYear) => (
                    <tr key={academicYear.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{academicYear.name}</div>
                        {academicYear.isCurrent ? (
                          <span className="mt-1 inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Current
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {toDateInputValue(academicYear.startDate) || 'Not set'} -{' '}
                        {toDateInputValue(academicYear.endDate) || 'Not set'}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted">{academicYear.status}</td>
                      <td className="px-4 py-3 text-muted">
                        {academicYear.updatedAt
                          ? new Date(academicYear.updatedAt).toLocaleString()
                          : 'Not updated'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-9 px-3"
                            onClick={() => editAcademicYear(academicYear)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="min-h-9 px-3"
                            isLoading={deletingAcademicYearId === academicYear.id}
                            onClick={() => deleteAcademicYear(academicYear)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-5 text-sm text-muted">
              No academic years have been created yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div className="min-w-0">
            <span className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-primary">
              System
            </span>
            <h3 className="text-lg font-bold text-ink">Timezone</h3>
            <p className="mt-1 text-sm text-muted">
              Create, update, delete, and choose the default timezone from database records.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            {timezones.length} Records
          </span>
        </div>

        <form onSubmit={saveTimezone} className="grid gap-4 lg:grid-cols-4">
          <Input
            label="Timezone Name"
            value={timezoneForm.name}
            onChange={(event) => updateTimezoneField('name', event.target.value)}
            placeholder="Asia/Colombo"
            required
          />
          <Input
            label="UTC Offset"
            value={timezoneForm.utcOffset}
            onChange={(event) => updateTimezoneField('utcOffset', event.target.value)}
            placeholder="UTC+05:30"
          />
          <SelectBox
            label="Status"
            value={timezoneForm.status}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
            onChange={(event) => updateTimezoneField('status', event.target.value)}
          />
          <div className="flex flex-col justify-end gap-3">
            <Checkbox
              label="Set as default"
              checked={timezoneForm.isDefault}
              onChange={(event) => updateTimezoneField('isDefault', event.target.checked)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" isLoading={savingTimezone}>
                <FiCheck />
                {editingTimezoneId ? 'Update' : 'Create'}
              </Button>
              {editingTimezoneId ? (
                <Button type="button" variant="secondary" onClick={resetTimezoneForm}>
                  <FiX />
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
          <div className="lg:col-span-4">
            <Textarea
              label="Description"
              value={timezoneForm.description}
              onChange={(event) => updateTimezoneField('description', event.target.value)}
              placeholder="Optional note"
              className="min-h-20"
            />
          </div>
        </form>

        <div className="mt-5 overflow-hidden rounded-xl border border-line">
          {isTimezoneLoading ? (
            <div className="p-5">
              <Loader label="Loading timezones" />
            </div>
          ) : timezones.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-left text-sm">
                <thead className="bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">UTC Offset</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {timezones.map((timezone) => (
                    <tr key={timezone.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{timezone.name}</div>
                        {timezone.isDefault ? (
                          <span className="mt-1 inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Default
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted">{timezone.utcOffset || 'Not set'}</td>
                      <td className="px-4 py-3 capitalize text-muted">{timezone.status}</td>
                      <td className="px-4 py-3 text-muted">
                        {timezone.updatedAt
                          ? new Date(timezone.updatedAt).toLocaleString()
                          : 'Not updated'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-9 px-3"
                            onClick={() => editTimezone(timezone)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="min-h-9 px-3"
                            isLoading={deletingTimezoneId === timezone.id}
                            onClick={() => deleteTimezone(timezone)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-5 text-sm text-muted">
              No timezones have been created yet.
            </div>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-6">
          <Loader label="Loading settings" />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5 xl:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="min-w-0">
                <span className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-primary">
                  Support
                </span>
                <h3 className="text-lg font-bold text-ink">Support Contact</h3>
                <p className="mt-1 text-sm text-muted">
                  Email and phone number shown in the support calendar panel across LMS pages.
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${supportFields.some((field) => settings[field.key]) ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-muted'}`}>
                {supportFields.some((field) => settings[field.key]) ? 'Configured' : 'Not set'}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {supportFields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type={field.type}
                  value={form[field.key] || ''}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      if (hasSupportChange && !savingKey) {
                        saveSupportSettings();
                      }
                    }
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
              <span>
                {supportFields.some((field) => settings[field.key]?.updatedAt)
                  ? `Updated ${new Date(
                      supportFields
                        .map((field) => settings[field.key]?.updatedAt)
                        .filter(Boolean)
                        .sort()
                        .at(-1),
                    ).toLocaleString()}`
                  : 'Not configured'}
              </span>
              {hasSupportChange ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    className="min-h-9 px-3"
                    isLoading={savingKey === 'support.contact'}
                    onClick={saveSupportSettings}
                  >
                    <FiCheck />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-9 px-3"
                    disabled={savingKey === 'support.contact'}
                    onClick={cancelSupportSettings}
                  >
                    <FiX />
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {editableSettingFields.map((field) => {
            const isDirty = hasPendingChange(field);
            return (
              <Card
                key={field.key}
                className={`p-5 ${field.key === 'branding.logoUrl' ? 'xl:row-span-2' : ''}`}
              >
                <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-primary">
                      {field.group}
                    </span>
                    <h3 className="text-lg font-bold text-ink">{field.label}</h3>
                    <p className="mt-1 text-sm text-muted">{field.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${settings[field.key] ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-muted'}`}>
                    {settings[field.key] ? 'Configured' : 'Not set'}
                  </span>
                </div>

                <div className="space-y-4">
                  {renderField(field)}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
                    <span>
                      {settings[field.key]
                        ? `Updated ${new Date(settings[field.key].updatedAt).toLocaleString()}`
                        : 'Not configured'}
                    </span>
                    {isDirty ? (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          className="min-h-9 px-3"
                          isLoading={savingKey === field.key}
                          onClick={() => saveField(field)}
                        >
                          <FiCheck />
                          Upload
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-9 px-3"
                          disabled={savingKey === field.key}
                          onClick={() => cancelField(field)}
                        >
                          <FiX />
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
