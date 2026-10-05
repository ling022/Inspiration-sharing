<template>
    <!-- 加载中 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 加载失败 -->
    <div v-else-if="!detail" class="error">
      <p>{{ errorMsg || '灵感不存在或已被删除' }}</p>
      <button class="btn-back" @click="goBack">返回首页</button>
    </div>
     <!-- 详情内容 -->
     <div v-else class="detail-card">
    <button class="btn-back" @click="goBack">← 返回</button>
    <!-- 封面图 -->
    <img
        v-if="detail.coverImage"
        :src="detail.coverImage"
        :alt="detail.title"
        class="cover"
      />

      <!-- 标题 -->
      <h1 class="title">{{ detail.title }}</h1>

      <!-- 作者信息 -->
      <div class="author">
        <img :src="detail.authorAvatar || '/default-avatar.png'" class="avatar" />
        <div class="author-info">
          <p class="author-name">{{ detail.authorName }}</p>
          <p class="author-bio">{{ detail.authorBio || '这个人很懒，什么都没写' }}</p>
        </div>
        <button v-if="!isAuthor" class="btn-contact" @click="contactAuthor">私信作者</button>
      </div>

      <!-- 元信息 -->
      <div class="meta">
        <span class="price">¥{{ detail.price }}</span>
        <span class="tag" :class="detail.isOriginal ? 'tag-original' : 'tag-second'">
          {{ detail.isOriginal ? '原创' : '二创改编' }}
        </span>
        <span v-if="detail.isSold" class="tag tag-sold">已售出</span>
        <span v-else class="tag tag-onsale">可购买</span>
      </div>
      <!-- 标签（单独一行） -->
      <div v-if="detail.tags.length > 0" class="tag-row">
        <span v-for="t in detail.tags" :key="t.id" class="tag-item">
          # {{ t.name }}
        </span>
      </div>

      <!-- 统计 -->
      <div class="stats">
        <span>👁 {{ detail.viewCount }} 浏览</span>
        <span>❤ {{ detail.likeCount }} 点赞</span>
        <span>⭐ {{ detail.favoriteCount }} 收藏</span>
        <span>📅 {{ formatDate(detail.createdAt) }}</span>
      </div>

      <!-- 正文 -->
      <div class="content">
        <h3>灵感详情</h3>
        <p>{{ detail.content }}</p>
      </div>


      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn-like" @click="handleLike">
          {{ isLike ? '❤ 已点赞' : '🤍 点赞' }}
        </button>
        <button class="btn-fav" @click="handleFav">
          {{ isFavorite ? '⭐ 已收藏' : '☆ 收藏' }}
        </button>
        <button
          class="btn-buy"
          :disabled="detail.isSold"
          @click="handleBuy"
        >
          {{ detail.isSold ? '已售出' : `立即购买 ¥${detail.price}` }}
        </button>
      </div>
    </div>
