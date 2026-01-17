#!/bin/bash
###
 # @Author: “chenbaolong”
 # @Date: 2026-01-17 19:19:10
 # @LastEditors: “chenbaolong”
 # @LastEditTime: 2026-01-17 19:34:49
 # @Description: 创建AppStore发布版本
 # 
### 

# 1. 定义路径
APP_PATH="./src-tauri/target/x86_64-apple-darwin/release/bundle/macos/快销客V2.0.app"
PKG_NAME="kxkapp-appstore.pkg"

# 2. 验证应用文件
if [ ! -d "$APP_PATH" ]; then
    echo "❌ 错误：找不到应用文件 $APP_PATH"
    exit 1
fi

echo "✅ 应用文件存在：$APP_PATH"
echo "   大小：$(du -sh "$APP_PATH" | cut -f1)"

# 3. 检查可用证书
echo -e "\n🔍 检查可用证书："
CERT_TYPE=""
if security find-identity -v | grep -q "Developer ID Installer.*HFP5W9KJYY"; then
    CERT_TYPE="Developer ID Installer"
elif security find-identity -v | grep -q "3rd Party Mac Developer Installer.*HFP5W9KJYY"; then
    CERT_TYPE="3rd Party Mac Developer Installer"
elif security find-identity -v | grep -q "Apple Distribution.*HFP5W9KJYY"; then
    CERT_TYPE="Apple Distribution"
fi

if [ -n "$CERT_TYPE" ]; then
    echo "✅ 找到证书：$CERT_TYPE"
else
    echo "⚠️  未找到合适的证书，将创建未签名的pkg"
fi

# 4. 打包
echo -e "\n📦 开始打包..."
if [ "$CERT_TYPE" = "Developer ID Installer" ]; then
    # 使用Developer ID Installer（最佳选择）
    xcrun productbuild \
      --sign "Developer ID Installer: BaoLong CHEN (HFP5W9KJYY)" \
      --component "$APP_PATH" \
      /Applications \
      "$PKG_NAME"
    echo "✅ 已创建Developer ID签名的pkg：$PKG_NAME"
elif [ "$CERT_TYPE" = "3rd Party Mac Developer Installer" ]; then
    # 如果你确实要发布到Mac App Store才用这个
    echo "⚠️  注意：3rd Party Mac Developer Installer证书仅用于Mac App Store"
    xcrun productbuild \
      --sign "3rd Party Mac Developer Installer: BaoLong CHEN (HFP5W9KJYY)" \
      --component "$APP_PATH" \
      /Applications \
      "$PKG_NAME"
    echo "✅ 已创建Mac App Store签名的pkg：$PKG_NAME"
else
    # 不签名（仅用于测试）
    xcrun productbuild \
      --component "$APP_PATH" \
      /Applications \
      "$PKG_NAME"
    echo "✅ 已创建未签名的pkg：$PKG_NAME"
    echo "⚠️  注意：未签名的pkg无法公证，用户安装时会收到警告"
fi

# 5. 验证
echo -e "\n🔎 验证pkg文件："
ls -lh "$PKG_NAME"
pkgutil --check-signature "$PKG_NAME" 2>/dev/null || echo "pkg未签名"