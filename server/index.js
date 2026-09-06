const express = require("express")
const multer = require("multer")
const cors = require("cors")
const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

const app = express()
const PORT = 3001
const UPLOAD_DIR = path.join(__dirname, "uploads")
const OUTPUT_DIR = path.join(__dirname, "outputs")
const JOBS_DIR = path.join(__dirname, "jobs")

for (const dir of [UPLOAD_DIR, OUTPUT_DIR, JOBS_DIR]) {
  fs.mkdirSync(dir, { recursive: true })
}

// 启动清扫：上次运行中断的任务（进程已不在，永远不会完成）标记为失败，
// 并清理遗留的临时输入文件与已无任务记录对应的输出文件
const keptOutputs = new Set()
for (const f of fs.readdirSync(JOBS_DIR).filter((f) => f.endsWith(".json"))) {
  const p = path.join(JOBS_DIR, f)
  try {
    const job = JSON.parse(fs.readFileSync(p))
    if (job && (job.status === "running" || job.status === "queued")) {
      job.status = "failed"
      job.progress = 0
      job.error = "服务重启导致任务中断，请重新压缩"
      fs.writeFileSync(p, JSON.stringify(job))
    }
    if (job && job.outName) keptOutputs.add(job.outName)
  } catch { /* 任务文件损坏时跳过 */ }
}
for (const f of fs.readdirSync(UPLOAD_DIR)) {
  try { fs.unlinkSync(path.join(UPLOAD_DIR, f)) } catch { /* noop */ }
}
for (const f of fs.readdirSync(OUTPUT_DIR)) {
  if (!keptOutputs.has(f)) {
    try { fs.unlinkSync(path.join(OUTPUT_DIR, f)) } catch { /* noop */ }
  }
}

