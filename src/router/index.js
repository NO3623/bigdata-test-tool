import Vue from "vue"
import VueRouter from "vue-router"
import Layout from "@/views/Layout.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    component: Layout,
    redirect: "/assets/scenario",
    children: [
      { path: "assets/scenario", name: "ScenarioManagement", meta: { title: "场景管理" }, component: () => import("@/views/assets/ScenarioManagement.vue") },
      { path: "assets/data-assets", name: "DataAssets", meta: { title: "数据资产" }, component: () => import("@/views/assets/DataAssets.vue") },
      { path: "assets/data-asset-detail/:id", name: "DataAssetDetail", meta: { title: "数据资产详情" }, hidden: true, component: () => import("@/views/assets/DataAssetDetail.vue") },
      { path: "assets/metadata-profile", name: "MetadataProfile", meta: { title: "元数据画像" }, component: () => import("@/views/assets/MetadataProfile.vue") },
      { path: "design", name: "TestDesign", meta: { title: "测试设计" }, component: () => import("@/views/design/TestDesign.vue") },
      { path: "execution", name: "TestExecution", meta: { title: "测试执行" }, component: () => import("@/views/execution/TestExecution.vue") },
      { path: "report", name: "TestReport", meta: { title: "测试报告" }, component: () => import("@/views/report/TestReport.vue") },
      { path: "tool/video-compress", name: "VideoCompressor", meta: { title: "视频批量压缩" }, component: () => import("@/views/tool/VideoCompressor.vue") }
    ]
  }
]

export default new VueRouter({ routes })
