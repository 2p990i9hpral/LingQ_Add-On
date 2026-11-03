// ==UserScript==
// @name         LingQ Addon
// @description  Provides custom LingQ layouts
// @match        https://www.lingq.com/*
// @match        https://www.youtube-nocookie.com/*
// @match        https://www.youtube.com/embed/*
// @version      19.0.7
// @license      GPL-3.0-or-later
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_xmlhttpRequest
// @require https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js
// @require https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
// @require https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js
// @namespace https://greasyfork.org/users/1458847
// @downloadURL https://update.greasyfork.org/scripts/533096/LingQ%20Addon.user.js
// @updateURL https://update.greasyfork.org/scripts/533096/LingQ%20Addon.meta.js
// ==/UserScript==

(function () {
    "use strict";
    const createClient = supabase.createClient;
    
    const storage = {
        get: (key, defaultValue) => {
            const value = GM_getValue(key);
            return value === undefined ? defaultValue : value;
        },
        set: (key, value) => GM_setValue(key, value)
    };
    
    const defaults = {
        styleType: {},
        videoPosition: {},
        heightBig: 400,
        widgetWidth: 400,
        fontSize: {},
        annotationScale: {},
        lineHeight: {},
        customFont: {},
        
        colorMode: "white",
        white_fontColor: "rgb(0, 0, 0)",
        white_translationFontColor: "rgb(0, 0, 0)",
        white_lingqBackground: "rgba(255, 232, 149, 1)",
        white_lingqBorder: "rgba(255, 200, 0, 0)",
        white_lingqBorderLearned: "rgba(255, 200, 0, 0)",
        white_unknownBackground: "rgba(198, 223, 255, 1)",
        white_unknownBorder: "rgba(0, 111, 255, 0)",
        white_playingUnderline: "rgb(0, 0, 0)",
        dark_fontColor: "rgb(255, 255, 255)",
        dark_translationFontColor: "rgb(255, 255, 255)",
        dark_lingqBackground: "rgba(108, 87, 43, 1)",
        dark_lingqBorder: "rgba(254, 203, 72, 0)",
        dark_lingqBorderLearned: "rgba(254, 203, 72, 0)",
        dark_unknownBackground: "rgba(37, 57, 82, 1)",
        dark_unknownBorder: "rgba(72, 154, 254, 0)",
        dark_playingUnderline: "rgb(255, 255, 255)",
        
        librarySortOption: 0,
        focusSelectedText: false,
        hoverAnnotation: "off",
        skipEndPage: false,
        relocateCaption: 'default',
        captionFontsize: 1.1,
        widgetVerticalAlign: 'flex-start',
        showMemoWidget: false,
        hidePopularMeanings: false,
        hideDictionaries: false,
        hideSentenceSection: false,
        hideReaderPopup: false,
        hideLynxUI: false,
        
        keyboardShortcut: false,
        skipDuration: 5,
        shortcutVideoFullscreen: 'p',
        shortcutBackward5s: 'a',
        shortcutForward5s: 's',
        shortcutTTSPlay: 'w',
        shortcutTranslator: 'e',
        shortcutMakeKnown: 'd',
        shortcutDictionary: 'f',
        shortcutCopySelected: 'c',
        shortcutMeaningInput: '`',
        shortcutChatInput: 'q',
        shortcutFlashcard: 'r',
        
        chatWidget: false,
        chatWidgetHeight: 350,
        llmProvider: "openai",
        llmModel: "gpt-5.4-mini",
        llmApiKeys: {},
        llmModels: {},
        vertexCredential: {},
        llmResponseLanguage: "auto",
        askSelected: false,
        prependSummary: {},
        summaryDifficulty: {},
        useCentralDb: true,
        dbUrl: "",
        dbKey: "",
        
        tts: false,
        ttsAutoplay: false,
        ttsApiKeys: {},
        ttsProvider: "openai",
        ttsModel: "gemini-3.8-flash-lite-tts",
        ttsVoice: {},
        ttsWord: false,
        
        lingqVolume: 1.0,
        lingqSpeed: {},
        ttsSentence: false,
    };
    
    const languageScopedDefaults = {
        styleType: "default",
        videoPosition: "Right",
        customFont: "",
        prependSummary: false,
        summaryDifficulty: "unset",
        fontSize: 1.1,
        annotationScale: 50,
        lineHeight: 1.7,
        ttsVoice: "random",
        ankiDeck: "",
        lingqSpeed: 1.0
    };
    
    const useVertexPriorityMode = false;
    
    const llmModelsByProvider = {
        "openai": [
            {value: "gpt-6.1-sol", text: "GPT-6.1 Sol ($2/$10)", inputPrice: 2, outputPrice: 10, cachedPrice: 0.1},
            {value: "gpt-6.1-terra", text: "GPT-6.1 Terra ($1/$5)", inputPrice: 1, outputPrice: 5, cachedPrice: 0.05},
            {value: "gpt-6-sol", text: "GPT-6 Sol ($2/$10)", inputPrice: 2, outputPrice: 10, cachedPrice: 0.2},
            {value: "gpt-6-luna", text: "GPT-6 Luna ($0.1/$0.5)", inputPrice: 0.1, outputPrice: 0.5, cachedPrice: 0.01},
            {value: "gpt-5.6-sol", text: "GPT-5.6 Sol ($5/$30)", inputPrice: 5, outputPrice: 30, cachedPrice: 0.5},
            {value: "gpt-5.6-terra", text: "GPT-5.6 Terra ($2/$12)", inputPrice: 2, outputPrice: 12, cachedPrice: 0.2},
            {value: "gpt-5.6-luna", text: "GPT-5.6 Luna ($0.2/$1.2)", inputPrice: 0.2, outputPrice: 1.2, cachedPrice: 0.02},
            {value: "gpt-5.5", text: "GPT-5.5 ($5/$30)", inputPrice: 5, outputPrice: 30, cachedPrice: 0.5},
            {value: "gpt-5.4", text: "GPT-5.4 ($2.5/$15)", inputPrice: 2.5, outputPrice: 15, cachedPrice: 0.25},
            {value: "gpt-5.4-mini", text: "GPT-5.4 mini ($0.75/$4.5)", inputPrice: 0.75, outputPrice: 4.5, cachedPrice: 0.075}
        ],
        "google": [
            {value: "gemini-4-argon", text: "Gemini 4 Argon ($2/$10)", inputPrice: 2, outputPrice: 10, cachedPrice: 0.1},
            {value: "gemini-3.8-flash", text: "Gemini 3.8 Flash ($0.75/$3.75)", inputPrice: 0.75, outputPrice: 3.75, cachedPrice: 0.075},
            // {value: "gemini-3.7-flash", text: "Gemini 3.7 Flash ($0.75/$3.75)", inputPrice: 0.75, outputPrice: 3.75, cachedPrice: 0.075},
            {value: "gemini-3.6-flash", text: "Gemini 3.6 Flash ($0.75/$3.75)", inputPrice: 0.75, outputPrice: 3.75, cachedPrice: 0.075},
            // {value: "gemini-3.5-flash", text: "Gemini 3.5 Flash ($1.5/$9)", inputPrice: 1.5, outputPrice: 9, cachedPrice: 0.15},
            {value: "gemini-3-flash-preview", text: "Gemini 3.0 Flash ($0.5/$3)", inputPrice: 0.5, outputPrice: 3, cachedPrice: 0.05},
            {value: "gemini-3.5-flash-lite", text: "Gemini 3.5 Flash-Light ($0.3/$2.5)", inputPrice: 0.3, outputPrice: 2.5, cachedPrice: 0.03},
            {value: "gemini-3.1-flash-lite", text: "Gemini 3.1 Flash-Light ($0.25/$1.5)", inputPrice: 0.25, outputPrice: 1.5, cachedPrice: 0.025}
        ],
        "vertex": [
            {value: "gemini-3.8-flash", text: "Gemini 3.8 Flash ($0.75/$3.75)", inputPrice: 0.75, outputPrice: 3.75, cachedPrice: 0.075},
            {value: "gemini-3.7-flash", text: "Gemini 3.7 Flash ($0.75/$3.75)", inputPrice: 0.75, outputPrice: 3.75, cachedPrice: 0.075},
            {value: "gemini-3.6-flash", text: "Gemini 3.6 Flash ($0.75/$3.75)", inputPrice: 0.75, outputPrice: 3.75, cachedPrice: 0.075},
            {value: "gemini-3.5-flash", text: "Gemini 3.5 Flash ($1.5/$9)", inputPrice: 1.5, outputPrice: 9, cachedPrice: 0.15},
            {value: "gemini-3-flash-preview", text: "Gemini 3.0 Flash ($0.5/$3)", inputPrice: 0.5, outputPrice: 3, cachedPrice: 0.05},
            {value: "gemini-3.5-flash-lite", text: "Gemini 3.5 Flash-Light ($0.3/$2.5)", inputPrice: 0.3, outputPrice: 2.5, cachedPrice: 0.03},
            {value: "gemini-3.1-flash-lite", text: "Gemini 3.1 Flash-Light ($0.25/$1.5)", inputPrice: 0.25, outputPrice: 1.5, cachedPrice: 0.025}
        ],
        "anthropic": [
            {value: "claude-sonnet-5-5", text: "Sonnet 5.5 ($2/$10)", inputPrice: 2, outputPrice: 10, cachedPrice: 0.1},
            {value: "claude-sonnet-5", text: "Sonnet 5 ($2/$10)", inputPrice: 2, outputPrice: 10, cachedPrice: 0.2},
            {value: "claude-sonnet-4-6", text: "Sonnet 4.6 ($3.0/$15)", inputPrice: 3.0, outputPrice: 15, cachedPrice: 0.3},
            {value: "claude-haiku-5-5", text: "Haiku 5.5 ($0.1/$0.5)", inputPrice: 0.1, outputPrice: 0.5, cachedPrice: 0.01},
            {value: "claude-haiku-4-5", text: "Haiku 4.5 ($1/$5)", inputPrice: 1, outputPrice: 5, cachedPrice: 0.1}
        ],
        "deepseek": [
            {value: "deepseek-v4-pro", text: "v4 Pro ($0.66/$1.98)", inputPrice: 0.66, outputPrice: 1.98, cachedPrice: 0.022},
            {value: "deepseek-flash", text: "v4 Flash ($0.15/$0.9)", inputPrice: 0.15, outputPrice: 0.9, cachedPrice: 0.003}
        ],
        "cerebras": [
            {value: "gemma-4-31b", text: "Gemma 4 31B ($0.99/$1.49)", inputPrice: 0.99, outputPrice: 1.49, cachedPrice: 0.099}
        ],
        "zai": [
            {value: "glm-5.3-flash", text: "GLM-5.3 Flash ($0.15/$0.50)", inputPrice: 0.15, outputPrice: 0.50, cachedPrice: 0.03},
            {value: "glm-5.3-flashx", text: "GLM-5.3 FlashX ($0.15/$0.50)", inputPrice: 0.37, outputPrice: 1.25, cachedPrice: 0.075}
        ]
    };
    
    const ttsModelsByProvider = {
        "google gemini": [
            {value: "gemini-3.8-flash-tts", text: "gemini-3.8-flash-tts ($0.5/$9)", inputPrice: 0.5, outputPrice: 9, cachedPrice: 0},
            {value: "gemini-3.8-flash-lite-tts", text: "gemini-3.8-flash-lite-tts ($0.5/$6)", inputPrice: 0.5, outputPrice: 6, cachedPrice: 0},
            {value: "gemini-3.1-flash-tts-preview", text: "gemini 3.1-flash-tts ($1/$20)", inputPrice: 1, outputPrice: 20, cachedPrice: 0},
            {value: "gemini-2.5-flash-preview-tts", text: "gemini 2.5-flash-tts ($0.5/$10)", inputPrice: 0.5, outputPrice: 10, cachedPrice: 0}
        ],
        "elevenlabs": [
            {value: "eleven_v4_turbo", text: "Eleven v4 Turbo ($0.04)"},
            {value: "eleven_v4", text: "Eleven v4 ($0.08)"},
            {value: "eleven_v3", text: "Eleven v3 ($0.08)"},
            {value: "eleven_flash_v2_5", text: "Eleven Flash v2.5 ($0.04)"},
            {value: "eleven_turbo_v2_5", text: "Eleven Turbo v2.5 ($0.04)"},
            {value: "eleven_multilingual_v2", text: "Eleven Multilingual v2 ($0.08)"}
        ]
    };
    
    function ensureLanguageScopedSetting(settingKey, language) {
        let scopedSettings = typeof settings[settingKey] === "object" && settings[settingKey] !== null
            ? settings[settingKey]
            : {};
        
        if (typeof settings[settingKey] !== "object" && settings[settingKey] !== undefined && settings[settingKey] !== null) {
            scopedSettings = {[language]: settings[settingKey]};
        }
        
        if (Object.hasOwn(scopedSettings, language)) return;
        
        settings[settingKey] = {
            ...scopedSettings,
            [language]: languageScopedDefaults[settingKey]
        };
    }
    
    function ensureLanguageSettings(language) {
        Object.keys(languageScopedDefaults).forEach((settingKey) => {
            ensureLanguageScopedSetting(settingKey, language);
        });
    }
    
    function resetLanguageScopedSettings(language) {
        Object.entries(languageScopedDefaults).forEach(([settingKey, defaultValue]) => {
            settings[settingKey] = {
                [language]: defaultValue
            };
        });
    }
    
    const settings = new Proxy({}, {
        get: (target, key) => {
            const rawValue = key in target ? target[key] : storage.get(key, defaults[key]);
            
            if (key in languageScopedDefaults) {
                const defaultValue = languageScopedDefaults[key];
                const scopedMap = (typeof rawValue === "object" && rawValue !== null) ? rawValue : {};
                
                return new Proxy(scopedMap, {
                    get(mapTarget, lang) {
                        if (typeof lang !== "string") return mapTarget[lang];
                        if (!lang || !(lang in mapTarget) || mapTarget[lang] === undefined || mapTarget[lang] === null) {
                            return defaultValue;
                        }
                        return mapTarget[lang];
                    }
                });
            }
            
            return rawValue;
        },
        set: (target, key, value) => {
            storage.set(key, value);
            target[key] = value;
            return true;
        }
    });
    
    let supabaseClient;
    
    const CENTRAL_SUPABASE_URL = "https://hzmjdmliorfotjbbkrni.supabase.co";
    const CENTRAL_ANON_KEY = "sb_publishable_Plp6a27hTp5D9llOnwapXA_ZU8VKqsB";
    
    let centralClient;
    let centralUserId = null;
    let centralUserEmail = "";
    
    const openaiVoiceOptions = [
        {value: "random", text: "Random"},
        {value: "alloy", text: "Alloy"},
        {value: "ash", text: "Ash"},
        {value: "ballad", text: "Ballad"},
        {value: "coral", text: "Coral"},
        {value: "echo", text: "Echo"},
        {value: "fable", text: "Fable"},
        {value: "onyx", text: "Onyx"},
        {value: "nova", text: "Nova"},
        {value: "sage", text: "Sage"},
        {value: "shimmer", text: "Shimmer"},
        {value: "verse", text: "Verse"}];
    const googleGeminiVoiceOptions = [
        {value: "random", text: "Random"},
        {value: "Zephyr", text: "Zephyr (Bright)"},
        {value: "Puck", text: "Puck (Upbeat)"},
        {value: "Charon", text: "Charon (Informative)"},
        {value: "Kore", text: "Kore (Firm)"},
        {value: "Fenrir", text: "Fenrir (Excitable)"},
        {value: "Leda", text: "Leda (Youthful)"},
        {value: "Orus", text: "Orus (Firm)"},
        {value: "Aoede", text: "Aoede (Breezy)"},
        {value: "Callirrhoe", text: "Callirrhoe (Easy-going)"},
        {value: "Autonoe", text: "Autonoe (Bright)"},
        {value: "Enceladus", text: "Enceladus (Breathy)"},
        {value: "Iapetus", text: "Iapetus (Clear)"},
        {value: "Umbriel", text: "Umbriel (Easy-going)"},
        {value: "Algieba", text: "Algieba (Smooth)"},
        {value: "Despina", text: "Despina (Smooth)"},
        {value: "Erinome", text: "Erinome (Clear)"},
        {value: "Algenib", text: "Algenib (Gravelly)"},
        {value: "Rasalgethi", text: "Rasalgethi (Informative)"},
        {value: "Laomedeia", text: "Laomedeia (Upbeat)"},
        {value: "Achernar", text: "Achernar (Soft)"},
        {value: "Alnilam", text: "Alnilam (Firm)"},
        {value: "Schedar", text: "Schedar (Even)"},
        {value: "Gacrux", text: "Gacrux (Mature)"},
        {value: "Pulcherrima", text: "Pulcherrima (Forward)"},
        {value: "Achird", text: "Achird (Friendly)"},
        {value: "Zubenelgenubi", text: "Zubenelgenubi (Casual)"},
        {value: "Vindemiatrix", text: "Vindemiatrix (Gentle)"},
        {value: "Sadachbia", text: "Sadachbia (Lively)"},
        {value: "Sadaltager", text: "Sadaltager (Knowledgeable)"},
        {value: "Sulafat", text: "Sulafat (Warm)"}
    ];
    const elevenLabsVoiceOptions = [
        {value: "random", text: "Random"},
        {value: "hpp4J3VqNfWAUOO0d1Us", text: "Bella (Professional, Bright, Warm)"},
        {value: "CwhRBWXzGAHq8TQ4Fs17", text: "Roger (Laid-Back, Casual, Resonant)"},
        {value: "EXAVITQu4vr4xnSDxMaL", text: "Sarah (Mature, Reassuring, Confident)"},
        {value: "FGY2WhTYpPnrIDTdsKH5", text: "Laura (Enthusiast, Quirky Attitude)"},
        {value: "IKne3meq5aSn9XLyUdCD", text: "Charlie (Deep, Confident, Energetic)"},
        {value: "JBFqnCBsd6RMkjVDRZzb", text: "George (Warm, Captivating Storyteller)"},
        {value: "N2lVS1w4EtoT3dr4eOWO", text: "Callum (Husky Trickster)"},
        {value: "SAz9YHcvj6GT2YYXdXww", text: "River (Relaxed, Neutral, Informative)"},
        {value: "SOYHLrjzK2X1ezoPC6cr", text: "Harry (Fierce Warrior)"},
        {value: "TX3LPaxmHKxFdv7VOQHJ", text: "Liam (Energetic, Social Media Creator)"},
        {value: "Xb7hH8MSUJpSbSDYk0k2", text: "Alice (Clear, Engaging Educator)"},
        {value: "XrExE9yKIg1WjnnlVkGX", text: "Matilda (Knowledgable, Professional)"},
        {value: "bIHbv24MWmeRgasZH58o", text: "Will (Relaxed Optimist)"},
        {value: "cgSgspJ2msm6clMCkdW9", text: "Jessica (Playful, Bright, Warm)"},
        {value: "cjVigY5qzO86Huf0OWal", text: "Eric (Smooth, Trustworthy)"},
        {value: "iP95p4xoKVk53GoZ742B", text: "Chris (Charming, Down-to-Earth)"},
        {value: "nPczCjzI2devNBz1zQrb", text: "Brian (Deep, Resonant and Comforting)"},
        {value: "onwK4e9ZLuTAKqWW03F9", text: "Daniel (Steady Broadcaster)"},
        {value: "pFZP5JQG7iQjIQuC4Bku", text: "Lily (Velvety Actress)"},
        {value: "pNInz6obpgDQGcFmaJgB", text: "Adam (Dominant, Firm)"},
        {value: "pqHfZKP75CvOlQylNhV4", text: "Bill (Wise, Mature, Balanced)"}
    ];
    const googleCloudVoiceOptions = generateGoogleCloudVoiceOptions(getLessonLanguage());
    const voiceOptionsObject = {
        "openai": openaiVoiceOptions,
        "google gemini": googleGeminiVoiceOptions,
        "google cloud": googleCloudVoiceOptions,
        "elevenlabs": elevenLabsVoiceOptions
    };
    
    function getAvailableVoicesForProvider(provider, language = getLessonLanguage()) {
        if (provider === "google cloud") {
            return generateGoogleCloudVoiceOptions(language);
        }
        return voiceOptionsObject[provider] || [];
    }
    
    /* Get LingQ Data */
    
    function getLessonId(url) {
        const urlToGet = url ? url : document.URL;
        const regex = /(http|https):\/\/www\.lingq\.com\/[\w-]+\/learn\/[\w-]+\/\w+\/\w+\/(\d+)/;
        const match = urlToGet.match(regex);
        
        return match?.[2];
    }
    
    function getCollectionId(url) {
        const urlToGet = url ? url : document.URL;
        const regex = /(http|https):\/\/www\.lingq\.com\/[\w-]+\/learn\/[\w-]+\/web\/library\/course\/(\d+)/;
        const match = urlToGet.match(regex);
        
        return match?.[2];
    }
    
    function getLessonLanguage(url) {
        const urlToGet = url ? url : document.URL;
        const regex = /(http|https)*:\/\/www\.lingq\.com\/[\w-]+\/learn\/([\w-]+)\/\w+\/\w+\/\d+/;
        const match = urlToGet.match(regex);
        
        return match?.[2];
    }

    
    async function getUserProfile() {
        const url = `https://www.lingq.com/api/v3/profiles/`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return data.results[0]
    }
    
    async function getLanguageCode() {
        const userProfile = await getUserProfile();
        return userProfile.active_language;
    }
    
    async function getDictionaryLanguage() {
        const userProfile = await getUserProfile();
        return await userProfile.dictionary_languages[0];
    }
    
    let cachedDictionaryLocalePairs = null;
    
    async function getDictionaryLocalePairs() {
        if (cachedDictionaryLocalePairs) return cachedDictionaryLocalePairs;
        const url = `https://www.lingq.com/api/v2/dictionary-locales/`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        cachedDictionaryLocalePairs = Object.fromEntries(data.map(item => [item.code, item.title]));
        return cachedDictionaryLocalePairs;
    }
    
    async function getLessonInfo(lessonId) {
        const languageCode = await getLanguageCode();
        const url = `https://www.lingq.com/api/v3/${languageCode}/lessons/counters/?lesson=${lessonId}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return data[lessonId];
    }
    
    async function getAllLessons(languageCode, collectionId) {
        let allLessons = [];
        let nextUrl = `https://www.lingq.com/api/v3/${languageCode}/search/?page=1&page_size=1000&collection=${collectionId}`;
        
        while (nextUrl) {
            try {
                const response = await fetch(nextUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                allLessons = allLessons.concat(data.results);
                nextUrl = data.next;
            } catch (error) {
                console.error('Error fetching lessons:', error);
                break;
            }
        }
        
        return allLessons;
    }
    
    async function setLessonProgress(lessonId, wordIndex) {
        const languageCode = await getLanguageCode();
        const url = `https://www.lingq.com/api/v3/${languageCode}/lessons/${lessonId}/bookmark/`;
        const payload = {wordIndex: wordIndex, completedWordIndex: wordIndex, client: 'web'};
        
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    }
    
    const lessonSentencesCache = new Map();
    async function getLessonSentences(lessonLanguage, lessonId) {
        const cacheKey = `${lessonLanguage}_${lessonId}`;
        if (lessonSentencesCache.has(cacheKey)) {
            return lessonSentencesCache.get(cacheKey);
        }
        
        const url = `https://www.lingq.com/api/v3/${lessonLanguage}/lessons/${lessonId}/sentences/`;
        
        const response = await fetch(url);
        const data = await response.json();
        lessonSentencesCache.set(cacheKey, data);
        return data;
    }
    
    async function uploadAudioToLesson(lessonLanguage, lessonId, audioData, duration) {
        const url = `https://www.lingq.com/api/v3/${lessonLanguage}/lessons/${lessonId}/`;
        
        const formData = new FormData();
        formData.append('audio', new Blob([audioData], {type: 'audio/mpeg'}), 'output.mp3');
        formData.append('duration', duration);
        formData.append('external_audio', '');
        formData.append('language', lessonLanguage);
        
        const response = await fetch(url, {
            method: 'PATCH',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    async function updataTimestampToLesson(lessonLanguage, lessonId, timestamp) {
        const url = `https://www.lingq.com/api/v3/${lessonLanguage}/lessons/${lessonId}/timestamps/`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(timestamp)
        });
        
        if (!response.ok) {
            throw new Error(`Could not update timestamp. ${response.status} ${response.statusText}`);
        }
    }
    
    /* Utils */
    
    function createElement(tag, props = {}, ...children) {
        const svgTags = new Set(['svg', 'text', 'tspan', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'use']);
        const element = svgTags.has(tag)
            ? document.createElementNS('http://www.w3.org/2000/svg', tag)
            : document.createElement(tag);
        const {dataset, style, ...restProps} = props || {};
        
        if (svgTags.has(tag)) {
            Object.entries(restProps).forEach(([key, val]) => {
                if (val != null) {
                    if (key === 'className') {
                        element.setAttribute('class', String(val));
                    } else if (key === 'textContent') {
                        element.textContent = String(val);
                    } else {
                        element.setAttribute(key, String(val));
                    }
                }
            });
        } else {
            Object.assign(element, restProps);
        }
        
        if (typeof style === 'string') {
            element.style.cssText = style;
        } else if (typeof style === 'object' && style !== null) {
            Object.assign(element.style, style);
        }
        
        if (dataset && typeof dataset === 'object') {
            Object.entries(dataset).forEach(([key, value]) => {
                if (value != null) element.dataset[key] = String(value);
            });
        }
        
        children.forEach(child => child && element.append(child));
        return element;
    }
    
    function escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
    
    const PRONUNCIATION_REPLACEMENTS = {
        ja: {
            "u": "ɯ", "ʊ": "ɯ", "ɛ": "e", "ɪ": "i", "ã": "a", "ĩ": "i", "ẽ": "e", "õ": "o",
            "ō": "oː", "ū": "ɯː", ":": "ː",
            "ʲi": "i", "ʲ": "j", "y": "j", "ɰ": "w",
            "tɕ": "t͡ɕ", "ʧ": "t͡ɕ", "ʨ": "t͡ɕ", "dʑ": "d͡ʑ", "d͡ʒ": "d͡ʑ", "dʒ": "d͡ʑ", "ts": "t͡s", "ʦ": "t͡s", "dz": "d͡z",
            "g": "ɡ", "f": "ɸ", "β": "b", "ʃ": "ɕ", "r": "ɾ", "l": "ɾ",
            "-": "", "ˈ": "", "ˌ": "", "'": ""
        }
    };
    
    function preprocessPronunciation(rawText, lang) {
        let cleaned = rawText
            .replace(/[\u031E\u0325\u1D5D\u032A\uA71C\u0320\u031F\u031A\u034D\u032F]/g, "")
            .replace(/[\[\]\/]/g, "")
            .trim();
        
        const rules = PRONUNCIATION_REPLACEMENTS[lang];
        if (rules && cleaned) {
            const keys = Object.keys(rules).sort((a, b) => b.length - a.length);
            if (keys.length > 0) {
                const escapedKeys = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
                const pattern = new RegExp(escapedKeys.join("|"), "g");
                cleaned = cleaned.replace(pattern, match => rules[match]);
            }
        }
        
        return cleaned ? `[${cleaned}]` : "";
    }
    
    function clickElement(selector) {
        const element = document.querySelector(selector);
        if (element) element.click();
    }
    
    function focusElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            element.setSelectionRange(element.value.length, element.value.length);
        }
    }
    
    async function setLingQMeaning(newMeaning) {
        if (!newMeaning) return;
        const meaningText = String(newMeaning).trim();
        if (!meaningText) return;
        
        let input = document.querySelector('div[data-word-widget] form input[name="text"]');
        let navigatedToMeanings = false;
        
        if (!input) {
            const openMeaningsBtn = document.querySelector('div[data-word-widget] button[aria-label="Open Meanings"]');
            if (openMeaningsBtn) {
                openMeaningsBtn.click();
                navigatedToMeanings = true;
                await new Promise((resolve) => setTimeout(resolve, 100));
                
                const addMeaningBtn = document.querySelector('div[data-word-widget] button[data-size="txt"]') ||
                    Array.from(document.querySelectorAll('div[data-word-widget] button')).find((btn) =>
                        btn.textContent.includes('Add Meaning') || btn.querySelector('svg.lucide-plus')
                    );
                if (addMeaningBtn) {
                    addMeaningBtn.click();
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    input = document.querySelector('div[data-word-widget] form input[name="text"]');
                }
            }
        }
        
        if (!input) {
            const editBtn = document.querySelector('div[data-word-widget] button[aria-label^="Edit this meaning"]');
            if (editBtn) {
                editBtn.click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                input = document.querySelector('div[data-word-widget] form input[name="text"]');
            }
        }
        
        if (!input) return;
        
        input.focus();
        input.dispatchEvent(new FocusEvent("focus", {bubbles: true}));
        
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set.call(input, meaningText);
        input.dispatchEvent(new InputEvent("input", {bubbles: true, composed: true, data: meaningText}));
        input.dispatchEvent(new Event("change", {bubbles: true}));
        
        const form = input.closest('form');
        if (form) {
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', bubbles: true}));
            form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
        }
        
        input.blur();
        input.dispatchEvent(new FocusEvent("focusout", {bubbles: true}));
        
        if (navigatedToMeanings) {
            await new Promise((resolve) => setTimeout(resolve, 150));
            const backBtn = document.querySelector('div[data-word-widget] button[aria-label="Back to the word"]');
            if (backBtn) backBtn.click();
        }
    }
    
    function waitForElement(selector, timeout = 1000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);
            
            let timeoutId;
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;
                        
                        if (node.matches(selector)) {
                            clearTimeout(timeoutId);
                            resolve(node);
                            observer.disconnect();
                        } else {
                            const foundElement = node.querySelector(selector);
                            if (foundElement) {
                                clearTimeout(timeoutId);
                                resolve(foundElement);
                                observer.disconnect();
                            }
                        }
                    }
                });
            });
            
            observer.observe(document.documentElement, {childList: true, subtree: true});
            
            timeoutId = setTimeout(() => {
                resolve(null);
                observer.disconnect();
                console.log('Wait', `"${selector}" not found`);
            }, timeout);
        });
    }
    
    function copySelectedText() {
        const selectedWordEl = document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
        if (selectedWordEl) {
            navigator.clipboard.writeText(selectedWordEl.textContent.trim());
        }
    }
    
    function extractTextFromDOM(domElement, selectedEl = null) {
        function getAllLeafNodes(root) {
            const leaves = [];
            
            function traverse(node) {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'RT') {
                    return;
                }
                
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.trim() !== "") {
                        leaves.push(node);
                    }
                    return;
                }
                
                if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    if (node.childNodes.length === 0) {
                        leaves.push(node);
                        return;
                    }
                    Array.from(node.childNodes).forEach(traverse);
                }
            }
            
            traverse(root);
            return leaves;
        }
        
        const textParts = [];
        let sentenceElements = domElement.querySelectorAll('.reader-sentence, .sentence');
        sentenceElements = sentenceElements.length ? sentenceElements : [domElement];
        
        if (domElement.childNodes.length === 0) return null;
        
        const isNodeSelected = (node) => Boolean(node && selectedEl && (node === selectedEl || selectedEl.contains(node)));
        
        sentenceElements.forEach((sentenceElement) => {
            const leaves = getAllLeafNodes(sentenceElement);
            
            leaves.forEach((childNode, index) => {
                let text = childNode.textContent.trim();
                if (!text) return;
                
                const isSelected = isNodeSelected(childNode);
                
                if (isSelected) {
                    const isPrevSelected = isNodeSelected(leaves[index - 1]);
                    const isNextSelected = isNodeSelected(leaves[index + 1]);
                    
                    if (!isPrevSelected) text = `<selected>${text}`;
                    if (!isNextSelected) text = `${text}</selected>`;
                }
                
                textParts.push(text);
                
                const parentNode = childNode.parentNode;
                if (parentNode.nodeType === Node.ELEMENT_NODE && parentNode.matches('.has-end-punctuation-question')) {
                    textParts.push('?');
                }
                if (parentNode.nodeType === Node.ELEMENT_NODE && parentNode.matches('.has-end-punctuation-period')) {
                    textParts.push('.');
                }
            });
            textParts.push('\n');
        });
        
        return textParts.slice(0, -1).join(' ')
            .replace(/[^\S\n]?(\?|\.|\-|\n|。|、)[^\S\n]?/g, '$1')
            .replace(/[^\S\n]?(,|、)/g, '$1');
    }
    
    const toastQueue = [];
    let isToastProcessing = false;
    
    function showToast(inputMessage, success = true) {
        toastQueue.push({inputMessage, success});
        if (!isToastProcessing) {
            processToastQueue();
        }
    }
    
    function processToastQueue() {
        if (toastQueue.length === 0) {
            isToastProcessing = false;
            return;
        }
        
        isToastProcessing = true;
        const {inputMessage, success} = toastQueue.shift();
        
        const toast = createElement("div", {
            className: 'userToast',
            textContent: inputMessage,
            style: `box-shadow: 0 0 10px 0 ${success ? 'rgb(76, 175, 80)' : 'rgb(175, 76, 80)'}`
        });
        
        const widget = document.querySelector('div[data-word-widget]') || document.body;
        if (widget) {
            widget.appendChild(toast);
        }
        
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                processToastQueue();
            }, 1000);
        }, 1500);
    }
    
    function moveNextPage() {
        const nextButton = document.querySelector('button[aria-label="Next page"]');
        if (nextButton) nextButton.click();
    }
    
    function preventPropagation(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    async function changeScrollAmount(selector, scrollAmount) {
        const readerContainer = await waitForElement(selector, 1000);
        
        if (readerContainer) {
            readerContainer.addEventListener("wheel", (event) => {
                event.preventDefault();
                const delta = event.deltaY;
                readerContainer.scrollTop += delta * scrollAmount;
            });
        }
    }
    
    let activeVerticalScrollAnimation = null;
    
    function smoothScrollTo(element, to, duration, isHorizontal = false) {
        const scrollProp = isHorizontal ? "scrollLeft" : "scrollTop";
        
        if (!isHorizontal && activeVerticalScrollAnimation && activeVerticalScrollAnimation.element === element) {
            activeVerticalScrollAnimation.cancelled = true;
        }
        
        const start = element[scrollProp];
        const startTime = performance.now();
        
        const anim = {element, start, to, cancelled: false};
        if (!isHorizontal) {
            activeVerticalScrollAnimation = anim;
        }
        
        function easeInOutCubic(t) {
            t *= 2;
            if (t < 1) return 0.5 * t * t * t;
            t -= 2;
            return 0.5 * (t * t * t + 2);
        }
        
        function animateScroll(currentTime) {
            if (anim.cancelled) return;
            
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easeInOutCubic(progress);
            const currentChange = anim.to - anim.start;
            
            element[scrollProp] = anim.start + currentChange * easedProgress;
            
            if (elapsedTime < duration) {
                requestAnimationFrame(animateScroll);
            } else {
                element[scrollProp] = anim.to;
                if (activeVerticalScrollAnimation === anim) {
                    activeVerticalScrollAnimation = null;
                }
            }
        }
        
        requestAnimationFrame(animateScroll);
    }
    

    
    function getRandomElement(arr) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        return arr?.[randomIndex];
    }
    
    function applyCSS(css) {
        const cssElement = createElement("style", {textContent: css});
        document.querySelector("head").appendChild(cssElement);
    }
    
    
    function removeIndent(text) {
        const lines = text.split('\n');
        
        const indents = lines
            .filter(line => line.trim() !== '')
            .map(line => line.match(/^[ \t]*/)[0].length);
        
        const minIndent = indents.length ? Math.min(...indents) : 0;
        
        return lines
            .map(line => line.slice(minIndent))
            .join('\n')
            .trim();
    }
    
    async function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = createElement("script", {
                src: url,
                onload: () => resolve(script),
                onerror: reject
            });
            document.head.appendChild(script);
        });
    }
    
    async function decodeAudioData(audioContext, audioArrayBuffer) {
        return new Promise((resolve, reject) => {
            audioContext.decodeAudioData(audioArrayBuffer, resolve, reject);
        });
    }
    
    function encodeAudioBufferToMP3(audioBuffer, progressCallback) {
        return new Promise(resolve => {
            const sampleRate = audioBuffer.sampleRate;
            const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
            const mp3Data = [];
            
            const monoLength = audioBuffer.length;
            const monoPcmData = audioBuffer.getChannelData(0);
            
            const samples = new Int16Array(monoLength);
            for (let i = 0; i < monoLength; i++) {
                samples[i] = monoPcmData[i] * 32767.5;
            }
            
            const sampleBlockSize = 1152;
            const totalSamples = samples.length;
            
            const targetUpdateCount = 100;
            const progressUpdateBlocksInterval = Math.max(1, Math.floor((totalSamples / sampleBlockSize) / targetUpdateCount));
            let nextUpdateBlockThreshold = progressUpdateBlocksInterval;
            
            let currentSampleIndex = 0;
            
            const processNextChunk = () => {
                const targetIndexForThisChunk = Math.min(totalSamples, (nextUpdateBlockThreshold * sampleBlockSize));
                
                while (currentSampleIndex < targetIndexForThisChunk) {
                    const currentBlockEnd = Math.min(currentSampleIndex + sampleBlockSize, totalSamples);
                    const currentSamples = samples.subarray(currentSampleIndex, currentBlockEnd);
                    
                    const mp3buf = mp3encoder.encodeBuffer(currentSamples);
                    if (mp3buf.length > 0) {
                        mp3Data.push(new Uint8Array(mp3buf));
                    }
                    
                    currentSampleIndex = currentBlockEnd;
                }
                
                if (currentSampleIndex >= nextUpdateBlockThreshold * sampleBlockSize) {
                    progressCallback(currentSampleIndex, totalSamples);
                    nextUpdateBlockThreshold += progressUpdateBlocksInterval;
                }
                
                if (currentSampleIndex < totalSamples) {
                    requestAnimationFrame(processNextChunk);
                } else {
                    const mp3buf = mp3encoder.flush();
                    if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
                    
                    if (progressCallback) progressCallback(totalSamples, totalSamples);
                    
                    console.log(`Merging mp3 uint8array blocks into one.`);
                    let totalLength = 0;
                    for (let i = 0; i < mp3Data.length; i++) {
                        totalLength += mp3Data[i].length;
                    }
                    
                    const finalMp3Data = new Uint8Array(totalLength);
                    let offset = 0;
                    for (let i = 0; i < mp3Data.length; i++) {
                        finalMp3Data.set(mp3Data[i], offset);
                        offset += mp3Data[i].length;
                    }
                    resolve(finalMp3Data);
                }
            };
            
            requestAnimationFrame(processNextChunk);
        });
    }
    
    function generateGoogleCloudVoiceOptions(languageCode) {
        const voices = ["en-US-Chirp3-HD-Achernar","en-US-Chirp3-HD-Achird","en-US-Chirp3-HD-Algenib","en-US-Chirp3-HD-Algieba","en-US-Chirp3-HD-Alnilam","en-US-Chirp3-HD-Aoede","en-US-Chirp3-HD-Autonoe","en-US-Chirp3-HD-Callirrhoe","en-US-Chirp3-HD-Charon","en-US-Chirp3-HD-Despina","en-US-Chirp3-HD-Enceladus","en-US-Chirp3-HD-Erinome","en-US-Chirp3-HD-Fenrir","en-US-Chirp3-HD-Gacrux","en-US-Chirp3-HD-Iapetus","en-US-Chirp3-HD-Kore","en-US-Chirp3-HD-Laomedeia","en-US-Chirp3-HD-Leda","en-US-Chirp3-HD-Orus","en-US-Chirp3-HD-Puck","en-US-Chirp3-HD-Pulcherrima","en-US-Chirp3-HD-Rasalgethi","en-US-Chirp3-HD-Sadachbia","en-US-Chirp3-HD-Sadaltager","en-US-Chirp3-HD-Schedar","en-US-Chirp3-HD-Sulafat","en-US-Chirp3-HD-Umbriel","en-US-Chirp3-HD-Vindemiatrix","en-US-Chirp3-HD-Zephyr","en-US-Chirp3-HD-Zubenelgenubi","ar-XA-Chirp3-HD-Achernar","ar-XA-Chirp3-HD-Achird","ar-XA-Chirp3-HD-Algenib","ar-XA-Chirp3-HD-Algieba","ar-XA-Chirp3-HD-Alnilam","ar-XA-Chirp3-HD-Aoede","ar-XA-Chirp3-HD-Autonoe","ar-XA-Chirp3-HD-Callirrhoe","ar-XA-Chirp3-HD-Charon","ar-XA-Chirp3-HD-Despina","ar-XA-Chirp3-HD-Enceladus","ar-XA-Chirp3-HD-Erinome","ar-XA-Chirp3-HD-Fenrir","ar-XA-Chirp3-HD-Gacrux","ar-XA-Chirp3-HD-Iapetus","ar-XA-Chirp3-HD-Kore","ar-XA-Chirp3-HD-Laomedeia","ar-XA-Chirp3-HD-Leda","ar-XA-Chirp3-HD-Orus","ar-XA-Chirp3-HD-Puck","ar-XA-Chirp3-HD-Pulcherrima","ar-XA-Chirp3-HD-Rasalgethi","ar-XA-Chirp3-HD-Sadachbia","ar-XA-Chirp3-HD-Sadaltager","ar-XA-Chirp3-HD-Schedar","ar-XA-Chirp3-HD-Sulafat","ar-XA-Chirp3-HD-Umbriel","ar-XA-Chirp3-HD-Vindemiatrix","ar-XA-Chirp3-HD-Zephyr","ar-XA-Chirp3-HD-Zubenelgenubi","bg-BG-Chirp3-HD-Achernar","bg-BG-Chirp3-HD-Achird","bg-BG-Chirp3-HD-Algenib","bg-BG-Chirp3-HD-Algieba","bg-BG-Chirp3-HD-Alnilam","bg-BG-Chirp3-HD-Aoede","bg-BG-Chirp3-HD-Autonoe","bg-BG-Chirp3-HD-Callirrhoe","bg-BG-Chirp3-HD-Charon","bg-BG-Chirp3-HD-Despina","bg-BG-Chirp3-HD-Enceladus","bg-BG-Chirp3-HD-Erinome","bg-BG-Chirp3-HD-Fenrir","bg-BG-Chirp3-HD-Gacrux","bg-BG-Chirp3-HD-Iapetus","bg-BG-Chirp3-HD-Kore","bg-BG-Chirp3-HD-Laomedeia","bg-BG-Chirp3-HD-Leda","bg-BG-Chirp3-HD-Orus","bg-BG-Chirp3-HD-Puck","bg-BG-Chirp3-HD-Pulcherrima","bg-BG-Chirp3-HD-Rasalgethi","bg-BG-Chirp3-HD-Sadachbia","bg-BG-Chirp3-HD-Sadaltager","bg-BG-Chirp3-HD-Schedar","bg-BG-Chirp3-HD-Sulafat","bg-BG-Chirp3-HD-Umbriel","bg-BG-Chirp3-HD-Vindemiatrix","bg-BG-Chirp3-HD-Zephyr","bg-BG-Chirp3-HD-Zubenelgenubi","bn-IN-Chirp3-HD-Achernar","bn-IN-Chirp3-HD-Achird","bn-IN-Chirp3-HD-Algenib","bn-IN-Chirp3-HD-Algieba","bn-IN-Chirp3-HD-Alnilam","bn-IN-Chirp3-HD-Aoede","bn-IN-Chirp3-HD-Autonoe","bn-IN-Chirp3-HD-Callirrhoe","bn-IN-Chirp3-HD-Charon","bn-IN-Chirp3-HD-Despina","bn-IN-Chirp3-HD-Enceladus","bn-IN-Chirp3-HD-Erinome","bn-IN-Chirp3-HD-Fenrir","bn-IN-Chirp3-HD-Gacrux","bn-IN-Chirp3-HD-Iapetus","bn-IN-Chirp3-HD-Kore","bn-IN-Chirp3-HD-Laomedeia","bn-IN-Chirp3-HD-Leda","bn-IN-Chirp3-HD-Orus","bn-IN-Chirp3-HD-Puck","bn-IN-Chirp3-HD-Pulcherrima","bn-IN-Chirp3-HD-Rasalgethi","bn-IN-Chirp3-HD-Sadachbia","bn-IN-Chirp3-HD-Sadaltager","bn-IN-Chirp3-HD-Schedar","bn-IN-Chirp3-HD-Sulafat","bn-IN-Chirp3-HD-Umbriel","bn-IN-Chirp3-HD-Vindemiatrix","bn-IN-Chirp3-HD-Zephyr","bn-IN-Chirp3-HD-Zubenelgenubi","cmn-CN-Chirp3-HD-Achernar","cmn-CN-Chirp3-HD-Achird","cmn-CN-Chirp3-HD-Algenib","cmn-CN-Chirp3-HD-Algieba","cmn-CN-Chirp3-HD-Alnilam","cmn-CN-Chirp3-HD-Aoede","cmn-CN-Chirp3-HD-Autonoe","cmn-CN-Chirp3-HD-Callirrhoe","cmn-CN-Chirp3-HD-Charon","cmn-CN-Chirp3-HD-Despina","cmn-CN-Chirp3-HD-Enceladus","cmn-CN-Chirp3-HD-Erinome","cmn-CN-Chirp3-HD-Fenrir","cmn-CN-Chirp3-HD-Gacrux","cmn-CN-Chirp3-HD-Iapetus","cmn-CN-Chirp3-HD-Kore","cmn-CN-Chirp3-HD-Laomedeia","cmn-CN-Chirp3-HD-Leda","cmn-CN-Chirp3-HD-Orus","cmn-CN-Chirp3-HD-Puck","cmn-CN-Chirp3-HD-Pulcherrima","cmn-CN-Chirp3-HD-Rasalgethi","cmn-CN-Chirp3-HD-Sadachbia","cmn-CN-Chirp3-HD-Sadaltager","cmn-CN-Chirp3-HD-Schedar","cmn-CN-Chirp3-HD-Sulafat","cmn-CN-Chirp3-HD-Umbriel","cmn-CN-Chirp3-HD-Vindemiatrix","cmn-CN-Chirp3-HD-Zephyr","cmn-CN-Chirp3-HD-Zubenelgenubi","cs-CZ-Chirp3-HD-Achernar","cs-CZ-Chirp3-HD-Achird","cs-CZ-Chirp3-HD-Algenib","cs-CZ-Chirp3-HD-Algieba","cs-CZ-Chirp3-HD-Alnilam","cs-CZ-Chirp3-HD-Aoede","cs-CZ-Chirp3-HD-Autonoe","cs-CZ-Chirp3-HD-Callirrhoe","cs-CZ-Chirp3-HD-Charon","cs-CZ-Chirp3-HD-Despina","cs-CZ-Chirp3-HD-Enceladus","cs-CZ-Chirp3-HD-Erinome","cs-CZ-Chirp3-HD-Fenrir","cs-CZ-Chirp3-HD-Gacrux","cs-CZ-Chirp3-HD-Iapetus","cs-CZ-Chirp3-HD-Kore","cs-CZ-Chirp3-HD-Laomedeia","cs-CZ-Chirp3-HD-Leda","cs-CZ-Chirp3-HD-Orus","cs-CZ-Chirp3-HD-Puck","cs-CZ-Chirp3-HD-Pulcherrima","cs-CZ-Chirp3-HD-Rasalgethi","cs-CZ-Chirp3-HD-Sadachbia","cs-CZ-Chirp3-HD-Sadaltager","cs-CZ-Chirp3-HD-Schedar","cs-CZ-Chirp3-HD-Sulafat","cs-CZ-Chirp3-HD-Umbriel","cs-CZ-Chirp3-HD-Vindemiatrix","cs-CZ-Chirp3-HD-Zephyr","cs-CZ-Chirp3-HD-Zubenelgenubi","da-DK-Chirp3-HD-Achernar","da-DK-Chirp3-HD-Achird","da-DK-Chirp3-HD-Algenib","da-DK-Chirp3-HD-Algieba","da-DK-Chirp3-HD-Alnilam","da-DK-Chirp3-HD-Aoede","da-DK-Chirp3-HD-Autonoe","da-DK-Chirp3-HD-Callirrhoe","da-DK-Chirp3-HD-Charon","da-DK-Chirp3-HD-Despina","da-DK-Chirp3-HD-Enceladus","da-DK-Chirp3-HD-Erinome","da-DK-Chirp3-HD-Fenrir","da-DK-Chirp3-HD-Gacrux","da-DK-Chirp3-HD-Iapetus","da-DK-Chirp3-HD-Kore","da-DK-Chirp3-HD-Laomedeia","da-DK-Chirp3-HD-Leda","da-DK-Chirp3-HD-Orus","da-DK-Chirp3-HD-Puck","da-DK-Chirp3-HD-Pulcherrima","da-DK-Chirp3-HD-Rasalgethi","da-DK-Chirp3-HD-Sadachbia","da-DK-Chirp3-HD-Sadaltager","da-DK-Chirp3-HD-Schedar","da-DK-Chirp3-HD-Sulafat","da-DK-Chirp3-HD-Umbriel","da-DK-Chirp3-HD-Vindemiatrix","da-DK-Chirp3-HD-Zephyr","da-DK-Chirp3-HD-Zubenelgenubi","de-DE-Chirp3-HD-Achernar","de-DE-Chirp3-HD-Achird","de-DE-Chirp3-HD-Algenib","de-DE-Chirp3-HD-Algieba","de-DE-Chirp3-HD-Alnilam","de-DE-Chirp3-HD-Aoede","de-DE-Chirp3-HD-Autonoe","de-DE-Chirp3-HD-Callirrhoe","de-DE-Chirp3-HD-Charon","de-DE-Chirp3-HD-Despina","de-DE-Chirp3-HD-Enceladus","de-DE-Chirp3-HD-Erinome","de-DE-Chirp3-HD-Fenrir","de-DE-Chirp3-HD-Gacrux","de-DE-Chirp3-HD-Iapetus","de-DE-Chirp3-HD-Kore","de-DE-Chirp3-HD-Laomedeia","de-DE-Chirp3-HD-Leda","de-DE-Chirp3-HD-Orus","de-DE-Chirp3-HD-Puck","de-DE-Chirp3-HD-Pulcherrima","de-DE-Chirp3-HD-Rasalgethi","de-DE-Chirp3-HD-Sadachbia","de-DE-Chirp3-HD-Sadaltager","de-DE-Chirp3-HD-Schedar","de-DE-Chirp3-HD-Sulafat","de-DE-Chirp3-HD-Umbriel","de-DE-Chirp3-HD-Vindemiatrix","de-DE-Chirp3-HD-Zephyr","de-DE-Chirp3-HD-Zubenelgenubi","el-GR-Chirp3-HD-Achernar","el-GR-Chirp3-HD-Achird","el-GR-Chirp3-HD-Algenib","el-GR-Chirp3-HD-Algieba","el-GR-Chirp3-HD-Alnilam","el-GR-Chirp3-HD-Aoede","el-GR-Chirp3-HD-Autonoe","el-GR-Chirp3-HD-Callirrhoe","el-GR-Chirp3-HD-Charon","el-GR-Chirp3-HD-Despina","el-GR-Chirp3-HD-Enceladus","el-GR-Chirp3-HD-Erinome","el-GR-Chirp3-HD-Fenrir","el-GR-Chirp3-HD-Gacrux","el-GR-Chirp3-HD-Iapetus","el-GR-Chirp3-HD-Kore","el-GR-Chirp3-HD-Laomedeia","el-GR-Chirp3-HD-Leda","el-GR-Chirp3-HD-Orus","el-GR-Chirp3-HD-Puck","el-GR-Chirp3-HD-Pulcherrima","el-GR-Chirp3-HD-Rasalgethi","el-GR-Chirp3-HD-Sadachbia","el-GR-Chirp3-HD-Sadaltager","el-GR-Chirp3-HD-Schedar","el-GR-Chirp3-HD-Sulafat","el-GR-Chirp3-HD-Umbriel","el-GR-Chirp3-HD-Vindemiatrix","el-GR-Chirp3-HD-Zephyr","el-GR-Chirp3-HD-Zubenelgenubi","en-AU-Chirp3-HD-Achernar","en-AU-Chirp3-HD-Achird","en-AU-Chirp3-HD-Algenib","en-AU-Chirp3-HD-Algieba","en-AU-Chirp3-HD-Alnilam","en-AU-Chirp3-HD-Aoede","en-AU-Chirp3-HD-Autonoe","en-AU-Chirp3-HD-Callirrhoe","en-AU-Chirp3-HD-Charon","en-AU-Chirp3-HD-Despina","en-AU-Chirp3-HD-Enceladus","en-AU-Chirp3-HD-Erinome","en-AU-Chirp3-HD-Fenrir","en-AU-Chirp3-HD-Gacrux","en-AU-Chirp3-HD-Iapetus","en-AU-Chirp3-HD-Kore","en-AU-Chirp3-HD-Laomedeia","en-AU-Chirp3-HD-Leda","en-AU-Chirp3-HD-Orus","en-AU-Chirp3-HD-Puck","en-AU-Chirp3-HD-Pulcherrima","en-AU-Chirp3-HD-Rasalgethi","en-AU-Chirp3-HD-Sadachbia","en-AU-Chirp3-HD-Sadaltager","en-AU-Chirp3-HD-Schedar","en-AU-Chirp3-HD-Sulafat","en-AU-Chirp3-HD-Umbriel","en-AU-Chirp3-HD-Vindemiatrix","en-AU-Chirp3-HD-Zephyr","en-AU-Chirp3-HD-Zubenelgenubi","en-GB-Chirp3-HD-Achernar","en-GB-Chirp3-HD-Achird","en-GB-Chirp3-HD-Algenib","en-GB-Chirp3-HD-Algieba","en-GB-Chirp3-HD-Alnilam","en-GB-Chirp3-HD-Aoede","en-GB-Chirp3-HD-Autonoe","en-GB-Chirp3-HD-Callirrhoe","en-GB-Chirp3-HD-Charon","en-GB-Chirp3-HD-Despina","en-GB-Chirp3-HD-Enceladus","en-GB-Chirp3-HD-Erinome","en-GB-Chirp3-HD-Fenrir","en-GB-Chirp3-HD-Gacrux","en-GB-Chirp3-HD-Iapetus","en-GB-Chirp3-HD-Kore","en-GB-Chirp3-HD-Laomedeia","en-GB-Chirp3-HD-Leda","en-GB-Chirp3-HD-Orus","en-GB-Chirp3-HD-Puck","en-GB-Chirp3-HD-Pulcherrima","en-GB-Chirp3-HD-Rasalgethi","en-GB-Chirp3-HD-Sadachbia","en-GB-Chirp3-HD-Sadaltager","en-GB-Chirp3-HD-Schedar","en-GB-Chirp3-HD-Sulafat","en-GB-Chirp3-HD-Umbriel","en-GB-Chirp3-HD-Vindemiatrix","en-GB-Chirp3-HD-Zephyr","en-GB-Chirp3-HD-Zubenelgenubi","en-IN-Chirp3-HD-Achernar","en-IN-Chirp3-HD-Achird","en-IN-Chirp3-HD-Algenib","en-IN-Chirp3-HD-Algieba","en-IN-Chirp3-HD-Alnilam","en-IN-Chirp3-HD-Aoede","en-IN-Chirp3-HD-Autonoe","en-IN-Chirp3-HD-Callirrhoe","en-IN-Chirp3-HD-Charon","en-IN-Chirp3-HD-Despina","en-IN-Chirp3-HD-Enceladus","en-IN-Chirp3-HD-Erinome","en-IN-Chirp3-HD-Fenrir","en-IN-Chirp3-HD-Gacrux","en-IN-Chirp3-HD-Iapetus","en-IN-Chirp3-HD-Kore","en-IN-Chirp3-HD-Laomedeia","en-IN-Chirp3-HD-Leda","en-IN-Chirp3-HD-Orus","en-IN-Chirp3-HD-Puck","en-IN-Chirp3-HD-Pulcherrima","en-IN-Chirp3-HD-Rasalgethi","en-IN-Chirp3-HD-Sadachbia","en-IN-Chirp3-HD-Sadaltager","en-IN-Chirp3-HD-Schedar","en-IN-Chirp3-HD-Sulafat","en-IN-Chirp3-HD-Umbriel","en-IN-Chirp3-HD-Vindemiatrix","en-IN-Chirp3-HD-Zephyr","en-IN-Chirp3-HD-Zubenelgenubi","en-US-Chirp3-HD-Achernar","en-US-Chirp3-HD-Achird","en-US-Chirp3-HD-Algenib","en-US-Chirp3-HD-Algieba","en-US-Chirp3-HD-Alnilam","en-US-Chirp3-HD-Aoede","en-US-Chirp3-HD-Autonoe","en-US-Chirp3-HD-Callirrhoe","en-US-Chirp3-HD-Charon","en-US-Chirp3-HD-Despina","en-US-Chirp3-HD-Enceladus","en-US-Chirp3-HD-Erinome","en-US-Chirp3-HD-Fenrir","en-US-Chirp3-HD-Gacrux","en-US-Chirp3-HD-Iapetus","en-US-Chirp3-HD-Kore","en-US-Chirp3-HD-Laomedeia","en-US-Chirp3-HD-Leda","en-US-Chirp3-HD-Orus","en-US-Chirp3-HD-Puck","en-US-Chirp3-HD-Pulcherrima","en-US-Chirp3-HD-Rasalgethi","en-US-Chirp3-HD-Sadachbia","en-US-Chirp3-HD-Sadaltager","en-US-Chirp3-HD-Schedar","en-US-Chirp3-HD-Sulafat","en-US-Chirp3-HD-Umbriel","en-US-Chirp3-HD-Vindemiatrix","en-US-Chirp3-HD-Zephyr","en-US-Chirp3-HD-Zubenelgenubi","es-ES-Chirp3-HD-Achernar","es-ES-Chirp3-HD-Achird","es-ES-Chirp3-HD-Algenib","es-ES-Chirp3-HD-Algieba","es-ES-Chirp3-HD-Alnilam","es-ES-Chirp3-HD-Aoede","es-ES-Chirp3-HD-Autonoe","es-ES-Chirp3-HD-Callirrhoe","es-ES-Chirp3-HD-Charon","es-ES-Chirp3-HD-Despina","es-ES-Chirp3-HD-Enceladus","es-ES-Chirp3-HD-Erinome","es-ES-Chirp3-HD-Fenrir","es-ES-Chirp3-HD-Gacrux","es-ES-Chirp3-HD-Iapetus","es-ES-Chirp3-HD-Kore","es-ES-Chirp3-HD-Laomedeia","es-ES-Chirp3-HD-Leda","es-ES-Chirp3-HD-Orus","es-ES-Chirp3-HD-Puck","es-ES-Chirp3-HD-Pulcherrima","es-ES-Chirp3-HD-Rasalgethi","es-ES-Chirp3-HD-Sadachbia","es-ES-Chirp3-HD-Sadaltager","es-ES-Chirp3-HD-Schedar","es-ES-Chirp3-HD-Sulafat","es-ES-Chirp3-HD-Umbriel","es-ES-Chirp3-HD-Vindemiatrix","es-ES-Chirp3-HD-Zephyr","es-ES-Chirp3-HD-Zubenelgenubi","es-US-Chirp3-HD-Achernar","es-US-Chirp3-HD-Achird","es-US-Chirp3-HD-Algenib","es-US-Chirp3-HD-Algieba","es-US-Chirp3-HD-Alnilam","es-US-Chirp3-HD-Aoede","es-US-Chirp3-HD-Autonoe","es-US-Chirp3-HD-Callirrhoe","es-US-Chirp3-HD-Charon","es-US-Chirp3-HD-Despina","es-US-Chirp3-HD-Enceladus","es-US-Chirp3-HD-Erinome","es-US-Chirp3-HD-Fenrir","es-US-Chirp3-HD-Gacrux","es-US-Chirp3-HD-Iapetus","es-US-Chirp3-HD-Kore","es-US-Chirp3-HD-Laomedeia","es-US-Chirp3-HD-Leda","es-US-Chirp3-HD-Orus","es-US-Chirp3-HD-Puck","es-US-Chirp3-HD-Pulcherrima","es-US-Chirp3-HD-Rasalgethi","es-US-Chirp3-HD-Sadachbia","es-US-Chirp3-HD-Sadaltager","es-US-Chirp3-HD-Schedar","es-US-Chirp3-HD-Sulafat","es-US-Chirp3-HD-Umbriel","es-US-Chirp3-HD-Vindemiatrix","es-US-Chirp3-HD-Zephyr","es-US-Chirp3-HD-Zubenelgenubi","et-EE-Chirp3-HD-Achernar","et-EE-Chirp3-HD-Achird","et-EE-Chirp3-HD-Algenib","et-EE-Chirp3-HD-Algieba","et-EE-Chirp3-HD-Alnilam","et-EE-Chirp3-HD-Aoede","et-EE-Chirp3-HD-Autonoe","et-EE-Chirp3-HD-Callirrhoe","et-EE-Chirp3-HD-Charon","et-EE-Chirp3-HD-Despina","et-EE-Chirp3-HD-Enceladus","et-EE-Chirp3-HD-Erinome","et-EE-Chirp3-HD-Fenrir","et-EE-Chirp3-HD-Gacrux","et-EE-Chirp3-HD-Iapetus","et-EE-Chirp3-HD-Kore","et-EE-Chirp3-HD-Laomedeia","et-EE-Chirp3-HD-Leda","et-EE-Chirp3-HD-Orus","et-EE-Chirp3-HD-Puck","et-EE-Chirp3-HD-Pulcherrima","et-EE-Chirp3-HD-Rasalgethi","et-EE-Chirp3-HD-Sadachbia","et-EE-Chirp3-HD-Sadaltager","et-EE-Chirp3-HD-Schedar","et-EE-Chirp3-HD-Sulafat","et-EE-Chirp3-HD-Umbriel","et-EE-Chirp3-HD-Vindemiatrix","et-EE-Chirp3-HD-Zephyr","et-EE-Chirp3-HD-Zubenelgenubi","fi-FI-Chirp3-HD-Achernar","fi-FI-Chirp3-HD-Achird","fi-FI-Chirp3-HD-Algenib","fi-FI-Chirp3-HD-Algieba","fi-FI-Chirp3-HD-Alnilam","fi-FI-Chirp3-HD-Aoede","fi-FI-Chirp3-HD-Autonoe","fi-FI-Chirp3-HD-Callirrhoe","fi-FI-Chirp3-HD-Charon","fi-FI-Chirp3-HD-Despina","fi-FI-Chirp3-HD-Enceladus","fi-FI-Chirp3-HD-Erinome","fi-FI-Chirp3-HD-Fenrir","fi-FI-Chirp3-HD-Gacrux","fi-FI-Chirp3-HD-Iapetus","fi-FI-Chirp3-HD-Kore","fi-FI-Chirp3-HD-Laomedeia","fi-FI-Chirp3-HD-Leda","fi-FI-Chirp3-HD-Orus","fi-FI-Chirp3-HD-Puck","fi-FI-Chirp3-HD-Pulcherrima","fi-FI-Chirp3-HD-Rasalgethi","fi-FI-Chirp3-HD-Sadachbia","fi-FI-Chirp3-HD-Sadaltager","fi-FI-Chirp3-HD-Schedar","fi-FI-Chirp3-HD-Sulafat","fi-FI-Chirp3-HD-Umbriel","fi-FI-Chirp3-HD-Vindemiatrix","fi-FI-Chirp3-HD-Zephyr","fi-FI-Chirp3-HD-Zubenelgenubi","fr-CA-Chirp3-HD-Achernar","fr-CA-Chirp3-HD-Achird","fr-CA-Chirp3-HD-Algenib","fr-CA-Chirp3-HD-Algieba","fr-CA-Chirp3-HD-Alnilam","fr-CA-Chirp3-HD-Aoede","fr-CA-Chirp3-HD-Autonoe","fr-CA-Chirp3-HD-Callirrhoe","fr-CA-Chirp3-HD-Charon","fr-CA-Chirp3-HD-Despina","fr-CA-Chirp3-HD-Enceladus","fr-CA-Chirp3-HD-Erinome","fr-CA-Chirp3-HD-Fenrir","fr-CA-Chirp3-HD-Gacrux","fr-CA-Chirp3-HD-Iapetus","fr-CA-Chirp3-HD-Kore","fr-CA-Chirp3-HD-Laomedeia","fr-CA-Chirp3-HD-Leda","fr-CA-Chirp3-HD-Orus","fr-CA-Chirp3-HD-Puck","fr-CA-Chirp3-HD-Pulcherrima","fr-CA-Chirp3-HD-Rasalgethi","fr-CA-Chirp3-HD-Sadachbia","fr-CA-Chirp3-HD-Sadaltager","fr-CA-Chirp3-HD-Schedar","fr-CA-Chirp3-HD-Sulafat","fr-CA-Chirp3-HD-Umbriel","fr-CA-Chirp3-HD-Vindemiatrix","fr-CA-Chirp3-HD-Zephyr","fr-CA-Chirp3-HD-Zubenelgenubi","fr-FR-Chirp3-HD-Achernar","fr-FR-Chirp3-HD-Achird","fr-FR-Chirp3-HD-Algenib","fr-FR-Chirp3-HD-Algieba","fr-FR-Chirp3-HD-Alnilam","fr-FR-Chirp3-HD-Aoede","fr-FR-Chirp3-HD-Autonoe","fr-FR-Chirp3-HD-Callirrhoe","fr-FR-Chirp3-HD-Charon","fr-FR-Chirp3-HD-Despina","fr-FR-Chirp3-HD-Enceladus","fr-FR-Chirp3-HD-Erinome","fr-FR-Chirp3-HD-Fenrir","fr-FR-Chirp3-HD-Gacrux","fr-FR-Chirp3-HD-Iapetus","fr-FR-Chirp3-HD-Kore","fr-FR-Chirp3-HD-Laomedeia","fr-FR-Chirp3-HD-Leda","fr-FR-Chirp3-HD-Orus","fr-FR-Chirp3-HD-Puck","fr-FR-Chirp3-HD-Pulcherrima","fr-FR-Chirp3-HD-Rasalgethi","fr-FR-Chirp3-HD-Sadachbia","fr-FR-Chirp3-HD-Sadaltager","fr-FR-Chirp3-HD-Schedar","fr-FR-Chirp3-HD-Sulafat","fr-FR-Chirp3-HD-Umbriel","fr-FR-Chirp3-HD-Vindemiatrix","fr-FR-Chirp3-HD-Zephyr","fr-FR-Chirp3-HD-Zubenelgenubi","gu-IN-Chirp3-HD-Achernar","gu-IN-Chirp3-HD-Achird","gu-IN-Chirp3-HD-Algenib","gu-IN-Chirp3-HD-Algieba","gu-IN-Chirp3-HD-Alnilam","gu-IN-Chirp3-HD-Aoede","gu-IN-Chirp3-HD-Autonoe","gu-IN-Chirp3-HD-Callirrhoe","gu-IN-Chirp3-HD-Charon","gu-IN-Chirp3-HD-Despina","gu-IN-Chirp3-HD-Enceladus","gu-IN-Chirp3-HD-Erinome","gu-IN-Chirp3-HD-Fenrir","gu-IN-Chirp3-HD-Gacrux","gu-IN-Chirp3-HD-Iapetus","gu-IN-Chirp3-HD-Kore","gu-IN-Chirp3-HD-Laomedeia","gu-IN-Chirp3-HD-Leda","gu-IN-Chirp3-HD-Orus","gu-IN-Chirp3-HD-Puck","gu-IN-Chirp3-HD-Pulcherrima","gu-IN-Chirp3-HD-Rasalgethi","gu-IN-Chirp3-HD-Sadachbia","gu-IN-Chirp3-HD-Sadaltager","gu-IN-Chirp3-HD-Schedar","gu-IN-Chirp3-HD-Sulafat","gu-IN-Chirp3-HD-Umbriel","gu-IN-Chirp3-HD-Vindemiatrix","gu-IN-Chirp3-HD-Zephyr","gu-IN-Chirp3-HD-Zubenelgenubi","he-IL-Chirp3-HD-Achernar","he-IL-Chirp3-HD-Achird","he-IL-Chirp3-HD-Algenib","he-IL-Chirp3-HD-Algieba","he-IL-Chirp3-HD-Alnilam","he-IL-Chirp3-HD-Aoede","he-IL-Chirp3-HD-Autonoe","he-IL-Chirp3-HD-Callirrhoe","he-IL-Chirp3-HD-Charon","he-IL-Chirp3-HD-Despina","he-IL-Chirp3-HD-Enceladus","he-IL-Chirp3-HD-Erinome","he-IL-Chirp3-HD-Fenrir","he-IL-Chirp3-HD-Gacrux","he-IL-Chirp3-HD-Iapetus","he-IL-Chirp3-HD-Kore","he-IL-Chirp3-HD-Laomedeia","he-IL-Chirp3-HD-Leda","he-IL-Chirp3-HD-Orus","he-IL-Chirp3-HD-Puck","he-IL-Chirp3-HD-Pulcherrima","he-IL-Chirp3-HD-Rasalgethi","he-IL-Chirp3-HD-Sadachbia","he-IL-Chirp3-HD-Sadaltager","he-IL-Chirp3-HD-Schedar","he-IL-Chirp3-HD-Sulafat","he-IL-Chirp3-HD-Umbriel","he-IL-Chirp3-HD-Vindemiatrix","he-IL-Chirp3-HD-Zephyr","he-IL-Chirp3-HD-Zubenelgenubi","hi-IN-Chirp3-HD-Achernar","hi-IN-Chirp3-HD-Achird","hi-IN-Chirp3-HD-Algenib","hi-IN-Chirp3-HD-Algieba","hi-IN-Chirp3-HD-Alnilam","hi-IN-Chirp3-HD-Aoede","hi-IN-Chirp3-HD-Autonoe","hi-IN-Chirp3-HD-Callirrhoe","hi-IN-Chirp3-HD-Charon","hi-IN-Chirp3-HD-Despina","hi-IN-Chirp3-HD-Enceladus","hi-IN-Chirp3-HD-Erinome","hi-IN-Chirp3-HD-Fenrir","hi-IN-Chirp3-HD-Gacrux","hi-IN-Chirp3-HD-Iapetus","hi-IN-Chirp3-HD-Kore","hi-IN-Chirp3-HD-Laomedeia","hi-IN-Chirp3-HD-Leda","hi-IN-Chirp3-HD-Orus","hi-IN-Chirp3-HD-Puck","hi-IN-Chirp3-HD-Pulcherrima","hi-IN-Chirp3-HD-Rasalgethi","hi-IN-Chirp3-HD-Sadachbia","hi-IN-Chirp3-HD-Sadaltager","hi-IN-Chirp3-HD-Schedar","hi-IN-Chirp3-HD-Sulafat","hi-IN-Chirp3-HD-Umbriel","hi-IN-Chirp3-HD-Vindemiatrix","hi-IN-Chirp3-HD-Zephyr","hi-IN-Chirp3-HD-Zubenelgenubi","hr-HR-Chirp3-HD-Achernar","hr-HR-Chirp3-HD-Achird","hr-HR-Chirp3-HD-Algenib","hr-HR-Chirp3-HD-Algieba","hr-HR-Chirp3-HD-Alnilam","hr-HR-Chirp3-HD-Aoede","hr-HR-Chirp3-HD-Autonoe","hr-HR-Chirp3-HD-Callirrhoe","hr-HR-Chirp3-HD-Charon","hr-HR-Chirp3-HD-Despina","hr-HR-Chirp3-HD-Enceladus","hr-HR-Chirp3-HD-Erinome","hr-HR-Chirp3-HD-Fenrir","hr-HR-Chirp3-HD-Gacrux","hr-HR-Chirp3-HD-Iapetus","hr-HR-Chirp3-HD-Kore","hr-HR-Chirp3-HD-Laomedeia","hr-HR-Chirp3-HD-Leda","hr-HR-Chirp3-HD-Orus","hr-HR-Chirp3-HD-Puck","hr-HR-Chirp3-HD-Pulcherrima","hr-HR-Chirp3-HD-Rasalgethi","hr-HR-Chirp3-HD-Sadachbia","hr-HR-Chirp3-HD-Sadaltager","hr-HR-Chirp3-HD-Schedar","hr-HR-Chirp3-HD-Sulafat","hr-HR-Chirp3-HD-Umbriel","hr-HR-Chirp3-HD-Vindemiatrix","hr-HR-Chirp3-HD-Zephyr","hr-HR-Chirp3-HD-Zubenelgenubi","hu-HU-Chirp3-HD-Achernar","hu-HU-Chirp3-HD-Achird","hu-HU-Chirp3-HD-Algenib","hu-HU-Chirp3-HD-Algieba","hu-HU-Chirp3-HD-Alnilam","hu-HU-Chirp3-HD-Aoede","hu-HU-Chirp3-HD-Autonoe","hu-HU-Chirp3-HD-Callirrhoe","hu-HU-Chirp3-HD-Charon","hu-HU-Chirp3-HD-Despina","hu-HU-Chirp3-HD-Enceladus","hu-HU-Chirp3-HD-Erinome","hu-HU-Chirp3-HD-Fenrir","hu-HU-Chirp3-HD-Gacrux","hu-HU-Chirp3-HD-Iapetus","hu-HU-Chirp3-HD-Kore","hu-HU-Chirp3-HD-Laomedeia","hu-HU-Chirp3-HD-Leda","hu-HU-Chirp3-HD-Orus","hu-HU-Chirp3-HD-Puck","hu-HU-Chirp3-HD-Pulcherrima","hu-HU-Chirp3-HD-Rasalgethi","hu-HU-Chirp3-HD-Sadachbia","hu-HU-Chirp3-HD-Sadaltager","hu-HU-Chirp3-HD-Schedar","hu-HU-Chirp3-HD-Sulafat","hu-HU-Chirp3-HD-Umbriel","hu-HU-Chirp3-HD-Vindemiatrix","hu-HU-Chirp3-HD-Zephyr","hu-HU-Chirp3-HD-Zubenelgenubi","id-ID-Chirp3-HD-Achernar","id-ID-Chirp3-HD-Achird","id-ID-Chirp3-HD-Algenib","id-ID-Chirp3-HD-Algieba","id-ID-Chirp3-HD-Alnilam","id-ID-Chirp3-HD-Aoede","id-ID-Chirp3-HD-Autonoe","id-ID-Chirp3-HD-Callirrhoe","id-ID-Chirp3-HD-Charon","id-ID-Chirp3-HD-Despina","id-ID-Chirp3-HD-Enceladus","id-ID-Chirp3-HD-Erinome","id-ID-Chirp3-HD-Fenrir","id-ID-Chirp3-HD-Gacrux","id-ID-Chirp3-HD-Iapetus","id-ID-Chirp3-HD-Kore","id-ID-Chirp3-HD-Laomedeia","id-ID-Chirp3-HD-Leda","id-ID-Chirp3-HD-Orus","id-ID-Chirp3-HD-Puck","id-ID-Chirp3-HD-Pulcherrima","id-ID-Chirp3-HD-Rasalgethi","id-ID-Chirp3-HD-Sadachbia","id-ID-Chirp3-HD-Sadaltager","id-ID-Chirp3-HD-Schedar","id-ID-Chirp3-HD-Sulafat","id-ID-Chirp3-HD-Umbriel","id-ID-Chirp3-HD-Vindemiatrix","id-ID-Chirp3-HD-Zephyr","id-ID-Chirp3-HD-Zubenelgenubi","it-IT-Chirp3-HD-Achernar","it-IT-Chirp3-HD-Achird","it-IT-Chirp3-HD-Algenib","it-IT-Chirp3-HD-Algieba","it-IT-Chirp3-HD-Alnilam","it-IT-Chirp3-HD-Aoede","it-IT-Chirp3-HD-Autonoe","it-IT-Chirp3-HD-Callirrhoe","it-IT-Chirp3-HD-Charon","it-IT-Chirp3-HD-Despina","it-IT-Chirp3-HD-Enceladus","it-IT-Chirp3-HD-Erinome","it-IT-Chirp3-HD-Fenrir","it-IT-Chirp3-HD-Gacrux","it-IT-Chirp3-HD-Iapetus","it-IT-Chirp3-HD-Kore","it-IT-Chirp3-HD-Laomedeia","it-IT-Chirp3-HD-Leda","it-IT-Chirp3-HD-Orus","it-IT-Chirp3-HD-Puck","it-IT-Chirp3-HD-Pulcherrima","it-IT-Chirp3-HD-Rasalgethi","it-IT-Chirp3-HD-Sadachbia","it-IT-Chirp3-HD-Sadaltager","it-IT-Chirp3-HD-Schedar","it-IT-Chirp3-HD-Sulafat","it-IT-Chirp3-HD-Umbriel","it-IT-Chirp3-HD-Vindemiatrix","it-IT-Chirp3-HD-Zephyr","it-IT-Chirp3-HD-Zubenelgenubi","ja-JP-Chirp3-HD-Achernar","ja-JP-Chirp3-HD-Achird","ja-JP-Chirp3-HD-Algenib","ja-JP-Chirp3-HD-Algieba","ja-JP-Chirp3-HD-Alnilam","ja-JP-Chirp3-HD-Aoede","ja-JP-Chirp3-HD-Autonoe","ja-JP-Chirp3-HD-Callirrhoe","ja-JP-Chirp3-HD-Charon","ja-JP-Chirp3-HD-Despina","ja-JP-Chirp3-HD-Enceladus","ja-JP-Chirp3-HD-Erinome","ja-JP-Chirp3-HD-Fenrir","ja-JP-Chirp3-HD-Gacrux","ja-JP-Chirp3-HD-Iapetus","ja-JP-Chirp3-HD-Kore","ja-JP-Chirp3-HD-Laomedeia","ja-JP-Chirp3-HD-Leda","ja-JP-Chirp3-HD-Orus","ja-JP-Chirp3-HD-Puck","ja-JP-Chirp3-HD-Pulcherrima","ja-JP-Chirp3-HD-Rasalgethi","ja-JP-Chirp3-HD-Sadachbia","ja-JP-Chirp3-HD-Sadaltager","ja-JP-Chirp3-HD-Schedar","ja-JP-Chirp3-HD-Sulafat","ja-JP-Chirp3-HD-Umbriel","ja-JP-Chirp3-HD-Vindemiatrix","ja-JP-Chirp3-HD-Zephyr","ja-JP-Chirp3-HD-Zubenelgenubi","kn-IN-Chirp3-HD-Achernar","kn-IN-Chirp3-HD-Achird","kn-IN-Chirp3-HD-Algenib","kn-IN-Chirp3-HD-Algieba","kn-IN-Chirp3-HD-Alnilam","kn-IN-Chirp3-HD-Aoede","kn-IN-Chirp3-HD-Autonoe","kn-IN-Chirp3-HD-Callirrhoe","kn-IN-Chirp3-HD-Charon","kn-IN-Chirp3-HD-Despina","kn-IN-Chirp3-HD-Enceladus","kn-IN-Chirp3-HD-Erinome","kn-IN-Chirp3-HD-Fenrir","kn-IN-Chirp3-HD-Gacrux","kn-IN-Chirp3-HD-Iapetus","kn-IN-Chirp3-HD-Kore","kn-IN-Chirp3-HD-Laomedeia","kn-IN-Chirp3-HD-Leda","kn-IN-Chirp3-HD-Orus","kn-IN-Chirp3-HD-Puck","kn-IN-Chirp3-HD-Pulcherrima","kn-IN-Chirp3-HD-Rasalgethi","kn-IN-Chirp3-HD-Sadachbia","kn-IN-Chirp3-HD-Sadaltager","kn-IN-Chirp3-HD-Schedar","kn-IN-Chirp3-HD-Sulafat","kn-IN-Chirp3-HD-Umbriel","kn-IN-Chirp3-HD-Vindemiatrix","kn-IN-Chirp3-HD-Zephyr","kn-IN-Chirp3-HD-Zubenelgenubi","ko-KR-Chirp3-HD-Achernar","ko-KR-Chirp3-HD-Achird","ko-KR-Chirp3-HD-Algenib","ko-KR-Chirp3-HD-Algieba","ko-KR-Chirp3-HD-Alnilam","ko-KR-Chirp3-HD-Aoede","ko-KR-Chirp3-HD-Autonoe","ko-KR-Chirp3-HD-Callirrhoe","ko-KR-Chirp3-HD-Charon","ko-KR-Chirp3-HD-Despina","ko-KR-Chirp3-HD-Enceladus","ko-KR-Chirp3-HD-Erinome","ko-KR-Chirp3-HD-Fenrir","ko-KR-Chirp3-HD-Gacrux","ko-KR-Chirp3-HD-Iapetus","ko-KR-Chirp3-HD-Kore","ko-KR-Chirp3-HD-Laomedeia","ko-KR-Chirp3-HD-Leda","ko-KR-Chirp3-HD-Orus","ko-KR-Chirp3-HD-Puck","ko-KR-Chirp3-HD-Pulcherrima","ko-KR-Chirp3-HD-Rasalgethi","ko-KR-Chirp3-HD-Sadachbia","ko-KR-Chirp3-HD-Sadaltager","ko-KR-Chirp3-HD-Schedar","ko-KR-Chirp3-HD-Sulafat","ko-KR-Chirp3-HD-Umbriel","ko-KR-Chirp3-HD-Vindemiatrix","ko-KR-Chirp3-HD-Zephyr","ko-KR-Chirp3-HD-Zubenelgenubi","lt-LT-Chirp3-HD-Achernar","lt-LT-Chirp3-HD-Achird","lt-LT-Chirp3-HD-Algenib","lt-LT-Chirp3-HD-Algieba","lt-LT-Chirp3-HD-Alnilam","lt-LT-Chirp3-HD-Aoede","lt-LT-Chirp3-HD-Autonoe","lt-LT-Chirp3-HD-Callirrhoe","lt-LT-Chirp3-HD-Charon","lt-LT-Chirp3-HD-Despina","lt-LT-Chirp3-HD-Enceladus","lt-LT-Chirp3-HD-Erinome","lt-LT-Chirp3-HD-Fenrir","lt-LT-Chirp3-HD-Gacrux","lt-LT-Chirp3-HD-Iapetus","lt-LT-Chirp3-HD-Kore","lt-LT-Chirp3-HD-Laomedeia","lt-LT-Chirp3-HD-Leda","lt-LT-Chirp3-HD-Orus","lt-LT-Chirp3-HD-Puck","lt-LT-Chirp3-HD-Pulcherrima","lt-LT-Chirp3-HD-Rasalgethi","lt-LT-Chirp3-HD-Sadachbia","lt-LT-Chirp3-HD-Sadaltager","lt-LT-Chirp3-HD-Schedar","lt-LT-Chirp3-HD-Sulafat","lt-LT-Chirp3-HD-Umbriel","lt-LT-Chirp3-HD-Vindemiatrix","lt-LT-Chirp3-HD-Zephyr","lt-LT-Chirp3-HD-Zubenelgenubi","lv-LV-Chirp3-HD-Achernar","lv-LV-Chirp3-HD-Achird","lv-LV-Chirp3-HD-Algenib","lv-LV-Chirp3-HD-Algieba","lv-LV-Chirp3-HD-Alnilam","lv-LV-Chirp3-HD-Aoede","lv-LV-Chirp3-HD-Autonoe","lv-LV-Chirp3-HD-Callirrhoe","lv-LV-Chirp3-HD-Charon","lv-LV-Chirp3-HD-Despina","lv-LV-Chirp3-HD-Enceladus","lv-LV-Chirp3-HD-Erinome","lv-LV-Chirp3-HD-Fenrir","lv-LV-Chirp3-HD-Gacrux","lv-LV-Chirp3-HD-Iapetus","lv-LV-Chirp3-HD-Kore","lv-LV-Chirp3-HD-Laomedeia","lv-LV-Chirp3-HD-Leda","lv-LV-Chirp3-HD-Orus","lv-LV-Chirp3-HD-Puck","lv-LV-Chirp3-HD-Pulcherrima","lv-LV-Chirp3-HD-Rasalgethi","lv-LV-Chirp3-HD-Sadachbia","lv-LV-Chirp3-HD-Sadaltager","lv-LV-Chirp3-HD-Schedar","lv-LV-Chirp3-HD-Sulafat","lv-LV-Chirp3-HD-Umbriel","lv-LV-Chirp3-HD-Vindemiatrix","lv-LV-Chirp3-HD-Zephyr","lv-LV-Chirp3-HD-Zubenelgenubi","ml-IN-Chirp3-HD-Achernar","ml-IN-Chirp3-HD-Achird","ml-IN-Chirp3-HD-Algenib","ml-IN-Chirp3-HD-Algieba","ml-IN-Chirp3-HD-Alnilam","ml-IN-Chirp3-HD-Aoede","ml-IN-Chirp3-HD-Autonoe","ml-IN-Chirp3-HD-Callirrhoe","ml-IN-Chirp3-HD-Charon","ml-IN-Chirp3-HD-Despina","ml-IN-Chirp3-HD-Enceladus","ml-IN-Chirp3-HD-Erinome","ml-IN-Chirp3-HD-Fenrir","ml-IN-Chirp3-HD-Gacrux","ml-IN-Chirp3-HD-Iapetus","ml-IN-Chirp3-HD-Kore","ml-IN-Chirp3-HD-Laomedeia","ml-IN-Chirp3-HD-Leda","ml-IN-Chirp3-HD-Orus","ml-IN-Chirp3-HD-Puck","ml-IN-Chirp3-HD-Pulcherrima","ml-IN-Chirp3-HD-Rasalgethi","ml-IN-Chirp3-HD-Sadachbia","ml-IN-Chirp3-HD-Sadaltager","ml-IN-Chirp3-HD-Schedar","ml-IN-Chirp3-HD-Sulafat","ml-IN-Chirp3-HD-Umbriel","ml-IN-Chirp3-HD-Vindemiatrix","ml-IN-Chirp3-HD-Zephyr","ml-IN-Chirp3-HD-Zubenelgenubi","mr-IN-Chirp3-HD-Achernar","mr-IN-Chirp3-HD-Achird","mr-IN-Chirp3-HD-Algenib","mr-IN-Chirp3-HD-Algieba","mr-IN-Chirp3-HD-Alnilam","mr-IN-Chirp3-HD-Aoede","mr-IN-Chirp3-HD-Autonoe","mr-IN-Chirp3-HD-Callirrhoe","mr-IN-Chirp3-HD-Charon","mr-IN-Chirp3-HD-Despina","mr-IN-Chirp3-HD-Enceladus","mr-IN-Chirp3-HD-Erinome","mr-IN-Chirp3-HD-Fenrir","mr-IN-Chirp3-HD-Gacrux","mr-IN-Chirp3-HD-Iapetus","mr-IN-Chirp3-HD-Kore","mr-IN-Chirp3-HD-Laomedeia","mr-IN-Chirp3-HD-Leda","mr-IN-Chirp3-HD-Orus","mr-IN-Chirp3-HD-Puck","mr-IN-Chirp3-HD-Pulcherrima","mr-IN-Chirp3-HD-Rasalgethi","mr-IN-Chirp3-HD-Sadachbia","mr-IN-Chirp3-HD-Sadaltager","mr-IN-Chirp3-HD-Schedar","mr-IN-Chirp3-HD-Sulafat","mr-IN-Chirp3-HD-Umbriel","mr-IN-Chirp3-HD-Vindemiatrix","mr-IN-Chirp3-HD-Zephyr","mr-IN-Chirp3-HD-Zubenelgenubi","nb-NO-Chirp3-HD-Achernar","nb-NO-Chirp3-HD-Achird","nb-NO-Chirp3-HD-Algenib","nb-NO-Chirp3-HD-Algieba","nb-NO-Chirp3-HD-Alnilam","nb-NO-Chirp3-HD-Aoede","nb-NO-Chirp3-HD-Autonoe","nb-NO-Chirp3-HD-Callirrhoe","nb-NO-Chirp3-HD-Charon","nb-NO-Chirp3-HD-Despina","nb-NO-Chirp3-HD-Enceladus","nb-NO-Chirp3-HD-Erinome","nb-NO-Chirp3-HD-Fenrir","nb-NO-Chirp3-HD-Gacrux","nb-NO-Chirp3-HD-Iapetus","nb-NO-Chirp3-HD-Kore","nb-NO-Chirp3-HD-Laomedeia","nb-NO-Chirp3-HD-Leda","nb-NO-Chirp3-HD-Orus","nb-NO-Chirp3-HD-Puck","nb-NO-Chirp3-HD-Pulcherrima","nb-NO-Chirp3-HD-Rasalgethi","nb-NO-Chirp3-HD-Sadachbia","nb-NO-Chirp3-HD-Sadaltager","nb-NO-Chirp3-HD-Schedar","nb-NO-Chirp3-HD-Sulafat","nb-NO-Chirp3-HD-Umbriel","nb-NO-Chirp3-HD-Vindemiatrix","nb-NO-Chirp3-HD-Zephyr","nb-NO-Chirp3-HD-Zubenelgenubi","nl-BE-Chirp3-HD-Achernar","nl-BE-Chirp3-HD-Achird","nl-BE-Chirp3-HD-Algenib","nl-BE-Chirp3-HD-Algieba","nl-BE-Chirp3-HD-Alnilam","nl-BE-Chirp3-HD-Aoede","nl-BE-Chirp3-HD-Autonoe","nl-BE-Chirp3-HD-Callirrhoe","nl-BE-Chirp3-HD-Charon","nl-BE-Chirp3-HD-Despina","nl-BE-Chirp3-HD-Enceladus","nl-BE-Chirp3-HD-Erinome","nl-BE-Chirp3-HD-Fenrir","nl-BE-Chirp3-HD-Gacrux","nl-BE-Chirp3-HD-Iapetus","nl-BE-Chirp3-HD-Kore","nl-BE-Chirp3-HD-Laomedeia","nl-BE-Chirp3-HD-Leda","nl-BE-Chirp3-HD-Orus","nl-BE-Chirp3-HD-Puck","nl-BE-Chirp3-HD-Pulcherrima","nl-BE-Chirp3-HD-Rasalgethi","nl-BE-Chirp3-HD-Sadachbia","nl-BE-Chirp3-HD-Sadaltager","nl-BE-Chirp3-HD-Schedar","nl-BE-Chirp3-HD-Sulafat","nl-BE-Chirp3-HD-Umbriel","nl-BE-Chirp3-HD-Vindemiatrix","nl-BE-Chirp3-HD-Zephyr","nl-BE-Chirp3-HD-Zubenelgenubi","nl-NL-Chirp3-HD-Achernar","nl-NL-Chirp3-HD-Achird","nl-NL-Chirp3-HD-Algenib","nl-NL-Chirp3-HD-Algieba","nl-NL-Chirp3-HD-Alnilam","nl-NL-Chirp3-HD-Aoede","nl-NL-Chirp3-HD-Autonoe","nl-NL-Chirp3-HD-Callirrhoe","nl-NL-Chirp3-HD-Charon","nl-NL-Chirp3-HD-Despina","nl-NL-Chirp3-HD-Enceladus","nl-NL-Chirp3-HD-Erinome","nl-NL-Chirp3-HD-Fenrir","nl-NL-Chirp3-HD-Gacrux","nl-NL-Chirp3-HD-Iapetus","nl-NL-Chirp3-HD-Kore","nl-NL-Chirp3-HD-Laomedeia","nl-NL-Chirp3-HD-Leda","nl-NL-Chirp3-HD-Orus","nl-NL-Chirp3-HD-Puck","nl-NL-Chirp3-HD-Pulcherrima","nl-NL-Chirp3-HD-Rasalgethi","nl-NL-Chirp3-HD-Sadachbia","nl-NL-Chirp3-HD-Sadaltager","nl-NL-Chirp3-HD-Schedar","nl-NL-Chirp3-HD-Sulafat","nl-NL-Chirp3-HD-Umbriel","nl-NL-Chirp3-HD-Vindemiatrix","nl-NL-Chirp3-HD-Zephyr","nl-NL-Chirp3-HD-Zubenelgenubi","pa-IN-Chirp3-HD-Achernar","pa-IN-Chirp3-HD-Achird","pa-IN-Chirp3-HD-Algenib","pa-IN-Chirp3-HD-Algieba","pa-IN-Chirp3-HD-Alnilam","pa-IN-Chirp3-HD-Aoede","pa-IN-Chirp3-HD-Autonoe","pa-IN-Chirp3-HD-Callirrhoe","pa-IN-Chirp3-HD-Charon","pa-IN-Chirp3-HD-Despina","pa-IN-Chirp3-HD-Enceladus","pa-IN-Chirp3-HD-Erinome","pa-IN-Chirp3-HD-Fenrir","pa-IN-Chirp3-HD-Gacrux","pa-IN-Chirp3-HD-Iapetus","pa-IN-Chirp3-HD-Kore","pa-IN-Chirp3-HD-Laomedeia","pa-IN-Chirp3-HD-Leda","pa-IN-Chirp3-HD-Orus","pa-IN-Chirp3-HD-Puck","pa-IN-Chirp3-HD-Pulcherrima","pa-IN-Chirp3-HD-Rasalgethi","pa-IN-Chirp3-HD-Sadachbia","pa-IN-Chirp3-HD-Sadaltager","pa-IN-Chirp3-HD-Schedar","pa-IN-Chirp3-HD-Sulafat","pa-IN-Chirp3-HD-Umbriel","pa-IN-Chirp3-HD-Vindemiatrix","pa-IN-Chirp3-HD-Zephyr","pa-IN-Chirp3-HD-Zubenelgenubi","pl-PL-Chirp3-HD-Achernar","pl-PL-Chirp3-HD-Achird","pl-PL-Chirp3-HD-Algenib","pl-PL-Chirp3-HD-Algieba","pl-PL-Chirp3-HD-Alnilam","pl-PL-Chirp3-HD-Aoede","pl-PL-Chirp3-HD-Autonoe","pl-PL-Chirp3-HD-Callirrhoe","pl-PL-Chirp3-HD-Charon","pl-PL-Chirp3-HD-Despina","pl-PL-Chirp3-HD-Enceladus","pl-PL-Chirp3-HD-Erinome","pl-PL-Chirp3-HD-Fenrir","pl-PL-Chirp3-HD-Gacrux","pl-PL-Chirp3-HD-Iapetus","pl-PL-Chirp3-HD-Kore","pl-PL-Chirp3-HD-Laomedeia","pl-PL-Chirp3-HD-Leda","pl-PL-Chirp3-HD-Orus","pl-PL-Chirp3-HD-Puck","pl-PL-Chirp3-HD-Pulcherrima","pl-PL-Chirp3-HD-Rasalgethi","pl-PL-Chirp3-HD-Sadachbia","pl-PL-Chirp3-HD-Sadaltager","pl-PL-Chirp3-HD-Schedar","pl-PL-Chirp3-HD-Sulafat","pl-PL-Chirp3-HD-Umbriel","pl-PL-Chirp3-HD-Vindemiatrix","pl-PL-Chirp3-HD-Zephyr","pl-PL-Chirp3-HD-Zubenelgenubi","pt-BR-Chirp3-HD-Achernar","pt-BR-Chirp3-HD-Achird","pt-BR-Chirp3-HD-Algenib","pt-BR-Chirp3-HD-Algieba","pt-BR-Chirp3-HD-Alnilam","pt-BR-Chirp3-HD-Aoede","pt-BR-Chirp3-HD-Autonoe","pt-BR-Chirp3-HD-Callirrhoe","pt-BR-Chirp3-HD-Charon","pt-BR-Chirp3-HD-Despina","pt-BR-Chirp3-HD-Enceladus","pt-BR-Chirp3-HD-Erinome","pt-BR-Chirp3-HD-Fenrir","pt-BR-Chirp3-HD-Gacrux","pt-BR-Chirp3-HD-Iapetus","pt-BR-Chirp3-HD-Kore","pt-BR-Chirp3-HD-Laomedeia","pt-BR-Chirp3-HD-Leda","pt-BR-Chirp3-HD-Orus","pt-BR-Chirp3-HD-Puck","pt-BR-Chirp3-HD-Pulcherrima","pt-BR-Chirp3-HD-Rasalgethi","pt-BR-Chirp3-HD-Sadachbia","pt-BR-Chirp3-HD-Sadaltager","pt-BR-Chirp3-HD-Schedar","pt-BR-Chirp3-HD-Sulafat","pt-BR-Chirp3-HD-Umbriel","pt-BR-Chirp3-HD-Vindemiatrix","pt-BR-Chirp3-HD-Zephyr","pt-BR-Chirp3-HD-Zubenelgenubi","ro-RO-Chirp3-HD-Achernar","ro-RO-Chirp3-HD-Achird","ro-RO-Chirp3-HD-Algenib","ro-RO-Chirp3-HD-Algieba","ro-RO-Chirp3-HD-Alnilam","ro-RO-Chirp3-HD-Aoede","ro-RO-Chirp3-HD-Autonoe","ro-RO-Chirp3-HD-Callirrhoe","ro-RO-Chirp3-HD-Charon","ro-RO-Chirp3-HD-Despina","ro-RO-Chirp3-HD-Enceladus","ro-RO-Chirp3-HD-Erinome","ro-RO-Chirp3-HD-Fenrir","ro-RO-Chirp3-HD-Gacrux","ro-RO-Chirp3-HD-Iapetus","ro-RO-Chirp3-HD-Kore","ro-RO-Chirp3-HD-Laomedeia","ro-RO-Chirp3-HD-Leda","ro-RO-Chirp3-HD-Orus","ro-RO-Chirp3-HD-Puck","ro-RO-Chirp3-HD-Pulcherrima","ro-RO-Chirp3-HD-Rasalgethi","ro-RO-Chirp3-HD-Sadachbia","ro-RO-Chirp3-HD-Sadaltager","ro-RO-Chirp3-HD-Schedar","ro-RO-Chirp3-HD-Sulafat","ro-RO-Chirp3-HD-Umbriel","ro-RO-Chirp3-HD-Vindemiatrix","ro-RO-Chirp3-HD-Zephyr","ro-RO-Chirp3-HD-Zubenelgenubi","ru-RU-Chirp3-HD-Aoede","ru-RU-Chirp3-HD-Charon","ru-RU-Chirp3-HD-Fenrir","ru-RU-Chirp3-HD-Kore","ru-RU-Chirp3-HD-Leda","ru-RU-Chirp3-HD-Orus","ru-RU-Chirp3-HD-Puck","ru-RU-Chirp3-HD-Zephyr","sk-SK-Chirp3-HD-Achernar","sk-SK-Chirp3-HD-Achird","sk-SK-Chirp3-HD-Algenib","sk-SK-Chirp3-HD-Algieba","sk-SK-Chirp3-HD-Alnilam","sk-SK-Chirp3-HD-Aoede","sk-SK-Chirp3-HD-Autonoe","sk-SK-Chirp3-HD-Callirrhoe","sk-SK-Chirp3-HD-Charon","sk-SK-Chirp3-HD-Despina","sk-SK-Chirp3-HD-Enceladus","sk-SK-Chirp3-HD-Erinome","sk-SK-Chirp3-HD-Fenrir","sk-SK-Chirp3-HD-Gacrux","sk-SK-Chirp3-HD-Iapetus","sk-SK-Chirp3-HD-Kore","sk-SK-Chirp3-HD-Laomedeia","sk-SK-Chirp3-HD-Leda","sk-SK-Chirp3-HD-Orus","sk-SK-Chirp3-HD-Puck","sk-SK-Chirp3-HD-Pulcherrima","sk-SK-Chirp3-HD-Rasalgethi","sk-SK-Chirp3-HD-Sadachbia","sk-SK-Chirp3-HD-Sadaltager","sk-SK-Chirp3-HD-Schedar","sk-SK-Chirp3-HD-Sulafat","sk-SK-Chirp3-HD-Umbriel","sk-SK-Chirp3-HD-Vindemiatrix","sk-SK-Chirp3-HD-Zephyr","sk-SK-Chirp3-HD-Zubenelgenubi","sl-SI-Chirp3-HD-Achernar","sl-SI-Chirp3-HD-Achird","sl-SI-Chirp3-HD-Algenib","sl-SI-Chirp3-HD-Algieba","sl-SI-Chirp3-HD-Alnilam","sl-SI-Chirp3-HD-Aoede","sl-SI-Chirp3-HD-Autonoe","sl-SI-Chirp3-HD-Callirrhoe","sl-SI-Chirp3-HD-Charon","sl-SI-Chirp3-HD-Despina","sl-SI-Chirp3-HD-Enceladus","sl-SI-Chirp3-HD-Erinome","sl-SI-Chirp3-HD-Fenrir","sl-SI-Chirp3-HD-Gacrux","sl-SI-Chirp3-HD-Iapetus","sl-SI-Chirp3-HD-Kore","sl-SI-Chirp3-HD-Laomedeia","sl-SI-Chirp3-HD-Leda","sl-SI-Chirp3-HD-Orus","sl-SI-Chirp3-HD-Puck","sl-SI-Chirp3-HD-Pulcherrima","sl-SI-Chirp3-HD-Rasalgethi","sl-SI-Chirp3-HD-Sadachbia","sl-SI-Chirp3-HD-Sadaltager","sl-SI-Chirp3-HD-Schedar","sl-SI-Chirp3-HD-Sulafat","sl-SI-Chirp3-HD-Umbriel","sl-SI-Chirp3-HD-Vindemiatrix","sl-SI-Chirp3-HD-Zephyr","sl-SI-Chirp3-HD-Zubenelgenubi","sr-RS-Chirp3-HD-Achernar","sr-RS-Chirp3-HD-Achird","sr-RS-Chirp3-HD-Algenib","sr-RS-Chirp3-HD-Algieba","sr-RS-Chirp3-HD-Alnilam","sr-RS-Chirp3-HD-Aoede","sr-RS-Chirp3-HD-Autonoe","sr-RS-Chirp3-HD-Callirrhoe","sr-RS-Chirp3-HD-Charon","sr-RS-Chirp3-HD-Despina","sr-RS-Chirp3-HD-Enceladus","sr-RS-Chirp3-HD-Erinome","sr-RS-Chirp3-HD-Fenrir","sr-RS-Chirp3-HD-Gacrux","sr-RS-Chirp3-HD-Iapetus","sr-RS-Chirp3-HD-Kore","sr-RS-Chirp3-HD-Laomedeia","sr-RS-Chirp3-HD-Leda","sr-RS-Chirp3-HD-Orus","sr-RS-Chirp3-HD-Puck","sr-RS-Chirp3-HD-Pulcherrima","sr-RS-Chirp3-HD-Rasalgethi","sr-RS-Chirp3-HD-Sadachbia","sr-RS-Chirp3-HD-Sadaltager","sr-RS-Chirp3-HD-Schedar","sr-RS-Chirp3-HD-Sulafat","sr-RS-Chirp3-HD-Umbriel","sr-RS-Chirp3-HD-Vindemiatrix","sr-RS-Chirp3-HD-Zephyr","sr-RS-Chirp3-HD-Zubenelgenubi","sv-SE-Chirp3-HD-Achernar","sv-SE-Chirp3-HD-Achird","sv-SE-Chirp3-HD-Algenib","sv-SE-Chirp3-HD-Algieba","sv-SE-Chirp3-HD-Alnilam","sv-SE-Chirp3-HD-Aoede","sv-SE-Chirp3-HD-Autonoe","sv-SE-Chirp3-HD-Callirrhoe","sv-SE-Chirp3-HD-Charon","sv-SE-Chirp3-HD-Despina","sv-SE-Chirp3-HD-Enceladus","sv-SE-Chirp3-HD-Erinome","sv-SE-Chirp3-HD-Fenrir","sv-SE-Chirp3-HD-Gacrux","sv-SE-Chirp3-HD-Iapetus","sv-SE-Chirp3-HD-Kore","sv-SE-Chirp3-HD-Laomedeia","sv-SE-Chirp3-HD-Leda","sv-SE-Chirp3-HD-Orus","sv-SE-Chirp3-HD-Puck","sv-SE-Chirp3-HD-Pulcherrima","sv-SE-Chirp3-HD-Rasalgethi","sv-SE-Chirp3-HD-Sadachbia","sv-SE-Chirp3-HD-Sadaltager","sv-SE-Chirp3-HD-Schedar","sv-SE-Chirp3-HD-Sulafat","sv-SE-Chirp3-HD-Umbriel","sv-SE-Chirp3-HD-Vindemiatrix","sv-SE-Chirp3-HD-Zephyr","sv-SE-Chirp3-HD-Zubenelgenubi","sw-KE-Chirp3-HD-Achernar","sw-KE-Chirp3-HD-Achird","sw-KE-Chirp3-HD-Algenib","sw-KE-Chirp3-HD-Algieba","sw-KE-Chirp3-HD-Alnilam","sw-KE-Chirp3-HD-Aoede","sw-KE-Chirp3-HD-Autonoe","sw-KE-Chirp3-HD-Callirrhoe","sw-KE-Chirp3-HD-Charon","sw-KE-Chirp3-HD-Despina","sw-KE-Chirp3-HD-Enceladus","sw-KE-Chirp3-HD-Erinome","sw-KE-Chirp3-HD-Fenrir","sw-KE-Chirp3-HD-Gacrux","sw-KE-Chirp3-HD-Iapetus","sw-KE-Chirp3-HD-Kore","sw-KE-Chirp3-HD-Laomedeia","sw-KE-Chirp3-HD-Leda","sw-KE-Chirp3-HD-Orus","sw-KE-Chirp3-HD-Puck","sw-KE-Chirp3-HD-Pulcherrima","sw-KE-Chirp3-HD-Rasalgethi","sw-KE-Chirp3-HD-Sadachbia","sw-KE-Chirp3-HD-Sadaltager","sw-KE-Chirp3-HD-Schedar","sw-KE-Chirp3-HD-Sulafat","sw-KE-Chirp3-HD-Umbriel","sw-KE-Chirp3-HD-Vindemiatrix","sw-KE-Chirp3-HD-Zephyr","sw-KE-Chirp3-HD-Zubenelgenubi","ta-IN-Chirp3-HD-Achernar","ta-IN-Chirp3-HD-Achird","ta-IN-Chirp3-HD-Algenib","ta-IN-Chirp3-HD-Algieba","ta-IN-Chirp3-HD-Alnilam","ta-IN-Chirp3-HD-Aoede","ta-IN-Chirp3-HD-Autonoe","ta-IN-Chirp3-HD-Callirrhoe","ta-IN-Chirp3-HD-Charon","ta-IN-Chirp3-HD-Despina","ta-IN-Chirp3-HD-Enceladus","ta-IN-Chirp3-HD-Erinome","ta-IN-Chirp3-HD-Fenrir","ta-IN-Chirp3-HD-Gacrux","ta-IN-Chirp3-HD-Iapetus","ta-IN-Chirp3-HD-Kore","ta-IN-Chirp3-HD-Laomedeia","ta-IN-Chirp3-HD-Leda","ta-IN-Chirp3-HD-Orus","ta-IN-Chirp3-HD-Puck","ta-IN-Chirp3-HD-Pulcherrima","ta-IN-Chirp3-HD-Rasalgethi","ta-IN-Chirp3-HD-Sadachbia","ta-IN-Chirp3-HD-Sadaltager","ta-IN-Chirp3-HD-Schedar","ta-IN-Chirp3-HD-Sulafat","ta-IN-Chirp3-HD-Umbriel","ta-IN-Chirp3-HD-Vindemiatrix","ta-IN-Chirp3-HD-Zephyr","ta-IN-Chirp3-HD-Zubenelgenubi","te-IN-Chirp3-HD-Achernar","te-IN-Chirp3-HD-Achird","te-IN-Chirp3-HD-Algenib","te-IN-Chirp3-HD-Algieba","te-IN-Chirp3-HD-Alnilam","te-IN-Chirp3-HD-Aoede","te-IN-Chirp3-HD-Autonoe","te-IN-Chirp3-HD-Callirrhoe","te-IN-Chirp3-HD-Charon","te-IN-Chirp3-HD-Despina","te-IN-Chirp3-HD-Enceladus","te-IN-Chirp3-HD-Erinome","te-IN-Chirp3-HD-Fenrir","te-IN-Chirp3-HD-Gacrux","te-IN-Chirp3-HD-Iapetus","te-IN-Chirp3-HD-Kore","te-IN-Chirp3-HD-Laomedeia","te-IN-Chirp3-HD-Leda","te-IN-Chirp3-HD-Orus","te-IN-Chirp3-HD-Puck","te-IN-Chirp3-HD-Pulcherrima","te-IN-Chirp3-HD-Rasalgethi","te-IN-Chirp3-HD-Sadachbia","te-IN-Chirp3-HD-Sadaltager","te-IN-Chirp3-HD-Schedar","te-IN-Chirp3-HD-Sulafat","te-IN-Chirp3-HD-Umbriel","te-IN-Chirp3-HD-Vindemiatrix","te-IN-Chirp3-HD-Zephyr","te-IN-Chirp3-HD-Zubenelgenubi","th-TH-Chirp3-HD-Achernar","th-TH-Chirp3-HD-Achird","th-TH-Chirp3-HD-Algenib","th-TH-Chirp3-HD-Algieba","th-TH-Chirp3-HD-Alnilam","th-TH-Chirp3-HD-Aoede","th-TH-Chirp3-HD-Autonoe","th-TH-Chirp3-HD-Callirrhoe","th-TH-Chirp3-HD-Charon","th-TH-Chirp3-HD-Despina","th-TH-Chirp3-HD-Enceladus","th-TH-Chirp3-HD-Erinome","th-TH-Chirp3-HD-Fenrir","th-TH-Chirp3-HD-Gacrux","th-TH-Chirp3-HD-Iapetus","th-TH-Chirp3-HD-Kore","th-TH-Chirp3-HD-Laomedeia","th-TH-Chirp3-HD-Leda","th-TH-Chirp3-HD-Orus","th-TH-Chirp3-HD-Puck","th-TH-Chirp3-HD-Pulcherrima","th-TH-Chirp3-HD-Rasalgethi","th-TH-Chirp3-HD-Sadachbia","th-TH-Chirp3-HD-Sadaltager","th-TH-Chirp3-HD-Schedar","th-TH-Chirp3-HD-Sulafat","th-TH-Chirp3-HD-Umbriel","th-TH-Chirp3-HD-Vindemiatrix","th-TH-Chirp3-HD-Zephyr","th-TH-Chirp3-HD-Zubenelgenubi","tr-TR-Chirp3-HD-Achernar","tr-TR-Chirp3-HD-Achird","tr-TR-Chirp3-HD-Algenib","tr-TR-Chirp3-HD-Algieba","tr-TR-Chirp3-HD-Alnilam","tr-TR-Chirp3-HD-Aoede","tr-TR-Chirp3-HD-Autonoe","tr-TR-Chirp3-HD-Callirrhoe","tr-TR-Chirp3-HD-Charon","tr-TR-Chirp3-HD-Despina","tr-TR-Chirp3-HD-Enceladus","tr-TR-Chirp3-HD-Erinome","tr-TR-Chirp3-HD-Fenrir","tr-TR-Chirp3-HD-Gacrux","tr-TR-Chirp3-HD-Iapetus","tr-TR-Chirp3-HD-Kore","tr-TR-Chirp3-HD-Laomedeia","tr-TR-Chirp3-HD-Leda","tr-TR-Chirp3-HD-Orus","tr-TR-Chirp3-HD-Puck","tr-TR-Chirp3-HD-Pulcherrima","tr-TR-Chirp3-HD-Rasalgethi","tr-TR-Chirp3-HD-Sadachbia","tr-TR-Chirp3-HD-Sadaltager","tr-TR-Chirp3-HD-Schedar","tr-TR-Chirp3-HD-Sulafat","tr-TR-Chirp3-HD-Umbriel","tr-TR-Chirp3-HD-Vindemiatrix","tr-TR-Chirp3-HD-Zephyr","tr-TR-Chirp3-HD-Zubenelgenubi","uk-UA-Chirp3-HD-Achernar","uk-UA-Chirp3-HD-Achird","uk-UA-Chirp3-HD-Algenib","uk-UA-Chirp3-HD-Algieba","uk-UA-Chirp3-HD-Alnilam","uk-UA-Chirp3-HD-Aoede","uk-UA-Chirp3-HD-Autonoe","uk-UA-Chirp3-HD-Callirrhoe","uk-UA-Chirp3-HD-Charon","uk-UA-Chirp3-HD-Despina","uk-UA-Chirp3-HD-Enceladus","uk-UA-Chirp3-HD-Erinome","uk-UA-Chirp3-HD-Fenrir","uk-UA-Chirp3-HD-Gacrux","uk-UA-Chirp3-HD-Iapetus","uk-UA-Chirp3-HD-Kore","uk-UA-Chirp3-HD-Laomedeia","uk-UA-Chirp3-HD-Leda","uk-UA-Chirp3-HD-Orus","uk-UA-Chirp3-HD-Puck","uk-UA-Chirp3-HD-Pulcherrima","uk-UA-Chirp3-HD-Rasalgethi","uk-UA-Chirp3-HD-Sadachbia","uk-UA-Chirp3-HD-Sadaltager","uk-UA-Chirp3-HD-Schedar","uk-UA-Chirp3-HD-Sulafat","uk-UA-Chirp3-HD-Umbriel","uk-UA-Chirp3-HD-Vindemiatrix","uk-UA-Chirp3-HD-Zephyr","uk-UA-Chirp3-HD-Zubenelgenubi","ur-IN-Chirp3-HD-Achernar","ur-IN-Chirp3-HD-Achird","ur-IN-Chirp3-HD-Algenib","ur-IN-Chirp3-HD-Algieba","ur-IN-Chirp3-HD-Alnilam","ur-IN-Chirp3-HD-Aoede","ur-IN-Chirp3-HD-Autonoe","ur-IN-Chirp3-HD-Callirrhoe","ur-IN-Chirp3-HD-Charon","ur-IN-Chirp3-HD-Despina","ur-IN-Chirp3-HD-Enceladus","ur-IN-Chirp3-HD-Erinome","ur-IN-Chirp3-HD-Fenrir","ur-IN-Chirp3-HD-Gacrux","ur-IN-Chirp3-HD-Iapetus","ur-IN-Chirp3-HD-Kore","ur-IN-Chirp3-HD-Laomedeia","ur-IN-Chirp3-HD-Leda","ur-IN-Chirp3-HD-Orus","ur-IN-Chirp3-HD-Puck","ur-IN-Chirp3-HD-Pulcherrima","ur-IN-Chirp3-HD-Rasalgethi","ur-IN-Chirp3-HD-Sadachbia","ur-IN-Chirp3-HD-Sadaltager","ur-IN-Chirp3-HD-Schedar","ur-IN-Chirp3-HD-Sulafat","ur-IN-Chirp3-HD-Umbriel","ur-IN-Chirp3-HD-Vindemiatrix","ur-IN-Chirp3-HD-Zephyr","ur-IN-Chirp3-HD-Zubenelgenubi","vi-VN-Chirp3-HD-Achernar","vi-VN-Chirp3-HD-Achird","vi-VN-Chirp3-HD-Algenib","vi-VN-Chirp3-HD-Algieba","vi-VN-Chirp3-HD-Alnilam","vi-VN-Chirp3-HD-Aoede","vi-VN-Chirp3-HD-Autonoe","vi-VN-Chirp3-HD-Callirrhoe","vi-VN-Chirp3-HD-Charon","vi-VN-Chirp3-HD-Despina","vi-VN-Chirp3-HD-Enceladus","vi-VN-Chirp3-HD-Erinome","vi-VN-Chirp3-HD-Fenrir","vi-VN-Chirp3-HD-Gacrux","vi-VN-Chirp3-HD-Iapetus","vi-VN-Chirp3-HD-Kore","vi-VN-Chirp3-HD-Laomedeia","vi-VN-Chirp3-HD-Leda","vi-VN-Chirp3-HD-Orus","vi-VN-Chirp3-HD-Puck","vi-VN-Chirp3-HD-Pulcherrima","vi-VN-Chirp3-HD-Rasalgethi","vi-VN-Chirp3-HD-Sadachbia","vi-VN-Chirp3-HD-Sadaltager","vi-VN-Chirp3-HD-Schedar","vi-VN-Chirp3-HD-Sulafat","vi-VN-Chirp3-HD-Umbriel","vi-VN-Chirp3-HD-Vindemiatrix","vi-VN-Chirp3-HD-Zephyr","vi-VN-Chirp3-HD-Zubenelgenubi","yue-HK-Chirp3-HD-Achernar","yue-HK-Chirp3-HD-Achird","yue-HK-Chirp3-HD-Algenib","yue-HK-Chirp3-HD-Algieba","yue-HK-Chirp3-HD-Alnilam","yue-HK-Chirp3-HD-Aoede","yue-HK-Chirp3-HD-Autonoe","yue-HK-Chirp3-HD-Callirrhoe","yue-HK-Chirp3-HD-Charon","yue-HK-Chirp3-HD-Despina","yue-HK-Chirp3-HD-Enceladus","yue-HK-Chirp3-HD-Erinome","yue-HK-Chirp3-HD-Fenrir","yue-HK-Chirp3-HD-Gacrux","yue-HK-Chirp3-HD-Iapetus","yue-HK-Chirp3-HD-Kore","yue-HK-Chirp3-HD-Laomedeia","yue-HK-Chirp3-HD-Leda","yue-HK-Chirp3-HD-Orus","yue-HK-Chirp3-HD-Puck","yue-HK-Chirp3-HD-Pulcherrima","yue-HK-Chirp3-HD-Rasalgethi","yue-HK-Chirp3-HD-Sadachbia","yue-HK-Chirp3-HD-Sadaltager","yue-HK-Chirp3-HD-Schedar","yue-HK-Chirp3-HD-Sulafat","yue-HK-Chirp3-HD-Umbriel","yue-HK-Chirp3-HD-Vindemiatrix","yue-HK-Chirp3-HD-Zephyr","yue-HK-Chirp3-HD-Zubenelgenubi"];
        
        if (!languageCode) return [];
        
        const filteredLanguages = voices.filter(voice => {
            return voice.startsWith(languageCode + "-")
        });
        
        const options = [];
        let languages = new Set();
        
        filteredLanguages.forEach(voice => {
            const [language, name] = voice.split("-Chirp3-HD-");
            const value = voice;
            const text = `${name} (${language})`;
            options.push({value, text});
            languages.add(language);
        })
        languages = Array.from(languages).reverse();
        
        if (languages.length > 1) {
            languages.forEach(language => {
                options.unshift({value: `random-${language}`, text: `${language} Random`});
            })
        }
        options.unshift({value: 'random', text: 'Random'});
        
        return options;
    }
    
    function addElementToNavBar(element) {
        const headerContainer = document.querySelector('header[data-site-header="true"] > div') || document.querySelector('#app > div > div > header > div');
        if (!headerContainer) return;
        
        const anchorElement = headerContainer.firstElementChild;
        if (!anchorElement) return;
        
        const existingButtons = headerContainer.querySelectorAll('.nav-button');
        if (existingButtons.length > 0) {
            existingButtons[existingButtons.length - 1].insertAdjacentElement('afterend', element);
        } else {
            anchorElement.insertAdjacentElement('afterend', element);
        }
    }
    
    function debounce(func, wait = 100) {
        let timeout;
        const debounced = (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
        debounced.cancel = () => clearTimeout(timeout);
        return debounced;
    }
    
    async function extractResponseErrorData(res) {
        let errorData = null;
        let errorText = '';
        try {
            if (res?.response && typeof res.response.getReader === 'function') {
                const reader = res.response.getReader();
                const decoder = new TextDecoder('utf-8');
                const readStream = async () => {
                    while (true) {
                        const {done, value} = await reader.read();
                        if (value) errorText += decoder.decode(value, {stream: !done});
                        if (done) break;
                    }
                    return errorText;
                };
                const timeout = new Promise((_, rejectTimeout) => setTimeout(() => rejectTimeout(new Error('Timeout')), 3000));
                await Promise.race([readStream(), timeout]);
            } else if (res?.responseText) {
                errorText = res.responseText;
            }

            if (errorText) {
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = errorText;
                }
            }
        } catch {
        }
        return errorData;
    }
    
    async function createGMNetworkError(url, res, prefix = "Network Error") {
        const errorData = await extractResponseErrorData(res);
        const serverMsg = errorData?.error?.message || (typeof errorData === 'string' ? errorData : null);
        const status = res?.status || 0;
        const statusText = res?.statusText || '';
        const detail = serverMsg || res?.error || statusText || (status ? `HTTP ${status}` : 'Connection failed or request blocked');
        
        const message = status 
            ? `${prefix} (HTTP ${status}: ${detail})`
            : `${prefix}: ${detail}`;
        
        const error = new Error(message);
        error.status = status;
        error.statusText = statusText;
        error.url = url;
        error.errorData = errorData || {
            url,
            status,
            statusText,
            error: res?.error || detail
        };
        return error;
    }
    
    function createGMTimeoutError(url, res) {
        const error = new Error(`Request timed out: ${url}`);
        error.status = res?.status || 408;
        error.statusText = res?.statusText || 'Timeout';
        error.url = url;
        error.errorData = {
            url,
            status: res?.status || 408,
            statusText: res?.statusText || 'Timeout',
            error: 'Request timed out'
        };
        return error;
    }
    
    async function gmFetch(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body,
                onload: (res) => {
                    resolve({
                        ok: res.status >= 200 && res.status < 300,
                        status: res.status,
                        statusText: res.statusText,
                        json: () => Promise.resolve(JSON.parse(res.responseText)),
                        text: () => Promise.resolve(res.responseText)
                    });
                },
                onerror: async (res) => reject(await createGMNetworkError(url, res, "GM_xmlhttpRequest failed")),
                ontimeout: (res) => reject(createGMTimeoutError(url, res))
            });
        });
    }
    
    function gmStream(url, options, onChunkReceived) {
        return new Promise((resolve, reject) => {
            let fullContent = '';
            let isResolved = false;
            let streamStarted = false;
            let isErrorStatus = false;
            let streamInThought = false;
            
            const finish = () => {
                if (isResolved) return;
                if (streamInThought) {
                    streamInThought = false;
                    fullContent += '</thought>';
                }
                isResolved = true;
                resolve(fullContent);
            };
            
            const req = GM_xmlhttpRequest({
                method: options.method || 'POST',
                url: url,
                headers: options.headers || {},
                data: options.body,
                responseType: 'stream',
                
                onreadystatechange: (res) => {
                    if (res.readyState < 2 || streamStarted || isResolved) return;
                    if (res.status === 0) return;
                    
                    streamStarted = true;
                    
                    if (res.status >= 400) {
                        isErrorStatus = true;
                        (async () => {
                            if (!isResolved) {
                                isResolved = true;
                                reject(await createGMNetworkError(url, res, "Request failed"));
                            }
                        })();
                        return;
                    }
                    
                    if (!res.response) {
                        isResolved = true;
                        reject(new Error(`HTTP ${res.status}: Response stream unavailable`));
                        return;
                    }
                    
                    const reader = res.response.getReader();
                    const decoder = new TextDecoder('utf-8');
                    let buffer = '';
                    
                    (async () => {
                        try {
                            while (true) {
                                const {done, value} = await reader.read();
                                
                                if (value) {
                                    const chunk = decoder.decode(value, {stream: true});
                                    buffer += chunk;
                                    
                                    const lines = buffer.split('\n');
                                    buffer = lines.pop();
                                    
                                    let stopParsing = false;
                                    
                                    lines.forEach(line => {
                                        if (stopParsing) return;
                                        
                                        const trimmed = line.trim();
                                        if (!trimmed.startsWith('data: ')) return;
                                        
                                        const data = trimmed.slice(6).trim();
                                        if (data === '[DONE]') {
                                            stopParsing = true;
                                            return;
                                        }
                                        
                                        try {
                                            const json = JSON.parse(data);
                                            onChunkReceived(json);
                                            
                                            const delta = json.choices?.[0]?.delta;
                                            if (delta?.reasoning_content) {
                                                if (!streamInThought) {
                                                    streamInThought = true;
                                                    fullContent += `<thought>${delta.reasoning_content}`;
                                                } else {
                                                    fullContent += delta.reasoning_content;
                                                }
                                            }
                                            if (delta?.content) {
                                                if (streamInThought) {
                                                    streamInThought = false;
                                                    fullContent += `</thought>${delta.content}`;
                                                } else {
                                                    fullContent += delta.content;
                                                }
                                            }
                                            if (json.type === "content_block_delta") {
                                                const thinking = json.delta?.type === "thinking_delta" ? json.delta?.thinking : null;
                                                const text = json.delta?.text;
                                                if (thinking) {
                                                    if (!streamInThought) {
                                                        streamInThought = true;
                                                        fullContent += `<thought>${thinking}`;
                                                    } else {
                                                        fullContent += thinking;
                                                    }
                                                }
                                                if (text) {
                                                    if (streamInThought) {
                                                        streamInThought = false;
                                                        fullContent += `</thought>${text}`;
                                                    } else {
                                                        fullContent += text;
                                                    }
                                                }
                                            }
                                            if (json.type === "content_block_stop" && streamInThought) {
                                                streamInThought = false;
                                                fullContent += '</thought>';
                                            }
                                            if (json.type === "response.reasoning_summary_text.delta" || json.type === "response.reasoning_text.delta") {
                                                if (json.delta) {
                                                    if (!streamInThought) {
                                                        streamInThought = true;
                                                        fullContent += `<thought>${json.delta}`;
                                                    } else {
                                                        fullContent += json.delta;
                                                    }
                                                }
                                            }
                                            if (json.type === "response.output_text.delta" && json.delta) {
                                                if (streamInThought) {
                                                    streamInThought = false;
                                                    fullContent += `</thought>${json.delta}`;
                                                } else {
                                                    fullContent += json.delta;
                                                }
                                            }
                                            if (json.type === "message_stop" || json.type === "response.completed") {
                                                stopParsing = true;
                                            }
                                        } catch (e) {
                                        }
                                    });
                                    
                                    if (stopParsing) {
                                        finish();
                                        break;
                                    }
                                }
                                
                                if (done) {
                                    finish();
                                    break;
                                }
                            }
                        } catch (e) {
                            if (!isResolved) {
                                isResolved = true;
                                const error = new Error(`Stream reading error: ${e.message}`);
                                error.url = url;
                                error.errorData = {
                                    url,
                                    error: e.message
                                };
                                reject(error);
                            }
                        }
                    })();
                },
                onload: () => {
                    if (!isErrorStatus && !isResolved) finish();
                },
                onerror: async (res) => {
                    if (!isResolved) {
                        isResolved = true;
                        reject(await createGMNetworkError(url, res, "Network Error"));
                    }
                },
                ontimeout: (res) => {
                    if (!isResolved) {
                        isResolved = true;
                        reject(createGMTimeoutError(url, res));
                    }
                }
            });
        });
    }
    
    function hasBlockLevelHTML(content) {
        return /<(p|ul|li|hr)[\s>]/i.test(content);
    }
    
    function shouldConvertToHTML(content) {
        const hasBlockMarkdown = /^#{1,6}\s|^\s*[-*]\s+|^---$/m.test(content);
        return !hasBlockLevelHTML(content) && hasBlockMarkdown;
    }
    
    function applyInlineMarkdown(text) {
        const codePlaceholders = [];
        
        return text
            .replace(/\n{3,}/g, '\n\n')
            .replace(/`([^`]+)`/g, (_, code) => {
                codePlaceholders.push(`<code>${code}</code>`);
                return `\x00${codePlaceholders.length - 1}\x00`;
            })
            .replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>')
            .replace(/\*(.+?)\*/gs, '<i>$1</i>')
            .replace(/\x00(\d+)\x00/g, (_, i) => codePlaceholders[Number(i)]);
    }
    
    function convertMarkdownToHTML(text) {
        const codePlaceholders = [];
        
        const protectedText = text
            .trim()
            .replace(/\n{3,}/g, '\n\n')
            .replace(/`([^`]+)`/g, (_, code) => {
                codePlaceholders.push(`<code>${code}</code>`);
                return `\x00${codePlaceholders.length - 1}\x00`;
            });
        
        const parseInline = (t) => t
            .replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>')
            .replace(/\*(.+?)\*/gs, '<i>$1</i>');
        
        const htmlContent = protectedText.split(/\n\n+/).map((block) => {
            if (block.trim() === '---' || block.trim() === '***') return '<hr>';
            
            if (/^#+ /m.test(block)) {
                const content = block
                    .replace(/^#+ (.+)$/gm, '<b><u>$1</u></b>')
                    .replace(/\n/g, '<br>');
                return `<p>${parseInline(content)}</p>`;
            }
            
            if (/^\s*[-*]\s+/m.test(block)) {
                const items = block.split('\n')
                    .map((line) => line.replace(/^\s*[-*]\s+(.+)$/, '<li>$1</li>'))
                    .join('');
                return `<ul>${parseInline(items)}</ul>`;
            }
            
            return block
                .split(/^---$|^\*\*\*$/m)
                .map((subBlock) => {
                    const trimmedSubBlock = subBlock.trim();
                    return trimmedSubBlock ? `<p>${parseInline(trimmedSubBlock).replace(/\n/g, '<br>')}</p>` : '';
                })
                .join('<hr>');
        }).join('');
        
        return htmlContent.replace(/\x00(\d+)\x00/g, (_, i) => codePlaceholders[Number(i)]);
    }
    
    function getDbClient() {
        return settings.useCentralDb ? centralClient : supabaseClient;
    }
    
    function getTableName() {
        return settings.useCentralDb ? "word_data_central" : "word_data";
    }
    
    function getLLMUsageTableName() {
        return settings.useCentralDb ? "llm_usage_logs_central" : "llm_usage_logs";
    }
    
    function isDbReady() {
        return settings.useCentralDb ? centralUserId : supabaseClient;
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function formatFlashcardContext(context, originalWord, paddingWords = 20, paddingLength = 150) {
        if (!context) return "";
        
        const openTag = "<selected>";
        const closeTag = "</selected>";
        
        let rawBefore = "";
        let targetWord = "";
        let rawAfter = "";
        let isFound = false;
        
        const startTagIdx = context.indexOf(openTag);
        const endTagIdx = context.indexOf(closeTag);
        
        if (startTagIdx !== -1 && endTagIdx !== -1) {
            rawBefore = context.substring(0, startTagIdx);
            targetWord = context.substring(startTagIdx + openTag.length, endTagIdx);
            rawAfter = context.substring(endTagIdx + closeTag.length);
            isFound = true;
        } else if (originalWord) {
            const escapedWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const match = context.match(new RegExp(escapedWord, 'i'));
            if (match) {
                rawBefore = context.substring(0, match.index);
                targetWord = match[0];
                rawAfter = context.substring(match.index + match[0].length);
                isFound = true;
            }
        }
        
        if (!isFound) return context;
        
        const beforeWords = rawBefore.trimEnd() ? rawBefore.trimEnd().split(/\s+/) : [];
        const afterWords = rawAfter.trimStart() ? rawAfter.trimStart().split(/\s+/) : [];
        
        const hasMoreBefore = beforeWords.length > paddingWords;
        const hasMoreAfter = afterWords.length > paddingWords;
        
        let leftSlice = beforeWords.slice(-paddingWords).join(" ");
        let rightSlice = afterWords.slice(0, paddingWords).join(" ");
        
        let isLengthCappedLeft = false;
        let isLengthCappedRight = false;
        
        if (leftSlice.length > paddingLength) {
            leftSlice = leftSlice.slice(-paddingLength).trimStart();
            isLengthCappedLeft = true;
        }
        if (rightSlice.length > paddingLength) {
            rightSlice = rightSlice.slice(0, paddingLength).trimEnd();
            isLengthCappedRight = true;
        }
        
        const prefix = (hasMoreBefore || isLengthCappedLeft) ? "..." : "";
        const suffix = (hasMoreAfter || isLengthCappedRight) ? "..." : "";
        
        const formattedLeft = leftSlice ? `${leftSlice} ` : "";
        const formattedRight = rightSlice ? ` ${rightSlice}` : "";
        
        return `${prefix}${formattedLeft}<b>${targetWord}</b>${formattedRight}${suffix}`.trim();
    }
    
    function invokeAnkiConnect(action, params = {}, version = 6, timeout = 15000) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://127.0.0.1:8765",
                data: JSON.stringify({action, version, params}),
                headers: {
                    "Content-Type": "application/json"
                },
                timeout,
                onload: (response) => {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            reject(new Error(data.error));
                        } else {
                            resolve(data.result);
                        }
                    } catch (e) {
                        reject(new Error("Failed to parse Anki-Connect response"));
                    }
                },
                onerror: () => reject(new Error("Anki-Connect connection failed. Please ensure Anki desktop is running with Anki-Connect installed.")),
                ontimeout: () => reject(new Error("Anki-Connect request timed out."))
            });
        });
    }
    
    async function fetchAnkiDecks() {
        return await invokeAnkiConnect("deckNames", {}, 6, 1000);
    }
    
    async function fetchFlashcardsInBatches(language, columns, sortBy) {
        let allData = [];
        let from = 0;
        const batchSize = 10000;
        let hasMore = true;
        
        while (hasMore) {
            let query = getDbClient()
                .from(getTableName())
                .select(columns)
                .eq("language", language);
            
            if (settings.useCentralDb && centralUserId) {
                query = query.eq("user_id", centralUserId);
            }
            
            query = query.order(sortBy, {ascending: true});
            if (sortBy !== "idx") {
                query = query.order("idx", {ascending: true});
            }
            
            const {data, error} = await query.range(from, from + batchSize - 1);
            
            if (error) {
                console.error("Batch fetch error:", error);
                return allData;
            }
            
            if (!data || data.length === 0) {
                hasMore = false;
            } else {
                allData = allData.concat(data);
                from += data.length;
                if (data.length < 1000) {
                    hasMore = false;
                }
            }
        }
        
        return allData;
    }
    
    async function getProcessedFlashcards(language) {
        const allData = await fetchFlashcardsInBatches(language, "*", "idx");
        if (!allData || !allData.length) return [];
        
        return allData.map(row => ({
            idx: row.idx,
            user_id: row.user_id,
            language: row.language,
            original_word: row.original_word,
            context: row.context,
            word: row.word,
            pronunciation: row.pronunciation,
            meaning: row.meaning,
            explanation: row.explanation,
            example_sentence: row.example_sentence,
            example_translation: row.example_translation,
            created_at: row.created_at,
            formatted_context: formatFlashcardContext(row.context, row.original_word)
        }));
    }
    
    async function syncFlashcardsToAnki(language, options = {}) {
        const { allowDelete = false, confirmDelete = null } = options;
        const deckName = settings.ankiDeck[language];
        if (!deckName) {
            throw new Error(`No Anki deck selected for language "${language}". Please select one in Flashcard Manager.`);
        }
        
        const processedData = await getProcessedFlashcards(language);
        if (!processedData || processedData.length === 0) {
            return {added: 0, updated: 0, unchanged: 0, total: 0};
        }
        
        const escapedDeck = deckName.replace(/["\\]/g, '\\$&');
        const noteIds = await invokeAnkiConnect("findNotes", {query: `deck:"${escapedDeck}"`});
        
        let existingNotesInfo = [];
        if (noteIds && noteIds.length > 0) {
            for (let i = 0; i < noteIds.length; i += 1000) {
                const chunk = noteIds.slice(i, i + 1000);
                const infoChunk = await invokeAnkiConnect("notesInfo", {notes: chunk});
                if (Array.isArray(infoChunk)) {
                    existingNotesInfo = existingNotesInfo.concat(infoChunk);
                }
            }
        }
        
        const modelCounts = existingNotesInfo.reduce((acc, note) => {
            const model = note.modelName;
            if (note.fields?.idx && model) {
                acc[model] = (acc[model] ?? 0) + 1;
            }
            return acc;
        }, {});
        
        const dominantModel = Object.keys(modelCounts).reduce((bestModel, currentModel) => {
            return modelCounts[currentModel] > (modelCounts[bestModel] ?? 0) ? currentModel : bestModel;
        }, null);
        
        const targetModelName = dominantModel ?? "LingQ Flashcard";
        
        const existingMap = new Map();
        existingNotesInfo.forEach((note) => {
            const idxVal = note.fields?.idx?.value?.trim();
            if (idxVal) {
                existingMap.set(String(idxVal).normalize("NFC"), note);
            }
        });
        
        const syncFieldNames = [
            "user_id", "language", "original_word", "context", "word",
            "pronunciation", "meaning", "explanation", "example_sentence",
            "example_translation", "created_at", "formatted_context"
        ];
        
        const notesToAdd = [];
        const notesToUpdate = [];
        const updateLogs = [];
        let unchangedCount = 0;
        
        processedData.forEach((item) => {
            const targetFields = {
                idx: String(item.idx ?? "").normalize("NFC"),
                user_id: String(item.user_id ?? "").normalize("NFC"),
                language: String(item.language ?? "").normalize("NFC"),
                original_word: String(item.original_word ?? "").normalize("NFC"),
                context: String(item.context ?? "").normalize("NFC"),
                word: String(item.word ?? "").normalize("NFC"),
                pronunciation: String(item.pronunciation ?? "").normalize("NFC"),
                meaning: String(item.meaning ?? "").normalize("NFC"),
                explanation: String(item.explanation ?? "").normalize("NFC"),
                example_sentence: String(item.example_sentence ?? "").normalize("NFC"),
                example_translation: String(item.example_translation ?? "").normalize("NFC"),
                created_at: String(item.created_at ?? "").normalize("NFC"),
                formatted_context: String(item.formatted_context ?? "").normalize("NFC")
            };
            
            const itemIdx = String(item.idx ?? "").trim().normalize("NFC");
            const existingNote = existingMap.get(itemIdx);
            
            if (!existingNote) {
                notesToAdd.push({
                    deckName,
                    modelName: targetModelName,
                    fields: targetFields,
                    options: {allowDuplicate: false},
                    tags: []
                });
            } else {
                let hasChanges = false;
                const updatedFields = {};
                const diffLog = {};
                
                syncFieldNames.forEach((fieldName) => {
                    if (existingNote.fields && existingNote.fields[fieldName] !== undefined) {
                        const existingVal = (existingNote.fields[fieldName].value || "").normalize("NFC");
                        const newVal = targetFields[fieldName] || "";
                        if (existingVal !== newVal) {
                            hasChanges = true;
                            updatedFields[fieldName] = newVal;
                            diffLog[fieldName] = `${existingVal} ➔ ${newVal}`;
                        }
                    }
                });
                
                if (hasChanges) {
                    notesToUpdate.push({
                        id: existingNote.noteId,
                        fields: updatedFields
                    });
                    updateLogs.push({
                        idx: itemIdx,
                        word: item.word,
                        updatedFields: Object.keys(updatedFields).join(", "),
                        changes: diffLog
                    });
                } else {
                    unchangedCount++;
                }
            }
        });
        
        const dbIdxSet = new Set(processedData.map(item => String(item.idx ?? "").trim().normalize("NFC")).filter(Boolean));
        let notesToDelete = [];
        if (allowDelete) {
            notesToDelete = existingNotesInfo.filter((note) => {
                if (note.modelName && note.modelName !== targetModelName && note.modelName !== "LingQ Flashcard") return false;
                
                // Guard: Skip notes that belong to another language
                const noteLang = note.fields?.language?.value?.trim();
                if (noteLang && noteLang !== language) return false;
                
                const ankiIdx = String(note.fields?.idx?.value ?? "").trim().normalize("NFC");
                return !ankiIdx || !dbIdxSet.has(ankiIdx);
            });
            
            if (notesToDelete.length > 0 && typeof confirmDelete === "function") {
                const isConfirmed = confirmDelete(notesToDelete.length, deckName);
                if (!isConfirmed) {
                    console.log(`[Anki Sync] Deletion of ${notesToDelete.length} cards was skipped.`);
                    notesToDelete = [];
                }
            }
        }
        
        let addedCount = 0;
        const chunkSize = 1000;
        for (let i = 0; i < notesToAdd.length; i += chunkSize) {
            const chunk = notesToAdd.slice(i, i + chunkSize);
            const res = await invokeAnkiConnect("addNotes", {notes: chunk});
            if (Array.isArray(res)) {
                addedCount += res.filter(id => id !== null).length;
            }
        }
        
        let updatedCount = 0;
        for (let i = 0; i < notesToUpdate.length; i += chunkSize) {
            const chunk = notesToUpdate.slice(i, i + chunkSize);
            const actions = chunk.map((n) => ({
                action: "updateNoteFields",
                params: {note: n}
            }));
            await invokeAnkiConnect("multi", {actions});
            updatedCount += chunk.length;
        }
        
        let deletedCount = 0;
        if (notesToDelete.length > 0) {
            const noteIdsToDelete = notesToDelete.map(n => n.noteId);
            for (let i = 0; i < noteIdsToDelete.length; i += chunkSize) {
                const chunk = noteIdsToDelete.slice(i, i + chunkSize);
                await invokeAnkiConnect("deleteNotes", {notes: chunk});
                deletedCount += chunk.length;
            }
        }
        
        const todayStr = new Date().toISOString().slice(0, 10);
        storage.set("ankiLastSyncDate_" + language, todayStr);
        
        console.group(`[Anki Sync] ${language} (${deckName}) [Model: ${targetModelName}] - Total: ${processedData.length}`);
        console.log(`Summary: +${addedCount} added, ~${updatedCount} updated, -${deletedCount} deleted, =${unchangedCount} unchanged`);
        
        if (addedCount > 0) {
            console.groupCollapsed(`Added Cards (${addedCount})`);
            console.table(notesToAdd.map(n => ({
                idx: n.fields.idx,
                word: n.fields.word,
                meaning: n.fields.meaning,
                created_at: n.fields.created_at
            })));
            console.groupEnd();
        }
        
        if (updatedCount > 0) {
            console.groupCollapsed(`Updated Cards (${updatedCount})`);
            console.table(updateLogs.map(u => ({
                idx: u.idx,
                word: u.word,
                updatedFields: u.updatedFields
            })));
            console.log("Detailed Changes:", updateLogs);
            console.groupEnd();
        }
        
        if (deletedCount > 0) {
            console.groupCollapsed(`Deleted Cards (${deletedCount})`);
            console.table(notesToDelete.map(n => ({
                noteId: n.noteId,
                idx: n.fields?.idx?.value || "",
                word: n.fields?.word?.value || n.fields?.original_word?.value || "",
                meaning: n.fields?.meaning?.value || ""
            })));
            console.groupEnd();
        }
        
        console.groupEnd();
        
        return {
            added: addedCount,
            updated: updatedCount,
            deleted: deletedCount,
            unchanged: unchangedCount,
            total: processedData.length
        };
    }
    
    function renderAnkiOfflineStatus(statusEl, hasSavedDeck = false) {
        if (!statusEl) return;
        statusEl.innerHTML = "";
        
        const guideUrl = "https://github.com/2p990i9hpral/LingQ_Add-On/blob/main/GUIDE.md#12-anki-integration-guide";
        const link = createElement("a", {
            href: guideUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            title: "Anki is not connected. Click to open Anki-Connect setup guide (Add-on code: 2055492159).",
            style: "color: var(--blue-500, #3b82f6); text-decoration: underline; cursor: pointer;"
        }, "[Guide ↗]");
        
        if (hasSavedDeck) {
            statusEl.appendChild(createElement("span", {style: "color: var(--text-muted, #888);"}, "Offline "));
        }
        statusEl.appendChild(link);
    }
    
    async function checkAndTriggerDailyAnkiSync(language) {
        const deckName = settings.ankiDeck[language];
        if (!deckName) return;
        
        const today = new Date().toISOString().slice(0, 10);
        const lastSync = storage.get("ankiLastSyncDate_" + language, "");
        if (lastSync === today) return;
        
        const statusEl = document.getElementById("flashcardAnkiStatus");
        if (statusEl) {
            statusEl.textContent = "Syncing...";
            statusEl.title = "Anki auto-syncing in progress";
            statusEl.style.color = "var(--blue-500, #3b82f6)";
        }
        
        try {
            const result = await syncFlashcardsToAnki(language, { allowDelete: false });
            if (statusEl) {
                const changes = [];
                if (result.added > 0) changes.push(`+${result.added}`);
                if (result.updated > 0) changes.push(`~${result.updated}`);
                if (result.deleted > 0) changes.push(`-${result.deleted}`);
                const summary = `+${result.added}, ~${result.updated}, -${result.deleted}, =${result.unchanged}`;
                statusEl.textContent = changes.length > 0 ? `✓ ${changes.join(", ")}` : "✓ Up to date";
                statusEl.title = `Sync complete (${summary})`;
                statusEl.style.color = "var(--green-500, #22c55e)";
            }
        } catch (err) {
            console.warn("Anki auto-sync skipped/failed:", err.message);
            renderAnkiOfflineStatus(statusEl, true);
        }
    }
    
    /* Modules */
    
    function stopPlayingAudio(autioContext) {
        if (!autioContext || audioContext.state !== 'running') return;
        
        try {
            autioContext.close();
            autioContext = null;
        } catch (error) {
            console.error("Stop Audio:", error);
            throw error;
        }
    }
    
    let audioContext = null;
    
    async function playAudio(audioData, volume = 0.5) {
        stopPlayingAudio(audioContext);
        
        return new Promise((resolve, reject) => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = volume;
            gainNode.connect(audioContext.destination);
            
            const audioDataCopy = audioData.slice(0);
            audioContext.decodeAudioData(audioDataCopy)
                .then(buffer => {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(gainNode);
                    source.start(0);
                    
                    source.onended = () => {
                        resolve();
                        audioContext.close();
                    };
                    source.onerror = (e) => {
                        reject("Audio play error : " + e);
                    }
                })
                .catch(e => {
                    reject("Decoding error : " + e)
                });
        });
    }
    
    async function openAITTS(text, API_KEY, voice = "nova", instructions) {
        const modelId = "gpt-4o-mini-tts";
        const apiUrl = "https://api.openai.com/v1/audio/speech";
        
        if (!API_KEY) throw new Error("Invalid or missing OpenAI API key. Please set the API_KEY");
        console.log('[TTS]', `${modelId}, ${voice}`, `"${text}"`);
        
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    input: text,
                    model: modelId,
                    voice: voice,
                    instructions: instructions,
                })
            });
            
            if (!response.ok) {
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorBody = await response.json();
                    errorMessage += ` - OpenAI Error: ${errorBody?.error?.message || JSON.stringify(errorBody)}`;
                } catch (parseError) {
                    errorMessage += ` - Failed to parse error response.`;
                }
                throw new Error(errorMessage);
            }
            
            return await response.arrayBuffer();
            
        } catch (error) {
            console.error("Error during OpenAI TTS request:", error);
            throw error;
        }
    }
    
    async function geminiTTS(text, API_KEY, voice = "Zephyr", ttsInstructions, modelId = "gemini-3.8-flash-lite-tts") {
        function createWavHeader(dataLength) {
            const sampleRate = 24000;
            const numChannels = 1;
            const bitsPerSample = 16;
            
            const headerLength = 44;
            const view = new DataView(new ArrayBuffer(headerLength));
            
            function writeString(view, offset, s) {
                for (let i = 0; i < s.length; i++) {
                    view.setUint8(offset + i, s.charCodeAt(i));
                }
            }
            
            // RIFF chunk
            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + dataLength, true); // ChunkSize
            writeString(view, 8, 'WAVE');
            
            // fmt sub-chunk
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);             // Subchunk1Size
            view.setUint16(20, 1, true);              // AudioFormat (1 = PCM)
            view.setUint16(22, numChannels, true);    // NumChannels
            view.setUint32(24, sampleRate, true);     // SampleRate
            view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
            view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
            view.setUint16(34, bitsPerSample, true); // BitsPerSample
            
            // data sub-chunk
            writeString(view, 36, 'data'); // Subchunk2ID
            view.setUint32(40, dataLength, true); // Subchunk2Size
            
            return view.buffer;
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;
        
        if (!API_KEY) throw new Error("Invalid or missing Google API key. Please set the API_KEY");
        console.log('[TTS]', `${modelId}, ${voice}`, `"${text}"`);
        
        const cleanStyle = ttsInstructions ? ttsInstructions.replace(/:\s*$/, '').trim() : '';
        const parts = modelId.includes("3.8")
            ? [{text: text, ...(cleanStyle ? { speech_metadata: { style: cleanStyle } } : {})}]
            : [{text: cleanStyle ? `${cleanStyle}: ${text}` : text}];

        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: parts
                        }],
                        generationConfig: {
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {voiceName: voice}
                                }
                            },
                            responseModalities: ["AUDIO"]
                        }
                    })
                });
                
                if (!response.ok) {
                    let errorMessage = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorBody = await response.json();
                        errorMessage += ` - Google Error: ${errorBody?.error?.message || JSON.stringify(errorBody)}`;
                    } catch (parseError) {
                        errorMessage += ` - Failed to parse error response.`;
                    }
                    throw new Error(errorMessage);
                }
                
                const data = await response.json();
                const audioDataBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                
                if (audioDataBase64) {
                    const inputTokens = data.usageMetadata?.promptTokenCount || 0;
                    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
                    
                    trackLLMUsage("TTS", modelId, 0, inputTokens, 0, outputTokens, null, false, "google gemini");
                    
                    const binaryString = atob(audioDataBase64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    const isWav = bytes.length >= 12 &&
                        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                        bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45;
                    
                    if (isWav) {
                        return bytes.buffer;
                    }
                    
                    const wavHeader = createWavHeader(bytes.length);
                    
                    const completeBuffer = new Uint8Array(wavHeader.byteLength + bytes.byteLength);
                    completeBuffer.set(new Uint8Array(wavHeader), 0);
                    completeBuffer.set(bytes, wavHeader.byteLength);
                    
                    return completeBuffer.buffer;
                } else {
                    console.warn(`Google TTS Warning (Attempt ${attempt + 1}/${maxRetries})`, data.candidates?.[0]);
                }
            } catch (error) {
                console.error("Error during Google TTS request:", error);
                throw error;
            }
        }
    }
    
    async function googleCloudTTS(text, API_KEY, voice) {
        function base64ToArrayBuffer(base64String) {
            const binaryString = atob(base64String);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            return bytes.buffer;
        }
        
        const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
        
        if (!API_KEY) throw new Error("Invalid or missing Google API key. Please set the API_KEY");
        console.log('[TTS]', `${voice}`, `"${text}"`);
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: {text: text},
                    voice: {
                        languageCode: voice.split("-Chirp3-HD-")[0],
                        name: voice
                    },
                    audioConfig: {audioEncoding: "MP3"}
                })
            });
            
            if (!response.ok) {
                let errorMessage = `HTTP error! Status: ${response.status}`;
                
                const permissionErrorMessage = `
                    You need to enable the Text-to-Speech API in the Google Cloud Console.
                    1. Enable the Cloud Text-to-Speech API from the url: https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview
                    2. Visit https://console.cloud.google.com/apis/credentials Select an API key displayed > Select the Cloud Text-to-Speech API from the API restrictions section > ok > save.
                `;
                if (response.status === 403) console.error(removeIndent(permissionErrorMessage));
                
                try {
                    const errorBody = await response.json();
                    errorMessage += ` - Google Error: ${errorBody?.error?.message || JSON.stringify(errorBody)}`;
                } catch (parseError) {
                    errorMessage += ` - Failed to parse error response.`;
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            const audioDataBase64 = data.audioContent;
            return base64ToArrayBuffer(audioDataBase64);
        } catch (error) {
            console.error("Error during Google Cloud TTS request:", error);
            throw error;
        }
    }
    
    async function elevenLabsTTS(text, API_KEY, voice = "JBFqnCBsd6RMkjVDRZzb", modelId = "eleven_v4_turbo") {
        const validModels = (ttsModelsByProvider["elevenlabs"] || []).map(m => m.value);
        const resolvedModelId = validModels.includes(modelId) ? modelId : "eleven_v4_turbo";
        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`;
        
        if (!API_KEY) throw new Error("Invalid or missing ElevenLabs API key. Please set the API_KEY");
        console.log('[TTS]', `${resolvedModelId}, ${voice}`, `"${text}"`);
        
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": API_KEY
                },
                body: JSON.stringify({
                    text: text,
                    model_id: resolvedModelId
                })
            });
            
            if (!response.ok) {
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorBody = await response.json();
                    errorMessage += ` - ElevenLabs Error: ${errorBody?.detail?.message || JSON.stringify(errorBody)}`;
                } catch (parseError) {
                    errorMessage += ` - Failed to parse error response.`;
                }
                throw new Error(errorMessage);
            }
            
            return await response.arrayBuffer();
        } catch (error) {
            console.error("Error during ElevenLabs TTS request:", error);
            throw error;
        }
    }
    
    async function getTTSResponse(provider, apiKey, voice, text, ttsInstructions = "Speak in a natural, authentic native speaker tone with steady pacing, clear articulation, and an engaging narrative flow: ", model = settings.ttsModel) {
        const availableOptions = getAvailableVoicesForProvider(provider);
        const validValues = availableOptions.map(option => option.value);
        const nonRandomVoices = validValues.filter(val => !val.startsWith("random"));
        
        let resolvedVoice = voice;
        if (!resolvedVoice || !validValues.includes(resolvedVoice)) {
            resolvedVoice = "random";
        }
        
        if (resolvedVoice === "random") {
            resolvedVoice = getRandomElement(nonRandomVoices);
        } else if (provider === "google cloud" && resolvedVoice.startsWith("random-")) {
            const randomLanguage = resolvedVoice.replace("random-", "");
            const filtered = nonRandomVoices.filter(option => option.startsWith(randomLanguage));
            resolvedVoice = getRandomElement(filtered.length > 0 ? filtered : nonRandomVoices);
        }
        
        switch (provider) {
            case "openai":
                return await openAITTS(text, apiKey, resolvedVoice, ttsInstructions);
            case "google gemini":
                return await geminiTTS(text, apiKey, resolvedVoice, ttsInstructions, model);
            case "google cloud":
                return await googleCloudTTS(text, apiKey, resolvedVoice);
            case "elevenlabs":
                return await elevenLabsTTS(text, apiKey, resolvedVoice, model);
        }
    }
    
    function getLLMPricing(model, provider = settings.llmProvider) {
        const allProviders = {...llmModelsByProvider, ...ttsModelsByProvider};
        const models = (provider && allProviders[provider]) || Object.values(allProviders).flat();
        const modelObj = models.find(m => m.value === model);
        if (!modelObj) return [0, 0, 0];
        
        const inputPrice = (modelObj.inputPrice || 0) / 1e6;
        const outputPrice = (modelObj.outputPrice || 0) / 1e6;
        const cachedPrice = (modelObj.cachedPrice || 0) / 1e6;
        
        return [inputPrice, outputPrice, cachedPrice];
    }
    
    function extractTokenUsage(usage) {
        if (!usage) return {cachedTokens: 0, inputTokens: 0, reasoningTokens: 0, outputTokens: 0};
        
        let cachedTokens = usage.input_tokens_details?.cached_tokens || usage.prompt_tokens_details?.cached_tokens || usage.prompt_cache_hit_tokens || 0;
        const rawInputTokens = usage.prompt_tokens || usage.input_tokens || 0;
        let inputTokens = rawInputTokens;
        
        if (usage.cache_read_input_tokens !== undefined || usage.cache_creation_input_tokens !== undefined) {
            cachedTokens = usage.cache_read_input_tokens || 0;
            inputTokens = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
        } else if (cachedTokens > 0) {
            inputTokens = Math.max(0, rawInputTokens - cachedTokens);
        }
        
        const rawOutputTokens = usage.completion_tokens || usage.output_tokens || 0;
        let reasoningTokens = usage.output_tokens_details?.reasoning_tokens || usage.completion_tokens_details?.reasoning_tokens || usage.output_tokens_details?.thinking_tokens || 0;
        const totalTokens = usage.total_tokens || 0;
        
        let outputTokens = rawOutputTokens;
        
        if (totalTokens && rawInputTokens) {
            const totalGeneratedTokens = Math.max(0, totalTokens - rawInputTokens);
            if (reasoningTokens > 0) {
                if (rawOutputTokens === totalGeneratedTokens) {
                    // OpenAI style: completion_tokens includes reasoning_tokens
                    outputTokens = Math.max(0, rawOutputTokens - reasoningTokens);
                } else {
                    // Google style: completion_tokens is pure output
                    outputTokens = rawOutputTokens;
                }
            } else if (totalGeneratedTokens > rawOutputTokens) {
                reasoningTokens = totalGeneratedTokens - rawOutputTokens;
                outputTokens = rawOutputTokens;
            }
        } else if (reasoningTokens > 0) {
            outputTokens = Math.max(0, rawOutputTokens - reasoningTokens);
        }
        
        return {cachedTokens, inputTokens, reasoningTokens, outputTokens};
    }
    
    async function saveLLMUsageToStorage(usageDetail) {
        const currentLang = usageDetail.language || getLessonLanguage();
        const resolvedProvider = usageDetail.provider || settings.llmProvider;
        const tokens = usageDetail.tokens || {cached: 0, input: 0, reasoning: 0, output: 0};
        const isPriority = Boolean(usageDetail.isPriority);
        
        if (isDbReady()) {
            try {
                const row = {
                    ...(settings.useCentralDb && {user_id: centralUserId}),
                    language: currentLang,
                    provider: resolvedProvider,
                    model: usageDetail.model,
                    cached_tokens: tokens.cached || 0,
                    input_tokens: tokens.input || 0,
                    reasoning_tokens: tokens.reasoning || 0,
                    output_tokens: tokens.output || 0,
                    is_priority: isPriority
                };
                
                const {error} = await getDbClient()
                    .from(getLLMUsageTableName())
                    .insert([row]);
                
                if (!error) return;
                console.error("Failed to insert LLM usage log into DB:", error);
            } catch (e) {
                console.error("Exception inserting LLM usage log into DB:", e);
            }
        }
        
        try {
            const storageKey = "lingq_llm_usage_history";
            const rawData = localStorage.getItem(storageKey);
            const history = rawData ? JSON.parse(rawData) : [];
            
            history.push({
                timestamp: Date.now(),
                language: currentLang,
                provider: resolvedProvider,
                model: usageDetail.model,
                tokens,
                isPriority
            });
            localStorage.setItem(storageKey, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save LLM usage to localStorage:", e);
        }
    }
    
    function trackLLMUsage(contextType, model, cachedTokens, inputTokens, reasoningTokens, outputTokens, overrideCost = null, isPriority = false, provider = null) {
        let approxCost = 0;
        let uncachedCost = 0;
        let savedPercentStr = "";
        
        const multiplier = isPriority ? 1.8 : 1.0;
        const totalGeneratedTokens = reasoningTokens + outputTokens;
        
        const resolvedProvider = provider || settings.llmProvider;
        
        if (overrideCost !== null) {
            approxCost = overrideCost;
            uncachedCost = overrideCost;
        } else {
            const [inputPrice, outputPrice, cachedPrice] = getLLMPricing(model, resolvedProvider);
            approxCost = (cachedTokens * cachedPrice + inputTokens * inputPrice + totalGeneratedTokens * outputPrice) * multiplier;
            uncachedCost = ((cachedTokens + inputTokens) * inputPrice + totalGeneratedTokens * outputPrice) * multiplier;
            
            savedPercentStr = uncachedCost > 0
                ? (((uncachedCost - approxCost) / uncachedCost) * 100).toFixed(1)
                : '0.0';
        }
        
        const logMessage = overrideCost !== null
            ? `cost: $${approxCost.toFixed(6)}`
            : `cost: $${approxCost.toFixed(6)} (${savedPercentStr}% saved)`;
        
        const priorityStr = isPriority ? " (Priority)" : "";
        console.log('[LLM usage]', `[${contextType}]`, `${model}${priorityStr}, tokens: (${cachedTokens}/${inputTokens}/${reasoningTokens}/${outputTokens}), ${logMessage}`);
        
        const currentLang = getLessonLanguage() || "";
        
        const usageDetail = {
            type: contextType,
            language: currentLang,
            provider: resolvedProvider,
            model: model,
            tokens: {
                cached: cachedTokens,
                input: inputTokens,
                reasoning: reasoningTokens,
                output: outputTokens
            },
            cost: approxCost,
            uncachedCost: uncachedCost,
            isPriority: isPriority
        };
        
        saveLLMUsageToStorage(usageDetail);
        
        document.dispatchEvent(new CustomEvent("addon:llmUsage", {
            detail: usageDetail
        }));
    }
    
    async function importPrivateKey(pem) {
        const pemContents = pem
            .replace(/-----BEGIN PRIVATE KEY-----/g, "")
            .replace(/-----END PRIVATE KEY-----/g, "")
            .replace(/\s+/g, "");
        
        const binaryDerString = window.atob(pemContents);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }
        
        return await window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer.buffer,
            {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"},
            false,
            ["sign"]
        );
    }
    
    async function getAccessTokenFromServiceAccount(clientEmail, privateKey) {
        const now = Math.floor(Date.now() / 1000);
        const header = {alg: "RS256", typ: "JWT"};
        const payload = {
            iss: clientEmail,
            scope: "https://www.googleapis.com/auth/cloud-platform",
            aud: "https://oauth2.googleapis.com/token",
            exp: now + 3600,
            iat: now
        };
        
        const base64UrlEncode = (data) => {
            const str = typeof data === "string" ? data : JSON.stringify(data);
            return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        };
        
        const unsignedJwt = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
        const cryptoKey = await importPrivateKey(privateKey);
        const signatureBuffer = await window.crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            cryptoKey,
            new TextEncoder().encode(unsignedJwt)
        );
        
        const signatureBase64Url = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
            .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        
        const signedJwt = `${unsignedJwt}.${signatureBase64Url}`;
        
        const response = await gmFetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: signedJwt
            }).toString()
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Token fetch failed: ${JSON.stringify(data)}`);
        }
        return data.access_token;
    }
    
    async function getValidVertexToken() {
        const now = Math.floor(Date.now() / 1000);
        if (settings.vertexAccessToken && settings.vertexTokenExpiry && now < settings.vertexTokenExpiry - 300) {
            return settings.vertexAccessToken;
        }
        
        const credentials = settings.vertexCredential;
        if (!credentials.clientEmail || !credentials.privateKey || !credentials.projectId) {
            throw new Error("Vertex credentials are not set.");
        }
        
        const token = await getAccessTokenFromServiceAccount(credentials.clientEmail, credentials.privateKey);
        settings.vertexAccessToken = token;
        settings.vertexTokenExpiry = now + 3600;
        return token;
    }
    
    async function buildRequestConfig(provider, apiKey, forcePriority = false) {
        let api_url;
        let headers = {'Content-Type': 'application/json'};
        let isPriority = false;
        
        switch (provider) {
            case "openai":
                api_url = "https://api.openai.com/v1/responses";
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case "google":
                api_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case "anthropic":
                api_url = "https://api.anthropic.com/v1/messages";
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
                break;
            case "deepseek":
                api_url = "https://api.deepseek.com/chat/completions";
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case "cerebras":
                api_url = "https://api.cerebras.ai/v1/chat/completions";
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case "zai":
                api_url = "https://api.z.ai/api/paas/v4/chat/completions";
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case "vertex": {
                const token = await getValidVertexToken();
                const projectId = settings.vertexCredential.projectId;
                const region = "global";
                api_url = `https://aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;
                headers['Authorization'] = `Bearer ${token}`;
                if (useVertexPriorityMode || forcePriority) {
                    headers['X-Vertex-AI-LLM-Request-Type'] = 'shared';
                    headers['X-Vertex-AI-LLM-Shared-Request-Type'] = 'priority';
                    isPriority = true;
                }
                break;
            }
        }
        
        return {api_url, headers, isPriority};
    }
    
    function buildRequestBody(provider, model, history, stream = false, cacheName = null, includeThoughts = false, enableReasoning = true) {
        const processedHistory = ((provider === "google" || provider === "vertex") && cacheName)
            ? history.filter(m => {
                if (m.role === "user" && m.content.startsWith("<summary>")) return false;
                if (m.role === "system-main" || m.role === "system-word") return false;
                return true;
            })
            : history;
        
        let mappedHistory = processedHistory.map(m => {
            let role = m.role.split("-")[0];
            
            if ((provider === "google" || provider === "vertex") && cacheName && role === "system") {
                role = "user";
            }
            
            const cleanContent = m.content
                .replace(/<details class="thought-process[\s\S]*?<\/details>/gi, '')
                .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
                .trim();
            
            return {role, content: cleanContent};
        });
        
        
        let reqModel = model;
        if (provider === "vertex") {
            reqModel = model.startsWith("google/") ? model : `google/${model}`;
        }
        
        const body = {model: reqModel};
        if (stream) body.stream = true;
        
        if (provider === "openai") {
            if (!enableReasoning) {
                body.reasoning = {effort: "none"};
            } else {
                body.reasoning = {effort: "medium", summary: "auto"};
            }
            
            const isGpt56OrLater = model.includes("gpt-5.6") || model.includes("gpt-6");
            const isWordRequest = history.some(m => m.role === "system-word");
            
            if (isGpt56OrLater) {
                const systemBlocks = [];
                const nonSystem = [];
                
                mappedHistory.forEach(m => {
                    if (m.role === "system" || m.content.startsWith("<summary>")) {
                        systemBlocks.push(m.content);
                    } else {
                        nonSystem.push({role: m.role, content: m.content});
                    }
                });
                
                const mergedMessages = [];
                nonSystem.forEach(msg => {
                    const lastMsg = mergedMessages[mergedMessages.length - 1];
                    if (lastMsg && lastMsg.role === msg.role) {
                        lastMsg.content += `\n\n${msg.content}`;
                    } else {
                        mergedMessages.push({role: msg.role, content: msg.content});
                    }
                });
                
                const inputMessages = [];
                let hasExplicitBreakpoint = false;
                
                if (systemBlocks.length > 0) {
                    const combinedSystemText = systemBlocks.join("\n\n---\n\n");
                    if (isWordRequest) {
                        inputMessages.push({
                            role: "developer",
                            content: [
                                {
                                    type: "input_text",
                                    text: combinedSystemText,
                                    prompt_cache_breakpoint: {mode: "explicit"}
                                }
                            ]
                        });
                        hasExplicitBreakpoint = true;
                    } else {
                        inputMessages.push({
                            role: "developer",
                            content: combinedSystemText
                        });
                    }
                }
                
                mergedMessages.forEach(msg => {
                    if (msg.role === "assistant") {
                        inputMessages.push({
                            role: "assistant",
                            content: [
                                {
                                    type: "output_text",
                                    text: msg.content
                                }
                            ]
                        });
                    } else {
                        inputMessages.push(msg);
                    }
                });
                
                if (hasExplicitBreakpoint) {
                    body.prompt_cache_options = {mode: "explicit"};
                }
                
                body.input = inputMessages;
            } else {
                const lessonId = (typeof getLessonId === "function" ? getLessonId() : null) || "default";
                body.prompt_cache_key = `lingq-lesson-${lessonId}`;
                body.prompt_cache_retention = "24h";
                body.input = mappedHistory;
            }
        } else {
            body.messages = mappedHistory;
        }
        
        if (provider === "google" || provider === "vertex") {
            body.extra_body = body.extra_body || {};
            body.extra_body.google = body.extra_body.google || {};
            
            let level = enableReasoning ? "medium" : "minimal";
            if (model.includes("gemini-3.7") || model.includes("gemini-3.8")) {
                level = enableReasoning ? "medium" : "low";
            }
            
            body.extra_body.google.thinking_config = {
                thinking_level: level
            };
            if (includeThoughts) {
                body.extra_body.google.thinking_config.include_thoughts = true;
            }
            if (cacheName) {
                body.extra_body.google.cached_content = cacheName;
            }
            body.stream_options = {include_usage: true};
        }
        
        if (provider === "anthropic") {
            if (model.includes("haiku-4-5") || !enableReasoning) {
                body.max_tokens = 4096;
                body.thinking = {type: "disabled"};
            } else {
                body.max_tokens = 16384;
                body.thinking = {type: "adaptive", display: "summarized"};
            }
            
            const isWordRequest = history.some(m => m.role === "system-word");
            const systemBlocks = [];
            const nonSystem = [];
            
            mappedHistory.forEach(m => {
                if (m.role === "system" || m.content.startsWith("<summary>")) {
                    systemBlocks.push(m.content);
                } else {
                    nonSystem.push({role: m.role, content: m.content});
                }
            });
            
            const mergedMessages = [];
            nonSystem.forEach(msg => {
                const lastMsg = mergedMessages[mergedMessages.length - 1];
                if (lastMsg && lastMsg.role === msg.role) {
                    lastMsg.content += `\n\n${msg.content}`;
                } else {
                    mergedMessages.push({role: msg.role, content: msg.content});
                }
            });
            
            if (systemBlocks.length > 0) {
                const combinedSystemText = systemBlocks.join("\n\n---\n\n");
                if (isWordRequest) {
                    body.system = [
                        {
                            type: "text",
                            text: combinedSystemText,
                            cache_control: {type: "ephemeral", ttl: "1h"}
                        }
                    ];
                } else {
                    body.system = combinedSystemText;
                }
            }
            
            const lastAssistantIdx = mergedMessages.map(m => m.role).lastIndexOf("assistant");
            if (lastAssistantIdx !== -1) {
                const targetMsg = mergedMessages[lastAssistantIdx];
                if (typeof targetMsg.content === "string") {
                    targetMsg.content = [
                        {
                            type: "text",
                            text: targetMsg.content,
                            cache_control: {type: "ephemeral"}
                        }
                    ];
                }
            }
            
            body.messages = mergedMessages;
        }
        
        if (provider === "deepseek") {
            body.reasoning_effort = "none";
        }
        
        if (provider === "cerebras") {
            body.reasoning_effort = enableReasoning ? "low" : "none";
        }
        
        if (provider === "zai") {
            body.reasoning_effort = "low";
        }
        
        return body;
    }
    
    async function getOpenAIResponse(provider, apiKey, model, history, cacheName = null, onCacheExpired = null, retryCount = 0, enableReasoning = true) {
        const forcePriority = (provider === "vertex" && retryCount > 0);
        const {api_url, headers, isPriority} = await buildRequestConfig(provider, apiKey, forcePriority);
        const body = buildRequestBody(provider, model, history, false, cacheName, false, enableReasoning);
        
        try {
            const response = await gmFetch(api_url, {method: 'POST', headers, body: JSON.stringify(body)});
            
            if (!response.ok) {
                const errorData = await response.json();
                const errMsg = errorData.error?.message || JSON.stringify(errorData);
                console.error(`Fetch API Error (${response.status}):`, errMsg);
                
                if (cacheName && (provider === "google" || provider === "vertex") && (response.status === 403 || response.status === 404 || (provider === "vertex" && response.status === 400)) && retryCount === 0 && onCacheExpired) {
                    console.warn("Gemini cache expired or not found. Recreating and retrying...");
                    const newCacheName = await onCacheExpired();
                    if (newCacheName) {
                        console.log(`Cache recreated successfully. Retrying with new cache: ${newCacheName}`);
                        return getOpenAIResponse(provider, apiKey, model, history, newCacheName, onCacheExpired, 1, enableReasoning);
                    }
                    console.warn("Cache recreation failed. Falling back to non-cached request.");
                    return getOpenAIResponse(provider, apiKey, model, history, null, null, 1, enableReasoning);
                }
                
                if (provider === "vertex" && response.status === 401 && retryCount === 0) {
                    console.warn("Vertex token expired. Regenerating and retrying...");
                    settings.vertexTokenExpiry = 0;
                    return getOpenAIResponse(provider, apiKey, model, history, cacheName, onCacheExpired, 1, enableReasoning);
                }
                
                if (response.status === 429 && retryCount === 0) {
                    console.warn("429 Resource Exhausted. Retrying once after 2 seconds...");
                    await new Promise(r => setTimeout(r, 1000));
                    return getOpenAIResponse(provider, apiKey, model, history, cacheName, onCacheExpired, 1, enableReasoning);
                }
                
                return `Error: ${errMsg}`;
            }
            
            const data = await response.json();
            let content;
            if (provider === "anthropic") {
                const textBlock = data.content?.find(b => b.type === "text");
                content = textBlock?.text || data.content?.[0]?.text;
            } else if (provider === "openai") {
                const messageItem = data.output?.find(item => item.type === "message");
                content = messageItem?.content?.find(c => c.type === "output_text")?.text || data.output_text || data.choices?.[0]?.message?.content;
            } else {
                content = data.choices[0]?.message?.content;
            }
            const {cachedTokens, inputTokens, reasoningTokens, outputTokens} = extractTokenUsage(data.usage);
            
            trackLLMUsage("Chat Batch", model, cachedTokens, inputTokens, reasoningTokens, outputTokens, null, isPriority, provider);
            
            return content || "Sorry, could not get a response.";
        } catch (error) {
            console.error('API call failed:', error);
            return `Sorry, something went wrong communicating with ${provider}.`;
        }
    }
    
    async function streamOpenAIResponse(provider, apiKey, model, history, onChunkReceived, onStreamEnd, onError, cacheName = null, onCacheExpired = null, retryCount = 0, includeThoughts = false, enableReasoning = true) {
        const forcePriority = (provider === "vertex" && retryCount > 0);
        const {api_url, headers, isPriority} = await buildRequestConfig(provider, apiKey, forcePriority);
        if (provider === "anthropic") headers['Accept'] = 'text/event-stream';
        const body = buildRequestBody(provider, model, history, true, cacheName, includeThoughts, enableReasoning);
        
        let lastUsage = null;
        let streamInThought = false;
        
        try {
            const finalContent = await gmStream(api_url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            }, (json) => {
                if (json.usage) {
                    lastUsage = Object.assign(lastUsage || {}, json.usage);
                } else if (json.message?.usage) {
                    lastUsage = Object.assign(lastUsage || {}, json.message.usage);
                } else if (json.type === "response.completed" && json.response?.usage) {
                    lastUsage = json.response.usage;
                }
                
                if (provider === "anthropic") {
                    if (json.type === "content_block_delta") {
                        const thinking = json.delta?.type === "thinking_delta" ? json.delta?.thinking : null;
                        const text = json.delta?.text;
                        
                        if (thinking) {
                            if (!streamInThought) {
                                streamInThought = true;
                                onChunkReceived(`<thought>${thinking}`);
                            } else {
                                onChunkReceived(thinking);
                            }
                        }
                        if (text) {
                            if (streamInThought) {
                                streamInThought = false;
                                onChunkReceived(`</thought>${text}`);
                            } else {
                                onChunkReceived(text);
                            }
                        }
                    } else if (json.type === "content_block_stop" && streamInThought) {
                        streamInThought = false;
                        onChunkReceived('</thought>');
                    }
                } else if (provider === "openai") {
                    const reasoning = (json.type === "response.reasoning_summary_text.delta" || json.type === "response.reasoning_text.delta") ? json.delta : null;
                    const content = json.type === "response.output_text.delta" ? json.delta : null;
                    
                    if (reasoning) {
                        if (!streamInThought) {
                            streamInThought = true;
                            onChunkReceived(`<thought>${reasoning}`);
                        } else {
                            onChunkReceived(reasoning);
                        }
                    }
                    if (content) {
                        if (streamInThought) {
                            streamInThought = false;
                            onChunkReceived(`</thought>${content}`);
                        } else {
                            onChunkReceived(content);
                        }
                    }
                } else {
                    const delta = json.choices?.[0]?.delta;
                    const reasoning = delta?.reasoning_content;
                    const content = delta?.content;
                    
                    if (reasoning) {
                        if (!streamInThought) {
                            streamInThought = true;
                            onChunkReceived(`<thought>${reasoning}`);
                        } else {
                            onChunkReceived(reasoning);
                        }
                    }
                    if (content) {
                        if (streamInThought) {
                            streamInThought = false;
                            onChunkReceived(`</thought>${content}`);
                        } else {
                            onChunkReceived(content);
                        }
                    }
                }
            });
            
            if (streamInThought) {
                streamInThought = false;
                onChunkReceived('</thought>');
            }
            
            if (lastUsage) {
                const {cachedTokens, inputTokens, reasoningTokens, outputTokens} = extractTokenUsage(lastUsage);
                
                trackLLMUsage("Chat Stream", model, cachedTokens, inputTokens, reasoningTokens, outputTokens, null, isPriority, provider);
            }
            
            onStreamEnd(finalContent);
        } catch (error) {
            console.error(`Stream API Error [${provider}/${model}]:`, error.message, error.errorData || error);
            if (cacheName && (provider === "google" || provider === "vertex") && (error.message.includes("403") || error.message.includes("404") || (provider === "vertex" && error.message.includes("400"))) && retryCount === 0 && onCacheExpired) {
                console.warn("Gemini cache expired or not found. Recreating and retrying...");
                const newCacheName = await onCacheExpired();
                if (newCacheName) {
                    console.log(`Cache recreated successfully. Retrying with new cache: ${newCacheName}`);
                    return streamOpenAIResponse(provider, apiKey, model, history, onChunkReceived, onStreamEnd, onError, newCacheName, onCacheExpired, 1, includeThoughts, enableReasoning);
                }
                console.warn("Cache recreation failed. Falling back to non-cached request.");
                return streamOpenAIResponse(provider, apiKey, model, history, onChunkReceived, onStreamEnd, onError, null, null, 1, includeThoughts, enableReasoning);
            }
            
            if (provider === "vertex" && error.message.includes("401") && retryCount === 0) {
                console.warn("Vertex token expired. Regenerating and retrying...");
                settings.vertexTokenExpiry = 0;
                return streamOpenAIResponse(provider, apiKey, model, history, onChunkReceived, onStreamEnd, onError, cacheName, onCacheExpired, 1, includeThoughts, enableReasoning);
            }
            
            if (error.message.includes("429") && retryCount === 0) {
                console.warn("429 Resource Exhausted. Retrying once after 2 seconds...");
                await new Promise(r => setTimeout(r, 1000));
                return streamOpenAIResponse(provider, apiKey, model, history, onChunkReceived, onStreamEnd, onError, cacheName, onCacheExpired, 1, includeThoughts, enableReasoning);
            }
            
            onError(error);
        }
    }
    
    function applyCustomFont(fontName) {
        function escapeFontFamily(name) {
            return name.trim().replace(/\s+/g, "+");
        }
        
        if (!fontName) {
            document.documentElement.style.removeProperty("--custom-font");
            document.getElementById("custom-font-link")?.remove();
            return;
        }
        
        document.getElementById("custom-font-link")?.remove();
        
        document.documentElement.style.setProperty("--custom-font", `"${fontName}"`);
        
        const link = createElement("link", {
            id: "custom-font-link",
            rel: "stylesheet",
            href: `https://fonts.googleapis.com/css2?family=${escapeFontFamily(fontName)}&display=swap`
        });
        
        link.onerror = () => {
            document.documentElement.style.removeProperty("--custom-font");
        };
        
        document.head.appendChild(link);
    }
    
    function convertSrtToVttBlobUrl(srtText, cueSettings = "") {
        const cueSuffix = cueSettings ? ` ${cueSettings}` : "";
        let vttText = srtText.startsWith("WEBVTT")
            ? srtText
            : ("WEBVTT\n\n" + srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2"));
        if (cueSuffix) {
            vttText = vttText.replace(/(--> \d{2}:\d{2}:\d{2}\.\d{3})(?:[^\r\n]*)/g, `$1${cueSuffix}`);
        }
        const blob = new Blob([vttText], {type: "text/vtt"});
        return URL.createObjectURL(blob);
    }

    function globalSetup() {
        function resizeToast() {
            const css = `
            .toasts {
                height: fit-content;
            }
            `;
            applyCSS(css);
        }
        
        function removePromoBanners() {
            const bannerSelectors = [
                '[data-promo-banner="true"]',
                '[data-mkt-banner="true"]',
                'div[class*="hide-promoOffer"]'
            ];
            
            const closeButtonSelectors = [
                '[data-promo-banner] button[aria-label*="Close" i]',
                '[data-mkt-banner] button[aria-label*="Close" i]',
                'div[class*="hide-promoOffer"] button'
            ].join(',');
            
            const css = bannerSelectors.map(selector => `${selector} { display: none !important; }`).join('\n');
            applyCSS(css);
            
            let isThrottled = false;
            const observer = new MutationObserver(() => {
                if (isThrottled) return;
                
                isThrottled = true;
                requestAnimationFrame(() => {
                    const closeButton = document.querySelector(closeButtonSelectors);
                    
                    if (closeButton && !closeButton.dataset.addonClicked) {
                        closeButton.dataset.addonClicked = 'true';
                        closeButton.click();
                        console.log('A banner is closed.');
                    }
                    isThrottled = false;
                });
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
        
        resizeToast();
        removePromoBanners();
    }
    
    function setupPopups() {
        function getColorSettings(colorMode) {
            const prefix = colorMode === "dark" ? "dark_" : "white_";
            
            return {
                fontColor: settings[prefix + "fontColor"],
                translationFontColor: settings[prefix + "translationFontColor"],
                lingqBackground: settings[prefix + "lingqBackground"],
                lingqBorder: settings[prefix + "lingqBorder"],
                lingqBorderLearned: settings[prefix + "lingqBorderLearned"],
                unknownBackground: settings[prefix + "unknownBackground"],
                unknownBorder: settings[prefix + "unknownBorder"],
                playingUnderline: settings[prefix + "playingUnderline"],
            };
        }
        
        function createSettingsPopup() {
            const popup = createElement("div", {id: "lingqAddonSettingsPopup", className: "popup"});
            
            const dragHandle = createElement("div", {
                id: "lingqAddonSettingsDragHandle",
                className: "popup-drag-handle"
            });
            
            const dragHandleTitle = createElement("h3", {textContent: "LingQ Addon Settings"});
            dragHandle.appendChild(dragHandleTitle);
            
            const content = createElement("div", {style: `padding: 0 5px;`});
            const popupContentElement = generatePopupContent();
            content.appendChild(popupContentElement);
            
            popup.appendChild(dragHandle);
            popup.appendChild(content);
            
            const closeTopButton = createElement("button", {
                className: "popup-close-top-btn",
                textContent: "×",
            });
            closeTopButton.addEventListener("click", () => {
                popup.style.display = "none";
            });
            popup.appendChild(closeTopButton);
            
            return popup;
        }
        
        function generatePopupContent() {
            function addSelect(parent, id, labelText, options, selectedValue) {
                const container = createElement("div", {className: "popup-row"});
                container.appendChild(createElement("label", {htmlFor: id, textContent: labelText}));
                
                const select = createElement("select", {id});
                options.forEach(option => {
                    select.appendChild(createElement("option", {
                        value: option.value,
                        textContent: option.text,
                        selected: selectedValue === option.value
                    }));
                });
                
                container.appendChild(select);
                parent.appendChild(container);
                return container;
            }
            
            function addSlider(parent, id, labelText, valueId, value, unit, min, max, step) {
                const container = createElement("div", {className: "popup-row"});
                
                const label = createElement("label", {htmlFor: id});
                label.appendChild(document.createTextNode(labelText + " "));
                label.appendChild(createElement("span", {id: valueId, textContent: value}));
                if (unit) label.appendChild(document.createTextNode(unit));
                
                container.appendChild(label);
                container.appendChild(createElement("input", {
                    type: "range",
                    id,
                    min,
                    max,
                    step,
                    value,
                    style: "width: 100%;"
                }));
                
                parent.appendChild(container);
                return container;
            }
            
            function addColorPicker(parent, id, labelText, value) {
                const container = createElement("div", {className: "popup-row"});
                container.appendChild(createElement("label", {htmlFor: id + "Text", textContent: labelText}));
                
                const flexContainer = createElement("div", {style: "display: flex; align-items: center;"});
                flexContainer.appendChild(createElement("div", {id: id + "Picker", className: "color-picker"}));
                flexContainer.appendChild(createElement("input", {
                    type: "text",
                    id: id + "Text",
                    value,
                    style: "margin-left: 10px;",
                    className: "popup-input"
                }));
                
                container.appendChild(flexContainer);
                parent.appendChild(container);
                return container;
            }
            
            function addCheckbox(parent, id, labelText, checked) {
                const container = createElement("div", {className: "popup-row"});
                const label = createElement("label", {htmlFor: id, textContent: labelText});
                const checkbox = createElement("input", {type: "checkbox", id, checked, style: "margin-left: 10px;"});
                
                label.style.display = "flex";
                label.style.alignItems = "center";
                container.appendChild(label);
                label.appendChild(checkbox);
                parent.appendChild(container);
                
                return container;
            }
            
            function addShortcutInput(parent, id, labelText, value) {
                const container = createElement("div", {
                    className: "popup-row",
                    style: "display: flex; justify-content: space-between;"
                });
                
                container.appendChild(createElement("label", {htmlFor: id, textContent: labelText}));
                
                const input = createElement("input", {
                    type: "text",
                    id,
                    value,
                    maxLength: 1, // Restrict to single character
                    className: "popup-input",
                    style: "width: 30px; text-transform: lowercase; flex-grow: unset; text-align: center;"
                });
                container.appendChild(input);
                parent.appendChild(container);
                return container;
            }
            
            function addRadioGroup(parent, groupName, labelText, options, selectedValue) {
                const container = createElement("div", {
                    className: "popup-row",
                    style: "display: flex; align-items: center; gap: 15px;"
                });
                
                container.appendChild(createElement("label", {textContent: labelText}));
                
                const optionsContainer = createElement("div", {
                    style: "flex-grow: 1; display: flex; justify-content: space-around;"
                });
                
                options.forEach(({value, text}) => {
                    const optionLabel = createElement("label", {
                        style: "display: flex; gap: 5px; cursor: pointer;"
                    });
                    
                    const input = createElement("input", {
                        type: "radio",
                        name: groupName,
                        id: `${groupName}_${value}`,
                        value,
                        checked: value === selectedValue
                    });
                    
                    optionLabel.appendChild(input);
                    optionLabel.appendChild(document.createTextNode(text));
                    optionsContainer.appendChild(optionLabel);
                });
                
                container.appendChild(optionsContainer);
                parent.appendChild(container);
                
                return container;
            }
            
            const popupLayout = createElement("div");
            const columns = createElement("div", {style: "display: flex; flex-direction: row;"});
            
            const container1 = createElement("div", {style: "padding: 5px; width: 375px;"});
            
            const rawBaseType = settings.styleType[language];
            const baseType = (rawBaseType === "audio" || rawBaseType === "video" || !rawBaseType) ? "default" : rawBaseType;
            const position = settings.videoPosition[language];
            
            addSelect(container1, "styleTypeSelector", "Layout Style:", [
                {value: "default", text: "Default (Auto)"},
                {value: "localVideo", text: "Local Video"},
                {value: "off", text: "Layout Off"}
            ], baseType);
            
            const hasPositionSettings = baseType !== "off";
            const positionSettingsContainer = createElement("div", {
                id: "positionSettingsContainer",
                style: `${hasPositionSettings ? "" : "display: none;"}`
            });
            addSelect(positionSettingsContainer, "videoPositionSelector", "Video Position:", [
                {value: "Right", text: "Right"},
                {value: "Left", text: "Left"},
                {value: "Top", text: "Top"},
                {value: "Bottom", text: "Bottom"}
            ], position);
            container1.appendChild(positionSettingsContainer);
            
            const hasHeightSettings = hasPositionSettings && ["Top", "Bottom"].includes(position);
            const videoSettings = createElement("div", {
                id: "videoSettings",
                style: `${hasHeightSettings ? "" : "display: none;"}`
            });
            addSlider(videoSettings, "heightBigSlider", "Video Height:", "heightBigValue", settings.heightBig, "px", 300, 1200, 10);
            container1.appendChild(videoSettings);
            
            addSlider(container1, "widgetWidthSlider", "Widget Width:", "widgetWidthValue", settings.widgetWidth, "px", 330, 500, 10);
            
            addSlider(container1, "fontSizeSlider", "Font Size:", "fontSizeValue", settings.fontSize[language], "rem", 0.8, 1.8, 0.05);
            addSlider(container1, "annotationScaleSlider", "Annotation Size:", "annotationScaleValue", settings.annotationScale[language], "%", 40, 80, 5);
            addRadioGroup(container1, "hoverAnnotation", "Hover Annotation:", [
                {value: "off", text: "Off"},
                {value: "reader", text: "Reader"},
                {value: "all", text: "All"}
            ], settings.hoverAnnotation);
            addSlider(container1, "lineHeightSlider", "Line Height:", "lineHeightValue", settings.lineHeight[language], "", 1.2, 3.0, 0.05);
            
            const customFontContainer = createElement("div", {className: "popup-row"});
            customFontContainer.appendChild(createElement("label", {
                htmlFor: "customFontInput",
                textContent: "Google Web Font Name:"
            }));
            const customFontInputGroup = createElement("div", {
                style: "display: flex; align-items: center; gap: 5px; flex: 1;"
            });
            const customFontInput = createElement("input", {
                type: "text",
                id: "customFontInput",
                value: settings.customFont[language],
                className: "popup-input",
                style: "width: 70%; flex-grow: unset;"
            });
            const customFontLibrary = createElement("a", {
                href: "https://fonts.google.com",
                target: "_blank", textContent: "Font Library",
                style: "font-size: 0.9em; color: var(--blue-500); margin: 0 auto;"
            });
            customFontInputGroup.append(customFontInput, customFontLibrary);
            customFontContainer.appendChild(customFontInputGroup);
            container1.appendChild(customFontContainer);
            
            const colorSection = createElement("div", {className: "popup-section"});
            
            addRadioGroup(colorSection, "colorMode", "Color Mode:", [
                {value: "white", text: "White"},
                {value: "dark", text: "Dark"}
            ], settings.colorMode);
            
            [
                {id: "fontColor", label: "Font Color:", value: colorSettings.fontColor},
                {
                    id: "translationFontColor",
                    label: "Translation Font Color:",
                    value: colorSettings.translationFontColor
                },
                {id: "lingqBackground", label: "LingQ Background:", value: colorSettings.lingqBackground},
                {id: "lingqBorder", label: "LingQ Border:", value: colorSettings.lingqBorder},
                {id: "lingqBorderLearned", label: "LingQ Border Learned:", value: colorSettings.lingqBorderLearned},
                {id: "unknownBackground", label: "Unknown Background:", value: colorSettings.unknownBackground},
                {id: "unknownBorder", label: "Unknown Border:", value: colorSettings.unknownBorder},
                {id: "playingUnderline", label: "Playing Underline:", value: colorSettings.playingUnderline}
            ].forEach(config => addColorPicker(colorSection, config.id, config.label, config.value));
            
            container1.appendChild(colorSection);
            
            const videoCaptionSection = createElement("div", {className: "popup-section"});
            addSlider(videoCaptionSection, "captionFontsizeSlider", "Video Caption Font Size", "captionFontsizeValue", settings.captionFontsize, "px", 10, 30, 1);
            addRadioGroup(videoCaptionSection, "relocateCaption", "Location:", [
                {value: "default", text: "Default"},
                {value: "inside", text: "Inside"},
                {value: "below", text: "Below"}
            ], settings.relocateCaption);
            container1.appendChild(videoCaptionSection);
            
            const widgetTitleRow = createElement("div", {className: "popup-row"});
            widgetTitleRow.appendChild(createElement("label", {textContent: "Widget"}));
            container1.appendChild(widgetTitleRow);

            const widgetSection = createElement("div", {className: "popup-section"});

            const widgetRadioGroup = addRadioGroup(widgetSection, "widgetVerticalAlign", "Align:", [
                {value: "flex-start", text: "Top"},
                {value: "center", text: "Center"},
                {value: "flex-end", text: "Bottom"}
            ], settings.widgetVerticalAlign);
            widgetRadioGroup.style.whiteSpace = "nowrap";

            const widgetHideRow = createElement("div", {
                className: "popup-row",
                style: "display: flex; align-items: center; justify-content: space-between; margin-top: 6px; white-space: nowrap;"
            });

            widgetHideRow.appendChild(createElement("label", {
                textContent: "Hide:",
                style: "margin-right: 10px;"
            }));

            const widgetCheckboxesGroup = createElement("div", {
                style: "display: flex; flex-grow: 1; justify-content: space-between; align-items: center;"
            });

            [
                {id: "hidePopularMeaningsCheckbox", text: "Meanings", checked: settings.hidePopularMeanings},
                {id: "hideDictionariesCheckbox", text: "Dictionaries", checked: settings.hideDictionaries},
                {id: "hideSentenceSectionCheckbox", text: "Sentence", checked: settings.hideSentenceSection}
            ].forEach(({id, text, checked}) => {
                const itemLabel = createElement("label", {
                    htmlFor: id,
                    style: "display: inline-flex; align-items: center; gap: 4px; cursor: pointer;"
                });
                const cb = createElement("input", {type: "checkbox", id, checked});
                itemLabel.appendChild(document.createTextNode(text));
                itemLabel.appendChild(cb);
                widgetCheckboxesGroup.appendChild(itemLabel);
            });

            widgetHideRow.appendChild(widgetCheckboxesGroup);
            widgetSection.appendChild(widgetHideRow);
            container1.appendChild(widgetSection);

            addCheckbox(container1, "hideReaderPopupCheckbox", "Hide Meaning Popup", settings.hideReaderPopup);
            addCheckbox(container1, "hideLynxUICheckbox", "Hide Lynx AI UI", settings.hideLynxUI);
            addCheckbox(container1, "focusSelectedTextCheckbox", "Focus on Selected Text", settings.focusSelectedText);
            addCheckbox(container1, "showMemoWidgetCheckbox", "Show Memo Widget", settings.showMemoWidget);
            addCheckbox(container1, "skipEndPageCheckbox", "Skip End Page", settings.skipEndPage);
            
            columns.appendChild(container1);
            
            const container2 = createElement("div", {style: "padding: 10px; width: 375px;"});
            
            addCheckbox(container2, "keyboardShortcutCheckbox", "Enable the Keyboard Shortcuts", settings.keyboardShortcut);
            
            const shortcutSection = createElement("div", {
                id: "keyboardShortcutSection",
                className: "popup-section",
                style: `${settings.keyboardShortcut ? "" : "display: none"}`
            });
            
            addShortcutInput(shortcutSection, "shortcutVideoFullscreenInput", "Video Fullscreen Toggle:", settings.shortcutVideoFullscreen);
            addSlider(shortcutSection, "skipDurationSlider", "Skip Duration", "skipDurationValue", settings.skipDuration, " Seconds", 1, 30, 1);
            addShortcutInput(shortcutSection, "shortcutBackward5sInput", `Rewind ${settings.skipDuration} Seconds:`, settings.shortcutBackward5s);
            addShortcutInput(shortcutSection, "shortcutForward5sInput", `Fast Forward ${settings.skipDuration} Seconds:`, settings.shortcutForward5s);
            addShortcutInput(shortcutSection, "shortcutTTSPlayInput", "Play TTS Audio:", settings.shortcutTTSPlay);
            addShortcutInput(shortcutSection, "shortcutTranslatorOpenInput", "Open Translator:", settings.shortcutTranslator);
            addShortcutInput(shortcutSection, "shortcutMakeKnownInput", "Make Word Known:", settings.shortcutMakeKnown);
            addShortcutInput(shortcutSection, "shortcutDictionaryOpenInput", "Open Dictionary:", settings.shortcutDictionary);
            addShortcutInput(shortcutSection, "shortcutCopySelectedInput", "Copy Selected Text:", settings.shortcutCopySelected);
            addShortcutInput(shortcutSection, "shortcutMeaningInput", "Meaning Input Focus:", settings.shortcutMeaningInput);
            addShortcutInput(shortcutSection, "shortcutChatInput", "Chat Input Focus:", settings.shortcutChatInput);
            addShortcutInput(shortcutSection, "shortcutFlashcard", "Make a flashcard:", settings.shortcutFlashcard);
            
            container2.appendChild(shortcutSection);
            
            addCheckbox(container2, "chatWidgetCheckbox", "Enable the Chat Widget", settings.chatWidget);
            
            const chatWidgetSection = createElement("div", {
                id: "chatWidgetSection",
                className: "popup-section",
                style: `${settings.chatWidget ? "" : "display: none"}`
            });
            
            addSelect(chatWidgetSection, "llmResponseLanguageSelector", "Response Language:",
                [{value: "auto", text: "Auto"}],
                settings.llmResponseLanguage
            );
            
            addSlider(chatWidgetSection, "chatWidgetHeightSlider", "Chat Widget Height", "chatWidgetHeightValue", settings.chatWidgetHeight, "", 150, 700, 10);
            
            addSelect(chatWidgetSection, "llmProviderSelector", "Chat Provider:", [
                {value: "openai", text: "OpenAI"},
                {value: "google", text: "Google"},
                {value: "vertex", text: "Vertex (GCP)"},
                {value: "anthropic", text: "Anthropic"},
                {value: "deepseek", text: "DeepSeek"},
                {value: "cerebras", text: "Cerebras"},
                {value: "zai", text: "Z.AI"}
            ], settings.llmProvider);
            
            const activeProviderModels = llmModelsByProvider[settings.llmProvider] || [];
            addSelect(chatWidgetSection, "llmModelSelector", "Model: (Price per 1M tokens)", activeProviderModels, settings.llmModel);
            
            const apiKeyContainer = createElement("div", {
                className: "popup-row",
                style: "display: flex; justify-content: space-between; align-items: center;"
            });
            apiKeyContainer.appendChild(createElement("label", {
                htmlFor: "llmApiKeyInput",
                textContent: "Chat API Key:"
            }));
            
            const savedKeys = settings.llmApiKeys;
            
            const apiKeyFlexContainer = createElement("div", {style: "display: flex; align-items: center; width: 65%;"});
            const apiKeyInput = createElement("input", {
                type: "password",
                id: "llmApiKeyInput",
                value: savedKeys[settings.llmProvider] || "",
                className: "popup-input"
            });
            apiKeyFlexContainer.appendChild(apiKeyInput);
            apiKeyContainer.appendChild(apiKeyFlexContainer);
            chatWidgetSection.appendChild(apiKeyContainer);
            
            const vertexCreds = settings.vertexCredential;
            const vertexCredentialsContainer = createElement("div", {id: "vertexCredentialsContainer"});
            vertexCredentialsContainer.style.display = settings.llmProvider === "vertex" ? "block" : "none";
            apiKeyContainer.style.display = settings.llmProvider === "vertex" ? "none" : "flex";
            
            const addVertexField = (id, label, value, isPassword) => {
                const row = createElement("div", {
                    className: "popup-row",
                    style: "display: flex; justify-content: space-between; align-items: center;"
                });
                row.appendChild(createElement("label", {htmlFor: id, textContent: label}));
                
                const flexContainer = createElement("div", {style: "display: flex; align-items: center; width: 65%;"});
                const input = createElement("input", {
                    type: isPassword ? "password" : "text",
                    id: id,
                    value: value || "",
                    className: "popup-input"
                });
                flexContainer.appendChild(input);
                row.appendChild(flexContainer);
                
                vertexCredentialsContainer.appendChild(row);
                return input;
            };
            
            addVertexField("vertexProjectIdInput", "Project ID:", vertexCreds.projectId, false);
            addVertexField("vertexClientEmailInput", "Client Email:", vertexCreds.clientEmail, false);
            addVertexField("vertexPrivateKeyInput", "Private Key:", vertexCreds.privateKey, true);
            
            const jsonUploadRow = createElement("div", {
                className: "popup-row",
                style: "display: flex; justify-content: flex-end;"
            });
            const jsonUploadLabel = createElement("label", {
                className: "popup-button",
                textContent: "Load from JSON",
                style: "cursor: pointer; text-align: center;"
            });
            const jsonUploadInput = createElement("input", {
                type: "file",
                id: "jsonUploadInput",
                accept: ".json",
                style: "display: none"
            });
            jsonUploadLabel.appendChild(jsonUploadInput);
            jsonUploadRow.appendChild(jsonUploadLabel);
            vertexCredentialsContainer.appendChild(jsonUploadRow);
            
            chatWidgetSection.appendChild(vertexCredentialsContainer);
            
            const usageLogRow = createElement("div", {
                className: "popup-row",
                style: "display: flex; justify-content: flex-end;"
            });
            const usageLogButton = createElement("button", {
                id: "llmUsageLogBtn",
                className: "popup-button",
                textContent: "Usage Log",
                type: "button"
            });
            usageLogRow.appendChild(usageLogButton);
            chatWidgetSection.appendChild(usageLogRow);
            
            addCheckbox(chatWidgetSection, "askSelectedCheckbox", "Enable asking with selected text", settings.askSelected);
            addCheckbox(chatWidgetSection, "prependSummaryCheckbox", "Prepend a quick Summary", settings.prependSummary[language]);
            
            const difficultyOptions = [
                {value: "unset", text: "Unset"},
                {value: "A1", text: "A1"},
                {value: "A2", text: "A2"},
                {value: "B1", text: "B1"},
                {value: "B2", text: "B2"},
                {value: "C1", text: "C1"},
                {value: "C2", text: "C2"}
            ];
            const currentDifficulty = settings.summaryDifficulty[language];
            const difficultyContainer = addSelect(chatWidgetSection, "summaryDifficultySelector", "Summary Difficulty (CEFR):", difficultyOptions, currentDifficulty);
            difficultyContainer.id = "summaryDifficultySection";
            difficultyContainer.style.display = settings.prependSummary[language] ? "block" : "none";
            
            addRadioGroup(chatWidgetSection, "dbMode", "DB Type:", [
                {value: "central", text: "Built-in"},
                {value: "personal", text: "Custom"}
            ], settings.useCentralDb ? "central" : "personal");
            
            const personalDbSection = createElement("div", {id: "personalDbSection"});
            if (settings.useCentralDb) personalDbSection.style.display = "none";
            
            const dbUrlContainer = createElement("div", {
                className: "popup-row",
                style: "display: flex; justify-content: space-between; align-items: center;"
            });
            dbUrlContainer.appendChild(createElement("label", {
                htmlFor: "dbUrlInput",
                textContent: "DB URL: ",
                style: "width: 25%;"
            }));
            const dbUrlInputGroup = createElement("div", {
                style: "display: flex; align-items: center; gap: 5px; flex: 1;"
            });
            const dbUrlInput = createElement("input", {
                type: "text",
                id: "dbUrlInput",
                value: settings.dbUrl,
                className: "popup-input",
                style: "width: 70%; flex-grow: unset;"
            });
            const dbSetupGuide = createElement("a", {
                href: "https://github.com/2p990i9hpral/LingQ_Add-On?tab=readme-ov-file#supabase-db-optional",
                target: "_blank", textContent: "Setup",
                style: "font-size: 0.9em; color: var(--blue-500); margin: 0 auto;"
            });
            dbUrlInputGroup.append(dbUrlInput, dbSetupGuide);
            dbUrlContainer.appendChild(dbUrlInputGroup);
            personalDbSection.appendChild(dbUrlContainer);
            
            const dbKeyContainer = createElement("div", {
                className: "popup-row",
                style: "display: flex; justify-content: space-between; align-items: center;"
            });
            dbKeyContainer.appendChild(createElement("label", {
                htmlFor: "dbKeyInput",
                textContent: "DB Key: ",
                style: "width: 25%;"
            }));
            const dbKeyInputGroup = createElement("div", {style: "display: flex; align-items: center; gap: 5px; flex: 1;"});
            const dbKeyInput = createElement("input", {
                type: "password",
                id: "dbKeyInput",
                value: settings.dbKey,
                className: "popup-input",
                style: "width: 70%; flex-grow: unset;"
            });
            const testDBConnectionButton = createElement("button", {
                id: "testDBConnectionButton",
                textContent: "Save",
                className: "popup-button",
                style: "margin: 0 auto;"
            });
            dbKeyInputGroup.append(dbKeyInput, testDBConnectionButton);
            dbKeyContainer.appendChild(dbKeyInputGroup);
            personalDbSection.appendChild(dbKeyContainer);
            chatWidgetSection.appendChild(personalDbSection);
            
            const centralDbSection = createElement("div", {
                id: "centralDbSection",
                style: `display: ${settings.useCentralDb ? "unset" : "none"}`
            });
            
            const centralEmailRow = createElement("div", {
                    id: "centralEmailRow",
                    className: "popup-row",
                    style: `display: ${centralUserId ? "none" : "flex"}; align-items: center; gap: 5px;`
                },
                createElement("input", {
                    type: "email",
                    id: "centralEmailInput",
                    className: "popup-input",
                    style: "padding: 0 5px;",
                    placeholder: "Email"
                }),
                createElement("button", {
                    id: "sendOtpButton",
                    className: "popup-button",
                    style: "margin: 0px auto;",
                    textContent: "Send OTP"
                }));
            
            const centralOtpRow = createElement("div", {
                    id: "centralOtpRow",
                    className: "popup-row",
                    style: "display: none; align-items: center; gap: 5px;"
                },
                createElement("input", {
                    type: "text",
                    id: "centralOtpInput",
                    className: "popup-input",
                    placeholder: "Sign-in Code",
                    style: "padding: 0 5px;"
                }),
                createElement("button", {id: "verifyOtpButton", textContent: "Verify", className: "popup-button"})
            );
            
            const centralLoggedInRow = createElement("div", {
                    id: "centralLoggedInRow",
                    className: "popup-row",
                    style: `display: ${centralUserId ? "flex" : "none"}; gap: 5px; align-items: center; justify-content: space-between;`
                },
                createElement("span", {
                    id: "centralEmailDisplay",
                    textContent: centralUserEmail,
                    style: "flex-grow: 1; font-size: 0.8em; overflow-x: hidden;"
                }),
                createElement("button", {id: "signOutButton", textContent: "Logout", className: "popup-button"}));
            
            centralDbSection.append(centralEmailRow, centralOtpRow, centralLoggedInRow);
            chatWidgetSection.appendChild(centralDbSection);
            
            container2.appendChild(chatWidgetSection);
            
            addCheckbox(container2, "ttsCheckbox", "Enable AI-TTS", settings.tts);
            
            const ttsSection = createElement("div", {
                id: "ttsSection",
                className: "popup-section",
                style: `${settings.tts ? "" : "display: none"}`
            });
            
            addCheckbox(ttsSection, "ttsAutoplayCheckbox", "Autoplay TTS voice", settings.ttsAutoplay);
            
            const ttsApiKeyContainer = createElement("div", {
                className: "popup-row",
                style: "display: flex; justify-content: space-between; align-items: center;"
            });
            ttsApiKeyContainer.appendChild(createElement("label", {
                htmlFor: "ttsApiKeyInput",
                textContent: "TTS API Key:"
            }));
            
            const savedTtsKeys = settings.ttsApiKeys;
            const ttsApiKeyFlexContainer = createElement("div", {style: "display: flex; align-items: center; width: 65%;"});
            const ttsApiKeyInput = createElement("input", {
                type: "password",
                id: "ttsApiKeyInput",
                value: savedTtsKeys[settings.ttsProvider] || "",
                className: "popup-input"
            });
            ttsApiKeyFlexContainer.appendChild(ttsApiKeyInput)
            ttsApiKeyContainer.appendChild(ttsApiKeyFlexContainer);
            ttsSection.appendChild(ttsApiKeyContainer);
            
            addSelect(ttsSection, "ttsProviderSelector", "TTS Provider:", [
                {value: "openai", text: "OpenAI"},
                {value: "google gemini", text: "Google Gemini"},
                {value: "google cloud", text: "Google Cloud"},
                {value: "elevenlabs", text: "ElevenLabs"}
            ], settings.ttsProvider);
            
            const activeTtsModels = ttsModelsByProvider[settings.ttsProvider] || [];
            const activeTtsModel = activeTtsModels.some(m => m.value === settings.ttsModel)
                ? settings.ttsModel
                : (activeTtsModels[0]?.value || settings.ttsModel);
            if (activeTtsModel !== settings.ttsModel && activeTtsModels.length > 0) {
                settings.ttsModel = activeTtsModel;
            }
            const ttsModelContainer = addSelect(ttsSection, "ttsModelSelector", "Model: (Price per 1M tokens)", activeTtsModels, activeTtsModel);
            ttsModelContainer.id = "ttsModelContainer";
            ttsModelContainer.style.display = activeTtsModels.length > 0 ? "block" : "none";
            
            const currentVoiceOptions = getAvailableVoicesForProvider(settings.ttsProvider, language);
            const currentVoice = settings.ttsVoice[language];
            const validVoice = currentVoiceOptions.some(opt => opt.value === currentVoice) ? currentVoice : (currentVoiceOptions[0]?.value || "random");
            if (validVoice !== currentVoice) {
                settings.ttsVoice = {...settings.ttsVoice, [language]: validVoice};
            }
            addSelect(ttsSection, "ttsVoiceSelector", "TTS Voice:", currentVoiceOptions, validVoice);
            
            addCheckbox(ttsSection, "ttsWordCheckbox", "Enable AI-TTS for words", settings.ttsWord);
            addCheckbox(ttsSection, "ttsSentenceCheckbox", "Enable AI-TTS for sentences", settings.ttsSentence);
            container2.appendChild(ttsSection);
            
            columns.appendChild(container2);
            
            const buttonContainer = createElement("div", {
                style: "display: flex; justify-content: space-between; align-items: center;",
                className: "popup-row"
            });
            
            buttonContainer.appendChild(createElement("button", {
                id: "resetSettingsBtn",
                textContent: "Reset",
                className: "popup-button"
            }));
            
            const donationButton = createElement("a", {href: "https://www.buymeacoffee.com/mutti", target: "_blank"})
            donationButton.appendChild(createElement("img", {
                src: "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png",
                style: "width: 125px; height: 35px"
            }))
            buttonContainer.appendChild(donationButton);
            
            buttonContainer.appendChild(createElement("button", {
                id: "closeSettingsBtn",
                textContent: "Close",
                className: "popup-button"
            }));
            
            popupLayout.appendChild(columns)
            popupLayout.appendChild(buttonContainer);
            return popupLayout;
        }
        
        function createDownloadWordsPopup() {
            const popup = createElement("div", {id: "lingqDownloadWordsPopup", className: "popup"});
            
            const dragHandle = createElement("div", {
                id: "lingqDownloadWordsDragHandle",
                className: "popup-drag-handle"
            });
            
            const dragHandleTitle = createElement("h3", {textContent: "Download Words"});
            dragHandle.appendChild(dragHandleTitle);
            
            const content = createElement("div", {style: `padding: 0 10px;`});
            
            [
                {
                    id: "downloadUnknownLingqsBtn",
                    textContent: "Download Unknown LingQs (words + phrases)",
                    className: "popup-button"
                },
                {
                    id: "downloadUnknownLingqWordsBtn",
                    textContent: "Download Unknown LingQ Words (1, 2, 3, 4)",
                    className: "popup-button"
                },
                {
                    id: "downloadUnknownLingqPhrasesBtn",
                    textContent: "Download Unknown LingQ Phrases (1, 2, 3, 4)",
                    className: "popup-button"
                },
                {id: "downloadKnownLingqsBtn", textContent: "Download Known LingQs (✓)", className: "popup-button"},
                {id: "downloadKnownWordsBtn", textContent: "Download Known Words ", className: "popup-button"}
            ].forEach((prop) => {
                let rowContainer = createElement("div", {className: "popup-row"});
                rowContainer.appendChild(createElement("button", prop))
                content.appendChild(rowContainer);
            });
            
            const progressContainer = createElement("div", {id: "downloadProgressContainer", className: "popup-row"});
            const progressText = createElement("div", {id: "downloadProgressText"});
            const progressBar = createElement("progress", {id: "downloadProgressBar", value: "0", max: "100"});
            
            progressContainer.appendChild(progressText);
            progressContainer.appendChild(progressBar);
            content.appendChild(progressContainer);
            
            const buttonContainer = createElement("div", {
                style: "display: flex; justify-content: flex-end;",
                className: "popup-row"
            });
            const closeButton = createElement("button", {
                id: "closeDownloadWordsBtn",
                textContent: "Close",
                className: "popup-button"
            });
            buttonContainer.appendChild(closeButton);
            content.appendChild(buttonContainer);
            
            popup.appendChild(dragHandle);
            popup.appendChild(content);
            
            const closeTopButton = createElement("button", {
                className: "popup-close-top-btn",
                textContent: "×",
            });
            closeTopButton.addEventListener("click", () => {
                popup.style.display = "none";
            });
            popup.appendChild(closeTopButton);
            
            return popup;
        }
        
        function createTTSPlaygroundPopup() {
            const popup = createElement("div", {id: "ttsPlaygroundPopup", className: "popup"});
            
            const dragHandle = createElement("div", {id: "ttsPlaygroundDragHandle", className: "popup-drag-handle"});
            
            const dragHandleTitle = createElement("h3", {textContent: "TTS Playground"});
            dragHandle.appendChild(dragHandleTitle);
            
            const content = createElement("div", {style: `padding: 0 10px;`});
            
            const container = createElement("div", {style: "width: 550px;"});
            
            const instructionsContainer = createElement("div", {
                className: "popup-row",
                style: "display: flex; flex-direction: column;"
            });
            instructionsContainer.appendChild(createElement("label", {
                htmlFor: "ttsInstructionsInput",
                textContent: "Style Instructions"
            }));
            const ttsInstructions = createElement("input", {
                id: "ttsInstructionsInput",
                className: "popup-input",
                style: "padding: 3px 5px;",
                placeholder: `Describe the style of your dialog, e.g. "Read this in a dramatic whisper"`
            });
            instructionsContainer.appendChild(ttsInstructions);
            container.appendChild(instructionsContainer);
            
            const textContainer = createElement("div", {
                className: "popup-row",
                style: "display: flex; flex-direction: column;"
            });
            textContainer.appendChild(createElement("label", {htmlFor: "ttsTextarea", textContent: "Text"}));
            const ttsText = createElement("textarea", {
                id: "ttsTextarea",
                style: "width: 100%; height: 200px; border: 1px solid rgb(125 125 125 / 50%); border-radius: 5px; padding: 3px 5px;",
                placeholder: "Start writing or paste text here to generate speech."
            });
            textContainer.appendChild(ttsText);
            container.appendChild(textContainer);
            
            const ttsResultContainer = createElement("div", {
                style: "display: flex; justify-content: space-between; align-items: center;",
                className: "popup-row"
            });
            
            const ttsPlayer = createElement('audio', {
                id: "ttsPlayer",
                src: "",
                controls: true,
                style: "width: 400px; height: 40px; display: none;"
            });
            ttsResultContainer.appendChild(ttsPlayer);
            
            const ttsGenerateBtn = createElement("button", {
                id: "ttsGenerationButton",
                textContent: "Generate Audio",
                className: "popup-button",
                style: "margin-left: auto;"
            });
            ttsResultContainer.appendChild(ttsGenerateBtn);
            
            container.appendChild(ttsResultContainer);
            
            content.appendChild(container);
            
            const buttonContainer = createElement("div", {
                style: "display: flex; justify-content: flex-end;",
                className: "popup-row"
            });
            const closeButton = createElement("button", {
                id: "closeTTSPlaygroundBtn",
                textContent: "Close",
                className: "popup-button"
            });
            buttonContainer.appendChild(closeButton);
            content.appendChild(buttonContainer);
            
            popup.appendChild(dragHandle);
            popup.appendChild(content);
            
            const closeTopButton = createElement("button", {
                className: "popup-close-top-btn",
                textContent: "×",
            });
            closeTopButton.addEventListener("click", () => {
                popup.style.display = "none";
            });
            popup.appendChild(closeTopButton);
            
            return popup;
        }
        
        function createFlashcardPopup() {
            const paginationContainer = createElement("div", {
                    id: "flashcardPagination",
                    style: "display:flex; align-items:center; justify-content:flex-end;"
                },
                createElement("button", {
                    id: "flashcardPaginationPrev",
                    className: "popup-button",
                    disabled: true
                }, "<"),
                createElement("span", {id: "flashcardPageInfo", style: "width: 100%; margin: 0 10px; text-align: center;"}, "1/1",),
                createElement("button", {id: "flashcardPaginationNext", className: "popup-button", disabled: true}, ">")
            );
            
            const flashcardHeaders = [
                {text: "", className: "fc-col-btn"},
                {text: "Idx", className: "fc-col-idx"},
                {text: "Word", className: "fc-col-word"},
                {text: "Pronunciation", className: "fc-col-pronunciation"},
                {text: "Meaning", className: "fc-col-meaning"},
                {text: "Explanation", className: "fc-col-explanation"}
            ];

            const flashcardTableContainer = createElement("div", {id: "flashcardTableContainer"},
                createElement("table", {id: "flashcardTable"},
                    createElement("thead", {},
                        createElement("tr", {},
                            ...flashcardHeaders.map((header) =>
                                createElement("th", {className: header.className, textContent: header.text})
                            )
                        )
                    ),
                    createElement("tbody")
                )
            );
            
            const statsContainer = createElement("div", {id: "flashcardStatsContainer"},
                createElement("div", {id: "flashcardStatsHeader"},
                    createElement("span", {id: "flashcardStatsTitle"}, "Flashcards Created (Past Week)"),
                    createElement("div", {className: "flashcard-period-tabs"},
                        createElement("button", {className: "btn-ghost active", dataset: {period: "week"}}, "Week"),
                        createElement("button", {className: "btn-ghost", dataset: {period: "month"}}, "Month"),
                        createElement("button", {className: "btn-ghost", dataset: {period: "year"}}, "Year"),
                        createElement("button", {className: "btn-ghost", dataset: {period: "all"}}, "All"),
                    )
                ),
                createElement("div", {className: "flashcard-chart-wrapper"},
                    createElement("canvas", {id: "flashcardStatsChart"})
                )
            );
            
            const languageSelector = createElement("select", {
                    id: "flashcardLanguageSelector",
                    className: "popup-input",
                    style: "width: auto; min-width: 70px; margin: 0; padding: 2px 8px; font-size: 0.85em; cursor: pointer;"
                }
            );
            
            const popup = createElement("div", {id: "flashcardPopup", className: "popup"},
                createElement("div", {id: "flashcardDragHandle", className: "popup-drag-handle"},
                    createElement("h3", {textContent: "Flashcard Manager"})
                ),
                createElement("div", {style: "padding: 0 15px; width: 900px;"},
                    createElement("div", {id: "flashcardListView", style: "display: block;"},
                        createElement("div", {id: "flashcardPopupHeader"},
                            createElement("span", {id: "flashcardCount"}, "Flashcards:"),
                            createElement("div", {style: "display: flex; align-items: center; gap: 8px; margin-left: auto;"},
                                languageSelector,
                                createElement("input", {
                                    id: "flashcardSearchInput",
                                    type: "text",
                                    placeholder: "Search word or meaning..."
                                }),
                                paginationContainer
                            )
                        ),
                        flashcardTableContainer,
                        statsContainer
                    ),
                    createElement("div", {
                        id: "flashcardReportContainer",
                        style: "display: none; flex-direction: column;"
                    },
                        createElement("div", {
                            id: "flashcardReportBoardView",
                            style: "display: flex; flex-direction: column; width: 100%;"
                        },
                            createElement("div", {
                                id: "flashcardReportBoardHeader"
                            },
                                createElement("button", {
                                    id: "flashcardReportBoardBackBtn",
                                    className: "popup-button"
                                }, "← Back"),
                                createElement("div", {
                                    style: "display: flex; align-items: center; gap: 8px; margin-left: auto;"
                                },
                                    createElement("select", {
                                        id: "flashcardReportLanguageSelector",
                                        className: "popup-input",
                                        style: "width: auto; min-width: 70px; margin: 0; padding: 2px 8px; font-size: 0.85em; cursor: pointer;"
                                    }),
                                    createElement("div", {className: "split-btn-group"},
                                        createElement("button", {
                                            id: "flashcardAiReportGenerateBtn",
                                            className: "popup-button split-btn-main"
                                        }, "Generate Report"),
                                        createElement("button", {
                                            id: "flashcardAiReportDropdownBtn",
                                            className: "popup-button split-btn-dropdown"
                                        }, "▾"),
                                        createElement("div", {
                                                id: "flashcardAiReportMenu",
                                                className: "split-btn-menu",
                                                style: "display: none;"
                                            },
                                            createElement("div", {
                                                className: "split-btn-menu-item",
                                                dataset: {words: 50}
                                            }, "50 words"),
                                            createElement("div", {
                                                className: "split-btn-menu-item",
                                                dataset: {words: 100}
                                            }, "100 words"),
                                            createElement("div", {
                                                className: "split-btn-menu-item",
                                                dataset: {words: 300}
                                            }, "300 words"),
                                            createElement("div", {
                                                className: "split-btn-menu-item",
                                                dataset: {words: 500}
                                            }, "500 words")
                                        )
                                    )
                                )
                            ),
                            createElement("div", {id: "flashcardReportTableContainer"},
                                createElement("table", {id: "flashcardReportTable"},
                                    createElement("thead", {},
                                        createElement("tr", {},
                                            createElement("th", {className: "fc-rep-col-btn", textContent: ""}),
                                            createElement("th", {className: "fc-rep-col-no", textContent: "#"}),
                                            createElement("th", {className: "fc-rep-col-lang", textContent: "Lang"}),
                                            createElement("th", {className: "fc-rep-col-range", textContent: "Word Range"}),
                                            createElement("th", {className: "fc-rep-col-words", textContent: "Words"}),
                                            createElement("th", {className: "fc-rep-col-overview", textContent: "Overview"}),
                                            createElement("th", {className: "fc-rep-col-date", textContent: "Date"})
                                        )
                                    ),
                                    createElement("tbody", {id: "flashcardReportTableBody"})
                                )
                            )
                        ),
                        createElement("div", {
                            id: "flashcardReportDetailView",
                            style: "display: none; flex-direction: column; width: 100%;"
                        },
                            createElement("div", {
                                id: "flashcardReportHeaderRow"
                            },
                                createElement("button", {
                                    id: "flashcardReportBackBtn",
                                    className: "popup-button"
                                }, "← Back"),
                                createElement("button", {
                                    id: "flashcardDownloadReportBtn",
                                    className: "popup-button",
                                    disabled: true
                                }, "Download the Report")
                            ),
                            createElement("div", {
                                id: "flashcardReportBody"
                            })
                        )
                    ),
                    createElement("div", {
                            className: "popup-row",
                            style: "display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 10px 0;"
                        },
                        createElement("div", {
                            id: "flashcardAnkiDeckContainer",
                            style: "display: flex; align-items: center; gap: 8px;"
                        },
                            createElement("label", {
                                htmlFor: "flashcardAnkiDeckSelector",
                                textContent: "Deck:",
                                style: "font-size: 0.85em; font-weight: 500; white-space: nowrap;"
                            }),
                            createElement("select", {
                                id: "flashcardAnkiDeckSelector",
                                className: "popup-input",
                                style: "width: auto; min-width: 110px; max-width: 135px; padding: 2px 6px; font-size: 0.85em; cursor: pointer; margin: 0; text-overflow: ellipsis; overflow: hidden;"
                            },
                                createElement("option", {value: "", textContent: "Select Deck"})
                            ),
                            createElement("span", {
                                id: "flashcardAnkiStatus",
                                style: "font-size: 0.8em; color: var(--text-muted, #888); white-space: nowrap;"
                            }, "")
                        ),
                        createElement("div", {
                            style: "display: flex; align-items: center; gap: 10px; flex-shrink: 0; white-space: nowrap;"
                        },
                            createElement("button", {
                                id: "flashcardAiReportBtn",
                                className: "popup-button"
                            }, "AI Report"),
                            createElement("button", {
                                id: "flashcardCsvDownload",
                                className: "popup-button"
                            }, "Export as CSV"),
                            createElement("button", {
                                id: "flashcardAnkiSyncBtn",
                                className: "popup-button"
                            }, "Sync to Anki"),
                            createElement("button", {id: "closeFlashcardPopupBtn", className: "popup-button"}, "Close")
                        )
                    )
                )
            );
            
            const closeTopButton = createElement("button", {
                className: "popup-close-top-btn",
                textContent: "×",
            });
            closeTopButton.addEventListener("click", () => {
                popup.style.display = "none";
            });
            popup.appendChild(closeTopButton);
            
            return popup;
        }
        
        function createLLMUsagePopup() {
            const languageSelector = createElement("select", {
                    id: "llmUsageLanguageSelector",
                    className: "popup-input",
                    style: "width: auto; min-width: 80px; margin: 0; padding: 2px 8px; font-size: 0.85em; cursor: pointer;"
                },
                createElement("option", {value: "all"}, "All")
            );
            
            const statsContainer = createElement("div", {id: "llmUsageStatsContainer", className: "popup-section"},
                createElement("div", {
                        id: "llmUsageStatsHeader",
                        className: "popup-row",
                        style: "display: flex; justify-content: space-between; align-items: center;"
                    },
                    createElement("span", {
                        id: "llmUsageStatsTitle",
                        style: "font-size: 0.95em; font-weight: bold;"
                    }, "LLM Usage Cost (Past Week)"),
                    createElement("div", {style: "display: flex; align-items: center; gap: 8px;"},
                        createElement("div", {className: "flashcard-period-tabs llm-usage-mode-tabs"},
                            createElement("button", {className: "btn-ghost active", dataset: {mode: "cost"}}, "Cost"),
                            createElement("button", {className: "btn-ghost", dataset: {mode: "tokens"}}, "Tokens")
                        ),
                        languageSelector,
                        createElement("div", {className: "flashcard-period-tabs llm-usage-period-tabs"},
                            createElement("button", {className: "btn-ghost active", dataset: {period: "week"}}, "Week"),
                            createElement("button", {className: "btn-ghost", dataset: {period: "month"}}, "Month"),
                            createElement("button", {className: "btn-ghost", dataset: {period: "year"}}, "Year"),
                            createElement("button", {className: "btn-ghost", dataset: {period: "all"}}, "All")
                        )
                    )
                ),
                createElement("div", {
                        className: "flashcard-chart-wrapper",
                        style: "height: 350px; width: 100%; margin-top: 10px;"
                    },
                    createElement("canvas", {id: "llmUsageStatsChart"})
                )
            );
            
            const popup = createElement("div", {id: "llmUsagePopup", className: "popup"},
                createElement("div", {id: "llmUsageDragHandle", className: "popup-drag-handle"},
                    createElement("h3", {textContent: "LLM Usage Log"})
                ),
                createElement("div", {style: "padding: 0 15px; width: 800px;"},
                    statsContainer,
                    createElement("div", {id: "llmUsageRecentLogsContainer"}),
                    createElement("div", {
                            className: "popup-row",
                            style: "display: flex; justify-content: space-between; align-items: center; margin: 15px 0 10px;"
                        },
                        createElement("span", {
                            id: "llmUsageTotalSummary",
                            style: "font-size: 0.9em; opacity: 0.85;"
                        }, "Total: $0.0000 (0 requests)"),
                        createElement("div", {style: "display: flex; gap: 8px; align-items: center;"},
                            createElement("button", {id: "exportLLMUsageBtn", className: "popup-button"}, "Export"),
                            createElement("label", {
                                    id: "importLLMUsageLabel",
                                    className: "popup-button",
                                    style: "cursor: pointer; margin: 0; display: inline-flex; align-items: center;"
                                },
                                "Import",
                                createElement("input", {
                                    type: "file",
                                    id: "importLLMUsageInput",
                                    accept: ".json",
                                    style: "display: none;"
                                })
                            ),
                            createElement("button", {id: "clearLLMUsageBtn", className: "popup-button"}, "Clear Log"),
                            createElement("button", {id: "closeLLMUsagePopupBtn", className: "popup-button"}, "Close")
                        )
                    )
                )
            );
            
            const closeTopButton = createElement("button", {className: "popup-close-top-btn", textContent: "×"});
            closeTopButton.addEventListener("click", () => {
                popup.style.display = "none";
            });
            popup.appendChild(closeTopButton);
            
            return popup;
        }
        
        let highestPopupZIndex = 10000;
        
        function bringPopupToFront(element) {
            if (!element) return;
            highestPopupZIndex += 1;
            element.style.zIndex = highestPopupZIndex;
        }
        
        function ensurePopupInViewport(element) {
            if (!element || element.style.display === "none") return;
            if (!element.style.left || !element.style.top) return;
            if (element.style.transform && element.style.transform.includes('translate')) return;
            
            const rect = element.getBoundingClientRect();
            const margin = 10;
            const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
            const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
            
            let currentLeft = parseFloat(element.style.left);
            let currentTop = parseFloat(element.style.top);
            if (isNaN(currentLeft)) currentLeft = rect.left;
            if (isNaN(currentTop)) currentTop = rect.top;
            
            const clampedLeft = Math.min(Math.max(margin, currentLeft), maxLeft);
            const clampedTop = Math.min(Math.max(margin, currentTop), maxTop);
            
            element.style.left = `${clampedLeft}px`;
            element.style.top = `${clampedTop}px`;
        }
        
        function makeDraggable(element, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            if (!element.dataset.popupFocusBound) {
                element.addEventListener("mousedown", () => {
                    bringPopupToFront(element);
                });
                element.dataset.popupFocusBound = "true";
            }
            
            if (handle) {
                handle.onmousedown = dragMouseDown;
            } else {
                element.onmousedown = dragMouseDown;
            }
            
            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                
                bringPopupToFront(element);
                
                const computedTransform = window.getComputedStyle(element).transform;
                if (element.style.transform?.includes('translate') || (computedTransform && computedTransform !== 'none' && !element.style.left)) {
                    const rect = element.getBoundingClientRect();
                    
                    element.style.transform = 'none';
                    element.style.top = `${rect.top}px`;
                    element.style.left = `${rect.left}px`;
                }
                
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
            
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                
                const margin = 10;
                const maxLeft = Math.max(margin, window.innerWidth - element.offsetWidth - margin);
                const maxTop = Math.max(margin, window.innerHeight - element.offsetHeight - margin);
                const targetTop = element.offsetTop - pos2;
                const targetLeft = element.offsetLeft - pos1;
                
                element.style.top = `${Math.min(Math.max(margin, targetTop), maxTop)}px`;
                element.style.left = `${Math.min(Math.max(margin, targetLeft), maxLeft)}px`;
            }
            
            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                ensurePopupInViewport(element);
            }
        }
        
        function setupSettingEventListeners() {
            function initializePickrs() {
                function setupRGBAPickr(pickerId, textId, settingKey, cssVar) {
                    function saveColorSetting(key, value) {
                        const currentColorMode = document.querySelector('input[name="colorMode"]:checked')?.value;
                        const prefix = currentColorMode === "dark" ? "dark_" : "white_";
                        settings[prefix + key] = value;
                    }
                    
                    const pickerElement = document.getElementById(pickerId);
                    const textElement = document.getElementById(textId);
                    
                    if (!pickerElement || !textElement) return;
                    
                    pickerElement.style.backgroundColor = textElement.value;
                    
                    const pickr = Pickr.create({
                        el: pickerElement,
                        theme: 'nano',
                        useAsButton: true,
                        default: textElement.value,
                        components: {preview: true, opacity: true, hue: true}
                    });
                    
                    pickr.on('change', (color) => {
                        const rgbaColor = color.toRGBA();
                        
                        const r = Math.round(rgbaColor[0]);
                        const g = Math.round(rgbaColor[1]);
                        const b = Math.round(rgbaColor[2]);
                        const a = rgbaColor[3];
                        
                        const roundedRGBA = `rgba(${r}, ${g}, ${b}, ${a})`;
                        
                        textElement.value = roundedRGBA;
                        pickerElement.style.backgroundColor = roundedRGBA;
                        document.documentElement.style.setProperty(cssVar, roundedRGBA);
                        
                        saveColorSetting(settingKey, roundedRGBA);
                    });
                    
                    textElement.addEventListener('change', function () {
                        const rgbaColor = this.value;
                        
                        pickr.setColor(this.value);
                        saveColorSetting(settingKey, rgbaColor);
                        document.documentElement.style.setProperty(cssVar, rgbaColor);
                        pickerElement.style.backgroundColor = rgbaColor;
                    });
                    
                    pickr.on('hide', () => {
                        const rgbaColor = pickr.getColor().toRGBA().toString();
                        pickerElement.style.backgroundColor = rgbaColor;
                    });
                }
                
                return new Promise((resolve) => {
                    const pickrCss = createElement('link', {
                        rel: 'stylesheet',
                        href: 'https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css'
                    });
                    document.head.appendChild(pickrCss);
                    
                    const pickrScript = createElement('script', {
                        src: 'https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js',
                        onload: () => resolve() // Pass function reference directly
                    });
                    document.head.appendChild(pickrScript);
                }).then(() => {
                    setupRGBAPickr('lingqBackgroundPicker', 'lingqBackgroundText', 'lingqBackground', '--lingq-background');
                    setupRGBAPickr('lingqBorderPicker', 'lingqBorderText', 'lingqBorder', '--lingq-border');
                    setupRGBAPickr('lingqBorderLearnedPicker', 'lingqBorderLearnedText', 'lingqBorderLearned', '--lingq-border-learned');
                    setupRGBAPickr('unknownBackgroundPicker', 'unknownBackgroundText', 'unknownBackground', '--unknown-background');
                    setupRGBAPickr('unknownBorderPicker', 'unknownBorderText', 'unknownBorder', '--unknown-border');
                    setupRGBAPickr('fontColorPicker', 'fontColorText', 'fontColor', '--font-color');
                    setupRGBAPickr('translationFontColorPicker', 'translationFontColorText', 'translationFontColor', '--translation-font-color');
                    setupRGBAPickr('playingUnderlinePicker', 'playingUnderlineText', 'playingUnderline', '--is-playing-underline');
                });
            }
            
            function updateColorInputs(colorSettings) {
                document.getElementById("fontColorText").value = colorSettings.fontColor;
                document.getElementById("translationFontColorText").value = colorSettings.translationFontColor;
                document.getElementById("lingqBackgroundText").value = colorSettings.lingqBackground;
                document.getElementById("lingqBorderText").value = colorSettings.lingqBorder;
                document.getElementById("lingqBorderLearnedText").value = colorSettings.lingqBorderLearned;
                document.getElementById("unknownBackgroundText").value = colorSettings.unknownBackground;
                document.getElementById("unknownBorderText").value = colorSettings.unknownBorder;
                document.getElementById("playingUnderlineText").value = colorSettings.playingUnderline;
                
                const fontColorPicker = document.getElementById("fontColorPicker");
                if (fontColorPicker) fontColorPicker.style.backgroundColor = colorSettings.fontColor;
                
                const translationFontColorPicker = document.getElementById("translationFontColorPicker");
                if (translationFontColorPicker) translationFontColorPicker.style.backgroundColor = colorSettings.translationFontColor;
                
                const playingUnderlinePicker = document.getElementById("playingUnderlinePicker");
                if (playingUnderlinePicker) playingUnderlinePicker.style.backgroundColor = colorSettings.playingUnderline;
            }
            
            function updateColorPickerBackgrounds(colorSettings) {
                const pickerIds = [
                    {id: "lingqBackgroundPicker", color: colorSettings.lingqBackground},
                    {id: "lingqBorderPicker", color: colorSettings.lingqBorder},
                    {id: "lingqBorderLearnedPicker", color: colorSettings.lingqBorderLearned},
                    {id: "unknownBackgroundPicker", color: colorSettings.unknownBackground},
                    {id: "unknownBorderPicker", color: colorSettings.unknownBorder},
                    {id: "fontColorPicker", color: colorSettings.fontColor},
                    {id: "translationFontColorPicker", color: colorSettings.translationFontColor},
                    {id: "playingUnderlinePicker", color: colorSettings.playingUnderline}
                ];
                
                pickerIds.forEach(item => {
                    const picker = document.getElementById(item.id);
                    if (picker) {
                        picker.style.backgroundColor = item.color;
                    }
                });
            }
            
            function updateCssColorVariables(colorSettings) {
                document.documentElement.style.setProperty("--font-color", colorSettings.fontColor);
                document.documentElement.style.setProperty("--translation-font-color", colorSettings.translationFontColor);
                document.documentElement.style.setProperty("--lingq-background", colorSettings.lingqBackground);
                document.documentElement.style.setProperty("--lingq-border", colorSettings.lingqBorder);
                document.documentElement.style.setProperty("--lingq-border-learned", colorSettings.lingqBorderLearned);
                document.documentElement.style.setProperty("--unknown-background", colorSettings.unknownBackground);
                document.documentElement.style.setProperty("--unknown-border", colorSettings.unknownBorder);
                document.documentElement.style.setProperty("--is-playing-underline", colorSettings.playingUnderline);
            }
            
            function updateColorMode(event) {
                event.stopPropagation();
                
                const selectedColorMode = event.currentTarget.value;
                settings.colorMode = selectedColorMode;
                document.documentElement.style.setProperty("--background-color", selectedColorMode === "dark" ? "#2a2c2e" : "#ffffff");
                
                const colorSettings = getColorSettings(selectedColorMode);
                
                updateColorInputs(colorSettings);
                updateCssColorVariables(colorSettings);
                updateColorPickerBackgrounds(colorSettings);
            }
            
            function setupSlider(sliderId, valueId, settingKey, unit, cssVar, valueTransform) {
                const slider = document.getElementById(sliderId);
                const valueDisplay = document.getElementById(valueId);
                
                slider.addEventListener("input", function () {
                    const value = parseFloat(this.value);
                    const transformedValue = valueTransform(value);
                    
                    valueDisplay.textContent = transformedValue.toString().replace(unit, '');
                    
                    settings[settingKey] = (settingKey in languageScopedDefaults) ?
                        {...settings[settingKey], [language]: value} : value;
                    
                    document.documentElement.style.setProperty(cssVar, transformedValue);
                });
            }
            
            const settingsButton = document.getElementById('lingqAddonSettings');
            const settingsPopup = document.getElementById('lingqAddonSettingsPopup');
            settingsButton.addEventListener("click", () => {
                settingsPopup.style.display = "block";
                bringPopupToFront(settingsPopup);
                ensurePopupInViewport(settingsPopup);
                initializePickrs();
                
                const dragHandle = document.getElementById("lingqAddonSettingsDragHandle");
                makeDraggable(settingsPopup, dragHandle);
            });
            
            const styleTypeSelector = document.getElementById("styleTypeSelector");
            const videoPositionSelector = document.getElementById("videoPositionSelector");
            const positionSettingsContainer = document.getElementById("positionSettingsContainer");
            
            function handleStyleSelectorChange() {
                const baseType = styleTypeSelector.value;
                const position = videoPositionSelector.value;
                const hasPositionSettings = baseType !== "off";
                
                settings.styleType = {...settings.styleType, [language]: baseType};
                settings.videoPosition = {...settings.videoPosition, [language]: position};
                
                positionSettingsContainer.style.display = hasPositionSettings ? "block" : "none";
                document.getElementById("videoSettings").style.display = hasPositionSettings && ["Top", "Bottom"].includes(position) ? "block" : "none";
            }
            
            styleTypeSelector.addEventListener("change", handleStyleSelectorChange);
            videoPositionSelector.addEventListener("change", handleStyleSelectorChange);
            
            setupSlider("heightBigSlider", "heightBigValue", "heightBig", "px", "--height-big", (val) => `${val}px`);
            setupSlider("widgetWidthSlider", "widgetWidthValue", "widgetWidth", "px", "--widget-width", (val) => `${val}px`);
            setupSlider("fontSizeSlider", "fontSizeValue", "fontSize", "rem", "--font-size", (val) => `${val}rem`);
            setupSlider("annotationScaleSlider", "annotationScaleValue", "annotationScale", "%", "--annotation-size", (val) => `${val}%`);
            setupSlider("lineHeightSlider", "lineHeightValue", "lineHeight", "", "--line-height", (val) => val);
            
            const customFontInput = document.getElementById("customFontInput");
            customFontInput.addEventListener("change", (event) => {
                const value = event.target.value;
                settings.customFont = {...settings.customFont, [language]: value};
                applyCustomFont(value);
            });
            
            document.querySelectorAll('input[name="colorMode"]').forEach((radio) => {
                radio.addEventListener("change", updateColorMode);
            });
            
            const focusSelectedTextCheckbox = document.getElementById("focusSelectedTextCheckbox");
            focusSelectedTextCheckbox.addEventListener('change', (event) => {
                settings.focusSelectedText = event.target.checked
            });
            
            document.querySelectorAll('input[name="hoverAnnotation"]').forEach((radio) => {
                radio.addEventListener("change", (event) => {
                    settings.hoverAnnotation = event.currentTarget.value;
                });
            });
            
            const skipEndPageCheckbox = document.getElementById("skipEndPageCheckbox");
            skipEndPageCheckbox.addEventListener('change', (event) => {
                settings.skipEndPage = event.target.checked;
            });
            
            document.querySelectorAll('input[name="relocateCaption"]').forEach((radio) => {
                radio.addEventListener("change", (event) => {
                    settings.relocateCaption = event.currentTarget.value;
                });
            });
            
            document.querySelectorAll('input[name="widgetVerticalAlign"]').forEach((radio) => {
                radio.addEventListener("change", (event) => {
                    settings.widgetVerticalAlign = event.currentTarget.value;
                });
            });
            
            setupSlider("captionFontsizeSlider", "captionFontsizeValue", "captionFontsize", "px", "--caption-font-size", (val) => `${val}px`);
            
            const showMemoWidgetCheckbox = document.getElementById("showMemoWidgetCheckbox");
            showMemoWidgetCheckbox.addEventListener('change', (event) => {
                settings.showMemoWidget = event.target.checked;
            });

            [
                {id: "hidePopularMeaningsCheckbox", key: "hidePopularMeanings"},
                {id: "hideDictionariesCheckbox", key: "hideDictionaries"},
                {id: "hideSentenceSectionCheckbox", key: "hideSentenceSection"},
                {id: "hideReaderPopupCheckbox", key: "hideReaderPopup"},
                {id: "hideLynxUICheckbox", key: "hideLynxUI"}
            ].forEach(({id, key}) => {
                document.getElementById(id)?.addEventListener("change", (event) => {
                    settings[key] = event.target.checked;
                });
            });
            
            function setupShortcutInput(inputId, settingKey) {
                const input = document.getElementById(inputId);
                if (!input) return;
                
                input.addEventListener("input", function () {
                    const allowedPattern = /^[a-z0-9`~!@#$%^&*()_+=-]*$/;
                    
                    let value = this.value.toLowerCase();
                    
                    if (!allowedPattern.test(value)) {
                        this.value = "";
                        return;
                    }
                    
                    if (value.length > 1) {
                        value = value.at(-1);
                        this.value = value;
                    }
                    
                    settings[settingKey] = value;
                });
            }
            
            const keyboardShortcutCheckbox = document.getElementById("keyboardShortcutCheckbox");
            keyboardShortcutCheckbox.addEventListener('change', (event) => {
                const checked = event.target.checked;
                document.getElementById("keyboardShortcutSection").style.display = checked ? "block" : "none";
                settings.keyboardShortcut = checked;
            });
            
            const skipDurationSlider = document.getElementById("skipDurationSlider");
            const skipDurationValue = document.getElementById("skipDurationValue");
            if (skipDurationSlider) {
                skipDurationSlider.addEventListener("input", function () {
                    const val = parseFloat(this.value);
                    if (skipDurationValue) skipDurationValue.textContent = val;
                    settings.skipDuration = val;
                    
                    const backwardLabel = document.querySelector('label[for="shortcutBackward5sInput"]');
                    if (backwardLabel) backwardLabel.textContent = `Rewind ${val}s:`;
                    const forwardLabel = document.querySelector('label[for="shortcutForward5sInput"]');
                    if (forwardLabel) forwardLabel.textContent = `Fast Forward ${val}s:`;
                    
                    window.dispatchEvent(new CustomEvent("addon:skip-duration-changed", { detail: val }));
                });
            }
            
            setupShortcutInput("shortcutVideoFullscreenInput", "shortcutVideoFullscreen");
            setupShortcutInput("shortcutBackward5sInput", "shortcutBackward5s");
            setupShortcutInput("shortcutForward5sInput", "shortcutForward5s");
            setupShortcutInput("shortcutTTSPlayInput", "shortcutTTSPlay");
            setupShortcutInput("shortcutTranslatorOpenInput", "shortcutTranslator");
            setupShortcutInput("shortcutMakeKnownInput", "shortcutMakeKnown");
            setupShortcutInput("shortcutDictionaryOpenInput", "shortcutDictionary");
            setupShortcutInput("shortcutCopySelectedInput", "shortcutCopySelected");
            setupShortcutInput("shortcutMeaningInput", "shortcutMeaningInput");
            setupShortcutInput("shortcutChatInput", "shortcutChatInput");
            setupShortcutInput("shortcutFlashcard", "shortcutFlashcard");
            
            const chatWidgetCheckbox = document.getElementById("chatWidgetCheckbox");
            chatWidgetCheckbox.addEventListener('change', (event) => {
                const checked = event.target.checked;
                document.getElementById("chatWidgetSection").style.display = checked ? "block" : "none";
                settings.chatWidget = checked;
            });
            
            setupSlider("chatWidgetHeightSlider", "chatWidgetHeightValue", "chatWidgetHeight", "px", "--chat-widget-height", (val) => `${val}px`);
            
            const llmProviderSelector = document.getElementById("llmProviderSelector");
            const llmModelSelector = document.getElementById("llmModelSelector");
            const llmApiKeyInput = document.getElementById("llmApiKeyInput");
            
            llmProviderSelector.addEventListener("change", (event) => {
                const provider = event.target.value;
                settings.llmProvider = provider;
                
                llmModelSelector.innerHTML = "";
                const models = llmModelsByProvider[provider] || [];
                models.forEach((model) => {
                    llmModelSelector.appendChild(createElement("option", {
                        value: model.value,
                        textContent: model.text
                    }));
                });
                
                const savedModels = settings.llmModels;
                const targetModel = savedModels[provider] || (models[0]?.value || "");
                
                settings.llmModel = targetModel;
                llmModelSelector.value = targetModel;
                
                const savedKeys = settings.llmApiKeys;
                llmApiKeyInput.value = savedKeys[provider] || "";
                
                const isVertex = provider === "vertex";
                const vertexCredentialsContainer = document.getElementById("vertexCredentialsContainer");
                if (vertexCredentialsContainer) {
                    vertexCredentialsContainer.style.display = isVertex ? "block" : "none";
                }
                const apiKeyContainer = llmApiKeyInput.closest(".popup-row");
                if (apiKeyContainer) {
                    apiKeyContainer.style.display = isVertex ? "none" : "flex";
                }
            });
            
            llmModelSelector.addEventListener("change", (event) => {
                const model = event.target.value;
                settings.llmModel = model;
                const provider = settings.llmProvider;
                
                settings.llmModels = {
                    ...settings.llmModels,
                    [provider]: model
                };
            });
            
            llmApiKeyInput.addEventListener("change", (event) => {
                const provider = settings.llmProvider;
                
                settings.llmApiKeys = {
                    ...settings.llmApiKeys,
                    [provider]: event.target.value
                };
            });
            
            const llmResponseLanguageSelector = document.getElementById("llmResponseLanguageSelector");
            if (llmResponseLanguageSelector) {
                getDictionaryLocalePairs().then((localePairs) => {
                    if (!localePairs) return;
                    const currentLang = settings.llmResponseLanguage;
                    const languageNames = Object.values(localePairs).sort((a, b) => a.localeCompare(b));
                    
                    llmResponseLanguageSelector.innerHTML = "";
                    llmResponseLanguageSelector.appendChild(createElement("option", {
                        value: "auto",
                        textContent: "Auto"
                    }));
                    languageNames.forEach((langName) => {
                        llmResponseLanguageSelector.appendChild(createElement("option", {
                            value: langName,
                            textContent: langName,
                            selected: currentLang === langName
                        }));
                    });
                    llmResponseLanguageSelector.value = currentLang;
                }).catch(console.error);
                
                llmResponseLanguageSelector.addEventListener("change", (event) => {
                    settings.llmResponseLanguage = event.target.value;
                });
            }
            
            const askSelectedCheckbox = document.getElementById("askSelectedCheckbox");
            askSelectedCheckbox.addEventListener('change', (event) => {
                settings.askSelected = event.target.checked
            });
            
            const prependSummaryCheckbox = document.getElementById("prependSummaryCheckbox");
            prependSummaryCheckbox.addEventListener('change', (event) => {
                settings.prependSummary = {...settings.prependSummary, [language]: event.target.checked};
                const difficultySection = document.getElementById("summaryDifficultySection");
                if (difficultySection) {
                    difficultySection.style.display = event.target.checked ? "block" : "none";
                }
            });
            
            const summaryDifficultySelector = document.getElementById("summaryDifficultySelector");
            if (summaryDifficultySelector) {
                summaryDifficultySelector.addEventListener('change', (event) => {
                    settings.summaryDifficulty = {...settings.summaryDifficulty, [language]: event.target.value};
                });
            }
            
            document.querySelectorAll('input[name="dbMode"]').forEach((radio) => {
                radio.addEventListener("change", (event) => {
                    const isCentralDb = event.currentTarget.value === "central";
                    
                    settings.useCentralDb = isCentralDb;
                    document.getElementById("personalDbSection").style.display = isCentralDb ? "none" : "";
                    document.getElementById("centralDbSection").style.display = isCentralDb ? "" : "none";
                });
            });
            
            const dbUrlInput = document.getElementById("dbUrlInput");
            dbUrlInput.addEventListener("change", (event) => {
                settings.dbUrl = event.target.value;
            });
            
            const dbKeyInput = document.getElementById("dbKeyInput");
            dbKeyInput.addEventListener("change", (event) => {
                settings.dbKey = event.target.value;
            });
            
            const testDBConnectionButton = document.getElementById("testDBConnectionButton");
            testDBConnectionButton.addEventListener("click", async () => {
                if (!settings.dbUrl || !settings.dbKey) {
                    alert("Please enter both Supabase URL and Key.");
                    return;
                }
                try {
                    const supabaseTest = createClient(settings.dbUrl, settings.dbKey);
                    const {data, error} = await supabaseTest.from(getTableName()).select("*").limit(1);
                    if (error) {
                        console.error("Connection test error:", error);
                        alert("❌ Invalid Supabase credentials or unable to connect.");
                    } else {
                        supabaseClient = supabaseTest;
                        alert("✅ Supabase connection successful!");
                    }
                } catch (err) {
                    console.error("Unexpected connection test error:", err);
                    alert("❌ Connection failed. Please check URL and API key.");
                }
            });
            
            let otpEmail = "";
            
            document.getElementById("sendOtpButton").addEventListener("click", async (event) => {
                const email = document.getElementById("centralEmailInput").value.trim();
                if (!email) return;
                
                const sendOtpBtn = event.currentTarget;
                sendOtpBtn.disabled = true;
                
                const {error} = await centralClient.auth.signInWithOtp({email});
                if (error) {
                    alert(`❌ ${error.message}`);
                    sendOtpBtn.disabled = false;
                    return;
                }
                
                otpEmail = email;
                document.getElementById("centralEmailRow").style.display = "none";
                document.getElementById("centralOtpRow").style.display = "flex";
            });
            
            document.getElementById("verifyOtpButton").addEventListener("click", async (event) => {
                const token = document.getElementById("centralOtpInput").value.trim();
                if (!token) return;
                
                const verifyOtpBtn = event.currentTarget;
                verifyOtpBtn.disabled = true;
                
                const {data, error} = await centralClient.auth.verifyOtp({email: otpEmail, token, type: "email"});
                if (error) {
                    alert(`❌ ${error.message}`);
                    verifyOtpBtn.disabled = false;
                    return;
                }
                
                document.getElementById("centralOtpRow").style.display = "none";
                document.getElementById("centralLoggedInRow").style.display = "flex";
                document.getElementById("centralEmailDisplay").textContent = centralUserEmail;
            });
            
            document.getElementById("signOutButton").addEventListener("click", async () => {
                await centralClient.auth.signOut();
                otpEmail = "";
                document.getElementById("sendOtpButton").disabled = false;
                document.getElementById("verifyOtpButton").disabled = false;
                document.getElementById("centralLoggedInRow").style.display = "none";
                document.getElementById("centralEmailRow").style.display = "flex";
                document.getElementById("centralEmailInput").value = "";
                document.getElementById("centralOtpInput").value = "";
            });
            
            const ttsCheckbox = document.getElementById("ttsCheckbox");
            ttsCheckbox.addEventListener('change', (event) => {
                const checked = event.target.checked;
                document.getElementById("ttsSection").style.display = checked ? "block" : "none";
                settings.tts = checked;
            });
            
            const ttsAutoplayCheckbox = document.getElementById("ttsAutoplayCheckbox");
            ttsAutoplayCheckbox.addEventListener('change', (event) => {
                settings.ttsAutoplay = event.target.checked
            });
            
            const ttsApiKeyInput = document.getElementById("ttsApiKeyInput");
            ttsApiKeyInput.addEventListener("change", (event) => {
                const provider = settings.ttsProvider;
                settings.ttsApiKeys = {
                    ...settings.ttsApiKeys,
                    [provider]: event.target.value
                };
            });
            
            const ttsVoiceSelector = document.getElementById("ttsVoiceSelector");
            ttsVoiceSelector.addEventListener("change", (event) => {
                settings.ttsVoice = {...settings.ttsVoice, [language]: event.target.value};
            });
            
            const ttsProviderSelector = document.getElementById("ttsProviderSelector");
            const ttsModelSelector = document.getElementById("ttsModelSelector");
            const ttsModelContainer = document.getElementById("ttsModelContainer");
            
            ttsProviderSelector.addEventListener("change", (event) => {
                const provider = event.target.value;
                settings.ttsProvider = provider;
                
                const savedTtsKeys = settings.ttsApiKeys;
                ttsApiKeyInput.value = savedTtsKeys[provider] || "";
                
                ttsVoiceSelector.innerHTML = "";
                const newVoiceOptions = getAvailableVoicesForProvider(provider, language);
                newVoiceOptions.forEach(option => {
                    ttsVoiceSelector.appendChild(createElement("option", {
                        value: option.value,
                        textContent: option.text
                    }));
                });
                
                const currentVoice = settings.ttsVoice[language];
                const isValidVoice = newVoiceOptions.some(opt => opt.value === currentVoice);
                const nextVoice = isValidVoice ? currentVoice : (newVoiceOptions[0]?.value || "random");
                settings.ttsVoice = {...settings.ttsVoice, [language]: nextVoice};
                ttsVoiceSelector.value = nextVoice;
                
                const models = ttsModelsByProvider[provider] || [];
                if (models.length > 0) {
                    ttsModelSelector.innerHTML = "";
                    models.forEach(model => {
                        ttsModelSelector.appendChild(createElement("option", {
                            value: model.value,
                            textContent: model.text
                        }));
                    });
                    const targetModel = models.some(m => m.value === settings.ttsModel) ? settings.ttsModel : (models[0]?.value || "");
                    settings.ttsModel = targetModel;
                    ttsModelSelector.value = targetModel;
                    if (ttsModelContainer) ttsModelContainer.style.display = "block";
                } else {
                    if (ttsModelContainer) ttsModelContainer.style.display = "none";
                }
            });
            
            if (ttsModelSelector) {
                ttsModelSelector.addEventListener("change", (event) => {
                    settings.ttsModel = event.target.value;
                });
            }
            
            const ttsWordCheckbox = document.getElementById("ttsWordCheckbox");
            ttsWordCheckbox.addEventListener('change', (event) => {
                settings.ttsWord = event.target.checked
            });
            
            const ttsSentenceCheckbox = document.getElementById("ttsSentenceCheckbox");
            ttsSentenceCheckbox.addEventListener('change', (event) => {
                settings.ttsSentence = event.target.checked
            });
            
            function resetSettings() {
                if (!confirm("Reset all settings to default?")) return;
                
                const currentColorMode = document.querySelector('input[name="colorMode"]:checked')?.value;
                const defaultColorSettings = getColorSettings(currentColorMode);
                
                document.getElementById("styleTypeSelector").value = languageScopedDefaults.styleType;
                document.getElementById("heightBigSlider").value = defaults.heightBig;
                document.getElementById("heightBigValue").textContent = defaults.heightBig;
                document.getElementById("widgetWidthSlider").value = defaults.widgetWidth;
                document.getElementById("widgetWidthValue").value = defaults.widgetWidth;
                document.getElementById("fontSizeSlider").value = defaults.fontSize;
                document.getElementById("fontSizeValue").textContent = defaults.fontSize;
                document.getElementById("annotationScaleSlider").value = languageScopedDefaults.annotationScale;
                document.getElementById("annotationScaleValue").textContent = languageScopedDefaults.annotationScale;
                document.getElementById("lineHeightSlider").value = defaults.lineHeight;
                document.getElementById("lineHeightValue").textContent = defaults.lineHeight;
                document.getElementById("customFontInput").value = defaults.customFont;
                
                updateColorInputs(defaultColorSettings);
                updateColorPickerBackgrounds(defaultColorSettings);
                
                const defaultHasPos = languageScopedDefaults.styleType !== "off";
                document.getElementById("positionSettingsContainer").style.display = defaultHasPos ? "block" : "none";
                document.getElementById("videoSettings").style.display = defaultHasPos && ["Top", "Bottom"].includes(languageScopedDefaults.videoPosition) ? "block" : "none";
                
                document.documentElement.style.setProperty("--font-size", `${defaults.fontSize}rem`);
                document.documentElement.style.setProperty("--annotation-size", `${languageScopedDefaults.annotationScale}%`);
                document.documentElement.style.setProperty("--line-height", defaults.lineHeight);
                document.documentElement.style.setProperty("--height-big", `${defaults.heightBig}px`);
                document.documentElement.style.setProperty("--custom-font", defaults.lineHeight);
                document.documentElement.style.setProperty("--widget-width", `${defaults.widgetWidth}px`);
                updateCssColorVariables(defaultColorSettings);
                
                document.getElementById("focusSelectedTextCheckbox").checked = defaults.focusSelectedText;
                document.querySelectorAll('input[name="hoverAnnotation"]').forEach((radio) => {
                    radio.checked = radio.value === defaults.hoverAnnotation;
                });
                document.getElementById("skipEndPageCheckbox").checked = defaults.skipEndPage;
                document.querySelectorAll('input[name="relocateCaption"]').forEach((radio) => {
                    radio.checked = radio.value === defaults.relocateCaption;
                });
                document.querySelectorAll('input[name="widgetVerticalAlign"]').forEach((radio) => {
                    radio.checked = radio.value === defaults.widgetVerticalAlign;
                });
                document.getElementById("captionFontsizeSlider").value = defaults.captionFontsize;
                
                document.getElementById("keyboardShortcutCheckbox").value = defaults.keyboardShortcut;
                document.getElementById("shortcutVideoFullscreenInput").value = defaults.shortcutVideoFullscreen;
                const skipSlider = document.getElementById("skipDurationSlider");
                if (skipSlider) {
                    skipSlider.value = defaults.skipDuration;
                    const skipVal = document.getElementById("skipDurationValue");
                    if (skipVal) skipVal.textContent = defaults.skipDuration;
                    const backwardLabel = document.querySelector('label[for="shortcutBackward5sInput"]');
                    if (backwardLabel) backwardLabel.textContent = `Rewind ${defaults.skipDuration}s:`;
                    const forwardLabel = document.querySelector('label[for="shortcutForward5sInput"]');
                    if (forwardLabel) forwardLabel.textContent = `Fast Forward ${defaults.skipDuration}s:`;
                }
                document.getElementById("shortcutBackward5sInput").value = defaults.shortcutBackward5s;
                document.getElementById("shortcutForward5sInput").value = defaults.shortcutForward5s;
                document.getElementById("shortcutTTSPlayInput").value = defaults.shortcutTTSPlay;
                document.getElementById("shortcutTranslatorOpenInput").value = defaults.shortcutTranslator;
                document.getElementById("shortcutMakeKnownInput").value = defaults.shortcutMakeKnown;
                document.getElementById("shortcutDictionaryOpenInput").value = defaults.shortcutDictionary;
                document.getElementById("shortcutCopySelectedInput").value = defaults.shortcutCopySelected;
                document.getElementById("shortcutMeaningInput").value = defaults.shortcutMeaningInput;
                document.getElementById("shortcutChatInput").value = defaults.shortcutChatInput;
                document.getElementById("shortcutFlashcard").value = defaults.shortcutFlashcard;
                
                document.getElementById("chatWidgetCheckbox").value = defaults.chatWidget;
                document.getElementById("chatWidgetHeightSlider").value = defaults.chatWidgetHeight;
                settings.llmModels = {};
                settings.llmApiKeys = {};
                document.getElementById("llmProviderSelector").value = defaults.llmProvider;
                llmProviderSelector.dispatchEvent(new Event("change"));
                document.getElementById("llmModelSelector").value = defaults.llmModel;
                settings.llmModel = defaults.llmModel;
                document.getElementById("llmResponseLanguageSelector").value = defaults.llmResponseLanguage;
                
                document.getElementById("askSelectedCheckbox").value = defaults.askSelected;
                document.getElementById("prependSummaryCheckbox").checked = languageScopedDefaults.prependSummary;
                document.getElementById("summaryDifficultySelector").value = languageScopedDefaults.summaryDifficulty || "unset";
                const summaryDifficultySection = document.getElementById("summaryDifficultySection");
                if (summaryDifficultySection) {
                    summaryDifficultySection.style.display = languageScopedDefaults.prependSummary ? "block" : "none";
                }
                
                document.querySelectorAll('input[name="dbMode"]').forEach((radio) => {
                    radio.checked = radio.value === (settings.useCentralDb ? "central" : "personal");
                });
                document.getElementById("dbUrlInput").value = "";
                document.getElementById("llmApiKeyInput").value = "";
                
                settings.ttsApiKeys = {};
                document.getElementById("ttsCheckbox").value = defaults.tts;
                document.getElementById("ttsAutoplayCheckbox").value = defaults.ttsAutoplay;
                document.getElementById("ttsApiKeyInput").value = "";
                document.getElementById("ttsProviderSelector").value = defaults.ttsProvider;
                const ttsModelSelector = document.getElementById("ttsModelSelector");
                if (ttsModelSelector) {
                    ttsModelSelector.value = defaults.ttsModel;
                }
                const ttsModelContainer = document.getElementById("ttsModelContainer");
                if (ttsModelContainer) {
                    ttsModelContainer.style.display = (ttsModelsByProvider[defaults.ttsProvider]?.length > 0) ? "block" : "none";
                }
                document.getElementById("ttsVoiceSelector").value = languageScopedDefaults.ttsVoice;
                document.getElementById("ttsWordCheckbox").value = defaults.ttsWord;
                document.getElementById("ttsSentenceCheckbox").value = defaults.ttsSentence;
                
                resetLanguageScopedSettings(language);
                Object.entries(defaults)
                    .filter(([key]) => !(key in languageScopedDefaults))
                    .forEach(([key, value]) => {
                        settings[key] = value;
                    });
            }
            
            document.getElementById("resetSettingsBtn").addEventListener("click", resetSettings);
            
            document.getElementById("closeSettingsBtn").addEventListener("click", () => {
                settingsPopup.style.display = "none"
            });
        }
        
        async function setupDownloadWordsEventListeners() {
            async function getAllWords(baseUrl, pageSize, apiType, additionalParams = "", progressCallback = () => {
            }) {
                let allResults = [];
                let nextUrl = `${baseUrl}?page_size=${pageSize}&page=1${additionalParams}`;
                let currentPage = 0;
                let totalPages = 0;
                let isFirstCall = true;
                
                while (nextUrl) {
                    try {
                        const response = await fetch(nextUrl);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        currentPage++;
                        
                        if (isFirstCall) {
                            isFirstCall = false;
                            totalPages = Math.ceil(data.count / pageSize);
                            console.log(`total pages: ${totalPages}`);
                        }
                        
                        progressCallback(currentPage, totalPages, false, null, data.count);
                        
                        if (apiType === 'lingq') {
                            const filteredResults = data.results.map(item => ({
                                pk: item.pk,
                                term: item.term,
                                fragment: item.fragment,
                                status: item.status,
                                hint: item.hints && item.hints[0] ? item.hints[0].text : null
                            }));
                            allResults = allResults.concat(filteredResults);
                        } else if (apiType === 'known') {
                            allResults = allResults.concat(data.results);
                        }
                        
                        nextUrl = data.next;
                        
                        if (nextUrl) {
                            console.log("Fetched page. Next URL:", nextUrl);
                        } else {
                            console.log("Finished fetching all pages");
                            progressCallback(currentPage, totalPages, true, null, data.count);
                        }
                    } catch (error) {
                        console.error('Error fetching data:', error);
                        progressCallback(currentPage, totalPages, true, error, 0);
                        break;
                    }
                }
                
                return allResults;
            }
            
            async function downloadWords(baseUrl, pageSize, fileName, apiType, additionalParams = "") {
                const progressContainer = document.getElementById("downloadProgressContainer");
                const progressBar = document.getElementById("downloadProgressBar");
                const progressText = document.getElementById("downloadProgressText");
                
                if (progressContainer && progressBar && progressText) {
                    progressBar.value = 0;
                    progressBar.max = 100;
                    progressText.textContent = "Initializing download...";
                    progressContainer.style.display = "block";
                }
                
                const progressCallback = (currentPage, totalPages, _isDone, error_isErrorEncountered, totalCount) => {
                    if (progressBar && progressText) {
                        if (error_isErrorEncountered) {
                            progressText.textContent = `Error fetching page ${currentPage}: ${error_isErrorEncountered.message}`;
                            progressBar.style.backgroundColor = 'red';
                            return;
                        }
                        
                        progressBar.max = totalPages;
                        progressBar.value = currentPage;
                        progressText.textContent = `Fetching data... Page ${currentPage} of ${totalPages} (Total items: ${totalCount || 'N/A'})`;
                        
                        if (_isDone) {
                            progressText.textContent = error_isErrorEncountered ? `Export failed: ${error_isErrorEncountered.message}` : `${totalCount} items exported`;
                        }
                    }
                };
                
                try {
                    const allWords = await getAllWords(baseUrl, pageSize, apiType, additionalParams, progressCallback);
                    
                    if (!allWords || allWords.length === 0) {
                        console.warn("No words found or an error occurred.");
                        return;
                    }
                    
                    let blob;
                    const fileType = fileName.split(".")[1];
                    
                    if (fileType === 'json') {
                        const dataString = JSON.stringify(allWords, null, 2);
                        blob = new Blob([dataString], {type: 'application/json'});
                    } else if (fileType === 'csv') {
                        const headers = Object.keys(allWords[0]).join(',');
                        const rows = allWords.map(item => {
                            return Object.values(item).map(value => {
                                if (typeof value === 'string') {
                                    return `"${value.replace(/"/g, '""')}"`;
                                }
                                return value;
                            }).join(',');
                        }).join('\n');
                        
                        const dataString = headers + '\n' + rows;
                        blob = new Blob([dataString], {type: 'text/csv'});
                    }
                    
                    downloadBlob(blob, fileName);
                    console.log("Export completed.");
                } catch (error) {
                    console.error('Error:', error);
                }
            }
            
            function downloadBlob(blob, fileName) {
                const url = URL.createObjectURL(blob);
                const a = createElement("a", {href: url, download: fileName});
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            
            const downloadWordsButton = document.getElementById('lingqDownloadWords');
            const downloadWordsPopup = document.getElementById('lingqDownloadWordsPopup');
            
            downloadWordsButton.addEventListener("click", () => {
                downloadWordsPopup.style.display = "block";
                bringPopupToFront(downloadWordsPopup);
                ensurePopupInViewport(downloadWordsPopup);
                
                const progressContainer = document.getElementById("downloadProgressContainer");
                if (progressContainer) progressContainer.style.display = "none";
                
                const dragHandle = document.getElementById("lingqDownloadWordsDragHandle");
                if (dragHandle) {
                    makeDraggable(downloadWordsPopup, dragHandle);
                }
            });
            
            const languageCode = await getLanguageCode();
            const pageSize = 1000;
            
            const setButtonsDisabled = (disabled) => {
                const buttons = downloadWordsPopup.querySelectorAll('.popup-button');
                buttons.forEach(button => {
                    button.disabled = disabled;
                });
            };
            
            const handleDownloadButtonClick = async (url, filename, type, params = '') => {
                setButtonsDisabled(true);
                try {
                    await downloadWords(url, pageSize, filename, type, params);
                } finally {
                    setButtonsDisabled(false);
                }
            };
            
            document.getElementById("downloadUnknownLingqsBtn").addEventListener("click", async () => {
                await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "unknown_lingqs.csv", 'lingq', '&status=0&status=1&status=2&status=3');
            });
            
            document.getElementById("downloadUnknownLingqWordsBtn").addEventListener("click", async () => {
                await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "unknown_lingq_words.csv", 'lingq', '&status=0&status=1&status=2&status=3&phrases=false');
            });
            
            document.getElementById("downloadUnknownLingqPhrasesBtn").addEventListener("click", async () => {
                await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "unknown_lingq_phrases.csv", 'lingq', '&status=0&status=1&status=2&status=3&phrases=True');
            });
            
            document.getElementById("downloadKnownLingqsBtn").addEventListener("click", async () => {
                await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "known_lingqs.csv", 'lingq', '&status=4');
            });
            
            document.getElementById("downloadKnownWordsBtn").addEventListener("click", async () => {
                await handleDownloadButtonClick(`https://www.lingq.com/api/v2/${languageCode}/known-words/`, "known_words.csv", "known");
            });
            
            document.getElementById("closeDownloadWordsBtn").addEventListener("click", () => {
                downloadWordsPopup.style.display = "none";
            });
            
            const jsonUploadInput = document.getElementById("jsonUploadInput");
            const vertexProjectIdInput = document.getElementById("vertexProjectIdInput");
            const vertexClientEmailInput = document.getElementById("vertexClientEmailInput");
            const vertexPrivateKeyInput = document.getElementById("vertexPrivateKeyInput");
            
            if (jsonUploadInput) {
                jsonUploadInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const json = JSON.parse(e.target.result);
                            if (json.project_id && json.client_email && json.private_key) {
                                vertexProjectIdInput.value = json.project_id;
                                vertexClientEmailInput.value = json.client_email;
                                vertexPrivateKeyInput.value = json.private_key;
                                
                                settings.vertexCredential = {
                                    projectId: json.project_id,
                                    clientEmail: json.client_email,
                                    privateKey: json.private_key
                                };
                                alert("Vertex credentials loaded successfully.");
                            } else {
                                alert("Invalid Service Account JSON file.");
                            }
                        } catch (error) {
                            alert("Error parsing JSON file.");
                        }
                        event.target.value = "";
                    };
                    reader.readAsText(file);
                });
            }
            
            if (vertexProjectIdInput && vertexClientEmailInput && vertexPrivateKeyInput) {
                [vertexProjectIdInput, vertexClientEmailInput, vertexPrivateKeyInput].forEach(input => {
                    input.addEventListener('change', () => {
                        settings.vertexCredential = {
                            projectId: vertexProjectIdInput.value.trim(),
                            clientEmail: vertexClientEmailInput.value.trim(),
                            privateKey: vertexPrivateKeyInput.value.trim()
                        };
                    });
                });
            }
        }
        
        function setupTTSPlaygroundEventListeners() {
            const ttsPlaygroundButton = document.getElementById('ttsPlayground');
            const ttsPlaygroundPopup = document.getElementById('ttsPlaygroundPopup');
            
            ttsPlaygroundButton.addEventListener("click", () => {
                ttsPlaygroundPopup.style.display = "block";
                bringPopupToFront(ttsPlaygroundPopup);
                ensurePopupInViewport(ttsPlaygroundPopup);
                
                const dragHandle = document.getElementById("ttsPlaygroundDragHandle");
                if (dragHandle) {
                    makeDraggable(ttsPlaygroundPopup, dragHandle);
                }
            });
            
            const ttsPlayer = document.getElementById('ttsPlayer');
            const ttsGenerationButton = document.getElementById('ttsGenerationButton');
            ttsGenerationButton.addEventListener("click", async () => {
                const ttsInstructionsText = document.getElementById("ttsInstructionsInput").value;
                const ttsTextareaText = document.getElementById("ttsTextarea").value.replaceAll('\n', ' ');
                
                ttsPlayer.style.display = "none";
                ttsGenerationButton.disabled = true;
                const audioData = await getTTSResponse(settings.ttsProvider, settings.ttsApiKeys[settings.ttsProvider] || "", (settings.ttsVoice[language]), ttsTextareaText, ttsInstructionsText);
                const audioURL = URL.createObjectURL(new Blob([audioData], {type: 'audio/mp3'}))
                ttsGenerationButton.disabled = false;
                
                ttsPlayer.src = audioURL;
                ttsPlayer.play();
                
                ttsPlayer.style.display = "block";
            });
            
            document.getElementById("closeTTSPlaygroundBtn").addEventListener("click", () => {
                ttsPlaygroundPopup.style.display = "none";
            });
        }
        
        function setupFlashcardPopupEventListeners() {
            const flashcardButton = document.getElementById("flashcardManagerButton");
            const flashcardPopup = document.getElementById("flashcardPopup");
            const flashcardTableBody = flashcardPopup.querySelector("tbody");
            const countLabel = document.getElementById("flashcardCount");
            const searchInput = document.getElementById("flashcardSearchInput");
            const languageSelector = document.getElementById("flashcardLanguageSelector");
            const reportLanguageSelector = document.getElementById("flashcardReportLanguageSelector");
            
            let currentPage = 1;
            const pageSize = 15;
            let totalCount = 0;
            let filteredCount = 0;
            let targetLanguage = getLessonLanguage();
            
            let currentSortField = "idx";
            let currentSortOrder = "desc";
            let searchKeyword = "";
            
            let flashcardStatsChart = null;
            let flashcardDailyStats = [];
            
            async function fetchUniqueFlashcardLanguages() {
                if (!isDbReady()) return [getLessonLanguage() || "en"];
                try {
                    const rpcName = settings.useCentralDb ? "get_flashcard_languages_central" : "get_flashcard_languages";
                    let {data, error} = await getDbClient().rpc(rpcName);
                    
                    if (error) {
                        let fallbackQuery = getDbClient()
                            .from(getTableName())
                            .select("language");
                        if (settings.useCentralDb && centralUserId) {
                            fallbackQuery = fallbackQuery.eq("user_id", centralUserId);
                        }
                        ({data, error} = await fallbackQuery);
                    }
                    
                    if (error) {
                        console.error("Failed to fetch flashcard languages:", error);
                        return [getLessonLanguage() || "en"];
                    }
                    
                    const currentLang = getLessonLanguage();
                    const uniqueSet = new Set((data || []).map(r => r.language).filter(Boolean));
                    if (currentLang) uniqueSet.add(currentLang);
                    return Array.from(uniqueSet).sort();
                } catch (err) {
                    console.error("fetchUniqueFlashcardLanguages error:", err);
                    return [getLessonLanguage() || "en"];
                }
            }
            
            async function populateLanguageSelector() {
                const languages = await fetchUniqueFlashcardLanguages();
                const currentSelected = targetLanguage;
                [languageSelector, reportLanguageSelector].forEach((selector) => {
                    if (!selector) return;
                    selector.innerHTML = "";
                    languages.forEach((lang) => {
                        selector.appendChild(createElement("option", {
                            value: lang,
                            textContent: lang,
                            selected: lang === currentSelected
                        }));
                    });
                    selector.value = currentSelected;
                });
            }
            
            async function populateFlashcardAnkiDecks() {
                const deckSelector = document.getElementById("flashcardAnkiDeckSelector");
                if (!deckSelector) return;
                
                const currentSavedDeck = settings.ankiDeck[targetLanguage] || "";
                const statusEl = document.getElementById("flashcardAnkiStatus");
                try {
                    const decks = await fetchAnkiDecks();
                    deckSelector.innerHTML = "";
                    deckSelector.appendChild(createElement("option", {value: "", textContent: "Select Deck"}));
                    decks.forEach((deck) => {
                        deckSelector.appendChild(createElement("option", {
                            value: deck,
                            textContent: deck,
                            selected: deck === currentSavedDeck
                        }));
                    });
                    if (currentSavedDeck && !decks.includes(currentSavedDeck)) {
                        deckSelector.appendChild(createElement("option", {
                            value: currentSavedDeck,
                            textContent: `${currentSavedDeck} (Saved)`,
                            selected: true
                        }));
                    }
                    if (statusEl && statusEl.textContent.includes("Guide")) {
                        statusEl.innerHTML = "";
                        statusEl.title = "";
                    }
                } catch (err) {
                    deckSelector.innerHTML = "";
                    if (currentSavedDeck) {
                        deckSelector.appendChild(createElement("option", {
                            value: currentSavedDeck,
                            textContent: `${currentSavedDeck} (Saved)`,
                            selected: true
                        }));
                        renderAnkiOfflineStatus(statusEl, true);
                    } else {
                        deckSelector.appendChild(createElement("option", {
                            value: "",
                            textContent: "Anki Offline"
                        }));
                        renderAnkiOfflineStatus(statusEl, false);
                    }
                }
            }
            
            const ankiDeckSelectorEl = document.getElementById("flashcardAnkiDeckSelector");
            if (ankiDeckSelectorEl) {
                ankiDeckSelectorEl.addEventListener("change", (event) => {
                    settings.ankiDeck = {...settings.ankiDeck, [targetLanguage]: event.target.value};
                });
            }
            
            function handleLanguageChange(newLang) {
                targetLanguage = newLang;
                if (languageSelector && languageSelector.value !== newLang) languageSelector.value = newLang;
                if (reportLanguageSelector && reportLanguageSelector.value !== newLang) reportLanguageSelector.value = newLang;
                currentPage = 1;
                totalCount = 0;
                searchKeyword = "";
                if (searchInput) searchInput.value = "";
                loadFlashcardPage(1);
                loadFlashcardStats();
                populateFlashcardAnkiDecks();
                const statusEl = document.getElementById("flashcardAnkiStatus");
                if (statusEl) {
                    statusEl.textContent = "";
                    statusEl.title = "";
                }
                checkAndTriggerDailyAnkiSync(targetLanguage);
            }
            
            if (languageSelector) {
                languageSelector.addEventListener("change", (event) => handleLanguageChange(event.target.value));
            }
            if (reportLanguageSelector) {
                reportLanguageSelector.addEventListener("change", (event) => handleLanguageChange(event.target.value));
            }
            
            function drawPagination(page, total) {
                const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
                
                const prevBtn = document.getElementById("flashcardPaginationPrev");
                const nextBtn = document.getElementById("flashcardPaginationNext");
                const pageInfo = document.getElementById("flashcardPageInfo");
                
                const noData = total === 0;
                prevBtn.disabled = noData || page <= 1;
                nextBtn.disabled = noData || page >= totalPages;
                
                if (noData) {
                    pageInfo.textContent = "0/0";
                } else {
                    pageInfo.textContent = `${Math.min(page, totalPages)}/${totalPages}`;
                }
                
                prevBtn.onclick = null;
                nextBtn.onclick = null;
                if (!noData && totalPages > 1) {
                    prevBtn.onclick = () => {
                        if (page > 1) {
                            currentPage--;
                            loadFlashcardPage(currentPage);
                        }
                    };
                    nextBtn.onclick = () => {
                        if (page < totalPages) {
                            currentPage++;
                            loadFlashcardPage(currentPage);
                        }
                    };
                }
            }
            
            async function loadFlashcardPage(page) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                let queryBase = getDbClient()
                    .from(getTableName())
                    .select("idx, word, pronunciation, meaning, explanation", {count: "exact"})
                    .eq("language", targetLanguage);
                
                if (settings.useCentralDb && centralUserId) {
                    queryBase = queryBase.eq("user_id", centralUserId);
                }
                
                if (searchKeyword) {
                    const isNumber = /^\d+$/.test(searchKeyword);
                    const textColumns = ["word", "meaning"];
                    const searchConditions = [
                        ...textColumns.map((col) => `${col}.ilike.%${searchKeyword}%`),
                        isNumber ? `idx.eq.${searchKeyword}` : null
                    ].filter(Boolean).join(",");
                    
                    queryBase = queryBase.or(searchConditions);
                }
                
                const {data, error, count} = await queryBase
                    .order(currentSortField, {ascending: currentSortOrder === "asc"})
                    .range(from, to);
                
                if (error) {
                    console.error("Flashcard fetch error:", error);
                    return;
                }
                
                filteredCount = count || 0;
                flashcardTableBody.innerHTML = "";
                data.forEach(row => {
                    const deleteBtn = createElement("button", {
                        className: "delete-row-btn",
                        innerHTML: `<svg viewBox="6 6 12 12" stroke="currentColor"><path d="M17 17L7 7M17 7L7 17" stroke-width="2" stroke-linecap="round"/></svg>`
                    });
                    const deleteTd = createElement("td", {}, deleteBtn);
                    
                    const pronunciationTd = createElement("td", {
                        textContent: row.pronunciation || "",
                        title: row.pronunciation || "",
                        style: "cursor: pointer;"
                    });

                    const meaningTd = createElement("td", {
                        textContent: row.meaning || "",
                        title: row.meaning || "",
                        style: "cursor: pointer;"
                    });
                    
                    const tableRow = createElement("tr", {},
                        deleteTd,
                        createElement("td", {textContent: row.idx ?? "", title: row.idx ?? ""}),
                        createElement("td", {textContent: row.word || "", title: row.word || ""}),
                        pronunciationTd,
                        meaningTd,
                        createElement("td", {textContent: row.explanation || "", title: row.explanation || ""})
                    );
                    
                    deleteBtn.addEventListener("click", async (ev) => {
                        ev.stopPropagation();
                        
                        deleteBtn.disabled = true;
                        const {error: updateError} = await getDbClient()
                            .from(getTableName())
                            .delete()
                            .eq("idx", row.idx);
                        
                        if (updateError) {
                            console.error("Flashcard delete error:", updateError);
                            deleteBtn.disabled = false;
                        } else {
                            tableRow.remove();
                            totalCount--;
                            filteredCount--;
                            countLabel.textContent = `Flashcards: ${totalCount}`;
                            
                            if (flashcardTableBody.children.length === 0 && currentPage > 1) {
                                currentPage--;
                                loadFlashcardPage(currentPage);
                            } else {
                                drawPagination(currentPage, filteredCount);
                            }
                            loadFlashcardStats();
                        }
                    });
                    
                    pronunciationTd.addEventListener("click", () => {
                        if (window.getSelection()?.toString().length > 0) return;
                        if (pronunciationTd.querySelector("input")) return;
                        
                        const currentText = pronunciationTd.textContent;
                        const input = createElement("input", {
                            type: "text",
                            value: currentText,
                            style: "width: 100%; border: none; outline: none; background: transparent; color: inherit; font: inherit;",
                        });
                        
                        const savePronunciation = async () => {
                            const newValue = preprocessPronunciation(input.value, targetLanguage);
                            
                            if (newValue === currentText) {
                                pronunciationTd.textContent = currentText;
                                pronunciationTd.title = currentText;
                                return;
                            }
                            
                            const {error: updateError} = await getDbClient()
                                .from(getTableName())
                                .update({pronunciation: newValue})
                                .eq("idx", row.idx);
                            
                            if (updateError) {
                                console.error("Pronunciation update error:", updateError);
                                pronunciationTd.textContent = currentText;
                                pronunciationTd.title = currentText;
                            } else {
                                pronunciationTd.textContent = newValue;
                                pronunciationTd.title = newValue;
                                row.pronunciation = newValue;
                            }
                        };
                        
                        pronunciationTd.textContent = "";
                        pronunciationTd.appendChild(input);
                        input.focus();
                        
                        input.addEventListener("blur", () => savePronunciation());
                        
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                input.blur();
                            }
                        });
                    });

                    meaningTd.addEventListener("click", () => {
                        if (window.getSelection()?.toString().length > 0) return;
                        if (meaningTd.querySelector("input")) return;
                        
                        const currentText = meaningTd.textContent;
                        const input = createElement("input", {
                            type: "text",
                            value: currentText,
                            style: "width: 100%; border: none; outline: none;",
                        });
                        
                        const saveMeaning = async () => {
                            const newValue = input.value.trim();
                            
                            if (newValue === currentText) {
                                meaningTd.textContent = currentText;
                                return;
                            }
                            
                            const {error: updateError} = await getDbClient()
                                .from(getTableName())
                                .update({meaning: newValue})
                                .eq("idx", row.idx);
                            
                            if (updateError) {
                                console.error("Meaning update error:", updateError);
                                meaningTd.textContent = currentText;
                            } else {
                                meaningTd.textContent = newValue;
                                row.meaning = newValue;
                            }
                        };
                        
                        meaningTd.textContent = "";
                        meaningTd.appendChild(input);
                        input.focus();
                        
                        input.addEventListener("blur", () => saveMeaning());
                        
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                input.blur();
                            }
                        });
                    });
                    
                    flashcardTableBody.appendChild(tableRow);
                });
                
                drawPagination(page, filteredCount);
                
                if (!totalCount) {
                    if (!searchKeyword) {
                        totalCount = filteredCount;
                        countLabel.textContent = `Flashcards: ${totalCount}`;
                    } else {
                        let countQuery = getDbClient()
                            .from(getTableName())
                            .select("*", {count: "exact", head: true})
                            .eq("language", targetLanguage);
                        if (settings.useCentralDb && centralUserId) {
                            countQuery = countQuery.eq("user_id", centralUserId);
                        }
                        countQuery.then(({count}) => {
                            totalCount = count || 0;
                            countLabel.textContent = `Flashcards: ${totalCount}`;
                        });
                    }
                }
            }
            
            function drawFlashcardStatsChart(labels, periodicData, cumulativeData, selectedPeriod, periodicLabelOverride) {
                const titleMap = {
                    week: "Flashcards Created (Past Week)",
                    month: "Flashcards Created (Past Month)",
                    year: "Flashcards Created (Past Year)",
                    all: "Flashcards Created (All Time)",
                };
                
                const defaultPeriodLabelMap = {
                    week: "Daily",
                    month: "Daily",
                    year: "Monthly",
                    all: "Monthly",
                };
                
                const periodLabel = periodicLabelOverride || defaultPeriodLabelMap[selectedPeriod] || "Daily";
                const titleText = titleMap[selectedPeriod] || titleMap.week;
                
                document.getElementById("flashcardStatsTitle").textContent = titleText;
                
                function formatTickLabel(label) {
                    return label;
                }
                
                const tickCallback = function (val) {
                    return formatTickLabel(this.getLabelForValue(val));
                };
                
                const ctx = document.getElementById("flashcardStatsChart").getContext("2d");
                
                if (flashcardStatsChart) {
                    flashcardStatsChart.data.labels = labels;
                    flashcardStatsChart.data.datasets[0].data = periodicData;
                    flashcardStatsChart.data.datasets[0].label = periodLabel;
                    flashcardStatsChart.data.datasets[1].data = cumulativeData;
                    flashcardStatsChart.options.scales.x.ticks.callback = tickCallback;
                    flashcardStatsChart.options.scales.yPeriodic.title.text = periodLabel;
                    flashcardStatsChart.update();
                    return;
                }
                
                flashcardStatsChart = new Chart(ctx, {
                    data: {
                        labels,
                        datasets: [
                            {
                                type: "bar",
                                label: periodLabel,
                                yAxisID: "yPeriodic",
                                data: periodicData,
                                backgroundColor: "#7f8fa6",
                                borderRadius: 4,
                                barPercentage: 0.6,
                            },
                            {
                                type: "line",
                                label: "Cumulative",
                                yAxisID: "yCumulative",
                                data: cumulativeData,
                                borderColor: "#b07c6a",
                                backgroundColor: "#b07c6a25",
                                fill: true,
                                tension: 0.3,
                                pointRadius: 2,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {mode: "index", intersect: false},
                        plugins: {legend: {display: true}},
                        scales: {
                            x: {
                                grid: {display: false},
                                ticks: {
                                    autoSkip: true,
                                    callback: tickCallback,
                                },
                            },
                            yPeriodic: {
                                type: "linear",
                                position: "left",
                                beginAtZero: true,
                                title: {display: true, text: periodLabel},
                                ticks: {precision: 0},
                            },
                            yCumulative: {
                                type: "linear",
                                position: "right",
                                beginAtZero: true,
                                grid: {drawOnChartArea: false},
                                title: {display: true, text: "Cumulative"},
                                ticks: {precision: 0},
                            },
                        },
                    },
                });
            }
            
            async function fetchFlashcardDailyStats(language) {
                if (!isDbReady()) return [];
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const rpcName = settings.useCentralDb ? "get_flashcard_daily_stats_central" : "get_flashcard_daily_stats";
                
                const {data, error} = await getDbClient().rpc(rpcName, {
                    p_language: language,
                    p_tz: timeZone
                });
                
                if (!error && data) return data;
                
                const rawDates = await fetchFlashcardsInBatches(language, "created_at", "created_at");
                const countsMap = new Map();
                rawDates.forEach(({created_at}) => {
                    const d = new Date(created_at);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const dateKey = `${year}-${month}-${day}`;
                    countsMap.set(dateKey, (countsMap.get(dateKey) || 0) + 1);
                });
                
                return Array.from(countsMap.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([date, count]) => ({date, count}));
            }
            
            async function loadFlashcardStats() {
                function getLocalDateKey(date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                }
                
                function parseDateKeyToLocal(dateKey) {
                    const [y, m, d] = dateKey.split("-").map(Number);
                    return new Date(y, m - 1, d);
                }
                
                function getWeekStartKey(dateKey) {
                    const d = parseDateKeyToLocal(dateKey);
                    d.setDate(d.getDate() - d.getDay());
                    return getLocalDateKey(d);
                }
                
                function buildChartData(selectedPeriod) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    let periodicLabel = "Daily";
                    const buckets = [];
                    
                    if (selectedPeriod === "week") {
                        const start = new Date(today);
                        start.setDate(today.getDate() - 6);
                        
                        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
                            buckets.push({
                                key: getLocalDateKey(d),
                                label: d.toLocaleString("en-US", {weekday: "short"}),
                                count: 0
                            });
                        }
                    } else if (selectedPeriod === "month") {
                        const start = new Date(today);
                        start.setMonth(today.getMonth() - 1);
                        
                        if (start.getDate() !== today.getDate()) start.setDate(0);
                        
                        start.setDate(start.getDate() + 1);
                        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
                            buckets.push({
                                key: getLocalDateKey(d),
                                label: String(d.getDate()),
                                count: 0
                            });
                        }
                    } else if (selectedPeriod === "year") {
                        periodicLabel = "Monthly";
                        
                        const startMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1);
                        
                        for (let m = new Date(startMonth); m <= today; m.setMonth(m.getMonth() + 1)) {
                            buckets.push({
                                key: getLocalDateKey(m).slice(0, 7),
                                label: m.toLocaleString("en-US", {month: "short"}),
                                count: 0
                            });
                        }
                    } else {
                        const firstDate = flashcardDailyStats.length ? parseDateKeyToLocal(flashcardDailyStats[0].date) : new Date(0);
                        const lastDate = flashcardDailyStats.length ? parseDateKeyToLocal(flashcardDailyStats[flashcardDailyStats.length - 1].date) : new Date(0);
                        const useMonthly = Math.ceil((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)) > 52 * 2;
                        periodicLabel = useMonthly ? "Monthly" : "Weekly";
                        
                        const distinctKeys = [...new Set(flashcardDailyStats.map(e => {
                            return useMonthly ? e.date.slice(0, 7) : getWeekStartKey(e.date);
                        }))].sort();
                        
                        distinctKeys.forEach(key => buckets.push({
                            key,
                            label: key,
                            count: 0
                        }));
                    }
                    
                    const bucketMap = new Map(buckets.map(b => [b.key, b]));
                    
                    flashcardDailyStats.forEach(({date, count}) => {
                        const matchKey = (selectedPeriod === "year" || (selectedPeriod === "all" && periodicLabel === "Monthly"))
                            ? date.slice(0, 7)
                            : (selectedPeriod === "all" && periodicLabel === "Weekly")
                                ? getWeekStartKey(date)
                                : date;
                        
                        const bucket = bucketMap.get(matchKey);
                        if (bucket) bucket.count += count;
                    });
                    
                    const labels = buckets.map(b => b.label);
                    const periodicData = buckets.map(b => b.count);
                    let runningTotal = 0;
                    const cumulativeData = buckets.map(b => {
                        runningTotal += b.count;
                        return runningTotal;
                    });
                    
                    return {labels, periodicData, cumulativeData, periodicLabel};
                }
                
                function updateChart(selectedPeriod) {
                    const {labels, periodicData, cumulativeData, periodicLabel} = buildChartData(selectedPeriod);
                    drawFlashcardStatsChart(labels, periodicData, cumulativeData, selectedPeriod, periodicLabel);
                }
                
                flashcardDailyStats = await fetchFlashcardDailyStats(targetLanguage);
                if (!flashcardDailyStats.length) {
                    if (flashcardStatsChart) {
                        flashcardStatsChart.data.labels = [];
                        flashcardStatsChart.data.datasets[0].data = [];
                        flashcardStatsChart.data.datasets[1].data = [];
                        flashcardStatsChart.update();
                    }
                    return;
                }
                
                const container = document.getElementById("flashcardStatsContainer");
                const tabs = container.querySelectorAll(".flashcard-period-tabs .btn-ghost");
                
                if (!container.dataset.initialized) {
                    tabs.forEach(btn => {
                        btn.addEventListener("click", () => {
                            tabs.forEach(tab => tab.classList.remove("active"));
                            btn.classList.add("active");
                            updateChart(btn.dataset.period);
                        });
                    });
                    container.dataset.initialized = "1";
                }
                
                const activeTab = container.querySelector(".flashcard-period-tabs .btn-ghost.active");
                updateChart(activeTab?.dataset.period || "week");
            }
            
            flashcardButton.addEventListener("click", () => {
                flashcardPopup.style.display = "block";
                bringPopupToFront(flashcardPopup);
                ensurePopupInViewport(flashcardPopup);
                makeDraggable(flashcardPopup, document.getElementById("flashcardDragHandle"));
                
                targetLanguage = getLessonLanguage() || targetLanguage;
                
                [languageSelector, reportLanguageSelector].forEach((selector) => {
                    if (!selector) return;
                    if (!selector.options.length) {
                        selector.innerHTML = "";
                        selector.appendChild(createElement("option", {
                            value: targetLanguage,
                            textContent: targetLanguage,
                            selected: true
                        }));
                    }
                    selector.value = targetLanguage;
                });
                
                currentPage = 1;
                totalCount = 0;
                searchKeyword = "";
                if (searchInput) searchInput.value = "";
                
                loadFlashcardPage(1);
                loadFlashcardStats();
                searchInput?.focus();
                
                populateLanguageSelector();
                populateFlashcardAnkiDecks();
                checkAndTriggerDailyAnkiSync(targetLanguage);
            });
            
            document.getElementById("closeFlashcardPopupBtn").addEventListener("click", () => {
                flashcardPopup.style.display = "none";
            });
            
            function executeFlashcardSearch() {
                currentPage = 1;
                searchKeyword = searchInput.value.trim();
                loadFlashcardPage(currentPage);
            }
            
            const debouncedSearch = debounce(executeFlashcardSearch, 200);
            
            let isPastingSearch = false;
            searchInput.addEventListener("paste", () => {
                isPastingSearch = true;
            });
            
            searchInput.addEventListener("input", () => {
                if (isPastingSearch || !searchInput.value.trim()) {
                    isPastingSearch = false;
                    debouncedSearch.cancel();
                    executeFlashcardSearch();
                    return;
                }
                debouncedSearch();
            });
            
            searchInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    debouncedSearch.cancel();
                    executeFlashcardSearch();
                }
            });
            
            const tableHeaders = document.querySelectorAll("#flashcardTable thead th");
            tableHeaders.forEach((th) => {
                th.addEventListener("click", () => {
                    const fieldMap = {
                        Idx: "idx",
                        Word: "word",
                        Pronunciation: "pronunciation",
                        Meaning: "meaning",
                        Explanation: "explanation"
                    };
                    const headerText = th.textContent.replace(/[▲▼]/g, "").trim();
                    const field = fieldMap[headerText];
                    if (!field) return;
                    
                    if (currentSortField !== field) {
                        currentSortField = field;
                        currentSortOrder = "asc";
                    } else if (currentSortOrder === "asc") {
                        currentSortOrder = "desc";
                    } else {
                        if (field === "idx") {
                            currentSortOrder = "asc";
                        } else {
                            currentSortField = "idx";
                            currentSortOrder = "desc";
                        }
                    }
                    
                    tableHeaders.forEach((header) => {
                        header.textContent = header.textContent.replace(/[▲▼]/g, "").trim();
                    });
                    
                    let arrow = "";
                    if (!(currentSortField === "idx" && currentSortOrder === "desc")) {
                        arrow = currentSortOrder === "asc" ? " ▲" : " ▼";
                    }
                    
                    if (currentSortField === field) {
                        th.textContent = headerText + arrow;
                    } else {
                        tableHeaders[1].textContent = tableHeaders[1].textContent.replace(/[▲▼]/g, "").trim() + arrow;
                    }
                    
                    loadFlashcardPage(1);
                });
            });
            
            document.getElementById("flashcardCsvDownload").addEventListener("click", async (event) => {
                const exportButton = event.currentTarget;
                exportButton.disabled = true;
                
                try {
                    const processedData = await getProcessedFlashcards(targetLanguage);
                    if (!processedData.length) return;
                    
                    const headers = Object.keys(processedData[0] || {});
                    const rows = processedData.map(row =>
                        Object.values(row)
                            .map(value => typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value)
                            .join(",")
                    );
                    
                    const csv = [headers.join(","), ...rows].join("\n");
                    const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
                    
                    const link = createElement("a", {
                        href: URL.createObjectURL(blob),
                        download: `flashcards_${targetLanguage}.csv`
                    });
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    console.error("Flashcard CSV export task failed:", error);
                } finally {
                    exportButton.disabled = false;
                }
            });
            
            const ankiSyncBtn = document.getElementById("flashcardAnkiSyncBtn");
            if (ankiSyncBtn) {
                ankiSyncBtn.addEventListener("click", async () => {
                    const deckName = settings.ankiDeck[targetLanguage];
                    if (!deckName) {
                        alert(`Please select an Anki deck for language "${targetLanguage}" first.`);
                        return;
                    }
                    
                    ankiSyncBtn.disabled = true;
                    const statusEl = document.getElementById("flashcardAnkiStatus");
                    if (statusEl) {
                        statusEl.textContent = "Syncing...";
                        statusEl.title = "Syncing with Anki...";
                        statusEl.style.color = "var(--blue-500, #3b82f6)";
                    }
                    
                    try {
                        const result = await syncFlashcardsToAnki(targetLanguage, {
                            allowDelete: true,
                            confirmDelete: (deleteCount, targetDeck) => {
                                if (deleteCount >= 10) {
                                    alert(`[Anki Sync - Safety Lock]\nDeletion of 10 or more cards (${deleteCount} cards) is blocked to protect your Anki review history from accidental deletion.\n\nAdditions and updates will proceed, but deletions have been skipped.\nTo delete these cards, please remove them directly inside the Anki Browser.`);
                                    return false;
                                }
                                
                                const confirmMsg = `[Anki Sync]\nFound ${deleteCount} card(s) in Anki deck "${targetDeck}" that no longer exist in your database.\n\nDo you want to delete them from Anki?\n(Warning: Anki review intervals and history will be permanently lost.)`;
                                return confirm(confirmMsg);
                            }
                        });
                        if (statusEl) {
                            const changes = [];
                            if (result.added > 0) changes.push(`+${result.added}`);
                            if (result.updated > 0) changes.push(`~${result.updated}`);
                            if (result.deleted > 0) changes.push(`-${result.deleted}`);
                            const summary = `+${result.added}, ~${result.updated}, -${result.deleted}, =${result.unchanged}`;
                            statusEl.textContent = changes.length > 0 ? `✓ ${changes.join(", ")}` : "✓ Up to date";
                            statusEl.title = `Sync complete (${summary})`;
                            statusEl.style.color = "var(--green-500, #22c55e)";
                        }
                    } catch (err) {
                        console.error("Anki sync error:", err);
                        renderAnkiOfflineStatus(statusEl, true);
                    } finally {
                        ankiSyncBtn.disabled = false;
                    }
                });
            }
            
            const AI_REPORTS_STORAGE_KEY = "lingq_ai_reports";
            const reportMainBtn = document.getElementById("flashcardAiReportBtn");
            const reportGenerateBtn = document.getElementById("flashcardAiReportGenerateBtn");
            const reportDropdownBtn = document.getElementById("flashcardAiReportDropdownBtn");
            const reportMenu = document.getElementById("flashcardAiReportMenu");
            const reportBoardBackBtn = document.getElementById("flashcardReportBoardBackBtn");
            const reportBackBtn = document.getElementById("flashcardReportBackBtn");
            
            function getSavedAiReports() {
                try {
                    const raw = localStorage.getItem(AI_REPORTS_STORAGE_KEY);
                    const parsed = raw ? JSON.parse(raw) : [];
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
            
            function saveAiReports(reports) {
                localStorage.setItem(AI_REPORTS_STORAGE_KEY, JSON.stringify(reports));
            }
            
            function formatReportDate(isoString) {
                if (!isoString) return "";
                const d = new Date(isoString);
                if (isNaN(d.getTime())) return isoString;
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                const hh = String(d.getHours()).padStart(2, "0");
                const min = String(d.getMinutes()).padStart(2, "0");
                return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
            }
            
            function extractReportPreview(htmlContent) {
                const tempDiv = createElement("div", {innerHTML: htmlContent});
                const firstP = tempDiv.querySelector("p");
                return (firstP ? firstP.textContent : tempDiv.textContent).replace(/\s+/g, " ").trim();
            }
            
            function renderAiReportBoard() {
                const tbody = document.getElementById("flashcardReportTableBody");
                if (!tbody) return;
                
                const reports = getSavedAiReports();
                tbody.innerHTML = "";
                
                if (reports.length === 0) {
                    tbody.appendChild(
                        createElement("tr", {},
                            createElement("td", {
                                colSpan: 7,
                                style: "text-align: center; padding: 30px 0; color: var(--text-muted, #888); cursor: default;",
                                textContent: "No saved AI reports yet. Click 'Generate Report' to create one."
                            })
                        )
                    );
                    return;
                }
                
                reports.forEach((report, idx) => {
                    const rowNumber = reports.length - idx;
                    const deleteBtn = createElement("button", {
                        className: "delete-row-btn",
                        innerHTML: `<svg viewBox="6 6 12 12" stroke="currentColor"><path d="M17 17L7 7M17 7L7 17" stroke-width="2" stroke-linecap="round"/></svg>`
                    });
                    deleteBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const updated = getSavedAiReports().filter((item) => item.id !== report.id);
                        saveAiReports(updated);
                        renderAiReportBoard();
                    });
                    
                    const rangeText = report.startIdx && report.endIdx
                        ? `${report.startIdx} ~ ${report.endIdx}`
                        : "-";
                    const dateText = formatReportDate(report.createdAt);
                    const previewText = report.preview || "";
                    
                    const tr = createElement("tr", {className: "report-board-row"},
                        createElement("td", {}, deleteBtn),
                        createElement("td", {textContent: String(rowNumber)}),
                        createElement("td", {textContent: report.language || ""}),
                        createElement("td", {textContent: rangeText, title: rangeText}),
                        createElement("td", {textContent: String(report.wordCount || 0)}),
                        createElement("td", {textContent: previewText, title: previewText}),
                        createElement("td", {textContent: dateText, title: dateText})
                    );
                    
                    tr.addEventListener("click", () => {
                        openSavedAiReport(report);
                    });
                    
                    tbody.appendChild(tr);
                });
            }
            
            function setReportFooterVisibility(inReportMode) {
                const listView = document.getElementById("flashcardListView");
                const reportContainer = document.getElementById("flashcardReportContainer");
                const csvBtn = document.getElementById("flashcardCsvDownload");
                const ankiSyncBtn = document.getElementById("flashcardAnkiSyncBtn");
                const ankiDeckContainer = document.getElementById("flashcardAnkiDeckContainer");
                
                if (listView) listView.style.display = inReportMode ? "none" : "block";
                if (reportContainer) reportContainer.style.display = inReportMode ? "flex" : "none";
                if (reportMainBtn) reportMainBtn.style.display = inReportMode ? "none" : "";
                if (csvBtn) csvBtn.style.display = inReportMode ? "none" : "";
                if (ankiSyncBtn) ankiSyncBtn.style.display = inReportMode ? "none" : "";
                if (ankiDeckContainer) ankiDeckContainer.style.visibility = inReportMode ? "hidden" : "";
            }
            
            function showAiReportBoardView() {
                setReportFooterVisibility(true);
                const boardView = document.getElementById("flashcardReportBoardView");
                const detailView = document.getElementById("flashcardReportDetailView");
                if (boardView) boardView.style.display = "flex";
                if (detailView) detailView.style.display = "none";
                if (reportLanguageSelector) reportLanguageSelector.value = targetLanguage;
                renderAiReportBoard();
            }
            
            function showAiReportDetailView() {
                setReportFooterVisibility(true);
                const boardView = document.getElementById("flashcardReportBoardView");
                const detailView = document.getElementById("flashcardReportDetailView");
                if (boardView) boardView.style.display = "none";
                if (detailView) detailView.style.display = "flex";
            }
            
            function openSavedAiReport(report) {
                showAiReportDetailView();
                const reportContainer = document.getElementById("flashcardReportContainer");
                const reportBody = document.getElementById("flashcardReportBody");
                const downloadReportBtn = document.getElementById("flashcardDownloadReportBtn");
                
                if (reportBody) {
                    reportBody.innerHTML = report.content || "";
                }
                if (downloadReportBtn) {
                    downloadReportBtn.disabled = !report.content;
                }
                if (reportBody) {
                    reportBody.scrollTop = 0;
                }
            }
            
            if (reportGenerateBtn) {
                reportGenerateBtn.addEventListener("click", () => {
                    generateAiReport(100);
                });
            }
            
            if (reportDropdownBtn) {
                reportDropdownBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    reportMenu.style.display = reportMenu.style.display === "none" ? "flex" : "none";
                });
            }
            
            if (reportBoardBackBtn) {
                reportBoardBackBtn.addEventListener("click", () => {
                    setReportFooterVisibility(false);
                });
            }
            
            if (reportBackBtn) {
                reportBackBtn.addEventListener("click", () => {
                    showAiReportBoardView();
                });
            }
            
            document.addEventListener("click", () => {
                if (reportMenu) reportMenu.style.display = "none";
            });
            
            async function generateAiReport(limitCount) {
                limitCount = Number.isInteger(limitCount) && limitCount > 0 ? limitCount : 100;
                showAiReportDetailView();
                
                const reportContainer = document.getElementById("flashcardReportContainer");
                const downloadReportBtn = document.getElementById("flashcardDownloadReportBtn");
                if (downloadReportBtn) {
                    downloadReportBtn.disabled = true;
                }
                
                const reportBody = document.getElementById("flashcardReportBody");
                if (reportBody) reportBody.innerHTML = `<em>Generating AI Learning Report<span class="loading-text"></span></em>`;
                
                try {
                    const {data, error} = await getDbClient()
                        .from(getTableName())
                        .select("idx, word, meaning, explanation")
                        .eq("language", targetLanguage)
                        .order("idx", {ascending: false})
                        .limit(limitCount);
                    
                    if (error) throw error;
                    
                    const reportBody = document.getElementById("flashcardReportBody");
                    
                    if (!data || data.length === 0) {
                        reportBody.innerHTML = "<em>No flashcards found for the current language.</em>";
                        if (downloadReportBtn) downloadReportBtn.disabled = true;
                        return;
                    }
                    
                    const orderedData = data.reverse();
                    const startIdx = orderedData[0]?.idx ?? 0;
                    const endIdx = orderedData[orderedData.length - 1]?.idx ?? 0;
                    const wordCount = orderedData.length;
                    
                    let reportContent = "";
                    
                    const localePairs = await getDictionaryLocalePairs();
                    const userNativeLang = (settings.llmResponseLanguage && settings.llmResponseLanguage !== "auto")
                        ? settings.llmResponseLanguage
                        : localePairs[await getDictionaryLanguage()] || "English";
                    
                    const wordsCSV = orderedData.map(item => `${item.word}, ${item.meaning}, ${item.explanation}`).join('\n');
                    
                    const timelineParagraphRangeByPreset = {
                        50: "2 to 3",
                        100: "3 to 5",
                        300: "5 to 8",
                        500: "7 to 10",
                    };
                    const timelineParagraphRange = timelineParagraphRangeByPreset[limitCount];
                    const patternParagraphCount = limitCount < 300 ? "1 comprehensive paragraph": "2 distinct paragraphs";
                    
                    const aiReportPrompt = `
                    Act as a corpus linguist and SLA (Second Language Acquisition) diagnostician, auditing a learner's recent vocabulary intake of ${limitCount} words for ${targetLanguage}.
                    
                    Data: CSV columns are idx (chronological order of encounter), word, meaning, explanation. Rows list words marked as unknown recently.
                    
                    Global Core Directives (apply across all sections):
                    - Evidence Integration: Treat every word strictly as inline supporting evidence within flowing prose. Never format words as standalone lists, tables, or itemized inventories.
                        Whenever citing a target-language word from the dataset, Append its meaning in ${userNativeLang} in parentheses immediately after the word (e.g., "酪農(낙농)").
                    - Citation Budget: Strictly cite 3 to 5 representative member words inline per paragraph. Do not exceed this limit; prioritize deep domain and linguistic analysis over vocabulary enumeration.
                    - Difficulty Calibration: Ground all difficulty explanations solely in domain-specific knowledge schemas, stylistic formality, or cultural prerequisites. Never compare against ${userNativeLang} cognates or surface-level loanwords.
                    - Consistent Proficiency Nomenclature: Use "difficulty band" (specifying CEFR, HSK, or JLPT benchmarks) as the sole standard term throughout the entire report.
                    - Scope Limitation: Treat this dataset as a short-term cross-sectional sample (${limitCount} words). Profile the linguistic and cognitive demands of the consumed texts themselves; do not infer longitudinal learner developmental leaps or milestone acquisitions.
                    
                    Prose Style & Tone Constraints:
                    - No Meta-Discourse: Write entirely from the perspective of an objective linguistic profiler. Never reference the dataset, log, table, or analytical process itself. Begin all paragraphs directly with the subject matter, reading stream, or linguistic phenomena.
                    - No Defensive Contrasts or Disclaimers: State diagnostic observations directly without qualifying what the analysis is not doing, or contrasting with alternative interpretations.
                    - Direct Thematic Openings: Begin every thematic paragraph directly with the topical domain or contextual setting of the source text. Do not use ordinal numbers, chronological step labels, or chapter/episode markers.
                    - Natural Native Phrasing: Write in idiomatic, professional ${userNativeLang} suitable for executive briefing reports. Render linguistic and stylistic concepts using native descriptive phrasing rather than transliterating academic jargon.
                    - Natural Paragraph Closure: Conclude each thematic block immediately upon detailing the domain schema and linguistic demands of that text group, without appending formulaic summary statements regarding learner mastery.
                    
                    Section Directives:
                    
                    1. Macro Source & Trajectory Roadmap:
                        Read the idx sequence as an unbroken chronological timeline from start to finish.
                        Write a concise macro narrative directly charting the progression of consumed topics, genres, and mediums across the timeline, and state the baseline difficulty band required by these materials.
                    
                    2. Content Timeline & Difficulty:
                        Follow the chronological idx timeline to partition the thematic flow into ${timelineParagraphRange} fluid, coherent paragraphs.
                        For each thematic stream, write one paragraph containing:
                        - Direct opening identifying the topical domain; 3-5 representative member words cited inline
                        - Inferred content style, medium, and discourse characteristics using natural native vocabulary
                        - Difficulty band supported by domain-level reasoning (e.g., specialized schema, compounding literacy demands, metaphorical nuance beyond literal translation, or cultural pragmatics)
                        Close Section 2 with exactly one synthesis sentence summarizing the overall difficulty band and the breadth of text genres covered across the timeline.
                    
                    3. Notable Linguistic & Corpus Patterns:
                        Independent of chronological flow, provide corpus-level generalizations across the vocabulary intake in ${patternParagraphCount}:
                        - Morphological & syntactic composition: density of compound words, multi-word collocations, and phrasal expressions versus single-morpheme roots.
                        - Stylistic & formality distribution: proportion and contrast between formal/academic written prose and informal/conversational/mimetic expressions.
                        - Semantic complexity: presence of metaphorical/figurative extensions (e.g., physical terms used in political/abstract discourse) versus technical domain jargon.
                        Cite 3-5 representative words inline as supporting evidence within flowing sentences.
                    
                    Output Rules:
                    - Language: ${userNativeLang}
                    - Format: HTML only, per the template below; no markdown code blocks, backticks, or text outside the <div>
                    
                    <div class="report-content">
                        <h2>1. Overview</h2>
                        <p>[Macro roadmap: chronological trajectory of content themes/sources from start to finish, and the general difficulty band of the consumed texts]</p>
                    
                        <h2>2. Content Timeline &amp; Difficulty</h2>
                        <!-- Render ${timelineParagraphRange} thematic paragraphs + 1 synthesis sentence -->
                        <p>[Thematic stream paragraph 1...]</p>
                        <p>[Thematic stream paragraph 2...]</p>
                        <p>[Thematic stream paragraph N...]</p>
                        <p>[Single synthesis sentence summarizing overall difficulty band and genre breadth]</p>
                    
                        <h2>3. Notable Patterns</h2>
                        <!-- Render ${patternParagraphCount} -->
                        <p>[Aggregate corpus observations: syntactic/morphological composition, stylistic/formality distribution, and semantic/metaphorical complexity]</p>
                    </div>
                    
                    Vocabulary Data:
                    ${wordsCSV}`;
                    
                    let rafId = null;
                    let llmProvider = settings.llmProvider;
                    let llmModel = settings.llmModel;
                    let savedKeys = settings.llmApiKeys;
                    let llmApiKey = savedKeys[llmProvider];
                    await streamOpenAIResponse(
                        llmProvider,
                        llmApiKey,
                        llmModel,
                        [{role: "user", content: removeIndent(aiReportPrompt)}],
                        (chunk) => {
                            const content = typeof chunk === "string" ? chunk : chunk.choices?.[0]?.delta?.content;
                            if (content) {
                                reportContent += content;
                                if (!rafId) {
                                    rafId = requestAnimationFrame(() => {
                                        const displayContent = reportContent
                                            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
                                            .replace(/<thought>[\s\S]*$/gi, '')
                                            .replace(/^\s*```(html)?\n?/i, '')
                                            .trim();
                                        if (displayContent && reportBody) {
                                            reportBody.innerHTML = displayContent;
                                            reportContainer.scrollTop = reportContainer.scrollHeight;
                                        }
                                        rafId = null;
                                    });
                                }
                            }
                        },
                        (finalContent) => {
                            if (rafId) {
                                cancelAnimationFrame(rafId);
                                rafId = null;
                            }
                            const cleaned = finalContent
                                .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
                                .replace(/<thought>[\s\S]*$/gi, '')
                                .trim();
                            const stripped = cleaned.replace(/^\s*```(html)?\n?/i, '').replace(/```\s*$/, '');
                            if (reportBody) {
                                if (stripped) {
                                    reportBody.innerHTML = stripped;
                                    if (downloadReportBtn) downloadReportBtn.disabled = false;
                                    
                                    const createdAt = new Date().toISOString();
                                    const newReport = {
                                        id: Date.now(),
                                        language: targetLanguage,
                                        startIdx,
                                        endIdx,
                                        wordCount,
                                        preview: extractReportPreview(stripped),
                                        content: stripped,
                                        createdAt
                                    };
                                    const savedReports = getSavedAiReports();
                                    savedReports.unshift(newReport);
                                    saveAiReports(savedReports);
                                } else {
                                    reportBody.innerHTML = "<em>Failed to generate report content.</em>";
                                    if (downloadReportBtn) downloadReportBtn.disabled = true;
                                }
                            }
                        },
                        (err) => {
                            console.error("Report generation error", err);
                            if (downloadReportBtn) downloadReportBtn.disabled = true;
                            if (reportBody) reportBody.innerHTML = `<em>Error generating report: ${err.message}</em>`;
                        }
                    );
                } catch (err) {
                    console.error("Report data fetch error", err);
                    if (downloadReportBtn) downloadReportBtn.disabled = true;
                    const reportBody = document.getElementById("flashcardReportBody");
                    if (reportBody) {
                        reportBody.innerHTML = `<em>Failed to fetch data: ${err.message}</em>`;
                    } else {
                        reportContainer.innerHTML = `<em>Failed to fetch data: ${err.message}</em>`;
                    }
                }
            }
            
            reportMainBtn.addEventListener("click", () => {
                showAiReportBoardView();
            });
            
            document.querySelectorAll(".split-btn-menu-item").forEach(item => {
                item.addEventListener("click", (e) => {
                    const count = parseInt(e.target.dataset.words, 10);
                    generateAiReport(count);
                });
            });
            
            const downloadReportBtn = document.getElementById("flashcardDownloadReportBtn");
            if (downloadReportBtn) {
                downloadReportBtn.addEventListener("click", async () => {
                    const reportBody = document.getElementById("flashcardReportBody");
                    if (!reportBody) return;
                    
                    downloadReportBtn.disabled = true;
                    const originalText = downloadReportBtn.textContent;
                    downloadReportBtn.textContent = "Capturing...";
                    
                    try {
                        const prevOverflowY = reportBody.style.overflowY;
                        const prevHeight = reportBody.style.height;
                        const prevScrollTop = reportBody.scrollTop;
                        
                        reportBody.style.overflowY = "visible";
                        reportBody.style.height = "auto";
                        reportBody.scrollTop = 0;
                        
                        const fullHeight = reportBody.scrollHeight + 30;
                        const fullWidth = reportBody.offsetWidth;
                        
                        const dataUrl = await htmlToImage.toPng(reportBody, {
                            backgroundColor: settings.colorMode === "dark" ? "#2a2c2e" : "#ffffff",
                            pixelRatio: 2,
                            skipFonts: true,
                            width: fullWidth,
                            height: fullHeight,
                            style: {
                                overflowY: "visible",
                                height: `${fullHeight}px`
                            }
                        });
                        
                        reportBody.style.overflowY = prevOverflowY;
                        reportBody.style.height = prevHeight;
                        reportBody.scrollTop = prevScrollTop;
                        
                        const link = createElement("a", {
                            href: dataUrl,
                            download: `learning_report_${targetLanguage}.png`
                        });
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (err) {
                        console.error("Report capture failed:", err);
                        alert("Failed to capture the report image.");
                    } finally {
                        downloadReportBtn.disabled = false;
                        downloadReportBtn.textContent = originalText;
                    }
                });
            }
        }
        
        function setupLLMUsageEventListeners() {
            let llmUsageStatsChart = null;
            
            function getChartThemeColors() {
                const isDark = settings.colorMode === "dark";
                return {
                    fontColor: getComputedStyle(document.body).getPropertyValue('--font-color').trim(),
                    gridColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                };
            }
            
            function calculateEntryMetrics(entry, mode = "cost") {
                const {model, provider, tokens = {}, isPriority} = entry;
                
                if (mode === "tokens") {
                    const tokenTypes = [
                        {type: "cached", value: tokens.cached || 0},
                        {type: "input", value: tokens.input || 0},
                        {type: "reasoning", value: tokens.reasoning || 0},
                        {type: "output", value: tokens.output || 0}
                    ];
                    return tokenTypes
                        .filter(item => item.value > 0)
                        .map(({type, value}) => ({key: `${model} - ${type}`, value}));
                }
                
                const [inputPrice, outputPrice, cachedPrice] = getLLMPricing(model, provider);
                const multiplier = isPriority ? 1.8 : 1.0;
                
                const costTypes = [
                    {type: "cached", value: (tokens.cached || 0) * cachedPrice * multiplier},
                    {type: "input", value: (tokens.input || 0) * inputPrice * multiplier},
                    {type: "reasoning", value: (tokens.reasoning || 0) * outputPrice * multiplier},
                    {type: "output", value: (tokens.output || 0) * outputPrice * multiplier}
                ];
                
                return costTypes
                    .filter(item => item.value > 0)
                    .map(({type, value}) => ({key: `${model} - ${type}`, value}));
            }
            
            function getLocalDateKey(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
            }
            
            function parseDateKeyToLocal(dateKey) {
                const [y, m, d] = dateKey.split("-").map(Number);
                return new Date(y, m - 1, d);
            }
            
            function getEntryDateKey(entry) {
                if (entry.date) return entry.date;
                return getLocalDateKey(new Date(entry.timestamp));
            }
            
            function getWeekStartKeyFromDateKey(dateKey) {
                const d = parseDateKeyToLocal(dateKey);
                d.setDate(d.getDate() - d.getDay());
                return getLocalDateKey(d);
            }
            
            function buildLLMUsageChartData(history, selectedPeriod, selectedMode = "cost") {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let periodicLabel = "Daily";
                const buckets = [];
                
                if (selectedPeriod === "week") {
                    const start = new Date(today);
                    start.setDate(today.getDate() - 6);
                    
                    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
                        buckets.push({
                            key: getLocalDateKey(d),
                            label: d.toLocaleString("en-US", {weekday: "short"}),
                            values: {},
                            requestCount: 0
                        });
                    }
                } else if (selectedPeriod === "month") {
                    const start = new Date(today);
                    start.setMonth(today.getMonth() - 1);
                    
                    if (start.getDate() !== today.getDate()) start.setDate(0);
                    
                    start.setDate(start.getDate() + 1);
                    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
                        buckets.push({
                            key: getLocalDateKey(d),
                            label: String(d.getDate()),
                            values: {},
                            requestCount: 0
                        });
                    }
                } else if (selectedPeriod === "year") {
                    periodicLabel = "Monthly";
                    
                    const startMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1);
                    
                    for (let m = new Date(startMonth); m <= today; m.setMonth(m.getMonth() + 1)) {
                        buckets.push({
                            key: getLocalDateKey(m).slice(0, 7),
                            label: m.toLocaleString("en-US", {month: "short"}),
                            values: {},
                            requestCount: 0
                        });
                    }
                } else {
                    const firstDate = history.length ? parseDateKeyToLocal(getEntryDateKey(history[0])) : new Date(0);
                    const lastDate = history.length ? parseDateKeyToLocal(getEntryDateKey(history[history.length - 1])) : new Date(0);
                    const useMonthly = Math.ceil((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)) > 52 * 2;
                    periodicLabel = useMonthly ? "Monthly" : "Weekly";
                    
                    const distinctKeys = [...new Set(history.map(e => {
                        const dateKey = getEntryDateKey(e);
                        return useMonthly ? dateKey.slice(0, 7) : getWeekStartKeyFromDateKey(dateKey);
                    }))].sort();
                    
                    distinctKeys.forEach(key => buckets.push({
                        key,
                        label: key,
                        values: {},
                        requestCount: 0
                    }));
                }
                
                const allSeriesSet = new Set();
                const bucketMap = new Map(buckets.map(b => [b.key, b]));
                
                history.forEach(entry => {
                    const dateKey = getEntryDateKey(entry);
                    const matchKey = (selectedPeriod === "year" || (selectedPeriod === "all" && periodicLabel === "Monthly"))
                        ? dateKey.slice(0, 7)
                        : (selectedPeriod === "all" && periodicLabel === "Weekly")
                            ? getWeekStartKeyFromDateKey(dateKey)
                            : dateKey;
                    
                    const bucket = bucketMap.get(matchKey);
                    if (bucket) {
                        const count = entry.requestCount ?? 1;
                        bucket.requestCount = (bucket.requestCount || 0) + count;
                        const items = calculateEntryMetrics(entry, selectedMode);
                        items.forEach(({key, value}) => {
                            bucket.values[key] = (bucket.values[key] || 0) + value;
                            allSeriesSet.add(key);
                        });
                    }
                });
                
                const allSeriesKeys = Array.from(allSeriesSet);
                const labels = buckets.map(b => b.label);
                const requestCounts = buckets.map(b => b.requestCount);
                let runningTotal = 0;
                
                const cumulativeData = buckets.map(b => {
                    const periodicTotal = allSeriesKeys.reduce((sum, key) => sum + (b.values[key] || 0), 0);
                    runningTotal += periodicTotal;
                    return runningTotal;
                });
                
                const colorPalette = [
                    "#4F75FF", "#E15B64", "#F4B251", "#43A783",
                    "#9D78DA", "#3EB5BD", "#EB7E53", "#D6688D",
                    "#7AA35A", "#64748B", "#6C7CE8", "#D96B9A",
                    "#3AAFA9", "#E08244", "#8C68C8", "#708090"
                ];
                
                const barDatasets = allSeriesKeys.length
                    ? allSeriesKeys.map((seriesKey, idx) => ({
                        type: "bar",
                        label: seriesKey,
                        yAxisID: "yPeriodic",
                        stack: "metricStack",
                        data: buckets.map(b => b.values[seriesKey] || 0),
                        backgroundColor: colorPalette[idx % colorPalette.length],
                        borderRadius: 2,
                        barPercentage: 0.6
                    }))
                    : [{
                        type: "bar",
                        label: selectedMode === "tokens" ? "Tokens" : "Cost",
                        yAxisID: "yPeriodic",
                        stack: "metricStack",
                        data: buckets.map(() => 0),
                        backgroundColor: "#7f8fa6"
                    }];
                
                const cumulativeDataset = {
                    type: "line",
                    label: "Cumulative",
                    yAxisID: "yCumulative",
                    data: cumulativeData,
                    borderColor: "#b07c6a",
                    backgroundColor: "#b07c6a25",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                };
                
                return {labels, barDatasets, cumulativeDataset, periodicLabel, requestCounts};
            }
            
            function drawLLMUsageStatsChart(labels, barDatasets, cumulativeDataset, selectedPeriod, periodicLabelOverride, selectedMode = "cost", requestCounts = []) {
                const metricName = selectedMode === "tokens" ? "Tokens" : "Cost";
                const titleMap = {
                    week: `LLM Usage ${metricName} (Past Week)`,
                    month: `LLM Usage ${metricName} (Past Month)`,
                    year: `LLM Usage ${metricName} (Past Year)`,
                    all: `LLM Usage ${metricName} (All Time)`
                };
                const defaultPeriodLabelMap = {
                    week: "Daily",
                    month: "Daily",
                    year: "Monthly",
                    all: "Monthly"
                };
                const periodLabel = periodicLabelOverride || defaultPeriodLabelMap[selectedPeriod] || "Daily";
                const titleText = titleMap[selectedPeriod] || titleMap.week;
                
                const titleEl = document.getElementById("llmUsageStatsTitle");
                if (titleEl) titleEl.textContent = titleText;
                
                const ctx = document.getElementById("llmUsageStatsChart")?.getContext("2d");
                if (!ctx) return;
                
                const {fontColor, gridColor} = getChartThemeColors();
                
                if (llmUsageStatsChart) {
                    llmUsageStatsChart.destroy();
                    llmUsageStatsChart = null;
                }
                
                const formatValue = (val) => {
                    if (selectedMode === "tokens") {
                        return `${Math.round(val).toLocaleString()} tokens`;
                    }
                    return val < 0.01 ? `$${val.toFixed(5)}` : `$${val.toFixed(4)}`;
                };
                
                const formatAxisTick = (val) => {
                    if (selectedMode === "tokens") {
                        if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
                        if (val >= 1000) return (val / 1000).toFixed(0) + "k";
                        return val.toLocaleString();
                    }
                    if (val === 0) return "$0";
                    if (val < 0.001) return "$" + val.toFixed(4);
                    if (val < 0.01) return "$" + val.toFixed(3);
                    return "$" + val.toFixed(2);
                };
                
                llmUsageStatsChart = new Chart(ctx, {
                    data: {
                        labels,
                        datasets: [...barDatasets, cumulativeDataset]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                top: 15,
                                bottom: 5,
                                left: 5,
                                right: 5
                            }
                        },
                        interaction: {
                            mode: "index",
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: "bottom",
                                labels: {
                                    boxWidth: 10,
                                    boxHeight: 10,
                                    padding: 12,
                                    color: fontColor,
                                    font: {size: 10}
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const val = context.parsed.y;
                                        if (val === 0 && context.dataset.type === "bar") return null;
                                        return ` ${context.dataset.label}: ${formatValue(val)}`;
                                    },
                                    footer: (tooltipItems) => {
                                        let periodicSum = 0;
                                        const dataIndex = tooltipItems[0]?.dataIndex;
                                        const rowCount = requestCounts[dataIndex] || 0;
                                        
                                        tooltipItems.forEach(item => {
                                            if (item.dataset.type === "bar") {
                                                periodicSum += item.parsed.y;
                                            }
                                        });
                                        
                                        const lines = [];
                                        if (periodicSum > 0) {
                                            lines.push(`Period Total: ${formatValue(periodicSum)}`);
                                        }
                                        lines.push(`Requests: ${rowCount} calls`);
                                        return lines.join("\n");
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                grid: {display: false},
                                ticks: {
                                    autoSkip: true,
                                    color: fontColor
                                }
                            },
                            yPeriodic: {
                                type: "linear",
                                position: "left",
                                stacked: true,
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: selectedMode === "tokens" ? `${periodLabel} Tokens` : `${periodLabel} Cost ($)`,
                                    color: fontColor
                                },
                                grid: {
                                    color: gridColor
                                },
                                ticks: {
                                    color: fontColor,
                                    callback: formatAxisTick
                                }
                            },
                            yCumulative: {
                                type: "linear",
                                position: "right",
                                beginAtZero: true,
                                grid: {drawOnChartArea: false},
                                title: {
                                    display: true,
                                    text: selectedMode === "tokens" ? "Cumulative Tokens" : "Cumulative ($)",
                                    color: fontColor
                                },
                                ticks: {
                                    color: fontColor,
                                    callback: formatAxisTick
                                }
                            }
                        }
                    }
                });
            }
            
            function mapDbRowToLLMUsageEntry(row) {
                return {
                    idx: row.idx,
                    timestamp: new Date(row.created_at).getTime(),
                    language: row.language,
                    provider: row.provider,
                    model: row.model,
                    tokens: {
                        cached: row.cached_tokens || 0,
                        input: row.input_tokens || 0,
                        reasoning: row.reasoning_tokens || 0,
                        output: row.output_tokens || 0
                    },
                    isPriority: Boolean(row.is_priority)
                };
            }
            
            async function fetchLLMUsageLogsInBatches() {
                let allData = [];
                let from = 0;
                const batchSize = 10000;
                let hasMore = true;
                
                while (hasMore) {
                    let query = getDbClient()
                        .from(getLLMUsageTableName())
                        .select("*")
                        .order("created_at", {ascending: true})
                        .order("idx", {ascending: true});
                    
                    if (settings.useCentralDb) {
                        query = query.eq("user_id", centralUserId);
                    }
                    
                    const {data, error} = await query.range(from, from + batchSize - 1);
                    if (error) {
                        console.error("Failed to fetch LLM usage logs in batches:", error);
                        break;
                    }
                    
                    if (!data || data.length === 0) {
                        hasMore = false;
                    } else {
                        allData = allData.concat(data);
                        from += data.length;
                        if (data.length < 1000) {
                            hasMore = false;
                        }
                    }
                }
                
                return allData.map(mapDbRowToLLMUsageEntry);
            }
            
            async function fetchLLMUsageLogs() {
                if (isDbReady()) {
                    try {
                        return await fetchLLMUsageLogsInBatches();
                    } catch (err) {
                        console.error("DB query exception:", err);
                    }
                }
                
                const rawData = localStorage.getItem("lingq_llm_usage_history");
                return rawData ? JSON.parse(rawData) : [];
            }
            
            async function fetchLLMUsageDailyStats() {
                if (isDbReady()) {
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const rpcName = settings.useCentralDb ? "get_llm_usage_daily_stats_central" : "get_llm_usage_daily_stats";
                    
                    const {data, error} = await getDbClient().rpc(rpcName, {
                        p_tz: timeZone
                    });
                    
                    if (!error && data) {
                        return data.map(row => ({
                            date: row.date,
                            language: row.language,
                            provider: row.provider,
                            model: row.model,
                            tokens: {
                                cached: row.cached_tokens,
                                input: row.input_tokens,
                                reasoning: row.reasoning_tokens,
                                output: row.output_tokens
                            },
                            isPriority: row.is_priority,
                            requestCount: row.request_count
                        }));
                    }
                }
                
                return await fetchLLMUsageLogs();
            }
            
            async function fetchRecentLLMUsageLogs(selectedLang = "all", limitCount = 100) {
                if (isDbReady()) {
                    try {
                        let query = getDbClient()
                            .from(getLLMUsageTableName())
                            .select("*")
                            .order("created_at", {ascending: false})
                            .order("idx", {ascending: false})
                            .limit(limitCount);
                        
                        if (settings.useCentralDb) {
                            query = query.eq("user_id", centralUserId);
                        }
                        if (selectedLang && selectedLang !== "all") {
                            query = query.eq("language", selectedLang);
                        }
                        
                        const {data, error} = await query;
                        if (error) {
                            console.error("Failed to fetch recent LLM usage logs:", error);
                        } else if (data) {
                            return data.map(mapDbRowToLLMUsageEntry);
                        }
                    } catch (err) {
                        console.error("Recent LLM logs DB query exception:", err);
                    }
                }
                
                const rawData = localStorage.getItem("lingq_llm_usage_history");
                const allLocal = rawData ? JSON.parse(rawData) : [];
                const filtered = selectedLang === "all" ? allLocal : allLocal.filter(e => e.language === selectedLang);
                return filtered.slice(-limitCount).reverse();
            }
            
            let currentLLMUsageHistory = [];
            
            async function loadLLMUsageStats() {
                currentLLMUsageHistory = await fetchLLMUsageDailyStats();
                
                const languageSelector = document.getElementById("llmUsageLanguageSelector");
                const currentSelectedLang = languageSelector?.value || "all";
                
                const uniqueLanguages = Array.from(new Set(currentLLMUsageHistory.map(e => e.language).filter(Boolean))).sort();
                
                if (languageSelector) {
                    languageSelector.innerHTML = "";
                    const allOpt = createElement("option", {value: "all", textContent: "All"});
                    languageSelector.appendChild(allOpt);
                    
                    uniqueLanguages.forEach(lang => {
                        const opt = createElement("option", {value: lang, textContent: lang});
                        languageSelector.appendChild(opt);
                    });
                    
                    languageSelector.value = uniqueLanguages.includes(currentSelectedLang) ? currentSelectedLang : "all";
                }
                
                function getFilteredHistory() {
                    const selectedLang = languageSelector?.value || "all";
                    if (selectedLang === "all") return currentLLMUsageHistory;
                    return currentLLMUsageHistory.filter(e => e.language === selectedLang);
                }
                
                function updateSummaryAndChart(selectedPeriod, selectedMode) {
                    const history = getFilteredHistory();
                    const containerEl = document.getElementById("llmUsageStatsContainer");
                    const period = selectedPeriod || containerEl?.querySelector(".llm-usage-period-tabs .btn-ghost.active")?.dataset.period || "week";
                    const mode = selectedMode || containerEl?.querySelector(".llm-usage-mode-tabs .btn-ghost.active")?.dataset.mode || "cost";
                    
                    let totalCost = 0;
                    let totalTokens = 0;
                    let totalRequests = 0;
                    history.forEach(entry => {
                        totalRequests += (entry.requestCount ?? 1);
                        const costItems = calculateEntryMetrics(entry, "cost");
                        costItems.forEach(({value}) => {
                            totalCost += value;
                        });
                        const tokenItems = calculateEntryMetrics(entry, "tokens");
                        tokenItems.forEach(({value}) => {
                            totalTokens += value;
                        });
                    });
                    
                    const summaryEl = document.getElementById("llmUsageTotalSummary");
                    if (summaryEl) {
                        if (mode === "tokens") {
                            summaryEl.textContent = `Total: ${Math.round(totalTokens).toLocaleString()} tokens (${totalRequests.toLocaleString()} requests)`;
                        } else {
                            summaryEl.textContent = `Total: $${totalCost.toFixed(4)} (${totalRequests.toLocaleString()} requests)`;
                        }
                    }
                    
                    const {
                        labels,
                        barDatasets,
                        cumulativeDataset,
                        periodicLabel,
                        requestCounts
                    } = buildLLMUsageChartData(history, period, mode);
                    drawLLMUsageStatsChart(labels, barDatasets, cumulativeDataset, period, periodicLabel, mode, requestCounts);
                }
                
                async function renderRecentLLMUsageLogs() {
                    const recentLogsContainer = document.getElementById("llmUsageRecentLogsContainer");
                    if (!recentLogsContainer) return;
                    
                    const RECENT_LOGS_LIMIT = 100;
                    const selectedLang = languageSelector?.value || "all";
                    const recentLogs = await fetchRecentLLMUsageLogs(selectedLang, RECENT_LOGS_LIMIT);
                    recentLogsContainer.innerHTML = "";
                    
                    if (recentLogs.length === 0) {
                        const emptyMessage = createElement("div", {className: "llm-usage-log-empty"}, "No usage logs recorded.");
                        recentLogsContainer.appendChild(emptyMessage);
                        return;
                    }
                    
                    const formatTime = (ts) => {
                        const d = new Date(ts);
                        const pad = (n) => String(n).padStart(2, "0");
                        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    };
                    
                    const rows = recentLogs.map((entry) => {
                        const deleteBtn = createElement("button", {
                            className: "delete-row-btn",
                            title: "Delete this log",
                            innerHTML: `<svg viewBox="6 6 12 12" style="width: 10px; height: 10px;" stroke="currentColor"><path d="M17 17L7 7M17 7L7 17" stroke-width="2" stroke-linecap="round"/></svg>`
                        });
                        
                        const tokens = entry.tokens || {};
                        const cachedVal = tokens.cached || 0;
                        const inputVal = tokens.input || 0;
                        const reasoningVal = tokens.reasoning || 0;
                        const outputVal = tokens.output || 0;
                        
                        const costItems = calculateEntryMetrics(entry, "cost");
                        const totalCost = costItems.reduce((sum, item) => sum + item.value, 0);
                        const costStr = totalCost < 0.01 ? `$${totalCost.toFixed(5)}` : `$${totalCost.toFixed(4)}`;
                        
                        const rowEl = createElement("tr", {className: "llm-usage-log-row"},
                            createElement("td", {}, deleteBtn),
                            createElement("td", {}, formatTime(entry.timestamp)),
                            createElement("td", {}, entry.provider || "-"),
                            createElement("td", {title: entry.model}, entry.model),
                            createElement("td", {}, entry.language || "-"),
                            createElement("td", {}, cachedVal ? cachedVal.toLocaleString() : "-"),
                            createElement("td", {}, inputVal ? inputVal.toLocaleString() : "-"),
                            createElement("td", {}, reasoningVal ? reasoningVal.toLocaleString() : "-"),
                            createElement("td", {}, outputVal ? outputVal.toLocaleString() : "-"),
                            createElement("td", {}, costStr)
                        );
                        
                        deleteBtn.addEventListener("click", async (ev) => {
                            ev.stopPropagation();
                            deleteBtn.disabled = true;
                            
                            if (isDbReady() && entry.idx != null) {
                                try {
                                    let query = getDbClient().from(getLLMUsageTableName()).delete().eq("idx", entry.idx);
                                    if (settings.useCentralDb) {
                                        query = query.eq("user_id", centralUserId);
                                    }
                                    const {error} = await query;
                                    if (error) {
                                        console.error("Failed to delete log from DB:", error);
                                        deleteBtn.disabled = false;
                                        return;
                                    }
                                } catch (err) {
                                    console.error("Delete DB log exception:", err);
                                    deleteBtn.disabled = false;
                                    return;
                                }
                            }
                            
                            try {
                                const storageKey = "lingq_llm_usage_history";
                                const rawData = localStorage.getItem(storageKey);
                                if (rawData) {
                                    const stored = JSON.parse(rawData);
                                    const filteredStored = stored.filter((item) => {
                                        if (entry.idx != null && item.idx != null) return item.idx !== entry.idx;
                                        return item.timestamp !== entry.timestamp;
                                    });
                                    localStorage.setItem(storageKey, JSON.stringify(filteredStored));
                                }
                            } catch (err) {
                                console.error("Failed to update localStorage after log deletion:", err);
                            }
                            
                            currentLLMUsageHistory = await fetchLLMUsageDailyStats();
                            
                            const activePeriod = container.querySelector(".llm-usage-period-tabs .btn-ghost.active")?.dataset.period || "week";
                            const activeMode = container.querySelector(".llm-usage-mode-tabs .btn-ghost.active")?.dataset.mode || "cost";
                            updateSummaryAndChart(activePeriod, activeMode);
                            
                            rowEl.remove();
                            if (recentLogsContainer.querySelectorAll(".llm-usage-log-row").length === 0) {
                                recentLogsContainer.innerHTML = "";
                                recentLogsContainer.appendChild(createElement("div", {className: "llm-usage-log-empty"}, "No usage logs recorded."));
                            }
                        });
                        
                        return rowEl;
                    });
                    
                    const tableEl = createElement("table", {id: "llmUsageRecentLogsTable"},
                        createElement("thead", {},
                            createElement("tr", {},
                                createElement("th", {className: "llm-log-col-btn"}),
                                createElement("th", {className: "llm-log-col-time"}, "Time"),
                                createElement("th", {className: "llm-log-col-provider"}, "Provider"),
                                createElement("th", {className: "llm-log-col-model"}, "Model"),
                                createElement("th", {className: "llm-log-col-lang"}, "Lang"),
                                createElement("th", {className: "llm-log-col-num"}, "Cached"),
                                createElement("th", {className: "llm-log-col-num"}, "Input"),
                                createElement("th", {className: "llm-log-col-num"}, "Reasoning"),
                                createElement("th", {className: "llm-log-col-num"}, "Output"),
                                createElement("th", {className: "llm-log-col-cost"}, "Cost")
                            )
                        ),
                        createElement("tbody", {}, ...rows)
                    );
                    
                    recentLogsContainer.appendChild(tableEl);
                }
                
                const container = document.getElementById("llmUsageStatsContainer");
                if (!container) return;
                const periodTabs = container.querySelectorAll(".llm-usage-period-tabs .btn-ghost");
                const modeTabs = container.querySelectorAll(".llm-usage-mode-tabs .btn-ghost");
                
                if (!container.dataset.initialized) {
                    modeTabs.forEach(btn => {
                        btn.addEventListener("click", () => {
                            modeTabs.forEach(tab => tab.classList.remove("active"));
                            btn.classList.add("active");
                            const activePeriod = container.querySelector(".llm-usage-period-tabs .btn-ghost.active")?.dataset.period || "week";
                            updateSummaryAndChart(activePeriod, btn.dataset.mode);
                        });
                    });
                    
                    periodTabs.forEach(btn => {
                        btn.addEventListener("click", () => {
                            periodTabs.forEach(tab => tab.classList.remove("active"));
                            btn.classList.add("active");
                            const activeMode = container.querySelector(".llm-usage-mode-tabs .btn-ghost.active")?.dataset.mode || "cost";
                            updateSummaryAndChart(btn.dataset.period, activeMode);
                        });
                    });
                    
                    if (languageSelector) {
                        languageSelector.addEventListener("change", () => {
                            const activePeriod = container.querySelector(".llm-usage-period-tabs .btn-ghost.active")?.dataset.period || "week";
                            const activeMode = container.querySelector(".llm-usage-mode-tabs .btn-ghost.active")?.dataset.mode || "cost";
                            updateSummaryAndChart(activePeriod, activeMode);
                            renderRecentLLMUsageLogs();
                        });
                    }
                    
                    container.dataset.initialized = "1";
                }
                
                const activePeriod = container.querySelector(".llm-usage-period-tabs .btn-ghost.active")?.dataset.period || "week";
                const activeMode = container.querySelector(".llm-usage-mode-tabs .btn-ghost.active")?.dataset.mode || "cost";
                updateSummaryAndChart(activePeriod, activeMode);
                await renderRecentLLMUsageLogs();
            }
            
            const usageButtons = [
                document.getElementById("llmUsageButton"),
                document.getElementById("llmUsageLogBtn")
            ].filter(Boolean);
            const usagePopup = document.getElementById("llmUsagePopup");
            
            changeScrollAmount("#llmUsageRecentLogsContainer", 0.1);
            
            usageButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    usagePopup.style.display = "block";
                    bringPopupToFront(usagePopup);
                    ensurePopupInViewport(usagePopup);
                    makeDraggable(usagePopup, document.getElementById("llmUsageDragHandle"));
                    loadLLMUsageStats();
                });
            });
            
            const closeBtn = document.getElementById("closeLLMUsagePopupBtn");
            if (closeBtn && usagePopup) {
                closeBtn.addEventListener("click", () => {
                    usagePopup.style.display = "none";
                });
            }
            
            const clearBtn = document.getElementById("clearLLMUsageBtn");
            if (clearBtn) {
                clearBtn.addEventListener("click", async () => {
                    if (!confirm("Are you sure you want to clear the LLM usage history?")) return;
                    
                    if (isDbReady()) {
                        try {
                            let query = getDbClient().from(getLLMUsageTableName()).delete();
                            if (settings.useCentralDb) {
                                query = query.eq("user_id", centralUserId);
                            } else {
                                query = query.neq("idx", 0);
                            }
                            const {error} = await query;
                            if (error) {
                                console.error("Failed to delete logs from DB:", error);
                            }
                        } catch (err) {
                            console.error("Clear DB exception:", err);
                        }
                    }
                    localStorage.removeItem("lingq_llm_usage_history");
                    await loadLLMUsageStats();
                });
            }
            
            const exportBtn = document.getElementById("exportLLMUsageBtn");
            if (exportBtn) {
                exportBtn.addEventListener("click", async () => {
                    const history = await fetchLLMUsageLogs();
                    const blob = new Blob([JSON.stringify(history, null, 2)], {type: "application/json"});
                    const dateStr = new Date().toISOString().slice(0, 10);
                    const fileName = `lingq_llm_usage_history_${dateStr}.json`;
                    
                    const url = URL.createObjectURL(blob);
                    const a = createElement("a", {href: url, download: fileName});
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            }
            
            const importInput = document.getElementById("importLLMUsageInput");
            if (importInput) {
                importInput.addEventListener("change", (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            if (!Array.isArray(importedData)) {
                                alert("Invalid JSON format: Expected an array of log entries.");
                                return;
                            }
                            
                            const currentHistory = await fetchLLMUsageLogs();
                            const existingKeys = new Set(currentHistory.map(item => `${item.timestamp}_${item.model}`));
                            
                            const newEntries = importedData.filter(item => {
                                const key = `${item.timestamp}_${item.model}`;
                                if (existingKeys.has(key)) return false;
                                existingKeys.add(key);
                                return true;
                            });
                            
                            if (isDbReady() && newEntries.length > 0) {
                                const rowsToInsert = newEntries.map(item => ({
                                    ...(settings.useCentralDb && {user_id: centralUserId}),
                                    language: item.language || null,
                                    provider: item.provider || settings.llmProvider,
                                    model: item.model || "unknown",
                                    cached_tokens: item.tokens?.cached || 0,
                                    input_tokens: item.tokens?.input || 0,
                                    reasoning_tokens: item.tokens?.reasoning || 0,
                                    output_tokens: item.tokens?.output || 0,
                                    is_priority: Boolean(item.isPriority),
                                    created_at: new Date(item.timestamp).toISOString()
                                }));
                                
                                const {error} = await getDbClient()
                                    .from(getLLMUsageTableName())
                                    .insert(rowsToInsert);
                                
                                if (error) {
                                    console.error("DB import error:", error);
                                    alert("Failed to insert imported logs into DB: " + error.message);
                                    return;
                                }
                            } else if (!isDbReady()) {
                                const merged = [...currentHistory, ...newEntries].sort((a, b) => a.timestamp - b.timestamp);
                                localStorage.setItem("lingq_llm_usage_history", JSON.stringify(merged));
                            }
                            
                            await loadLLMUsageStats();
                            alert(`Import completed: ${newEntries.length} new entries added.`);
                        } catch (err) {
                            console.error("Import error:", err);
                            alert("Failed to parse JSON file.");
                        } finally {
                            event.target.value = "";
                        }
                    };
                    reader.readAsText(file);
                });
            }
        }
        
        function generatePopupCSS() {
            return `
                :root {
                    --font-color: ${colorSettings.fontColor};
                    --background-color: ${settings.colorMode === "dark" ? "#2a2c2e" : "#ffffff"}
                }

                /*Color picker*/

                .color-picker {
                    width: 30px;
                    height: 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    border: 1px solid rgba(125, 125, 125, 30%);
                }

                .pcr-app {
                    z-index: 200000 !important;
                }

                .pcr-app .pcr-interaction .pcr-result {
                    color: var(--font-color) !important;
                }

                /*Popup settings*/

                #lingqAddonSettings {
                    color: var(--font-color);
                }

                .popup {
                    position: fixed;
                    top: 40%;
                    left: 40%;
                    transform: translate(-40%, -40%);
                    background-color: var(--background-color, #2a2c2e);
                    color: var(--font-color, #e0e0e0);
                    border: 1px solid rgb(125 125 125 / 30%);
                    border-radius: 8px;
                    box-shadow: 8px 8px 8px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    display: none;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .popup-close-top-btn {
                    position: absolute;
                    top: 3px;
                    right: 14px;
                    font-size: 2rem;
                    cursor: pointer;
                    line-height: 1;
                    z-index: 1;
                }

                .popup-drag-handle {
                    cursor: move;
                    background-color: rgba(128, 128, 128, 0.2);
                    padding: 8px;
                    border-radius: 8px 8px 0 0;
                    text-align: center;
                    user-select: none;
                }

                .popup-row {
                    margin: 5px 0;
                }

                .nav-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 5px;
                }

                .popup-button {
                    padding: 5px 10px;
                    border: 1px solid rgb(125, 125, 125, 50%);
                    border-radius: 5px;
                    margin: 5px 0;
                }

                .popup-button:disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }

                .popup-section {
                    border: 1px solid rgb(125 125 125 / 50%);
                    padding: 5px 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                }

                .popup-input {
                    flex-grow: 1;
                    border: 1px solid rgb(125 125 125 / 50%);
                    border-radius: 5px;
                    padding: 0 5px;
                }

                #downloadProgressContainer {
                    display: none;
                }

                #downloadProgressText {
                    text-align: center;
                    margin-bottom: 5px;
                    font-size: 0.9em;
                }

                #downloadProgressBar {
                    width: 100%;
                    height: 20px;
                }

                progress[value]::-webkit-progress-bar {
                    border-radius: 5px;
                }

                progress[value]::-webkit-progress-value {
                    border-radius: 5px;
                }

                select {
                    width: 100%;
                    margin-top: 5px;
                    padding: 5px;
                    background: rgb(125 125 125 / 10%) !important;
                }

                option {
                    background: var(--background-color) !important;
                }

                #flashcardPopupHeader,
                #flashcardReportBoardHeader,
                #flashcardReportHeaderRow {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    margin: 10px 0;
                    height: 45px;
                }

                #flashcardSearchInput {
                    width: 300px;
                    border: 1px solid #444 !important;
                    padding: 3px 8px !important;
                    border-radius: 4px !important;
                }

                #flashcardPagination {
                    display: flex;
                    align-items: center;
                }

                #flashcardTableContainer {
                    height: 435px;
                    overflow-y: auto;
                }

                #flashcardTable {
                    table-layout: fixed;
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 5px;
                    padding: 0 5px;
                }

                #flashcardTable thead {
                    position: sticky;
                    top: 0;
                    background: var(--background-color);
                }

                #flashcardTable thead th {
                    cursor: pointer;
                    user-select: none;
                    white-space: nowrap;
                }

                #flashcardTable td {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size: 0.9em;
                }

                #flashcardTable td + td {
                    padding-left: 10px;
                }

                #flashcardTable th.fc-col-btn {
                    width: 20px;
                }

                #flashcardTable th.fc-col-idx {
                    width: 55px;
                }

                #flashcardTable th.fc-col-word {
                    width: 16%;
                }

                #flashcardTable th.fc-col-pronunciation {
                    width: 18%;
                }

                #flashcardTable th.fc-col-meaning {
                    width: 16%;
                }

                #flashcardTable th.fc-col-explanation {
                    width: 50%;
                }

                #flashcardStatsContainer {
                    padding: 10px 0;
                    margin: 5px 0;
                    border-top: 1px solid rgb(125 125 125 / 20%);
                    border-bottom: 1px solid rgb(125 125 125 / 20%);
                }

                #flashcardStatsHeader {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                #flashcardStatsTitle {
                    font-size: 0.9em;
                    color: var(--font-color);
                }

                .flashcard-period-tabs {
                    display: flex;
                    gap: 5px;
                    justify-content: space-between;
                }

                .flashcard-period-tabs .btn-ghost {
                    flex: 1;
                    padding: 0 5px;
                    color: var(--font-color);
                    border-radius: 5px;
                }

                .flashcard-period-tabs .btn-ghost.active {
                    background-color: var(--border);
                    font-weight: bold;
                }

                .flashcard-chart-wrapper {
                    height: 150px;
                    width: 100%;
                }

                #flashcardTable .delete-row-btn {
                    width: 10px;
                    height: 10px;
                }

                #flashcardPopupButtons {
                    display: flex; justify-content: flex-end; margin: 10px 0;
                }

                #flashcardReportContainer h2 {
                    font-size: 1.4em !important;
                    font-weight: 700 !important;
                    margin-top: 15px !important;
                    margin-bottom: 10px !important;
                    border-bottom: 1px solid var(--border-color, #444) !important;
                    padding-bottom: 5px !important;
                    color: var(--font-color) !important;
                }

                #flashcardReportContainer h3 {
                    font-size: 1.15em !important;
                    font-weight: 600 !important;
                    margin-top: 12px !important;
                    margin-bottom: 6px !important;
                    color: var(--font-color) !important;
                }

                #flashcardReportContainer p {
                    margin-bottom: 12px !important;
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                    color: var(--font-color) !important;
                }

                #flashcardReportContainer ul {
                    list-style-type: disc !important;
                    padding-left: 25px !important;
                    margin-bottom: 15px !important;
                }

                #flashcardReportContainer li {
                    margin-bottom: 6px !important;
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                    color: var(--font-color) !important;
                }
                
                #flashcardReportContainer strong,
                #flashcardReportContainer b {
                    font-weight: 700 !important;
                }

                #flashcardReportTableContainer {
                    height: 635px;
                    overflow-y: auto;
                }

                #flashcardReportBody {
                    height: 635px;
                    overflow-y: auto;
                    box-sizing: border-box;
                    padding-right: 5px;
                }

                #flashcardReportTable {
                    table-layout: fixed;
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 5px;
                    padding: 10px 5px;
                }

                #flashcardReportTable thead {
                    position: sticky;
                    top: 0;
                    background: var(--background-color);
                    z-index: 1;
                }

                #flashcardReportTable thead th {
                    text-align: left;
                    white-space: nowrap;
                    font-size: 0.9em;
                    border-bottom: 1px solid rgb(125 125 125 / 30%);
                    padding-bottom: 4px;
                }

                #flashcardReportTable td {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size: 0.9em;
                    padding: 4px 0;
                }

                #flashcardReportTable td + td,
                #flashcardReportTable th + th {
                    padding-left: 10px;
                }

                #flashcardReportTable tr.report-board-row {
                    cursor: pointer;
                }

                #flashcardReportTable tr.report-board-row:hover {
                    background-color: rgba(125, 125, 125, 0.12);
                }

                #flashcardReportTable .delete-row-btn {
                    width: 10px;
                    height: 10px;
                }

                #flashcardReportTable th.fc-rep-col-btn {
                    width: 24px;
                }

                #flashcardReportTable th.fc-rep-col-no {
                    width: 40px;
                }

                #flashcardReportTable th.fc-rep-col-lang {
                    width: 55px;
                }

                #flashcardReportTable th.fc-rep-col-range {
                    width: 130px;
                }

                #flashcardReportTable th.fc-rep-col-words {
                    width: 65px;
                }

                #flashcardReportTable th.fc-rep-col-overview {
                    width: auto;
                }

                #flashcardReportTable th.fc-rep-col-date {
                    width: 135px;
                }

                .split-btn-group {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                .split-btn-main {
                    border-top-right-radius: 0 !important;
                    border-bottom-right-radius: 0 !important;
                    border-right: none !important;
                    margin: 0 !important;
                }
                .split-btn-dropdown {
                    border-top-left-radius: 0 !important;
                    border-bottom-left-radius: 0 !important;
                    padding: 5px 8px !important;
                    margin: 0 !important;
                }
                .split-btn-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 5px;
                    background-color: var(--background-color);
                    border: 1px solid rgb(125 125 125 / 30%);
                    border-radius: 4px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    z-index: 10002;
                    min-width: 110px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .split-btn-menu-item {
                    padding: 8px 15px;
                    cursor: pointer;
                    color: var(--font-color);
                    font-size: 13px;
                }
                .split-btn-menu-item:hover {
                    background-color: rgba(125, 125, 125, 0.2);
                }

                @keyframes dots-animation {
                    0% { content: ""; }
                    25% { content: "."; }
                    50% { content: ".."; }
                    75% { content: "..."; }
                }
                .loading-text::after {
                    content: ".";
                    animation: dots-animation 1.5s infinite steps(1);
                    display: inline-block;
                    width: 15px;
                    text-align: left;
                }

                #llmUsageRecentLogsContainer {
                    height: 150px;
                    overflow-y: auto;
                    border: 1px solid rgb(125 125 125 / 50%);
                    border-radius: 5px;
                    font-size: 0.8em;
                }

                #llmUsageRecentLogsTable {
                    table-layout: fixed;
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                #llmUsageRecentLogsTable th {
                    position: sticky;
                    top: 0;
                    background: var(--background-color);
                    z-index: 1;
                    user-select: none;
                    padding: 4px 6px;
                    border-bottom: 1px solid var(--border);
                    font-weight: bold;
                    text-align: left;
                }

                #llmUsageRecentLogsTable td {
                    padding: 3px 6px;
                    border-bottom: 1px solid rgba(128, 128, 128, 0.15);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                #llmUsageRecentLogsTable tr:hover {
                    background: rgba(125, 125, 125, 0.1);
                }

                .llm-usage-log-empty {
                    text-align: center;
                    opacity: 0.5;
                    font-size: 0.85em;
                    padding: 15px 4px;
                }

                #llmUsageRecentLogsTable th.llm-log-col-btn {
                    width: 30px;
                    user-select: none;
                    text-align: center;
                }

                #llmUsageRecentLogsTable td:first-child {
                    text-align: center;
                }

                #llmUsageRecentLogsTable .delete-row-btn {
                    width: 14px;
                    height: 14px;
                    cursor: pointer;
                    opacity: 0.6;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    vertical-align: middle;
                }

                #llmUsageRecentLogsTable .delete-row-btn:hover {
                    opacity: 1;
                }

                #llmUsageRecentLogsTable th.llm-log-col-time {
                    width: 115px;
                }

                #llmUsageRecentLogsTable th.llm-log-col-provider {
                    width: 75px;
                    opacity: 0.85;
                }

                #llmUsageRecentLogsTable td:nth-child(3) {
                    opacity: 0.85;
                }

                #llmUsageRecentLogsTable th.llm-log-col-model {
                    width: auto;
                }

                #llmUsageRecentLogsTable th.llm-log-col-lang {
                    width: 40px;
                    text-align: center;
                }

                #llmUsageRecentLogsTable td:nth-child(5) {
                    text-align: center;
                }

                #llmUsageRecentLogsTable th.llm-log-col-num {
                    width: 70px;
                    text-align: right;
                    opacity: 0.85;
                }

                #llmUsageRecentLogsTable td:nth-child(6),
                #llmUsageRecentLogsTable td:nth-child(7),
                #llmUsageRecentLogsTable td:nth-child(8),
                #llmUsageRecentLogsTable td:nth-child(9) {
                    text-align: right;
                    opacity: 0.85;
                }

                #llmUsageRecentLogsTable th.llm-log-col-cost {
                    width: 75px;
                    text-align: right;
                }

                #llmUsageRecentLogsTable td:nth-child(10) {
                    text-align: right;
                }
            `;
        }
        
        const language = getLessonLanguage();
        ensureLanguageSettings(language);
        
        const colorSettings = getColorSettings(settings.colorMode);
        
        const settingsButton = createElement("button", {
            id: "lingqAddonSettings",
            textContent: "⚙️",
            title: "LingQ Addon Settings",
            className: "nav-button"
        });
        
        const downloadWordsButton = createElement("button", {
            id: "lingqDownloadWords",
            textContent: "💾",
            title: "Download Words",
            className: "nav-button"
        });
        
        const ttsPlaygroundButton = createElement("button", {
            id: "ttsPlayground",
            textContent: "🗣️",
            title: "TTS Playground",
            className: "nav-button"
        });
        
        const flashcardManagerButton = createElement("button", {
            id: "flashcardManagerButton",
            textContent: "📝",
            title: "Flashcard Manager",
            className: "nav-button"
        });
        
        const llmUsageButton = createElement("button", {
            id: "llmUsageButton",
            textContent: "📊",
            title: "LLM Usage Log",
            className: "nav-button"
        });
        
        function mountNavBarButtons() {
            if (document.getElementById("lingqAddonSettings")) return;
            addElementToNavBar(settingsButton);
            addElementToNavBar(downloadWordsButton);
            addElementToNavBar(ttsPlaygroundButton);
            addElementToNavBar(flashcardManagerButton);
            addElementToNavBar(llmUsageButton);
        }
        
        mountNavBarButtons();

        const navBarObserver = new MutationObserver(() => {
            if (!document.getElementById("lingqAddonSettings")) {
                mountNavBarButtons();
            }
        });
        const navBarTarget = document.querySelector('[data-slot="sidebar-wrapper"]') || document.body;
        navBarObserver.observe(navBarTarget, { childList: true, subtree: true });
        
        const settingsPopup = createSettingsPopup();
        document.body.appendChild(settingsPopup);
        
        const downloadWordsPopup = createDownloadWordsPopup();
        document.body.appendChild(downloadWordsPopup);
        
        const ttsPopup = createTTSPlaygroundPopup();
        document.body.appendChild(ttsPopup);
        
        const flashcardPopup = createFlashcardPopup();
        document.body.appendChild(flashcardPopup);
        
        const llmUsagePopup = createLLMUsagePopup();
        document.body.appendChild(llmUsagePopup);
        
        const popupCSS = generatePopupCSS();
        applyCSS(popupCSS);
        setupSettingEventListeners();
        setupDownloadWordsEventListeners();
        setupTTSPlaygroundEventListeners();
        setupFlashcardPopupEventListeners();
        setupLLMUsageEventListeners();
        
        window.addEventListener("resize", () => {
            document.querySelectorAll(".popup").forEach(popup => {
                ensurePopupInViewport(popup);
            });
        });
        
        document.querySelectorAll(".popup").forEach(popup => {
            if (!popup.dataset.popupFocusBound) {
                popup.addEventListener("mousedown", () => {
                    bringPopupToFront(popup);
                });
                popup.dataset.popupFocusBound = "true";
            }
        });
    }
    
    async function setupReader() {
        const language = getLessonLanguage();

        function isNativePageMode() {
            return Boolean(document.querySelector(".poc-page"));
        }

        function isVideoLesson() {
            return Boolean(document.querySelector('div[data-reader-video-stage="true"]'));
        }

        function isTextOnlyLesson() {
            return !document.querySelector('footer button[aria-label="Play"], footer button[aria-label="Pause"], footer[aria-label="Lesson player"], div[aria-label="Lesson player"]') && !isVideoLesson();
        }

        try {
            document.startViewTransition = undefined;
        } catch (e) {}

        function getCalculatedVttCueSettings() {
            const container = document.getElementById("local-video-container");
            if (!container) return "size:80% align:middle line:90%";
            
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            if (!containerWidth || !containerHeight) return "size:80% align:middle line:90%";
            
            const videoAspectRatio = 16 / 9;
            const videoWidthRatio = Math.min(1.0, (containerHeight * videoAspectRatio) / containerWidth);
            const targetSubtitlePercent = Math.max(20, Math.round(80 * videoWidthRatio));
            
            return `size:${targetSubtitlePercent}% align:center`;
        }

        function convertSentencesToVttBlobUrl(sentences) {
            function formatTime(seconds) {
                const date = new Date(0);
                date.setSeconds(seconds);
                const match = date.toISOString().match(/T(\d{2}:\d{2}:\d{2})\.(\d{3})/);
                return `${match[1]}.${match[2]}`;
            }
            
            const cueSettings = getCalculatedVttCueSettings();
            const vttLines = ["WEBVTT\n"];
            
            sentences.forEach((sentence) => {
                if (!sentence.timestamp || sentence.timestamp.length < 2) return;
                
                const startTime = formatTime(sentence.timestamp[0]);
                const endTime = formatTime(sentence.timestamp[1]);
                const text = sentence.text || "";
                
                vttLines.push(`${startTime} --> ${endTime} ${cueSettings}\n${text}\n`);
            });
            
            const blob = new Blob([vttLines.join("\n")], {type: "text/vtt"});
            return URL.createObjectURL(blob);
        }

        let cachedLocalVideoFiles, attemptAutoMatch;
        const mediaInstances = new Set();
        let isVideoEnded = false;
        let lastSkipTargetTime = null;
        let lastSkipTimestamp = 0;

        function isSkipActive() {
            return Date.now() - lastSkipTimestamp < 800;
        }

        function markVideoEnded() {
            if (isVideoEnded) return;
            isVideoEnded = true;
            const video = document.getElementById("addonLocalVideo");
            if (video && !video.paused) {
                video.pause();
            }
            mediaInstances.forEach(media => {
                if (media && !media.paused) {
                    media.pause();
                }
            });
            const playButton = document.querySelector(".section--player button.lingq-audio-player");
            const playButtonSvg = playButton?.querySelector("svg");
            if (playButton && playButtonSvg && playButtonSvg.classList.contains("svg-icon--pause")) {
                playButton.click();
            }
        }

        function unlockVideoEnded() {
            if (!isVideoEnded) return;
            isVideoEnded = false;
        }

        function handleLocalVideoContainerVisibility() {
            async function bindLingQPlayerControls(videoElement) {
                const sliderHandle = await waitForElement('footer [data-slot="slider-thumb"], footer [role="slider"], .audio-player--progress .rc-slider-handle', 10000);
                const playButton = await waitForElement('footer button[aria-label="Play"], footer button[aria-label="Pause"], .section--player button.lingq-audio-player', 10000);
                const speedLabel = document.querySelector('#addon-speed-controller .addon-speed-text, footer button[aria-label^="Playback speed"], .audio-player--controllers span.leading-none.text-xl');
                const miniProgressBar = document.getElementById("local-video-mini-progress");
                
                if (!sliderHandle || !playButton) {
                    console.warn("Required LingQ control elements missing. Sync binder stopped.");
                    return;
                }
                
                const isLingQPlaying = () => {
                    for (const media of mediaInstances) {
                        if (media && media.id !== "addonLocalVideo" && !media.paused && !media.ended) return true;
                    }
                    const pauseBtn = document.querySelector('footer button[aria-label="Pause"], .section--player button.lingq-audio-player .svg-icon--pause');
                    if (pauseBtn) return true;
                    const currentPlayBtn = document.querySelector('footer button[aria-label="Play"], footer button[aria-label="Pause"], .section--player button.lingq-audio-player') || playButton;
                    const svg = currentPlayBtn?.querySelector("svg");
                    return Boolean(svg && (svg.classList.contains("svg-icon--pause") || svg.classList.contains("lucide-pause")));
                };
                
                const getLingQSpeed = () => {
                    if (isCustomSpeedActive()) return settings.lingqSpeed[getLessonLanguage()];
                    const speedBtn = document.querySelector('footer button[aria-label^="Playback speed"]');
                    if (speedBtn) return parseFloat(speedBtn.textContent) || 1.0;
                    return parseFloat(speedLabel?.textContent ?? 1.0);
                };
                
                const syncPlaybackRate = () => {
                    const targetSpeed = getLingQSpeed();
                    if (videoElement.playbackRate !== targetSpeed) {
                        videoElement.playbackRate = targetSpeed;
                        console.log('[Sync]', `Playback speed updated to ${targetSpeed}x`);
                    }
                };
                
                let isVideoSeeking = false;
                let isAudioDrivenSeek = false;
                let seekingReleaseTimer = null;
                let pendingVideoSeek = false;
                let pendingMediaSeekCount = 0;
                let settleReleaseTimer = null;

                const checkAndReleaseSeekingLock = () => {
                    if (!pendingVideoSeek && pendingMediaSeekCount === 0) {
                        if (settleReleaseTimer) clearTimeout(settleReleaseTimer);
                        settleReleaseTimer = setTimeout(() => {
                            if (isVideoSeeking) {
                                isVideoSeeking = false;
                            }
                            settleReleaseTimer = null;
                        }, 80);
                    }
                };

                playButton.addEventListener("click", (event) => {
                    if (!event.isTrusted) return;
                    if (isLingQPlaying()) return;

                    const duration = videoElement.duration || 0;
                    if (isVideoEnded && duration > 0 && videoElement.currentTime >= duration - 0.1) {
                        isAudioDrivenSeek = true;
                        videoElement.currentTime = 0;
                        mediaInstances.forEach(media => {
                            if (media) media.currentTime = 0;
                        });
                    }
                    unlockVideoEnded();
                }, true);

                videoElement.addEventListener("click", () => {
                    unlockVideoEnded();
                });

                const handleUserKeydown = (event) => {
                    if (event.code === "Space" && !event.target.closest("input, textarea, [contenteditable='true']")) {
                        if (isLingQPlaying()) return;

                        const duration = videoElement.duration || 0;
                        if (isVideoEnded && duration > 0 && videoElement.currentTime >= duration - 0.1) {
                            isAudioDrivenSeek = true;
                            videoElement.currentTime = 0;
                            mediaInstances.forEach(media => {
                                if (media) media.currentTime = 0;
                            });
                        }
                        unlockVideoEnded();
                    }
                };
                window.addEventListener("keydown", handleUserKeydown, true);

                const progressContainer = document.querySelector(".audio-player--progress") || sliderHandle.parentElement;
                if (progressContainer) {
                    progressContainer.addEventListener("pointerdown", () => unlockVideoEnded(), true);
                    progressContainer.addEventListener("mousedown", () => unlockVideoEnded(), true);
                }

                const lessonReader = document.querySelector('div[data-reader-mode-body="true"]') || document.querySelector(".lesson-reader") || document.body;
                lessonReader.addEventListener("click", (event) => {
                    if (event.target.closest(".sentence-item, .reader-sentence, .sentence, .sentence-text")) {
                        unlockVideoEnded();
                    }
                }, true);

                const playerObserver = new MutationObserver(() => {
                    const duration = videoElement.duration || 0;
                    let preciseTargetTime = parseFloat(sliderHandle.getAttribute("aria-valuenow"));
                    if (isNaN(preciseTargetTime) || preciseTargetTime === 0) {
                        const ariaText = sliderHandle.getAttribute("aria-valuetext");
                        if (ariaText) {
                            const timeParts = ariaText.split('/')[0].trim().split(':');
                            if (timeParts.length === 2) {
                                preciseTargetTime = parseInt(timeParts[0], 10) * 60 + parseFloat(timeParts[1]);
                            } else if (timeParts.length === 3) {
                                preciseTargetTime = parseInt(timeParts[0], 10) * 3600 + parseInt(timeParts[1], 10) * 60 + parseFloat(timeParts[2]);
                            }
                        }
                    }
                    if (isNaN(preciseTargetTime)) preciseTargetTime = 0;
                    const isVideoAtEnd = videoElement.ended || (duration > 0 && videoElement.currentTime >= duration - 0.1);
                    const isTargetNearEnd = duration > 0 && preciseTargetTime >= duration - 0.1;
                    const isPlaying = isLingQPlaying();

                    if (duration > 0 && (isVideoAtEnd || isTargetNearEnd)) {
                        markVideoEnded();
                    }

                    if (isVideoEnded) {
                        if (!videoElement.paused) {
                            videoElement.pause();
                        }
                        if (miniProgressBar) {
                            miniProgressBar.style.width = "100%";
                        }
                        return;
                    }

                    if (isPlaying && videoElement.paused) {
                        if (isVideoAtEnd) {
                            isAudioDrivenSeek = true;
                            videoElement.currentTime = isTargetNearEnd ? 0 : preciseTargetTime;
                        }
                        videoElement.play().catch(() => {});
                    } else if (!isPlaying && !videoElement.paused) {
                        videoElement.pause();
                    }
                    
                    if (isVideoSeeking && !isSkipActive()) return;
                    if (videoElement.readyState < 3) return;
                    if (isVideoAtEnd && isTargetNearEnd) return;

                    const diff = videoElement.currentTime - preciseTargetTime;
                    const baseSpeed = getLingQSpeed();
                    
                    const syncThreshold = !isPlaying ? 0.1 : Math.max(0.5, 0.5 * baseSpeed);
                    const softSyncEnterThreshold = Math.max(0.25, 0.25 * baseSpeed);
                    const softSyncExitThreshold = Math.max(0.10, 0.10 * baseSpeed);
                    
                    if (Math.abs(diff) > syncThreshold) {
                        let isMediaCatchingUp = false;
                        if (isPlaying && diff > 0 && !isSkipActive()) {
                            mediaInstances.forEach(media => {
                                if (media && (Math.abs(videoElement.currentTime - media.currentTime) <= syncThreshold || media.currentTime > preciseTargetTime)) {
                                    isMediaCatchingUp = true;
                                }
                            });
                        }

                        if (!isMediaCatchingUp) {
                            isAudioDrivenSeek = true;
                            const seekOffset = isPlaying ? (0.3 * baseSpeed) : 0;
                            videoElement.currentTime = preciseTargetTime + seekOffset;
                        }
                    } else if (isPlaying) {
                        const isAlreadyAdjusted = videoElement.playbackRate !== baseSpeed;

                        if (diff < -softSyncEnterThreshold) {
                            videoElement.playbackRate = baseSpeed + 0.1;
                        } else if (diff > softSyncEnterThreshold) {
                            videoElement.playbackRate = Math.max(0.25, baseSpeed - 0.1);
                        } else if (isAlreadyAdjusted && Math.abs(diff) <= softSyncExitThreshold) {
                            videoElement.playbackRate = baseSpeed;
                        }
                    }
                    
                    if (miniProgressBar) {
                        const maxVal = parseFloat(sliderHandle.getAttribute("aria-valuemax")) || 1;
                        const percentage = (preciseTargetTime / maxVal) * 100;
                        miniProgressBar.style.width = `${percentage}%`;
                    }
                });
                
                const speedObserver = new MutationObserver(() => {
                    syncPlaybackRate();
                });
                
                playerObserver.observe(sliderHandle, {attributes: true, attributeFilter: ["aria-valuenow", "style"]});
                playerObserver.observe(playButton, {childList: true, subtree: true, attributes: true, attributeFilter: ["class"]});
                
                if (speedLabel) {
                    speedObserver.observe(speedLabel, {childList: true, characterData: true, subtree: true});
                }
                
                videoElement.addEventListener("play", () => {
                    if (isVideoEnded || !isLingQPlaying()) {
                        videoElement.pause();
                        return;
                    }
                });
                videoElement.addEventListener("playing", () => {
                    if (isVideoEnded || !isLingQPlaying()) {
                        videoElement.pause();
                        return;
                    }
                    if (isSkipActive()) return;
                    mediaInstances.forEach(media => {
                        if (media) {
                            const baseSpeed = getLingQSpeed();
                            const mediaDiffThreshold = Math.max(0.3, 0.3 * baseSpeed);
                            const diff = Math.abs(videoElement.currentTime - media.currentTime);
                            if (diff > mediaDiffThreshold) {
                                isVideoSeeking = true;
                                pendingMediaSeekCount++;
                                media.currentTime = videoElement.currentTime;
                                media.addEventListener("seeked", () => {
                                    pendingMediaSeekCount = Math.max(0, pendingMediaSeekCount - 1);
                                    checkAndReleaseSeekingLock();
                                }, { once: true });

                                if (seekingReleaseTimer) clearTimeout(seekingReleaseTimer);
                                const lockTimeout = 400;
                                seekingReleaseTimer = setTimeout(() => {
                                    pendingMediaSeekCount = 0;
                                    isVideoSeeking = false;
                                    seekingReleaseTimer = null;
                                }, lockTimeout);
                            }
                        }
                    });
                });
                videoElement.addEventListener("loadedmetadata", () => {
                    videoElement.volume = 1.0;
                });
                videoElement.addEventListener("seeked", () => {
                    pendingVideoSeek = false;
                    if (isVideoSeeking) {
                        checkAndReleaseSeekingLock();
                    }
                });
                videoElement.addEventListener("seeking", () => {
                    const duration = videoElement.duration || 0;
                    if (duration > 0 && videoElement.currentTime >= duration - 0.1) {
                        markVideoEnded();
                    }
                    if (isAudioDrivenSeek) {
                        isAudioDrivenSeek = false;
                        return;
                    }
                    if (isSkipActive()) {
                        return;
                    }

                    if (isVideoEnded && videoElement.currentTime < 1.0) {
                        videoElement.pause();
                        if (duration > 0) {
                            isAudioDrivenSeek = true;
                            videoElement.currentTime = duration;
                        }
                        return;
                    }

                    isVideoSeeking = true;
                    pendingVideoSeek = true;
                    if (settleReleaseTimer) {
                        clearTimeout(settleReleaseTimer);
                        settleReleaseTimer = null;
                    }

                    mediaInstances.forEach(media => {
                        if (media) {
                            const mediaDiff = Math.abs(videoElement.currentTime - media.currentTime);
                            if (mediaDiff > 0.1) {
                                pendingMediaSeekCount++;
                                media.currentTime = videoElement.currentTime;
                                media.addEventListener("seeked", () => {
                                    pendingMediaSeekCount = Math.max(0, pendingMediaSeekCount - 1);
                                    checkAndReleaseSeekingLock();
                                }, { once: true });
                            }
                        }
                    });

                    if (seekingReleaseTimer) clearTimeout(seekingReleaseTimer);
                    const maxLockTimeout = 600;
                    seekingReleaseTimer = setTimeout(() => {
                        if (isVideoSeeking) {
                            pendingVideoSeek = false;
                            pendingMediaSeekCount = 0;
                            isVideoSeeking = false;
                        }
                        seekingReleaseTimer = null;
                    }, maxLockTimeout);
                });
                videoElement.addEventListener("ended", () => {
                    markVideoEnded();
                });

                videoElement.addEventListener("timeupdate", () => {
                    const duration = videoElement.duration || 0;
                    if (duration > 0 && videoElement.currentTime >= duration - 0.1) {
                        markVideoEnded();
                    }
                });
                
                const isLingQPlayingInit = isLingQPlaying();
                if (isLingQPlayingInit && videoElement.paused) {
                    videoElement.play().catch(() => {
                    });
                }
                syncPlaybackRate();
            }
            
            function normalizeTitle(str) {
                return str
                    .toLowerCase()
                    .normalize("NFKC")
                    .replace(/[\\/:*?"<>|?？:：*＊"＂<＜>＞|｜/／\＼]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
            }
            
            function findBestMatchingFiles(files, lessonTitle) {
                const targetTitle = normalizeTitle(lessonTitle);
                if (!targetTitle) return {video: null, sub: null};
                
                const isTruncated = /(?:\.{2,}|…)\s*$/.test(targetTitle);
                const cleanTarget = isTruncated ? targetTitle.replace(/[\s.·…]+$/, "").trim() : targetTitle;
                
                let bestVideo = null;
                let bestSub = null;
                
                for (const file of files) {
                    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    const normalizedName = normalizeTitle(nameWithoutExt);
                    
                    const isMatch = isTruncated && cleanTarget.length >= 3
                        ? (normalizedName.startsWith(cleanTarget) || normalizedName.includes(cleanTarget))
                        : (normalizedName.includes(targetTitle) || targetTitle.includes(normalizedName));

                    if (!isMatch) continue;
                    
                    const isVideo = file.type.startsWith("video/") || /\.(mp4)$/i.test(file.name);
                    const isSub = /\.(srt|vtt)$/i.test(file.name);
                    
                    if (isVideo) {
                        if (!bestVideo) bestVideo = file;
                    } else if (isSub) {
                        if (!bestSub) bestSub = file;
                    }
                }
                
                return {video: bestVideo, sub: bestSub};
            }
            
            function buildLocalVideoUI() {
                const readerBody = document.querySelector('div[data-reader-mode-body="true"]');
                const targetParent = readerBody?.parentElement || document.querySelector('.reader-appearance') || document.body;
                if (!targetParent) return;
                
                const currentStyle = settings.styleType[getLessonLanguage()];
                let container = document.getElementById("local-video-container");
                
                if (currentStyle !== "localVideo") {
                    if (container) container.style.display = "none";
                    return;
                }
                
                if (container) {
                    container.style.display = "flex";
                    if (readerBody && container.parentElement !== targetParent) {
                        targetParent.insertBefore(container, readerBody);
                    }
                    return;
                }
                
                container = createElement("div", {id: "local-video-container"});
                
                const setupBox = createElement("div", {className: "local-video-setup-box"});
                const title = createElement("span", {
                    style: "font-weight: bold; font-size: 1.1em;",
                    textContent: "Local Video Player Setup"
                });
                
                let selectedVideoFile = null;
                let selectedSubtitleFile = null;
                
                const buttonRow = createElement("div", {
                    style: "display: flex; gap: 10px; width: 100%; min-width: 0; box-sizing: border-box; margin-bottom: 5px;"
                });
                
                const fileInput = createElement("input", {
                    className: "local-video-file-input",
                    type: "file",
                    multiple: true,
                    accept: "video/*,.srt,.vtt",
                    style: "display: none;"
                });
                const fileLabel = createElement("label", {
                    className: "local-video-button",
                    style: "flex: 1; min-width: 0; box-sizing: border-box; text-align: center;",
                    textContent: "Choose Files",
                    title: "Choose Files"
                });
                fileLabel.appendChild(fileInput);
                
                const folderInput = createElement("input", {
                    className: "local-video-folder-input",
                    type: "file",
                    webkitdirectory: true,
                    directory: true,
                    style: "display: none;"
                });
                const folderLabel = createElement("label", {
                    className: "local-video-button",
                    style: "flex: 1; min-width: 0; box-sizing: border-box; text-align: center;",
                    textContent: "Select Folder (Auto-match)",
                    title: "Select Folder (Auto-match)"
                });
                folderLabel.appendChild(folderInput);
                
                buttonRow.append(fileLabel, folderLabel);
                
                const startButton = createElement("button", {
                    className: "local-video-button",
                    textContent: "Start Player",
                    disabled: true,
                });
                
                const handleSpacebarStart = (event) => {
                    if (event.code === "Space" && !startButton.disabled && setupBox.style.display !== "none") {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        startButton.click();
                    }
                };
                window.addEventListener("keydown", handleSpacebarStart, true);
                
                setupBox.append(title, buttonRow, startButton);
                container.appendChild(setupBox);
                if (readerBody && targetParent) {
                    targetParent.insertBefore(container, readerBody);
                } else {
                    targetParent.appendChild(container);
                }
                
                const titleBar = createElement("div", {
                    className: "local-video-title-bar",
                    style: "display: none;"
                }, createElement("span", {
                    className: "local-video-title-text"
                }));
                container.appendChild(titleBar);

                const videoElement = createElement("video", {
                    id: "addonLocalVideo",
                    muted: false,
                    style: "width: 100%; height: 100%; flex-grow: 1; object-fit: contain; display: none; cursor: pointer;"
                });
                
                container.addEventListener("click", (event) => {
                    if (setupBox.style.display !== "none") return;
                    if (event.target.closest(".local-video-progress-wrapper")) return;
                    unlockVideoEnded();
                    clickElement('footer button[aria-label="Play"], footer button[aria-label="Pause"], .section--player button.lingq-audio-player');
                });
                
                const trackElement = createElement("track", {
                    kind: "subtitles",
                    srclang: "en",
                    label: "Local Sub",
                    id: "addonLocalVideoTrack"
                });
                
                videoElement.appendChild(trackElement);
                container.appendChild(videoElement);
                
                const progressWrapper = createElement("div", {
                    className: "local-video-progress-wrapper",
                    style: "display: none;"
                });
                const miniProgressBar = createElement("div", {id: "local-video-mini-progress"});
                progressWrapper.appendChild(miniProgressBar);
                container.appendChild(progressWrapper);
                
                attemptAutoMatch = async function attemptAutoMatch() {
                    if (!cachedLocalVideoFiles) return false;
                    
                    const titleElement = await waitForElement('header[data-site-header="true"] .truncate, h1.reader-heading', 3000);
                    if (!titleElement) return false;
                    
                    const title = titleElement.textContent.trim();
                    if (!title) return false;
                    
                    const match = findBestMatchingFiles(cachedLocalVideoFiles, title);
                    if (match.video) {
                        selectedVideoFile = match.video;
                        selectedSubtitleFile = match.sub;
                        
                        let statusText = `${selectedVideoFile.name}`;
                        if (selectedSubtitleFile) statusText += ` + ${selectedSubtitleFile.name}`;
                        
                        folderLabel.textContent = statusText;
                        folderLabel.title = statusText;
                        folderLabel.appendChild(folderInput);
                        startButton.disabled = false;
                        return true;
                    }
                    return false;
                };
                
                fileInput.addEventListener("change", (event) => {
                    const files = Array.from(event.target.files).slice(0, 2);
                    selectedVideoFile = files.find(file => file.type.startsWith("video/"));
                    selectedSubtitleFile = files.find(file => file.name.endsWith(".srt") || file.name.endsWith(".vtt"));
                    
                    if (selectedVideoFile) {
                        let statusText = `${selectedVideoFile.name}`;
                        if (selectedSubtitleFile) statusText += ` + ${selectedSubtitleFile.name}`;
                        else statusText += ` (Default Subtitle)`;
                        fileLabel.textContent = statusText;
                        fileLabel.title = statusText;
                        fileLabel.appendChild(fileInput);
                        startButton.disabled = false;
                    } else {
                        fileLabel.textContent = "Missing Video File! Try Again.";
                        fileLabel.title = "Missing Video File! Try Again.";
                        fileLabel.appendChild(fileInput);
                        startButton.disabled = true;
                        selectedSubtitleFile = null;
                    }
                });
                
                folderInput.addEventListener("change", async (event) => {
                    const files = Array.from(event.target.files);
                    if (files.length > 0) {
                        cachedLocalVideoFiles = files;
                        const matched = await attemptAutoMatch();
                        if (!matched) {
                            folderLabel.textContent = "No match found in folder.";
                            folderLabel.title = "No match found in folder.";
                            folderLabel.appendChild(folderInput);
                        }
                    }
                });
                
                if (cachedLocalVideoFiles) {
                    attemptAutoMatch();
                }
                
                startButton.addEventListener("click", () => {
                    if (!selectedVideoFile) return;
                    
                    videoElement.src = URL.createObjectURL(selectedVideoFile);
                    
                    if (selectedSubtitleFile) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const text = e.target.result;
                            const vttUrl = convertSrtToVttBlobUrl(text, getCalculatedVttCueSettings());
                            
                            trackElement.src = vttUrl;
                            trackElement.track.mode = "showing";
                        };
                        reader.readAsText(selectedSubtitleFile);
                    } else {
                        const lessonLanguage = getLessonLanguage();
                        const lessonId = getLessonId();
                        
                        getLessonSentences(lessonLanguage, lessonId)
                            .then((sentences) => {
                                if (sentences && sentences.length > 0) {
                                    trackElement.src = convertSentencesToVttBlobUrl(sentences);
                                    trackElement.track.mode = "showing";
                                }
                            })
                            .catch((error) => {
                                console.error("Failed to fetch default subtitles:", error);
                            });
                    }
                    
                    setupBox.style.display = "none";
                    videoElement.style.display = "block";
                    progressWrapper.style.display = "block";
                    
                    if (selectedVideoFile) {
                        const videoTitle = selectedVideoFile.name.replace(/\.[^/.]+$/, "");
                        const titleText = titleBar.querySelector(".local-video-title-text");
                        if (titleText) {
                            titleText.textContent = videoTitle;
                        }
                        titleBar.style.display = "flex";
                    }
                    
                    let initialTime = 0;
                    const sliderHandle = document.querySelector('footer [data-slot="slider-thumb"], footer [role="slider"], .audio-player--progress .rc-slider-handle');
                    if (sliderHandle) {
                        let currentProgress = parseFloat(sliderHandle.getAttribute("aria-valuenow"));
                        if (isNaN(currentProgress)) {
                            const valueText = sliderHandle.getAttribute("aria-valuetext");
                            if (valueText && valueText.includes("/")) {
                                const currentStr = valueText.split("/")[0].trim();
                                const parts = currentStr.split(":").map(Number);
                                if (parts.length === 2) currentProgress = parts[0] * 60 + parts[1];
                                else if (parts.length === 3) currentProgress = parts[0] * 3600 + parts[1] * 60 + parts[2];
                            }
                        }
                        currentProgress = currentProgress || 0;
                        const maxProgress = parseFloat(sliderHandle.getAttribute("aria-valuemax")) || 0;
                        const isCompleted = maxProgress > 0 && currentProgress >= maxProgress - 0.5;

                        if (!isCompleted && currentProgress > 0) {
                            initialTime = currentProgress;
                        }
                    } else if (typeof mediaInstances !== "undefined") {
                        mediaInstances.forEach((media) => {
                            if (media && document.body.contains(media) && media.currentTime > 0) {
                                const isCompleted = media.duration > 0 && media.currentTime >= media.duration - 0.5;
                                if (!isCompleted) {
                                    initialTime = media.currentTime;
                                }
                            }
                        });
                    }

                    const startPlayback = () => {
                        videoElement.currentTime = initialTime;
                        if (typeof mediaInstances !== "undefined") {
                            mediaInstances.forEach(media => {
                                if (media) media.currentTime = initialTime;
                            });
                        }
                        
                        const playButton = document.querySelector('footer button[aria-label="Play"], .section--player button.lingq-audio-player');
                        if (playButton) {
                            playButton.click();
                        }
                    };

                    const pauseButton = document.querySelector('footer button[aria-label="Pause"], .section--player button.lingq-audio-player .svg-icon--pause')?.closest('button');
                    if (pauseButton) {
                        pauseButton.click();
                    }

                    if (videoElement.readyState >= 3) {
                        startPlayback();
                    } else {
                        videoElement.addEventListener("canplay", startPlayback, { once: true });
                    }
                    
                    bindLingQPlayerControls(videoElement);
                    window.removeEventListener("keydown", handleSpacebarStart, true);
                });
            }
            
            buildLocalVideoUI();
        }

        // Volume Control & Local Video Audio Mute Hook
        function setupMediaElementHook() {
            const PageMediaElement = window.HTMLMediaElement;
            if (!PageMediaElement || window.__lingqAddonMediaHooked) return;
            window.__lingqAddonMediaHooked = true;

            const volumeDescriptor = Object.getOwnPropertyDescriptor(PageMediaElement.prototype, 'volume');
            const originalVolumeSetter = volumeDescriptor.set;
            const originalVolumeGetter = volumeDescriptor.get;
            
            Object.defineProperty(PageMediaElement.prototype, 'volume', {
                get: function () {
                    return originalVolumeGetter.call(this);
                },
                set: function (val) {
                    const src = this.src || '';
                    
                    if (src.startsWith('data:') || src.includes('/tts/')) {
                        return originalVolumeSetter.call(this, val);
                    }
                    
                    const lessonLang = getLessonLanguage();
                    if (lessonLang && settings.styleType[lessonLang] === "localVideo" && this.id !== "addonLocalVideo") {
                        return originalVolumeSetter.call(this, 0);
                    }
                    
                    const targetVolume = settings.lingqVolume;
                    const adjustedVolume = Math.min(Math.max(val * targetVolume, 0), 1);
                    return originalVolumeSetter.call(this, adjustedVolume);
                }
            });
            
            const originalPlay = PageMediaElement.prototype.play;
            PageMediaElement.prototype.play = function () {
                const lessonLang = getLessonLanguage();
                const isLocalVideoActive = lessonLang && settings.styleType[lessonLang] === "localVideo";

                if (isLocalVideoActive && isVideoEnded) {
                    this.pause();
                    return Promise.resolve();
                }

                const src = this.src || '';
                if (this.id !== "addonLocalVideo" && !src.startsWith('data:') && !src.includes('/tts/')) {
                    if (!mediaInstances.has(this)) {
                        mediaInstances.add(this);
                    }
                    this.volume = 1.0;
                    if (isCustomSpeedActive()) this.playbackRate = settings.lingqSpeed[getLessonLanguage()];
                }
                return originalPlay.apply(this, arguments);
            };
            
            const playbackRateDescriptor = Object.getOwnPropertyDescriptor(PageMediaElement.prototype, 'playbackRate');
            const originalPlaybackRateSetter = playbackRateDescriptor.set;
            
            Object.defineProperty(PageMediaElement.prototype, 'playbackRate', {
                get: playbackRateDescriptor.get,
                set: function (val) {
                    const src = this.src || '';
                    const isLingQAudio = this.id !== "addonLocalVideo" && !src.startsWith('data:') && !src.includes('/tts/');
                    if (isLingQAudio && isCustomSpeedActive()) {
                        return originalPlaybackRateSetter.call(this, settings.lingqSpeed[getLessonLanguage()]);
                    }
                    return originalPlaybackRateSetter.call(this, val);
                }
            });
        }
        setupMediaElementHook();

        function isCustomSpeedActive() {
            return Boolean(document.getElementById('addon-speed-controller'));
        }

        function setLingqVolume(vol) {
            settings.lingqVolume = Math.min(Math.max(vol, 0), 1);
            const perceptualVol = Math.pow(settings.lingqVolume, 2);
            
            const controllers = document.querySelector('.audio-player--controllers');
            const isYoutube = controllers?.querySelector('.controller-item--speed') || document.querySelector('iframe[src*="youtube"]');
            
            if (isYoutube) {
                const youtubeIframe = document.querySelector('.modal-container iframe, #sentence-video-player-portal iframe, iframe[src*="youtube"]');
                if (youtubeIframe && youtubeIframe.contentWindow) {
                    const volumePercent = Math.round(perceptualVol * 100);
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: "command",
                        func: "setVolume",
                        args: [volumePercent]
                    }), "*");
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: "command",
                        func: volumePercent === 0 ? "mute" : "unMute"
                    }), "*");
                }
            } else {
                mediaInstances.forEach(media => {
                    if (media) media.volume = perceptualVol;
                });
                document.querySelectorAll('audio').forEach(audio => {
                    if (audio) audio.volume = perceptualVol;
                });
                const localVideo = document.getElementById("addonLocalVideo");
                if (localVideo) localVideo.volume = perceptualVol;
            }

            const addonVolume = document.getElementById('addon-volume-controller');
            if (addonVolume) {
                const volPct = Math.round(settings.lingqVolume * 100);
                const volumeText = addonVolume.querySelector('.addon-volume-text');
                if (volumeText) volumeText.textContent = `${volPct}%`;
                const iconWrapper = addonVolume.querySelector('.icon-wrapper');
                if (iconWrapper) {
                    const svgMute = `<svg style="width: 17px; height: 17px; flex-shrink: 0;" viewBox="-2 -3 32 32"><path fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" d="m12 21-5-5H3v-6h4l5-5zm10-10-6 6m0-6 6 6"/></svg>`;
                    const svgLow = `<svg style="width: 17px; height: 17px; flex-shrink: 0;" viewBox="-2 -3 32 32"><path fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" d="m12 21-5-5H3v-6h4l5-5zm5-10c1.5 1.5 1.5 4.5 0 6"/></svg>`;
                    const svgHigh = `<svg style="width: 18px; height: 18px; flex-shrink: 0;" viewBox="-2 -3 32 32"><path fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" d="m12 21-5-5H3v-6h4l5-5zm5-10c1.5 1.5 1.5 4.5 0 6m4-9c3 2.5 3 7.5 0 10"/></svg>`;
                    if (settings.lingqVolume === 0) iconWrapper.innerHTML = svgMute;
                    else if (settings.lingqVolume <= 0.5) iconWrapper.innerHTML = svgLow;
                    else iconWrapper.innerHTML = svgHigh;
                }
                const volumeBtn = addonVolume.querySelector('button, a');
                if (volumeBtn) volumeBtn.setAttribute("title", `Volume: ${volPct}% (Click to cycle, Scroll to adjust)`);
            }
        }

        function setLingqSpeed(speed) {
            const currentLanguage = getLessonLanguage();
            const clampedSpeed = Math.round(Math.min(Math.max(speed, 0.5), 3.0) * 100) / 100;
            
            if (currentLanguage) {
                settings.lingqSpeed = {
                    ...settings.lingqSpeed,
                    [currentLanguage]: clampedSpeed
                };
            }
            localStorage.setItem("videoPlayerRate", String(clampedSpeed));

            const controllers = document.querySelector('.audio-player--controllers');
            const isYoutube = controllers?.querySelector('.controller-item--speed') || document.querySelector('iframe[src*="youtube"]');
            if (isYoutube) {
                const youtubeIframe = document.querySelector('.modal-container iframe, #sentence-video-player-portal iframe, iframe[src*="youtube"]');
                if (youtubeIframe && youtubeIframe.contentWindow) {
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: "command",
                        func: "setPlaybackRate",
                        args: [clampedSpeed]
                    }), "*");
                }
            }
            
            mediaInstances.forEach(media => {
                if (media) media.playbackRate = clampedSpeed;
            });
            document.querySelectorAll('audio').forEach(audio => {
                if (audio) audio.playbackRate = clampedSpeed;
            });
            const localVideo = document.getElementById("addonLocalVideo");
            if (localVideo) localVideo.playbackRate = clampedSpeed;

            const addonSpeedText = document.querySelector('#addon-speed-controller .addon-speed-text');
            if (addonSpeedText) {
                addonSpeedText.textContent = `${clampedSpeed}×`;
            }
        }

        function skipPlayback(deltaSeconds) {
            unlockVideoEnded();
            const localVideo = document.getElementById("addonLocalVideo");
            const isLocalVideoActive = localVideo && localVideo.style.display !== "none" && !isNaN(localVideo.currentTime);
            const sliderHandle = document.querySelector('footer [data-slot="slider-thumb"], footer [role="slider"], .audio-player--progress .rc-slider-handle');

            const now = Date.now();
            let baseTime;
            if (lastSkipTargetTime !== null && (now - lastSkipTimestamp < 800)) {
                baseTime = lastSkipTargetTime;
            } else {
                baseTime = isLocalVideoActive
                    ? localVideo.currentTime
                    : (sliderHandle ? (parseFloat(sliderHandle.getAttribute("aria-valuenow")) || 0) : 0);
            }
            const targetTime = Math.max(0, baseTime + deltaSeconds);
            lastSkipTargetTime = targetTime;
            lastSkipTimestamp = now;

            if (isLocalVideoActive && !isNaN(localVideo.duration)) {
                localVideo.currentTime = Math.min(localVideo.duration, targetTime);
            }

            const controllers = document.querySelector('.audio-player--controllers');
            const isYoutube = controllers?.querySelector('.controller-item--speed') || document.querySelector('iframe[src*="youtube"]');
            
            if (isYoutube) {
                const youtubeIframe = document.querySelector('.modal-container iframe, #sentence-video-player-portal iframe, iframe[src*="youtube"]');
                if (youtubeIframe && youtubeIframe.contentWindow) {
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: "command",
                        func: "seekTo",
                        args: [targetTime, true]
                    }), "*");
                    const volumePercent = Math.round(settings.lingqVolume * 100);
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: "command",
                        func: "setVolume",
                        args: [volumePercent]
                    }), "*");
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: "command",
                        func: volumePercent === 0 ? "mute" : "unMute"
                    }), "*");
                }
                return;
            }

            if (typeof mediaInstances !== "undefined" && mediaInstances.size > 0) {
                mediaInstances.forEach((media) => {
                    if (media && !isNaN(media.duration)) {
                        media.currentTime = Math.min(media.duration, targetTime);
                    }
                });
            } else {
                const audio = document.querySelector('audio');
                if (audio) {
                    const maxTime = !isNaN(audio.duration) ? audio.duration : targetTime;
                    audio.currentTime = Math.min(maxTime, targetTime);
                }
            }
        }

        function updateSkipButtonsUI() {
            const duration = settings.skipDuration;

            const updateButton = (btn, actionPrefix, shiftKey) => {
                if (!btn) return;
                const expectedTitle = `${actionPrefix} ${duration} seconds (${shiftKey})`;
                const expectedAria = `${actionPrefix} ${duration} seconds`;
                if (btn.getAttribute('title') !== expectedTitle) {
                    btn.setAttribute('title', expectedTitle);
                }
                if (btn.getAttribute('aria-label') !== expectedAria) {
                    btn.setAttribute('aria-label', expectedAria);
                }
                const container = btn.parentElement;
                if (container && container !== btn.closest('footer')) {
                    if (container.getAttribute('data-original-title') !== expectedAria) {
                        container.setAttribute('data-original-title', expectedAria);
                    }
                }

                const svg = btn.querySelector('svg');
                if (svg) {
                    let textNode = svg.querySelector('.addon-skip-text');
                    if (!textNode) {
                        textNode = createElement('text', {
                            className: 'addon-skip-text',
                            x: '12',
                            y: '12.5'
                        });
                        svg.appendChild(textNode);
                    }
                    const expectedDigit = duration < 10 ? 'true' : 'false';
                    if (textNode.dataset.singleDigit !== expectedDigit) {
                        textNode.dataset.singleDigit = expectedDigit;
                    }
                    if (textNode.textContent !== String(duration)) {
                        textNode.textContent = duration;
                    }
                }
            };

            const backwardBtn = document.querySelector('footer button[aria-label^="Replay"], .audio-player--controllers .controller-item--backward') ||
                               document.querySelector('.svg-icon--backward')?.closest('a');
            updateButton(backwardBtn, 'Replay', 'Shift+<');

            const forwardBtn = document.querySelector('footer button[aria-label^="Forward"], .audio-player--controllers .controller-item--forward') ||
                              document.querySelector('.svg-icon--forward')?.closest('a');
            updateButton(forwardBtn, 'Forward', 'Shift+>');
        }

        window.addEventListener("addon:skip-duration-changed", () => {
            updateSkipButtonsUI();
        });

        function getLessonTitle() {
            const titleElement = document.querySelector('header[data-site-header="true"] .truncate') || document.querySelector("h1.reader-heading");
            return titleElement?.textContent.trim() || "";
        }

        let isReaderMouseDown = false;
        window.addEventListener("mousedown", (event) => {
            isReaderMouseDown = !!event.target.closest?.('[data-reader-mode-body="true"]');
        }, true);
        window.addEventListener("mouseup", () => {
            isReaderMouseDown = false;
            document.body.style.removeProperty("user-select");
        }, true);

        function focusReaderElement(targetElement) {
            if (!targetElement || !targetElement.isConnected || targetElement.getClientRects().length === 0) return;
            if (isNativePageMode()) return;
            
            const scrollTarget = document.querySelector('[data-reader-mode-body="true"] > div.overflow-y-auto');
            if (!scrollTarget) return;

            if (isReaderMouseDown) {
                document.body.style.setProperty("user-select", "none");
                window.getSelection()?.removeAllRanges();
            }
            
            const targetRect = targetElement.getBoundingClientRect();
            const containerRect = scrollTarget.getBoundingClientRect();
            
            const relativeTop = targetRect.top - containerRect.top + scrollTarget.scrollTop;
            const containerHalfHeight = Math.floor(scrollTarget.offsetHeight / 2);
            const targetScrollTop = relativeTop + Math.floor(targetElement.offsetHeight / 2) - containerHalfHeight;
            smoothScrollTo(scrollTarget, targetScrollTop, 300);
        }

        function isFooterExpanded(footer = document.querySelector('footer')) {
            if (!footer) return false;
            return footer.getAttribute('aria-label') === 'Lesson player' ||
                   Boolean(footer.querySelector('button[aria-label^="Playback speed"], button[aria-label="Collapse player"]'));
        }

        let observedFooter = null;
        let audioPlayerObserver = null;
        let updateFooterFrame = null;
        
        function updateFooterControllers() {
            const footer = document.querySelector('footer');
            if (footer) {
                if (footer !== observedFooter) {
                    attachAudioPlayerObserver();
                    return;
                }
                if (!isFooterExpanded(footer)) {
                    document.getElementById('addon-speed-controller')?.remove();
                    document.getElementById('addon-volume-controller')?.remove();

                    const pauseBtn = footer.querySelector('button[aria-label="Pause"]');
                    if (pauseBtn && !pauseBtn.dataset.addonExpanding) {
                        pauseBtn.dataset.addonExpanding = "true";
                        setLingqVolume(settings.lingqVolume);
                        setLingqSpeed(settings.lingqSpeed[getLessonLanguage()] || 1.0);
                        pauseBtn.click();
                        const intervalId = setInterval(() => {
                            const currentFooter = document.querySelector('footer');
                            if (!currentFooter || isFooterExpanded(currentFooter)) {
                                clearInterval(intervalId);
                                return;
                            }
                            const playBtn = currentFooter.querySelector('button[aria-label="Play"]');
                            if (playBtn) {
                                clearInterval(intervalId);
                                playBtn.click();
                            }
                        }, 50);
                        setTimeout(() => {
                            clearInterval(intervalId);
                            delete pauseBtn.dataset.addonExpanding;
                        }, 1500);
                    }

                    return;
                }
            }
            setupSpeedController();
            setupVolumeController();
            setupCustomSkipController();
        }

        function scheduleFooterUpdate() {
            if (updateFooterFrame) return;
            updateFooterFrame = requestAnimationFrame(() => {
                updateFooterFrame = null;
                updateFooterControllers();
            });
        }

        async function attachAudioPlayerObserver() {
            if (isTextOnlyLesson()) return;
            const currentLanguage = getLessonLanguage();
            if (currentLanguage) {
                localStorage.setItem("videoPlayerRate", String(settings.lingqSpeed[currentLanguage] || 1.0));
            }
            const footer = await waitForElement('footer', 5000);
            if (!footer) return;
            
            if (audioPlayerObserver) {
                audioPlayerObserver.disconnect();
                audioPlayerObserver = null;
            }

            observedFooter = footer;
            
            audioPlayerObserver = new MutationObserver(() => {
                const currentFooter = document.querySelector('footer');
                if (currentFooter && currentFooter !== observedFooter) {
                    attachAudioPlayerObserver();
                    return;
                }
                scheduleFooterUpdate();
            });
            
            if (footer.parentElement) {
                audioPlayerObserver.observe(footer.parentElement, {
                    childList: true,
                    subtree: false
                });
            }
            
            audioPlayerObserver.observe(footer, {
                attributes: true,
                attributeFilter: ['aria-label', 'class'],
                subtree: true
            });
            
            scheduleFooterUpdate();
        }
        
        attachAudioPlayerObserver();
        
        function setupCustomSkipController() {
            const footer = document.querySelector('footer');
            const controllers = document.querySelector('.audio-player--controllers');
            if (!footer && !controllers) return;

            const backwardBtn = document.querySelector('footer button[aria-label^="Replay"], .audio-player--controllers .controller-item--backward') ||
                               document.querySelector('.svg-icon--backward')?.closest('a');
            if (backwardBtn && !backwardBtn.dataset.addonSkipHooked) {
                backwardBtn.dataset.addonSkipHooked = "true";
                backwardBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    skipPlayback(-settings.skipDuration);
                }, true);
            }

            const forwardBtn = document.querySelector('footer button[aria-label^="Forward"], .audio-player--controllers .controller-item--forward') ||
                              document.querySelector('.svg-icon--forward')?.closest('a');
            if (forwardBtn && !forwardBtn.dataset.addonSkipHooked) {
                forwardBtn.dataset.addonSkipHooked = "true";
                forwardBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    skipPlayback(settings.skipDuration);
                }, true);
            }

            updateSkipButtonsUI();
        }
        
        function setupSpeedController() {
            const footer = document.querySelector('footer');
            if (footer) {
                if (!isFooterExpanded(footer)) {
                    document.getElementById('addon-speed-controller')?.remove();
                    return;
                }

                const nativeSpeedBtn = footer.querySelector('button[aria-label^="Playback speed"]');
                if (nativeSpeedBtn && nativeSpeedBtn.style.display !== "none") {
                    nativeSpeedBtn.style.setProperty("display", "none", "important");
                }

                const currentSpeed = () => settings.lingqSpeed[getLessonLanguage()] || 1.0;
                let speedWrapper = document.getElementById('addon-speed-controller');

                const collapseBtn = footer.querySelector('button[aria-label="Collapse player"]');
                const rightControls = collapseBtn?.parentElement || footer;

                if (!speedWrapper) {
                    const minSpeed = 0.5;
                    const maxSpeed = 3.0;
                    const speedSteps = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
                    const wheelStep = 0.05;

                    const speedText = createElement("span", {
                        className: "addon-speed-text font-semibold select-none tabular-nums"
                    });

                    const speedBtn = createElement("button", {
                        type: "button",
                        className: "addon-speed-btn inline-flex items-center justify-center rounded-full hover:bg-ghost-hover text-foreground h-8 px-3 text-xs font-semibold cursor-pointer transition-colors select-none tabular-nums",
                        title: "Playback speed (Click to cycle, Scroll to adjust)"
                    }, speedText);

                    function updateSpeedLabel() {
                        const speed = currentSpeed();
                        const label = `${parseFloat(speed.toFixed(2))}×`;
                        speedText.textContent = label;
                        speedBtn.setAttribute("title", `Speed: ${label} (Click to cycle, Scroll to adjust)`);
                    }

                    speedBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const speed = currentSpeed();
                        const next = speedSteps.find((s) => s > speed + 0.01) || speedSteps[0];
                        setLingqSpeed(next);
                        updateSpeedLabel();
                    });

                    speedBtn.addEventListener('wheel', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const speed = currentSpeed();
                        const delta = e.deltaY < 0 ? wheelStep : -wheelStep;
                        const next = Math.round((speed + delta) * 20) / 20;
                        setLingqSpeed(Math.min(maxSpeed, Math.max(minSpeed, next)));
                        updateSpeedLabel();
                    });

                    speedWrapper = createElement("div", {
                        id: "addon-speed-controller",
                        className: "addon-speed-controller inline-flex items-center"
                    }, speedBtn);

                    setLingqSpeed(currentSpeed());
                    updateSpeedLabel();
                } else {
                    const speed = currentSpeed();
                    const speedText = speedWrapper.querySelector('.addon-speed-text');
                    if (speedText) speedText.textContent = `${parseFloat(speed.toFixed(2))}×`;
                    setLingqSpeed(speed);
                }

                if (nativeSpeedBtn && nativeSpeedBtn.parentElement) {
                    if (speedWrapper.nextElementSibling !== nativeSpeedBtn) {
                        nativeSpeedBtn.parentElement.insertBefore(speedWrapper, nativeSpeedBtn);
                    }
                } else if (rightControls && speedWrapper.parentElement !== rightControls) {
                    rightControls.prepend(speedWrapper);
                }
                return;
            }

            const controllers = document.querySelector('.audio-player--controllers');
            if (!controllers || controllers.querySelector('.controller-item--speed')) return;
            
            const speedDropdown = controllers.querySelector('span.leading-none.text-xl')?.closest('div.dropdown') || controllers.querySelector('div.dropdown');
            if (speedDropdown) {
                speedDropdown.style.setProperty("display", "none", "important");
            }
            
            const currentSpeed = () => settings.lingqSpeed[getLessonLanguage()];
            const existingController = controllers.querySelector('#addon-speed-controller');
            if (existingController) {
                const existingText = existingController.querySelector('.addon-speed-text');
                const existingBtn = existingController.querySelector('a.controller-item');
                const speed = currentSpeed();
                const label = `${parseFloat(speed.toFixed(2))}x`;
                if (existingText) existingText.textContent = label;
                if (existingBtn) existingBtn.setAttribute("title", `Speed: ${label}`);
                setLingqSpeed(speed);
                return;
            }
            if (!speedDropdown) return;
            
            const minSpeed = 0.5;
            const maxSpeed = 3.0;
            const clickStep = 0.25;
            const wheelStep = 0.05;
            
            const speedWrapper = createElement("div", {
                id: "addon-speed-controller",
                style: "display: inline;"
            });
            
            const speedText = createElement("span", {className: "addon-speed-text"});
            
            const speedBtn = createElement("a", {
                className: "controller-item button is-white",
                style: "cursor: pointer; position: relative; display: inline-flex; align-items: center; justify-content: center;"
            }, createElement("span", {
                className: "icon-wrapper icon t-btn-text-player hover:t-btn-text-hover-player",
                style: "display: flex; align-items: center; justify-content: center;"
            }, speedText));
            
            function updateLabel() {
                const speed = currentSpeed();
                const label = `${parseFloat(speed.toFixed(2))}x`;
                speedText.textContent = label;
                speedBtn.setAttribute("title", `Speed: ${label}`);
            }
            
            speedBtn.addEventListener('click', () => {
                const speed = currentSpeed();
                const snapped = Math.round(speed / clickStep) * clickStep;
                const next = snapped + clickStep > maxSpeed + 1e-9 ? minSpeed : snapped + clickStep;
                setLingqSpeed(next);
                updateLabel();
            });
            
            speedBtn.addEventListener('wheel', (e) => {
                e.preventDefault();
                const speed = currentSpeed();
                const delta = e.deltaY < 0 ? wheelStep : -wheelStep;
                setLingqSpeed(Math.round((speed + delta) / wheelStep) * wheelStep);
                updateLabel();
            });
            
            speedWrapper.appendChild(speedBtn);
            (speedDropdown.parentElement || controllers).insertBefore(speedWrapper, speedDropdown);
            
            setLingqSpeed(currentSpeed());
            updateLabel();
        }
        
        function setupVolumeController() {
            const footer = document.querySelector('footer');
            if (footer && !isFooterExpanded(footer)) {
                document.getElementById('addon-volume-controller')?.remove();
                return;
            }
            const legacyControllers = document.querySelector('.audio-player--controllers');
            if (!footer && !legacyControllers) return;

            let volumeWrapper = document.getElementById('addon-volume-controller');

            if (!volumeWrapper) {
                const volumeText = createElement("span", {
                    className: "addon-volume-text font-semibold tabular-nums"
                });

                const iconWrapper = createElement("span", {
                    className: "icon-wrapper inline-flex items-center justify-center shrink-0"
                });

                const volumeBtn = createElement("button", {
                    type: "button",
                    className: footer
                        ? "addon-volume-btn inline-flex flex-row items-center justify-center gap-1.5 rounded-full hover:bg-ghost-hover text-foreground h-8 px-3 text-xs font-semibold cursor-pointer transition-colors select-none tabular-nums"
                        : "controller-item button is-white cursor-pointer relative inline-flex items-center justify-center gap-1",
                    title: "Volume: 100% (Click to cycle, Scroll to adjust)"
                }, iconWrapper, volumeText);

                const svgMute = `<svg style="width: 15px; height: 15px; flex-shrink: 0;" viewBox="-2 -3 32 32"><path fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" d="m12 21-5-5H3v-6h4l5-5zm10-10-6 6m0-6 6 6"/></svg>`;
                const svgLow = `<svg style="width: 15px; height: 15px; flex-shrink: 0;" viewBox="-2 -3 32 32"><path fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" d="m12 21-5-5H3v-6h4l5-5zm5-10c1.5 1.5 1.5 4.5 0 6"/></svg>`;
                const svgHigh = `<svg style="width: 15px; height: 15px; flex-shrink: 0;" viewBox="-2 -3 32 32"><path fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" d="m12 21-5-5H3v-6h4l5-5zm5-10c1.5 1.5 1.5 4.5 0 6m4-9c3 2.5 3 7.5 0 10"/></svg>`;

                function updateVolumeUI() {
                    const vol = settings.lingqVolume;
                    const volPct = Math.round(vol * 100);

                    if (vol === 0) iconWrapper.innerHTML = svgMute;
                    else if (vol <= 0.5) iconWrapper.innerHTML = svgLow;
                    else iconWrapper.innerHTML = svgHigh;

                    volumeText.textContent = `${volPct}%`;
                    volumeBtn.setAttribute("title", `Volume: ${volPct}% (Click to cycle, Scroll to adjust)`);
                }

                volumeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const levels = [0, 0.25, 0.5, 0.75, 1.0];
                    let nextIdx = (levels.indexOf(settings.lingqVolume) + 1) % levels.length;
                    if (nextIdx === 0 && settings.lingqVolume !== 1.0) {
                        const closest = levels.reduce((prev, curr) => Math.abs(curr - settings.lingqVolume) < Math.abs(prev - settings.lingqVolume) ? curr : prev);
                        nextIdx = (levels.indexOf(closest) + 1) % levels.length;
                    }
                    setLingqVolume(levels[nextIdx]);
                    updateVolumeUI();
                });

                volumeBtn.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    let vol = settings.lingqVolume;
                    const delta = e.deltaY < 0 ? 0.05 : -0.05;
                    vol = Math.round(Math.min(1.0, Math.max(0.0, vol + delta)) * 20) / 20;
                    setLingqVolume(vol);
                    updateVolumeUI();
                });

                volumeWrapper = createElement("div", {
                    id: "addon-volume-controller",
                    className: "addon-volume-controller inline-flex items-center"
                }, volumeBtn);

                setLingqVolume(settings.lingqVolume);
                updateVolumeUI();
            } else {
                const volPct = Math.round(settings.lingqVolume * 100);
                const volumeText = volumeWrapper.querySelector('.addon-volume-text');
                if (volumeText) volumeText.textContent = `${volPct}%`;
                setLingqVolume(settings.lingqVolume);
            }

            if (footer) {
                const speedController = document.getElementById('addon-speed-controller');
                if (speedController && speedController.parentElement) {
                    if (volumeWrapper.previousElementSibling !== speedController) {
                        speedController.after(volumeWrapper);
                    }
                } else {
                    const collapseBtn = footer.querySelector('button[aria-label="Collapse player"]');
                    const rightControls = collapseBtn?.parentElement || footer;
                    if (rightControls && volumeWrapper.parentElement !== rightControls) {
                        rightControls.prepend(volumeWrapper);
                    }
                }
            } else if (legacyControllers) {
                const lyricsBtn = legacyControllers.querySelector('.controller-item--lyrics');
                if (lyricsBtn) {
                    let targetSibling = lyricsBtn;
                    while (targetSibling.parentElement && targetSibling.parentElement !== legacyControllers) {
                        targetSibling = targetSibling.parentElement;
                    }
                    legacyControllers.insertBefore(volumeWrapper, targetSibling);
                } else {
                    legacyControllers.appendChild(volumeWrapper);
                }
            }
        }
        
        function resetLocalVideo() {
            isVideoEnded = false;
            const container = document.getElementById("local-video-container");
            if (container) {
                const video = container.querySelector("#addonLocalVideo");
                if (video && video.src) {
                    URL.revokeObjectURL(video.src);
                    video.src = "";
                    video.load();
                }
                const track = container.querySelector("#addonLocalVideoTrack");
                if (track && track.src) {
                    URL.revokeObjectURL(track.src);
                    track.src = "";
                }
                container.remove();
            }
            if (typeof mediaInstances !== "undefined") {
                mediaInstances.clear();
            }
        }
        
        function getColorSettings(colorMode) {
            const prefix = colorMode === "dark" ? "dark_" : "white_";
            
            return {
                fontColor: settings[prefix + "fontColor"],
                translationFontColor: settings[prefix + "translationFontColor"],
                lingqBackground: settings[prefix + "lingqBackground"],
                lingqBorder: settings[prefix + "lingqBorder"],
                lingqBorderLearned: settings[prefix + "lingqBorderLearned"],
                unknownBackground: settings[prefix + "unknownBackground"],
                unknownBorder: settings[prefix + "unknownBorder"],
                playingUnderline: settings[prefix + "playingUnderline"],
            };
        }
        
        function applyStyles() {
            const colorSettings = getColorSettings(settings.colorMode);
            
            let baseCSS = generateBaseCSS(colorSettings);
            let layoutCSS = generateLayoutCSS();
            let specificCSS = "";
            
            switch (settings.colorMode) {
                case "white":
                    clickElement(".reader-themes-component > button:nth-child(1)");
                    break;
                case "dark":
                    clickElement(".reader-themes-component > button:nth-child(5)");
                    break;
            }
            
            
            const rawStyle = settings.styleType[language];
            const currentStyle = (rawStyle === "audio" || rawStyle === "video" || !rawStyle) ? "default" : rawStyle;
            
            if (currentStyle === "off") {
                specificCSS = generateOffModeCSS();
                layoutCSS = '';
            } else if (currentStyle === "localVideo") {
                specificCSS = generateLocalVideoCSS(settings.videoPosition[language]);
            } else {
                specificCSS = generateAudioCSS() + generateVideoCSS(settings.videoPosition[language]);
            }
            
            handleLocalVideoContainerVisibility();
            
            baseCSS += layoutCSS;
            baseCSS += specificCSS;
            if (settings.skipEndPage) {
                baseCSS += `
                [id$="-content-lessonCompleted"] > div.pb-24 > div:nth-child(1) > div.gap-2,
                [id$="-content-lessonCompleted"] > div.pb-24 > :is(div:nth-child(2), div:nth-child(3)),
                [id$="-content-lessonCompleted"] > div.pb-24 > div:nth-child(4) > div:not(:nth-child(4)) {
                    display: none !important;
                }
                `;
            }
            if (settings.hidePopularMeanings) {
                baseCSS += `
                div[data-word-widget] ul:has(button[aria-label^="Add this meaning:"]),
                div[data-word-widget] div:has(> button[aria-label^="Add this meaning:"]),
                div[data-word-widget] div:has(> div > button[aria-label="Report"]),
                div[data-word-widget] div[data-slot="separator"]:has(~ div > button[aria-label^="Add this meaning:"]) {
                    display: none !important;
                }
                `;
            }
            if (settings.hideDictionaries) {
                baseCSS += `
                div[data-word-widget] div:has(> button[aria-label="Edit dictionaries"]) {
                    display: none !important;
                }
                `;
            }
            if (settings.hideSentenceSection) {
                baseCSS += `
                div[data-word-widget] section:has(> div > button[aria-label="Open Sentence"]) {
                    display: none !important;
                }
                `;
            }
            if (settings.hideReaderPopup) {
                baseCSS += `
                div[data-reader-popup="true"] {
                    display: none !important;
                }
                `;
            }
            if (settings.hideLynxUI) {
                baseCSS += `
                footer button[data-reader-lynx-entry="true"],
                footer button[data-reader-lynx-entry="true"] + span {
                    display: none !important;
                }
                `;
            }
            
            if (styleElement) styleElement.remove();
            styleElement = createElement("style", {textContent: baseCSS});
            document.querySelector("head").appendChild(styleElement);
            
            applyCustomFont(settings.customFont[language]);
        }
        
        function setupStyleEventListeners() {
            const styleTypeSelector = document.getElementById("styleTypeSelector");
            const videoPositionSelector = document.getElementById("videoPositionSelector");
            const positionSettingsContainer = document.getElementById("positionSettingsContainer");
            
            function handleReaderStyleTrigger() {
                const baseType = styleTypeSelector.value;
                const position = videoPositionSelector.value;
                const hasPositionSettings = baseType !== "off";
                
                settings.styleType = {...settings.styleType, [language]: baseType};
                settings.videoPosition = {...settings.videoPosition, [language]: position};
                
                positionSettingsContainer.style.display = hasPositionSettings ? "block" : "none";
                document.getElementById("videoSettings").style.display = hasPositionSettings && ["Top", "Bottom"].includes(position) ? "block" : "none";
                
                applyStyles();
            }
            
            styleTypeSelector.addEventListener("change", handleReaderStyleTrigger);
            videoPositionSelector.addEventListener("change", handleReaderStyleTrigger);
            
            document.querySelectorAll('input[name="hoverAnnotation"]').forEach((radio) => {
                radio.addEventListener("change", applyStyles);
            });
            
            document.querySelectorAll('input[name="colorMode"]').forEach((radio) => {
                radio.addEventListener("change", applyStyles);
            });
            
            document.querySelectorAll('input[name="widgetVerticalAlign"]').forEach((radio) => {
                radio.addEventListener("change", applyStyles);
            });

            [
                "skipEndPageCheckbox",
                "hidePopularMeaningsCheckbox",
                "hideDictionariesCheckbox",
                "hideSentenceSectionCheckbox",
                "hideReaderPopupCheckbox",
                "hideLynxUICheckbox"
            ].forEach((id) => {
                document.getElementById(id)?.addEventListener("change", applyStyles);
            });
        }
        
        
        function generateBaseCSS(colorSettings) {
            return `
                :root {
                    --font-size: ${settings.fontSize[language]}rem;
                    --annotation-size: ${settings.annotationScale[language]}%;
                    --line-height: ${settings.lineHeight[language]};

                    --font-color: ${colorSettings.fontColor};
                    --translation-font-color: ${colorSettings.translationFontColor};
                    --lingq-background: ${colorSettings.lingqBackground};
                    --lingq-border: ${colorSettings.lingqBorder};
                    --lingq-border-learned: ${colorSettings.lingqBorderLearned};
                    --unknown-background: ${colorSettings.unknownBackground};
                    --unknown-border: ${colorSettings.unknownBorder};
                    --is-playing-underline: ${colorSettings.playingUnderline};

                    --background-color: ${settings.colorMode === "dark" ? "#2a2c2e" : "#ffffff"}
                }

                @keyframes dots-animation {
                    0% { content: ""; }
                    25% { content: "."; }
                    50% { content: ".."; }
                    75% { content: "..."; }
                }
                .loading-text::after {
                    content: ".";
                    animation: dots-animation 1.5s infinite steps(1);
                    display: inline-block;
                    width: 15px;
                    text-align: left;
                }

                /*font settings*/

                .poc-line ruby,
                .reader-body ruby {
                    font-size: inherit !important;
                }

                .reader-body rt.sentence-item--transliteration,
                rt {
                    font-family: var(--custom-font, inherit) !important;
                    font-size: var(--annotation-size) !important;
                    font-weight: bold !important;
                    ${settings.hoverAnnotation === "all" ? "visibility: hidden !important;" : ""}
                }

                ${settings.hoverAnnotation === "reader" ? `
                div[data-reader-mode-body="true"] rt {
                    visibility: hidden !important;
                }
                div[data-reader-mode-body="true"] ruby:hover rt,
                div[data-reader-mode-body="true"] .sentence-item:hover rt,
                div[data-reader-mode-body="true"] .sentence-item:hover + rt {
                    visibility: visible !important;
                }
                ` : settings.hoverAnnotation === "all" ? `
                ruby:hover rt,
                .sentence-item:hover rt,
                .sentence-item:hover + rt {
                    visibility: visible !important;
                }
                ` : ""}

                .reader-paragraph,
                .reader-sentence,
                .poc-line,
                .sentence-item {
                    color: var(--font-color) !important;
                }

                .poc-line.poc-translation-line,
                .poc-line.poc-translation-line span,
                [data-reader-translation="true"] {
                    color: var(--translation-font-color) !important;
                }

                .reader-sentence.playing,
                .reader-sentence.playing span,
                .sentence-item.playing {
                    text-underline-offset: .2em !important;
                    text-decoration: underline !important;
                    text-decoration-color: var(--is-playing-underline) !important;
                }

                /*highlightings*/

                .sentence-item.ar-new {
                    background-color: var(--unknown-background) !important;
                    border: 1px solid var(--unknown-border) !important;
                    border-radius: .25rem;
                }

                .sentence-item.ar-lingq {
                    border: 1px solid var(--lingq-border) !important;
                    border-radius: .25rem;
                }

                .sentence-item.ar-lingq.ar-lingq-0 {
                    background-color: color-mix(in srgb, var(--lingq-background) 65%, transparent) !important;
                }

                .sentence-item.ar-lingq.ar-lingq-1 {
                    background-color: color-mix(in srgb, var(--lingq-background) 35%, transparent) !important;
                }

                .sentence-item.ar-lingq.ar-lingq-2 {
                    background-color: color-mix(in srgb, var(--lingq-background) 15%, transparent) !important;
                }

                .sentence-item.ar-lingq.ar-lingq-3 {
                    background-color: rgba(0, 0, 0, 0) !important;
                    border: 1px solid var(--lingq-border-learned) !important;
                }

                .sentence-item.ar-learned {
                    border: 1px solid var(--lingq-border-learned) !important;
                }

                .sentence-item.selected {
                    outline: 2px solid var(--font-color) !important;
                    border-radius: .25rem;
                }

                div[data-reader-mode-body="true"] .sentence-item:hover,
                .reader-body .sentence-item:hover,
                .sentence-item:hover {
                    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--font-color) 35%, transparent) !important;
                    border-radius: .25rem;
                }

                div[data-reader-mode-body="true"] .sentence-item.ar-new:hover,
                .reader-body .sentence-item.ar-new:hover,
                .sentence-item.ar-new:hover {
                    box-shadow: inset 0 0 0 1px var(--unknown-border) !important;
                }

                div[data-reader-mode-body="true"] .sentence-item.ar-lingq:hover,
                .reader-body .sentence-item.ar-lingq:hover,
                .sentence-item.ar-lingq:hover {
                    box-shadow: inset 0 0 0 1px var(--lingq-border) !important;
                }

                div[data-reader-mode-body="true"] .sentence-item.ar-learned:hover,
                .reader-body .sentence-item.ar-learned:hover,
                .sentence-item.ar-learned:hover {
                    box-shadow: inset 0 0 0 1px var(--lingq-border-learned) !important;
                }

                /*Chat*/

                #chat-widget {
                    display: flex;
                    flex-direction: column;
                    min-height: 150px;
                    max-height: var(--chat-widget-height, 100px);
                    margin: 16px 0 16px 0 !important;
                    padding: 0 16px !important;
                    box-sizing: border-box;
                }

                div[data-word-widget] #chat-widget {
                    padding: 0 !important;
                    margin: 0 !important;
                }

                #addon-sentence-header + #chat-widget {
                    margin-top: 8px !important;
                }

                /* Word widget header alignment and compact sections */
                div[data-word-widget] .px-4.pt-3 .flex.min-w-0 {
                    align-items: center !important;
                }
                div[data-word-widget] .px-4.pt-3 bdi {
                    align-self: center !important;
                }
                div[data-word-widget] div.min-h-0.flex-1.overflow-y-auto {
                    gap: 12px !important;
                    padding-top: 8px !important;
                }

                #chat-container {
                    flex: 1;
                    margin-bottom: 8px;
                    border: 1px solid rgb(125 125 125 / 35%);
                    border-radius: 8px;
                    overflow-y: auto;
                    padding: 8px !important;
                    scrollbar-width: none !important;
                }

                .ask-selected-button {
                    width: 100%;
                    margin: 5px 0;
                    padding: 5px 10px;
                    font-size: 0.85rem;
                    border: 1px solid rgb(125 125 125 / 35%);
                    border-radius: 4px;
                    background: rgba(125, 125, 125, 0.1);
                    cursor: pointer;
                }

                .ask-selected-button:hover {
                    background: rgba(125, 125, 125, 0.25);
                }

                .input-container {
                    display: flex;
                    margin-bottom: 4px;
                    border: 1px solid rgb(125 125 125 / 35%);
                    border-radius: 8px;
                }

                #user-input {
                    flex-grow: 1;
                    padding: 5px 10px;
                    font-size: 0.9rem;
                    background: none !important;
                    outline: none;
                    resize: none;
                    field-sizing: content;
                    max-height: 4lh;
                }

                #user-input::placeholder {
                    color: rgb(125 125 125) !important;
                }

                #send-button {
                    opacity: 0.5;
                    padding: 5px 10px;
                }

                #send-button:disabled {
                    opacity: 0.3;
                    pointer-events: none;
                }

                #send-button:hover {
                    background-color: rgba(125, 125, 125, 50%);
                }

                .chat-message {
                    padding: 5px;
                    margin-bottom: 5px;
                    border-radius: 8px;
                    color: var(--font-color);
                    font-size: 0.9rem;
                    line-height: 1.2;
                }

                .user-message {
                    background-color: rgb(125 125 125 / 5%);
                }

                .bot-message {
                    background-color: rgb(125 125 125 / 15%);
                    min-height: 30px;
                }

                .bot-message:empty {
                    background: linear-gradient(90deg, #7d7d7d26 25%, #7d7d7d40 50%, #7d7d7d26 75%);
                    background-size: 200% 100%;
                    animation: shimmerAnim 1.5s linear infinite;
                }

                @keyframes shimmerAnim {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }

                #chat-container .word-message b:nth-of-type(1) {
                    position: relative;
                    font-size: 1.05rem;
                    font-weight: 600;
                }

                #chat-container :is(.word-message, .sentence-message) b:nth-of-type(1):hover {
                    color: ${settings.colorMode === "dark" ? "white" : "black"};
                    cursor: pointer;
                }

                #chat-container .word-message p:nth-of-type(1):hover {
                    color: ${settings.colorMode === "dark" ? "white" : "black"};
                    cursor: pointer;
                }

                #chat-container .word-message ul:nth-last-of-type(1):hover {
                    color: ${settings.colorMode === "dark" ? "white" : "black"};
                    cursor: pointer;
                }

                .thought-process.with-margin {
                    margin-bottom: 5px;
                }
                
                .thought-process summary {
                    cursor: pointer;
                    opacity: 0.6;
                    margin: 2px 0 0 3px;
                    font-size: 1em;
                    user-select: none;
                    list-style: none;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .thought-process summary span {
                    font-style: italic;
                }
                
                .thought-process summary span.thinking-text {
                    min-width: 60px;
                }
                
                .thought-process summary .chevron {
                    width: 12px; height: 12px; transition: transform 0.2s;
                }
                
                .thought-process summary::-webkit-details-marker {
                    display: none;
                }
                
                .thought-process[open] summary .chevron {
                    transform: rotate(180deg);
                }
                
                .thought-content {
                    font-size: 0.9em;
                    opacity: 0.8;
                    padding-left: 10px;
                    border-left: 2px solid rgb(125 125 125 / 50%);
                    margin-top: 5px; margin-bottom: 10px;
                }
                
                @keyframes thinkingDots {
                    0% { content: ""; }
                    25% { content: "."; }
                    50% { content: ".."; }
                    75% { content: "..."; }
                }
                
                .thinking-dots::after {
                    content: "";
                    animation: thinkingDots 1.5s infinite steps(1);
                    display: inline-block;
                    width: 1em;
                    text-align: left;
                }

                #flashcard-popup {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    position: absolute;
                    padding: 4px 8px;
                    border-radius: 6px;
                    z-index: 20;
                    background-color: var(--background-color, #2a2c2e);
                    color: var(--font-color, #e0e0e0);
                    border: 1px solid rgb(125 125 125 / 50%);
                }

                .word-message b:has(.flashcard-count-badge) {
                    margin-right: 5px;
                }

                .flashcard-count-badge {
                    position: absolute;
                    top: 1px;
                    right: -5px;
                    color: var(--font-color, #e0e0e0);
                    font-size: 10px;
                    border-radius: 3px;
                    line-height: 1;

                    pointer-events: none;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .flashcard-count-badge::after {
                    content: attr(data-display);
                }

                .flashcard-row {
                    display:flex;
                    align-items:center;
                    gap:5px;
                    cursor: pointer;
                }

                .popup-delete-button {
                    width: 10px;
                    height: 10px;
                    margin-right: 5px;
                }

                .meaning-edit-input {
                    width: 100%;
                    border: none;
                    outline: none;
                    padding: 3px;
                }

                .pronunciation-edit-input {
                    box-sizing: border-box;
                    border: none;
                    outline: none;
                    padding: 0 3px;
                    background: transparent;
                    color: inherit;
                    font-size: inherit;
                    font-family: inherit;
                }

                .card-edit-textarea {
                    width: 100%;
                    box-sizing: border-box;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: inherit;
                    font-family: inherit;
                    font-size: inherit;
                    line-height: inherit;
                    resize: none;
                    padding: 0;
                    margin: 0;
                    display: block;
                    overflow-y: auto;
                }

                #chat-container li {
                    list-style: inside !important;
                }

                #chat-container li:has(.card-edit-textarea) {
                    list-style: none !important;
                }

                #chat-container ul {
                    margin-top: 0.5rem;
                }

                #chat-container hr {
                    margin: 0.3rem 0 0.4rem;
                    border: 0;
                    height: 1px;
                    background-color: rgb(125 125 125 / 50%);
                }

                #chat-container p {
                    margin: 0.3rem 0;
                }

                .message-button-container {
                    display: flex;
                    gap: 5px;
                    margin-top: 5px;
                }

                .message-button {
                    padding: 3px;
                    border-radius: 3px;
                }

                .message-button:disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }

                .message-button:hover {
                    background-color: rgba(125, 125, 125, 50%);
                }

                .quick-summary {
                    display: flex;
                    color: var(--font-color);
                    font-family: var(--custom-font, inherit) !important;
                    font-size: var(--font-size) !important;
                    line-height: var(--line-height) !important;
                    margin-bottom: 20px;
                    max-height: min(calc(var(--article-height) * 0.5), 500px);
                    overflow-y: scroll;
                    resize: vertical;
                    flex-direction: column;
                    padding: 10px 0;
                }

                .quick-summary rt {
                    user-select: none;
                    -webkit-user-select: none;
                }
                
                .quick-summary em {
                    font-size: 0.8em;
                }

                .quick-summary .lesson-summary-details {
                    margin-bottom: 12px;
                }

                .summary-content {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .summary-content b {
                    font-size: 1.5rem;
                }

                .close-summary-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 10px;
                    border: 1px solid rgb(125, 125, 125, 50%);
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 0 10px 0 auto;
                }

                .userToast {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background-color: var(--background-color);
                    color: ${settings.colorMode === "dark" ? "white" : "#ffffff"};
                    padding: 5px 10px;
                    border-radius: 10px;
                    z-index: 9999;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                    font-size: 0.8rem;
                    font-weight: 200;
                    pointer-events: none;
                }
            `;
        }
        
        function generateLayoutCSS() {
            return `
            :root {
                --header-height: 48px;
                --widget-width: ${settings.widgetWidth}px;
                --chat-widget-height: ${settings.chatWidgetHeight}px;
                --footer-height: 56px;
            }

            /* Disable native View Transition animation & cross-fade blur */
            html.split-motion,
            html.theater-motion {
                view-transition-name: none !important;
            }

            ::view-transition-group(*),
            ::view-transition-old(*),
            ::view-transition-new(*) {
                animation: none !important;
                animation-duration: 0s !important;
            }

            /* Site header compaction */
            header[data-site-header="true"] {
                min-height: 48px !important;
                height: 48px !important;
                padding-top: 4px !important;
                padding-bottom: 4px !important;
            }
            header[data-site-header="true"] > div,
            header[data-site-header="true"] .h-14 {
                height: 100% !important;
                min-height: 0 !important;
            }
            header[data-site-header="true"] img.size-10 {
                width: 36px !important;
                height: 36px !important;
                margin-top: 2px !important;
            }

            /* Sub-header compaction */
            div.relative.z-40.shrink-0 {
                padding-top: 0 !important;
            }
            div.relative.z-40.shrink-0 > div {
                min-height: 36px !important;
                padding-top: 2px !important;
                padding-bottom: 2px !important;
            }

            /* Footer player & pills */
            footer {
                height: 56px !important;
                padding: 0 24px !important;
                align-items: center !important;
            }
            footer div[role="group"] {
                height: 42px !important;
                align-items: center !important;
            }
            footer button[aria-label="Play"],
            footer button[aria-label="Pause"]${!settings.hideLynxUI ? `,\n            footer button[aria-label="Ask Lynx AI"]` : ""} {
                width: 38px !important;
                height: 38px !important;
                padding: 0 !important;
            }
            ${!settings.hideLynxUI ? `footer button[aria-label="Ask Lynx AI"] svg {
                width: 20px !important;
                height: 20px !important;
            }` : ""}
            footer .rounded-full:not([data-slot="slider-thumb"]):not([role="slider"]):not([data-reader-lynx-entry="true"]) {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                height: 34px !important;
                padding: 1px 8px !important;
                line-height: normal !important;
            }
            footer .rounded-full:not([data-slot="slider-thumb"]):not([role="slider"]):not([data-reader-lynx-entry="true"]) button,
            footer .rounded-full:not([data-slot="slider-thumb"]):not([role="slider"]):not([data-reader-lynx-entry="true"]) a {
                height: 28px !important;
                padding: 1px 0 !important;
                display: inline-flex !important;
                align-items: center !important;
            }
            footer .rounded-full:not([data-slot="slider-thumb"]):not([role="slider"]):not([data-reader-lynx-entry="true"]) svg {
                width: 16px !important;
                height: 16px !important;
            }

            /* Footer progress bar slider thumb */
            footer [data-slot="slider-thumb"],
            footer [role="slider"] {
                width: 14px !important;
                height: 14px !important;
                padding: 0 !important;
                display: block !important;
                border-radius: 9999px !important;
                box-sizing: border-box !important;
            }

            /* Footer skip buttons */
            footer button[aria-label^="Replay"] svg,
            footer button[aria-label^="Forward"] svg {
                width: 22px !important;
                height: 22px !important;
                stroke-width: 1.5 !important;
            }
            .addon-skip-text {
                fill: currentColor !important;
                stroke: none !important;
                font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
                font-weight: 600 !important;
                font-size: 8px !important;
                text-anchor: middle !important;
                dominant-baseline: central !important;
                pointer-events: none !important;
                user-select: none !important;
            }
            .addon-skip-text[data-single-digit="true"] {
                font-size: 9.5px !important;
            }

            /* Reader body & text area */
            .reader-body {
                max-width: 100% !important;
                font-family: var(--custom-font, inherit) !important;
            }
            .reader-body:not(:has(.poc-page)) {
                line-height: var(--line-height) !important;
                font-size: var(--font-size) !important;
            }
            .reader-body:has(.poc-page) {
                overflow-y: auto !important;
                scrollbar-width: none !important;
            }
            .poc-page,
            .poc-line {
                font-family: var(--custom-font, inherit) !important;
            }
            div[data-reader-mode-body="true"] {
                width: 100% !important;
                flex: 1 1 0% !important;
            }
            div[data-reader-mode-body="true"] .reader-paragraph,
            .reader-body .reader-paragraph,
            .reader-paragraph {
                margin-bottom: 0.75em !important;
            }

            /* Page mode prev/next buttons */
            button[aria-label="Previous page"],
            button[aria-label="Next page"],
            div[data-reader-mode-body="true"] div[aria-hidden="true"].w-12 {
                width: 2rem !important;
                min-width: 2rem !important;
                padding: 0 !important;
            }

            /* Sidebar column width */
            div[data-reader-side-column="true"]:not(.contents) {
                width: var(--widget-width) !important;
                min-width: var(--widget-width) !important;
                max-width: var(--widget-width) !important;
            }
            div[data-reader-side-column="true"].contents #memo-widget-container {
                display: none !important;
            }

            /* Player controllers styling */
            footer .rounded-full:has(#addon-speed-controller) {
                height: 38px !important;
                padding: 2px 12px !important;
                gap: 6px !important;
            }
            #addon-speed-controller button.addon-speed-btn,
            #addon-volume-controller button.addon-volume-btn {
                height: 32px !important;
                padding: 0 12px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #addon-volume-controller .addon-volume-text {
                display: inline-flex !important;
                align-items: center !important;
                font-size: 0.8125rem !important;
                font-weight: 600 !important;
                line-height: 1 !important;
                color: inherit !important;
            }
            #addon-speed-controller .addon-speed-text {
                display: inline-flex !important;
                align-items: center !important;
                min-width: 2.2em;
                justify-content: center;
                font-size: 0.8125rem !important;
                font-weight: 600 !important;
                line-height: 1 !important;
                color: inherit !important;
            }

            /* Memo Widget */
            #memo-widget-container {
                display: flex;
                background-color: var(--readerWidgetBoxBackground, rgba(125, 125, 125, 0.1));
                padding: 10px;
                border-radius: 1rem;
                margin-top: 8px;
            }

            .memo-textarea {
                width: 100%;
                min-height: 2.5em;
                max-height: 150px;
                padding: 5px 10px;
                border-radius: 5px;
                border: 1px solid rgba(125, 125, 125, 0.35);
                background: transparent;
                color: inherit;
                outline: none;
                resize: none;
                overflow-y: auto;
                field-sizing: content;
            }
            `;
        }
        
        function generateVideoCSS(position = "Right") {
            let layoutCSS = `
                :root {
                    --height-big: ${settings.heightBig || 400}px;
                }
            `;
            
            if (position === "Top") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents:has([data-reader-video-stage="true"]) {
                        display: flex !important;
                        flex-direction: column !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div.contents > div:has(> [data-reader-video-stage="true"]) {
                        order: 1 !important;
                        width: 100% !important;
                        flex-shrink: 0 !important;
                        padding-top: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                    }
                    div[data-reader-video-stage="true"] {
                        width: 100% !important;
                        height: var(--height-big) !important;
                        max-height: var(--height-big) !important;
                        max-width: none !important;
                        aspect-ratio: auto !important;
                        background: #000 !important;
                        border-radius: 0.75rem !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] {
                        order: 2 !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                `;
            } else if (position === "Bottom") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents:has([data-reader-video-stage="true"]) {
                        display: flex !important;
                        flex-direction: column !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] {
                        order: 1 !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                    div.contents > div:has(> [data-reader-video-stage="true"]) {
                        order: 2 !important;
                        width: 100% !important;
                        flex-shrink: 0 !important;
                        padding-top: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                    }
                    div[data-reader-video-stage="true"] {
                        width: 100% !important;
                        height: var(--height-big) !important;
                        max-height: var(--height-big) !important;
                        max-width: none !important;
                        aspect-ratio: auto !important;
                        background: #000 !important;
                        border-radius: 0.75rem !important;
                    }
                `;
            } else if (position === "Left") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents:has([data-reader-video-stage="true"]) {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 1.5rem !important;
                        padding-left: 1.5rem !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        flex: 1 1 0% !important;
                        overflow: hidden !important;
                    }
                    div.contents > div:has(> [data-reader-video-stage="true"]),
                    .grid.grid-cols-2 > div:has(> [data-reader-video-stage="true"]) {
                        order: 1 !important;
                        grid-column: 1 !important;
                        align-self: stretch !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        padding: 0 !important;
                    }
                    div.contents > div:has(> [data-reader-video-stage="true"]) [data-reader-video-stage="true"],
                    .grid.grid-cols-2 > div:has(> [data-reader-video-stage="true"]) [data-reader-video-stage="true"] {
                        max-width: none !important;
                        width: 100% !important;
                        height: 100% !important;
                        aspect-ratio: auto !important;
                        background: #000 !important;
                        border-radius: 0.75rem !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"],
                    .grid.grid-cols-2:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] {
                        order: 2 !important;
                        grid-column: 2 !important;
                        min-width: 0 !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] > div.overflow-y-auto,
                    .grid.grid-cols-2:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                `;
            } else if (position === "Right") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents:has([data-reader-video-stage="true"]) {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 1.5rem !important;
                        padding-left: 1.5rem !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        flex: 1 1 0% !important;
                        overflow: hidden !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"],
                    .grid.grid-cols-2:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] {
                        order: 1 !important;
                        grid-column: 1 !important;
                        min-width: 0 !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div.contents:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] > div.overflow-y-auto,
                    .grid.grid-cols-2:has([data-reader-video-stage="true"]) > div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                    div.contents > div:has(> [data-reader-video-stage="true"]),
                    .grid.grid-cols-2 > div:has(> [data-reader-video-stage="true"]) {
                        order: 2 !important;
                        grid-column: 2 !important;
                        align-self: stretch !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        padding: 0 !important;
                    }
                    div.contents > div:has(> [data-reader-video-stage="true"]) [data-reader-video-stage="true"],
                    .grid.grid-cols-2 > div:has(> [data-reader-video-stage="true"]) [data-reader-video-stage="true"] {
                        max-width: none !important;
                        width: 100% !important;
                        height: 100% !important;
                        aspect-ratio: auto !important;
                        background: #000 !important;
                        border-radius: 0.75rem !important;
                    }
                `;
            }
            
            return layoutCSS;
        }
        
        function generateLocalVideoCSS(position = "Right") {
            let layoutCSS = `
            :root {
                --height-big: ${settings.heightBig || 400}px;
                --caption-font-size: ${settings.captionFontsize}px;
            }
            #local-video-container {
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0.75rem;
                background-color: #000000;
                position: relative !important;
                min-width: 0;
                overflow: hidden;
                cursor: pointer;
            }
            `;
            
            if (position === "Top") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents {
                        display: flex !important;
                        flex-direction: column !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    #local-video-container {
                        order: 1 !important;
                        width: 100% !important;
                        height: var(--height-big) !important;
                        max-height: var(--height-big) !important;
                        flex-shrink: 0 !important;
                        margin-bottom: 0.5rem !important;
                    }
                    div[data-reader-mode-body="true"] {
                        order: 2 !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                `;
            } else if (position === "Bottom") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents {
                        display: flex !important;
                        flex-direction: column !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div[data-reader-mode-body="true"] {
                        order: 1 !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                    #local-video-container {
                        order: 2 !important;
                        width: 100% !important;
                        height: var(--height-big) !important;
                        max-height: var(--height-big) !important;
                        flex-shrink: 0 !important;
                        margin-top: 0.5rem !important;
                    }
                `;
            } else if (position === "Left") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents {
                        display: flex !important;
                        flex-direction: row !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                        gap: 1.5rem !important;
                    }
                    #local-video-container {
                        order: 1 !important;
                        flex: 1 1 0% !important;
                        min-width: 0 !important;
                        height: 100% !important;
                        max-height: 100% !important;
                        align-self: stretch !important;
                    }
                    div[data-reader-mode-body="true"] {
                        order: 2 !important;
                        flex: 1 1 0% !important;
                        min-width: 0 !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                `;
            } else if (position === "Right") {
                layoutCSS += `
                    div.relative.flex.min-h-0.flex-1.flex-col > .contents {
                        display: flex !important;
                        flex-direction: row !important;
                        flex: 1 1 0% !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                        gap: 1.5rem !important;
                    }
                    div[data-reader-mode-body="true"] {
                        order: 1 !important;
                        flex: 1 1 0% !important;
                        min-width: 0 !important;
                        min-height: 0 !important;
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    div[data-reader-mode-body="true"] > div.overflow-y-auto {
                        height: 100% !important;
                        overflow-y: auto !important;
                    }
                    #local-video-container {
                        order: 2 !important;
                        flex: 1 1 0% !important;
                        min-width: 0 !important;
                        height: 100% !important;
                        max-height: 100% !important;
                        align-self: stretch !important;
                    }
                `;
            }
            
            return `
            ${layoutCSS}

            .local-video-title-bar {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 60px;
                padding: 12px 15px;
                background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
                z-index: 10;
                pointer-events: auto;
                opacity: 0;
                transition: opacity 0.25s ease;
            }
            .local-video-title-bar:hover {
                opacity: 1;
            }
            .local-video-title-text {
                color: #ffffff;
                font-size: 1.15rem;
                font-weight: bold;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
            }
            [id$="-content-lessonCompleted"][data-state="active"] ~ * #local-video-container,
            body:has([id$="-content-lessonCompleted"][data-state="active"]) #local-video-container {
                display: none !important;
            }
            .local-video-setup-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                text-align: center;
                width: calc(100% - 40px);
                max-width: 70%;
                min-width: 0;
                box-sizing: border-box;
                border: 2px dashed rgb(125 125 125 / 40%);
                border-radius: 12px;
                background-color: rgb(125 125 125 / 10%);
                padding: 30px;
                margin: auto;
            }
            .local-video-button {
                display: inline-block;
                padding: 12px 20px;
                border: 1px solid rgb(125 125 125 / 50%);
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.95em;
                width: 100%;
                min-width: 0;
                box-sizing: border-box;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                background-color: rgb(125 125 125 / 10%);
            }
            .local-video-button:hover {
                background-color: rgb(125 125 125 / 25%);
            }
            .local-video-file-input {
                display: none !important;
            }
            .local-video-progress-wrapper {
                position: absolute !important;
                bottom: 0;
                left: 0;
                z-index: 10;
                margin-top: 0 !important;
                width: 100%;
                height: 5px;
                background-color: rgba(255, 255, 255, 0.2);
            }
            #local-video-mini-progress {
                height: 100%;
                width: 0%;
                background-color: rgb(76, 175, 80);
                transition: width 0.1s linear;
            }
            #addonLocalVideo {
                width: auto !important;
                height: auto !important;
                max-width: 100% !important;
                max-height: calc(100% - 5px) !important;
                align-self: center !important;
                margin: auto !important;
            }
            video::-webkit-media-text-track-container {
                font-size: var(--caption-font-size) !important;
            }
            ::cue, video::cue {
                background-color: rgba(0, 0, 0, 0.75) !important;
                color: #ffffff !important;
                font-family: sans-serif !important;
                line-height: 1.2 !important;
            }
            `;
        }
        
        function generateAudioCSS() {
            return `
            :root {
                --footer-height: 48px;
            }
            `;
        }
        
        function generateOffModeCSS() {
            return `
            .quick-summary {
                display: none !important;
            }
            `;
        }
        
        function setupKeyboardShortcuts() {
            let lastSkipTime = 0;

            const triggerThrottledSkip = (deltaSeconds) => {
                const currentTime = Date.now();
                const TARGET_SEEK_SPEED = 30;
                const calculatedMs = Math.round((settings.skipDuration / TARGET_SEEK_SPEED) * 1000);
                const skipThrottleMs = Math.max(80, Math.min(250, calculatedMs));
                if (currentTime - lastSkipTime < skipThrottleMs) return;
                lastSkipTime = currentTime;
                skipPlayback(deltaSeconds);
            };

            document.addEventListener("keydown", function (event) {
                if (!settings.keyboardShortcut) return;
                
                const targetElement = event.target;
                const isTextInput = targetElement.localName === "text" || targetElement.localName === "textarea" || targetElement.localName === "input";
                const withoutModifierKeys = !event.ctrlKey && !event.shiftKey && !event.altKey;
                const eventKey = event.key.toLowerCase();
                if (isTextInput) {
                    if (targetElement.id === "user-input" || targetElement.classList?.contains("addon-quick-meaning-input")) return;
                    
                    if (withoutModifierKeys) {
                        if (eventKey === 'escape') {
                            preventPropagation(event);
                            targetElement.blur();
                            return;
                        }
                        
                        if (eventKey === 'enter') {
                            if (targetElement.classList?.contains('memo-textarea')) {
                                event.stopPropagation();
                                return;
                            } else {
                                preventPropagation(event);
                                targetElement.blur();
                                return;
                            }
                        }
                    }
                    
                    event.stopPropagation();
                    return;
                }
                
                if (eventKey === ' ' && withoutModifierKeys && !isTextInput) {
                    preventPropagation(event);
                    const playButtonSelector = ".section--player > div:nth-child(1) > button";
                    const svgEl = document.querySelector(`${playButtonSelector} > span > svg`);
                    const getState = (el) => el?.classList.contains('svg-icon--pause') ? 'playing' : 'pause';
                    const stateBefore = getState(svgEl);
                    
                    setTimeout(() => {
                        const svgElAfter = document.querySelector(`${playButtonSelector} > span > svg`);
                        const stateAfter = getState(svgElAfter);
                        
                        if (stateAfter === stateBefore) clickElement(playButtonSelector);
                    }, 100);
                }
                
                const shortcuts = {
                    [settings.shortcutVideoFullscreen]: () => clickElement(".modal-section > div > button:nth-child(2)"), // video full screen toggle
                    [settings.shortcutMeaningInput]: () => {
                        focusElement("input.addon-quick-meaning-input");
                    },
                    [settings.shortcutChatInput]: () => focusElement("#user-input"), // Move cursor to the chat widget input
                    [settings.shortcutFlashcard]: () => {
                        const wordMessages = document.querySelectorAll("#chat-container .word-message");
                        if (wordMessages.length <= 0) return;
                        const lastWordMessage = wordMessages[wordMessages.length - 1];
                        lastWordMessage.querySelector(".save-flashcard-button")?.click();
                    }, // Make a flashcard
                    [settings.shortcutTTSPlay]: () => clickElement('div[data-word-widget] button[aria-label="Listen"], #addon-sentence-header button.addon-sentence-tts-btn, div[data-reader-popup="true"] button[aria-label="Listen"]'), // Play tts audio
                    [settings.shortcutTranslator]: () => clickElement(".dictionary-resources > a:nth-last-child(1)"), // Open Translator
                    [settings.shortcutBackward5s]: () => triggerThrottledSkip(-settings.skipDuration), // Rewind
                    [settings.shortcutForward5s]: () => triggerThrottledSkip(settings.skipDuration), // Fast Forward
                    [settings.shortcutMakeKnown]: () => document.dispatchEvent(new KeyboardEvent("keydown", {key: "k"})), // Simulate original 'k' for Make Word Known
                    [settings.shortcutDictionary]: () => clickElement(".dictionary-resources > a:nth-child(1)"), // Open Dictionary
                    [settings.shortcutCopySelected]: () => copySelectedText() // Copy selected text
                };
                
                if (shortcuts[eventKey] && withoutModifierKeys) {
                    preventPropagation(event);
                    shortcuts[eventKey]();
                }
            }, true);
        }
        
        function setupYoutubePlayerCustomization() {
            async function changeVideoPlayerSettings(container = document) {
                const iframe = container.querySelector('iframe') || await waitForElement('.modal-container iframe', 3000);
                if (!iframe) return;
                
                let src = iframe.getAttribute("src");
                if (!src) return;
                
                if (!src.includes("disablekb=0")) {
                    src = src.replace("disablekb=1", "disablekb=0");
                }
                if (!src.includes("cc_load_policy=1")) {
                    src = src + "&cc_load_policy=1";
                }
                if (!src.includes("controls=0")) {
                    src = src + "&controls=0";
                }
                iframe.setAttribute("src", src);
                
                const modalRelative = iframe.closest('.modal-content > .relative');
                modalRelative?.classList.remove('relative');
                modalRelative?.style.setProperty('width', 'auto', 'important');
                modalRelative?.style.setProperty('height', 'auto', 'important');
                
                const wrapperRelative = iframe.closest('.video-wrapper > .relative');
                wrapperRelative?.classList.remove('relative');
            }
            
            async function setupSliderObserver() {
                function createSliderElements() {
                    const sliderContainer = createElement("div", {className: "rc-slider rc-slider-horizontal"});
                    const sliderRail = createElement("div", {className: "rc-slider-rail"});
                    const sliderTrack = createElement("div", {className: "rc-slider-track"});
                    sliderContainer.appendChild(sliderRail);
                    sliderContainer.appendChild(sliderTrack);
                    return sliderContainer;
                }
                
                function updateLessonProgress(lessonId, lessonInfo, progressPercentage, lastCompletedPercentage) {
                    const progressUpdatePeriod = 5;
                    const flooredProgressPercentage = Math.floor(progressPercentage / progressUpdatePeriod) * progressUpdatePeriod;
                    
                    if (flooredProgressPercentage > lastCompletedPercentage) {
                        console.log('[Slider]', `progress percentage: ${flooredProgressPercentage}`);
                        const wordIndex = Math.floor(lessonInfo["totalWordsCount"] * (flooredProgressPercentage / 100));
                        setLessonProgress(lessonId, wordIndex);
                        return flooredProgressPercentage;
                    }
                    return lastCompletedPercentage;
                }
                
                const videoContainer = document.querySelector(".video-player .modal-content > div, .modal-container .modal-content > div");
                if (!videoContainer) return;
                
                const sliderTrack = document.querySelector('.audio-player--progress .rc-slider-track');
                if (!sliderTrack) return;
                
                const lessonId = getLessonId();
                if (!lessonId) return;
                const lessonInfo = await getLessonInfo(lessonId);
                if (!lessonInfo || typeof lessonInfo["progress"] === "undefined") return;
                let lastCompletedPercentage = lessonInfo["progress"];
                console.log(`last progress: ${lastCompletedPercentage}`);
                
                if (videoContainer.querySelector(".rc-slider-horizontal")) return;
                
                const sliderContainer = createSliderElements();
                const videoSliderTrack = sliderContainer.querySelector(".rc-slider-track");
                videoContainer.appendChild(sliderContainer);
                
                const isVideoStopped = document.querySelector(`.shared-player div[data-original-title="Play video"]`);
                
                const sliderObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        videoSliderTrack.style.cssText = sliderTrack.style.cssText;
                        
                        const progressPercentage = parseFloat(sliderTrack.style.width) || 0;
                        lastCompletedPercentage = updateLessonProgress(lessonId, lessonInfo, progressPercentage, lastCompletedPercentage);
                        console.debug('Observer:', `Slider Changed. Progress: ${progressPercentage}`);
                    });
                });
                
                sliderObserver.observe(sliderTrack, {attributes: true, attributeFilter: ['style']});
            }
            
            const observer = new MutationObserver(async (mutations) => {
                for (const mutation of mutations) {
                    console.debug('Observer:', `Modal container created. ${mutation.type}`, mutation.addedNodes);
                    
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;
                        if (!node.matches(".modal-container")) continue;
                        
                        const isVideoModal = node.matches(".video-player, .modal-container.video-player") ||
                            Boolean(node.querySelector(".video-player, .video-wrapper, iframe"));
                        if (!isVideoModal) continue;
                        
                        changeVideoPlayerSettings(node);
                        
                        const modalSection = await waitForElement('.modal-container .modal-section', 3000);
                        if (modalSection) {
                            clickElement('.modal-section button:nth-child(2)[title="Expand"]');
                        }
                        
                        setupSliderObserver();
                    }
                }
            });
            
            observer.observe(document.body, {childList: true});
        }
        
        async function setupReaderContainer() {
            let llmProvider = settings.llmProvider;
            let llmModel = settings.llmModel;
            let savedKeys = settings.llmApiKeys;
            let llmApiKey = savedKeys[llmProvider];
            
            function setupSentenceFocus(readerContainer) {
                let selectedFocusRafId = null;
                
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        const target = mutation.target;
                        const hadIsSelected = mutation.oldValue?.split(' ').includes('selected');
                        const hasIsSelected = target.classList.contains('selected');
                        
                        if (hasIsSelected && !hadIsSelected && settings.focusSelectedText) {
                            if (selectedFocusRafId) cancelAnimationFrame(selectedFocusRafId);
                            selectedFocusRafId = requestAnimationFrame(() => {
                                selectedFocusRafId = null;
                                focusReaderElement(target);
                            });
                        }
                    });
                });
                
                observer.observe(readerContainer, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['class'],
                    attributeOldValue: true
                });
            }
            
            function changeTranslationColor(readerContainer) {
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (!(node.nodeType === Node.ELEMENT_NODE && node.matches('p:has(.sentence)'))) continue;
                            
                            for (const sentence of node.querySelectorAll('.sentence')) {
                                if (!(sentence.style.borderImageSource)) continue;
                                
                                const fontColor = settings[`${settings.colorMode}_translationFontColor`];
                                const colorRegex = /color:%23[0-9a-fA-F]{6}/g;
                                sentence.style.borderImageSource = sentence.style.borderImageSource.replace(colorRegex, `color:${fontColor}`);
                            }
                        }
                    }
                });
                observer.observe(readerContainer, {childList: true, subtree: true});
            }
            
            async function generateLessonSummary(readerContainer) {
                async function getLessonSummary(provider, apikey, model, content) {
                    const lessonSummaryPrompt = `
                    # Role
                    Generate a comprehensive English note of the given content, serving as persistent macro-context for downstream tasks (e.g., Q&A, interpretation, translation), and readable by users. This note's core job is the big picture: overall structure, entities, and argument/plot flow.
                
                    # Content Rules
                    - Objective and factual; base ONLY on the given content
                    - Preserve ALL key details, named entities, terminology, and plot/argument structure
                    - When an English term risks losing nuance (e.g., proper nouns, culturally specific concepts), append the original-language term in parentheses in its original native script — e.g., "tact (눈치)", "Ferris wheel (観覧車)". Do not transliterate or romanize it into the Latin alphabet (e.g., write "(観覧車)", NOT "(kanransha)")
                    - No preface or closing remarks
                
                    # Output Format
                    - Language: English throughout, except for the parenthetical original terms, which must be in their authentic native script (no romanization)
                    - Format: plain text, full grammatical sentences and paragraphs; no Markdown syntax (no #, **, -, etc.)
                    - Style: dense and information-rich; do not reference the source's medium, structure, or presenter (e.g., "lesson," "video," "speaker," "list," "section," "discussed above")
                        — state every fact as free-standing information. When the source voices a personal opinion or preference, attribute it with neutral phrasing (e.g., "X is often favored for...") instead of naming the speaker
                    - Structure: follow the original content's order, one paragraph per major topic/section, connected with transitions that preserve causal/argumentative relationships
                    - Entity reference: restate the specific noun (name/term) rather than relying on ambiguous pronouns across sentences
                    - Length: no fixed target — as long as needed to satisfy the Content Rules above.
                        - Soft-capped at 3,000 words; if reached before full coverage, compress via reduced density (shorter sentences, fewer illustrative details) rather than omitting entities, events, or sections
                    `;
                    
                    const summary_history = [
                        {role: "system", content: removeIndent(lessonSummaryPrompt)},
                        {role: "user", content: content}
                    ]
                    const summary = await getOpenAIResponse(provider, apikey, model, summary_history);
                    console.log('[Lesson summary]\n', summary);
                    
                    return summary;
                }
                
                function formatQuickSummaryHTML(text) {
                    if (!text || !text.trim()) return "";
                    
                    const cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').replace(/<thought>[\s\S]*$/gi, '').trim();
                    if (!cleaned) return "";
                    
                    let formatted = cleaned.replace(/\|+\s*\]/g, "]");
                    formatted = formatted.replace(/\[([^\]|]+)\|([^\]|]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
                    formatted = formatted.replace(/\[([^\]|]+)\]/g, "$1");
                    formatted = formatted.replace(/\[([^\]|]+)(?:\|[^\]]*)?$/, "$1");
                    
                    return formatted
                        .trim()
                        .split(/\n\n+/)
                        .map((paragraph) => `<p>${paragraph.trim()}</p>`)
                        .join("");
                }
                
                async function getQuickSummary(provider, apikey, model, content, isRegeneration = false) {
                    const DictionaryLocalePairs = await getDictionaryLocalePairs()
                    const lessonLanguage = DictionaryLocalePairs[language];
                    const difficulty = settings.summaryDifficulty[language];
                    const difficultyPrompt = difficulty && difficulty !== "unset"
                        ? `- Target level: CEFR ${difficulty}. Simplify vocabulary and grammar toward this level, without exceeding the complexity already present in the source content — never introduce harder words or structures than the original, even if ${difficulty} is high.${["A1", "A2", "B1"].includes(difficulty) ? " Keep sentences short and straightforward to minimize cognitive load." : ""}`
                        : "";
                    
                    const summaryWordsByDifficulty = {
                        A1: 40,
                        A2: 60,
                        B1: 80,
                        B2: 120,
                        C1: 150,
                        C2: 150
                    };
                    const targetWords = summaryWordsByDifficulty[difficulty] || 150;
                    const targetParagraphs = targetWords <= 60 ? "1 paragraph" : targetWords <= 100 ? "1–2 paragraphs" : "2 paragraphs";
                    
                    const rolePrompt = isRegeneration
                        ? "Rewrite and refine the provided summary draft, keeping the core message while strictly adhering to the specified target length and linguistic difficulty."
                        : "Generate a pre-reading summary of the given content, helping learners grasp the topic and practice reading before engaging with the full material.";

                    const quickSummaryPrompt = `
                    # Role
                    ${rolePrompt}
                
                    # Output Format
                    - Language: match the content's original language (${lessonLanguage})
                    - Structure: ${targetParagraphs}, separated by a blank line
                    - Format: plain text only; do NOT use HTML tags (no <p>, no <ruby>, no <rt>), no Markdown syntax
                    - Length: ${targetWords} words as a soft upper limit.
                    - Reading Aids:
                        - If ${lessonLanguage} uses logographic scripts (e.g., Japanese, Chinese):
                            - Exhaustive Annotation: Every logographic character (e.g., Kanji, Hanzi) need be annotated without exception with its phonetic reading using [Word|reading] format.
                            - Format Constraint: Always use [Word|reading] with a vertical bar '|'. Never output plain brackets like [Word] without
                            - Negative Examples:
                                - Incorrect: 狐[きつね] (Do not put brackets after the character) / Correct: [狐|きつね]
                                - Incorrect: [猫] (Missing vertical bar and reading) / Correct: [猫|ねこ]
                                - Incorrect: Leaving bare logographs unannotated anywhere in the text.
                        - If ${lessonLanguage} uses alphabetic or purely phonetic scripts (e.g., English, Spanish, Korean, German):
                            - Output regular plain text only. Never use phonetic annotations or bracket notation — output regular plain text only.
                
                    # Content Rules
                    - Objective and factual; base ONLY on the given content
                    - Ensure Coverage: When the given content is long, do not omit sections entirely; rather, you can reduce density and trim detail.
                    - Present information directly as standalone facts; never reference the source itself (avoid phrases like "this lesson," "this lecture," "the text explains," "in this video")
                    - Vocabulary Choice: Prioritize using the original vocabulary, phrases, and terminology directly from the source text rather than paraphrasing with external synonyms. Do not introduce harder or complex vocabulary absent from the original content, ensuring the summary's linguistic difficulty does not exceed that of the source material.
                    - Summary body ONLY: no preface, title restatement, or closing remarks
                    ${difficultyPrompt}
                    
                    # Examples
                    
                    ## Example 1: Alphabetic / Phonetic Script (Original: English)
                    User Input:
                    "Recent advancements in urban agriculture have transformed how cities approach food security and environmental sustainability. Rooftop farms and vertical hydroponic facilities are spreading across major metropolises, allowing local communities to harvest fresh produce year-round while significantly reducing transportation emissions. Furthermore, these green spaces help mitigate the urban heat island effect and improve stormwater management."
                    Assistant Output:
                    Urban agriculture is rapidly expanding through rooftop gardens and vertical hydroponic facilities in major cities. These local installations allow communities to harvest fresh produce year-round while reducing transportation emissions.
                    Beyond food production, these green facilities mitigate the urban heat island effect and strengthen stormwater management.

                    ## Example 2: Logographic Script with Exhaustive Phonetic Readings (Original: Japanese)
                    User Input:
                    "ある職人の工房では、伝統的な陶器作りの技術が受け継がれています。弟子たちは毎日早く工房へ行き、粘土をこねて作品の形を整えます。絵付けの工程では、特別な顔料を使い、筆を慎重に動かして美しい模様を描きます。完成した焼き物は箱に10個ずつ丁寧に詰められ、町の人々に届けられます。職人は道具の手入れを怠らず、古い道具を大切に使い続けています。"
                    Assistant Output:
                    [工房|こうぼう]では[伝統的|でんとうてき]な[陶器作り|とうきづくり]の[技術|ぎじゅつ]を[受|う]け[継|つ]ぎ、[弟子|でし]たちが[粘土|ねんど]から[作品|さくひん]の[形|かたち]を[整|ととの]えます。[絵付け|えづけ]では[特別|とくべつ]な[顔料|がんりょう]を[使|つか]い、[筆|ふで]で[美|うつく]しい[模様|もよう]を[描|えが]きます。
                    [完成|かんせい]した[焼き物|やきもの]は[箱|はこ]に[10個|じゅっこ]ずつ[詰|つ]めて[届|とど]けられます。[職人|しょくにん]は[道具|どうぐ]の[手入れ|ていれ]を[怠|おこた]らず、[大切|たいせつ]に[使|つか]い[続|つづ]けています。
                    `;
                    
                    const summary_history = [
                        {role: "system", content: removeIndent(quickSummaryPrompt)},
                        {role: "user", content: content}
                    ]
                    
                    let summaryRafId = null;
                    await streamOpenAIResponse(
                        provider, apikey, model, summary_history,
                        (chunk) => {
                            quickSummary += chunk;
                            if (!summaryRafId) {
                                summaryRafId = requestAnimationFrame(() => {
                                    const formatted = formatQuickSummaryHTML(quickSummary);
                                    if (formatted) {
                                        const summaryContent = document.querySelector(".quick-summary .summary-content");
                                        if (summaryContent) summaryContent.innerHTML = formatted;
                                        const closeBtn = document.querySelector(".quick-summary .close-summary-btn");
                                        if (closeBtn) closeBtn.style.display = "flex";
                                    }
                                    summaryRafId = null;
                                });
                            }
                        },
                        (finalContent) => {
                            quickSummary = finalContent;
                            console.log('[Quick summary]\n', finalContent);
                            const formatted = formatQuickSummaryHTML(quickSummary);
                            if (formatted) {
                                const summaryContent = document.querySelector(".quick-summary .summary-content");
                                if (summaryContent) summaryContent.innerHTML = formatted;
                                const closeBtn = document.querySelector(".quick-summary .close-summary-btn");
                                if (closeBtn) closeBtn.style.display = "flex";
                                const regenerateBtn = document.querySelector(".quick-summary .regenerate-summary-btn");
                                if (regenerateBtn) regenerateBtn.style.display = "flex";
                                const ttsBtn = document.querySelector(".quick-summary .tts-summary-btn");
                                if (ttsBtn) ttsBtn.style.display = "flex";
                            }
                        },
                        (error) => {
                            console.error("Failed to fetch summary:", error);
                            const summaryContent = document.querySelector(".quick-summary .summary-content");
                            if (summaryContent && !formatQuickSummaryHTML(quickSummary)) {
                                summaryContent.innerHTML = "<em>Failed to generate summary.</em>";
                            }
                            const closeBtn = document.querySelector(".quick-summary .close-summary-btn");
                            if (closeBtn) closeBtn.style.display = "flex";
                            const regenerateBtn = document.querySelector(".quick-summary .regenerate-summary-btn");
                            if (regenerateBtn) regenerateBtn.style.display = "flex";
                        },
                        null,
                        null,
                        0,
                        false,
                        !isRegeneration
                    );
                }
                
                function renderLessonSummaryDetails(targetSummaryElement = null) {
                    if (!lessonSummary) return;
                    const summaryElements = targetSummaryElement ? [targetSummaryElement] : document.querySelectorAll(".quick-summary");
                    summaryElements.forEach((element) => {
                        if (element.querySelector(".lesson-summary-details")) return;
                        
                        const details = createElement("details", {
                            className: "thought-process lesson-summary-details with-margin"
                        });
                        
                        const summary = createElement("summary", {
                            style: "font-size: 0.8em;",
                            innerHTML: `
                                <span class="thought-label">Lesson Summary</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron"><path d="m6 9 6 6 6-6"/></svg>
                            `
                        });
                        
                        const content = createElement("div", {
                            className: "thought-content",
                            style: "font-size: 0.7em;",
                            innerHTML: lessonSummary
                        });
                        
                        details.append(summary, content);
                        element.prepend(details);
                    });
                }
                
                function createAndPrependSummaryElement(section) {
                    if (!section || section.querySelector(".quick-summary") || section.parentNode?.querySelector?.(".quick-summary")) return;
                    
                    const shouldShowSummary = Boolean(settings.prependSummary[language]) && isFirstPageInPageMode();
                    const summaryElement = createElement("div", {
                        className: "quick-summary",
                        style: `position: relative; ${shouldShowSummary ? '' : 'display: none;'}`
                    });
                    
                    if (lessonSummary) {
                        renderLessonSummaryDetails(summaryElement);
                    }
                    
                    const formattedSummary = formatQuickSummaryHTML(quickSummary);
                    const hasSummary = Boolean(formattedSummary);

                    const contentWrapper = createElement("div", {
                        className: "summary-content",
                        innerHTML: hasSummary ? formattedSummary : '<em style="font-size: 0.8em;">Generating Quick Summary<span class="loading-text"></span></em>'
                    });
                    summaryElement.append(contentWrapper);
                    
                    const btnContainer = createElement("div", {
                            style: "display: flex; gap: 10px; align-items: center; justify-content: flex-end; margin: 0 10px 0 auto;"
                        }
                    );
                    
                    let audioData = null;

                    const regenerateButton = createElement("button", {
                        className: "regenerate-summary-btn",
                        title: "Regenerate Quick Summary\n(Ctrl/Shift+Click to regenerate from full text)",
                        innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
                        style: `padding: 10px 10px; border: 1px solid rgb(125, 125, 125, 50%); border-radius: 5px; cursor: pointer; display: ${hasSummary ? "flex" : "none"}; opacity: 1; align-items: center; justify-content: center;`
                    });

                    const ttsButton = createElement("button", {
                        className: "tts-summary-btn",
                        title: "Read Quick Summary",
                        innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play" aria-hidden="true"><path d="m6 3 14 9-14 9z"/></svg>`,
                        style: `padding: 10px 10px; border: 1px solid rgb(125, 125, 125, 50%); border-radius: 5px; cursor: pointer; display: ${hasSummary ? "flex" : "none"}; opacity: 1;`
                    });
                    
                    regenerateButton.addEventListener("click", async (event) => {
                        if (!quickSummary || regenerateButton.disabled) return;
                        regenerateButton.disabled = true;
                        regenerateButton.style.opacity = "0.5";
                        ttsButton.style.display = "none";
                        audioData = null;
                        
                        const previousSummary = quickSummary;
                        quickSummary = "";
                        contentWrapper.innerHTML = '<em style="font-size: 0.8em;">Regenerating Quick Summary<span class="loading-text"></span></em>';
                        
                        const isFreshGeneration = Boolean(event.ctrlKey || event.metaKey || event.shiftKey) && Boolean(cachedContextualContent);
                        const contentToUse = isFreshGeneration ? cachedContextualContent : previousSummary;
                        const isRegenerationMode = !isFreshGeneration;
                        
                        try {
                            await getQuickSummary(llmProvider, llmApiKey, llmModel, contentToUse, isRegenerationMode);
                        } catch (err) {
                            console.error("Regeneration failed:", err);
                        } finally {
                            regenerateButton.disabled = false;
                            regenerateButton.style.opacity = "1";
                        }
                    });

                    ttsButton.addEventListener("click", async () => {
                        if (!audioData) {
                            ttsButton.style.opacity = "0.5";
                            const textToTTS = contentWrapper.innerHTML
                                .replace(/<rt>[\s\S]*?<\/rt>/gi, "")
                                .replace(/<[^>]+>/g, "")
                                .replaceAll("\n", " ");
                            audioData = await getTTSResponse(settings.ttsProvider, settings.ttsApiKeys[settings.ttsProvider] || "", (settings.ttsVoice[language]), textToTTS);
                            ttsButton.style.opacity = "1";
                            if (!audioData) return;
                        }
                        playAudio(audioData, 1.0);
                    });
                    
                    const closeButton = createElement("button", {
                        className: "close-summary-btn",
                        title: "Close Quick Summary",
                        innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="6 6 12 12" stroke="currentColor"><path d="M17 17L7 7M17 7L7 17" stroke-width="1" stroke-linecap="round"/></svg>`,
                        style: `padding: 10px 10px; border: 1px solid rgb(125, 125, 125, 50%); border-radius: 5px; cursor: pointer; display: ${hasSummary ? "flex" : "none"}; opacity: 1; align-items: center; justify-content: center;`
                    });
                    closeButton.addEventListener("click", () => summaryElement.remove());
                    
                    btnContainer.append(regenerateButton, ttsButton, closeButton);
                    summaryElement.append(btnContainer);
                    
                    changeScrollAmount(".quick-summary", 0.2);
                    summaryElement.addEventListener('wheel', (event) => {
                        const {scrollTop, scrollHeight, clientHeight} = summaryElement;
                        const isScrollingUp = event.deltaY < 0;
                        const isScrollingDown = event.deltaY > 0;
                        
                        const isAtTop = scrollTop <= 0;
                        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                        
                        if ((isScrollingUp && !isAtTop) || (isScrollingDown && !isAtBottom)) {
                            event.stopPropagation();
                        }
                    }, {passive: false});
                    
                    if (section.classList.contains("reader-body")) {
                        section.prepend(summaryElement);
                    } else if (section.parentNode) {
                        section.parentNode.prepend(summaryElement);
                    }
                }
                
                quickSummary = "";
                lessonSummary = "";
                let cachedContextualContent = "";
                const existingSection = readerContainer.matches?.('.reader-body')
                    ? readerContainer
                    : (readerContainer.querySelector?.('.reader-body') || document.querySelector('.reader-body'));
                if (existingSection) createAndPrependSummaryElement(existingSection);
                
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType !== Node.ELEMENT_NODE) continue;
                            const target = node.matches?.('.reader-body') ? node : node.querySelector?.('.reader-body');
                            if (target) createAndPrependSummaryElement(target);
                        }
                    }
                });
                observer.observe(readerContainer, {childList: true, subtree: true});
                
                let lessonContent = "";
                const lessonLanguage = getLessonLanguage();
                const lessonId = getLessonId();
                
                if (lessonLanguage && lessonId) {
                    try {
                        const sentences = await getLessonSentences(lessonLanguage, lessonId);
                        if (sentences && sentences.length > 0) {
                            lessonContent = sentences
                                .map((item) => item.text?.trim())
                                .filter(Boolean)
                                .join('\n');
                        }
                    } catch (error) {
                        console.error("Failed to fetch lesson sentences via API, falling back to DOM:", error);
                    }
                }
                
                if (!lessonContent) {
                    lessonContent = extractTextFromDOM(readerContainer)?.trim() || "";
                }
                
                llmProvider = settings.llmProvider;
                llmModel = settings.llmModel;
                const savedKeys = settings.llmApiKeys;
                llmApiKey = savedKeys[llmProvider] || "";
                
                const lessonTitle = getLessonTitle();
                cachedContextualContent = lessonTitle
                    ? `Title: ${lessonTitle}\n\n${lessonContent}`
                    : lessonContent;

                if (settings.prependSummary[language]) {
                    await getQuickSummary(llmProvider, llmApiKey, llmModel, cachedContextualContent);
                }
                
                getLessonSummary(llmProvider, llmApiKey, llmModel, cachedContextualContent)
                    .then(summary => {
                        lessonSummary = convertMarkdownToHTML(summary);
                        renderLessonSummaryDetails();
                    });
                
            }
            
            function setupLessonCompletionObserver() {
                const lessonReader = document.getElementById("lesson-reader");
                if (!lessonReader || lessonReader.hasLessonCompletionObserver) return;
                lessonReader.hasLessonCompletionObserver = true;

                let isCompletedHandled = false;

                const onCompletedActive = async () => {
                    if (isCompletedHandled) return;
                    isCompletedHandled = true;

                    const usageStats = lessonUsageHistory.reduce((acc, usage) => {
                        const category = usage.type.includes("TTS") ? "TTS"
                            : usage.type.includes("Cache") ? "Cache"
                                : "LLM Chat/Summary";
                        
                        if (!acc[category]) {
                            acc[category] = {
                                calls: 0,
                                cost: 0,
                                uncachedCost: 0,
                                tokens: {cached: 0, input: 0, reasoning: 0, output: 0}
                            };
                        }
                        
                        acc[category].calls += 1;
                        acc[category].cost += usage.cost;
                        acc[category].uncachedCost += (usage.uncachedCost ?? usage.cost);
                        acc.totalCost += usage.cost;
                        acc.totalUncachedCost += (usage.uncachedCost ?? usage.cost);
                        
                        if (usage.tokens) {
                            acc[category].tokens.cached += (usage.tokens.cached || 0);
                            acc[category].tokens.input += (usage.tokens.input || 0);
                            acc[category].tokens.reasoning += (usage.tokens.reasoning || 0);
                            acc[category].tokens.output += (usage.tokens.output || 0);
                            
                            acc.totalTokens.cached += (usage.tokens.cached || 0);
                            acc.totalTokens.input += (usage.tokens.input || 0);
                            acc.totalTokens.reasoning += (usage.tokens.reasoning || 0);
                            acc.totalTokens.output += (usage.tokens.output || 0);
                        }
                        
                        return acc;
                    }, {
                        totalCost: 0,
                        totalUncachedCost: 0,
                        totalTokens: {cached: 0, input: 0, reasoning: 0, output: 0}
                    });
                    
                    const totalSavedPercent = usageStats.totalUncachedCost > 0
                        ? (((usageStats.totalUncachedCost - usageStats.totalCost) / usageStats.totalUncachedCost) * 100).toFixed(1)
                        : '0.0';
                    
                    const {
                        cached: tCached,
                        input: tInput,
                        reasoning: tReasoning,
                        output: tOutput
                    } = usageStats.totalTokens;
                    console.log('[Lesson Stats]', `tokens: (${tCached}/${tInput}/${tReasoning}/${tOutput}), Total Cost: $${usageStats.totalCost.toFixed(6)} (${totalSavedPercent}% saved)`);
                    
                    Object.entries(usageStats)
                        .filter(([key]) => !key.startsWith("total"))
                        .forEach(([category, data]) => {
                            const savedPercent = data.uncachedCost > 0
                                ? (((data.uncachedCost - data.cost) / data.uncachedCost) * 100).toFixed(1)
                                : '0.0';
                            const {cached, input, reasoning, output} = data.tokens;
                            console.log(`  - ${category}: ${data.calls} calls, tokens: (${cached}/${input}/${reasoning}/${output}), $${data.cost.toFixed(6)} (${savedPercent}% saved)`);
                        });

                    clickElement("div.player-wrapper > div.player-close a");
                    resetLocalVideo();
                    
                    const escEvent = new KeyboardEvent("keydown", {
                        key: "Escape",
                        code: "Escape",
                        keyCode: 27,
                        which: 27,
                        bubbles: true,
                        cancelable: true
                    });
                    window.dispatchEvent(escEvent);
                    document.dispatchEvent(escEvent);

                    const nextButton = document.querySelector("#lesson-reader > div.h-full > div > header > div.col-3 > button");
                    if (!nextButton) return;

                    if (settings.skipEndPage) {
                        for (let i = 0; i < 2; i++) {
                            const currentPanel = document.querySelector('[id$="-content-lessonCompleted"]');
                            if (currentPanel?.getAttribute("data-state") === "active") {
                                break;
                            }
                            nextButton.click();
                            await sleep(500);
                        }
                    }
                };

                let tabsObserver = null;
                const attachTabsObserver = () => {
                    if (tabsObserver) return;
                    const tabsContainer = lessonReader.querySelector('[data-slot="tabs"]');
                    if (!tabsContainer) return;
                    tabsObserver = new MutationObserver(() => {
                        checkCompletionState();
                    });
                    tabsObserver.observe(tabsContainer, {
                        attributes: true,
                        attributeFilter: ["data-state"],
                        subtree: true
                    });
                };

                const detachTabsObserver = () => {
                    if (tabsObserver) {
                        tabsObserver.disconnect();
                        tabsObserver = null;
                    }
                };

                const checkCompletionState = () => {
                    const completionPanel = document.querySelector('[id$="-content-lessonCompleted"]');
                    const isCompletedActive = completionPanel?.getAttribute("data-state") === "active";
                    const isReaderCompleted = lessonReader.getAttribute("data-lesson-completed-visible") === "true";

                    if (isCompletedActive || isReaderCompleted) {
                        attachTabsObserver();
                        onCompletedActive();
                    } else if (!isCompletedActive && !isReaderCompleted) {
                        detachTabsObserver();
                        isCompletedHandled = false;
                    }
                };

                checkCompletionState();

                const completionObserver = new MutationObserver((mutations) => {
                    const isRelevant = mutations.some((m) => {
                        if (m.type === "attributes" && m.attributeName === "data-lesson-completed-visible") {
                            return true;
                        }
                        if (m.type === "childList") {
                            const matchNode = (node) =>
                                node.nodeType === Node.ELEMENT_NODE && (
                                    node.classList.contains("bg-editor") ||
                                    node.querySelector?.('[id$="-content-lessonCompleted"], [data-slot="tabs"]')
                                );
                            return Array.from(m.addedNodes).some(matchNode) || Array.from(m.removedNodes).some(matchNode);
                        }
                        return false;
                    });

                    if (!isRelevant) return;

                    checkCompletionState();
                });

                completionObserver.observe(lessonReader, {
                    attributes: true,
                    attributeFilter: ["data-lesson-completed-visible"],
                    childList: true
                });
            }
            
            function isFirstPageInPageMode() {
                if (!isNativePageMode()) return true;
                const prevBtn = document.querySelector('button[aria-label="Previous page"]');
                if (prevBtn) return false;
                const progressInput = document.querySelector('input[type="range"][aria-label="Lesson progress"]');
                if (progressInput && Number(progressInput.value) > 0) return false;
                const firstToken = document.querySelector('.poc-page .sentence-item[data-word-index]');
                if (firstToken && Number(firstToken.dataset.wordIndex) > 0) return false;
                return true;
            }

            function updateQuickSummaryPageVisibility() {
                const summaryEl = document.querySelector(".quick-summary");
                if (!summaryEl) return;
                if (!settings.prependSummary[language] || !isFirstPageInPageMode()) {
                    summaryEl.style.display = "none";
                } else {
                    summaryEl.style.display = "block";
                }
            }

            function resetScroll() {
                const scrollTargets = document.querySelectorAll('[data-reader-mode-body="true"] > div.overflow-y-auto, .reader-body');
                scrollTargets.forEach((target) => {
                    target.scrollTop = 0;
                    target.scrollLeft = 0;
                });
            }
            function getFinishPageButton(action) {
                if (action === "back") {
                    return document.querySelector('#lesson-reader button[data-variant="link"]') ||
                        document.querySelector('#lesson-reader button:has(svg.lucide-chevron-left)') ||
                        document.querySelector('#lesson-reader button svg.lucide-chevron-left')?.closest('button');
                }
                
                if (action === "next") {
                    const completionPanel = document.querySelector('[id$="-content-lessonCompleted"]');
                    return completionPanel?.querySelector('button[data-variant="primary"]');
                }
                
                return null;
            }

            function isFinishPageActive() {
                const completionPanel = document.querySelector('[id$="-content-lessonCompleted"]');
                if (!completionPanel) return false;
                const isCompletedActive = completionPanel.getAttribute("data-state") === "active";
                const isReaderCompleted = document.getElementById("lesson-reader")?.getAttribute("data-lesson-completed-visible") === "true";
                return isCompletedActive || isReaderCompleted;
            }

            function preventHorizontalScroll() {
                if (window.hasPreventHorizontalScrollLinked) return;
                window.hasPreventHorizontalScrollLinked = true;
                
                window.addEventListener('keydown', (event) => {
                    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                        const target = event.target;
                        const isTextInput = target.localName === "text" ||
                            target.localName === "textarea" ||
                            target.localName === "input" ||
                            target.isContentEditable;
                        
                        if (isTextInput) return;

                        if (event.shiftKey && isFinishPageActive()) {
                            if (event.key === "ArrowLeft") {
                                const backBtn = getFinishPageButton("back");
                                if (backBtn) {
                                    event.preventDefault();
                                    event.stopImmediatePropagation();
                                    backBtn.click();
                                    return;
                                }
                            } else if (event.key === "ArrowRight") {
                                const nextBtn = getFinishPageButton("next");
                                if (nextBtn) {
                                    event.preventDefault();
                                    event.stopImmediatePropagation();
                                    nextBtn.click();
                                    return;
                                }
                            }
                        }

                        if (!event.shiftKey && !isNativePageMode()) {
                            event.preventDefault();
                        }
                    }
                }, {passive: false, capture: true});
            }
            
            async function handleLoadedContent(node) {
                resetScroll();
                updateQuickSummaryPageVisibility();
                
                currentGeminiCacheName = null;
                geminiCachePromise = null;
                lessonUsageHistory = [];
                console.log('[Lesson Stats]', 'Lesson started. Usage history reset.');
                
                resetLocalVideo();
                handleLocalVideoContainerVisibility();
                attachAudioPlayerObserver();
                setupLessonCompletionObserver();
                
                preventHorizontalScroll();
                
                setupSentenceFocus(node);
                
                changeTranslationColor(node);
                
                const lessonLanguage = getLessonLanguage();
                const lessonId = getLessonId();
                if (lessonLanguage && lessonId) {
                    getLessonSentences(lessonLanguage, lessonId).catch(() => {});
                }
                await generateLessonSummary(node);
            }
            
            setupLessonCompletionObserver();
            
            const readerBodyContainer = await waitForElement('div[data-reader-mode-body="true"]', 10000);
            if (readerBodyContainer) {
                const targetNode = readerBodyContainer.querySelector('.reader-body, .poc-page') || readerBodyContainer;
                handleLoadedContent(targetNode);
                
                const progressSlider = document.querySelector('input[type="range"][aria-label="Lesson progress"]');
                if (progressSlider) {
                    progressSlider.addEventListener('input', () => {
                        updateQuickSummaryPageVisibility();
                        resetScroll();
                    });
                }
                
                const observer = new MutationObserver((mutations) => {
                    let shouldSyncPageState = false;
                    for (const mutation of mutations) {
                        if (mutation.type === "childList") {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                                if (node.matches?.('.reader-body, .poc-page')) {
                                    handleLoadedContent(node);
                                    return;
                                }
                                if (node.matches?.('.poc-column, .poc-line') || node.querySelector?.('.poc-column, .poc-line')) {
                                    shouldSyncPageState = true;
                                }
                            }
                            if (mutation.target.nodeType === Node.ELEMENT_NODE && mutation.target.matches?.('.poc-page, .poc-column')) {
                                shouldSyncPageState = true;
                            }
                        } else if (mutation.type === "attributes" && mutation.attributeName === "class") {
                            const oldClass = mutation.oldValue || "";
                            const newClass = mutation.target.className || "";
                            const oldPage = oldClass.match(/\bis-page-(\d+)\b/)?.[1];
                            const newPage = newClass.match(/\bis-page-(\d+)\b/)?.[1];
                            
                            if (newPage && oldPage !== newPage) {
                                shouldSyncPageState = true;
                            }
                        }
                    }
                    if (shouldSyncPageState) {
                        updateQuickSummaryPageVisibility();
                        resetScroll();
                    }
                });
                
                observer.observe(readerBodyContainer, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class'],
                    attributeOldValue: true
                });
            }
        }
        
        async function createGeminiCache(provider, apiKey, model, summaryHTML, sysPlain, sysWord) {
            let apiUrl = 'https://generativelanguage.googleapis.com/v1beta/cachedContents';
            let headers = {'Content-Type': 'application/json'};
            let formattedModel = model.startsWith('models/') ? model : `models/${model}`;
            let isPriority = false;
            
            if (provider === "vertex") {
                const projectId = settings.vertexCredential.projectId;
                const region = "global";
                const cleanModel = model.replace(/^models\//, '').replace(/^google\//, '');
                formattedModel = `projects/${projectId}/locations/${region}/publishers/google/models/${cleanModel}`;
                
                apiUrl = `https://aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${region}/cachedContents`;
                headers['Authorization'] = `Bearer ${apiKey}`;
                if (useVertexPriorityMode) {
                    headers['X-Vertex-AI-LLM-Request-Type'] = 'shared';
                    headers['X-Vertex-AI-LLM-Shared-Request-Type'] = 'priority';
                    isPriority = true;
                }
            } else {
                headers['x-goog-api-key'] = apiKey;
            }
            
            const contents = [
                {role: "user", parts: [{text: `<summary>${summaryHTML}</summary>`}]},
                {role: "user", parts: [{text: sysPlain}]},
                {role: "user", parts: [{text: sysWord}]}
            ];
            
            try {
                const response = await gmFetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({model: formattedModel, contents})
                });
                
                if (!response.ok) {
                    console.error("Cache Creation Failed:", await response.text());
                    return null;
                }
                const data = await response.json();
                
                const totalTokens = data.usageMetadata?.totalTokenCount || data.totalTokenCount || 0;
                const [inputPrice] = getLLMPricing(model);
                const inputCost = totalTokens * inputPrice;
                const storageCostPerHour = totalTokens * (1 / 1000000);
                const totalInitialCost = (inputCost + storageCostPerHour) * (isPriority ? 1.8 : 1.0);
                
                showToast("Cache Created", true);
                
                trackLLMUsage("Cache Creation", model, 0, totalTokens, 0, 0, totalInitialCost, isPriority, provider);
                
                return data.name;
            } catch (error) {
                console.error("Cache Creation Exception:", error);
                return null;
            }
        }
        
        async function refreshGeminiCache() {
            if (settings.llmProvider !== "google" && settings.llmProvider !== "vertex") return null;
            if (geminiCachePromise) return await geminiCachePromise;
            
            let apiKey;
            if (settings.llmProvider === "vertex") {
                try {
                    apiKey = await getValidVertexToken();
                } catch (e) {
                    console.error("Vertex token fetch failed:", e);
                    return null;
                }
            } else {
                apiKey = settings.llmApiKeys["google"];
            }
            
            if (!apiKey || !lessonSummary) return null;
            
            geminiCachePromise = (async () => {
                try {
                    currentGeminiCacheName = await createGeminiCache(settings.llmProvider, apiKey, settings.llmModel, lessonSummary, systemPrompt, wordPhrasePrompt);
                    return currentGeminiCacheName;
                } finally {
                    geminiCachePromise = null;
                }
            })();
            
            return await geminiCachePromise;
        }
        
        async function setupLLMs() {
            let llmProvider = settings.llmProvider;
            let llmModel = settings.llmModel;
            let savedKeys = settings.llmApiKeys;
            let llmApiKey = savedKeys[llmProvider] || "";
            
            const ttsAudioCache = new Map();
            let currentTTSRequestId = 0;
            let ttsInterceptorInitialized = false;
            let lastAutoplayText = "";
            
            function getPopupSentenceText() {
                if (document.querySelector('div[data-word-widget]')) return "";
                const popup = document.querySelector('div[data-reader-popup="true"]');
                if (!popup) return "";
                
                const ariaLabel = popup.getAttribute('aria-label');
                if (ariaLabel && !ariaLabel.includes('Not a phrase') && ariaLabel.startsWith('Actions for ')) {
                    return ariaLabel.replace(/^Actions for\s+/i, '').trim();
                }
                
                const statusBtn = popup.querySelector('button[aria-label^="Status of "]');
                if (statusBtn) {
                    return statusBtn.getAttribute('aria-label').replace(/^Status of\s+/i, '').trim();
                }
                
                const saveBtn = popup.querySelector('button[aria-label^="Save "]');
                if (saveBtn) {
                    const saveMatch = saveBtn.getAttribute('aria-label').match(/^Save\s+(.*?)\s+as\s+/i);
                    if (saveMatch && saveMatch[1]) return saveMatch[1].trim();
                }
                
                const pEl = popup.querySelector('p[dir="ltr"]') || popup.querySelector('p') || popup.querySelector('.text-foreground');
                if (pEl && pEl.textContent.trim()) {
                    return pEl.textContent.trim();
                }
                
                return "";
            }
            
            function getCurrentlyTargetedText() {
                const isWord = Boolean(document.querySelector('div[data-word-widget]'));
                if (isWord) {
                    const selectedTextElement = document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
                    if (selectedTextElement) return selectedTextElement.textContent.trim();
                }
                
                const popupText = getPopupSentenceText();
                if (popupText) return popupText;
                
                const selectedTextElement = document.querySelector(".chat-message:last-child > b") ||
                                           document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
                return selectedTextElement ? selectedTextElement.textContent.trim() : "";
            }
            
            async function playCustomTTSForText(text, autoplay = false, forceCustom = false) {
                if (!text || !settings.tts) return;
                if (text.length > 1000) {
                    console.log("The length of the selected text exceeds 1,000.");
                    return;
                }
                
                if (!forceCustom) {
                    const isWord = Boolean(document.querySelector('div[data-word-widget]'));
                    const isSentencePopup = Boolean(document.querySelector('div[data-reader-popup="true"]'));
                    const isSentence = isSentencePopup || !isWord;
                    const ttsWordOff = !settings.ttsWord && !isSentence;
                    const ttsSentenceOff = !settings.ttsSentence && isSentence;
                    if (ttsWordOff || ttsSentenceOff) return;
                }
                
                const requestId = ++currentTTSRequestId;
                let audioData = ttsAudioCache.get(text);
                if (!audioData) {
                    audioData = await getTTSResponse(settings.ttsProvider, settings.ttsApiKeys[settings.ttsProvider] || "", (settings.ttsVoice[language]), text);
                    if (!audioData) {
                        console.log("audioData can't be got.");
                        return;
                    }
                    ttsAudioCache.set(text, audioData);
                }
                
                if (requestId !== currentTTSRequestId) return;
                
                stopPlayingAudio(audioContext);
                await playAudio(audioData, 1.0);
            }
            
            let isProgrammaticNativeTTS = false;
            
            function playNativeTTS() {
                const ttsBtn = document.querySelector('div[data-word-widget] button[aria-label="Listen"], div[data-reader-popup="true"] button[aria-label="Listen"]');
                if (ttsBtn) {
                    isProgrammaticNativeTTS = true;
                    try {
                        ttsBtn.click();
                    } finally {
                        isProgrammaticNativeTTS = false;
                    }
                } else {
                    setTimeout(() => {
                        const retryBtn = document.querySelector('div[data-word-widget] button[aria-label="Listen"], div[data-reader-popup="true"] button[aria-label="Listen"]');
                        if (retryBtn) {
                            isProgrammaticNativeTTS = true;
                            try {
                                retryBtn.click();
                            } finally {
                                isProgrammaticNativeTTS = false;
                            }
                        }
                    }, 50);
                }
            }
            
            function initTTSInterceptor() {
                if (ttsInterceptorInitialized) return;
                ttsInterceptorInitialized = true;
                
                document.addEventListener('click', async (event) => {
                    const ttsBtn = event.target.closest('div[data-word-widget] button[aria-label="Listen"], div[data-reader-popup="true"] button[aria-label="Listen"]');
                    if (!ttsBtn) return;
                    if (isProgrammaticNativeTTS) return;
                    if (!settings.tts) return;
                    
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    
                    const targetText = getCurrentlyTargetedText();
                    if (!targetText) return;
                    await playCustomTTSForText(targetText, false, true);
                }, true);
            }
            
            async function updateTTS(autoplay = false) {
                initTTSInterceptor();
                
                const targetText = getCurrentlyTargetedText();
                if (!targetText) return;
                
                if (autoplay && settings.ttsAutoplay) {
                    if (targetText === lastAutoplayText) return;
                    lastAutoplayText = targetText;
                    
                    const isSentence = Boolean(getPopupSentenceText());
                    const useAiTTS = settings.tts && (isSentence ? settings.ttsSentence : settings.ttsWord);
                    if (useAiTTS) {
                        await playCustomTTSForText(targetText, true, false);
                    } else {
                        playNativeTTS();
                    }
                }
            }
            
            async function updateWidget(autoplay = settings.ttsAutoplay) {
                function getSectionHead() {
                    return document.querySelector('div[data-word-widget] div.min-h-0.flex-1.overflow-y-auto') ||
                           document.querySelector('div[data-word-widget]') ||
                           document.querySelector("#lesson-reader .widget-area > .reader-widget");
                }
                
                function getInPageSelectedWithContext(targetSideWords = 50, targetSideLength = 350) {
                    const isWord = Boolean(document.querySelector('div[data-word-widget]'));
                    if (!isWord) {
                        const popupText = getPopupSentenceText();
                        if (popupText) {
                            return {input: popupText, context: popupText};
                        }
                    }
                    
                    const selectedTextElement = document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
                    const selectedText = selectedTextElement ? extractTextFromDOM(selectedTextElement).trim() : "";
                    if (!selectedText) return {input: "", context: ""};
                    
                    // Extract sentence and surrounding context using LingQ redesign data-sentence-index
                    const allWordItems = Array.from(document.querySelectorAll('.sentence-item'));
                    const selectedEl = document.querySelector('.sentence-item.is-selected, .sentence-item.selected, .sentence-item[data-selected="true"], [data-is-active="true"]') ||
                                       allWordItems.find(el => el.textContent.trim() === selectedText);
                    
                    if (selectedEl?.dataset?.sentenceIndex) {
                        const sentenceIdxNum = Number(selectedEl.dataset.sentenceIndex);
                        if (!isNaN(sentenceIdxNum)) {
                            const prevText = allWordItems.filter(el => Number(el.dataset.sentenceIndex) === sentenceIdxNum - 1).map(el => el.textContent).join('');
                            const currentWords = allWordItems.filter(el => Number(el.dataset.sentenceIndex) === sentenceIdxNum);
                            const nextText = allWordItems.filter(el => Number(el.dataset.sentenceIndex) === sentenceIdxNum + 1).map(el => el.textContent).join('');
                            
                            let tagged = false;
                            const currentText = currentWords.map(el => {
                                const t = el.textContent;
                                if (!tagged && (el === selectedEl || t.trim() === selectedText)) {
                                    tagged = true;
                                    return `<selected>${t}</selected>`;
                                }
                                return t;
                            }).join('');
                            
                            const contextCombined = [prevText, currentText, nextText].filter(Boolean).join(' ').trim();
                            if (contextCombined) {
                                return {input: selectedText, context: contextCombined};
                            }
                        }
                    }
                    
                    // Fallback to word widget Sentence section
                    const sentenceSection = Array.from(document.querySelectorAll('div[data-word-widget] section')).find(s => s.querySelector('h3')?.textContent.includes('Sentence'));
                    if (sentenceSection) {
                        const sentenceBody = sentenceSection.querySelector('p, div:not(:has(h3)), [data-reader-sentence="true"]');
                        const sentenceRaw = (sentenceBody || sentenceSection).textContent.replace(/^Sentence\s*/i, '').trim();
                        if (sentenceRaw) {
                            const tagged = sentenceRaw.includes(selectedText)
                                ? sentenceRaw.replace(selectedText, `<selected>${selectedText}</selected>`)
                                : `<selected>${selectedText}</selected> ${sentenceRaw}`;
                            return {input: selectedText, context: tagged};
                        }
                    }
                    
                    // Fallback to legacy sentence container
                    let currentSentenceEl = selectedEl?.closest(".reader-sentence, .sentence");
                    const allSentences = [...document.querySelectorAll(".reader-sentence, .sentence")];
                    if (currentSentenceEl && allSentences.length > 0) {
                        const currentIndex = allSentences.indexOf(currentSentenceEl);
                        const prefixTexts = [];
                        let prevIdx = currentIndex - 1;
                        let prefixLength = 0;
                        while (prefixLength < targetSideLength && prevIdx >= 0) {
                            const text = extractTextFromDOM(allSentences[prevIdx])?.trim();
                            if (text) {
                                prefixTexts.unshift(text);
                                prefixLength += text.length;
                            }
                            prevIdx--;
                        }
                        const suffixTexts = [];
                        let nextIdx = currentIndex + 1;
                        let suffixLength = 0;
                        while (suffixLength < targetSideLength && nextIdx < allSentences.length) {
                            const text = extractTextFromDOM(allSentences[nextIdx])?.trim();
                            if (text) {
                                suffixTexts.push(text);
                                suffixLength += text.length;
                            }
                            nextIdx++;
                        }
                        const currentText = extractTextFromDOM(currentSentenceEl, selectedEl || currentSentenceEl).trim();
                        const rawCombined = [...prefixTexts, currentText, ...suffixTexts].filter(Boolean).join(" ");
                        if (rawCombined) {
                            return {input: selectedText, context: rawCombined};
                        }
                    }
                    
                    return {input: selectedText, context: `<selected>${selectedText}</selected>`};
                }
                
                function getSelectedWithContext(targetSideWords = 50, targetSideLength = 350) {
                    const isWord = Boolean(document.querySelector('div[data-word-widget]'));
                    if (!isWord) {
                        const popupText = getPopupSentenceText();
                        if (popupText) {
                            return {input: popupText, context: popupText};
                        }
                    }
                    
                    const selectedTextElement = document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
                    const rawSelectedText = selectedTextElement ? extractTextFromDOM(selectedTextElement)?.trim() : "";
                    
                    const inPageData = getInPageSelectedWithContext(targetSideWords, targetSideLength);
                    const effectiveInput = inPageData.input || rawSelectedText;
                    
                    if (!isNativePageMode()) {
                        return inPageData.context ? inPageData : {input: effectiveInput, context: ""};
                    }
                    
                    const lessonLanguage = getLessonLanguage();
                    const lessonId = getLessonId();
                    const cacheKey = `${lessonLanguage}_${lessonId}`;
                    const cachedSentences = lessonSentencesCache.get(cacheKey);
                    if (!cachedSentences || cachedSentences.length === 0) {
                        return inPageData.context ? inPageData : {input: effectiveInput, context: ""};
                    }
                    
                    const fullLessonText = cachedSentences
                        .map((item) => (item.text || item.cleanText || "").trim())
                        .filter(Boolean)
                        .join(" ");
                    
                    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const toFlexiblePattern = (str) => {
                        if (!str) return "";
                        return Array.from(str.replace(/\s+/g, ""))
                            .map((char) => escapeRegex(char))
                            .join("\\s*");
                    };
                    
                    let targetWord = "";
                    let anchorPrefix = "";
                    let anchorSuffix = "";
                    
                    const selectedMatch = inPageData.context?.match(/<selected>(.*?)<\/selected>/);
                    if (selectedMatch) {
                        targetWord = selectedMatch[1];
                        const tagStart = selectedMatch.index;
                        const tagEnd = tagStart + selectedMatch[0].length;
                        anchorPrefix = inPageData.context.slice(0, tagStart).slice(-25).trim();
                        anchorSuffix = inPageData.context.slice(tagEnd).slice(0, 25).trim();
                    } else {
                        targetWord = effectiveInput;
                    }
                    
                    if (!targetWord) {
                        return inPageData.context ? inPageData : {input: effectiveInput, context: ""};
                    }
                    
                    const patternWord = toFlexiblePattern(targetWord.trim());
                    const patternPrefix = anchorPrefix ? toFlexiblePattern(anchorPrefix) : "";
                    const patternSuffix = anchorSuffix ? toFlexiblePattern(anchorSuffix) : "";
                    
                    let match = null;
                    let matchedWordStart = -1;
                    let matchedWordEnd = -1;
                    
                    if (patternPrefix && patternSuffix) {
                        const regex = new RegExp(`(${patternPrefix})\\s*(${patternWord})\\s*(${patternSuffix})`);
                        match = fullLessonText.match(regex);
                        if (match) {
                            matchedWordStart = match.index + match[1].length + match[0].slice(match[1].length).indexOf(match[2]);
                            matchedWordEnd = matchedWordStart + match[2].length;
                        }
                    }
                    
                    if (!match && patternPrefix) {
                        const regex = new RegExp(`(${patternPrefix})\\s*(${patternWord})`);
                        match = fullLessonText.match(regex);
                        if (match) {
                            matchedWordStart = match.index + match[1].length + match[0].slice(match[1].length).indexOf(match[2]);
                            matchedWordEnd = matchedWordStart + match[2].length;
                        }
                    }
                    
                    if (!match && patternSuffix) {
                        const regex = new RegExp(`(${patternWord})\\s*(${patternSuffix})`);
                        match = fullLessonText.match(regex);
                        if (match) {
                            matchedWordStart = match.index;
                            matchedWordEnd = matchedWordStart + match[1].length;
                        }
                    }
                    
                    if (!match && patternWord) {
                        const regex = new RegExp(patternWord);
                        match = fullLessonText.match(regex);
                        if (match) {
                            matchedWordStart = match.index;
                            matchedWordEnd = matchedWordStart + match[0].length;
                        }
                    }
                    
                    if (!match || matchedWordStart === -1) {
                        return inPageData.context ? inPageData : {input: effectiveInput, context: ""};
                    }
                    
                    const beforeText = fullLessonText.slice(0, matchedWordStart).trimEnd();
                    const exactWord = fullLessonText.slice(matchedWordStart, matchedWordEnd);
                    const afterText = fullLessonText.slice(matchedWordEnd).trimStart();
                    
                    const beforeWords = beforeText ? beforeText.split(/\s+/) : [];
                    const afterWords = afterText ? afterText.split(/\s+/) : [];
                    
                    let leftContext = beforeWords.slice(-targetSideWords).join(" ");
                    let rightContext = afterWords.slice(0, targetSideWords).join(" ");
                    
                    if (leftContext.length > targetSideLength) {
                        leftContext = leftContext.slice(-targetSideLength).trimStart();
                    }
                    if (rightContext.length > targetSideLength) {
                        rightContext = rightContext.slice(0, targetSideLength).trimEnd();
                    }
                    
                    const contextText = [leftContext, `<selected>${exactWord}</selected>`, rightContext]
                        .filter(Boolean)
                        .join(" ")
                        .trim();
                    
                    console.log(`Context (API): ${effectiveInput.length} -> ${contextText.length} (Page mode anchored)`);
                    return {input: effectiveInput, context: contextText};
                }
                
                let isProgrammaticReferenceWordUpdate = false;
                
                function updateReferenceWord() {
                    isProgrammaticReferenceWordUpdate = true;
                    const referenceWord = document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
                    if (!referenceWord) {
                        isProgrammaticReferenceWordUpdate = false;
                        return;
                    }
                    
                    const popupText = getPopupSentenceText();
                    if (popupText && isSentence) {
                        referenceWord.textContent = popupText;
                        isProgrammaticReferenceWordUpdate = false;
                        return;
                    }
                    
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const extractedText = extractTextFromDOM(selection.getRangeAt(0).cloneContents());
                        if (extractedText && isSentence) {
                            referenceWord.textContent = extractedText;
                        }
                    }
                    isProgrammaticReferenceWordUpdate = false;
                }
                
                function isWordMessageStructure(botMessageDiv) {
                    if (!botMessageDiv) return false;
                    
                    const wordElem = botMessageDiv.querySelector("b");
                    const pronunciationElem = botMessageDiv.querySelector("span");
                    const posElem = botMessageDiv.querySelector("i");
                    const paragraphs = botMessageDiv.querySelectorAll("p");
                    const hrs = botMessageDiv.querySelectorAll("hr");
                    const exampleListElem = botMessageDiv.querySelector("ul");
                    const exampleItems = exampleListElem ? exampleListElem.querySelectorAll("li") : [];
                    
                    if (!wordElem || !pronunciationElem || !posElem) return false;
                    if (paragraphs.length < 2 || hrs.length < 2) return false;
                    if (!exampleListElem || exampleItems.length < 2) return false;
                    
                    return true;
                }
                
                function syncFlashcardBadge(badge, count) {
                    if (!badge) return;
                    badge.dataset.count = String(count);
                    badge.dataset.display = count > 9 ? "9+" : String(count);
                }
                
                function syncWordCardToChatHistory(botMessageDiv) {
                    const messageId = botMessageDiv?.dataset?.messageId;
                    if (!messageId) return;
                    
                    const cardClone = botMessageDiv.cloneNode(true);
                    cardClone.querySelectorAll(".thought-process, details, .message-button-container, .flashcard-count-badge").forEach((el) => el.remove());
                    const cardHtml = `<div class="word-card">\n${cardClone.innerHTML.trim()}\n</div>`;
                    
                    let updatedContent = cardHtml;
                    if (botMessageDiv.relatedPrefaceNode) {
                        const prefaceClone = botMessageDiv.relatedPrefaceNode.cloneNode(true);
                        prefaceClone.querySelectorAll(".thought-process, details").forEach((el) => el.remove());
                        const prefaceHtml = prefaceClone.innerHTML.trim();
                        if (prefaceHtml) {
                            updatedContent = `${prefaceHtml}\n${cardHtml}`;
                        }
                    }
                    
                    chatHistory = chatHistory.map((item) =>
                        item.id === messageId ? {...item, content: updatedContent} : item
                    );
                }
                
                function setupUserMessageEdit(userMessageDiv, userMessageId, userButtonContainer) {
                    userMessageDiv.addEventListener("click", (e) => {
                        if (!e.ctrlKey && !e.metaKey) return;
                        if (e.target.closest(".message-button-container, textarea")) return;
                        
                        const historyItem = chatHistory.find((item) => item.id === userMessageId);
                        const currentText = historyItem ? historyItem.content : userMessageDiv.textContent.trim();
                        
                        const textarea = createElement("textarea", {
                            className: "card-edit-textarea",
                            value: currentText,
                            rows: 1,
                            style: {
                                height: "auto"
                            }
                        });
                        
                        const editWrapper = createElement("p", {}, textarea);
                        userMessageDiv.innerHTML = "";
                        userMessageDiv.append(editWrapper, userButtonContainer);
                        textarea.style.height = `${textarea.scrollHeight}px`;
                        textarea.focus();
                        
                        textarea.addEventListener("click", (event) => {
                            event.stopPropagation();
                        });
                        
                        let isFinished = false;
                        const restoreView = (textToRender) => {
                            userMessageDiv.innerHTML = convertMarkdownToHTML(textToRender);
                            userMessageDiv.appendChild(userButtonContainer);
                        };
                        
                        const finishEdit = () => {
                            if (isFinished) return;
                            isFinished = true;
                            
                            const newValue = textarea.value.trim();
                            if (!newValue || newValue === currentText) {
                                restoreView(currentText);
                                return;
                            }
                            
                            restoreView(newValue);
                            chatHistory = chatHistory.map((item) =>
                                item.id === userMessageId ? {...item, content: newValue} : item
                            );
                        };
                        
                        textarea.addEventListener("keydown", (event) => {
                            if (event.isComposing || event.keyCode === 229) return;
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                textarea.blur();
                            } else if (event.key === "Escape") {
                                isFinished = true;
                                restoreView(currentText);
                            }
                        });
                        
                        textarea.addEventListener("blur", () => {
                            finishEdit();
                        });
                    });
                }
                
                function setupBlockEditableField(element, fieldName, fieldLabel, botMessageDiv) {
                    if (!element) return;
                    
                    element.addEventListener("click", async (e) => {
                        if (!e.ctrlKey && !e.metaKey) return;
                        e.stopPropagation();
                        if (element.querySelector("textarea, input")) return;
                        
                        const currentText = element.textContent.trim();
                        const currentHeight = Math.max(element.offsetHeight, 24);
                        
                        const textarea = createElement("textarea", {
                            className: "card-edit-textarea",
                            value: currentText,
                            style: {
                                height: `${currentHeight}px`
                            }
                        });
                        
                        element.textContent = "";
                        element.appendChild(textarea);
                        textarea.focus();
                        
                        textarea.addEventListener("click", (event) => {
                            event.stopPropagation();
                        });
                        
                        let isFinished = false;
                        const finishEdit = async () => {
                            if (isFinished) return;
                            isFinished = true;
                            
                            const newValue = textarea.value.trim();
                            element.textContent = newValue;
                            
                            if (newValue === currentText) return;
                            
                            syncWordCardToChatHistory(botMessageDiv);
                            
                            const storedIdx = botMessageDiv.dataset.wordIdx;
                            if (!storedIdx) return;
                            
                            const {error: updateError} = await getDbClient()
                                .from(getTableName())
                                .update({[fieldName]: newValue})
                                .eq("idx", storedIdx);
                            
                            if (updateError) {
                                console.error(`${fieldLabel} update error:`, updateError);
                                showToast(`Failed to update ${fieldLabel.toLowerCase()}.`, false);
                            } else {
                                showToast(`${fieldLabel} updated!`, true);
                            }
                        };
                        
                        textarea.addEventListener("keydown", (event) => {
                            if (event.isComposing || event.keyCode === 229) return;
                            if (event.key === "Enter") {
                                event.preventDefault();
                                textarea.blur();
                            } else if (event.key === "Escape") {
                                isFinished = true;
                                element.textContent = currentText;
                            }
                        });
                        
                        textarea.addEventListener("blur", async () => {
                            await finishEdit();
                        });
                    });
                }
                
                function enhanceWordMessage(botMessageDiv, selectedData) {
                    const wordCardWrappers = Array.from(botMessageDiv.querySelectorAll('.word-card'));
                    const buttonContainer = botMessageDiv.querySelector('.message-button-container');
                    const isWordCardFormat = isWordMessageStructure(botMessageDiv);
                    
                    if (wordCardWrappers.length === 0 && !isWordCardFormat) return;
                    
                    if (buttonContainer) buttonContainer.remove();
                    
                    if (wordCardWrappers.length > 0) {
                        wordCardWrappers.forEach((wrapper) => wrapper.remove());
                        
                        const prefaceContent = botMessageDiv.innerHTML.trim();
                        
                        if (prefaceContent) {
                            const chatContainer = document.getElementById('chat-container');
                            const prefaceMessageDiv = createElement('div', {
                                className: 'chat-message bot-message',
                                innerHTML: prefaceContent
                            });
                            chatContainer.insertBefore(prefaceMessageDiv, botMessageDiv);
                            
                            botMessageDiv.relatedPrefaceNode = prefaceMessageDiv;
                        }
                        
                        botMessageDiv.innerHTML = '';
                        wordCardWrappers.forEach((wrapper, index) => {
                            if (index > 0) {
                                botMessageDiv.appendChild(createElement('hr'));
                            }
                            while (wrapper.firstChild) {
                                botMessageDiv.appendChild(wrapper.firstChild);
                            }
                        });
                    }
                    
                    if (!botMessageDiv.classList.contains('word-message')) botMessageDiv.classList.add('word-message');
                    
                    if (buttonContainer) botMessageDiv.appendChild(buttonContainer);
                    
                    const safeSelectedData = selectedData || {input: "", context: ""};
                    
                    const wordElem = botMessageDiv.querySelector("b");
                    const pronunciationElem = botMessageDiv.querySelector("span");
                    
                    if (pronunciationElem) {
                        pronunciationElem.textContent = preprocessPronunciation(pronunciationElem.textContent, getLessonLanguage());
                        
                        pronunciationElem.addEventListener("click", async (e) => {
                            if (!e.ctrlKey && !e.metaKey) return;
                            if (pronunciationElem.querySelector("input")) return;
                            
                            const currentText = pronunciationElem.textContent.trim();
                            const currentWidth = Math.max(60, Math.ceil(pronunciationElem.offsetWidth));
                            
                            const input = createElement("input", {
                                type: "text",
                                value: currentText,
                                className: "pronunciation-edit-input",
                                style: {
                                    width: `${currentWidth + 5}px`
                                }
                            });
                            
                            pronunciationElem.textContent = "";
                            pronunciationElem.appendChild(input);
                            input.focus();
                            
                            const finishEdit = async () => {
                                const newValue = preprocessPronunciation(input.value, getLessonLanguage());
                                pronunciationElem.textContent = newValue;
                                
                                if (newValue === currentText) return;
                                
                                syncWordCardToChatHistory(botMessageDiv);
                                
                                const storedIdx = botMessageDiv.dataset.wordIdx;
                                if (!storedIdx) return;
                                
                                const {error: updateError} = await getDbClient()
                                    .from(getTableName())
                                    .update({pronunciation: newValue})
                                    .eq("idx", storedIdx);
                                
                                if (updateError) {
                                    console.error("Pronunciation update error:", updateError);
                                    showToast("Failed to update pronunciation.", false);
                                } else {
                                    showToast("Pronunciation updated!", true);
                                }
                            };
                            
                            input.addEventListener("keydown", async (event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    input.blur();
                                } else if (event.key === "Escape") {
                                    pronunciationElem.textContent = currentText;
                                }
                            });
                            
                            input.addEventListener("blur", async () => {
                                await finishEdit();
                            });
                            
                            
                        });
                    }
                    
                    const meaningElem = botMessageDiv.querySelector("p");
                    const explanationElem = botMessageDiv.querySelectorAll("p")[1];
                    const exampleListElem = botMessageDiv.querySelector("ul");
                    const exampleSentenceElem = exampleListElem?.querySelector("li:nth-child(1)");
                    const exampleTranslationElem = exampleListElem?.querySelector("li:nth-child(2)");
                    
                    const word = wordElem?.textContent?.trim() || "";
                    const pronunciation = pronunciationElem?.textContent?.trim() || "";
                    const meaning = meaningElem?.textContent?.trim() || "";
                    const explanation = explanationElem?.textContent?.trim() || "";
                    const exampleSentence = exampleSentenceElem?.textContent?.trim() || "";
                    const exampleTranslation = exampleTranslationElem?.textContent?.trim() || "";
                    
                    if (!word) return;
                    
                    if (meaningElem) {
                        meaningElem.addEventListener("click", async (e) => {
                            if (e.ctrlKey || e.metaKey) {
                                if (meaningElem.querySelector("input")) return;
                                
                                const currentText = meaningElem.textContent.trim();
                                
                                const input = createElement("input", {
                                    type: "text",
                                    value: currentText,
                                    className: "meaning-edit-input",
                                });
                                
                                meaningElem.textContent = "";
                                meaningElem.appendChild(input);
                                input.focus();
                                
                                const finishEdit = async () => {
                                    const newValue = input.value.trim();
                                    meaningElem.textContent = newValue;
                                    
                                    if (newValue === currentText) return;
                                    
                                    navigator.clipboard.writeText(newValue)
                                        .then(() => showToast("Meaning Copied!", true))
                                        .catch(() => showToast("Failed to copy meaning.", false));
                                    
                                    const storedIdx = botMessageDiv.dataset.wordIdx;
                                    if (!storedIdx) {
                                        syncWordCardToChatHistory(botMessageDiv);
                                        return;
                                    }
                                    
                                    const {data: existing} = await getDbClient()
                                        .from(getTableName())
                                        .select("idx")
                                        .eq("word", word)
                                        .eq("meaning", newValue)
                                        .limit(1);
                                    
                                    if (existing && existing.length > 0) {
                                        meaningElem.textContent = currentText;
                                        showToast("Same Flashcard Already Exists", false);
                                        return;
                                    }
                                    
                                    syncWordCardToChatHistory(botMessageDiv);
                                    
                                    const {error: updateError} = await getDbClient()
                                        .from(getTableName())
                                        .update({meaning: newValue})
                                        .eq("idx", storedIdx);
                                    
                                    if (updateError) {
                                        console.error("Meaning update error:", updateError);
                                        showToast("Failed to update meaning.", false);
                                    } else {
                                        showToast("Meaning updated!", true);
                                    }
                                };
                                
                                input.addEventListener("keydown", async (event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        input.blur();
                                    } else if (event.key === "Escape") {
                                        meaningElem.textContent = currentText;
                                    }
                                });
                                
                                input.addEventListener("blur", async () => {
                                    await finishEdit();
                                });
                                
                                return;
                            }
                            
                            navigator.clipboard.writeText(meaningElem?.textContent?.trim() || "")
                                .then(() => showToast("Meaning Copied!", true))
                                .catch(() => showToast("Failed to copy meaning.", false));
                            
                            
                        });
                    }
                    
                    setupBlockEditableField(explanationElem, "explanation", "Explanation", botMessageDiv);
                    setupBlockEditableField(exampleSentenceElem, "example_sentence", "Example sentence", botMessageDiv);
                    setupBlockEditableField(exampleTranslationElem, "example_translation", "Example translation", botMessageDiv);
                    
                    if (exampleListElem) {
                        exampleListElem.addEventListener("click", async (e) => {
                            if (e.ctrlKey || e.metaKey || e.target.closest("textarea, input")) return;
                            const textToCopy = Array
                                .from(exampleListElem.querySelectorAll("li"))
                                .map(li => li.textContent)
                                .join("\n");
                            navigator.clipboard.writeText(textToCopy)
                                .then(() => showToast("Example Copied!", true))
                                .catch(() => showToast("Failed to copy example.", false));
                        });
                    }
                    
                    if (meaning.trim() !== "") {
                        navigator.clipboard.writeText(meaning)
                            .then(() => showToast("Meaning Copied!", true))
                            .catch(() => showToast("Failed to copy meaning.", false));
                    }
                    
                    if (isDbReady()) {
                        wordElem.addEventListener("click", async (e) => {
                            const existingPopup = document.getElementById("flashcard-popup");
                            if (existingPopup) existingPopup.remove();
                            
                            const {data, error} = await getDbClient()
                                .from(getTableName())
                                .select("*")
                                .eq("word", word);
                            
                            if (error) {
                                console.error("Flashcard fetch error:", error);
                                return;
                            }
                            
                            const rect = wordElem.getBoundingClientRect();
                            const popup = createElement("div", {
                                id: "flashcard-popup",
                                style: `top: ${rect.bottom + window.scrollY}px; left: ${rect.left + window.scrollX}px;`
                            });
                            
                            if (!data || data.length === 0) {
                                popup.appendChild(createElement("em", {innerHTML: "No flashcards found."}));
                            } else {
                                data.forEach(row => {
                                    const rowDiv = createElement("div", {className: "flashcard-row"});
                                    const deleteBtn = createElement("button", {
                                        className: "popup-delete-button",
                                        innerHTML: `<svg viewBox="6 6 12 12" stroke="currentColor"><path d="M17 17L7 7M17 7L7 17" stroke-width="2" stroke-linecap="round"/></svg>`
                                    });
                                    
                                    deleteBtn.addEventListener("click", async (ev) => {
                                        ev.stopPropagation();
                                        deleteBtn.disabled = true;
                                        const {error: updateError} = await getDbClient()
                                            .from(getTableName())
                                            .delete()
                                            .eq("idx", row.idx);
                                        if (updateError) {
                                            console.error("Flashcard delete error:", updateError);
                                            deleteBtn.disabled = false;
                                        } else {
                                            rowDiv.remove();
                                            if (!popup.querySelector("div")) {
                                                popup.appendChild(createElement("em", {innerHTML: "No flashcards found."}));
                                            }
                                            const badge = wordElem.querySelector(".flashcard-count-badge");
                                            if (badge) {
                                                const nextCount = Number(badge.dataset.count || 0) - 1;
                                                if (nextCount > 0) syncFlashcardBadge(badge, nextCount);
                                                else badge.remove();
                                            }
                                            showToast("Flashcard removed.", true);
                                        }
                                    });
                                    
                                    rowDiv.addEventListener("click", (ev) => {
                                        if (ev.target.closest(".popup-delete-button")) return;
                                        if (window.getSelection().toString().length > 0) return;
                                        
                                        document.getElementById("flashcardManagerButton")?.click();
                                        const searchInput = document.getElementById("flashcardSearchInput");
                                        if (searchInput) {
                                            searchInput.value = word;
                                            searchInput.dispatchEvent(new Event("paste"));
                                            searchInput.dispatchEvent(new Event("input"));
                                        }
                                        
                                    });
                                    
                                    rowDiv.appendChild(deleteBtn);
                                    rowDiv.appendChild(createElement("span", {innerHTML: `${row.pronunciation}`}));
                                    rowDiv.appendChild(createElement("span", {innerHTML: `${row.meaning}`}));
                                    popup.appendChild(rowDiv);
                                });
                            }
                            
                            document.body.appendChild(popup);
                            
                            const chatContainer = document.querySelector("#chat-container");
                            const closePopup = (ev) => {
                                if (!popup.contains(ev.target) && ev.target !== wordElem) {
                                    popup.remove();
                                    document.removeEventListener("click", closePopup);
                                    chatContainer.removeEventListener("scroll", closePopup);
                                }
                            };
                            document.addEventListener("click", closePopup);
                            chatContainer.addEventListener("scroll", closePopup);
                        });
                        
                        const newItem = {
                            ...(settings.useCentralDb && {user_id: centralUserId}),
                            language: getLessonLanguage(),
                            original_word: safeSelectedData.input,
                            context: safeSelectedData.context,
                            word,
                            pronunciation,
                            meaning,
                            explanation,
                            example_sentence: exampleSentence,
                            example_translation: exampleTranslation
                        };
                        
                        const messageButtonContainer = botMessageDiv.querySelector(".message-button-container");
                        let saveFlashcardButton = messageButtonContainer.querySelector(".save-flashcard-button");
                        
                        if (!saveFlashcardButton) {
                            saveFlashcardButton = createElement("button", {
                                className: "message-button save-flashcard-button",
                                innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3.98999H8C6.93913 3.98999 5.92178 4.41135 5.17163 5.1615C4.42149 5.91164 4 6.92912 4 7.98999V17.99C4 19.0509 4.42149 20.0682 5.17163 20.8184C5.92178 21.5685 6.93913 21.99 8 21.99H16C17.0609 21.99 18.0783 21.5685 18.8284 20.8184C19.5786 20.0682 20 19.0509 20 17.99V7.98999C20 6.92912 19.5786 5.91164 18.8284 5.1615C18.0783 4.41135 17.0609 3.98999 16 3.98999Z"/><path d="M9 2V7"/><path d="M15 2V7"/><path d="M8 16H14"/><path d="M8 12H16"/></svg>`,
                            });
                            
                            saveFlashcardButton.addEventListener("click", async () => {
                                if (!safeSelectedData.context || safeSelectedData.context.trim() === "") {
                                    showToast("Context is not exist", false);
                                    return;
                                }
                                
                                saveFlashcardButton.disabled = true;
                                try {
                                    const currentMeaning = meaningElem?.textContent?.trim() || "";
                                    const currentPronunciation = pronunciationElem?.textContent?.trim() || "";
                                    const currentExplanation = explanationElem?.textContent?.trim() || "";
                                    const currentExampleSentence = exampleSentenceElem?.textContent?.trim() || "";
                                    const currentExampleTranslation = exampleTranslationElem?.textContent?.trim() || "";
                                    
                                    const existingMeaningBadges = document.querySelectorAll('div[data-word-widget] bdi[data-slot="meaning"], .reference-input-text');
                                    const existingMeanings = Array.from(existingMeaningBadges).map((el) => el.textContent.trim()).filter(Boolean);
                                    if (currentMeaning && !existingMeanings.includes(currentMeaning)) {
                                        setLingQMeaning(currentMeaning);
                                    }
                                    
                                    const {data: existing} = await getDbClient()
                                        .from(getTableName())
                                        .select("idx")
                                        .eq("word", word)
                                        .eq("meaning", currentMeaning)
                                        .limit(1);
                                    
                                    if (existing && existing.length > 0) {
                                        showToast("Same Flashcard Exists", false);
                                        saveFlashcardButton.disabled = false;
                                        return;
                                    }
                                    
                                    const {data: inserted, error: insertError} = await getDbClient()
                                        .from(getTableName())
                                        .insert([{
                                            ...newItem,
                                            meaning: currentMeaning,
                                            pronunciation: currentPronunciation,
                                            explanation: currentExplanation,
                                            example_sentence: currentExampleSentence,
                                            example_translation: currentExampleTranslation
                                        }])
                                        .select("idx");
                                    
                                    if (insertError) {
                                        console.error("Flashcard insert error:", insertError);
                                        showToast("Failed to save flashcard.", false);
                                        saveFlashcardButton.disabled = false;
                                    } else {
                                        botMessageDiv.dataset.wordIdx = inserted[0].idx;
                                        const badge = wordElem.querySelector(".flashcard-count-badge");
                                        if (badge) {
                                            syncFlashcardBadge(badge, Number(badge.dataset.count || 0) + 1);
                                        } else {
                                            const newBadge = createElement("span", {
                                                className: "flashcard-count-badge",
                                            });
                                            newBadge.setAttribute("aria-hidden", "true");
                                            syncFlashcardBadge(newBadge, 1);
                                            wordElem.appendChild(newBadge);
                                        }
                                        showToast("Saved to Flashcard!", true);
                                    }
                                } catch (err) {
                                    console.error("Unexpected error:", err);
                                    saveFlashcardButton.disabled = false;
                                }
                            });
                            
                            const regenerateButton = messageButtonContainer.querySelector(".regenerate-button");
                            if (regenerateButton) messageButtonContainer.insertBefore(saveFlashcardButton, regenerateButton);
                            else messageButtonContainer.appendChild(saveFlashcardButton);
                        }
                        saveFlashcardButton.disabled = true;
                        
                        getDbClient()
                            .from(getTableName())
                            .select("*", {count: "exact", head: true})
                            .eq("word", word)
                            .then(({count, error}) => {
                                if (error) {
                                    console.error("Flashcard count error:", error);
                                    return;
                                }
                                if (count > 0) {
                                    const existingBadge = wordElem.querySelector(".flashcard-count-badge");
                                    if (existingBadge) return;
                                    const badge = createElement("span", {
                                        className: "flashcard-count-badge",
                                        ariaHidden: "true",
                                    });
                                    syncFlashcardBadge(badge, count);
                                    wordElem.appendChild(badge);
                                }
                            })
                            .finally(() => {
                                if (saveFlashcardButton) {
                                    saveFlashcardButton.disabled = false;
                                }
                            });
                    }
                }
                
                function generateUniqueId() {
                    return Date.now().toString(36) + Math.random().toString(36).substring(2);
                }
                
                function createDeleteButton(messageDiv, messageId) {
                    const deleteButton = createElement("button", {
                        className: "message-button delete-button",
                        innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`
                    });
                    
                    deleteButton.addEventListener("click", () => {
                        if (messageDiv.relatedPrefaceNode) messageDiv.relatedPrefaceNode.remove();
                        
                        messageDiv.remove();
                        chatHistory = chatHistory.filter((item) => item.id !== messageId);
                    });
                    
                    return deleteButton;
                }
                
                function updateChatHistoryState(currentHistory, message, role, id = null) {
                    const newItem = {role: role, content: message};
                    if (id) newItem.id = id;
                    return [...currentHistory, newItem];
                }
                
                function addMessageToUI(message, messageClass, container, initial = false) {
                    const classList = typeof messageClass === 'string' ? messageClass.split(' ') : Array.from(messageClass);
                    const uniqueClasses = [...new Set(['chat-message', ...classList])].join(' ').trim();
                    
                    const messageDiv = createElement("div", {className: uniqueClasses});
                    if (initial) messageDiv.innerHTML = message;
                    container.appendChild(messageDiv);
                    
                    if (container.childElementCount > 1) smoothScrollTo(container, container.scrollHeight, 300);
                    return messageDiv;
                }
                
                async function callStreamOpenAI(botMessageDiv, chatContainer, focus, onStreamCompleted = () => {
                }, enableReasoning = true) {
                    const userInput = document.getElementById("user-input");
                    const sendButton = document.getElementById("send-button");
                    
                    sendButton.disabled = true;
                    
                    let fullBotResponse = '';
                    
                    const existingRegenerateButton = botMessageDiv.querySelector('.regenerate-button');
                    if (existingRegenerateButton) {
                        existingRegenerateButton.remove();
                    }
                    
                    llmProvider = settings.llmProvider;
                    llmModel = settings.llmModel;
                    const savedKeys = settings.llmApiKeys;
                    llmApiKey = savedKeys[llmProvider] || "";
                    
                    const isWordRequest = chatHistory.some(m => m.role === "system-word");
                    if (isWordRequest && (llmProvider === "google" || llmProvider === "vertex") && !currentGeminiCacheName) {
                        try {
                            await refreshGeminiCache();
                        } catch (e) {
                            console.error("Gemini cache initialization failed:", e);
                        }
                    }
                    const cacheToUse = (isWordRequest && (llmProvider === "google" || llmProvider === "vertex")) ? currentGeminiCacheName : null;
                    
                    let chatRafId = null;
                    
                    function updateChatDOM() {
                        const wasOpen = botMessageDiv.querySelector('.thought-process')?.open;
                        const isNearBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 120;
                        
                        let thoughtText = '';
                        let messageText = fullBotResponse;
                        let isThinking = false;
                        let hasThought = false;
                        
                        if ((llmProvider === "google" || llmProvider === "vertex") && !fullBotResponse.includes('</thought>') && fullBotResponse.length < 20 && !fullBotResponse.includes('<thought>')) {
                            hasThought = true;
                            isThinking = true;
                            thoughtText = fullBotResponse.replace(/^<t?h?o?u?g?h?t?>?/, '');
                            messageText = '';
                        } else if (fullBotResponse.includes('<thought>')) {
                            hasThought = true;
                            const startIndex = fullBotResponse.indexOf('<thought>') + '<thought>'.length;
                            const endIndex = fullBotResponse.indexOf('</thought>');
                            
                            if (endIndex !== -1) {
                                thoughtText = fullBotResponse.substring(startIndex, endIndex).trim();
                                messageText = fullBotResponse.substring(endIndex + '</thought>'.length).trim();
                            } else {
                                isThinking = true;
                                thoughtText = fullBotResponse.substring(startIndex).trim();
                                messageText = '';
                            }
                        }
                        
                        if (hasThought) {
                            thoughtText = thoughtText.replace(/\n{3,}/g, '\n\n');
                            let thoughtDetails = botMessageDiv.querySelector('.thought-process');
                            
                            if (!thoughtDetails) {
                                botMessageDiv.innerHTML = `
                                <details class="thought-process">
                                    <summary onclick="setTimeout(() => { const c = document.getElementById('chat-container'); c.scrollTop = c.scrollHeight; }, 10)">
                                        <span class="thinking-text">Thinking<span class="thinking-dots"></span></span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron"><path d="m6 9 6 6 6-6"/></svg>
                                    </summary>
                                    <div class="thought-content" style="white-space: pre-wrap;"></div>
                                </details>
                                <div class="bot-stream-text"></div>
                                `;
                                thoughtDetails = botMessageDiv.querySelector('.thought-process');
                                if (wasOpen) thoughtDetails.open = true;
                            }
                            
                            const thinkingLabel = thoughtDetails.querySelector('.thinking-text');
                            const expectedSummaryHtml = isThinking ? 'Thinking<span class="thinking-dots"></span>' : 'Thought';
                            if (thinkingLabel && thinkingLabel.innerHTML !== expectedSummaryHtml) {
                                thinkingLabel.innerHTML = expectedSummaryHtml;
                            }
                            
                            thoughtDetails.classList.toggle('with-margin', Boolean(messageText.trim()));
                            
                            const contentDiv = thoughtDetails.querySelector('.thought-content');
                            if (contentDiv && contentDiv.textContent !== thoughtText) {
                                contentDiv.textContent = thoughtText;
                            }
                            
                            let textContainer = botMessageDiv.querySelector('.bot-stream-text');
                            if (!textContainer) {
                                textContainer = createElement('div', {className: 'bot-stream-text'});
                                botMessageDiv.appendChild(textContainer);
                            }
                            if (textContainer.innerHTML !== messageText) {
                                textContainer.innerHTML = messageText;
                            }
                        } else {
                            if (botMessageDiv.innerHTML !== messageText) {
                                botMessageDiv.innerHTML = messageText;
                            }
                        }
                        
                        if (isNearBottom) {
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        }
                    }
                    
                    await streamOpenAIResponse(
                        llmProvider,
                        llmApiKey,
                        llmModel,
                        chatHistory,
                        (chunk) => {
                            const content = typeof chunk === "string" ? chunk : chunk.choices?.[0]?.delta?.content;
                            if (content) {
                                fullBotResponse += content;
                                if (!chatRafId) {
                                    chatRafId = requestAnimationFrame(() => {
                                        updateChatDOM();
                                        chatRafId = null;
                                    });
                                }
                            }
                        },
                        (finalContent) => {
                            if (chatRafId) {
                                cancelAnimationFrame(chatRafId);
                                chatRafId = null;
                            }
                            
                            const wasOpen = botMessageDiv.querySelector('.thought-process')?.open;
                            
                            let thoughtTextFinal = '';
                            let messageTextFinal = finalContent;
                            let finalHasThought = false;
                            
                            if (finalContent.includes('<thought>')) {
                                finalHasThought = true;
                                const startIndex = finalContent.indexOf('<thought>') + '<thought>'.length;
                                const endIndex = finalContent.indexOf('</thought>');
                                
                                if (endIndex !== -1) {
                                    thoughtTextFinal = finalContent.substring(startIndex, endIndex).trim();
                                    messageTextFinal = finalContent.substring(endIndex + '</thought>'.length).trim();
                                } else {
                                    thoughtTextFinal = finalContent.substring(startIndex).trim();
                                    messageTextFinal = '';
                                }
                            }
                            
                            const stripped = messageTextFinal.replace(/^```(?:\w+\n)?/, '').replace(/```\s*$/, '');
                            let cleanedContent = shouldConvertToHTML(stripped)
                                ? convertMarkdownToHTML(stripped)
                                : applyInlineMarkdown(stripped);
                            
                            if (finalHasThought) {
                                let cleanedThought = escapeHTML(thoughtTextFinal);
                                if (cleanedThought) {
                                    cleanedThought = shouldConvertToHTML(cleanedThought)
                                        ? convertMarkdownToHTML(cleanedThought)
                                        : applyInlineMarkdown(cleanedThought);
                                }
                                const extraClass = stripped.trim() ? ' with-margin' : '';
                                
                                const thoughtHtml = `
                                <details class="thought-process${extraClass}">
                                    <summary>
                                        <span class="thought-label">Thought</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron"><path d="m6 9 6 6 6-6"/></svg>
                                    </summary>
                                    <div class="thought-content" style="${shouldConvertToHTML(thoughtTextFinal) ? "" : "white-space: pre-wrap;"}">${cleanedThought}</div>
                                </details>
                                `;
                                botMessageDiv.innerHTML = thoughtHtml + cleanedContent;
                            } else {
                                botMessageDiv.innerHTML = cleanedContent;
                            }
                            
                            if (wasOpen) {
                                const details = botMessageDiv.querySelector('.thought-process');
                                if (details) details.open = true;
                            }
                            
                            const botMessageId = generateUniqueId();
                            botMessageDiv.dataset.messageId = botMessageId;
                            chatHistory = updateChatHistoryState(chatHistory, cleanedContent, "assistant", botMessageId);
                            sendButton.disabled = false;
                            if (focus) userInput.focus();
                            
                            const existingRegenerateButton = document.querySelector('.regenerate-button');
                            if (existingRegenerateButton) existingRegenerateButton.remove();
                            
                            const messageButtonContainer = createElement("div", {className: 'message-button-container'});
                            
                            function extractCleanMessageText(messageElement) {
                                const messageClone = messageElement.cloneNode(true);
                                messageClone.querySelectorAll('.thought-process, details, .message-button-container').forEach((element) => element.remove());
                                messageClone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));

                                const rawText = typeof messageClone.innerText === 'string' && messageClone.innerText.trim()
                                    ? messageClone.innerText
                                    : (messageClone.textContent || '');

                                return rawText
                                    .replace(/\r\n/g, '\n')
                                    .replace(/[ \t]+$/gm, '')
                                    .replace(/\n{3,}/g, '\n\n')
                                    .trim();
                            }

                            const copyButton = createElement("button", {
                                className: "message-button copy-button",
                                innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
                            });
                            copyButton.addEventListener('click', async () => {
                                const textToCopy = extractCleanMessageText(botMessageDiv);
                                navigator.clipboard.writeText(textToCopy)
                                    .then(() => showToast("Message Copied!", true))
                                    .catch(() => showToast("Failed to copy message.", false));
                            });
                            messageButtonContainer.appendChild(copyButton);
                            
                            const ttsButton = createElement("button", {
                                className: "message-button tts-button",
                                innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play" aria-hidden="true"><path d="m6 3 14 9-14 9z"/></svg>`,
                            });
                            ttsButton.addEventListener('click', async function initialTTSHandler() {
                                let textToTTS = "";
                                if (botMessageDiv.matches(".word-message")) {
                                    textToTTS = Array.from(botMessageDiv.querySelectorAll("b, ul > li:nth-child(1)")).map(node => node.textContent).join(". ");
                                } else {
                                    textToTTS = botMessageDiv.textContent.replaceAll("\n", " ");
                                }
                                
                                ttsButton.disabled = true;
                                const audioData = await getTTSResponse(settings.ttsProvider, settings.ttsApiKeys[settings.ttsProvider] || "", (settings.ttsVoice[language]), textToTTS);
                                if (audioData == null) {
                                    console.log("audioData can't be got.")
                                    return;
                                }
                                ttsButton.disabled = false;
                                playAudio(audioData, 1.0);
                                
                                ttsButton.removeEventListener('click', initialTTSHandler);
                                ttsButton.addEventListener('click', async () => {
                                    await playAudio(audioData, 1.0);
                                });
                            });
                            messageButtonContainer.appendChild(ttsButton);
                            
                            const regenerateButton = createElement("button", {
                                className: "message-button regenerate-button",
                                innerHTML: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
                            });
                            regenerateButton.addEventListener("click", async () => {
                                const sendButton = document.getElementById("send-button");
                                if (sendButton?.disabled) return;
                                
                                if (botMessageDiv.relatedPrefaceNode) botMessageDiv.relatedPrefaceNode.remove();
                                botMessageDiv.remove();
                                chatHistory = chatHistory.slice(0, chatHistory.findLastIndex((item) => item.role === "assistant"));
                                
                                const chatContainer = document.getElementById("chat-container");
                                const newBotMessageDiv = addMessageToUI("", botMessageDiv.classList, chatContainer, false);
                                
                                await callStreamOpenAI(newBotMessageDiv, chatContainer, true,
                                    (finalContent) => {
                                        const selectedData = getSelectedWithContext();
                                        enhanceWordMessage(newBotMessageDiv, selectedData);
                                    },
                                    true
                                );
                            });
                            messageButtonContainer.appendChild(regenerateButton);
                            
                            const deleteButton = createDeleteButton(botMessageDiv, botMessageId);
                            messageButtonContainer.appendChild(deleteButton);
                            
                            botMessageDiv.appendChild(messageButtonContainer);
                            const isNearBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 80;
                            if (isNearBottom) smoothScrollTo(chatContainer, chatContainer.scrollHeight, 100);
                            
                            onStreamCompleted(cleanedContent);
                        },
                        (error) => {
                            if (chatRafId) {
                                cancelAnimationFrame(chatRafId);
                                chatRafId = null;
                            }
                            botMessageDiv.innerHTML = `⚠️ Error: ${error.message}`;
                            if (sendButton) sendButton.disabled = false;
                        },
                        cacheToUse,
                        refreshGeminiCache,
                        0,
                        true,
                        enableReasoning
                    );
                }
                
                async function handleSendMessage() {
                    const sendButton = document.getElementById("send-button");
                    if (sendButton?.disabled) return;
                    
                    const userInput = document.getElementById("user-input");
                    const chatContainer = document.getElementById("chat-container");
                    
                    const userMessage = userInput.value.trim();
                    if (!userMessage) return;
                    
                    const askSelectedButton = chatContainer?.querySelector(".ask-selected-button");
                    if (askSelectedButton) askSelectedButton.remove();
                    
                    if (sendButton) sendButton.disabled = true;
                    userInput.value = '';
                    
                    // if (chatHistory.findIndex(item => item.role === "system-plain") !== -1) chatHistory = chatHistory.filter(item => (item.role !== "system-word" && item.role !== "system-sentence"));
                    
                    const formattedUserMessage = convertMarkdownToHTML(userMessage);
                    const userMessageDiv = addMessageToUI(formattedUserMessage, "user-message", chatContainer, true);
                    
                    const userMessageId = generateUniqueId();
                    chatHistory = updateChatHistoryState(chatHistory, userMessage, "user", userMessageId);
                    
                    const userButtonContainer = createElement("div", {className: "message-button-container"});
                    userButtonContainer.appendChild(createDeleteButton(userMessageDiv, userMessageId));
                    userMessageDiv.appendChild(userButtonContainer);
                    setupUserMessageEdit(userMessageDiv, userMessageId, userButtonContainer);
                    
                    const botMessageDiv = addMessageToUI("", "bot-message", chatContainer, false);
                    await callStreamOpenAI(botMessageDiv, chatContainer, true,
                        (finalContent) => {
                            const selectedData = getSelectedWithContext();
                            enhanceWordMessage(botMessageDiv, selectedData);
                        },
                        true
                    );
                }
                
                function updateMemoWidget() {
                    if (!settings.showMemoWidget) return;
                    
                    const sideColumn = document.querySelector('div[data-reader-side-column="true"]') || document.querySelector("#lesson-reader .widget-area");
                    if (!sideColumn) return;
                    
                    const existingMemoWidget = document.getElementById("memo-widget-container");
                    if (existingMemoWidget) return;
                    
                    const lessonIdMatch = window.location.pathname.match(/\/(\d+)/);
                    const lessonId = lessonIdMatch ? lessonIdMatch[1] : "unknown";
                    const storageKey = `lingq_memo_${lessonId}`;
                    
                    const memoTextarea = createElement("textarea", {
                        className: "memo-textarea",
                        placeholder: "Lesson notes..."
                    });
                    
                    const savedMemo = localStorage.getItem(storageKey);
                    if (savedMemo) memoTextarea.value = savedMemo;
                    
                    memoTextarea.addEventListener("input", debounce((event) => {
                        const content = event.target.value;
                        if (content.trim() === "") localStorage.removeItem(storageKey);
                        else localStorage.setItem(storageKey, content);
                    }, 500));
                    
                    const memoContainer = createElement("div", {id: "memo-widget-container"}, memoTextarea);
                    
                    const readerWidget = sideColumn.querySelector("[data-reader-widget], .reader-widget");
                    if (readerWidget) readerWidget.insertAdjacentElement("afterend", memoContainer);
                    else sideColumn.appendChild(memoContainer);
                    
                    requestAnimationFrame(() => {
                        memoTextarea.scrollTop = memoTextarea.scrollHeight;
                    });
                }
                
                async function updateChatWidget() {
                    if (!settings.chatWidget) return;
                    
                    const chatContainer = createElement("div", {id: "chat-container"});
                    const userInput = createElement("textarea", {
                        id: "user-input",
                        placeholder: "Ask anything"
                    });
                    const sendButton = createElement("button", {
                        id: "send-button",
                        innerHTML: `<svg style="width: 17px; height: 17px;" viewBox="0 0 512 512"><path fill="currentColor" d="M481.508,210.336L68.414,38.926c-17.403-7.222-37.064-4.045-51.309,8.287C2.86,59.547-3.098,78.551,1.558,96.808 L38.327,241h180.026c8.284,0,15.001,6.716,15.001,15.001c0,8.284-6.716,15.001-15.001,15.001H38.327L1.558,415.193 c-4.656,18.258,1.301,37.262,15.547,49.595c14.274,12.357,33.937,15.495,51.31,8.287l413.094-171.409 C500.317,293.862,512,276.364,512,256.001C512,235.638,500.317,218.139,481.508,210.336z"/></svg>`
                    });
                    const chatWrapper = createElement("div", {id: "chat-widget"},
                        chatContainer,
                        createElement("div", {className: "input-container"},
                            userInput,
                            sendButton
                        )
                    );
                    
                    const currentTargetText = getCurrentlyTargetedText();
                    const existingChatWidget = document.getElementById('chat-widget');
                    const wordWidgetScrollArea = document.querySelector('div[data-word-widget] div.min-h-0.flex-1.overflow-y-auto');
                    const sideColumnScrollArea = document.querySelector('div[data-reader-side-column="true"] div.min-h-0.flex-1.overflow-y-auto') ||
                                                 document.querySelector('div[data-reader-side-column="true"]');
                    
                    if (currentTargetText && currentTargetText === lastAskedTargetText && existingChatWidget) {
                        if (wordWidgetScrollArea && existingChatWidget.parentElement !== wordWidgetScrollArea) {
                            wordWidgetScrollArea.prepend(existingChatWidget);
                        } else if (!wordWidgetScrollArea && sideColumnScrollArea && existingChatWidget.parentElement !== sideColumnScrollArea) {
                            sideColumnScrollArea.prepend(existingChatWidget);
                        }
                        return;
                    }
                    
                    lastAskedTargetText = currentTargetText || "";
                    
                    if (wordWidgetScrollArea) {
                        if (existingChatWidget) {
                            if (existingChatWidget.parentElement === wordWidgetScrollArea) {
                                existingChatWidget.replaceWith(chatWrapper);
                            } else {
                                existingChatWidget.remove();
                                wordWidgetScrollArea.prepend(chatWrapper);
                            }
                        } else {
                            wordWidgetScrollArea.prepend(chatWrapper);
                        }
                    } else if (sideColumnScrollArea) {
                        if (existingChatWidget) {
                            if (existingChatWidget.parentElement === sideColumnScrollArea) {
                                existingChatWidget.replaceWith(chatWrapper);
                            } else {
                                existingChatWidget.remove();
                                sideColumnScrollArea.prepend(chatWrapper);
                            }
                        } else {
                            sideColumnScrollArea.prepend(chatWrapper);
                        }
                    }

                    const existingSentenceHeader = document.getElementById('addon-sentence-header');
                    if (existingSentenceHeader) existingSentenceHeader.remove();

                    const popupSentence = getPopupSentenceText();
                    if (isSentence && popupSentence && !wordWidgetScrollArea && sideColumnScrollArea) {
                        const sentenceHeader = createElement("div", {
                            id: "addon-sentence-header",
                            className: "addon-sentence-header flex items-center justify-between gap-3 px-4 pt-3 pb-1"
                        },
                            createElement("div", {className: "flex min-w-0 flex-1 items-center"},
                                createElement("span", {
                                    className: "truncate text-sm font-medium text-foreground",
                                    title: popupSentence,
                                    textContent: popupSentence
                                })
                            ),
                            createElement("button", {
                                type: "button",
                                className: "addon-sentence-tts-btn flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-ghost hover:bg-ghost-hover text-muted-foreground cursor-pointer transition-colors",
                                ariaLabel: "Listen to sentence",
                                title: "Listen",
                                onclick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    playCustomTTSForText(popupSentence, false, true);
                                }
                            },
                                createElement("span", {
                                    className: "flex items-center justify-center pointer-events-none",
                                    innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path d="M16 9a5 5 0 0 1 0 6"></path><path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path></svg>`
                                })
                            )
                        );
                        chatWrapper.before(sentenceHeader);
                    }
                    
                    changeScrollAmount("#chat-container", 0.2);
                    userInput.addEventListener('keydown', (event) => {
                        if (event.isComposing || event.keyCode === 229) return;
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            if (sendButton?.disabled) return;
                            handleSendMessage();
                        } else if (event.key === 'Escape') {
                            event.preventDefault();
                            event.target.blur();
                        }
                        event.stopPropagation();
                    }, true);
                    sendButton.addEventListener('click', handleSendMessage);
                    
                    chatHistory = updateChatHistoryState(chatHistory, `<summary>${lessonSummary}</summary>`, "user");
                    chatHistory = updateChatHistoryState(chatHistory, removeIndent(systemPrompt), "system-main");
                    
                    async function askSelectedText() {
                        const selectedData = getSelectedWithContext();
                        const initialUserMessage = isSentence
                            ? `Input: "${selectedData.context || selectedData.input}"`
                            : `Input: "${selectedData.input}"` + (selectedData.context ? `, Context: "${selectedData.context}"` : "");
                        
                        if (initialUserMessage.length > 1000) {
                            console.log("The length of the selected text exceeds 1,000.");
                            return;
                        }
                        
                        if (isSentence) chatHistory = updateChatHistoryState(chatHistory, removeIndent(sentencePrompt), "system-sentence");
                        else chatHistory = updateChatHistoryState(chatHistory, removeIndent(wordPhrasePrompt), "system-word");
                        
                        chatHistory = updateChatHistoryState(chatHistory, initialUserMessage, "user");
                        
                        const messageClass = isSentence ? "sentence-message" : "word-message";
                        const botMessageDiv = addMessageToUI("", `bot-message ${messageClass}`, chatContainer, false);
                        
                        await callStreamOpenAI(botMessageDiv, chatContainer, false,
                            async (finalContent) => {
                                enhanceWordMessage(botMessageDiv, selectedData);
                            },
                            false
                        );
                        
                        chatHistory = updateChatHistoryState(chatHistory, removeIndent(plainTextPrompt), "system-plain");
                    }
                    
                    const hasWordWidget = Boolean(document.querySelector('div[data-word-widget]'));
                    const hasSentencePopup = Boolean(document.querySelector('div[data-reader-popup="true"]'));
                    const canAsk = Boolean(hasWordWidget || hasSentencePopup);
                    
                    if (settings.askSelected && canAsk) {
                        await askSelectedText();
                    } else if (canAsk) {
                        chatHistory = updateChatHistoryState(chatHistory, removeIndent(plainTextPrompt), "system-plain");
                        
                        const askButton = createElement("button", {
                            className: "ask-selected-button",
                            textContent: isSentence ? "Translate Selected Sentence" : "Show AI Dictionary for the Selected Word"
                        });
                        chatContainer.appendChild(askButton);
                        
                        askButton.addEventListener("click", async () => {
                            askButton.remove();
                            chatHistory = chatHistory.filter((item) => item.role !== "system-plain");
                            await askSelectedText();
                        });
                    } else {
                        chatHistory = updateChatHistoryState(chatHistory, removeIndent(plainTextPrompt), "system-plain");
                    }
                }
                
                function updateInlineMeaningInput() {
                    const wordWidget = document.querySelector('div[data-word-widget]');
                    if (!wordWidget) return;
                    
                    const scrollArea = wordWidget.querySelector('div.min-h-0.flex-1.overflow-y-auto');
                    if (!scrollArea) return;
                    
                    const meaningsSection = Array.from(scrollArea.querySelectorAll('section')).find((s) => s.querySelector('h3')?.textContent.includes('Meanings'));
                    if (!meaningsSection || meaningsSection.querySelector('.addon-quick-meaning-form')) return;
                    
                    const meaningInput = createElement("input", {
                        type: "text",
                        className: "addon-quick-meaning-input w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background outline-none",
                        placeholder: "Add meaning directly...",
                        autocomplete: "off"
                    });
                    
                    async function submitMeaning() {
                        const text = meaningInput.value.trim();
                        if (!text) return;
                        meaningInput.disabled = true;
                        try {
                            await setLingQMeaning(text);
                            meaningInput.value = "";
                        } catch (err) {
                            console.error("Failed to add meaning:", err);
                        } finally {
                            meaningInput.disabled = false;
                            meaningInput.focus();
                        }
                    }
                    
                    const form = createElement("form", {
                        className: "addon-quick-meaning-form w-full mt-2",
                        onsubmit: async (e) => {
                            e.preventDefault();
                            await submitMeaning();
                        }
                    }, meaningInput);
                    
                    meaningInput.addEventListener("keydown", async (e) => {
                        if (e.isComposing || e.keyCode === 229) return;
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            e.stopPropagation();
                            await submitMeaning();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            meaningInput.blur();
                        } else {
                            e.stopPropagation();
                        }
                    }, true);
                    
                    meaningsSection.appendChild(form);
                }
                
                const isWord = Boolean(document.querySelector('div[data-word-widget]'));
                const isSentence = !isWord && Boolean(getPopupSentenceText());
                
                let chatHistory = [];
                
                updateReferenceWord();
                updateChatWidget();
                updateMemoWidget();
                updateInlineMeaningInput();
                stopPlayingAudio(audioContext);
                updateTTS(autoplay);
                
                if (selectedTextObserver) {
                    selectedTextObserver.disconnect();
                    selectedTextObserver = null;
                }
                const selectedTextElement = document.querySelector('div[data-word-widget] bdi[dir="ltr"]');
                if (selectedTextElement) {
                    selectedTextObserver = new MutationObserver((mutations) => {
                        if (isProgrammaticReferenceWordUpdate) return;
                        for (const mutation of mutations) {
                            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                                const currentText = getCurrentlyTargetedText();
                                if (currentText && currentText !== lastActiveWordText) {
                                    lastActiveWordText = currentText;
                                    console.debug('Observer:', `Widget changed from word/sentence: ${currentText}`);
                                    updateWidget(false);
                                    break;
                                }
                            }
                        }
                    });
                    selectedTextObserver.observe(selectedTextElement, {subtree: true, characterData: true, childList: true});
                }
                
                if (sideColumnObserver) {
                    sideColumnObserver.disconnect();
                    sideColumnObserver = null;
                }
                const sideColumn = document.querySelector('div[data-reader-side-column="true"]');
                if (sideColumn) {
                    sideColumnObserver = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                                if (node.matches?.("[data-word-widget]") || node.querySelector?.("[data-word-widget]")) {
                                    const currentText = getCurrentlyTargetedText();
                                    if (currentText && currentText !== lastActiveWordText) {
                                        lastActiveWordText = currentText;
                                        console.debug('Observer:', `Widget changed from resource: ${currentText}`);
                                        updateWidget(false);
                                        return;
                                    }
                                }
                            }
                        }
                    });
                    sideColumnObserver.observe(sideColumn, {childList: true, subtree: true});
                }
            }
            
            let selectedTextObserver = null;
            let sideColumnObserver = null;
            let lastActiveWordText = "";
            let lastActiveSentenceText = "";
            let lastAskedTargetText = "";
            
            const readerContainer = document.querySelector('.reader-appearance') || document.querySelector('main') || document.getElementById('lesson-reader');
            
            updateWidget();
            if (readerContainer) {
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType !== Node.ELEMENT_NODE) continue;
                            if (node.matches?.('div[data-reader-side-column="true"], [data-word-widget]') ||
                                node.querySelector?.('div[data-reader-side-column="true"], [data-word-widget]')) {
                                console.debug('Observer:', `Widget added.`);
                                updateWidget();
                                return;
                            }
                        }
                    }
                });
                observer.observe(readerContainer, {childList: true, subtree: true});
            }
            
            const popupObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;
                        if (node.matches?.('div[data-reader-popup="true"]') || node.querySelector?.('div[data-reader-popup="true"]')) {
                            console.debug('Observer: Sentence popup added.');
                            const popupText = getPopupSentenceText();
                            if (popupText && popupText !== lastActiveSentenceText) {
                                lastActiveSentenceText = popupText;
                                updateWidget();
                            }
                            return;
                        }
                    }
                    for (const node of mutation.removedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;
                        if (node.matches?.('div[data-reader-popup="true"]') || node.querySelector?.('div[data-reader-popup="true"]')) {
                            console.debug('Observer: Sentence popup removed.');
                            lastActiveSentenceText = "";
                            updateWidget(false);
                            return;
                        }
                    }
                }
            });
            popupObserver.observe(document.body, {childList: true, subtree: true});
        }
        
        let styleElement = null;
        let lessonSummary = "";
        let quickSummary = "";
        let currentGeminiCacheName = null;
        let geminiCachePromise = null;
        let lessonUsageHistory = [];
        
        document.addEventListener("addon:llmUsage", (event) => {
            lessonUsageHistory.push(event.detail);
        });
        
        ensureLanguageSettings(language);
        setupStyleEventListeners();
        applyStyles();
        
        const DictionaryLocalePairs = await getDictionaryLocalePairs();
        const lessonLanguage = DictionaryLocalePairs[language];
        const userLanguage = (settings.llmResponseLanguage && settings.llmResponseLanguage !== "auto")
            ? settings.llmResponseLanguage
            : DictionaryLocalePairs[await getDictionaryLanguage()] || "English";
        
        const systemPrompt = `
        # System Capabilities & Format Protocol

        ## Core Responsibility
        - Tone: Objective and concise.
        - Latency Control: Skip prefaces (e.g., "Here is the answer"). Output the result immediately.

        ## STRICT Output Formatting (HTML Only)
        - Content Type: Raw HTML string.
        - Forbidden: Markdown syntax (No \`\`\`html blocks, no bold, no # headers), conversational filler.
        - Spacing: Use <p> tags for structural spacing. Use <br> only for line breaks inside a specific block if absolutely necessary.

        ## Language Configuration
        - Presentation Language: '${userLanguage}' (Used for explanations, definitions, translations).
        - Target Language: '${lessonLanguage}' (Used for original examples, base forms).
        - Nuance: Explanations must bridge the cultural/linguistic gap between '${lessonLanguage}' and '${userLanguage}'.
        `;
        const wordPhrasePrompt = `
        # Single Word/Phrase Extraction

        ## Task: Linguistic Analysis
        Analyze the input: 'Input: "Term" Context: "Sentence"'.

        ## STRICT Output Constraint
        - Output exactly one single '<div class="word-card">' container and stop immediately.
        - Never output multiple cards, revisions, second thoughts, or alternative drafts.
        - No text, comments, or system artifacts may appear before or after the '<div>' container.

        1. Lemma Extraction (Base Form)
            - Nouns: Singular form.
            - Verbs: Infinitive form.
            - Adverbs: Maintain the adverbial form. DO NOT revert '-ly' adverbs to adjectives (e.g., Input: "perfectly" -> Base: "perfectly", NOT "perfect").
            - Idioms: Standard dictionary form (e.g., "kicked the bucket" -> "kick the bucket").
            - Inflections: If the input is conjugated (e.g., "書いていました"), output the dictionary form ("書く").
            - Negative Examples
                - Avoid: "smoothly, seamlessly" / Prefer: "smoothly"
                - Avoid: "nearby, in the neighborhood" / Prefer: "nearby"

        2. IPA Pronunciation
            - Provide IPA for the Base Form (lemma) enclosed in brackets [].
            - Never output language-specific romanization/transliteration systems (e.g., Hepburn Romaji, Pinyin, Revised Romanization, Latin transliteration) enclosed in brackets. IPA is not romanization; you must use actual International Phonetic Alphabet symbols.
            - Use a single, consistent transcription system throughout the whole word. Do not mix broad IPA symbols with romanized/orthographic letters (e.g., Pinyin, Revised Romanization) within the same transcription.
            - Prefer broad, phonemic transcription over narrow, allophonic transcription. Eliminate narrow phonetic diacritics (e.g., lowering [̞], voiceless [̥], compressed [ᵝ], dental [̪], retracted [̠], advanced [̟], unreleased [̚], spreading [͍], or non-syllabic [̯] marks), and avoid substituting a distinct narrow-transcription symbol for a gradient, sub-phonemic co-articulatory detail (e.g., minor degrees of palatalization, uvularization, or aspiration) that is not codified in the standard pronunciation convention of the language.
            - Mark suprasegmental features (e.g., stress [ˈ], tone, vowel length [ː], gemination) consistently where phonemically distinctive. However, Do not mark pitch accent (e.g., Japanese downstep [ꜜ]); transcribe broad segmental phonemes and vowel length only.
            - When in doubt, follow the phonemic transcription convention used by Wiktionary or a major academic reference for that language, rather than an ad hoc or narrow phonetic realization.
            - Ensure the output represents the standard, dictionary-style pronunciation, not a precise phonetic realization of one specific utterance.
            - Negative Examples
                - Incorrect: 振る → [フル] (katakana) or [furu] (Hepburn romaji) / Correct: [ɸɯɾɯ]
                - Incorrect: 읽고 → [일꼬] (hangul used as a pronunciation guide) / Correct: [ilkʰo]
                - Incorrect: 我们 → [wǒmen] (pinyin with tone marks) / Correct: [wo˨˩˦mən]
                - Incorrect: كتاب → [kitab] (Latin transliteration) / Correct: [kitaːb]

        3. Contextual Definition
            - This field represents the core meaning of the lemma — the general concept as understood in ${lessonLanguage}, not a meaning narrowed to fit only this specific sentence.
            - Identify a single standard dictionary definition of the Base Form in ${userLanguage} that best covers the sense used in the context.
            - Select the definition at the correct semantic granularity: broad enough to reflect the word's general dictionary entry, yet specific enough to distinguish it from other listed senses.
            - Prioritize formal equivalence: if the target language has a direct lexical counterpart (e.g., a cognate or loanword), prefer it over a paraphrase or a semantically narrowed synonym.
            - Single lexical item constraint: The definition must be a single word or a single fixed phrase. A comma-separated string and any form of listing multiple candidate translations are prohibited.
            - Strict Syntax Ban: Commas (,), slashes (/), semicolons (;), colons (:), or parentheses ( () ) are not allowed in this field.
            - No exact 1-to-1 equivalent or multiple candidates: Even if ${userLanguage} lacks a perfect counterpart or multiple translations exist, commit to the single closest word or fixed phrase. Place all remaining nuances, alternatives, or context-specific coloring into the Contextual Explanation field instead.
            - Output must be a definitive, short phrase or single word.
            - Negative Examples
                - Incorrect: 번역가, 통역사 (Comma-separated synonyms) / Correct: 번역가
                - Incorrect: to achieve (a goal) (Parenthetical disambiguation) / Correct: to achieve
                - Incorrect: 休む／くつろぐ (Slash-separated alternatives) / Correct: 休む
                - Incorrect: herstellen, anfertigen (Comma-separated candidates) / Correct: herstellen

        4. Contextual Explanation
            - Bridge the "Standard Definition" and the "Specific Context" with high information density (1–2 concise sentences).
            - Strict Ban on Filler: Never write empty boilerplate phrases or repeat the base definition. Dive directly into the context.
            - What to Explain:
              1. Grammatical Form & Collocation: The exact form in context (e.g., inflection, tense, voice, dependent particles, governing verbs, separable phrasal structures).
              2. Contextual Nuance: How the word specifically operates in the sentence, speaker intent, or metaphorical imagery.
              3. Distinctive Register (Only if notable): Mention tone only when it is truly distinctive (e.g., slang, highly formal, archaic, ironic); omit for neutral words.

        5. Example Generation
            - Create a new, high-quality penetrating example sentence in ${lessonLanguage} using the Base Form.
            - And translate the example sentence accurately into ${userLanguage}.
            - Ensure the usage helps the user understand the general applicability of this specific sense.

        ## Output Structure (HTML)

        <div class="word-card">
            <b>[Base Form in ${lessonLanguage}]</b> <span>/[IPA]/</span> <i>([Part of Speech in ${userLanguage}])</i>
            <p>[Standard Dictionary Definition in ${userLanguage}]</p>
            <hr>
            <p>[Contextual Explanation in ${userLanguage}]</p>
            <hr>
            <ul>
              <li>[New Example Sentence in ${lessonLanguage}]</li>
              <li>[Translation of the example sentence in ${userLanguage}]</li>
            </ul>
        </div>

        ## Examples

        ### Example 1: Noun (Original: English, User: Korean)
        User Input: 'Input: "translators", Context: "However, the ESV translators chose to translate that same word as 'servant'."'
        Assistant Output:
        <div class="word-card">
            <b>translator</b> <span>[trænsˈleɪtər]</span> <i>(명사)</i>
            <p>번역가</p>
            <hr>
            <p>문맥에서는 복수형 접미사 '-s'가 결합된 주어로 쓰여, 특정 단어를 'servant'로 번역하기로 결정한 성경 번역 위원회 집단을 지칭합니다.</p>
            <hr>
            <ul>
              <li>Many translators work freely.</li>
              <li>많은 번역가들이 자유롭게 일합니다.</li>
            </ul>
        </div>

        ### Example 2: Verb (Original: Spanish, User: English)
        User Input: 'Input: "lograr", Context: "Debemos lograr nuestros objetivos."'
        Assistant Output:
        <div class="word-card">
            <b>lograr</b> <span>[loˈɣɾaɾ]</span> <i>(verb)</i>
            <p>To achieve</p>
            <hr>
            <p>Appears in the infinitive governed by the modal auxiliary 'debemos', denoting a collective obligation to attain set objectives.</p>
            <hr>
            <ul>
              <li>Espero lograr todas mis metas.</li>
              <li>I hope to achieve all my goals.</li>
            </ul>
        </div>

        ### Example 3: Context-Specific Sense (Original: German, User: French)
        User Input: 'Input: "anstellen", Context: "Was hast du mit der Schere angestellt?"'
        Assistant Output:
        <div class="word-card">
            <b>anstellen</b> <span>[ˈanˌʃtɛlən]</span> <i>(verbe)</i>
            <p>Faire</p>
            <hr>
            <p>Dans ce contexte familier, il s'emploie au participe passé (angestellt) pour désigner le fait d'avoir commis une bêtise ou une maladresse avec des ciseaux.</p>
            <hr>
            <ul>
              <li>Er hat wieder etwas Dummes angestellt.</li>
              <li>Il a encore fait quelque chose de stupide.</li>
            </ul>
        </div>

        ### Example 4: Adverb Retention (Original: English, User: Japanese)
        User Input: 'Input: "recklessly", Context: "He drove recklessly through the rain."'
        Assistant Output:
        <div class="word-card">
            <b>recklessly</b> <span>[ˈrɛklɪsli]</span> <i>(副詞)</i>
            <p>無謀に</p>
            <hr>
            <p>過去形動詞「drove」を直接修飾し、雨天という悪条件下で安全を顧みずに車を走らせた極めて危険な運転様態を批判的に強調しています。</p>
            <hr>
            <ul>
              <li>She spent money recklessly.</li>
              <li>彼女は無謀にお金を使った。</li>
            </ul>
        </div>

        ### Example 5: Complex Inflection/Conjugation (Original: Japanese, User: Korean)
        User Input: 'Input: "立ち尽くしていました", Context: "予期せぬニュースを聞いて、彼女はしばらくその場に立ち尽くしていました。"'
        Assistant Output:
        <div class="word-card">
            <b>立ち尽くす</b> <span>[tat͡ɕit͡sɯkɯsɯ]</span> <i>(동사)</i>
            <p>그 자리에 멈춰 서다</p>
            <hr>
            <p>문맥에서는 보조동사 결합 형태인 '〜ていました'(진행·지속+과거)로 쓰여, 예상치 못한 소식에 큰 충격을 받아 그 자리에서 굳어 있던 상태가 한동안 이어졌음을 나타냅니다.</p>
            <hr>
            <ul>
              <li>あまりの美しさに、彼はその場に立ち尽くした。</li>
              <li>너무나 아름다운 광경에 그는 그 자리에 멈춰 섰다.</li>
            </ul>
        </div>

        ### Example 6: Lexicalized Negation / Fixed Expression (Original: Japanese, User: Korean)
        User Input: 'Input: "仕方がありません", Context: "雨が降り始めてしまったので、今日の遠足が中止になるのは仕方がありません。"'
        Assistant Output:
        <div class="word-card">
            <b>仕方がない</b> <span>[ɕikataɡanai]</span> <i>(관용구)</i>
            <p>어쩔 수 없다</p>
            <hr>
            <p>정해진 상황이나 이미 일어난 일에 대해 다른 방도가 없음을 체념하듯 표현하는 관용구입니다. 여기서는 정중한 형태인 'ありません'으로 변형되어, 비가 와서 소풍이 취소되는 것은 불가피하고 당연한 일이라는 의미를 나타냅니다.</p>
            <hr>
            <ul>
              <li>いくら後悔しても、過ぎたことは仕方がない。</li>
              <li>아무리 후회해도 지난 일은 어쩔 수 없다.</li>
            </ul>
        </div>

        ### Example 7: Orthographic Adaptation (Original: Japanese, User: Korean)
        User Input: 'Input: "カワイイ", Context: "彼女が着ている服は、いつもすごくカワイイですね。"'
        Assistant Output:
        <div class="word-card">
            <b>かわいい</b> <span>[kawaiː]</span> <i>(형용사)</i>
            <p>귀엽다</p>
            <hr>
            <p>원문에서는 일반적인 히라가나 대신 카타카나('カワイイ')로 표기하여, 단순한 귀여움을 넘어 패션과 시각적 스타일링의 트렌디하고 감각적인 매력을 강조하고 있습니다.</p>
            <hr>
            <ul>
              <li>公園でかわいい子猫を見つけました。</li>
              <li>공원에서 귀여운 새끼 고양이를 발견했습니다.</li>
            </ul>
        </div>

        ### Example 8: Kanji Phonetic Disambiguation (Original: Japanese, User: Korean)
        User Input: 'Input: "市場", Context: "新鮮な野菜を買うために、朝早く地元の市場に行きました。"'
        Assistant Output:
        <div class="word-card">
            <b>市場</b> <span>[it͡ɕiba]</span> <i>(명사)</i>
            <p>시장</p>
            <hr>
            <p>추상적 경제 시장(しじょう)이 아닌 물리적 '재래시장(いちば)'을 뜻하며, 방향 조사 'に'와 결합해 신선한 채소를 구매하러 가는 목적지를 나타냅니다.</p>
            <hr>
            <ul>
              <li>毎朝、この市場は活気に満ちている。</li>
              <li>매일 아침 이 시장은 활기로 넘친다.</li>
            </ul>
        </div>

        ### Example 9: Pure Idiom & Metaphorical Extraction (Original: French, User: English)
        User Input: 'Input: "posé un lapin", Context: "J'ai attendu une heure au café, mais il m'a posé un lapin."'
        Assistant Output:
        <div class="word-card">
            <b>poser un lapin</b> <span>[po.ze œ̃ la.pɛ̃]</span> <i>(idiom)</i>
            <p>to stand somebody up</p>
            <hr>
            <p>Literally meaning "to place a rabbit," this French idiom denotes failing to show up for an appointment without warning. In context, it appears in the passé composé ('a posé') with the object pronoun 'm'', expressing frustration over being stood up at the café.</p>
            <hr>
            <ul>
              <li>Elle m'a posé un lapin à notre premier rendez-vous.</li>
              <li>She stood me up on our first date.</li>
            </ul>
        </div>

        ### Example 10: Culture-Bound Concept & Comma Exception (Original: Portuguese, User: English)
        User Input: 'Input: "saudade", Context: "Morar no exterior é bom, mas sinto muita saudade da minha terra natal."'
        Assistant Output:
        <div class="word-card">
            <b>saudade</b> <span>[sawˈdadʒi]</span> <i>(noun)</i>
            <p>nostalgic longing</p>
            <hr>
            <p>Culturally specific Portuguese noun expressing deep nostalgic yearning. In context, it functions as the direct object of the verb 'sinto' and is intensified by 'muita', emphasizing emotional longing for one's homeland.</p>
            <hr>
            <ul>
              <li>A saudade bateu forte hoje.</li>
              <li>The nostalgic longing hit hard today.</li>
            </ul>
        </div>

        ### Example 11: Separated Phrasal Verb (Original: English, User: Chinese)
        User Input: 'Input: "figure", Context: "I finally managed to figure the complicated puzzle out after hours of trying."'
        Assistant Output:
        <div class="word-card">
            <b>figure out</b> <span>[ˈfɪɡjər aʊt]</span> <i>(短语动词)</i>
            <p>弄明白</p>
            <hr>
            <p>表示通过思考解决问题的常用短语动词。在语境中呈现为及物可拆分结构（separable phrasal verb），动词与介词被宾语“the complicated puzzle”在物理上隔开，表达历经数小时最终解决难题的结果。</p>
            <hr>
            <ul>
              <li>We need to figure out a better solution.</li>
              <li>我们需要弄明白一个更好的解决办法。</li>
            </ul>
        </div>
        `;
        const sentencePrompt = `
        # Sentence Analysis

        ## Task: Full Text Parsing
        Input: 'Input: "Context... <selected>Target Sentences</selected> ...Context"' or 'Input: "Target Sentences"'.

        0. Context Handling & Scope
           - If the input contains <selected>...</selected> tags, translate and analyze ONLY the text inside the <selected>...</selected> tags (the target sentence).
           - Any text OUTSIDE the <selected>...</selected> tags serves purely as surrounding context to clarify speaker intent, tone, references, and discourse flow. DO NOT translate, summarize, or include outside text in the output.
           - If no tags are present, treat the entire input as the target sentence.

        1. Translation Strategy
           - Translate the target sentence into a single flowing block in ${userLanguage}, leveraging the surrounding context for natural nuance, pronouns, and cohesion.
           - Wrap the entire translation in <p><b>...</b></p>.

        2. Holistic Explanation
           - Analyze the "Big Picture": Meaning, tone, speaker intent, and nuance within the context.
           - Explain beyond the literal translation.

        3. Key Element Extraction
           - Select 2-4 distinct elements from the target sentence (Difficult words, Collocations, Idioms).
           - Criteria: Choose elements where the whole is greater than the sum of parts, or where detailed nuance is needed.
           - Format: [Original Term]: [Concise Definition in ${userLanguage}].

        ## Output Structure (HTML)

        <p><b>[Full Translation in ${userLanguage}]</b></p>
        <hr>
        <p>[Holistic Explanation in ${userLanguage}]</p>
        <hr>
        <ul>
          <li><b>[Element 1 in ${lessonLanguage}]:</b> [Definition in ${userLanguage}]</li>
          <li><b>[Element 2 in ${lessonLanguage}]:</b> [Definition in ${userLanguage}]</li>
        </ul>

        ## Examples

        ### Example 1: Standard Sentence (Original: French, User: Japanese)
        User Input: 'Input: "Il a réussi à convaincre ses collègues malgré les difficultés."'
        Assistant Output:
        <p><b>彼は困難にもかかわらず同僚たちを説得することに成功した。</b></p>
        <hr>
        <p>この文は、彼が直面した障害や困難な状況があったにもかかわらず、最終的に同僚たちを自分の意見に同意させることに成功したという達成感を伝えています。</p>
        <hr>
        <ul>
          <li><b>réussi à convaincre:</b> 説得に成功した、納得させた。</li>
          <li><b>malgré:</b> ～にもかかわらず（対立や譲歩を表す前置詞）。</li>
        </ul>

        ### Example 2: Contrast/Nuance (Original: Italian, User: German)
        User Input: 'Input: "Nonostante la pioggia, siamo andati al concerto."'
        Assistant Output:
        <p><b>Trotz des Regens sind wir zum Konzert gegangen.</b></p>
        <hr>
        <p>Dieser Satz hebt die Entschlossenheit hervor. Das Wort "Nonostante" signalisiert ein Hindernis (den Regen), das jedoch die Hauptaktion (zum Konzert gehen) nicht verhindern konnte.</p>
        <hr>
        <ul>
          <li><b>Nonostante:</b> Trotz; obwohl.</li>
          <li><b>siamo andati:</b> wir sind gegangen (Vergangenheitsform von "andare").</li>
        </ul>

        ### Example 3: Idiomatic Expression (Original: English, User: Korean)
        User Input: 'Input: "Don't worry, it's not rocket science, you'll figure it out quickly."'
        Assistant Output:
        <p><b>걱정 마세요, 그렇게 복잡한 게 아니니까 금방 알게 될 거예요.</b></p>
        <hr>
        <p>상대방을 안심시키고 격려하는 문장입니다. "Rocket science"는 매우 어렵고 복잡한 학문을 상징하는데, 부정문으로 쓰여 해당 과제가 평이하다는 것을 강조합니다.</p>
        <hr>
        <ul>
          <li><b>it's not rocket science:</b> (관용구) 몹시 어려운 일이 아니다, 아주 복잡하지 않다.</li>
          <li><b>figure it out:</b> (문제 등을) 해결하다, 이해하다, 답을 알아내다.</li>
        </ul>

        ### Example 4: Multiple Sentences (Original: Spanish, User: French)
        User Input: 'Input: "El sol brillaba con fuerza. Los pájaros cantaban en los árboles." 'r
        Assistant Output:
        <p><b>Le soleil brillait fort. Les oiseaux chantaient dans les arbres.</b></p>
        <hr>
        <p>Ces deux phrases posent un décor paisible et vivant. L'utilisation de l'imparfait (brillaba, cantaban) suggère une action continue dans le passé, décrivant l'atmosphère d'un moment précis.</p>
        <hr>
        <ul>
          <li><b>con fuerza:</b> avec force; intensément.</li>
          <li><b>cantaban:</b> ils chantaient (verbe chanter à l'imparfait).</li>
        </ul>
        `;
        const plainTextPrompt = `
        # Conversational Mode & Correction Protocol

        ## Context Awareness
        You are in a follow-up state. The user has either:
        1. Explicitly requested a correction to the previous analysis.
        2. Asked a general or referential question.

        ## Logic Branching via Intent Detection

        ### Condition A: Correction Request
        Trigger: Only when the user explicitly requests a fix of the previously generated word card using direct commands such as "Wrong word", "Fix the base form", "Use X instead of Y", "Correct the IPA".
        Action: Output conversational explanation first (optional), then output the corrected word card wrapped strictly inside <div class="word-card">.
        
        Strict Separation of Roles:
        1. Outside the card (Conversational Commentary):
            - This is the ONLY place to communicate with the user, acknowledge the fix, or explain why the correction was made (e.g., explaining why B is correct instead of A).
        2. Inside the card (Permanent Flashcard Object):
           - Destination: Content inside '<div class="word-card">' is permanently exported as a flashcard. It must be a clean, objective dictionary-like entry.
           - Purity Rule: Write the inner content as if this card was generated perfectly on the first try with zero errors. The card itself must be completely unaware that any correction ever occurred.
           - Verbatim Copy Constraint: ONLY update the exact slot requested (e.g., IPA, base form). All other slots (especially the contextual explanation '<p>' and examples) must be copied verbatim from the Previous Response — absolutely do not rewrite or add correction remarks to them.
        
        Negative Examples inside <div class="word-card">:
            - Incorrect in inner <p>: "발음은 [tsɯno]가 아니라 [kado]였습니다. 문맥에서는..." (Conversational or comparative remarks about the correction are strictly forbidden)
            - Incorrect in inner <p>: "~의 발음은 b로 읽는 것이 이 문맥에서는 적절합니다."
        
        ### Condition B: General or Referential Query
        Trigger: The user asks a question or makes a general comment.
        Action: Answer in Raw HTML (<p>, <b> <ul>, <li>). Markdown syntax (code blocks, bold, and headers) is forbidden.
        Restriction: Using <div class="word-card"> format is not permitted. This format is reserved for the Correction Protocol (Condition A).

        ## Examples

        ### Example 1: Strict Correction (no preface needed)
        Scenario: Target Language is English, Presentation Language (User Language) is Japanese. The word "happily" in the context of "He played happily" was incorrectly analyzed with the base form "happy" and the part of speech marked as an adjective (形容詞).
        Previous Response:
        <div class="word-card">
            <b>happy</b> <span>[ˈhæpɪli]</span> <i>(形容詞)</i>
            <p>楽しそうに、幸福に</p>
            <hr>
            <p>喜びを伴って行われる動作を説明するために使用されます。ユーザーの文脈は動作の様態を強調しています。</p>
            <hr>
            <ul>
                <li>He played happily.</li>
                <li>彼は楽しそうに遊んだ。</li>
            </ul>
        </div>
        User Input: "The base form should be the adverb, not adjective."
        Assistant Output:
        <div class="word-card">
            <b>happily</b> <span>[ˈhæpɪli]</span> <i>(副詞)</i>
            <p>楽しそうに</p>
            <hr>
            <p>喜びを伴って行われる動作を説明するために使用されます。ユーザーの文脈は動作の 様態を強調しています。</p>
            <hr>
            <ul>
                <li>He played happily.</li>
                <li>彼は楽しそうに遊んだ。</li>
            </ul>
        </div>

        ### Example 2: Strict Correction with Preface
        Scenario: Target Language is Japanese, Presentation Language (User Language) is Korean. The word "角" in the context of turning a corner ("次の角を右に曲がってください") was incorrectly analyzed with the pronunciation of "horn" ([tsɯno]).
        Previous Response:
        <div class="word-card">
            <b>角</b> <span>[tsɯno]</span> <i>(명사)</i>
            <p>길모퉁이</p>
            <hr>
            <p>길이 꺾이는 곳을 의미합니다. 문맥에서는 다음 안내 지점인 오른쪽으로 가야 할 모퉁이를 지칭합니다.</p>
            <hr>
            <ul>
                <li>次の角を右に曲がってください。</li>
                <li>다음 길모퉁이에서 우회전해 주세요.</li>
            </ul>
        </div>
        User Input: "발음 고쳐줘 'かど'야."
        Assistant Output:
        <p>「角」는 이 문맥에서 길모퉁이를 뜻하는 'かど'로 읽히므로 [kado]가 올바른 발음입니다. [tsɯno]는 동물의 뿔을 뜻할 때의 발음입니다.</p>
        <div class="word-card">
            <b>角</b> <span>[kado]</span> <i>(명사)</i>
            <p>길모퉁이</p>
            <hr>
            <p>길이 꺾이는 곳을 의미합니다. 문맥에서는 다음 안내 지점인 오른쪽으로 가야 할 모퉁이를 지칭합니다.</p>
            <hr>
            <ul>
                <li>次の角を右に曲がってください。</li>
                <li>다음 길모퉁이에서 우회전해 주세요.</li>
            </ul>
        </div>

        ### Example 3: General Conversation
        User Input: "Why is English so hard?"
        Assistant Output:
        <p>English can be difficult due to its inconsistent spelling rules and vast vocabulary borrowed from multiple languages.</p>
        
        ### Example 4: General Conversation (Topic Shift)
        Scenario: The previous turn was a word card analysis, but the user suddenly asks a completely unrelated technical or general knowledge question. There is no correction requested.
        User Input: "How is an ALBM launched? Do fighter jets fire it while climbing?"
        Assistant Output:
        <p>An <b>ALBM (Air-Launched Ballistic Missile)</b> is typically dropped from a large bomber or transport aircraft, igniting its rocket motor mid-air during free fall.</p>
        <p>While fighter jets sometimes use a pitch-up (climbing) maneuver to release conventional bombs or short-range missiles, bulky ALBMs are generally released in level flight after reaching sufficient altitude and speed.</p>
        
        ### Example 5: Referential Query (Asking for more details, NOT correcting)
        Scenario: The user asks an additional question about the previously explained word or concept, but does NOT request any changes to the word card itself.
        User Input: "Is the word you just showed me okay to use in business emails without sounding rude?"
        Assistant Output:
        <p>Yes, it is a <b>polite expression</b> that is perfectly acceptable in business correspondence.</p>
        <p>It is particularly appropriate in the following situations:</p>
        <ul>
          <li>When making an inquiry to a new client</li>
          <li>When submitting an official report to a supervisor</li>
        </ul>
        
        `;
        
        setupKeyboardShortcuts();
        setupYoutubePlayerCustomization();
        setupReaderContainer();
        setupLLMs();
        handleLocalVideoContainerVisibility();
    }
    
    async function setupCourse() {
        function createCourseUI() {
            const resetButton = createElement("button", {
                id: "resetLessonPositions",
                textContent: "⏮️",
                title: "Reset all lessons to the first page",
                className: "nav-button"
            });
            
            let nav = document.querySelector(".library-section > .list-header > .list-header-index");
            nav.appendChild(resetButton);
        }
        
        function setupCourseStyles() {
            const css = `
            .nav-button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.5rem;
            }

            .library-section > .list-header > .list-header-index {
                grid-template-columns: auto 1fr auto !important;
            }

            .dynamic--word-progress {
                grid-template-columns: repeat(3, auto) !important;
            }

            .word-indicator--box-white {
                background-color: rgb(255 255 255 / 85%);
                border-color: rgb(255 255 255);
            }
            `;
            applyCSS(css);
        }
        
        function enrichLessonDetails() {
            function addKnownWordsIndicator(lessonElement, lessonInfo) {
                const dynamicWordProgress = lessonElement.querySelector('.dynamic--word-progress');
                
                const knownWordPercentage = Math.round((lessonInfo.knownWordsCount / lessonInfo.uniqueWordsCount) * 100);
                
                const knownWordsItem = createElement('div', {
                    className: 'word-indicator--item grid-layout grid-align--center grid-item is-fluid--left',
                    title: 'Known Words'
                });
                
                const knownWordsBox = createElement('div', {className: 'word-indicator--box word-indicator--box-white'});
                knownWordsItem.appendChild(knownWordsBox);
                
                const textWrapper = createElement('span', {className: 'text-wrapper is-size-8'});
                textWrapper.appendChild(createElement('span', {textContent: `${lessonInfo.knownWordsCount} (${knownWordPercentage}%)`}));
                
                knownWordsItem.appendChild(textWrapper);
                dynamicWordProgress.appendChild(knownWordsItem);
            }
            
            async function updateWordIndicatorPercentages(lessonElement, lessonId) {
                const lessonInfo = await getLessonInfo(lessonId);
                
                const wordIndicatorItems = lessonElement.querySelector(".word-indicator--item");
                if (!wordIndicatorItems) return;
                
                const lingqsPercentage = Math.round((lessonInfo.cardsCount / lessonInfo.uniqueWordsCount) * 100);
                const lingqsElement = lessonElement.querySelector('.word-indicator--item[title="LingQs"] > span > span');
                lingqsElement.textContent = `${lessonInfo.cardsCount} (${lingqsPercentage}%)`;
                
                addKnownWordsIndicator(lessonElement, lessonInfo);
            }
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    console.debug('Observer:', `Library item added. ${mutation.type}`, mutation.addedNodes);
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return;
                        if (!node.matches('.library-item-wrap')) return;
                        
                        const lessonId = /l-search--(\d*)-horizontal/.exec(node.id)[1];
                        updateWordIndicatorPercentages(node, lessonId);
                    });
                });
            });
            
            const targetNode = document.querySelector('.library-section .library-list > .grid-layout');
            observer.observe(targetNode, {childList: true});
        }
        
        function enableCourseSorting() {
            const dropdownItems = document.querySelectorAll('.library-section > .list-header .tw-dropdown--item');
            if (dropdownItems.length) {
                dropdownItems.forEach((item, index) => {
                    item.addEventListener('click', () => {
                        console.log(`Clicked sort option: ${index}`);
                        settings.librarySortOption = index;
                    });
                });
                
                dropdownItems[settings.librarySortOption].click();
                return true;
            } else {
                console.warn("Dropdown items not found for library sort.");
                return false;
            }
        }
        
        function setupLessonResetButton() {
            const resetButton = document.getElementById("resetLessonPositions");
            resetButton.addEventListener("click", async () => {
                const languageCode = await getLanguageCode();
                const collectionId = await getCollectionId();
                
                const allLessons = await getAllLessons(languageCode, collectionId);
                const confirmed = confirm(`Reset all ${allLessons.length} lessons to their starting positions?`);
                if (!confirmed) return;
                
                for (const lesson of allLessons) {
                    await setLessonProgress(lesson.id, 0);
                    console.log(`Reset lesson ID: ${lesson.id} to the first page`);
                }
                
                alert(`Successfully reset ${allLessons.length} lessons to their starting positions.`);
            });
        }
        
        const libraryHeader = await waitForElement('.library-section > .list-header', 5000);
        createCourseUI();
        setupCourseStyles();
        
        enrichLessonDetails();
        enableCourseSorting();
        setupLessonResetButton();
    }
    
    async function setupEditor() {
        function updateProgress(progressBar, progressText, message, value, total) {
            if (value !== undefined && total !== undefined) {
                progressBar.max = total;
                progressBar.value = value;
            }
            progressText.textContent = message;
            console.log(message);
        }
        
        async function concatenateAudioBuffers(audioContext, audioBuffers) {
            if (audioBuffers.length === 0) return {concatenatedBuffer: null, duration: 0, timestamps: []};
            
            const sampleRate = audioBuffers[0].sampleRate;
            const numberOfChannels = audioBuffers[0].numberOfChannels;
            
            let totalLength = 0;
            audioBuffers.forEach(buffer => {
                if (buffer.sampleRate !== sampleRate || buffer.numberOfChannels !== numberOfChannels) {
                    console.warn("Mismatched audio buffer properties. Concatenation might have issues.");
                }
                totalLength += buffer.length;
            });
            
            const concatenatedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);
            
            let currentOffsetInSamples = 0;
            const timestamps = [];
            
            for (let i = 0; i < audioBuffers.length; i++) {
                const buffer = audioBuffers[i];
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    concatenatedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), currentOffsetInSamples);
                }
                
                timestamps.push({
                    start: currentOffsetInSamples / sampleRate,
                    end: (currentOffsetInSamples + buffer.length) / sampleRate,
                });
                
                currentOffsetInSamples += buffer.length;
            }
            
            return {
                concatenatedBuffer: concatenatedBuffer,
                duration: concatenatedBuffer.duration,
                timestamps: timestamps
            };
        }
        
        async function generateLessonAudio() {
            try {
                const ttsProvider = settings.ttsProvider;
                
                const lessonId = getLessonId();
                const lessonLanguage = getLessonLanguage();
                
                let data = await getLessonSentences(lessonLanguage, lessonId);
                
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const sentenceTexts = data.map(item => item["text"]);
                const totalSentences = sentenceTexts.length;
                let processedSentences = 0;
                
                const progressBar = document.getElementById("lessonAudioProgressBar");
                const progressText = document.getElementById("lessonAudioProgressText");
                
                progressBar.style.display = "block";
                progressBar.max = totalSentences * 2;
                
                let RPM_LIMIT = 1;
                switch (ttsProvider) {
                    case "openai":
                        RPM_LIMIT = 500;
                        break;
                    case "google gemini":
                        RPM_LIMIT = 200;
                        break;
                    case "google cloud":
                        RPM_LIMIT = 200;
                        break;
                    case "elevenlabs":
                        RPM_LIMIT = 100;
                        break;
                }
                RPM_LIMIT = RPM_LIMIT * 0.9;
                const DELAY_BETWEEN_CALLS = (60 * 1000) / RPM_LIMIT;
                
                const audioDataBuffers = new Array(totalSentences);
                const apiCallPromises = [];
                const scheduledTimeouts = [];
                let nextAvailableCallTime = Date.now();
                const MAX_SENTENCE_RETRIES = 3;
                let isAborted = false;
                let abortFailureMessage = "";

                const abortAll = (message) => {
                    if (isAborted) return;
                    isAborted = true;
                    abortFailureMessage = message;
                    scheduledTimeouts.forEach(timerId => clearTimeout(timerId));
                };

                for (let i = 0; i < totalSentences; i++) {
                    const text = sentenceTexts[i];
                    const actualCallTime = Math.max(Date.now(), nextAvailableCallTime);
                    nextAvailableCallTime = actualCallTime + DELAY_BETWEEN_CALLS;

                    const promise = new Promise((resolve, reject) => {
                        const timeToWait = Math.max(0, actualCallTime - Date.now());

                        const timerId = setTimeout(async () => {
                            if (isAborted) {
                                resolve();
                                return;
                            }

                            let sentenceSuccess = false;
                            let lastError = null;

                            for (let attempt = 1; attempt <= MAX_SENTENCE_RETRIES; attempt++) {
                                if (isAborted) {
                                    resolve();
                                    return;
                                }

                                try {
                                    const statusMessage = attempt > 1
                                        ? `Calling TTS for sentence ${i + 1}/${totalSentences} (Retry ${attempt}/${MAX_SENTENCE_RETRIES})`
                                        : `Calling TTS for sentence ${i + 1}/${totalSentences}`;
                                    updateProgress(progressBar, progressText, statusMessage, processedSentences, totalSentences * 2);

                                    const audioArrayBuffer = await getTTSResponse(ttsProvider, settings.ttsApiKeys[ttsProvider] || "", (settings.ttsVoice[lessonLanguage]), text);
                                    if (isAborted) {
                                        resolve();
                                        return;
                                    }

                                    audioDataBuffers[i] = await decodeAudioData(audioContext, audioArrayBuffer);
                                    processedSentences += 1;
                                    sentenceSuccess = true;
                                    resolve();
                                    break;
                                } catch (error) {
                                    lastError = error;
                                    console.warn(`TTS sentence ${i + 1} attempt ${attempt} failed:`, error);
                                    if (attempt < MAX_SENTENCE_RETRIES && !isAborted) {
                                        await new Promise(r => setTimeout(r, 1000 * attempt));
                                    }
                                }
                            }

                            if (!sentenceSuccess && !isAborted) {
                                const failMessage = `TTS failed at sentence ${i + 1}/${totalSentences} after ${MAX_SENTENCE_RETRIES} attempts: ${lastError?.message || lastError}`;
                                abortAll(failMessage);
                                reject(new Error(failMessage));
                            }
                        }, timeToWait);

                        scheduledTimeouts.push(timerId);
                    });

                    apiCallPromises.push(promise);
                }

                updateProgress(progressBar, progressText, 'All TTS API calls scheduled.', processedSentences, totalSentences * 2);

                try {
                    await Promise.all(apiCallPromises);
                } catch (error) {
                    const message = abortFailureMessage || error.message || "TTS generation failed.";
                    updateProgress(progressBar, progressText, message, processedSentences, totalSentences * 2);
                    console.error(message);
                    const genLessonAudioButton = document.getElementById("genLessonAudio");
                    if (genLessonAudioButton) {
                        genLessonAudioButton.disabled = false;
                        genLessonAudioButton.style.display = "";
                    }
                    return;
                }

                if (isAborted) {
                    const message = abortFailureMessage || "TTS generation aborted.";
                    updateProgress(progressBar, progressText, message, processedSentences, totalSentences * 2);
                    const genLessonAudioButton = document.getElementById("genLessonAudio");
                    if (genLessonAudioButton) {
                        genLessonAudioButton.disabled = false;
                        genLessonAudioButton.style.display = "";
                    }
                    return;
                }

                updateProgress(progressBar, progressText, 'All TTS API calls completed.', processedSentences, totalSentences * 2);
                
                updateProgress(progressBar, progressText, 'Concatenating audio buffers.', processedSentences, totalSentences * 2);
                const {concatenatedBuffer, duration, timestamps} = await concatenateAudioBuffers(
                    audioContext,
                    audioDataBuffers
                );
                
                updateProgress(progressBar, progressText, 'Encoding audio.', processedSentences, totalSentences * 2);
                const encodingProgressCallback = (current, total) => {
                    const encodingProgressValue = processedSentences + Math.floor((current / total) * totalSentences);
                    updateProgress(progressBar, progressText, `Encoding audio: ${Math.floor((current / total) * 100)}%`, encodingProgressValue, totalSentences * 2);
                };
                const finalMP3AudioData = await encodeAudioBufferToMP3(concatenatedBuffer, encodingProgressCallback);
                updateProgress(progressBar, progressText, 'Audio encoding completed.', totalSentences * 2, totalSentences * 2);
                
                updateProgress(progressBar, progressText, 'Uploading audio to lesson.', totalSentences * 2, totalSentences * 2);
                await uploadAudioToLesson(lessonLanguage, lessonId, finalMP3AudioData, Math.ceil(duration));
                
                const jsonTimestamps = timestamps.map(({start, end}, index) => {
                    return {index: index + 1, timestamp: [start, end]}
                });
                updateProgress(progressBar, progressText, 'Updating timestamps to lesson.', totalSentences * 2, totalSentences * 2);
                await updataTimestampToLesson(lessonLanguage, lessonId, jsonTimestamps);
                
                window.onbeforeunload = null;
                location.reload();
            } catch (error) {
                console.error("Error during lesson audio generation:", error);
                const progressText = document.getElementById("lessonAudioProgressText");
                if (progressText) {
                    progressText.textContent = `Error: ${error?.message || error}`;
                }
                const genLessonAudioButton = document.getElementById("genLessonAudio");
                if (genLessonAudioButton) {
                    genLessonAudioButton.disabled = false;
                    genLessonAudioButton.style.display = "";
                }
            }
        }
        
        function setupEditorStyles() {
            const editorCSS = `
                #genLessonAudio {
                    padding: 8px 9px;
                    background-color: rgba(125, 125, 125, 0.25);
                    color: inherit;
                    border: 1px solid rgba(125, 125, 125, 0.4);
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.15s ease, color 0.15s ease;
                }
                #genLessonAudio:hover:not(:disabled) {
                    background-color: rgba(125, 125, 125, 0.35);
                }
                #genLessonAudio:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `;
            applyCSS(editorCSS);
        }
        
        async function createEditorUI() {
            setupEditorStyles();
            
            const genLessonAudioButton = createElement("button", {
                id: "genLessonAudio",
                type: "button",
                textContent: "Generate Lesson Audio"
            });
            genLessonAudioButton.addEventListener("click", () => {
                genLessonAudioButton.disabled = true;
                genLessonAudioButton.style.display = "none";
                generateLessonAudio();
            });
            
            const progressBar = createElement("progress", {
                id: "lessonAudioProgressBar",
                value: "0",
                max: "100",
                style: "width: 100%; display: none; margin-top: 8px;"
            });
            
            const progressText = createElement("span", {
                id: "lessonAudioProgressText",
                style: "font-size: 0.8em; margin-top: 4px; display: block; text-align: center;"
            });
            
            const mainNav = await waitForElement(`.bg-editor [data-slot="card"] [data-slot="form-item"] [data-slot="form-control"]  div.grid`, 10000);
            mainNav.style.height = "auto";
            mainNav.style.display = "flex";
            mainNav.style.flexDirection = "column";
            
            mainNav.appendChild(createElement("hr", {className: "divider my-3"}));
            mainNav.appendChild(genLessonAudioButton);
            mainNav.appendChild(progressBar);
            mainNav.appendChild(progressText);
        }
        
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js");
        await createEditorUI();
    }
    
    async function setupPrintPage() {
        const lessonURL = document.referrer;
        const lessonId = getLessonId(lessonURL);
        const lessonLanguage = getLessonLanguage(lessonURL);
        const wordsURL = `https://www.lingq.com/api/v3/${lessonLanguage}/lessons/${lessonId}/words`;
        
        const response = await fetch(wordsURL);
        const data = await response.json();
        
        const cardsList = []
        const seenTerms = new Set();
        
        Object.values(data.cards)
            .forEach(card => {
                if (card.status < 3) {
                    const term = card.term;
                    
                    if (!seenTerms.has(term)) {
                        seenTerms.add(term);
                        cardsList.push({
                            word: term,
                            context: card.fragment.replaceAll(term, `<b>${term}</b>`),
                            notes: card.notes,
                            status: card.status,
                            meaning: card.hints?.[0]?.text ?? ""
                        });
                    }
                }
            });
        
        cardsList.sort((a, b) => b.word.length - a.word.length);
        const escapedWords = cardsList.map((card) => card.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const highlightRegex = new RegExp(`(?<=^|[^\\p{L}\\p{N}]|\\d)(${escapedWords.join('|')})(?=$|[^\\p{L}\\p{N}]|\\d)`, 'giu');
        
        function highlightWordsInNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                const parent = node.parentNode;
                
                if (parent && parent.classList && parent.classList.contains('lingQ')) return;
                
                const matches = [...text.matchAll(highlightRegex)];
                
                if (matches.length > 0) {
                    let lastIndex = 0;
                    const fragment = document.createDocumentFragment();
                    
                    matches.forEach((match) => {
                        const word = match[0];
                        const index = match.index;
                        
                        if (index > lastIndex) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
                        }
                        
                        const span = createElement("span", {className: "lingQ", textContent: word});
                        fragment.appendChild(span);
                        
                        lastIndex = index + word.length;
                    });
                    
                    if (lastIndex < text.length) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                    }
                    
                    parent.replaceChild(fragment, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                if (tagName === 'script' || tagName === 'style') return;
                
                Array.from(node.childNodes).forEach((child) => {
                    highlightWordsInNode(child);
                });
            }
        }
        
        const css = `
            #logo {
                max-width: 100px !important;
            }
            th {
                font-weight: bold;
                background: whitesmoke;
            }
            th, td {
                border: 1px solid #eee;
                padding: 1px 2px;
                white-space: pre-line;
            }
            td.word {
                font-weight: bold;
            }
            td:is(.word,.context) {
                text-align: center;
            }
            .lingQ {
                background: rgba(255, 232, 149, 1);
            }
            `;
        applyCSS(css);
        
        const printContent = document.querySelector("#print-content > .reading-block > article > div");
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(printContent.innerHTML, 'text/html');
        const bodyContent = doc.body;
        
        highlightWordsInNode(bodyContent);
        printContent.innerHTML = bodyContent.innerHTML;
        
        const vocaTable = createElement("table", {style: "page-break-before: always;"});
        const thead = createElement("thead");
        const tr = createElement("tr");
        tr.appendChild(createElement("th", {textContent: ""}));
        tr.appendChild(createElement("th", {textContent: "word"}));
        tr.appendChild(createElement("th", {textContent: "context"}));
        tr.appendChild(createElement("th", {textContent: "meaning"}));
        thead.appendChild(tr);
        vocaTable.appendChild(thead);
        
        const tbody = createElement("tbody");
        cardsList.forEach(card => {
            const tr = createElement("tr");
            tr.appendChild(createElement("td", {className: "status", textContent: card.status}));
            tr.appendChild(createElement("td", {className: "word", textContent: card.word}));
            tr.appendChild(createElement("td", {className: "context", innerHTML: card.context}));
            tr.appendChild(createElement("td", {className: "meaning", textContent: card.meaning}));
            tbody.appendChild(tr);
        })
        vocaTable.appendChild(tbody);
        
        let printPage = document.querySelector("#print-page");
        printPage.appendChild(vocaTable);
        
        console.log(cardsList);
    }
    
    function setupYoutubeEmbeddedPlayer() {
        function isTargetOrigin() {
            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            return origin === 'https://www.lingq.com';
        }
        
        if (!isTargetOrigin()) return;
        
        const youtubeLayoutCSS = `
            #player-control-overlay .player-controls-background-container,
            #player-control-overlay .player-controls-background,
            #player-control-overlay player-middle-controls,
            #player-control-overlay player-bottom-controls,
            #player-control-overlay player-fullscreen-controls,
            #player-control-overlay yt-bigboard,
            .ytp-pause-overlay,
            .ytp-pause-overlay-container,
            .ytp-paid-content-overlay,
            .ytmPaidContentOverlayHost,
            .ytp-watermark,
            .ytp-ce-element {
                display: none !important;
            }

            #player-control-overlay player-top-controls {
                display: block !important;
                opacity: 0 !important;
                pointer-events: auto !important;
                transition: opacity 0.2s ease-in-out !important;
            }

            #player-control-overlay player-top-controls:hover {
                opacity: 1 !important;
            }
        `;
        applyCSS(youtubeLayoutCSS);
        
        async function adjustCaptionPosition() {
            const youtubeCaptionCSS = `
                :root {
                    --caption-font-size: ${settings.captionFontsize}px;
                }

                .caption-window.ytp-caption-window-bottom {
                    display: unset !important;
                    width: 90% !important;
                    bottom: var(--custom-caption-bottom, 10%) !important;
                    top: var(--custom-caption-top, auto) !important;
                    margin-bottom: 0 !important;
                }
                .ytp-caption-segment {
                    font-size: var(--caption-font-size) !important;
                }
            `;
            applyCSS(youtubeCaptionCSS);
            
            const video = await waitForElement('video.html5-main-video', 10000);
            const player = await waitForElement('.html5-video-player', 10000);
            
            if (!video || !player) return;
            
            const pRect = player.getBoundingClientRect();
            const vRect = video.getBoundingClientRect();
            
            function updatePosition() {
                const pRect = player.getBoundingClientRect();
                const vRect = video.getBoundingClientRect();
                
                if (pRect.height === 0 || vRect.height === 0) return;
                
                const gap = (pRect.height - vRect.height) / 2;
                
                if (settings.relocateCaption === "inside") {
                    const targetBottom = gap + 10;
                    const percentBottom = (targetBottom / pRect.height) * 100;
                    
                    player.style.setProperty('--custom-caption-bottom', `${percentBottom}%`);
                    player.style.setProperty('--custom-caption-top', 'auto');
                } else {
                    const targetTop = pRect.height - gap + 5;
                    const percentTop = (targetTop / pRect.height) * 100;
                    
                    player.style.setProperty('--custom-caption-top', `${percentTop}%`);
                    player.style.setProperty('--custom-caption-bottom', 'auto');
                }
            }
            
            let resizeTimeout;
            const resizeObserver = new ResizeObserver(() => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updatePosition();
                }, 100);
            });
            resizeObserver.observe(player);
        }
        
        if (settings.relocateCaption !== "default") adjustCaptionPosition();
    }
    
    async function init() {
        centralClient = createClient(CENTRAL_SUPABASE_URL, CENTRAL_ANON_KEY, {
            auth: {storageKey: "central-auth-token"}
        });
        const updateAuth = (session) => {
            centralUserId = session?.user?.id ?? null;
            centralUserEmail = session?.user?.email ?? "";
            const emailRow = document.getElementById("centralEmailRow");
            const loggedInRow = document.getElementById("centralLoggedInRow");
            const emailDisplay = document.getElementById("centralEmailDisplay");
            if (emailRow) emailRow.style.display = centralUserId ? "none" : "flex";
            if (loggedInRow) loggedInRow.style.display = centralUserId ? "flex" : "none";
            if (emailDisplay) emailDisplay.textContent = centralUserEmail ? `Logged in: ${centralUserEmail}` : "";
        };
        centralClient.auth.onAuthStateChange((_event, session) => updateAuth(session));
        centralClient.auth.getSession().then(({data: {session}}) => updateAuth(session));
        
        try {
            supabaseClient = createClient(settings.dbUrl, settings.dbKey);
            console.log('Supabase initialized.');
        } catch (err) {
            console.error('Supabase initialization failed:', err);
            supabaseClient = null;
        }
        
        const url = document.URL.split("?")[0];
        if (url.includes("lingq")) {
            globalSetup();
            if (url.includes("/library#")) {
            
            } else if (url.includes("/reader")) {
                setupPopups();
                setupReader();
            } else if (url.includes("/editor/") && !url.includes("/editor/courses")) {
                setupPopups();
                setupEditor();
            } else if (url.includes("/library/course")) {
                setupCourse();
            } else if (url.includes("/print")) {
                setupPrintPage();
            }
        } else if (url.includes("youtube")) {
            setupYoutubeEmbeddedPlayer();
        }
    }
    
    init();
})();
