// content_script.js (V4.0 Radio Mode Logic)
console.log("[Dual Subtitle] Content script loaded (V4.0 Radio Mode).");

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
    document.body.classList.remove('myvideo-dual-sub-active');
}

const messageHandler = (request, sender, sendResponse) => {
    if (settings.subtitleMode === 'disabled') return;
    if (request.action === "SUBTITLE_DATA_RECEIVED") {
        const { data, url, langCode } = request;
        if (url === lastProcessedUrl && fullSubtitles.length > 0) return;
        lastProcessedUrl = url;
        window.lastRawData = { data, url, langCode };
        console.log(`[Content] 📥 Received ${langCode.toUpperCase()} data. Processing for mode: ${settings.subtitleMode}`);
        processReceivedSubtitle(data, url, langCode);
    }
};


// --- 2. 核心處理邏輯 (【關鍵修改點】) ---
function processReceivedSubtitle(data, url, langCode) {
    const primaryTracks = parseVTT(data);
    if (primaryTracks.length === 0) return;
    fullSubtitles = []; updateSubtitleDisplay(0);

    // 準備抓取另一種語言的網址
    const counterpartLangCode = (langCode === 'zho') ? 'eng' : 'zho';
    const counterpartUrl = url.replace(`/text_${langCode}_`, `/text_${counterpartLangCode}_`);

    // 總是嘗試抓取另一種語言，以便同時擁有中英資料
    chrome.runtime.sendMessage({ action: "TRY_FETCH_URL", url: counterpartUrl }, (response) => {
        let zhoTracks = [], engTracks = [];

        // 分配中英軌道資料
        if (langCode === 'zho') {
            zhoTracks = primaryTracks;
            if (response && response.success) engTracks = parseVTT(response.data);
        } else {
            engTracks = primaryTracks;
            if (response && response.success) zhoTracks = parseVTT(response.data);
        }

        // 根據模式決定顯示內容
        switch (settings.subtitleMode) {
            case 'eng_only':
                // 只顯示英文。如果沒抓到英文，就退回顯示中文。
                const finalEngTracks = engTracks.length > 0 ? engTracks : zhoTracks;
                fullSubtitles = finalEngTracks.map(item => ({ start: item.start, end: item.end, text: item.text, translation: '' }));
                break;

            case 'eng_zho':
                // 英文在上(text)，中文在下(translation)
                fullSubtitles = mergeTracks(engTracks, zhoTracks);
                break;

            case 'zho_eng':
                // 中文在上(text)，英文在下(translation)
                fullSubtitles = mergeTracks(zhoTracks, engTracks);
                break;
            
            case 'disabled':
                // 理論上不會執行到這裡
                fullSubtitles = [];
                break;
        }
        
        initializeSubtitleDisplay();
    });
}


// --- 輔助與 UI 函數 ---
// 合併函數修改：合併主/副軌道
function mergeTracks(main, sub) {
    // 如果主軌道沒資料，直接返回空陣列
    if (main.length === 0) return [];
    
    return main.map(mItem => {
        const sItem = sub.find(si => (si.start < mItem.end && si.end > mItem.start) && Math.abs(si.start - mItem.start) < 0.5);
        return { start: mItem.start, end: mItem.end, text: mItem.text, translation: sItem ? sItem.text : '' };
    });
}

// (以下 UI 相關函數與 styles.css 配合， text 永遠在上方(sub-cn樣式)， translation 在下方(sub-en樣式))
function createSubtitleContainer() { if (document.getElementById('myvideo-dual-subtitle-container')) return; subtitleContainer = document.createElement('div'); subtitleContainer.id = 'myvideo-dual-subtitle-container'; document.body.appendChild(subtitleContainer); }
function updateSubtitleDisplay(c) { if (!subtitleContainer || settings.subtitleMode === 'disabled') return; const s = fullSubtitles.find(sub => c >= (sub.start - 0.1) && c <= sub.end); if (s && (s.text || s.translation)) { const zh = s.text || '&nbsp;'; const en = s.translation || '&nbsp;'; if (zh === '&nbsp;' && en === '&nbsp;') { subtitleContainer.style.display = 'none'; return; } const h = `<div class="sub-pair"><div class="sub-cn">${zh}</div><div class="sub-en">${en}</div></div>`; if (subtitleContainer.innerHTML !== h) { subtitleContainer.innerHTML = h; subtitleContainer.style.display = 'block'; } } else { subtitleContainer.style.display = 'none'; } }
function videoTimeUpdateHandler() { if (videoElement && fullSubtitles.length > 0) updateSubtitleDisplay(videoElement.currentTime); }
function initializeSubtitleDisplay() { if (settings.subtitleMode === 'disabled') return; videoElement = document.querySelector('video'); if (videoElement) { createSubtitleContainer(); videoElement.removeEventListener('timeupdate', videoTimeUpdateHandler); videoElement.addEventListener('timeupdate', videoTimeUpdateHandler); videoElement.addEventListener('seeking', videoTimeUpdateHandler); } }
function parseVTT(d) { const s = []; const b = d.replace(/\r\n/g, '\n').split('\n\n'); const r = /(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})\s-->\s(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})/; b.forEach(bl => { if (!bl || bl.trim().startsWith('WEBVTT') || bl.startsWith('NOTE')) return; const l = bl.split('\n'); let ti = -1; for(let i=0; i<l.length; i++) { if (r.test(l[i])) { ti = i; break; } } if (ti !== -1) { const p = l[ti].split(' --> '); const st = timeStringToSeconds(p[0].trim()); const ed = timeStringToSeconds(p[1].trim()); const tx = l.slice(ti + 1).join(' ').replace(/<[^>]+>/g, '').trim(); if (tx && !isNaN(st)) s.push({ start: st, end: ed, text: tx }); } }); return s; }
function timeStringToSeconds(t) { if (!t) return 0; const p = t.split(':'); let s=0, m=0, h=0, ms=0; if (p.length===3) { h=parseInt(p[0]); m=parseInt(p[1]); const sp=p[2].split('.'); s=parseInt(sp[0]); ms=parseInt(sp[1]||0); } else if (p.length===2) { m=parseInt(p[0]); const sp=p[1].split('.'); s=parseInt(sp[0]); ms=parseInt(sp[1]||0); } return (h*3600)+(m*60)+s+(ms/1000); }
function observeDOM() { const o = new MutationObserver(() => { if ((!videoElement || !videoElement.isConnected) && settings.subtitleMode !== 'disabled') initializeSubtitleDisplay(); }); o.observe(document.body, { childList: true, subtree: true }); }

initialize();