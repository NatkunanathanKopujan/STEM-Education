import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from '../components/ui/Button';

export function ErrorPage({
  title = 'Something went wrong',
  message = 'The requested page or action could not be completed.',
}) {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-orange-50 text-primary">
          <FiAlertTriangle className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{message}</p>
        <Link to="/app">
          <Button className="mt-6">Back to LMS</Button>
        </Link>
      </div>
    </main>
  );
}
