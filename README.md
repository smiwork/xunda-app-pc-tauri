<!--
 * @Author: “chenbaolong”
 * @Date: 2025-11-12 12:24:58
 * @LastEditors: “chenbaolong”
 * @LastEditTime: 2025-11-13 13:39:40
 * @Description: 
 * 
-->
## xunda-app-pc-build 

 

## 2. 为应用生成图标

```bash
#https://tauri.app/zh-cn/v1/guides/features/icons
pnpm  run tauri:build-icon
```

## 3. 配置 updater 更新插件
wiki:https://v2.tauri.app/zh-cn/plugin/updater/
```bash
## 安装 Tauri 更新插件开始
pnpm tauri add updater

# 在 src-tauri/tauri.conf.json 中配置 updater 插件，主要涉及以下设置
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://your-update-server.com/updates/{{target}}/{{current_version}}"
      ],
      "createUpdaterArtifacts": true
    }
  }
}
# pubkey:必填。从 Tauri CLI 生成的公钥字符串（不是文件路径）
```


### 生成与配置签名密钥

#### 1.生成密钥对：在 src-tauri 目录下运行以下命令生成密钥
```bash
tauri signer generate -w .tauri/kxkpcapp.key
```
此命令会生成一个私钥文件（kxkpcapp.key）和一个公钥文件（kxkpcapp.key.pub）。

#### 2.配置环境变量：
构建应用时，需要让 Tauri 知道私钥的位置。

- 设置 TAURI_PRIVATE_KEY 环境变量，其值为私钥文件的内容。
- 如果私钥有密码，还需设置 TAURI_KEY_PASSWORD。

#### 3.设置公钥：
将公钥文件（.pub 文件）中的全部内容，复制到 tauri.conf.json 配置中的 pubkey 字段。


### 更新服务器与响应格式
你需要一个服务器来提供更新信息。Tauri 支持两种方式：静态 JSON 文件 或 动态更新服务器。

静态 JSON 响应示例
如果你的更新信息托管在 GitHub Gist 或对象存储服务上，服务器需要返回如下格式的 JSON

```json
{
  "version": "1.0.1",
  "notes": "修复了已知问题，提升了稳定性。",
  "pub_date": "2024-06-05T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "CONTENT_OF_.sig_FILE",
      "url": "https://your-server.com/path/to/your-app-setup.nsis.zip"
    },
    "darwin-x86_64": {
      "signature": "CONTENT_OF_.sig_FILE",
      "url": "https://your-server.com/path/to/your-app.app.tar.gz"
    }
  }
}
```

重要提示：
- signature 字段的值是 Tauri 构建生成的 .sig 签名文件的内容，而不是文件路径。

- pub_date 必须遵循 RFC 3339 格式。


### 前端与 Rust 端代码示例
配置好后，你可以在前端或 Rust 后端中调用更新逻辑。

#### 1.前端 JavaScript/TypeScript
你可以使用 @tauri-apps/plugin-updater 包来检查并安装更新

```javascript
import { checkUpdate, installUpdate } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function updateApp() {
  try {
    // 检查是否有更新
    const update = await checkUpdate();
    
    if (update.available) {
      // 询问用户是否安装更新
      const userConsent = confirm(`发现新版本 ${update.version}！是否立即更新？`);
      if (userConsent) {
        // 下载并安装更新
        await installUpdate();
        // 安装完成后，重启应用
        await relaunch();
      }
    } else {
      alert('当前已是最新版本！');
    }
  } catch (error) {
    console.error('更新检查失败:', error);
    alert('检查更新时出现错误。');
  }
}

// 在适当的地方调用此函数，例如设置页面中的一个按钮点击事件
```


#### 2.Rust 后端
你也可以在 Rust 代码中直接与 updater 插件交互。
```rust
// 在 src-tauri/src/lib.rs 或相关文件中
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
async fn check_for_update(app: tauri::AppHandle) -> Result<String, String> {
  match app.updater().unwrap().check().await {
    Ok(Some(update)) => {
      // 有更新可用，可以通知前端
      update.download_and_install().await.map_err(|e| e.to_string())?;
      // 安装后，你可以选择重启应用，这通常需要前端配合
      Ok("更新已安装，请重启应用。".into())
    },
    Ok(None) => {
      Ok("当前已是最新版本。".into())
    },
    Err(e) => {
      Err(format!("检查更新时出错: {}", e))
    }
  }
}

// 别忘了在 main.rs 或 lib.rs 中注册这个命令
```

### 关键注意事项
- 密钥安全：私钥（*.key 文件）绝不能泄露。公钥会打包到应用中，用于验证更新。

- HTTPS 要求：生产环境的更新端点（endpoints）必须使用 HTTPS。如果必须在开发环境下使用 HTTP，可以配置 dangerousInsecureTransportProtocol 为 true，但务必谨慎。

- 版本管理：每次发布新版本前，务必更新 tauri.conf.json 中的 version 字段，并确保更新服务器返回的 version 高于当前版本。

- 插件引入：确保你已在 Cargo.toml 中添加了 tauri-plugin-updater 依赖，并在应用初始化时注册了该插件。


### 打包应用程序
```json

{
  "nsis": {
        "languages": ["SimpChinese"],
        "installerIcon": "icons/icon.ico",
        "installMode": "both",
        "minimumWebview2Version": "109.0.1518.78",
        "headerImage":"assets/imgs/header150x57.png",
        "sidebarImage":"assets/imgs/sidebar164x364.jpg"  
      }
}
```