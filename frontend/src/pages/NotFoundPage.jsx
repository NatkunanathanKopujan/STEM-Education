import { ErrorPage } from './ErrorPage';

export function NotFoundPage() {
  return <ErrorPage title="Page not found" message="The page you requested does not exist." />;
}
