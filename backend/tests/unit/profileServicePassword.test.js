import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockFindUserById = jest.fn();
const mockUpdatePassword = jest.fn();
const mockComparePassword = jest.fn();
const mockHashPassword = jest.fn();
const mockCreateSecurityEvent = jest.fn();
const mockTouchPasswordChanged = jest.fn();
const mockAuditAction = jest.fn();
const mockCloseAllSessions = jest.fn();
const MOCK_CURRENT_PASSWORD = 'MockCurrent1!';
const MOCK_NEW_PASSWORD = 'MockUpdated1!';

jest.unstable_mockModule('../../models/userModel.js', () => ({
  findUserById: mockFindUserById,
  updatePassword: mockUpdatePassword,
}));

jest.unstable_mockModule('../../utils/password.js', () => ({
  comparePassword: mockComparePassword,
  hashPassword: mockHashPassword,
}));

jest.unstable_mockModule('../../repositories/profileRepository.js', () => ({
  closeAllSessions: mockCloseAllSessions,
  closeSession: jest.fn(),
  createSecurityEvent: mockCreateSecurityEvent,
  getProfile: jest.fn(),
  getUserPreferences: jest.fn(),
  isEmailAvailable: jest.fn(),
  listLoginHistory: jest.fn(),
  listSecurityEvents: jest.fn(),
  listSessions: jest.fn(),
  removeProfilePhoto: jest.fn(),
  saveProfilePhoto: jest.fn(),
  touchPasswordChanged: mockTouchPasswordChanged,
  updateProfile: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

jest.unstable_mockModule('../../repositories/notificationRepository.js', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

jest.unstable_mockModule('../../services/securityService.js', () => ({
  auditAction: mockAuditAction,
}));

const { changeMyPassword } = await import('../../services/profileService.js');

describe('profileService self-service password changes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows an admin to change their own password with the current password', async () => {
    mockFindUserById.mockResolvedValue({ id: 22, passwordHash: 'current-hash' });
    mockComparePassword
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockHashPassword.mockResolvedValue('new-hash');
    mockCloseAllSessions.mockResolvedValue(2);

    await expect(
      changeMyPassword(
        { id: 22, role: 'admin' },
        {
          currentPassword: MOCK_CURRENT_PASSWORD,
          newPassword: MOCK_NEW_PASSWORD,
        },
        '127.0.0.1',
      ),
    ).resolves.toEqual({ changed: true, affectedSessions: 2 });

    expect(mockUpdatePassword).toHaveBeenCalledWith(22, 'new-hash');
    expect(mockTouchPasswordChanged).toHaveBeenCalledWith(22);
    expect(mockCloseAllSessions).toHaveBeenCalledWith(22, undefined);
    expect(mockCreateSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 22,
        eventType: 'password_changed',
      }),
    );
    expect(mockAuditAction).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ id: 22, role: 'admin' }),
        action: 'password_changed',
        module: 'profile',
      }),
    );
  });
});
