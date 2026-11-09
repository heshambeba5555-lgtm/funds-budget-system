#!/usr/bin/env python3
"""Generate a sample PDF with doctor names and totals to test the comparison feature."""
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
import subprocess

# Find an Arabic-supporting font
result = subprocess.run(['fc-list', ':lang=ar'], capture_output=True, text=True)
arabic_fonts = [l.split(':')[0].strip() for l in result.stdout.strip().split('\n') if l.strip() and ':' in l]
print(f"Arabic fonts found: {arabic_fonts[:5]}")

font_path = arabic_fonts[0] if arabic_fonts else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

try:
    pdfmetrics.registerFont(TTFont('ArabicFont', font_path))
    use_arabic = True
except Exception as e:
    print(f"Cannot register Arabic font: {e}")
    use_arabic = False

# Generate sample data: (name, national_id, total)
doctors = [
    ("د. أحمد محمد علي", "29801011234567", 12500.00),
    ("د. فاطمة عبد الله", "29501011234568", 14800.50),
    ("د. خالد إبراهيم", "29601011234569", 9800.00),
    ("د. سارة محمود", "29701011234570", 16200.75),
    ("د. محمد السيد", "29801011234571", 11200.00),
    ("د. نورا أحمد", "29501011234572", 13500.25),
    ("د. عمر فاروق", "29601011234573", 8900.00),
    ("د. هبة مصطفى", "29701011234574", 17500.00),
]

output = '/tmp/sample_entitlements.pdf'
c = canvas.Canvas(output, pagesize=A4)
width, height = A4

if use_arabic:
    c.setFont('ArabicFont', 16)
else:
    c.setFont('Helvetica', 16)

c.drawString(100, height - 50, 'Report of Total Entitlements')
c.setFont('ArabicFont' if use_arabic else 'Helvetica', 12)
c.drawString(100, height - 70, 'Academic Year: 2025/2026')

y = height - 100
c.drawString(50, y, '#')
c.drawString(80, y, 'Doctor Name')
c.drawString(280, y, 'National ID')
c.drawString(420, y, 'Total')
y -= 25

for i, (name, nat_id, total) in enumerate(doctors, 1):
    if y < 50:
        c.showPage()
        c.setFont('ArabicFont' if use_arabic else 'Helvetica', 12)
        y = height - 50
    c.drawString(50, y, str(i))
    c.drawString(80, y, name)
    c.drawString(280, y, nat_id)
    c.drawString(420, y, f'{total:.2f}')
    y -= 25

y -= 10
c.drawString(80, y, 'TOTAL:')
c.drawString(420, y, f'{sum(d[2] for d in doctors):.2f}')

c.save()
print(f'PDF saved: {output}')
print(f'Total doctors: {len(doctors)}')
print(f'Total amount: {sum(d[2] for d in doctors):.2f}')
