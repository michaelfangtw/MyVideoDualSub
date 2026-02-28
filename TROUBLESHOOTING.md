# Troubleshooting Guide - MyVideoDualSub Microsoft Translator

## Error: "Test API Error: Failed to fetch"

### What This Means

"Failed to fetch" typically indicates the browser couldn't reach the API server. This can happen due to several reasons.

### Diagnostic Steps

#### Step 1: Check DevTools Console (F12)
Open the browser's Developer Tools and look for detailed error messages:

```
[Background] 🧪 Testing Translator API with key: abc123...
[Background] 🧪 Region: eastasia
[Background] 🧪 API URL: https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant
[Background] 🧪 Headers being sent: {...}
[Background] 🧪 Starting fetch request...
[Background] ❌ Test API Error (Fetch failed): Failed to fetch
[Background] ❌ Error name: TypeError
[Background] ❌ Full error object: TypeError: Failed to fetch
```

#### Step 2: Verify API Key
- ✅ Is it **at least 32 characters** long?
- ✅ Did you **copy the full key** without extra spaces?
- ✅ Is it from **Key 1** or **Key 2** in Azure Portal?

```
Correct format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32+ chars)
Wrong: xxxxxxxx... (truncated)
```

#### Step 3: Verify Region Settings
- ✅ Is the region in the dropdown **matching your Azure resource region**?
- ✅ Most common: `eastasia` (East Asia) for Taiwan

| Region Name | Azure Portal Name | Code |
|-------------|-------------------|------|
| 東亞 | East Asia | `eastasia` |
| 東南亞 | Southeast Asia | `southeastasia` |
| 美國東部 | East US | `eastus` |
| 美國西部 | West US | `westus` |

#### Step 4: Check Azure Portal
Go to https://portal.azure.com/ and verify:

1. **Translator resource exists**
   - ✅ Resource name visible
   - ✅ Region shows correct location
   - ✅ Status is "Successful"

2. **Keys are available**
   - ✅ Go to "Keys and Endpoint"
   - ✅ Both Key 1 and Key 2 should be visible
   - ✅ Endpoint shows: `https://api.cognitive.microsofttranslator.com/`

3. **Subscription is active**
   - ✅ Free tier (2 million chars/month) is active
   - ✅ No payment issues

#### Step 5: Check Network Connection
- ✅ Is your internet connection working?
- ✅ Can you open https://api.cognitive.microsofttranslator.com/ in your browser?
- ✅ Are you behind a firewall or proxy that might block Azure APIs?

### Common Causes & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| **API Key invalid** | Wrong or partial key | Copy full key again from Azure Portal |
| **Region mismatch** | Region in dropdown ≠ Azure resource region | Change dropdown to match Azure region |
| **API endpoint unreachable** | Network/firewall blocking | Check firewall, try different network |
| **Subscription expired** | Free trial ended or no payment method | Add payment method or create new resource |
| **Rate limited** | Too many requests too fast | Wait a moment, then try again |
| **CORS blocked** | Browser security policy | This shouldn't happen in extension, try reload |

### Recovery Steps

1. **Reload the Extension**
   - Go to `chrome://extensions/`
   - Find "MyVideoDualSub"
   - Click the reload button (circular arrow icon)

2. **Clear Extension Data**
   - Right-click extension → "Remove from Chrome"
   - Re-add the extension
   - Re-enter API Key and region

3. **Try a Different Azure Region**
   - If your current region doesn't work, try `southeastasia` or `westus`
   - Make sure you select the matching region in the dropdown

4. **Check Azure Portal Status**
   - Go to https://portal.azure.com/
   - Verify the Translator resource shows "Successful"
   - Delete and recreate the resource if needed

### Testing with Browser Console

You can test the API directly from the browser console:

```javascript
// Open DevTools (F12) → Console tab, then paste:
fetch('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': 'YOUR_API_KEY_HERE',
    'Ocp-Apim-Subscription-Region': 'eastasia'
  },
  body: JSON.stringify([{ Text: 'Hello' }])
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e.message))
```

Expected output on success:
```javascript
[
  {
    translations: [
      {
        text: "你好",
        to: "zh-Hant"
      }
    ]
  }
]
```

### Debug Information to Share

If you need help, provide these details:

1. **API Key status**: Is it 32+ characters?
2. **Region selected**: Which region from the dropdown?
3. **Azure region**: Which region is your Translator resource in?
4. **Error in console**: What's the exact error message?
5. **Browser type**: Chrome, Edge, etc.?
6. **Extension version**: v6.0 (shown in manifest.json)

### Contact Azure Support

If the API works in browser console but fails in the extension:

1. Go to https://portal.azure.com/
2. Click "Help + Support"
3. Create a new support request
4. Include:
   - Translator resource name
   - Error message from console
   - Steps you tried

## Other Common Issues

### "API Key 無效或已過期" (HTTP 401)
- ❌ API Key is wrong/expired
- ✅ Solution: Generate new key in Azure Portal

### "無權限" (HTTP 403)
- ❌ Region mismatch
- ✅ Solution: Ensure dropdown region matches Azure resource region

### Empty translation result
- ❌ API Key not saved
- ✅ Solution: Click "儲存 API Key" button in Settings tab

### No subtitle translation showing
- ❌ Mode not selected correctly
- ✅ Solution: Select "英/中(AI翻譯,by Microsoft)" mode

## Performance Tips

- **First translation is slowest** (500ms-1s) due to API initialization
- **Subsequent translations are faster** (100-300ms)
- **Batch processing** - Up to 100 subtitles per request
- **Rate limits** - Check Azure Portal for your subscription limits

## Getting Help

1. **Check this troubleshooting guide** first
2. **Open DevTools (F12)** and check console messages
3. **Verify Azure Portal settings** - resource, keys, region
4. **Reload extension** from chrome://extensions/
5. **Contact Azure Support** if issue persists
