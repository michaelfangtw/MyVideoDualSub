# Region Selection Feature - Microsoft Translator API

## Overview

Added user-configurable **Region** (Location) selection for Microsoft Translator API in the extension settings. This allows users in different geographic areas to specify which Azure region their API key is associated with.

## Changes Made

### 1. **popup.html** - Region Dropdown UI
- Added region selector dropdown with 15 common regions:
  - `eastasia` - 東亞 (East Asia) **RECOMMENDED**
  - `southeastasia` - 東南亞 (Southeast Asia)
  - `eastus`, `westus`, `westus2`, `centralus` - US regions
  - `japaneast`, `japanwest` - Japan regions
  - `australiaeast` - Australia
  - `canadacentral` - Canada
  - `westeurope`, `northeurope` - Europe regions
  - `uksouth` - UK
  - `switzerlandnorth` - Switzerland
  - `global` - Global endpoint
- Default selection: `eastasia`
- Status display below dropdown shows confirmation when region is changed

### 2. **popup.js** - Region Selection Logic
- Added `translatorRegion` storage management using `chrome.storage.sync`
- Auto-loads saved region on popup open (defaults to `eastasia`)
- Saves region selection when dropdown changes
- Shows "✅ 地區已設定為: {region}" message on successful change

### 3. **background.js** - Use Region in API Calls

#### TEST_TRANSLATOR_API Handler
- Reads `translatorRegion` from `chrome.storage.sync`
- Passes region to API test URL construction
- Logs which region is being used for debugging

#### TRANSLATE_SUBTITLES Handler
- Reads both `translatorApiKey` and `translatorRegion` from storage
- Passes `region` parameter to `translateTextsWithMicrosoft()` function

#### translateTextsWithMicrosoft() Function
- Function signature updated: `(texts, sourceCode, targetCode, apiKey, region = 'eastasia')`
- Parameter `region` is used in API URL construction
- Added logging: `console.log(...) Region: ${region}`
- Removed hardcoded region assignment from `translateBatch()` - now uses parameter

## Data Flow

```
Popup UI (user selects region)
    ↓
popup.js saves to chrome.storage.sync { translatorRegion: 'eastasia' }
    ↓
background.js TRANSLATE_SUBTITLES handler reads region from storage
    ↓
translateTextsWithMicrosoft(texts, sourceCode, targetCode, apiKey, region)
    ↓
API request: https://{region}.api.cognitive.microsofttranslator.com/...
```

## Testing

1. **Change Region in Settings**:
   - Click popup → "設定" tab
   - Select different region from dropdown
   - Should see: "✅ 地區已設定為: {selected_region}"

2. **Verify Region is Used**:
   - Open DevTools (F12) → Console
   - Click "測試連線" to test API
   - Should show:
     ```
     [Background] 🧪 Region: {selected_region}
     [Background] 🧪 API URL: https://{selected_region}.api.cognitive.microsofttranslator.com/translate...
     ```

3. **Translation Should Use Region**:
   - Set up valid API key in desired region
   - Select matching region in dropdown
   - Translation should work with that region's API key

## Default Region

- **Default Value**: `eastasia`
- **Recommended for Taiwan Users**: `eastasia` or `southeastasia`
- **Can be changed**: User can select any region and it will be saved to `chrome.storage.sync`

## API Endpoint Format

The region is used to construct the regional endpoint:
```
https://{region}.api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=...&to=...
```

This is **required** by Microsoft Translator API. The global endpoint doesn't work for most Azure subscriptions.

## Backward Compatibility

- Existing users with older versions will have region default to `eastasia`
- New users will have `eastasia` as default
- Region setting is persisted in `chrome.storage.sync`

## Related Files

- `popup.html` - Region selection UI
- `popup.js` - Region storage management
- `background.js` - Region usage in API calls
- `FIX_SUMMARY.md` - General API error fixes
- `API_FIX_NOTES.md` - API endpoint documentation
