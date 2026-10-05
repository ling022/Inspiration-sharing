const express=require('express')
const router=express.Router()
const pool=require('../db/db')
const checkToken=require('../middle/checkToken')
//创建订单
router.post('/orders',checkToken,async(req,res)=>{
    try{
        const buyerId=req.user.userId
        const {inspId}=req.query
        console.log(inspId)
        if(!inspId){
            return res.json({ code: '4001', msg: '缺少灵感 id', data: null })
        }
        //1.查灵感
        const [rows] = await pool.query(
            `SELECT id, user_id, title, price, is_sold, status 
            FROM inspirations WHERE id = ?`,
            [inspId]
        )
        if (rows.length === 0) {
            return res.json({ code: '4004', msg: '灵感不存在', data: null })
        }
        const insp = rows[0]
    
        // 2. 校验
        if (insp.status !== 1) {
            return res.json({ code: '4005', msg: '灵感未通过审核', data: null })
        }
        if (insp.is_sold === 1) {
            return res.json({ code: '4006', msg: '灵感已售出', data: null })
        }
        if (insp.user_id === buyerId) {
            return res.json({ code: '4007', msg: '不能购买自己的灵感', data: null })
        }
        //3.放重复下单：查有没有‘待付款’这一项,只查"30 分钟内的待付款订单"
        //僵尸订单也能用，加上时间或者定时器处理僵尸订单也可以
        const [exist] = await pool.query(
            `SELECT id, order_no FROM orders 
            WHERE buyer_id = ? AND inspiration_id = ? AND status = 0`,
            [buyerId, inspId]
        )
        if (exist.length > 0) {
            return res.json({
            code: '1000',
            msg: '继续支付',
            data: { orderId: exist[0].id, orderNo: exist[0].order_no }
            })
        }
        //4.生成订单号 math.floor向下取整
        const orderNo='ORD'+Date.now()+Math.floor(Math.random()*1000)
        //5.创建订单
        const [result] = await pool.query(
            `INSERT INTO orders (order_no, buyer_id, seller_id, inspiration_id, amount, status)
            VALUES (?, ?, ?, ?, ?, 0)`,
            [orderNo, buyerId, insp.user_id, inspId, insp.price]
        )
        res.json({
            code: '1000',
            msg: '订单创建成功',
            data: {
            orderId: result.insertId,
            orderNo,
            amount: insp.price
            }
        })
    } catch (err) {
      console.error('创建订单失败：', err)
      res.json({ code: '5000', msg: '服务器错误', data: null })
    }
})
//订单详情
router.get('/orders',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        const {role='buyer'}=req.query

        //同一段 SQL —— 通过变量动态切换 —— 不用写两遍。
        const otherField = role === 'seller' ? 'o.buyer_id' : 'o.seller_id'
        const whereField = role === 'seller' ? 'o.seller_id' : 'o.buyer_id'

        const [rows] = await pool.query(
            `SELECT 
               o.id, o.order_no, o.amount, o.status,
               o.created_at, o.paid_at,
               i.id AS inspiration_id, i.title, i.cover_image,
               u.nickname AS other_name, u.avatar AS other_avatar
             FROM orders o
             JOIN inspirations i ON o.inspiration_id = i.id
             LEFT JOIN users u ON u.id = ${otherField}
             WHERE ${whereField} = ?
             ORDER BY o.created_at DESC`,
            [myId]
          )
          res.json({ code: '1000', msg: '获取成功', data: rows })
        } catch (err) {
          console.error('查询订单失败：', err)
          res.json({ code: '5000', msg: '服务器错误', data: null })
        }
})
//订单详情页
router.get('/orders/:id',checkToken,async(req,res)=>{
    try{
        const myId = req.user.userId
        const orderId = req.params.id
    
        const [rows] = await pool.query(
          `SELECT 
             o.*, 
             i.title, i.cover_image, i.content,i.is_sold,i.id AS inspiration_id,
             u.nickname AS seller_name, u.avatar AS seller_avatar,
             b.nickname AS buyer_name, b.avatar AS buyer_avatar
           FROM orders o
           JOIN inspirations i ON o.inspiration_id = i.id
           LEFT JOIN users u ON o.seller_id = u.id
           LEFT JOIN users b ON o.buyer_id = b.id
           WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)`,
          [orderId, myId, myId]
        )
        if (rows.length === 0) {
          return res.json({ code: '4004', msg: '订单不存在', data: null })
        }
    
        res.json({ code: '1000', msg: '获取成功', data: rows[0] })
      } catch (err) {
        console.error('查询订单详情失败：', err)
        res.json({ code: '5000', msg: '服务器错误', data: null })
      }
})
//发起支付
router.post('/orders/:id/pay',checkToken,async(req,res)=>{
    try{
        const buyerId=req.user.userId
        const orderId=req.params.id
        const [rows]=await pool.query(
            'SELECT * FROM orders WHERE id=? AND buyer_id=?',
            [orderId,buyerId]
        )
        if(rows.length===0){
            return res.json({ code: '4004', msg: '订单不存在', data: null })
        }
        const order=rows[0]
        if(order.status!==0){
            return res.json({ code: '4005', msg: '订单状态错误', data: null })
        }
        // ============ 模拟支付方案 ============
        // 返回一个"模拟支付页"的 URL，前端跳过去
        const payUrl=`http://localhost:5173/pay/${order.order_no}`
        res.json({
            code: '1000',
            msg: '请前往支付',
            data: { payUrl, orderNo: order.order_no, amount: order.amount }
        })
        // ============ 真实支付方案（微信/支付宝）============
        /*
        * 真实场景：调用支付网关 SDK，创建预支付订单，拿到支付二维码/链接
        *
        * 【微信支付 Native 模式】
        * const WechatPay = require('wechatpay-node-v3')
        * const pay = new WechatPay({ appid, mchid, publicKey, privateKey })
        *
        * const result = await pay.transactions_native({
        *   description: `购买灵感：${order.title}`,
        *   out_trade_no: order.order_no,          // 你的订单号
        *   notify_url: 'https://your-domain.com/api/orders/notify',   // 回调地址
        *   amount: { total: order.amount * 100 }   // 微信单位是"分"
        * })
        * // result.code_url → 二维码内容
        *
        * res.json({
        *   code: '1000',
        *   data: {
        *     qrcodeUrl: result.code_url,          // 生成二维码给前端
        *     orderNo: order.order_no
        *   }
        * })
        *
        * 【支付宝电脑网站支付】
        * const AlipaySdk = require('alipay-sdk').default
        * const alipaySdk = new AlipaySdk({
        *   appId: process.env.ALIPAY_APP_ID,
        *   privateKey: process.env.ALIPAY_PRIVATE_KEY,
        *   alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
        * })
        *
        * const result = alipaySdk.pageExec('alipay.trade.page.pay', {
        *   method: 'GET',
        *   bizContent: {
        *     out_trade_no: order.order_no,
        *     total_amount: order.amount,
        *     subject: `购买灵感：${order.title}`,
        *     product_code: 'FAST_INSTANT_TRADE_PAY'
        *   },
        *   return_url: 'https://your-domain.com/orders',   // 支付后跳转
        *   notify_url: 'https://your-domain.com/api/orders/notify'   // 回调
        * })
        *
        * res.json({ code: '1000', data: { payUrl: result, orderNo: order.order_no } })
        */
    } catch (err) {
        console.error('发起支付失败：', err)
        res.json({ code: '5000', msg: '服务器错误', data: null })
    }
})
//模拟支付确认
router.post('/orders/mock-pay',checkToken,async(req,res)=>{
    try{
        const {orderNo}=req.body
        //调用‘支付成功’逻辑
        const result=await handlePaymentSuccess(orderNo)
        if(!result.ok){
            return res.json({ code: '4004', msg: result.msg, data: null })
        }
        res.json({ code: '1000', msg: '支付成功', data: null })
    } catch (err) {
    console.error('模拟支付失败：', err)
    res.json({ code: '5000', msg: '服务器错误', data: null })
  }
})
//支付回调，真实支付使用
router.post('/orders/notify',async(req,res)=>{
    try{
        // ============ 真实支付：验签 ============
    /*
     * 【微信支付回调验签】
     * const { WechatPay } = require('wechatpay-node-v3')
     * const pay = new WechatPay({ ... })
     *
     * // 微信 v3 回调验证
     * const nonce = req.headers['wechatpay-nonce']
     * const timestamp = req.headers['wechatpay-timestamp']
     * const signature = req.headers['wechatpay-signature']
     * const serial = req.headers['wechatpay-serial']
     *
     * const isValid = await pay.verifySign({
     *   timestamp, nonce, body: req.body, signature, serial
     * })
     * if (!isValid) {
     *   return res.status(400).send('sign error')
     * }
     *
     * // 解密回调数据（微信 v3 回调是加密的）
     * const decrypted = pay.decipher_gcm(
     *   req.body.resource.ciphertext,
     *   req.body.resource.associated_data,
     *   req.body.resource.nonce
     * )
     * const orderNo = decrypted.out_trade_no
     * const tradeState = decrypted.trade_state   // SUCCESS / REFUND 等
     */
    // ============ 模拟支付：直接从 body 拿 ============
    const orderNo = req.body.orderNo

    // 调统一的"支付成功"处理函数
    const result = await handlePaymentSuccess(orderNo)

    // 返回给支付网关
    // 微信要求返回 { code: 'SUCCESS', message: 'OK' }
    // 支付宝要求返回纯字符串 'success'
    res.send('success')

    // 微信：res.json({ code: 'SUCCESS', message: 'OK' })
    } catch (err) {
    console.error('支付回调处理失败：', err)
    res.status(500).send('error')
    }
})
// ============ 支付成功统一处理 ============
async function handlePaymentSuccess(orderNo){
    const connection=await pool.getConnection()
    try{
        await connection.beginTransaction()
        //1.查订单
        const [rows] = await connection.query(
            `SELECT id, buyer_id, seller_id, inspiration_id, amount, status 
             FROM orders WHERE order_no = ?`,
            [orderNo]
          )
          if (rows.length === 0) {
            return { ok: false, msg: '订单不存在' }
          }
          const order = rows[0]
          //2.幂等：已经处理过
          //同一个操作执行多次，结果和执行一次一样。
          //例如按10次电梯按钮，和只按一次结果是一样的
          if(order.status!==0){
            return {ok:true,msg:'订单已处理'}
          }

          //3.抢占灵感，避免多个用户买到一个灵感
          const [result] = await connection.query(
            `UPDATE inspirations 
             SET is_sold = 1 
             WHERE id = ? AND is_sold = 0`,
            [order.inspiration_id]
          )

          if (result.affectedRows === 0) {
            // ⚠️ 被别人抢走了
            await connection.query('UPDATE orders SET status = 4 WHERE id = ?', [order.id])  // 改退款
            await connection.commit()
            return { ok: false, msg: '灵感已被其他买家购买，订单已退款' }
          }
          //4.事务：订单+灵感+钱包+通知
          
          //4.1订单改状态
          await connection.query(
            'UPDATE orders SET status = 1, paid_at = NOW() WHERE id = ?',
            [order.id]
          )
          // 4.2 灵感标记已售
            await connection.query(
                'UPDATE inspirations SET is_sold = 1 WHERE id = ?',
                [order.inspiration_id]
            )
        
            // 4.3 卖家加钱
            await connection.query(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [order.amount, order.seller_id]
            )
            // 4.4 插通知给卖家
            await connection.query(
                `INSERT INTO notifications (user_id, type, content, related_id)
                VALUES (?, 5, ?, ?)`,
                [order.seller_id, `你的灵感被购买，收入 ¥${order.amount}`, order.id]
            )
        
            // 4.5 插通知给买家
            await connection.query(
                `INSERT INTO notifications (user_id, type, content, related_id)
                VALUES (?, 5, ?, ?)`,
                [order.buyer_id, `你的订单已支付成功`, order.id]
            )

            await connection.commit()
            //5.websocket推送
            const io=global.io//从app.js挂到global
            if(io){
                io.to(`user_${order.seller_id}`).emit('notification',{
                    type:5,
                    content:`你的灵感被购买，收入￥${order.amount}`
                })
                io.to(`user_${order.buyer_id}`).emit('order-paid',{
                    orderId:order.id,
                    msg:'支付成功'
                })
            }
            return {ok:true,msg:'支付处理成功'}
    }catch(err){
        await connection.rollback()
        console.error('支付处理失败：', err)
        return { ok: false, msg: '支付处理失败' }
    }finally {
        connection.release()
      }
}
//用户取消订单
router.put('/order/:id',checkToken,async(req,res)=>{
    try{
        const id=req.params.id
        const myId = req.user.userId
        // 一次 UPDATE：带 buyer_id 条件 + status 判断
        const [result] = await pool.query(
        'UPDATE orders SET status = 3 WHERE id = ? AND buyer_id = ? AND status = 0',
        [id, myId]
        )
        if (result.affectedRows === 0) {
        return res.json({ code: '4001', msg: '订单不存在或无法取消', data: null })
        }
        res.json({ code: '1000', msg: '取消成功', data: null })
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//管理端获取所有订单
router.get('/admin/orders',checkToken,async(req,res)=>{
    try{
        if(req.user.role!==1){return res.json({code:'4001',msg:'不是管理员',data:null})}
        const [rows]=await pool.query(
            `SELECT 
                o.id, o.order_no, o.amount, o.status,
                o.paid_at, o.created_at,
                
                -- 买家信息
                o.buyer_id,
                b.username AS buyer_username,
                b.nickname AS buyer_nickname,
                b.avatar   AS buyer_avatar,
                
                -- 卖家信息
                o.seller_id,
                s.username AS seller_username,
                s.nickname AS seller_nickname,
                s.avatar   AS seller_avatar,
                
                -- 灵感信息
                i.id       AS inspiration_id,
                i.title    AS inspiration_title,
                i.cover_image AS inspiration_cover
                
            FROM orders o
            LEFT JOIN users b       ON o.buyer_id  = b.id
            LEFT JOIN users s       ON o.seller_id = s.id
            LEFT JOIN inspirations i ON o.inspiration_id = i.id
            ORDER BY o.created_at DESC`
        )
        res.json({code:'1000',msg:'获取成功',data:rows})
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})

module.exports=router