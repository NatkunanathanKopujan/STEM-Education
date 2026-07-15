import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiDownload, FiPieChart, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { reportsService } from '../../services/reportsService';

const colors = ['#F97316', '#2563EB', '#16A34A', '#EF4444'];

function downloadExport(data) {
  const content =
    data.encoding === 'base64'
      ? Uint8Array.from(atob(data.content), (character) => character.charCodeAt(0))
      : data.content;
  const blob = new Blob([content], { type: data.mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = data.fileName || `report.${data.format || 'csv'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ReportCard({ title, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <Icon className="size-6 text-primary" />
      <p className="mt-4 text-2xl font-bold text-ink">{Number(value || 0).toLocaleString()}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{title}</p>
    </Card>
  );
}

export function ReportsPage() {
  const [report, setReport] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [exportMessage, setExportMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        const [dashboard, ai] = await Promise.all([
          reportsService.getDashboard(),
          reportsService.getAi(),
        ]);

        if (isMounted) {
          setReport(dashboard);
          setAiReport(ai);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load reports.');
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
      setExportMessage('');
      const data = await reportsService.exportReport(format, {
        reportType: 'dashboard',
        scope: 'complete_report',
      });
      downloadExport(data);
      setExportMessage(`${data.fileName} downloaded successfully.`);
    } catch (apiError) {
      setExportMessage(apiError.response?.data?.message || 'Unable to export report.');
    }
  };

  if (isLoading) {
    return <Loader label="Loading reports" />;
  }

  if (error || !report) {
    return <EmptyState title="Reports unavailable" description={error} />;
  }

  const cards = report.cards;
  const rolePie = [
    { name: 'Admins', value: Number(cards.totalAdmins || 0) },
    { name: 'Teachers', value: Number(cards.totalTeachers || 0) },
    { name: 'Students', value: Number(cards.totalStudents || 0) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="System-wide users, AI questions, quiz attempts, activity, usage, storage, and exports."
      />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleExport('pdf')}>
          <FiDownload />
          Export PDF
        </Button>
        <Button variant="secondary" onClick={() => handleExport('excel')}>
          Export Excel
        </Button>
        <Button variant="secondary" onClick={() => handleExport('csv')}>
          Export CSV
        </Button>
        {exportMessage ? <span className="text-sm font-semibold text-primary">{exportMessage}</span> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard title="Total Users" value={cards.totalUsers} icon={FiUsers} />
        <ReportCard title="AI Questions" value={cards.totalAiQuestions} icon={FiPieChart} />
        <ReportCard title="Quiz Attempts" value={cards.totalQuizAttempts} icon={FiTrendingUp} />
        <ReportCard title="Monthly Active Users" value={cards.monthlyActiveUsers} icon={FiUsers} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Monthly Activity</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.charts.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#F97316" />
                <Bar dataKey="teachers" fill="#2563EB" />
                <Bar dataKey="admins" fill="#16A34A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Quiz Trend</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.charts.monthlyActivity}>
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
          <h2 className="text-lg font-bold text-ink">Role Distribution</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                  {rolePie.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">System Usage</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.charts.systemUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area dataKey="value" fill="#FDBA74" stroke="#F97316" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">AI Reports</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                {['Provider', 'Model', 'Generated', 'Approved', 'Rejected', 'Tokens', 'Cost'].map((heading) => (
                  <th key={heading} className="px-4 py-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(aiReport?.providerUsage || []).map((provider) => (
                <tr key={`${provider.provider}-${provider.model}`}>
                  <td className="px-4 py-3 capitalize">{provider.provider}</td>
                  <td className="px-4 py-3 text-muted">{provider.model}</td>
                  <td className="px-4 py-3">{provider.questionsGenerated}</td>
                  <td className="px-4 py-3">{provider.questionsApproved}</td>
                  <td className="px-4 py-3">{provider.questionsRejected}</td>
                  <td className="px-4 py-3">{provider.tokenUsage}</td>
                  <td className="px-4 py-3">${Number(provider.estimatedAiCost || 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
