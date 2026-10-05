const jwt=require('jsonwebtoken')
const {secret}=require('../../config/config')
module.exports=(req,res,next)=>{
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.json({ code: '2003', msg: 'token缺失', data: null })
  }
  // "Bearer xxx" → 按空格分割 → ['Bearer', 'xxx']
  const token = authHeader.split(' ')[1]
    if(!token){
        return res.json({
        code:'2003',
        msg:"token缺失",
        data:null})
    }
    jwt.verify(token,secret,(err,data)=>{
      if(err){
        return res.json({
          code:'2004',
          msg:"token校验失败",
          data:null})
        }
        req.user=data
        next()
      })
}