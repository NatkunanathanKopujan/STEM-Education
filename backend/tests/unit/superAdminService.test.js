import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockHashPassword = jest.fn();
const mockCreateAdminRecord = jest.fn();
const mockDeleteAdminRecord = jest.fn();
const mockFindAdminById = jest.fn();
const mockListAdmins = jest.fn();
const mockUpdateAdminRecord = jest.fn();
const MOCK_INITIAL_PASSWORD = 'MockInitial1!';
const MOCK_BLOCKED_PASSWORD = 'MockBlocked1!';

jest.unstable_mockModule('../../utils/password.js', () => ({
  hashPassword: mockHashPassword,
}));

jest.unstable_mockModule('../../repositories/superAdminRepository.js', () => ({
  createAdminRecord: mockCreateAdminRecord,
  deleteAdminRecord: mockDeleteAdminRecord,
  findAdminById: mockFindAdminById,
  listAdmins: mockListAdmins,
  updateAdminRecord: mockUpdateAdminRecord,
}));

const { superAdminService } = await import('../../services/superAdminService.js');

describe('superAdminService password permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows Super Admin to set an initial admin password during creation', async () => {
    mockHashPassword.mockResolvedValue('hashed-password');
    mockCreateAdminRecord.mockResolvedValue({ id: 10, fullName: 'Admin User' });

    await expect(
      superAdminService.create({
        fullName: 'Admin User',
        username: 'admin.user',
        email: 'admin@example.invalid',
        password: MOCK_INITIAL_PASSWORD,
        department: 'IT',
        status: 'Active',
      }),
    ).resolves.toMatchObject({ id: 10 });

    expect(mockHashPassword).toHaveBeenCalledWith(MOCK_INITIAL_PASSWORD);
    expect(mockCreateAdminRecord).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed-password' }),
    );
  });

  test('rejects Super Admin password changes after admin account creation', async () => {
    await expect(
      superAdminService.update(10, {
        fullName: 'Admin User',
        username: 'admin.user',
        email: 'admin@example.invalid',
        password: MOCK_BLOCKED_PASSWORD,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Super Admin cannot change an admin password after account creation',
    });

    expect(mockFindAdminById).not.toHaveBeenCalled();
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockUpdateAdminRecord).not.toHaveBeenCalled();
  });

  test('allows non-password admin profile updates', async () => {
    mockFindAdminById.mockResolvedValue({
      id: 10,
      fullName: 'Admin User',
      username: 'admin.user',
      email: 'admin@example.invalid',
      phone: '',
      department: 'IT',
      status: 'Active',
    });
    mockUpdateAdminRecord.mockResolvedValue({
      id: 10,
      fullName: 'Admin User',
      department: 'Academic',
    });

    await expect(
      superAdminService.update(10, {
        department: 'Academic',
      }),
    ).resolves.toMatchObject({ department: 'Academic' });

    expect(mockUpdateAdminRecord).toHaveBeenCalledWith(
      10,
      expect.not.objectContaining({ passwordHash: expect.anything() }),
    );
  });
});
