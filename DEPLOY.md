# 📱 视频下载器 - 部署指南

## 🚀 快速部署到 GitHub Pages（5分钟）

### 步骤1：准备文件
确保你有 `online.html` 文件

### 步骤2：创建GitHub仓库
1. 访问 https://github.com/new
2. 仓库名：`video-downloader`
3. 选择 Public
4. 点击 "Create repository"

### 步骤3：上传文件
```bash
# 方法1：通过网页上传
1. 点击 "uploading an existing file"
2. 拖拽 online.html 文件
3. 点击 "Commit changes"

# 方法2：通过命令行
cd C:\Users\JQA48251\Desktop\tt
git init
git add online.html
git commit -m "初始提交"
git branch -M main
git remote add origin https://github.com/你的用户名/video-downloader.git
git push -u origin main
```

### 步骤4：启用 GitHub Pages
1. 进入仓库 → Settings → Pages
2. Source 选择：`main` 分支
3. 点击 Save
4. 等待1-2分钟

### 步骤5：访问你的网站
```
https://你的用户名.github.io/video-downloader/online.html
```

### 🎉 完成！
现在你可以：
- 在任何设备访问这个网址
- 添加到手机桌面快捷方式
- 分享给朋友使用

---

## 🌟 部署到 Render（支持抖音）

### 前置要求
- GitHub账号
- 项目需要包含：
  - `package.json`
  - `server.js`
  - `index.html`

### 步骤1：准备 package.json
在项目根目录创建 `package.json`：

```json
{
  "name": "video-downloader",
  "version": "1.0.0",
  "description": "视频下载器",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {}
}
```

### 步骤2：推送到GitHub
```bash
git add .
git commit -m "准备部署"
git push
```

### 步骤3：在 Render 部署
1. 访问 https://render.com
2. 注册/登录
3. 点击 "New +" → "Web Service"
4. 连接 GitHub 仓库
5. 配置：
   - Name: `video-downloader`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: `Free`
6. 点击 "Create Web Service"

### 步骤4：安装 yt-dlp
在 Render 控制台执行：
```bash
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /opt/render/project/src/yt-dlp
chmod +x /opt/render/project/src/yt-dlp
```

### 步骤5：访问
```
https://你的服务名.onrender.com
```

---

## 📱 添加到手机桌面

### iOS Safari
1. 访问你的网站
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 命名并添加

### Android Chrome
1. 访问你的网站
2. 点击菜单（三个点）
3. 选择"添加到主屏幕"
4. 确认添加

---

## ❓ 常见问题

### Q: GitHub Pages 部署后打不开？
A: 等待1-2分钟，GitHub需要时间生成页面

### Q: Render 冷启动很慢？
A: 免费版15分钟无活动会休眠，第一次访问需要30秒启动

### Q: 如何更新网站？
A: 推送新代码到GitHub，会自动重新部署

### Q: 抖音还是解析失败？
A: 免费服务器可能性能不足，建议使用本地服务器

---

## 💡 推荐配置

**纯前端版（online.html）：**
- ✅ GitHub Pages
- ✅ Vercel
- ✅ Netlify

**完整版（带后端）：**
- ✅ Render（最推荐）
- ✅ Railway
- ✅ Fly.io

---

## 🔗 有用的链接

- [GitHub Pages 文档](https://pages.github.com/)
- [Render 文档](https://render.com/docs)
- [Vercel 文档](https://vercel.com/docs)

---

祝你部署顺利！🎉
