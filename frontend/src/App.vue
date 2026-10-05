<script setup>
import {computed} from 'vue'
import { useRoute } from 'vue-router'

import Navbar from './components/navbar.vue';
import test2 from './views/test-父.vue';
import testonly from './views/testonly.vue';
const route = useRoute()
const showNavbar = computed(() => {
  return !['/login', '/register'].includes(route.path)
})
</script>

<template>
  <navbar v-if="showNavbar"></navbar>
      <router-view></router-view>
  
</template>

<style scoped></style>
