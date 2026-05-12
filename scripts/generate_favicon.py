#!/usr/bin/env python3
"""
Generate a multi-resolution favicon.ico from public/new-logo.jpg using Pillow.
Run: python3 scripts/generate_favicon.py
"""
from PIL import Image
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
IN = ROOT / 'public' / 'new-logo.jpg'
OUT = ROOT / 'public' / 'favicon.ico'
SIZES = [16, 32, 48, 64, 128, 256]

if not IN.exists():
    print(f"Input image not found: {IN}")
    sys.exit(2)

try:
    im = Image.open(IN).convert('RGBA')
    # Pillow will create an ICO containing multiple sizes when sizes is provided
    im.save(OUT, format='ICO', sizes=[(s, s) for s in SIZES])
    print(f"Wrote favicon: {OUT}")
except Exception as e:
    print("Failed to create favicon:", e)
    sys.exit(1)

