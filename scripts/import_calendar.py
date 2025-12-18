#!/usr/bin/env python3
"""
scripts/import_calendar.py

Usage:
  # Fetch by public CSV export URL and write src/data/events.json
  python3 scripts/import_calendar.py --url "https://docs.google.com/.../export?format=csv&gid=0"

  # Or read a local CSV file
  python3 scripts/import_calendar.py --file /path/to/calendar.csv

The script attempts to parse common sheet layouts (header row or row-2-as-header) and
outputs a normalized JSON array to src/data/events.json with objects like:
  { "date": "2026-07-12", "name": "Spring Series", "location": "Quoile", "hwt": "11:00", "tide": "HWT", "pdfUrl": "/pdfs/foo.pdf" }

If your Google Sheet is private, either make it shareable (anyone with the link can view) or
export the CSV locally and run the script with --file.
"""

import argparse
import csv
import io
import json
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

OUTFILE = 'src/data/events.json'


def fetch_url(url):
    req = Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; ImportScript/1.0)'
    })
    try:
        with urlopen(req) as resp:
            data = resp.read()
            try:
                return data.decode('utf-8')
            except UnicodeDecodeError:
                return data.decode('latin-1')
    except HTTPError as e:
        print(f'HTTP error fetching {url}: {e.code} {e.reason}', file=sys.stderr)
        raise
    except URLError as e:
        print(f'URL error fetching {url}: {e}', file=sys.stderr)
        raise


def parse_csv_text_to_events(text):
    if not text or not text.strip():
        return []

    sio = io.StringIO(text)
    reader = csv.DictReader(sio)
    rows = list(reader)
    header_fields = reader.fieldnames or []

    # If the inferred header looks like a date (sheet without header), fall back
    looks_like_date_header = False
    if header_fields:
        first = header_fields[0] if header_fields else ''
        if re.match(r'^\d{4}-\d{2}-\d{2}$', first) or re.search(r'\b\d{1,2}(st|nd|rd|th)?\b', first):
            looks_like_date_header = True

    events = []
    if rows and not looks_like_date_header:
        for r in rows:
            norm = { (k or '').strip().lower(): (v or '').strip() for k, v in r.items() }
            date = norm.get('date') or norm.get('day') or norm.get('event date') or norm.get('start date') or None
            name = norm.get('name') or norm.get('event') or norm.get('title') or None
            location = norm.get('location') or norm.get('club') or None
            hwt = norm.get('hwt') or norm.get('time') or None
            tide = norm.get('tide') or None
            pdf = norm.get('pdfurl') or norm.get('pdf url') or norm.get('si') or norm.get('url') or None
            if not name:
                continue
            events.append({
                'date': date or None,
                'name': name,
                'location': location or None,
                'hwt': hwt or None,
                'tide': tide or None,
                'pdfUrl': pdf or None
            })
    else:
        # fallback to row-based parsing
        sio2 = io.StringIO(text)
        reader2 = csv.reader(sio2)
        rows2 = list(reader2)
        if len(rows2) > 1:
            candidate = rows2[1]
            hasData = any((c or '').strip() for c in candidate)
            if hasData:
                headerRow = [ (c or '').strip() for c in candidate ]
                for row in rows2[2:]:
                    if not any((c or '').strip() for c in row):
                        continue
                    obj = {}
                    for j, h in enumerate(headerRow):
                        obj[h] = (row[j] if j < len(row) else '').strip()
                    norm = { (k or '').strip().lower(): (v or '').strip() for k, v in obj.items() }
                    date = norm.get('date') or norm.get('day') or norm.get('event date') or norm.get('start date') or None
                    name = norm.get('name') or norm.get('event') or norm.get('title') or None
                    location = norm.get('location') or norm.get('club') or None
                    hwt = norm.get('hwt') or norm.get('time') or None
                    tide = norm.get('tide') or None
                    pdf = norm.get('pdfurl') or norm.get('pdf url') or norm.get('si') or norm.get('url') or None
                    if not name:
                        continue
                    events.append({
                        'date': date or None,
                        'name': name,
                        'location': location or None,
                        'hwt': hwt or None,
                        'tide': tide or None,
                        'pdfUrl': pdf or None
                    })
            else:
                # positional mapping
                for row in rows2:
                    if not any((c or '').strip() for c in row):
                        continue
                    date = row[0].strip() if len(row) > 0 else None
                    name = row[1].strip() if len(row) > 1 else None
                    location = row[2].strip() if len(row) > 2 else None
                    hwt = row[3].strip() if len(row) > 3 else None
                    tide = row[4].strip() if len(row) > 4 else None
                    pdf = row[5].strip() if len(row) > 5 else None
                    if not name:
                        continue
                    events.append({
                        'date': date or None,
                        'name': name,
                        'location': location or None,
                        'hwt': hwt or None,
                        'tide': tide or None,
                        'pdfUrl': pdf or None
                    })
        else:
            events = []

    return events


def write_events(events):
    with open(OUTFILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(events)} events to {OUTFILE}')


def main():
    parser = argparse.ArgumentParser(description='Import calendar CSV into src/data/events.json')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url', help='Public CSV export URL (e.g., Google Sheets export URL)')
    group.add_argument('--file', help='Local CSV file path')
    args = parser.parse_args()

    if args.url:
        try:
            text = fetch_url(args.url)
        except Exception as e:
            print('Failed to fetch URL:', e, file=sys.stderr)
            sys.exit(1)
    else:
        with open(args.file, 'r', encoding='utf-8', newline='') as f:
            text = f.read()

    events = parse_csv_text_to_events(text)
    write_events(events)


if __name__ == '__main__':
    main()

