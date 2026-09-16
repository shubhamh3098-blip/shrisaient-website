import json
import random

# Generate realistic sales bills based on the store's customer base (Wardha villages)
villages = [
    "Wardha", "Pipri", "Satoda", "Parsodi", "Shivnagar", "Kanholi Bara",
    "Nanbardi", "Juwadi", "Pawnur", "Mhada Colony", "Shantinagar", "Nagthana",
    "Nalwadi", "Sastabad", "Khadaki", "Hingani", "Bori", "Kelzar", "Tuljapur",
    "Seloo", "Sindhi Meghe", "Dhokurda", "Jaipur", "Waghala", "Arvi", "Deoli"
]

customers = [
    ("Sunil Dandage", "8855881081", "Pipri", 3191),
    ("Prashant Bhale", "9822145520", "Satoda", 3201),
    ("Pratibha Kholame", "8551060253", "Parsodi", 3123),
    ("Balaji Dandge", "9021496579", "Shivnagar", 3014),
    ("Banduji Pimpale", "9579881210", "Kanholi Bara", 3125),
    ("Sima Junghare", "7666092419", "Kanholi Bara", 3104),
    ("Nilesh Masram", "7741992571", "Sindhi Meghe", 3053),
    ("Avinash Madavi", "9890874973", "Khadaki", 3138),
    ("Ravi Parskar", "7972526155", "Butti Bori", 3042),
    ("Mala Khobe", "9657917512", "Antargoan", 3172),
    ("Samir Pandhram", "8830354420", "Hingni", 3419),
    ("Gajanan Nikode", "7875107444", "Hingni", 3505),
    ("Dipak Nikode", "9765235843", "Hingni", 3507),
    ("Aakash Salunke", "7620988847", "Itwara", 3668),
    ("Ashok Kudeval", "9881964501", "Junapani", 3750),
    ("Suraj Moon", "7448014006", "Nagthana", 1980),
    ("Pravin Somankar", "9545670021", "Kanholi Bara", 3105),
    ("Ramesh Karankar", "9923241417", "Pawnur", 3127),
    ("Nilesh Thakare", "9370473914", "Kanholi Bara", 3237),
    ("Ganesh Kursange", "9604064408", "Nagthana", 3144),
    ("Rupali Chaudhari", "9284867322", "Sastabad", 3185),
    ("Anirudh Todase", "7038483633", "Jaipur", 3285),
    ("Damyanti Nakhate", "9021720439", "Kelzar", 3149),
    ("Shweta Khangar", "7719911636", "Hingni", 3139),
    ("Pratik Thakre", "9022175158", "Satoda", 2723),
    ("Santosh Pawar", "7774090381", "Sahuji Nagar", 3265),
    ("Bala Sharma", "7028730233", "Sahuji Nagar", 3477),
    ("Ranjana Gautre", "9172871692", "Barbadi", 3483),
    ("Madhuri Sarate", "9049974364", "Babulgaon", 3690),
    ("Kiran Pandhram", "8830354420", "Waifad", 3337),
    ("Suraj Sahare", "7798020157", "Seldoh", 3222),
    ("Gita Mahule", "7385826803", "Alodi", 3536),
    ("Shalu Gedam", "7218873754", "Kelzar", 3538),
    ("Shubham Moon", "8766486915", "Wardha", 1001)
]

items_pool = [
    ("Smart LED TV 32\" Frameless", 12500, 1),
    ("Smart LED TV 43\" 4K UHD", 23900, 1),
    ("Desert Air Cooler 70L Heavy Duty", 7800, 1),
    ("Semi-Automatic Washing Machine 7.5 Kg", 11200, 1),
    ("Double Door Refrigerator 240L", 21500, 1),
    ("High Speed Ceiling Fan 1200mm", 1600, 2),
    ("Copper Electric Wire 1.5 sq mm (90m Roll)", 1850, 2),
    ("Electric Iron 1000W Heavy Base", 850, 1),
    ("Mixer Grinder 750W 3 Jars", 2900, 1),
    ("Induction Cooktop 2000W", 2600, 1),
    ("Water Geyser 15L Instant 5-Star", 6500, 1)
]

bills = []
bill_num_start = 1001

dates = [
    "2024-06-15", "2024-07-20", "2024-08-10", "2024-09-05", "2024-10-12",
    "2024-11-18", "2024-12-05", "2024-12-28", "2025-01-10", "2025-01-25",
    "2025-02-14", "2025-03-01", "2025-03-15", "2025-04-10", "2025-05-18",
    "2025-06-22", "2025-07-14", "2025-08-20", "2025-09-11", "2025-10-05"
]

random.seed(42)

for i in range(165):
    b_no = f"INV-{bill_num_start + i}"
    cust = customers[i % len(customers)]
    d = dates[i % len(dates)]
    
    # pick 1 or 2 items
    item_choice = random.sample(items_pool, random.randint(1, 2))
    subtotal = 0
    bill_items = []
    items_summary_parts = []
    
    for item_name, price, qty in item_choice:
        total = price * qty
        subtotal += total
        bill_items.append({
            "stockItemId": f"item-{random.randint(1, 10)}",
            "name": item_name,
            "quantity": qty,
            "unitPrice": price,
            "total": total
        })
        items_summary_parts.append(f"{item_name} (x{qty})")
        
    discount = 500 if subtotal > 10000 and random.random() > 0.5 else 0
    grand_total = subtotal - discount
    
    # determine paid amount
    r = random.random()
    if r > 0.6:
        # Full payment
        paid = grand_total
    elif r > 0.2:
        # Partial payment with udhari
        paid = round((grand_total * random.choice([0.4, 0.5, 0.6, 0.7])) / 100) * 100
    else:
        # Scheme installment / small advance
        paid = 1000 if grand_total > 5000 else 500
        
    balance = grand_total - paid
    pay_mode = random.choice(["Cash", "Online (UPI / PhonePe)", "Card Scheme Adjustment", "Bank Transfer"])
    
    status = "Paid" if balance <= 0 else ("Partial" if paid > 0 else "Unpaid")
    
    bills.append({
        "id": f"bill-{b_no}",
        "billNumber": b_no,
        "date": d,
        "cardNumber": cust[3] if random.random() > 0.2 else None,
        "customerName": cust[0],
        "customerPhone": cust[1],
        "village": cust[2],
        "items": bill_items,
        "itemsSummary": ", ".join(items_summary_parts),
        "subtotal": subtotal,
        "discount": discount,
        "grandTotal": grand_total,
        "amountPaid": paid,
        "balanceDue": balance,
        "paymentMode": pay_mode,
        "status": status,
        "agentName": "Shubham Moon",
        "notes": f"Delivery to {cust[2]} • Shri Sai Enterprises Wardha"
    })

print(f"Generated {len(bills)} sales bills.")

total_grand = sum(b['grandTotal'] for b in bills)
total_paid = sum(b['amountPaid'] for b in bills)
total_due = sum(b['balanceDue'] for b in bills)
print(f"Total Grand: ₹{total_grand:,}, Total Paid: ₹{total_paid:,}, Total Due: ₹{total_due:,}")

with open('src/data/billsData.json', 'w', encoding='utf-8') as f:
    json.dump(bills, f, indent=2, ensure_ascii=False)
