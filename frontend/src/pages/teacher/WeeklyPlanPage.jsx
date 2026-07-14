import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { weeklyPlans } from '../../data/teacherData';

export function WeeklyPlanPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Weekly Teaching Plan" description="Plan topics, learning objectives, references, activities, homework, next week topics, and completion status." actionLabel="Create Weekly Plan" />
      <div className="grid gap-5 lg:grid-cols-2">
        {weeklyPlans.map((plan) => (
          <Card key={plan.id} className="p-5">
            <div className="flex justify-between gap-4"><h2 className="text-lg font-bold text-ink">Week {plan.week}: {plan.currentTopic}</h2><StatusBadge status={plan.status} /></div>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <p><span className="font-semibold text-ink">Learning Objectives:</span> {plan.objectives}</p>
              <p><span className="font-semibold text-ink">Reference Materials:</span> Published LMS materials</p>
              <p><span className="font-semibold text-ink">Practical Activities:</span> Lab practice and class discussion</p>
              <p><span className="font-semibold text-ink">Homework:</span> Weekly assignment</p>
              <p><span className="font-semibold text-ink">Next Week Topic:</span> {plan.nextTopic}</p>
            </div>
            <div className="mt-5 flex gap-2"><Button variant="secondary">Edit</Button><Button>Mark Completed</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
