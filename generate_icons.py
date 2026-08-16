"""
TabStack Official Icon Generator
Generates high-precision, supersampled, anti-aliased PNG icons at 16x16, 32x32, 48x48, and 128x128.
"""
from PIL import Image, ImageDraw

def render_tabstack_icon(size):
    scale = 8  # 8x Supersampling for ultra-crisp edges
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Base 24x24 coordinate mapping
    padding = 1.0 * scale * (size / 24.0)
    usable = canvas_size - 2 * padding

    def pt(x, y):
        return (padding + (x / 24.0) * usable, padding + (y / 24.0) * usable)

    # Layer 3: Bottom (Charcoal)
    draw.polygon([pt(4.8, 15.3), pt(11.3, 11.6), pt(12.7, 11.6), pt(19.2, 15.3), pt(12.7, 19.8), pt(11.3, 19.8)], fill="#52525b")
    draw.polygon([pt(4.8, 15.3), pt(11.3, 19.8), pt(12.0, 20.0), pt(12.0, 21.5), pt(11.3, 21.3), pt(4.8, 17.6), pt(4.3, 16.6), pt(4.3, 15.3)], fill="#3f3f46")
    draw.polygon([pt(12.0, 20.0), pt(12.7, 19.8), pt(19.2, 16.1), pt(19.7, 15.8), pt(19.7, 16.8), pt(19.2, 17.6), pt(12.7, 21.3), pt(12.0, 21.5)], fill="#27272a")

    # Layer 2: Middle (Zinc Silver)
    draw.polygon([pt(4.8, 11.3), pt(11.3, 7.6), pt(12.7, 7.6), pt(19.2, 11.3), pt(12.7, 15.8), pt(11.3, 15.8)], fill="#a1a1aa")
    draw.polygon([pt(4.8, 11.3), pt(11.3, 15.8), pt(12.0, 16.0), pt(12.0, 17.5), pt(11.3, 17.3), pt(4.8, 13.6), pt(4.3, 12.6), pt(4.3, 11.3)], fill="#71717a")
    draw.polygon([pt(12.0, 16.0), pt(12.7, 15.8), pt(19.2, 12.1), pt(19.7, 11.8), pt(19.7, 12.8), pt(19.2, 13.6), pt(12.7, 17.3), pt(12.0, 17.5)], fill="#52525b")

    # Layer 1: Top (Pure Crisp White)
    draw.polygon([pt(4.8, 7.3), pt(11.3, 3.6), pt(12.7, 3.6), pt(19.2, 7.3), pt(12.7, 11.8), pt(11.3, 11.8)], fill="#ffffff")
    draw.polygon([pt(4.8, 7.3), pt(11.3, 11.8), pt(12.0, 12.0), pt(12.0, 13.5), pt(11.3, 13.3), pt(4.8, 9.6), pt(4.3, 8.6), pt(4.3, 7.3)], fill="#d4d4d8")
    draw.polygon([pt(12.0, 12.0), pt(12.7, 11.8), pt(19.2, 8.1), pt(19.7, 7.8), pt(19.7, 8.8), pt(19.2, 9.6), pt(12.7, 13.3), pt(12.0, 13.5)], fill="#a1a1aa")

    # Downsample with Lanczos filter for crisp rendering
    return img.resize((size, size), Image.Resampling.LANCZOS)

if __name__ == "__main__":
    for s in [16, 32, 48, 128]:
        im = render_tabstack_icon(s)
        im.save(f"icons/icon{s}.png")
        print(f"Generated icons/icon{s}.png ({s}x{s})")
