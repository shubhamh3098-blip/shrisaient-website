# Python script to parse receipts, bills, and card members, and output unified dataset

import csv
import json
import re

def normalize_date(s):
    if not s:
        return ""
    s = s.strip().replace('/', '-').replace('.', '-')
    parts = s.split('-')
    if len(parts) == 3:
        p0, p1, p2 = parts[0].strip(), parts[1].strip(), parts[2].strip()
        if len(p0) <= 2 and len(p2) == 4:
            return f"{p2}-{p1.zfill(2)}-{p0.zfill(2)}"
        elif len(p0) <= 2 and len(p2) == 2:
            return f"20{p2}-{p1.zfill(2)}-{p0.zfill(2)}"
        elif len(p0) == 4:
            return f"{p0}-{p1.zfill(2)}-{p2.zfill(2)}"
    return s

def clean_num(val, default=0):
    if not val:
        return default
    val = str(val).replace(',', '').replace('₹', '').strip()
    try:
        return float(val) if '.' in val else int(val)
    except:
        return default

print("Data builder functions defined.")
