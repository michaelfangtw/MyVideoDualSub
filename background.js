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
            else if (details.url.includes('/text_0/')) langCode = 'zho'; // myVideo format: text_0 = Chinese
            else if (details.url.includes('/text_1/')) langCode = 'eng'; // myVideo format: text_1 = English

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
            }).then(() => {
                console.log(`[Background] ✅ Message sent (${langCode}) to tabId ${tabId}`);
            }).catch(err => {
                console.error(`[Background] ❌ Message send error (${langCode}):`, err.message);
            });
        })
        .catch(err => {
            console.error(`[Background] ❌ Fetch error (${langCode}): ${err.message}`);
        });
}


// 處理來自 content script 的請求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 【功能 0】測試 Microsoft Translator API 連線
    if (request.action === "TEST_TRANSLATOR_API") {
        const apiKey = request.apiKey;

        // 從 chrome.storage 讀取使用者選擇的地區（預設 eastasia）
        chrome.storage.sync.get({ translatorRegion: 'eastasia' }, (items) => {
            const region = items.translatorRegion;
            console.log(`[Background] 🧪 Testing Translator API with key: ${apiKey.substring(0, 10)}...`);
            console.log(`[Background] 🧪 Key length: ${apiKey.length} characters`);
            console.log(`[Background] 🧪 Region: ${region}`);

            const testPayload = [{ Text: 'Hello' }];
            // 使用全域端點，區域由 header 指定
            const apiUrl = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant`;

            console.log(`[Background] 🧪 API URL: ${apiUrl}`);
            console.log(`[Background] 🧪 Request payload:`, JSON.stringify(testPayload));
            console.log(`[Background] 🧪 Headers being sent:`, {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': `${apiKey.substring(0, 10)}...`,
                'Ocp-Apim-Subscription-Region': region,
                'X-ClientTraceId': '[UUID]'
            });

            // 產生 trace ID 用於追蹤請求
            const traceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            console.log(`[Background] 🧪 Starting fetch request...`);
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Ocp-Apim-Subscription-Region': region,
                    'X-ClientTraceId': traceId
                },
                body: JSON.stringify(testPayload)
            })
            .then(res => {
                console.log(`[Background] 📥 Test API Response: ${res.status} ${res.statusText}`);
                console.log(`[Background] 📥 Response headers:`, {
                    'Content-Type': res.headers.get('Content-Type'),
                    'X-RequestId': res.headers.get('X-RequestId')
                });

                // 先讀取 response body，然後根據 status 決定是否解析 JSON
                return res.text().then(text => {
                    console.log(`[Background] 📥 Response body (first 300 chars): ${text.substring(0, 300)}`);
                    console.log(`[Background] 📥 Response body length: ${text.length}`);

                    if (res.status === 401) {
                        console.error(`[Background] ❌ 401 Unauthorized - API Key invalid`);
                        sendResponse({ success: false, error: 'API Key 無效或已過期' });
                    } else if (res.status === 403) {
                        console.error(`[Background] ❌ 403 Forbidden - Check region or subscription`);
                        sendResponse({ success: false, error: '無權限 (檢查金鑰和區域)' });
                    } else if (res.ok) {
                        try {
                            const data = JSON.parse(text);
                            console.log(`[Background] ✅ API Key test passed. Response:`, data);
                            // 儲存 API 類型標記
                            chrome.storage.sync.set({ translatorApiType: 'microsoft' });
                            sendResponse({ success: true });
                        } catch (e) {
                            console.error(`[Background] ❌ JSON parse error:`, e.message);
                            console.error(`[Background] ❌ Response text that failed to parse:`, text);
                            sendResponse({ success: false, error: `回應解析失敗: ${e.message}` });
                        }
                    } else {
                        console.error(`[Background] ❌ HTTP ${res.status} error`);
                        console.error(`[Background] ❌ Response body:`, text);
                        sendResponse({ success: false, error: `連線失敗 (HTTP ${res.status})` });
                    }
                });
            })
            .catch(err => {
                console.error(`[Background] ❌ Test API Error (Fetch failed):`, err.message);
                console.error(`[Background] ❌ Error name:`, err.name);
                console.error(`[Background] ❌ Error stack:`, err.stack);
                console.error(`[Background] ❌ Full error object:`, err);

                // 提供更詳細的錯誤訊息
                let errorMsg = `網路錯誤: ${err.message}`;
                if (err.message === 'Failed to fetch') {
                    errorMsg = '連線失敗 - 檢查API Key或網路連線，或嘗試重新加載擴充';
                }
                sendResponse({ success: false, error: errorMsg });
            });
        });

        return true;
    }

    // 【功能 1】嘗試抓取對應的語言字幕 (用於猜測另一種語言)
    if (request.action === "TRY_FETCH_URL") {
        fetch(request.url)
            .then(res => res.ok ? res.text() : Promise.reject(res.status))
            .then(data => sendResponse({ success: true, data: data }))
            .catch(() => sendResponse({ success: false }));
        return true;
    }
    // 【功能 2】使用 Microsoft Translator API 翻譯字幕
    if (request.action === "TRANSLATE_SUBTITLES") {
        const { subtitles, sourceLang } = request;
        console.log(`[Background] 🌐 Translating ${subtitles.length} subtitles from ${sourceLang} using Microsoft Translator`);

        // 從 chrome.storage 讀取使用者的 API Key 和地區設定
        chrome.storage.sync.get({ translatorApiKey: '', translatorRegion: 'eastasia' }, (items) => {
            const apiKey = items.translatorApiKey;
            const region = items.translatorRegion;

            console.log(`[Background] 🔍 TRANSLATE_SUBTITLES - Raw API Key from storage:`, apiKey);
            console.log(`[Background] 🔍 TRANSLATE_SUBTITLES - API Key type: ${typeof apiKey}`);
            console.log(`[Background] 🔍 TRANSLATE_SUBTITLES - API Key length: ${apiKey ? apiKey.length : 0}`);
            console.log(`[Background] 🔍 TRANSLATE_SUBTITLES - API Key is empty? ${!apiKey}`);
            console.log(`[Background] 🔍 TRANSLATE_SUBTITLES - Region: ${region}`);

            if (!apiKey) {
                console.error(`[Background] ❌ No API Key found in storage.`);
                // 沒有 API Key 時，顯示提示訊息
                const noKeyMessage = '🔑 請申請microsoft translator 每月免費200萬字';
                const noKeySubtitles = subtitles.map(sub => ({
                    start: sub.start,
                    end: sub.end,
                    text: sub.text,
                    translation: noKeyMessage
                }));
                sendResponse({ translatedSubtitles: noKeySubtitles });
                return;
            }

            const textsToTranslate = subtitles.map(sub => sub.text);
            const sourceCode = sourceLang === 'zho' ? 'zh' : 'en';
            const targetCode = sourceLang === 'zho' ? 'en' : 'zh';

            translateTextsWithMicrosoft(textsToTranslate, sourceCode, targetCode, apiKey, region)
                .then(translatedTexts => {
                    const translatedSubtitles = subtitles.map((sub, index) => ({
                        start: sub.start,
                        end: sub.end,
                        text: sub.text,
                        translation: translatedTexts[index] || ''
                    }));
                    console.log(`[Background] ✅ Translation completed: ${translatedSubtitles.length} subtitles`);
                    sendResponse({ translatedSubtitles: translatedSubtitles });
                })
                .catch(err => {
                    console.error(`[Background] ❌ Translation failed:`, err.message);
                    const fallbackSubtitles = subtitles.map(sub => ({
                        start: sub.start,
                        end: sub.end,
                        text: sub.text,
                        translation: ''
                    }));
                    sendResponse({ translatedSubtitles: fallbackSubtitles });
                });
        });
        return true;
    }
});

// Microsoft Translator API 翻譯函數 (需要使用者自己的 API Key 和地區設定)
function translateTextsWithMicrosoft(texts, sourceCode, targetCode, apiKey, region = 'eastasia') {
    console.log(`[Background] 📤 Calling Microsoft Translator API...`);
    console.log(`[Background] 📝 Texts to translate: ${texts.length}`);
    console.log(`[Background] 📝 Source: ${sourceCode}, Target: ${targetCode}`);
    console.log(`[Background] 📝 Region: ${region}`);

    // 將語言代碼轉換為 Microsoft Translator 格式
    const sourceLang = sourceCode === 'zh' ? 'zh-Hans' : 'en';
    const targetLang = targetCode === 'zh' ? 'zh-Hant' : 'en';

    // 翻譯單個文本的函數（批量翻譯）
    function translateBatch(textBatch) {
        // 使用全域端點，區域由 header (Ocp-Apim-Subscription-Region) 指定
        const apiUrl = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`;

        const payload = textBatch.map(text => ({ Text: text }));

        // 產生 trace ID 用於追蹤請求
        const traceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        return fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': apiKey, // 使用者提供的 API Key
                'Ocp-Apim-Subscription-Region': region, // 使用者設定的地區
                'X-ClientTraceId': traceId // 用於追蹤和調試
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            console.log(`[Background] 📥 Microsoft Translator Response: ${res.status} ${res.statusText}`);
            console.log(`[Background] 📥 Response URL: ${apiUrl}`);
            console.log(`[Background] 📥 Region used: ${region}`);
            if (!res.ok) {
                console.error(`[Background] ❌ API Error Status: ${res.status}`);
                if (res.status === 403) {
                    console.error(`[Background] ❌ 403 Forbidden - Region mismatch! Check if region "${region}" matches your Azure resource region`);
                }
                throw new Error(`Microsoft Translator API error: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            console.log(`[Background] 📥 Received translations:`, data);
            return data.map(item => item.translations[0]?.text || '');
        })
        .catch(err => {
            console.error(`[Background] ❌ Microsoft Translator Error:`, err.message);
            return textBatch.map(() => ''); // 出錯返回空字符
        });
    }

    // 分批翻譯：一次最多 100 個文本（Microsoft Translator 支援）
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < texts.length; i += batchSize) {
        batches.push(texts.slice(i, i + batchSize));
    }

    console.log(`[Background] 📋 Split into ${batches.length} batch(es)`);

    // 順序處理每個批次，避免限流
    let chain = Promise.resolve([]);
    batches.forEach((batch, batchIndex) => {
        chain = chain
            .then(results => {
                console.log(`[Background] 🔄 Processing batch ${batchIndex + 1}/${batches.length}...`);
                return translateBatch(batch)
                    .then(batchResults => results.concat(batchResults));
            })
            .catch(err => {
                console.error(`[Background] ❌ Batch ${batchIndex} failed:`, err.message);
                return chain; // 繼續下一個批次
            });
    });

    return chain.then(translatedTexts => {
        console.log(`[Background] ✅ Microsoft Translator translation completed: ${translatedTexts.length} texts`);
        console.log(`[Background] 📝 First translation sample: ${translatedTexts[0]?.substring(0, 80) || '(empty)'}`);
        console.log(`[Background] 📝 All translations:`, translatedTexts);
        return translatedTexts;
    });
}