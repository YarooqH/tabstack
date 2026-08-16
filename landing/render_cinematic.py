import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "f:/Just Some Files/opensource/tabstack/landing/assets"
TEMP_FRAMES_DIR = "f:/Just Some Files/opensource/tabstack/landing/temp_frames"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_FRAMES_DIR, exist_ok=True)

POPUP_PATH = os.path.join(OUTPUT_DIR, "extension-popup.png")
popup_img = Image.open(POPUP_PATH).convert("RGBA") if os.path.exists(POPUP_PATH) else None

W, H = 1200, 700
FPS = 30
TOTAL_SECONDS = 8
TOTAL_FRAMES = FPS * TOTAL_SECONDS

# Color Tokens
BG_PAGE = (10, 10, 10)
BG_WINDOW = (16, 16, 16)
BG_CHROME = (20, 20, 20)
BG_TAB_CHAOS = (26, 26, 26)
BG_TAB_ACTIVE = (36, 36, 36)
BORDER_COLOR = (42, 42, 42)
TEXT_WHITE = (245, 245, 245)
TEXT_MUTED = (160, 160, 160)
TEXT_DIM = (100, 100, 100)
ACCENT_GREEN = (34, 197, 94)
ACCENT_RED = (239, 68, 68)
ACCENT_PURPLE = (168, 85, 247)
ACCENT_BLUE = (14, 165, 233)
ACCENT_LINEAR = (59, 130, 246)
ACCENT_ORANGE = (245, 158, 11)

font = ImageFont.load_default()

def ease_out_cubic(x):
    return 1 - math.pow(1 - x, 3)

def ease_in_out_quad(x):
    return 2 * x * x if x < 0.5 else 1 - math.pow(-2 * x + 2, 2) / 2

print(f"Rendering {TOTAL_FRAMES} frames for cinematic showcase...")

