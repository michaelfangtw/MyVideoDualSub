# 🔍 VTT 字幕調試指南 | VTT Subtitle Debugging Guide

## 快速檢查清單 | Quick Checklist

### ✅ Step 1: 驗證外掛是否載入 | Verify Plugin Loaded

```
1. 進入 edge://extensions/
2. 搜尋 "myVideo Dual Transcript"
3. 確認外掛已啟用（藍色開關）
4. 版本應為 4.0.3
```

### ✅ Step 2: 打開開發者工具 | Open DevTools

```
F12 → 選擇 "Console" 標籤
```

### ✅ Step 3: 訪問 myVideo 視訊頁面 | Visit myVideo Video

```
1. 進入 https://www.myvideo.net.tw
2. 播放任何有字幕的視訊
3. 確認原廠字幕可以正常顯示
```

### ✅ Step 4: 檢查 Console 日誌 | Check Console Logs

在 Console 中查看以下日誌序列：

---

## 📊 預期的日誌序列 | Expected Log Sequence

### A. 外掛初始化 | Plugin Initialization

```
[Dual Subtitle] Content script loaded (Passive V4.0).
[Content] Mode is ENABLED. Setting up...
```

### B. 背景工作者偵測 VTT | Background Worker Detects VTT

```
[Background] 🕵️ Detected VTT request: https://...text_eng_0/0.vtt
[Background] 📥 Fetching eng subtitle: https://...text_eng_0/0.vtt
[Background] TabID: 123456
[Background] ✅ Response received (eng): 200 OK
[Background] 📄 Data received (eng): 12345 bytes
[Background] First 100 chars: WEBVTT...
[Background] ✅ Message sent (eng) to tabId 123456
```

### C. 內容腳本接收字幕 | Content Script Receives Subtitle

```
[Content] 📨 Message received: SUBTITLE_DATA_RECEIVED
[Content] 📥 Received eng subtitle data: 12345 bytes
[Content] URL: https://...text_eng_0/0.vtt
[Content] 📥 Processing for mode: eng_zho
[Content] 📊 Parsed eng tracks: 150 subtitles
[Content] 🔍 Language detection: langCode=eng, currentIsZh=false, currentLangCode=eng
[Content] 🔗 Original: https://...text_eng_0/0.vtt
[Content] 🔗 Counterpart: https://...text_zho_0/0.vtt
[Content] Attempting to fetch counterpart (zho)...
```

### D. 取得對應語言字幕 | Fetch Counterpart Subtitle

```
[Content] 📬 Counterpart response received: {success: true, data: "WEBVTT..."}
[Content] ✅ Counterpart (zho) parsed: 140 subtitles
[Content] 🎯 Mode: eng_zho, eng=150, zho=140
[Content] eng_zho: merged 150 subtitles
[Content] ✅ Ready: 150 subtitles loaded
```

---

## 🐛 常見問題診斷 | Common Issues Diagnosis

### 問題 1️⃣: 沒有看到 "[Background]" 日誌

**原因可能：**
- ❌ VTT 請求沒被偵測到
- ❌ URL 不符合 `text_eng_` 或 `text_zho_` 模式
- ❌ webRequest 權限未正確設定

**解決方案：**
1. 檢查 Network 標籤看是否有 `.vtt` 請求
2. 確認 URL 包含 `/text_eng_` 或 `/text_zho_`
3. 驗證 manifest.json 的 permissions 和 host_permissions

---

### 問題 2️⃣: "[Content] Message received" 但沒有後續日誌

**原因可能：**
- ❌ 外掛模式設定為 "disabled"
- ❌ settings.subtitleMode 未正確載入
- ❌ Chrome Storage 讀取失敗

**解決方案：**
1. 在 popup 中檢查是否選擇了正確模式
2. 在 Console 輸入：`chrome.storage.sync.get('subtitleMode', (x) => console.log(x))`
3. 確認返回值為 `{subtitleMode: "eng_zho"}` 或其他模式

---

### 問題 3️⃣: "[Content] Parsed eng tracks: 0 subtitles"

