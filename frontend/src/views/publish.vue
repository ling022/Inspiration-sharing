<template>
    <div class="publish-page">
        <div class="header">
            <button class="btn-back" @click="toBack">← 返回</button>
            <h1>发布灵感</h1>
            <p class="current-user">当前登录：{{ currentUser.nickname || currentUser.username }}</p>
        </div>
        
        <!--submit.prevent监听表单提交，阻止默认刷新行为
            为什么要prevent：SPA 里表单提交默认会整页刷新，破坏 Vue 状态
        -->
        <form class="form" @submit.prevent="handlePublish">
            <!-- 标题 -->
            <div class="form-item">
                <label>标题 <span class="required">*</span></label>
                <input v-model="form.title" placeholder="请输入灵感标题" />
            </div>
            <!-- 分类 -->
            <div class="form-item">
                <label>分类 <span class="required">*</span></label>
                <select v-model="form.categoryId" class="select">
                <option value="">请选择分类</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                    {{ c.name }}
                </option>
                </select>
            </div>
            <!-- 标签 -->
            <div class="form-item">
                <label>标签（可多选）</label>
                <div class="tag-list">
                    <span
                    v-for="tag in allTags"
                    :key="tag.id"
                    class="tag-item"
                    :class="{ active :selectedTag.includes(tag.id)}"
                    @click="toggleTag(tag.id)">
                {{ tag.name }}</span>
                <p v-if="allTags.length === 0" class="no-tag">暂无标签</p>
                </div>
            </div>
            <!-- 内容 -->
            <div class="form-item">
                <label>内容 <span class="required">*</span></label>
                <textarea v-model="form.content" placeholder="详细描述你的灵感..." rows="6"></textarea>
            </div>

            <!-- 价格 -->
            <div class="form-item">
                <label>价格（元）</label>
                <input v-model.number="form.price" type="number" min="0" placeholder="0" />
            </div>

            <!-- 是否原创 -->
            <div class="form-item">
                <label>是否原创</label>
                <div class="radio-group">
                <label>
                    <input type="radio" v-model="form.isOriginal" :value="1" /> 原创
                </label>
                <label>
                    <input type="radio" v-model="form.isOriginal" :value="0" /> 二创改编
                </label>
                </div>
            </div>
            <!-- 封面图 URL（暂时用 URL 输入） -->
            <div class="form-item">
                <label>封面图 URL（选填）</label>
                <input v-model="form.coverImage" placeholder="https://..." />
            </div>
            <!-- 提交 -->
            <div class="actions">
                <button type="button" class="btn-cancel" @click="toBack">取消</button>
                <!--disabled 表单提交时，被禁用控件的值不会被提交-->
                <button type="submit" class="btn-submit" :disabled="submitting">
                {{ submitting ? '提交中...' : '提交' }}
                </button>
            </div>
            <p v-if="msg" class="msg">{{ msg }}</p>
        </form>
    </div>
</template>
<script setup>
import { ref, reactive,onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/api/request';
const router=useRouter()
//从本地读取当前用户的信息
const currentUser=JSON.parse(localStorage.getItem('user') || '{}')
const form=reactive({
    categoryId:'',
    title:'',
    content:'',
    price:'',
    isOriginal:1,
    coverImage:''    
})
const submitting=ref(false)
const msg=ref('')
//标签列表
const allTags=ref([])
const selectedTag=ref([])
//分类列表
const categories=ref([])
//获取分类
const loadingCategory=async()=>{
    try{    
        const res=await request.get('/categories')
        if(res.code==='1000'){
            categories.value=res.data
        }
    }catch(err){
        console.log(err)
    }
}
//获取标签
const loadingTags=async()=>{
    try {
    const res = await request.get('/tags')
    if (res.code === '1000') allTags.value = res.data
  } catch (err) {
    console.error('加载标签失败：', err)
  }
}
//切换标签选中状态
const toggleTag=(tagId)=>{
    const index=selectedTag.value.indexOf(tagId)
    if(index==-1){selectedTag.value.push(tagId)}// 没选中 → 选中

    //splice 会改变原数组 在任意位置删除、添加、替换数组元素。
    //start	从哪个索引开始操作（必填）
    //deleteCount	删除多少个元素（可选，不写则删到末尾）
    //item1,item2... 要插入的元素（可选）

    else{selectedTag.value.splice(index,1)}//选中->取消
}
const toBack=()=>{
    router.back()
}
const handlePublish=async()=>{
    msg.value=''
    // 前端校验
    if (!form.title.trim()) return msg.value = '标题不能为空'
    if (!form.categoryId) return msg.value = '请选择分类'
    if (!form.content.trim()) return msg.value = '内容不能为空'
    submitting.value=true
    try{
        const res =await request.post('/publish',{
            categoryId:form.categoryId,
            title:form.title,
            content:form.content,
            price:form.price ||0,
            isOriginal:form.isOriginal,
            coverImage:form.coverImage || null,
            tagIds: selectedTag.value     // 👈 把选中的标签 id 一起传
    })
        if (res.code === '1000') {
        alert('发布成功，等待审核！')
        router.push('/')
        } else {
        msg.value = res.msg
        }
    } catch (err) {
        console.error('发布失败：', err)
        msg.value = '网络错误，请稍后再试'
    } finally {
        submitting.value = false
    }
}
onMounted(() => {
  loadingCategory()
  loadingTags()
})
</script>
<style scoped>
.publish-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.header {
  margin-bottom: 24px;
}
.btn-back {
  padding: 6px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  margin-bottom: 12px;
}
.current-user {
  font-size: 13px;
  color: #909399;
}

.form {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
}
.required {
  color: #f56c6c;
}

.form-item input,
.form-item textarea,
.form-item select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

/* 标签胶囊 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-item {
  display: inline-block;
  padding: 6px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 16px;
  font-size: 13px;
  color: #606266;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.tag-item:hover {
  border-color: #409eff;
  color: #409eff;
}
.tag-item.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}
.no-tag {
  color: #c0c4cc;
  font-size: 13px;
}

/* 单选 */
.radio-group {
  display: flex;
  gap: 20px;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

/* 按钮 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}
.btn-cancel {
  padding: 10px 24px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.btn-submit {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.msg {
  color: #f56c6c;
  text-align: right;
  margin: 12px 0 0;
  font-size: 14px;
}
</style>