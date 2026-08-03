import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiCpu,
  FiLayers,
  FiMonitor,
  FiShield,
  FiShare2,
  FiTarget,
  FiUsers,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import landingBackground from '../../img/dbit-landing-background.png';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  ['Assessment Management', 'Generate and manage assessments from completed lessons with structured question support.', FiCpu],
  ['Weekly Teaching Plan', 'Organize lesson progress, weekly outcomes, and classroom activities.', FiClipboard],
  ['Learning Materials', 'Share notes, PDFs, slides, videos, and assignments from one place.', FiBookOpen],
  ['Student Progress Tracking', 'Monitor learning progress, attempts, results, and engagement trends.', FiActivity],
  ['Teacher Dashboard', 'Give teachers a focused workspace for lessons, quizzes, marks, and reports.', FiMonitor],
  ['Admin Management', 'Manage teachers, students, curriculum, materials, and academic workflows.', FiUsers],
  ['Super Admin Control', 'Central governance for settings, admins, reports, and secure platform control.', FiShield],
  ['Secure Authentication', 'JWT authentication, encrypted passwords, and role-based access control.', FiCheckCircle],
  ['Marks & Reports', 'Prepare accurate marks, performance views, and learning outcome reports.', FiBarChart2],
  ['Responsive Design', 'A polished experience across desktop, laptop, tablet, and mobile devices.', FiLayers],
];

const steps = [
  'Admin creates Teachers',
  'Teacher uploads Notes',
  'Teacher marks completed topics',
  'AI generates questions',
  'Student attempts Quiz',
  'Teacher views results',
];

const reasons = [
  ['Academic Governance', 'Keep teaching, learning, assessment, and reporting workflows under clear institutional control.', FiCpu],
  ['Structured Assessment', 'Support every learner with assessments aligned to teaching progress and curriculum records.', FiTarget],
  ['Easy Material Sharing', 'Keep learning content organized, discoverable, and available anywhere.', FiShare2],
  ['Performance Analytics', 'Help staff understand results, progress, and improvement opportunities.', FiBarChart2],
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      transition={{ duration: 0.22 }}
      className="mx-auto max-w-3xl text-center"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-muted">{description}</p> : null}
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <main id="home">
      <section
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-white"
      >
        <div className="absolute -left-16 -top-28 h-52 w-[42rem] rounded-[100%] bg-gradient-to-r from-cyan-400 to-teal-300 opacity-95" />
        <div className="absolute -right-24 -top-16 h-64 w-[56rem] rounded-[100%] bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 opacity-95" />
        <div className="absolute -bottom-28 left-0 h-48 w-[48rem] rounded-[100%] bg-gradient-to-r from-sky-500 to-teal-400 opacity-90" />
        <div className="absolute bottom-0 right-0 h-full w-full bg-gradient-to-r from-white via-white/80 to-white/10" />
        <div
          className="absolute inset-y-16 right-0 hidden w-[58%] bg-cover bg-center bg-no-repeat lg:block"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.92), rgba(255,255,255,0.42), rgba(255,255,255,0.02)), url(${landingBackground})`,
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Official University LMS
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.98] text-[#16477f] sm:text-6xl lg:text-7xl">
              AI Smart Learning Management System
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              A secure academic management platform for teaching, learning materials,
              assessments, reporting, and role-based institutional administration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button>
                  Get Started
                  <FiArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary">Login</Button>
              </Link>
            </div>
          </motion.div>
          <div
            className="pointer-events-none absolute bottom-8 right-4 h-48 w-80 rounded-[2rem] bg-cover bg-center bg-no-repeat shadow-soft sm:h-60 sm:w-[28rem] lg:hidden"
            style={{ backgroundImage: `url(${landingBackground})` }}
            aria-hidden="true"
          />
          </div>
      </section>

      <section id="features" className="border-y border-line bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Features"
            title="Built For Institutional Teaching And Learning"
            description="A complete foundation for institutions that need clean workflows, strong access control, and reliable assessment experiences."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {features.map(([title, description, Icon], index) => (
              <motion.article
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-soft"
              >
                <span className="grid size-11 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-bold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="How It Works"
            title="From Lesson Planning To Assessment"
            description="The platform follows a clear academic workflow so every role knows what to do next."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {steps.map((step, index) => (
              <motion.div
                key={step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="relative rounded-xl border border-line bg-white p-5 text-center shadow-sm"
              >
                <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-semibold leading-6 text-ink">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why Choose Our LMS"
            title="An Official Foundation For Modern Education"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map(([title, description, Icon]) => (
              <motion.article
                key={title}
                className="rounded-xl border border-line bg-page p-6 shadow-sm transition hover:border-primary/40"
              >
                <Icon className="size-8 text-primary" />
                <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-7xl rounded-xl bg-primary px-6 py-12 text-center text-white shadow-soft sm:px-10"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">Start Your Smart Learning Journey Today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-orange-50">
            Bring AI-ready lesson workflows, secure access, and responsive learning experiences
            into one professional LMS platform.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/login">
            <Button className="bg-white text-primary hover:bg-slate-100">
                Login
              </Button>
            </Link>
            <a href="#contact">
              <Button variant="secondary" className="border-white bg-primary text-white hover:bg-white hover:text-primary">
                Contact Us
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
