> [!IMPORTANT]
> 本项目代码完全由 AI 生成，仅经过基本人工验证

# Splayer-Unlock-Plugin

Splayer-Next 音乐解锁源插件（`@type source`），通过多个第三方解锁服务解析网易云/QQ音乐/酷狗音乐的播放地址。

## 工作原理

插件拦截 Splayer-Next 的 `musicUrl` 请求，依次尝试三个解锁服务，返回第一个成功获取的播放地址：

1. **GD音乐台**（`netease`）— 通过歌曲 ID 直接查询，仅对 `wy` 源有效
2. **波点音乐**（`bodian`）— 关键词搜索 Kuwo 曲库，通过波点 API 获取播放地址
3. **酷我音乐**（`kuwo`）— 关键词搜索，依次尝试 `antiserver.kuwo.cn` → `mobi.s`（kwDES 加密）

> 酷我对「仅手机端可播放」等受限歌曲不会返回错误，而是返回一段语音提示音频
> （“当前歌曲仅在酷我音乐手机端最新版可播放”）。插件会校验返回地址：命中已知占位音频、
> 或文件大小与歌曲时长明显不符时视为失败，继续尝试下一个来源，而不是把提示音当成歌曲播放。

## 更新记录

### 1.2.0

- 修复波点（bodian）在应用内必定失败的问题：请求头中的 `host` 属于 Electron `net.fetch` 的禁止头，会直接报 `net::ERR_INVALID_ARGUMENT`
- 修复酷我把「手机端独占」提示音当作歌曲返回的问题（`antiserver` 占位音频 / `mobi` 回显 rid 不匹配 / 文件大小与时长不符均判定为失败）
- 移除已失效的 `www.kuwo.cn/url` 兜底（该接口现在只返回网页 HTML）
- 作者改为 `galaxy1108`


## 支持的源

| 源键 | 平台 |
|------|------|
| `wy` | 网易云音乐 |
| `tx` | QQ音乐 |
| `kg` | 酷狗音乐 |

## 使用

1. 在 Splayer-Next 中：**设置 → 插件管理 → 从本地文件导入**
2. 选择 `music-unlock.js`
3. 重新导入会覆盖同名插件（按 `@id` 匹配）

## 测试

在 DevTools 中运行：
```js
await window.api.plugins.resolveUrl({
  pluginId: "music-unlock.splayer",
  source: "wy",
  quality: "hq",
  musicInfo: { songmid: "SOME_ID", name: "歌名", singer: "歌手" },
});
```

## 许可证

MIT
