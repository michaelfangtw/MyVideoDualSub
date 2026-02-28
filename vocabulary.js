// vocabulary.js - Advanced Word Frequency & Tooltip System
// 單詞頻率標記 + 懸停Tooltip顯示例句 (安全版本，防止XSS)

// 3000+常用英文單詞庫 (COCA頻率排名 > 3000)
// 包含例句和難度級別
const ADVANCED_WORDS = {
    "elaborate": {
        rank: 3001,
        level: "B2",
        definition: "detailed and complicated",
        examples: [
            "She gave an elaborate explanation of the process.",
            "The cake had an elaborate design with flowers."
        ]
    },
    "remarkable": {
        rank: 3002,
        level: "B2",
        definition: "worthy of attention; striking",
        examples: [
            "It's remarkable how much he has improved.",
            "The view from the mountain was remarkable."
        ]
    },
    "demonstrate": {
        rank: 3003,
        level: "B1",
        definition: "to show or prove by example",
        examples: [
            "The teacher demonstrated how to solve the problem.",
            "His work demonstrates his talent."
        ]
    },
    "establish": {
        rank: 3004,
        level: "B1",
        definition: "to set up or create",
        examples: [
            "They established a new company in 2020.",
            "We need to establish clear rules."
        ]
    },
    "fundamental": {
        rank: 3005,
        level: "B2",
        definition: "essential; basic",
        examples: [
            "Reading is a fundamental skill.",
            "Exercise is fundamental to good health."
        ]
    },
    "sophisticated": {
        rank: 3006,
        level: "C1",
        definition: "complex; refined",
        examples: [
            "The software uses sophisticated algorithms.",
            "She has sophisticated taste in art."
        ]
    },
    "comprehensive": {
        rank: 3007,
        level: "B2",
        definition: "complete; including everything",
        examples: [
            "The report provides a comprehensive analysis.",
            "We need a comprehensive plan."
        ]
    },
    "inevitable": {
        rank: 3008,
        level: "B2",
        definition: "certain to happen",
        examples: [
            "Change is inevitable.",
            "The accident was inevitable given the conditions."
        ]
    },
    "magnificent": {
        rank: 3009,
        level: "B2",
        definition: "splendid; impressive",
        examples: [
            "The mansion was magnificent.",
            "The sunset was magnificent."
        ]
    },
    "equivalent": {
        rank: 3010,
        level: "B2",
        definition: "equal in value or importance",
        examples: [
            "10 meters is equivalent to about 33 feet.",
            "The two products are equivalent."
        ]
    },
    "numerous": {
        rank: 3011,
        level: "B1",
        definition: "very many",
        examples: [
            "There are numerous ways to solve this problem.",
            "She has numerous awards."
        ]
    },
    "substantial": {
        rank: 3012,
        level: "B2",
        definition: "large in amount; important",
        examples: [
            "There has been a substantial increase in sales.",
            "He made a substantial donation."
        ]
    },
    "persistent": {
        rank: 3013,
        level: "B2",
        definition: "continuing firmly; refusing to stop",
        examples: [
            "His persistent efforts finally paid off.",
            "The problem is persistent."
        ]
    },
    "conceive": {
        rank: 3014,
        level: "C1",
        definition: "to form an idea; to become pregnant",
        examples: [
            "She conceived the idea for the project.",
            "They conceived a child."
        ]
    },
    "derive": {
        rank: 3015,
        level: "C1",
        definition: "to obtain from; to get",
        examples: [
            "The word 'television' derives from Greek.",
            "We derive energy from food."
        ]
    },
    "exemplify": {
        rank: 5041,
        level: "C1",
        definition: "to be a typical example of",
        examples: [
            "This exemplifies the problem perfectly.",
            "His work exemplifies excellence."
        ]
    },
    "exhilarate": {
        rank: 5056,
        level: "C1",
        definition: "to make cheerful and excited",
        examples: [
            "The victory exhilarated the team.",
            "Fresh air exhilarates the mind."
        ]
    },
    "exigent": {
        rank: 5064,
        level: "C1",
        definition: "demanding urgent attention",
        examples: [
            "An exigent situation requires immediate action.",
            "Exigent circumstances justified the delay."
        ]
    },
    "existential": {
        rank: 5072,
        level: "C1",
        definition: "relating to human existence",
        examples: [
            "An existential crisis affects many people.",
            "Existential questions about meaning."
        ]
    },
    "exonerate": {
        rank: 5076,
        level: "C1",
        definition: "to free from blame",
        examples: [
            "The evidence exonerates him completely.",
            "The investigation exonerated the suspect."
        ]
    }
};

// 全局詞頻資料
let WORDLIST = null;

// 異步載入 wordlist.json (3000-10000 詞)
function loadWordlist() {
    if (WORDLIST) return Promise.resolve();
    return fetch(chrome.runtime.getURL('wordlist.json'))
        .then(r => r.json())
        .then(data => {
            WORDLIST = data.words || {};
            console.log('[Vocabulary] Loaded', Object.keys(WORDLIST).length, 'words from wordlist');
        })
        .catch(e => {
            console.warn('[Vocabulary] Failed to load wordlist:', e);
            WORDLIST = {};
        });
}

