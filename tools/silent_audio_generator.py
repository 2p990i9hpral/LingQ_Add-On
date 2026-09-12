import os
import sys
import re
import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox

def get_ffmpeg_path():
    # 1. Check PyInstaller bundle
    if hasattr(sys, '_MEIPASS'):
        bundled = os.path.join(sys._MEIPASS, 'ffmpeg.exe')
        if os.path.exists(bundled):
            return bundled

    # 2. Check next to script or executable
    script_dir = os.path.dirname(os.path.abspath(__file__))
    local_ffmpeg = os.path.join(script_dir, 'ffmpeg.exe')
    if os.path.exists(local_ffmpeg):
        return local_ffmpeg

    # 3. Check common Windows installation paths
    for fallback in [r'C:\ffmpeg\ffmpeg.exe', r'C:\ffmpeg\bin\ffmpeg.exe']:
        if os.path.exists(fallback):
            return fallback

    # 4. Fallback to system PATH
    return 'ffmpeg'

def create_silent_audio(ffmpeg, mp4_path):
    try:
        # Retrieve duration from mp4 metadata safely
        flags = 0x08000000 if sys.platform == 'win32' else 0
        probe = subprocess.run(
            [ffmpeg, '-i', mp4_path],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            creationflags=flags
        )
        output = (probe.stderr or '') + '\n' + (probe.stdout or '')
        match = re.search(r'Duration:\s*(\d+:\d+:\d+\.\d+)', output)
        if not match:
            return False

        duration = match.group(1)
        out_path = os.path.splitext(mp4_path)[0] + '.mp3'

        # Generate ultra-compact 8kbps 8000Hz mono silent mp3 with matching duration
        cmd = [
            ffmpeg, '-y', '-f', 'lavfi',
            '-i', 'anullsrc=channel_layout=mono:sample_rate=8000',
            '-t', duration, '-c:a', 'libmp3lame', '-b:a', '8k', out_path
        ]
        res = subprocess.run(cmd, capture_output=True, creationflags=flags)
        return res.returncode == 0
    except Exception:
        return False

def main():
    root = tk.Tk()
    root.withdraw()

    # Read from arguments (e.g. drag & drop) or open file dialog
    files = [f for f in sys.argv[1:] if f.lower().endswith('.mp4')]
    if not files:
        files = filedialog.askopenfilenames(
            title="Select MP4 Videos",
            filetypes=[("MP4 Video", "*.mp4")]
        )

    if not files:
        return

    ffmpeg = get_ffmpeg_path()
    success_count = sum(1 for f in files if create_silent_audio(ffmpeg, f))

    messagebox.showinfo(
        "Silent Audio Generator",
        f"Completed!\nGenerated {success_count} / {len(files)} silent MP3 file(s)."
    )

if __name__ == '__main__':
    main()
