# LingQ Reader UI Redesign (2026-11) 종합 분석 및 변경점 정리

- **작성일자:** 2026-11-03
- **분석 대상:**
  - Audio Lesson: `https://www.lingq.com/en/learn/ja/web/reader/46110054`
  - Video Lesson (YouTube): `https://www.lingq.com/en/learn/en/web/reader/46605268`
  - Text-Only Lesson: `https://www.lingq.com/en/learn/en/web/reader/44551368`
- **목적:** LingQ의 대규모 UI 개편(Tailwind CSS + Radix UI 마이그레이션)에 따른 DOM 구조 분석 및 userscript(`lingq_add-on.js`) 수정을 위한 레퍼런스 문서

---

## 1. 개요 및 핵심 변경 사항 요약

LingQ 웹 리더가 기존의 커스텀 BEM 스타일 클래스(`section--player`, `sentence-text`, `widget-area` 등)와 고정 ID(`#lesson-reader`) 중심 구조에서 **Tailwind CSS + Radix UI (Shadcn 스타일)** 기반의 현대적인 컴포넌트 아키텍처로 완전히 교체되었습니다.

### 주요 핵심 변화
1. **기존 최상위 컨테이너 `#lesson-reader` 완전 제거**:
   - `main[data-slot="sidebar-inset"]` 및 내부 `.reader-appearance`, `div[data-reader-mode-body="true"]`로 변경.
2. **Page Mode / Scroll Mode 공식 네이티브 지원**:
   - 기존에는 애드온에서 자체적으로 DOM을 분할하여 구현했던 페이징 기능(`usePageMode`)이 LingQ 공식 기능으로 탑재됨.
   - `button[aria-label^="Reading mode:"]` 드롭다운을 통해 두 모드를 공식 전환 가능.
3. **오디오/비디오 싱크("Sync text with audio") 네이티브 지원**:
   - 재생 중인 문장/단어에 네이티브로 `.playing` 클래스가 동적으로 부여됨.
   - 이에 따라 애드온의 수동 추적 기능(`focusPlayingSentence`)을 비활성화하고 공식 기능을 활용 가능.
4. **DOM 내 `<audio>` 엘리먼트 부재**:
   - DOM 트리에 `<audio>` 태그가 전혀 존재하지 않음. JavaScript 메모리 상의 `new Audio()` 또는 Web Audio API를 통해 재생/제어됨.
5. **비디오 레슨 (YouTube) 네이티브 레이아웃 지원**:
   - 기존 애드온의 커스텀 비디오 배치(상하/좌우 분할)를 대체하는 **네이티브 Split view(좌우 분할)** 및 **Theater mode(전체 화면)** 기능이 탑재됨.
6. **텍스트 전용 레슨 (Text-Only Lesson)의 플레이어 미렌더링**:
   - 오디오/비디오가 없는 레슨은 하단 플레이어 바(`div[role="group"][aria-label="Lesson player"]`)가 `display: none`이 아니라 **DOM 트리에서 완전히 렌더링되지 않음(null)**.
   - 기존 애드온의 `waitForElement('.section--player')`처럼 플레이어를 무조건 대기하는 로직은 텍스트 레슨에서 타임아웃 및 블로킹을 유발하므로 조건부 처리가 필수.

---

## 2. 레슨 유형별(Audio / Video / Text) 식별 및 특성

| 레슨 유형 | 감지 조건 (Selector Condition) | 플레이어 바 렌더링 여부 | 본문 모드 (Page/Scroll) |
| :--- | :--- | :--- | :--- |
| **Audio Lesson** | `!document.querySelector('[data-reader-video-stage="true"]')`<br>&& `document.querySelector('[aria-label="Lesson player"], footer button[aria-label="Play"]')` | 축소(Pill) 또는 확장(Full bar) 상태로 렌더링됨 | Page Mode / Scroll Mode 모두 지원 (오디오 싱크 작동) |
| **Video Lesson** | `!!document.querySelector('[data-reader-video-stage="true"]')` | 축소 시 단독 원형 재생 버튼, 확장 시 Full bar 렌더링 | Page Mode / Scroll Mode 모두 지원 (비디오 싱크 작동) |
| **Text-Only Lesson** | `!document.querySelector('[data-reader-video-stage="true"]')`<br>&& `!document.querySelector('[aria-label="Lesson player"]')`<br>&& `!document.querySelector('footer button[aria-label="Play"]')` | **DOM에 전혀 렌더링되지 않음 (완전 부재)** | Page Mode / Scroll Mode 모두 지원 |

