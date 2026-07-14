import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, SelectBox } from '../../components/ui/FormControls';
import { Input } from '../../components/ui/Input';

export function TeacherSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Settings" description="Configure notification preferences, upload defaults, theme preview, and language placeholder." />
      <Card className="p-6"><form className="grid gap-5 md:grid-cols-2"><Checkbox label="Notify me when students complete quizzes" /><Checkbox label="Notify me when assignments are submitted" /><SelectBox label="Default Upload Visibility" options={[{ label: 'Draft', value: 'Draft' }, { label: 'Published', value: 'Published' }]} /><Input label="Maximum Upload Size" defaultValue="100 MB" /><SelectBox label="Language" options={[{ label: 'English', value: 'English' }, { label: 'Sinhala Placeholder', value: 'Sinhala' }]} /><div className="rounded-xl border border-line bg-page p-4"><p className="text-sm font-semibold text-ink">Theme Preview</p><div className="mt-3 h-12 rounded-xl bg-primary" /></div><div className="flex justify-end md:col-span-2"><Button type="button">Save Settings</Button></div></form></Card>
    </div>
  );
}
