import { db } from '../config/database.js';

const userSelect = `
  SELECT
    id,
    uuid,
    full_name AS fullName,
    username,
    email,
    password_hash AS passwordHash,
    role,
    status,
    last_login AS lastLogin,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM users
`;

export async function findUserByEmail(email) {
  const [rows] = await db.execute(
    `${userSelect} WHERE email = ? LIMIT 1`,
    [email],
  );

  return rows[0] || null;
}

export async function findUserByUsername(username) {
  const [rows] = await db.execute(`${userSelect} WHERE username = ? LIMIT 1`, [username]);
  return rows[0] || null;
}

export async function findUserByLoginIdentifier(identifier) {
  const [rows] = await db.execute(
    `${userSelect} WHERE email = ? OR username = ? LIMIT 1`,
    [identifier, identifier],
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await db.execute(`${userSelect} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function updateLastLogin(id) {
  await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
}

export async function updatePassword(id, passwordHash) {
  await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}
