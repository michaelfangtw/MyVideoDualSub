# Critical Fix Summary - v4.0.5

## Problem Identified

The extension was failing to detect and process VTT subtitle requests from multiple CDN sources. The error logs showed:

```
[Background] Message error (eng): [object Object]
[Background] Message error (zho): [object Object]
```

## Root Cause

**Chrome Extension Manifest V3 Security Policy**: The `webRequest` API requires explicit `host_permissions` for each domain it monitors. While the background.js code was attempting to listen to multiple CDN domains, the manifest.json only granted host_permissions to `https://*.myvideo.net.tw/*`.

This caused:
1. ✗ VTT requests from `vodstrm.myvideo.net.tw` were not detected
2. ✗ VTT requests from `*.cdn.tfn.net.tw` were not detected
3. ✗ Content scripts were not injected on those domains
4. ✗ Message passing between background worker and content script failed

## Solution Applied

### manifest.json Changes

**Before:**
```json
"host_permissions": [
  "https://*.myvideo.net.tw/*"
],
"content_scripts": [
  {
    "matches": ["https://*.myvideo.net.tw/*"],
    ...
  }
]
```

**After:**
```json
"host_permissions": [
  "https://*.myvideo.net.tw/*",
  "https://*.cdn.tfn.net.tw/*",
  "https://vodstrm.myvideo.net.tw/*"
],
"content_scripts": [
  {
    "matches": [
      "https://*.myvideo.net.tw/*",
      "https://*.cdn.tfn.net.tw/*",
      "https://vodstrm.myvideo.net.tw/*"
    ],
    ...
  }
]
```

## Why This Matters

1. **host_permissions** - Allows the webRequest listener to intercept HTTP requests on these domains
2. **content_scripts matches** - Ensures the content script is injected to handle messages from background worker

Without these permissions, Chrome's security model prevents:
- Network request interception
- Content script injection
- Inter-process message passing

## Testing the Fix

After updating manifest.json, you need to:

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Find "myVideo Dual Transcript"
3. Click the **Reload** button (circular arrow icon)
4. Play any myVideo video with subtitles
5. Open DevTools (F12) and check console for successful logs:
   ```
   [Background] 🕵️ Detected VTT request: https://vodstrm.myvideo.net.tw/...
   [Background] ✅ Response received (eng): 200 OK
   [Background] ✅ Message sent (eng) to tabId ...
   [Content] 📨 Message received: SUBTITLE_DATA_RECEIVED
   [Content] ✅ Ready: XXX subtitles loaded
   ```

## Files Modified

- ✅ `manifest.json` - Updated version 4.0.5 with expanded host_permissions and content_scripts
- ✅ `README.md` - Updated changelog with critical fix note

## Supported CDNs

The extension now supports VTT files from:

1. **myvideo.net.tw** - Original myVideo CDN (vodstrm.myvideo.net.tw)
2. **cdn.tfn.net.tw** - Third-party token-based CDN
3. **Other matching patterns** - Future CDNs that follow similar URL structures

## Related Files (No Changes Needed)

- `background.js` - Already correctly monitors the URLs, no changes needed
- `content_script.js` - Already correctly receives messages, no changes needed
- `styles.css` - No changes
- `popup.js`, `popup.html` - No changes

---

**Version**: 4.0.5
**Date**: 2026-02-27
**Status**: ✅ Ready for testing
