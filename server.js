/**
 * 本地视频下载服务 - 完全运行在你自己的电脑上
 * 仅依赖 Node.js 内置模块 + yt-dlp，无任何第三方网站、无 npm 依赖
 */
const http = require("http");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = 3000;
const TMP_DIR = path.join(__dirname, "tmp");

// ===== 简单的内存缓存（提升重复查询速度）=====
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL
  });
  // 限制缓存大小
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// ===== 定位 ffmpeg（用于合并高清流 / 转 MP3）=====
let FFMPEG_DIR = null;
function locateFfmpeg() {
  // 1. 先看 PATH 里有没有
  // 2. 再扫描 winget 安装目录
  const candidates = [];
  const wingetBase = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
  try {
    if (fs.existsSync(wingetBase)) {
      for (const dir of fs.readdirSync(wingetBase)) {
        if (dir.toLowerCase().includes("ffmpeg")) {
          const found = findFile(path.join(wingetBase, dir), "ffmpeg.exe", 4);
          if (found) candidates.push(path.dirname(found));
        }
      }
    }
  } catch (_) {}
  if (candidates.length) FFMPEG_DIR = candidates[0];
}

function findFile(dir, name, depth) {
  if (depth < 0) return null;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return null; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile() && e.name.toLowerCase() === name.toLowerCase()) return full;
    if (e.isDirectory()) {
      const sub = findFile(full, name, depth - 1);
      if (sub) return sub;
    }
  }
  return null;
}

locateFfmpeg();

// 把 ffmpeg 路径注入到子进程的 PATH 中
function childEnv() {
  if (!FFMPEG_DIR) return process.env;
  return { ...process.env, PATH: FFMPEG_DIR + path.delimiter + (process.env.PATH || "") };
}

// ===== 启动时检查 yt-dlp 是否可用 =====
execFile("yt-dlp", ["--version"], (err, stdout) => {
  if (err) {
    console.error("\n❌ 未检测到 yt-dlp，请先安装：https://github.com/yt-dlp/yt-dlp\n");
  } else {
    console.log(`   yt-dlp 版本: ${stdout.trim()}`);
    console.log(`   ffmpeg: ${FFMPEG_DIR ? "已找到 ✓" : "未找到（高清合并/MP3 可能受限）"}`);
  }
});

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = reqUrl.pathname;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (pathname === "/api/youtube/info") {
    return handleInfo(reqUrl, res);
  }
  if (pathname === "/api/youtube/download") {
    return handleDownload(reqUrl, res);
  }
  if (pathname === "/api/douyin/info") {
    return handleDouyinInfo(reqUrl, res);
  }
  if (pathname === "/api/douyin/download") {
    return handleDouyinDownload(reqUrl, res);
  }

  // 静态文件（前端页面）
  return serveStatic(pathname, res);
});

// ===== 获取视频信息 =====
function handleInfo(reqUrl, res) {
  const url = reqUrl.searchParams.get("url");
  if (!url) return sendJson(res, 400, { error: "缺少 url 参数" });

  execFile(
    "yt-dlp",
    ["--dump-json", "--no-playlist", "--no-warnings", url],
    { maxBuffer: 20 * 1024 * 1024, env: childEnv() },
    (err, stdout, stderr) => {
      if (err) {
        console.error("解析失败:", stderr || err.message);
        return sendJson(res, 500, { error: "解析失败: " + cleanErr(stderr || err.message) });
      }
      try {
        const info = JSON.parse(stdout);
        const heights = [4320, 2160, 1440, 1080, 720, 480, 360, 240];
        const available = new Set((info.formats || []).filter(f => f.vcodec !== "none" && f.height).map(f => f.height));
        const options = [];
        for (const h of heights) {
          if ([...available].some(a => a >= h - 50 && a <= h + 50) || available.has(h)) {
            options.push({
              label: `${h >= 2160 ? (h >= 4320 ? "8K" : "4K") : h + "p"} MP4`,
              format: `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`,
            });
          }
        }
        options.push({ label: "仅音频 MP3", format: "bestaudio/best", audioOnly: true });

        sendJson(res, 200, {
          title: info.title,
          author: info.uploader || info.channel,
          thumbnail: info.thumbnail,
          duration: info.duration,
          downloadOptions: options,
        });
      } catch (e) {
        sendJson(res, 500, { error: "解析返回数据失败" });
      }
    }
  );
}

// ===== 获取抖音视频信息 =====
function handleDouyinInfo(reqUrl, res) {
  const url = reqUrl.searchParams.get("url");
  if (!url) return sendJson(res, 400, { error: "缺少 url 参数" });

  // 检查缓存
  const cacheKey = `douyin:${url}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[缓存命中] 抖音: ${url}`);
    return sendJson(res, 200, cached);
  }

  console.log(`[解析中] 抖音: ${url}`);

  execFile(
    "yt-dlp",
    ["--dump-json", "--no-playlist", "--no-warnings", "--socket-timeout", "10", url],
    { maxBuffer: 20 * 1024 * 1024, env: childEnv(), timeout: 30000 },
    (err, stdout, stderr) => {
      if (err) {
        console.error("抖音解析失败:", stderr || err.message);
        return sendJson(res, 500, { error: "抖音解析失败: " + cleanErr(stderr || err.message) });
      }
      try {
        const info = JSON.parse(stdout);
        const result = {
          title: info.title || info.description || "抖音视频",
          author: info.uploader || info.creator || "未知作者",
          thumbnail: info.thumbnail,
          url: info.url || info.webpage_url,
          originalUrl: url,
          webpage_url: info.webpage_url,
          duration: info.duration,
        };

        // 保存到缓存
        setCache(cacheKey, result);
        console.log(`[解析成功] 抖音: ${result.title}`);

        sendJson(res, 200, result);
      } catch (e) {
        console.error("解析抖音返回数据失败:", e);
        sendJson(res, 500, { error: "解析返回数据失败" });
      }
    }
  );
}

