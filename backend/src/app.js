const express = require('express')
const app = express()
//导入cors，可以前后端跨域的包
const cors = require('cors')

const http=require('http')
const { Server }= require('socket.io')
const jwt=require('jsonwebtoken')
require('dotenv').config()
//导入限流
const {globalLimiter} =require('./middle/limiters')
//导入router(/auth)模块
const authRouter=require('./routes/auth')
//导入router(/list)模块
const listRouter=require('./routes/list')
//导入router(/profile)模块
const profileRouter=require('./routes/profile')
//导入router(/order)模块
const orderRouter=require('./routes/order')
//导入router(/wallet)模块
const walletRouter=require('./routes/wallet')
//使用cors跨域
app.use(cors())
app.use(express.json())
//所有api都限流
app.use('/api',globalLimiter)
//使用authRouter模块
app.use('/api',authRouter)
//使用listRouter模块
app.use('/api',listRouter)
//使用profile模块
app.use('/api',profileRouter)
//使用order模块
app.use('/api',orderRouter)
//使用walle模块
app.use('/api',walletRouter)

//http.createServer包裹app
const server=http.createServer(app)
//创建Socket.Io实例
const io=new Server(server,{
  cors:{
    origin:'http://localhost:5173',
    credentials:true
  }
})
//鉴权中间件，连接时验证token
io.use((socket,next)=>{
  const token=socket.handshake.auth.token
  if(!token) return next(new Error('未登录'))
  try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET)
    socket.userId=decoded.userId//// 把 userId 挂到 socket 上
    next()
  }catch(err){
    next(new Error('token无效'))
  }
})
//连接建立后
io.on('connection',(socket)=>{
  const userId=socket.userId
  console.log( `用户${userId}上线(socketId=${socket.id})`)

  //让这个socket加入‘以userId命名的房间’
  //之后往‘房间’里推消息，只有这个用户能收到
  socket.join(`user_${userId}`)

  socket.on('disconnect',()=>{
    console.log(`用户${userId}下线`)
  })
})
//把io挂到app上，让其他路由文件能拿到
app.set('io',io)
global.io=io
// 用 server.listen，不是 app.listen
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})