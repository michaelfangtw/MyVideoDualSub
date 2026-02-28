// background.js (V4.0 Passive)

// 存放最近抓到的字幕網址，避免短時間內重複處理
let processedUrls = new Set();

// 監聽網路請求完成事件 (被動監聽 .vtt)
chrome.webRequest.onCompleted.addListener(
    function(details) {
        // 篩選出字幕請求 (包含 /text_ 且結尾是 .vtt)
        // 支援多種 CDN：vodstrm.myvideo.net.tw 和第三方 CDN
        if (details.url.includes('/text_') && details.url.endsWith('.vtt')) {

            // 如果這個網址最近已經處理過，就跳過
            if (processedUrls.has(details.url)) {
                console.log("[Background] ⏭️  Skipping already processed URL");
                return;
            }
            processedUrls.add(details.url);
            // 10秒後清除緩存，允許再次處理
            setTimeout(() => processedUrls.delete(details.url), 10000);

            console.log("[Background] 🕵️ Detected VTT request:", details.url);
            console.log("[Background] Status:", details.statusCode);

            // 判斷語言代碼 (如果有的話)
            let langCode = 'unknown';
            if (details.url.includes('_zho_')) langCode = 'zho';
            else if (details.url.includes('_eng_')) langCode = 'eng';

            console.log("[Background] 🔤 Language code:", langCode);

            // 主動抓取字幕內容並發送給前台
            fetchSubtitleData(details.url, langCode, details.tabId);
        }
    },
    { urls: ["https://*.myvideo.net.tw/*", "https://*.cdn.tfn.net.tw/*", "https://vodstrm.myvideo.net.tw/*"] }
);

// 主動抓取字幕並發送給 content script
function fetchSubtitleData(url, langCode, tabId) {
    console.log(`[Background] 📥 Fetching ${langCode} subtitle:`, url);
    console.log(`[Background] TabID: ${tabId}`);

    fetch(url)
        .then(response => {
            console.log(`[Background] ✅ Response received (${langCode}): ${response.status} ${response.statusText}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            if (!data || data.length === 0) {
                throw new Error('Empty response');
            }
            console.log(`[Background] 📄 Data received (${langCode}): ${data.length} bytes`);
            console.log(`[Background] First 50 chars: ${data.substring(0, 50)}`);

            if (!tabId || tabId === -1) {
                console.warn(`[Background] ⚠️ Invalid tabId: ${tabId}`);
                return;
            }

            chrome.tabs.sendMessage(tabId, {
                action: "SUBTITLE_DATA_RECEIVED",
                url: url,
                data: data,
                langCode: langCode
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(`[Background] ❌ Message send error (${langCode}):`, chrome.runtime.lastError.message);
                } else {
                    console.log(`[Background] ✅ Message sent (${langCode}) to tabId ${tabId}`);
                }
            });
        })
        .catch(err => {
            console.error(`[Background] ❌ Fetch error (${langCode}): ${err.message}`);
        });
}


// 處理來自 content script 的請求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 【功能 1】嘗試抓取對應的語言字幕 (用於猜測另一種語言)
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
        const translatedSubtitles = subtitles.map(sub => ({
            start: sub.start, end: sub.end,
            text: sourceLang === 'zho' ? sub.text : `[中模擬] ${sub.text}`,
            translation: sourceLang === 'zho' ? `[EN Sim] ${sub.text}` : sub.text
        }));
        sendResponse({ translatedSubtitles: translatedSubtitles });
        return true;
    }
});