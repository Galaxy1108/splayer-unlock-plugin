/**
 * @name        Music Unlock
 * @id          music-unlock.splayer
 * @version     1.2.0
 * @description 通过多个解锁服务获取歌曲播放地址
 * @author      galaxy1108
 * @type        source
 * @apiLevel    1
 */

/* ====== kwDES - Kuwo DES encryption (ported from Splayer) ====== */

const Long = (n) => {
  const bN = BigInt(n);
  return {
    low: Number(bN),
    valueOf: () => bN.valueOf(),
    toString: () => bN.toString(),
    not: () => Long(~bN),
    isNegative: () => bN < 0,
    or: (x) => Long(bN | BigInt(x)),
    and: (x) => Long(bN & BigInt(x)),
    xor: (x) => Long(bN ^ BigInt(x)),
    equals: (x) => bN === BigInt(x),
    multiply: (x) => Long(bN * BigInt(x)),
    shiftLeft: (x) => Long(bN << BigInt(x)),
    shiftRight: (x) => Long(bN >> BigInt(x)),
  };
};

const range = (n) => Array.from(new Array(n).keys());
const power = (base, index) =>
  Array(index)
    .fill(null)
    .reduce((result) => result.multiply(base), Long(1));
const LongArray = (...array) => array.map((n) => (n === -1 ? Long(-1, -1) : Long(n)));

const arrayE = LongArray(
  31, 0, 1, 2, 3, 4, -1, -1, 3, 4, 5, 6, 7, 8, -1, -1,
  7, 8, 9, 10, 11, 12, -1, -1, 11, 12, 13, 14, 15, 16, -1, -1,
  15, 16, 17, 18, 19, 20, -1, -1, 19, 20, 21, 22, 23, 24, -1, -1,
  23, 24, 25, 26, 27, 28, -1, -1, 27, 28, 29, 30, 31, 30, -1, -1,
);

const arrayIP = LongArray(
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
  56, 48, 40, 32, 24, 16, 8, 0, 58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46, 38, 30, 22, 14, 6,
);

const arrayIP_1 = LongArray(
  39, 7, 47, 15, 55, 23, 63, 31, 38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29, 36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27, 34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41, 9, 49, 17, 57, 25, 32, 0, 40, 8, 48, 16, 56, 24,
);

const arrayLs = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
const arrayLsMask = LongArray(0, 0x100001, 0x300003);
const arrayMask = range(64).map((n) => power(2, n));
arrayMask[arrayMask.length - 1] = arrayMask[arrayMask.length - 1].multiply(-1);

const arrayP = LongArray(
  15, 6, 19, 20, 28, 11, 27, 16, 0, 14, 22, 25, 4, 17, 30, 9,
  1, 7, 23, 13, 31, 26, 2, 8, 18, 12, 29, 5, 21, 10, 3, 24,
);

const arrayPC_1 = LongArray(
  56, 48, 40, 32, 24, 16, 8, 0, 57, 49, 41, 33, 25, 17, 9, 1,
  58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 62, 54, 46, 38,
  30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 60, 52, 44, 36,
  28, 20, 12, 4, 27, 19, 11, 3,
);

const arrayPC_2 = LongArray(
  13, 16, 10, 23, 0, 4, -1, -1, 2, 27, 14, 5, 20, 9, -1, -1,
  22, 18, 11, 3, 25, 7, -1, -1, 15, 6, 26, 19, 12, 1, -1, -1,
  40, 51, 30, 36, 46, 54, -1, -1, 29, 39, 50, 44, 32, 47, -1, -1,
  43, 48, 38, 55, 33, 52, -1, -1, 45, 41, 49, 35, 28, 31, -1, -1,
);

