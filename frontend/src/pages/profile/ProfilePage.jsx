import { useEffect, useMemo, useState } from 'react';
import { FiCamera, FiLock, FiMonitor, FiShield, FiUser } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { profileService } from '../../services/profileService';

function strength(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export function ProfilePage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [logoutAllPassword, setLogoutAllPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    setIsLoading(true);
    const response = await profileService.getProfile();
    setData(response);
    setForm(response.profile || {});
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const passwordStrength = useMemo(() => strength(passwordForm.newPassword), [passwordForm.newPassword]);

  const handleSave = async (event) => {
    event.preventDefault();
    await profileService.updateProfile(form);
    setMessage('Profile updated successfully.');
    await loadProfile();
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    await profileService.changePassword(passwordForm);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('Password changed successfully.');
    await loadProfile();
  };

  if (isLoading || !data) {
    return <Loader label="Loading profile" />;
  }

  const profile = data.profile;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Profile Management"
        description="Manage your profile, security, sessions, login history, privacy, and preferences."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <Card className="p-6">
          <div className="text-center">
            <div className="mx-auto grid size-24 place-items-center overflow-hidden rounded-2xl bg-orange-50 text-primary">
              {profile.profilePhoto ? <img src={`/uploads/profiles/${profile.profilePhoto}`} alt="Profile" className="size-full object-cover" /> : <FiUser className="size-10" />}
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink">{profile.fullName}</h2>
            <p className="text-sm text-muted">{profile.role}</p>
            <p className="mt-2 text-sm text-muted">{profile.email}</p>
            <div className="mt-5 flex flex-col gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">
                <FiCamera />
                Upload Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      await profileService.uploadPhoto(file);
                      await loadProfile();
                    }
                  }}
                />
              </label>
              <Button variant="secondary" onClick={async () => { await profileService.removePhoto(); await loadProfile(); }}>
                Remove Photo
              </Button>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <p><span className="font-semibold text-ink">Username:</span> {profile.username}</p>
            <p><span className="font-semibold text-ink">Phone:</span> {profile.phone || 'Not set'}</p>
            <p><span className="font-semibold text-ink">Department:</span> {profile.department || 'Not set'}</p>
            <p><span className="font-semibold text-ink">Employee ID:</span> {profile.employeeId || 'Not applicable'}</p>
            <p><span className="font-semibold text-ink">Student ID:</span> {profile.studentId || 'Not applicable'}</p>
            <p><span className="font-semibold text-ink">Joined:</span> {new Date(profile.joinedDate).toLocaleDateString()}</p>
            <p><span className="font-semibold text-ink">Status:</span> {profile.status}</p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FiUser /> Edit Profile</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
              {[
                ['fullName', 'Full Name'],
                ['email', 'Email'],
                ['phone', 'Phone Number'],
                ['department', 'Department'],
                ...(profile.role === 'teacher' ? [['qualification', 'Qualification']] : []),
                ...(profile.role === 'student' ? [['curriculum', 'Curriculum']] : []),
                ['address', 'Address'],
              ].map(([key, label]) => (
                <label key={key} className="text-sm font-semibold text-ink">
                  {label}
                  <input
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
              <Button type="submit">Save Profile</Button>
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
                  <div className="h-full bg-primary" style={{ width: `${passwordStrength * 20}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">Password strength: {passwordStrength}/5</p>
              </div>
              <Button type="submit">Change Password</Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><FiMonitor /> Connected Sessions</h2>
          <div className="mt-4 space-y-3">
            {data.sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{session.ipAddress || 'Unknown IP'}</p>
                  <p className="text-muted">{session.userAgent || 'Unknown browser'}</p>
                </div>
                <Button variant="secondary" onClick={async () => { await profileService.deleteSession(session.id); await loadProfile(); }}>
                  Logout
                </Button>
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="secondary" onClick={async () => { await profileService.deleteSessions({ keepCurrent: true }); await loadProfile(); }}>
            Logout Other Sessions
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
              disabled={!logoutAllPassword}
              onClick={async () => {
                await profileService.deleteSessions({ keepCurrent: false, password: logoutAllPassword });
                setLogoutAllPassword('');
                await loadProfile();
              }}
            >
              Logout All Devices
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
