import os
import shutil
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = "f:/Just Some Files/opensource/tabstack/landing/assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

USER_UPLOADED_DIR = "C:/Users/qray/.gemini/antigravity-ide/brain/8bc4d5b1-a981-49d9-8481-6fce095e02d5/.user_uploaded"

# 1. Copy user uploaded authentic popup screenshots if they exist
p1 = os.path.join(USER_UPLOADED_DIR, "media_1786708550678.png")
p2 = os.path.join(USER_UPLOADED_DIR, "media_1786671687692.png")

if os.path.exists(p1):
    shutil.copy(p1, os.path.join(ASSETS_DIR, "extension-popup.png"))
    print("Copied extension-popup.png")

if os.path.exists(p2):
    shutil.copy(p2, os.path.join(ASSETS_DIR, "extension-options.png"))
    print("Copied extension-options.png")

# 2. Build High-Resolution Animated GIF showing TabStack in action (600x420)
def create_demo_gif():
    frames = []
    width, height = 640, 440
    
    # Colors
    bg_color = (10, 10, 10)
    card_bg = (18, 18, 18)
    tab_bg = (24, 24, 24)
    border_col = (40, 40, 40)
    white = (240, 240, 240)
    muted = (140, 140, 140)
    dim = (80, 80, 80)
    green = (34, 197, 94)
    red = (239, 68, 68)
    purple = (168, 85, 247)
    
    font_large = ImageFont.load_default()
    
    # 4 scenes in loop (each scene has 12 frames)
    # Scene 1: Chaos (36 squished tabs)
    for f in range(12):
        img = Image.new("RGBA", (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Window Chrome
        draw.rounded_rectangle([20, 20, width-20, height-20], radius=12, fill=card_bg, outline=border_col, width=1)
        
        # Window dots
        draw.ellipse([34, 34, 42, 42], fill=(255, 95, 86))
        draw.ellipse([48, 34, 56, 42], fill=(255, 189, 46))
        draw.ellipse([62, 34, 70, 42], fill=(39, 201, 63))
        
        # Tab bar - Chaos squished tabs
        tab_x = 84
        for i in range(16):
            w = 26
            is_active = (i == 0)
            col = (35, 35, 35) if is_active else tab_bg
            draw.rounded_rectangle([tab_x, 28, tab_x+w, 48], radius=4, fill=col, outline=border_col)
            draw.rectangle([tab_x+4, 36, tab_x+10, 40], fill=(120, 120, 120))
            tab_x += w + 2
            
        # Address bar
        draw.rounded_rectangle([34, 58, width-34, 82], radius=5, fill=(14, 14, 14), outline=border_col)
        draw.text((46, 64), "https://github.com/tabstack/core/pull/42", fill=muted, font=font_large)
        
        # Content
        draw.text((40, 110), "SCENE 1: THE TAB CHAOS", fill=red, font=font_large)
        draw.text((40, 134), "36 microscopic tabs. Titles unreadable.", fill=white, font=font_large)
        draw.text((40, 156), "Memory: 2,840 MB (High Bloat)", fill=red, font=font_large)
        
        # Big stat box
        draw.rounded_rectangle([40, 200, width-40, height-40], radius=8, fill=(14, 14, 14), outline=border_col)
        draw.text((60, 230), "Tab Readability: 0% (Squished & Truncated)", fill=dim, font=font_large)
        draw.text((60, 260), "Active Work Focus: Scattered across 36 tabs", fill=dim, font=font_large)
        draw.text((60, 290), "System Memory Pressure: High", fill=red, font=font_large)
        
        frames.append(img.convert("RGB"))
        
    # Scene 2: 1-Click Auto-Stack
    for f in range(12):
        img = Image.new("RGBA", (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        draw.rounded_rectangle([20, 20, width-20, height-20], radius=12, fill=card_bg, outline=border_col, width=1)
        draw.ellipse([34, 34, 42, 42], fill=(255, 95, 86))
        draw.ellipse([48, 34, 56, 42], fill=(255, 189, 46))
        draw.ellipse([62, 34, 70, 42], fill=(39, 201, 63))
        
        # Stacked groups
        gx = 84
        groups = [("GitHub (4)", purple), ("YouTube (3)", red), ("Figma (2)", (14, 165, 233)), ("Linear (2)", (59, 130, 246))]
        for gname, gcol in groups:
            draw.rounded_rectangle([gx, 28, gx+76, 48], radius=4, fill=(28, 28, 28), outline=gcol)
            draw.text((gx+6, 33), gname, fill=white, font=font_large)
            gx += 82
            
        draw.rounded_rectangle([34, 58, width-34, 82], radius=5, fill=(14, 14, 14), outline=border_col)
        draw.text((46, 64), "https://github.com/tabstack/core/pull/42", fill=muted, font=font_large)
        
        draw.text((40, 110), "SCENE 2: 1-CLICK DOMAIN CLUSTERING", fill=green, font=font_large)
        draw.text((40, 134), "Organized into 4 native Chromium Tab Groups.", fill=white, font=font_large)
        draw.text((40, 156), "Shortcut: Alt + Shift + S", fill=green, font=font_large)
        
        draw.rounded_rectangle([40, 200, width-40, height-40], radius=8, fill=(14, 14, 14), outline=border_col)
        draw.text((60, 230), "Tab Readability: 100% (Clean Domain Headers)", fill=green, font=font_large)
        draw.text((60, 260), "Tab Groups: GitHub (4), YouTube (3), Figma (2), Linear (2)", fill=white, font=font_large)
        draw.text((60, 290), "Zero Injected Content Scripts", fill=muted, font=font_large)
        
        frames.append(img.convert("RGB"))
        
    # Scene 3: Accordion Focus Mode
    for f in range(12):
        img = Image.new("RGBA", (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        draw.rounded_rectangle([20, 20, width-20, height-20], radius=12, fill=card_bg, outline=border_col, width=1)
        draw.ellipse([34, 34, 42, 42], fill=(255, 95, 86))
        draw.ellipse([48, 34, 56, 42], fill=(255, 189, 46))
        draw.ellipse([62, 34, 70, 42], fill=(39, 201, 63))
        
        # YouTube stack expanded
        draw.rounded_rectangle([84, 28, 160, 48], radius=4, fill=(28, 28, 28), outline=purple)
        draw.text((90, 33), "GitHub", fill=muted, font=font_large)
        
        # YouTube expanded
        draw.rounded_rectangle([166, 28, 340, 48], radius=4, fill=(35, 35, 35), outline=red)
        draw.text((172, 33), "YouTube: Lofi Beats", fill=white, font=font_large)
        
        draw.rounded_rectangle([346, 28, 410, 48], radius=4, fill=(28, 28, 28), outline=(14, 165, 233))
        draw.text((352, 33), "Figma", fill=muted, font=font_large)
        
        draw.rounded_rectangle([34, 58, width-34, 82], radius=5, fill=(14, 14, 14), outline=border_col)
        draw.text((46, 64), "https://youtube.com/watch?v=lofi99", fill=muted, font=font_large)
        
        draw.text((40, 110), "SCENE 3: ACCORDION FOCUS ISOLATION", fill=green, font=font_large)
        draw.text((40, 134), "Active group expands. Inactive groups collapse.", fill=white, font=font_large)
        draw.text((40, 156), "Zero visual clutter on your tab strip.", fill=muted, font=font_large)
        
        draw.rounded_rectangle([40, 200, width-40, height-40], radius=8, fill=(14, 14, 14), outline=border_col)
        draw.text((60, 230), "Active Workspace: YouTube (Focused)", fill=green, font=font_large)
        draw.text((60, 260), "Collapsed Stacks: GitHub, Figma, Linear (1-chip headers)", fill=muted, font=font_large)
        draw.text((60, 290), "Switching tabs auto-manages expansion", fill=white, font=font_large)
        
        frames.append(img.convert("RGB"))

    # Scene 4: RAM Hibernation
    for f in range(12):
        img = Image.new("RGBA", (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        draw.rounded_rectangle([20, 20, width-20, height-20], radius=12, fill=card_bg, outline=border_col, width=1)
        draw.ellipse([34, 34, 42, 42], fill=(255, 95, 86))
        draw.ellipse([48, 34, 56, 42], fill=(255, 189, 46))
        draw.ellipse([62, 34, 70, 42], fill=(39, 201, 63))
        
        # Tabs with sleep badges
        draw.rounded_rectangle([84, 28, 160, 48], radius=4, fill=(20, 20, 20), outline=(60, 60, 60))
        draw.text((90, 33), "GitHub [zZ]", fill=(90, 90, 90), font=font_large)
        
        draw.rounded_rectangle([166, 28, 340, 48], radius=4, fill=(35, 35, 35), outline=red)
        draw.text((172, 33), "YouTube (Active)", fill=white, font=font_large)
        
        draw.rounded_rectangle([346, 28, 410, 48], radius=4, fill=(20, 20, 20), outline=(60, 60, 60))
        draw.text((352, 33), "Figma [zZ]", fill=(90, 90, 90), font=font_large)
        
        draw.rounded_rectangle([34, 58, width-34, 82], radius=5, fill=(14, 14, 14), outline=border_col)
        draw.text((46, 64), "https://youtube.com/watch?v=lofi99", fill=muted, font=font_large)
        
        draw.text((40, 110), "SCENE 4: DEEP RAM HIBERNATION", fill=green, font=font_large)
        draw.text((40, 134), "Inactive tabs sleep via chrome.tabs.discard().", fill=white, font=font_large)
        draw.text((40, 156), "Memory Reclaimed: -2.65 GB (-85%)", fill=green, font=font_large)
        
        draw.rounded_rectangle([40, 200, width-40, height-40], radius=8, fill=(14, 14, 14), outline=border_col)
        draw.text((60, 230), "Memory Used: 190 MB (Down from 2,840 MB)", fill=green, font=font_large)
        draw.text((60, 260), "Tab State: Scroll position & history preserved", fill=white, font=font_large)
        draw.text((60, 290), "Instant Wake-up on click", fill=green, font=font_large)
        
        frames.append(img.convert("RGB"))
        
    out_gif = os.path.join(ASSETS_DIR, "tabstack-showcase.gif")
    frames[0].save(out_gif, save_all=True, append_images=frames[1:], duration=160, loop=0)
    print(f"Generated {out_gif}")

create_demo_gif()
