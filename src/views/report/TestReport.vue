<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <rect x="4" y="30" width="8" height="14" rx="2" fill="#b0adff" opacity="0.4"/>
          <rect x="14" y="22" width="8" height="22" rx="2" fill="#b0adff" opacity="0.6"/>
          <rect x="24" y="14" width="8" height="30" rx="2" fill="#6662fe"/>
          <rect x="34" y="18" width="8" height="26" rx="2" fill="#d2d0ff" opacity="0.7"/>
          <path d="M26 10l2-2 2 2" fill="none" stroke="#00b667" stroke-width="2" stroke-linecap="round"/>
          <line x1="28" y1="8" x2="28" y2="14" stroke="#00b667" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h1 class="page-title">测试报告</h1>
      </div>
      <el-button icon="el-icon-download" @click="exportReport">导出报告</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.repo" placeholder="版本库" style="width:170px">
        <el-option v-for="r in repos" :key="r" :label="r" :value="r" />
      </el-select>
      <el-select v-model="filters.branch" placeholder="版本分支" style="width:200px">
        <el-option v-for="b in branches" :key="b" :label="b" :value="b" />
      </el-select>
      <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
    </div>

    <template v-if="reports.length > 0">
      <!-- 汇总统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6"><div class="stat-card"><div class="stat-value" style="color:#6662fe">{{ totalPrograms }}</div><div class="stat-label">程序总数</div></div></el-col>
        <el-col :span="6"><div class="stat-card"><div class="stat-value" style="color:#00b667">{{ totalPassed }}</div><div class="stat-label">断言通过</div></div></el-col>
        <el-col :span="6"><div class="stat-card"><div class="stat-value" style="color:#ef4444">{{ totalFailed }}</div><div class="stat-label">断言失败</div></div></el-col>
        <el-col :span="6"><div class="stat-card"><div class="stat-value" style="color:#faaf00">{{ overallPassRate }}</div><div class="stat-label">整体通过率</div></div></el-col>
      </el-row>

      <!-- 程序通过率 -->
      <el-card shadow="never">
        <div slot="header">
          程序测试通过情况
          <span style="font-size:13px;color:#64748b;margin-left:12px">{{ filters.repo }} / {{ filters.branch }}</span>
        </div>
        <el-table :data="reports[0].programs" stripe>
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="name" label="程序名" min-width="200" />
          <el-table-column prop="totalAssertions" label="断言总数" width="110" align="center" />
          <el-table-column prop="passed" label="通过" width="100" align="center">
            <template slot-scope="{ row }"><span style="color:#10b981;font-weight:600">{{ row.passed }}</span></template>
          </el-table-column>
          <el-table-column prop="failed" label="失败" width="100" align="center">
            <template slot-scope="{ row }"><span style="color:#ef4444;font-weight:600">{{ row.failed }}</span></template>
          </el-table-column>
          <el-table-column label="通过率" width="220">
            <template slot-scope="{ row }">
              <div class="progress-wrapper">
                <el-progress :percentage="parseInt(row.passRate)" :color="row.passRate === '100%' ? '#00b667' : parseInt(row.passRate) >= 80 ? '#faaf00' : '#ef4444'" :stroke-width="10" style="flex:1" />
                <span class="progress-text" :style="{ color: row.passRate === '100%' ? '#00b667' : parseInt(row.passRate) >= 80 ? '#faaf00' : '#ef4444' }">{{ row.passRate }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="lastRun" label="最近执行时间" width="175" />
        </el-table>
      </el-card>
    </template>

    <el-empty v-else description="暂无测试报告" />
  </div>
</template>

<script>
import { mockReports } from "@/utils/mock"

export default {
  name: "TestReport",
  data() {
    return {
      repos: ["etl-risk", "etl-trade", "etl-user"],
      branches: ["release/2.0", "release/1.0", "develop", "master"],
      filters: { repo: "etl-risk", branch: "release/2.0" },
      reports: JSON.parse(JSON.stringify(mockReports))
    }
  },
  computed: {
    programs() { return this.reports[0]?.programs || [] },
    totalPrograms() { return this.programs.length },
    totalPassed() { return this.programs.reduce((s, p) => s + p.passed, 0) },
    totalFailed() { return this.programs.reduce((s, p) => s + p.failed, 0) },
    overallPassRate() {
      const total = this.totalPassed + this.totalFailed
      return total === 0 ? "0%" : Math.round((this.totalPassed / total) * 100) + "%"
    }
  },
  methods: {
    handleSearch() { this.$message.success("查询成功") },
    exportReport() { this.$message.success("报告导出成功") }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.stats-row { margin-bottom: 24px; }
.stat-card { border: 1px solid rgba($color-brand, 0.06); border-radius: $radius-lg; padding: 20px; background: #fff; text-align: center; transition: all 0.3s ease;
  &:hover { transform: translateY(-2px); box-shadow: $shadow-card-hover; border-color: rgba($color-brand, 0.15); }
  .stat-value { font-size: 32px; font-weight: 800; line-height: 1.1; }
  .stat-label { font-size: 13px; color: $color-text-muted; margin-top: 6px; font-weight: 500; }
}
.progress-wrapper { display: flex; align-items: center; gap: 10px; }
.progress-text { font-weight: 700; font-size: 13px; min-width: 42px; text-align: right; }
</style>
