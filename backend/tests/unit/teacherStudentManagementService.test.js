import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockHashPassword = jest.fn();
const mockFindActiveDepartmentByName = jest.fn();
const mockFindDepartmentById = jest.fn();
const mockFindActiveCurriculumByName = jest.fn();
const mockFindCurriculumById = jest.fn();
const mockCreateManagedUser = jest.fn();
const mockDeleteManagedUser = jest.fn();
const mockFindTeacherAdminOwnerByUserId = jest.fn();
const mockFindTeacherCurriculumsByUserId = jest.fn();
const mockFindTeacherDepartmentsByUserId = jest.fn();
const mockFindManagedUserById = jest.fn();
const mockListManagedUsers = jest.fn();
const mockUpdateManagedUser = jest.fn();

jest.unstable_mockModule('../../utils/password.js', () => ({
  hashPassword: mockHashPassword,
}));

jest.unstable_mockModule('../../repositories/departmentRepository.js', () => ({
  findActiveDepartmentByName: mockFindActiveDepartmentByName,
  findDepartmentById: mockFindDepartmentById,
}));

jest.unstable_mockModule('../../repositories/curriculumRepository.js', () => ({
  findActiveCurriculumByName: mockFindActiveCurriculumByName,
  findCurriculumById: mockFindCurriculumById,
}));

jest.unstable_mockModule('../../repositories/userManagementRepository.js', () => ({
  createManagedUser: mockCreateManagedUser,
  deleteManagedUser: mockDeleteManagedUser,
  findTeacherAdminOwnerByUserId: mockFindTeacherAdminOwnerByUserId,
  findTeacherCurriculumsByUserId: mockFindTeacherCurriculumsByUserId,
  findTeacherDepartmentsByUserId: mockFindTeacherDepartmentsByUserId,
  findManagedUserById: mockFindManagedUserById,
  listManagedUsers: mockListManagedUsers,
  updateManagedUser: mockUpdateManagedUser,
}));

const { studentService } = await import('../../services/studentService.js');

const teacherActor = {
  id: 20,
  role: 'teacher',
  username: 'teacher.one',
};

const assignedDepartments = [
  { departmentId: 7, department: 'IT' },
  { departmentId: 8, department: 'Math' },
];

const assignedCurriculums = [
  { curriculumId: 11, curriculum: 'IT1', departmentId: 7 },
  { curriculumId: 12, curriculum: 'Math1', departmentId: 8 },
];

const validPayload = {
  fullName: 'Student One',
  username: 'student.one',
  email: 'student.one@example.test',
  phone: '0786453345',
  studentId: 'STU-001',
  batch: '2026',
  password: 'Student123',
  departmentIds: [7, 8],
  curriculumId: 11,
  status: 'Active',
};

describe('teacher scoped student management service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHashPassword.mockResolvedValue('hashed-password');
    mockFindTeacherAdminOwnerByUserId.mockResolvedValue(3);
    mockFindTeacherDepartmentsByUserId.mockResolvedValue(assignedDepartments);
    mockFindTeacherCurriculumsByUserId.mockResolvedValue(assignedCurriculums);
    mockFindCurriculumById.mockResolvedValue({
      id: 11,
      name: 'IT1',
      title: 'IT1',
      status: 'Active',
      departmentId: 7,
      createdBy: 3,
    });
  });

  test('lists only students from a teacher assigned departments under the same admin campus', async () => {
    mockListManagedUsers.mockResolvedValue({ users: [], total: 0, page: 1 });

    await studentService.list({ search: 'student' }, teacherActor);

    expect(mockListManagedUsers).toHaveBeenCalledWith(
      'student',
      expect.objectContaining({
        search: 'student',
        managedByAdminId: 3,
        departmentIds: [7, 8],
      }),
    );
  });

  test('creates a student only inside the teacher assigned department and curriculum', async () => {
    mockCreateManagedUser.mockResolvedValue({ id: 100, fullName: 'Student One' });

    await expect(studentService.create(validPayload, teacherActor)).resolves.toMatchObject({ id: 100 });

    expect(mockCreateManagedUser).toHaveBeenCalledWith(
      'student',
      expect.objectContaining({
        departmentIds: [7, 8],
        departmentId: 7,
        department: 'IT, Math',
        curriculumId: 11,
        curriculum: 'IT1',
        managedByAdminId: 3,
        passwordHash: 'hashed-password',
      }),
    );
  });

  test('rejects creating a student in an unassigned department', async () => {
    await expect(
      studentService.create({ ...validPayload, departmentIds: [9] }, teacherActor),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'You can only assign students to your departments',
    });

    expect(mockCreateManagedUser).not.toHaveBeenCalled();
  });

  test('rejects creating a student with a curriculum not assigned to the teacher', async () => {
    mockFindCurriculumById.mockResolvedValue({
      id: 99,
      name: 'Science1',
      title: 'Science1',
      status: 'Active',
      departmentId: 7,
      createdBy: 3,
    });

    await expect(
      studentService.create({ ...validPayload, curriculumId: 99 }, teacherActor),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'You can only use curriculums assigned to you',
    });

    expect(mockCreateManagedUser).not.toHaveBeenCalled();
  });

  test('updates and deletes only students the teacher can access', async () => {
    mockFindManagedUserById.mockResolvedValue({
      id: 100,
      fullName: 'Student One',
      username: 'student.one',
      email: 'student.one@example.test',
      phone: '0786453345',
      studentId: 'STU-001',
      batch: '2026',
      status: 'Active',
      departmentIds: [7],
      departmentId: 7,
      department: 'IT',
      curriculumId: 11,
      curriculum: 'IT1',
      managedByAdminId: 3,
    });
    mockUpdateManagedUser.mockResolvedValue({ id: 100, fullName: 'Student Updated' });
    mockDeleteManagedUser.mockResolvedValue(true);

    await expect(
      studentService.update(100, { fullName: 'Student Updated', departmentIds: [7], curriculumId: 11 }, teacherActor),
    ).resolves.toMatchObject({ fullName: 'Student Updated' });

    await expect(studentService.remove(100, teacherActor)).resolves.toMatchObject({ id: 100, deleted: true });

    expect(mockUpdateManagedUser).toHaveBeenCalledWith(
      'student',
      100,
      expect.objectContaining({ departmentIds: [7], curriculumId: 11, managedByAdminId: 3 }),
    );
    expect(mockDeleteManagedUser).toHaveBeenCalledWith('student', 100);
  });
});
