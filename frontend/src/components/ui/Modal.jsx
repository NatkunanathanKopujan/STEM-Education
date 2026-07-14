import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { Button, DangerButton, SecondaryButton } from './Button';

export function Modal({ open, title, children, onClose, footer }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="w-full max-w-lg rounded-xl border border-line bg-white shadow-soft"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              <button
                type="button"
                className="focus-ring rounded-lg p-2 text-muted hover:bg-orange-50 hover:text-primary"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX className="size-5" />
              </button>
            </header>
            <div className="p-5">{children}</div>
            {footer ? <footer className="border-t border-line px-5 py-4">{footer}</footer> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ConfirmationDialog({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  isDanger = false,
}) {
  const ConfirmButton = isDanger ? DangerButton : Button;

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={onClose}>{cancelLabel}</SecondaryButton>
          <ConfirmButton onClick={onConfirm}>{confirmLabel}</ConfirmButton>
        </div>
      }
    >
      <p className="text-sm leading-6 text-muted">{message}</p>
    </Modal>
  );
}
