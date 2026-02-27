# myVideo Dual Transcript Plugin | myVideo 雙語字幕外掛

A Chrome/Edge extension that enables **bilingual subtitles (English/Chinese)** for myVideo streaming content with flexible display modes.

一個 Chrome/Edge 延伸功能，為 myVideo 串流內容啟用**雙語字幕（英文/中文）**，具有靈活的顯示模式。

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## Features | 功能特性

- 🎬 **Dual Language Subtitles** - Display English and Chinese subtitles simultaneously
- 🎬 **雙語字幕** - 同時顯示英文和中文字幕

- 🔄 **Multiple Display Modes**:
  - **Disabled** - Use original myVideo subtitles
  - **English Only** - Show only English subtitles (with fallback to Chinese if unavailable)
  - **English / Chinese (双語)** - English on top, Chinese below
  - **Chinese / English (双語)** - Chinese on top, English below

- 🔄 **多種顯示模式**：
  - **關閉外掛** - 使用原廠 myVideo 字幕
  - **英文只** - 僅顯示英文字幕（若無英文則退回中文）
  - **英文 / 中文（双語）** - 英文在上，中文在下
  - **中文 / 英文（双語）** - 中文在上，英文在下

- ⚙️ **Real-time Settings** - Change subtitle modes instantly without refreshing
- ⚙️ **即時設定** - 無需重新整理即可立即更改字幕模式

- 📊 **Intelligent Subtitle Fetching** - Automatically intercepts and processes VTT subtitle files
- 📊 **智能字幕抓取** - 自動攔截和處理 VTT 字幕檔案

- 🎨 **Beautiful UI** - Customizable subtitle display with backdrop blur and shadow effects
- 🎨 **精美 UI** - 具有背景模糊和陰影效果的可自訂字幕顯示

- 📱 **Responsive** - Adapts to fullscreen and different video player sizes
- 📱 **響應式設計** - 適應全螢幕和不同視訊播放器尺寸

## How It Works | 工作原理

```
English (英文):
┌─────────────────────────────────────────────────────┐
│                   Video Page Load                    │
└────────────────────┬────────────────────────────────┘

中文（中文）：
┌─────────────────────────────────────────────────────┐
│                   視訊頁面載入                        │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │  Content Script       │ / │內容腳本     │
         │  (Monitors subtitles) │   │（監視字幕）│
         └───────────┬───────────┘
                     │
         ┌───────────▼──────────────┐
         │  Background Service      │ / │背景服務工作者│
         │  (Fetches VTT files)     │   │（取得 VTT）  │
         └───────────┬──────────────┘
                     │
     ┌───────────────▼────────────────────┐
     │  Parse & Merge Subtitles           │ / │解析與合併字幕  │
     │  (Sync by timestamp)               │   │（按時間戳同步）│
     └───────────────┬────────────────────┘
                     │
     ┌───────────────▼────────────────────┐
     │  Display in Subtitle Container     │ / │在字幕容器中顯示 │
     │  (Follows video playback time)     │   │（追蹤播放時間） │
     └────────────────────────────────────┘
```

## Installation | 安裝方法

### Step 1: Download the Plugin | 步驟 1：下載外掛

**Option A: Clone with Git | 選項 A：使用 Git 複製**

```bash
git clone https://github.com/your-username/MyVideoDualTranscripts.git
cd MyVideoDualTranscripts
```

**Option B: Download as ZIP | 選項 B：下載為 ZIP**

1. Click the **Code** button (綠色按鈕) on GitHub
   點擊 GitHub 上的 **Code** 按鈕

2. Select **Download ZIP** (下載 ZIP)
   選擇 **Download ZIP**

3. Extract the folder to a location you can remember (e.g., `D:\Plugins\MyVideoDualTranscripts`)
   將資料夾解壓到你記得的位置（例如 `D:\Plugins\MyVideoDualTranscripts`）

---

### Step 2: Open Extensions Page | 步驟 2：開啟延伸功能頁面

**For Chrome | Chrome 用戶：**

