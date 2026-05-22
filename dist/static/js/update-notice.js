/*
 * @Author: “chenbaolong”
 * @Date: 2025-10-15 12:15:57
 * @LastEditors: cnb.bwnr4ZYGAGA
 * @LastEditTime: 2026-02-04 15:11:39
 * @Description:
 *
 */
window.pluginWebUpdateNotice_ = window.pluginWebUpdateNotice_ || {}
window.pluginWebUpdateNotice_.onClickRefresh = function (version) {
    const redirectUrl = `${location.origin + location.pathname}?v=${version}${location.hash}`
    window.location.href = redirectUrl
}
window.pluginWebUpdateNotice_.onClickDismiss = function (version) {
    // removeElememt plugin-web-update-notice-anchor
    document.querySelector('.plugin-web-update-notice-anchor').innerHTML = ''
}
