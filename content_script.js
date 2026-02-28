// content_script.js (V4.0 Passive Radio Mode)
console.log("[Dual Subtitle] Content script loaded (Passive V4.0).");

let fullSubtitles = [];
let videoElement = null;
let subtitleContainer = null;
let lastProcessedUrl = '';

// 設定狀態變數 (預設值)
let settings = { subtitleMode: 'eng_zho' };

// --- 1. 初始化與設定讀取 ---
function initialize() {
    chrome.storage.sync.get(settings, (items) => {
        settings = items;
        applyModeSettings();
    });
    observeDOM();
}

// 監聽設定的即時變化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.subtitleMode) {
        settings.subtitleMode = changes.subtitleMode.newValue;
        console.log("[Content] Mode changed to:", settings.subtitleMode);
        applyModeSettings();
        
        // 如果模式改變且有暫存資料，重新處理
        if (settings.subtitleMode !== 'disabled' && window.lastRawData) {
             console.log("[Content] Reprocessing data for new mode...");
             const { data, url, langCode } = window.lastRawData;
             processReceivedSubtitle(data, url, langCode);
        }
    }
});

// 應用模式設定 (控制 CSS class 和監聽器)
function applyModeSettings() {
    if (settings.subtitleMode === 'disabled') {
        console.log("[Content] Mode is DISABLED. Tearing down...");
        teardown();
    } else {
        console.log("[Content] Mode is ENABLED. Setting up...");
        // 加入 class 以隱藏原廠字幕
        document.body.classList.add('myvideo-dual-sub-active');
        setupListeners();
        initializeSubtitleDisplay();
    }
}

function setupListeners() {
    if (!chrome.runtime.onMessage.hasListener(messageHandler)) {
        chrome.runtime.onMessage.addListener(messageHandler);
    }
}

function teardown() {
    if (chrome.runtime.onMessage.hasListener(messageHandler)) {
        chrome.runtime.onMessage.removeListener(messageHandler);
    }
    if (subtitleContainer) { subtitleContainer.style.display = 'none'; subtitleContainer.innerHTML = ''; }
    fullSubtitles = [];
    // 移除 class 以恢復原廠字幕
    document.body.classList.remove('myvideo-dual-sub-active');
}

const messageHandler = (request, _sender, sendResponse) => {
    console.log(`[Content] 📨 Message received:`, request.action);

    if (settings.subtitleMode === 'disabled') {
        console.log(`[Content] ⚠️ Mode disabled, ignoring message`);
        return;
    }

    if (request.action === "SUBTITLE_DATA_RECEIVED") {
        const { data, url, langCode } = request;
        console.log(`[Content] 📥 Received ${langCode} subtitle data: ${data ? data.length : 0} bytes`);
        console.log(`[Content] URL: ${url}`);

        if (url === lastProcessedUrl && fullSubtitles.length > 0) {
            console.log(`[Content] ⏭️ Skipping: already processed this URL`);
            return;
        }

        lastProcessedUrl = url;
        window.lastRawData = { data, url, langCode };
        console.log(`[Content] 📥 Processing for mode: ${settings.subtitleMode}`);
        processReceivedSubtitle(data, url, langCode);
    } else {
        console.log(`[Content] ℹ️ Unknown action: ${request.action}`);
    }
};


