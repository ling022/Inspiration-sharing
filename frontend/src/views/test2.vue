<template>
  <h1>我是子组件</h1>
  <h1>{{ numbe }}</h1>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({
  number: Number
})
const x = 1
console.log(props.usenm)
</script>
