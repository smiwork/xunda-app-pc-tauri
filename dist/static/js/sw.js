/*
 * @Author: cnb.bwnr4ZYGAGA
 * @Date: 2026-02-03 17:48:20
 * @LastEditors: cnb.bwnr4ZYGAGA
 * @LastEditTime: 2026-02-04 09:24:19
 * @Description:注册 Service Worker
 *
 */
// sw.js - 增强版，带错误处理
const CACHE_NAME = 'pwa-cache-v1'
const CACHE_VERSION = 1

// 要缓存的文件列表
const CORE_ASSETS = [
    'index.html',
    'manifest.json',
    'favicon.ico'
]

// 可选缓存的文件（缓存失败不影响安装）
const OPTIONAL_ASSETS = [
]

self.addEventListener('install', (event) => {
    console.log(`[Service Worker] 安装 v${CACHE_VERSION}`)

    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(`${CACHE_NAME}-v${CACHE_VERSION}`)

                // 1. 首先缓存核心文件
                console.log('[Service Worker] 开始缓存核心文件...')
                const corePromises = CORE_ASSETS.map(async (url) => {
                    try {
                        const response = await fetch(url)
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${url}`)
                        }
                        await cache.put(url, response.clone())
                        console.log(`✅ 缓存成功: ${url}`)
                        return { url, success: true }
                    } catch (error) {
                        console.warn(`⚠️ 缓存失败: ${url}`, error.message)
                        return { url, success: false, error: error.message }
                    }
                })

                const coreResults = await Promise.all(corePromises)

                // 2. 检查核心文件是否都缓存成功
                const failedCore = coreResults.filter((r) => !r.success)
                if (failedCore.length > 0) {
                    console.warn(`部分核心文件缓存失败:`, failedCore.map((f) => f.url))

                    // 如果所有核心文件都失败，则安装失败
                    if (failedCore.length === CORE_ASSETS.length) {
                        throw new Error('所有核心文件缓存都失败了')
                    }
                }

                // 3. 尝试缓存可选文件（失败不影响安装）
                console.log('[Service Worker] 开始缓存可选文件...')
                const optionalPromises = OPTIONAL_ASSETS.map(async (url) => {
                    try {
                        const response = await fetch(url, {
                            // 添加超时控制
                            signal: AbortSignal.timeout(5000)
                        })

                        if (response.ok) {
                            await cache.put(url, response)
                            console.log(`✅ 可选文件缓存成功: ${url}`)
                            return { url, success: true }
                        } else {
                            console.log(`⏭️  跳过可选文件: ${url} (${response.status})`)
                            return { url, success: false, reason: `HTTP ${response.status}` }
                        }
                    } catch (error) {
                        console.log(`⏭️  跳过可选文件: ${url} (${error.name})`)
                        return { url, success: false, reason: error.name }
                    }
                })

                await Promise.all(optionalPromises)

                console.log(`[Service Worker] 安装完成 v${CACHE_VERSION}`)
                await self.skipWaiting()
            } catch (error) {
                console.error('[Service Worker] 安装失败:', error)
                // 可以在这里回退到旧的缓存或进行其他处理
            }
        })()
    )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 激活')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 删除不是当前版本的缓存
                    if (cacheName.startsWith(CACHE_NAME)
                        && !cacheName.includes(`-v${CACHE_VERSION}`)) {
                        console.log(`删除旧缓存: ${cacheName}`)
                        return caches.delete(cacheName)
                    }
                })
            )
        }).then(() => {
            console.log('[Service Worker] 现在控制所有客户端')
            return self.clients.claim()
        })
    )
})

// 获取请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求
    if (event.request.method !== 'GET') return

    // 跳过 Chrome 扩展
    if (event.request.url.startsWith('chrome-extension://')) return

    // 跳过非 HTTP/HTTPS 请求
    if (!event.request.url.startsWith('http')) return

    event.respondWith(
        (async () => {
            try {
                // 1. 首先尝试从缓存获取
                const cachedResponse = await caches.match(event.request)
                if (cachedResponse) {
                    console.log(`📦 从缓存返回: ${event.request.url}`)
                    return cachedResponse
                }

                // 2. 缓存没有，发起网络请求
                console.log(`🌐 从网络获取: ${event.request.url}`)
                const fetchResponse = await fetch(event.request)

                // 3. 检查响应是否有效
                if (!fetchResponse || fetchResponse.status !== 200) {
                    return fetchResponse
                }

                // 4. 缓存成功的响应（对于某些类型的文件）
                const responseToCache = fetchResponse.clone()
                const cache = await caches.open(`${CACHE_NAME}-v${CACHE_VERSION}`)

                // 只缓存同源的 HTML、CSS、JS 文件
                const url = new URL(event.request.url)
                if (url.origin === location.origin) {
                    const contentType = fetchResponse.headers.get('content-type')
                    const shouldCache
                        = event.request.url.includes('.html')
                        || event.request.url.includes('.css')
                        || event.request.url.includes('.js')
                        || (contentType && (
                            contentType.includes('text/html')
                            || contentType.includes('text/css')
                            || contentType.includes('application/javascript')
                        ))

                    if (shouldCache) {
                        cache.put(event.request, responseToCache).catch((error) => {
                            console.warn(`缓存响应失败: ${event.request.url}`, error)
                        })
                    }
                }

                return fetchResponse
            } catch (error) {
                console.error(`获取失败: ${event.request.url}`, error)

                // 如果是 HTML 请求，返回离线页面
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    const cache = await caches.open(`${CACHE_NAME}-v${CACHE_VERSION}`)
                    const offlinePage = await cache.match('/offline.html')
                    if (offlinePage) {
                        return offlinePage
                    }
                }

                // 返回一个简单的错误响应
                return new Response('网络连接失败，请检查网络设置', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain' }
                })
            }
        })()
    )
})