const matrixNSBox = [
  [14, 4, 3, 15, 2, 13, 5, 3, 13, 14, 6, 9, 11, 2, 0, 5, 4, 1, 10, 12, 15, 6, 9, 10, 1, 8, 12, 7, 8, 11, 7, 0, 0, 15, 10, 5, 14, 4, 9, 10, 7, 8, 12, 3, 13, 1, 3, 6, 15, 12, 6, 11, 2, 9, 5, 0, 4, 2, 11, 14, 1, 7, 8, 13],
  [15, 0, 9, 5, 6, 10, 12, 9, 8, 7, 2, 12, 3, 13, 5, 2, 1, 14, 7, 8, 11, 4, 0, 3, 14, 11, 13, 6, 4, 1, 10, 15, 3, 13, 12, 11, 15, 3, 6, 0, 4, 10, 1, 7, 8, 4, 11, 14, 13, 8, 0, 6, 2, 15, 9, 5, 7, 1, 10, 12, 14, 2, 5, 9],
  [10, 13, 1, 11, 6, 8, 11, 5, 9, 4, 12, 2, 15, 3, 2, 14, 0, 6, 13, 1, 3, 15, 4, 10, 14, 9, 7, 12, 5, 0, 8, 7, 13, 1, 2, 4, 3, 6, 12, 11, 0, 13, 5, 14, 6, 8, 15, 2, 7, 10, 8, 15, 4, 9, 11, 5, 9, 0, 14, 3, 10, 7, 1, 12],
  [7, 10, 1, 15, 0, 12, 11, 5, 14, 9, 8, 3, 9, 7, 4, 8, 13, 6, 2, 1, 6, 11, 12, 2, 3, 0, 5, 14, 10, 13, 15, 4, 13, 3, 4, 9, 6, 10, 1, 12, 11, 0, 2, 5, 0, 13, 14, 2, 8, 15, 7, 4, 15, 1, 10, 7, 5, 6, 12, 11, 3, 8, 9, 14],
  [2, 4, 8, 15, 7, 10, 13, 6, 4, 1, 3, 12, 11, 7, 14, 0, 12, 2, 5, 9, 10, 13, 0, 3, 1, 11, 15, 5, 6, 8, 9, 14, 14, 11, 5, 6, 4, 1, 3, 10, 2, 12, 15, 0, 13, 2, 8, 5, 11, 8, 0, 15, 7, 14, 9, 4, 12, 7, 10, 9, 1, 13, 6, 3],
  [12, 9, 0, 7, 9, 2, 14, 1, 10, 15, 3, 4, 6, 12, 5, 11, 1, 14, 13, 0, 2, 8, 7, 13, 15, 5, 4, 10, 8, 3, 11, 6, 10, 4, 6, 11, 7, 9, 0, 6, 4, 2, 13, 1, 9, 15, 3, 8, 15, 3, 1, 14, 12, 5, 11, 0, 2, 12, 14, 7, 5, 10, 8, 13],
  [4, 1, 3, 10, 15, 12, 5, 0, 2, 11, 9, 6, 8, 7, 6, 9, 11, 4, 12, 15, 0, 3, 10, 5, 14, 13, 7, 8, 13, 14, 1, 2, 13, 6, 14, 9, 4, 1, 2, 14, 11, 13, 5, 0, 1, 10, 8, 3, 0, 11, 3, 5, 9, 4, 15, 2, 7, 8, 12, 15, 10, 7, 6, 12],
  [13, 7, 10, 0, 6, 9, 5, 15, 8, 4, 3, 10, 11, 14, 12, 5, 2, 11, 9, 6, 15, 12, 0, 3, 4, 1, 14, 13, 1, 2, 7, 8, 1, 2, 12, 15, 10, 4, 0, 3, 13, 14, 6, 9, 7, 8, 9, 6, 15, 1, 5, 12, 3, 10, 14, 5, 8, 7, 11, 0, 4, 13, 2, 11],
];

const bitTransform = (arrInt, n, l) => {
  let l2 = Long(0);
  range(n).forEach((i) => {
    if (arrInt[i].isNegative() || l.and(arrayMask[arrInt[i].low]).equals(0)) return;
    l2 = l2.or(arrayMask[i]);
  });
  return l2;
};

const DES64 = (longs, l) => {
  const pR = range(8).map(() => Long(0));
  const pSource = [Long(0), Long(0)];
  let L = Long(0);
  let R = Long(0);
  let out = bitTransform(arrayIP, 64, l);
  pSource[0] = out.and(0xffffffff);
  pSource[1] = out.and(-4294967296).shiftRight(32);

  range(16).forEach((i) => {
    let SOut = Long(0);
    R = Long(pSource[1]);
    R = bitTransform(arrayE, 64, R);
    R = R.xor(longs[i]);
    range(8).forEach((j) => {
      pR[j] = R.shiftRight(j * 8).and(255);
    });
    range(8).reverse().forEach((sbi) => {
      SOut = SOut.shiftLeft(4).or(matrixNSBox[sbi][pR[sbi]]);
    });
    R = bitTransform(arrayP, 32, SOut);
    L = Long(pSource[0]);
    pSource[0] = Long(pSource[1]);
    pSource[1] = L.xor(R);
  });
  pSource.reverse();
  out = pSource[1].shiftLeft(32).and(-4294967296).or(pSource[0].and(0xffffffff));
  out = bitTransform(arrayIP_1, 64, out);
  return out;
};

