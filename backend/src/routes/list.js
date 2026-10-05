// 导入 AI 工具
const { analyzeInspiration } = require('../utils/ai')
// 密码要加密,管理员重置密码时使用
const bcrypt = require('bcryptjs')   
const express = require('express')
const router = express.Router()
//导入数据库连接池
const pool = require('../db/db')
//导入检查token的模块
const checkToken = require('../middle/checkToken')
//用户端获取已审核通过的灵感列表
router.get('/inspirations', checkToken, async (req, res) => {
    try {
        //当前是第几页
        const page = parseInt(req.query.page) || 1
        //一页显示多少条
        let pageSize = parseInt(req.query.pageSize) || 20
        if (pageSize > 100) pageSize = 100   // 防止攻击
        //从第几条记录开始查
        //为什么减 1？ 因为页码从 1 开始，但 SQL 的 OFFSET 从 0 开始。
        const offset = (page - 1) * pageSize
        //前端用以下代码接收
        /*const res = await request.get('/inspirations', {
          params: { page: page.value, pageSize }
        }); */
        //筛选参数，模糊查询作者姓名，灵感标题，灵感内容，
        //精确查询是否原创，分类
        //keyword，categoryId,isOriginal都是前端传来的搜索框里的参数
        const keyword=req.query.keyword||''
        const categoryId=req.query.categoryId||''
        const isOriginal=req.query.isOriginal
        //动态拼接where
        let where="WHERE i.status=1 AND i.is_sold=0"
        const params=[]
        if(categoryId){
            where+=' AND i.category_id=?'
            params.push(categoryId)
        }
        if (isOriginal !== undefined && isOriginal !== '') {
            where += ' AND i.is_original = ?'
            params.push(Number(isOriginal))
          }
        if(keyword){
            where+=' AND (i.title LIKE ? OR i.content LIKE ? OR u.username LIKE ? OR u.nickname LIKE ?)'
            const like=`%${keyword}%`
            params.push(like,like,like,like)
        }
        const [rows] = await pool.query(
            `SELECT 
                i.id, i.user_id, i.category_id, i.title,
                i.cover_image, i.is_original, i.created_at, i.price,
                u.username, u.nickname
                FROM inspirations i
                LEFT JOIN users u ON i.user_id = u.id
                ${where}
                ORDER BY i.created_at DESC
                LIMIT ? OFFSET ?`,
            [...params,pageSize, offset]
        )
        //total返回总数据，便于前端无限下滑时的操作
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total 
            FROM inspirations  i
            LEFT JOIN users u ON i.user_id = u.id
            ${where}`,
            params);
        const list = rows.map(item => ({
            //map 把数组里的每一项"转换"成新的东西，返回一个新数组,在这里只是改成驼峰式
            id: item.id,
            userId: item.user_id,
            categoryId: item.category_id,
            title: item.title,
            coverImage: item.cover_image,
            isOriginal: item.is_original,
            createdAt: item.created_at,
            price: item.price,
            authorName: item.nickname || item.username,   // 优先显示昵称
            authorUsername: item.username
        })
        )
        res.json({
            code: "1000", msg: '获取成功', data: {
                list, page, pageSize, total
            }

        })
    } catch (err) {
        console.error('查询失败：', err);
        res.json({
            code: "5000",
            msg: '服务器错误',
            data: null
        })
    }
})
//获取特定id灵感详情
router.get('/inspirations/:id', checkToken, async (req, res) => {
    try {
        // 从 URL 拿 id
        const id=req.params.id   
        const [rows] = await pool.query(
            `SELECT 
                i.id, i.user_id, i.category_id, i.title,
                i.content,i.view_count,i.favorite_count,i.like_count,
                i.cover_image, i.is_original, i.created_at,i.price,
                u.username, u.nickname, u.avatar,i.is_sold,u.bio
                FROM inspirations i
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id = ? AND i.status = 1`,
            [id]
        )
        //获取该灵感的标签
        const [lows]=await pool.query(
            `SELECT 
            t.name
            FROM tags t
            LEFT JOIN inspiration_tags i ON t.id=i.tag_id
            WHERE i.inspiration_id=?`,[id]
        )
        //更新浏览量
        await pool.query(
            'UPDATE inspirations SET view_count = view_count + 1 WHERE id = ?',
            [id]
          )
        if (rows.length === 0) {
            return res.json({ code: '4004', msg: '灵感不存在', data: null })
          }
          const item=rows[0]
          const detail={
            //map 把数组里的每一项"转换"成新的东西，返回一个新数组,在这里只是改成驼峰式
            id: item.id,
            userId: item.user_id,
            categoryId: item.category_id,
            title: item.title,
            content:item.content,
            likeCount:item.like_count,
            favoriteCount:item.favorite_count,
            isSold:item.is_sold,
            viewCount:item.view_count,
            coverImage: item.cover_image,
            isOriginal: item.is_original,
            createdAt: item.created_at,
            price: item.price,
            authorName: item.nickname || item.username,   // 优先显示昵称
            authorUsername: item.username,
            authorAvatar: item.avatar,
            authorBio:item.bio,
            tags:lows
        }
        res.json({
            code: "1000", msg: '获取成功', data: detail
        })
    } catch (err) {
        console.log(err)
        res.json({
            code: '5000',
            msg: "读取失败",
            data: null
        })
    }
})
//管理端获取待审核的灵感列表
router.get('/admin/inspirations',checkToken,async(req,res)=>{
try{
    const page = parseInt(req.query.page) || 1
    let pageSize = parseInt(req.query.pageSize) || 20
    if (pageSize > 100) pageSize = 100   // 防止攻击
    const offset = (page - 1) * pageSize
 
    const [rows] = await pool.query(
        `SELECT 
            i.id, i.user_id, i.category_id, i.title,
            i.cover_image, i.is_original, i.created_at, i.price,
            u.username, u.nickname
            FROM inspirations i
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.status=0
            ORDER BY i.created_at DESC
            LIMIT ? OFFSET ?`,
        [pageSize, offset]
    )
    //total返回总数据，便于前端无限下滑时的操作
    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total 
        FROM inspirations  i
        LEFT JOIN users u ON i.user_id = u.id
        where i.status=0`);
    const list = rows.map(item => ({
        //map 把数组里的每一项"转换"成新的东西，返回一个新数组,在这里只是改成驼峰式
        id: item.id,
        userId: item.user_id,
        categoryId: item.category_id,
        title: item.title,
        coverImage: item.cover_image,
        isOriginal: item.is_original,
        createdAt: item.created_at,
        price: item.price,
        authorName: item.nickname || item.username,   // 优先显示昵称
        authorUsername: item.username
    })
    )
    res.json({
        code: "1000", msg: '获取成功', data: {
            list, page, pageSize, total
        }

    })
} catch (err) {
    console.error('查询失败：', err);
    res.json({
        code: "5000",
        msg: '服务器错误',
        data: null
    })
}
})
//管理端进入详情页查看ai给出的内容进行判断
router.get('/admin/inspirations/:id', checkToken, async (req, res) => {
    try {
        // 从 URL 拿 id
        const id=req.params.id   
        const [rows] = await pool.query(
            `SELECT 
                i.id, i.user_id, i.category_id, i.title,
                i.content,i.ai_price,i.ai_score,i.ai_reason,
                i.cover_image, i.is_original, i.created_at,i.price,
                u.username, u.nickname, u.avatar
                FROM inspirations i
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id = ? AND i.status = 0`,
            [id]
        )
        //获取该灵感的标签
        const [lows]=await pool.query(
            `SELECT 
            t.name
            FROM tags t
            LEFT JOIN inspiration_tags i ON t.id=i.tag_id
            WHERE i.inspiration_id=?`,[id]
        )
        
        if (rows.length === 0) {
            return res.json({ code: '4004', msg: '灵感不存在', data: null })
          }
          const item=rows[0]
          const detail={
            //map 把数组里的每一项"转换"成新的东西，返回一个新数组,在这里只是改成驼峰式
            id: item.id,
            userId: item.user_id,
            categoryId: item.category_id,
            title: item.title,
            content:item.content,
            isSold:item.is_sold,
            coverImage: item.cover_image,
            isOriginal: item.is_original,
            createdAt: item.created_at,
            price: item.price,
            aiScore:item.ai_score,
            aiPrice:item.ai_price,
            aiReason:item.ai_reason,
            authorName: item.nickname || item.username,   // 优先显示昵称
            authorUsername: item.username,
            authorAvatar: item.avatar,
            tags:lows
        }
        res.json({
            code: "1000", msg: '获取成功', data: detail
        })
    } catch (err) {
        console.log(err)
        res.json({
            code: '5000',
            msg: "读取失败",
            data: null
        })
    }
})
//管理端操作灵感状态
router.put('/admin/inspirations/:id',checkToken,async (req,res)=>{
    try{
        //1.检查是否为管理员
        if(req.user.role!==1){return res.json({code:'4003',msg:'需要管理员身份',data:null})}
        const {id}=req.params
        const {status,rejectReason}=req.body
        //2.检查参数
        if(![1,2].includes(status)){
            return res.json({code:'4001',msg:'status只能是0或者1',data:null})
        }
        if(status==2&&!rejectReason){
            return res.json({code:'4001',msg:'拒绝时必须填写理由',data:null})
        }
        // 3. 检查灵感是否存在
        const [exist] = await pool.query('SELECT id, user_id,status,title FROM inspirations WHERE id = ?', [id])
        if (exist.length === 0) {
        return res.json({ code: '4004', msg: '灵感不存在', data: null })
        }
        const inspiration =exist[0]
         // 4. 更新
        await pool.query(
            'UPDATE inspirations SET status = ?, reject_reason = ? WHERE id = ?',
            [status, status === 2 ? rejectReason : null, id]
        )
        const content= status===1?`您的灵感《${inspiration.title}》已通过审核`:`您的灵感《${inspiration.title}》已被拒绝,理由:${rejectReason}`
        //5.插通知
        await pool.query(
            `INSERT INTO notifications (user_id,type,content,related_id)
            VALUES (?,4,?,?)`,
            [inspiration.user_id,content,id]
        )
        //6.通过websocket推送
        const io=req.app.get('io')
        //io.to()指定"给 user_2 房间里的所有连接"
        //emit('',{})触发名为 ''的事件，带数据
        io.to(`user_${inspiration.user_id}`).emit('notification',{
            type:4,
            content,
            relatedId: id,
            createdAt:new Date()
        })
        // 7. 返回
        res.json({
            code: '1000',
            msg: status === 1 ? '已通过审核' : '已拒绝',
            data: { id: Number(id), status }
        })
    }catch (err) {
        console.error('审核失败：', err)
        res.json({ code: '5000', msg: '服务器错误', data: null })
      }
})
//获取该灵感是否被登陆者点赞
router.get('/like',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        const {inspId}=req.query
        let isLike=true
        const [rows]=await pool.query("SELECT id FROM likes WHERE user_id=? AND inspiration_id=?",[myId,inspId])
        
        if(rows.length===0){
            res.json({code:'1000',msg:'获取成功,没有该记录',data:!isLike})
        }else if(rows.length===1){
            res.json({code:'1000',msg:'获取成功,有该记录',data:isLike})
        }else{res.json({code:'4001',msg:'获取失败',data:null})}
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//获取该灵感是否被登陆者收藏
router.get('/favorite',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        const {inspId}=req.query
        let isFavorite=true
        const [rows]=await pool.query("SELECT id FROM favorites WHERE user_id=? AND inspiration_id=?",[myId,inspId])
        
        if(rows.length===0){
            res.json({code:'1000',msg:'获取成功,没有该记录',data:!isFavorite})
        }else if(rows.length===1){
            res.json({code:'1000',msg:'获取成功,有该记录',data:isFavorite})
        }else{res.json({code:'4001',msg:'获取失败',data:null})}
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//点赞功能
router.put('/like',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        const {inspId}=req.query
        // 查有没有点过
        const [exist] = await pool.query(
            'SELECT id FROM likes WHERE user_id = ? AND inspiration_id = ?',
            [myId, inspId]
        )
        if (exist.length > 0) {
            // 已点赞 → 取消
            await pool.query('DELETE FROM likes WHERE user_id = ? AND inspiration_id = ?', [myId, inspId])
            await pool.query('UPDATE inspirations SET like_count = like_count - 1 WHERE id = ?', [inspId])
            res.json({ code: '1000', msg: '已取消点赞'})
          } else {
            // 未点赞 → 点赞
            await pool.query('INSERT INTO likes (user_id, inspiration_id) VALUES (?, ?)', [myId, inspId])
            await pool.query('UPDATE inspirations SET like_count = like_count + 1 WHERE id = ?', [inspId])
            res.json({ code: '1000', msg: '点赞成功'})
          }
        
    }catch(err){
        console.log(err)
        res.json({ code: '5000', msg: '服务器错误',data:null })
    }
})
//收藏功能
router.put('/favorite',checkToken,async(req,res)=>{
    try{
        const myId=req.user.userId
        const {inspId}=req.query
        // 查有没有收藏过
        const [exist] = await pool.query(
            'SELECT id FROM favorites WHERE user_id = ? AND inspiration_id = ?',
            [myId, inspId]
        )
        if (exist.length > 0) {
            // 已收藏 → 取消
            await pool.query('DELETE FROM favorites WHERE user_id = ? AND inspiration_id = ?', [myId, inspId])
            await pool.query('UPDATE inspirations SET favorite_count = favorite_count - 1 WHERE id = ?', [inspId])
            res.json({ code: '1000', msg: '已取消收藏'})
          } else {
            // 未收藏 → 收藏
            await pool.query('INSERT INTO favorites (user_id, inspiration_id) VALUES (?, ?)', [myId, inspId])
            await pool.query('UPDATE inspirations SET favorite_count =favorite_count + 1 WHERE id = ?', [inspId])
            res.json({ code: '1000', msg: '收藏成功'})
          }
        
    }catch(err){
        console.log(err)
        res.json({ code: '5000', msg: '服务器错误',data:null })
    }
})
//获取分类
router.get('/categories',checkToken,async (req,res)=>{
    try{
        const [rows]=await pool.query(
            'SELECT id,name FROM categories ORDER BY sort_order ASC'
        )
        res.json({code:'1000',msg:"获取成功",data:rows})
    }catch(err){
        console.log('查询分类失败',err)
        res.json({code:'5000',msg:"服务器错误",data:null})
    }
})
//创建灵感
router.post('/publish',checkToken,async(req,res)=>{
try{
    const userId=req.user.userId
    const { title, content, categoryId, price, isOriginal, coverImage,tagIds } = req.body
    // 1. 校验
    if (!title || !content || !categoryId) {
        return res.json({ code: '4001', msg: '标题、内容、分类不能为空', data: null })
      }
    // 2. 调用 AI 获取分析结果
    const aiResult = await analyzeInspiration(title, content, isOriginal);
    
    // 3. 插入灵感（不用传 id，数据库自动生成）
    const [result] = await pool.query(
        `INSERT INTO inspirations 
           (user_id, category_id, title, content, cover_image, price, is_original, status, ai_price, ai_score, ai_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [userId, categoryId, title, content, coverImage || null, price || 0, isOriginal ? 1 : 0,
            aiResult.suggested_price,    // AI 建议价格
            aiResult.originality_score,  // AI 评分
            aiResult.review              // AI 评价/理由
        ]
      )
      // 3. result.insertId 就是数据库自动生成的 id
    const inspirationId = result.insertId

    // 4. 如果有标签，插入中间表
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const values = tagIds.map(tagId => [inspirationId, tagId])
      //map 把每个 tagId 转换成一行 [inspirationId, tagId]
        //inspirationId = 12
        //tagIds = [1, 3, 5]

        //values = tagIds.map(tagId => [12, tagId])
        // [
        //   [12, 1],
        //   [12, 3],
        //   [12, 5]
        // ]

        // 不用，太慢
        //for (const tagId of tagIds) {
            //await pool.query('INSERT INTO inspiration_tags VALUES (?, ?)', [inspirationId, tagId])
        //}

      await pool.query(
        'INSERT INTO inspiration_tags (inspiration_id, tag_id) VALUES ?',
        [values]
      )
    }
    //await connection.commit()   可改成提交一次事务，如果插入中途失败，把之前插入的删掉，保持数据一致性
    res.json({code:'1000',msg:'发布成功',data:{ id: inspirationId }})
}catch (err) {
    console.error('发布失败：', err)
    res.json({ code: '5000', msg: '服务器错误', data: null })
  }
})
//获取全部标签
router.get('/tags',checkToken,async(req,res)=>{
    try {
        const [rows] = await pool.query('SELECT id, name FROM tags ORDER BY id ASC')
        res.json({ code: '1000', msg: '获取成功', data: rows })
      } catch (err) {
        console.error(err)
        res.json({ code: '5000', msg: '服务器错误', data: null })
      }
})
//获取我的收藏
router.get('/favorites',checkToken,async(req,res)=>{
    try{
        if(req.user.role!==0){return res.json({code:'4001',msg:'角色错误',data:null})}
        const myId=req.user.userId
        const [rows]=await pool.query(
            `SELECT f.inspiration_id,i.title,u.username,i.is_sold,i.cover_image
            FROM favorites f
            LEFT JOIN inspirations i ON i.id=f.inspiration_id
            LEFT JOIN users u ON f.user_id=u.id
            WHERE f.user_id=?`,[myId])
        res.json({code:'1000',msg:'获得成功',data:rows})
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//管理端获取所有用户
router.get('/admin/users',checkToken,async(req,res)=>{
    try{
        if(req.user.role!==1){return res.json({code:'4001',msg:'不是管理员',data:null})}
        const [rows]=await pool.query(
            `SELECT id,username,nickname,email,avatar,bio,balance,status,created_at
            FROM users
            WHERE role=0`
        )
        res.json({code:'1000',msg:'获取成功',data:rows})
    }catch(err){
        console.log(err)
        res.json({code:'5000',msg:'服务器错误',data:null})
    }
})
//管理端操作用户
router.put('/admin/user/:id',checkToken,async(req,res)=>{
try {
    const id=req.params.id
    if (req.user.role !== 1) {
        return res.json({ code: '4003', msg: '需要管理员身份', data: null })
      }
    const { caozuo,newPassword } =req.body
    //查用户是否存在
    const [rows] = await pool.query(
        'SELECT id, username FROM users WHERE id = ?',
        [id]
      )
      if (rows.length === 0) {
        return res.json({ code: '4004', msg: '用户不存在', data: null })
      }
    // 按操作类型执行
    if (caozuo === 0) {
        // 封禁
        await pool.query('UPDATE users SET status = 0 WHERE id = ?', [id])
        return res.json({ code: '1000', msg: '已封禁', data: null })
    }
  
    if (caozuo === 1) {
     // 解封
        await pool.query('UPDATE users SET status = 1 WHERE id = ?', [id])
        return res.json({ code: '1000', msg: '已解封', data: null })
    }
  
    if (caozuo === 2) {
     //  重置密码
     if (!newPassword || newPassword.length < 6) {
      return res.json({ code: '4001', msg: '新密码至少 6 位', data: null })
        }  
    const passwordHash=await bcrypt.hash(newPassword,10)
    await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, id]
      )
      return res.json({ code: '1000', msg: '密码已重置', data: null })
    }
    //  未识别的操作
    return res.json({ code: '4001', msg: '未知操作', data: null })

}catch(err){
    console.error('操作用户失败：', err)
    res.json({ code: '5000', msg: '服务器错误', data: null })
} 
})
module.exports = router