---

## 3. UI 구조 및 셀렉터 상세 매핑 (Old vs New)

### (1) 메인 래퍼 & 뷰 모드

| 항목 | 기존 셀렉터 (Old) | 신규 셀렉터 (New) | 설명 / 속성 |
| :--- | :--- | :--- | :--- |
| **최상위 리더 컨테이너** | `#lesson-reader` | `main[data-slot="sidebar-inset"]` | 레이아웃 전체 감싸는 루트 |
| **리더 테마/외형 래퍼** | `#lesson-reader` | `.reader-appearance` | 폰트/테마 스타일 적용 컨테이너 |
| **본문 모드 래퍼** | `.reader-container` | `div[data-reader-mode-body="true"]` | 읽기 모드 본문 영역 |
| **읽기 모드 전환 버튼** | N/A (애드온 자체 구현) | `button[aria-label^="Reading mode:"]` | 클릭 시 Page Mode / Scroll Mode 선택 드롭다운 오픈 |
| **텍스트 컨테이너 (Scroll Mode)** | `.sentence-text` | `div[data-reader-mode-body="true"] > div.scroll-smooth.overflow-y-auto` | 스크롤 모드 스크롤 컨테이너 |
| **텍스트 바디 (Scroll Mode)** | `.sentence-text` | `.reader-body.mx-auto.w-full[data-playing="underline"]` | 본문 텍스트 루트 |
| **텍스트 컨테이너 (Page Mode)** | N/A (애드온 커스텀) | `div[data-reader-mode-body="true"] > div.touch-pan-y` | 터치/제스처 지원 페이지 래퍼 |
| **텍스트 바디 (Page Mode)** | N/A (애드온 커스텀) | `.reader-body.min-h-0.w-full.flex-1` | 페이지 모드 본문 영역 |
| **이전 페이지 버튼** | 애드온 생성 버튼 | `button[aria-label="Previous page"]` | 첫 페이지일 경우 `div.hidden.w-12.md:block[aria-hidden="true"]` 렌더링 |
| **다음 페이지 버튼** | 애드온 생성 버튼 | `button[aria-label="Next page"]` | 페이지 모드 다음 페이지 이동 |
| **페이지 진행 슬라이더** | 애드온 생성 바 | `input[type="range"][aria-label="Lesson progress"]` | 상단 헤더에 위치한 페이지 진행 바 (`aria-valuetext="Page X of Y"`) |

---

### (2) 텍스트, 문장 및 단어 구조

#### Scroll Mode 텍스트 구조
```html
<div class="reader-body mx-auto w-full" data-playing="underline">
  <h1 class="reader-heading">레슨 제목</h1>
  <p class="reader-paragraph">
    <span class="reader-sentence" data-s="0">
      <span class="sentence-item ar-known" data-word-index="0" data-sentence-index="0">単語</span>
      ...
    </span>
    ...
  </p>
</div>
```

#### Page Mode 텍스트 구조
```html
<div class="reader-body min-h-0 w-full flex-1">
  <div class="poc-page">
    <div class="poc-column">
      <div class="poc-line" style="top: ...; left: ...; position: absolute;">
        <span class="sentence-item ar-known" data-word-index="0" data-sentence-index="0">単語</span>
        ...
      </div>
    </div>
  </div>
</div>
```

#### 셀렉터 비교표

