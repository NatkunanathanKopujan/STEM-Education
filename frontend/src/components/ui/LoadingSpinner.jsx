import { FiLoader } from 'react-icons/fi';

export function LoadingSpinner({ className = 'size-5' }) {
  return <FiLoader className={`${className} animate-spin`} />;
}