// 判斷單詞是否需要標記 (檢查本地詞庫 + wordlist)
function isAdvancedWord(word) {
    const lowerWord = word.toLowerCase();
    // 優先檢查本地詞庫 (21 個詞 + 定義 + 例句)
    if (ADVANCED_WORDS.hasOwnProperty(lowerWord)) {
        return true;
    }
    // 再檢查 wordlist (3000-10000 範圍)
    if (WORDLIST && WORDLIST[lowerWord]) {
        return true;
    }
    return false;
}

// 獲取單詞信息 (支援本地詞庫 + wordlist)
function getWordInfo(word) {
    const lowerWord = word.toLowerCase();
    // 優先從本地詞庫 (有完整定義)
    if (ADVANCED_WORDS[lowerWord]) {
        return ADVANCED_WORDS[lowerWord];
    }
    // 從 wordlist 獲取基本信息 (rank 和 tier)
    if (WORDLIST && WORDLIST[lowerWord]) {
        const rank = WORDLIST[lowerWord];
        const tier = rank >= 5000 ? 2 : 1;
        return {
            rank: rank,
            tier: tier,
            level: tier === 1 ? 'B2-C1' : 'C1-C2',
            definition: '',
            examples: []
        };
    }
    return null;
}

// 安全地創建Tooltip DOM
function createTooltipElement(word) {
    const info = getWordInfo(word);
    if (!info) return null;

    const tooltip = document.createElement('div');
    tooltip.className = 'word-tooltip';

    // Header: word + level
    const header = document.createElement('div');
    header.className = 'tooltip-header';

    const wordSpan = document.createElement('strong');
    wordSpan.textContent = word;

    const levelSpan = document.createElement('span');
    levelSpan.className = 'tooltip-level';
    levelSpan.textContent = info.level;

    header.appendChild(wordSpan);
    header.appendChild(levelSpan);
    tooltip.appendChild(header);

    // Definition
    const defDiv = document.createElement('div');
    defDiv.className = 'tooltip-definition';
    defDiv.textContent = info.definition;
    tooltip.appendChild(defDiv);

    // Examples
    const examplesDiv = document.createElement('div');
    examplesDiv.className = 'tooltip-examples';

    info.examples.forEach(example => {
        const exDiv = document.createElement('div');
        exDiv.className = 'tooltip-example';
        exDiv.textContent = '• ' + example;
        examplesDiv.appendChild(exDiv);
    });
    tooltip.appendChild(examplesDiv);

    // Link
    const linkDiv = document.createElement('div');
    linkDiv.className = 'tooltip-link';

    const link = document.createElement('a');
    link.href = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '📖 Open in Wiktionary';

    linkDiv.appendChild(link);
    tooltip.appendChild(linkDiv);

    return tooltip;
}

// 標記和處理文本中的高級單詞
function markAdvancedWords(text) {
    if (!text) return text;

    return text.replace(/\b([a-z'-]+)\b/gi, (match) => {
        if (isAdvancedWord(match)) {
            const word = match.toLowerCase();
            const wordInfo = getWordInfo(word);
            const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;

            // Tier 1 (3000-5000): ** 雙星 - Advanced (B2-C1)
            // Tier 2 (5000+): * 單星 - Expert (C1-C2)
            const isTier2 = wordInfo && wordInfo.rank >= 5000;
            const mark = isTier2 ? '*' : '**';
            const tier = isTier2 ? 'tier2' : 'tier1';

            return `<span class="advanced-word ${tier}" data-word="${word}" title="Advanced word (${isTier2 ? 'Expert *' : 'Advanced **'})" onclick="window.open('${wiktionaryUrl}', '_blank')">${match}${mark}</span>`;
        }
        return match;
    });
}

// 初始化Tooltip事件監聽
function initializeTooltips() {
    const tooltipContainer = document.getElementById('word-tooltip-container');
    if (!tooltipContainer) return;

    document.addEventListener('mouseover', (e) => {
        if (e.target.classList && e.target.classList.contains('advanced-word')) {
            const word = e.target.getAttribute('data-word');
            if (!word) return;

            // 清空並填充tooltip內容
            tooltipContainer.innerHTML = '';
            const tooltipElement = createTooltipElement(word);
            if (tooltipElement) {
                tooltipContainer.appendChild(tooltipElement);
                tooltipContainer.style.display = 'block';

                // 定位tooltip在單詞附近
                const rect = e.target.getBoundingClientRect();
                tooltipContainer.style.left = (rect.left + window.scrollX) + 'px';
                tooltipContainer.style.top = (rect.bottom + window.scrollY + 10) + 'px';
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.classList && e.target.classList.contains('advanced-word')) {
            tooltipContainer.style.display = 'none';
        }
    });
}

// 創建Tooltip容器
function createTooltipContainer() {
    if (document.getElementById('word-tooltip-container')) return;

    const container = document.createElement('div');
    container.id = 'word-tooltip-container';
    container.className = 'word-tooltip-container';
    document.body.appendChild(container);
}

// 初始化詞表（模組載入時）
loadWordlist().catch(e => {
    console.warn('[Vocabulary] Failed to initialize wordlist:', e);
});

// 匯出功能
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isAdvancedWord,
        getWordInfo,
        createTooltipElement,
        markAdvancedWords,
        initializeTooltips,
        createTooltipContainer,
        ADVANCED_WORDS
    };
}
