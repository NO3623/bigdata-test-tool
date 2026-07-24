<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">{{ item.meta.title || item.name }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script>
export default {
  name: "Breadcrumb",
  computed: {
    breadcrumbs() {
      const routes = this.$route.matched.filter(r => r.meta && r.meta.title && !r.meta.hidden)
      if (routes[0] && routes[0].path === '/') return routes.slice(1)
      return routes
    }
  }
}
</script>