for i in range(TOTAL_FRAMES):
    t = i / TOTAL_FRAMES # 0.0 to 1.0
    sec = i / FPS
    
    img = Image.new("RGBA", (W, H), BG_PAGE)
    draw = ImageDraw.Draw(img)
    
    # 1. Subtle Glow Background behind window
    glow_alpha = int(25 + 15 * math.sin(t * math.pi * 2))
    # Ambient corner lighting
    draw.rounded_rectangle([40, 30, W-40, H-30], radius=16, fill=(18, 18, 20), outline=(50, 50, 55), width=1)
    
    # 2. Window Chrome Top Bar (y: 30 to 76)
    draw.rounded_rectangle([40, 30, W-40, 76], radius=16, fill=BG_CHROME)
    draw.rectangle([40, 60, W-40, 76], fill=BG_CHROME) # square off bottom corners
    draw.line([40, 76, W-40, 76], fill=BORDER_COLOR, width=1)
    
    # Traffic lights
    draw.ellipse([58, 48, 68, 58], fill=(255, 95, 86))
    draw.ellipse([74, 48, 84, 58], fill=(255, 189, 46))
    draw.ellipse([90, 48, 100, 58], fill=(39, 201, 63))
    
    # 3. Tab Bar Rendering (y: 38 to 68)
    tab_x_start = 120
    
    # Determine Phase
    # Phase 1: (0.0s to 2.2s) - Chaos (32 cramped tabs)
    # Phase 2: (2.2s to 4.5s) - Click Stack Now & Smooth Cluster Transition
    # Phase 3: (4.5s to 6.5s) - Accordion Focus (Click YouTube, expand YouTube, collapse others)
    # Phase 4: (6.5s to 8.0s) - Memory Hibernation (Sleep badges, RAM drops to 180 MB)
    
    if sec < 2.0:
        # Phase 1: Chaos Tabs
        num_tabs = 24
        tab_w = 40
        for ti in range(num_tabs):
            tx = tab_x_start + ti * (tab_w + 2)
            if tx + tab_w > W - 140:
                break
            is_active = (ti == 0)
            tcol = BG_TAB_ACTIVE if is_active else BG_TAB_CHAOS
            draw.rounded_rectangle([tx, 40, tx + tab_w, 68], radius=4, fill=tcol, outline=BORDER_COLOR)
            # tiny favicon dot
            fav_col = ACCENT_PURPLE if ti % 4 == 0 else ACCENT_RED if ti % 4 == 1 else ACCENT_BLUE if ti % 4 == 2 else ACCENT_LINEAR
            draw.rectangle([tx + 5, 52, tx + 11, 58], fill=fav_col)
            draw.line([tx + 15, 55, tx + tab_w - 6, 55], fill=TEXT_DIM if not is_active else TEXT_WHITE, width=2)
            
    elif sec < 4.2:
        # Phase 2: Transformation & Clustered
        progress = min(1.0, (sec - 2.0) / 0.8)
        e = ease_out_cubic(progress)
        
        # 4 Stacks gliding in
        stacks = [
            ("GitHub (6)", ACCENT_PURPLE, 110),
            ("YouTube (8)", ACCENT_RED, 120),
            ("Figma (4)", ACCENT_BLUE, 100),
            ("Linear (4)", ACCENT_LINEAR, 100),
            ("StackOverflow (6)", ACCENT_ORANGE, 140)
        ]
        
        gx = tab_x_start
        for sname, scol, sw in stacks:
            # Animate width/position
            cur_w = int(sw * e + (sw*0.4)*(1-e))
            draw.rounded_rectangle([gx, 40, gx + cur_w, 68], radius=5, fill=(28, 28, 30), outline=scol, width=1)
            draw.rectangle([gx + 8, 51, gx + 14, 57], fill=scol)
            draw.text((gx + 20, 48), sname, fill=TEXT_WHITE, font=font)
            gx += cur_w + 8
            
    elif sec < 6.2:
        # Phase 3: Accordion Focus (YouTube expanded, GitHub collapsed)
        # GitHub (compact)
        draw.rounded_rectangle([tab_x_start, 40, tab_x_start + 90, 68], radius=5, fill=(24, 24, 26), outline=ACCENT_PURPLE)
        draw.text((tab_x_start + 14, 48), "GitHub (6)", fill=TEXT_MUTED, font=font)
        
        # YouTube (EXPANDED with tabs)
        yt_x = tab_x_start + 98
        draw.rounded_rectangle([yt_x, 40, yt_x + 360, 68], radius=5, fill=(30, 30, 32), outline=ACCENT_RED, width=1)
        draw.text((yt_x + 10, 48), "YouTube", fill=ACCENT_RED, font=font)
        # Subtabs
        draw.rounded_rectangle([yt_x + 80, 44, yt_x + 210, 64], radius=4, fill=BG_TAB_ACTIVE, outline=BORDER_COLOR)
        draw.text((yt_x + 88, 48), "Deep Focus Lofi Beats", fill=TEXT_WHITE, font=font)
        draw.rounded_rectangle([yt_x + 216, 44, yt_x + 348, 64], radius=4, fill=BG_TAB_CHAOS, outline=BORDER_COLOR)
        draw.text((yt_x + 224, 48), "MV3 Architecture Deep", fill=TEXT_MUTED, font=font)
        
        # Figma & Linear (compact)
        draw.rounded_rectangle([yt_x + 368, 40, yt_x + 450, 68], radius=5, fill=(24, 24, 26), outline=ACCENT_BLUE)
        draw.text((yt_x + 378, 48), "Figma (4)", fill=TEXT_MUTED, font=font)
        
        draw.rounded_rectangle([yt_x + 458, 40, yt_x + 540, 68], radius=5, fill=(24, 24, 26), outline=ACCENT_LINEAR)
        draw.text((yt_x + 468, 48), "Linear (4)", fill=TEXT_MUTED, font=font)
        
    else:
        # Phase 4: RAM Hibernation (Inactive stacks have zZ sleep badges)
        # GitHub (Sleeping)
        draw.rounded_rectangle([tab_x_start, 40, tab_x_start + 110, 68], radius=5, fill=(20, 20, 22), outline=(60, 60, 65))
        draw.text((tab_x_start + 12, 48), "GitHub  [zZ]", fill=(120, 120, 130), font=font)
        
        # YouTube (Active)
        yt_x = tab_x_start + 118
        draw.rounded_rectangle([yt_x, 40, yt_x + 360, 68], radius=5, fill=(30, 30, 32), outline=ACCENT_RED, width=1)
        draw.text((yt_x + 10, 48), "YouTube", fill=ACCENT_RED, font=font)
        draw.rounded_rectangle([yt_x + 80, 44, yt_x + 210, 64], radius=4, fill=BG_TAB_ACTIVE, outline=BORDER_COLOR)
        draw.text((yt_x + 88, 48), "Deep Focus Lofi Beats", fill=TEXT_WHITE, font=font)
        draw.rounded_rectangle([yt_x + 216, 44, yt_x + 348, 64], radius=4, fill=BG_TAB_CHAOS, outline=BORDER_COLOR)
        draw.text((yt_x + 224, 48), "MV3 Architecture [zZ]", fill=(120, 120, 130), font=font)
        
        # Figma & Linear (Sleeping)
        draw.rounded_rectangle([yt_x + 368, 40, yt_x + 468, 68], radius=5, fill=(20, 20, 22), outline=(60, 60, 65))
        draw.text((yt_x + 378, 48), "Figma  [zZ]", fill=(120, 120, 130), font=font)
        
        draw.rounded_rectangle([yt_x + 476, 40, yt_x + 576, 68], radius=5, fill=(20, 20, 22), outline=(60, 60, 65))
        draw.text((yt_x + 486, 48), "Linear  [zZ]", fill=(120, 120, 130), font=font)

    # Top right extension icon in Chrome
    draw.rounded_rectangle([W - 120, 40, W - 60, 68], radius=4, fill=(24, 24, 26), outline=BORDER_COLOR)
    draw.text((W - 110, 48), "TabStack", fill=TEXT_WHITE, font=font)

    # 4. Window Address Bar (y: 76 to 118)
    draw.rectangle([40, 76, W-40, 118], fill=(14, 14, 14))
    draw.line([40, 118, W-40, 118], fill=BORDER_COLOR, width=1)
    
    # Nav arrows
    draw.text((58, 90), "‹  ›  ⟳", fill=TEXT_DIM, font=font)
    
    # URL Box
    draw.rounded_rectangle([130, 84, W-200, 110], radius=5, fill=(20, 20, 22), outline=BORDER_COLOR)
    url_text = "https://youtube.com/watch?v=lofi99" if sec >= 4.2 else "https://github.com/tabstack/core/pull/42"
    draw.text((144, 91), url_text, fill=TEXT_MUTED, font=font)
    
    # Status Indicator
    status_text = "32 Chaos Tabs" if sec < 2.0 else "Auto-Stack Active" if sec < 4.2 else "Accordion Active" if sec < 6.2 else "RAM Saver Active (-85%)"
    status_color = ACCENT_RED if sec < 2.0 else ACCENT_GREEN
    draw.rounded_rectangle([W - 190, 84, W - 58, 110], radius=12, fill=(20, 20, 22), outline=BORDER_COLOR)
    draw.ellipse([W - 180, 93, W - 172, 101], fill=status_color)
    draw.text((W - 164, 91), status_text, fill=status_color if sec >= 6.2 else TEXT_WHITE, font=font)

    # 5. Canvas Body (y: 118 to H-30)
    # Left Content Panel
    draw.text((80, 160), "STAGE NARRATIVE", fill=TEXT_DIM, font=font)
    
    if sec < 2.0:
        draw.text((80, 190), "1. THE TAB OVERLOAD", fill=ACCENT_RED, font=font)
        draw.text((80, 220), "32 unorganized tabs. Zero readable titles.", fill=TEXT_WHITE, font=font)
        draw.text((80, 250), "Memory Pressure: 2,840 MB (High Bloat)", fill=ACCENT_RED, font=font)
    elif sec < 4.2:
        draw.text((80, 190), "2. ONE-CLICK DOMAIN CLUSTERING", fill=ACCENT_GREEN, font=font)
        draw.text((80, 220), "Clustered into 5 native Chromium Tab Groups.", fill=TEXT_WHITE, font=font)
        draw.text((80, 250), "Shortcut: Alt + Shift + S  (Zero Injected Scripts)", fill=TEXT_MUTED, font=font)
    elif sec < 6.2:
        draw.text((80, 190), "3. ACCORDION FOCUS ISOLATION", fill=ACCENT_GREEN, font=font)
        draw.text((80, 220), "Active project expands; background stacks collapse.", fill=TEXT_WHITE, font=font)
        draw.text((80, 250), "Single-chip headers remove all tab strip noise.", fill=TEXT_MUTED, font=font)
    else:
        draw.text((80, 190), "4. DEEP MEMORY HIBERNATION", fill=ACCENT_GREEN, font=font)
        draw.text((80, 220), "Dormant tabs sleep via chrome.tabs.discard().", fill=TEXT_WHITE, font=font)
        draw.text((80, 250), "Memory Reclaimed: -2.65 GB to OS  (190 MB Active)", fill=ACCENT_GREEN, font=font)

    # Metrics Card on Left
    draw.rounded_rectangle([80, 310, 520, 540], radius=8, fill=(20, 20, 22), outline=BORDER_COLOR)
    
    # Readability Metric
    draw.text((104, 335), "Tab Strip Readability", fill=TEXT_DIM, font=font)
    r_val = "0% (Microscopic)" if sec < 2.0 else "100% (Clustered)"
    draw.text((104, 355), r_val, fill=ACCENT_RED if sec < 2.0 else ACCENT_GREEN, font=font)
    
    # RAM Metric
    draw.text((104, 405), "Total Tab Memory", fill=TEXT_DIM, font=font)
    ram_val = "2,840 MB (High Bloat)" if sec < 2.0 else "920 MB (Organized)" if sec < 4.2 else "340 MB (Focused)" if sec < 6.2 else "190 MB (-85% Saved)"
    draw.text((104, 425), ram_val, fill=ACCENT_RED if sec < 2.0 else ACCENT_GREEN, font=font)
    
    # Focus Metric
    draw.text((104, 475), "Focus State", fill=TEXT_DIM, font=font)
    f_val = "Scattered (32 tabs)" if sec < 2.0 else "Organized (4 Stacks)" if sec < 4.2 else "YouTube Focused (1 open, 3 closed)" if sec < 6.2 else "Lightweight & Fast"
    draw.text((104, 495), f_val, fill=TEXT_WHITE, font=font)

    # Right Panel: Authentic Extension Popup Overlay
    if popup_img:
        # Scale and position popup
        pop_w = 420
        pop_h = int(popup_img.height * (pop_w / popup_img.width))
        pop_resized = popup_img.resize((pop_w, pop_h), Image.Resampling.LANCZOS)
        
        # Position at right side
        pop_x = W - pop_w - 80
        pop_y = 150
        
        # Subtle popup slide in/pulse
        if sec >= 2.0 and sec < 4.2:
            # Highlight popup
            draw.rounded_rectangle([pop_x - 4, pop_y - 4, pop_x + pop_w + 4, pop_y + pop_h + 4], radius=10, fill=(30, 30, 35), outline=ACCENT_GREEN, width=2)
        else:
            draw.rounded_rectangle([pop_x - 2, pop_y - 2, pop_x + pop_w + 2, pop_y + pop_h + 2], radius=8, fill=(20, 20, 24), outline=BORDER_COLOR, width=1)
            
        img.paste(pop_resized, (pop_x, pop_y), pop_resized)
        
    # Animated Cursor Path
    cursor_x, cursor_y = 600, 400
    if sec < 2.0:
        cursor_x = int(300 + 100 * math.sin(sec * 3))
        cursor_y = 250
    elif sec < 3.2:
        # Cursor moves to popup Stack Now button
        p = min(1.0, (sec - 2.0) / 1.2)
        cursor_x = int(300 + (W - 300 - 300) * p)
        cursor_y = int(250 + (480 - 250) * p)
    elif sec < 5.2:
        # Cursor clicks YouTube stack in tab bar
        p = min(1.0, (sec - 3.2) / 2.0)
        cursor_x = int(W - 400 + (260 - (W - 400)) * p)
        cursor_y = int(480 + (54 - 480) * p)
    else:
        cursor_x = int(260 + 200 * (sec - 5.2) / 2.8)
        cursor_y = 54

    # Draw sleek white cursor
    draw.polygon([(cursor_x, cursor_y), (cursor_x + 12, cursor_y + 12), (cursor_x + 5, cursor_y + 13), (cursor_x, cursor_y + 18)], fill=TEXT_WHITE, outline=(0, 0, 0))

    # Bottom Progress timeline on window footer (y: H-46 to H-30)
    prog_w = int((W - 80) * t)
    draw.line([40, H-32, 40 + prog_w, H-32], fill=ACCENT_GREEN if sec >= 6.2 else TEXT_WHITE, width=3)
    
    # Save frame
    frame_path = os.path.join(TEMP_FRAMES_DIR, f"frame_{i:04d}.png")
    img.save(frame_path)

