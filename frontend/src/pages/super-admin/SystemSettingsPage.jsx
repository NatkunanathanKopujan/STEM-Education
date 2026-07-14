import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, SelectBox } from '../../components/ui/FormControls';
import { FileUpload } from '../../components/ui/FileUpload';
import { Input } from '../../components/ui/Input';

export function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Configure university branding, academic year, timezone, email, backup, and maintenance options." />
      <Card className="p-6">
        <form className="grid gap-5 lg:grid-cols-2">
          <Input label="University Name" defaultValue="AI Smart University" />
          <FileUpload label="System Logo" helperText="PNG, JPG, or WEBP" accept="image/*" />
          <Input label="Primary Color" type="color" defaultValue="#F97316" />
          <Input label="Secondary Color" type="color" defaultValue="#FFFFFF" />
          <SelectBox label="Academic Year" options={[{ label: '2026/2027', value: '2026/2027' }, { label: '2027/2028', value: '2027/2028' }]} />
          <SelectBox label="Timezone" options={[{ label: 'Asia/Colombo', value: 'Asia/Colombo' }, { label: 'UTC', value: 'UTC' }]} />
          <Input label="Email Host" defaultValue="smtp.university.edu" />
          <SelectBox label="Backup Settings" options={[{ label: 'Daily Backup', value: 'daily' }, { label: 'Weekly Backup', value: 'weekly' }]} />
          <Checkbox label="Maintenance Mode" />
          <div className="flex justify-end lg:col-span-2">
            <Button type="button">Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
