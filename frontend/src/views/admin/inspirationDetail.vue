<template>
    <div class="admin-detail-page">
        <!-- 加载中 -->
        <div v-if="loading" class="center-tip">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
        </div>

        <!-- 加载失败 Element Plus 提供的"结果页"组件，用来显示操作结果 / 状态反馈。-->
        <el-result
        v-else-if="!detail"
        icon="warning"
        title="灵感不存在"
        :sub-title="errorMsg || '该灵感可能已被删除'"
        >
        
            <template #extra>
                <!--
                    把这段内容插到 <el-result> 组件里名字叫 extra 的位置。
                    <el-result> 提供了几个插槽：

                    插槽名	位置
                    icon	自定义图标
                    title	自定义标题
                    sub-title	自定义副标题
                    extra	底部操作区（放按钮）
                    -->
                <el-button type="primary" @click="goBack">返回列表</el-button>
            </template>
        </el-result>
        <!-- 详情内容 -->
        <div v-else class="detail-card">
        <!-- 顶部操作栏 -->
        <div class="top-bar">
            <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>

            <div class="top-actions">
            <el-button type="success" :icon="Check" @click="handleSubmit">
                同意
            </el-button>
            <el-button type="danger" :icon="Close" @click="openReject">
                拒绝
            </el-button>
            </div>
        </div>
        <!-- AI 分析卡片 -->
      <el-card class="ai-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><MagicStick /></el-icon>
            <span>AI 分析建议</span>
          </div>
        </template>

        <el-descriptions :column="2" border>
            <!--"描述列表"组件，用来展示键值对形式的信息。-->
          <el-descriptions-item label="AI 建议价格">
            <span class="ai-price">¥{{ detail.aiPrice ?? '—' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="AI 原创评分">
            <el-rate
              :model-value="(detail.aiScore || 0) / 20"
              disabled
              show-score
              :score-template="`${detail.aiScore ?? 0} 分`"
            /><!--:score-template="\${detail.aiScore ?? 0} 分`"`	
            分数文本的模板（默认显示 "3.5"，自定义成 "85 分"）
            ?? 是空值合并运算符
            aiScore 是 null 或 undefined → 用 0
            aiScore 是 0 或 85 → 用原值
            -->
          </el-descriptions-item>
          <el-descriptions-item label="AI 分析理由" :span="2">
            {{ detail.aiReason || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    
        
        <!-- 正文卡片 -->
        <el-card class="main-card" shadow="never">
            <!-- 封面 -->
            <el-image
            v-if="detail.coverImage"
            :src="detail.coverImage"
            :preview-src-list="[detail.coverImage]"
            fit="cover"
            class="cover"
            />

            <!-- 标题 -->
            <h1 class="title">{{ detail.title }}</h1>

            <!-- 作者 -->
            <div class="author">
            <el-avatar :size="44" :src="detail.authorAvatar">
                {{ (detail.authorName || '?').charAt(0) }}
            </el-avatar>
            <div class="author-info">
                <p class="author-name">{{ detail.authorName }}</p>
                <p class="author-bio">{{ detail.authorBio || '这个人很懒，什么都没写' }}</p>
            </div>
            </div>

            <!-- 元信息 -->
            <div class="meta">
            <span class="price">¥{{ detail.price }}</span>

            <el-tag :type="detail.isOriginal ? 'success' : 'warning'" effect="light">
                {{ detail.isOriginal ? '原创' : '二创改编' }}
            </el-tag>

            <el-tag type="info" effect="plain">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(detail.createdAt) }}
            </el-tag>
            </div>

            <!-- 标签 -->
            <div v-if="detail.tags && detail.tags.length" class="tag-row">
            <el-tag
                v-for="t in detail.tags"
                :key="t.id"
                type="primary"
                effect="plain"
                round
            >
                # {{ t.name }}
            </el-tag>
            </div>

            <!-- 正文 -->
            <el-divider content-position="left">灵感详情</el-divider>
            <div class="content">{{ detail.content }}</div>
        </el-card>
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
import { reactive, ref ,onMounted} from 'vue';
import request from '@/api/request';
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Check, Close, MagicStick, Calendar, Loading
} from '@element-plus/icons-vue'
import { useRoute,useRouter } from 'vue-router';
import dayjs from 'dayjs';
//取当前路由信息
const route=useRoute()
//导航
const router=useRouter()
const detail=ref()
//是否加载中
const loading=ref(false)
const errorMsg=ref('')
// 拒绝弹窗
const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const loadDetail=async()=>{
    loading.value=true
try{
    const id=route.params.id
    const res=await request.get(`admin/inspirations/${id}`)
    if(res.code==='1000'){
        detail.value=res.data
    }else{
        errorMsg.value=res.msg
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
    router.back()
}
const handleSubmit=async()=>{
    try {
        await ElMessageBox.confirm('确定通过这条灵感吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定通过',
        cancelButtonText: '取消'
        })
  } catch {
    return   // 用户取消
  }
    try{
        const id=route.params.id
        const res=await request.put(`/admin/inspirations/${id}`,{
            status: 1
        })
        if(res.code==='1000'){
            ElMessage.success('已通过审核')
            router.push('/admin/inspirations')
        }else {
            ElMessage.error(res.msg)
    }
    }catch(err){
        console.error(err)
        ElMessage.error('操作失败')
    }
}
const openReject=()=>{
    rejectReason.value = ''
    rejectDialogVisible.value = true
}
const confirmReject=async()=>{
    
    if (!rejectReason.value.trim()) {
        ElMessage.warning('请填写拒绝理由')
        return
    }
    try {
        const id=route.params.id
        const res = await request.put(`/admin/inspirations/${id}`, {
            status: 2,
            rejectReason: rejectReason.value
        })
        if (res.code === '1000') {
            ElMessage.success('已拒绝')
            rejectDialogVisible.value = false
            router.push('/admin/inspirations')
        } else {
            ElMessage.error(res.msg)
        }
    } catch (err) {
        console.error(err)
        ElMessage.error('操作失败')
    }
}
//格式化时间
const formatDate = (str) => {
  if (!str) return ''
  return dayjs(str).format("YYYY-MM-DD")
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