// ===== 下载抖音视频 =====
function handleDouyinDownload(reqUrl, res) {
  const url = reqUrl.searchParams.get("url");
  if (!url) return sendJson(res, 400, { error: "缺少 url 参数" });

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
  const base = path.join(TMP_DIR, `douyin_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const outTpl = base + ".%(ext)s";

  execFile("yt-dlp", ["--print", "%(title)s", "--no-playlist", "--no-warnings", url], { env: childEnv() }, (e, titleOut) => {
    const title = sanitize((titleOut || "douyin_video").trim()) || "douyin_video";

    const ffmpegArg = FFMPEG_DIR ? ["--ffmpeg-location", FFMPEG_DIR] : [];
    const args = ["-f", "best", "--merge-output-format", "mp4", ...ffmpegArg, "-o", outTpl, "--no-playlist", "--no-warnings", url];

    console.log(`[下载中] 抖音: ${title}`);

    execFile("yt-dlp", args, { maxBuffer: 50 * 1024 * 1024, env: childEnv() }, (err, stdout, stderr) => {
      if (err) {
        console.error("抖音下载失败:", stderr || err.message);
        return sendJson(res, 500, { error: "下载失败: " + cleanErr(stderr || err.message) });
      }
      const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(path.basename(base)));
      if (!files.length) return sendJson(res, 500, { error: "下载完成但找不到文件" });

      const filePath = path.join(TMP_DIR, files[0]);
      const ext = path.extname(files[0]);
      const dlName = `${title}${ext}`;

      console.log(`[完成] ${dlName}`);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(dlName)}`);
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", fs.statSync(filePath).size);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      const cleanup = () => { try { fs.unlinkSync(filePath); } catch (_) {} };
      stream.on("end", cleanup);
      stream.on("error", () => { cleanup(); if (!res.headersSent) sendJson(res, 500, { error: "文件读取失败" }); });
    });
  });
}

// ===== 下载并返回文件流 =====
function handleDownload(reqUrl, res) {
  const url = reqUrl.searchParams.get("url");
  const format = reqUrl.searchParams.get("format") || "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best";
  const audioOnly = reqUrl.searchParams.get("audioOnly") === "true";

  if (!url) return sendJson(res, 400, { error: "缺少 url 参数" });

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
  const base = path.join(TMP_DIR, `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const outTpl = base + ".%(ext)s";

  // 先取标题作为文件名
  execFile("yt-dlp", ["--print", "%(title)s", "--no-playlist", "--no-warnings", url], { env: childEnv() }, (e, titleOut) => {
    const title = sanitize((titleOut || "video").trim()) || "video";

    const ffmpegArg = FFMPEG_DIR ? ["--ffmpeg-location", FFMPEG_DIR] : [];
    const args = audioOnly
      ? ["-x", "--audio-format", "mp3", ...ffmpegArg, "-o", outTpl, "--no-playlist", "--no-warnings", url]
      : ["-f", format, "--merge-output-format", "mp4", ...ffmpegArg, "-o", outTpl, "--no-playlist", "--no-warnings", url];

    console.log(`[下载中] ${title} ${audioOnly ? "(音频)" : ""}`);

    execFile("yt-dlp", args, { maxBuffer: 50 * 1024 * 1024, env: childEnv() }, (err, stdout, stderr) => {
      if (err) {
        console.error("下载失败:", stderr || err.message);
        return sendJson(res, 500, { error: "下载失败: " + cleanErr(stderr || err.message) });
      }
      const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(path.basename(base)));
      if (!files.length) return sendJson(res, 500, { error: "下载完成但找不到文件" });

      const filePath = path.join(TMP_DIR, files[0]);
      const ext = path.extname(files[0]);
      const dlName = `${title}${ext}`;

      console.log(`[完成] ${dlName}`);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(dlName)}`);
      res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
      res.setHeader("Content-Length", fs.statSync(filePath).size);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      const cleanup = () => { try { fs.unlinkSync(filePath); } catch (_) {} };
      stream.on("end", cleanup);
      stream.on("error", () => { cleanup(); if (!res.headersSent) sendJson(res, 500, { error: "文件读取失败" }); });
    });
  });
}

// ===== 静态文件 =====
function serveStatic(pathname, res) {
  let file = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.join(__dirname, file);
  if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath)) {
    res.writeHead(404); return res.end("Not Found");
  }
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript" };
  res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

// ===== 工具 =====
function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
function sanitize(name) { return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 120); }
function cleanErr(msg) { return String(msg).replace(/\n/g, " ").slice(0, 200); }

server.listen(PORT, () => {
  console.log(`\n✅ 你的视频下载器已启动`);
  console.log(`   浏览器会自动打开 http://localhost:${PORT}`);
  console.log(`   关闭此窗口即可停止服务\n`);
});
