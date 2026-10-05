const express = require('express')
const router = express.Router()
const {loginLimiter,registerLimiter}=require('../middle/limiters')
//导入jwt，生成token
const jwt=require('jsonwebtoken')
//导入数据库连接池
const pool = require('../db/db')
//导入bcrypt密文
const bcrypt = require('bcryptjs')
//导入校验中间件
const validate=require ('../middle/validate.js')
const {secret}=require('../../config/config')
//导入schema规则
const {registerSchema}=require('../schema/auth-schema')
router.get('/', (req, res) => {
  res.json({ message: 'ok' })
})
router.post('/login', loginLimiter,async(req, res) => {
  try {
    const {username,password}=req.body
    if (!username || !password) {
      return res.json({ code: '4001', msg: '用户名和密码不能为空', data: null });
    }
    const [rows]=await pool.query('SELECT id,username,password_hash,nickname,role,status FROM users WHERE username=?',
      [username]
    )
    if(rows.length===0){
      return res.json({code: '4004',msg: '用户名或密码错误',data: null
    })}
    const user=rows[0]
    //检查是否被禁
    if(user.status===0){return res.json({code:'4005',msg:"账号已被封禁",data:null
    })}
    const isMatch=await bcrypt.compare(password,user.password_hash)
    if(!isMatch){
      return res.json({code: '4004',msg: '用户名或密码错误',data: null})
    }
    //生成token
    const token=jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role  
        },secret,{expiresIn:60*60*24*7})
    res.json({
      code: '1000',
      msg: "登录成功",
      data: {
        token,//返回给前端
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role}
    })
  } catch (err) {
    res.json({
      code: '5000',
      msg: "登录失败",
      data: null})
  }

})
router.post('/register',registerLimiter,validate({body:registerSchema}), async (req, res) => {
  try {
    // console.log(req.body)
    const { username, password, email, nickname } = req.body
    
    //数据库连接池，判断是否有重名的
    const [row] = await pool.query('SELECT id FROM users WHERE username = ?', [username])
    if (row.length > 0) {
      return res.json({
        code: '4003',
        msg: '用户名已被注册',
        data: null
      });
    }
    // 密码加密（bcrypt 自动加盐，同一个密码每次哈希都不同）
    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query('INSERT INTO users(username,password_hash,nickname, email) VALUES (?, ?, ?, ?)',
      [username, passwordHash, nickname || username, email || null]
    )
    res.json({
      code: '4000',
      msg: '注册成功',
      data: { userId: result.insertId, username }
    })
  } catch (err) {
    console.error('注册失败：', err);
    res.json({ code: '5000', msg: '服务器错误', data: null });
  }
})
module.exports = router