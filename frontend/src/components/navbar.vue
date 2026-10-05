<template>
    <nav class="navbar">
      <!-- 左侧：Logo -->
      <router-link to="/" class="logo">
        <img src="https://picsum.photos/400/300?random=1" alt="logo" />
      </router-link>
  
      <!-- 中间：菜单（根据角色切换） -->
      <div class="menu">
        <!-- 普通用户 -->
        <template v-if="role === 0">
          <router-link to="/" class="menu-item">灵感</router-link>
          <router-link to="/favorites" class="menu-item">我的收藏</router-link>
          <router-link to="/profile" class="menu-item">个人中心</router-link>
          <router-link to="/unread-messages" class="menu-item">
            私信
            <el-badge v-if="unreadCount > 0" :value="unreadCount" class="badge" />
          </router-link>
          <router-link to="/order" class="menu-item">订单</router-link>
        </template>
  
        <!-- 管理员 -->
        <template v-else-if="role === 1">
          <router-link to="/admin/inspirations" class="menu-item">灵感待审核</router-link>
          <router-link to="/admin/wallet" class="menu-item">提现待审核</router-link>
          <router-link to="/admin/users" class="menu-item">用户管理</router-link>
          <router-link to="/admin/orders" class="menu-item">订单管理</router-link>
        </template>
  
        <!-- 未登录 -->
        <template v-else>
          <router-link to="/login" class="menu-item">登录</router-link>
          <router-link to="/register" class="menu-item">注册</router-link>
        </template>
      </div>
  
      <!-- 右侧：退出 -->
      <div class="right">
        <button v-if="isLogin" class="btn-logout" @click="handleLogout">退出</button>
      </div>
    </nav>
  </template>
  
  <script setup>
  import { useRouter,useRoute } from 'vue-router'
  import { ref,computed,onMounted,onUnmounted,watch } from 'vue'
  import request from '@/api/request'
  import { connectSocket,disconnectSocket,getSocket } from '@/api/socket'
  import { ElMessage } from 'element-plus'
  import { emitter } from '@/api/eventBus'
  const route = useRoute()
  const router=useRouter()
  //监听【私信】数字变化
  
  const user = computed(() => {
      return JSON.parse(localStorage.getItem('user') || '{}')
    })
  const role = computed(() => user.value.role)
  const isLogin = computed(() => !!localStorage.getItem('token'))

  const unreadMsgCount=ref(0)
  const unreadNoticeCount=ref(0)
  const unreadCount=ref(0)
  
  const fetchUnread=async()=>{
    try {
    const token = localStorage.getItem('token')
    if (!token) return                       // 未登录不请求

    const res = await request.get('/unread-count')
    if (res.code === '1000') {
      unreadMsgCount.value = res.data.messageCount
      unreadNoticeCount.value=res.data.notificationCount
      unreadCount.value=unreadMsgCount.value+unreadNoticeCount.value
    }
  } catch (err) {
    // 静默失败
  }
  }
  const onNewMessage = (data) => {
  console.log('收到新私信：', data)
  fetchUnread()   // 从服务器重新拉
  }

  const onNotification = (data) => {
    console.log('收到新通知', data)
    fetchUnread()   // 从服务器重新拉
  }
  //连接+监听websocket事件
  const setupSocket=()=>{
    if(!isLogin.value)return
    const socket=connectSocket()
    if(!socket) return
    //先移除再注册
    socket.off('new-message', onNewMessage)
    socket.off('notification', onNotification)
    //收私信
    //        事件名，回调
    socket.on('new-message', onNewMessage)
    //收通知
    socket.on('notification', onNotification)
}
  
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    disconnectSocket()             //断开websocket
    window.location.href = '/login'
  }
  watch(isLogin, (logged) => {
    if (logged) setupSocket()
  })

  watch(() => route.path, () => {
    if (isLogin.value) fetchUnread()
  })
  //定时器监听有无私信
  onMounted(() => {
    if (isLogin.value) {
      fetchUnread()
      setupSocket()
  }
  emitter.on('unread-changed',fetchUnread)
})
//销毁定时器
onUnmounted(() => {
  emitter.off('unread-changed', fetchUnread)   // ✅ 清理

  // NavBar 一直存在，一般不会卸载
  // 但离开时最好清理事件监听
  const socket = getSocket()       // 用 getSocket 拿实例，不要重新 connect
  if (socket) {
    socket.off('new-message',onNewMessage)
    socket.off('notification',onNotification)
  }
})
  </script>
  
  <style scoped>
  /* 导航栏容器 */
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 40px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  /* Logo */
  .logo {
    display: flex;
    align-items: center;
    text-decoration: none;
  }
  
  .logo img {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    transition: transform 0.2s;
  }
  
  .logo:hover img {
    transform: scale(1.08);
  }
  
  /* 中间菜单 */
  .menu {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  /* 菜单项 */
  .menu-item {
    position: relative;
    padding: 8px 16px;
    font-size: 15px;
    color: #303133;
    text-decoration: none;
    border-radius: 8px;
    transition: color 0.2s, background-color 0.2s;
  }
  
  .menu-item:hover {
    color: #409eff;
    background-color: #ecf5ff;
  }
  
  /* 当前激活的菜单 */
  .menu-item.router-link-active {
    color: #409eff;
    font-weight: 500;
    background-color: #ecf5ff;
  }
  
  /* 右侧 */
  .right {
    display: flex;
    align-items: center;
  }
  
  /* 退出按钮 */
  .btn-logout {
    height: 36px;
    padding: 0 18px;
    border: 1px solid #f56c6c;
    border-radius: 8px;
    background: transparent;
    color: #f56c6c;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-logout:hover {
    background: #f56c6c;
    color: #fff;
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
  }
  
  .btn-logout:active {
    transform: scale(0.97);
  }
  
  /* 响应式：小屏时缩小内边距 */
  @media (max-width: 768px) {
    .navbar {
      padding: 0 16px;
    }
    .menu-item {
      padding: 6px 10px;
      font-size: 14px;
    }
  }
  </style>