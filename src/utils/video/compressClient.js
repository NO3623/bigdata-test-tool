const BASE = "http://localhost:3001"
const TIMEOUT = 30000

function fetchWithTimeout(url, opts = {}) {
  const ac = new AbortController()
  const id = setTimeout(() => ac.abort(), TIMEOUT)
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(id))
}

function fmtBytes(n) {
  if (!n && n !== 0) return ""
  if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB"
  if (n >= 1048576) return (n / 1048576).toFixed(1) + " MB"
  if (n >= 1024) return (n / 1024).toFixed(0) + " KB"
  return n + " B"
}

function isVideoType(file) {
  return (
    /^video\//i.test(file && file.type) ||
    /\.(mp4|m4v|mov|webm|mkv|avi|flv|wmv|ts|mts|m2ts|3gp|3g2|mpeg|mpg|vob|ogv|f4v|mxf)$/i.test(
      (file && file.name) || ""
    )
  )
}

async function checkFfmpeg() {
  try {
    const r = await fetch(`${BASE}/api/check`)
    const j = await r.json()
    return j.ok
  } catch {
    return false
  }
}

async function compress(file, settings, { onProgress } = {}) {
  const form = new FormData()
  form.append("video", file)
  form.append("originalName", file.name)
  form.append("targetMB", String(settings.targetMB))
  form.append("mode", settings.mode)
  form.append("ratioLevel", String(settings.ratioLevel))
  form.append("resolutionCap", String(settings.resolutionCap))
  form.append("precise", String(settings.precise))

  const r = await fetch(`${BASE}/api/compress`, {
    method: "POST",
    body: form
  })
  const json = await r.json()
  if (!r.ok || json.error) throw new Error(json.error || "上传失败")

  const { jobId } = json

  while (true) {
    const r = await fetchWithTimeout(`${BASE}/api/progress/${jobId}`)
    const j = await r.json()
    if (j.status === "done") {
      onProgress?.(100)
      return { jobId, outName: j.outName, outSize: j.outSize }
    }
    if (j.status === "failed") throw new Error(j.error || "编码失败")
    if (typeof j.progress === "number") {
      onProgress?.(j.progress)
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

async function downloadJob(jobId) {
  const r = await fetch(`${BASE}/api/download/${jobId}`)
  if (!r.ok) throw new Error("下载失败")
  const blob = await r.blob()
  return blob
}

async function removeJob(jobId) {
  await fetch(`${BASE}/api/jobs/${jobId}`, { method: "DELETE" })
}

async function listJobs() {
  const r = await fetch(`${BASE}/api/jobs`)
  if (!r.ok) return []
  return r.json()
}

async function probe(file) {
  const form = new FormData()
  form.append("video", file)
  const r = await fetch(`${BASE}/api/probe`, { method: "POST", body: form })
  if (!r.ok) throw new Error("无法识别媒体信息")
  return r.json()
}

export { compress, downloadJob, removeJob, checkFfmpeg, probe, listJobs, fmtBytes, isVideoType }
