import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';
import { ToastContext } from './toastContextValue';

const icons = {
  success: FiCheckCircle,
  error: FiXCircle,
  info: FiInfo,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, type: 'info', ...toast }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, toast.duration || 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] w-full max-w-sm space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type] || FiInfo;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                className="rounded-xl border border-line bg-white p-4 shadow-soft"
              >
                <div className="flex gap-3">
                  <Icon className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{toast.title}</p>
                    {toast.message ? <p className="mt-1 text-sm text-muted">{toast.message}</p> : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
