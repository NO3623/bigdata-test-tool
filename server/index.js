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
  fs.writeFileSync(path.join(JOBS_DIR, `${id}.json`), JSON.stringify(data))
}
function getJob(id) {
  const f = path.join(JOBS_DIR, `${id}.json`)
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : null
}
function removeJob(id) {
  const f = path.join(JOBS_DIR, `${id}.json`)
  if (fs.existsSync(f)) fs.unlinkSync(f)
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
    setImmediate(() => processJob(jobId, file.path, outPath, { targetMB, mode, ratioLevel, resolutionCap, precise, outName }))
  })
})

function processJob(jobId, inPath, outPath, opts) {
  const { targetMB, mode, ratioLevel, resolutionCap, precise, outName } = opts
  ffprobe(inPath)
    .then((meta) => {
      const dur = meta.duration
      if (!dur || dur <= 0) { cleanup(inPath); setJob(jobId, { status: "failed", error: "无法识别视频时长" }); return }
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
      setJob(jobId, { status: "running", progress: 0, targetMB, videoKbps, audioKbps, duration: dur, width: meta.width, height: meta.height })
      let stderr = ""
      const p = spawn(ffmpegExe, args, { stdio: ["ignore", "pipe", "pipe"] })
      p.stderr.on("data", (data) => {
        stderr += data.toString()
        const txt = data.toString()
        const m = txt.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (m && dur > 0) {
          const t = parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3])
          const prog = Math.min(99, Math.max(1, Math.round((t / dur) * 100)))
          setJob(jobId, { ...getJob(jobId), progress: prog })
        }
      })
      p.on("close", (code) => {
        const pass1 = path.join(UPLOAD_DIR, `p1_${jobId}.mp4`)
        if (fs.existsSync(pass1)) fs.unlinkSync(pass1)
        cleanup(inPath)
        if (code !== 0) {
          const tail = stderr.slice(-300).replace(/\r?\n/g, " ")
          setJob(jobId, { status: "failed", progress: 0, error: `ffmpeg 退出码 ${code}: ${tail}` })
          return
        }
        const outSize = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0
        setJob(jobId, { status: "done", progress: 100, outName, outSize })
      })
      p.on("error", (e) => { cleanup(inPath); setJob(jobId, { status: "failed", error: e.message }) })
    })
    .catch((e) => { cleanup(inPath); setJob(jobId, { status: "failed", error: e.message }) })
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
  const downloadName = originalName
  res.download(file, downloadName, () => {
    setTimeout(() => cleanup(file), 60000)
  })
})

app.delete("/api/jobs/:id", (req, res) => {
  const job = getJob(req.params.id)
  if (job) {
    const out = path.join(OUTPUT_DIR, job.outName)
    if (fs.existsSync(out)) fs.unlinkSync(out)
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
