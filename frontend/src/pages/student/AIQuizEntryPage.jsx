import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCpu, FiRefreshCw, FiShield } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentQuizService } from '../../services/studentQuizService';

export function AIQuizEntryPage() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const handleStartQuiz = async () => {
    setError('');
    setIsStarting(true);

    try {
      await studentQuizService.startQuiz();
      navigate('/student/ai-quiz/attempt');
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          'Unable to start a quiz right now. Please check that approved completed-topic questions are available.',
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="AI Quiz"
        description="Start a 10-question personalized quiz from approved questions generated only from completed teacher-taught topics."
      />
      <Card className="p-8 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-xl bg-orange-50 text-primary">
          <FiCpu className="size-8" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-ink">Start Your Next AI Quiz</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
          Every attempt gets a new quiz number. Your answers are autosaved, unfinished quizzes are
          restored, and repeated questions are avoided whenever enough unused questions exist.
        </p>
        {error ? (
          <div className="mx-auto mt-5 flex max-w-2xl items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={handleStartQuiz} isLoading={isStarting}>
            Start AI Quiz
          </Button>
          <Button variant="secondary" onClick={() => navigate('/student/quiz-history')}>
            View History
          </Button>
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <FiShield className="size-6 text-primary" />
          <h3 className="mt-4 font-bold text-ink">Completed Topics Only</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Upcoming lessons and untaught content are blocked from quiz selection.
          </p>
        </Card>
        <Card className="p-5">
          <FiRefreshCw className="size-6 text-primary" />
          <h3 className="mt-4 font-bold text-ink">Unlimited Attempts</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Each submission creates an independent quiz number and permanent result.
          </p>
        </Card>
      </div>
    </div>
  );
}
