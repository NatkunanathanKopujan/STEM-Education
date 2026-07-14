import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiAward, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { ProgressBar } from '../../components/student/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { studentQuizService } from '../../services/studentQuizService';

function formatDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function StudentQuizResultPage() {
  const { quizNumber } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadResult() {
      try {
        const data = await studentQuizService.getResult(quizNumber);
        if (isMounted) {
          setResult(data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load this quiz result.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [quizNumber]);

  if (isLoading) {
    return <Loader label="Loading quiz result" />;
  }

  if (error || !result) {
    return <EmptyState title="Result unavailable" description={error} />;
  }

  const statCards = [
    { label: 'Correct Answers', value: result.correctAnswers, icon: FiCheckCircle, color: 'text-green-700' },
    { label: 'Wrong Answers', value: result.wrongAnswers, icon: FiXCircle, color: 'text-red-700' },
    { label: 'Score', value: result.score, icon: FiAward, color: 'text-primary' },
    { label: 'Time Taken', value: formatDuration(result.durationSeconds), icon: FiClock, color: 'text-ink' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title={`Quiz ${result.quizNumber} Result`}
        description={`${result.curriculum} • ${result.subject} • ${
          result.attemptedAt ? new Date(result.attemptedAt).toLocaleString() : 'Submitted'
        }`}
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5">
            <stat.icon className={`size-6 ${stat.color}`} />
            <p className="mt-4 text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Performance Summary</h2>
            <p className="mt-1 text-sm text-muted">
              Status:{' '}
              <span className="font-semibold capitalize text-primary">{result.passStatus}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => navigate('/student/quiz-history')}>
              History
            </Button>
            <Button onClick={() => navigate(`/student/quiz-review/${result.quizNumber}`)}>
              Review Answers
            </Button>
          </div>
        </div>
        <div className="mt-5">
          <ProgressBar label={`${result.percentage}% score`} value={Number(result.percentage)} />
        </div>
        <div className="mt-5 rounded-xl bg-page p-4">
          <p className="text-sm font-semibold text-ink">Completed Topics Covered</p>
          <p className="mt-2 text-sm text-muted">
            {result.completedTopics?.length ? result.completedTopics.join(', ') : 'Mixed completed topics'}
          </p>
        </div>
      </Card>
    </div>
  );
}