| 항목 | 기존 셀렉터 (Old) | 신규 셀렉터 (New) | 비고 |
| :--- | :--- | :--- | :--- |
| **문단 (Paragraph)** | `.sentence-text p` | `p.reader-paragraph` | Scroll Mode 전용 |
| **문장 컨테이너** | `.sentence`, `.reader-sentence` | `span.reader-sentence[data-s="<index>"]` | Scroll Mode 전용 |
| **단어 요소 (Word)** | `span.word`, `.sentence-item` | `span.sentence-item` | Page/Scroll 공통. `data-word-index`, `data-sentence-index`, `data-word-id` 보유 |
| **신규/미학습 단어 (Blue)** | `.is-new`, `.new-word` | `.sentence-item.ar-new` | 파란색 단어 |
| **기존 아는 단어 (Known)** | `.is-known` | `.sentence-item.ar-known` | 흰색/투명 단어 |
| **LingQ 단계별 (1~4)** | `.status-1` ~ `.status-4` | `.sentence-item.ar-lingq.ar-lingq-0` ~ `.ar-lingq-3` | 단계 4는 추가로 `.ar-learned` 보유 |
| **선택된 단어 (Selected)** | `span.is-selected`, `span.selected-text` | `.sentence-item.selected.sel-word` | 포커스된 단어 |
| **후리가나/루비 (Ruby)** | `.sentence-item--ruby` | `ruby.sentence-item--ruby > span.sentence-item + rt.sentence-item--transliteration` | 루비 태그 내부에 단어 span과 rt 배치 |
| **오디오/비디오 싱크 하이라이트** | `.sentence.is-playing` (애드온 제어) | Scroll: `span.reader-sentence.playing`<br>Page: `span.sentence-item.playing` | 네이티브 자동 부여 |

---

### (3) 오디오 & 비디오 플레이어 컨트롤 (Footer Bar)

- **플레이어 루트:** `div[role="group"][aria-label="Lesson player"]`
- 오디오 레슨에서는 Pill 형태(축소) 또는 바 형태(확장)로 렌더링.
- 비디오 레슨에서는 축소 시 좌측 원형 재생 버튼만 표시되며, 확장 시 하단 바에 비디오 제어 도구가 함께 표시됨.
- **텍스트 전용 레슨에서는 루트 엘리먼트 자체가 DOM에 없음.**

| 컨트롤 항목 | 기존 셀렉터 (Old) | 신규 셀렉터 (New) | 속성 및 특징 |
| :--- | :--- | :--- | :--- |
| **플레이어 컨테이너** | `.section--player` | `div[role="group"][aria-label="Lesson player"]` | `footer` 내에 위치 (오디오/비디오 전용) |
| **재생 버튼 (일시정지 중)** | `.section--player button.lingq-audio-player` | `footer button[aria-label="Play"]` | 내부 `svg.lucide-play` 보유, 단축키 Space |
| **일시정지 버튼 (재생 중)** | `.section--player button.lingq-audio-player` | `footer button[aria-label="Pause"]` | 내부 `svg.lucide-pause` 보유, 단축키 Space |
| **플레이어 확장 토글** | `.section--player.is-expanded` 버튼 | `button[aria-label="Expand player"]` | `aria-expanded="false"`, `svg.lucide-chevron-right` |
| **플레이어 축소 토글** | N/A | `button[aria-label="Collapse player"]` | `aria-expanded="true"`, `svg.lucide-chevron-down` |
| **탐색 슬라이더 (Expanded)** | `.rc-slider-handle` | `span[role="slider"][aria-label="Seek"]` | `aria-valuenow`, `aria-valuemax`, `aria-valuetext` |
| **시간 표시 (Expanded)** | `.audio-player--time` | `div[aria-label="Lesson player"] span.tabular-nums` | 예: `"1:30 / 12:28"` 텍스트 노출 |
| **5초 뒤로 이동 (Replay)** | `.controller-item--backward` | `button[aria-label="Replay 5 seconds"]` | `title="Replay 5 seconds (Shift+<)"` |
| **5초 앞으로 이동 (Forward)** | `.controller-item--forward` | `button[aria-label="Forward 5 seconds"]` | `title="Forward 5 seconds (Shift+>)"` (확장 상태) |
| **재생 속도 (Speed)** | `.controller-item--speed` | `button[aria-label^="Playback speed"]` | `title="Playback speed"`, 텍스트 `"1×"`, `"2×"` |
| **오디오 반복 (Loop)** | N/A | `button[aria-label="Loop Audio"]` | `svg.lucide-repeat-2` |
| **기타 옵션 (More)** | N/A | `button[aria-label="More player options"]` | `data-slot="dropdown-menu-trigger"` |

---

### (4) Video Lesson 전용 UI 및 네이티브 레이아웃

- **비디오 스테이지 컨테이너:** `div[data-reader-video-stage="true"]`
- **유튜브 iframe:** `div[data-reader-video-stage="true"] iframe` (`class="size-full"`, YouTube Embed)