1. Open Chrome browser
   開啟 Chrome 瀏覽器

2. Click the **Menu** (三個點) in top-right corner
   點擊右上角的**菜單**（三個點）

3. Select **More tools** → **Extensions**
   選擇 **More tools** → **Extensions**

4. Or paste this in address bar: `chrome://extensions/`
   或在網址列貼上：`chrome://extensions/`

**For Edge | Edge 用戶：**

1. Open Edge browser
   開啟 Edge 瀏覽器

2. Click the **Menu** (三個點) in top-right corner
   點擊右上角的**菜單**（三個點）

3. Select **Extensions** → **Manage extensions**
   選擇 **Extensions** → **Manage extensions**

4. Or paste this in address bar: `edge://extensions/`
   或在網址列貼上：`edge://extensions/`

---

### Step 3: Enable Developer Mode | 步驟 3：啟用開發者模式

1. Look at the **top-right corner** of the extensions page
   查看延伸功能頁面的**右上角**

2. Find the toggle for **Developer Mode** (開發者模式)
   找到**開發者模式**的切換開關

3. **Click to enable it** (切換為藍色/開啟)
   **點擊啟用它**（應該變成藍色）

**Visual Guide | 視覺指南：**

```
┌─────────────────────────────────────────┐
│  Extensions / 延伸功能                  │
├─────────────────────────────────────────┤
│                          [Developer Mode]  ← Click here! / 點這裡！
│                              ▣ (toggle to ON)
└─────────────────────────────────────────┘
```

---

### Step 4: Load the Plugin | 步驟 4：載入外掛

1. After enabling Developer Mode, new buttons appear
   啟用開發者模式後，會出現新按鈕

2. Click the **Load unpacked** button (載入未封裝項目)
   點擊**載入未封裝項目**按鈕

3. A file browser will open
   會開啟檔案瀏覽器

4. Navigate to your plugin folder (e.g., `D:\Plugins\MyVideoDualTranscripts`)
   導航到你的外掛資料夾（例如 `D:\Plugins\MyVideoDualTranscripts`）

5. Select the folder and click **Select Folder**
   選擇資料夾並點擊 **Select Folder**

**What you should see | 你應該看到的：**

```
✅ After loading successfully:
   - Plugin appears in the extensions list
   - Icon shows in toolbar (top-right)
   - Plugin name: "myVideo Dual Transcript (V4.0 Passive Stable)"

✅ 成功載入後：
   - 外掛出現在延伸功能清單中
   - 圖示顯示在工具列（右上角）
   - 外掛名稱："myVideo Dual Transcript (V4.0 Passive Stable)"
```

---

### Step 5: Start Using | 步驟 5：開始使用

