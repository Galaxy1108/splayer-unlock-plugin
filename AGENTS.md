# music-unlock

Splayer-Next source plugin (`@type source`) that resolves playback URLs for netease/qqmusic/kugou tracks via a proxy at port `7897`. Analogous to Splayer's music unlock feature.

## Source of truth

Splayer-Next source is at `/home/int_256t/Documents/Projects/Splayer-Next/`. Its plugin docs are canonical:
- `docs/plugins/index.md` — architecture, manifest, shared API
- `docs/plugins/source.md` — source plugin: register, musicUrl handler, metadata fallback
- `docs/plugins/control.md` — control plugin (not needed here)
- `shared/types/plugin.ts` — type definitions for all plugin interfaces

## Plugin basics

- A plugin is a **single sandboxed `.js` file** with a JSDoc header manifest. No `require`, no `import`, no Node built-ins. Runnable globals: `splayer`, `Buffer`, `URL`, `console`, timers, `Promise`.
- Two types: `source` (URL resolution, default) and `control` (playback events/control). This project writes a **source plugin**.
- Source plugins auto-grant `network` permission for `splayer.request()`.
- API levels are cumulative: `1` = basics (musicUrl/lyric/pic), `2` = control, `3` = comments.

## How music unlocking works

Splayer-Next source keys (`src/services/audioSource.ts:12`):
- `netease` → `wy`
- `qqmusic` → `tx`
- `kugou` → `kg`

Only `wy`, `tx`, `kg` are called for playback. The plugin intercepts via these keys.

`wy` playback flow: **official API** → **plugin (wy/tx/kg)** → **trial**. The plugin tries netease→bodian→kuwo unlocks sequentially until one returns a URL.

`tx`/`kg` playback flow: **plugin** → **trial** (no official API). The plugin tries bodian→kuwo directly (skip netease ID-based unlock).

All three unlock services use public third-party APIs (GD音乐台, Kuwo Bodian, Kuwo mobile). The plugin runs entirely in the sandbox — no backend needed.

## Registering platforms

Separate source keys for platforms that share an API — route by `req.source`:

```js
splayer.register({
  sources: {
    wy: { name: "...", actions: ["musicUrl"], qualities: ["lq", "hq", "lossless"] },
    tx: { name: "...", actions: ["musicUrl"], qualities: ["lq", "hq", "lossless"] },
    kg: { name: "...", actions: ["musicUrl"], qualities: ["lq", "hq", "lossless"] },
  },
});

splayer.on("musicUrl", async (req) => {
  if (req.source === "wy") { /* netease */ }
  else if (req.source === "tx") { /* qqmusic */ }
  else if (req.source === "kg") { /* kugou */ }
  return { url, quality: req.quality };
});
```

Only the key matters — use the same handler for all sources.

## Proxy at port 7897

Network proxy (梯子/VPN) for accessing blocked resources during development. `splayer.request()` follows system proxy automatically, so the plugin shouldn't need to configure it explicitly.

## Plugin file

`music-unlock.js` — single-file source plugin porting Splayer's unlock logic to the sandbox. Inlines kwDES encryption, Kuwo search, and the three unlock services (netease → bodian → kuwo). No external dependencies.

## Development cycle

1. Write/edit the `.js` file
2. Import into Splayer-Next: **Settings → Plugin Management → Import from local file**
3. Re-importing overwrites the same plugin (matched by `@id` or name)
4. Test in DevTools without playing:
   ```js
   await window.api.plugins.resolveUrl({
     pluginId: "your-plugin-id", source: "wy", quality: "hq",
     musicInfo: { songmid: "SOME_ID", name: "歌名", singer: "歌手" },
   });
   ```
5. Check logs at `{userData}/app-data/logs/`
6. Plugin errors are isolated in a child process — app won't crash

## Script header template

```js
/**
 * @name        Music Unlock
 * @id          music-unlock.splayer
 * @version     1.0.0
 * @description 通过多个解锁服务获取歌曲播放地址
 * @author      galaxy1108
 * @type        source
 * @apiLevel    1
 */
```

`@apiLevel` 1 is sufficient for `musicUrl` only.

## How Splayer (original) unlocks music

The original Splayer at `https://github.com/SPlayer-Dev/SPlayer` (archived, branch `dev`) implements unlock entirely on the **server side** — no plugin system existed:

