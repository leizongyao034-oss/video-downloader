@echo off
chcp 65001 >nul
title 我的视频下载器
echo.
echo   正在启动你的视频下载器...
echo.
cd /d "%~dp0"
start "" http://localhost:3000
node server.js
pause
