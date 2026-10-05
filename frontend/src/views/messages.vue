<template>

    <div class="messages">
        <div class="header">
          <el-button :icon="ArrowLeft"  class="btn-back" @click="goBack">返回</el-button>
          <el-avatar :size="44" :src="otherUser?.avatar">
          </el-avatar>
          <div class="user-info">
            <p class="name">{{ otherUser?.nickName || '加载中...' }}</p>
          </div>
        </div>
         <!-- 消息列表 -->
        <div class="chat-body" ref="chatBodyRef">
          <div v-if="list.length === 0" class="empty">暂无消息</div>
          <div v-else class="chat-list">
              <div
                  v-for="m in list"
                  :key="m.id"
                  class="msg-item"
                  :class="{ mine: m.isMine }"
              >
                  <span class="content">{{ m.content }}</span>
                  <span class="time">{{formatTime(m.createdAt) }}</span>
            </div>
          </div>
        </div>
        <!--输入框-->
        <div class="footer">
          <el-input
            v-model="submit"
            placeholder="输入消息..."
            @keyup.enter="handleSubmit"
          />
          <el-button type="primary" @click="handleSubmit">发送</el-button>  
        </div>
    </div>
  </template>
  
<script setup>
import { ref,onMounted,onUnmounted,nextTick } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue' 
import dayjs from 'dayjs'
import { emitter } from '@/api/eventBus';
import { getSocket, connectSocket } from '@/api/socket'
import router from '@/router';

  const formatTime = (s) => s ? dayjs(s).format('MM-DD HH:mm') : ''
  const route = useRoute()
  const list=ref([])
  const otherUser=ref({})
  const submit=ref('')
  //消息容器的dom，用于实现查看最新的（也就是最底部）的消息
  const chatBodyRef=ref(null)
  const handleSubmit=async()=>{
    try{
      const res=await request.post('/messages',{},{params:{
        to:route.query.to,
        inspId:route.query.inspirationId,
        message:submit.value
      }})
      if(res.code==='1000'){
        ElMessage.success('发送成功')
        submit.value=''
        loadMessages()  
      }else{
        ElMessage.error(res.msg)
      }
    }catch(err){
      console.log(err)
      ElMessage.error(err)
    }
  }
  const onNewMessage = () => {
    loadMessages()   // 重新加载（简单版）
  }
  //滚到最新消息处
  const scrollToBottom=async()=>{
    await nextTick()//等dom更新完
    if(chatBodyRef.value){
      chatBodyRef.value.scrollTop=chatBodyRef.value.scrollHeight
    }
  }
  const loadMessages=async()=>{
    try{
        const to=route.query.to
        const inspId=route.query.inspirationId
        console.log(to)
        //获取数据并已读消息
        const res=await request.get('/messages',{params:{to:to||'',inspId:inspId}})
        
        //await request.put('/messages',{params:{to:to||'',inspId:inspId}})
        if(res.code==='1000'){
            list.value=res.data.list
            otherUser.value=res.data.otherUser||{}
            
            //加载完滚到底部
            await scrollToBottom()
        }else {
      ElMessage.error(res.msg)
    }
    //轻量化事件
    emitter.emit('unread-changed')
    }catch(err){
      console.error('加载私信失败：', err) 
        ElMessage.error('私信失败')
    }
  }
  const goBack=()=>{
    router.back()
  }
  onMounted(() => {loadMessages()
    //websocket
    const socket = getSocket() || connectSocket()
    if (socket) {
      socket.off('new-message', onNewMessage)
      socket.on('new-message', onNewMessage)
    }
  })
  onUnmounted(() => {
    const socket = getSocket()
    if (socket) socket.off('new-message', onNewMessage)
})
</script>
<style scoped>
.messages {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 20px;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 顶部 */
.header {
  flex-shrink: 0; 
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.btn-back {
  padding: 10px 20px;
  height: 40px;
  font-size: 14px;
  flex-shrink: 0;
  margin-right: 8px;
}
.user-info .name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 4px;
}

.user-info .sub {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

/* 消息区 */
.chat-body {
  flex: 1;                      /* 自动填满剩余空间 */
  min-height: 0;                /* 允许滚动 */
  overflow-y: auto;             /* 超出滚动 */
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  min-height: 0px;
}

.msg-item {
  background: #f5f7fa;
  padding: 10px 14px;
  border-radius: 12px;
  margin: 8px 0;
  max-width: 70%;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  display: flex;                   /* ✅ 改成 flex 竖排 */
  flex-direction: column;
  gap: 4px;
}
.time {
  font-size: 11px;
  color: #909399;      /* 灰色 */
  margin-top: 4px;
}

/* 我发的消息（蓝底），时间要改成浅色 */
.msg-item.mine .time {
  color: rgba(255, 255, 255, 0.75);
}
.msg-item.mine {
  background: #409eff;
  color: #fff;
  margin-left: auto;
}

.empty {
  text-align: center;
  color: #909399;
  padding: 60px 0;
}
.footer {
  flex-shrink: 0;                  /* ✅ 不被压缩 */
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>