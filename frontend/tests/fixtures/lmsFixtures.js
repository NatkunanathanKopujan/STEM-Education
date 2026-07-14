export const users = {
  superAdmin: { id: 1, fullName: 'Super Admin', role: 'super-admin' },
  admin: { id: 2, fullName: 'Admin User', role: 'admin' },
  teacher: { id: 3, fullName: 'Teacher User', role: 'teacher' },
  student: { id: 4, fullName: 'Student User', role: 'student' },
};

export const material = {
  id: 10,
  title: 'Week 1 HTML Notes',
  type: 'pdf',
  teacher: 'Teacher User',
};

export const notification = {
  id: 20,
  title: 'New material uploaded',
  message: 'Week 1 notes are ready',
  isRead: false,
};

export const fileRecord = {
  id: 30,
  originalFileName: 'week-1-notes.pdf',
  fileType: 'pdf',
  fileSize: 4096,
};

export const quizQuestion = {
  id: 40,
  question: 'What does HTML stand for?',
  options: ['Hyper Text Markup Language', 'High Text Machine Language'],
};
