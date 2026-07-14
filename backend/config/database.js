import mysql from 'mysql2/promise';
import { env } from './env.js';

export const db = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  const connection = await db.getConnection();
  connection.release();
  return true;
}
