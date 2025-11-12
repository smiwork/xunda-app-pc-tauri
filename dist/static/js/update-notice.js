/*
 * @Author: “chenbaolong”
 * @Date: 2025-10-15 12:15:57
 * @LastEditors: “chenbaolong”
 * @LastEditTime: 2025-10-15 12:38:58
 * @Description:
 *
 */
window.pluginWebUpdateNotice_ = window.pluginWebUpdateNotice_ || {}
window.pluginWebUpdateNotice_.onClickRefresh = function (version) {
    // window.location.reload()
    let newUrl = location.origin + location.pathname
    if (!location.pathname.endsWith('/')) newUrl += '/'
    newUrl += `?v=${version}${location.hash}`
    window.location.href = newUrl
}
window.pluginWebUpdateNotice_.onClickDismiss = function (version) {
    // removeElememt plugin-web-update-notice-anchor
    document.querySelector('.plugin-web-update-notice-anchor').innerHTML = ''
}
