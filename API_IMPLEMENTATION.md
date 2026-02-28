# Microsoft Translator API Implementation Guide

## Official Microsoft Example vs Our Implementation

### Microsoft's Official Example (from docs)
```javascript
axios({
    baseURL: endpoint,  // https://api.cognitive.microsofttranslator.com/
    url: '/translate',
    method: 'post',
    headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuidv4().toString()
    },
    params: {
        'api-version': '3.0',
        'from': 'en',
        'to': ['fr', 'zu']
    },
    data: [{ 'text': 'Hello world!' }],
    responseType: 'json'
})
```

### Our Implementation (Using Fetch API)

#### Test Connection
```javascript
const apiUrl = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant`;

const traceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'X-ClientTraceId': traceId
    },
    body: JSON.stringify([{ Text: 'Hello' }])
})
```

#### Batch Translation
```javascript
const apiUrl = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant`;

const traceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'X-ClientTraceId': traceId
    },
    body: JSON.stringify(textBatch.map(text => ({ Text: text })))
})
```

## Key Differences from Example

| Aspect | Microsoft Example | Our Implementation |
|--------|------------------|-------------------|
| **HTTP Client** | Axios | Fetch API |
| **Endpoint** | `https://api.cognitive.microsofttranslator.com/` | ✅ Same |
| **Auth Header** | `Ocp-Apim-Subscription-Key` | ✅ Same |
| **Region Header** | `Ocp-Apim-Subscription-Region` | ✅ Same |
| **Trace ID Header** | `X-ClientTraceId` | ✅ Same (UUID format) |
| **Content-Type** | `application/json` | ✅ Same |
| **API Version** | In params: `3.0` | ✅ In URL: `?api-version=3.0` |
| **Batch Support** | Array of objects | ✅ Array of `{ Text: '...' }` |

## Request Flow

```
User clicks "Test Connection" in popup
    ↓
popup.js sends TEST_TRANSLATOR_API message to background
    ↓
background.js receives message
    ↓
chrome.storage.sync.get() reads { apiKey, region }
    ↓
Generate trace ID (UUID v4 format)
    ↓
Construct API URL:
https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant
    ↓
Send request with headers:
{
  'Content-Type': 'application/json',
  'Ocp-Apim-Subscription-Key': '{user's Azure key}',
  'Ocp-Apim-Subscription-Region': '{user's selected region}',
  'X-ClientTraceId': '{generated UUID}'
}
    ↓
Body: [{ Text: 'Hello' }]
    ↓
Response: 200 OK with translations
    ↓
Show success message to user
```

## Testing the API

### Step 1: Get Azure Translator API Key
1. Go to https://portal.azure.com/
2. Create new "Translator" resource
3. Select region (e.g., East Asia)
4. Copy Key 1 from "Keys and Endpoint"

### Step 2: Add to Extension
1. Open extension popup
2. Go to "設定" tab
3. Select region from dropdown (must match Azure region)
4. Paste API Key
5. Click "儲存 API Key"

### Step 3: Test Connection
1. Click "測試連線"
2. Should see "✅ 連線成功！API Key 有效"
3. Open DevTools (F12) to see detailed logs:
   ```
   [Background] 🧪 Testing Translator API with key: abc123...
   [Background] 🧪 Region: eastasia
   [Background] 🧪 API URL: https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant
   [Background] 📥 Test API Response: 200 OK
   [Background] ✅ API Key test passed. Response: [...]
   ```

### Step 4: Use Translation
1. Select subtitle mode "英/中(AI翻譯,by Microsoft)"
2. Play a video with English subtitles
3. Chinese translation should appear below

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API Key | Check key is correct (32+ chars) and copied fully |
| 403 Forbidden | Wrong region | Verify Azure resource region matches dropdown selection |
| 429 Too Many Requests | Rate limiting | Already handled with batch limiting (100 texts per request) |
| Empty translation | API Key missing | Save API Key in Settings tab first |

## Headers Explanation

| Header | Purpose | Example |
|--------|---------|---------|
| `Content-Type` | Specifies JSON format | `application/json` |
| `Ocp-Apim-Subscription-Key` | Azure authentication | Your API Key from Azure portal |
| `Ocp-Apim-Subscription-Region` | Routes to correct server | `eastasia`, `westeurope`, etc. |
| `X-ClientTraceId` | Request tracking | UUID format for debugging |

All four headers are **required** for successful API calls.

## API Limits

- **Free Tier**: 2 million characters per month
- **Batch Size**: Up to 100 texts per request (we batch 100)
- **Request Limit**: Check Azure portal for specific limits
- **Response Time**: ~100-500ms per request depending on region

## Files Implementing This

- `background.js` - API calls, test connection, translation
- `popup.js` - Region selection, API Key input
- `popup.html` - UI for region and API Key settings
- `content_script.js` - Subtitle extraction and display
