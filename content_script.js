// content_script.js (V5.0 Passive Radio Mode with Word Frequency)
console.log("[Dual Subtitle] Content script loaded (V5.0 with vocabulary analysis).");

let fullSubtitles = [];
let videoElement = null;
let subtitleContainer = null;
let lastProcessedUrl = '';
let tooltipInitialized = false;

// 設定狀態變數 (預設值)
let settings = { subtitleMode: 'eng' };

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
        // 設定 data-subtitle-mode 屬性用於 CSS 樣式選擇
        document.body.setAttribute('data-subtitle-mode', settings.subtitleMode);
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
    document.body.removeAttribute('data-subtitle-mode');
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
    let currentIsZh = langCode === 'zho' || url.includes('_zho_') || url.includes('/text_0/');
    const currentLangCode = currentIsZh ? 'zho' : 'eng';
    const counterpartLangCode = currentIsZh ? 'eng' : 'zho';

    // 嘗試猜測另一種語言的網址
    let counterpartUrl;
    if (url.includes('/text_0/')) {
        // myVideo format: text_0 is Chinese, try text_1 for English
        counterpartUrl = url.replace('/text_0/', '/text_1/');
    } else if (url.includes('/text_1/')) {
        // myVideo format: text_1 is English, try text_0 for Chinese
        counterpartUrl = url.replace('/text_1/', '/text_0/');
    } else {
        // Old format: use _zho_ / _eng_
        counterpartUrl = url.replace(`_${currentLangCode}_`, `_${counterpartLangCode}_`);
    }

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
            case 'eng':
            case 'eng_only':
                // 只顯示英文。如果沒抓到英文就不顯示。
                fullSubtitles = engTracks.length > 0
                    ? engTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }))
                    : [];
                console.log(`[Content] ✅ eng mode: showing ${fullSubtitles.length} English subtitles (text field contains English, translation='')`, fullSubtitles.length > 0 ? fullSubtitles[0] : 'N/A');
                break;

            case 'zho':
                // 只顯示中文。如果沒抓到中文就不顯示。
                fullSubtitles = zhoTracks.length > 0
                    ? zhoTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }))
                    : [];
                console.log(`[Content] zho: showing ${fullSubtitles.length} Chinese subtitles (no fallback to English)`);
                break;

            case 'eng_zho':
                // 英文在上(text)，中文在下(translation)
                if (engTracks.length > 0 && zhoTracks.length > 0) {
                    fullSubtitles = mergeTracks(engTracks, zhoTracks);
                    console.log(`[Content] eng_zho: merged ${fullSubtitles.length} subtitles (both available)`);
                } else if (engTracks.length > 0) {
                    // 只有英文，翻譯為中文
                    console.log(`[Content] eng_zho: translating English to Chinese...`);
                    chrome.runtime.sendMessage(
                        { action: "TRANSLATE_SUBTITLES", subtitles: engTracks, sourceLang: 'eng' },
                        (response) => {
                            if (response && response.translatedSubtitles) {
                                fullSubtitles = response.translatedSubtitles;
                                console.log(`[Content] eng_zho: showing ${fullSubtitles.length} subtitles (translated)`);
                                initializeSubtitleDisplay();
                            } else {
                                console.warn(`[Content] eng_zho: translation failed`);
                                fullSubtitles = engTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }));
                                initializeSubtitleDisplay();
                            }
                        }
                    );
                    return;
                } else if (zhoTracks.length > 0) {
                    // 只有中文，翻譯為英文放上方
                    console.log(`[Content] eng_zho: translating Chinese to English...`);
                    chrome.runtime.sendMessage(
                        { action: "TRANSLATE_SUBTITLES", subtitles: zhoTracks, sourceLang: 'zho' },
                        (response) => {
                            if (response && response.translatedSubtitles) {
                                fullSubtitles = response.translatedSubtitles.map(item => ({
                                    start: item.start,
                                    end: item.end,
                                    text: item.translation, // 英文翻譯放上面
                                    translation: item.text // 原始中文放下面
                                }));
                                console.log(`[Content] eng_zho: showing ${fullSubtitles.length} subtitles (translated)`);
                                initializeSubtitleDisplay();
                            } else {
                                console.warn(`[Content] eng_zho: translation failed`);
                                fullSubtitles = zhoTracks.map(item => ({ start: item.start, end: item.end, text: '', translation: item.text }));
                                initializeSubtitleDisplay();
                            }
                        }
                    );
                    return;
                } else {
                    fullSubtitles = [];
                }
                break;

            case 'zho_eng':
                // 中文在上(text)，英文在下(translation)
                if (zhoTracks.length > 0 && engTracks.length > 0) {
                    fullSubtitles = mergeTracks(zhoTracks, engTracks);
                    console.log(`[Content] zho_eng: merged ${fullSubtitles.length} subtitles (both available)`);
                } else if (zhoTracks.length > 0) {
                    // 只有中文，翻譯為英文
                    console.log(`[Content] zho_eng: translating Chinese to English...`);
                    chrome.runtime.sendMessage(
                        { action: "TRANSLATE_SUBTITLES", subtitles: zhoTracks, sourceLang: 'zho' },
                        (response) => {
                            if (response && response.translatedSubtitles) {
                                fullSubtitles = response.translatedSubtitles;
                                console.log(`[Content] zho_eng: showing ${fullSubtitles.length} subtitles (translated)`);
                                initializeSubtitleDisplay();
                            } else {
                                console.warn(`[Content] zho_eng: translation failed`);
                                fullSubtitles = zhoTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: item.text }));
                                initializeSubtitleDisplay();
                            }
                        }
                    );
                    return;
                } else if (engTracks.length > 0) {
                    // 只有英文，翻譯為中文放上方
                    console.log(`[Content] zho_eng: translating English to Chinese...`);
                    chrome.runtime.sendMessage(
                        { action: "TRANSLATE_SUBTITLES", subtitles: engTracks, sourceLang: 'eng' },
                        (response) => {
                            if (response && response.translatedSubtitles) {
                                fullSubtitles = response.translatedSubtitles.map(item => ({
                                    start: item.start,
                                    end: item.end,
                                    text: item.translation,
                                    translation: item.text
                                }));
                                console.log(`[Content] zho_eng: showing ${fullSubtitles.length} subtitles (translated)`);
                                initializeSubtitleDisplay();
                            } else {
                                console.warn(`[Content] zho_eng: translation failed`);
                                fullSubtitles = engTracks.map(item => ({ start: item.start, end: item.end, text: '', translation: item.text }));
                                initializeSubtitleDisplay();
                            }
                        }
                    );
                    return;
                } else {
                    fullSubtitles = [];
                }
                break;

            case 'eng_zho_translate':
                // 英文在上(text)，中文翻譯或原文在下(translation)
                if (engTracks.length > 0 && zhoTracks.length > 0) {
                    // 兩種都有，直接合併
                    fullSubtitles = mergeTracks(engTracks, zhoTracks);
                    console.log(`[Content] eng_zho_translate: merged ${fullSubtitles.length} subtitles (both available)`);
                } else if (engTracks.length > 0) {
                    // 只有英文，翻譯英文為中文
                    console.log(`[Content] eng_zho_translate: translating English to Chinese...`);
                    chrome.runtime.sendMessage(
                        { action: "TRANSLATE_SUBTITLES", subtitles: engTracks, sourceLang: 'eng' },
                        (response) => {
                            if (response && response.translatedSubtitles) {
                                fullSubtitles = response.translatedSubtitles;
                                console.log(`[Content] eng_zho_translate: showing ${fullSubtitles.length} subtitles (translated)`);
                                initializeSubtitleDisplay();
                            } else {
                                console.warn(`[Content] Translation failed`);
                                fullSubtitles = engTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }));
                                initializeSubtitleDisplay();
                            }
                        }
                    );
                    return;
                } else if (zhoTracks.length > 0) {
                    // 只有中文，翻譯中文為英文
                    console.log(`[Content] eng_zho_translate: translating Chinese to English...`);
                    chrome.runtime.sendMessage(
                        { action: "TRANSLATE_SUBTITLES", subtitles: zhoTracks, sourceLang: 'zho' },
                        (response) => {
                            if (response && response.translatedSubtitles) {
                                fullSubtitles = response.translatedSubtitles.map(item => ({
                                    start: item.start,
                                    end: item.end,
                                    text: item.translation, // 英文翻譯放在上面
                                    translation: item.text // 原始中文放在下面
                                }));
                                console.log(`[Content] eng_zho_translate: showing ${fullSubtitles.length} subtitles (translated)`);
                                initializeSubtitleDisplay();
                            } else {
                                console.warn(`[Content] Translation failed`);
                                fullSubtitles = zhoTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }));
                                initializeSubtitleDisplay();
                            }
                        }
                    );
                    return;
                } else {
                    console.warn(`[Content] eng_zho_translate: No subtitles available`);
                    fullSubtitles = [];
                }
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
        // 當副軌道為空時，副軌道欄位使用主軌道的內容（作為備選方案）
        return main.map(item => ({ start: item.start, end: item.end, text: item.text, translation: item.text }));
    }
    return main.map(mItem => {
        const sItem = sub.find(si => (si.start < mItem.end && si.end > mItem.start) && Math.abs(si.start - mItem.start) < 0.5);
        return { start: mItem.start, end: mItem.end, text: mItem.text, translation: sItem ? sItem.text : mItem.text };
    });
}

