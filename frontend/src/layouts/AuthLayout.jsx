import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import authReferenceIllustration from '../assets/auth-reference-illustration.png';

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#CFEBD8_0%,#EFFBF4_48%,#DDF3E7_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid w-full overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_28px_80px_rgba(35,73,54,0.16)] lg:grid-cols-[0.82fr_1.58fr]"
        >
          <section className="hidden bg-[#E4FDED] p-10 text-black lg:flex lg:flex-col lg:justify-between">
            <BrandLogo inverse />
            <div className="flex flex-1 items-center justify-center py-8">
              <img
                src={authReferenceIllustration}
                alt=""
                aria-hidden="true"
                className="max-h-[44vh] w-full max-w-sm object-contain mix-blend-multiply"
              />
            </div>
            <div className="border-t border-emerald-200/70 pt-5 text-sm font-semibold uppercase tracking-wide text-black">
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
