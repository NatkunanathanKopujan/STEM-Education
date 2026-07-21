import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiDownload } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { reportsService } from '../../services/reportsService';

export function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        const [dashboard, students, teachers, quizzes, materials] = await Promise.all([
          reportsService.getDashboard(),
          reportsService.getStudents(),
          reportsService.getTeachers(),
          reportsService.getQuizzes(),
          reportsService.getMaterials(),
        ]);

        if (isMounted) {
          setReports({ dashboard, students, teachers, quizzes, materials });
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load admin reports.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExport = async (format) => {
    setIsExporting(true);
    setError('');
    setExportMessage('');
    try {
      const data = await reportsService.exportReport(format, {
        reportType: 'students',
        scope: 'filtered_data',
      });
      setExportMessage(`${data.fileName} generated successfully.`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || `Unable to export ${format.toUpperCase()} report.`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <Loader label="Loading admin reports" />;
  }

  if (error || !reports) {
    return <EmptyState title="Reports unavailable" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        description="Teacher statistics, student performance, curriculum activity, materials, quizzes, and exports."
      />
      <ErrorAlert message={error} />
      <SuccessAlert message={exportMessage} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={isExporting} isLoading={isExporting} onClick={() => handleExport('pdf')}>
          <FiDownload />
          Export PDF
        </Button>
        <Button variant="secondary" disabled={isExporting} onClick={() => handleExport('excel')}>Export Excel</Button>
        <Button variant="secondary" disabled={isExporting} onClick={() => handleExport('csv')}>Export CSV</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{reports.dashboard.cards.totalTeachers}</p><p className="text-sm text-muted">Teachers</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{reports.dashboard.cards.totalStudents}</p><p className="text-sm text-muted">Students</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{reports.dashboard.cards.totalCurriculums}</p><p className="text-sm text-muted">Curriculums</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{reports.dashboard.cards.totalQuizAttempts}</p><p className="text-sm text-muted">Quiz Attempts</p></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Student Registrations</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports.dashboard.charts.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#F97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Learning Material Statistics</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports.materials.materialTypes || reports.materials.materials || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="materialType" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-bold text-ink">Student Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>{['Student', 'ID', 'Attempts', 'Average', 'Highest', 'Lowest', 'Last Quiz'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reports.students.students.map((student) => (
                <tr key={student.studentId}>
                  <td className="px-4 py-3 font-semibold text-ink">{student.studentName}</td>
                  <td className="px-4 py-3 text-muted">{student.studentNo || student.studentId}</td>
                  <td className="px-4 py-3">{student.quizAttempts}</td>
                  <td className="px-4 py-3 text-primary">{student.averagePercentage}%</td>
                  <td className="px-4 py-3">{student.highestScore}%</td>
                  <td className="px-4 py-3">{student.lowestScore}%</td>
                  <td className="px-4 py-3 text-muted">{student.lastQuizDate ? new Date(student.lastQuizDate).toLocaleDateString() : 'No attempts'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
