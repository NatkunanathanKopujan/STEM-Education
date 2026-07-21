import { FiLoader } from 'react-icons/fi';

const variants = {
  primary:
    'bg-primary text-[#171411] shadow-sm hover:bg-primary-dark hover:text-white hover:shadow-md active:bg-primary-dark',
  secondary: 'border border-line bg-white text-primary shadow-sm hover:border-primary hover:bg-orange-50',
  danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800',
  ghost: 'text-muted hover:bg-slate-100 hover:text-primary',
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
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
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
