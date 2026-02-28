// popup.js (V4.0 Radio Buttons)
document.addEventListener('DOMContentLoaded', () => {
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
});