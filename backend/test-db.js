// test-db.js
const pool = require('./src/db');

async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('数据库连接成功！', rows);
  } catch (err) {
    console.error('连接失败：', err.message);
  } finally {
    process.exit();
  }
}

test();