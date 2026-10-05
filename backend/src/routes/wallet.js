const express = require('express')
const router = express.Router()
//导入数据库连接池
const pool = require('../db/db')
//导入检查token的模块
const checkToken = require('../middle/checkToken')
//用户获取提现记录
router.get('/wallet',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        const [rows]=await pool.query(
            'SELECT username,balance FROM users WHERE id=?',[myId]
        )
        const [lows]=await pool.query(
            "SELECT id,amount,account,status,reject_reason,paid_at,created_at FROM withdrawals WHERE user_id=? ORDER BY created_at DESC",[myId]
        )
        if(rows.length===0){
            return res.json({code:'4001',msg:'用户不存在',data:null})
        }
        res.json({code:'1000',msg:"获取成功",data:{user:rows[0],withdrawals:lows}})
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//管理员获取待审核提现记录
router.get('/admin/wallet',checkToken,async(req,res)=>{
    try{
        const [rows]=await pool.query(
            `SELECT w.id,w.amount,w.account,w.created_at,u.username,u.balance 
            FROM withdrawals w
            LEFT JOIN users u ON u.id=w.user_id
            WHERE w.status=0 
            ORDER BY created_at DESC`
        )
        res.json({code:'1000',msg:"获取成功",data:rows})
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    } 
})
//用户发起请求，申请提现
router.post('/wallet',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        // account=支付宝/微信账号
        const {amount,account}=req.body
        if (!amount || amount <= 0) {
            return res.json({ code: '4001', msg: '提现金额错误', data: null })
        }
        //1.查余额
        const [rows] = await pool.query(
            'SELECT balance FROM users WHERE id = ?',
            [myId]
          )
          if (rows[0].balance < amount) {
            return res.json({ code: '4002', msg: '余额不足', data: null })
          }
        //2.事务：扣余额+创建提现记录
        const connection=await pool.getConnection()
        try{
            await connection.beginTransaction()
            //扣余额
            await connection.query("UPDATE users SET balance=balance-? WHERE id=?",[amount,myId])
            //创建提现记录
            await connection.query(
            'INSERT INTO withdrawals(user_id,amount,account,status) VALUES (?,?,?,0)',[myId,amount,account])
            await connection.commit()
            res.json({ code: '1000', msg: '提现申请已提交，等待审核', data: null })
        } catch (err) {
            await connection.rollback()
            throw err
          } finally {
            connection.release()
          }
    } catch (err) {
        console.error('提现失败：', err)
        res.json({ code: '5000', msg: '服务器错误', data: null })
      }
})
//管理员审核记录
router.put('/admin/wallet/:id',checkToken,async(req,res)=>{
    try{
        if (req.user.role !== 1) {
            return res.json({ code: '4003', msg: '需要管理员身份', data: null })
          }
        const id=req.params.id 
        const {status,rejectReason}=req.body
        if (![1, 2].includes(status)) {
            return res.json({ code: '4001', msg: '状态错误', data: null })
        }
        if (status === 2 && !rejectReason) {
            return res.json({ code: '4001', msg: '拒绝必须填理由', data: null })
        }
        // 查提现记录
        const [rows] = await pool.query(
            'SELECT id, user_id, amount, status FROM withdrawals WHERE id = ?',
            [id]
        )
        if (rows.length === 0) {
            return res.json({ code: '4004', msg: '提现记录不存在', data: null })
        }
        const w = rows[0]
            if (w.status !== 0) {
                return res.json({ code: '4005', msg: '该提现已处理', data: null })
        }
        // 事务
        const connection = await pool.getConnection()
        try {
            await connection.beginTransaction()

            if (status === 1) {
                // ✅ 通过 → 打款
                await connection.query(
                'UPDATE withdrawals SET status = 1, paid_at = NOW() WHERE id = ?',
                [id]
                )
            } else {
                // ✅ 拒绝 → 退回余额
                await connection.query(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [w.amount, w.user_id]
                )
                await connection.query(
                'UPDATE withdrawals SET status = 2, reject_reason = ? WHERE id = ?',
                [rejectReason, id]
                )
            }

            // 通知用户
            await connection.query(
                `INSERT INTO notifications (user_id, type, content, related_id)
                VALUES (?, 5, ?, ?)`,
                [
                w.user_id,
                status === 1 ? `提现 ¥${w.amount} 已打款` : `提现被拒绝：${rejectReason}`,
                id
                ]
            )

            await connection.commit()
            } catch (err) {
            await connection.rollback()
            throw err
            } finally {
            connection.release()
            }

            res.json({ code: '1000', msg: status === 1 ? '已通过' : '已拒绝', data: null })
        } catch (err) {
            console.error('审核提现失败：', err)
            res.json({ code: '5000', msg: '服务器错误', data: null })
        }
})
module.exports = router