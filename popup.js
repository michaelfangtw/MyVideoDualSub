// popup.js (V5.0 - Tabs + API Key Management)
document.addEventListener('DOMContentLoaded', () => {
    // === 標籤頁切換 ===
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // 移除所有 active
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 設定新的 active
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // === 字幕模式設定 ===
    const radios = document.querySelectorAll('input[name="mode"]');
    const defaultSettings = { subtitleMode: 'eng' };

    chrome.storage.sync.get(defaultSettings, (items) => {
        const currentMode = items.subtitleMode;
        const radioToCheck = document.querySelector(`input[name="mode"][value="${currentMode}"]`);
        if (radioToCheck) radioToCheck.checked = true;
    });

    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.sync.set({ subtitleMode: e.target.value });
            }
        });
    });

    // === 地區設定管理 (Microsoft Translator Region) ===
    // 使用者可以選擇 API 端點的地區，此設定會影響 API 呼叫時的端點 URL
    // 例如選 eastasia 則使用: https://eastasia.api.cognitive.microsofttranslator.com/...
    const regionSelect = document.getElementById('regionSelect');
    const regionStatus = document.getElementById('regionStatus');

    // 載入已儲存的地區設定（預設：eastasia）
    chrome.storage.sync.get({ translatorRegion: 'eastasia' }, (items) => {
        const savedRegion = items.translatorRegion;
        regionSelect.value = savedRegion;

        // 若未儲存過，初始化儲存
        if (!savedRegion || savedRegion === 'eastasia') {
            chrome.storage.sync.set({ translatorRegion: savedRegion || 'eastasia' }, () => {
                console.log('[Popup] 💾 Initialized region:', savedRegion || 'eastasia');
            });
        }
    });

    // 監聽地區選擇變化並儲存到 chrome.storage.sync
    regionSelect.addEventListener('change', (e) => {
        const region = e.target.value;
        chrome.storage.sync.set({ translatorRegion: region }, () => {
            regionStatus.className = 'status-msg success';
            regionStatus.textContent = `✅ 地區已設定為: ${region}`;
            setTimeout(() => regionStatus.textContent = '', 2000);

            // 驗證儲存成功
            chrome.storage.sync.get({ translatorRegion: '' }, (items) => {
                console.log('[Popup] ✅ Verified region saved:', items.translatorRegion);
            });
        });
    });

    // === API Key 管理 ===
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveButton');
    const testButton = document.getElementById('testButton');
    const statusDiv = document.getElementById('status');

    function showStatus(message, type = 'info') {
        statusDiv.className = `status-msg ${type}`;
        statusDiv.textContent = message;
        if (type !== 'info') {
            setTimeout(() => statusDiv.textContent = '', 3000);
        }
    }

    // 載入已儲存的 API Key（只顯示已儲存的提示）
    chrome.storage.sync.get({ translatorApiKey: '' }, (items) => {
        if (items.translatorApiKey) {
            showStatus('✅ API Key 已儲存', 'success');
            apiKeyInput.value = ''; // 不顯示實際 key
            apiKeyInput.placeholder = '已儲存 (輸入新 key 可覆蓋)...';
        }
    });

    // 儲存 API Key
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showStatus('❌ 請輸入 API Key', 'error');
            return;
        }

        if (apiKey.length < 20) {
            showStatus('❌ API Key 格式似乎不正確（太短）', 'error');
            return;
        }

        chrome.storage.sync.set({ translatorApiKey: apiKey, translatorApiType: 'microsoft' }, () => {
            console.log('[Popup] 💾 API Key saved to chrome.storage.sync');
            showStatus('✅ API Key 已儲存成功！', 'success');
            apiKeyInput.value = '';
            apiKeyInput.placeholder = '已儲存 (輸入新 key 可覆蓋)...';

            // 驗證儲存是否成功
            chrome.storage.sync.get({ translatorApiKey: '' }, (items) => {
                if (items.translatorApiKey) {
                    console.log('[Popup] ✅ Verified: API Key is in storage');
                } else {
                    console.error('[Popup] ❌ Error: API Key not found in storage after saving!');
                    showStatus('⚠️ 儲存驗證失敗，請重試', 'error');
                }
            });
        });
    });

    // 測試連線
    testButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            // 嘗試從儲存中載入
            chrome.storage.sync.get({ translatorApiKey: '' }, (items) => {
                if (items.translatorApiKey) {
                    testConnection(items.translatorApiKey);
                } else {
                    showStatus('❌ 請先輸入或儲存 API Key', 'error');
                }
            });
            return;
        }

        testConnection(apiKey);
    });

    function testConnection(apiKey) {
        showStatus('🔄 測試中...', 'info');
        testButton.disabled = true;

        // 透過 background script 測試連線，避免 CORS 問題
        chrome.runtime.sendMessage(
            { action: "TEST_TRANSLATOR_API", apiKey: apiKey },
            (response) => {
                testButton.disabled = false;

                if (!response) {
                    showStatus('❌ 網路錯誤: 無法連接到背景腳本', 'error');
                    return;
                }

                if (response.success) {
                    showStatus('✅ 連線成功！API Key 有效', 'success');
                    chrome.storage.sync.set({ translatorApiKey: apiKey, translatorApiType: 'microsoft' }, () => {
                        console.log('[Popup] 💾 API Key saved from test (auto-save)');
                        apiKeyInput.value = '';
                        apiKeyInput.placeholder = '已儲存 (輸入新 key 可覆蓋)...';
                    });
                } else {
                    const errorMsg = response.error || '未知錯誤';
                    showStatus(`❌ ${errorMsg}`, 'error');
                }
            }
        );
    }

    // Enter 鍵儲存
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveButton.click();
        }
    });
});