</template>
<script setup>
import { reactive, ref ,onMounted} from 'vue';
import request from '@/api/request';
import { useRoute,useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
//取当前路由信息
const route=useRoute()
//导航
const router=useRouter()
const detail=ref()
//获得用户id，当id与灵感的作者id相同时不显示【私信作者】
const user=JSON.parse(localStorage.getItem('user')||'{}')
const myId=user.userId
const id=route.params.id
const isAuthor=ref(false)
//获取该灵感是否被登录者喜欢
const isLike=ref(false)
//获取该灵感是否被登录者收藏
const isFavorite=ref(false)
//是否加载中
const loading=ref(false)
const errorMsg=ref('')
const loadDetail=async()=>{
    loading.value=true
try{
    const res=await request.get(`/inspirations/${id}`)
    const req=await request.get('/like',{params:{inspId:id}})
    const re=await request.get('/favorite',{params:{inspId:id}})
    if(res.code==='1000'){
        detail.value=res.data
        if(myId===res.data.userId){
          isAuthor.value=true
        }
    }else{
        errorMsg.value=res.msg
    }
    if(req.code==='1000'){
      isLike.value=req.data
    }
    if(re.code==='1000'){
      isFavorite.value=re.data
    }
}catch(err){
    console.log(err)
    errorMsg.value = '网络错误，请稍后再试'
}finally{
    loading.value=false
}
}
const goBack=()=>{
    //返回上一级
    router.push('/')
}
//格式化时间
const formatDate = (str) => {
  if (!str) return ''
  return dayjs(str).format("YYYY-MM-DD")
}
//私信
const contactAuthor=async()=>{
  try{const to=detail.value.userId
    router.push({
      path:'/messages',
      query:{
        to:to,
        inspirationId:id
      }
    })
  }catch(err){
    ElMessage.error('私信失败')
  }
}
//点赞
const handleLike=async()=>{
  try{
    const res=await request.put('/like',{},{params:{inspId:id}})
    if(res.code==='1000'){
      if(isLike.value){
        ElMessage.success('取消成功')
      }else{
        ElMessage.success('点赞成功')
      }
    }else{
      ElMessage.error('失败')
    }
    loadDetail()
}catch(err){
  ElMessage.error(err)
}
}
//收藏
const handleFav=async()=>{
  try{
    
    const res=await request.put('/favorite',{},{params:{inspId:id}})
    if(res.code==='1000'){
      if(isFavorite.value){
        ElMessage.success('取消成功')
      }else{
        ElMessage.success('收藏成功')
      }
    }else{
      ElMessage.error('失败')
    }
    loadDetail()
}catch(err){
  ElMessage.error(err)
}
}
//购买
const handleBuy=async()=>{
  if(detail.value.isSold){
    ElMessage.warning('灵感已被售出')
    return
  }
  try{
    const res=await request.post('/orders',{},{params:{inspId:id}})
    if(res.code==='1000'){
      ElMessage.success('订单已创建')
      router.push(`/order/${res.data.orderId}`)
    }else{
      ElMessage.error(res.msg)
    }
  }catch(err){
    console.error(err)
    ElMessage.error('下单失败')
  }
}
onMounted(() => {
  loadDetail()
})
</script>
<style scoped>
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag-item {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 12px;
  cursor: default;
  transition: all 0.2s;
}

.tag-item:hover {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}
.detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* 加载 / 错误 */
.loading, .error {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}
.error p {
  margin-bottom: 20px;
}

/* 返回按钮 */
.btn-back {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 16px;
  transition: all 0.2s;
}
.btn-back:hover {
  color: #409eff;
  border-color: #409eff;
}

/* 详情卡片 */
.detail-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 封面 */
.cover {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 24px;
}

/* 标题 */
.title {
  font-size: 26px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 20px;
}

/* 作者 */
.author {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-right: 12px;
  background: #f5f7fa;
}
.author-info {
  flex: 1;
}
.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #1f2d3d;
  margin: 0 0 4px;
}
.author-bio {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
.btn-contact {
  padding: 8px 16px;
  border: 1px solid #409eff;
  border-radius: 8px;
  background: transparent;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-contact:hover {
  background: #409eff;
  color: #fff;
}

/* 元信息 */
.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.price {
  font-size: 24px;
  color: #f56c6c;
  font-weight: 700;
}
.tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
}
.tag-original {
  color: #67c23a;
  background: #f0f9eb;
}
.tag-second {
  color: #e6a23c;
  background: #fdf6ec;
}
.tag-sold {
  color: #909399;
  background: #f4f4f5;
}
.tag-onsale {
  color: #409eff;
  background: #ecf5ff;
}

/* 统计 */
.stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 24px;
}

/* 正文 */
.content {
  margin-bottom: 24px;
}
.content h3 {
  font-size: 16px;
  color: #1f2d3d;
  margin: 0 0 12px;
}
.content p {
  font-size: 15px;
  color: #303133;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;   /* 保留换行 */
}

/* AI 分析 */
.ai-box {
  background: #f5f7fa;
  border-left: 4px solid #409eff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}
.ai-box h3 {
  font-size: 15px;
  color: #1f2d3d;
  margin: 0 0 12px;
}
.ai-box p {
  font-size: 14px;
  color: #606266;
  margin: 6px 0;
}
.ai-reason {
  color: #909399;
  font-size: 13px !important;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
.btn-like, .btn-fav {
  padding: 10px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-like:hover, .btn-fav:hover {
  border-color: #409eff;
  color: #409eff;
}
.btn-buy {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-buy:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.35);
}
.btn-buy:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}
</style>