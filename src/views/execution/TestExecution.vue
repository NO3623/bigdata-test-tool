<template>
  <div class="page-container" style="max-width:100%">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <circle cx="24" cy="24" r="18" fill="#ebebff" stroke="#6662fe" stroke-width="1.5"/>
          <path d="M24 14v10l8 6" fill="none" stroke="#6662fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="24" cy="24" r="3" fill="#6662fe" opacity="0.3"/>
        </svg>
        <h1 class="page-title">测试执行</h1>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.repo" placeholder="版本库" style="width:170px"><el-option v-for="r in repos" :key="r" :label="r" :value="r" /></el-select>
      <el-select v-model="filters.branch" placeholder="版本分支" style="width:200px"><el-option v-for="b in branches" :key="b" :label="b" :value="b" /></el-select>
      <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
    </div>

    <template v-if="executions.length > 0">
      <el-card shadow="never" class="section-card">
        <div slot="header">执行批次</div>
        <el-table :data="executions" stripe @row-click="selectBatch" highlight-current-row style="width:100%">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="batchId" label="批次号" min-width="200" />
          <el-table-column label="批量日期数" min-width="120" align="center">
            <template slot-scope="{ row }"><el-tag size="small">{{ row.batchDates.length }} 天</el-tag></template>
          </el-table-column>
          <el-table-column prop="repo" label="版本库" min-width="140" />
          <el-table-column prop="branch" label="分支" min-width="160" />
          <el-table-column label="最新状态" min-width="140">
            <template slot-scope="{ row }">
              <el-tag :type="getBatchStatus(row).type" size="small">{{ getBatchStatus(row).label }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <template v-if="selectedBatch">
        <div class="date-selector-bar">
          <span class="date-label">批量日期：</span>
          <el-radio-group v-model="selectedDate" size="small" @change="onDateChange">
            <el-radio-button v-for="d in selectedBatch.batchDates" :key="d" :label="d">
              {{ d }}
              <el-tag :type="getDateTag(selectedBatch, d)" size="mini" style="margin-left:4px;vertical-align:1px">{{ getDateLabel(selectedBatch, d) }}</el-tag>
            </el-radio-button>
          </el-radio-group>
        </div>

        <div v-for="(job, ji) in currentRun.jobs" :key="ji" class="section-card">
          <el-card shadow="never">
            <div slot="header" class="job-header">
              <span class="job-name">{{ job.name }}</span>
              <div>
                <el-tag :type="getJobStatusTag(job)" size="small">{{ getJobStatusLabel(job) }}</el-tag>
              </div>
            </div>

            <el-steps :active="getActiveStep(job)" finish-status="success" align-center style="margin-bottom:20px">
              <el-step v-for="p in job.phases" :key="p.name" :title="p.name" :status="getStepStatus(p)" :description="'耗时 '+getPhaseDuration(p)" />
            </el-steps>

            <el-collapse v-model="activePhase[ji]" accordion>
              <el-collapse-item v-for="(phase, pi) in job.phases" :key="pi" :name="pi">
                <template slot="title">
                  <div class="phase-title">
                    <span class="phase-dot" :class="phase.status" />
                    <span>{{ phase.name }}</span>
                    <el-tag :type="phaseTagType(phase.status)" size="mini" style="margin-left:8px">{{ phaseStatusLabel(phase.status) }}</el-tag>
                    <span class="phase-time">{{ phase.startedAt || '-' }} ~ {{ phase.endedAt || (phase.status==='running'?'执行中':'未开始') }}</span>
                  </div>
                </template>

                <div class="log-section">
                  <div class="log-header">
                    <span><i class="el-icon-document" /> 执行日志</span>
                    <el-button size="mini" type="text" icon="el-icon-download" @click.stop>下载完整日志</el-button>
                  </div>
                  <div class="log-viewer">
                    <div v-for="(log, li) in phase.logs" :key="li" class="log-line">
                      <span class="log-time">{{ log.time }}</span>
                      <span class="log-level" :class="'log-'+log.level">{{ log.level.toUpperCase() }}</span>
                      <span class="log-msg">{{ log.msg }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="phase.artifacts && phase.artifacts.length" class="artifact-section">
                  <div class="artifact-header"><i class="el-icon-paperclip" /> 阶段产物下载</div>
                  <div class="artifact-list">
                    <div v-for="(art, ai) in phase.artifacts" :key="ai" class="artifact-item">
                      <div class="artifact-info">
                        <i class="el-icon-file" />
                        <span>{{ art.name }}</span>
                        <span class="artifact-size">{{ art.size }}</span>
                      </div>
                      <el-button size="mini" type="text" icon="el-icon-download" @click.stop>下载</el-button>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>
      </template>
    </template>

    <el-empty v-else description="暂无执行记录" />
  </div>
</template>

<script>
import { mockExecutions } from "@/utils/mock"

export default {
  name: "TestExecution",
  data() {
    const ex = JSON.parse(JSON.stringify(mockExecutions))
    return {
      repos: ["etl-risk", "etl-trade", "etl-user"],
      branches: ["release/2.0", "release/1.0", "develop", "master"],
      filters: { repo: "etl-risk", branch: "release/2.0" },
      executions: ex,
      selectedBatch: null,
      selectedDate: "",
      activePhase: {}
    }
  },
  computed: {
    currentRun() {
      if (!this.selectedBatch) return { jobs: [] }
      const run = this.selectedBatch.runs.find(r => r.batchDate === this.selectedDate)
      return run || this.selectedBatch.runs[0] || { jobs: [] }
    }
  },
  methods: {
    handleSearch() { this.$message.success("查询成功") },
    selectBatch(row) {
      this.selectedBatch = row
      this.selectedDate = row.batchDates[0]
      this.activePhase = {}
    },
    onDateChange() { this.activePhase = {} },
    getBatchStatus(batch) {
      const runs = batch.runs; if (!runs || !runs.length) return { type: "info", label: "未知" }
      const first = runs[0]
      if (first.status === "success") return { type: "success", label: "全部通过" }
      if (first.status === "failed") return { type: "danger", label: "失败" }
      if (first.status === "running") return { type: "warning", label: "执行中" }
      return { type: "info", label: "等待中" }
    },
    getDateTag(batch, date) {
      const run = batch.runs.find(r => r.batchDate === date)
      if (!run) return "info"
      if (run.status === "success") return "success"
      if (run.status === "running") return "warning"
      if (run.status === "failed") return "danger"
      return "info"
    },
    getDateLabel(batch, date) {
      const run = batch.runs.find(r => r.batchDate === date)
      if (!run) return "-"
      if (run.status === "success") return "成功"
      if (run.status === "running") return "执行中"
      if (run.status === "failed") return "失败"
      return "等待"
    },
    getJobStatusTag(job) {
      const p = job.phases; if (p.every(x=>x.status==="success")) return "success"
      if (p.some(x=>x.status==="failed")) return "danger"
      if (p.some(x=>x.status==="running")) return "warning"; return "info"
    },
    getJobStatusLabel(job) {
      const p = job.phases; if (p.every(x=>x.status==="success")) return "全部完成"
      if (p.some(x=>x.status==="failed")) return "失败"; if (p.some(x=>x.status==="running")) return "执行中"; return "等待中"
    },
    getActiveStep(job) {
      const idx = job.phases.findIndex(p => p.status === "running" || p.status === "pending")
      return idx === -1 ? job.phases.length : idx
    },
    getStepStatus(p) {
      if (p.status === "success") return "success"; if (p.status === "running") return "process"
      if (p.status === "failed") return "error"; return "wait"
    },
    getPhaseDuration(p) {
      if (!p.startedAt) return "-"
      const start = new Date(p.startedAt)
      const end = p.endedAt ? new Date(p.endedAt) : new Date()
      const s = Math.round((end - start) / 1000)
      if (s < 60) return s + "s"
      return Math.floor(s/60) + "m " + (s%60) + "s"
    },
    phaseTagType(s) { const m = { success: "success", running: "warning", failed: "danger", pending: "info" }; return m[s] || "info" },
    phaseStatusLabel(s) { const m = { success: "成功", running: "执行中", failed: "失败", pending: "等待中" }; return m[s] || s }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.job-header { display: flex; align-items: center; justify-content: space-between; }
.job-name { font-weight: 700; font-size: 15px; }
.date-selector-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 12px 18px; background: #fff; border: 1px solid $color-border; border-radius: $radius-lg; box-shadow: $shadow-card; }
.date-label { font-weight: 600; font-size: 13px; color: $color-text-secondary; white-space: nowrap; }
.phase-title { display: flex; align-items: center; gap: 6px; width: 100%; }
.phase-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  &.success { background: $color-success; }
  &.running { background: $color-warning; animation: pulse 1.5s infinite; }
  &.failed { background: $color-danger; }
  &.pending { background: $slate-300; }
}
.phase-time { font-size: 12px; color: $color-text-muted; margin-left: auto; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.log-section { margin-top: 4px; }
.log-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-weight: 600; font-size: 13px; color: $color-text-secondary; }
.log-viewer { background: #1e1e2e; border-radius: 8px; padding: 12px 16px; font-family: Consolas, Monaco, "Courier New", monospace; font-size: 12px; line-height: 1.8; max-height: 320px; overflow-y: auto; }
.log-line { display: flex; gap: 8px; }
.log-time { color: #6c7086; min-width: 72px; flex-shrink: 0; }
.log-level { min-width: 48px; flex-shrink: 0; font-weight: 600;
  &.log-info { color: #89b4fa; }
  &.log-warn { color: #f9e2af; }
  &.log-error { color: #f38ba8; }
}
.log-msg { color: #cdd6f4; }

.artifact-section { margin-top: 16px; padding-top: 12px; border-top: 1px solid $color-border; }
.artifact-header { font-weight: 600; font-size: 13px; color: $color-text-secondary; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.artifact-list { display: flex; flex-wrap: wrap; gap: 8px; }
.artifact-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: $color-bg-base; border: 1px solid $color-border; border-radius: $radius-md; min-width: 240px; transition: border-color 0.2s;
  &:hover { border-color: $color-brand-lighter; }
}
.artifact-info { display: flex; align-items: center; gap: 8px; font-size: 13px;
  .el-icon-file { color: $color-brand; }
}
.artifact-size { font-size: 11px; color: $color-text-muted; }
</style>