**原因可能：**
- ❌ VTT 解析器無法識別時間戳格式
- ❌ VTT 檔案格式不正確
- ❌ VTT 檔案為空或損壞

**解決方案：**
1. 複製 VTT URL 到瀏覽器，查看原始內容
2. 檢查是否以 `WEBVTT` 開頭
3. 檢查是否有時間戳行：`HH:MM:SS.mmm --> HH:MM:SS.mmm`

---

### 問題 4️⃣: "❌ Failed to fetch counterpart (zho)"

**原因可能：**
- ❌ Counterpart URL 生成錯誤
- ❌ 視訊只有一種語言的字幕
- ❌ CDN 返回 404 或其他錯誤

**解決方案：**
1. 檢查 Console 中的 "🔗 Counterpart:" URL 是否正確
2. 複製該 URL 到瀏覽器測試是否可訪問
3. 如果 404，則視訊可能沒有該語言字幕

---

### 問題 5️⃣: 字幕已載入但不顯示

**原因可能：**
- ❌ 字幕容器未正確創建
- ❌ 時間戳不在有效範圍內
- ❌ CSS 樣式隱藏了字幕

**解決方案：**
1. 檢查 HTML 是否有 `<div id="myvideo-dual-subtitle-container">` 元素
2. 檢查 CSS 是否正確載入
3. 在 Console 輸入：`document.getElementById('myvideo-dual-subtitle-container')` 確認存在

---

## 🔧 手動測試 | Manual Testing

### 在 Console 測試解析器

```javascript
// 複製一個簡單的 VTT 數據並測試
const testVTT = `WEBVTT

00:00:01.000 --> 00:00:05.000
Hello world

00:00:06.000 --> 00:00:10.000
This is a test`;

// 貼到 Console 並運行解析器
parseVTT(testVTT);
// 應該返回包含 2 個字幕的陣列
```

### 檢查當前設定

```javascript
// 檢查當前模式
chrome.storage.sync.get('subtitleMode', (x) => console.log('Current mode:', x));

// 檢查是否正確初始化
console.log('Settings:', settings);
console.log('Full subtitles:', fullSubtitles);
console.log('Video element:', videoElement);
```

---

## 📝 完整日誌收集步驟 | Full Log Collection Steps

### 1. 清除舊日誌
```
Console → 滑鼠右鍵 → Clear console
```

### 2. 重新載入外掛
```
edge://extensions/ → 找到外掛 → 點擊「重新載入」
```

### 3. 重新載入頁面
```
F5 或 Ctrl+R
```

### 4. 播放視訊並觀察日誌
```
觀察所有 [Background] 和 [Content] 日誌
```

### 5. 複製所有日誌
```
Console 中全選 (Ctrl+A) → 複製 (Ctrl+C)
```

---

## 📧 報告問題時 | When Reporting Issues

請提供：
1. ✅ 完整的 Console 日誌
2. ✅ VTT URL（可以隱藏 token）
3. ✅ 外掛版本號
4. ✅ 瀏覽器版本
5. ✅ myVideo 視訊連結（或視訊標題）
6. ✅ 預期行為 vs 實際行為

---

## 🎯 快速參考 | Quick Reference

| 日誌 | 含義 |
|------|------|
| 🕵️ Detected VTT | 成功偵測到字幕請求 |
| 📥 Fetching | 開始下載字幕 |
| ✅ Response received | 字幕下載成功 |
| 📄 Data received | 接收到字幕數據 |
| 📨 Message received | Content script 收到訊息 |
| 📊 Parsed tracks | 成功解析字幕 |
| ✅ Counterpart parsed | 成功取得對應語言 |
| ✅ Ready | 字幕已準備好顯示 |
| ❌ Failed | 出錯（查看錯誤信息） |
| ⚠️ Warning | 警告（可能影響功能） |

---

## 💡 提示 | Tips

- 💾 可以右鍵 Console → Save as... 保存日誌
- 🔍 使用 Ctrl+F 在 Console 中搜尋日誌
- 🚀 刷新頁面後日誌會清除，重新開始
- ⏱️ 從播放視訊開始計時，通常 1-2 秒內應該看到日誌

---

祝調試順利！🎯
