// ==UserScript==
// @name         LingQ Addon
// @description  Provides custom LingQ layouts
// @match        https://www.lingq.com/*/learn/*/web/reader/*
// @match        https://www.lingq.com/*/learn/*/web/library/course/*
// @exclude      https://www.lingq.com/*/learn/*/web/editor/*
// @version      5.3.7
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
        colorMode: "dark",
        fontSize: 1.1,
        lineHeight: 1.7,
        heightBig: 400,
        sentenceHeight: 400,
        darkColors: {
            fontColor: "#e0e0e0",
            lingqBackground: "rgba(109, 89, 44, 0.7)",
            lingqBorder: "rgba(254, 203, 72, 0.3)",
            lingqBorderLearned: "rgba(254, 203, 72, 0.5)",
            knownBackground: "rgba(37, 57, 82, 0.7)",
            knownBorder: "rgba(72, 154, 254, 0.5)",
            playingUnderline: "#ffffff"
        },
        whiteColors: {
            fontColor: "#000000",
            lingqBackground: "rgba(255, 200, 0, 0.4)",
            lingqBorder: "rgba(255, 200, 0, 0.3)",
            lingqBorderLearned: "rgba(255, 200, 0, 1)",
            knownBackground: "rgba(198, 223, 255, 0.7)",
            knownBorder: "rgba(0, 111, 255, 0.3)",
            playingUnderline: "#000000"
        },
        librarySortOption: 0,
        autoFinishing: false,
        chatWidget: false,
        llmProviderModel: "openai gpt-4.1-nano",
        llmApiKey: "",
        askSelected: false,
        tts: false,
        ttsApiKey: "",
        ttsVoice: "alloy",
        ttsWord: false,
        ttsSentence: false,
    };

    const settings = {
        styleType: storage.get("styleType", defaults.styleType),
        colorMode: storage.get("colorMode", defaults.colorMode),
        fontSize: storage.get("fontSize", defaults.fontSize),
        lineHeight: storage.get("lineHeight", defaults.lineHeight),
        heightBig: storage.get("heightBig", defaults.heightBig),
        sentenceHeight: storage.get("sentenceHeight", defaults.sentenceHeight),
        librarySortOption: storage.get("librarySortOption", defaults.librarySortOption),
        get autoFinishing() { return storage.get("autoFinishing", defaults.autoFinishing); },
        get chatWidget() { return storage.get("chatWidget", defaults.chatWidget); },
        get llmProviderModel() { return storage.get("llmProviderModel", defaults.llmProviderModel); },
        get llmApiKey() { return storage.get("llmApiKey", defaults.llmApiKey); },
        get askSelected() { return storage.get("askSelected", defaults.askSelected); },
        get tts() { return storage.get("tts", defaults.tts); },
        get ttsApiKey() { return storage.get("ttsApiKey", defaults.ttsApiKey); },
        get ttsVoice() { return storage.get("ttsVoice", defaults.ttsVoice); },
        get ttsWord() { return storage.get("ttsWord", defaults.ttsWord); },
        get ttsSentence() { return storage.get("ttsSentence", defaults.ttsSentence); },
    };

    const colorSettings = getColorSettings(settings.colorMode);

    let styleElement = null;

    function getColorSettings(colorMode) {
        const prefix = colorMode === "dark" ? "dark_" : "white_";
        const defaultColors = colorMode === "dark" ? defaults.darkColors : defaults.whiteColors;

        return {
            fontColor: storage.get(prefix + "fontColor", defaultColors.fontColor),
            lingqBackground: storage.get(prefix + "lingqBackground", defaultColors.lingqBackground),
            lingqBorder: storage.get(prefix + "lingqBorder", defaultColors.lingqBorder),
            lingqBorderLearned: storage.get(prefix + "lingqBorderLearned", defaultColors.lingqBorderLearned),
            knownBackground: storage.get(prefix + "knownBackground", defaultColors.knownBackground),
            knownBorder: storage.get(prefix + "knownBorder", defaultColors.knownBorder),
            playingUnderline: storage.get(prefix + "playingUnderline", defaultColors.playingUnderline)
        };
    }

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

    function createSettingsPopup() {
        const popup = createElement("div", {id: "lingqAddonSettingsPopup"});

        // drag handle
        const dragHandle = createElement("div", {id: "lingqAddonSettingsDragHandle"});

        const dragHandleTitle = createElement("h3", {textContent: "LingQ Addon Settings"});
        dragHandle.appendChild(dragHandleTitle);

        // popup content
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

        const popupLayout = createElement("div");
        const columns = createElement("div", {style: "display: flex; flex-direction: row;"});

        const container = createElement("div", {style: "padding: 5px; width: 350px;"});

        addSelect(container, "styleTypeSelector", "Layout Style:", [
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
        container.appendChild(videoSettings);

        const sentenceVideoSettings = createElement("div", {
            id: "sentenceVideoSettings",
            style: `${settings.styleType === "off" ? "" : "display: none"}`
        });
        addSlider(sentenceVideoSettings, "sentenceHeightSlider", "Sentence Video Height:", "sentenceHeightValue", settings.heightBig, "px", 300, 600, 10);
        container.appendChild(sentenceVideoSettings);

        addSlider(container, "fontSizeSlider", "Font Size:", "fontSizeValue", settings.fontSize, "rem", 0.8, 1.8, 0.05);
        addSlider(container, "lineHeightSlider", "Line Height:", "lineHeightValue", settings.lineHeight, "", 1.2, 3.0, 0.1);

        const colorSection = createElement("div", {className: "popup-section"});

        addSelect(colorSection, "colorModeSelector", "Color Mode:", [
            { value: "dark", text: "Dark" },
            { value: "white", text: "White" }
        ], settings.colorMode);

        [
            { id: "fontColor", label: "Font Color:", value: colorSettings.fontColor },
            { id: "lingqBackground", label: "LingQ Background:", value: colorSettings.lingqBackground },
            { id: "lingqBorder", label: "LingQ Border:", value: colorSettings.lingqBorder },
            { id: "lingqBorderLearned", label: "LingQ Border Learned:", value: colorSettings.lingqBorderLearned },
            { id: "knownBackground", label: "Known Background:", value: colorSettings.knownBackground },
            { id: "knownBorder", label: "Known Border:", value: colorSettings.knownBorder },
            { id: "playingUnderline", label: "Playing Underline:", value: colorSettings.playingUnderline }
        ].forEach(config => addColorPicker(colorSection, config.id, config.label, config.value));

        container.appendChild(colorSection);

        addCheckbox(container, "autoFinishingCheckbox", "Finish Lesson Automatically", settings.autoFinishing);

        columns.appendChild(container);

        const llmContainer = createElement("div", {style: "padding: 10px; width: 350px;"});

        addCheckbox(llmContainer, "chatWidgetCheckbox", "Enable the Chat Widget", settings.chatWidget);

        const llmSection = createElement("div", {id: "llmSection", className: "popup-section", style: `${settings.chatWidget ? "" : "display: none"}`});

        addSelect(llmSection, "llmProviderModelSelector", "LLM Provider: (Price per 1M tokens)", [
            { value: "openai gpt-4.1-mini", text: "OpenAI GPT-4.1 mini ($0.4/$1.6)" },
            { value: "openai gpt-4.1-nano", text: "OpenAI GPT-4.1 nano ($0.1/$0.4)" },
            { value: "google gemini-2.5-flash-preview-04-17", text: "Google Gemini 2.5 Flash ($0.15/$0.6)" },
            { value: "google gemini-2.0-flash", text: "Google Gemini 2.0 Flash ($0.1/$0.4)" }
        ], settings.llmProviderModel);

        const apiKeyContainer = createElement("div", {className: "popup-row"});
        apiKeyContainer.appendChild(createElement("label", {htmlFor: "llmApiKeyInput", textContent: "API Key:"}));

        const apiKeyFlexContainer = createElement("div", {style: "display: flex; align-items: center;"});
        const apiKeyInput= createElement("input", {type: "password", id: "llmApiKeyInput", value: settings.llmApiKey, className: "popup-input"});
        apiKeyFlexContainer.appendChild(apiKeyInput)
        apiKeyContainer.appendChild(apiKeyFlexContainer);
        llmSection.appendChild(apiKeyContainer);

        addCheckbox(llmSection, "askSelectedCheckbox", "Enable asking with selected text", settings.askSelected);

        llmContainer.appendChild(llmSection);

        addCheckbox(llmContainer, "ttsCheckbox", "Enable AI-TTS", settings.tts);

        const ttsSection = createElement("div", {id: "ttsSection", className: "popup-section", style: `${settings.tts ? "" : "display: none"}`});

        const ttsApiKeyContainer = createElement("div", {className: "popup-row"});
        ttsApiKeyContainer.appendChild(createElement("label", {htmlFor: "ttsApiKeyInput", textContent: "OpenAI API Key:"}));

        const ttsApiKeyFlexContainer = createElement("div", {style: "display: flex; align-items: center;"});
        const ttsApiKeyInput= createElement("input", {type: "password", id: "ttsApiKeyInput", value: settings.ttsApiKey, className: "popup-input"});
        ttsApiKeyFlexContainer.appendChild(ttsApiKeyInput)
        ttsApiKeyContainer.appendChild(ttsApiKeyFlexContainer);
        ttsSection.appendChild(ttsApiKeyContainer);

        addSelect(ttsSection, "ttsVoiceSelector", "TTS Voice:", [
            { value: "alloy", text: "alloy" },
            { value: "ash", text: "ash" },
            { value: "ballad", text: "ballad" },
            { value: "coral", text: "coral" },
            { value: "echo", text: "onyx" },
            { value: "fable", text: "onyx" },
            { value: "onyx", text: "onyx" },
            { value: "nova", text: "nova" },
            { value: "sage", text: "sage" },
            { value: "shimmer", text: "onyx" },
            { value: "verse", text: "verse" },
        ], settings.ttsVoice);

        addCheckbox(ttsSection, "ttsWordCheckbox", "Enable AI-TTS for words", settings.ttsWord);
        addCheckbox(ttsSection, "ttsSentenceCheckbox", "Enable AI-TTS for sentences", settings.ttsSentence);

        llmContainer.appendChild(ttsSection);

        columns.appendChild(llmContainer);

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

        // drag handle
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

        // Progress Bar Elements
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

    function createUI() {
        // Create settings button
        const settingsButton = createElement("button", {
            id: "lingqAddonSettings",
            textContent: "⚙️",
            title: "LingQ Addon Settings",
            className: "nav-button"
        });

        // Create lesson complete button
        const completeLessonButton = createElement("button", {
            id: "lingqLessonComplete",
            textContent: "✔",
            title: "Complete Lesson Button",
            className: "nav-button"
        });

        // Create download words button
        const downloadWordsButton = createElement("button", {
            id: "lingqDownloadWords",
            textContent: "💾",
            title: "Download Words",
            className: "nav-button"
        });

        // Find the #main-nav element
        let mainNav = document.querySelector("#main-nav > nav > div:nth-child(2) > div:nth-child(1)");

        if (mainNav) {
            mainNav.appendChild(settingsButton);
            mainNav.appendChild(downloadWordsButton);
            mainNav.appendChild(completeLessonButton);
        } else {
            console.error("#main-nav element not found. Buttons not inserted.");
        }

        // Create settings popup
        const settingsPopup = createSettingsPopup();
        document.body.appendChild(settingsPopup);

        // Create download words popup
        const downloadWordsPopup = createDownloadWordsPopup();
        document.body.appendChild(downloadWordsPopup);

        // Add event listeners
        setupSettingEventListeners(settingsButton, settingsPopup);
        setupDownloadWordsEventListeners(downloadWordsButton, downloadWordsPopup);
        setupEventListeners()
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

    function setupSettingEventListeners(settingsButton, settingsPopup) {
        function initializePickrs() {
            function setupRGBAPickr(pickerId, textId, settingKey, cssVar) {
                function saveColorSetting(key, value) {
                    const currentColorMode = document.getElementById("colorModeSelector").value;
                    const prefix = currentColorMode === "dark" ? "dark_" : "white_";
                    storage.set(prefix + key, value);
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
                setupRGBAPickr('lingqBackgroundPicker', 'lingqBackgroundText', 'lingqBackground', '--lingq_background');
                setupRGBAPickr('lingqBorderPicker', 'lingqBorderText', 'lingqBorder', '--lingq_border');
                setupRGBAPickr('lingqBorderLearnedPicker', 'lingqBorderLearnedText', 'lingqBorderLearned', '--lingq_border_learned');
                setupRGBAPickr('knownBackgroundPicker', 'knownBackgroundText', 'knownBackground', '--known_background');
                setupRGBAPickr('knownBorderPicker', 'knownBorderText', 'knownBorder', '--known_border');
                setupRGBAPickr('fontColorPicker', 'fontColorText', 'fontColor', '--font_color');
                setupRGBAPickr('playingUnderlinePicker', 'playingUnderlineText', 'playingUnderline', '--is_playing_underline');
            });
        }

        settingsButton.addEventListener("click", () => {
            settingsPopup.style.display = "block";
            initializePickrs();

            const dragHandle = document.getElementById("lingqAddonSettingsDragHandle");
            makeDraggable(settingsPopup, dragHandle);
        });

        const styleTypeSelector = document.getElementById("styleTypeSelector");
        styleTypeSelector.addEventListener("change", (event) => {
            const selectedStyleType = event.target.value;
            storage.set("styleType", selectedStyleType);
            document.getElementById("videoSettings").style.display = selectedStyleType === "video" ? "block" : "none";
            document.getElementById("sentenceVideoSettings").style.display = selectedStyleType === "off" ? "block" : "none";
            applyStyles(selectedStyleType, document.getElementById("colorModeSelector").value);
        });

        function updateColorInputs(colorSettings) {
            document.getElementById("fontColorText").value = colorSettings.fontColor;
            document.getElementById("lingqBackgroundText").value = colorSettings.lingqBackground;
            document.getElementById("lingqBorderText").value = colorSettings.lingqBorder;
            document.getElementById("lingqBorderLearnedText").value = colorSettings.lingqBorderLearned;
            document.getElementById("knownBackgroundText").value = colorSettings.knownBackground;
            document.getElementById("knownBorderText").value = colorSettings.knownBorder;
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
                { id: "knownBackgroundPicker", color: colorSettings.knownBackground },
                { id: "knownBorderPicker", color: colorSettings.knownBorder },
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
            document.documentElement.style.setProperty("--font_color", colorSettings.fontColor);
            document.documentElement.style.setProperty("--lingq_background", colorSettings.lingqBackground);
            document.documentElement.style.setProperty("--lingq_border", colorSettings.lingqBorder);
            document.documentElement.style.setProperty("--lingq_border_learned", colorSettings.lingqBorderLearned);
            document.documentElement.style.setProperty("--known_background", colorSettings.knownBackground);
            document.documentElement.style.setProperty("--known_border", colorSettings.knownBorder);
            document.documentElement.style.setProperty("--is_playing_underline", colorSettings.playingUnderline);
        }

        function updateColorMode(event) {
            event.stopPropagation();

            const selectedColorMode = this.value;
            const settingsPopup = document.getElementById("lingqAddonSettingsPopup");
            settingsPopup.style.backgroundColor = selectedColorMode === "dark" ? "#2a2c2e" : "#ffffff";

            storage.set("colorMode", selectedColorMode);

            const colorSettings = getColorSettings(selectedColorMode);

            updateColorInputs(colorSettings);

            document.documentElement.style.setProperty(
                "--background-color",
                selectedColorMode === "dark" ? "#2a2c2e" : "#ffffff"
            );
            updateCssColorVariables(colorSettings);

            applyStyles(document.getElementById("styleTypeSelector").value, selectedColorMode);

            updateColorPickerBackgrounds(colorSettings);
        }

        document.getElementById("colorModeSelector").addEventListener("change", updateColorMode);

        function setupSlider(sliderId, valueId, settingKey, unit, cssVar, valueTransform) {
            const slider = document.getElementById(sliderId);
            const valueDisplay = document.getElementById(valueId);

            slider.addEventListener("input", function () {
                const value = parseFloat(this.value);
                const transformedValue = valueTransform(value);

                valueDisplay.textContent = transformedValue.toString().replace(unit, '');
                storage.set(settingKey, value);
                document.documentElement.style.setProperty(cssVar, transformedValue);
            });
        }

        setupSlider("fontSizeSlider", "fontSizeValue", "fontSize", "rem", "--font_size", (val) => `${val}rem`);
        setupSlider("lineHeightSlider", "lineHeightValue", "lineHeight", "", "--line_height", (val) => val);
        setupSlider("heightBigSlider", "heightBigValue", "heightBig", "px", "--height_big", (val) => `${val}px`);
        setupSlider("sentenceHeightSlider", "sentenceHeightValue", "sentenceHeight", "px", "--sentence_height", (val) => `${val}px`);

        const autoFinishingCheckbox = document.getElementById("autoFinishingCheckbox");
        autoFinishingCheckbox.addEventListener('change', (event) => {
            const checked = event.target.checked;
            storage.set("autoFinishing", checked);
        });

        const chatWidgetCheckbox = document.getElementById("chatWidgetCheckbox");
        chatWidgetCheckbox.addEventListener('change', (event) => {
            const checked = event.target.checked;
            document.getElementById("llmSection").style.display = checked ? "block" : "none";
            storage.set("chatWidget", checked);
        });

        const llmProviderModelSelector = document.getElementById("llmProviderModelSelector");
        llmProviderModelSelector.addEventListener("change", (event) => {
            const selectedProvider = event.target.value;
            storage.set("llmProviderModel", selectedProvider);
        });

        const llmApiKeyInput = document.getElementById("llmApiKeyInput");
        llmApiKeyInput.addEventListener("change", (event) => {
            const apiKey = event.target.value;
            storage.set("llmApiKey", apiKey);
        });

        const askSelectedCheckbox = document.getElementById("askSelectedCheckbox");
        askSelectedCheckbox.addEventListener('change', (event) => {
            const checked = event.target.checked;
            storage.set("askSelected", checked);
        });

        const ttsCheckbox = document.getElementById("ttsCheckbox");
        ttsCheckbox.addEventListener('change', (event) => {
            const checked = event.target.checked;
            document.getElementById("ttsSection").style.display = checked ? "block" : "none";
            storage.set("tts", checked);
        });

        const ttsApiKeyInput = document.getElementById("ttsApiKeyInput");
        ttsApiKeyInput.addEventListener("change", (event) => {
            const apiKey = event.target.value;
            storage.set("ttsApiKey", apiKey);
        });

        const ttsVoiceSelector = document.getElementById("ttsVoiceSelector");
        ttsVoiceSelector.addEventListener("change", (event) => {
            const selectedVoice = event.target.value;
            storage.set("ttsVoice", selectedVoice);
        });

        const ttsWordCheckbox = document.getElementById("ttsWordCheckbox");
        ttsWordCheckbox.addEventListener('change', (event) => {
            const checked = event.target.checked;
            storage.set("ttsWord", checked);
        });

        const ttsSentenceCheckbox = document.getElementById("ttsSentenceCheckbox");
        ttsSentenceCheckbox.addEventListener('change', (event) => {
            const checked = event.target.checked;
            storage.set("ttsSentence", checked);
        });

        document.getElementById("closeSettingsBtn").addEventListener("click", () => {
            settingsPopup.style.display = "none";
        });

        function resetSettings() {
            if (!confirm("Reset all settings to default?")) return;

            const currentColorMode = document.getElementById("colorModeSelector").value;
            const defaultColorSettings = currentColorMode === "dark" ? defaults.darkColors : defaults.whiteColors;

            document.getElementById("styleTypeSelector").value = defaults.styleType;
            document.getElementById("fontSizeSlider").value = defaults.fontSize;
            document.getElementById("fontSizeValue").textContent = defaults.fontSize;
            document.getElementById("lineHeightSlider").value = defaults.lineHeight;
            document.getElementById("lineHeightValue").textContent = defaults.lineHeight;
            document.getElementById("heightBigSlider").value = defaults.heightBig;
            document.getElementById("heightBigValue").textContent = defaults.heightBig;
            document.getElementById("sentenceHeightSlider").value = defaults.sentenceHeight;
            document.getElementById("sentenceHeightValue").textContent = defaults.sentenceHeight;

            updateColorInputs(defaultColorSettings);
            updateColorPickerBackgrounds(defaultColorSettings);

            applyStyles(defaults.styleType, currentColorMode);

            document.getElementById("videoSettings").style.display = defaults.styleType === "video" ? "block" : "none";
            document.getElementById("sentenceVideoSettings").style.display = defaults.styleType === "off" ? "block" : "none";

            document.documentElement.style.setProperty("--font_size", `${defaults.fontSize}rem`);
            document.documentElement.style.setProperty("--line_height", defaults.lineHeight);
            document.documentElement.style.setProperty("--height_big", `${defaults.heightBig}px`);
            document.documentElement.style.setProperty("--sentence_height", `${defaults.sentenceHeight}px`);
            updateCssColorVariables(defaultColorSettings);

            document.getElementById("autoFinishingCheckbox").checked = defaults.autoFinishing;

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
                storage.set(key, value);
            }

            const prefix = currentColorMode === "dark" ? "dark_" : "white_";
            for (const [key, value] of Object.entries(defaultColorSettings)) {
                storage.set(prefix + key, value);
            }
        }

        document.getElementById("resetSettingsBtn").addEventListener("click", resetSettings);
    }

    async function setupDownloadWordsEventListeners(downloadWordsButton, downloadWordsPopup) {
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

        // Download Unknown LingQs button
        document.getElementById("downloadUnknownLingqsBtn").addEventListener("click", async () => {
            await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "unknown_lingqs.csv", 'lingq', '&status=0&status=1&status=2&status=3');
        });

        // Download Unknown LingQ Words button
        document.getElementById("downloadUnknownLingqWordsBtn").addEventListener("click", async () => {
            await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "unknown_lingq_words.csv", 'lingq', '&status=0&status=1&status=2&status=3&phrases=false');
        });

        // Download Unknown LingQ phrases button
        document.getElementById("downloadUnknownLingqPhrasesBtn").addEventListener("click", async () => {
            await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "unknown_lingq_phrases.csv", 'lingq', '&status=0&status=1&status=2&status=3&phrases=True');
        });

        // Download Known LingQs button
        document.getElementById("downloadKnownLingqsBtn").addEventListener("click", async () => {
            await handleDownloadButtonClick(`https://www.lingq.com/api/v3/${languageCode}/cards/`, "known_lingqs.csv", 'lingq', '&status=4');
        });

        // Download known words button
        document.getElementById("downloadKnownWordsBtn").addEventListener("click", async () => {
            await handleDownloadButtonClick(`https://www.lingq.com/api/v2/${languageCode}/known-words/`, "known_words.csv", "known");
        });

        // Close button
        document.getElementById("closeDownloadWordsBtn").addEventListener("click", () => {
            downloadWordsPopup.style.display = "none";
        });
    }

    function setupEventListeners() {
        document.getElementById("lingqLessonComplete").addEventListener("click", finishLesson);
    }

    function applyStyles(styleType, colorMode) {
        const colorSettings = getColorSettings(colorMode);

        let baseCSS = generateBaseCSS(colorSettings, colorMode);
        let layoutCSS = generateLayoutCSS();
        let specificCSS = "";

        switch (colorMode) {
            case "dark":
                clickElement(".reader-themes-component > button:nth-child(5)");
                break;
            case "white":
                clickElement(".reader-themes-component > button:nth-child(1)");
                break;
        }

        switch (styleType) {
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

    function generateBaseCSS(colorSettings, colorMode) {
        return`
        :root {
            --font_size: ${settings.fontSize}rem;
            --line_height: ${settings.lineHeight};

            --font_color: ${colorSettings.fontColor};
            --lingq_background: ${colorSettings.lingqBackground};
            --lingq_border: ${colorSettings.lingqBorder};
            --lingq_border_learned: ${colorSettings.lingqBorderLearned};
            --known_background: ${colorSettings.knownBackground};
            --known_border: ${colorSettings.knownBorder};
            --is_playing_underline: ${colorSettings.playingUnderline};

            --background-color: ${colorMode === "dark" ? "#2a2c2e" : "#ffffff"}
        }
        
        /*Color picker*/

        .color-picker {
            width: 30px;
            height: 15px;
            border-radius: 4px;
            cursor: pointer;
        }

        .pcr-app {
            z-index: 10001 !important;
        }

        .pcr-app .pcr-interaction .pcr-result {
            color: var(--font_color) !important;
        }

        /*Popup settings*/

        #lingqAddonSettings {
            color: var(--font_color);
        }

        #lingqAddonSettingsPopup, #lingqDownloadWordsPopup {
            position: fixed;
            top: 40%;
            left: 40%;
            transform: translate(-40%, -40%);
            background-color: var(--background-color, #2a2c2e);
            color: var(--font_color, #e0e0e0);
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

        /*Chat*/

        #chat-container {
            margin-bottom:10px;
            border: 1px solid rgb(125 125 125 / 35%);
            border-radius: 5px;
            height: 180px;
            overflow-y: auto;
            resize: vertical;
            padding: 5px !important;
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
            font-size: 0.85rem;
        }

        #send-button {
            padding: 5px 10px;
            border: 1px solid rgb(125 125 125 / 35%);
            border-radius: 5px;
        }

        .user-message, 
        .bot-message {
            padding: 3px 7px;
            margin: 3px 3px 8px 3px !important;
            border-radius: 8px;
            font-size: 0.85rem;
        }

        .user-message {
            background-color: rgb(125 125 125 / 5%);
        }

        .bot-message {
            background-color: rgb(125 125 125 / 10%);
        }
        
        #playAudio {
            cursor: pointer;
            font-size: 1.5rem;
            padding: 5px;
        }

        /*font settings*/

        .reader-container {
            line-height: var(--line_height) !important;
            font-size: var(--font_size) !important;
        }

        .sentence-text-head {
            min-height: 4.5rem !important;
        }

        .reader-container p {
            margin-top: 0 !important;
        }

        .reader-container p span.sentence-item,
        .reader-container p .sentence {
            color: var(--font_color) !important;
        }

        .sentence.is-playing,
        .sentence.is-playing span {
            text-underline-offset: .2em !important;
            text-decoration-color: var(--is_playing_underline) !important;
        }

        /*highlightings*/

        .phrase-item {
            padding: 0 !important;
        }

        .phrase-item:not(.phrase-item-status--4, .phrase-item-status--4x2)) {
            background-color: var(--lingq_background) !important;
        }

        .phrase-item.phrase-item-status--4,
        .phrase-item.phrase-item-status--4x2 {
            background-color: rgba(0, 0, 0, 0) !important;
        }

        .phrase-cluster:not(:has(.phrase-item-status--4, .phrase-item-status--4x2)) {
            border: 1px solid var(--lingq_border) !important;
            border-radius: .25rem;
        }

        .phrase-cluster:has(.phrase-item-status--4, .phrase-item-status--4x2) {
            border: 1px solid var(--lingq_border_learned) !important;
            border-radius: .25rem;
        }

        .reader-container .sentence .lingq-word:not(.is-learned) {
            border: 1px solid var(--lingq_border) !important;
            background-color: var(--lingq_background) !important;
        }

        .reader-container .sentence .lingq-word.is-learned {
            border: 1px solid var(--lingq_border_learned) !important;
        }

        .reader-container .sentence .blue-word {
            border: 1px solid var(--known_border) !important;
            background-color: var(--known_background) !important;;
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
            --article_height: calc(var(--app-height) - var(--height_big) - 10px);
            --grid-layout: var(--article_height) calc(var(--height_big) - 80px) 90px;
        }

        /*header settings*/

        .main-wrapper {
            padding: 0 !important;
        }

        #main-nav {
            z-index: 1;
        }

        #main-nav > nav {
            height: 50px;
        }

        #main-nav > nav > div:nth-child(1) {
            height: 50px;
        }

        .main-header {
            pointer-events: none;
        }

        .main-header > div {
            grid-template-columns: 1fr 150px !important;
            padding-left: 400px !important;
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
            grid-template-rows: var(--grid-layout);
            overflow-y: hidden;
            height: auto !important;
        }

        .sentence-text {
            height: calc(var(--article_height) - 70px) !important;
        }

        .reader-container-wrapper {
            height: 100% !important;
        }

        .widget-area {
            padding-top: 50px !important;
            height: 100% !important;
        }

        .main-footer {
            grid-area: 3 / 1 / 3 / 1 !important;
            align-self: end;
            margin: 10px 0;
        }

        .main-content {
            grid-template-rows: 45px 1fr !important;
            overflow: hidden;
            align-items: anchor-center;
        }

        /*make prev/next page buttons compact*/

        .reader-component {
            grid-template-columns: 0rem 1fr 0rem !important;
            align-items: baseline;
            margin-top: 10px;
        }

        .reader-component > div > a.button > span {
            width: 0.5rem !important;
        }

        .reader-component > div > a.button > span > svg {
            width: 15px !important;
            height: 15px !important;
        }

        .loadedContent {
            padding: 0 0 5px 15px !important;;
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
            align-items: flex-start !important;
            pointer-events: none;
            z-index: 38 !important;
        }

        .video-player > .modal-background {
            background-color: rgb(26 28 30 / 0%) !important;
        }

        .video-player > .modal-content {
            max-width: var(--width_big) !important;
            margin: var(--video_margin) !important;
            border-radius: 0.75rem !important;
        }

        .video-player .modal-section {
            display: none !important;
        }

        .video-wrapper {
            height: var(--height_big) !important;
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
            padding: 5px 0px !important;
            width: 390px !important;
            margin-left: 10px !important;
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
        }
        `;
    }

    function generateVideoCSS() {
        return `
        :root {
            --width_big: calc(100vw - 424px - 10px);
            --height_big: ${settings.heightBig}px;
            --video_margin: 0 0 10px 10px !important;
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
        `;
    }

    function generateVideo2CSS() {
        return `
        :root {
            --width_big: calc(50vw - 217px);
            --height_big: calc(100vh - 80px);

            --grid-layout: var(--article_height) 90px;
            --video_margin: 0 10px 10px 10px !important;
            --article_height: calc(var(--app-height) - 85px);
        }

        .page.reader-page.has-widget-fixed:not(.is-edit-mode):not(.workspace-sentence-reviewer) {
            grid-template-columns: 1fr 424px 1fr;
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

        .modal-container .modls {
            align-items: end;
        }
        `;
    }

    function generateAudioCSS() {
        return `
        :root {
            --height_big: 60px;
        }

        .main-content {
            grid-area: 1 / 1 / 2 / 2 !important;
        }

        .widget-area {
            grid-area: 1 / 2 / 2 / 2 !important;
        }
        `;
    }

    function generateOffModeCSS() {
        return `
        :root {
            --width_small: 440px;
            --height_small: 260px;
            --sentence_height: ${settings.sentenceHeight}px;
            --right_pos: 0.5%;
            --bottom_pos: 5.5%;
        }

        /*video player*/

        .video-player.is-minimized .video-wrapper,
        .sent-video-player.is-minimized .video-wrapper {
            height: var(--height_small);
            width: var(--width_small);
            overflow: auto;
            resize: both;
        }

        .video-player.is-minimized .modal-content,
        .sent-video-player.is-minimized .modal-content {
            max-width: calc(var(--width_small)* 3);
            margin-bottom: 0;
        }

        .video-player.is-minimized,
        .sent-video-player.is-minimized {
            left: auto;
            top: auto;
            right: var(--right_pos);
            bottom: var(--bottom_pos);
            z-index: 99999999;
            overflow: visible
        }

        /*sentence mode video player*/
        .loadedContent:has(#sentence-video-player-portal) {
            grid-template-rows: var(--sentence_height) auto auto 1fr !important;
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

    function copySelectedText() {
        const selected_text = document.querySelector(".reference-word");
        if (selected_text) {
            navigator.clipboard.writeText(selected_text.textContent);
        }
    }

    function finishLesson(){
        clickElement(".reader-component > .nav--right > a");
    }

    function setupKeyboardShortcuts() {
        function preventPropagation(event){
            event.preventDefault();
            event.stopPropagation();
        }

        document.addEventListener("keydown", function (event) {
            const targetElement = event.target;
            const isTextInput = targetElement.type === "text" || targetElement.type === "textarea" || targetElement.type === "input";
            const withoutModifierKeys = !event.ctrlKey && !event.shiftKey && !event.altKey;
            const eventKey = event.key.toLowerCase();
            if (isTextInput) {
                if (targetElement.id == "user-input") {
                    return;
                }

                if ((eventKey == 'enter' || eventKey == 'escape') && withoutModifierKeys) {
                    preventPropagation(event);
                    event.target.blur();
                } else {
                    return;
                }
            }

            const shortcuts = {
                'q': () => clickElement(".modal-section > div > button:nth-child(2)"), // video full screen toggle
                'w': () => clickElement(".audio-player--controllers > div:nth-child(1) > a"), // 5 sec Backward
                'e': () => clickElement(".audio-player--controllers > div:nth-child(2) > a"), // 5 sec Forward
                'r': () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k" })), // Make word Known
                't': () => clickElement(".dictionary-resources > a:nth-last-child(1)"), // Open Translator
                '`': () => focusElement(".reference-input-text"), // Move cursor to reference input
                'd': () => clickElement(".dictionary-resources > a:nth-child(1)"), // Open Dictionary
                'f': () => clickElement(".dictionary-resources > a:nth-child(1)"), // Open Dictionary
                'c': () => copySelectedText() // Copy selected text
            };

            if (shortcuts[eventKey] && withoutModifierKeys) {
                preventPropagation(event);
                shortcuts[eventKey]();
            }
        }, true);
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

    function getLessonId() {
        const url = document.URL;
        const regex = /https*:\/\/www\.lingq\.com\/\w+\/learn\/\w+\/web\/reader\/(\d+)/;
        const match = url.match(regex);

        return match[1];
    }

    async function getCollectionId() {
        const url = document.URL;
        const regex = /https*:\/\/www\.lingq\.com\/\w+\/learn\/\w+\/web\/library\/course\/(\d+)/;
        const match = url.match(regex);

        return match[1];
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

    function setupYoutubePlayerCustomization() {
        function replaceNoCookie() {
            document.querySelectorAll("iframe").forEach(function (iframe) {
                let src = iframe.getAttribute("src");
                if (src && src.includes("disablekb=1")) {
                    src = src.replace("disablekb=1", "disablekb=0"); // keyboard controls are enabled
                    src = src + "&cc_load_policy=1"; // caption is shown by default
                    src = src + "&controls=0"; // player controls do not display in the player
                    iframe.setAttribute("src", src);
                }
            });
        }

        async function setupSliderObserver() {
            const lessonId = getLessonId();
            const lessonInfo = await getLessonInfo(lessonId);
            let lastCompletedPercentage = lessonInfo["progress"];
            console.log(`last progress: ${lastCompletedPercentage}`);

            const sliderTrack = document.querySelector('.audio-player--progress .rc-slider-track');

            const sliderContainer = createSliderElements();
            const videoContainer = document.querySelector(".modal-content > div");
            videoContainer.appendChild(sliderContainer);
            const videoSliderTrack = sliderContainer.querySelector(".rc-slider-track");

            const syncVideoSliderTrack = (videoSliderTrack, sliderTrack) => {
                videoSliderTrack.style.cssText = sliderTrack.style.cssText;
            };

            const updateLessonProgress = (lessonId, lessonInfo, progressPercentage, lastCompletedPercentage) => {
                const progressUpdatePeriod = 5;
                const flooredProgressPercentage = Math.floor(progressPercentage / progressUpdatePeriod) * progressUpdatePeriod;

                if (flooredProgressPercentage > lastCompletedPercentage) {
                    console.log(`progress percentage: ${flooredProgressPercentage}. Updated`);
                    const wordIndex = Math.floor(lessonInfo["totalWordsCount"] * (flooredProgressPercentage / 100));
                    setLessonProgress(lessonId, wordIndex);
                    return flooredProgressPercentage;
                }
                return lastCompletedPercentage;
            };

            const sliderObserver = new MutationObserver(function (mutationsList) {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        syncVideoSliderTrack(videoSliderTrack, sliderTrack);

                        const progressPercentage = parseFloat(sliderTrack.style.width);

                        lastCompletedPercentage = updateLessonProgress(lessonId, lessonInfo, progressPercentage, lastCompletedPercentage);
                        const isLessonFinished = progressPercentage >= 99.5;
                        if (isLessonFinished && settings.autoFinishing) {
                            setTimeout(finishLesson, 3000);
                        }
                    }
                }
            });

            sliderObserver.observe(sliderTrack, {attributes: true, attributeFilter: ['style']});
            console.log('Observer started for rc-slider-track');
        }

        function createSliderElements() {
            const sliderContainer = createElement("div", {className: "rc-slider rc-slider-horizontal"});
            const sliderRail = createElement("div", {className: "rc-slider-rail"});
            const sliderTrack = createElement("div", {className: "rc-slider-track"});
            sliderContainer.appendChild(sliderRail);
            sliderContainer.appendChild(sliderTrack);
            return sliderContainer;
        }

        const iframeObserver = new MutationObserver(function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeName === "IFRAME") {
                            replaceNoCookie();
                            clickElement('.modal-section.modal-section--head button[title="Expand"]');
                            setupSliderObserver();
                        }
                    });
                }
            }
        });

        iframeObserver.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["src"]});
    }

    async function changeScrollAmount() {
        const readerContainer = await waitForElement(".reader-container");

        if (readerContainer) {
            readerContainer.addEventListener("wheel", (event) => {
                event.preventDefault();
                const delta = event.deltaY;
                const scrollAmount = 0.3;
                readerContainer.scrollTop += delta * scrollAmount;
            });
        }
    }

    function setupSentenceFocus() {
        function focusPlayingSentence() {
            const playingSentence = document.querySelector(".sentence.is-playing");
            if (playingSentence) {
                /*
                playingSentence.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
                */
                const scrolling_div = document.querySelector(".reader-container")
                scrolling_div.scrollTop = playingSentence.offsetTop + Math.floor(playingSentence.offsetHeight / 2) - Math.floor(scrolling_div.offsetHeight / 2);

            }
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "class" &&
                    mutation.target.classList.contains("sentence")
                ) {
                    focusPlayingSentence();
                }
            });
        });

        const container = document.querySelector(".sentence-text");
        if (container) {
            observer.observe(container, {
                attributes: true,
                subtree: true
            });
        }
    }

    async function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        });
    }

    async function playAudio(audioData, volume = 0.5) {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            console.warn(`Invalid volume "${volume}". Using default volume 0.5.`);
            volume = 0.5;
        }

        return new Promise((resolve, reject) => {
            const audioContext = new AudioContext();
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

    async function openAITTS(text, API_KEY, voice = "nova", playbackRate = 1, instructions) {
        const modelId = "gpt-4o-mini-tts";
        const apiUrl = "https://api.openai.com/v1/audio/speech";

        if (!API_KEY) {
            throw new Error("Invalid or missing OpenAI API key.  Please set the API_KEY");
        }

        if (!["nova", "onyx", "alloy", "echo", "fable", "shimmer"].includes(voice)) {
            console.warn(`Invalid voice "${voice}".  Using default voice "nova".`);
            voice = "nova";
        }

        if (typeof playbackRate !== 'number' || playbackRate < 0.5 || playbackRate > 1.5) {
            console.warn(`Invalid playback rate "${playbackRate}". Using default rate 1.`);
            playbackRate = 1;
        }

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
                    speed: playbackRate
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

    async function setupLLMs() {
        async function updateWidget() {
            if (document.getElementById('chatWidget')) return;

            const targetSectionHead = document.querySelector("#lesson-reader .widget-area > .reader-widget > .section-widget--head");
            if (!targetSectionHead) return;

            const [llmProvider, llmModel] = settings.llmProviderModel.split(" ");
            const llmApiKey = settings.llmApiKey;
            console.log(llmProvider, llmModel)

            const systemPrompt = `
Ensure all translations, explanations, definitions, and examples are provided exclusively in '${userLanguage}', regardless of the original input language, using the specified HTML formatting for clarity.
You are a language assistant designed to help users understand words and sentences.

## Core Principles

* **Language:** Respond exclusively in '${userLanguage}'. Avoid using the original language for explanations, all content should be translated into '${userLanguage}'.
* **Formatting:** Use HTML tags ('<b>', '<i>', '<p>', '<ul>', '<li>', '<br>') for presentation. Output raw HTML as plain text, without Markdown or code blocks.
* **Directness:** Provide succinct responses without unnecessary prefaces.
* **Accuracy:** Ensure precise translations and context-specific explanations.
* **Context:** Integrate context deeply in translations and explanations.

## Instructions for Different Input Types

Use the input structure 'Input: "..." Context: "..."' ONLY for the *first* user turn. For all subsequent turns, the user input will be plain text.

-   **Single Word/Phrase Input (Structured Input: 'Input: "word or phrase" Context: "sentence"'):**
    1. Determine the base form of the word or phrase.
    2. Address base word or phrase directly, especially for idioms.
    3. Provide an explanation ***exclusively in ${userLanguage}***, factoring in context, and explaining any idiomatic usage.
    4.  Provide an explanation in ${userLanguage}, factoring in context, and explaining any idiomatic usage.
    5.  Generate a distinct example sentence to highlight word/phrase usage. The **example sentence and its translation should appear first in the original input language, then in ${userLanguage}**.
    6.  Use the following HTML structure. ***All content (definition, explanation, examples and translations) must be provided solely in ${userLanguage}, regardless of the input language.***  
        <b>[Base form]</b> <i>([Part of Speech])</i>
        <p><b>Definition:</b> [Definition in ${userLanguage}]</p>
        <p><b>Explanation:</b> [Contextual explanation in ${userLanguage}]</p>
        <p><b>Example:</b></p>
        <ul>
          <li>[New Example Sentence in original language]</li>
          <li>[Translation in ${userLanguage}]</li>
        </ul>
        *Note: The structure and bolding/italics should convey the information.*

-   **Sentence Input (Structured Input: 'Input: "sentence", Context ""'):**
    1. **ALWAYS translate the entire input sentence first** into ${userLanguage}, placing it in a '<p>' tag with bolded "Translation" in ${userLanguage}.
    2. **DO NOT treat a sentence input as a single word/phrase explanation.** Do NOT output a block using only a single word/phrase explanation/template for sentence input.
    3. **AFTER the full-sentence translation**, identify any interesting, difficult, or idiomatic words/phrases in the sentence that might benefit from explanation. and explain the expressions in ${userLanguage}.
    4. For each such word or phrase, provide a concise explanation in ${userLanguage}.
    5. **Never output only a single word/phrase explanation template for any sentence input**—sentence translation is always required as the first output, followed by a list of explanations of words/phrases as appropriate.
    6.  Use the following HTML structure:
        <p><b>Translation:</b> [Translated Sentence in ${userLanguage}]</p>
        <ul>
          <li><b>[Expression]:</b> <i>[Part of speech]</i> - [Explanation in ${userLanguage}]</li>
        </ul>
        *Note: The first '<p>' tag contains the full translation. Never output only a single word/phrase explanation for sentence input; always include the full sentence translation first, and then explanations for multiple relevant expressions if applicable.*

-   **Plain Text Input (Subsequent Turns):**
    1. Respond naturally and directly in ${userLanguage}.
    2. Utilize HTML ('<p>', '<ul>', '<li>').
    3. Avoid structured outputs; adhere to a conversational context.

## Examples

### Example 0: Single Word with Context (Original language: Korean, User's language: Japanese)

**User Input:**  
Input: "마중", Context: "그녀는 역까지 나를 마중 나왔다."

**Assistant Output:**  
<b>마중</b> <i>(名詞)</i>
<p><b>Definition:</b> 出迎え</p>
<p><b>Explanation:</b> 誰かが到着する際に迎えに行くことを意味します。この文脈では、彼女が駅まで私を迎えに来てくれたという意味です。</p>
<p><b>Example:</b></p>
<ul>
  <li>나는 공항에 친구를 마중 나갔다.</li>
  <li>私は空港に友達を出迎えに行った。</li>
</ul>


### Example 1: Single Word with Context (Original language: English, User's language: Korean)

**User Input:** 
'Input: "translators", Context: "However, the ESV translators chose to translate that same word as 'servant,' closing off the potential interpretation that she held any formal position of authority."'

**Output:**
<b>translator</b> <i>(명사)</i>
<p><b>Definition:</b> 번역가, 통역사</p>
<p><b>Explanation:</b> This refers to individuals translating foreign content into their own language, as highlighted by the ESV Bible translators in context.</p>
<p><b>Example:</b></p>
<ul>
  <li>Many translators work together on complex international projects.</li>
  <li>많은 번역가들이 복잡한 국제 프로젝트에 함께 작업합니다.</li>
</ul>

### Example 2: Single Word with Context (Original language: English, User's language: Japanese)

**User Input:** 
'Input: "sat", Context: "The cat sat on the mat."'

**Assistant Output:**
<b>sit</b> <i>(動詞の過去形)</i>
<p><b>Definition:</b> 座った</p>
<p><b>Explanation:</b> 動詞 'sit (座る)' の過去形です。過去に行われた動作を表します。</p>
<p><b>Example:</b></p>
<ul>
  <li>He sat quietly in the chair.</li>
  <li>彼は静かに椅子に座った。</li>
</ul>

### Example 3: Single Word with Context (Original Language: Spanish, User Language: English)

**User Input:** 
'Input: "lograr", Context: "Debemos lograr nuestros objetivos."'

**Assistant Output:**
<b>lograr</b> <i>(verb)</i>
<p><b>Definition:</b> To achieve, to attain.</p>
<p><b>Explanation:</b> This means to successfully reach or accomplish a goal. In context, it suggests the necessity to achieve our objectives.</p>
<p><b>Example:</b></p>
<ul>
  <li>They hope to lograr success in the new venture.</li>
  <li>Ellos esperan lograr el éxito en la nueva empresa.</li>
</ul>

### Example 4: Phrase with Context (Original Language: German, User Language: French)

**User Input:** 
'Input: "imstande sein", Context: "Er war imstande, das Problem zu lösen."'

**Assistant Output:**
<b>imstande sein</b> <i>(Redewendung)</i>
<p><b>Definition:</b> Etre capable de, être en mesure de.</p>
<p><b>Explanation:</b> Cela signifie être capable ou apte à faire quelque chose. Dans ce contexte, cela indique qu'il avait la capacité de résoudre le problème.</p>
<p><b>Example:</b></p>
<ul>
  <li>Sie war imstande, die schwierige Aufgabe zu bewältigen.</li>
  <li>Elle était capable de maîtriser la tâche difficile.</li>
</ul>

### Example 5: Sentence Input (Original language: French, User's language: Japanese)

**User Input:** 
'Input: "Il a réussi à convaincre ses collègues malgré les difficultés.", Context: ""'

**Assistant Output:**
<p><b>Translation:</b> 彼は困難にもかかわらず同僚たちを説得することに成功した。</p>
<ul>
  <li><b>réussi à:</b> <i>(動詞句)</i> - 「～することに成功した」を意味します。</li>
  <li><b>malgré:</b> <i>(前置詞)</i> - 「～にもかかわらず」を表します。</li>
</ul>

### Example 6: Sentence Input (Original Language: Italian, User Language: German)

**User Input:** 
'Input: "Nonostante la pioggia, siamo andati al concerto.", Context: ""'

**Assistant Output:**
<p><b>Translation:</b> Trotz des Regens sind wir zum Konzert gegangen.</p>
<ul>
  <li><b>Nonostante:</b> <i>(Präposition)</i> - Trotz</li>
  <li><b>siamo andati:</b> <i>(Verb)</i> - Wir sind gegangen (Vergangenheit von "gehen")</li>
</ul>

### Example 7: Sentence Input (Original language: Japanese, User's language: Italian)

**User Input:** 
'Input: "彼はいつも時間に正確です。", Context: ""'

**Assistant Output:**
<p><b>Translation:</b> Lui è sempre puntuale.</p>
<ul>
  <li><b>時間に正確:</b> <i>(espressione)</i> - puntuale (essere preciso con l'orario)</li>
</ul>

### Example 8: Plain Text Input (User Language: Spanish)

**User Input:** 
"Dame otro ejemplo de 'take on' en una oración."

**Assistant Output:**
<p>Aquí tienes otro ejemplo de 'take on' en una oración:</p>
<ul>
  <li>The company decided to take on a new project to expand its services.</li>
  <li>La empresa decidió emprender un nuevo proyecto para expandir sus servicios.</li>
</ul>

## Notes

*   Prioritize outputting all content in '${userLanguage}' to enhance clarity and learning.
*   Avoid excessive word explanations in sentences; prioritize challenging parts relevant to context.
*   Maintain user clarity and effectiveness for learning experiences.
            `;
            const ttsInstructions = `
                Accent/Affect: Neutral and clear, like a professional voice-over artist. Focus on accuracy.
                Tone: Objective and methodical. Maintain a slightly formal tone without emotion.
                Pacing: Use distinct pauses between words and phrases to demonstrate pronunciation nuances. Emphasize syllabic clarity.
                Pronunciation: Enunciate words with deliberate clarity, focusing on vowel sounds and consonant clusters.
            `;
            let chatHistory = [];

            function updateChatHistoryState(currentHistory, message, role) {
                return [...currentHistory, { role: role, content: message }];
            }

            function addMessageToUI(message, isUser, container) {
                const messageDiv = createElement("div", {
                    className: `${isUser ? 'user-message' : 'bot-message'}`,
                    innerHTML: message
                });
                container.appendChild(messageDiv);
                container.scrollTop = container.scrollHeight;
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
                                generationConfig: { temperature: 0.7, maxOutputTokens: 500}
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

            async function handleSendMessage() {
                const userInput = document.getElementById("user-input")
                const chatContainer = document.getElementById("chat-container")

                const message = userInput.value.trim();
                if (!message) return;

                const userMessage = message;
                userInput.value = '';

                addMessageToUI(userMessage, true, chatContainer);
                chatHistory = updateChatHistoryState(chatHistory, userMessage, "user");
                const botResponse = await getBotResponse(llmProvider, llmApiKey, llmModel, chatHistory);
                addMessageToUI(botResponse, false, chatContainer);
                chatHistory = updateChatHistoryState(chatHistory, botResponse, "assistant");
            }

            function getSelectedWithContext() {
                const selectedTextElement = targetSectionHead.querySelector(".reference-word");
                const contextElement = (document.querySelector("span.selected-text, span.is-selected") || {}).parentElement || null;
                const selectedText = selectedTextElement ? selectedTextElement.textContent.trim() : "";
                const contextText = contextElement ? contextElement.innerText.trim() : "";

                return `Input: "${selectedText}"` +  `, Context: "${contextText}"`;
            }

            async function updateChatWidget(){
                if (!settings.chatWidget) return;

                const chatWrapper = createElement("div", { id: "chat-widget", style: "margin: 10px 0;" });
                const chatContainer = createElement("div", { id: "chat-container" });
                const inputContainer = createElement("div", { className: "input-container" });
                const userInput = createElement("input", { type: "text", id: "user-input", placeholder: "Ask anything" });
                const sendButton = createElement("button", { id: "send-button", textContent: "Send" });

                inputContainer.appendChild(userInput);
                inputContainer.appendChild(sendButton);
                chatWrapper.appendChild(chatContainer);
                chatWrapper.appendChild(inputContainer);

                userInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
                    }
                    event.stopPropagation();
                }, true);
                sendButton.addEventListener('click', handleSendMessage);

                if (llmProvider === 'openai') chatHistory = updateChatHistoryState(chatHistory, systemPrompt, "system");

                if (settings.askSelected) {
                    const initialUserMessage = getSelectedWithContext();

                    chatHistory = updateChatHistoryState(chatHistory, initialUserMessage, "user");
                    const botResponse = await getBotResponse(llmProvider, llmApiKey, llmModel, chatHistory);
                    addMessageToUI(botResponse, false, chatContainer);
                    chatHistory = updateChatHistoryState(chatHistory, botResponse, "assistant");
                }

                const existingChatWidget = document.getElementById('chat-widget');
                if(existingChatWidget) {
                    existingChatWidget.replaceWith(chatWrapper);
                } else {
                    targetSectionHead.appendChild(chatWrapper);
                }
            }

            async function updateTTS() {
                if (!settings.tts) return;

                const ttsButton = await waitForElement('.is-tts');
                const isWord = document.querySelector("span.selected-text, span.is-selected");
                if (!settings.ttsSentence && !isWord) {
                    ttsButton.click();
                    return;
                }
                if (!settings.ttsWord && isWord) {
                    ttsButton.click();
                    return;
                }

                const selectedTextElement = document.querySelector(".reference-word");
                const selectedText = selectedTextElement ? selectedTextElement.textContent.trim() : "";

                let audioData = await openAITTS(`${selectedText}`, settings.ttsApiKey, settings.ttsVoice, 1.0, ttsInstructions);
                if (audioData == null) return;

                const newTtsButton = createElement("button", {id: "playAudio", textContent: "🔊", className: "is-tts"});
                newTtsButton.addEventListener('click', async (event) => {
                    await playAudio(audioData, 0.7);
                })
                ttsButton.replaceWith(newTtsButton);

                playAudio(audioData, 0.7);
            }

            await updateChatWidget();
            await updateTTS();

            const selectedTextElement = targetSectionHead.querySelector(".reference-word");
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type !== 'characterData') return;
                    updateChatWidget();
                    updateTTS();
                });
            });
            observer.observe(selectedTextElement, {subtree: true, characterData: true});
        }

        const userDictionaryLang = await getDictionaryLanguage();
        const DictionaryLocalePairs = await getDictionaryLocalePairs()
        const userLanguage = DictionaryLocalePairs[userDictionaryLang];
        const lessonReader = document.getElementById('lesson-reader');

        const observer = new MutationObserver((mutations) => {
            if (!settings.chatWidget) return;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;

                    if (node.matches(".widget-area")) {
                        updateWidget();
                    }
                });
            });
        });
        observer.observe(lessonReader, {childList: true});
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
                console.log(`lessonId: ${lessonId}`);
                const lessonInfo = await getLessonInfo(lessonId);

                const wordIndicatorItems = lessonElement.querySelector(".word-indicator--item");
                if (!wordIndicatorItems) { return; }

                const lingqsPercentage = Math.round((lessonInfo.cardsCount / lessonInfo.uniqueWordsCount) * 100);
                const lingqsElement = lessonElement.querySelector('.word-indicator--item[title="LingQs"] > span > span');
                lingqsElement.textContent = `${lessonInfo.cardsCount} (${lingqsPercentage}%)`;

                addKnownWordsIndicator(lessonElement, lessonInfo);
            }

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.classList && node.classList.contains('library-item-wrap')) {
                                const lessonId = node.id.split("--")[1].split("-")[0];
                                updateWordIndicatorPercentages(node, lessonId);
                            }
                        });
                    }
                });
            });

            const targetNode = document.querySelector('.library-section .library-list');
            console.log(targetNode);
            const config = { childList: true, subtree: true };
            observer.observe(targetNode, config);
        }

        function enableCourseSorting() {
            const dropdownItems = document.querySelectorAll('.library-section > .list-header .tw-dropdown--item');
            if (dropdownItems.length) {
                // Setup library sort event listener
                dropdownItems.forEach((item, index) => {
                    item.addEventListener('click', () => {
                        console.log(`Clicked sort option: ${index}`);
                        storage.set('librarySortOption', index);
                        settings.librarySortOption = index;
                    });
                });

                // Change sort by the setting
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
                if (!confirmed) { return; }

                for (const lesson of allLessons) {
                    await setLessonProgress(lesson.id, 0);
                    console.log(`Reset lesson ID: ${lesson.id} to the first page`);
                }

                alert(`Successfully reset ${allLessons.length} lessons to their starting positions.`);
            });
        }

        const libraryHeader = await waitForElement('.library-section > .list-header');
        createCourseUI();
        setupCourseStyles();

        enrichLessonDetails();
        enableCourseSorting();
        setupLessonResetButton();
    }

    function fixBugs() {
        const resizeToast = () => {
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
            createUI();
            applyStyles(settings.styleType, settings.colorMode);
            setupKeyboardShortcuts();
            setupYoutubePlayerCustomization();
            changeScrollAmount();
            setupSentenceFocus();
            setupLLMs();
        }
        if (document.URL.includes("library")) {
            setupCourse();
        }
    }

    init();
})();