import { FiClock, FiMail, FiShield, FiUser } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { PasswordInput } from '../../components/ui/FormControls';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export function SuperAdminProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="View account information, update profile details, upload profile photo, and change password." />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <div className="text-center">
            <span className="mx-auto grid size-20 place-items-center rounded-xl bg-orange-50 text-2xl font-bold text-primary">
              {(user?.fullName || user?.name || 'SA').slice(0, 2).toUpperCase()}
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">{user?.fullName || user?.name || 'Super Admin'}</h2>
            <p className="mt-1 text-sm text-muted">{user?.email || 'superadmin@university.edu'}</p>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-3 text-muted"><FiShield className="text-primary" /> Role: Super Admin</p>
            <p className="flex items-center gap-3 text-muted"><FiClock className="text-primary" /> Last Login: {user?.lastLogin || 'Today'}</p>
            <p className="flex items-center gap-3 text-muted"><FiMail className="text-primary" /> Account Status: Active</p>
          </div>
        </Card>
        <Card className="p-6">
          <form className="grid gap-5 md:grid-cols-2">
            <Input label="Full Name" defaultValue={user?.fullName || user?.name || 'Super Admin'} />
            <Input label="Email" defaultValue={user?.email || 'superadmin@university.edu'} />
            <Input label="Username" defaultValue={user?.username || 'super.admin'} />
            <FileUpload label="Profile Photo Upload" helperText="PNG, JPG, or WEBP" accept="image/*" />
            <PasswordInput label="Current Password" />
            <PasswordInput label="New Password" />
            <div className="flex justify-end md:col-span-2">
              <Button type="button"><FiUser className="size-4" /> Save Profile</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