#### A. 기본 상단 배치 구조
```html
<div class="relative flex min-h-0 flex-1 flex-col">
  <div class="contents">
    <!-- 비디오 상단 -->
    <div class="shrink-0 px-6 pt-3">
      <div data-reader-video-stage="true" class="... aspect-video max-w-[490px]">
        <div class="absolute inset-0 size-full">
          <iframe src="https://www.youtube.com/embed/..."></iframe>
        </div>
      </div>
    </div>
    <!-- 텍스트 하단 -->
    <div data-reader-mode-body="true">...</div>
  </div>
</div>
```

#### B. 네이티브 Split View (좌우 분할 모드)
- **트리거 버튼:** `button[aria-label="Split view"]` (확장된 플레이어 바 내 위치, icon: `svg.lucide-columns-2`, `aria-pressed="true|false"`)
- **활성화 시 DOM 변화:**
  - 부모 `div.contents`가 CSS Grid로 전환됨:
    `<div class="grid min-h-0 flex-1 grid-cols-2 gap-6 pl-6">`
  - 좌측 열: 비디오 스테이지 (`<div class="min-h-0 self-center"><div data-reader-video-stage="true">...</div></div>`)
  - 우측 열: 텍스트 컨테이너 (`<div data-reader-mode-body="true">...</div>`)
  - *기존 애드온의 커스텀 좌우 분할 CSS를 대체 가능.*

#### C. 네이티브 Theater Mode (극장 모드)
- **트리거 버튼:** `button[aria-label="Theater mode"]` (`title="Theater mode (Esc)"`, icon: `svg.lucide-maximize`)
- **종료 버튼:** `button[aria-label="Exit theater mode"]` 또는 `Esc` 키
- **활성화 시 DOM 변화:**
  - `<div class="relative min-h-0 flex-1 bg-black"> > div.absolute.inset-0 > div[data-reader-video-stage="true"].aspect-auto.h-full.max-w-none`

---

### (5) 위젯 및 사이드바 (Word Card & LLM Widget Area)

- **사이드바 컨테이너:** `div[data-reader-side-column="true"]`
  *(사이드바가 닫히면 `class="contents"`가 붙으며 레이아웃 폭이 0이 됨)*
- **위젯 루트:** `div[data-reader-widget]` 또는 `div[role="region"][aria-label="Widget sidebar"]`
- **단어 위젯:** `div[data-word-widget]`

| 위젯 구성 요소 | 기존 셀렉터 (Old) | 신규 셀렉터 (New) | 설명 |
| :--- | :--- | :--- | :--- |
| **위젯 헤더 마운트 타겟** | `#lesson-reader .widget-area > .reader-widget > .section-widget--head` | `div[data-word-widget]` 또는 내부 최상단 영역 | 애드온 챗/사전 위젯 삽입 위치 |
| **선택 단어 표제어** | `.reference-word` | `div[data-word-widget] bdi[dir="ltr"]` | 클릭된 단어의 텍스트가 표시되는 엘리먼트 |
| **단어 발음 듣기 (TTS)** | `.audio-player--listen` | `div[data-word-widget] button[aria-label="Listen"]` | 단어 발음 오디오 버튼 (`svg.lucide-volume-2`) |
| **사이드바 토글 버튼** | N/A | `button[data-widget-sidebar-toggle="true"]` | `aria-label="Hide widget sidebar"` / `"Show widget sidebar"` |
| **의미 목록 (Meanings)** | `.widget-meanings` | `div[data-word-widget] section` (Heading: `Meanings`) | 사용자 및 사전 정의 목록 |
| **문장 섹션 (Sentence)** | `.widget-sentence` | `div[data-word-widget] section` (Heading: `Sentence`) | 예문 및 번역 표시 |
| **단어 상태 버튼 (Status 1~4, Known, Ignore)** | `.status-item` | `button[data-slot="button-status"][data-variant="..."]` | `data-variant` 값: `ignore`, `new`, `recognized`, `familiar`, `learned`, `known` / 활성 상태: `data-is-active="true"` |
| **외부 사전 버튼** | `.external-dict` | `button[data-slot="button"][data-variant="outlineDefault"]` | 네이버 일본어 사전, 구글 번역 등 외부 사전 버튼 |

---

### (6) 상단 헤더 및 네비게이션

- **상단 헤더 컨테이너:** `div.relative.z-40.shrink-0.lg:pt-2`