- The app runs a Node backend server (`electron.vite.config.ts:98` proxies `/api` → `http://127.0.0.1:${servePort}`)
- The unlock endpoint is at `/api/unblock/{server}` (`src/api/song.ts:75`)
- Three unlock servers are tried in order (`src/stores/setting.ts:529`):
  1. **`bodian`** — keyword search (song name + artist), default enabled
  2. **`netease`** — direct Netease song ID, default enabled
  3. **`kuwo`** — keyword search on Kuwo, default disabled
- The flow (`src/core/player/SongManager.ts:483`):
  1. Call official Netease API → get URL or trial
  2. If trial/failure AND `useSongUnlock` is enabled → call `getUnlockSongUrl()`
  3. Concurrently hit each enabled unlock server at `/api/unblock/{server}`
  4. Return the first successful URL (with `isUnlocked: true` flag)
- The Netease server gets `{ id }` (song ID); bodian/kuwo get `{ keyword, songName, artist }`
- Downloaded unlocks are cached to disk for future offline play

## Key difference from Splayer-Next plugin

Splayer's unlock logic lived in **app server code** (axios requests from renderer → Node proxy → external unlock services). Splayer-Next **replaces this entirely with the plugin sandbox** — no server-side unlock code exists. The plugin uses `splayer.request()` to talk directly to unlock endpoints. `splayer.request()` follows system proxy automatically (including port `7897`).

Write the plugin to replicate Splayer's unlock flow:
- Accept `musicUrl` requests for `wy`/`tx`/`kg`
- Route by `req.source` — the plugin replaces the old server-side `/api/unblock/{netease|bodian|kuwo}`
- Let `splayer.request()` handle proxy routing (system proxy at port `7897`)
- Return `{ url, quality }` as Splayer-Next expects

## Plugin behavior

- Unlock order: **netease (GD音乐台, ID直查)** → **bodian (Kuwo Bodian, 关键词搜索)** → **kuwo (Kwok DES, 关键词搜索)**
- Kuwo attempt order: `antiserver.kuwo.cn/anti.s` → `mobi.kuwo.cn/mobi.s` (kwDES). `www.kuwo.cn/url` is dead (returns the SPA HTML) and must not be used.
- First successful result wins; all three fail → throws → player tries next candidate plugin
- Returns `{ url, quality: "hq"|"lossless" }`; quality inferred from file extension
- `wy` source gets all three tries; `tx`/`kg` skip netease unlock (ID-based, only works for netease IDs)
- kwDES is inlined pure-JS DES implementation (no Node deps needed)
- `splayer.utils.crypto.md5` replaces Node's `crypto.createHash` for Bodian signature

### Never send forbidden request headers

`host`, `origin`, `referer`-style forbidden headers are rejected by Electron's `net.fetch` with
`net::ERR_INVALID_ARGUMENT` (the plugin only sees a generic network error). Setting `host:
"bd-api.kuwo.cn"` silently broke **every** bodian request in the app, so playback always fell
through to the broken Kuwo path. Do not re-add it.

### Kuwo returns prompt tones, not errors

For tracks that are not streamable (e.g. “仅手机端可播放”), Kuwo replies HTTP 200 with a short
spoken notice instead of failing. Verified placeholders:
`/resource/n1/69/32/588957081.mp3` (antiserver, ~11.3s, 181521 bytes) and
`/trackmedia/M5000004Gmy54cGDqK.mp3` (mobi fallback, ~11.5s).
The mobi response also echoes `rid=<id>` — a mismatch means it served the fallback, not the song.
`looksLikeRealTrack()` in the plugin additionally HEADs the URL and rejects files smaller than
0.2× the 128kbps size implied by the search-reported duration.

## Important constraints

- Script runs in `node:vm` sandbox — no `fs`, no `net`, no `require`/`import`
- Network only via `splayer.request()` — follows system proxy automatically
- Plugin host has one event loop — don't block with sync work
- Top-level sync execution timeout: 5 seconds
- Request timeout: default 15s, max 60s
- `musicInfo.songmid` / `musicInfo.id` / `musicInfo.songId` are all the same platform song ID (three aliases for compatibility)
- Return `{ url, quality?, expire? }` from `musicUrl` handler; throw on failure to fall through to next candidate
