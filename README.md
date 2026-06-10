# 📱 视频下载器

一个强大的视频下载工具，支持抖音、TikTok、YouTube。

## ✨ 功能特点

- 🎵 支持 TikTok 视频/图集/音频
- 📱 支持抖音视频（需服务器版本）
- 📺 支持 YouTube 视频（需服务器版本）
- 🎨 炫酷的界面动画
- 📱 手机端完美适配
- 🔍 智能链接识别
- ⚡ 视频预览播放
- 🎬 画中画模式
- 🚀 批量下载支持

## 🌐 在线体验

访问：[点击这里使用在线版](https://你的用户名.github.io/video-downloader/online.html)

> 在线版仅支持 TikTok，完整功能需要本地部署

## 🖥️ 本地使用（支持所有平台）

### 前置要求
- Node.js 18+
- yt-dlp
- ffmpeg（可选，用于高清合并）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/你的用户名/video-downloader.git
cd video-downloader
```

2. **安装 yt-dlp**
```bash
# Windows (使用 winget)
winget install yt-dlp

# Mac
brew install yt-dlp

# Linux
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

3. **启动服务器**
```bash
node server.js
```

4. **访问**
```
http://localhost:3000
```

### 手机访问（同WiFi）

1. 查看电脑IP地址
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. 手机浏览器打开
```
http://电脑IP:3000
```

## 📖 使用说明

### 下载 TikTok 视频
1. 打开 TikTok，复制分享链接
2. 粘贴到输入框
3. 点击"解析"
4. 点击"下载视频"

### 下载抖音视频（需本地服务器）
1. 打开抖音，复制分享内容（可以包含文字）
2. 粘贴到输入框
3. 自动识别链接并解析
4. 点击"下载视频"

### 批量下载
1. 点击"批量解析"
2. 每行粘贴一个链接
3. 点击"批量解析全部"

## 🎨 界面预览

- 炫酷的渐变动画
- 玻璃态毛玻璃效果
- 流畅的交互体验
- 响应式设计

## 📂 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 完整版前端（炫酷界面） |
| `server.js` | Node.js 后端服务器 |
| `online.html` | 纯前端在线版 |
| `mobile.html` | 手机优化版 |
| `package.json` | Node.js 配置 |

## 🌟 部署到云端

详细部署教程请查看 [DEPLOY.md](DEPLOY.md)

### 免费部署选项
- ✅ GitHub Pages（纯前端版）
- ✅ Render.com（完整版）
- ✅ Vercel（有限制）
- ✅ Railway（$5免费额度）

## ⚠️ 注意事项

1. 请遵守视频平台的服务条款
2. 下载的视频仅供个人学习使用
3. 不要用于商业用途
4. 尊重原创作者版权

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

MIT License

## 💬 联系方式

如有问题，请提交 Issue。

---

⭐ 如果觉得有用，请给个 Star！
