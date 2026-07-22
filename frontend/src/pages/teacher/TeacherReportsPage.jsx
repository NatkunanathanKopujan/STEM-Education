import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiDownload, FiTarget, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { reportsService } from '../../services/reportsService';
import { getChartColor, percentAxisDomain } from '../../utils/chartTheme';
import { downloadReportExport } from '../../utils/reportDownload';

function MetricCard({ title, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <Icon className="size-6 text-primary" />
      <p className="mt-4 text-2xl font-bold text-ink">{Number(value || 0).toLocaleString()}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{title}</p>
    </Card>
  );
}

export function TeacherReportsPage() {
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
        const [dashboard, students, quizzes, materials, ai] = await Promise.all([
          reportsService.getDashboard(),
          reportsService.getStudents(),
          reportsService.getQuizzes(),
          reportsService.getMaterials(),
          reportsService.getAi(),
        ]);

        if (isMounted) {
          setReports({ dashboard, students, quizzes, materials, ai });
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load teacher reports.');
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
        scope: 'filtered_data',
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
    return <Loader label="Loading teacher reports" />;
  }

  if (error || !reports) {
    return <EmptyState title="Teacher reports unavailable" description={error} />;
  }

  const cards = reports.dashboard.cards;
  const weakTopics = reports.quizzes.topicAnalysis?.slice(0, 8) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher"
        title="Reports"
        description="Student progress, quiz results, weak topics, learning material usage, question exposure, and AI generation reports."
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
        <MetricCard title="Students" value={reports.students.students.length} icon={FiUsers} />
        <MetricCard title="Quiz Attempts" value={cards.totalQuizAttempts} icon={FiTrendingUp} />
        <MetricCard title="Average Score" value={cards.averageScore} icon={FiTarget} />
        <MetricCard title="Pass Rate" value={cards.passRate} icon={FiTrendingUp} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Student Progress</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports.students.students}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="studentName" hide />
                <YAxis allowDecimals={false} domain={percentAxisDomain} />
                <Tooltip />
                <Line type="monotone" dataKey="averagePercentage" stroke={getChartColor(1)} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Topic-wise Analysis</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weakTopics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="topic" hide />
                <YAxis allowDecimals={false} domain={percentAxisDomain} />
                <Tooltip />
                <Bar dataKey="averageScore" radius={[8, 8, 0, 0]}>
                  {weakTopics.map((topic, index) => (
                    <Cell key={topic.topic || index} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Learning Material Usage</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(reports.materials.materialTypes || []).map((item) => (
              <div key={item.materialType} className="rounded-xl bg-page p-4">
                <p className="text-sm font-semibold capitalize text-muted">{item.materialType}</p>
                <p className="mt-2 text-2xl font-bold text-ink">{item.total}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">AI Report</h2>
          <div className="mt-5 space-y-3">
            {(reports.ai.providerUsage || []).map((item) => (
              <div key={`${item.provider}-${item.model}`} className="rounded-xl border border-line p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize text-ink">{item.provider}</span>
                  <span className="text-primary">{item.questionsGenerated} generated</span>
                </div>
                <p className="mt-2 text-muted">
                  Saved {item.questionsApproved} • Rejected {item.questionsRejected} • Tokens {item.tokenUsage || 0}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
