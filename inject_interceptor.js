// inject_interceptor.js
(function() {
    if (window.myVideoSubtitleInterceptorInjected) return;
    window.myVideoSubtitleInterceptorInjected = true;
    console.log("[Dual Subtitle] Interceptor injected.");

    // 判斷是否為字幕請求，並提取語言代碼
    function analyzeSubtitleUrl(url) {
        if (!url || !url.endsWith('.vtt')) return null;
        
        let langCode = null;
        if (url.includes('/text_zho_')) {
            langCode = 'zho'; // 中文
        } else if (url.includes('/text_eng_')) {
            langCode = 'eng'; // 英文
        } else {
            return null; // 不是我們目標的字幕格式
        }

        return { isSubtitle: true, langCode: langCode };
    }

    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const [resource] = args;
        const url = (resource instanceof Request) ? resource.url : resource.toString();
        const analysis = analyzeSubtitleUrl(url);

        const response = await originalFetch(...args);

        if (analysis && analysis.isSubtitle) {
            console.log(`[Dual Subtitle] 🎯 Detected ${analysis.langCode.toUpperCase()} subtitle fetch:`, url);
            try {
                const clonedResponse = response.clone();
                const textData = await clonedResponse.text();
                 window.dispatchEvent(new CustomEvent('MYVIDEO_SUBTITLE_INTERCEPTED', {
                    detail: {
                        url: url,
                        data: textData,
                        langCode: analysis.langCode // 傳遞語言代碼 (zho 或 eng)
                    }
                }));
            } catch (err) { console.error(err); }
        }
        return response;
    };

    // XHR 攔截部分簡化，邏輯相同
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    XHR.open = function(method, url) { this._url = url ? url.toString() : ''; return open.apply(this, arguments); };
    XHR.send = function(postData) {
        this.addEventListener('load', function() {
            const analysis = analyzeSubtitleUrl(this._url);
            if (this._url && analysis && analysis.isSubtitle) {
                 console.log(`[Dual Subtitle] 🎯 Detected ${analysis.langCode.toUpperCase()} XHR:`, this._url);
                 window.dispatchEvent(new CustomEvent('MYVIDEO_SUBTITLE_INTERCEPTED', {
                    detail: { url: this._url, data: this.responseText, langCode: analysis.langCode }
                }));
            }
        });
        return send.apply(this, arguments);
    };
})();