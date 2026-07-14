import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, SelectBox } from '../../components/ui/FormControls';

export function StudentSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Settings" description="Manage notification preferences, language placeholder, and theme preview." />
      <Card className="p-6"><form className="grid gap-5 md:grid-cols-2"><Checkbox label="Notify me when new material is uploaded" /><Checkbox label="Notify me when quizzes are available" /><Checkbox label="Notify me about assignment reminders" /><SelectBox label="Language" options={[{ label: 'English', value: 'English' }, { label: 'Sinhala Placeholder', value: 'Sinhala' }]} /><div className="rounded-xl border border-line bg-page p-4"><p className="text-sm font-semibold text-ink">Theme Preview</p><div className="mt-3 h-12 rounded-xl bg-primary" /></div><div className="flex justify-end md:col-span-2"><Button type="button">Save Settings</Button></div></form></Card>
    </div>
  );
}
