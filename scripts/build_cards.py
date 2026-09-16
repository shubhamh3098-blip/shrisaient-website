import csv
import json
import os
import re

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

card_members = []
card_transactions = []
seen_cards = set()

# Parse Scheme 3 CSV
if os.path.exists('public/data/scheme3.csv'):
    with open('public/data/scheme3.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            c_no_raw = row.get('CARD.NO') or row.get('Card No') or ''
            if not c_no_raw.strip(): continue
            try:
                c_no = int(c_no_raw.strip())
            except:
                continue
            name = (row.get('NAME') or f'Member #{c_no}').strip()
            village = (row.get('VILLEGE') or '').strip()
            phone = (row.get('MOBILE.NO') or '').strip()
            opening = to_num(row.get('OPENING AMT'), 0)
            date = norm_date(row.get('DATE')) or '2025-06-01'
            sheet = (row.get('SHEET NO') or '').strip()

            cm_id = f"cm-scheme3-{c_no}"
            seen_cards.add(c_no)
            card_members.append({
                "id": cm_id,
                "cardNumber": c_no,
                "schemeId": "scheme3",
                "schemeName": "Scheme 3 (योजना 3)",
                "customerName": name,
                "phone": phone,
                "village": village,
                "address": f"{village}, Wardha" if village else "Wardha",
                "sheetNo": sheet,
                "joiningDate": date,
                "registrationFee": 50,
                "registrationFeePaid": True,
                "totalDeposited": opening,
                "totalRefunded": 0,
                "netBalance": opening,
                "openingAmt": opening if opening > 0 else None,
                "status": "Active",
                "notes": f"Scheme 3 Member{f' • Sheet #{sheet}' if sheet else ''}"
            })
            if opening > 0:
                card_transactions.append({
                    "id": f"rcpt-s3-{c_no}-{idx}",
                    "cardId": cm_id,
                    "cardNumber": c_no,
                    "schemeId": "scheme3",
                    "customerName": name,
                    "customerPhone": phone,
                    "receiptNo": f"REC-OPN-{c_no}",
                    "date": date,
                    "type": "WeeklyPayment",
                    "amount": opening,
                    "paymentMode": "Cash",
                    "remarks": f"Opening / Weekly Deposit ₹{opening}",
                    "balanceAfter": opening,
                    "createdAt": f"{date}T10:00:00Z"
                })

# Parse Scheme 2 CSV
if os.path.exists('public/data/scheme2.csv'):
    with open('public/data/scheme2.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            c_no_raw = row.get('CARD.NO') or row.get('Card No') or ''
            if not c_no_raw.strip(): continue
            try:
                c_no = int(c_no_raw.strip())
            except:
                continue
            if c_no in seen_cards: continue
            seen_cards.add(c_no)

            name = (row.get('NAME') or f'Member #{c_no}').strip()
            village = (row.get('VILLEGE') or '').strip()
            phone = (row.get('MOBILE.NO') or '').strip()
            opening = to_num(row.get('OPENING AMT'), 0)
            date = norm_date(row.get('DATE')) or '2024-11-01'
            sheet = (row.get('SHEET NO') or '').strip()

            cm_id = f"cm-scheme2-{c_no}"
            card_members.append({
                "id": cm_id,
                "cardNumber": c_no,
                "schemeId": "scheme2",
                "schemeName": "Scheme 2 (योजना 2)",
                "customerName": name,
                "phone": phone,
                "village": village,
                "address": f"{village}, Wardha" if village else "Wardha",
                "sheetNo": sheet,
                "joiningDate": date,
                "registrationFee": 50,
                "registrationFeePaid": True,
                "totalDeposited": opening,
                "totalRefunded": 0,
                "netBalance": opening,
                "openingAmt": opening if opening > 0 else None,
                "status": "Active",
                "notes": f"Scheme 2 Member{f' • Sheet #{sheet}' if sheet else ''}"
            })
            if opening > 0:
                card_transactions.append({
                    "id": f"rcpt-s2-{c_no}-{idx}",
                    "cardId": cm_id,
                    "cardNumber": c_no,
                    "schemeId": "scheme2",
                    "customerName": name,
                    "customerPhone": phone,
                    "receiptNo": f"REC-OPN-{c_no}",
                    "date": date,
                    "type": "WeeklyPayment",
                    "amount": opening,
                    "paymentMode": "Cash",
                    "remarks": f"Opening / Weekly Deposit ₹{opening}",
                    "balanceAfter": opening,
                    "createdAt": f"{date}T10:00:00Z"
                })

print(f"Loaded {len(card_members)} card members, {len(card_transactions)} transactions.")

# Save preliminary data
with open('src/data/cardsData.json', 'w', encoding='utf-8') as f:
    json.dump({"members": card_members, "transactions": card_transactions}, f, indent=2, ensure_ascii=False)
