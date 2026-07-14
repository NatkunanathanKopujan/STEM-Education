export const USER_ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const ROLE_LABELS = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.TEACHER]: 'Teacher',
  [USER_ROLES.STUDENT]: 'Student',
};

export const ROLE_HOME_PATHS = {
  [USER_ROLES.SUPER_ADMIN]: '/super-admin/dashboard',
  [USER_ROLES.ADMIN]: '/admin/dashboard',
  [USER_ROLES.TEACHER]: '/teacher/dashboard',
  [USER_ROLES.STUDENT]: '/student/dashboard',
};

export const getRoleHomePath = (role) => ROLE_HOME_PATHS[role] || '/app';