| 네비게이션 요소 | 기존 셀렉터 (Old) | 신규 셀렉터 (New) | 비고 |
| :--- | :--- | :--- | :--- |
| **레슨 나가기 (뒤로가기)** | `button[data-variant="link"]`, `svg.lucide-chevron-left` | `button[aria-label="Exit lesson"]` | `svg.lucide-log-out` 아이콘 |
| **폰트 및 외형 설정** | N/A | `button[aria-label="Theme and font"][data-slot="popover-trigger"]` | `svg.lucide-case-sensitive` |
| **리더 옵션 메뉴 트리거** | 헤더 우측 버튼들 | `button[aria-label="Reader options"][data-slot="dropdown-menu-trigger"]` | `svg.lucide-ellipsis-vertical` |
| **이전 레슨 이동** | 헤더 내 직접 버튼 | `button[role="menuitem"][aria-label="Previous lesson"]` | **Reader options 메뉴 내부로 이동** |
| **다음 레슨 이동** | 헤더 내 직접 버튼 | `button[role="menuitem"][aria-label="Next lesson"]` | **Reader options 메뉴 내부로 이동** |
| **사이드바 열기 (닫혀있을 때)** | N/A | `button[data-widget-sidebar-toggle="true"][aria-label="Show widget sidebar"]` | `svg.lucide-panel-right` |

---

## 4. 핵심 주목할 점 및 userscript(`lingq_add-on.js`) 영향 분석

### 1. `document.querySelector('audio')` 절대 불가
- 오디오 제어(스킵, 일시정지, 볼륨 등) 시 이전처럼 DOM의 `<audio>` 엘리먼트를 찾아서 `audio.currentTime`이나 `audio.volume`을 조작하는 방식은 완전히 불가능합니다.
- 대안:
  - LingQ 공식 버튼 트리거 (`button[aria-label="Play"]`, `button[aria-label="Replay 5 seconds"]`, `button[aria-label="Forward 5 seconds"]` 등).
  - 슬라이더 직접 드래그/인풋 이벤트 (`span[role="slider"][aria-label="Seek"]`).
  - 단축키 이벤트 디스패치 (`Space`, `Shift + <`, `Shift + >`).

### 2. 텍스트 레슨의 플레이어 부재에 따른 타임아웃 방지 필수
- `setupReader`에서 `await waitForElement(".section--player", 10000)`를 실행하던 부분:
  - 텍스트 레슨의 경우 플레이어가 존재하지 않으므로 무조건 10초 타임아웃이 발생하고 후속 로직이 지연되거나 중단됩니다.
  - 개선책: 플레이어가 있는 레슨인지 먼저 체크하거나, 오디오/비디오 레슨일 때만 플레이어 감시기를 비동기로 연결해야 합니다.

### 3. Page Mode DOM의 줄 단위 절대 위치 지정(`.poc-line`)
- Page Mode에서는 일반적인 `<p>`나 인라인 흐름이 아니라, 가상화/페이지네이션 렌더러가 작동하여 `.poc-line`에 `style="position: absolute; top: ..."` 형태로 한 줄씩 배치됩니다.
- 한 문장이 다음 줄로 넘어갈 경우 줄(`poc-line`) 단위로 분할되므로, 문장 전체를 감싸는 부모 태그가 없고 단어 span의 `data-sentence-index` 속성으로만 문장을 식별해야 합니다.
- 반면 Scroll Mode는 `span.reader-sentence[data-s="..."]`로 문장이 묶여 있습니다.

### 4. 네이티브 기능 도입으로 제거/간소화할 수 있는 애드온 코드
- **`settings.focusPlayingSentence` (재생 문장 포커스)**: LingQ가 오디오/비디오 재생 위치에 맞춰 자동으로 스크롤 및 `.playing` 클래스를 부여하므로 MutationObserver 기반 수동 스크롤 제거 가능.
- **`settings.usePageMode` (커스텀 페이징)**: LingQ 공식 Page Mode가 도입되었으므로 애드온 내부의 번거로운 DOM 분할, 높이 계산, 커스텀 페이징 로직 비활성화 가능.
- **`generateVideoCSS` (커스텀 비디오 레이아웃)**: LingQ 공식 Split View (`button[aria-label="Split view"]`) 및 Theater Mode가 탑재되어 기존의 복잡한 그리드 오버라이드 CSS 간소화 가능.
