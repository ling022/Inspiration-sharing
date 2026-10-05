<template>
    <div class="wallet-page">
      <h1>我的钱包</h1>
  
      <!-- 余额卡片 -->
      <div v-if="user" class="profile">
        <p class="profile-username">{{ user.username }}</p>
        <p class="profile-balance">¥ {{ formatBalance(user.balance) }}</p>
        <el-button type="primary" @click="showWithdraw = true">申请提现</el-button>
      </div>
  
      <!-- 提现记录 -->
      <div class="account">
        <h2 class="title">提现记录</h2>
  
        <div v-if="wallet.length === 0">
          <p class="content">暂无提现记录</p>
        </div>
  
        <div v-else class="withdraw-list">
          <div v-for="item in wallet" :key="item.id" class="withdraw-item">
            <div class="row">
              <span class="label">提现金额</span>
              <span class="amount">¥ {{ formatBalance(item.amount) }}</span>
            </div>
  
            <div class="row">
              <span class="label">收款账户</span>
              <span class="value">{{ item.account }}</span>
            </div>
  
            <div class="row">
              <span class="label">状态</span>
              <el-tag :type="statusType(item.status)" size="small">
                {{ statusText(item.status) }}
              </el-tag>
            </div>
  
            <div class="row" v-if="item.status === 2">
              <span class="label">拒绝原因</span>
              <span class="value danger">{{ item.reject_reason || '未填写' }}</span>
            </div>
  
            <div class="row" v-if="item.paid_at">
              <span class="label">打款时间</span>
              <span class="value">{{ formatTime(item.paid_at) }}</span>
            </div>
  
            <div class="row">
              <span class="label">申请时间</span>
              <span class="value">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 提现弹窗（占位） -->
      <el-dialog v-model="showWithdraw" title="申请提现" width="400px">
        <el-input v-model="amount" type="number" placeholder="提现金额"/>
        <el-input v-model="account" placeholder="收款账号" />
        <template #footer>
            <el-button @click="showWithdraw = false">取消</el-button>
            <el-button type="primary" @click="handleWithdraw">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  <script setup>
  import { ref, onMounted } from 'vue'
  import request from '@/api/request'
  import { ElMessage } from 'element-plus'
  import dayjs from 'dayjs'
  
  const user = ref({})
  const wallet = ref([])
  const showWithdraw = ref(false)
  const amount=ref('')
  const account=ref('')

  const loadWallet = async () => {
    try {
      const res = await request.get('/wallet')
      if (res.code === '1000') {
        user.value = res.data.user
        wallet.value = res.data.withdrawals
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error('加载钱包失败：', err)
      ElMessage.error('加载钱包失败')
    }
  }
  
  const formatBalance = (v) => v != null ? Number(v).toFixed(2) : '0.00'
  const formatTime = (s) => s ? dayjs(s).format('YYYY-MM-DD HH:mm') : ''
  
  const statusText = (s) => ({
    0: '审核中',
    1: '已打款',
    2: '已拒绝'
  }[s] || '未知')
  
  const statusType = (s) => ({
    0: 'warning',
    1: 'success',
    2: 'danger'
  }[s] || 'info')
  
  const handleWithdraw=async()=>{
    const res=await request.post('/wallet',{amount:Number(amount.value),account:account.value})
    if (res.code === '1000') {
        ElMessage.success('提现申请已提交')
        showWithdraw.value = false
        loadWallet()
    } else {
        ElMessage.error(res.msg)
    }
  }
  onMounted(() => loadWallet())
  </script>
  <style scoped>
  .wallet-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 24px 20px 60px;
  }
  
  /* 余额卡片 */
  .profile {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    border-radius: 16px;
    padding: 32px;
    color: #fff;
    text-align: center;
    margin-bottom: 32px;
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3);
  }
  
  .profile-username {
    font-size: 14px;
    opacity: 0.9;
    margin: 0 0 12px;
  }
  
  .profile-balance {
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 20px;
  }
  
  .profile .el-button {
    background: #fff;
    color: #409eff;
    border: none;
  }
  
  /* 提现记录区 */
  .account {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  
  .title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 20px;
  }
  
  .content {
    text-align: center;
    color: #909399;
    padding: 40px 0;
  }
  
  .withdraw-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .withdraw-item {
    background: #f8fafc;
    border-radius: 10px;
    padding: 16px 20px;
  }
  
  .row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
  }
  
  .row .label { color: #909399; }
  .row .value { color: #303133; }
  .row .amount { color: #f56c6c; font-weight: 600; font-size: 16px; }
  .row .danger { color: #f56c6c; }
  </style>