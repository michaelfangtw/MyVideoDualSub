# API Error Fix Summary - v6.0 (March 1, 2026)

## Problem Identified

When testing the Microsoft Translator API connection, users got a **401 Unauthorized error**: "❌ API Key 無效已過期" even though the API key was valid.

### Root Causes

1. **CORS Issue**: The original test was running in the extension popup context, which could be blocked by CORS
2. **Missing Region Header**: Microsoft Translator API requires the `Ocp-Apim-Subscription-Region` header in addition to the API key
3. **No Proper Error Feedback**: Test errors weren't being properly communicated to users

## Solutions Applied

### 1. Use Global Endpoint with Region Header ⭐ **CRITICAL FIX**

The most important fix: Microsoft Translator uses **global endpoint** with **region specified in header**, not regional URLs.

**Before (WRONG):**
```
// Using regional endpoint subdomain (won't work)
https://eastasia.api.cognitive.microsofttranslator.com/translate
```

**After (CORRECT):**
```
// Global endpoint + region header
https://api.cognitive.microsofttranslator.com/translate
Headers: { 'Ocp-Apim-Subscription-Region': 'eastasia' }
```

This is the **primary reason** for the 401 error! The region must be specified in the header, not in the URL.

### 2. Move API Test to Background Service Worker (popup.js)

**Before:**
```javascript
// Direct fetch from popup context (prone to CORS issues)
fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey
    },
    body: JSON.stringify(testPayload)
})
```

**After:**
```javascript
// Route through background service worker (handles CORS properly)
chrome.runtime.sendMessage(
    { action: "TEST_TRANSLATOR_API", apiKey: apiKey },
    (response) => {
        if (response.success) {
            showStatus('✅ 連線成功！API Key 有效', 'success');
            chrome.storage.sync.set({ translatorApiKey: apiKey });
        } else {
            showStatus(`❌ ${response.error}`, 'error');
        }
    }
);
```

**Benefits:**
- ✅ Avoids CORS issues (background service worker can make unrestricted requests)
- ✅ Provides detailed error messages from the server
- ✅ Consistent with translation message passing architecture

### 2. Add Microsoft Translator Region Header (background.js)

Microsoft Translator API **requires** the region header along with the subscription key.

**Added to both test and translation calls:**
```javascript
headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': apiKey,
    'Ocp-Apim-Subscription-Region': 'eastasia' // 新增
}
```

**Supported Regions:**
- `eastasia` (東亞) - Recommended for Taiwan users
- `southeastasia` (東南亞) - Alternative
- Other Azure regions as needed

### 3. Emphasize Region in Setup Instructions (popup.html)

Updated Step 3 to highlight that region selection is critical:

```html
• 區域：<strong>東亞 (East Asia)</strong> ⚠️ 重要
```

This ensures users select the correct region when creating their Azure Translator resource.

### 4. Add TEST_TRANSLATOR_API Handler (background.js)

New message handler for testing API connectivity:

```javascript
if (request.action === "TEST_TRANSLATOR_API") {
    const apiKey = request.apiKey;
    // Tests the API with a simple "Hello" translation
    // Returns { success: true } or { success: false, error: 'reason' }
}
```

**Error handling:**
- 401 → 'API Key 無效或已過期' (Invalid or expired)
- 403 → '無權限 (檢查金鑰和區域)' (Permission denied, check key and region)
- Other → 'HTTP {status}' error
- Network errors → Detailed error message

## Files Modified

### background.js
- ✅ Added `TEST_TRANSLATOR_API` message handler for testing API connection
- ✅ Added region header `'Ocp-Apim-Subscription-Region': 'eastasia'` to both:
  - Test API call (line 98)
  - Translation batch processing (line 207)

### popup.js
- ✅ Refactored `testConnection()` to route through background service worker
- ✅ Improved error messaging with response.error feedback
- ✅ Better user experience with clearer status messages

### popup.html
- ✅ Emphasized region selection as "⚠️ 重要" (Important)
- ✅ Made it clear that "東亞 (East Asia)" should be selected

## How to Test

1. **With an invalid API key:**
   - Enter a random key like "aaabbbcccdddeeefffggg"
   - Click "測試連線"
   - Should show: "❌ API Key 無效或已過期"

2. **With a valid API key:**
   - Create Azure Translator resource at https://portal.azure.com/
   - Select region: **東亞 (East Asia)**
   - Select pricing tier: **Free**
   - Copy Key 1 from Keys and Endpoint
   - Paste in extension popup
   - Click "測試連線"
   - Should show: "✅ 連線成功！API Key 有效"

3. **Translation should work:**
   - Select "英/中(AI翻譯,by Microsoft)" mode
   - Play MyVideo with English subtitles
   - Chinese translation should appear automatically

## Debugging Checklist

If API Key still doesn't work:

- [ ] Is the region **東亞 (East Asia)** selected in Azure portal?
- [ ] Is the API key **at least 32 characters** long?
- [ ] Did you copy the full key from "Key 1" or "Key 2"?
- [ ] Check browser console (F12) for messages like:
  - `[Background] 🧪 Testing Translator API with key: ...`
  - `[Background] 📥 Test API Response: 200` (should be 200 for success)
  - `[Background] ✅ API Key test passed`

## Related Information

- **Microsoft Translator API Docs**: https://learn.microsoft.com/en-us/azure/cognitive-services/translator/
- **Free Quota**: 2 million characters per month
- **Language Code**: Uses `zh-Hant` for Traditional Chinese and `en` for English

---

**Version**: 6.0 (March 1, 2026)
**Status**: ✅ API Error Fix Complete - Ready for Testing
