<template>
    <div class="users-page">
        <!-- 顶部 -->
        <div class="page-header">
        <h2>用户管理</h2>
        <p class="subtitle">共 {{ users.length }} 位用户</p>
        </div>
         <!-- 用户表格 -->
          <!--stripe让表格的"奇数行"和"偶数行"背景色不同

        propvs 插槽：
        方式	     何时用
        prop="xxx"	直接显示字段值 —— 简单
        <template #default="{ row }">	要格式化/加样式/加按钮 —— 复杂
          
          -->
        <el-table
        :data="users"
        style="width:100%"
        stripe
        :header-cell-style="{ background: '#fafafa', color: '#303133', fontWeight: 600 }">
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column label="用户" min-width="200">
                <template #default="{row}">
                    <div class="user-cell">
                        <el-avatar :size="36" :src="row.avatar">
                            {{ (row.username||'?').charAt(0).toUpperCase() }}
                        </el-avatar>
                        <div class="user-info">
                            <p class="username">{{ row.username }}</p>
                            <p class="nickname">{{ row.nickname||'未设置昵称' }}</p>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <!-- 邮箱 -->
            <el-table-column prop="email" label="邮箱" min-width="180">
                <template #default="{ row }">
                <span>{{ row.email || '—' }}</span>
                </template>
            </el-table-column>
            <!-- 个人简介 -->
            <el-table-column prop="bio" label="个人简介" min-width="100">
                <template #default="{ row }">
                    <span>{{ row.bio || '—' }}</span>
                </template>
            </el-table-column>
            <!-- 余额 -->
            <el-table-column label="余额" width="120" align="right">
                <template #default="{ row }">
                <span class="balance">¥{{ Number(row.balance || 0).toFixed(2) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                    {{ row.status === 1 ? '正常' : '已封禁' }}
                </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="注册时间" width="180">
                <template #default="{ row }">
                {{ formatTime(row.created_at) }}
                </template>
            </el-table-column>
            <!-- 操作 -->
            <el-table-column label="操作" width="180" align="center" fixed="right">
                <template #default="{ row }">
                <!-- 封禁 / 解封 -->
                <el-button
                    v-if="row.status === 1"
                    type="danger"
                    link
                    size="small"
                    @click="handleBan(row)"
                >
                    封禁
                </el-button>
                <el-button
                    v-else
                    type="success"
                    link
                    size="small"
                    @click="handleUnban(row)"
                >
                    解封
                </el-button>

                <!-- 重置密码 -->
                <el-button
                    type="warning"
                    link
                    size="small"
                    @click="openResetPassword(row)"
                >
                    重置密码
                </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-model="showResetDialog" title="重置密码" width="420px">
            <p class="dialog-tip">
                为用户 <b>{{ currentUser.username }}</b> 设置新密码
            </p>
            <el-input
                v-model="newPassword"
                placeholder="请输入新密码（至少 6 位）"
                show-password
            />
            <el-button
                type="primary"
                link
                size="small"
                class="gen-btn"
                @click="generateRandomPassword"
            >
                随机生成密码
            </el-button>
                <template #footer>
                    <el-button @click="showResetDialog = false">取消</el-button>
                    <el-button type="primary" @click="handleResetPassword">确定重置</el-button>
                </template>
        </el-dialog>
    </div>
</template>
<script setup>
import {ref,onMounted} from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request';
const users=ref([])
const showResetDialog=ref(false)
const currentUser=ref('')
const newPassword=ref('')

const loadUser=async()=>{
    try{
        const res=await request.get('/admin/users')
        if(res.code==='1000'){
            users.value=res.data
        }else{
            ElMessage.error(res.msg)
        }
    }catch(err){
        ElMessage.error(err)
    }
}
const formatTime=(s)=>s?dayjs(s).format("YYYY-MM-DD HH:mm"):''

const handleBan=async(row)=>{
    try {
        await ElMessageBox.confirm(`确定封禁用户「${row.username}」吗？`, '警告', {
        type: 'warning',
        confirmButtonText: '确定封禁',
        cancelButtonText: '取消'
        })
    } catch {
        return
    }   
    try {
        const res = await request.put(`/admin/user/${row.id}`, { caozuo: 0 })
        if (res.code === '1000') {
        ElMessage.success('已封禁')
        loadUser()
        } else {
        ElMessage.error(res.msg)
        }
    } catch (err) {
        console.error(err)
        ElMessage.error('操作失败')
    }
}
//解封
const handleUnban=async(row)=>{
    try {
        const res = await request.put(`/admin/user/${row.id}`, { caozuo: 1 })
        if (res.code === '1000') {
        ElMessage.success('已解封')
        loadUser()
        } else {
        ElMessage.error(res.msg)
        }
    } catch (err) {
        console.error(err)
        ElMessage.error('操作失败')
    }
}
// 打开重置密码弹窗
const openResetPassword=(row)=>{
    currentUser.value=row
    newPassword.value=''
    showResetDialog.value=true
}
// 随机密码
const generateRandomPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newPassword.value = pwd
}
// 确认重置密码
const handleResetPassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }

  try {
    const res = await request.put(`/admin/user/${currentUser.value.id}`, {
      caozuo: 2,
      newPassword: newPassword.value
    })

    if (res.code === '1000') {
      ElMessage.success('密码已重置')
      showResetDialog.value = false
      ElMessageBox.alert(
        `新密码：${newPassword.value}\n\n请复制并告知用户`,
        '密码重置成功',
        { confirmButtonText: '我已复制' }
      )
    } else {
      ElMessage.error(res.msg)
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('操作失败')
  }
}
onMounted(() => loadUser())
</script>