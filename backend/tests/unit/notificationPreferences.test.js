import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockExecute = jest.fn();
const mockQuery = jest.fn();
let notificationRows = [];
let preferencesRow = {
  user_id: 7,
  quiz_notifications: 1,
  announcement_notifications: 1,
  material_upload_notifications: 1,
  reminder_notifications: 1,
  security_notifications: 1,
  email_notifications: 0,
  push_notifications: 0,
  sms_notifications: 0,
};

jest.unstable_mockModule('../../config/database.js', () => ({
  db: {
    execute: mockExecute,
    query: mockQuery,
  },
}));

jest.unstable_mockModule('../../utils/idGenerator.js', () => ({
  generateId: () => 'test-notification-uuid',
}));

function camelPreferences(row) {
  return {
    userId: row.user_id,
    quizNotifications: Boolean(row.quiz_notifications),
    announcementNotifications: Boolean(row.announcement_notifications),
    materialUploadNotifications: Boolean(row.material_upload_notifications),
    reminderNotifications: Boolean(row.reminder_notifications),
    securityNotifications: Boolean(row.security_notifications),
    emailNotifications: Boolean(row.email_notifications),
    pushNotifications: Boolean(row.push_notifications),
    smsNotifications: Boolean(row.sms_notifications),
  };
}

function applyPreferenceUpdate(sql, values) {
  const columns = [
    'quiz_notifications',
    'announcement_notifications',
    'material_upload_notifications',
    'reminder_notifications',
    'security_notifications',
    'email_notifications',
    'push_notifications',
    'sms_notifications',
  ];
  const updatedColumns = columns.filter((column) => sql.includes(`${column} = ?`));

  updatedColumns.forEach((column, index) => {
    preferencesRow[column] = values[index];
  });
}

mockExecute.mockImplementation(async (sql, values = []) => {
  if (sql.includes('INSERT IGNORE INTO notification_preferences')) {
    return [{ affectedRows: 0 }, []];
  }

  if (sql.includes('FROM notification_preferences')) {
    return [[camelPreferences(preferencesRow)], []];
  }

  if (sql.includes('UPDATE notification_preferences SET')) {
    applyPreferenceUpdate(sql, values);
    return [{ affectedRows: 1 }, []];
  }

  if (sql.includes('INSERT INTO notifications')) {
    notificationRows.push(values);
    return [{ insertId: 99 }, []];
  }

  if (sql.includes('INSERT INTO notification_history')) {
    return [{ insertId: 100 }, []];
  }

  return [[], []];
});

mockQuery.mockImplementation(async (sql) => {
  if (sql.includes('FROM notification_preferences')) {
    const match = sql.match(/SELECT\s+([a-z_]+)\s+AS enabled/i);
    const column = match?.[1];

    return [[{ enabled: preferencesRow[column] }], []];
  }

  return [[], []];
});

const {
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} = await import('../../repositories/notificationRepository.js');

describe('notification preferences repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationRows = [];
    preferencesRow = {
      user_id: 7,
      quiz_notifications: 1,
      announcement_notifications: 1,
      material_upload_notifications: 1,
      reminder_notifications: 1,
      security_notifications: 1,
      email_notifications: 0,
      push_notifications: 0,
      sms_notifications: 0,
    };
  });

  test('reads and updates notification preferences from the database', async () => {
    await expect(getNotificationPreferences(7)).resolves.toMatchObject({
      userId: 7,
      quizNotifications: true,
      emailNotifications: false,
    });

    await expect(
      updateNotificationPreferences(7, {
        quizNotifications: false,
        emailNotifications: true,
        unknownSetting: true,
      }),
    ).resolves.toMatchObject({
      quizNotifications: false,
      emailNotifications: true,
    });

    expect(preferencesRow.quiz_notifications).toBe(0);
    expect(preferencesRow.email_notifications).toBe(1);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE notification_preferences SET'),
      expect.arrayContaining([0, 1, 7]),
    );
  });

  test('does not create disabled notification categories', async () => {
    preferencesRow.announcement_notifications = 0;

    await expect(
      createNotification({
        userId: 7,
        role: 'super-admin',
        title: 'Announcement',
        message: 'Published announcement',
        notificationType: 'announcement',
      }),
    ).resolves.toBeNull();

    expect(notificationRows).toHaveLength(0);
  });

  test('creates enabled notification categories normally', async () => {
    await expect(
      createNotification({
        userId: 7,
        role: 'super-admin',
        title: 'Security alert',
        message: 'Password changed',
        notificationType: 'security',
      }),
    ).resolves.toBe(99);

    expect(notificationRows).toHaveLength(1);
  });
});
