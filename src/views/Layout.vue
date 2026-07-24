<template>
  <div class="layout">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span v-if="!sidebarCollapsed" class="logo">
          <svg class="logo-icon" viewBox="0 0 28 28" width="24" height="24">
            <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b88ff"/><stop offset="100%" stop-color="#6662fe"/></linearGradient></defs>
            <rect x="2" y="2" width="10" height="10" rx="2.5" fill="url(#lg)"/>
            <rect x="16" y="2" width="10" height="10" rx="2.5" fill="#8b88ff" opacity="0.6"/>
            <rect x="2" y="16" width="10" height="10" rx="2.5" fill="#8b88ff" opacity="0.6"/>
            <rect x="16" y="16" width="10" height="10" rx="2.5" fill="#b0adff" opacity="0.4"/>
          </svg>
          <span class="logo-text">大数据测试</span>
        </span>
        <i :class="sidebarCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'" class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed" />
      </div>
      <el-menu :default-active="activeMenu" :default-openeds="['assets']" :collapse="sidebarCollapsed" router :background-color="'#0a0f1a'" :text-color="'#8896ab'" :active-text-color="'#ffffff'">
        <el-submenu index="assets" popper-class="sidebar-popper">
          <template slot="title"><i class="el-icon-s-data" /><span>测试资产</span></template>
          <el-menu-item index="/assets/scenario">场景管理</el-menu-item>
          <el-menu-item index="/assets/data-assets">数据资产</el-menu-item>
          <el-menu-item index="/assets/metadata-profile">元数据画像</el-menu-item>
        </el-submenu>
        <el-menu-item index="/design"><i class="el-icon-edit-outline" /><span slot="title">测试设计</span></el-menu-item>
        <el-menu-item index="/execution"><i class="el-icon-video-play" /><span slot="title">测试执行</span></el-menu-item>
        <el-menu-item index="/report"><i class="el-icon-data-line" /><span slot="title">测试报告</span></el-menu-item>
      </el-menu>
      <div v-if="!sidebarCollapsed" class="sidebar-footer">
        <div class="sidebar-footer-text">Big Data Test v1.0</div>
      </div>
    </aside>
    <div class="main-area">
      <header class="top-header">
        <breadcrumb />
        <div class="header-right">
          <span class="env-badge"><span class="env-dot" />{{ envTag }}</span>
          <el-dropdown trigger="click">
            <span class="user-info"><span class="avatar">管</span><span class="user-name">管理员</span></span>
            <el-dropdown-menu slot="dropdown"><el-dropdown-item>个人设置</el-dropdown-item><el-dropdown-item divided>退出登录</el-dropdown-item></el-dropdown-menu>
          </el-dropdown>
        </div>
      </header>
      <main class="content">
        <svg class="content-decoration" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          <defs><radialGradient id="cdg"><stop offset="0%" stop-color="#6662fe" stop-opacity="0.04"/><stop offset="100%" stop-color="#6662fe" stop-opacity="0"/></radialGradient></defs>
          <circle cx="250" cy="50" r="200" fill="url(#cdg)"/>
          <circle cx="250" cy="50" r="120" fill="url(#cdg)"/>
        </svg>
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import Breadcrumb from "@/components/Breadcrumb.vue"
export default {
  name: "Layout",
  components: { Breadcrumb },
  data() { return { sidebarCollapsed: false, envTag: "测试环境" } },
  computed: { activeMenu() { return this.$route.path } }
}
</script>

<style lang="scss">
.sidebar-popper .el-menu--popup { background: #0a0f1a !important; border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 8px !important; }
.sidebar-popper .el-menu-item { color: #8896ab !important; background: #0a0f1a !important; font-size: 13px;
  &:hover { background: #151d2e !important; color: #fff !important; }
}
</style>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.layout { display: flex; height: 100vh; }
.sidebar {
  width: $sidebar-width; background: $color-bg-sidebar; display: flex; flex-direction: column;
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1); overflow: hidden;
  border-right: 1px solid rgba(255,255,255,0.04);
  &.collapsed { width: $sidebar-collapsed-width; }
  .sidebar-header {
    height: $header-height; display: flex; align-items: center; justify-content: center;
    gap: 8px; padding: 0 12px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
  }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { flex-shrink: 0; }
  .logo-text { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }
  .toggle-btn { color: #8896ab; cursor: pointer; font-size: 18px; padding: 4px; border-radius: 6px; transition: all 0.15s;
    &:hover { color: #fff; background: rgba(255,255,255,0.06); }
  }
  .el-menu { border-right: none; flex: 1;
    .el-menu-item { font-size: 13px; height: 40px; line-height: 40px; margin: 2px 8px; padding: 0 12px !important; border-radius: 8px; transition: all 0.15s;
      display: flex; align-items: center;
      &:hover { background: rgba(255,255,255,0.04) !important; }
      &.is-active {
        background: linear-gradient(135deg, rgba($color-brand, 0.2), rgba($color-brand, 0.1)) !important;
        color: #fff !important; font-weight: 500; position: relative;
        &::before { content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; background: $gradient-primary; border-radius: 0 2px 2px 0; }
      }
      i { margin-right: 6px; }
    }
    .el-submenu {
      .el-submenu__title { font-size: 13px; height: 40px; line-height: 40px; margin: 2px 8px; padding: 0 12px !important; border-radius: 8px;
        display: flex; align-items: center;
        &:hover { background: rgba(255,255,255,0.04) !important; }
        i { margin-right: 6px; color: #8896ab; flex-shrink: 0; }
        .el-submenu__icon-arrow { position: static !important; margin-left: auto !important; margin-right: 0 !important; margin-top: 0 !important; }
      }
      .el-menu { background: transparent;
        .el-menu-item { font-size: 13px; height: 36px; line-height: 36px; padding-left: 52px !important; margin: 1px 8px;
          &.is-active {
            &::before { left: 0; width: 2px; }
          }
        }
      }
    }
  }
  .sidebar-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
  .sidebar-footer-text { font-size: 11px; color: #4a5568; }
}

.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.top-header {
  height: $header-height; display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; background: #fff; border-bottom: 1px solid $color-border; flex-shrink: 0;
}
.header-right { display: flex; align-items: center; gap: 20px; }
.env-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: $color-text-secondary; padding: 4px 12px; background: $color-bg-base; border-radius: $radius-pill; }
.env-dot { width: 7px; height: 7px; border-radius: 50%; background: $color-success; flex-shrink: 0; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: background 0.15s;
  &:hover { background: $color-bg-base; }
}
.avatar { width: 28px; height: 28px; border-radius: 8px; background: $gradient-primary; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.user-name { font-size: 13px; color: $color-text-primary; font-weight: 500; }
.content { flex: 1; overflow-y: auto; background: $color-bg-base; position: relative; }
.content-decoration { position: fixed; top: 0; right: 0; width: 360px; height: 360px; pointer-events: none; z-index: 0; }
</style>
