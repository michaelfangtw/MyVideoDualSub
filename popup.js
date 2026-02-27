// popup.js (V4.0 Radio Buttons)
document.addEventListener('DOMContentLoaded', () => {
    const radios = document.querySelectorAll('input[name="mode"]');

    // 預設模式：英文 / 中文 (雙語)
    const defaultSettings = {
        subtitleMode: 'eng_zho' // 'disabled', 'eng_only', 'eng_zho', 'zho_eng'
    };

    // 1. 讀取並應用設定
    chrome.storage.sync.get(defaultSettings, (items) => {
        const currentMode = items.subtitleMode;
        const radioToCheck = document.querySelector(`input[name="mode"][value="${currentMode}"]`);
        if (radioToCheck) {
            radioToCheck.checked = true;
        }
    });

    // 2. 監聽變化並儲存
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.sync.set({ subtitleMode: e.target.value });
                console.log('Mode saved:', e.target.value);
            }
        });
    });
});