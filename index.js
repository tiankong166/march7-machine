/* ============================================================================
 *  三月机 · 入口（ESM）
 *  ---------------------------------------------------------------------------
 *  用法：酒馆助手 → 脚本库 → 新建脚本 → 脚本内容只写这一行：
 *
 *    import 'https://cdn.jsdelivr.net/gh/tiankong166/march7-machine@v1.0.0/index.js'
 *
 *  它把真正的手机脚本（同目录 march7.js）注入酒馆主页面 ——
 *  因为酒馆助手把脚本关在隐藏 iframe 里，界面挂在那里是看不见的。
 *  不写死任何地址：用 import.meta.url 找到自己旁边的 march7.js。
 *
 *  jsdelivr 的四个入口在国内可达性不一样（cdn / gcore / fastly / testingcf），
 *  所以这里**按顺序自动换镜像**，每个最多等 12 秒；全都不通就在右下角弹一条
 *  红条说明原因，而不是让用户对着没反应的表情发呆。
 *  版本：1.0.0　生成时间：2026/10/30 13:35:01
 * ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. 自己旁边那份 march7.js，加上换域名的镜像 ---------- */
  var bundleUrl;
  try {
    bundleUrl = new URL('./march7.js', import.meta.url).href;
  } catch (e) {
    console.error('[三月机] 入口必须在 ESM 里运行（酒馆助手脚本库就是这么跑的）。', e);
    return;
  }

  var MIRRORS = ['cdn.jsdelivr.net', 'gcore.jsdelivr.net', 'fastly.jsdelivr.net', 'testingcf.jsdelivr.net'];
  var urls = [bundleUrl];
  try {
    var base = new URL(bundleUrl);
    if (MIRRORS.indexOf(base.hostname) >= 0) {
      MIRRORS.forEach(function (h) {
        if (h === base.hostname) return;
        var u = new URL(bundleUrl);
        u.hostname = h;
        urls.push(u.href);
      });
    }
  } catch (e) { /* 本地扩展装法：没有镜像可换，就一条 */ }

  /* ---------- 2. 注入到酒馆主页面（不是隐藏 iframe） ---------- */
  var host = window;
  try {
    if (window.parent && window.parent !== window && window.parent.document) host = window.parent;
  } catch (e) { /* 跨域：留在自己这层 */ }

  var doc = null;
  try { doc = host.document; } catch (e) { doc = null; }
  if (!doc) {
    console.error('[三月机] 拿不到酒馆主页面的 document，装不了。');
    return;
  }

  function banner(msg) {
    try {
      var d = doc.createElement('div');
      d.textContent = '三月机加载失败：' + msg;
      d.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:2147483000;max-width:420px;'
        + 'padding:11px 15px;border-radius:12px;background:#3a1f24;color:#ffd9de;'
        + 'font:13px/1.6 system-ui,-apple-system,sans-serif;border:1px solid #6b3a44;'
        + 'box-shadow:0 10px 28px rgba(0,0,0,.45)';
      (doc.body || doc.documentElement).appendChild(d);
      setTimeout(function () { try { d.remove(); } catch (e) {} }, 25000);
    } catch (e) {}
  }

  /* 已经在跑 / 正在加载：都别重复注入 */
  if (host.__MARCH7_MACHINE__) {
    console.log('[三月机] 主页面里已经有一份在跑了，跳过。');
    return;
  }
  if (host.__MARCH7_INJECTING__) {
    console.log('[三月机] 另一个入口正在加载中，跳过。');
    return;
  }

  /* ---------- 3. 按顺序试，失败就换下一个 ---------- */
  var i = 0;
  function tryNext() {
    if (i >= urls.length) {
      host.__MARCH7_INJECTING__ = false;
      var tip = '四个 jsdelivr 入口全都不通';
      console.error('[三月机] ' + tip + '，逐个试过的地址：\n  ' + urls.join('\n  '));
      banner(tip + '（网络/镜像问题）。手机没装上，其他功能不受影响。');
      return;
    }
    var url = urls[i++];
    var settled = false;
    var tag = doc.createElement('script');
    tag.src = url;
    tag.async = true;

    function drop() { try { if (tag.parentNode) tag.parentNode.removeChild(tag); } catch (e) {} }
    function onDone() { settled = true; clearTimeout(timer); }

    var timer = setTimeout(function () {
      if (settled) return;
      onDone(); drop();
      console.warn('[三月机] 12 秒没取到，换下一个：' + url);
      tryNext();
    }, 12000);

    tag.onload = function () {
      if (settled) return;
      onDone();
      host.__MARCH7_INJECTING__ = false;
      tag.setAttribute('data-march7-bundle', '1');
      console.log('[三月机] 手机已注入酒馆主页面：' + url);
    };
    tag.onerror = function () {
      if (settled) return;
      onDone(); drop();
      console.warn('[三月机] 取不到，换下一个：' + url);
      tryNext();
    };

    host.__MARCH7_INJECTING__ = true;
    (doc.head || doc.documentElement).appendChild(tag);
  }
  tryNext();
})();