1. **Visit myVideo**
   訪問 [myVideo](https://www.myvideo.net.tw)

2. **Play a video with subtitles**
   播放有字幕的視訊

3. **Click the plugin icon** in your toolbar (top-right)
   點擊工具列中的外掛圖示（右上角）

4. **Select your subtitle mode** from the popup
   從彈出視窗選擇你的字幕模式：
   - **關閉外掛** - Use original myVideo subtitles / 使用原廠字幕
   - **英文** - English only / 僅英文
   - **英文 / 中文** - English on top, Chinese below / 英文上、中文下
   - **中文 / 英文** - Chinese on top, English below / 中文上、英文下

5. **Enjoy your dual subtitles!** 🎬
   享受雙語字幕！

---

## Troubleshooting Installation | 安裝疑難排解

### Problem 1: "Load unpacked" button doesn't appear | 問題 1：「載入未封裝項目」按鈕不出現

**Solution | 解決方案：**

- Make sure **Developer Mode is ON** (toggle should be blue)
  確保**開發者模式已開啟**（切換應該是藍色）

- Try refreshing the page (F5)
  嘗試重新整理頁面 (F5)

- Restart your browser
  重新啟動瀏覽器

---

### Problem 2: "Cannot find manifest.json" error | 問題 2：「找不到 manifest.json」錯誤

**Solution | 解決方案：**

- Make sure you selected the correct folder containing:
  確保你選擇的資料夾包含：
  ```
  ✓ manifest.json
  ✓ popup.html
  ✓ popup.js
  ✓ content_script.js
  ✓ background.js
  ✓ styles.css
  ```

- Don't select a parent folder - select the **MyVideoDualTranscripts** folder itself
  不要選擇父資料夾 - 選擇 **MyVideoDualTranscripts** 資料夾本身

---

### Problem 3: Plugin loads but no subtitles appear | 問題 3：外掛已載入但沒有字幕出現

**Solution | 解決方案：**

1. Make sure the video has subtitles
   確保視訊有字幕

2. Check if original myVideo subtitles work first
   先檢查原廠 myVideo 字幕是否正常

3. Open DevTools (F12) and check console for errors
   開啟開發者工具 (F12) 並檢查控制台是否有錯誤

4. Try clicking the plugin icon and changing modes
   嘗試點擊外掛圖示並更改模式

---

### Problem 4: Plugin icon doesn't appear in toolbar | 問題 4：工具列中沒有外掛圖示

**Solution | 解決方案：**

- Click the **Extensions icon** (拼圖片) in your toolbar
  點擊工具列中的**延伸功能圖示**（拼圖片）

- Find "myVideo Dual Transcript"
  找到「myVideo Dual Transcript」

- Click the **pin icon** to pin it to your toolbar
  點擊**釘選圖示**以將其釘選到工具列

---

### Problem 5: Getting permission errors | 問題 5：收到權限錯誤

**Solution | 解決方案：**

The extension needs these permissions:
外掛需要這些權限：

- `scripting` - To inject subtitle code / 注入字幕程式碼
- `storage` - To save your preferences / 儲存你的偏好設定
- `webRequest` - To detect subtitles / 偵測字幕

These are safe and necessary. Click **Allow** when prompted.
這些是安全必需的。出現提示時點擊 **Allow**。

---

## Updating the Plugin | 更新外掛

### How to update to the latest version | 如何更新到最新版本

1. Download the latest version from GitHub
   從 GitHub 下載最新版本

2. Go to `chrome://extensions/`
   前往 `chrome://extensions/`

3. Find "myVideo Dual Transcript" in the list
   在清單中找到「myVideo Dual Transcript」

4. Click the **Reload** icon (circular arrow)
   點擊**重新載入**圖示（圓形箭頭）

5. Done! The plugin is now updated.
   完成！外掛現已更新。

---

## Uninstall | 卸載

### How to remove the plugin | 如何移除外掛

1. Go to `chrome://extensions/` (or `edge://extensions/`)
   前往 `chrome://extensions/` 或 `edge://extensions/`

2. Find "myVideo Dual Transcript"
   找到「myVideo Dual Transcript」

3. Click the **Remove** button (or trash icon)
   點擊**移除**按鈕（或垃圾桶圖示）

4. Confirm when asked
   出現確認時點擊確認

Original myVideo subtitles will work normally after uninstall.
卸載後原廠 myVideo 字幕將正常運作。

## Usage | 使用方法

### Quick Start | 快速開始

1. Visit any myVideo video page
   訪問任何 myVideo 視訊頁面

2. Click the plugin icon in the toolbar
   點擊工具列中的外掛圖示

3. Select your preferred subtitle mode
   選擇您偏好的字幕模式

4. Watch with dual subtitles!
   享受雙語字幕！

### Subtitle Modes | 字幕模式

| Mode / 模式 | Primary / 主要 | Secondary / 次要 | Use Case / 使用情景 |
|---|---|---|---|
| **Disabled** | Original myVideo | N/A | Use platform defaults / 使用平台預設值 |
| **English Only** | English | Fallback to Chinese | Learn English only / 僅學習英文 |
| **Eng / Zho** | English (top) | Chinese (bottom) | English learners / 英文學習者 |
| **Zho / Eng** | Chinese (top) | English (bottom) | Chinese learners / 中文學習者 |

## File Structure | 檔案結構

```
MyVideoDualTranscripts/
├── manifest.json              # Extension configuration (MV3) / 延伸功能配置
├── popup.html                 # Settings popup UI / 設定彈出視窗 UI
├── popup.js                   # Popup logic / 彈出視窗邏輯
├── background.js              # Background service worker / 背景服務工作者
├── content_script.js          # Main subtitle processing / 主字幕處理邏輯
├── inject_interceptor.js      # Fetch/XHR interception / 請求攔截
├── styles.css                 # Subtitle display styling / 字幕顯示樣式
├── icon.png                   # Extension icon (128x128) / 延伸功能圖示
└── README.md                  # This file / 此檔案
```

## Technical Architecture | 技術架構

### Core Components | 核心組件

#### 1. **manifest.json** - Extension Configuration | 延伸功能配置

- Declares permissions for myVideo domain
  為 myVideo 網域宣告權限

- Registers background service worker
  註冊背景服務工作者

- Defines popup interface
  定義彈出視窗介面

- Injects content script and styles
  注入內容腳本和樣式

#### 2. **background.js** - Service Worker | 服務工作者

- **WebRequest Monitoring**: Detects VTT subtitle requests
  **WebRequest 監視**：偵測 VTT 字幕請求

- **URL Caching**: Prevents duplicate processing with 10-second cache
  **URL 緩存**：以 10 秒快取防止重複處理

- **Data Fetching**: Retrieves subtitle content when detected
  **資料抓取**：偵測時取得字幕內容

- **IPC Layer**: Handles message communication with content script
  **IPC 層**：處理與內容腳本的訊息通訊

- **Language Detection**: Identifies English (eng) vs Chinese (zho) subtitles
  **語言偵測**：識別英文 (eng) 與中文 (zho) 字幕

#### 3. **content_script.js** - Main Logic (V4.0) | 主要邏輯

The heart of the plugin with the following responsibilities:
外掛的核心，具有以下責任：

**Initialization & Settings | 初始化與設定**

- Reads user preferences from Chrome Storage
  從 Chrome 儲存空間讀取使用者偏好設定

- Listens for real-time setting changes
  監聽即時設定變更

- Manages subtitle container lifecycle
  管理字幕容器生命週期

**Subtitle Processing | 字幕處理**

- Parses VTT format (timestamps + text)
  解析 VTT 格式（時間戳 + 文字）

- Attempts to fetch both languages simultaneously
  嘗試同時取得兩種語言

- Merges tracks by timestamp overlap detection
  按時間戳重疊偵測合併軌道

- Applies chosen display mode
  應用所選的顯示模式

**Display & Sync | 顯示與同步**

- Creates floating subtitle container
  建立浮動字幕容器

- Syncs with video playback via `timeupdate` events
  透過 `timeupdate` 事件與視訊播放同步

- Updates subtitles every frame
  每幀更新字幕

- Handles seeking and fullscreen
  處理搜尋和全螢幕

**Key Functions | 關鍵函數**

```javascript
parseVTT(data)              // Parse VTT format into objects / 解析 VTT 格式
mergeTracks(main, sub)      // Align subtitles by timestamp / 按時間戳對齐字幕
updateSubtitleDisplay(t)    // Show current subtitle / 顯示當前字幕
processReceivedSubtitle()   // Main orchestrator / 主要協調器
```

#### 4. **popup.html/js** - User Interface | 使用者介面

- Radio button interface for 4 modes
  4 種模式的單選按鈕介面

- Syncs with Chrome Storage
  與 Chrome 儲存空間同步

- Real-time validation
  即時驗證

#### 5. **styles.css** - Styling | 樣式

- Fixed positioning below video
  固定位置在視訊下方

- Responsive font sizes (normal + fullscreen)
  響應式字體大小（普通 + 全螢幕）

- Backdrop blur effect
  背景模糊效果

- High z-index to stay on top
  高 z-index 保持在頂端

## How Subtitle Merging Works | 字幕合併如何工作

```javascript
// English (英文) & Chinese (中文) matched by time overlap
English:  [0:00 - 0:05] "Hello"
Chinese:  [0:00 - 0:05] "你好"
          ↓
Result:   {
  text: "Hello",
  translation: "你好",
  start: 0, end: 5
}
```

The plugin uses **timestamp overlap** to align subtitles, not exact matching. If an English subtitle overlaps with a Chinese subtitle within 0.5 seconds, they're paired together.

外掛使用**時間戳重疊**對齊字幕，而非精確匹配。如果英文字幕與中文字幕在 0.5 秒內重疊，它們會配對在一起。

## Permissions Required | 所需權限

| Permission / 權限 | Purpose / 目的 |
|---|---|
| `scripting` | Inject content script on myVideo pages / 在 myVideo 頁面注入內容腳本 |
| `storage` | Save user subtitle mode preference / 儲存使用者字幕模式偏好設定 |
| `webRequest` | Monitor for VTT subtitle requests / 監視 VTT 字幕請求 |
| `host_permissions` (myvideo.net.tw) | Access myVideo domain / 存取 myVideo 網域 |

## Subtitle Format Support | 支援的字幕格式

- **VTT (WebVTT)** - Primary format used by myVideo / myVideo 使用的主要格式

- Pattern: `/text_{lang}_{id}.vtt`
  - `text_zho_*` = Chinese subtitle / 中文字幕
  - `text_eng_*` = English subtitle / 英文字幕

## Troubleshooting | 疑難排解

### Issue: No subtitles appearing | 問題：沒有字幕出現

1. **Check console** - Open DevTools (F12) and look for `[Content]` or `[Background]` logs
   **檢查控制台** - 開啟開發者工具 (F12) 並查找 `[Content]` 或 `[Background]` 日誌

2. **Verify VTT files** - Some videos might not have both language tracks
   **驗證 VTT 檔案** - 某些視訊可能沒有兩種語言軌道

3. **Refresh page** - Clear cache and reload the video page
   **重新整理頁面** - 清除快取並重新載入視訊頁面

4. **Mode disabled?** - Check plugin popup settings aren't set to "disabled"
   **模式已停用？** - 檢查外掛彈出視窗設定是否未設定為「已停用」

### Issue: Subtitles out of sync | 問題：字幕不同步

- This can happen with videos that have timing issues
  這可能發生在具有計時問題的視訊中

- Try switching subtitle mode or refreshing the page
  嘗試切換字幕模式或重新整理頁面

- VTT files might have inconsistent timestamp intervals
  VTT 檔案可能有不一致的時間戳間隔

### Issue: Only one language showing | 問題：僅顯示一種語言

- The plugin fetches both languages, but some videos may only have one
  外掛會抓取兩種語言，但某些視訊可能只有一種

- Use "English Only" mode as fallback
  使用「英文只」模式作為備用方案

- Check myVideo's original subtitles in settings
  檢查 myVideo 設定中的原始字幕

## Performance Considerations | 效能考量

- **Lightweight**: < 30KB total size / **輕量級**：< 30KB 總大小
- **Lazy Loading**: Content script only runs on myVideo.net.tw / **延遲載入**：內容腳本僅在 myVideo.net.tw 上執行
- **Efficient Parsing**: Single-pass VTT parser / **高效解析**：單遍 VTT 解析器
- **Memory Caching**: 10-second dedup window for subtitle URLs / **記憶體快取**：字幕 URL 的 10 秒去重視窗
- **No External APIs**: All processing is local / **無外部 API**：所有處理都是本地的

## Privacy & Security | 隱私與安全

✅ **No Data Collection** - All processing happens locally
✅ **無資料收集** - 所有處理都在本地進行

✅ **No External Calls** - Only communicates with myVideo CDN
✅ **無外部呼叫** - 僅與 myVideo CDN 通訊

✅ **Open Source** - Full code transparency
✅ **開源** - 完全程式碼透明度

✅ **No Ads or Tracking** - Clean, simple extension
✅ **無廣告或追蹤** - 乾淨、簡潔的延伸功能

## Development | 開發

### Debug Mode | 偵錯模式

Enable console logging:
啟用控制台日誌：

```javascript
// Check background service worker logs / 檢查背景服務工作者日誌
chrome://extensions/
→ Click "Details" on this extension / 點擊此延伸功能上的「詳細資料」
→ Click "Background Page" / 點擊「背景頁面」

// Check content script logs / 檢查內容腳本日誌
F12 on any myVideo page → Console tab / myVideo 頁面上的 F12 → 控制台標籤
```

### Testing | 測試

1. Load extension in unpacked mode
   以未封裝模式載入延伸功能

2. Visit myVideo video page
   訪問 myVideo 視訊頁面

3. Open DevTools (F12)
   開啟開發者工具 (F12)

4. Watch console for `[Content]` and `[Background]` messages
   在控制台中監視 `[Content]` 和 `[Background]` 訊息

5. Change subtitle modes in popup to test switching
   在彈出視窗中更改字幕模式以測試切換

### Key Logging Markers | 關鍵日誌標記

- `[Content]` - Main subtitle processing / 主字幕處理
- `[Background]` - VTT detection and fetching / VTT 偵測和抓取
- `[Dual Subtitle]` - Interceptor module / 攔截器模組

## Future Improvements | 未來改進

- [ ] Support for more streaming platforms / 支援更多串流平台
- [ ] Custom font size/color preferences / 自訂字體大小/顏色偏好設定
- [ ] Subtitle position adjustment / 字幕位置調整
- [ ] Translation service integration / 翻譯服務整合
- [ ] Keyboard shortcuts for mode switching / 模式切換的鍵盤快捷鍵
- [ ] Caching frequently-used subtitle pairs / 緩存常用字幕對

## Browser Compatibility | 瀏覽器相容性

| Browser / 瀏覽器 | Version / 版本 | Status / 狀態 |
|---|---|---|
| Chrome | 88+ | ✅ Full Support / 完全支援 |
| Edge | 88+ | ✅ Full Support / 完全支援 |
| Firefox | - | ❌ Not yet / 尚未支援 |
| Safari | - | ❌ Not yet / 尚未支援 |

## License | 授權

MIT License - Feel free to use, modify, and distribute.
MIT 授權 - 可自由使用、修改和發佈。

## Contributing | 貢獻

Found a bug or have a feature request?
發現了 Bug 或有功能請求？

1. Check existing issues first / 先檢查現有問題
2. Provide detailed reproduction steps / 提供詳細的重現步驟
3. Include console logs from DevTools / 包括來自開發者工具的控制台日誌
4. Suggest your solution if possible / 如果可能，建議您的解決方案

## Changelog | 更新日誌

### v3.0.0 (Current / 目前)

- ✨ Radio button UI for subtitle modes / 字幕模式的單選按鈕 UI
- 🔄 Real-time mode switching without refresh / 無需重新整理的即時模式切換
- 📊 Improved subtitle merging algorithm / 改進的字幕合併演算法
- 🎨 Enhanced styling with backdrop blur / 帶有背景模糊的增強樣式
- 🐛 Fixed edge cases in VTT parsing / 修復 VTT 解析中的邊界情況

### v2.0.0

- Initial dual subtitle support / 初始雙字幕支援
- Basic English/Chinese merging / 基本英文/中文合併

### v1.0.0

- Single language subtitle extraction / 單語言字幕提取

## Support | 支援

For issues or questions:
如有問題或疑問：

1. Check the troubleshooting section above / 檢查上面的疑難排解部分
2. Review console logs in DevTools / 在開發者工具中查看控制台日誌
3. Test with different videos on myVideo / 使用 myVideo 上的不同視訊進行測試

---

**Made with ❤️ for English and Chinese learners using myVideo**

**用愛心為使用 myVideo 的英文和中文學習者製作**
