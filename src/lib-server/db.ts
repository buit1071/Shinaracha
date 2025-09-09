import mysql from "mysql2/promise";

// ประกาศ type ใหม่ ที่รวมทั้ง function + property
type QueryFn = (<T = any>(sql: string, params?: any[]) => Promise<T[]>) & {
  getConnection: typeof pool.getConnection;
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

// ฟังก์ชัน query ปกติ
const queryFn = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
};

// ผูก getConnection เข้าไป
(queryFn as any).getConnection = () => pool.getConnection();

// cast ให้เป็น QueryFn
export const query = queryFn as QueryFn;

export default pool;
