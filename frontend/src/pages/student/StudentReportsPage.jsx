import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiAward, FiDownload, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { ProgressBar } from '../../components/student/ProgressBar';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { reportsService } from '../../services/reportsService';
import { getChartColor, getChartFill, percentAxisDomain } from '../../utils/chartTheme';
import { downloadReportExport } from '../../utils/reportDownload';

function ReportCard({ title, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <Icon className="size-6 text-primary" />
      <p className="mt-4 text-2xl font-bold text-ink">{Number(value || 0).toLocaleString()}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{title}</p>
    </Card>
  );
}

export function StudentReportsPage() {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        const [dashboard, students, quizzes] = await Promise.all([
          reportsService.getDashboard(),
          reportsService.getStudents(),
          reportsService.getQuizzes(),
        ]);

        if (isMounted) {
          setReports({ dashboard, students, quizzes });
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load student reports.');
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
    try {
      setIsExporting(true);
      setExportError('');
      setExportMessage('');
      const data = await reportsService.exportReport(format, {
        reportType: 'quizzes',
        scope: 'current_page',
      });
      downloadReportExport(data);
      setExportMessage(`${data.fileName} downloaded successfully.`);
    } catch (apiError) {
      setExportError(apiError.response?.data?.message || apiError.message || `Unable to export ${format.toUpperCase()} report.`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <Loader label="Loading student reports" />;
  }

  if (error || !reports) {
    return <EmptyState title="Student reports unavailable" description={error} />;
  }

  const profile = reports.students.students[0] || {};
  const attempts = reports.quizzes.attempts || [];
  const topics = [...new Set(attempts.flatMap((attempt) => String(attempt.topics || '').split(', ').filter(Boolean)))];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="My Reports"
        description="Quiz history, average percentage, highest and lowest score, completed topics, learning progress, and exports."
      />
      <ErrorAlert message={exportError} />
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
        <ReportCard title="Quiz Attempts" value={profile.quizAttempts} icon={FiTrendingUp} />
        <ReportCard title="Average Percentage" value={profile.averagePercentage} icon={FiTarget} />
        <ReportCard title="Highest Score" value={profile.highestScore} icon={FiAward} />
        <ReportCard title="Lowest Score" value={profile.lowestScore} icon={FiTarget} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Recent Quiz Results</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...attempts].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="quizNumber" />
                <YAxis allowDecimals={false} domain={percentAxisDomain} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke={getChartColor(1)} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Overall Performance</h2>
          <div className="mt-5">
            <ProgressBar label={`${profile.averagePercentage || 0}% average`} value={Number(profile.averagePercentage || 0)} />
          </div>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reports.quizzes.difficultyAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="difficulty" />
                <YAxis allowDecimals={false} domain={percentAxisDomain} />
                <Tooltip />
                <Area dataKey="correctRate" fill={getChartFill(2)} stroke={getChartColor(2)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Completed Topics</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {topics.length ? topics.map((topic) => (
            <span key={topic} className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-primary">
              {topic}
            </span>
          )) : <span className="text-sm text-muted">Completed quiz topics will appear here.</span>}
        </div>
        <p className="mt-5 text-sm text-muted">Achievement badges are ready for future milestone rules.</p>
      </Card>
    </div>
  );
}
