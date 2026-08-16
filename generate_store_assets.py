"""
Generate Chrome Web Store Graphic Assets for TabStack:
- Screenshots (1280x800, 24-bit RGB PNG, no alpha)
- Small Promo Tile (440x280, 24-bit RGB PNG, no alpha)
- Marquee Promo Tile (1400x560, 24-bit RGB PNG, no alpha)
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "f:/Just Some Files/opensource/tabstack/store-assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Fonts
font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
font_card_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 18)
font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
font_mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 13)
font_mono_small = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 12)

font_promo_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 44)
font_promo_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
font_small_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
font_small_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 13)

# Palette
BG_DARK = (10, 10, 12)
CARD_DARK = (18, 18, 22)
PANEL_DARK = (24, 24, 28)
BORDER_SUBTLE = (38, 38, 44)
BORDER_MEDIUM = (55, 55, 65)
TEXT_WHITE = (245, 245, 247)
TEXT_MUTED = (161, 161, 170)
TEXT_DIM = (113, 113, 122)
ACCENT_GREEN = (34, 197, 94)
ACCENT_RED = (239, 68, 68)
ACCENT_ORANGE = (245, 158, 11)
ACCENT_PURPLE = (139, 92, 246)
ACCENT_BLUE = (37, 99, 235)

def draw_3d_logo(draw, offset_x, offset_y, size=64):
    scale = size / 24.0
    def pt(x, y):
        return (offset_x + x * scale, offset_y + y * scale)

    # Bottom layer (Charcoal)
    draw.polygon([pt(4.8, 15.3), pt(11.3, 11.6), pt(12.7, 11.6), pt(19.2, 15.3), pt(12.7, 19.8), pt(11.3, 19.8)], fill="#52525b")
    draw.polygon([pt(4.8, 15.3), pt(11.3, 19.8), pt(12.0, 20.0), pt(12.0, 21.5), pt(11.3, 21.3), pt(4.8, 17.6), pt(4.3, 16.6), pt(4.3, 15.3)], fill="#3f3f46")
    draw.polygon([pt(12.0, 20.0), pt(12.7, 19.8), pt(19.2, 16.1), pt(19.7, 15.8), pt(19.7, 16.8), pt(19.2, 17.6), pt(12.7, 21.3), pt(12.0, 21.5)], fill="#27272a")

    # Middle layer (Zinc Silver)
    draw.polygon([pt(4.8, 11.3), pt(11.3, 7.6), pt(12.7, 7.6), pt(19.2, 11.3), pt(12.7, 15.8), pt(11.3, 15.8)], fill="#a1a1aa")
    draw.polygon([pt(4.8, 11.3), pt(11.3, 15.8), pt(12.0, 16.0), pt(12.0, 17.5), pt(11.3, 17.3), pt(4.8, 13.6), pt(4.3, 12.6), pt(4.3, 11.3)], fill="#71717a")
    draw.polygon([pt(12.0, 16.0), pt(12.7, 15.8), pt(19.2, 12.1), pt(19.7, 11.8), pt(19.7, 12.8), pt(19.2, 13.6), pt(12.7, 17.3), pt(12.0, 17.5)], fill="#52525b")

    # Top layer (Pure Crisp White)
    draw.polygon([pt(4.8, 7.3), pt(11.3, 3.6), pt(12.7, 3.6), pt(19.2, 7.3), pt(12.7, 11.8), pt(11.3, 11.8)], fill="#ffffff")
    draw.polygon([pt(4.8, 7.3), pt(11.3, 11.8), pt(12.0, 12.0), pt(12.0, 13.5), pt(11.3, 13.3), pt(4.8, 9.6), pt(4.3, 8.6), pt(4.3, 7.3)], fill="#d4d4d8")
    draw.polygon([pt(12.0, 12.0), pt(12.7, 11.8), pt(19.2, 8.1), pt(19.7, 7.8), pt(19.7, 8.8), pt(19.2, 9.6), pt(12.7, 13.3), pt(12.0, 13.5)], fill="#a1a1aa")

def draw_window_frame(draw, x1, y1, x2, y2):
    # Window body
    draw.rounded_rectangle([x1, y1, x2, y2], radius=12, fill=CARD_DARK, outline=BORDER_SUBTLE, width=1)
    # Header bar
    draw.rounded_rectangle([x1, y1, x2, y1 + 42], radius=12, fill=PANEL_DARK)
    draw.rectangle([x1, y1 + 30, x2, y1 + 42], fill=PANEL_DARK)
    draw.line([x1, y1 + 42, x2, y1 + 42], fill=BORDER_SUBTLE, width=1)
    # Traffic dots
    draw.ellipse([x1 + 16, y1 + 16, x1 + 26, y1 + 26], fill=(255, 95, 86))
    draw.ellipse([x1 + 32, y1 + 16, x1 + 42, y1 + 26], fill=(255, 189, 46))
    draw.ellipse([x1 + 48, y1 + 16, x1 + 58, y1 + 26], fill=(39, 201, 63))

# ==========================================
# SCREENSHOT 1: 1-Click Domain Stacking
# ==========================================
def make_screenshot_1():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Top Hero Header
    draw.text((64, 48), "TabStack: Smart Tab Auto-Collapse", fill=TEXT_WHITE, font=font_title)
    draw.text((64, 96), "Automatically clusters same-site tabs into native, color-coded collapsible stacks.", fill=TEXT_MUTED, font=font_subtitle)

    # Main Browser Window
    wx1, wy1, wx2, wy2 = 64, 150, 1216, 740
    draw_window_frame(draw, wx1, wy1, wx2, wy2)

    # Tab Strip: Collapsed Domain Stacks
    tx = wx1 + 72
    stacks = [
        ("YouTube", "8 tabs", ACCENT_RED, True),
        ("Amazon", "6 tabs", ACCENT_ORANGE, False),
        ("Spotify", "4 tabs", ACCENT_GREEN, False),
        ("Reddit", "6 tabs", ACCENT_PURPLE, False),
        ("GitHub", "4 tabs", ACCENT_BLUE, False)
    ]
    for name, count, color, is_active in stacks:
        w = 140
        draw.rounded_rectangle([tx, wy1 + 10, tx + w, wy1 + 34], radius=6, fill=CARD_DARK if is_active else PANEL_DARK, outline=color, width=1)
        draw.ellipse([tx + 8, wy1 + 19, tx + 14, wy1 + 25], fill=color)
        draw.text((tx + 20, wy1 + 14), name, fill=TEXT_WHITE, font=font_badge)
        draw.text((tx + 82, wy1 + 15), count, fill=TEXT_MUTED, font=font_mono_small)
        tx += w + 8

    # Omnibox URL
    draw.rounded_rectangle([wx1 + 16, wy1 + 50, wx2 - 16, wy1 + 80], radius=6, fill=(14, 14, 16), outline=BORDER_SUBTLE)
    draw.text((wx1 + 32, wy1 + 58), "https://www.youtube.com/watch?v=48h57PspBec", fill=TEXT_MUTED, font=font_mono)

    # Content Split: Webpage preview (Left) + Extension Flyout (Right)
    # Left: Web preview card
    draw.rounded_rectangle([wx1 + 24, wy1 + 100, wx1 + 650, wy2 - 24], radius=10, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    draw.rounded_rectangle([wx1 + 44, wy1 + 120, wx1 + 630, wy1 + 340], radius=8, fill=(12, 12, 14), outline=BORDER_MEDIUM)
    draw.polygon([(wx1 + 320, wy1 + 210), (wx1 + 320, wy1 + 250), (wx1 + 360, wy1 + 230)], fill=ACCENT_RED)
    draw.text((wx1 + 44, wy1 + 360), "Rick Astley - Never Gonna Give You Up (Official Music Video)", fill=TEXT_WHITE, font=font_card_title)
    draw.text((wx1 + 44, wy1 + 390), "1.6B views · 14 years ago · #NeverGonnaGiveYouUp", fill=TEXT_DIM, font=font_body)

    # Right: Authentic TabStack Popup Flyout
    fx1, fy1, fx2, fy2 = wx1 + 680, wy1 + 90, wx2 - 24, wy2 - 20
    draw.rounded_rectangle([fx1, fy1, fx2, fy2], radius=10, fill=(14, 14, 16), outline=BORDER_MEDIUM, width=1)
    
    # Popup Header
    draw_3d_logo(draw, fx1 + 16, fy1 + 16, size=24)
    draw.text((fx1 + 48, fy1 + 18), "TabStack", fill=TEXT_WHITE, font=font_card_title)
    draw.text((fx2 - 80, fy1 + 20), "v1.0.0", fill=TEXT_DIM, font=font_mono_small)
    draw.line([fx1, fy1 + 52, fx2, fy1 + 52], fill=BORDER_SUBTLE)

    # Metrics Bar
    mw = (fx2 - fx1 - 32) // 3
    metrics = [("28", "TABS"), ("5", "STACKS"), ("1,748 MB", "SAVED")]
    for i, (val, lbl) in enumerate(metrics):
        mx = fx1 + 16 + i * mw
        draw.rounded_rectangle([mx, fy1 + 62, mx + mw - 6, fy1 + 114], radius=6, fill=PANEL_DARK, outline=BORDER_SUBTLE)
        draw.text((mx + 10, fy1 + 70), val, fill=ACCENT_GREEN if "MB" in val else TEXT_WHITE, font=font_card_title)
        draw.text((mx + 10, fy1 + 94), lbl, fill=TEXT_DIM, font=font_mono_small)

    # Quick Toggles
    draw.rounded_rectangle([fx1 + 16, fy1 + 126, fx2 - 16, fy1 + 172], radius=6, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    draw.text((fx1 + 28, fy1 + 140), "Auto-Group: ON", fill=TEXT_WHITE, font=font_body)
    draw.text((fx1 + 170, fy1 + 140), "Accordion: ON", fill=TEXT_WHITE, font=font_body)
    draw.text((fx1 + 310, fy1 + 140), "RAM Saver: ON", fill=ACCENT_GREEN, font=font_body)

    # Active Stacks List
    draw.text((fx1 + 16, fy1 + 188), "ACTIVE DOMAIN STACKS (5)", fill=TEXT_DIM, font=font_mono_small)
    sy = fy1 + 208
    stack_rows = [
        ("YouTube", "8 tabs open · Active", ACCENT_RED),
        ("Amazon", "6 tabs open · Dormant", ACCENT_ORANGE),
        ("Spotify", "4 tabs open · Hibernated", ACCENT_GREEN),
        ("Reddit", "6 tabs open · Dormant", ACCENT_PURPLE),
        ("GitHub", "4 tabs open · Hibernated", ACCENT_BLUE),
    ]
    for sname, sstatus, scol in stack_rows:
        draw.rounded_rectangle([fx1 + 16, sy, fx2 - 16, sy + 44], radius=6, fill=CARD_DARK, outline=BORDER_SUBTLE)
        draw.ellipse([fx1 + 28, sy + 18, fx1 + 36, sy + 26], fill=scol)
        draw.text((fx1 + 44, sy + 14), sname, fill=TEXT_WHITE, font=font_body)
        draw.text((fx2 - 190, sy + 15), sstatus, fill=TEXT_DIM, font=font_mono_small)
        sy += 50

    # Action Buttons Footer
    draw.rounded_rectangle([fx1 + 16, fy2 - 50, fx1 + 150, fy2 - 14], radius=6, fill=TEXT_WHITE)
    draw.text((fx1 + 38, fy2 - 38), "Stack Now", fill=(0, 0, 0), font=font_badge)

    draw.rounded_rectangle([fx1 + 160, fy2 - 50, fx1 + 300, fy2 - 14], radius=6, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    draw.text((fx1 + 180, fy2 - 38), "Deduplicate", fill=TEXT_WHITE, font=font_badge)

    draw.rounded_rectangle([fx1 + 310, fy2 - 50, fx2 - 16, fy2 - 14], radius=6, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    draw.text((fx1 + 336, fy2 - 38), "Collapse All", fill=TEXT_WHITE, font=font_badge)

    img.save(os.path.join(OUTPUT_DIR, "screenshot-1-domain-stacking.png"), "PNG")
    print("Saved screenshot-1-domain-stacking.png")

# ==========================================
# SCREENSHOT 2: Accordion Focus Mode
# ==========================================
def make_screenshot_2():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 48), "Single-Stack Focus: Accordion Mode", fill=TEXT_WHITE, font=font_title)
    draw.text((64, 96), "Auto-expands your current task stack while cleanly collapsing dormant groups.", fill=TEXT_MUTED, font=font_subtitle)

    wx1, wy1, wx2, wy2 = 64, 150, 1216, 740
    draw_window_frame(draw, wx1, wy1, wx2, wy2)

    # Expanded Amazon Stack + Collapsed Stacks
    tx = wx1 + 72
    draw.rounded_rectangle([tx, wy1 + 10, tx + 100, wy1 + 34], radius=6, fill=PANEL_DARK, outline=ACCENT_RED)
    draw.text((tx + 16, wy1 + 14), "YouTube (8)", fill=TEXT_WHITE, font=font_badge)
    tx += 108

    # Expanded Amazon Group
    draw.rounded_rectangle([tx, wy1 + 6, tx + 560, wy1 + 38], radius=8, fill=(245, 158, 11, 20), outline=ACCENT_ORANGE, width=1)
    draw.rounded_rectangle([tx + 4, wy1 + 10, tx + 100, wy1 + 34], radius=5, fill=ACCENT_ORANGE)
    draw.text((tx + 14, wy1 + 14), "Amazon (4)", fill=(0, 0, 0), font=font_badge)
    
    # 3 Amazon child tabs
    atabs = ["🎧 Sony WH-1000XM5", "⌨️ NuPhy Air75 V2", "🖱️ Logitech MX Master"]
    atx = tx + 108
    for atitle in atabs:
        draw.rounded_rectangle([atx, wy1 + 10, atx + 140, wy1 + 34], radius=5, fill=CARD_DARK, outline=BORDER_SUBTLE)
        draw.text((atx + 8, wy1 + 14), atitle, fill=TEXT_WHITE, font=font_mono_small)
        atx += 146
    tx += 570

    # Dormant stacks
    draw.rounded_rectangle([tx, wy1 + 10, tx + 96, wy1 + 34], radius=6, fill=PANEL_DARK, outline=ACCENT_GREEN)
    draw.text((tx + 16, wy1 + 14), "Spotify (4)", fill=TEXT_WHITE, font=font_badge)
    tx += 104
    draw.rounded_rectangle([tx, wy1 + 10, tx + 96, wy1 + 34], radius=6, fill=PANEL_DARK, outline=ACCENT_PURPLE)
    draw.text((tx + 16, wy1 + 14), "Reddit (6)", fill=TEXT_WHITE, font=font_badge)

    # Omnibox
    draw.rounded_rectangle([wx1 + 16, wy1 + 50, wx2 - 16, wy1 + 80], radius=6, fill=(14, 14, 16), outline=BORDER_SUBTLE)
    draw.text((wx1 + 32, wy1 + 58), "https://www.amazon.com/dp/B09XS7JWHH (Sony WH-1000XM5)", fill=TEXT_MUTED, font=font_mono)

    # Main Visual: Comparison Callout
    draw.rounded_rectangle([wx1 + 32, wy1 + 100, wx2 - 32, wy2 - 32], radius=10, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    
    # 2 Big Cards inside
    draw.rounded_rectangle([wx1 + 56, wy1 + 130, wx1 + 550, wy2 - 60], radius=8, fill=CARD_DARK, outline=BORDER_MEDIUM)
    draw.text((wx1 + 80, wy1 + 154), "Without TabStack: Horizontal Clutter", fill=ACCENT_RED, font=font_card_title)
    draw.text((wx1 + 80, wy1 + 190), "• 30+ tabs squeezed into unreadable favicons\n• Constant tab hunting & lost context\n• High CPU usage from background video tabs\n• Cluttered workspace leads to decision fatigue", fill=TEXT_MUTED, font=font_body, spacing=12)

    draw.rounded_rectangle([wx1 + 580, wy1 + 130, wx2 - 56, wy2 - 60], radius=8, fill=CARD_DARK, outline=ACCENT_GREEN, width=1)
    draw.text((wx1 + 604, wy1 + 154), "With TabStack: Accordion Focus", fill=ACCENT_GREEN, font=font_card_title)
    draw.text((wx1 + 604, wy1 + 190), "• Active domain automatically unfolds in full detail\n• Inactive stacks stay neatly folded at 24px width\n• Switching tasks automatically closes previous stack\n• Tab strip stays readable with zero horizontal scroll", fill=TEXT_WHITE, font=font_body, spacing=12)

    img.save(os.path.join(OUTPUT_DIR, "screenshot-2-accordion-focus.png"), "PNG")
    print("Saved screenshot-2-accordion-focus.png")

# ==========================================
# SCREENSHOT 3: Smart RAM Saver
# ==========================================
def make_screenshot_3():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 48), "Smart RAM Saver: Native Tab Hibernation", fill=TEXT_WHITE, font=font_title)
    draw.text((64, 96), "Puts idle background stacks to sleep using Chromium's native discard API.", fill=TEXT_MUTED, font=font_subtitle)

    wx1, wy1, wx2, wy2 = 64, 150, 1216, 740
    draw_window_frame(draw, wx1, wy1, wx2, wy2)

    # Tab Strip with Sleep Zz Badges
    tx = wx1 + 72
    slist = [("YouTube", "8 tabs · zZ", ACCENT_RED, True), ("Amazon", "6 tabs · zZ", ACCENT_ORANGE, True), ("Spotify", "4 tabs · zZ", ACCENT_GREEN, True), ("Active Task", "3 tabs · Awake", (255, 255, 255), False)]
    for sname, sstatus, scol, is_sleep in slist:
        w = 160
        draw.rounded_rectangle([tx, wy1 + 10, tx + w, wy1 + 34], radius=6, fill=CARD_DARK, outline=scol if not is_sleep else BORDER_MEDIUM)
        draw.text((tx + 12, wy1 + 14), sname, fill=TEXT_WHITE if not is_sleep else TEXT_DIM, font=font_badge)
        draw.text((tx + 90, wy1 + 15), "💤 Sleep" if is_sleep else "🟢 Active", fill=ACCENT_GREEN if is_sleep else TEXT_WHITE, font=font_mono_small)
        tx += w + 8

    # Omnibox
    draw.rounded_rectangle([wx1 + 16, wy1 + 50, wx2 - 16, wy1 + 80], radius=6, fill=(14, 14, 16), outline=BORDER_SUBTLE)
    draw.text((wx1 + 32, wy1 + 58), "tabstack://ram-saver-telemetry", fill=TEXT_MUTED, font=font_mono)

    # Big RAM Meter Dashboard Card
    draw.rounded_rectangle([wx1 + 32, wy1 + 100, wx2 - 32, wy2 - 32], radius=10, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    
    draw.text((wx1 + 64, wy1 + 130), "MEMORY RECLAMATION OVERVIEW", fill=TEXT_DIM, font=font_mono)
    draw.text((wx1 + 64, wy1 + 160), "1,748 MB Memory Freed", fill=ACCENT_GREEN, font=font_title)
    draw.text((wx1 + 64, wy1 + 210), "22 idle tabs hibernated in background · 3 active tabs awake in focus", fill=TEXT_MUTED, font=font_subtitle)

    # Meter bar
    draw.rounded_rectangle([wx1 + 64, wy1 + 260, wx2 - 64, wy1 + 284], radius=12, fill=(14, 14, 18), outline=BORDER_MEDIUM)
    draw.rounded_rectangle([wx1 + 64, wy1 + 260, wx1 + 64 + 820, wy1 + 284], radius=12, fill=ACCENT_GREEN)

    # 3 Stat Cards below
    col_w = (wx2 - wx1 - 128 - 32) // 3
    stats = [
        ("Background Sleep Timer", "15 Minutes", "Configurable in settings"),
        ("Active Exclusions", "Audio / Forms", "Never discards playing music"),
        ("Instant Wakeup", "< 50ms", "Restores exact scroll & form state")
    ]
    for i, (stitle, sval, ssub) in enumerate(stats):
        cx = wx1 + 64 + i * (col_w + 16)
        draw.rounded_rectangle([cx, wy1 + 320, cx + col_w, wy2 - 60], radius=8, fill=CARD_DARK, outline=BORDER_SUBTLE)
        draw.text((cx + 20, wy1 + 340), stitle, fill=TEXT_DIM, font=font_mono_small)
        draw.text((cx + 20, wy1 + 370), sval, fill=TEXT_WHITE, font=font_card_title)
        draw.text((cx + 20, wy1 + 420), ssub, fill=TEXT_MUTED, font=font_body)

    img.save(os.path.join(OUTPUT_DIR, "screenshot-3-ram-saver.png"), "PNG")
    print("Saved screenshot-3-ram-saver.png")

# ==========================================
# SCREENSHOT 4: Customization & Whitelist
# ==========================================
def make_screenshot_4():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 48), "TabStack Options: Preferences & Whitelists", fill=TEXT_WHITE, font=font_title)
    draw.text((64, 96), "Customize domain color palettes, sleep timeouts, and never-group rules.", fill=TEXT_MUTED, font=font_subtitle)

    wx1, wy1, wx2, wy2 = 64, 150, 1216, 740
    draw_window_frame(draw, wx1, wy1, wx2, wy2)

    # Omnibox
    draw.rounded_rectangle([wx1 + 16, wy1 + 50, wx2 - 16, wy1 + 80], radius=6, fill=(14, 14, 16), outline=BORDER_SUBTLE)
    draw.text((wx1 + 32, wy1 + 58), "chrome-extension://tabstack/options.html", fill=TEXT_MUTED, font=font_mono)

    # Options Body UI
    draw.rounded_rectangle([wx1 + 32, wy1 + 100, wx2 - 32, wy2 - 32], radius=10, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    
    # Left Column: Rules & Settings
    draw.rounded_rectangle([wx1 + 56, wy1 + 124, wx1 + 540, wy2 - 56], radius=8, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((wx1 + 80, wy1 + 144), "General Preferences", fill=TEXT_WHITE, font=font_card_title)
    
    opts = [
        ("Accordion Mode (Single-Stack Focus)", "ON"),
        ("Auto-Stack New Tabs on Navigation", "ON"),
        ("Never Sleep Tabs Playing Audio", "ON"),
        ("Theme Mode (System / Dark / Light)", "Dark"),
        ("Idle Sleep Timeout", "15 mins"),
    ]
    oy = wy1 + 190
    for oname, oval in opts:
        draw.text((wx1 + 80, oy), oname, fill=TEXT_MUTED, font=font_body)
        draw.rounded_rectangle([wx1 + 440, oy - 2, wx1 + 516, oy + 22], radius=4, fill=(30, 30, 36), outline=BORDER_MEDIUM)
        draw.text((wx1 + 452, oy + 2), oval, fill=ACCENT_GREEN if oval == "ON" else TEXT_WHITE, font=font_mono_small)
        oy += 44

    # Right Column: Domain Whitelist
    draw.rounded_rectangle([wx1 + 570, wy1 + 124, wx2 - 56, wy2 - 56], radius=8, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((wx1 + 594, wy1 + 144), "Domain Whitelist & Exclusions", fill=TEXT_WHITE, font=font_card_title)
    draw.text((wx1 + 594, wy1 + 172), "Domains listed below will never be grouped or hibernated.", fill=TEXT_DIM, font=font_body)

    wdomains = [
        ("meet.google.com", "Always keep unstacked & awake"),
        ("figma.com", "Never hibernate during active design"),
        ("localhost", "Keep local dev servers active"),
        ("github.com/pulls", "Never collapse active PR reviews")
    ]
    wy_pos = wy1 + 210
    for wname, wdesc in wdomains:
        draw.rounded_rectangle([wx1 + 594, wy_pos, wx2 - 80, wy_pos + 46], radius=6, fill=PANEL_DARK, outline=BORDER_SUBTLE)
        draw.text((wx1 + 610, wy_pos + 8), wname, fill=TEXT_WHITE, font=font_mono)
        draw.text((wx1 + 610, wy_pos + 26), wdesc, fill=TEXT_DIM, font=font_body)
        draw.text((wx2 - 120, wy_pos + 14), "Remove", fill=ACCENT_RED, font=font_mono_small)
        wy_pos += 56

    img.save(os.path.join(OUTPUT_DIR, "screenshot-4-customization-options.png"), "PNG")
    print("Saved screenshot-4-customization-options.png")

# ==========================================
# SMALL PROMO TILE (440x280)
# ==========================================
def make_small_promo():
    img = Image.new("RGB", (440, 280), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Ambient glow
    draw.ellipse([140, 20, 300, 180], fill=(24, 24, 32))

    # 3D Brand Logo
    draw_3d_logo(draw, 188, 36, size=64)

    # Title & Tagline
    draw.text((150, 126), "TabStack", fill=TEXT_WHITE, font=font_small_title)
    draw.text((80, 172), "Smart Tab Auto-Collapse & RAM Saver", fill=ACCENT_GREEN, font=font_small_sub)
    draw.text((70, 204), "1-Click Domain Grouping · Native Accordion Focus", fill=TEXT_MUTED, font=font_small_sub)

    # Mini Badge
    draw.rounded_rectangle([140, 236, 300, 260], radius=12, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((156, 241), "Chromium Manifest V3", fill=TEXT_DIM, font=font_mono_small)

    img.save(os.path.join(OUTPUT_DIR, "small-promo-tile-440x280.png"), "PNG")
    print("Saved small-promo-tile-440x280.png")

# ==========================================
# MARQUEE PROMO TILE (1400x560)
# ==========================================
def make_marquee_promo():
    img = Image.new("RGB", (1400, 560), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Ambient glow on background
    draw.ellipse([800, 60, 1300, 500], fill=(20, 20, 28))

    # Left Column: Brand Hero
    draw_3d_logo(draw, 100, 110, size=80)
    draw.text((200, 120), "TabStack", fill=TEXT_WHITE, font=font_promo_title)
    draw.text((100, 210), "A clean tab bar in one click.", fill=TEXT_WHITE, font=font_promo_title)
    draw.text((100, 276), "Native domain grouping, auto-collapsing stacks, and smart RAM saving.", fill=TEXT_MUTED, font=font_promo_sub)

    # 3 Feature Pills
    pills = ["⚡ 1-Click Auto Grouping", "🎯 Accordion Focus Mode", "💤 Smart RAM Saver", "🔒 100% Private & Local"]
    px = 100
    for p in pills:
        draw.rounded_rectangle([px, 350, px + 230, 390], radius=8, fill=CARD_DARK, outline=BORDER_SUBTLE)
        draw.text((px + 16, 360), p, fill=TEXT_WHITE, font=font_badge)
        px += 246

    # Right Column: Sleek Floating Mini Window Graphic
    rx1, ry1, rx2, ry2 = 820, 100, 1320, 480
    draw_window_frame(draw, rx1, ry1, rx2, ry2)
    
    # Stacks inside window
    stx = rx1 + 72
    draw.rounded_rectangle([stx, ry1 + 10, stx + 90, ry1 + 34], radius=5, fill=PANEL_DARK, outline=ACCENT_RED)
    draw.text((stx + 12, ry1 + 14), "YouTube 8", fill=TEXT_WHITE, font=font_mono_small)
    stx += 98
    draw.rounded_rectangle([stx, ry1 + 10, stx + 90, ry1 + 34], radius=5, fill=PANEL_DARK, outline=ACCENT_ORANGE)
    draw.text((stx + 12, ry1 + 14), "Amazon 6", fill=TEXT_WHITE, font=font_mono_small)
    stx += 98
    draw.rounded_rectangle([stx, ry1 + 10, stx + 90, ry1 + 34], radius=5, fill=PANEL_DARK, outline=ACCENT_GREEN)
    draw.text((stx + 12, ry1 + 14), "Spotify 4", fill=TEXT_WHITE, font=font_mono_small)

    # Window Body Card
    draw.rounded_rectangle([rx1 + 24, ry1 + 60, rx2 - 24, ry2 - 24], radius=8, fill=PANEL_DARK, outline=BORDER_SUBTLE)
    draw.text((rx1 + 44, ry1 + 90), "Active Work Focus Stack", fill=ACCENT_GREEN, font=font_card_title)
    draw.text((rx1 + 44, ry1 + 120), "28 tabs automatically organized into 4 stacks.", fill=TEXT_WHITE, font=font_body)
    draw.text((rx1 + 44, ry1 + 150), "-1,748 MB Memory Reclaimed", fill=ACCENT_GREEN, font=font_card_title)

    img.save(os.path.join(OUTPUT_DIR, "marquee-promo-tile-1400x560.png"), "PNG")
    print("Saved marquee-promo-tile-1400x560.png")

if __name__ == "__main__":
    make_screenshot_1()
    make_screenshot_2()
    make_screenshot_3()
    make_screenshot_4()
    make_small_promo()
    make_marquee_promo()
    print("All Chrome Web Store assets generated successfully!")
