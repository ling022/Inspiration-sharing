const { z } = require('zod')

// 注册规则
const registerSchema = z.object({
  username: z
    .string({ required_error: '用户名不能为空' })
    .min(3, '用户名至少 3 位')
    .max(20, '用户名最多 20 位')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字、下划线'),
  password: z
    .string({ required_error: '密码不能为空' })
    .min(6, '密码至少 6 位')
    .max(50, '密码最多 50 位'),
  email: z
    .string()
    .email('邮箱格式不正确')
    .optional()
    .or(z.literal('')),
  nickname: z
    .string()
    .max(20, '昵称最多 20 位')
    .optional()
})


module.exports = {
  registerSchema
}