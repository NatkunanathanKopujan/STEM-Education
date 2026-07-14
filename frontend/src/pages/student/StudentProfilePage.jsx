import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { PasswordInput } from '../../components/ui/FormControls';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export function StudentProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Profile" description="View student information, edit profile, change password, and upload profile photo." />
      <Card className="p-6"><form className="grid gap-5 md:grid-cols-2"><Input label="Full Name" defaultValue={user?.fullName || user?.name || ''} /><Input label="Email" defaultValue={user?.email || ''} /><Input label="Student ID" defaultValue={user?.studentId || ''} /><Input label="Curriculum" defaultValue={user?.curriculum || ''} /><FileUpload label="Profile Photo" accept="image/*" /><Input label="Batch" defaultValue={user?.batch || ''} /><PasswordInput label="Current Password" /><PasswordInput label="New Password" /><div className="flex justify-end md:col-span-2"><Button type="button">Save Profile</Button></div></form></Card>
    </div>
  );
}