app.use(cors())
app.use(express.json())

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin"
    cb(null, `${Date.now()}-${Date.now()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }
})

const FFMPEG_PATHS = [
  process.env.FFMPEG_PATH,
  "C:\\ffmpeg\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe",
  "C:\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe",
  "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"
].filter(Boolean)
const FFPROBE_PATHS = FFMPEG_PATHS.map((p) => p.replace(/ffmpeg\.exe$/i, "ffprobe.exe"))

function findExe(paths) {
  for (const p of paths) {
    try {
      const stat = require("fs").statSync(p)
      if (stat.isFile()) return p
    } catch { /* noop */ }
  }
  return null
}

function findFfmpeg(cb) {
  const exe = findExe(FFMPEG_PATHS)
  if (!exe) return cb(new Error("未找到本地 ffmpeg，请安装并加入 PATH"))
  const p = spawn(exe, ["-version"], { stdio: ["ignore", "pipe", "pipe"] })
  let responded = false
  const done = (err) => {
    if (responded) return
    responded = true
    p.removeAllListeners()
    cb(err)
  }
  p.on("error", () => done(new Error("ffmpeg 启动失败")))
  p.on("close", (code) => done(code === 0 ? null : new Error("ffmpeg 启动失败")))
}

const FFMPEG_DIRS = FFMPEG_PATHS.map((p) => path.dirname(p))
for (const d of FFMPEG_DIRS) {
  process.env.PATH = `${d}${path.delimiter}${process.env.PATH}`
}

function ffprobe(file) {
  return new Promise((resolve, reject) => {
    const exe = findExe(FFPROBE_PATHS)
    if (!exe) return reject(new Error("未找到 ffprobe"))
    const p = spawn(exe, [
      "-v", "error",
      "-show_entries", "format=duration:stream=width,height,codec_type,codec_name",
      "-of", "json", file
    ], { stdio: ["ignore", "pipe", "pipe"] })
    let out = ""
    p.stdout.on("data", (d) => (out += d.toString()))
    p.stderr.on("data", () => {})
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error("ffprobe 失败"))
      try {
        const json = JSON.parse(out)
        const dur = parseFloat(json.format?.duration) || 0
        const vs = json.streams?.filter((s) => s.codec_type === "video") || []
        const as = json.streams?.filter((s) => s.codec_type === "audio") || []
        const v = vs[0] || {}
        resolve({
          duration: dur,
          width: parseInt(v.width) || 0,
          height: parseInt(v.height) || 0,
          hasAudio: as.length > 0,
          rotation: 0
        })
      } catch (e) {
        reject(new Error("解析媒体信息失败"))
      }
    })
  })
}

function setJob(id, data) {
  // 合并写入：编码过程中多次更新进度，必须保留 originalName/originalSize/outName 等字段，
  // 否则页面刷新后无法按原文件名恢复任务
  const f = path.join(JOBS_DIR, `${id}.json`)
  let prev = {}
  try { prev = JSON.parse(fs.readFileSync(f)) } catch { prev = {} }
  fs.writeFileSync(f, JSON.stringify({ ...prev, ...data }))
}
function getJob(id) {
  const f = path.join(JOBS_DIR, `${id}.json`)
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : null
}
function removeJob(id) {
  const f = path.join(JOBS_DIR, `${id}.json`)
  if (fs.existsSync(f)) fs.unlinkSync(f)
}

// 串行编码队列：所有任务先入队，逐个执行，避免多个 ffmpeg 抢占 CPU；
// 页面刷新不影响服务端继续编码，客户端重连后靠任务记录恢复进度
const jobQueue = []
let activeJobId = null
let activeProc = null

function enqueueJob(entry) {
  jobQueue.push(entry)
  pump()
}

function pump() {
  if (activeJobId || jobQueue.length === 0) return
  const next = jobQueue.shift()
  activeJobId = next.jobId
  processJob(next.jobId, next.inPath, next.outPath, next.opts, () => {
    activeJobId = null
    setImmediate(pump)
  })
}

// 取消任务：排队中的直接移出队列并删输入文件；编码中的杀掉 ffmpeg 进程。
// 返回 true 表示该任务确实处于排队/编码状态
function cancelJob(id) {
  let hit = false
  const qi = jobQueue.findIndex((q) => q.jobId === id)
  if (qi > -1) {
    const [entry] = jobQueue.splice(qi, 1)
    cleanup(entry.inPath)
    setJob(id, { status: "cancelled" })
    hit = true
  }
  if (activeJobId === id && activeProc) {
    // 先写状态再杀进程，processJob 的 close 回调看到 cancelled 后不会覆盖成 failed
    setJob(id, { status: "cancelled" })
    activeProc.kill("SIGKILL")
    hit = true
  }
  return hit
}

app.get("/api/jobs", (_req, res) => {
  const files = fs.readdirSync(JOBS_DIR).filter((f) => f.endsWith(".json"))
  const jobs = files.map((f) => {
    const id = f.replace(".json", "")
    const data = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f)))
    return { id, ...data }
  })
  jobs.sort((a, b) => {
    const ta = parseInt(a.id) || 0
    const tb = parseInt(b.id) || 0
    return tb - ta
  })
  res.json(jobs)
})

app.get("/api/check", (_req, res) => {
  findFfmpeg((err) => {
    if (err) return res.json({ ok: false, reason: err.message })
    res.json({ ok: true })
  })
})

app.post("/api/probe", upload.single("video"), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: "未收到文件" })
  try {
    const meta = await ffprobe(file.path)
    cleanup(file.path)
    res.json(meta)
  } catch (e) {
    cleanup(file.path)
    res.status(400).json({ error: e.message })
  }
})

app.post("/api/compress", upload.single("video"), (req, res) => {
  findFfmpeg((err) => {
    if (err) return res.status(503).json({ error: err.message })
    const file = req.file
    if (!file) return res.status(400).json({ error: "未收到视频文件" })
    const targetMB = parseFloat(req.body.targetMB) || 20
    const mode = req.body.mode || "ratio"
    const ratioLevel = parseFloat(req.body.ratioLevel) || 0.4
    const resolutionCap = parseInt(req.body.resolutionCap) || 0
    const precise = req.body.precise === "true"
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const originalName = req.body.originalName || file.originalname || "video.mp4"
    const outName = `${jobId}.mp4`
    const outPath = path.join(OUTPUT_DIR, outName)
    setJob(jobId, { status: "queued", progress: 0, targetMB, mode, ratioLevel, resolutionCap, precise, outName, originalName, originalSize: file.size })
    res.json({ jobId })
    setImmediate(() => enqueueJob({ jobId, inPath: file.path, outPath, opts: { targetMB, mode, ratioLevel, resolutionCap, precise, outName } }))
  })
})

function processJob(jobId, inPath, outPath, opts, done) {
  const { targetMB, mode, ratioLevel, resolutionCap, precise, outName } = opts
  ffprobe(inPath)
    .then((meta) => {
      if ((getJob(jobId) || {}).status === "cancelled") { cleanup(inPath); done(); return }
      const dur = meta.duration
      if (!dur || dur <= 0) { cleanup(inPath); setJob(jobId, { status: "failed", error: "无法识别视频时长" }); done(); return }
      const effH = meta.height
      let vf = ""
      if (resolutionCap && effH > resolutionCap) vf = `scale=-2:${resolutionCap}`
      const totalKbps = (targetMB * 8192) / dur
      const audioKbps = meta.hasAudio ? (totalKbps >= 300 ? 96 : Math.max(24, Math.floor(totalKbps / 3))) : 0
      const headroom = precise ? 0.985 : 0.9
      const videoKbps = Math.max(Math.round((totalKbps - audioKbps) * headroom), 60)
      const base = ["-y", "-nostdin", "-i", inPath]
      const videoOpts = ["-c:v", "libx264", "-preset", "veryfast", "-b:v", `${videoKbps}k`, "-pix_fmt", "yuv420p"]
      if (vf) videoOpts.unshift("-vf", vf)
      const audioOpts = audioKbps > 0 ? ["-c:a", "aac", "-b:a", `${audioKbps}k`] : []
      const args = precise
        ? [...base, ...videoOpts, "-pass", "1", "-an", "-f", "mp4", path.join(UPLOAD_DIR, `p1_${jobId}.mp4`), ...base, ...videoOpts, "-pass", "2", ...audioOpts, "-movflags", "+faststart", "-f", "mp4", outPath]
        : [...base, ...videoOpts, ...audioOpts, "-movflags", "+faststart", "-f", "mp4", outPath]
      const ffmpegExe = FFMPEG_PATHS.find((p) => p) || "ffmpeg"
      setJob(jobId, { status: "running", progress: 0, videoKbps, audioKbps, duration: dur, width: meta.width, height: meta.height, hasAudio: meta.hasAudio })
      let stderr = ""
      const p = spawn(ffmpegExe, args, { stdio: ["ignore", "pipe", "pipe"] })
      activeProc = p
      p.stderr.on("data", (data) => {
        stderr += data.toString()
        const txt = data.toString()
        const m = txt.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (m && dur > 0) {
          const t = parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3])
          const prog = Math.min(99, Math.max(1, Math.round((t / dur) * 100)))
          setJob(jobId, { progress: prog })
        }
      })
      p.on("close", (code) => {
        activeProc = null
        const pass1 = path.join(UPLOAD_DIR, `p1_${jobId}.mp4`)
        if (fs.existsSync(pass1)) fs.unlinkSync(pass1)
        cleanup(inPath)
        if ((getJob(jobId) || {}).status === "cancelled") { done(); return }
        if (code !== 0) {
          const tail = stderr.slice(-300).replace(/\r?\n/g, " ")
          setJob(jobId, { status: "failed", progress: 0, error: `ffmpeg 退出码 ${code}: ${tail}` })
          done()
          return
        }
        const outSize = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0
        setJob(jobId, { status: "done", progress: 100, outName, outSize })
        done()
      })
      p.on("error", (e) => {
        activeProc = null
        cleanup(inPath)
        setJob(jobId, { status: "failed", error: e.message })
        done()
      })
    })
    .catch((e) => { cleanup(inPath); setJob(jobId, { status: "failed", error: e.message }); done() })
}

app.get("/api/progress/:id", (req, res) => {
  const j = getJob(req.params.id)
  if (!j) return res.status(404).json({ error: "任务不存在" })
  res.json(j)
})

app.get("/api/download/:id", (req, res) => {
  const job = getJob(req.params.id)
  if (!job || job.status !== "done") return res.status(404).json({ error: "任务未完成" })
  const file = path.join(OUTPUT_DIR, job.outName)
  if (!fs.existsSync(file)) return res.status(404).json({ error: "文件不存在" })
  const originalName = job.originalName || "video.mp4"
  // 输出文件保留，供刷新页面后再次下载；清理统一由 DELETE /api/jobs/:id 处理
  res.download(file, originalName)
})

app.post("/api/cancel/:id", (req, res) => {
  const job = getJob(req.params.id)
  if (job) cancelJob(req.params.id)
  res.json({ ok: true })
})

app.delete("/api/jobs/:id", (req, res) => {
  const job = getJob(req.params.id)
  if (job) {
    // 仍在排队/编码中的任务先取消（杀进程、移出队列、删输入文件）
    cancelJob(req.params.id)
    // 历史任务记录可能缺失 outName（旧版本覆盖写入导致），缺省时不能让 path.join 崩掉
    if (job.outName) {
      const out = path.join(OUTPUT_DIR, job.outName)
      if (fs.existsSync(out)) fs.unlinkSync(out)
    }
    removeJob(req.params.id)
  }
  res.json({ ok: true })
})

function cleanup(...paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p)
    } catch (e) { /* noop */ }
  }
}

app.listen(PORT, () => {
  console.log(`[compress-server] listening on http://localhost:${PORT}`)
})
