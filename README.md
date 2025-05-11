# LingQ Addon

<img src="images/layout.png" width=800></br>

<img src="images/course.png" width=800></br>

A GreaseMonkey/Tampermonkey UserScript that enhances the LingQ language learning platform.

## Features

*   **Customizable Layouts:**
    *   Video layout:  Displays the video below with the text above.
    *   Video 2 layout: Displays the video on the right side, with the text to the left. Optimized for wide screens.
    *   Audio layout: Optimized for lessons with audio.
    *   Off layout: Disables layout changes and focuses on the sentence mode. Provides a movable, resizable video.

*   **Appearance Customization:**
    *   Adjustable font size and line height for improved readability.
    *   Dark and Light color themes, with customizable color palette.
*   **Vocabulary Downloading:**
    *   Download known and unknown words and phrases from the LingQ interface in CSV format.
*   **Workflow Enhancements:**
    *   Keyboard controls for common tasks (marking words as known, enabling/disabling full screen for video, moving video time, copying selected vocab, or inputing meaning for vocab.
    *   Optional automatic lesson completion upon audio or video completion.
    *   Improved sentence focus ensures sentence being played is automatically moved to the center of the screen.
    *  Reset course to first position button.
    *  Known words indicator on the library page with percentage detail.
    *  Default course sorting option.
*   Enhanced YouTube player compatibility:
    *   Enables keyboard control on the player.
    *   Turns on caption default.
    *   Disables the player controller.
    *   Adds a video progress indicator synced with the audio player's progress.
*   Smooth scrolling for better reading flow.

## Installation

1.  Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/).
3.  Install the script from https://greasyfork.org/en/scripts/533096-lingq-addon.
4.  Visit LingQ, and the addon features will be active on reader pages.

## Usage

Once installed, an "⚙️" (settings), "💾" (download words) and a "✔" (complete lesson) will be added to the main navigation bar of LingQ when on a lesson page.

### Settings

Click the "⚙️" icon to open the settings popup.  From there, you can adjust:

*   **Layout style**: Select preset reader layouts.
*   **Font Settings**: Adjust font size and line height.
*   **Color Mode**: Select light or dark color mode and customize colors, including font, LingQ background and border, and underlining.
*  **Auto Finishing**: automatically complete the lesson after finishing

### Downloading Words

Click the "💾" icon to export LingQ, after clicking a popup will open.  Use the buttons to download the following:

*   **Download Unknown LingQs:** Exports LingQs (words + phrases) with statuses 1, 2, 3, and 4 as a CSV file.
*   **Download Unknown LingQ Words:** Exports words with status 1, 2, 3, and 4
*   **Download Unknown LingQ Phrases:** Exports phrases with status 1, 2, 3, and 4
*   **Download Known LingQs:** Exports known LingQs (words + phrases) as a CSV file.
*   **Download Known Words:** Exports known words as a CSV file.

### Completing Lesson
Click the "✔" icon to complete the lesson.

### Reset Course

Library courses will have an option to reset lessons to thier first position.

### Known Words Indicator
Library Lessons are enhanced with and indicator for known words.

### Keyboard Shortcuts

The following keyboard shortcuts are available:

*   `q`: Toggle video full screen
*   `w`: move back video by 5 seconds
*   `e`: move forward video by 5 seconds
*   `r`: Make word Known
*   `t`: Open Translator
*   `` ` ``: Move cursor to reference input
*   `d` or `f`: Open dictionary
*   `c`: Copy selected text

## Contributing

Feel free to contribute to the project by submitting pull requests or opening issues to report bugs or suggest new features.

## License

[MIT License](LICENSE) (Choose the appropriate license)