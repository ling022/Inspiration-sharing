import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'   // ← 样式
import zhCn from 'element-plus/es/locale/lang/zh-cn'   // 中文

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })   // ← 挂载 + 中文

app.mount('#app')
