<template>
    <div class="admin-wallet-page">
      <div class="page-header">
        <h1>提现审核</h1>
        <p class="subtitle">共 {{ wallet.length }} 条待审核</p>
      </div>
  
      <!-- 空状态 -->
      <div v-if="wallet.length === 0" class="empty">
        <div class="empty-icon">💰</div>
        <p>暂无待审核的提现申请</p>
      </div>
  
      <!-- 提现列表 -->
      <div v-else class="withdraw-list">
        <div v-for="item in wallet" :key="item.id" class="withdraw-item">
          <!-- 头部：用户名 + 金额 -->
          <div class="card-header">
            <div class="user-info">
              <el-avatar :size="40" class="avatar">
                {{ (item.username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="user-detail">
                <p class="username">{{ item.username }}</p>
                <p class="user-balance">当前余额：¥{{ formatBalance(item.balance) }}</p>
              </div>
            </div>
            <div class="amount-box">
              <p class="amount-label">提现金额</p>
              <p class="amount">¥{{ formatBalance(item.amount) }}</p>
            </div>
          </div>
  
          <!-- 详情区 -->
          <div class="card-body">
            <div class="info-row">
              <span class="label">收款账号</span>
              <span class="value">{{ item.account }}</span>
            </div>
            <div class="info-row">
              <span class="label">申请时间</span>
              <span class="value">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
  
          <!-- 操作按钮 -->
          <div class="card-actions">
            <el-button
              type="danger"
              plain
              @click="handleReject(item.id)"
            >
              拒绝
            </el-button>
            <el-button
              type="success"
              :loading="submitting"
              @click="handleAgree(item.id)"
            >
              通过
            </el-button>
          </div>
        </div>
      </div>
  
      <!-- 拒绝理由弹窗 -->
      <el-dialog
        v-model="rejectDialogVisible"
        title="拒绝理由"
        width="480px"
        :close-on-click-modal="false"
      >
        <el-input
          v-model="rejectReason"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请填写拒绝理由，将展示给用户..."
        />
        <template #footer>
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" :loading="submitting" @click="confirmReject">
            确认拒绝
          </el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import request from '@/api/request'
  import dayjs from 'dayjs'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  const wallet = ref([])
  const rejectDialogVisible = ref(false)
  const currentId = ref(null)
  const rejectReason = ref('')
  const submitting = ref(false)
  
  const formatBalance = (v) => v != null ? Number(v).toFixed(2) : '0.00'
  const formatTime = (s) => s ? dayjs(s).format('YYYY-MM-DD HH:mm') : ''
  
  // 同意
  const handleAgree = async (id) => {
    try {
      await ElMessageBox.confirm('确定通过这条提现申请吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定通过',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
  
    submitting.value = true
    try {
      const res = await request.put(`/admin/wallet/${id}`, { status: 1 })
      if (res.code === '1000') {
        ElMessage.success('已通过审核')
        loadWallet()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  }
  
  // 打开拒绝弹窗
  const handleReject = (id) => {
    currentId.value = id
    rejectReason.value = ''
    rejectDialogVisible.value = true
  }
  
  // 确认拒绝
  const confirmReject = async () => {
    if (!rejectReason.value.trim()) {
      ElMessage.warning('请填写拒绝理由')
      return
    }
  
    submitting.value = true
    try {
      const res = await request.put(`/admin/wallet/${currentId.value}`, {
        status: 2,
        rejectReason: rejectReason.value.trim()
      })
      if (res.code === '1000') {
        ElMessage.success('已拒绝')
        rejectDialogVisible.value = false
        loadWallet()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  }
  
  // 加载列表
  const loadWallet = async () => {
    try {
      const res = await request.get('/admin/wallet')
      if (res.code === '1000') {
        wallet.value = res.data
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('加载失败')
    }
  }
  
  onMounted(() => loadWallet())
  </script>
  
  <style scoped>
  .admin-wallet-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px 20px 60px;
  }
  
  /* 顶部标题 */
  .page-header {
    margin-bottom: 24px;
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
  
  /* 空状态 */
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
  
  /* 提现列表 */
  .withdraw-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  /* 卡片 */
  .withdraw-item {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s;
  }
  
  .withdraw-item:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
  
  /* 卡片头部 */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f2f5;
    margin-bottom: 16px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .avatar {
    background: #409eff;
    color: #fff;
    font-weight: 600;
  }
  
  .user-detail .username {
    font-size: 16px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 4px;
  }
  
  .user-detail .user-balance {
    font-size: 12px;
    color: #909399;
    margin: 0;
  }
  
  /* 金额框 */
  .amount-box {
    text-align: right;
  }
  
  .amount-label {
    font-size: 12px;
    color: #909399;
    margin: 0 0 4px;
  }
  
  .amount {
    font-size: 24px;
    font-weight: 700;
    color: #f56c6c;
    margin: 0;
  }
  
  /* 卡片详情 */
  .card-body {
    padding: 4px 0;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
  }
  
  .info-row .label {
    color: #909399;
  }
  
  .info-row .value {
    color: #303133;
    font-weight: 500;
    word-break: break-all;
    text-align: right;
    max-width: 70%;
  }
  
  /* 卡片操作 */
  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #f0f2f5;
    margin-top: 16px;
  }
  
  .card-actions .el-button {
    min-width: 88px;
  }
  
  /* 响应式 */
  @media (max-width: 640px) {
    .withdraw-item {
      padding: 16px;
    }
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .amount-box {
      text-align: left;
      width: 100%;
    }
    .card-actions {
      flex-direction: column-reverse;
    }
    .card-actions .el-button {
      width: 100%;
    }
  }
  </style>