const subKeys = (l, longs, n) => {
  let l2 = bitTransform(arrayPC_1, 56, l);
  range(16).forEach((i) => {
    l2 = l2
      .and(arrayLsMask[arrayLs[i]])
      .shiftLeft(28 - arrayLs[i])
      .or(l2.and(arrayLsMask[arrayLs[i]].not()).shiftRight(arrayLs[i]));
    longs[i] = bitTransform(arrayPC_2, 64, l2);
  });
  if (n === 1) {
    range(8).forEach((j) => {
      [longs[j], longs[15 - j]] = [longs[15 - j], longs[j]];
    });
  }
};

const crypt = (msg, key, mode) => {
  let l = Long(0);
  range(8).forEach((i) => {
    l = Long(key[i]).shiftLeft(i * 8).or(l);
  });

  const j = Math.floor(msg.length / 8);
  const arrLong1 = range(16).map(() => Long(0));
  subKeys(l, arrLong1, mode);

  const arrLong2 = range(j).map(() => Long(0));
  range(j).forEach((m) => {
    range(8).forEach((n) => {
      arrLong2[m] = Long(msg[n + m * 8]).shiftLeft(n * 8).or(arrLong2[m]);
    });
  });

  const arrLong3 = range(Math.floor((1 + 8 * (j + 1)) / 8)).map(() => Long(0));
  range(j).forEach((i1) => {
    arrLong3[i1] = DES64(arrLong1, arrLong2[i1]);
  });

  const arrByte1 = msg.slice(j * 8);
  let l2 = Long(0);
  range(msg.length % 8).forEach((i1) => {
    l2 = Long(arrByte1[i1]).shiftLeft(i1 * 8).or(l2);
  });

  if (arrByte1.length || mode === 0) arrLong3[j] = DES64(arrLong1, l2);

  const arrByte2 = range(8 * arrLong3.length).map(() => 0);
  let i4 = 0;
  arrLong3.forEach((l3) => {
    range(8).forEach((i6) => {
      arrByte2[i4] = l3.shiftRight(i6 * 8).and(255).low;
      i4 += 1;
    });
  });
  return Buffer.from(arrByte2);
};

const KW_SECRET_KEY = Buffer.from("ylzsxkwm");
const kwEncrypt = (msg) => crypt(msg, KW_SECRET_KEY, 0);
const kwEncryptQuery = (query) => kwEncrypt(Buffer.from(query)).toString("base64");

/* ====== Song matching (ported from Splayer) ====== */

const normalizeName = (name) => {
  return name
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, "")
    .trim();
};

