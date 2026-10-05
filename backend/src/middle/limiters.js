const rateLimit=require('express-rate-limit')
//全局限流，每用户每分钟60次
const userLimiter=rateLimit({
    windowMs:60*1000,
    max:60,
    keyGenerator:(req)=>{
        //已登录用户按userId,未登录按ip
        return req.user?.userId?.toString()||req.ip
    },
    message: {
        code: '4290',
        msg: '操作过于频繁'
      }
})
//全局限流，每ip每分钟100次
const globalLimiter=rateLimit({
    windowMs:60*1000,        //时间窗口：1分钟
    max:100,                 //最多100次
    message:{
        code:'4290',
        msg:'请求过于频繁',
        data:null
    },
    standarHeaders:true,       //返回标准限流头（RateLimit-*)
    legacyHeaders:false        //禁用旧的X-RateLimit-*头   
})
//登录限流,每ip15分钟5次
const loginLimiter=rateLimit({
    windoeMs:15*60*1000,
    max:5,
    message: {
        code: '4290',
        msg: '登录尝试过于频繁，请 15 分钟后再试',
        data: null
    },
    //只统计失败请求（可选）
    skipSuccussfulRequests:true
})
//注册限流。每ip每小时3次
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
      code: '4290',
      msg: '注册过于频繁，请稍后再试',
      data: null
    }
})
//发送验证码：每 IP 每分钟 1 次
const smsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    message: {
      code: '4290',
      msg: '发送过于频繁，请 1 分钟后再试',
      data: null
    }
})
//发布灵感：每 IP 每小时 10 次
const publishLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
      code: '4290',
      msg: '发布过于频繁，请稍后再试',
      data: null
    }
})
module.exports={
    globalLimiter,
    loginLimiter,
    registerLimiter,
    smsLimiter,
    publishLimiter
}