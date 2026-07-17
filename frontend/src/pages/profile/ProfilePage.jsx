import { useEffect, useMemo, useState } from 'react';
import { FiCamera, FiLock, FiMonitor, FiShield, FiUser } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { profileService } from '../../services/profileService';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function resolveProfilePhotoUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${apiOrigin}${value}`;
  return `${apiOrigin}/uploads/profiles/${value}`;
}

function appendCacheBuster(url, version) {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((item) => item.msg || item.message).filter(Boolean).join(', ');
  }

  return data?.message || error?.message || fallback;
}

function validateProfileForm(form) {
  if (!form.fullName?.trim() || form.fullName.trim().length < 2) {
    return 'Full name must be at least 2 characters.';
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return 'Enter a valid email address.';
  }

  if (form.phone && !/^[+()\-\s0-9]{6,30}$/.test(form.phone)) {
    return 'Enter a valid phone number.';
  }

  return '';
}

function formatRole(role) {
  return String(role || '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value, fallback = 'Not recorded') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
}

function buildProfileDetails(profile) {
  const details = [
    ['Username', profile.username],
    ['Email', profile.email],
    ['Phone Number', profile.phone],
    ['Address', profile.address],
    ['Role', formatRole(profile.role)],
    ['Joined Date', formatDate(profile.joinedDate)],
    ['Account Status', profile.status],
    ['Last Login', profile.lastLogin ? formatDate(profile.lastLogin) : null],
  ];

  if (['admin', 'teacher'].includes(profile.role)) {
    details.push(['Department', profile.department]);
    details.push(['Employee ID', profile.employeeId]);
  }

  if (profile.role === 'teacher') {
    details.push(['Qualification', profile.qualification]);
  }

  if (profile.role === 'student') {
    details.push(['Student ID', profile.studentId]);
    details.push(['Curriculum', profile.curriculum]);
  }

  return details.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
}

function buildEditableFields(role) {
  const fields = [
    ['fullName', 'Full Name'],
    ['email', 'Email'],
    ['phone', 'Phone Number'],
  ];

  if (['admin', 'teacher'].includes(role)) {
    fields.push(['department', 'Department']);
  }

  if (role === 'teacher') {
    fields.push(['qualification', 'Qualification']);
  }

  if (role === 'student') {
    fields.push(['curriculum', 'Curriculum']);
  }

  fields.push(['address', 'Address']);
  return fields;
}

function getPasswordCompletion(form) {
  return [
    form.currentPassword.trim(),
    form.newPassword.trim(),
    form.confirmPassword.trim(),
  ].filter(Boolean).length;
}

function formatSessionDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString();
}

function getSessionUserAgent(session) {
  return session.userAgent || session.deviceInfo?.userAgent || session.deviceInfo?.raw || '';
}

function getSessionBrowser(session) {
  const userAgent = getSessionUserAgent(session);

  if (!userAgent) return 'Unknown browser';
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Safari\//i.test(userAgent)) return 'Safari';

  return 'Browser detected';
}

function getSessionDevice(session) {
  const userAgent = getSessionUserAgent(session);

  if (session.deviceInfo?.deviceName) return session.deviceInfo.deviceName;
  if (session.deviceInfo?.device) return session.deviceInfo.device;
  if (/Windows/i.test(userAgent)) return 'Windows device';
  if (/Mac OS|Macintosh/i.test(userAgent)) return 'Mac device';
  if (/Android/i.test(userAgent)) return 'Android device';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS device';
  if (/Linux/i.test(userAgent)) return 'Linux device';

  return 'Unknown device';
}

function getSessionLocation(session) {
  return session.location || session.deviceInfo?.location || session.deviceInfo?.city || 'Location unavailable';
}

function getSessionTitle(session) {
  const browser = getSessionBrowser(session);
  const device = getSessionDevice(session);

  if (browser === 'Unknown browser') {
    return device;
  }

  return `${browser} on ${device}`;
}

function getSessionRawDetails(session) {
  const userAgent = session.userAgent || session.deviceInfo?.userAgent || session.deviceInfo?.raw || '';
  return userAgent || 'No browser signature recorded';
}

export function ProfilePage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [logoutAllPassword, setLogoutAllPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [sessionAction, setSessionAction] = useState('');
  const [photoVersion, setPhotoVersion] = useState(Date.now());

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await profileService.getProfile();
      setData(response);
      setForm(response.profile || {});
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load profile details.'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSessions = async ({ showError = false } = {}) => {
    try {
      const response = await profileService.getSessions();
      setData((current) => (current ? { ...current, sessions: response.sessions || [] } : current));
      if (showError) {
        setError('');
      }
    } catch (err) {
      if (showError) {
        setError(getApiErrorMessage(err, 'Unable to refresh connected sessions.'));
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshSessions();
    }, 30000);
    const handleFocus = () => refreshSessions();

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const passwordCompletion = useMemo(() => getPasswordCompletion(passwordForm), [passwordForm]);

  const handleSave = async (event) => {
    event.preventDefault();
    const validationMessage = validateProfileForm(form);

    if (validationMessage) {
      setError(validationMessage);
      setMessage('');
      return;
    }

    setIsSavingProfile(true);
    setError('');
    setMessage('');

    try {
      await profileService.updateProfile(form);
      setMessage('Profile updated successfully.');
      await loadProfile();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();

    if (passwordCompletion < 3) {
      setError('Current password, new password, and confirm password are required.');
      setMessage('');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }

    setIsChangingPassword(true);
    setError('');
    setMessage('');

    try {
      await profileService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully.');
      await loadProfile();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !data) {
    return <Loader label="Loading profile" />;
  }

  const profile = data.profile;
  const profilePhotoUrl = appendCacheBuster(resolveProfilePhotoUrl(profile.profilePhoto), photoVersion);
  const profileDetails = buildProfileDetails(profile);
  const editableFields = buildEditableFields(profile.role);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Profile Management"
        description="Manage your profile, security, sessions, login history, privacy, and preferences."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <Card className="p-6">
          <div className="text-center">
            <div className="mx-auto grid size-24 place-items-center overflow-hidden rounded-2xl bg-orange-50 text-primary">
              {profile.profilePhoto ? <img src={profilePhotoUrl} alt="Profile" className="size-full object-cover" /> : <FiUser className="size-10" />}
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink">{profile.fullName}</h2>
            <p className="text-sm text-muted">{formatRole(profile.role)}</p>
            <p className="mt-2 text-sm text-muted">{profile.email}</p>
            <div className="mt-5 flex flex-col gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">
                <FiCamera />
                {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setIsUploadingPhoto(true);
                      setError('');
                      setMessage('');

                      try {
                        const updatedProfile = await profileService.uploadPhoto(file);
                        setData((current) => ({ ...current, profile: updatedProfile }));
                        setForm(updatedProfile || {});
                        setPhotoVersion(Date.now());
                        setMessage('Profile photo uploaded successfully.');
                      } catch (err) {
                        setError(getApiErrorMessage(err, 'Unable to upload profile photo.'));
                      } finally {
                        setIsUploadingPhoto(false);
                        event.target.value = '';
                      }
                    }
                  }}
                />
              </label>
              <Button
                variant="secondary"
                disabled={isRemovingPhoto || !profile.profilePhoto}
                onClick={async () => {
                  setIsRemovingPhoto(true);
                  setError('');
                  setMessage('');

                  try {
                    await profileService.removePhoto();
                    setData((current) => ({
                      ...current,
                      profile: { ...current.profile, profilePhoto: null },
                    }));
                    setForm((current) => ({ ...current, profilePhoto: null }));
                    setPhotoVersion(Date.now());
                    setMessage('Profile photo removed successfully.');
                  } catch (err) {
                    setError(getApiErrorMessage(err, 'Unable to remove profile photo.'));
                  } finally {
                    setIsRemovingPhoto(false);
                  }
                }}
              >
                {isRemovingPhoto ? 'Removing...' : 'Remove Photo'}
              </Button>
            </div>
          </div>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line text-sm">
            {profileDetails.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
                <span className="font-semibold text-muted">{label}</span>
                <span className="font-semibold text-ink sm:text-right">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FiUser /> Edit Profile</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
              {editableFields.map(([key, label]) => (
                <label key={key} className="text-sm font-semibold text-ink">
                  {label}
                  <input
                    type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                    value={form[key] || ''}
                    onChange={(event) => setForm((value) => ({ ...value, [key]: event.target.value }))}
                    className="mt-2 min-h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
                  />
                </label>
              ))}
              <label className="text-sm font-semibold text-ink md:col-span-2">
                Bio
                <textarea
                  value={form.bio || ''}
                  onChange={(event) => setForm((value) => ({ ...value, bio: event.target.value }))}
                  className="mt-2 min-h-24 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <Button type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Profile'}</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FiLock /> Change Password</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={handlePassword}>
              {[
                ['currentPassword', 'Current Password'],
                ['newPassword', 'New Password'],
                ['confirmPassword', 'Confirm Password'],
              ].map(([key, label]) => (
                <label key={key} className="text-sm font-semibold text-ink">
                  {label}
                  <input
                    type="password"
                    value={passwordForm[key]}
                    onChange={(event) => setPasswordForm((value) => ({ ...value, [key]: event.target.value }))}
                    className="mt-2 min-h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
                  />
                </label>
              ))}
              <div className="md:col-span-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-primary" style={{ width: `${(passwordCompletion / 3) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">Password fields completed: {passwordCompletion}/3</p>
              </div>
              <Button type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Changing...' : 'Change Password'}</Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FiMonitor /> Connected Sessions</h2>
              <p className="mt-1 text-sm text-muted">Active devices using your account from the database.</p>
            </div>
            <Button variant="secondary" disabled={sessionAction === 'refresh-sessions'} onClick={async () => {
              setSessionAction('refresh-sessions');
              await refreshSessions({ showError: true });
              setSessionAction('');
            }}>
              {sessionAction === 'refresh-sessions' ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {data.sessions.map((session) => (
              <div key={`${session.source}-${session.id}`} className="flex flex-col gap-4 rounded-xl border border-line bg-page/60 p-4 text-sm md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{getSessionTitle(session)}</p>
                    {session.isCurrent ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Current session</span>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${session.isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {session.isActive ? 'Active' : 'Logged out'}
                    </span>
                  </div>
                  <div className="grid gap-1 text-muted sm:grid-cols-2">
                    <p>Browser: {getSessionBrowser(session)}</p>
                    <p>Device: {getSessionDevice(session)}</p>
                    <p>Location: {getSessionLocation(session)}</p>
                    <p>IP: {session.ipAddress || 'Unknown IP'}</p>
                    <p>Login: {formatSessionDate(session.loginAt)}</p>
                    <p>Last active: {formatSessionDate(session.lastSeenAt || session.loginAt)}</p>
                  </div>
                  {session.logoutAt ? <p className="text-muted">Logout: {formatSessionDate(session.logoutAt)}</p> : null}
                  <p className="truncate text-xs text-muted" title={getSessionRawDetails(session)}>{getSessionRawDetails(session)}</p>
                </div>
                <Button
                  variant="secondary"
                  disabled={session.isCurrent || !session.isActive || sessionAction === `session-${session.sessionId}`}
                  onClick={async () => {
                    setSessionAction(`session-${session.sessionId}`);
                    setError('');
                    setMessage('');

                    try {
                      await profileService.deleteSession(session.sessionId);
                      setMessage('Session logged out successfully.');
                      await refreshSessions({ showError: true });
                    } catch (err) {
                      setError(getApiErrorMessage(err, 'Unable to logout this session.'));
                    } finally {
                      setSessionAction('');
                    }
                  }}
                >
                  {session.isCurrent ? 'Current' : sessionAction === `session-${session.sessionId}` ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            ))}
            {!data.sessions.length ? <p className="text-sm text-muted">No connected sessions found.</p> : null}
          </div>
          <Button
            className="mt-4"
            variant="secondary"
            disabled={sessionAction === 'other-sessions'}
            onClick={async () => {
              setSessionAction('other-sessions');
              setError('');
              setMessage('');

              try {
                await profileService.deleteSessions({ keepCurrent: true });
                setMessage('Other sessions logged out successfully.');
                await refreshSessions({ showError: true });
              } catch (err) {
                setError(getApiErrorMessage(err, 'Unable to logout other sessions.'));
              } finally {
                setSessionAction('');
              }
            }}
          >
            {sessionAction === 'other-sessions' ? 'Logging out...' : 'Logout Other Sessions'}
          </Button>
          <div className="mt-4 rounded-xl border border-line p-3">
            <label className="text-sm font-semibold text-ink">
              Confirm password to logout all devices
              <input
                type="password"
                value={logoutAllPassword}
                onChange={(event) => setLogoutAllPassword(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
              />
            </label>
            <Button
              className="mt-3"
              variant="danger"
              disabled={!logoutAllPassword || sessionAction === 'all-sessions'}
              onClick={async () => {
                setSessionAction('all-sessions');
                setError('');
                setMessage('');

                try {
                  await profileService.deleteSessions({ keepCurrent: false, password: logoutAllPassword });
                  setLogoutAllPassword('');
                  setMessage('All devices logged out successfully.');
                  await refreshSessions({ showError: true });
                } catch (err) {
                  setError(getApiErrorMessage(err, 'Unable to logout all devices.'));
                } finally {
                  setSessionAction('');
                }
              }}
            >
              {sessionAction === 'all-sessions' ? 'Logging out...' : 'Logout All Devices'}
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FiShield /> Account Activity</h2>
          <div className="mt-4 space-y-3">
            {data.securityEvents.map((event) => (
              <div key={`${event.eventType}-${event.createdAt}`} className="rounded-xl bg-page p-3 text-sm">
                <p className="font-semibold text-ink">{event.description}</p>
                <p className="text-muted">{new Date(event.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!data.securityEvents.length ? <p className="text-sm text-muted">No security events yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
