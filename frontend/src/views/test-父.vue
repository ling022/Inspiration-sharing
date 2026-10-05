<template>
  <!-- 1. 在标签上写 ref="名字" -->
  <input type="text" ref="myInput"> 
  <button @click="focusInput">点我让输入框获取焦点</button>
  <test2 :number="number"/>
  <h1>我是父组件</h1>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import test2 from './test2.vue'

// 2. 在 script 中定义一个同名的 ref 变量，初始值为 null
const myInput = ref(null)
let number=ref(10)

function focusInput() {
  // 4. 通过 myInput.value 就能拿到真实的 DOM 节点
  // 然后就可以调用原生 DOM 方法，比如 .focus()
  myInput.value.focus() 
}

onMounted(() => {
  // 3. 页面加载完成后，Vue 会自动把 <input> 这个真实 DOM 节点赋值给 myInput.value
  console.log(myInput.value) // 打印出来是一个 <input> 的 DOM 对象
})
</script>