// ==UserScript==
// @name         LingQ Addon
// @description  Provides custom LingQ layouts
// @match        https://www.lingq.com/*/learn/*/web/reader/*
// @match        https://www.lingq.com/*/learn/*/web/library/course/*
// @exclude      https://www.lingq.com/*/learn/*/web/editor/*
// @version      5.11.1
// @grant       GM_setValue
// @grant       GM_getValue
// @namespace https://greasyfork.org/users/1458847
// @downloadURL https://update.greasyfork.org/scripts/533096/LingQ%20Addon.user.js
// @updateURL https://update.greasyfork.org/scripts/533096/LingQ%20Addon.meta.js
// ==/UserScript==

(function () {
    "use strict";

    const storage = {
        get: (key, defaultValue) => {
            const value = GM_getValue(key);
            return value === undefined ? defaultValue : value;
        },
        set: (key, value) => GM_setValue(key, value)
    };

    const defaults = {
        styleType: "video",
        heightBig: 400,
        sentenceHeight: 400,
        widgetWidth: 400,
        fontSize: 1.1,
        lineHeight: 1.7,

        colorMode: "white",
        white_fontColor: "rgb(0, 0, 0)",
        white_lingqBackground: "rgba(255, 232, 149, 1)",
        white_lingqBorder: "rgba(255, 200, 0, 0)",
        white_lingqBorderLearned: "rgba(255, 200, 0, 0)",
        white_unknownBackground: "rgba(198, 223, 255, 1)",
        white_unknownBorder: "rgba(0, 111, 255, 0)",
        white_playingUnderline: "rgb(0, 0, 0)",
        dark_fontColor: "rgb(255, 255, 255)",
        dark_lingqBackground: "rgba(108, 87, 43, 1)",
        dark_lingqBorder: "rgba(254, 203, 72, 0)",
        dark_lingqBorderLearned: "rgba(254, 203, 72, 0)",
        dark_unknownBackground: "rgba(37, 57, 82, 1)",
        dark_unknownBorder: "rgba(72, 154, 254, 0)",
        dark_playingUnderline: "rgb(255, 255, 255)",

        librarySortOption: 0,
        autoFinishing: false,

        keyboardShortcut: false,
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

        chatWidget: false,
        llmProviderModel: "openai gpt-4.1-nano",
        llmApiKey: "",
        askSelected: false,

        tts: false,
        ttsApiKey: "",
        ttsVoice: "openai alloy",
        ttsWord: false,
        ttsSentence: false,
    };

    const settings = new Proxy({}, {
        get: (target, key) => {
            if (key in target) return target[key];

            return storage.get(key, defaults[key]);
        },
        set: (target, key, value) => {
            storage.set(key, value);
            target[key] = value;
            return true;
        }
    });

    /* Main Setup Functions */

    function setupReader() {
        function getColorSettings(colorMode) {
            const prefix = colorMode === "dark" ? "dark_" : "white_";

            return {
                fontColor: settings[prefix + "fontColor"],
                lingqBackground: settings[prefix + "lingqBackground"],
                lingqBorder: settings[prefix + "lingqBorder"],
                lingqBorderLearned: settings[prefix + "lingqBorderLearned"],
                unknownBackground: settings[prefix + "unknownBackground"],
                unknownBorder: settings[prefix + "unknownBorder"],
                playingUnderline: settings[prefix + "playingUnderline"],
            };
        }

        function createSettingsPopup() {
            const popup = createElement("div", {id: "lingqAddonSettingsPopup"});

            const dragHandle = createElement("div", {id: "lingqAddonSettingsDragHandle"});

            const dragHandleTitle = createElement("h3", {textContent: "LingQ Addon Settings"});
            dragHandle.appendChild(dragHandleTitle);

            const content = createElement("div", {style: `padding: 0 5px;`});
            const popupContentElement = generatePopupContent();
            content.appendChild(popupContentElement);

            popup.appendChild(dragHandle);
            popup.appendChild(content);

            return popup;
        }

        function generatePopupContent() {
            function addSelect(parent, id, labelText, options, selectedValue) {
                const container = createElement("div", {className: "popup-row"});
                container.appendChild(createElement("label", {htmlFor: id, textContent: labelText}));

                const select = createElement("select", {id});
                options.forEach(option => {
                    select.appendChild(createElement("option", {value: option.value, textContent: option.text, selected: selectedValue === option.value}));
                });

                container.appendChild(select);
                parent.appendChild(container);
                return container;
            }

            function addSlider(parent, id, labelText, valueId, value, unit, min, max, step) {
                const container = createElement("div", {className: "popup-row"});

                const label = createElement("label", { htmlFor: id });
                label.appendChild(document.createTextNode(labelText + " "));
                label.appendChild(createElement("span", { id: valueId, textContent: value }));
                if (unit) label.appendChild(document.createTextNode(unit));

                container.appendChild(label);
                container.appendChild(createElement("input", {type: "range", id, min, max, step, value, style: "width: 100%;"}));

                parent.appendChild(container);
                return container;
            }

            function addColorPicker(parent, id, labelText, value) {
                const container = createElement("div", {className: "popup-row"});
                container.appendChild(createElement("label", {htmlFor: id + "Text", textContent: labelText}));

                const flexContainer = createElement("div", {style: "display: flex; align-items: center;"});
                flexContainer.appendChild(createElement("div", {id: id + "Picker", className: "color-picker" }));
                flexContainer.appendChild(createElement("input", {type: "text", id: id + "Text", value, style: "margin-left: 10px;", className: "popup-input"}));

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
                const container = createElement("div", {className: "popup-row", style: "display: flex; justify-content: space-between;"});

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

            const popupLayout = createElement("div");
            const columns = createElement("div", {style: "display: flex; flex-direction: row;"});

            const container1 = createElement("div", {style: "padding: 5px; width: 350px;"});

            addSelect(container1, "styleTypeSelector", "Layout Style:", [
                { value: "video", text: "Video" },
                { value: "video2", text: "Video2" },
                { value: "audio", text: "Audio" },
                { value: "off", text: "Off" }
            ], settings.styleType);

            const videoSettings = createElement("div", {
                id: "videoSettings",
                style: `${settings.styleType === "video" ? "" : "display: none"}`
            });
            addSlider(videoSettings, "heightBigSlider", "Video Height:", "heightBigValue", settings.heightBig, "px", 300, 800, 10);
            container1.appendChild(videoSettings);

            const sentenceVideoSettings = createElement("div", {
                id: "sentenceVideoSettings",
                style: `${settings.styleType === "off" ? "" : "display: none"}`
            });
            addSlider(sentenceVideoSettings, "sentenceHeightSlider", "Sentence Video Height:", "sentenceHeightValue", settings.sentenceHeight, "px", 300, 600, 10);
            container1.appendChild(sentenceVideoSettings);

            addSlider(container1, "widgetWidthSlider", "Widget Width:", "widgetWidthValue", settings.widgetWidth, "px", 330, 500, 10);

            addSlider(container1, "fontSizeSlider", "Font Size:", "fontSizeValue", settings.fontSize, "rem", 0.8, 1.8, 0.05);
            addSlider(container1, "lineHeightSlider", "Line Height:", "lineHeightValue", settings.lineHeight, "", 1.2, 3.0, 0.1);

            const colorSection = createElement("div", {className: "popup-section"});

            addSelect(colorSection, "colorModeSelector", "Color Mode:", [
                { value: "white", text: "White" },
                { value: "dark", text: "Dark" }
            ], settings.colorMode);

            [
                { id: "fontColor", label: "Font Color:", value: colorSettings.fontColor },
                { id: "lingqBackground", label: "LingQ Background:", value: colorSettings.lingqBackground },
                { id: "lingqBorder", label: "LingQ Border:", value: colorSettings.lingqBorder },
                { id: "lingqBorderLearned", label: "LingQ Border Learned:", value: colorSettings.lingqBorderLearned },
                { id: "unknownBackground", label: "Unknown Background:", value: colorSettings.unknownBackground },
                { id: "unknownBorder", label: "Unknown Border:", value: colorSettings.unknownBorder },
                { id: "playingUnderline", label: "Playing Underline:", value: colorSettings.playingUnderline }
            ].forEach(config => addColorPicker(colorSection, config.id, config.label, config.value));

            container1.appendChild(colorSection);

            addCheckbox(container1, "autoFinishingCheckbox", "Finish Lesson Automatically", settings.autoFinishing);

            columns.appendChild(container1);

            const container2 = createElement("div", {style: "padding: 10px; width: 350px;"});

            addCheckbox(container2, "keyboardShortcutCheckbox", "Enable the Keyboard Shortcuts", settings.keyboardShortcut);

            const shortcutSection = createElement("div", {id: "keyboardShortcutSection", className: "popup-section", style: `${settings.keyboardShortcut ? "" : "display: none"}`});

            addShortcutInput(shortcutSection, "shortcutVideoFullscreenInput", "Video Fullscreen Toggle:", settings.shortcutVideoFullscreen);
            addShortcutInput(shortcutSection, "shortcutBackward5sInput", "5 Sec Backward:", settings.shortcutBackward5s);
            addShortcutInput(shortcutSection, "shortcutForward5sInput", "5 Sec Forward:", settings.shortcutForward5s);
            addShortcutInput(shortcutSection, "shortcutTTSPlayInput", "Play TTS Audio:", settings.shortcutTTSPlay);
            addShortcutInput(shortcutSection, "shortcutTranslatorOpenInput", "Open Translator:", settings.shortcutTranslator);
            addShortcutInput(shortcutSection, "shortcutMakeKnownInput", "Make Word Known:", settings.shortcutMakeKnown);
            addShortcutInput(shortcutSection, "shortcutDictionaryOpenInput", "Open Dictionary:", settings.shortcutDictionary);
            addShortcutInput(shortcutSection, "shortcutCopySelectedInput", "Copy Selected Text:", settings.shortcutCopySelected);
            addShortcutInput(shortcutSection, "shortcutMeaningInputInput", "Meaning Input Focus:", settings.shortcutMeaningInput);
            addShortcutInput(shortcutSection, "shortcutChatInputInput", "Chat Input Focus:", settings.shortcutChatInput);

            container2.appendChild(shortcutSection);

            addCheckbox(container2, "chatWidgetCheckbox", "Enable the Chat Widget", settings.chatWidget);

            const chatWidgetSection = createElement("div", {id: "chatWidgetSection", className: "popup-section", style: `${settings.chatWidget ? "" : "display: none"}`});

            addSelect(chatWidgetSection, "llmProviderModelSelector", "LLM Provider: (Price per 1M tokens)", [
                { value: "openai gpt-4.1-mini", text: "OpenAI GPT-4.1 mini ($0.4/$1.6)" },
                { value: "openai gpt-4.1-nano", text: "OpenAI GPT-4.1 nano ($0.1/$0.4)" },
                { value: "google gemini-2.5-flash-preview-05-20", text: "Google Gemini 2.5 Flash ($0.15/$0.6)" },
                { value: "google gemini-2.0-flash", text: "Google Gemini 2.0 Flash ($0.1/$0.4)" }
            ], settings.llmProviderModel);

            const apiKeyContainer = createElement("div", {className: "popup-row"});
            apiKeyContainer.appendChild(createElement("label", {htmlFor: "llmApiKeyInput", textContent: "API Key:"}));

            const apiKeyFlexContainer = createElement("div", {style: "display: flex; align-items: center;"});
            const apiKeyInput= createElement("input", {type: "password", id: "llmApiKeyInput", value: settings.llmApiKey, className: "popup-input"});
            apiKeyFlexContainer.appendChild(apiKeyInput)
            apiKeyContainer.appendChild(apiKeyFlexContainer);
            chatWidgetSection.appendChild(apiKeyContainer);

            addCheckbox(chatWidgetSection, "askSelectedCheckbox", "Enable asking with selected text", settings.askSelected);

            container2.appendChild(chatWidgetSection);

            addCheckbox(container2, "ttsCheckbox", "Enable AI-TTS", settings.tts);

            const ttsSection = createElement("div", {id: "ttsSection", className: "popup-section", style: `${settings.tts ? "" : "display: none"}`});

            const ttsApiKeyContainer = createElement("div", {className: "popup-row"});
            ttsApiKeyContainer.appendChild(createElement("label", {htmlFor: "ttsApiKeyInput", textContent: "TTS API Key:"}));

            const ttsApiKeyFlexContainer = createElement("div", {style: "display: flex; align-items: center;"});
            const ttsApiKeyInput= createElement("input", {type: "password", id: "ttsApiKeyInput", value: settings.ttsApiKey, className: "popup-input"});
            ttsApiKeyFlexContainer.appendChild(ttsApiKeyInput)
            ttsApiKeyContainer.appendChild(ttsApiKeyFlexContainer);
            ttsSection.appendChild(ttsApiKeyContainer);

            addSelect(ttsSection, "ttsVoiceSelector", "TTS Voice:", [
                { value: "openai random", text: "OpenAI Random" },
                { value: "openai alloy", text: "OpenAI Alloy" },
                { value: "openai ash", text: "OpenAI Ash" },
                { value: "openai ballad", text: "OpenAI Ballad" },
                { value: "openai coral", text: "OpenAI Coral" },
                { value: "openai echo", text: "OpenAI Echo" },
                { value: "openai fable", text: "OpenAI Fable" },
                { value: "openai onyx", text: "OpenAI Onyx" },
                { value: "openai nova", text: "OpenAI Nova" },
                { value: "openai sage", text: "OpenAI Sage" },
                { value: "openai shimmer", text: "OpenAI Shimmer" },
                { value: "openai verse", text: "OpenAI Verse" },
                { value: "google random", text: "Google Random" },
                { value: "google Zephyr", text: "Google Zephyr (Bright)" },
                { value: "google Puck", text: "Google Puck (Upbeat)" },
                { value: "google Charon", text: "Google Charon (Informative)" },
                { value: "google Kore", text: "Google Kore (Firm)" },
                { value: "google Fenrir", text: "Google Fenrir (Excitable)" },
                { value: "google Leda", text: "Google Leda (Youthful)" },
                { value: "google Orus", text: "Google Orus (Firm)" },
                { value: "google Aoede", text: "Google Aoede (Breezy)" },
                { value: "google Callirrhoe", text: "Google Callirrhoe (Easy-going)" },
                { value: "google Autonoe", text: "Google Autonoe (Bright)" },
                { value: "google Enceladus", text: "Google Enceladus (Breathy)" },
                { value: "google Iapetus", text: "Google Iapetus (Clear)" },
                { value: "google Umbriel", text: "Google Umbriel (Easy-going)" },
                { value: "google Algieba", text: "Google Algieba (Smooth)" },
                { value: "google Despina", text: "Google Despina (Smooth)" },
                { value: "google Erinome", text: "Google Erinome (Clear)" },
                { value: "google Algenib", text: "Google Algenib (Gravelly)" },
                { value: "google Rasalgethi", text: "Google Rasalgethi (Informative)" },
                { value: "google Laomedeia", text: "Google Laomedeia (Upbeat)" },
                { value: "google Achernar", text: "Google Achernar (Soft)" },
                { value: "google Alnilam", text: "Google Alnilam (Firm)" },
                { value: "google Schedar", text: "Google Schedar (Even)" },
                { value: "google Gacrux", text: "Google Gacrux (Mature)" },
                { value: "google Pulcherrima", text: "Google Pulcherrima (Forward)" },
                { value: "google Achird", text: "Google Achird (Friendly)" },
                { value: "google Zubenelgenubi", text: "Google Zubenelgenubi (Casual)" },
                { value: "google Vindemiatrix", text: "Google Vindemiatrix (Gentle)" },
                { value: "google Sadachbia", text: "Google Sadachbia (Lively)" },
                { value: "google Sadaltager", text: "Google Sadaltager (Knowledgeable)" },
                { value: "google Sulafat", text: "Google Sulafat (Warm)" }
            ], settings.ttsVoice);

            addCheckbox(ttsSection, "ttsWordCheckbox", "Enable AI-TTS for words", settings.ttsWord);
            addCheckbox(ttsSection, "ttsSentenceCheckbox", "Enable AI-TTS for sentences", settings.ttsSentence);

            container2.appendChild(ttsSection);

            columns.appendChild(container2);

            const buttonContainer = createElement("div", {style: "display: flex; justify-content: space-between;", className: "popup-row"});
            [
                {id: "resetSettingsBtn", textContent: "Reset", className: "popup-button"},
                {id: "closeSettingsBtn", textContent: "Close", className: "popup-button"}
            ].forEach((prop) => {
                buttonContainer.appendChild(createElement("button", prop));
            });

            popupLayout.appendChild(columns)
            popupLayout.appendChild(buttonContainer);
            return popupLayout;
        }

        function createDownloadWordsPopup() {
            const popup = createElement("div", {id: "lingqDownloadWordsPopup"});

            const dragHandle = createElement("div", {id: "lingqDownloadWordsDragHandle"});

            const dragHandleTitle = createElement("h3", {textContent: "Download Words"});
            dragHandle.appendChild(dragHandleTitle);

            const content = createElement("div", {style: `padding: 0 10px;`});

            [
                {id: "downloadUnknownLingqsBtn", textContent: "Download Unknown LingQs (words + phrases)", className: "popup-button"},
                {id: "downloadUnknownLingqWordsBtn", textContent: "Download Unknown LingQ Words (1, 2, 3, 4)", className: "popup-button"},
                {id: "downloadUnknownLingqPhrasesBtn", textContent: "Download Unknown LingQ Phrases (1, 2, 3, 4)", className: "popup-button"},
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

            const buttonContainer = createElement("div", {style: "display: flex; justify-content: flex-end;", className: "popup-row"});
            const closeButton = createElement("button", {id: "closeDownloadWordsBtn", textContent: "Close", className: "popup-button"});
            buttonContainer.appendChild(closeButton);
            content.appendChild(buttonContainer);

            popup.appendChild(dragHandle);
            popup.appendChild(content);

            return popup;
        }

        function makeDraggable(element, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

            if (handle) {
                handle.onmousedown = dragMouseDown;
            } else {
                element.onmousedown = dragMouseDown;
            }

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();

                if (element.style.transform && element.style.transform.includes('translate')) {
                    const rect = element.getBoundingClientRect();

                    element.style.transform = 'none';
                    element.style.top = rect.top + 'px';
                    element.style.left = rect.left + 'px';
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

                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }

        function setupSettingEventListeners() {
            function initializePickrs() {
                function setupRGBAPickr(pickerId, textId, settingKey, cssVar) {
                    function saveColorSetting(key, value) {
                        const currentColorMode = document.getElementById("colorModeSelector").value;
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
                    setupRGBAPickr('playingUnderlinePicker', 'playingUnderlineText', 'playingUnderline', '--is-playing-underline');
                });
            }

            function updateColorInputs(colorSettings) {
                document.getElementById("fontColorText").value = colorSettings.fontColor;
                document.getElementById("lingqBackgroundText").value = colorSettings.lingqBackground;
                document.getElementById("lingqBorderText").value = colorSettings.lingqBorder;
                document.getElementById("lingqBorderLearnedText").value = colorSettings.lingqBorderLearned;
                document.getElementById("unknownBackgroundText").value = colorSettings.unknownBackground;
                document.getElementById("unknownBorderText").value = colorSettings.unknownBorder;
                document.getElementById("playingUnderlineText").value = colorSettings.playingUnderline;

                const fontColorPicker = document.getElementById("fontColorPicker");
                if (fontColorPicker) fontColorPicker.style.backgroundColor = colorSettings.fontColor;

                const playingUnderlinePicker = document.getElementById("playingUnderlinePicker");
                if (playingUnderlinePicker) playingUnderlinePicker.style.backgroundColor = colorSettings.playingUnderline;
            }

            function updateColorPickerBackgrounds(colorSettings) {
                const pickerIds = [
                    { id: "lingqBackgroundPicker", color: colorSettings.lingqBackground },
                    { id: "lingqBorderPicker", color: colorSettings.lingqBorder },
                    { id: "lingqBorderLearnedPicker", color: colorSettings.lingqBorderLearned },
                    { id: "unknownBackgroundPicker", color: colorSettings.unknownBackground },
                    { id: "unknownBorderPicker", color: colorSettings.unknownBorder },
                    { id: "fontColorPicker", color: colorSettings.fontColor },
                    { id: "playingUnderlinePicker", color: colorSettings.playingUnderline }
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
                document.documentElement.style.setProperty("--lingq-background", colorSettings.lingqBackground);
                document.documentElement.style.setProperty("--lingq-border", colorSettings.lingqBorder);
                document.documentElement.style.setProperty("--lingq-border-learned", colorSettings.lingqBorderLearned);
                document.documentElement.style.setProperty("--unknown-background", colorSettings.unknownBackground);
                document.documentElement.style.setProperty("--unknown-border", colorSettings.unknownBorder);
                document.documentElement.style.setProperty("--is-playing-underline", colorSettings.playingUnderline);
            }

            function updateColorMode(event) {
                event.stopPropagation();

                const selectedColorMode = this.value;

                settings.colorMode = selectedColorMode;
                document.documentElement.style.setProperty("--background-color", selectedColorMode === "dark" ? "#2a2c2e" : "#ffffff");

                const colorSettings = getColorSettings(selectedColorMode);

                updateColorInputs(colorSettings);
                updateCssColorVariables(colorSettings);
                updateColorPickerBackgrounds(colorSettings);
                applyStyles(document.getElementById("styleTypeSelector").value, selectedColorMode);
            }

            function setupSlider(sliderId, valueId, settingKey, unit, cssVar, valueTransform) {
                const slider = document.getElementById(sliderId);
                const valueDisplay = document.getElementById(valueId);

                slider.addEventListener("input", function () {
                    const value = parseFloat(this.value);
                    const transformedValue = valueTransform(value);

                    valueDisplay.textContent = transformedValue.toString().replace(unit, '');
                    settings[settingKey] = value;
                    document.documentElement.style.setProperty(cssVar, transformedValue);
                });
            }

            const settingsButton = document.getElementById('lingqAddonSettings');
            const settingsPopup = document.getElementById('lingqAddonSettingsPopup');
            settingsButton.addEventListener("click", () => {
                settingsPopup.style.display = "block";
                initializePickrs();

                const dragHandle = document.getElementById("lingqAddonSettingsDragHandle");
                makeDraggable(settingsPopup, dragHandle);
            });

            const styleTypeSelector = document.getElementById("styleTypeSelector");
            styleTypeSelector.addEventListener("change", (event) => {
                const selectedStyleType = event.target.value;
                settings.styleType = selectedStyleType;
                document.getElementById("videoSettings").style.display = selectedStyleType === "video" ? "block" : "none";
                document.getElementById("sentenceVideoSettings").style.display = selectedStyleType === "off" ? "block" : "none";
                applyStyles(selectedStyleType, document.getElementById("colorModeSelector").value);
            });

            setupSlider("heightBigSlider", "heightBigValue", "heightBig", "px", "--height-big", (val) => `${val}px`);
            setupSlider("sentenceHeightSlider", "sentenceHeightValue", "sentenceHeight", "px", "--sentence-height", (val) => `${val}px`);
            setupSlider("widgetWidthSlider", "widgetWidthValue", "widgetWidth", "px", "--widget-width", (val) => `${val}px`);
            setupSlider("fontSizeSlider", "fontSizeValue", "fontSize", "rem", "--font-size", (val) => `${val}rem`);
            setupSlider("lineHeightSlider", "lineHeightValue", "lineHeight", "", "--line-height", (val) => val);

            document.getElementById("colorModeSelector").addEventListener("change", updateColorMode);

            const autoFinishingCheckbox = document.getElementById("autoFinishingCheckbox");
            autoFinishingCheckbox.addEventListener('change', (event) => {settings.autoFinishing = event.target.checked});

            function setupShortcutInput(inputId, settingKey) {
                const input = document.getElementById(inputId);
                if (!input) return;

                input.addEventListener("input", function() {
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

            setupShortcutInput("shortcutVideoFullscreenInput", "shortcutVideoFullscreen");
            setupShortcutInput("shortcutBackward5sInput", "shortcutBackward5s");
            setupShortcutInput("shortcutForward5sInput", "shortcutForward5s");
            setupShortcutInput("shortcutTTSPlayInput", "shortcutTTSPlay");
            setupShortcutInput("shortcutTranslatorOpenInput", "shortcutTranslator");
            setupShortcutInput("shortcutMakeKnownInput", "shortcutMakeKnown");
            setupShortcutInput("shortcutDictionaryOpenInput", "shortcutDictionary");
            setupShortcutInput("shortcutCopySelectedInput", "shortcutCopySelected");
            setupShortcutInput("shortcutMeaningInputInput", "shortcutMeaningInput");
            setupShortcutInput("shortcutChatInputInput", "shortcutChatInput");

            const chatWidgetCheckbox = document.getElementById("chatWidgetCheckbox");
            chatWidgetCheckbox.addEventListener('change', (event) => {
                const checked = event.target.checked;
                document.getElementById("chatWidgetSection").style.display = checked ? "block" : "none";
                settings.chatWidget = checked;
            });

            const llmProviderModelSelector = document.getElementById("llmProviderModelSelector");
            llmProviderModelSelector.addEventListener("change", (event) => {settings.llmProviderModel = event.target.value});

            const llmApiKeyInput = document.getElementById("llmApiKeyInput");
            llmApiKeyInput.addEventListener("change", (event) => {settings.llmApiKey = event.target.value});

            const askSelectedCheckbox = document.getElementById("askSelectedCheckbox");
            askSelectedCheckbox.addEventListener('change', (event) => {settings.askSelected = event.target.checked});

            const ttsCheckbox = document.getElementById("ttsCheckbox");
            ttsCheckbox.addEventListener('change', (event) => {
                const checked = event.target.checked;
                document.getElementById("ttsSection").style.display = checked ? "block" : "none";
                settings.tts = checked;
            });

            const ttsApiKeyInput = document.getElementById("ttsApiKeyInput");
            ttsApiKeyInput.addEventListener("change", (event) => {settings.ttsApiKey = event.target.value});

            const ttsVoiceSelector = document.getElementById("ttsVoiceSelector");
            ttsVoiceSelector.addEventListener("change", (event) => {settings.ttsVoice = event.target.value});

            const ttsWordCheckbox = document.getElementById("ttsWordCheckbox");
            ttsWordCheckbox.addEventListener('change', (event) => {settings.ttsWord = event.target.checked});

            const ttsSentenceCheckbox = document.getElementById("ttsSentenceCheckbox");
            ttsSentenceCheckbox.addEventListener('change', (event) => {settings.ttsSentence = event.target.checked});

            function resetSettings() {
                if (!confirm("Reset all settings to default?")) return;

                const currentColorMode = document.getElementById("colorModeSelector").value;
                const defaultColorSettings = getColorSettings(currentColorMode);

                document.getElementById("styleTypeSelector").value = defaults.styleType;
                document.getElementById("heightBigSlider").value = defaults.heightBig;
                document.getElementById("heightBigValue").textContent = defaults.heightBig;
                document.getElementById("sentenceHeightSlider").value = defaults.sentenceHeight;
                document.getElementById("sentenceHeightValue").textContent = defaults.sentenceHeight;
                document.getElementById("widgetWidthSlider").value = defaults.widgetWidth;
                document.getElementById("widgetWidthValue").value = defaults.widgetWidth;
                document.getElementById("fontSizeSlider").value = defaults.fontSize;
                document.getElementById("fontSizeValue").textContent = defaults.fontSize;
                document.getElementById("lineHeightSlider").value = defaults.lineHeight;
                document.getElementById("lineHeightValue").textContent = defaults.lineHeight;

                updateColorInputs(defaultColorSettings);
                updateColorPickerBackgrounds(defaultColorSettings);
                applyStyles(defaults.styleType, currentColorMode);

                document.getElementById("videoSettings").style.display = defaults.styleType === "video" ? "block" : "none";
                document.getElementById("sentenceVideoSettings").style.display = defaults.styleType === "off" ? "block" : "none";

                document.documentElement.style.setProperty("--font-size", `${defaults.fontSize}rem`);
                document.documentElement.style.setProperty("--line-height", defaults.lineHeight);
                document.documentElement.style.setProperty("--height-big", `${defaults.heightBig}px`);
                document.documentElement.style.setProperty("--sentence-height", `${defaults.sentenceHeight}px`);
                document.documentElement.style.setProperty("--widget-width", `${defaults.widgetWidth}px`);
                updateCssColorVariables(defaultColorSettings);

                document.getElementById("autoFinishingCheckbox").checked = defaults.autoFinishing;

                document.getElementById("keyboardShortcutCheckbox").value = defaults.keyboardShortcut;
                document.getElementById("shortcutVideoFullscreenInput").value = defaults.shortcutVideoFullscreen;
                document.getElementById("shortcutBackward5sInput").value = defaults.shortcutBackward5s;
                document.getElementById("shortcutForward5sInput").value = defaults.shortcutForward5s;
                document.getElementById("shortcutTTSPlayInput").value = defaults.shortcutTTSPlay;
                document.getElementById("shortcutTranslatorOpenInput").value = defaults.shortcutTranslator;
                document.getElementById("shortcutMakeKnownInput").value = defaults.shortcutMakeKnown;
                document.getElementById("shortcutDictionaryOpenInput").value = defaults.shortcutDictionary;
                document.getElementById("shortcutCopySelectedInput").value = defaults.shortcutCopySelected;
                document.getElementById("shortcutMeaningInputInput").value = defaults.shortcutMeaningInput;
                document.getElementById("shortcutChatInputInput").value = defaults.shortcutChatInput;

                document.getElementById("chatWidgetCheckbox").value = defaults.chatWidget;
                document.getElementById("llmProviderModelSelector").value = defaults.llmProviderModel;
                document.getElementById("llmApiKeyInput").value = defaults.llmApiKey;
                document.getElementById("askSelectedCheckbox").value = defaults.askSelected;

                document.getElementById("ttsCheckbox").value = defaults.tts;
                document.getElementById("ttsApiKeyInput").value = defaults.ttsApiKey;
                document.getElementById("ttsVoiceSelector").value = defaults.ttsVoice;
                document.getElementById("ttsWordCheckbox").value = defaults.ttsWord;
                document.getElementById("ttsSentenceCheckbox").value = defaults.ttsSentence;

                for (const [key, value] of Object.entries(defaults)) {
                    settings[key] = value
                }
            }

            document.getElementById("resetSettingsBtn").addEventListener("click", resetSettings);

            document.getElementById("closeSettingsBtn").addEventListener("click", () => {settingsPopup.style.display = "none"});
        }

        async function setupDownloadWordsEventListeners() {
            async function getAllWords(baseUrl, pageSize, apiType, additionalParams="", progressCallback = () => {}) {
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

            async function downloadWords(baseUrl, pageSize, fileName, apiType, additionalParams="") {
                const progressContainer = document.getElementById("downloadProgressContainer");
                const progressBar = document.getElementById("downloadProgressBar");
                const progressText = document.getElementById("downloadProgressText");

                if (progressContainer && progressBar && progressText) {
                    progressBar.value = 0;
                    progressBar.max = 100;
                    progressText.textContent = "Initializing download...";
                    progressContainer.style.display = "block";
                }

                const progressCallback = (currentPage, totalPages,_isDone, error_isErrorEncountered, totalCount) => {
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
                        blob = new Blob([dataString], { type: 'application/json' });
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
                        blob = new Blob([dataString], { type: 'text/csv' });
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
        }

        function setupLessonCompletion() {
            document.getElementById("lingqLessonComplete").addEventListener("click", finishLesson);
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

            switch (settings.styleType) {
                case "video":
                    specificCSS = generateVideoCSS();
                    break;
                case "video2":
                    specificCSS = generateVideo2CSS();
                    break;
                case "audio":
                    specificCSS = generateAudioCSS();
                    break;
                case "off":
                    specificCSS = generateOffModeCSS();
                    layoutCSS = "";
                    break;
            }

            baseCSS += layoutCSS;
            baseCSS += specificCSS;

            if (styleElement) {
                styleElement.remove();
                styleElement = null;
            }

            styleElement = createElement("style", {textContent: baseCSS});
            document.querySelector("head").appendChild(styleElement);
        }

        function generateBaseCSS(colorSettings) {
            return`
                :root {
                    --font-size: ${settings.fontSize}rem;
                    --line-height: ${settings.lineHeight};
        
                    --font-color: ${colorSettings.fontColor};
                    --lingq-background: ${colorSettings.lingqBackground};
                    --lingq-border: ${colorSettings.lingqBorder};
                    --lingq-border-learned: ${colorSettings.lingqBorderLearned};
                    --unknown-background: ${colorSettings.unknownBackground};
                    --unknown-border: ${colorSettings.unknownBorder};
                    --is-playing-underline: ${colorSettings.playingUnderline};
        
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
                    z-index: 10001 !important;
                }
        
                .pcr-app .pcr-interaction .pcr-result {
                    color: var(--font-color) !important;
                }
        
                /*Popup settings*/
        
                #lingqAddonSettings {
                    color: var(--font-color);
                }
        
                #lingqAddonSettingsPopup, #lingqDownloadWordsPopup {
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
        
                #lingqAddonSettingsDragHandle, #lingqDownloadWordsDragHandle {
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
                    margin-left: 10px;
                    padding: 5px;
                }
        
                .popup-button {
                    padding: 5px 10px;
                    border: 1px solid rgb(125, 125, 125, 50%);
                    border-radius: 5px;
                    margin: 5px 0;
                    
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
        
                /*Chat*/
        
                #chat-container {
                    margin-bottom:5px;
                    border: 1px solid rgb(125 125 125 / 35%);
                    border-radius: 5px;
                    min-height: 100px;
                    max-height: 300px;
                    overflow-y: auto;
                    resize: vertical;
                    padding: 5px !important;
                    scrollbar-width: none !important;
                }
        
                .input-container {
                    display: flex;
                    margin-bottom:10px;
                }
        
                #user-input {
                    flex-grow: 1;
                    padding: 5px 10px;
                    margin-right: 5px;
                    border: 1px solid rgb(125 125 125 / 35%);
                    border-radius: 5px;
                    font-size: 0.9rem;
                }
        
                #send-button {
                    padding: 5px 10px;
                    border: 1px solid rgb(125 125 125 / 35%);
                    border-radius: 5px;
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
                    background-color: rgb(125 125 125 / 10%);
                }
                
                @keyframes gradient-move {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                
                .loading-message {
                    background: linear-gradient(
                        90deg, 
                        rgb( from var(--font-color) r g b / 0.5) 0%, 
                        var(--font-color) 50%, 
                        rgb( from var(--font-color) r g b / 0.5) 100%
                    );
                    background-size: 200% 200%;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradient-move 3s linear infinite;
                }
                
                #chat-container li {
                    list-style: inside !important;
                }
                
                #chat-container ui {
                    margin-top: 0.5rem;
                }
                
                #chat-container hr {
                    margin: 0.3rem 0 0.5rem;
                    border: 0;
                    height: 1px;
                    background-color: rgb(125 125 125 / 50%);
                }
                
                /*tts*/
                
                #playAudio {
                    cursor: pointer;
                    font-size: 1.5rem;
                    padding: 5px;
                }
        
                /*font settings*/
        
                .reader-container {
                    line-height: var(--line-height) !important;
                    font-size: var(--font-size) !important;
                    padding: 0 !important;
                }
        
                .sentence-text-head {
                    min-height: 4.5rem !important;
                }
        
                .reader-container p {
                    margin-top: 0 !important;
                }
        
                .reader-container p span.sentence-item,
                .reader-container p .sentence {
                    color: var(--font-color) !important;
                }
        
                .sentence.is-playing,
                .sentence.is-playing span {
                    text-underline-offset: .2em !important;
                    text-decoration-color: var(--is-playing-underline) !important;
                }
        
                /*highlightings*/
        
                .phrase-item {
                    padding: 0 !important;
                }
        
                .phrase-item:not(.phrase-item-status--4, .phrase-item-status--4x2) {
                    background-color: var(--lingq-background) !important;
                }
        
                .phrase-item.phrase-item-status--4,
                .phrase-item.phrase-item-status--4x2 {
                    background-color: rgba(0, 0, 0, 0) !important;
                }
        
                .phrase-cluster:not(:has(.phrase-item-status--4, .phrase-item-status--4x2)) {
                    border: 1px solid var(--lingq-border) !important;
                    border-radius: .25rem;
                }
        
                .phrase-cluster:has(.phrase-item-status--4, .phrase-item-status--4x2) {
                    border: 1px solid var(--lingq-border-learned) !important;
                    border-radius: .25rem;
                }
        
                .reader-container .sentence .lingq-word:not(.is-learned) {
                    border: 1px solid var(--lingq-border) !important;
                    background-color: var(--lingq-background) !important;
                }
        
                .reader-container .sentence .lingq-word.is-learned {
                    border: 1px solid var(--lingq-border-learned) !important;
                }
        
                .reader-container .sentence .blue-word {
                    border: 1px solid var(--unknown-border) !important;
                    background-color: var(--unknown-background) !important;;
                }
        
                .phrase-cluster:hover,
                .phrase-created:hover {
                    padding: 0 !important;
                }
        
                .phrase-cluster:hover .phrase-item,
                .phrase-created .phrase-item {
                    padding: 0 !important;
                }
        
                .reader-container .sentence .selected-text {
                    padding: 0 !important;
                }
            `;
        }

        function generateLayoutCSS() {
            return `
        :root {
            --article-height: calc(var(--app-height) - var(--height-big));
            --header-height: 50px;
            --widget-width: ${settings.widgetWidth}px;
            --footer-height: 80px;
            --reader-layout-columns: 1fr var(--widget-width);
            --reader-layout-rows: var(--article-height) calc(var(--height-big) - var(--footer-height)) var(--footer-height);
        }

        /*header settings*/

        .main-wrapper {
            padding: 0 !important;
        }

        #main-nav {
            z-index: 1;
        }

        #main-nav > nav {
            height: var(--header-height);
        }

        #main-nav > nav > div:nth-child(1) {
            height: var(--header-height);
        }

        .main-header {
            pointer-events: none;
        }

        .main-header > div {
            grid-template-columns: 1fr 150px !important;
            padding: 0 100px 0 420px !important;
        }

        .main-header section:nth-child(1) {
            display: none;
        }

        .main-header section {
            pointer-events: auto;
            z-index: 1;
        }

        .main-header svg {
            width: 20px !important;
            height: 20px !important;
        }

        .main-header section .dropdown-content {
            position: fixed;
        }

        .lesson-progress-section {
            grid-template-rows: unset !important;
            grid-template-columns: unset !important;
            grid-column: 1 !important;
            pointer-events: auto;
        }

        .lesson-progress-section .rc-slider{
            grid-row: unset !important;
            grid-column: unset !important;
            width: 50% !important;
        }

        /*layout*/

        #lesson-reader {
            grid-template-columns: var(--reader-layout-columns);
            grid-template-rows: var(--reader-layout-rows);
            overflow: hidden;
            height: auto !important;
        }

        .sentence-text {
            height: calc(var(--article-height) - var(--header-height)) !important;
            padding: 0 0 20px !important;
        }

        .reader-container-wrapper {
            height: 100% !important;
        }

        .widget-area {
            padding: var(--header-height) 0 10px !important;
            margin: 0 10px !important;
            height: 100% !important;
            justify-content: center;
            display: flex;
        }

        .reader-widget {
            display: flow !important;
            overflow-y: auto;
            width: 100% !important;
            height: fit-content !important;
            max-width: none !important;
            scrollbar-width: none !important;
        }

        .reader-widget:not(.reader-widget--resources) {
            padding: 10px !important;
        }
        
        .reader-widget.reader-widget--resources {
            padding: 10px 15px !important;
        }
        
        .reference-main {
            margin-bottom: 5px;
        }
        
        .reference-word {
            white-space: pre-line !important;
        }
        
        .section-widget--main {
            margin: 0 !important;
            padding: 0 !important;
        }
        
        .appCue-poular-hints {
            max-height: 350px;
            overflow-y: auto;
            scrollbar-width: none !important;
        }
        
        .reference-input-text {
            font-size: 0.9rem !important;
            scrollbar-width: none !important;
        }
        
        .section-widget--foot {
            margin: 0 !important;
            padding: 10px 0 0 !important;
            display: block !important;
        }
        
        .dictionary-resources {
            width: 100% !important;
        }
        
        .word-status-bar {
            width: 100%;
            grid-template-columns: repeat(6, 1fr) !important;
            grid-gap: 10px !important;
        }
        
        .reference-helpers {
            display: none !important;
        }
        
        .userToast {
            position: fixed;
            top: 60px;
            right: 20px;
            background-color: var(--background-color);
            color: ${settings.colorMode === "dark" ? "white" : "#ffffff"};
            padding: 5px 10px;
            border-radius: 10px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            font-size: 0.8rem;
            font-weight: lighter;
            pointer-events: none;
        }
        
        .main-footer {
            grid-area: 3 / 1 / 3 / 1 !important;
            align-self: end;
            padding: 5px 10px 10px;
            height: 100%;
        }
        
        .main-footer > div {
            height: 100%;
        }
        
        .lesson-bottom > div {
            position: unset !important;
        }

        .main-content {
            grid-template-rows: var(--header-height) 1fr !important;
            overflow: hidden;
            align-items: center;
        }

        /*make prev/next page buttons compact*/

        .reader-component {
            grid-template-columns: 0 1fr 0 !important;
            align-items: baseline;
        }

        .reader-component > div > a.button > span {
            width: 0.5rem !important;
        }

        .reader-component > div > a.button > span > svg {
            width: 15px !important;
            height: 15px !important;
        }

        .loadedContent {
            padding: 0 0 0 10px !important;;
        }

        /*font settings*/

        .reader-container {
            margin: 0 !important;
            float: left !important;
            columns: unset !important;
            overflow-y: scroll !important;
            max-width: unset !important;
        }

        /*video viewer*/

        .video-player {
            display: flex !important;
            justify-content: flex-end !important;
            pointer-events: none;
            z-index: 38 !important;
        }

        .video-player > .modal-background {
            background-color: rgb(26 28 30 / 0%) !important;
        }

        .video-player > .modal-content {
            max-width: var(--width-big) !important;
            margin: 0 0 10px 10px !important;
            border-radius: 0.75rem !important;
        }

        .video-player .modal-section {
            display: none !important;
        }

        .video-wrapper {
            height: var(--height-big) !important;
            overflow: hidden;
            pointer-events: auto;
        }

        /*video controller*/

        .rc-slider-rail {
            background-color: dimgrey !important;
        }

        .rc-slider-step {
            margin-top: -8px !important;
            height: 1.2rem !important;
        }

        .lingq-audio-player {
            margin-left: 10px;
        }

        .section--player.is-expanded {
            width: 100% !important;
            height: 100%;
            padding: 0 !important;
        }

        .sentence-mode-button {
            margin: 0 0 10px 0;
        }

        .player-wrapper {
            grid-template-columns: 1fr 40px !important;
            padding: 0 !important;
        }

        .audio-player {
            padding: 0 0.5rem !important;
            grid-template-rows: 16px 16px auto !important;
        }

        .audio-player--controllers {
            grid-gap: unset !important;
        }

        .audio-player--controllers a {
            height: 25px !important;
            padding: 0 1em !important;
            margin: 5px 0;
        }
        
        .audio-player--controllers span {
            height: 25px !important;
        }
        `;
        }

        function generateVideoCSS() {
            return `
        :root {
            --width-big: calc(100vw - var(--widget-width) - 10px);
            --height-big: ${settings.heightBig}px;
        }

        .main-content {
            grid-area: 1 / 1 / 2 / 2 !important;
        }

        .widget-area {
            grid-area: 1 / 2 / 3 / 2 !important;
        }

        .main-footer {
            grid-area: 3 / 2 / 4 / 3 !important;
            align-self: end;
        }
        
        .video-player {
            align-items: flex-start !important;
        }
        `;
        }

        function generateVideo2CSS() {
            return `
        :root {
            --width-big: calc(50vw - calc(var(--widget-width) / 2) - 10px);
            --height-big: calc(100vh - 65px);

            --reader-layout-columns: 1fr var(--widget-width) 1fr;
            --reader-layout-rows: var(--article-height) var(--footer-height);
            --article-height: calc(var(--app-height) - var(--footer-height));
        }

        #lesson-reader {
            grid-template-columns: var(--reader-layout-columns);
        }

        .main-content {
            grid-area: 1 / 1 / 2 / 2 !important;
        }

        .widget-area {
            grid-area: 1 / 2 / 2 / 3 !important;
        }

        .main-footer {
            grid-area: 2 / 2 / 3 / 3 !important;
            align-self: end;
        }

        .video-player {
            align-items: end !important;
        }
        `;
        }

        function generateAudioCSS() {
            return `
        :root {
            --width-big: calc(var(--widget-width) - 20px);
            --height-big: cald(var(--footer-height) - 10px);
            
            --reader-layout-rows: var(--article-height) var(--footer-height);
            --article-height: calc(var(--app-height) - var(--footer-height));
        }

        .main-content {
            grid-area: 1 / 1 / 2 / 2 !important;
        }

        .widget-area {
            grid-area: 1 / 2 / 2 / 2 !important;
        }
        
        .main-footer {
            grid-area: 2 / 1 / 3 / 2 !important;
            align-self: end;
        }
        
        .video-player {
            align-items: end !important;
        }
        
        .video-player > .modal-content {
            margin: 0 10px 10px !important;
        }
        `;
        }

        function generateOffModeCSS() {
            return `
        :root {
            --width-small: 440px;
            --height-small: 260px;
            --sentence-height: ${settings.sentenceHeight}px;
            --right-pos: 0.5%;
            --bottom-pos: 5.5%;
        }

        /*video player*/

        .video-player.is-minimized .video-wrapper,
        .sent-video-player.is-minimized .video-wrapper {
            height: var(--height-small);
            width: var(--width-small);
            overflow: auto;
            resize: both;
        }

        .video-player.is-minimized .modal-content,
        .sent-video-player.is-minimized .modal-content {
            max-width: calc(var(--width-small)* 3);
            margin-bottom: 0;
        }

        .video-player.is-minimized,
        .sent-video-player.is-minimized {
            left: auto;
            top: auto;
            right: var(--right-pos);
            bottom: var(--bottom-pos);
            z-index: 99999999;
            overflow: visible
        }

        /*sentence mode video player*/
        .loadedContent:has(#sentence-video-player-portal) {
            grid-template-rows: var(--sentence-height) auto auto 1fr !important;
        }

        #sentence-video-player-portal .video-section {
            width: 100% !important;
            max-width: none !important;
        }

        #sentence-video-player-portal .video-wrapper {
            height: 100% !important;
            max-height: none !important;
        }

        #sentence-video-player-portal div:has(> iframe) {
            height: 100% !important;
        }
        `;
        }

        const colorSettings = getColorSettings(settings.colorMode);

        let styleElement = null;

        const settingsButton = createElement("button", {
            id: "lingqAddonSettings",
            textContent: "⚙️",
            title: "LingQ Addon Settings",
            className: "nav-button"
        });

        const completeLessonButton = createElement("button", {
            id: "lingqLessonComplete",
            textContent: "✔",
            title: "Complete Lesson Button",
            className: "nav-button"
        });

        const downloadWordsButton = createElement("button", {
            id: "lingqDownloadWords",
            textContent: "💾",
            title: "Download Words",
            className: "nav-button"
        });

        let mainNav = document.querySelector("#main-nav > nav > div:nth-child(2) > div:nth-child(1)");

        if (mainNav) {
            mainNav.appendChild(settingsButton);
            mainNav.appendChild(downloadWordsButton);
            mainNav.appendChild(completeLessonButton);
        } else {
            console.error("#main-nav element not found. Buttons not inserted.");
        }

        const settingsPopup = createSettingsPopup();
        document.body.appendChild(settingsPopup);

        const downloadWordsPopup = createDownloadWordsPopup();
        document.body.appendChild(downloadWordsPopup);

        setupSettingEventListeners();
        setupDownloadWordsEventListeners();
        setupLessonCompletion();

        applyStyles();
    }

    async function setupCourse() {
        function createCourseUI(){
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
            const styleElement = createElement("style", { textContent: css });
            document.querySelector("head").appendChild(styleElement);
        }

        function enrichLessonDetails() {
            function addKnownWordsIndicator(lessonElement, lessonInfo) {
                const dynamicWordProgress = lessonElement.querySelector('.dynamic--word-progress');

                const knownWordPercentage = Math.round((lessonInfo.knownWordsCount / lessonInfo.uniqueWordsCount) * 100);

                const knownWordsItem = createElement('div', {className: 'word-indicator--item grid-layout grid-align--center grid-item is-fluid--left', title: 'Known Words'});

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

    /* Get LingQ Data */

    function getLessonId() {
        const url = document.URL;
        const regex = /https*:\/\/www\.lingq\.com\/\w+\/learn\/\w+\/web\/reader\/(\d+)/;
        const match = url.match(regex);

        return match[1];
    }

    function getCollectionId() {
        const url = document.URL;
        const regex = /https*:\/\/www\.lingq\.com\/\w+\/learn\/\w+\/web\/library\/course\/(\d+)/;
        const match = url.match(regex);

        return match[1];
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

    async function getDictionaryLocalePairs() {
        const url = `https://www.lingq.com/api/v2/dictionary-locales/`;

        const response = await fetch(url);
        const data = await response.json();

        return Object.fromEntries(data.map(item => [item.code, item.title]));
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
        const payload = { wordIndex: wordIndex, completedWordIndex: wordIndex, client: 'web' };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    /* Utils */

    function createElement(tag, props = {}) {
        const element = document.createElement(tag);
        Object.entries(props).forEach(([key, value]) => {
            if (key === "style" && typeof value === "string") {
                element.style.cssText = value;
            } else if (key === "textContent") {
                element.textContent = value;
            } else {
                element[key] = value;
            }
        });
        return element;
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

    function waitForElement(selector, timeout=1000) {
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
        const selected_text = document.querySelector(".reference-word");
        if (selected_text) {
            navigator.clipboard.writeText(selected_text.textContent);
        }
    }

    function extractTextFromDOM(domElement) {
        function getAllLeafNodes(root) {
            const leaves = [];
            function traverse(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.trim() !== "") leaves.push(node);
                    return;
                }
                if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    if (node.childNodes.length === 0) {
                        leaves.push(node);
                        return;
                    }
                    for (const child of node.childNodes) {
                        traverse(child);
                    }
                }
            }
            traverse(root);
            return leaves;
        }

        const textParts = [];
        let sentenceElements = domElement.querySelectorAll('.sentence');
        sentenceElements = sentenceElements.length ? sentenceElements : [domElement];
        if (domElement.childNodes.length === 0) return null;

        sentenceElements.forEach(sentenceElement => {
            for (const childNode of getAllLeafNodes(sentenceElement)) {
                const text = childNode.textContent.trim();
                if (text) textParts.push(text);

                const parentNodeType = childNode.parentNode.nodeType;
                if (parentNodeType === Node.ELEMENT_NODE && childNode.parentNode.matches('.has-end-punctuation-question')) textParts.push('?');
                if (parentNodeType === Node.ELEMENT_NODE && childNode.parentNode.matches('.has-end-punctuation-period')) textParts.push('.');
            }
            textParts.push('\n');
        });

        return textParts.slice(0, -1).join(' ')
            .replace(/[^\S\n]?(\?|\.|\n)[^\S\n]?/g, '$1')
            .replace(/[^\S\n]?(,)/g, '$1');
    }

    function showToast(inputMessage, success=true) {
        const toast = createElement("div", {
            className: 'userToast',
            textContent: inputMessage,
            style: `box-shadow: 0 0 10px 0 ${success ? 'rgb(76, 175, 80)': 'rgb(175, 76, 80)'}`
        });
        document.body.appendChild(toast);

        setTimeout(() => {toast.style.opacity = '1'}, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(toast.remove, 1000);
        }, 1500);
    }

    function finishLesson(){
        clickElement(".reader-component > .nav--right > a");
    }

    function preventPropagation(event){
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

    function smoothScrollTo(element, to, duration) {
        const start = element.scrollTop;
        const change = to - start;
        const startTime = performance.now();

        function easeInOutCubic(t) {
            t *= 2;
            if (t < 1) return 0.5 * t * t * t;
            t -= 2;
            return 0.5 * (t * t * t + 2);
        }

        function animateScroll(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            element.scrollTop = start + change * easedProgress;

            if (elapsedTime < duration) {
                requestAnimationFrame(animateScroll);
            } else {
                element.scrollTop = to;
            }
        }
        requestAnimationFrame(animateScroll);
    }

    function getRandomElement(arr) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        return arr?.[randomIndex];
    }

    /* Features */

    function setupKeyboardShortcuts() {
        document.addEventListener("keydown", function (event) {
            if (!settings.keyboardShortcut) return;

            const targetElement = event.target;
            const isTextInput = targetElement.localName === "text" || targetElement.localName === "textarea" || targetElement.localName === "input";
            const withoutModifierKeys = !event.ctrlKey && !event.shiftKey && !event.altKey;
            const eventKey = event.key.toLowerCase();
            if (isTextInput) {
                if (targetElement.id === "user-input") return;
                if ((eventKey === 'enter' || eventKey === 'escape') && withoutModifierKeys) {
                    preventPropagation(event);
                    event.target.blur()
                } else {
                    event.stopPropagation();
                    return;
                }
            }

            const shortcuts = {
                [settings.shortcutVideoFullscreen]: () => clickElement(".modal-section > div > button:nth-child(2)"), // video full screen toggle
                [settings.shortcutMeaningInput]: () => focusElement(".reference-input-text"), // Move cursor to meaning input
                [settings.shortcutChatInput]: () => focusElement("#user-input"), // Move cursor to the chat widget input
                [settings.shortcutTTSPlay]: () => clickElement(".is-tts"), // Play tts audio
                [settings.shortcutTranslator]: () => clickElement(".dictionary-resources > a:nth-last-child(1)"), // Open Translator
                [settings.shortcutBackward5s]: () => clickElement(".audio-player--controllers > div:nth-child(1) > a"), // 5 sec Backward
                [settings.shortcutForward5s]: () => clickElement(".audio-player--controllers > div:nth-child(2) > a"), // 5 sec Forward
                [settings.shortcutMakeKnown]: () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k" })), // Simulate original 'k' for Make Word Known
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
        async function changeVideoPlayerSettings() {
            const iframe = await waitForElement('.modal-container iframe', 1000);
            let src = iframe.getAttribute("src");
            src = src.replace("disablekb=1", "disablekb=0");
            src = src + "&cc_load_policy=1";
            src = src + "&controls=0";
            iframe.setAttribute("src", src);
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

            const lessonId = getLessonId();
            const lessonInfo = await getLessonInfo(lessonId);
            let lastCompletedPercentage = lessonInfo["progress"];
            console.log(`last progress: ${lastCompletedPercentage}`);

            const sliderTrack = document.querySelector('.audio-player--progress .rc-slider-track');

            const videoContainer = document.querySelector(".modal-content > div");
            const sliderContainer = createSliderElements();
            const videoSliderTrack = sliderContainer.querySelector(".rc-slider-track");
            videoContainer.appendChild(sliderContainer);

            const updateLessonProgress = (lessonId, lessonInfo, progressPercentage, lastCompletedPercentage) => {
                const progressUpdatePeriod = 5;
                const flooredProgressPercentage = Math.floor(progressPercentage / progressUpdatePeriod) * progressUpdatePeriod;

                if (flooredProgressPercentage > lastCompletedPercentage) {
                    console.log('Slider', `progress percentage: ${flooredProgressPercentage}`);
                    const wordIndex = Math.floor(lessonInfo["totalWordsCount"] * (flooredProgressPercentage / 100));
                    setLessonProgress(lessonId, wordIndex);
                    return flooredProgressPercentage;
                }
                return lastCompletedPercentage;
            };

            const sliderObserver = new MutationObserver(function (mutations) {
                for (const mutation of mutations) {
                    console.debug('Observer:', `Slider Changed. ${mutation.type}, ${mutation.attributeName}`);
                    videoSliderTrack.style.cssText = sliderTrack.style.cssText;

                    const progressPercentage = parseFloat(sliderTrack.style.width);
                    lastCompletedPercentage = updateLessonProgress(lessonId, lessonInfo, progressPercentage, lastCompletedPercentage);

                    const isLessonFinished = progressPercentage >= 99.5;
                    if (isLessonFinished && settings.autoFinishing) {
                        console.log('Slider', 'lesson finished.')
                        setTimeout(finishLesson, 1000);
                        sliderObserver.disconnect();
                    }
                }
            });

            sliderObserver.observe(sliderTrack, {attributes: true, attributeFilter: ['style']});
        }

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach((mutation) => {
                console.debug('Observer:', `Modal container created. ${mutation.type}`, mutation.addedNodes)
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;

                    if (!node.matches(".modal-container")) return;
                    changeVideoPlayerSettings();
                    clickElement('.modal-section  button:nth-child(2)[title="Expand"]');
                    setupSliderObserver();
                });
            });
        });

        observer.observe(document.body, {childList: true});
    }

    async function setupReaderContainer() {
        async function setupSentenceFocus(readerContainer) {
            function focusPlayingSentence() {
                const playingSentence = document.querySelector(".sentence.is-playing");
                if (playingSentence) {
                    const scrolling_div = document.querySelector(".reader-container")
                    const targetScrollTop = playingSentence.offsetTop + Math.floor(playingSentence.offsetHeight / 2) - Math.floor(scrolling_div.offsetHeight / 2);
                    smoothScrollTo(scrolling_div, targetScrollTop, 300);
                }
            }

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    console.debug('Observer:', `Reader container subtree attribute change. ${mutation.type}, ${mutation.attributeName}`)
                    if (!mutation.target.matches(".sentence")) return;
                    focusPlayingSentence();
                });
            });
            observer.observe(readerContainer, {attributes: true, subtree: true, attributeFilter: ['class']});
        }

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach((mutation) => {
                console.debug('Observer:', `Sentence text child created. ${mutation.type}`, mutation.addedNodes);
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (!node.matches(".loadedContent")) return;

                    changeScrollAmount(".reader-container", 0.3);
                    setupSentenceFocus(node);
                });
            });
        });

        const sentenceText = await waitForElement('.sentence-text', 1000);
        observer.observe(sentenceText, {childList: true});
    }

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
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

        console.log('TTS', `${modelId}, ${voice}`);

        if (!API_KEY) throw new Error("Invalid or missing OpenAI API key. Please set the API_KEY");

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

    async function googleTTS(text, API_KEY, voice = "Zephyr", ttsInstructions) {
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
            view.setUint32(40, dataLength, true); // Subchunk2Size (실제 오디오 데이터 크기)

            return view.buffer;
        }

        const modelId = "gemini-2.5-flash-preview-tts";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;

        if (!API_KEY) throw new Error("Invalid or missing Google API key. Please set the API_KEY");

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: ttsInstructions + text }]
                    }],
                    generationConfig: {
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: voice }
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

            if (!audioDataBase64) {
                console.error("Google TTS response:", data.candidates?.[0]);
                throw new Error("No audio data found in Google TTS response.");
            }

            const inputTokens = data.usageMetadata.promptTokenCount;
            const outputTokens = data.usageMetadata.candidatesTokenCount;
            const approxCost = inputTokens * 0.5/1000000 + outputTokens * 10/1000000;
            console.log('TTS', `${modelId}, ${voice}, tokens: (${inputTokens}/${outputTokens}) cost: $${approxCost.toFixed(6)}`);

            const binaryString = atob(audioDataBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);

            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const wavHeader = createWavHeader(bytes.length);

            const completeBuffer = new Uint8Array(wavHeader.byteLength + bytes.byteLength);
            completeBuffer.set(new Uint8Array(wavHeader), 0);
            completeBuffer.set(bytes, wavHeader.byteLength);

            return completeBuffer.buffer; // 완성된 WAV 형식의 ArrayBuffer 반환

        } catch (error) {
            console.error("Error during Google TTS request:", error);
            throw error;
        }
    }

    async function setupLLMs() {
        async function updateWidget() {
            function getSectionHead() {
                let targetSectionHead = document.querySelector("#lesson-reader .widget-area > .reader-widget > .section-widget--head");
                targetSectionHead = targetSectionHead ? targetSectionHead : document.querySelector("#lesson-reader .widget-area > .reader-widget");
                return targetSectionHead;
            }

            function getSelectedWithContext() {
                const selectedTextElement = document.querySelector(".reference-word");
                const contextElement = document.querySelector("span.selected-text, span.is-selected")?.closest('.sentence');
                const selectedText = selectedTextElement ? extractTextFromDOM(selectedTextElement).trim() : "";
                const contextText = contextElement ? extractTextFromDOM(contextElement).trim() : "";

                return `Input: "${selectedText}"` +  (!isSentence ? `, Context: "${contextText}"` : ``);
            }

            let isProgrammaticReferenceWordUpdate = false;
            function updateReferenceWord(){
                isProgrammaticReferenceWordUpdate = true;
                const selection = window.getSelection();
                if (selection.rangeCount === 0) {
                    console.log('Selection rangeCount is zero.')
                    return;
                }

                const referenceWord = document.querySelector(".reference-word");
                const extractedText = extractTextFromDOM(selection.getRangeAt(0).cloneContents());
                if (referenceWord && extractedText && isSentence) {
                    referenceWord.textContent = extractedText;
                }
                isProgrammaticReferenceWordUpdate = false;
            }

            function updateChatHistoryState(currentHistory, message, role) {
                return [...currentHistory, { role: role, content: message }];
            }

            function addMessageToUI(message, messageClass, container) {
                const messageDiv = createElement("div", {
                    className: `chat-message ${messageClass}`,
                    innerHTML: message
                });
                container.appendChild(messageDiv);
                smoothScrollTo(container, container.scrollHeight, 300);
            }

            function getLLMPricing(llmProviderModel) {
                const llmInfo = document.querySelector(`#llmProviderModelSelector > option[value="${llmProviderModel}"]`).text;
                const [inputPrice, outputPrice] = llmInfo.match(/\$(\d+(?:\.\d+)?)\/\$(\d+(?:\.\d+)?)\)/).slice(1, 3).map(num => parseFloat(num)/1000000);
                return [inputPrice, outputPrice];
            }

            async function getOpenAIResponse(apiKey, model, history) {
                try {
                    const api_url = `https://api.openai.com/v1/chat/completions`;
                    const response = await fetch(
                        api_url,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: history,
                                max_tokens: 500,
                                temperature: 0.7,
                            })
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('OpenAI API error:', errorData);
                        throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
                    }

                    const data = await response.json();

                    const [inputPrice, outputPrice] = getLLMPricing(settings.llmProviderModel);
                    const inputTokens = data.usage.prompt_tokens;
                    const cachedTokens = data.usage.prompt_tokens_details.cached_tokens;
                    const outputTokens = data.usage.completion_tokens;
                    const approxCost = (inputTokens - cachedTokens) * inputPrice + cachedTokens * (inputPrice/4) + outputTokens * outputPrice;
                    console.log('Chat', `${model}, tokens: (${inputTokens-cachedTokens}/${cachedTokens}/${outputTokens}), cost: $${approxCost.toFixed(6)}`);

                    return data.choices[0]?.message?.content || "Sorry, could not get a response.";

                } catch (error) {
                    console.error('OpenAI API call failed:', error);
                    return "Sorry, something went wrong communicating with OpenAI.";
                }
            }

            async function getGoogleResponse(apiKey, model, history) {
                try {
                    const formattedMessages = history.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : msg.role,
                        parts: [{ text: msg.content }]
                    }));

                    const api_url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    const response = await fetch(
                        api_url,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                system_instruction: {parts: [{text: systemPrompt}]},
                                contents: formattedMessages,
                                generationConfig: { temperature: 0.7, ...(model.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {})}
                            })
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Google Gemini API error:', errorData);
                        const message = errorData?.error?.message || `Google Gemini API error: ${response.status} - ${response.statusText}`;
                        throw new Error(message);
                    }

                    const data = await response.json();

                    const [inputPrice, outputPrice] = getLLMPricing(settings.llmProviderModel);
                    const inputTokens = data.usageMetadata.totalTokenCount;
                    const cachedTokens = data.usageMetadata?.cachedContentTokenCount ?? 0;
                    const outputTokens = data.usageMetadata.candidatesTokenCount;
                    const approxCost = (inputTokens - cachedTokens) * inputPrice + cachedTokens * (inputPrice/4) + outputTokens * outputPrice;
                    console.log('Chat', `${model}, tokens: (${inputTokens-cachedTokens}/${cachedTokens}/${outputTokens}), cost: $${approxCost.toFixed(6)}`);

                    return data.candidates[0].content.parts[0].text;
                } catch (error) {
                    console.error('Google Gemini API call failed:', error);
                    return `Sorry, something went wrong communicating with Google. ${error.message || ''}`;
                }
            }

            async function getBotResponse(provider, apiKey, model, history) {
                if (provider === 'openai') {
                    return await getOpenAIResponse(apiKey, model, history);
                } else if (provider === 'google') {
                    return await getGoogleResponse(apiKey, model, history);
                }
            }

            async function getTTSResponse(provider, apiKey, voice, text) {
                const voices = Array.from(document.querySelector("#ttsVoiceSelector").options)
                    .filter(option => option.value.startsWith(provider))
                    .map(option => option.value)
                    .slice(1);

                if (voice === "random") {
                    voice = getRandomElement(voices).split(" ")[1];
                }

                if (provider === 'openai') {
                    const ttsInstructions = `
Accent/Affect: Neutral and clear, like a professional voice-over artist. Focus on accuracy.
Tone: Objective and methodical. Maintain a slightly formal tone without emotion.
Pacing: Use distinct pauses between words and phrases to demonstrate pronunciation nuances. Emphasize syllabic clarity.
Pronunciation: Enunciate words with deliberate clarity, focusing on vowel sounds and consonant clusters.
            `;
                    return await openAITTS(text, apiKey, voice, ttsInstructions);
                } else if (provider === 'google') {
                    const ttsInstructions = `Read the text in a realistic, genuine, neutral, and clear manner. vary your rhythm and pace naturally, like a professional voice actor: `;
                    return await googleTTS(text, apiKey, voice, ttsInstructions);
                }
            }

            async function handleSendMessage() {
                const userInput = document.getElementById("user-input")
                const chatContainer = document.getElementById("chat-container")

                const message = userInput.value.trim();
                if (!message) {
                    console.log('Message is empty.')
                    return;
                }

                const userMessage = message;
                userInput.value = '';

                addMessageToUI(userMessage, 'user-message', chatContainer);
                chatHistory = updateChatHistoryState(chatHistory, userMessage, "user");

                addMessageToUI("loading ...", 'loading-message', chatContainer);
                const botResponse = await getBotResponse(llmProvider, llmApiKey, llmModel, chatHistory);
                chatContainer.removeChild(chatContainer.lastChild);

                addMessageToUI(botResponse, 'bot-message', chatContainer);
                chatHistory = updateChatHistoryState(chatHistory, botResponse, "assistant");
            }

            async function updateChatWidget(){
                if (!settings.chatWidget) return;

                const chatWrapper = createElement("div", { id: "chat-widget", style: "margin-top: 5px 0 10px;" });
                const chatContainer = createElement("div", { id: "chat-container" });
                const inputContainer = createElement("div", { className: "input-container" });
                const userInput = createElement("input", { type: "text", id: "user-input", placeholder: "Ask anything" });
                const sendButton = createElement("button", { id: "send-button", textContent: "Send" });

                inputContainer.appendChild(userInput);
                inputContainer.appendChild(sendButton);
                chatWrapper.appendChild(chatContainer);
                chatWrapper.appendChild(inputContainer);

                const sectionHead = getSectionHead();
                const existingChatWidget = document.getElementById('chat-widget');
                if(existingChatWidget) {
                    existingChatWidget.replaceWith(chatWrapper);
                } else if (sectionHead.matches(".section-widget--head")) {
                    sectionHead.appendChild(chatWrapper);
                } else {
                    sectionHead.prepend(chatWrapper);
                }

                changeScrollAmount("#chat-container", 0.2)
                userInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSendMessage();
                    } else if (event.key === 'Escape') {
                        event.preventDefault();
                        event.target.blur();
                    }
                    event.stopPropagation();
                }, true);
                sendButton.addEventListener('click', handleSendMessage);

                if (llmProvider === 'openai') chatHistory = updateChatHistoryState(chatHistory, systemPrompt, "system");

                if (settings.askSelected && sectionHead.matches(".section-widget--head")) {
                    const initialUserMessage = getSelectedWithContext();
                    chatHistory = updateChatHistoryState(chatHistory, !isSentence ? wordPhrasePrompt: sentencePrompt, "user");
                    chatHistory = updateChatHistoryState(chatHistory, "Understood.", "assistant");

                    chatHistory = updateChatHistoryState(chatHistory, initialUserMessage, "user");
                    addMessageToUI("loading ...", 'loading-message', chatContainer);
                    const botResponse = await getBotResponse(llmProvider, llmApiKey, llmModel, chatHistory);
                    chatContainer.removeChild(chatContainer.lastChild);
                    addMessageToUI(botResponse, 'bot-message', chatContainer);
                    chatHistory = updateChatHistoryState(chatHistory, botResponse, "assistant");

                    chatHistory = updateChatHistoryState(chatHistory, plainTextPrompt, "user");
                    chatHistory = updateChatHistoryState(chatHistory, "Understood.", "assistant");

                    const meaning = document.querySelector("#chat-container > .bot-message > p");
                    if (meaning) {
                        const meaningElement = document.querySelector(".reference-input-text");
                        const hasMeaning = meaningElement ? meaningElement.value : false;
                        const textToCopy = (hasMeaning ? '\n': '') + meaning.textContent;

                        navigator.clipboard.writeText(textToCopy)
                            .then(() => {
                                showToast("Meaning Copied!", true);
                            })
                            .catch(() => {
                                showToast("Failed to copy meaning.", false);
                            });
                    }
                }
            }

            async function updateTTS() {
                async function replaceTTSButton() {
                    const selectedTextElement = document.querySelector(".reference-word");
                    const selectedText = selectedTextElement ? selectedTextElement.textContent.trim() : "";
                    if (!selectedText) return;

                    if (selectedText.length > 1000) {
                        console.log("The length of the selected text exceeds 1,000.")
                        return;
                    }

                    let audioData = await getTTSResponse(ttsProvider, settings.ttsApiKey, ttsVoice, selectedText);
                    if (audioData == null) {
                        console.log("audioData can't be got.")
                        return;
                    }

                    const newTtsButton = createElement("button", {id: "playAudio", textContent: "🔊", className: "is-tts tts-event"});
                    newTtsButton.addEventListener('click', async (event) => {
                        await playAudio(audioData, 0.7);
                    })
                    ttsButton.replaceWith(newTtsButton);
                    showToast("TTS Replaced", true);
                    playAudio(audioData, 0.7);
                }

                if (!settings.tts) return;

                const ttsButton = await waitForElement('.is-tts', 1000);
                if (!ttsButton) return;

                const isWord = document.querySelector("span.selected-text, span.is-selected");

                const ttsWordOffCondition = !settings.ttsWord && isWord;
                const ttsSentenceOffCondition = !settings.ttsSentence && !isWord;

                if (ttsWordOffCondition || ttsSentenceOffCondition) {
                    if (!ttsButton.matches('.tts-event')) {
                        ttsButton.click();
                    }

                    ttsButton.addEventListener('click', (event) => {
                        preventPropagation(event);
                        ttsButton.disabled = true;
                        replaceTTSButton();
                    }, {once: true})
                    ttsButton.classList.add('tts-event');
                } else {
                    replaceTTSButton();
                }
            }

            if (document.getElementById('chatWidget')) {
                console.log('chatWidget already exists.')
                return;
            }

            const isSentence = !document.querySelector(".section-widget--main");

            const [llmProvider, llmModel] = settings.llmProviderModel.split(" ");
            const [ttsProvider, ttsVoice] = settings.ttsVoice.split(" ");
            const llmApiKey = settings.llmApiKey;

            const systemPrompt = `
**System Prompt (Formatting & Core Rules):**
Your primary function is to serve as a language assistant. Your responses must meticulously adhere to the following guidelines to ensure clarity, accuracy, and consistency. All output, including translations, explanations, definitions, and examples, must be exclusively in '${userLanguage}' and formatted using the specified HTML.

## Core Principles

*   **Exclusive Language Use:** All generated content, without exception (this includes part-of-speech labels, definitions, explanations, example sentences, and their translations), must be in '${userLanguage}'. Do not revert to the original input language for any explanatory text, comments, or labels. The entirety of your response visible to the user must be in '${userLanguage}'.
*   **Strict HTML Formatting:**
    *   Utilize *only* the following HTML tags for presentation: '<b>' (for bolding key terms like the base form), '<i>' (for part of speech or emphasizing specific words within explanations), '<p>' (for paragraphs of text like definitions and explanations), '<ul>' (for unordered lists, primarily for examples), '<li>' (for list items within '<ul>').
    *   Use '<br>' tags *sparingly* and only for intentional line breaks within a block element (e.g., within an '<li>' if a single example and its translation need to be on separate lines but are conceptually one item, though separate '<li>' tags are generally preferred for distinct items). Avoid using '<br>' for paragraph spacing; use new '<p>' tags instead.
    *   Output *raw HTML as plain text*. This means your entire response should be a string of HTML. Do not use Markdown syntax (e.g., '# H1', '**Bold**', '*Italic*', '> blockquote', '---'), do not wrap your HTML in Markdown code blocks (e.g., \`\`\`html ... \`\`\`), and do not use any other formatting conventions like XML declarations. Do not use the '<pre>' tag.
*   **Utmost Directness & Conciseness:**
    *   Provide responses that are concise and directly address the user's query. Get straight to the point.
    *   Avoid unnecessary prefaces, introductory phrases (e.g., "Certainly, I can help with that!", "Here is the information you requested:", "You want to know about..."), apologies, or conversational filler.
    *   Do not include self-referential statements (e.g., "As a language model, I...", "I will now provide...").
    *   Do not ask clarifying questions back to the user; assume the provided input is sufficient and proceed with the task.
*   **Unwavering Accuracy & Precision:**
    *   Ensure all translations are precise, natural-sounding in '${userLanguage}', and reflect intended nuances from the original.
    *   Definitions must be accurate, dictionary-like, and specifically tailored to the word's usage in the given context.
    *   Explanations should be clear, correct, and contextually relevant.
    *   Grammar, spelling, and punctuation in '${userLanguage}' must be impeccable.
*   **Deep Contextual Integration:**
    *   Thoroughly analyze the provided 'Context' sentence or situation to understand the specific meaning and usage of the input word or phrase.
    *   Your explanation must clearly articulate how the context influences the meaning, especially for words with multiple senses or for idiomatic expressions.
    *   Do not provide generic definitions if the context narrows the meaning.
*   **Completeness & Adherence to Structure:**
    *   Ensure all requested components, as defined by subsequent specific prompts (e.g., the 'wordPhrasePrompt'), are included in the response and follow the specified order and HTML structure precisely.
    *   Pay close attention to the formatting details within the specified HTML structure (e.g., placement of bold tags, italics, spans, and punctuation).
`
            const wordPhrasePrompt = `
Use this prompt only for the next input.
**Single Word/Phrase Input**
- Input will be given as: 'Input: "word or phrase" Context: "sentence including the word or phrase"'
1. Determine the base, dictionary form of the word or phrase. This means using the singular form for nouns (e.g., "cat" instead of "cats") and the infinitive form for verbs (e.g., "run" instead of "ran").
2. Address and explain the base form of the word or phrase directly, even if the input is in a conjugated or inflected form. This is especially important for idioms.
3. Provide the IPA pronunciation for the base form of the word or phrase. The IPA should be enclosed in square brackets (e.g., [prəˌnʌnsiˈeɪʃən]).
4. Provide a concise dictionary definition of the word as it is used within the given context in ${userLanguage}. This definition should be very brief, akin to a quick lookup in a dictionary (e.g., for a verb: '달리다', '성취하다'; for a noun: '사과', '번역가'), typically just a few words or a short phrase, not a full explanatory sentence.
5. Explain the contextual meaning of the word/phrase with more details, and explain any idiomatic usages in ${userLanguage}.
6. Generate a distinct, new example sentence to highlight word/phrase usage.
7. The example sentence and its translation should appear first in the original input language, then in ${userLanguage}.
8. Use this HTML structure (all content in ${userLanguage}): 

<b>[Base form]</b> <span>/[IPA Pronunciation]/</span> <i>([Part of Speech in ${userLanguage}])</i>
<p>Brief dictionary definition of the word used in the context, in ${userLanguage}]</p>
<hr>
<p>[Contextual explanation in ${userLanguage}]</p>
<hr>
<ul>
  <li>[New Example Sentence in original language]</li>
  <li>[Translation in ${userLanguage}]</li>
</ul>

*The structure and bolding/italics should convey the information. All content (Part of Speech, definition, explanation, examples and translations) must be provided solely in ${userLanguage}, regardless of the input language.*

## Examples

### Example 1: Single Word with Context (Original language: English, User's language: Korean)

**User Input:** 
'Input: "translators", Context: "However, the ESV translators chose to translate that same word as 'servant,' closing off the potential interpretation that she held any formal position of authority."'

**Output:**
<b>translator</b> <span>[trænsˈleɪtər]</span> <i>(명사)</i>
<p>번역가</p>
<hr>
<p>이것은 주어진 문맥에서 ESV 성경 번역가들이 강조한 것처럼, 외국 콘텐츠를 모국어로 번역하는 개인을 지칭합니다.</p>
<hr>
<ul>
  <li>Many translators work together on complex international projects.</li>
  <li>많은 번역가들이 복잡한 국제 프로젝트에 함께 작업합니다.</li>
</ul>

### Example 2: Single Word with Context (Original Language: Spanish, User Language: English)

**User Input:** 
'Input: "lograr", Context: "Debemos lograr nuestros objetivos."'

**Assistant Output:**
<b>lograr</b> <span>[loˈɣɾaɾ]</span> <i>(verb)</i>
<p>To achieve, to attain.</p>
<hr>
<p>This means to successfully reach or accomplish a goal. In context, it suggests the necessity to achieve our objectives.</p>
<hr>
<ul>
  <li>Espero lograr todas mis metas este año.</li>
  <li>I hope to achieve all my goals this year.</li>
</ul>

### Example 3: Phrase with Context (Original Language: German, User Language: French)

**User Input:** 
'Input: "imstande sein", Context: "Er war imstande, das Problem zu lösen."'

**Assistant Output:**
<b>imstande sein</b> <span>[ɪmˈʃtandə zaɪ̯n]</span> <i>(expression)</i>
<p>Être capable de, être en mesure de.</p>
<hr>
<p>Cela signifie être capable ou apte à faire quelque chose. Dans ce contexte, cela indique qu'il avait la capacité de résoudre le problème.</p>
<hr>
<ul>
  <li>Sie war imstande, die schwierige Aufgabe zu bewältigen.</li>
  <li>Elle était capable de maîtriser la tâche difficile.</li>
</ul>

Respond understood if you got it.
`
            const sentencePrompt = `
Use this prompt only for the next input.
**Sentences Input**
- Input will be given as: 'Input: "sentences"'

1.  ALWAYS translate **all** input sentences first into ${userLanguage}. **If multiple sentences are provided in the input, ensure every single one of them is translated and concatenated together to form one continuous block of text.** This entire translated block should be placed within a single '<p>' tag and be bolded using '<b>' tags around the entire translation.
2.  After the translated sentences and an '<hr>' separator, provide a comprehensive explanation of the overall meaning of the input sentences in ${userLanguage}. This explanation should:
    *   Clarify the main message or purpose of the sentences.
    *   Highlight any important contextual details that affect understanding.
    *   Explain any subtle nuances, implications, or underlying tones.
    *   Briefly touch upon significant grammatical structures if they are key to understanding the sentence's construction or meaning (but do not turn this into a full grammar lesson).
    *   This explanation should be enclosed in one or more '<p>' tags as needed for clarity and aim to provide a holistic understanding beyond a literal translation.
3.  After another '<hr>' separator, identify a few (typically 2-4, depending on sentence complexity and length) key words or phrases from the *original* sentences. Focus on:
    *   Idiomatic expressions or phrases with non-literal meanings.
    *   Vocabulary that might be challenging for a learner of the original language.
    *   Terms that are crucial for a deep and accurate understanding of the sentence's core message.
    *   Avoid selecting overly simple or common words unless their specific usage in the context is unusual or noteworthy.
4.  For each identified word or phrase:
    *   State the word/phrase exactly as it appears in the original input.
    *   Provide a concise meaning or explanation in ${userLanguage}, relevant to its use in the given context.
5.  Use the following HTML structure for the entire response:

<p><b>[The entire translated sentences in ${userLanguage}]</b></p>
<hr>
<p>[Comprehensive explanation in ${userLanguage} as per instruction #2. This may use multiple paragraphs.]</p>
<hr>
<ul>
  <li><b>[Word/Phrase 1 in original language]:</b> [Meaning/Explanation in ${userLanguage}]</li>
  <li><b>[Word/Phrase 2 in original language]:</b> [Meaning/Explanation in ${userLanguage}]</li>
  <!-- Repeat <li> for other identified words/phrases -->
</ul>

*Note: Always include the full sentences translation first. The selection of words/phrases should be judicious and aim to genuinely aid understanding. All content, including the meanings of words/phrases, must be in ${userLanguage}.*

## Examples

### Example 1: Sentence Input (Original language: French, User's language: Japanese)

**User Input:**
'Input: "Il a réussi à convaincre ses collègues malgré les difficultés."'

**Assistant Output:**
<p><b>彼は困難にもかかわらず同僚たちを説得することに成功した。</b></p>
<hr>
<p>この文は、彼が直面したであろう障害や困難な状況があったにもかかわらず、最終的に同僚たちを自分の意見や提案に同意させることに成功したという事実を伝えています。「malgré les difficultés」という部分が、その成功が容易ではなかったことを示唆しています。</p>
<hr>
<ul>
  <li><b>réussi à:</b> 「～することに成功した」、「うまく～できた」という意味の表現です。動詞「réussir」（成功する）の過去形に前置詞「à」が続いています。</li>
  <li><b>convaincre:</b> 「説得する」、「納得させる」という意味の動詞です。</li>
  <li><b>malgré:</b> 「～にもかかわらず」という意味の前置詞で、反対の状況や困難が存在する中で何かが起こったことを示します。</li>
</ul>

### Example 2: Sentence Input (Original Language: Italian, User Language: German)

**User Input:**
'Input: "Nonostante la pioggia, siamo andati al concerto."'

**Assistant Output:**
<p><b>Trotz des Regens sind wir zum Konzert gegangen.</b></p>
<hr>
<p>Dieser Satz drückt aus, dass die Sprecher das Konzert besucht haben, obwohl es geregnet hat. Das Wort "Nonostante" (Trotz) leitet einen Nebensatz ein, der einen Gegensatz oder ein Hindernis zum Hauptgeschehen darstellt. Es unterstreicht die Entschlossenheit der Sprecher oder ihr großes Interesse am Konzert, das sie auch schlechtes Wetter nicht davon abgehalten hat hinzugehen.</p>
<hr>
<ul>
  <li><b>Nonostante:</b> Trotz. Diese Präposition drückt einen Gegensatz aus.</li>
  <li><b>la pioggia:</b> der Regen.</li>
  <li><b>siamo andati:</b> wir sind gegangen (Perfekt von "andare" - gehen, 1. Person Plural).</li>
</ul>

### Example 3: Idiomatic Sentence Input (Original Language: English, User's Language: Korean)

**User Input:**
'Input: "Don't worry, it's not rocket science, you'll figure it out quickly."'

**Assistant Output:**
<p><b>걱정 마세요, 그렇게 어려운 일이 아니니까 금방 이해하게 될 거예요.</b></p>
<hr>
<p>이 문장은 상대방을 안심시키려는 의도로 사용됩니다. "it's not rocket science"라는 관용적 표현은 어떤 것이 생각보다 복잡하거나 어렵지 않다는 것을 강조하며, 따라서 상대방이 해당 과제나 문제를 빠르게 파악하고 해결할 수 있을 것이라는 격려의 메시지를 전달합니다.</p>
<hr>
<ul>
  <li><b>it's not rocket science:</b> (관용구) '그것은 로켓 과학이 아니다'라는 직역보다는 '그렇게 복잡하거나 어려운 일이 아니다', '누구나 할 수 있는 간단한 일이다'라는 의미로 사용됩니다.</li>
  <li><b>figure it out:</b> (구동사) '이해하다', '알아내다', '해결 방법을 찾다'라는 의미입니다. 문맥상 어떤 문제나 상황을 파악하게 될 것이라는 뜻입니다.</li>
</ul>

### Example 4: Multiple Sentences Input (Original Language: Spanish, User's Language: French)

**User Input:**
'Input: "El sol brillaba con fuerza. Los pájaros cantaban en los árboles." '

**Assistant Output:**
<p><b>Le soleil brillait fort. Les oiseaux chantaient dans les arbres.</b></p>
<hr>
<p>Ces deux phrases décrivent une scène matinale ou diurne paisible et agréable. La première phrase établit une condition météorologique claire et lumineuse. La seconde ajoute un élément auditif qui renforce l'atmosphère de tranquillité et de nature. Ensemble, elles peignent une image vivante d'un environnement serein.</p>
<hr>
<ul>
  <li><b>brillaba con fuerza:</b> brillait fort, brillait intensément. Indique une forte luminosité du soleil.</li>
  <li><b>cantaban:</b> chantaient (imparfait de l'indicatif de "cantar" - chanter, 3ème personne du pluriel). Décrit une action continue ou habituelle dans le passé.</li>
</ul>
Respond understood if you got it.
`
            const plainTextPrompt = `
Do not use the formatting rules from the word/sentence prompts previously given for your responses in this mode. For all subsequent turns, the user input will be plain text.
**Crucially, you MUST remember the initial \`Input: "word or phrase" Context: "sentence..."\` or \`Input: "sentence(s)"\` that was processed right before this plain text mode started. This initial input and its associated context are vital for understanding follow-up questions in this conversational phase.**

**Plain Text Input (Conversational/Freetext)**
- Input will be given as: 'Plain text input'.
- Respond naturally and directly in ${userLanguage}. 
- Avoid structured outputs (like those in word/phrase/sentence prompts); adhere to a conversational context. Use HTML tags ('<b>', '<i>', '<p>', '<ul>', '<li>', '<br>') but not <pre> or Markdown for presentation.
- **If a user's plain text query refers to a word, phrase, concept, or asks a question that seems related to the **initial structured input (the one with "Input:" and/or "Context:")**, you MUST assume they are referring back to that specific initial input and its context, even if they don't explicitly state "in the previous context," "about the word we just discussed," or similar phrases. Use your knowledge of that initial input to provide a relevant and contextual answer.**
- For general queries clearly not related to the initial input, answer as a general language assistant.

## Examples

### Example 1: Plain Text Input (User Language: English) - General Query

**User Input:**
"What's the weather like in London today?"

**Assistant Output:**
<p>I'm sorry, I do not have access to real-time weather information. You can check a reliable weather app or website for the current conditions in London.</p>

### Example 2: Plain Text Input (User Language: Korean) - Referential Query
(Scenario: The initial input was for the word "translators" with its context from the ESV Bible example, and user language is Korean. The bot has already provided the structured \`wordPhrasePrompt\` output.)

**User Input (in plain text mode, following the structured output for "translators"):**
"그 단어가 문맥에서 정확히 어떤 의미로 사용되었나요?"

**Assistant Output (implicitly referring to "translators" and its initial context):**
<p>앞서 논의된 문맥에서 '번역가들(translators)'이라는 단어는 ESV 성경 번역가들이 특정 단어를 '종(servant)'으로 번역하기로 선택한 상황을 가리킵니다. 이는 그들이 특정 해석을 선호하여 해당 여성이 공식적인 권위의 직책을 가졌을 가능성을 배제했음을 시사합니다. 따라서 문맥상 '번역가들'은 단순히 언어를 옮기는 사람을 넘어, 특정 신학적 또는 해석적 관점을 가진 번역 주체를 의미할 수 있습니다.</p>

Respond understood if you got it.
`

            let chatHistory = [];

            updateReferenceWord();
            updateChatWidget();
            stopPlayingAudio(audioContext);
            updateTTS();

            const selectedTextElement = document.querySelector(".reference-word");
            if (selectedTextElement){
                const observer = new MutationObserver((mutations) => {
                    if (isProgrammaticReferenceWordUpdate) return;
                    mutations.forEach(async (mutation) => {
                        if (mutation.type !== 'characterData') return;
                        console.debug('Observer:', `Widget changed from word/sentence. ${mutation.type}, ${mutation.attributeName}`);
                        updateReferenceWord();
                        updateChatWidget();
                        stopPlayingAudio(audioContext);
                        updateTTS();
                    });
                });
                observer.observe(selectedTextElement, {subtree: true, characterData: true});
            }

            const widgetArea = document.querySelector("#lesson-reader .widget-area");
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach(async(node) => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return;
                        if (!node.matches(".reader-widget")) return;
                        console.debug('Observer:', `Widget changed from resource. ${mutation.type}, ${mutation.addedNodes}`);
                        updateReferenceWord();
                        updateChatWidget();
                        stopPlayingAudio(audioContext);
                        updateTTS();
                    });
                });
            });
            observer.observe(widgetArea, {childList: true});
        }

        const userDictionaryLang = await getDictionaryLanguage();
        const DictionaryLocalePairs = await getDictionaryLocalePairs()
        const userLanguage = DictionaryLocalePairs[userDictionaryLang];
        const lessonReader = document.getElementById('lesson-reader');

        if (settings.chatWidget) updateWidget();
        const observer = new MutationObserver((mutations) => {
            if (!settings.chatWidget) return;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (!node.matches(".widget-area.is-fixed")) return;
                    console.debug('Observer:', `Widget added. ${mutation.type}`, mutation.addedNodes);
                    updateWidget();
                });
            });
        });
        observer.observe(lessonReader, {childList: true});
    }

    function fixBugs() {
        function resizeToast() {
            const css = `
            .toasts {
                height: fit-content;
            }
            `;
            const cssElement = createElement("style", {textContent: css});
            document.querySelector("head").appendChild(cssElement);
        }

        resizeToast();
    }

    function init() {
        fixBugs();

        if (document.URL.includes("reader")) {
            setupReader();
            setupKeyboardShortcuts();
            setupYoutubePlayerCustomization();
            setupReaderContainer();
            setupLLMs();
        }
        if (document.URL.includes("library")) {
            setupCourse();
        }
    }

    init();
})();