// --- 2. 核心處理邏輯 ---
function processReceivedSubtitle(data, url, langCode) {
    const primaryTracks = parseVTT(data);
    console.log(`[Content] 📊 Parsed ${langCode} tracks: ${primaryTracks.length} subtitles`);
    if (primaryTracks.length === 0) {
        console.warn(`[Content] ⚠️ No subtitles found in ${langCode} track`);
        return;
    }
    fullSubtitles = []; updateSubtitleDisplay(0);

    // 判斷攔截到的是哪種語言，並準備抓取另一種
    let currentIsZh = langCode === 'zho' || url.includes('_zho_');
    const currentLangCode = currentIsZh ? 'zho' : 'eng';
    const counterpartLangCode = currentIsZh ? 'eng' : 'zho';
    // 嘗試猜測另一種語言的網址
    const counterpartUrl = url.replace(`_${currentLangCode}_`, `_${counterpartLangCode}_`);

    console.log(`[Content] 🔍 Language detection: langCode=${langCode}, currentIsZh=${currentIsZh}, currentLangCode=${currentLangCode}`);
    console.log(`[Content] 🔗 Original: ${url}`);
    console.log(`[Content] 🔗 Counterpart: ${counterpartUrl}`);

    // 總是嘗試抓取另一種語言
    console.log(`[Content] Attempting to fetch counterpart (${counterpartLangCode})...`);
    chrome.runtime.sendMessage({ action: "TRY_FETCH_URL", url: counterpartUrl }, (response) => {
        let zhoTracks = [], engTracks = [];

        // 分配中英軌道資料
        console.log(`[Content] 📬 Counterpart response received:`, response);
        if (currentIsZh) {
            zhoTracks = primaryTracks;
            if (response && response.success) {
                engTracks = parseVTT(response.data);
                console.log(`[Content] ✅ Counterpart (eng) parsed: ${engTracks.length} subtitles`);
            } else {
                console.warn(`[Content] ❌ Failed to fetch counterpart (eng)`, response);
            }
        } else {
            engTracks = primaryTracks;
            if (response && response.success) {
                zhoTracks = parseVTT(response.data);
                console.log(`[Content] ✅ Counterpart (zho) parsed: ${zhoTracks.length} subtitles`);
            } else {
                console.warn(`[Content] ❌ Failed to fetch counterpart (zho)`, response);
            }
        }

        // 根據模式決定顯示內容
        console.log(`[Content] 🎯 Mode: ${settings.subtitleMode}, eng=${engTracks.length}, zho=${zhoTracks.length}`);

        switch (settings.subtitleMode) {
            case 'eng_only':
                // 只顯示英文。如果沒抓到英文，就退回顯示中文。
                const finalEngTracks = engTracks.length > 0 ? engTracks : zhoTracks;
                fullSubtitles = finalEngTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }));
                console.log(`[Content] eng_only: showing ${fullSubtitles.length} subtitles`);
                break;

            case 'eng_zho':
                // 英文在上(text)，中文在下(translation)
                fullSubtitles = mergeTracks(engTracks, zhoTracks);
                console.log(`[Content] eng_zho: merged ${fullSubtitles.length} subtitles`);
                break;

            case 'zho_eng':
                // 中文在上(text)，英文在下(translation)
                fullSubtitles = mergeTracks(zhoTracks, engTracks);
                console.log(`[Content] zho_eng: merged ${fullSubtitles.length} subtitles`);
                break;
        }

        if (fullSubtitles.length > 0) {
            console.log(`[Content] ✅ Ready: ${fullSubtitles.length} subtitles loaded`);
        } else {
            console.warn(`[Content] ⚠️ No subtitles to display!`);
        }

        initializeSubtitleDisplay();
    });
}


// --- 輔助與 UI 函數 (保持不變) ---
function mergeTracks(main, sub) {
    if (main.length === 0) return [];
    // 如果副軌道沒資料，就只顯示主軌道
    if (sub.length === 0) {
        return main.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }));
    }
    return main.map(mItem => {
        const sItem = sub.find(si => (si.start < mItem.end && si.end > mItem.start) && Math.abs(si.start - mItem.start) < 0.5);
        return { start: mItem.start, end: mItem.end, text: mItem.text, translation: sItem ? sItem.text : '' };
    });
}