// (UI, VTT解析, DOM觀察函數與之前相同，請複製完整版)
function createSubtitleContainer() { if (document.getElementById('myvideo-dual-subtitle-container')) return; subtitleContainer = document.createElement('div'); subtitleContainer.id = 'myvideo-dual-subtitle-container'; document.body.appendChild(subtitleContainer); }
function updateSubtitleDisplay(c) {
    if (!subtitleContainer || settings.subtitleMode === 'disabled') return;
    const s = fullSubtitles.find(sub => c >= (sub.start - 0.1) && c <= sub.end);
    if (s && (s.text || s.translation)) {
        let zh = '', en = '';

        // Map subtitle content to correct display variables based on mode
        if (settings.subtitleMode === 'eng' || settings.subtitleMode === 'eng_only') {
            // English-only: English subtitle in text field
            en = s.text || '&nbsp;';
            zh = '&nbsp;';
        } else if (settings.subtitleMode === 'zho' || settings.subtitleMode === 'zho_only') {
            // Chinese-only: Chinese subtitle in text field
            zh = s.text || '&nbsp;';
            en = '&nbsp;';
        } else if (settings.subtitleMode === 'eng_zho') {
            // English on top, Chinese on bottom: English in text, Chinese in translation
            en = s.text || '&nbsp;';
            zh = s.translation || '&nbsp;';
        } else if (settings.subtitleMode === 'zho_eng') {
            // Chinese on top, English on bottom: Chinese in text, English in translation
            zh = s.text || '&nbsp;';
            en = s.translation || '&nbsp;';
        } else if (settings.subtitleMode === 'eng_zho_translate') {
            // English on top, translated Chinese on bottom: English in text, translation in translation
            en = s.text || '&nbsp;';
            zh = s.translation || '&nbsp;';
        }

        if (zh === '&nbsp;' && en === '&nbsp;') {
            subtitleContainer.style.display = 'none';
            return;
        }
        if (en !== '&nbsp;') {
            en = markAdvancedWords(en);
        }

        // Conditionally render only necessary subtitle divs
        let h = '<div class="sub-pair">';
        if (zh !== '&nbsp;') {
            // Use different class for translated Chinese (white color) vs original Chinese (blue)
            const isTranslated = settings.subtitleMode === 'eng_zho_translate' || settings.subtitleMode === 'zho_eng_translate';
            const cnClass = isTranslated ? 'sub-cn-translate' : 'sub-cn';
            h += `<div class="${cnClass}">${zh}</div>`;
        }
        if (en !== '&nbsp;') {
            h += `<div class="sub-en">${en}</div>`;
        }
        h += '</div>';

        console.log(`[updateSubtitleDisplay] mode=${settings.subtitleMode}, zh="${zh.substring(0,30)}", en="${en.substring(0,30)}"`);

        if (subtitleContainer.innerHTML !== h) {
            subtitleContainer.innerHTML = h;
            subtitleContainer.style.display = 'block';
            if (!tooltipInitialized && typeof initializeTooltips === 'function') {
                createTooltipContainer();
                initializeTooltips();
                tooltipInitialized = true;
            }
        }
    } else {
        subtitleContainer.style.display = 'none';
    }
}

// Mark advanced words in English subtitles
function markAdvancedWords(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/([a-z'-]+)/gi, (match) => {
        if (typeof ADVANCED_WORDS !== 'undefined' && ADVANCED_WORDS.hasOwnProperty(match.toLowerCase())) {
            return `<span class="advanced-word" data-word="${match.toLowerCase()}" title="Advanced word">${match}*</span>`;
        }
        return match;
    });
}
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