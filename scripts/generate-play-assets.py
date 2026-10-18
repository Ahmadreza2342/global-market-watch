#!/usr/bin/env python3
"""Generate Google Play Store assets: feature graphic (1024x500) and screenshots."""
import cairosvg
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import io

OUT_DIR = Path("/home/z/my-project/public/store")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Feature graphic 1024x500
FEATURE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a0a05"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  
  <!-- Decorative circles -->
  <circle cx="850" cy="120" r="180" fill="url(#gold)" opacity="0.08"/>
  <circle cx="900" cy="380" r="120" fill="url(#gold)" opacity="0.05"/>
  
  <!-- Logo -->
  <rect x="80" y="80" width="120" height="120" rx="28" fill="url(#gold)"/>
  <text x="140" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" font-weight="900" fill="white">G</text>
  
  <!-- Brand name -->
  <text x="220" y="155" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="url(#text-grad)">Global Market Watch</text>
  <text x="220" y="195" font-family="Arial, sans-serif" font-size="22" font-weight="400" fill="#a3a3a3">دیده‌بان بازار جهانی</text>
  
  <!-- Tagline -->
  <text x="80" y="280" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="white">Daily AI-powered analysis of gold, oil &amp; world news</text>
  <text x="80" y="315" font-family="Arial, sans-serif" font-size="22" font-weight="400" fill="#d4d4d4">تحلیل روزانه‌ی طلا، نفت و اخبار جهان با هوش مصنوعی</text>
  
  <!-- Features list -->
  <g transform="translate(80, 360)">
    <circle cx="12" cy="12" r="6" fill="#f59e0b"/>
    <text x="30" y="17" font-family="Arial, sans-serif" font-size="18" fill="#d4d4d4">Live gold &amp; oil prices</text>
    
    <circle cx="212" cy="12" r="6" fill="#f59e0b"/>
    <text x="230" y="17" font-family="Arial, sans-serif" font-size="18" fill="#d4d4d4">AI chat assistant (Aurum)</text>
    
    <circle cx="470" cy="12" r="6" fill="#f59e0b"/>
    <text x="488" y="17" font-family="Arial, sans-serif" font-size="18" fill="#d4d4d4">Multi-TF trading signals</text>
    
    <circle cx="12" cy="52" r="6" fill="#e11d48"/>
    <text x="30" y="57" font-family="Arial, sans-serif" font-size="18" fill="#d4d4d4">Telegram auto-send</text>
    
    <circle cx="212" cy="52" r="6" fill="#e11d48"/>
    <text x="230" y="57" font-family="Arial, sans-serif" font-size="18" fill="#d4d4d4">10 top MQL5 traders</text>
    
    <circle cx="470" cy="52" r="6" fill="#e11d48"/>
    <text x="488" y="57" font-family="Arial, sans-serif" font-size="18" fill="#d4d4d4">Signal performance tracking</text>
  </g>
</svg>"""

print("Generating feature graphic...")
cairosvg.svg2png(
    bytestring=FEATURE_SVG.encode(),
    write_to=str(OUT_DIR / "feature-graphic.png"),
    output_width=1024,
    output_height=500,
)
print(f"  ✓ feature-graphic.png ({(OUT_DIR / 'feature-graphic.png').stat().st_size} bytes)")

# High-res icon 512x512 (already exists, but let's make a Play Store specific one)
ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <text x="256" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="300" font-weight="900" fill="white">G</text>
</svg>"""

print("Generating Play Store icon...")
cairosvg.svg2png(
    bytestring=ICON_SVG.encode(),
    write_to=str(OUT_DIR / "play-icon.png"),
    output_width=512,
    output_height=512,
)
print(f"  ✓ play-icon.png ({(OUT_DIR / 'play-icon.png').stat().st_size} bytes)")

# Generate screenshots
# We'll create 3 simple marketing screenshots
SCREENSHOTS = [
    {
        "name": "screenshot-1-dashboard.png",
        "title": "داشبورد کامل تحلیل بازار",
        "subtitle": "Full Market Dashboard",
        "features": ["قیمت زنده طلا و نفت", "تحلیل روزانه با AI", "اخبار دسته‌بندی شده"],
    },
    {
        "name": "screenshot-2-aurum-chat.png",
        "title": "چت با آروم — دستیار AI",
        "subtitle": "Chat with Aurum AI",
        "features": ["سوال درباره طلا", "تحلیل با داده‌ی زنده", "جواب فارسی روان"],
    },
    {
        "name": "screenshot-3-signals.png",
        "title": "سیگنال‌های معاملاتی",
        "subtitle": "Trading Signals",
        "features": ["نقاط ورود/خروج", "حد سود/ضرر", "قدرت ۰-۱۰۰"],
    },
]

for i, shot in enumerate(SCREENSHOTS, 1):
    print(f"Generating screenshot {i}...")
    # Phone frame 1080x1920 (16:9 portrait, 9:16)
    W, H = 540, 960  # Half size for storage
    img = Image.new("RGB", (W, H), (10, 10, 10))
    draw = ImageDraw.Draw(img)
    
    # Background gradient (simulated with stripes)
    for y in range(H):
        ratio = y / H
        r = int(10 + (26 - 10) * ratio)
        g = int(10 + (10 - 10) * ratio)
        b = int(10 + (5 - 10) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    
    # Logo circle top
    cx, cy = 80, 100
    draw.ellipse([cx-40, cy-40, cx+40, cy+40], fill=(245, 158, 11))
    try:
        font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 50)
        font_md = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except IOError:
        font_lg = ImageFont.load_default()
        font_md = ImageFont.load_default()
        font_sm = ImageFont.load_default()
    
    draw.text((cx-15, cy-30), "G", fill="white", font=font_lg)
    
    # Title
    draw.text((140, 70), shot["subtitle"], fill=(251, 191, 36), font=font_md)
    draw.text((140, 105), shot["title"], fill=(250, 250, 250), font=font_sm)
    
    # Feature bullets
    y = 250
    for f in shot["features"]:
        # Bullet circle
        draw.ellipse([60, y-4, 80, y+16], fill=(245, 158, 11))
        draw.text((100, y-5), f, fill=(212, 212, 212), font=font_sm)
        y += 50
    
    # Bottom gradient bar
    for y in range(H-150, H):
        alpha = int((y - (H-150)) / 150 * 60)
        draw.line([(0, y), (W, y)], fill=(245, 158, 11, 255))
    
    # Footer
    draw.text((30, H-50), "Global Market Watch", fill="white", font=font_md)
    
    img.save(OUT_DIR / shot["name"])
    print(f"  ✓ {shot['name']}")

print("\n✅ All Play Store assets generated in /public/store/")
