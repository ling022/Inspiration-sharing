<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="title">欢迎回来</h2>
      <p class="subtitle">登录你的账号，继续分享灵感</p>

      <div class="form-item">
        <input
          v-model="form.username"
          placeholder="请输入用户名"
          class="input"
        />
      </div>

      <div class="form-item">
        <input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          class="input"
          @keyup.enter="handleLogin"
        />
      </div>

      <button class="btn-login" @click="handleLogin">登 录</button>

      <p class="error" v-if="errorMsg">{{ errorMsg }}</p>
      <p class="success" v-if="successMsg">{{ successMsg }}</p>

      <div class="footer">
        <span>还没有账号？</span>
        <a @click="toRegister" class="link">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import request from '../api/request';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = reactive({
  username: '',
  password: ''
});

const errorMsg = ref('');
const successMsg = ref('');

const handleLogin = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  if (!form.username || !form.password) {
    errorMsg.value = '请填写用户名和密码';
    return;
  }

  try {
    const res = await request.post('/login', {
      username: form.username,
      password: form.password
    });

    if (res.code === '1000') {
      successMsg.value = '登录成功！欢迎 ' + res.data.nickname;

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({
        userId: res.data.userId,
        username: res.data.username,
        nickname: res.data.nickname,
        role: res.data.role
      }));
      //跳转到首页
       //不用route.push('/')是因为组件不会重建，导致navbar.vue里的onMounted 不会重新跑， role / isLogin 都还是"未登录"状态
      window.location.href = '/'
    } else {
      errorMsg.value = res.msg;
    }
  } catch (err) {
    errorMsg.value = '网络错误，请稍后再试';
  }
};

const toRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
/* 整页背景 */
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  padding: 20px;
  box-sizing: border-box;
}

/* 卡片 */
.login-card {
  width: 100%;
  max-width: 400px;
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

/* 输入框 */
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

/* 登录按钮 */
.btn-login {
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
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.btn-login:hover {
  opacity: 0.92;
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.35);
}

.btn-login:active {
  transform: scale(0.98);
}

/* 提示信息 */
.error {
  color: #f56c6c;
  font-size: 14px;
  margin: 14px 0 0;
  min-height: 20px;
}

.success {
  color: #67c23a;
  font-size: 14px;
  margin: 14px 0 0;
  min-height: 20px;
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