<template>
  <div class="orders-page">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h1>我的订单</h1>
      <p class="subtitle">共 {{ list.length }} 条订单</p>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="role" @tab-change="loadOrders" class="tabs">
      <el-tab-pane label="我买到的" name="buyer" />
      <el-tab-pane label="我卖出的" name="seller" />
    </el-tabs>

    <!-- 加载中 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 空状态 -->
    <div v-else-if="list.length === 0" class="empty">
      <div class="empty-icon">📦</div>
      <p>{{ role === 'buyer' ? '还没有购买过灵感' : '还没有卖出过灵感' }}</p>
    </div>

    <!-- 订单列表 -->
    <div v-else class="order-list">
      <div
        v-for="o in list"
        :key="o.id"
        class="order-item"
        @click="goDetail(o)"
      >
        <!-- 封面 -->
        <img
          :src="o.cover_image || 'https://picsum.photos/100/100?random=' + o.inspiration_id"
          class="order-cover"
        />

        <!-- 信息 -->
        <div class="order-info">
          <h3 class="order-title">{{ o.title }}</h3>

          <p class="order-meta">
            <span class="role-label">{{ role === 'buyer' ? '卖家' : '买家' }}：</span>
            <span class="other-name">{{ o.other_name || '未知' }}</span>
          </p>

          <p class="order-meta">
            <span class="time">{{ formatTime(o.created_at) }}</span>
          </p>
        </div>

        <!-- 右侧：金额 + 状态 -->
        <div class="order-right">
          <p class="amount">¥{{ o.amount }}</p>
          <el-tag :type="statusType(o.status)" size="small">
            {{ statusText(o.status) }}
          </el-tag>

          <!-- 待付款的订单显示"去支付"按钮（仅买家） -->
          <el-button
            v-if="role === 'buyer' && o.status === 0"
            type="primary"
            size="small"
            class="btn-pay"
            @click.stop="goPay(o)"
          >
            去支付
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const router = useRouter()

const role = ref('buyer')
const list = ref([])
const loading = ref(false)

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await request.get('/orders', { params: { role: role.value } })
    if (res.code === '1000') {
      list.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 状态映射
const statusText = (s) => ({
  0: '待付款',
  1: '已付款',
  2: '已完成',
  3: '已取消',
  4: '已退款'
}[s] || '未知')

const statusType = (s) => ({
  0: 'warning',
  1: 'success',
  2: 'success',
  3: 'info',
  4: 'danger'
}[s] || 'info')

const formatTime = (s) => s ? dayjs(s).format('YYYY-MM-DD HH:mm') : ''

// 点订单 → 去订单详情
const goDetail = (o) => {
  router.push(`/order/${o.id}`)
}

// 去支付
const goPay = (o) => {
  router.push(`/order/${o.id}`)   // 跳订单详情页，用户再点"确认支付"
}

onMounted(() => loadOrders())
</script>

<style scoped>
.orders-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* 顶部标题 */
.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 4px;
}

.page-header .subtitle {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

/* Tab */
.tabs {
  margin-bottom: 20px;
}

.tabs :deep(.el-tabs__item) {
  font-size: 15px;
}

/* 加载 / 空状态 */
.loading {
  text-align: center;
  color: #909399;
  padding: 60px 0;
}

.empty {
  text-align: center;
  padding: 80px 0;
  color: #909399;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty p {
  font-size: 14px;
  margin: 0;
}

/* 订单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 订单项 */
.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.order-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 封面 */
.order-cover {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f5f7fa;
}

/* 中间信息 */
.order-info {
  flex: 1;
  min-width: 0;
}

.order-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-meta {
  font-size: 13px;
  color: #909399;
  margin: 0 0 4px;
}

.role-label {
  color: #c0c4cc;
}

.other-name {
  color: #409eff;
  font-weight: 500;
}

.time {
  color: #c0c4cc;
}

/* 右侧 */
.order-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
  margin: 0;
}

.btn-pay {
  margin-top: 4px;
}

/* 响应式 */
@media (max-width: 640px) {
  .order-item {
    padding: 12px;
    gap: 12px;
  }
  .order-cover {
    width: 60px;
    height: 60px;
  }
  .order-title {
    font-size: 14px;
  }
  .amount {
    font-size: 16px;
  }
}
</style>