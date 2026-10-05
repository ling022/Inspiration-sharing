import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  { path: '/login', component:()=>import ("@/views/Login.vue")},
  { path: '/register',component:()=>import ("@/views/Register.vue")},
  { path: '/',component:()=>import ("@/views/home.vue"),meta:{requiresAuth:true}},//meta:{requiresAuth:true}表示需要登陆
  { path: '/profile',component:()=>import ("@/views/profile.vue"),meta:{requiresAuth:true}},
  { path: '/favorites',component:()=>import ("@/views/favorites.vue"),meta:{requiresAuth:true}},
  { path: '/admin/users',component:()=>import ("@/views/admin/users.vue"),meta:{requiresAuth:true,role:1}},
  { path: '/admin/orders',component:()=>import ("@/views/admin/orders.vue"),meta:{requiresAuth:true,role:1}},
  { path: '/admin/inspirations',component:()=>import ("@/views/admin/inspirations.vue"),meta:{requiresAuth:true,role:1}},
  { path: '/admin/wallet',component:()=>import ("@/views/admin/wallet.vue"),meta:{requiresAuth:true,role:1}},
  { path: '/admin/inspirations/:id',component:()=>import ("@/views/admin/inspirationDetail.vue"),meta:{requiresAuth:true,role:1}},
  { path: '/inspirations/:id',component:()=>import ("@/views/inspirationDetail.vue"),meta:{requiresAuth:true}},
  { path: '/publish',component:()=>import ("@/views/publish.vue"),meta:{requiresAuth:true}},
  { path: '/messages',component:()=>import ("@/views/messages.vue"),meta:{requiresAuth:true}},
  { path: '/unread-messages',component:()=>import ("@/views/unread-messages.vue"),meta:{requiresAuth:true}},
  { path: '/order/:id',component:()=>import ("@/views/orderConfirm.vue"),meta:{requiresAuth:true}},
  { path: '/order',component:()=>import ("@/views/order.vue"),meta:{requiresAuth:true}},
  { path: '/pay/:orderNo',component:()=>import ("@/views/MockPay.vue"),meta:{requiresAuth:true}},
  { path: '/wallet',component:()=>import ("@/views/wallet.vue"),meta:{requiresAuth:true}},
];

const router=createRouter({
  history: createWebHistory(),
  routes
});
//全局前置路由守卫
router.beforeEach((to,from)=>{
  const token=localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if(to.meta.requiresAuth){
    //无token，跳到登录页
    if(!token){return '/login'}
    //是否需要特定角色
    if(to.meta.role!==undefined&&user.role!==to.meta.role){
      return '/'
    }
  }
   //已登录用户访问登录/注册页 → 跳到首页
   if ((to.path === '/login' || to.path === '/register') && token) {
     return user.role === 1 ? '/admin/inspirations' : '/'
  }
  //管理员访问时不跳转到home页
  if (to.path === '/' && token && user.role === 1) {
    return '/admin/inspirations'
  }
})
export default router