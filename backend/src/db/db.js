const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',      // 数据库地址
  port: 3306,             // 默认端口
  user: 'root',           // 你的 MySQL 用户名
  password: '3306',
  database: 'magic', // 你创建的数据库名
  waitForConnections: true,
  connectionLimit: 10,    // 连接池最大连接数
  queueLimit: 0
});

module.exports = pool;