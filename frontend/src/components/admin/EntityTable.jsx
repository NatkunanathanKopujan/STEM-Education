import { FiEdit2, FiEye, FiPower, FiTrash2 } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Pagination } from '../ui/Pagination';
import { StatusBadge } from '../super-admin/StatusBadge';

export function EntityTable({
  type,
  items,
  isLoading = false,
  isSaving = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const isTeacher = type === 'teacher';
  const isStudent = type === 'student';

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted">
            <tr>
              {[
                'Profile',
                isStudent ? 'Student ID' : null,
                'Name',
                'Username',
                'Email',
                isTeacher ? 'Department' : 'Curriculum',
                'Phone',
                'Status',
                'Created Date',
                'Actions',
              ]
                .filter(Boolean)
                .map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm font-semibold text-muted" colSpan={isStudent ? 10 : 9}>
                  Loading {isTeacher ? 'teachers' : 'students'}...
                </td>
              </tr>
            ) : null}
            {!isLoading && items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-sm font-bold text-primary">{item.photo}</span></td>
                {isStudent ? <td className="px-4 py-3 text-muted">{item.studentId}</td> : null}
                <td className="px-4 py-3 font-semibold text-ink">{item.fullName}</td>
                <td className="px-4 py-3 text-muted">{item.username}</td>
                <td className="px-4 py-3 text-muted">{item.email}</td>
                <td className="px-4 py-3 text-muted">{isTeacher ? item.department : item.curriculum}</td>
                <td className="px-4 py-3 text-muted">{item.phone}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-muted">{item.createdDate || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button disabled={isSaving} variant="ghost" className="px-2" onClick={() => onView(item)} aria-label="View"><FiEye /></Button>
                    <Button disabled={isSaving} variant="ghost" className="px-2" onClick={() => onEdit(item)} aria-label="Edit"><FiEdit2 /></Button>
                    <Button disabled={isSaving} variant="ghost" className="px-2" onClick={() => onToggleStatus(item)} aria-label="Toggle status"><FiPower /></Button>
                    <Button disabled={isSaving} variant="ghost" className="px-2 text-red-600" onClick={() => onDelete(item)} aria-label="Delete"><FiTrash2 /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !items.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm font-semibold text-muted" colSpan={isStudent ? 10 : 9}>
                  No {isTeacher ? 'teachers' : 'students'} found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line p-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </Card>
  );
}
