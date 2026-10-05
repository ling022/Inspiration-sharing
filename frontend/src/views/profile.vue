<template>
    <div class="profile">
        <div class="content">
            <div class="buttons"  v-if="detail.user.userName">
                <el-button v-if="change" @click="handleChange">修改</el-button>
                <template v-else>
                <el-button type="success" @click="handleSave">保存</el-button>
                <el-button @click="handleCancel">取消</el-button>
                </template>
            </div>
            <div class="header">
            <!-- 头像,余额 -->
                <img :src="detail.user.avatar || 'https://picsum.photos/100/100?random=1'" class="avatar" />
                <span class="balance" @click="handleBalance">￥余额{{ detail.user.balance }}(点击提现)</span>
             </div>
             <!-- 用户名 -->
            <label>
            用户名：
            <input type="text" v-model="content.userName" :disabled="change" />
            </label>
            <!-- 昵称 -->
            <label>
            昵称：
            <input type="text" v-model="content.nickName" :disabled="change" />
            </label>

            <!-- 邮箱 -->
            <label>
            邮箱：
            <input type="text" v-model="content.email" :disabled="change" />
            </label>

            <!-- 简介 -->
            <label>
            简介：
            <input type="text" v-model="content.bio" :disabled="change" />
            </label>
        </div>
        <div class="inspiration">
          <div class="section-header">
              <h2>我的灵感（{{ detail.inspiration.length }}）</h2>
              <el-button  size="small" @click="isExpand = !isExpand">{{ isExpand ? '收起' : '展开' }}</el-button>
            </div>
              <div v-if="detail.inspiration.length === 0 " class="empty">
                还没有发布过灵感，快去发布第一条吧～
            </div>
            <div v-else-if="isExpand" class="card-grid">
                <div v-for="item in detail.inspiration"
                :key="item.id"
                class="card"
                @click="openDetail(item)">
                    <!-- 右上角角标 -->
                    <div v-if="item.isSold" class="badge badge-sold">已售出</div>
                    <div v-if="item.isSold && item.unreadCount >= 0" class="badge badge-msg">
                      💬 {{ item.unreadCount }}
                    </div>

                    <!-- 封面 -->
                    <img
                        :src="item.coverImage || 'https://picsum.photos/400/300?random=' + item.id"
                        class="card-cover"
                    />
                    <!-- 标题 -->
                    <h3 class="card-title">{{ item.title }}</h3>
                    <!-- 状态进度条 -->
                     <el-progress
                     :percentage="statusPercent(item.status)"
                     :status="statusType(item.status)"
                     :stroke-width="8"
                     :show-text="false"
                     >
                    </el-progress>
                    <p class="status-text" :class="'status'+item.status">
                        {{ statusText(item.status) }}
                    </p>
                     
                </div>
            </div>
        </div>
        <div class="buy-inspiration">
          <div class="section-header">
            <h2>我购买的灵感（{{ detail.buyer.length }}）</h2>
            <el-button size="small" @click="isFlod = !isFlod">{{ isFlod ? '收起' : '展开' }}</el-button>
          </div>

          <div v-if="detail.inspiration.length === 0" class="empty">
              还没有买过灵感~
          </div>
          
          <div v-else-if="isFlod" class="card-grid">
                <div v-for="item in detail.buyer"
                :key="item.orderId"
                class="card"
                @click="openBoughtDetail(item)">
                <div v-if="item.unreadCount > 0" class="badge badge-msg">
                      💬 {{ item.unreadCount }}
                    </div>
                <!-- 封面 -->
                    <img
                        :src="item.coverImage || 'https://picsum.photos/400/300?random=' + item.id"
                        class="card-cover"
                    />
                    <!-- 标题 -->
                    <h3 class="card-title">{{ item.title }}</h3>
                    <!-- 卖家 + 价格 -->
                    <div class="card-meta">
                      <span class="seller">卖家：{{ item.sellerName || '未知' }}</span>
                      <span class="price">¥{{ item.amount }}</span>
                    </div>
                    <!-- 购买时间 -->
                    <p class="card-time">购买时间：{{ formatDate(item.paidAt) }}</p>
                    
              </div>
          </div>
        </div>
        <el-dialog  v-model="dialogVisible" :title="current.title ||'灵感详情'" width="550px">
            <div v-if="current.id" class="detail-dialog">
                <!-- 封面 -->
                <img :src="current.coverImage" class="dialog-cover" />

                <!-- 标题 -->
                <h2 class="dialog-title">{{ current.title }}</h2>

                <!-- 状态 -->
                <div class="dialog-status" :class="'status-' + current.status">
                状态：{{ statusText(current.status) }}
                </div>

                <!-- 被拒绝时显示理由 -->
                <div v-if="current.status === 2" class="reject-box">
                <strong>拒绝理由：</strong>
                {{ current.rejectReason || '未填写' }}
                </div>

                <!-- 已通过时显示价格、点赞、收藏 -->
                <div v-if="current.status === 1" class="stats">
                <div class="stat-item">
                    <span class="label">价格</span>
                    <span class="value price">¥{{ current.price }}</span>
                </div>
                <div class="stat-item">
                    <span class="label">点赞</span>
                    <span class="value">❤ {{ current.likeCount }}</span>
                </div>
                <div class="stat-item">
                    <span class="label">收藏</span>
                    <span class="value">⭐ {{ current.favoriteCount }}</span>
                </div>
                <div class="stat-item">
                    <span class="label">浏览</span>
                    <span class="value">👁 {{ current.viewCount }}</span>
                </div>
                </div>

                <!-- 创建时间 -->
                <p class="create-time">创建时间：{{ formatDate(current.createdAt) }}</p>
            </div>
            <template #footer>
              <div class="dialog-footer">
                <el-button
                  v-if="current.isSold"
                  type="primary"
                  :icon="ChatDotRound"
                  @click="contactBuyer"
                >
                  私信买家（{{ current.buyerName }}）
                </el-button>
                <el-button @click="dialogVisible = false">关闭</el-button>
              </div>
            </template>
        </el-dialog>
        <el-dialog  v-model="dialogVisibleBuy" :title="current.title ||'灵感详情'" width="550px">
            <div v-if="current.orderId" class="detail-dialog">
                <!-- 封面 -->
                <img :src="current.coverImage" class="dialog-cover" />

                <!-- 标题 -->
                <h2 class="dialog-title">{{ current.title }}</h2>
                <!-- 卖家信息 -->
                <div class="order-info">
                  <div class="info-row">
                    <span class="label">卖家：</span>
                    <span class="value">{{ current.sellerName || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">订单号：</span>
                    <span class="value">{{ current.orderNo }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">成交金额：</span>
                    <span class="value price">¥{{ current.amount }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">订单状态：</span>
                    <el-tag :type="current.orderStatus === 2 ? 'success' : 'primary'" size="small">
                      {{ statusOrder(current.orderStatus) }}
                    </el-tag>
                  </div>
                  <div class="info-row">
                    <span class="label">支付时间：</span>
                    <span class="value">{{ formatDate(current.paidAt) }}</span>
                  </div>
                </div>
                <!-- 私信卖家按钮 -->
                <div class="dialog-actions">
                  <el-button
                    type="primary"
                    :icon="ChatDotRound"
                    @click="contactSeller"
                  >
                    私信卖家（{{ current.sellerName }}）
                  </el-button>
                </div>
            </div>
            <template #footer>
                <el-button @click="dialogVisibleBuy = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import request from '@/api/request';
import { ElMessage } from 'element-plus';
import { ChatDotRound } from '@element-plus/icons-vue'
import {ref,reactive,onMounted} from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs';
const router = useRouter()
const loading=ref(false)
//修改按钮
const change=ref(true)
const detail=reactive({
    user:{},
    inspiration:[],
    buyer:[]
})
//状态映射
const statusMap={
    0:{text:'待审核',type:'warning',percent:33},
    1:{text:'已通过',type:'success',percent:33},
    2:{text:'已拒绝',type:'exception',percent:33},
    3:{text:'已下架',type:'info',percent:100}
}
const statusOrderMap={
    1:{text:'已付款',type:'success'},
    2:{text:'已完成',type:'exception'}
}
const isFlod=ref(false)
const isExpand=ref(false)
//弹窗
const dialogVisible=ref(false)
const dialogVisibleBuy=ref(false)
const current=ref({})
//修改时的接收对象
const content=reactive({
    userName:'',
    nickName:'',
    bio:'',
    email:''
})
//与状态映射搭配使用
const statusText = (s) => statusMap[s]?.text || '未知'
const statusType = (s) => statusMap[s]?.type || 'info'
const statusPercent=(s)=>statusMap[s]?.percent||0
const statusOrder=(s)=>statusOrderMap[s]?.text||'未知'
//打开弹窗显示详情
const openDetail=(item)=>{
    current.value=item
    dialogVisible.value=true
}
const openBoughtDetail=(item)=>{
  current.value=item
  dialogVisibleBuy.value=true
}
//提现
const handleBalance=async()=>{
  try{
    router.push('/wallet')
  }catch(err){
    console.log(err)
    ElMessage.error(data.msg)
  }
}
//格式化时间
const formatDate = (s) => s ? dayjs(s).format('YYYY-MM-DD HH:mm') : ''
const loadContent=async()=>{
    try{
        loading.value=true
        const res=await request.get('/profile')
        if(res.code==='1000'){
            // console.log(res.data)
            detail.user=res.data.list[0]
            // console.log(detail.user)
            detail.inspiration=res.data.list2
            detail.buyer=res.data.list3
            content.userName=detail.user.userName,
            content.nickName=detail.user.nickName,
            content.bio=detail.user.bio||'无',
            content.email=detail.user.email||'无'
        }
    }catch(err){
        console.log(err)
        ElMessage.error('网络错误') 
    }finally{
        loading.value=false
    }
}
const handleChange=()=>{
    change.value=false
}
const handleSave=async()=>{
    try{
        const res=await request.put('/profile',{...content})
        if(res.code==='1000'){
            ElMessage.success('保存成功')
            // 更新 detail 显示
            detail.user.userName = content.userName
            detail.user.nickName = content.nickName
            detail.user.email = content.email
            detail.user.bio = content.bio
            change.value=true
        }else {
        ElMessage.error(res.msg)
        }
    } catch (err) {
        console.log(err)
        ElMessage.error('保存失败')
    }
}
// 点取消
const handleCancel = () => {
    content.userName=detail.user.userName,
    content.nickName=detail.user.nickName,
    content.bio=detail.user.bio||'无',
    content.email=detail.user.email||'无'
    change.value = true
}
//打开私信
const contactBuyer=()=>{
  ///messages?to=5
  router.push({path:'/messages',query:{to:current.value.buyerId,inspirationId: current.value.id}})
  console.log(current.value.id)
  dialogVisible.value = false
}
const contactSeller=()=>{
  router.push({
    path: '/messages',
    query: {
      to: current.value.sellerId,
      inspirationId: current.value.inspirationId
    }
  })
  dialogVisibleBuy.value = false
}
onMounted(()=>{
    loadContent()
})
</script>
<style scoped>
/* ========== 页面容器 ========== */
.profile {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* ========== 用户信息区 ========== */
.content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
  display: block;
}

label {
  display: block;
  margin: 12px 0;
  font-size: 14px;
  color: #303133;
}

label input {
  margin-left: 8px;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  width: 260px;
  outline: none;
  transition: border-color 0.2s;
}

label input:focus {
  border-color: #409eff;
}

label input:disabled {
  background: #f5f7fa;
  color: #909399;
  cursor: not-allowed;
}
.header{
  display: flex;
}
.balance{margin-left: auto;
  font-size: 40px;
  color:#909399}
.buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 12px;
}

/* ========== 分区标题 + 展开按钮 ========== */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}

.inspiration,
.buy-inspiration {
  margin-bottom: 40px;
}

/* ========== 卡片网格 ========== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* ========== 卡片（合并所有定义） ========== */
.card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
  padding-bottom: 16px;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2d3d;
  margin: 14px 16px 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片元信息：卖家 + 价格 */
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 16px 8px;
  font-size: 13px;
}

.card-meta .seller {
  color: #606266;
}

.card-meta .price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}

.card-time {
  font-size: 12px;
  color: #909399;
  margin: 0 16px;
}

.card :deep(.el-progress) {
  margin: 0 16px;
}

/* ========== 状态文字 ========== */
.status-text {
  margin: 8px 16px 0;
  font-size: 13px;
  text-align: right;
}
.status-0 { color: #e6a23c; }
.status-1 { color: #67c23a; }
.status-2 { color: #f56c6c; }
.status-3 { color: #909399; }

/* ========== 角标 ========== */
.badge {
  position: absolute;
  top: 8px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  z-index: 2;
}

/* 已售出：右上角，灰底白字 */
.badge-sold {
  right: 8px;
  background: rgba(144, 147, 153, 0.9);
}

/* 未读私信：右上角，红底白字 */
.badge-msg {
  right: 8px;
  top: 40px;
  background: #f56c6c;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ========== 空状态 ========== */
.empty {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  background: #fafafa;
  border-radius: 8px;
  font-size: 14px;
}

/* ========== 详情弹窗 ========== */
.dialog-cover {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
  display: block;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1f2d3d;
}

/* 状态标签 */
.dialog-status {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 16px;
}
.dialog-status.status-0 { background: #fdf6ec; color: #e6a23c; }
.dialog-status.status-1 { background: #f0f9eb; color: #67c23a; }
.dialog-status.status-2 { background: #fef0f0; color: #f56c6c; }
.dialog-status.status-3 { background: #f4f4f5; color: #909399; }

/* 拒绝理由 */
.reject-box {
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

/* 数据统计 */
.stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.stat-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stat-item .price {
  color: #f56c6c;
}

/* 私信按钮 */
.sold-actions {
  margin-bottom: 16px;
}

/* 订单信息展示（"我买到的"弹窗） */
.order-info {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px dashed #ebeef5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #909399;
  width: 90px;
  flex-shrink: 0;
}

.info-row .value {
  color: #303133;
  flex: 1;
}

.info-row .value.price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 创建时间 */
.create-time {
  font-size: 13px;
  color: #909399;
  margin: 12px 0 0;
}
</style>