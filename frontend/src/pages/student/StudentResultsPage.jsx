import { useEffect, useState } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { ProgressBar } from '../../components/student/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { studentQuizService } from '../../services/studentQuizService';
import { getChartColor, percentAxisDomain } from '../../utils/chartTheme';

export function StudentResultsPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadResults() {
      try {
        const data = await studentQuizService.getHistory();
        if (isMounted) {
          setQuizzes(data.quizzes || []);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      isMounted = false;
    };
  }, []);

  const chartData = [...quizzes]
    .reverse()
    .map((quiz) => ({ quiz: `Quiz ${quiz.quizNumber}`, percentage: Number(quiz.percentage) }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="Results & Progress"
        description="Track quiz scores, pass/fail status, performance trends, and completed topic coverage."
      />
      {isLoading ? <Loader label="Loading results" /> : null}
      {!isLoading && !quizzes.length ? (
        <EmptyState
          title="No results yet"
          description="Submit your first AI quiz to see scores and progress analytics."
          actionLabel="Start AI Quiz"
          onAction={() => navigate('/student/ai-quiz')}
        />
      ) : null}
      {!isLoading && quizzes.length ? (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {quizzes.slice(0, 4).map((result) => (
              <Card key={result.quizNumber} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Quiz {result.quizNumber}</h2>
                    <p className="mt-1 text-sm text-muted">{result.subject || 'Mixed Subjects'}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/student/quiz-result/${result.quizNumber}`)}
                  >
                    Open
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <p className="rounded-xl bg-page p-3">
                    Correct: <span className="font-bold text-green-700">{result.correctAnswers}</span>
                  </p>
                  <p className="rounded-xl bg-page p-3">
                    Wrong: <span className="font-bold text-red-700">{result.wrongAnswers}</span>
                  </p>
                  <p className="rounded-xl bg-page p-3">
                    Score: <span className="font-bold text-ink">{result.score}</span>
                  </p>
                  <p className="rounded-xl bg-page p-3">
                    Status:{' '}
                    <span className="font-bold capitalize text-ink">{result.passStatus}</span>
                  </p>
                </div>
                <div className="mt-5">
                  <ProgressBar label={`${result.percentage}% score`} value={Number(result.percentage)} />
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <h2 className="text-lg font-bold text-ink">Progress Graph</h2>
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="quiz" />
                  <YAxis allowDecimals={false} domain={percentAxisDomain} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke={getChartColor(1)} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