// (UI, VTT解析, DOM觀察函數與之前相同，請複製完整版)
function createSubtitleContainer() { if (document.getElementById('myvideo-dual-subtitle-container')) return; subtitleContainer = document.createElement('div'); subtitleContainer.id = 'myvideo-dual-subtitle-container'; document.body.appendChild(subtitleContainer); }
function updateSubtitleDisplay(c) { if (!subtitleContainer || settings.subtitleMode === 'disabled') return; const s = fullSubtitles.find(sub => c >= (sub.start - 0.1) && c <= sub.end); if (s && (s.text || s.translation)) { const zh = s.text || '&nbsp;'; const en = s.translation || '&nbsp;'; if (zh === '&nbsp;' && en === '&nbsp;') { subtitleContainer.style.display = 'none'; return; } const h = `<div class="sub-pair"><div class="sub-cn">${zh}</div><div class="sub-en">${en}</div></div>`; if (subtitleContainer.innerHTML !== h) { subtitleContainer.innerHTML = h; subtitleContainer.style.display = 'block'; } } else { subtitleContainer.style.display = 'none'; } }
function videoTimeUpdateHandler() { if (videoElement && fullSubtitles.length > 0) updateSubtitleDisplay(videoElement.currentTime); }
function initializeSubtitleDisplay() { if (settings.subtitleMode === 'disabled') return; videoElement = document.querySelector('video'); if (videoElement) { createSubtitleContainer(); videoElement.removeEventListener('timeupdate', videoTimeUpdateHandler); videoElement.addEventListener('timeupdate', videoTimeUpdateHandler); videoElement.addEventListener('seeking', videoTimeUpdateHandler); } }
function parseVTT(d) {
  const s = [];
  if (!d) return s;

  const lines = d.replace(/\r\n/g, '\n').split('\n');
  // Match: HH:MM:SS.mmm or MM:SS.mmm (with flexible whitespace)
  const timestampRegex = /^\s*(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines, headers, notes, and metadata lines
    if (!trimmedLine ||
        trimmedLine.startsWith('WEBVTT') ||
        trimmedLine.startsWith('NOTE') ||
        trimmedLine.startsWith('X-') ||
        trimmedLine.startsWith('STYLE')) {
      continue;
    }

    // Check if this line contains timestamp
    if (timestampRegex.test(trimmedLine)) {
      const parts = trimmedLine.split('-->');
      if (parts.length !== 2) continue;

      const st = timeStringToSeconds(parts[0].trim());
      const ed = timeStringToSeconds(parts[1].trim());

      // Validate timestamps
      if (isNaN(st) || isNaN(ed) || st < 0 || ed < 0) continue;

      // Collect text from following lines until empty line
      const textLines = [];
      for (let j = i + 1; j < lines.length; j++) {
        const textLine = lines[j].trim();
        if (!textLine) {
          i = j; // Move index to skip processed lines
          break;
        }
        // Skip cue IDs (lines before timestamp that contain only alphanumeric/hyphens)
        if (!/^\d{1,2}:/.test(textLine)) {
          textLines.push(textLine);
        }
      }

      const text = textLines
        .join(' ')
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();

      if (text && st !== ed) {
        s.push({ start: st, end: ed, text: text });
      }
    }
  }

  return s;
}
function timeStringToSeconds(t) {
  if (!t) return 0;
  t = t.trim();
  const parts = t.split(':');
  let h = 0, m = 0, s = 0, ms = 0;

  if (parts.length === 3) {
    // HH:MM:SS.mmm format
    h = parseInt(parts[0]) || 0;
    m = parseInt(parts[1]) || 0;
    const sParts = parts[2].split('.');
    s = parseInt(sParts[0]) || 0;
    ms = parseInt((sParts[1] || '0').padEnd(3, '0')) || 0;
  } else if (parts.length === 2) {
    // MM:SS.mmm format
    m = parseInt(parts[0]) || 0;
    const sParts = parts[1].split('.');
    s = parseInt(sParts[0]) || 0;
    ms = parseInt((sParts[1] || '0').padEnd(3, '0')) || 0;
  }

  return (h * 3600) + (m * 60) + s + (ms / 1000);
}
function observeDOM() { const o = new MutationObserver(() => { if ((!videoElement || !videoElement.isConnected) && settings.subtitleMode !== 'disabled') initializeSubtitleDisplay(); }); o.observe(document.body, { childList: true, subtree: true }); }

initialize();