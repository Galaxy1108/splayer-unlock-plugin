> [!IMPORTANT]
> 本项目代码完全由 AI 生成，仅经过基本人工验证

# Splayer-Unlock-Plugin

Splayer-Next 音乐解锁源插件（`@type source`），通过多个第三方解锁服务解析网易云/QQ音乐/酷狗音乐的播放地址。

## 工作原理

插件拦截 Splayer-Next 的 `musicUrl` 请求，依次尝试三个解锁服务，返回第一个成功获取的播放地址：

1. **GD音乐台**（`netease`）— 通过歌曲 ID 直接查询，仅对 `wy` 源有效
2. **波点音乐**（`bodian`）— 关键词搜索 Kuwo 曲库，通过波点 API 获取播放地址
3. **酷我音乐**（`kuwo`）— 关键词搜索，依次尝试 `antiserver.kuwo.cn` → `www.kuwo.cn/url` → `mobi.s`（kwDES 加密）

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
