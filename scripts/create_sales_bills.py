# Script to write sales_bills.csv and convert to sales_bills.json
import csv
import json

def norm_date(s):
    if not s: return ""
    s = s.strip().replace('/', '-').replace('.', '-')
    p = s.split('-')
    if len(p) == 3:
        if len(p[0]) <= 2 and len(p[2]) == 4:
            return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
        elif len(p[0]) <= 2 and len(p[2]) == 2:
            return f"20{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
        elif len(p[0]) == 4:
            return f"{p[0]}-{p[1].zfill(2)}-{p[2].zfill(2)}"
    return s

def to_num(v, d=0):
    if not v: return d
    v = str(v).replace(',', '').replace('₹', '').strip()
    try:
        return float(v) if '.' in v else int(v)
    except:
        return d
