"""
Generate Authentic Chrome Web Store Graphic Assets for TabStack
Using real extension UI captures and authentic Chromium tab stack screenshots.
"""
import os
from PIL import Image, ImageDraw, ImageFont

USER_DIR = "C:/Users/qray/.gemini/antigravity-ide/brain/8bc4d5b1-a981-49d9-8481-6fce095e02d5/.user_uploaded"
OUT_DIR = "f:/Just Some Files/opensource/tabstack/store-assets"
os.makedirs(OUT_DIR, exist_ok=True)

# Fonts
font_hero_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
font_hero_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 19)
font_card_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 17)
font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
font_mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 12)

font_promo_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 42)
font_promo_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
font_small_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
font_small_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)

# Colors
BG_DARK = (10, 10, 14)
CARD_DARK = (18, 18, 22)
BORDER_SUBTLE = (38, 38, 44)
BORDER_MEDIUM = (60, 60, 72)
TEXT_WHITE = (245, 245, 247)
TEXT_MUTED = (161, 161, 170)
TEXT_DIM = (113, 113, 122)
ACCENT_GREEN = (34, 197, 94)

def draw_3d_logo(draw, offset_x, offset_y, size=64):
    scale = size / 24.0
    def pt(x, y):
        return (offset_x + x * scale, offset_y + y * scale)

    # Bottom layer
    draw.polygon([pt(4.8, 15.3), pt(11.3, 11.6), pt(12.7, 11.6), pt(19.2, 15.3), pt(12.7, 19.8), pt(11.3, 19.8)], fill="#52525b")
    draw.polygon([pt(4.8, 15.3), pt(11.3, 19.8), pt(12.0, 20.0), pt(12.0, 21.5), pt(11.3, 21.3), pt(4.8, 17.6), pt(4.3, 16.6), pt(4.3, 15.3)], fill="#3f3f46")
    draw.polygon([pt(12.0, 20.0), pt(12.7, 19.8), pt(19.2, 16.1), pt(19.7, 15.8), pt(19.7, 16.8), pt(19.2, 17.6), pt(12.7, 21.3), pt(12.0, 21.5)], fill="#27272a")

    # Middle layer
    draw.polygon([pt(4.8, 11.3), pt(11.3, 7.6), pt(12.7, 7.6), pt(19.2, 11.3), pt(12.7, 15.8), pt(11.3, 15.8)], fill="#a1a1aa")
    draw.polygon([pt(4.8, 11.3), pt(11.3, 15.8), pt(12.0, 16.0), pt(12.0, 17.5), pt(11.3, 17.3), pt(4.8, 13.6), pt(4.3, 12.6), pt(4.3, 11.3)], fill="#71717a")
    draw.polygon([pt(12.0, 16.0), pt(12.7, 15.8), pt(19.2, 12.1), pt(19.7, 11.8), pt(19.7, 12.8), pt(19.2, 13.6), pt(12.7, 17.3), pt(12.0, 17.5)], fill="#52525b")

    # Top layer
    draw.polygon([pt(4.8, 7.3), pt(11.3, 3.6), pt(12.7, 3.6), pt(19.2, 7.3), pt(12.7, 11.8), pt(11.3, 11.8)], fill="#ffffff")
    draw.polygon([pt(4.8, 7.3), pt(11.3, 11.8), pt(12.0, 12.0), pt(12.0, 13.5), pt(11.3, 13.3), pt(4.8, 9.6), pt(4.3, 8.6), pt(4.3, 7.3)], fill="#d4d4d8")
    draw.polygon([pt(12.0, 12.0), pt(12.7, 11.8), pt(19.2, 8.1), pt(19.7, 7.8), pt(19.7, 8.8), pt(19.2, 9.6), pt(12.7, 13.3), pt(12.0, 13.5)], fill="#a1a1aa")

