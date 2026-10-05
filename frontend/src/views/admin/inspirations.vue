<template>
    <div class="home">
       
        <h1 class="page-title">灵感广场</h1>
        <!-- 灵感列表 -->
        <div class="list">
          <div
            v-for="item in list"
            :key="item.id"
            class="card"
            @click="goDetail(item.id)"
          >
            <img
              :src="item.coverImage || '/default-cover.png'"
              :alt="item.title"
              class="cover"
            />
            <div class="card-body">
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-meta">
                <span class="authorname">{{ item.authorName }}</span>
                <span class="price">¥{{ item.price }}</span>
                <span class="tag" v-if="item.isOriginal">原创</span>
                <span class="tag" v-else>二创改编</span>
              </p>
              <p class="card-time">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
        </div>
    
        <!-- 加载中 -->
        <div v-if="loading" class="loading">加载中...</div>
    
        <!-- 没有更多 -->
        <div v-if="noMore && list.length > 0" class="no-more">
          —— 已经到底啦 ——
        </div>
    
    
      </div>
    </template>
    <script setup>
    import {ref,reactive,onMounted,onUnmounted} from "vue"
    import request from "@/api/request"
    //格式化日期
    import dayjs from "dayjs"
    import { useRouter } from "vue-router"
    const router=useRouter()
    
    //数组接收接口传来得数据
    const list=ref([])
    
    //设置page,pageSize
    const page=ref(1)
    const pageSize=20
    
    //是否加载中
    const loading=ref(false)
    
    //是否加载完毕
    const noMore=ref(false)
    
    //获取灵感
    const loadMore=async()=>{
        //正在加载或者没有更多，返回
        if(loading.value||noMore.value) return
        loading.value=true
        try{
            const res=await request.get('/admin/inspirations',{
                params:{
                  page:page.value,
                  pageSize
                }
            })
            
            if(res.code==='1000'){
               const newList=res.data.list 
               //追加 ...是展开，[1,2,3]展开为三个数组元素[1],[2],[3]追加进去，而不是一个数组元素[1,2,3]
               list.value.push(...newList)
            }
            if(list.value.length>=res.data.total){
                noMore.value=true
            }else{
                page.value++
            }
        }catch(err){
            console.error('加载灵感失败：', err)
        }finally{
            loading.value=false
        }
    }
   
    //滚动监听（触底加载）
    const handleScroll=()=>{
        //已经滚下去多少
        const scrollTop=document.documentElement.scrollTop|| document.body.scrollTop
        //可视区高度（一屏能看到多少）
        const clientHeight = document.documentElement.clientHeight
        //整个页面的总高度
        const scrollHeight = document.documentElement.scrollHeight
        //scrollTop + clientHeight 当前看到的底部位置
        //scrollHeight 页面真实底部
        //到底部时 scrolTop+clientHeight=scrollHeight
        // 距离底部 100px 时触发
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadMore()
        }
    }
    // 跳转到详情页
    const goDetail = (id) => {
       router.push(`/admin/inspirations/${id}`)
    }
    // 格式化时间
    const formatDate = (str) => {
      if (!str) return ''
      //字符串转 Date 对象
      //const d = new Date(str)
      //d.getFUllYear()取年
      //String().padStart(2, '0')把数字左边补0到2位
      //return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    
      //等价
      return dayjs(str).format("YYYY-MM-DD")
    }
    onMounted(() => {
      loadMore()
      
      window.addEventListener('scroll', handleScroll)
    })
    // 组件卸载时：移除滚动监听（防内存泄漏）
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })
    </script>
    <style scoped>
    .home {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px 60px;
    }
    /* 第一行：+ 号 */
    .publish-row {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .btn-publish {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      color: #fff;
      font-size: 32px;
      font-weight: 300;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(64, 158, 255, 0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-publish:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 10px 24px rgba(64, 158, 255, 0.45);
    }
    
    .btn-publish:active {
      transform: scale(0.96);
    }
    
    /* 第二行：搜索 + 筛选 */
    .filter-row {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .search-input {
      flex: 1;
      min-width: 240px;
      height: 42px;
      padding: 0 14px;
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .search-input:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
    }
    
    .filter-select {
      height: 42px;
      padding: 0 12px;
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      font-size: 14px;
      color: #303133;
      background: #fff;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .filter-select:focus,
    .filter-select:hover {
      border-color: #409eff;
    }
    
    .btn-search {
      height: 42px;
      padding: 0 22px;
      border: none;
      border-radius: 8px;
      background: #409eff;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .btn-search:hover {
      background: #66b1ff;
    }
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2d3d;
      margin: 0 0 24px;
    }
    
    /* 列表：栅格布局 */
    .list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
    
    /* 卡片 */
    .card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    /* 封面图 */
    .cover {
      width: 100%;
      height: 160px;
      object-fit: cover;
      background: #f5f7fa;
      display: block;
    }
    
    /* 卡片内容 */
    .card-body {
      padding: 14px 16px 16px;
    }
    
    .card-title {
      font-size: 16px;
      font-weight: 500;
      color: #1f2d3d;
      margin: 0 0 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0 0 8px;
    }
    .authorname{
        font-size: 16px;
      color: #3157ef;
      font-weight: 600;
    }
    .price {
      font-size: 16px;
      color: #f56c6c;
      font-weight: 600;
    }
    
    .tag {
      font-size: 12px;
      color: #67c23a;
      background: #f0f9eb;
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .card-time {
      font-size: 12px;
      color: #909399;
      margin: 0;
    }
    
    /* 各种状态提示 */
    .loading, .no-more, .empty {
      text-align: center;
      padding: 32px 0;
      color: #909399;
      font-size: 14px;
    }
    </style>