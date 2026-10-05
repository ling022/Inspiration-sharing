<template>
    <div class="order-page">
      <!-- 加载中 -->
      <div v-if="!order.id" class="loading">加载中...</div>
  
      <!-- 订单卡片 -->
      <div v-else class="order-card">
        <!-- 顶部标题 -->
        <div class="header">
          <button class="btn-back" @click="goBack">← 返回</button>
          <div class="icon">📋</div>
          <h2>确认订单</h2>
          <p class="sub">请核对以下信息</p>
        </div>
  
        <!-- 商品信息 -->
        <div class="order-item">
          <img
            :src="order.cover_image || 'https://picsum.photos/100/100?random=' + order.inspiration_id"
            class="item-cover"
          />
          <div class="item-info">
            <h3 class="item-title">{{ order.title }}</h3>
            <p class="item-seller" >
              <span class="seller-avatar">👤</span>
              <span v-if='is_author=order.seller_name===myname?false:true'>卖家：{{ order.seller_name || '未知' }}</span>
              <span v-else>买家：{{ order.buyer_name || '未知' }}</span>
            </p>
            <el-tag size="small" :type="order.status === 0 ? 'warning' : 'success'">
              {{ statusText(order.status) }}
            </el-tag>
          </div>
        </div>
  
        <!-- 订单号 -->
        <div class="order-no-row">
          <span class="label">订单号</span>
          <span class="value">{{ order.order_no }}</span>
        </div>
  
        <!-- 金额区 -->
        <div class="amount-section" v-if="!order.is_sold">
          <span class="amount-label">应付金额</span>
          <span class="amount-price">¥{{ order.amount }}</span>
        </div>
  
        <!-- 提示 -->
        <p class="tip" v-if="!order.is_sold">💡 支付后灵感将标记为已售出，请谨慎操作</p>
  
        <!-- 按钮组 -->
        <div class="actions">
          <el-button v-if="status===3?false:true" size="large" class="btn-cancel" @click="handleCancel(order.id)">
            取消购买
          </el-button>
          <el-button class="btn-pay" v-if="status===3?true:false" @click="handleAgain(order)">已取消，点击重新购买</el-button>
          <el-button
            v-if="!order.is_sold &&status!=3"
            type="primary"
            size="large"
            :loading="paying"
            class="btn-pay"
            @click="handlePay"
          >
            {{ paying ? '处理中...' : `立即支付 ¥${order.amount}` }}
          </el-button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import request from '@/api/request'
  import { ElMessage } from 'element-plus'
  
  const route = useRoute()
  const router = useRouter()
  const is_author=ref(false)
  const user=JSON.parse(localStorage.getItem('user'))
  const myname=user.username
  const order = ref({})
  const status=ref(false)
  //正在支付中
  const paying = ref(false)
  
  // 订单状态映射
  const statusText = (s) => ({
    0: '待付款',
    1: '已付款',
    2: '已完成',
    3: '已取消',
    4: '已退款'
  }[s] || '未知')
  

  const loadOrder = async () => {
    try {
      const res = await request.get(`/orders/${route.params.id}`)
      if (res.code === '1000') {
        order.value = res.data
        status.value=res.data.status
         console.log(res.data)
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('加载订单失败')
    }
  }
  const handleAgain=(item)=>{
    router.push(`/inspirations/${item.inspiration_id}`)
  }
  const handlePay = async () => {
    if (paying.value) return
    paying.value = true
  
    try {
      const res = await request.post(`/orders/${order.value.id}/pay`)
  
      if (res.code === '1000') {
        // 模拟支付
        router.push(`/pay/${res.data.orderNo}`)
  
        // ============ 真实支付 ============
        // 1. 微信 Native：res.data.qrcodeUrl → 前端生成二维码展示
        // 2. 支付宝电脑网站：window.location.href = res.data.payUrl
        // 3. 微信 JSAPI（公众号）：调用 wx.chooseWXPay(...)
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('发起支付失败')
    } finally {
      paying.value = false
    }
  }
  const goBack=()=>{
    router.back()
  }
  const handleCancel =async (id) => {
    try{
      const res=await request.put(`/order/${id}`)
      if(res.code==='1000'){
        ElMessage.success('取消成功')
        router.back()
      }
      else{
        ElMessage.error(res.msg)
      }
    }catch(err){
      ElMessage.error(err)
    }
  }
  
  onMounted(() => {
    loadOrder()
  })
  </script>
  
  <style scoped>
  /* 整页背景 */
  .order-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
    padding: 20px;
    box-sizing: border-box;
  }
  
  /* 加载中 */
  .loading {
    color: #fff;
    font-size: 16px;
  }
  
  /* 订单卡片 */
  .order-card {
    width: 100%;
    max-width: 560px;
    background: #fff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  }
  
  /* 顶部标题 */
  .header {
    position: relative; 
    text-align: center;
    margin-bottom: 28px;
  }
  .btn-back {
    position: absolute;
    left: 0;
    top: 0;
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    background: #fff;
    color: #606266;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    /* 不影响其他内容的居中 */
  }
  .btn-back:hover {
    color: #409eff;
    border-color: #409eff;
    background: #ecf5ff;
  }
  .header .icon {
    font-size: 40px;
    line-height: 1;
    margin-bottom: 8px;
  }
  
  .header h2 {
    font-size: 22px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 4px;
  }
  
  .header .sub {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }
  
  /* 商品信息 */
  .order-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    margin-bottom: 20px;
  }
  
  .item-cover {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: #e4e7ed;
  }
  
  .item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .item-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-seller {
    font-size: 13px;
    color: #909399;
    margin: 0 0 8px;
  }
  
  .seller-avatar {
    margin-right: 4px;
  }
  
  /* 订单号 */
  .order-no-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px dashed #ebeef5;
    margin-bottom: 16px;
    font-size: 14px;
  }
  
  .order-no-row .label {
    color: #909399;
  }
  
  .order-no-row .value {
    color: #409eff;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    word-break: break-all;
  }
  
  /* 金额区 */
  .amount-section {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 16px 0;
    margin-bottom: 8px;
  }
  
  .amount-label {
    font-size: 14px;
    color: #606266;
  }
  
  .amount-price {
    font-size: 28px;
    font-weight: 700;
    color: #f56c6c;
  }
  
  /* 提示 */
  .tip {
    font-size: 12px;
    color: #e6a23c;
    background: #fdf6ec;
    padding: 8px 12px;
    border-radius: 6px;
    margin: 0 0 24px;
    line-height: 1.5;
  }
  
  /* 按钮组 */
  .actions {
    display: flex;
    gap: 12px;
  }
  
  .btn-cancel {
    flex: 1;
    height: 48px;
    color: #606266;
    border-color: #dcdfe6;
    background: #fff;
  }
  
  .btn-cancel:hover {
    color: #409eff;
    border-color: #409eff;
    background: #ecf5ff;
  }
  
  .btn-pay {
    flex: 2;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 1px;
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    border: none;
    transition: all 0.2s;
  }
  
  .btn-pay:hover:not(:disabled) {
    opacity: 0.92;
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.35);
    transform: translateY(-1px);
  }
  
  .btn-pay:active {
    transform: scale(0.98);
  }
  
  /* 响应式 */
  @media (max-width: 640px) {
    .order-card {
      padding: 24px 20px;
    }
    .amount-price {
      font-size: 24px;
    }
    .actions {
      flex-direction: column;
    }
    .btn-cancel,
    .btn-pay {
      flex: 1;
    }
  }
  </style>