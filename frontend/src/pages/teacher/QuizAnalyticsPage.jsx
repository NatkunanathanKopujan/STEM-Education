import { useEffect, useMemo, useState } from 'react';
import {
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
import {
  FiAward,
  FiBarChart2,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { teacherDashboardService } from '../../services/teacherDashboardService';
import { countAxisDomain, getChartColor, percentAxisDomain } from '../../utils/chartTheme';

const pieColors = [getChartColor(3), getChartColor(2), getChartColor(4)];

function formatNumber(value, suffix = '') {
  return `${Number(value || 0).toLocaleString()}${suffix}`;
}

function AnalyticsCard({ title, value, note, icon: Icon }) {
  return (
    <Card className="p-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
          <p className="mt-3 text-xs font-semibold text-green-700">{note}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  );
}

function progressStatus(status) {
  const map = {
    excellent: 'Success',
    good: 'Info',
    needs_review: 'Warning',
    at_risk: 'Danger',
  };
  return map[status] || 'Info';
}

export function QuizAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const [dashboardData, reportData] = await Promise.all([
          teacherDashboardService.getAnalyticsDashboard(),
          teacherDashboardService.getReports(),
        ]);

        if (isMounted) {
          setAnalytics(dashboardData);
          setReports(reportData);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load teacher analytics.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const students = analytics?.studentPerformance || [];
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [student.studentName, student.studentNo, student.curriculum]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [analytics, search]);

  const handleExport = async (reportType, format) => {
    setExportMessage('');

    try {
      const data = await teacherDashboardService.exportReport({ reportType, format });
      setExportMessage(`${data.filename} generated successfully.`);
    } catch (apiError) {
      setExportMessage(apiError.response?.data?.message || 'Report export failed.');
    }
  };

  if (isLoading) {
    return <Loader label="Loading teacher quiz analytics" />;
  }

  if (error || !analytics) {
    return <EmptyState title="Analytics unavailable" description={error} />;
  }

  const cards = [
    ['Total Students', analytics.cards.totalStudents, 'Students with quiz activity', FiUsers],
    ['Total Quiz Attempts', analytics.cards.totalQuizAttempts, 'Submitted attempts', FiRefreshCw],
    ['Average Quiz Score', analytics.cards.averageQuizScore, 'Overall average', FiBarChart2, '%'],
    ['Highest Score', analytics.cards.highestScore, 'Best result', FiAward, '%'],
    ['Lowest Score', analytics.cards.lowestScore, 'Needs support', FiTarget, '%'],
    ['Pass Rate', analytics.cards.passRate, 'Pass percentage', FiTrendingUp, '%'],
    ['Active Students', analytics.cards.activeStudents, 'Active in last 30 days', FiUsers],
    ['Completed Topics', analytics.cards.completedTopics, 'Eligible topic base', FiShield],
    ['AI Questions Available', analytics.cards.aiQuestionsAvailable, 'Approved question bank', FiBarChart2],
  ];
  const exposurePie = [
    { name: 'Never Used', value: Number(analytics.questionExposure.questionsNeverUsed || 0) },
    { name: 'Used Once', value: Number(analytics.questionExposure.questionsUsedOnce || 0) },
    { name: 'Used Multiple', value: Number(analytics.questionExposure.questionsUsedMultipleTimes || 0) },
  ];
  const weakTopics = reports?.topicPerformance?.filter((topic) => topic.recommendations?.length) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher"
        title="Teacher Quiz Analytics"
        description="Monitor student performance, topic mastery, question exposure, leaderboard rankings, and AI quiz quality."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([title, value, note, Icon, suffix]) => (
          <AnalyticsCard
            key={title}
            title={title}
            value={formatNumber(value, suffix)}
            note={note}
            icon={Icon}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Weekly Learning Analytics</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyAnalytics || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="weekNo" />
                <YAxis allowDecimals={false} domain={percentAxisDomain} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="averageQuizPercentage"
                  stroke={getChartColor(1)}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Participation by Week</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyAnalytics || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="weekNo" />
                <YAxis allowDecimals={false} domain={countAxisDomain} />
                <Tooltip />
                <Bar dataKey="quizAttempts" radius={[8, 8, 0, 0]}>
                  {(analytics.weeklyAnalytics || []).map((item, index) => (
                    <Cell key={item.weekNo || index} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Student Performance</h2>
            <p className="mt-1 text-sm text-muted">Search students and identify progress status.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, ID, curriculum"
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                {[
                  'Student',
                  'Student ID',
                  'Curriculum',
                  'Attempts',
                  'Average %',
                  'High',
                  'Low',
                  'Last Quiz',
                  'Status',
                  'Actions',
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {filteredStudents.map((student) => (
                <tr key={`${student.studentId}-${student.curriculum}`}>
                  <td className="px-4 py-3 font-semibold text-ink">{student.studentName}</td>
                  <td className="px-4 py-3 text-muted">{student.studentNo || student.studentId}</td>
                  <td className="px-4 py-3">{student.curriculum}</td>
                  <td className="px-4 py-3">{student.quizAttempts}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{student.averagePercentage}%</td>
                  <td className="px-4 py-3">{student.highestScore}%</td>
                  <td className="px-4 py-3">{student.lowestScore}%</td>
                  <td className="px-4 py-3 text-muted">
                    {student.lastQuizDate ? new Date(student.lastQuizDate).toLocaleDateString() : 'No attempts'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={progressStatus(student.progressStatus)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary">
                        <FiEye />
                        History
                      </Button>
                      <Button variant="secondary" onClick={() => handleExport('student-performance', 'excel')}>
                        <FiDownload />
                        Export
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Topic Performance Analysis</h2>
          <div className="mt-5 space-y-3">
            {(reports?.topicPerformance || []).slice(0, 6).map((topic) => (
              <div key={`${topic.weekNo}-${topic.topic}`} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{topic.topic}</p>
                    <p className="mt-1 text-sm text-muted">Week {topic.weekNo} • {topic.subject}</p>
                  </div>
                  <StatusBadge status={topic.isWeakTopic ? 'Warning' : 'Success'} />
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <span>Correct: {topic.correctPercentage}%</span>
                  <span>Incorrect: {topic.incorrectPercentage}%</span>
                  <span>Questions: {topic.totalQuestions}</span>
                </div>
                <p className="mt-3 text-sm text-muted">
                  Recommendation: {topic.recommendations?.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Question Exposure Control</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <p>Total Questions: <span className="font-bold text-ink">{analytics.questionExposure.totalQuestions}</span></p>
              <p>Never Used: <span className="font-bold text-ink">{analytics.questionExposure.questionsNeverUsed}</span></p>
              <p>Used Once: <span className="font-bold text-ink">{analytics.questionExposure.questionsUsedOnce}</span></p>
              <p>Used Multiple Times: <span className="font-bold text-ink">{analytics.questionExposure.questionsUsedMultipleTimes}</span></p>
              <p>Exposure: <span className="font-bold text-primary">{analytics.questionExposure.exposurePercentage}%</span></p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={exposurePie} dataKey="value" nameKey="name" outerRadius={82}>
                    {exposurePie.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Question Bank Analytics</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Object.entries(analytics.questionBank || {}).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-page p-4">
                <p className="text-xs uppercase text-muted">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="mt-2 text-xl font-bold text-ink">{formatNumber(value)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Student Ranking</h2>
          <div className="mt-5 space-y-3">
            {(analytics.leaderboard || []).slice(0, 8).map((student) => (
              <div key={student.studentId} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">#{student.rankNo} {student.studentName}</p>
                  <p className="text-muted">{student.totalQuizAttempts} attempts</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{student.averagePercentage}%</p>
                  <p className="text-muted">High {student.highestScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Reports</h2>
            <p className="mt-1 text-sm text-muted">
              Export student performance, topic performance, weekly progress, quiz statistics, and exposure reports.
            </p>
            {exportMessage ? <p className="mt-2 text-sm font-semibold text-primary">{exportMessage}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => handleExport('topic-performance', 'pdf')}>Export PDF</Button>
            <Button variant="secondary" onClick={() => handleExport('question-exposure', 'excel')}>
              Export Excel
            </Button>
          </div>
        </div>
      </Card>
      {weakTopics.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          New weak topics detected: {weakTopics.slice(0, 3).map((topic) => topic.topic).join(', ')}
        </div>
      ) : null}
    </div>
  );
}
