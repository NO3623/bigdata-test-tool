<template>
  <div class="page-container compressor-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <rect x="8" y="6" width="32" height="36" rx="4" fill="#b0adff" opacity="0.35"/>
          <rect x="13" y="11" width="22" height="26" rx="2" fill="#6662fe"/>
          <polygon points="30,20 23,24 30,28" fill="#fff"/>
          <path d="M8 42h32" stroke="#00b667" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h1 class="page-title">视频批量压缩</h1>
      </div>
      <div class="header-actions">
        <el-button :loading="engineLoading" type="primary" icon="el-icon-video-play" :disabled="!pendingRows.length || running" @click="start">开始压缩</el-button>
        <el-button :disabled="running" icon="el-icon-refresh" @click="resetAll">清空</el-button>
      </div>
    </div>

    <el-alert
      v-if="!serverOk"
      type="warning"
      :closable="false"
      show-icon
      class="engine-tip"
      title="未连接本地压缩服务，请先执行 npm run dev（会同时启动前端与本地 ffmpeg 服务）。"
    />
    <el-alert v-else type="info" :closable="false" show-icon class="engine-tip" title="压缩使用本地 ffmpeg，速度快、无文件体积限制；单文件建议小于 4GB。" />

    <el-card shadow="never" class="section-card">
      <div slot="header" class="card-head">
        <div class="card-title"><i class="el-icon-setting" />压缩设置</div>
      </div>
      <div class="settings-body">
        <div class="setting-row">
          <div class="setting-label">压缩程度</div>
          <div class="setting-control">
            <el-radio-group v-model="settings.mode" :disabled="running">
              <el-radio-button label="ratio">快捷档位</el-radio-button>
              <el-radio-button label="custom">指定目标大小</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div v-if="settings.mode === 'ratio'" class="setting-row">
          <div class="setting-label">目标体积</div>
          <div class="setting-control">
            <el-radio-group v-model="settings.ratioLevel" :disabled="running">
              <el-radio-button v-for="p in ratioPresets" :key="p.value" :label="p.value">
                {{ p.label }}<span class="radio-sub">≈原体积{{ p.hint }}</span>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div v-else class="setting-row">
          <div class="setting-label">目标大小</div>
          <div class="setting-control">
            <el-input-number v-model="settings.customMB" :min="1" :max="2000" :step="5" :disabled="running" controls-position="right" style="width:160px" />
            <span class="inline-note">MB / 每个视频（原文件小于目标大小的将被跳过）</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">画质上限</div>
          <div class="setting-control">
            <el-select v-model="settings.resolutionCap" :disabled="running" style="width:180px">
              <el-option label="不限制分辨率" :value="0" />
              <el-option v-for="h in [2160, 1080, 720, 540, 480, 360]" :key="h" :label="h + 'P'" :value="h" />
            </el-select>
            <span class="inline-note">高度超过上限时等比缩小</span>
          </div>
        </div>
        <div class="setting-row last">
          <div class="setting-label">压缩精度</div>
          <div class="setting-control">
            <el-radio-group v-model="settings.precise" :disabled="running">
              <el-radio-button :label="false">快速（单遍，体积接近目标）</el-radio-button>
              <el-radio-button :label="true">精准（两遍，体积更贴近目标）</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <div slot="header" class="card-head">
        <div class="card-title">
          <i class="el-icon-files" />压缩队列
          <el-tag v-if="rows.length" size="mini" type="info">{{ rows.length }} 个文件</el-tag>
        </div>
        <div class="card-actions">
          <el-button v-if="doneRows.length" size="mini" type="primary" icon="el-icon-download" @click="downloadAll">下载全部结果</el-button>
          <el-upload :disabled="running" :auto-upload="false" :show-file-list="false" :on-change="handleFilesChange" multiple accept="video/*">
            <el-button size="mini" :disabled="running" icon="el-icon-plus">批量选择视频</el-button>
          </el-upload>
        </div>
      </div>

      <div v-if="rows.length" class="queue-toolbar">
        <span class="queue-summary">
          已选 {{ rows.length }} 个 · 共 {{ fmtBytes(totalBytes) }}
          <template v-if="settings.mode === 'ratio'"> · 预计输出约为 {{ ratioPresetName }}</template>
          <template v-else> · 每个目标 {{ settings.customMB }} MB</template>
        </span>
        <el-progress v-if="running" :percentage="batchPercent" :stroke-width="8" style="width:300px" />
        <el-button v-if="running" size="mini" type="danger" plain icon="el-icon-switch-button" @click="stopCompress">停止</el-button>
      </div>

      <div v-if="rows.length" class="drop-tip" @drop.prevent="handleDrop" @dragover.prevent>
        <el-table :data="rows" class="queue-table" size="small">
          <el-table-column prop="name" label="文件名" min-width="220" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <div class="file-cell">
                <i class="file-icon el-icon-video-camera" />
                <span class="file-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="105" align="right">
            <template slot-scope="{ row }">
              <div class="size-col">
                <span>{{ fmtBytes(row.size) }}</span>
                <span v-if="row.outSize" class="size-to">{{ fmtBytes(row.outSize) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="媒体信息" width="180">
            <template slot-scope="{ row }">
              <template v-if="row.meta">
                <div class="meta-line">{{ fmtDuration(row.meta.duration) }}</div>
                <div class="meta-line muted">{{ row.meta.width }}×{{ row.meta.height }}<span v-if="row.meta.hasAudio"> · 含音频</span></div>
              </template>
              <span v-else class="muted">待分析</span>
            </template>
          </el-table-column>
          <el-table-column label="目标体积" width="110">
            <template slot-scope="{ row }">
              <span v-if="row.targetMB">{{ row.targetMB }} MB</span>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="状态 / 进度" min-width="230">
            <template slot-scope="{ row }">
              <div v-if="row.status === 'running'" class="state-running">
                <el-progress :percentage="row.progress" :stroke-width="8" style="flex:1" />
                <span class="phase-text">{{ row.phase }}</span>
              </div>
              <div v-else-if="row.status === 'done'" class="state-done">
                <el-tag type="success" size="small">压缩完成</el-tag>
                <span class="ratio-text" :class="row.savedRatio >= 0 ? 'good' : ''">
                  {{ row.savedRatio >= 0 ? '减小 ' + row.savedRatio + '%' : '体积未减小' }}
                </span>
              </div>
              <div v-else-if="row.status === 'skipped'">
                <el-tag type="info" size="small">已跳过</el-tag>
              </div>
              <div v-else-if="row.status === 'failed'" class="fail-cell">
                <el-tag type="danger" size="small">失败</el-tag>
                <el-tooltip :content="row.note || row.err" placement="top">
                  <span class="err-text">{{ row.note || row.err }}</span>
                </el-tooltip>
              </div>
              <div v-else-if="row.status === 'cancelled'">
                <el-tag type="warning" size="small">已停止</el-tag>
              </div>
              <div v-else>
                <el-tag size="small" type="info" effect="plain">等待处理</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="230" align="right">
            <template slot-scope="{ row }">
              <el-button v-if="row.status === 'done'" type="text" size="mini" @click="preview(row)">预览</el-button>
              <el-button v-if="row.status === 'done'" type="text" size="mini" @click="download(row)">下载</el-button>
              <el-button v-if="['failed', 'cancelled', 'idle', 'queued'].includes(row.status)" type="text" size="mini" @click="retryRow(row)">重试</el-button>
              <el-button v-if="['idle', 'queued', 'failed', 'cancelled', 'skipped'].includes(row.status)" type="text" size="mini" class="danger-link" @click="removeRow(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="upload-zone" @click="picker && picker.click()">
        <input ref="picker" type="file" multiple accept="video/*" class="file-picker" @change="handleNativeFiles" />
        <i class="upload-icon el-icon-upload2" />
        <p class="upload-main">拖拽视频到此处，或点击选择</p>
        <p class="upload-sub">支持 MP4 / WebM / MOV / MKV / AVI / TS 等常见格式，单文件建议小于 4GB</p>
      </div>
    </el-card>

    <el-dialog :title="previewRow ? previewRow.name : ''" :visible.sync="previewVisible" width="640px" append-to-body>
      <video v-if="previewUrl" :src="previewUrl" controls autoplay style="width:100%;border-radius:8px" />
    </el-dialog>
  </div>
</template>

<script>
import { compress, probe, downloadJob, removeJob, checkFfmpeg, listJobs, fmtBytes, isVideoType } from "@/utils/video/compressClient"

const RATIO_PRESETS = [
  { label: "高压缩", value: 0.2, hint: "20%" },
  { label: "标准", value: 0.4, hint: "40%" },
  { label: "轻度", value: 0.6, hint: "60%" }
]

export default {
  name: "VideoCompressor",
  data() {
    return {
      ratioPresets: RATIO_PRESETS,
      rows: [],
      running: false,
      cancelRequested: false,
      engineLoading: false,
      serverOk: false,
      batchPercent: 0,
      settings: {
        mode: "ratio",
        ratioLevel: 0.4,
        customMB: 20,
        resolutionCap: 0,
        precise: false
      }
    }
  },
  computed: {
    pendingRows() {
      return this.rows.filter((r) => !["done", "skipped", "running", "failed", "cancelled"].includes(r.status))
    },
    doneRows() {
      return this.rows.filter((r) => r.status === "done" && r.blob)
    },
    totalBytes() {
      return this.rows.reduce((s, r) => s + r.size, 0)
    },
    ratioPresetName() {
      const p = RATIO_PRESETS.find((x) => x.value === this.settings.ratioLevel)
      return p ? `约 ${p.hint}（${p.label}）` : ""
    }
  },
  created() {
    this._checkServer()
    this._loadJobs()
  },
  beforeDestroy() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
  },
  methods: {
    fmtBytes,
    fmtDuration(sec) {
      if (!sec) return "时长未知"
      sec = Math.round(sec)
      const h = Math.floor(sec / 3600)
      const m = Math.floor((sec % 3600) / 60)
      const s = sec % 60
      const pad = (x) => String(x).padStart(2, "0")
      return (h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`) + " ·"
    },
    async _checkServer() {
      this.serverOk = await checkFfmpeg()
    },
    async _loadJobs() {
      try {
        const jobs = await listJobs()
        for (const job of jobs) {
          if (this.rows.some((r) => r.id === job.id)) continue
          this.rows.push({
            id: job.id,
            file: null,
            name: job.originalName || job.outName || "video.mp4",
            size: job.originalSize || 0,
            lastModified: 0,
            status: job.status === "done" ? "done" : job.status === "failed" ? "failed" : "idle",
            progress: job.progress || 0,
            phase: "",
            note: "",
            err: job.error || "",
            meta: job.duration ? { duration: job.duration, width: job.width, height: job.height } : null,
            targetMB: job.targetMB || 0,
            blob: null,
            outSize: job.outSize || 0,
            outName: job.outName || "",
            jobId: job.id,
            savedRatio: job.originalSize && job.outSize ? Math.round((1 - job.outSize / job.originalSize) * 100) : 0
          })
        }
      } catch {}
    },
    handleNativeFiles(e) {
      this.addFiles(Array.from(e.target.files || []))
      e.target.value = ""
    },
    handleFilesChange(file) {
      this.addFiles([file.raw])
    },
    handleDrop(e) {
      if (this.running) return
      this.addFiles(Array.from(e.dataTransfer.files || []))
    },
    addFiles(files) {
      const added = []
      const seen = new Set(this.rows.map((r) => `${r.name}|${r.size}|${r.lastModified}`))
      for (const f of files) {
        if (!f || !isVideoType(f)) continue
        const key = `${f.name}|${f.size}|${f.lastModified || 0}`
        if (seen.has(key)) continue
        seen.add(key)
        this.rows.push({
          id: Date.now() + Math.random(),
          file: f,
          name: f.name,
          size: f.size,
          lastModified: f.lastModified || 0,
          status: "idle",
          progress: 0,
          phase: "",
          note: "",
          err: "",
          meta: null,
          targetMB: 0,
          blob: null,
          outSize: 0,
          outName: ""
        })
        added.push(f.name)
      }
      if (added.length) this.$message.success(`已添加 ${added.length} 个视频`)
      else if (files.length) this.$message.warning("没有可添加的视频文件")
    },
    removeRow(row) {
      const idx = this.rows.indexOf(row)
      if (idx > -1) this.rows.splice(idx, 1)
      if (row.blob) row.blob = null
    },
    resetAll() {
      if (this.running) return
      this.rows = []
      this.batchPercent = 0
      this.serverOk = false
      this._checkServer()
    },
    retryRow(row) {
      row.status = "queued"
      row.progress = 0
      row.phase = ""
      row.note = ""
      row.err = ""
      row.meta = null
      row.blob = null
      row.outSize = 0
      if (!this.running) this.start()
    },
    targetMbOf(row) {
      if (this.settings.mode === "custom") return Math.round(this.settings.customMB * 100) / 100
      const p = RATIO_PRESETS.find((x) => x.value === this.settings.ratioLevel) || RATIO_PRESETS[1]
      const mb = (row.size / 1048576) * p.value
      return Math.max(0.1, Math.round(mb * 100) / 100)
    },
    async start() {
      if (this.running) return
      const targets = this.rows.filter((r) => ["idle", "queued", "failed", "cancelled"].includes(r.status))
      if (!targets.length) {
        this.$message.warning("请先添加待压缩的视频")
        return
      }
      if (!this.serverOk) {
        this.$message.error("未连接本地压缩服务，请执行 npm run dev")
        return
      }
      this.cancelRequested = false
      this.running = true
      this.batchPercent = 0
      for (const r of targets) {
        r.status = "queued"
        r.progress = 0
        r.phase = ""
        r.note = ""
        r.err = ""
        r.meta = null
        r.blob = null
        r.outSize = 0
      }
      let done = 0, skip = 0, fail = 0
      const queue = targets.slice()
      for (const row of queue) {
        if (this.cancelRequested) {
          row.status = "cancelled"
          continue
        }
        row.status = "running"
        try {
          row.targetMB = this.targetMbOf(row)
          if (this.settings.mode === "custom" && row.size <= row.targetMB * 1048576) {
            row.status = "skipped"
            row.note = "原文件未超过目标大小"
            skip++
            continue
          }
          row.meta = await probe(row.file)
          if (!row.meta || !row.meta.duration || row.meta.duration <= 0) {
            throw new Error("无法识别视频时长")
          }
          const plan = this.buildPlan(row)
          if (plan.undersized) row.note = "目标过小，实际输出可能仍大于目标体积"
          const result = await compress(row.file, {
            targetMB: row.targetMB,
            mode: this.settings.mode,
            ratioLevel: this.settings.ratioLevel,
            resolutionCap: this.settings.resolutionCap,
            precise: this.settings.precise
          }, {
            onProgress: (p) => {
              row.progress = Math.round(p)
            }
          })
          row.blob = await downloadJob(result.jobId)
          row.jobId = result.jobId
          row.outSize = result.outSize || row.blob.size
          row.outName = result.outName || `${result.jobId}.mp4`
          row.savedRatio = Math.round((1 - row.outSize / row.size) * 100)
          row.status = "done"
          row.progress = 100
          done++
          this.$message.success(`${row.name} 完成：${fmtBytes(row.size)} → ${fmtBytes(row.outSize)}`)
        } catch (e) {
          const cancelled = this.cancelRequested || /cancelled|已释放/i.test(e.message || "")
          row.status = cancelled ? "cancelled" : "failed"
          row.err = e.message || "未知错误"
          this.$message.error(`${row.name}: ${row.err}`)
          if (!cancelled) fail++
        } finally {
          await removeJob(row.jobId).catch(() => {})
          if (row.status === "done") row.progress = 100
          const processed = queue.filter((r) => ["done", "skipped", "failed", "cancelled"].includes(r.status)).length
          this.batchPercent = Math.round((processed / queue.length) * 100)
        }
      }
      this.running = false
      this.cancelRequested = false
      if (done + skip + fail === queue.length) {
        this.$message({ type: fail ? "warning" : "success", message: `处理完成：成功 ${done}，跳过 ${skip}，失败 ${fail}`, duration: 4000 })
      }
    },
    buildPlan(row) {
      const targetBytes = row.targetMB * 1048576
      const totalKbps = (row.targetMB * 8192) / row.meta.duration
      const audioKbps = row.meta.hasAudio ? (totalKbps >= 300 ? 96 : Math.max(24, Math.floor(totalKbps / 3))) : 0
      const headroom = this.settings.precise ? 0.985 : 0.9
      const videoKbps = Math.max(Math.round((totalKbps - audioKbps) * headroom), 60)
      const effH = row.meta.height
      let vf = ""
      if (this.settings.resolutionCap && effH > this.settings.resolutionCap) {
        vf = `scale=-2:${this.settings.resolutionCap}`
      }
      return { vf, audioKbps, videoKbps, undersized: videoKbps < 120, outName: `${this._baseName(row.name)}_compressed.mp4` }
    },
    _baseName(name) {
      const idx = name.lastIndexOf(".")
      return (idx > 0 ? name.slice(0, idx) : name) || "video"
    },
    stopCompress() {
      this.cancelRequested = true
      this.$message.warning("已停止，当前任务中止")
    },
    async download(row) {
      if (!row.blob && row.jobId) {
        try {
          row.blob = await downloadJob(row.jobId)
        } catch {
          this.$message.error("下载失败")
          return
        }
      }
      if (!row.blob) return
      const url = URL.createObjectURL(row.blob)
      const a = document.createElement("a")
      a.href = url
      a.download = row.name || row.outName || "video.mp4"
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    },
    async downloadAll() {
      const rows = this.doneRows.slice()
      if (!rows.length) return
      for (const row of rows) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        this.download(row)
      }
      this.$message.success(`已开始下载 ${rows.length} 个文件`)
    },
    preview(row) {
      this.previewRow = row
      this.previewVisible = true
      this.previewUrl = URL.createObjectURL(row.blob)
    }
  },
  watch: {
    previewVisible(v) {
      if (!v && this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
        this.previewUrl = ""
        this.previewRow = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.compressor-page { max-width: 1200px; }

.engine-tip { margin-bottom: 16px; border-radius: $radius-lg; }

.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-title { display: flex; align-items: center; gap: 8px;
  i { color: $color-brand; }
}
.header-actions { display: flex; gap: 8px; }

.settings-body { display: flex; flex-direction: column; gap: 14px; }
.setting-row { display: flex; align-items: flex-start; gap: 18px;
  &.last { align-items: center; }
  .setting-label { width: 88px; flex-shrink: 0; padding-top: 8px; font-size: 13px; color: $color-text-secondary; font-weight: 500; }
}
.setting-control { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  .radio-sub { margin-left: 4px; font-size: 11px; color: $color-text-muted; }
}
.inline-note { font-size: 12px; color: $color-text-muted; }

.queue-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 12px;
  .queue-summary { font-size: 13px; color: $color-text-secondary; }
}

.file-picker { display: none; }

.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 56px 20px; border: 1.5px dashed $color-border-input; border-radius: $radius-lg;
  background: #fcfcfe; cursor: pointer; transition: all 0.2s ease;
  &:hover { border-color: $color-brand; background: $color-brand-subtle;
    .upload-icon { color: $color-brand; transform: translateY(-2px); }
  }
  .upload-icon { font-size: 42px; color: $slate-400; margin-bottom: 10px; transition: all 0.2s ease; }
  .upload-main { font-size: 15px; font-weight: 600; color: $color-text-secondary; margin-bottom: 6px; }
  .upload-sub { font-size: 12px; color: $color-text-muted; }
}

.file-cell { display: flex; align-items: center; gap: 8px; min-width: 0;
  .file-icon { color: $color-brand; font-size: 15px; flex-shrink: 0; }
  .file-name { overflow: hidden; text-overflow: ellipsis; }
}
.size-col { display: flex; flex-direction: column; line-height: 1.4;
  .size-to { color: $color-success; font-size: 12px; font-weight: 600; }
}
.meta-line { font-size: 12px; line-height: 1.6;
  &.muted { color: $color-text-muted; }
}
.muted { color: $color-text-muted; }

.state-running { display: flex; align-items: center; gap: 10px;
  .phase-text { font-size: 12px; color: $color-text-muted; flex-shrink: 0; min-width: 90px; }
}
.state-done { display: flex; align-items: center; gap: 8px;
  .ratio-text { font-size: 12px; font-weight: 600; color: $color-text-secondary;
    &.good { color: $color-success; }
  }
}
.fail-cell { display: flex; align-items: center; gap: 8px; min-width: 0;
  .err-text { font-size: 12px; color: $color-danger; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
}
.danger-link { color: $color-danger; }
</style>
