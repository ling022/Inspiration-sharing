<template>
    <div class="conversations">
      <h1>消息中心</h1>
      <div class="notice">
        <div class="notice-section">
            <div class="notice-header">
                <h2>通知</h2>
            </div>

            <div v-if="notifications.length === 0" class="empty-small">
                暂无通知
            </div>

            <div
                v-for="n in diplayNotifications"
                :key="n.id"
                class="notif-item"
                :class="{ unread: !n.isRead }"
                @click="handleNotice(n.id)"
            >
                <span class="dot" v-if="!n.isRead"></span>
                <div class="notif-content">
                <p>{{ n.content }}</p>
                <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                </div>
            </div>
            <div v-if="notifications.length > 5" class="expand-btn-wrap">
              <el-button
                type="text"
                size="small"
                @click="noticeExpanded = !noticeExpanded"
              >
                {{ noticeExpanded ? '收起' : `展开查看更多（${notifications.length - 5} 条）` }}
              </el-button>
            </div>
            </div>
        </div>
        <div class="contact">
            <h2>会话</h2>
            <div v-if="list.length === 0" class="empty">暂无会话</div>
            <div
                v-for="item in list"
                :key="item.inspirationId + '-' + item.otherUserId"
                class="conversation-item"
                @click="openChat(item)"
            >
                <el-avatar :size="48" :src="item.otherAvatar">
                {{ (item.otherName || '?').charAt(0) }}
                </el-avatar>
        
                <div class="info">
                <div class="row1">
                    <span class="name">{{ item.otherName }}</span>
                    <span class="time">{{ formatTime(item.lastTime) }}</span>
                </div>
                <div class="row2">
                    <span class="title">关于：{{ item.inspirationTitle }}</span>
                </div>
                <div class="row3">
                    <span class="last-msg">{{ item.lastContent }}</span>
                    <el-badge v-if="item.unreadCount > 0" :value="item.unreadCount" />
                </div>
                </div>
            </div>
        </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted,computed } from 'vue'
  import { useRouter } from 'vue-router'
  import request from '@/api/request'
  import dayjs from 'dayjs'
  import { ElMessage } from 'element-plus'
  import { connectSocket,getSocket } from '@/api/socket'
  //清量事件总线
  import { emitter } from '@/api/eventBus'
  
  const router = useRouter()
  const list = ref([])
  const notifications=ref([])
  const noticeExpanded=ref(false)
  const diplayNotifications=computed(()=>{
    return noticeExpanded.value
    ?notifications.value
    :notifications.value.slice(0,5)
  })
  const loadConversations = async () => {
    try {
      const res = await request.get('/conversations')
      if (res.code === '1000') {
        list.value = res.data
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('加载会话失败')
    }
  }
  const loadNotifications=async()=>{
    try{
        const res = await request.get('/notifications')
        if (res.code === '1000') {
        notifications.value = res.data
        }
  } catch (err) {
    console.error(err)
  }
}
  const handleNotice=async(id)=>{
    try{
        await request.put('/notification',{},{params:{id:id}})
        loadNotifications()
        emitter.emit('unread-changed')//通知navbar重新获取
    }catch(err){
        ElMessage.error(err)
    }
  }
  const openChat = (item) => {
    router.push({
      path: '/messages',
      query: {
        to: item.otherUserId,
        inspirationId: item.inspirationId
      }
    })
  }
  const onNewMessage=()=>{
    loadConversations()
  }
  const onNotification = () => {
  loadNotifications()
}
  const formatTime = (s) => s ? dayjs(s).format('MM-DD HH:mm') : ''
  
  onMounted(() => {
    loadConversations()
    loadNotifications()
    const socket=getSocket()||connectSocket()
    if(socket) {
      //先移除再注册，避免多次请求
      socket.off('new-message', onNewMessage)     
      socket.off('notification', onNotification)

      socket.on('new-message',onNewMessage)
      socket.on('notification',onNotification)
    }
    })
  onUnmounted(()=>{
    const socket=getSocket()
    if(socket) {
      socket.off('new-message',onNewMessage)
      socket.off('notification', onNotification)}
  })
  </script>
  
  <style scoped>
  .conversations {
    max-width: 700px;
    margin: 0 auto;
    padding: 24px 20px;
  }
  
  .conversation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  /* 展开按钮容器 */
.expand-btn-wrap {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  margin-top: 8px;
}

.expand-btn-wrap .el-button {
  color: #409eff;
  font-size: 13px;
}

.expand-btn-wrap .el-button:hover {
  color: #66b1ff;
}
  .conversation-item:hover {
    background: #f5f7fa;
  }
  
  .info {
    flex: 1;
    min-width: 0;
  }
  /* 通知区 */
.notice-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.notice-header h2 {
  font-size: 18px;
  margin: 0;
  color: #1f2d3d;
}

.empty-small {
  text-align: center;
  color: #c0c4cc;
  padding: 20px 0;
  font-size: 14px;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item.unread {
  background: #f0f9ff;
  margin: 0 -20px;
  padding: 12px 20px;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  margin-top: 6px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
}

.notif-content p {
  margin: 0 0 4px;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

.notif-time {
  font-size: 12px;
  color: #909399;
}

/* 会话区标题 */
.contact h2 {
  font-size: 18px;
  margin: 0 0 16px;
  color: #1f2d3d;
}
  .row1, .row2, .row3 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 4px 0;
  }
  
  .name {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
  }
  
  .time {
    font-size: 12px;
    color: #909399;
  }
  
  .title {
    font-size: 12px;
    color: #409eff;
  }
  
  .last-msg {
    font-size: 13px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .empty {
    text-align: center;
    color: #909399;
    padding: 60px 0;
  }
  </style>