const normalizeArtist = (artist) => {
  return artist
    .toLowerCase()
    .replace(/[&/、，,;；]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const isSongMatch = (resultName, resultArtist, match) => {
  const normalizedResult = normalizeName(resultName);
  const normalizedOriginal = normalizeName(match.songName);
  if (!normalizedResult) return false;
  if (normalizedOriginal) {
    if (
      !normalizedResult.includes(normalizedOriginal) &&
      !normalizedOriginal.includes(normalizedResult)
    ) {
      return false;
    }
  }
  if (resultArtist && match.artist) {
    const normalizedResultArtist = normalizeArtist(resultArtist);
    const normalizedOriginalArtist = normalizeArtist(match.artist);
    if (normalizedResultArtist && normalizedOriginalArtist) {
      if (
        !normalizedResultArtist.includes(normalizedOriginalArtist) &&
        !normalizedOriginalArtist.includes(normalizedResultArtist)
      ) {
        return false;
      }
    }
  }
  return true;
};

/* ====== Placeholder (prompt tone) detection ====== */

// Kuwo answers "unavailable" requests with a short spoken notice instead of an
// error, e.g. “当前歌曲仅在酷我音乐手机端最新版可播放”. These files are real
// HTTP 200 audio, so a naive `startsWith("http")` check would happily report
// them as a successful unlock. Known placeholders:
//   - antiserver.kuwo.cn  → ~11.3s notice, 181521 bytes
//   - mobi convert_url2   → ~11.5s fallback, echoed rid != requested rid
const KW_PLACEHOLDER_MARKERS = [
  "/resource/n1/69/32/588957081.mp3",
  "/trackmedia/M5000004Gmy54cGDqK.mp3",
];

const isKwPlaceholder = (url) => KW_PLACEHOLDER_MARKERS.some((marker) => url.includes(marker));

const headerValue = (headers, name) => {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name) || undefined;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? headers[key] : undefined;
};

// Last line of defence: compare the remote file size with the duration reported
// by Kuwo search. Even a 48kbps encode is ~0.38x of the 128kbps estimate used
// here, so anything below 0.2x is a notice/preview, not the requested track.
const looksLikeRealTrack = async (url, durationSec) => {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  if (isKwPlaceholder(url)) return false;
  let size = 0;
  try {
    const resp = await splayer.request(url, { method: "HEAD", responseType: "text" });
    size = Number(headerValue(resp.headers, "content-length")) || 0;
  } catch {
    return true; // can't verify (HEAD blocked) — keep the URL instead of failing
  }
  if (!size) return true;
  if (durationSec > 0 && size < durationSec * 16000 * 0.2) return false;
  return true;
};

/* ====== Unlock services ====== */

const generateDeviceId = () => {
  const min = 0;
  const max = 100000000000;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
};

const _deviceId = generateDeviceId();

const formatKuwoSong = (song) => ({
  id: song.MUSICRID.split("_").pop(),
  name: song.SONGNAME,
  duration: song.DURATION * 1000,
  artists: song.ARTIST.split("&").map((name) => ({ name })),
});

const searchKuwo = async (match) => {
  const keyword = encodeURIComponent(match.keyword.replace(" - ", " "));
  const url =
    "http://search.kuwo.cn/r.s?&correct=1&vipver=1&stype=comprehensive&encoding=utf8" +
    "&rformat=json&mobi=1&show_copyright_off=1&searchapi=6&all=" +
    keyword;
  const resp = await splayer.request(url, { responseType: "text" });
  if (!resp.body) return null;
  const data = typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body;
  if (
    !data ||
    data.content.length < 2 ||
    !data.content[1].musicpage ||
    data.content[1].musicpage.abslist.length < 1
  ) {
    return null;
  }
  const list = data.content[1].musicpage.abslist.map(formatKuwoSong);
  for (const item of list) {
    if (!item.id) continue;
    const artistStr = item.artists.map((a) => a.name).join("&") || "";
    if (isSongMatch(item.name || "", artistStr, match)) {
      const durationMs = Number(item.duration);
      return { id: item.id, durationSec: Number.isFinite(durationMs) ? durationMs / 1000 : 0 };
    }
  }
  return null;
};

const sendAdFreeRequest = () => {
  const adurl =
    "http://bd-api.kuwo.cn/api/service/advert/watch?uid=-1&token=&timestamp=1724306124436&sign=15a676d66285117ad714e8c8371691da";
  // NB: never set a `host` header here. Electron's net.fetch (Chromium) rejects
  // forbidden headers with net::ERR_INVALID_ARGUMENT, which silently broke every
  // bodian request in the app.
  const headers = {
    "user-agent": "Dart/2.19 (dart:io)",
    plat: "ar",
    channel: "aliopen",
    devid: _deviceId,
    ver: "3.9.0",
    qimei36: "1e9970cbcdc20a031dee9f37100017e1840e",
    "content-type": "application/json; charset=utf-8",
  };
  const data = JSON.stringify({ type: 5, subType: 5, musicId: 0, adToken: "" });
  return splayer.request(adurl, {
    method: "POST",
    headers,
    body: data,
    responseType: "text",
  });
};

const generateSign = (str) => {
  const url = new URL(str);
  const currentTime = Date.now();
  str += `&timestamp=${currentTime}`;
  const filteredChars = str
    .substring(str.indexOf("?") + 1)
    .replace(/[^a-zA-Z0-9]/g, "")
    .split("")
    .sort();
  const dataToEncrypt = `kuwotest${filteredChars.join("")}${url.pathname}`;
  const md5 = splayer.utils.crypto.md5(dataToEncrypt);
  return `${str}&sign=${md5}`;
};

const unlockByNetease = async (id) => {
  try {
    if (!id) return null;
    const baseUrl = "https://music-api.gdstudio.xyz/api.php";
    const resp = await splayer.request(`${baseUrl}?types=url&id=${encodeURIComponent(id)}`, {
      responseType: "json",
    });
    if (resp.status === 200 && resp.body && resp.body.url) {
      return { url: resp.body.url, quality: "hq" };
    }
    return null;
  } catch {
    return null;
  }
};

const unlockByBodian = async (match) => {
  try {
    if (!match.keyword) return null;
    const hit = await searchKuwo(match);
    if (!hit) return null;
    const songId = hit.id;
    const headers = {
      "user-agent": "Dart/2.19 (dart:io)",
      plat: "ar",
      channel: "aliopen",
      devid: _deviceId,
      ver: "3.9.0",
      "X-Forwarded-For": "1.0.1.114",
    };
    try { await sendAdFreeRequest(); } catch {}

    const bitrates = ["320kmp3", "192kmp3", "128kmp3"];
    for (const br of bitrates) {
      let audioUrl = `http://bd-api.kuwo.cn/api/play/music/v2/audioUrl?br=${br}&musicId=${songId}`;
      audioUrl = generateSign(audioUrl);
      const result = await splayer.request(audioUrl, { headers, responseType: "json" });
      if (result.body && result.body.data && result.body.data.audioUrl) {
        const url = result.body.data.audioUrl;
        if (isKwPlaceholder(url)) continue;
        const quality = url.includes(".flac") || url.includes(".wav") ? "lossless" : "hq";
        return { url, quality };
      }
    }
    return null;
  } catch {
    return null;
  }
};

const unlockByKuwo = async (match) => {
  try {
    if (!match.keyword) return null;
    const hit = await searchKuwo(match);
    if (!hit) return null;
    const songId = hit.id;

    // Try 1: antiserver.kuwo.cn (no encryption, plain text URL).
    // For mobile-only / restricted tracks Kuwo answers with a spoken notice
    // (“当前歌曲仅在酷我音乐手机端最新版可播放”) instead of an error, so the URL
    // must be verified before it is reported as a successful unlock.
    {
      const antiUrl = `http://antiserver.kuwo.cn/anti.s?type=convert_url&format=mp3&response=url&rid=MUSIC_${songId}`;
      const result = await splayer.request(antiUrl, { responseType: "text" });
      if (result.body) {
        const body = String(result.body).trim();
        if (/^https?:\/\//i.test(body) && (await looksLikeRealTrack(body, hit.durationSec))) {
          return { url: body, quality: "hq" };
        }
      }
    }

    // Try 2: mobi.s with kwDES (last resort, may return a placeholder).
    // The response echoes the requested `rid`; a different one means Kuwo
    // served a fallback notice rather than the song.
    {
      const PackageName = "kwplayer_ar_5.1.0.0_B_jiakong_vh.apk";
      const url =
        "http://mobi.kuwo.cn/mobi.s?f=kuwo&q=" +
        kwEncryptQuery(
          `corp=kuwo&source=${PackageName}&p2p=1&type=convert_url2&sig=0&format=mp3` +
            "&rid=" + songId,
        );
      const result = await splayer.request(url, {
        headers: { "User-Agent": "okhttp/3.10.0" },
        responseType: "text",
      });
      const text = String(result.body || "");
      const echoedRid = (text.match(/(?:^|\n)rid=(\d+)/) || [])[1];
      const urlMatch = text.match(/(?:^|\n)url=(https?:\/\/\S+)/);
      if (
        urlMatch &&
        echoedRid === String(songId) &&
        (await looksLikeRealTrack(urlMatch[1], hit.durationSec))
      ) {
        const quality =
          urlMatch[1].includes(".flac") || urlMatch[1].includes(".wav") ? "lossless" : "hq";
        return { url: urlMatch[1], quality };
      }
    }

    return null;
  } catch {
    return null;
  }
};

/* ====== Plugin registration ====== */

splayer.register({
  sources: {
    wy: { name: "音乐解锁", actions: ["musicUrl"], qualities: ["lq", "hq", "lossless"] },
    tx: { name: "音乐解锁", actions: ["musicUrl"], qualities: ["lq", "hq", "lossless"] },
    kg: { name: "音乐解锁", actions: ["musicUrl"], qualities: ["lq", "hq", "lossless"] },
  },
});

splayer.on("musicUrl", async (req) => {
  const { source, quality, musicInfo } = req;
  const songId = musicInfo.songmid || musicInfo.id || musicInfo.songId;
  const singer = musicInfo.singer || "";
  const songName = musicInfo.name || "";
  const keyword = songName + "-" + singer;
  const match = { keyword, songName, artist: singer };

  splayer.log.info(`[MusicUnlock] ${source} ${songName} - ${singer} quality=${quality}`);

  let result = null;

  if (source === "wy" && songId) {
    result = await unlockByNetease(songId);
    splayer.log.info(`[MusicUnlock] netease→${result ? '✓' : '✗'}`);
    if (result) return result;
  }

  if (keyword) {
    result = await unlockByBodian(match);
    splayer.log.info(`[MusicUnlock] bodian→${result ? '✓' : '✗'}`);
    if (result) return result;

    result = await unlockByKuwo(match);
    splayer.log.info(`[MusicUnlock] kuwo→${result ? '✓' : '✗'}`);
    if (result) return result;
  }

  splayer.log.warn(`[MusicUnlock] 全部失败: ${source} ${songName}`);
  throw new Error("all unlock methods failed");
});
