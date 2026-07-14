import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { studentQuizService } from '../../services/studentQuizService';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Pending';
}

export function QuizHistoryPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const data = await studentQuizService.getHistory();
        if (isMounted) {
          setQuizzes(data.quizzes || []);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to fetch quiz history.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="Quiz History"
        description="View every submitted AI quiz attempt with score, percentage, status, and review access."
        actionLabel="Start AI Quiz"
        onAction={() => navigate('/student/ai-quiz')}
      />
      {isLoading ? <Loader label="Loading quiz history" /> : null}
      {!isLoading && error ? (
        <EmptyState title="Unable to load history" description={error} />
      ) : null}
      {!isLoading && !error && !quizzes.length ? (
        <EmptyState
          title="No quizzes completed"
          description="Your completed AI quizzes will appear here after submission."
          actionLabel="Start AI Quiz"
          onAction={() => navigate('/student/ai-quiz')}
        />
      ) : null}
      {!isLoading && !error && quizzes.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  {['Quiz Number', 'Attempt Date', 'Score', 'Percentage', 'Status', 'Action'].map(
                    (heading) => (
                      <th key={heading} className="px-4 py-3">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {quizzes.map((quiz) => (
                  <tr key={quiz.quizNumber}>
                    <td className="px-4 py-3 font-semibold text-ink">Quiz {quiz.quizNumber}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(quiz.completedAt)}</td>
                    <td className="px-4 py-3">{quiz.score}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{quiz.percentage}%</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={quiz.passStatus === 'pass' ? 'Success' : 'Danger'} />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/student/quiz-result/${quiz.quizNumber}`)}
                      >
                        <FiEye />
                        Open Result
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