print("All frames rendered. Compiling to MP4, WebM, and GIF via FFmpeg...")

# 1. Output MP4 (H.264, 60fps equivalent or 30fps high quality)
mp4_out = os.path.join(OUTPUT_DIR, "tabstack-cinematic.mp4")
cmd_mp4 = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(TEMP_FRAMES_DIR, "frame_%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
    "-movflags", "+faststart",
    mp4_out
]
subprocess.run(cmd_mp4, check=True)
print(f"Compiled MP4: {mp4_out}")

# 2. Output WebM (VP9)
webm_out = os.path.join(OUTPUT_DIR, "tabstack-cinematic.webm")
cmd_webm = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(TEMP_FRAMES_DIR, "frame_%04d.png"),
    "-c:v", "libvpx-vp9",
    "-crf", "28",
    "-b:v", "0",
    webm_out
]
subprocess.run(cmd_webm, check=True)
print(f"Compiled WebM: {webm_out}")

# 3. Output GIF (High Quality with palettegen)
gif_out = os.path.join(OUTPUT_DIR, "tabstack-cinematic.gif")
palette_path = os.path.join(TEMP_FRAMES_DIR, "palette.png")
subprocess.run(["ffmpeg", "-y", "-i", os.path.join(TEMP_FRAMES_DIR, "frame_%04d.png"), "-vf", "fps=15,scale=800:-1:flags=lanczos,palettegen", palette_path], check=True)
subprocess.run(["ffmpeg", "-y", "-i", os.path.join(TEMP_FRAMES_DIR, "frame_%04d.png"), "-i", palette_path, "-lavfi", "fps=15,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse", gif_out], check=True)
print(f"Compiled GIF: {gif_out}")

# Cleanup temp frames
shutil.rmtree(TEMP_FRAMES_DIR, ignore_errors=True)
print("Finished rendering cinematic assets!")
