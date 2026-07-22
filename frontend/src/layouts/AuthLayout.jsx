import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import authLmsIllustration from '../assets/auth-lms-illustration.png';

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid w-full overflow-hidden rounded-xl border border-line bg-white shadow-soft lg:grid-cols-[0.82fr_1.58fr]"
        >
          <section className="hidden bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <BrandLogo inverse />
            <div className="flex flex-1 items-center justify-center py-8">
              <img
                src={authLmsIllustration}
                alt=""
                aria-hidden="true"
                className="w-full max-w-md rounded-2xl object-contain drop-shadow-2xl"
              />
            </div>
            <div className="border-t border-white/20 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-300">
              Secure access for students, teachers, and staff
            </div>
          </section>
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 lg:hidden">
              <BrandLogo />
            </div>
            <Outlet />
          </section>
        </motion.div>
      </div>
    </main>
  );
}
