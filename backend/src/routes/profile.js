const express = require('express')
const router = express.Router()
//导入数据库连接池
const pool = require('../db/db')
//导入检查token的模块
const checkToken = require('../middle/checkToken')
router.get('/profile',checkToken,async(req,res)=>{
try{ 
    //1.验证是否是用户
    if(req.user.role!==0){
        return res.json({code:'4001',msg:'只有用户才能查看',data:null})
    }
    const id=req.user.userId
    //2.查看是否有该用户的信息
    const [rows]=await pool.query(`SELECT username,nickname,email,avatar,bio,balance
        FROM users
        WHERE id=?
        `,[id])
    if(rows.length==0){return res.json({code:'4002',msg:'无该用户',data:null})}
    //3.查看该用户下的灵感的信息
    const [lows]=await pool.query(`
        SELECT 
            i.id, i.title, i.cover_image, i.price,
            i.view_count, i.like_count, i.favorite_count,
            i.status, i.reject_reason, i.created_at,
            i.is_sold,
            -- 订单里的买家信息（如果已售出）
            o.buyer_id,
            bu.nickname AS buyer_name,
            -- 未读私信数量（和这个买家/卖家的会话）
            (
                SELECT COUNT(*) 
                FROM messages m
                WHERE m.receiver_id = ? 
                AND m.inspiration_id = o.inspiration_id 
                AND m.sender_id = o.buyer_id
                AND m.is_read = 0
            ) AS unread_count
        FROM inspirations i
        LEFT JOIN orders o ON o.inspiration_id = i.id AND o.status IN (1, 2)
        LEFT JOIN users bu ON o.buyer_id = bu.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC`,[id,id])
    //4.查看该用户购买的灵感
    const [bought] = await pool.query(
        `SELECT 
           o.id AS order_id, o.order_no, o.amount, o.status AS order_status,
           o.created_at AS order_created_at, o.paid_at,
           i.id AS inspiration_id, i.title, i.cover_image, i.price, i.is_original,
           u.id AS seller_id, u.nickname AS seller_name, u.avatar AS seller_avatar,
           -- ✅ 未读私信数：卖家发给我的、关于这条灵感的、未读的
         (
           SELECT COUNT(*)
           FROM messages m
           WHERE m.inspiration_id = o.inspiration_id
             AND m.sender_id = o.seller_id      -- 卖家发的
             AND m.receiver_id = ?              -- 我收的
             AND m.is_read = 0
         ) AS unread_count
         FROM orders o
         JOIN inspirations i ON o.inspiration_id = i.id
         LEFT JOIN users u ON o.seller_id = u.id
         WHERE o.buyer_id = ? AND o.status IN (1, 2)
         ORDER BY o.created_at DESC`,
        [id,id]
      )
    const list=rows.map(item=>({
        userName:item.username,
        nickName:item.nickname,
        email:item.email,
        avatar:item.avatar,
        bio:item.bio,
        balance:item.balance
    }))
    const list2 = lows.map(item => ({
        id: item.id,
        title: item.title,
        coverImage: item.cover_image,
        price: item.price,
        viewCount: item.view_count,
        likeCount: item.like_count,
        favoriteCount: item.favorite_count,
        status: item.status,
        rejectReason: item.reject_reason,
        createdAt: item.created_at ,
        isSold: item.is_sold,                // 是否已售出
        buyerId: item.buyer_id,              // 买家 id（如果有）
        buyerName: item.buyer_name,          // 买家昵称
        unreadCount: item.unread_count || 0  // 未读私信数
      }))
      const list3 = bought.map(item => ({
        orderId: item.order_id,
        orderNo: item.order_no,
        amount: item.amount,
        orderStatus: item.order_status,
        orderCreatedAt: item.order_created_at,
        paidAt: item.paid_at,
        inspirationId: item.inspiration_id,
        title: item.title,
        coverImage: item.cover_image,
        price: item.price,
        isOriginal: item.is_original,
        sellerId: item.seller_id,
        sellerName: item.seller_name,
        sellerAvatar: item.seller_avatar||"",
        unreadCount: item.unread_count || 0 
      }))
    res.json({code:'1000',msg:'获取成功',data:{list,list2,list3}})
}catch(err){
    console.log(err)
    res.json({code:'5000',msg:'服务器错误',data:null})
}
})
router.put('/profile',checkToken,async(req,res)=>{
try{
    const id=req.user.userId
    const {userName,nickName,email,bio}=req.body
    if(!userName){return res.json({code:'4001',msg:"缺少用户名",data:null})}
    //  检查用户名是否被其他人使用
    const [exist] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [userName, id]
      )
      if (exist.length > 0) {
        return res.json({ code: '4003', msg: '用户名已被占用', data: null })
      }
    
    //更新
    // 日期会自动更新，不用传入
    const [result]=await pool.query("UPDATE users SET username=?,nickname=?,email=?,bio=? WHERE id=?",[userName,nickName,email,bio,id])
    
    //检查数据库有没有该用户
    //affectedRows指的是受影响的行数，值不变也受影响
    if (result.affectedRows === 0) {
        return res.json({ code: '4004', msg: '用户不存在', data: null })
      }
    
    res.json({code:'1000',msg:"更新成功",data:null})
}catch(err){
    console.error('更新失败：', err)
    res.json({code:'5000',msg:'服务器错误',data:null})
}
})
router.get('/messages',checkToken,async(req,res)=>{
try{
    const myId=req.user.userId
    const {to,inspId}=req.query
    if (!to) {
        return res.json({ code: '4001', msg: '缺少对方用户 id', data: null })
      }

    //查对方用户的信息
    const [userRows] = await pool.query(
        'SELECT id, username, nickname, avatar FROM users WHERE id = ?',
        [to]
      )
      if (userRows.length === 0) {
        return res.json({ code: '4004', msg: '对方用户不存在', data: null })
    }
    const otherUser = userRows[0]
    const [rows]=await pool.query(`
        SELECT 
            id, sender_id, receiver_id, content, is_read, created_at,inspiration_id
        FROM messages
        WHERE ((sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?))
        AND inspiration_id=?
        ORDER BY created_at ASC
        `,[myId, to, to, myId,inspId])
        await pool.query("UPDATE messages SET is_read=1 WHERE sender_id=? AND receiver_id=? AND inspiration_id=? ",
            [to,myId,inspId])
    const list = rows.map(m => ({
        id: m.id,
        content: m.content,
        isMine: m.sender_id === myId,   // ← 判断是不是"我发的"，前端用它区分左右气泡
        //wait wait messages表里面没有inspirations_id
        inspirationId:m.inspiration_id,
        createdAt: m.created_at
      }))
    res.json({code:'1000',msg:'读取成功',data:{list,otherUser:{
            id: otherUser.id,
          userName: otherUser.username,
          nickName: otherUser.nickname,
          avatar: otherUser.avatar
        }}
})
}catch(err){
    console.log(err)
    res.json({code:'5000',msg:'服务器错误',data:null})
}
})
//发送私信
router.post('/messages',checkToken,async(req,res)=>{
    try{
        const id=req.user.userId
        const {to,message,inspId}=req.query
        if (!to) {
            return res.json({ code: '4001', msg: '缺少对方用户 id', data: null })
          }
        if(!inspId){
            return res.json({ code: '4003', msg: '缺少灵感id', data: null })
        }
        const [userRows] = await pool.query(
            'SELECT id, username, nickname, avatar FROM users WHERE id = ?',
            [to]
          )
          if (userRows.length === 0) {
            return res.json({ code: '4004', msg: '对方用户不存在', data: null })
        }
        const [result]=await pool.query("INSERT INTO messages(sender_id,receiver_id,content,is_read,inspiration_id) VALUES (?,?,?,?,?)",
        [id,to,message,0,inspId])
        const io=req.app.get('io')
        io.to(`user_${to}`).emit('new-message',{
          id:result.insertId,
          senderId:id,
          message,
          inspirationId:inspId,
          createdAt:new Date()
        })
        res.json({code:'1000',msg:'私信成功',data:null})
        console.log(id)
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//获取总的未读信息数
router.get('/unread-count',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        // 私信未读
        const [[{ msgCount }]] = await pool.query(
            'SELECT COUNT(*) AS msgCount FROM messages WHERE receiver_id = ? AND is_read = 0',
            [myId]
        )
    
        // 通知未读
        const [[{ notifCount }]] = await pool.query(
            'SELECT COUNT(*) AS notifCount FROM notifications WHERE user_id = ? AND type != 3 AND is_read = 0',
            [myId]
        )
        res.json({ code: '1000', msg: '获取成功', data: {
            messageCount: msgCount,      
            notificationCount: notifCount 
  }})
} catch (err) {
    console.error(err)
    res.json({ code: '5000', msg: '服务器错误', data: null })
  }
})
//获取当前用户的私信
router.get('/conversations', checkToken, async (req, res) => {
    try {
      const myId = req.user.userId
  
      const [rows] = await pool.query(
        `SELECT 
           m.inspiration_id,
           i.title AS inspiration_title,
           i.cover_image,
           CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_id,
           u.nickname AS other_name,
           u.avatar AS other_avatar,
           MAX(m.created_at) AS last_time,
           SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1) AS last_content,
           SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) AS unread_count
         FROM messages m
         LEFT JOIN inspirations i ON m.inspiration_id = i.id
         LEFT JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
         WHERE m.sender_id = ? OR m.receiver_id = ?
         GROUP BY m.inspiration_id, other_id, i.title, i.cover_image, u.nickname, u.avatar
         ORDER BY last_time DESC`,
        [myId, myId, myId, myId, myId]
      )
  
      const list = rows.map(r => ({
        inspirationId: r.inspiration_id,
        inspirationTitle: r.inspiration_title,
        coverImage: r.cover_image,
        otherUserId: r.other_id,
        otherName: r.other_name,
        otherAvatar: r.other_avatar,
        lastContent: r.last_content,
        lastTime: r.last_time,
        unreadCount: Number(r.unread_count) || 0
      }))
  
      res.json({ code: '1000', msg: '获取成功', data: list })
    } catch (err) {
      console.error('查询会话失败：', err)
      res.json({ code: '5000', msg: '服务器错误', data: null })
    }
  })
//获取当前用户的通知
router.get('/notifications',checkToken,async(req,res)=>{
try{
    const myId = req.user.userId
    const [rows] = await pool.query(
      `SELECT id, type, content, related_id, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       AND type != 3  
       ORDER BY created_at DESC
       LIMIT 20`,
      [myId]
    )
    const list = rows.map(n => ({
      id: n.id,
      type: n.type,
      content: n.content,
      relatedId: n.related_id,
      isRead: n.is_read === 1,
      createdAt: n.created_at
    }))
    res.json({ code: '1000', msg: 'OK', data: list })
  } catch (err) {
    console.error(err)
    res.json({ code: '5000', msg: '服务器错误', data: null })
  }
})
//将信息中心的通知变已读
router.put('/notification',checkToken,async(req,res)=>{
    try{
        const {id}=req.query
        await pool.query("UPDATE notifications SET is_read=1 WHERE id=?",id)
        res.json({code:'1000',msg:'更新成功',data:null})
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
module.exports = router