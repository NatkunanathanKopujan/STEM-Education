import { FiLoader } from 'react-icons/fi';

const variants = {
  primary:
    'bg-primary text-white hover:bg-gradient-to-r hover:from-primary hover:to-primary-dark shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:border-primary hover:text-primary',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  ghost: 'text-muted hover:bg-orange-50 hover:text-primary',
};

export function Button({
  children,
  className = '',
  isLoading = false,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      {...props}
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? <FiLoader className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
