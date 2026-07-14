import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiShield, FiUserCheck, FiUsers } from 'react-icons/fi';
import { RoleCard } from '../../components/auth/RoleCard';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';

const roleCards = [
  {
    role: USER_ROLES.STUDENT,
    title: 'Student',
    description: 'Access courses, learning materials, quizzes, results, and your profile.',
    icon: FiUsers,
  },
  {
    role: USER_ROLES.TEACHER,
    title: 'Teacher',
    description: 'Manage students, materials, weekly plans, quizzes, marks, and reports.',
    icon: FiUserCheck,
  },
  {
    role: USER_ROLES.ADMIN,
    title: 'Admin',
    description: 'Coordinate teachers, curriculum, academic reports, and institution setup.',
    icon: FiBriefcase,
  },
  {
    role: USER_ROLES.SUPER_ADMIN,
    title: 'Super Admin',
    description: 'Control platform administration, system settings, admins, and reports.',
    icon: FiShield,
  },
];

export function RoleSelectionPage() {
  const { homePath, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={homePath} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Secure Role Access
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
          Choose your LMS role
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
          Select how you want to access the AI Smart Learning Management System.
        </p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {roleCards.map((card, index) => (
          <motion.div
            key={card.role}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
          >
            <RoleCard {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
