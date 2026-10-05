<template>
    <div class="favorite-page">
      <!-- 顶部标题 -->
      <div class="page-header">
        <h1>我的收藏</h1>
        <p class="subtitle">共 {{ favorites.length }} 条</p>
      </div>
  
      <!-- 加载中 -->
      <div v-if="loading" class="loading">加载中...</div>
  
      <!-- 空状态 -->
      <div v-else-if="favorites.length === 0" class="empty">
        <div class="empty-icon">⭐</div>
        <p>还没有收藏任何灵感</p>
        <el-button type="primary" @click="router.push('/')">去首页看看</el-button>
      </div>
  
      <!-- 收藏列表 -->
      <div v-else class="card-grid">
        <div
          v-for="item in favorites"
          :key="item.inspiration_id"
          class="card"
          :class="{ sold: item.is_sold === 1 }"
          @click="handleClick(item)"
        >
          <!-- 已售出角标 -->
          <div v-if="item.is_sold === 1" class="badge-sold">已售出</div>
  
          <!-- 封面 -->
          <img
            :src="item.cover_image || 'https://picsum.photos/400/300?random=' + item.inspiration_id"
            class="cover"
            :alt="item.title"
          />
  
          <!-- 已售出遮罩 -->
          <div v-if="item.is_sold === 1" class="sold-mask">
            <span>已被买走啦</span>
            <span class="sub">下次再来吧～</span>
          </div>
  
          <!-- 卡片内容 -->
          <div class="card-body">
            <h3 class="title">{{ item.title }}</h3>
            <p class="author">
              <span class="avatar-inline">👤</span>
              {{ item.username }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import request from '@/api/request'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const favorites = ref([])
  const loading = ref(false)
  
  const loadFavorite = async () => {
    loading.value = true
    try {
      const res = await request.get('/favorites')
      if (res.code === '1000') {
        favorites.value = res.data
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('加载收藏失败')
    } finally {
      loading.value = false
    }
  }
  
  const handleClick = (item) => {
    if (item.is_sold === 1) return   // 已售出不跳转
    router.push(`/inspirations/${item.inspiration_id}`)
  }
  
  onMounted(() => loadFavorite())
  </script>
  
  <style scoped>
  .favorite-page {
    max-width: 1200px;
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
  
  /* 加载中 */
  .loading {
    text-align: center;
    color: #909399;
    padding: 80px 0;
    font-size: 14px;
  }
  
  /* 空状态 */
  .empty {
    text-align: center;
    padding: 80px 0;
    color: #909399;
  }
  
  .empty-icon {
    font-size: 60px;
    margin-bottom: 16px;
    opacity: 0.4;
  }
  
  .empty p {
    font-size: 14px;
    margin: 0 0 20px;
  }
  
  /* 卡片网格 */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
  
  /* 卡片 */
  .card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  /* 已售出：不可点 + 灰度 */
  .card.sold {
    cursor: not-allowed;
    filter: grayscale(0.6);
    opacity: 0.85;
  }
  
  .card.sold:hover {
    transform: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  
  /* 封面 */
  .cover {
    width: 100%;
    height: 170px;
    object-fit: cover;
    display: block;
    background: #f5f7fa;
  }
  
  /* 已售出角标 */
  .badge-sold {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 3px 10px;
    border-radius: 12px;
    background: rgba(144, 147, 153, 0.9);
    color: #fff;
    font-size: 12px;
    z-index: 2;
  }
  
  /* 已售出遮罩 */
  .sold-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 170px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    gap: 6px;
    pointer-events: none;
  }
  
  .sold-mask .sub {
    font-size: 12px;
    opacity: 0.85;
  }
  
  /* 卡片内容 */
  .card-body {
    padding: 14px 16px 16px;
  }
  
  .title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .author {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }
  
  .avatar-inline {
    margin-right: 2px;
  }
  
  /* 响应式 */
  @media (max-width: 640px) {
    .card-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .cover {
      height: 120px;
    }
    .title {
      font-size: 14px;
    }
    .author {
      font-size: 12px;
    }
  }
  </style>