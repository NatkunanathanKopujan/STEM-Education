import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  FiActivity,
  FiArrowRight,
  FiAward,
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
import heroImage from '../../assets/landing-hero.png';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  ['AI Generated Quiz', 'Generate assessments from completed lessons with intelligent question support.', FiCpu],
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
  ['AI Powered Learning', 'Turn lesson completion into smarter assessments and guided learning paths.', FiCpu],
  ['Personalized Quizzes', 'Support every learner with assessments that adapt to teaching progress.', FiTarget],
  ['Easy Material Sharing', 'Keep learning content organized, discoverable, and available anywhere.', FiShare2],
  ['Performance Analytics', 'Help staff understand results, progress, and improvement opportunities.', FiBarChart2],
];

const stats = [
  ['Total Courses', 128],
  ['Total Students', 4800],
  ['Total Teachers', 240],
  ['AI Quiz Attempts', 18500],
  ['Learning Materials', 3200],
];

const testimonials = [
  {
    name: 'Dr. Amelia Carter',
    role: 'Academic Director',
    quote:
      'The platform brings teaching plans, learning materials, and assessments into a single professional workflow.',
  },
  {
    name: 'Michael Reyes',
    role: 'Senior Lecturer',
    quote:
      'The AI quiz structure gives teachers a clear path from completed topics to meaningful student assessment.',
  },
  {
    name: 'Nadia Fernando',
    role: 'Student Representative',
    quote:
      'Learning feels organized and accessible, especially when materials, quizzes, and results are easy to find.',
  },
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl text-center"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-muted">{description}</p> : null}
    </motion.div>
  );
}

function AnimatedCounter({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) {
      return undefined;
    }

    const duration = 1100;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setCount(Math.floor(value * progress));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function LandingPage() {
  return (
    <main id="home">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.4 }}>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Premium University LMS
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
            AI Smart Learning Management System
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            An intelligent learning platform where teachers teach, AI generates quizzes
            from completed lessons, and students learn through personalized assessments.
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

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="relative"
        >
          <img
            src={heroImage}
            alt="AI-powered LMS dashboard illustration with learning materials and quiz analytics"
            className="w-full rounded-xl border border-line bg-white object-cover shadow-soft"
            loading="eager"
          />
          <div className="absolute -bottom-5 left-5 right-5 rounded-xl border border-line bg-white/95 p-4 shadow-soft backdrop-blur">
            <div className="grid grid-cols-3 gap-3 text-center">
              {['AI Quiz', 'Materials', 'Reports'].map((item) => (
                <div key={item}>
                  <p className="text-sm font-bold text-primary">{item}</p>
                  <p className="mt-1 text-xs text-muted">Ready</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="border-y border-line bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Features"
            title="Built For Smart Teaching And Learning"
            description="A complete foundation for institutions that need clean workflows, strong access control, and AI-ready assessment experiences."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {features.map(([title, description, Icon], index) => (
              <motion.article
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.28, delay: index * 0.03 }}
                whileHover={{ y: -6 }}
                className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-soft"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-primary">
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
            title="From Lesson Planning To Intelligent Assessment"
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
                transition={{ duration: 0.3, delay: index * 0.04 }}
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
            title="A Commercial-Grade Foundation For Modern Education"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map(([title, description, Icon]) => (
              <motion.article
                key={title}
                whileHover={{ y: -6 }}
                className="rounded-xl border border-line bg-page p-6"
              >
                <Icon className="size-8 text-primary" />
                <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-xl border border-line bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-page p-5 text-center">
                <p className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={value} />
                </p>
                <p className="mt-2 text-sm font-semibold text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Testimonials"
            title="Trusted By Academic Teams"
            description="Placeholder feedback showing the tone and layout for future real institution testimonials."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <motion.article
                key={testimonial.name}
                whileHover={{ y: -6 }}
                className="rounded-xl border border-line bg-white p-6 shadow-sm hover:shadow-soft"
              >
                <FiAward className="size-7 text-primary" />
                <p className="mt-5 text-sm leading-7 text-muted">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 border-t border-line pt-4">
                  <p className="text-sm font-bold text-ink">{testimonial.name}</p>
                  <p className="mt-1 text-xs text-muted">{testimonial.role}</p>
                </div>
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
              <Button className="bg-white text-primary hover:from-white hover:to-orange-50">
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
