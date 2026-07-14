import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { studentQuizService } from '../../services/studentQuizService';

const optionKeys = ['A', 'B', 'C', 'D'];

export function StudentQuizReviewPage() {
  const { quizNumber } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadReview() {
      try {
        const data = await studentQuizService.getReview(quizNumber);
        if (isMounted) {
          setAttempt(data.attempt);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load quiz review.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      isMounted = false;
    };
  }, [quizNumber]);

  if (isLoading) {
    return <Loader label="Loading quiz review" />;
  }

  if (error || !attempt) {
    return <EmptyState title="Review unavailable" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title={`Quiz ${attempt.quizNumber} Review`}
        description="Review your selected options, correct answers, and explanations."
      />
      <div className="space-y-5">
        {attempt.questions.map((question) => (
          <Card key={question.questionId} className="p-5">
            <div className="flex items-start gap-3">
              {question.isCorrect ? (
                <FiCheckCircle className="mt-1 size-5 shrink-0 text-green-700" />
              ) : (
                <FiXCircle className="mt-1 size-5 shrink-0 text-red-700" />
              )}
              <div>
                <p className="text-sm font-semibold text-primary">
                  Question {question.order} • {question.topic}
                </p>
                <h2 className="mt-2 text-lg font-bold leading-7 text-ink">{question.question}</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {optionKeys.map((key) => {
                const isSelected = question.selectedAnswer === key;
                const isCorrect = question.correctAnswer === key;

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-3 text-sm ${
                      isCorrect
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : isSelected
                          ? 'border-red-200 bg-red-50 text-red-800'
                          : 'border-line bg-white text-ink'
                    }`}
                  >
                    <span className="font-bold">{key}.</span> {question.options?.[key]}
                    {isCorrect ? <span className="ml-2 font-semibold">Correct</span> : null}
                    {isSelected && !isCorrect ? (
                      <span className="ml-2 font-semibold">Your answer</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {question.explanation ? (
              <div className="mt-4 rounded-xl bg-page p-4 text-sm leading-6 text-muted">
                <span className="font-semibold text-ink">Explanation:</span> {question.explanation}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
