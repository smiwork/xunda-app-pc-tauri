#!/bin/bash
###
 # @Author: “chenbaolong”
 # @Date: 2026-01-17 19:19:10
 # @LastEditors: “chenbaolong”
 # @LastEditTime: 2026-01-17 19:36:19
 # @Description: 创建直接分发版本
### 

echo "=== 创建直接分发版本 ==="

# 1. 定义路径
APP_PATH="./src-tauri/target/x86_64-apple-darwin/release/bundle/macos/快销客V2.0.app"
PKG_NAME="kxkapp-appstore.pkg"


# 1. 检查可用的证书
echo "1. 检查证书..."
if security find-identity -v | grep -q "Developer ID Application"; then
    echo "✅ 找到Developer ID Application证书"
    APP_CERT=$(security find-identity -v | grep "Developer ID Application.*HFP5W9KJYY" | head -1 | cut -d'"' -f2)
    echo "   使用: $APP_CERT"
else
    echo "❌ 未找到Developer ID Application证书"
    echo "   请到Apple开发者网站创建: Developer ID Application证书"
    exit 1
fi

if security find-identity -v | grep -q "Developer ID Installer"; then
    echo "✅ 找到Developer ID Installer证书"
    INSTALLER_CERT=$(security find-identity -v | grep "Developer ID Installer.*HFP5W9KJYY" | head -1 | cut -d'"' -f2)
    echo "   使用: $INSTALLER_CERT"
else
    echo "❌ 未找到Developer ID Installer证书"
    echo "   请到Apple开发者网站创建: Developer ID Installer证书"
    exit 1
fi

# 2. 重新签名应用
echo -e "\n2. 重新签名应用..."
# 移除原有签名
codesign --remove-signature "$APP_PATH" 2>/dev/null

# 使用Developer ID重新签名
codesign --force --deep \
  --sign "$APP_CERT" \
  --options runtime \
  --timestamp \
  "$APP_PATH"

# 验证签名
codesign -dv --verbose=4 "$APP_PATH"

# 3. 创建新的pkg
echo -e "\n3. 创建新的安装包..."
xcrun productbuild \
  --component "$APP_PATH" \
  /Applications \
  --sign "$INSTALLER_CERT" \
  --timestamp \
  $PKG_NAME

echo -e "\n✅ 创建完成: kxkapp_direct.pkg"
echo "   现在可以尝试安装这个版本"