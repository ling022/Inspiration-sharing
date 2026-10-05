<template>
    <div class="register-page">
      <div class="register-card">
        <h2 class="title">创建账号</h2>
        <p class="subtitle">加入我们，开始分享你的灵感</p>
  
        <div class="form-item">
          <input
            v-model="username"
            placeholder="请输入用户名（至少3位）"
            class="input"
          />
        </div>
  
        <div class="form-item">
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码（至少6位）"
            class="input"
          />
        </div>
  
        <div class="form-item">
          <input
            v-model="nickname"
            placeholder="请输入昵称（选填）"
            class="input"
          />
        </div>
  
        <div class="form-item">
          <input
            v-model="email"
            placeholder="请输入邮箱（选填）"
            class="input"
          />
        </div>
  
        <button class="btn-register" @click="submit">注 册</button>
  
        <p class="msg" :class="isSuccess ? 'success' : 'error'" v-if="errmsg">
          {{ errmsg }}
        </p>
  
        <div class="footer">
          <span>已有账号？</span>
          <a @click="toLogin" class="link">立即登录</a>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import request from '@/api/request'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const username = ref('')
  const nickname = ref('')
  const password = ref('')
  const email = ref('')
  const errmsg = ref('')
  
  // 根据提示内容判断是成功还是失败（"注册成功"算成功，其他算失败）
  const isSuccess = computed(() => errmsg.value === '注册成功')
  
  const submit = async () => {
    errmsg.value = ''
  
    if (!username.value || !password.value) {
      errmsg.value = '用户名或密码不能为空'
      return
    }
  
    if (username.value.length < 3 || password.value.length < 6) {
      errmsg.value = '用户名至少3位，密码至少6位'
      return
    }
  
    try {
      const res = await request.post('/register', {
        username: username.value,
        nickname: nickname.value,
        password: password.value,
        email: email.value
      })
  
      if (res.code === '4000') {
        errmsg.value = '注册成功'
        // 1.5 秒后自动跳登录页
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        errmsg.value = res.msg
      }
    } catch (err) {
      errmsg.value = '网络异常，请稍后再试'
    }
  }
  
  const toLogin = () => {
    router.push('/login')
  }
  </script>
  
  <style scoped>
  /* 整页背景（和 Login 一致） */
  .register-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
    padding: 20px;
    box-sizing: border-box;
  }
  
  /* 卡片 */
  .register-card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 16px;
    padding: 40px 36px 32px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    text-align: center;
  }
  
  /* 标题 */
  .title {
    font-size: 26px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 8px;
  }
  
  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0 0 28px;
  }
  
  /* 表单项 */
  .form-item {
    margin-bottom: 16px;
  }
  
  /* 输入框（和 Login 一致） */
  .input {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    font-size: 15px;
    color: #1f2d3d;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .input::placeholder {
    color: #c0c4cc;
  }
  
  .input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
  }
  
  /* 注册按钮（换成蓝绿渐变） */
  .btn-register {
    width: 100%;
    height: 46px;
    margin-top: 8px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 2px;
    color: #fff;
    cursor: pointer;
    background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  }
  
  .btn-register:hover {
    opacity: 0.92;
    box-shadow: 0 6px 18px rgba(103, 194, 58, 0.35);
  }
  
  .btn-register:active {
    transform: scale(0.98);
  }
  
  /* 提示信息 */
  .msg {
    font-size: 14px;
    margin: 14px 0 0;
    min-height: 20px;
  }
  
  .error {
    color: #f56c6c;
  }
  
  .success {
    color: #67c23a;
  }
  
  /* 底部链接 */
  .footer {
    margin-top: 22px;
    font-size: 14px;
    color: #606266;
  }
  
  .link {
    color: #409eff;
    margin-left: 4px;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .link:hover {
    color: #66b1ff;
    text-decoration: underline;
  }
  </style>