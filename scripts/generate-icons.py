#!/usr/bin/env python3
"""Generate PNG icons of various sizes from the SVG icon for PWA."""

from pathlib import Path
import subprocess
import sys

SIZES = [192, 256, 384, 512]
PUBLIC_DIR = Path("/home/z/my-project/public")
ICON_SVG = PUBLIC_DIR / "icon.svg"

# Check if cairosvg is available
try:
    import cairosvg
    HAS_CAIROSVG = True
except ImportError:
    HAS_CAIROSVG = False

# Check if rsvg-convert is available
def has_rsvg():
    try:
        subprocess.run(["rsvg-convert", "--version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

# Check if ImageMagick is available
def has_imagemagick():
    try:
        subprocess.run(["convert", "--version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

def generate_with_cairosvg():
    for size in SIZES:
        out = PUBLIC_DIR / f"icon-{size}.png"
        print(f"Generating {out}...")
        cairosvg.svg2png(url=str(ICON_SVG), write_to=str(out), output_width=size, output_height=size)
        print(f"  ✓ {out} ({out.stat().st_size} bytes)")

def generate_with_rsvg():
    for size in SIZES:
        out = PUBLIC_DIR / f"icon-{size}.png"
        print(f"Generating {out} with rsvg-convert...")
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), str(ICON_SVG), "-o", str(out)], check=True)
        print(f"  ✓ {out} ({out.stat().st_size} bytes)")

def generate_with_imagemagick():
    for size in SIZES:
        out = PUBLIC_DIR / f"icon-{size}.png"
        print(f"Generating {out} with ImageMagick...")
        subprocess.run(["convert", "-background", "none", str(ICON_SVG), "-resize", f"{size}x{size}", str(out)], check=True)
        print(f"  ✓ {out} ({out.stat().st_size} bytes)")

def main():
    if not ICON_SVG.exists():
        print(f"ERROR: {ICON_SVG} not found", file=sys.stderr)
        sys.exit(1)
    if HAS_CAIROSVG:
        print("Using cairosvg...")
        generate_with_cairosvg()
    elif has_rsvg():
        print("Using rsvg-convert...")
        generate_with_rsvg()
    elif has_imagemagick():
        print("Using ImageMagick...")
        generate_with_imagemagick()
    else:
        print("No SVG→PNG converter available. Install one of: cairosvg, librsvg, imagemagick", file=sys.stderr)
        # Try to install cairosvg
        print("Attempting to install cairosvg...")
        subprocess.run([sys.executable, "-m", "pip", "install", "cairosvg"], check=False)
        try:
            import cairosvg
            generate_with_cairosvg()
        except ImportError:
            print("Failed. Please install manually.", file=sys.stderr)
            sys.exit(1)
    print("\n✅ All icons generated successfully!")

if __name__ == "__main__":
    main()
