import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiEdit3, FiRefreshCw, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmationDialog } from '../../components/ui/Modal';
import { departmentService } from '../../services/departmentService';
import { fileService } from '../../services/fileService';
import { weeklyPlanService } from '../../services/weeklyPlanService';

const acceptedTypes = '.pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.mp4,.mov,.avi';

function emptyForm() {
  return {
    departmentId: '',
    contentType: 'completed',
    weekNo: '',
    topic: '',
    objectives: '',
    activities: '',
    resources: '',
    resourceLink: '',
    plannedDate: '',
    attachmentFileId: '',
    status: 'completed',
  };
}

function apiErrorMessage(error, fallback) {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length) {
    return details.map((item) => `${item.path || item.param}: ${item.msg}`).join(', ');
  }
  return error.response?.data?.message || fallback;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export function WeeklyPlanPage() {
  const [plans, setPlans] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ search: '', contentType: '', departmentId: '' });
  const [form, setForm] = useState(emptyForm);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedDepartment = useMemo(
    () => departments.find((department) => Number(department.id) === Number(form.departmentId)),
    [departments, form.departmentId],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [planData, departmentData] = await Promise.all([
        weeklyPlanService.list({ ...filters, limit: 100 }),
        departmentService.list({ status: 'active', limit: 100 }),
      ]);
      setPlans(planData.plans || []);
      setDepartments(departmentData.departments || departmentData.items || []);
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Unable to load weekly teaching plans.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'contentType'
        ? { status: value === 'completed' ? 'completed' : 'upcoming' }
        : {}),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setAttachment(null);
    setEditingPlan(null);
  };

  const startEdit = (plan) => {
    setEditingPlan(plan);
    setAttachment(null);
    setForm({
      departmentId: plan.departmentId || '',
      contentType: plan.contentType || 'completed',
      weekNo: plan.weekNo || '',
      topic: plan.topic || '',
      objectives: plan.objectives || '',
      activities: plan.activities || '',
      resources: plan.resources || '',
      resourceLink: plan.resourceLink || '',
      plannedDate: plan.plannedDate ? String(plan.plannedDate).slice(0, 10) : '',
      attachmentFileId: plan.attachmentFileId || '',
      status: plan.status || (plan.contentType === 'completed' ? 'completed' : 'upcoming'),
    });
  };

  const uploadAttachmentIfNeeded = async () => {
    if (!attachment) return form.attachmentFileId || null;
    const uploaded = await fileService.upload(attachment, {
      visibility: 'public',
      audience: 'teacher',
      status: 'active',
      departmentIds: String(form.departmentId),
      subject: selectedDepartment?.name || '',
      weekNo: form.weekNo,
      topic: form.topic,
      description: form.contentType === 'completed' ? 'Completed weekly lesson resource' : 'Upcoming weekly lesson resource',
    });
    return uploaded.file?.id || uploaded.id || null;
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const attachmentFileId = await uploadAttachmentIfNeeded();
      const payload = {
        ...form,
        attachmentFileId,
        status: form.contentType === 'completed' ? 'completed' : 'upcoming',
      };
      const result = editingPlan
        ? await weeklyPlanService.update(editingPlan.id, payload)
        : await weeklyPlanService.create(payload);
      setMessage(
        result.ai?.aiEligible
          ? 'Weekly plan saved. Completed content is available for AI quiz preparation.'
          : 'Weekly plan saved. Upcoming content is stored but excluded from AI quiz preparation.',
      );
      resetForm();
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Unable to save weekly teaching plan.'));
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      await weeklyPlanService.remove(deleteTarget.id);
      setMessage('Weekly plan deleted.');
      setDeleteTarget(null);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Unable to delete weekly teaching plan.'));
    }
  };

  const downloadAttachment = async (plan) => {
    if (!plan.attachmentFileId) return;
    try {
      const blob = await fileService.downloadBlob(plan.attachmentFileId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = plan.attachmentFileName || 'weekly-plan-resource';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Unable to download weekly plan resource.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher"
        title="Weekly Teaching Plan"
        description="Create completed lesson records and upcoming lesson plans by department. Completed records only are used for AI quiz preparation."
      />

      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={savePlan}>
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-ink">{editingPlan ? 'Edit Weekly Plan' : 'Create Weekly Plan'}</h2>
            <p className="mt-1 text-sm text-muted">
              Completed/taught content becomes AI eligible. Next-week planned content is saved for continuity but excluded from AI quizzes.
            </p>
          </div>
          <label className="text-sm font-semibold text-ink">
            Department
            <select value={form.departmentId} onChange={(event) => updateForm('departmentId', event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5" required>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-ink">
            Plan Type
            <select value={form.contentType} onChange={(event) => updateForm('contentType', event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5">
              <option value="completed">Completed / Taught This Week</option>
              <option value="upcoming">Upcoming / Next Week Plan</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-ink">
            Week Number
            <input value={form.weekNo} onChange={(event) => updateForm('weekNo', event.target.value)} type="number" min="1" className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5" required />
          </label>
          <label className="text-sm font-semibold text-ink">
            Planned Date
            <input value={form.plannedDate} onChange={(event) => updateForm('plannedDate', event.target.value)} type="date" className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-ink lg:col-span-2">
            Topic
            <input value={form.topic} onChange={(event) => updateForm('topic', event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5" required />
          </label>
          <label className="text-sm font-semibold text-ink">
            Objectives / What was taught or will be taught
            <textarea value={form.objectives} onChange={(event) => updateForm('objectives', event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-ink">
            Activities / Classroom progress
            <textarea value={form.activities} onChange={(event) => updateForm('activities', event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-ink">
            Resource Notes
            <textarea value={form.resources} onChange={(event) => updateForm('resources', event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-ink">
            Resource Link
            <input value={form.resourceLink} onChange={(event) => updateForm('resourceLink', event.target.value)} placeholder="https://..." className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
          </label>
          <label className="lg:col-span-2 block cursor-pointer rounded-2xl border border-dashed border-line bg-page p-5 text-center hover:border-primary">
            <input type="file" accept={acceptedTypes} className="sr-only" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
            <FiUploadCloud className="mx-auto size-7 text-primary" />
            <span className="mt-2 block text-sm font-bold text-ink">
              {attachment ? attachment.name : form.attachmentFileId ? 'Existing attachment retained' : 'Upload PDF, PPT, document, video, image, or text'}
            </span>
          </label>
          <div className="flex justify-end gap-3 lg:col-span-2">
            {editingPlan ? <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button> : null}
            <Button type="submit" isLoading={saving}>{editingPlan ? 'Save Changes' : 'Create Weekly Plan'}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_13rem_13rem_auto]">
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search weekly plans" className="rounded-xl border border-line bg-white px-3 py-2.5" />
          <select value={filters.contentType} onChange={(event) => setFilters((current) => ({ ...current, contentType: event.target.value }))} className="rounded-xl border border-line bg-white px-3 py-2.5">
            <option value="">All Types</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select value={filters.departmentId} onChange={(event) => setFilters((current) => ({ ...current, departmentId: event.target.value }))} className="rounded-xl border border-line bg-white px-3 py-2.5">
            <option value="">All Departments</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <Button type="button" variant="secondary" onClick={loadData}><FiRefreshCw />Refresh</Button>
        </div>
      </Card>

      {loading ? <Card className="p-5 text-sm text-muted">Loading weekly teaching plans...</Card> : null}
      {!loading && !plans.length ? <Card className="p-5 text-sm text-muted">No weekly teaching plans found in the database.</Card> : null}
      <div className="grid gap-5 xl:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{plan.departmentName || 'Department'} - Week {plan.weekNo}</p>
                <h2 className="mt-1 text-lg font-bold text-ink">{plan.topic}</h2>
                <p className="mt-1 text-sm text-muted">By {plan.teacherName || plan.teacherUsername || 'Teacher'} - {formatDate(plan.plannedDate)}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={plan.contentType === 'completed' ? 'Completed' : 'Upcoming'} />
                <StatusBadge status={plan.status} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              <p><span className="font-semibold text-ink">Objectives:</span> {plan.objectives || '-'}</p>
              <p><span className="font-semibold text-ink">Activities:</span> {plan.activities || '-'}</p>
              <p><span className="font-semibold text-ink">Resources:</span> {plan.resources || '-'}</p>
              <p>
                <span className="font-semibold text-ink">AI Quiz Rule:</span>{' '}
                {plan.contentType === 'completed'
                  ? 'Eligible source for AI quiz preparation.'
                  : 'Stored for continuity only; not used for AI quiz generation.'}
              </p>
              {plan.resourceLink ? <a href={plan.resourceLink} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:text-primary-dark">Open resource link</a> : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {plan.attachmentFileId ? <Button variant="secondary" onClick={() => downloadAttachment(plan)}><FiDownload />Download</Button> : null}
              <Button variant="secondary" onClick={() => startEdit(plan)}><FiEdit3 />Edit</Button>
              <Button variant="danger" onClick={() => setDeleteTarget(plan)}><FiTrash2 />Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete weekly plan"
        message={`Delete Week ${deleteTarget?.weekNo || ''} plan "${deleteTarget?.topic || ''}"?`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteTarget(null)}
        onConfirm={removePlan}
      />
    </div>
  );
}
