import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { studentQuizService } from '../../services/studentQuizService';

const optionKeys = ['A', 'B', 'C', 'D'];

export function StudentQuizAttemptPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentQuiz() {
      try {
        const data = await studentQuizService.getCurrentQuiz();
        if (isMounted) {
          setAttempt(data.attempt);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load your current quiz.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentQuiz();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeQuestion = attempt?.questions?.[activeIndex];
  const answeredCount = useMemo(
    () => attempt?.questions?.filter((question) => question.selectedAnswer).length || 0,
    [attempt],
  );
  const progress = attempt?.questions?.length
    ? Math.round((answeredCount / attempt.questions.length) * 100)
    : 0;

  const handleSelectAnswer = async (selectedAnswer) => {
    if (!activeQuestion || isSaving) {
      return;
    }

    const nextAttempt = {
      ...attempt,
      questions: attempt.questions.map((question) =>
        question.questionId === activeQuestion.questionId
          ? { ...question, selectedAnswer }
          : question,
      ),
    };

    setAttempt(nextAttempt);
    setIsSaving(true);

    try {
      await studentQuizService.saveAnswer({
        attemptId: attempt.id,
        questionId: activeQuestion.questionId,
        selectedAnswer,
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Answer could not be autosaved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await studentQuizService.submitQuiz(attempt.id);
      navigate(`/student/quiz-result/${result.quizNumber}`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to submit this quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader label="Restoring quiz" />;
  }

  if (!attempt) {
    return (
      <EmptyState
        title="No active quiz"
        description="Start a new AI quiz to receive 10 questions from completed topics."
        actionLabel="Start AI Quiz"
        onAction={() => navigate('/student/ai-quiz')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title={`Quiz ${attempt.quizNumber}`}
        description={`${attempt.curriculum} • ${attempt.subject} • Week coverage: ${
          attempt.weekCoverage?.join(', ') || 'Mixed'
        }`}
      />
      {attempt.reuseNotice ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>
            The question bank has been exhausted for your history, so some previous questions may
            appear again.
          </span>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <Card className="p-5">
        <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Question {activeIndex + 1} of {attempt.questions.length}
            </p>
            <h2 className="mt-2 text-xl font-bold leading-8 text-ink">{activeQuestion.question}</h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-page px-4 py-3 text-sm text-muted">
            <FiClock className="text-primary" />
            <span>{isSaving ? 'Autosaving...' : 'Autosave enabled'}</span>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-6 grid gap-3">
          {optionKeys.map((key) => {
            const isSelected = activeQuestion.selectedAnswer === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectAnswer(key)}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  isSelected
                    ? 'border-primary bg-orange-50 text-primary'
                    : 'border-line bg-white text-ink hover:border-primary hover:bg-orange-50'
                }`}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-page text-xs">
                  {key}
                </span>
                <span>{activeQuestion.options?.[key]}</span>
                {isSelected ? <FiCheckCircle className="ml-auto shrink-0" /> : null}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {answeredCount} of {attempt.questions.length} answered by {user?.fullName || 'Student'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={activeIndex === attempt.questions.length - 1}
              onClick={() =>
                setActiveIndex((index) => Math.min(attempt.questions.length - 1, index + 1))
              }
            >
              Next
            </Button>
            <Button
              disabled={answeredCount !== attempt.questions.length}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Submit Quiz
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
