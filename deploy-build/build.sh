#!/bin/bash
###
 # @Author: “chenbaolong”
 # @Date: 2026-01-17 20:57:38
 # @LastEditors: “chenbaolong”
 # @LastEditTime: 2026-01-17 21:26:42
 # @Description: 自动加载配置文件并生成应用
### 

# 1. 加载 .env 文件（如果存在）
if [ -f .env ]; then
    echo "🔧 加载 .env 文件"
    # 安全地加载 .env，不导出已存在的变量
    set -a
    source .env
    set +a
else
    echo "⚠️  警告: .env 文件不存在"
fi

# 2. 检查必要变量
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ 错误: 缺少必要环境变量"
    echo "请设置 APPLE_ID 和 APPLE_TEAM_ID"
    exit 1
fi

# 3. 条件处理密码
if [ -n "$APPLE_PASSWORD" ]; then
    echo "🔑 使用提供的密码"
elif [ -n "$APPLE_API_KEY" ] && [ -n "$APPLE_API_ISSUER" ]; then
    echo "🔑 使用 App Store Connect API 密钥"
else
    echo "❌ 错误: 未提供认证方式"
    echo "请设置 APPLE_PASSWORD 或 App Store Connect API 相关变量"
    exit 1
fi

# 4. 执行构建
echo "🚀 开始构建..."
# 检查是否安装了 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    echo "   安装命令: npm install -g pnpm"
    exit 1
fi

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 在当前目录未找到 package.json 文件"
    exit 1
fi

# 检查 src-tauri 目录是否存在
if [ ! -d "src-tauri" ]; then
    echo "❌ 在当前目录未找到 src-tauri 目录"
    echo "   请确保这是 Tauri 项目根目录"
    exit 1
fi

# 构建应用
echo "🔨 构建应用中..."
pnpm run tauri:prod

# 5. 检查构建结果
if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi