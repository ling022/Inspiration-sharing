<template>
  <div class="pay-page">
    <div class="pay-card">
      <!-- 顶部图标 -->
      <div class="pay-icon">💳</div>

      <!-- 标题 -->
      <h2 class="pay-title">模拟支付</h2>
      <p class="pay-tip">这是模拟支付页，用于学习项目演示</p>

      <!-- 订单信息 -->
      <div class="pay-info">
        <div class="info-row">
          <span class="label">订单号</span>
          <span class="value order-no">{{ orderNo }}</span>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="pay-actions">
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="btn-confirm"
          @click="handleConfirm"
        >
          {{ loading ? '处理中...' : '模拟支付成功' }}
        </el-button>

        <el-button size="large" class="btn-cancel" @click="handleCancel">
          取消支付
        </el-button>
      </div>

      <!-- 底部提示 -->
      <p class="bottom-tip">
        ⚠️ 真实项目中，这里会显示微信/支付宝的支付二维码
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const orderNo = ref(route.params.orderNo)
const loading = ref(false)

const handleConfirm = async () => {
  if (loading.value) return
  loading.value = true

  try {
    const res = await request.post('/orders/mock-pay', { orderNo: orderNo.value })
    if (res.code === '1000') {
      ElMessage.success('支付成功')
      router.push('/orders')
    } else {
      ElMessage.error(res.msg)
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('支付失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
/* 整页背景 */
.pay-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  padding: 20px;
  box-sizing: border-box;
}

/* 卡片 */
.pay-card {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
}

/* 顶部图标 */
.pay-icon {
  font-size: 60px;
  line-height: 1;
  margin-bottom: 12px;
}

/* 标题 */
.pay-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 8px;
}

.pay-tip {
  font-size: 13px;
  color: #909399;
  margin: 0 0 28px;
}

/* 订单信息 */
.pay-info {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 28px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.info-row .label {
  color: #909399;
}

.info-row .value {
  color: #303133;
  font-weight: 500;
}

.info-row .order-no {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #409eff;
  word-break: break-all;
  max-width: 280px;
  text-align: right;
}

/* 按钮组 */
.pay-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-confirm {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: none;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.35);
  transform: translateY(-1px);
}

.btn-confirm:active {
  transform: scale(0.98);
}

.btn-cancel {
  width: 100%;
  height: 44px;
  color: #606266;
  border-color: #dcdfe6;
  background: #fff;
}

.btn-cancel:hover {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
}

/* 底部提示 */
.bottom-tip {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
  line-height: 1.6;
}
</style>