import { FiLoader } from 'react-icons/fi';

const variants = {
  primary:
    'bg-primary text-[#071f1d] shadow-[0_12px_26px_rgba(18,177,159,0.24)] hover:bg-primary-dark hover:text-white hover:shadow-[0_18px_38px_rgba(8,128,118,0.28)] active:bg-primary-dark',
  secondary: 'border border-line bg-white text-primary shadow-[0_8px_22px_rgba(18,87,70,0.08)] hover:border-primary hover:bg-orange-50 hover:shadow-[0_14px_30px_rgba(18,87,70,0.13)]',
  danger: 'bg-red-700 text-white shadow-[0_12px_26px_rgba(185,28,28,0.24)] hover:bg-red-800 hover:shadow-[0_18px_38px_rgba(153,27,27,0.28)]',
  ghost: 'text-muted hover:bg-orange-50 hover:text-primary hover:shadow-sm',
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
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
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
