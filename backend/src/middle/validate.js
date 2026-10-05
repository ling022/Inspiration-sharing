const {z}=require('zod')
function validate(schemas){
    return (req,res,next)=>{
        try{
            if(schemas.body){
                req.body=schemas.body.parse(req.body)
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query)
            }
            if (schemas.params) {
              req.params = schemas.params.parse(req.params)
            }
            next()
        }catch(err){
            if(err instanceof z.ZodError){
                return res.json({
                    code: '4001',
                    msg: err.errors[0].message,     // 第一条错误信息
                    data: null
                })
            }
            next(err)
        }
    }
}
module.exports = validate