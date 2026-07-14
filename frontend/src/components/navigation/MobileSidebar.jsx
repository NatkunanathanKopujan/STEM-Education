import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { Sidebar } from './Sidebar';

export function MobileSidebar({ open, role, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full w-80 max-w-[86vw] bg-white shadow-soft"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="absolute left-[calc(min(86vw,20rem)-3.25rem)] top-3 z-10">
              <button
                type="button"
                className="focus-ring rounded-lg p-2 text-muted hover:bg-orange-50 hover:text-primary"
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <FiX className="size-5" />
              </button>
            </div>
            <Sidebar role={role} collapsed={false} onNavigate={onClose} className="w-full" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