# ==========================================
# SCREENSHOT 1: Authentic Popup UI & Features
# ==========================================
def make_screenshot_1():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 44), "TabStack: 1-Click Smart Domain Stacking", fill=TEXT_WHITE, font=font_hero_title)
    draw.text((64, 90), "Automatically organize cluttered tabs into native, color-coded collapsible domain groups.", fill=TEXT_MUTED, font=font_hero_sub)

    # Embed authentic popup screenshot
    pop_p = os.path.join(USER_DIR, "media_1786795735758.png")
    if os.path.exists(pop_p):
        pop_img = Image.open(pop_p).convert("RGBA")
        pw, ph = pop_img.size
        draw.rounded_rectangle([720, 140, 720 + pw + 20, 140 + ph + 20], radius=14, fill=CARD_DARK, outline=BORDER_MEDIUM, width=1)
        img.paste(pop_img, (730, 150), pop_img)

    # Left Feature Cards
    fx = 64
    draw.rounded_rectangle([fx, 150, fx + 610, 305], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((fx + 24, 172), "⚡ Auto Domain Stacking", fill=TEXT_WHITE, font=font_card_title)
    draw.text((fx + 24, 204), "Instantly clusters tabs from YouTube, GitHub, Docs, and Reddit\ninto color-coded native Chromium tab groups without drag-and-drop.", fill=TEXT_MUTED, font=font_body, spacing=6)

    draw.rounded_rectangle([fx, 325, fx + 610, 480], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((fx + 24, 347), "🎯 Single-Stack Focus (Accordion Mode)", fill=TEXT_WHITE, font=font_card_title)
    draw.text((fx + 24, 379), "Expands only the stack you are actively working in while\nautomatically folding dormant stacks to preserve horizontal space.", fill=TEXT_MUTED, font=font_body, spacing=6)

    draw.rounded_rectangle([fx, 500, fx + 610, 655], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((fx + 24, 522), "💤 Smart RAM Saver & Memory Recovery", fill=ACCENT_GREEN, font=font_card_title)
    draw.text((fx + 24, 554), "Suspends inactive background stacks using the native discard API,\nfreeing hundreds of megabytes of memory with zero data loss.", fill=TEXT_MUTED, font=font_body, spacing=6)

    img.save(os.path.join(OUT_DIR, "screenshot-1-domain-stacking.png"), "PNG")
    print("Saved authentic screenshot-1-domain-stacking.png")

# ==========================================
# SCREENSHOT 2: Real Browser Window Tab Strip
# ==========================================
def make_screenshot_2():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 44), "Native Chromium Tab Groups in Action", fill=TEXT_WHITE, font=font_hero_title)
    draw.text((64, 90), "Seamlessly integrates with Chrome's native tab strip for ultra-clean workspace navigation.", fill=TEXT_MUTED, font=font_hero_sub)

    # Embed real browser window screenshot
    win_p = os.path.join(USER_DIR, "media_1786911761597.png")
    if os.path.exists(win_p):
        win_img = Image.open(win_p).convert("RGBA")
        win_img = win_img.resize((1152, 576), Image.Resampling.LANCZOS)
        draw.rounded_rectangle([60, 140, 1220, 724], radius=12, fill=CARD_DARK, outline=BORDER_MEDIUM, width=1)
        img.paste(win_img, (64, 144), win_img)

    img.save(os.path.join(OUT_DIR, "screenshot-2-accordion-focus.png"), "PNG")
    print("Saved authentic screenshot-2-accordion-focus.png")

# ==========================================
# SCREENSHOT 3: Preferences & Customization UI
# ==========================================
def make_screenshot_3():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 44), "TabStack Options: Preferences & Whitelists", fill=TEXT_WHITE, font=font_hero_title)
    draw.text((64, 90), "Configure sleep timeouts, single-stack focus, and custom domain exclusion rules.", fill=TEXT_MUTED, font=font_hero_sub)

    # Embed authentic options screenshot
    opt_p = os.path.join(USER_DIR, "media_1786671687692.png")
    if os.path.exists(opt_p):
        opt_img = Image.open(opt_p).convert("RGBA")
        ow, oh = opt_img.size
        draw.rounded_rectangle([740, 140, 740 + ow + 20, 140 + oh + 20], radius=14, fill=CARD_DARK, outline=BORDER_MEDIUM, width=1)
        img.paste(opt_img, (750, 150), opt_img)

    # Left Column: Configuration Points
    fx = 64
    draw.rounded_rectangle([fx, 150, fx + 630, 310], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((fx + 24, 172), "⚙️ Granular Automation Controls", fill=TEXT_WHITE, font=font_card_title)
    draw.text((fx + 24, 204), "Toggle Accordion Mode, Auto-stacking on navigation, and\nautomatic discard timeouts (5m, 15m, 30m, 1h) to suit your workflow.", fill=TEXT_MUTED, font=font_body, spacing=6)

    draw.rounded_rectangle([fx, 330, fx + 630, 490], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((fx + 24, 352), "🛡️ Domain Whitelisting", fill=TEXT_WHITE, font=font_card_title)
    draw.text((fx + 24, 384), "Exclude critical tools (Meet, Figma, localhost, active editors)\nso they are never grouped or put to sleep during active work.", fill=TEXT_MUTED, font=font_body, spacing=6)

    draw.rounded_rectangle([fx, 510, fx + 630, 670], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((fx + 24, 532), "🎨 Dark & Light Adaptive Theming", fill=TEXT_WHITE, font=font_card_title)
    draw.text((fx + 24, 564), "Seamlessly adapts to your browser theme with precision contrast,\nclean monospace telemetry, and zero visual clutter.", fill=TEXT_MUTED, font=font_body, spacing=6)

    img.save(os.path.join(OUT_DIR, "screenshot-3-ram-saver.png"), "PNG")
    print("Saved authentic screenshot-3-ram-saver.png")

# ==========================================
# SCREENSHOT 4: Full Workspace Comparison
# ==========================================
def make_screenshot_4():
    img = Image.new("RGB", (1280, 800), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.text((64, 44), "Before vs After: Eliminate Browser Overwhelm", fill=TEXT_WHITE, font=font_hero_title)
    draw.text((64, 90), "Transform dozens of unreadable, squished tabs into organized, structured stacks.", fill=TEXT_MUTED, font=font_hero_sub)

    # Embed full workspace capture
    comp_p = os.path.join(USER_DIR, "media_1786908252089.png")
    if os.path.exists(comp_p):
        comp_img = Image.open(comp_p).convert("RGBA")
        comp_img = comp_img.resize((1152, 576), Image.Resampling.LANCZOS)
        draw.rounded_rectangle([60, 140, 1220, 724], radius=12, fill=CARD_DARK, outline=BORDER_MEDIUM, width=1)
        img.paste(comp_img, (64, 144), comp_img)

    img.save(os.path.join(OUT_DIR, "screenshot-4-customization-options.png"), "PNG")
    print("Saved authentic screenshot-4-customization-options.png")

# ==========================================
# SMALL PROMO TILE (440x280)
# ==========================================
def make_small_promo():
    img = Image.new("RGB", (440, 280), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.ellipse([140, 16, 300, 176], fill=(22, 22, 30))
    draw_3d_logo(draw, 188, 30, size=64)

    draw.text((150, 120), "TabStack", fill=TEXT_WHITE, font=font_small_title)
    draw.text((70, 164), "Smart Tab Auto-Collapse & RAM Saver", fill=ACCENT_GREEN, font=font_small_sub)
    draw.text((54, 194), "Automatic Domain Grouping · Single-Stack Focus", fill=TEXT_MUTED, font=font_small_sub)

    draw.rounded_rectangle([130, 230, 310, 256], radius=10, fill=CARD_DARK, outline=BORDER_SUBTLE)
    draw.text((144, 235), "Chromium Manifest V3", fill=TEXT_DIM, font=font_mono)

    img.save(os.path.join(OUT_DIR, "small-promo-tile-440x280.png"), "PNG")
    print("Saved small-promo-tile-440x280.png")

# ==========================================
# MARQUEE PROMO TILE (1400x560)
# ==========================================
def make_marquee_promo():
    img = Image.new("RGB", (1400, 560), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.ellipse([800, 40, 1320, 520], fill=(20, 20, 30))

    # Left Column
    draw_3d_logo(draw, 96, 96, size=80)
    draw.text((196, 106), "TabStack", fill=TEXT_WHITE, font=font_promo_title)
    draw.text((96, 196), "A clean tab bar in one click.", fill=TEXT_WHITE, font=font_promo_title)
    draw.text((96, 260), "Native domain grouping, auto-collapsing stacks, and smart RAM saving.", fill=TEXT_MUTED, font=font_promo_sub)

    # Feature Pills
    pills = ["⚡ 1-Click Auto Grouping", "🎯 Accordion Focus Mode", "💤 Smart RAM Saver", "🔒 100% Private & Local"]
    px = 96
    for p in pills:
        draw.rounded_rectangle([px, 340, px + 220, 380], radius=8, fill=CARD_DARK, outline=BORDER_SUBTLE)
        draw.text((px + 14, 350), p, fill=TEXT_WHITE, font=font_badge)
        px += 236

    # Right Column: Authentic Popup Embed
    pop_p = os.path.join(USER_DIR, "media_1786795735758.png")
    if os.path.exists(pop_p):
        pop_img = Image.open(pop_p).convert("RGBA")
        pop_img = pop_img.resize((320, 465), Image.Resampling.LANCZOS)
        draw.rounded_rectangle([960, 40, 1300, 520], radius=12, fill=CARD_DARK, outline=BORDER_MEDIUM, width=1)
        img.paste(pop_img, (970, 48), pop_img)

    img.save(os.path.join(OUT_DIR, "marquee-promo-tile-1400x560.png"), "PNG")
    print("Saved marquee-promo-tile-1400x560.png")

if __name__ == "__main__":
    make_screenshot_1()
    make_screenshot_2()
    make_screenshot_3()
    make_screenshot_4()
    make_small_promo()
    make_marquee_promo()
    print("All authentic Chrome Web Store assets generated successfully!")
