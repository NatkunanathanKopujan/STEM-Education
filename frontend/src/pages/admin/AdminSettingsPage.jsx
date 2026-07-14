import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, SelectBox } from '../../components/ui/FormControls';
import { Input } from '../../components/ui/Input';

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Settings" description="Manage academic year, semester, departments, default password policy, and theme preview." />
      <Card className="p-6">
        <form className="grid gap-5 md:grid-cols-2">
          <SelectBox label="Academic Year" options={[{ label: '2026/2027', value: '2026/2027' }, { label: '2027/2028', value: '2027/2028' }]} />
          <SelectBox label="Semester" options={[{ label: 'Semester 1', value: 'Semester 1' }, { label: 'Semester 2', value: 'Semester 2' }]} />
          <Input label="Department List" defaultValue="Computer Science, Business, English, Data Science" />
          <SelectBox label="Default Password Policy" options={[{ label: 'Strong: 8+ chars with symbol', value: 'strong' }, { label: 'Strict: 12+ chars with symbol', value: 'strict' }]} />
          <div className="rounded-xl border border-line bg-page p-4">
            <p className="text-sm font-semibold text-ink">Theme Preview</p>
            <div className="mt-3 h-12 rounded-xl bg-primary" />
          </div>
          <Checkbox label="Require password change on first login" />
          <div className="flex justify-end md:col-span-2"><Button type="button">Save Settings</Button></div>
        </form>
      </Card>
    </div>
  );
}
