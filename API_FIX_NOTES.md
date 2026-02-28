# Microsoft Translator API Fix - Quick Reference

## The Critical Fix ⭐

**The main issue causing "API Key 無效已過期" error:**

### Wrong Endpoint (Global)
```
https://api.cognitive.microsofttranslator.com/translate
```
❌ This returns 401 Unauthorized for most Azure subscriptions

### Correct Endpoint (Regional)
```
https://eastasia.api.cognitive.microsofttranslator.com/translate
```
✅ This is what Microsoft Translator actually requires

## Changes Made

### 1. **background.js** - Test API Handler
- Changed endpoint from global to regional: `https://eastasia.api.cognitive.microsofttranslator.com/`
- Added verbose logging to show exact API URL being called
- Added detailed error response logging
- Logs now show: region, key length, API URL, response headers, response body

### 2. **background.js** - Translation Function
- Changed endpoint from global to regional in `translateBatch()` function
- Region variable set to `'eastasia'` for Taiwan/East Asia users
- Both test and actual translation use the same regional endpoint

### 3. **popup.js** - API Test Logic
- Routes test through background service worker (avoids CORS issues)
- Provides detailed error feedback to user

## How to Test

1. **Reload extension**: Go to `chrome://extensions/` → Find extension → Click reload
2. **Input API Key**: Extension popup → "設定" tab → Paste your Azure Translator API Key
3. **Test Connection**: Click "測試連線" button
4. **Check console**: Open DevTools (F12) → Console tab to see:
   ```
   [Background] 🧪 Testing Translator API with key: abc1234567...
   [Background] 🧪 Region: eastasia
   [Background] 🧪 API URL: https://eastasia.api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant
   [Background] 📥 Test API Response: 200 OK
   [Background] ✅ API Key test passed
   ```

## If Still Getting Error

**Check these in Azure Portal:**

1. ✅ Resource **Region** = "East Asia" (東亞)
2. ✅ Pricing tier = "Free"
3. ✅ Copy full API Key from "Keys and Endpoint" section
4. ✅ Key should be at least 32 characters long
5. ✅ Key is being pasted without any extra spaces

**Check browser console for:**
- What is the actual HTTP status code? (401, 403, 404, 429, etc.)
- What is the actual response from server?
- Is the regional endpoint being used? (should show `eastasia.api.cognitive...`)

## Files Changed

- ✅ `background.js` - Regional endpoint for both test and translation
- ✅ `popup.js` - Test routing through background service worker
- ✅ `FIX_SUMMARY.md` - Detailed documentation

## Related Docs

- Microsoft Translator Regional Endpoints: https://learn.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-translate
- Supported regions: eastasia, southeastasia, eastus, westus, westus2, etc.
