// background.js (Edge Stable Version)

// 存放最近抓到的字幕網址，避免重複處理
let processedUrls = new Set();

// 監聽網路請求完成事件
chrome.webRequest.onCompleted.addListener(
    function(details) {
        // 篩選出字幕請求 (包含 /text_ 且結尾是 .vtt)
        if (details.url.includes('/text_') && details.url.endsWith('.vtt')) {
            
            // 如果這個網址最近已經處理過，就跳過
            if (processedUrls.has(details.url)) return;
            processedUrls.add(details.url);
            
            // 10秒後清除緩存，允許再次處理
            setTimeout(() => processedUrls.delete(details.url), 10000);

            console.log("[Background] 🕵️ Detected VTT request:", details.url);
            
            // 判斷語言
            let langCode = null;
            if (details.url.includes('/text_zho_')) langCode = 'zho';
            else if (details.url.includes('/text_eng_')) langCode = 'eng';

            if (langCode) {
                // 主動抓取字幕內容
                fetchSubtitleData(details.url, langCode, details.tabId);
            }
        }
    },
    { urls: ["https://*.myvideo.net.tw/*"] }
);

// 主動抓取字幕並發送給 content script
function fetchSubtitleData(url, langCode, tabId) {
    console.log(`[Background] Fetching content for ${langCode.toUpperCase()} track...`);
    fetch(url)
        .then(response => response.text())
        .then(data => {
            // 發送給對應的標籤頁
            if (tabId !== -1) {
                chrome.tabs.sendMessage(tabId, {
                    action: "SUBTITLE_DATA_RECEIVED",
                    url: url,
                    data: data,
                    langCode: langCode
                });
            }
        })
        .catch(err => console.error("[Background] Fetch failed:", err));
}


// 處理來自 content script 的請求 (抓取夥伴字幕 & 翻譯)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 【功能 1】嘗試抓取對應的語言字幕
    if (request.action === "TRY_FETCH_URL") {
        fetch(request.url)
            .then(res => res.ok ? res.text() : Promise.reject(res.status))
            .then(data => sendResponse({ success: true, data: data }))
            .catch(() => sendResponse({ success: false }));
        return true;
    }

    // 【功能 2】翻譯候補 (模擬)
    if (request.action === "TRANSLATE_SUBTITLES") {
        const { subtitles, sourceLang } = request;
        // 模擬翻譯邏輯...
        const translatedSubtitles = subtitles.map(sub => ({
            start: sub.start, end: sub.end,
            text: sourceLang === 'zho' ? sub.text : `[中模擬] ${sub.text}`,
            translation: sourceLang === 'zho' ? `[EN Sim] ${sub.text}` : sub.text
        }));
        sendResponse({ translatedSubtitles: translatedSubtitles });
        return true;
    }
});