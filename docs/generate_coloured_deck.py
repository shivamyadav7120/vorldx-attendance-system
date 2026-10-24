import os
import sys
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return RGBColor(*(int(hex_str[i:i+2], 16) for i in (0, 2, 4)))

# Palettes per section
SECTION_THEMES = {
    # Section 1: Executive & Problem (Slides 1-4) - Royal Navy & Gold
    "EXEC": {
        "bg": hex_to_rgb("0F172A"),
        "card_bg": hex_to_rgb("1E293B"),
        "card_header": hex_to_rgb("334155"),
        "accent": hex_to_rgb("F59E0B"),       # Amber Gold
        "secondary": hex_to_rgb("38BDF8"),    # Sky Blue
        "pill_bg": hex_to_rgb("2A2010"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("FDE68A"),
        "text_body": hex_to_rgb("E2E8F0")
    },
    # Section 2: Architecture & Tech Stack (Slides 5-8) - Electric Indigo & Blue
    "ARCH": {
        "bg": hex_to_rgb("0A1128"),
        "card_bg": hex_to_rgb("14213D"),
        "card_header": hex_to_rgb("1C315E"),
        "accent": hex_to_rgb("00F0FF"),       # Neon Cyan
        "secondary": hex_to_rgb("3B82F6"),    # Cobalt Blue
        "pill_bg": hex_to_rgb("0D2F4F"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("BAE6FD"),
        "text_body": hex_to_rgb("E0F2FE")
    },
    # Section 3: Database & State (Slides 9-13) - Deep Emerald & Mint
    "DATA": {
        "bg": hex_to_rgb("05201A"),
        "card_bg": hex_to_rgb("0B382D"),
        "card_header": hex_to_rgb("125444"),
        "accent": hex_to_rgb("10B981"),       # Bright Emerald
        "secondary": hex_to_rgb("34D399"),    # Mint Green
        "pill_bg": hex_to_rgb("0D3D30"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("A7F3D0"),
        "text_body": hex_to_rgb("D1FAE5")
    },
    # Section 4: Dynamic QR & Kiosk (Slides 14-19) - Cyber Cyan & Laser Orange
    "KIOSK": {
        "bg": hex_to_rgb("0B192C"),
        "card_bg": hex_to_rgb("1E3E62"),
        "card_header": hex_to_rgb("295F98"),
        "accent": hex_to_rgb("FF6500"),       # Laser Orange
        "secondary": hex_to_rgb("00E5FF"),    # Cyber Cyan
        "pill_bg": hex_to_rgb("382210"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("FED7AA"),
        "text_body": hex_to_rgb("F1F5F9")
    },
    # Section 5: Mobile App (Slides 20-28) - Cosmic Violet & Neon Magenta
    "MOBILE": {
        "bg": hex_to_rgb("1A0B2E"),
        "card_bg": hex_to_rgb("2C144D"),
        "card_header": hex_to_rgb("3E1F6B"),
        "accent": hex_to_rgb("C084FC"),       # Purple Lavender
        "secondary": hex_to_rgb("F43F5E"),    # Neon Rose
        "pill_bg": hex_to_rgb("3B1B54"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("F5D0FE"),
        "text_body": hex_to_rgb("FDF4FF")
    },
    # Section 6: Web Admin & Approvals (Slides 29-39) - Oceanic Teal & Sky
    "WEB": {
        "bg": hex_to_rgb("082032"),
        "card_bg": hex_to_rgb("113D5E"),
        "card_header": hex_to_rgb("1C5B88"),
        "accent": hex_to_rgb("2DD4BF"),       # Aqua Teal
        "secondary": hex_to_rgb("60A5FA"),    # Light Blue
        "pill_bg": hex_to_rgb("0F455A"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("99F6E4"),
        "text_body": hex_to_rgb("F0FDFA")
    },
    # Section 7: Testing, Compliance & Future (Slides 40-45) - Ruby Coral & Emerald
    "FINAL": {
        "bg": hex_to_rgb("1E1018"),
        "card_bg": hex_to_rgb("381827"),
        "card_header": hex_to_rgb("54233A"),
        "accent": hex_to_rgb("FB7185"),       # Coral Rose
        "secondary": hex_to_rgb("34D399"),    # Emerald
        "pill_bg": hex_to_rgb("4A1E2F"),
        "text_head": hex_to_rgb("FFFFFF"),
        "text_sub": hex_to_rgb("FECDD3"),
        "text_body": hex_to_rgb("FFF1F2")
    }
}

def get_theme_for_slide(slide_num):
    if slide_num <= 4:
        return SECTION_THEMES["EXEC"]
    elif slide_num <= 8:
        return SECTION_THEMES["ARCH"]
    elif slide_num <= 13:
        return SECTION_THEMES["DATA"]
    elif slide_num <= 19:
        return SECTION_THEMES["KIOSK"]
    elif slide_num <= 28:
        return SECTION_THEMES["MOBILE"]
    elif slide_num <= 39:
        return SECTION_THEMES["WEB"]
    else:
        return SECTION_THEMES["FINAL"]

def create_coloured_deck(output_pptx="VorldX_Coloured_Enterprise_Attendance_System_45_Pages.pptx"):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_coloured_slide(title, category, slide_num, total=45):
        theme = get_theme_for_slide(slide_num)
        slide = prs.slides.add_slide(blank_layout)

        # Full slide background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = theme["bg"]
        bg.line.fill.background()

        # Colorful decorative top edge bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.08))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = theme["accent"]
        top_bar.line.fill.background()

        # Category Pill (Left)
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.38), Inches(3.6), Inches(0.35))
        pill.fill.solid()
        pill.fill.fore_color.rgb = theme["pill_bg"]
        pill.line.color.rgb = theme["accent"]
        pill.line.width = Pt(1.5)
        tf_pill = pill.text_frame
        p_pill = tf_pill.paragraphs[0]
        p_pill.text = f"★  {category.upper()}"
        p_pill.font.size = Pt(10)
        p_pill.font.bold = True
        p_pill.font.color.rgb = theme["accent"]
        p_pill.alignment = PP_ALIGN.CENTER

        # Slide Number Badge (Right)
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.0), Inches(0.38), Inches(1.533), Inches(0.35))
        badge.fill.solid()
        badge.fill.fore_color.rgb = theme["pill_bg"]
        badge.line.color.rgb = theme["secondary"]
        badge.line.width = Pt(1.5)
        tf_b = badge.text_frame
        p_b = tf_b.paragraphs[0]
        p_b.text = f"PAGE {slide_num:02d} / {total}"
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = theme["secondary"]
        p_b.alignment = PP_ALIGN.CENTER

        # Slide Main Title
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.733), Inches(0.65))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(23)
        p.font.bold = True
        p.font.color.rgb = theme["text_head"]

        # Vibrant Accent Divider Under Title
        line1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.45), Inches(3.5), Inches(0.04))
        line1.fill.solid()
        line1.fill.fore_color.rgb = theme["accent"]
        line1.line.fill.background()

        line2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.35), Inches(1.45), Inches(8.183), Inches(0.03))
        line2.fill.solid()
        line2.fill.fore_color.rgb = theme["secondary"]
        line2.line.fill.background()

        # Footer
        ft = slide.shapes.add_textbox(Inches(0.8), Inches(7.12), Inches(11.733), Inches(0.28))
        tf_ft = ft.text_frame
        p_ft = tf_ft.paragraphs[0]
        p_ft.text = "VORLDX INDUSTRIES PRIVATE LIMITED  |  CIN: U62099UP2026PTC245598  |  ENTERPRISE ARCHITECTURAL REPORT"
        p_ft.font.size = Pt(8.5)
        p_ft.font.bold = True
        p_ft.font.color.rgb = theme["secondary"]

        return slide, theme

    def add_card(slide, theme, left, top, width, height, title, items, border_color=None, bg_color=None, header_bg=None):
        b_col = border_color or theme["accent"]
        c_bg = bg_color or theme["card_bg"]
        h_bg = header_bg or theme["card_header"]

        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = c_bg
        card.line.color.rgb = b_col
        card.line.width = Pt(1.5)

        # Header banner inside card
        header_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.48))
        header_bar.fill.solid()
        header_bar.fill.fore_color.rgb = h_bg
        header_bar.line.color.rgb = b_col
        header_bar.line.width = Pt(1)
        tf_hb = header_bar.text_frame
        p_hb = tf_hb.paragraphs[0]
        p_hb.text = f"◆ {title.upper()} ◆"
        p_hb.font.size = Pt(11)
        p_hb.font.bold = True
        p_hb.font.color.rgb = b_col
        p_hb.alignment = PP_ALIGN.CENTER

        # Content Box
        tb = slide.shapes.add_textbox(left + Inches(0.18), top + Inches(0.52), width - Inches(0.36), height - Inches(0.58))
        tf = tb.text_frame
        tf.word_wrap = True

        for idx, item in enumerate(items):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.space_after = Pt(4)
            if isinstance(item, tuple):
                h, b = item
                run1 = p.add_run()
                run1.text = f"• {h}: "
                run1.font.bold = True
                run1.font.size = Pt(10.5)
                run1.font.color.rgb = theme["text_head"]

                run2 = p.add_run()
                run2.text = b
                run2.font.size = Pt(10)
                run2.font.color.rgb = theme["text_body"]
            else:
                p.text = f"• {item}"
                p.font.size = Pt(10)
                p.font.color.rgb = theme["text_body"]

    def add_stat_box(slide, theme, left, top, width, height, value, label, accent_color=None):
        acc = accent_color or theme["accent"]
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        box.fill.solid()
        box.fill.fore_color.rgb = theme["card_bg"]
        box.line.color.rgb = acc
        box.line.width = Pt(2.0)

        tb = slide.shapes.add_textbox(left, top + Inches(0.06), width, height - Inches(0.12))
        tf = tb.text_frame
        p1 = tf.paragraphs[0]
        p1.text = value
        p1.font.size = Pt(25)
        p1.font.bold = True
        p1.font.color.rgb = acc
        p1.alignment = PP_ALIGN.CENTER

        p2 = tf.add_paragraph()
        p2.text = label
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = theme["text_head"]
        p2.font.bold = True
        p2.alignment = PP_ALIGN.CENTER

    def add_coloured_table(slide, theme, left, top, width, height, headers, rows):
        table_shape = slide.shapes.add_table(len(rows) + 1, len(headers), left, top, width, height)
        tbl = table_shape.table

        # Format Header
        for col_idx, h in enumerate(headers):
            cell = tbl.cell(0, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = theme["card_header"]
            p = cell.text_frame.paragraphs[0]
            p.text = h
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = theme["accent"]
            p.alignment = PP_ALIGN.CENTER

        # Format Rows
        for r_idx, row in enumerate(rows):
            bg = theme["card_bg"] if r_idx % 2 == 0 else theme["bg"]
            for c_idx, val in enumerate(row):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.fill.solid()
                cell.fill.fore_color.rgb = bg
                p = cell.text_frame.paragraphs[0]
                p.text = str(val)
                p.font.size = Pt(9.5)
                p.font.color.rgb = theme["text_body"]
                if c_idx == 0:
                    p.font.bold = True
                    p.font.color.rgb = theme["text_head"]

    # ==========================================
    # SLIDE 1: Cover Slide (High Vibrancy Gold & Sapphire)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    th1 = SECTION_THEMES["EXEC"]
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = th1["bg"]
    bg1.line.fill.background()

    # Outer decorative gradient frame
    dec1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    dec1.fill.solid()
    dec1.fill.fore_color.rgb = th1["card_bg"]
    dec1.line.color.rgb = th1["accent"]
    dec1.line.width = Pt(2.5)

    # Inner decorative badge
    top_badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.1), Inches(1.2), Inches(5.1), Inches(0.45))
    top_badge.fill.solid()
    top_badge.fill.fore_color.rgb = th1["pill_bg"]
    top_badge.line.color.rgb = th1["accent"]
    top_badge.line.width = Pt(1.5)
    tf_tb = top_badge.text_frame
    p_tb = tf_tb.paragraphs[0]
    p_tb.text = "★ OFFICIAL FULL-STACK ENTERPRISE DELIVERABLE ★"
    p_tb.font.size = Pt(11)
    p_tb.font.bold = True
    p_tb.font.color.rgb = th1["accent"]
    p_tb.alignment = PP_ALIGN.CENTER

    tb1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.85), Inches(10.9), Inches(1.5))
    tf1 = tb1.text_frame
    p = tf1.paragraphs[0]
    p.text = "VORLDX EMPLOYEE ATTENDANCE SYSTEM"
    p.font.size = Pt(33)
    p.font.bold = True
    p.font.color.rgb = hex_to_rgb("FFFFFF")
    p.alignment = PP_ALIGN.CENTER

    p2 = tf1.add_paragraph()
    p2.text = "Complete 45-Page Architectural Blueprint & Functional Specification"
    p2.font.size = Pt(19)
    p2.font.bold = True
    p2.font.color.rgb = th1["accent"]
    p2.alignment = PP_ALIGN.CENTER

    # Multi-coloured technology pills on cover
    pills_data = [
        ("React 18 + Vite", hex_to_rgb("0284C7"), Inches(1.5)),
        ("React Native Expo 58", hex_to_rgb("7C3AED"), Inches(3.9)),
        ("Node.js & Express", hex_to_rgb("059669"), Inches(6.3)),
        ("Dynamic QR (18s)", hex_to_rgb("EA580C"), Inches(8.7)),
        ("MongoDB Atlas", hex_to_rgb("0D9488"), Inches(10.7))
    ]
    for p_name, p_col, p_left in pills_data:
        pill_elem = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p_left, Inches(3.6), Inches(1.9), Inches(0.42))
        pill_elem.fill.solid()
        pill_elem.fill.fore_color.rgb = p_col
        pill_elem.line.color.rgb = hex_to_rgb("FFFFFF")
        pill_elem.line.width = Pt(1)
        tf_pe = pill_elem.text_frame
        p_pe = tf_pe.paragraphs[0]
        p_pe.text = p_name
        p_pe.font.size = Pt(9.5)
        p_pe.font.bold = True
        p_pe.font.color.rgb = hex_to_rgb("FFFFFF")
        p_pe.alignment = PP_ALIGN.CENTER

    # Corporate info card
    tb_corp = s1.shapes.add_textbox(Inches(1.5), Inches(4.3), Inches(10.3), Inches(2.0))
    tf_corp = tb_corp.text_frame
    p_c1 = tf_corp.paragraphs[0]
    p_c1.text = "VorldX Industries Private Limited  |  CIN: U62099UP2026PTC245598"
    p_c1.font.size = Pt(13)
    p_c1.font.bold = True
    p_c1.font.color.rgb = th1["secondary"]
    p_c1.alignment = PP_ALIGN.CENTER

    p_c2 = tf_corp.add_paragraph()
    p_c2.text = "Headquarters: Lucknow, Uttar Pradesh, India  •  Official Email: hello@vorldx.com"
    p_c2.font.size = Pt(11)
    p_c2.font.color.rgb = hex_to_rgb("CBD5E1")
    p_c2.alignment = PP_ALIGN.CENTER

    p_c3 = tf_corp.add_paragraph()
    p_c3.text = "Status: Production Verified  •  14 Automated Test Suites Passed (100% Pass Rate)"
    p_c3.font.size = Pt(11.5)
    p_c3.font.bold = True
    p_c3.font.color.rgb = hex_to_rgb("34D399")
    p_c3.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 2: Corporate Profile & Executive Mission (Gold Theme)
    # ==========================================
    s2, th2 = add_coloured_slide("Corporate Profile & Executive Mission", "Corporate Identity", 2)
    add_card(s2, th2, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Organization DNA & Governance", [
        ("Company Name", "VorldX Industries Private Limited"),
        ("Corporate Identity (CIN)", "U62099UP2026PTC245598"),
        ("Headquarters", "Lucknow, Uttar Pradesh, India"),
        ("Global Support", "hello@vorldx.com / contact@vorldx.com"),
        ("Industry Domain", "Next-Gen Enterprise SaaS & Workforce Intelligence"),
        ("Core Mandate", "Eliminate proxy punches, establish verifiable cryptographic attendance, and empower hybrid workforce flexibility.")
    ], border_color=th2["accent"])

    add_card(s2, th2, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Executive Product Objectives", [
        ("Zero-Trust Verification", "Eliminate buddy punching and static badge copying using 18s rotating dynamic tokens."),
        ("Multi-Role Governance", "Clear separation between Super Admin, HR Admin, Employee, and Kiosk."),
        ("Timezone Rigor", "Hardened Indian Standard Time (IST) schedule with strict 09:30 AM cutoff and automated late tracking."),
        ("Hybrid Flexibility", "Regulated 5-employee/day WFH quota with two-tier managerial review."),
        ("Audit Compliance", "Forensic immutable audit logging for all manual punches and attendance adjustments.")
    ], border_color=th2["secondary"])

    # ==========================================
    # SLIDE 3: The Enterprise Challenge (Red / Amber Alert Theme)
    # ==========================================
    s3, th3 = add_coloured_slide("The Enterprise Challenge: Legacy Attendance Pitfalls", "Problem Analysis", 3)
    add_card(s3, th3, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "1. Static Punch Vulnerabilities", [
        ("Buddy Punching", "Co-workers clocking in for absent colleagues via shared RFID tags or PINs."),
        ("Static QR Photocopies", "Employees photographing static QR posters to check in remotely from parking lots or cafes."),
        ("No Identity Assurance", "Lack of biometric or device cryptographic linkage.")
    ], border_color=hex_to_rgb("EF4444"), header_bg=hex_to_rgb("451A1A"))

    add_card(s3, th3, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "2. Hybrid Workforce Friction", [
        ("Unregulated WFH Chaos", "Uncontrolled remote days leading to empty physical offices and communication voids."),
        ("Messy Email Threads", "Leave requests lost across chats and inboxes with no real-time quota visibility."),
        ("Inflexible Cutoffs", "No automated distinction between punctual staff and chronic latecomers.")
    ], border_color=hex_to_rgb("F59E0B"), header_bg=hex_to_rgb("452B10"))

    add_card(s3, th3, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "3. Administrative Overhead", [
        ("Manual Excel Aggregations", "HR spending dozens of hours monthly consolidating punch logs and fixing discrepancies."),
        ("Audit Non-Compliance", "Unverified manual corrections lacking tamper-evident audit logs."),
        ("Disjointed Systems", "Mobile apps, admin dashboards, and office displays operating on disconnected databases.")
    ], border_color=hex_to_rgb("A855F7"), header_bg=hex_to_rgb("2D1542"))

    # ==========================================
    # SLIDE 4: Strategic Solution Vision & Ecosystem
    # ==========================================
    s4, th4 = add_coloured_slide("Strategic Solution Vision & Ecosystem", "Strategic Vision", 4)
    add_stat_box(s4, th4, Inches(0.8), Inches(1.6), Inches(2.7), Inches(1.2), "18s", "Dynamic QR Life", hex_to_rgb("00F0FF"))
    add_stat_box(s4, th4, Inches(3.8), Inches(1.6), Inches(2.7), Inches(1.2), "09:30 AM", "IST Late Cutoff", hex_to_rgb("F59E0B"))
    add_stat_box(s4, th4, Inches(6.8), Inches(1.6), Inches(2.7), Inches(1.2), "5 / Day", "Max WFH Quota", hex_to_rgb("A855F7"))
    add_stat_box(s4, th4, Inches(9.8), Inches(1.6), Inches(2.7), Inches(1.2), "100%", "Audited Corrections", hex_to_rgb("10B981"))

    add_card(s4, th4, Inches(0.8), Inches(3.0), Inches(5.7), Inches(3.8), "Three Coordinated Ecosystem Clients", [
        ("1. Office QR Display (Kiosk)", "Dedicated reception screen generating dynamic tokens, laser scanning beam, countdown timer."),
        ("2. Employee Mobile App", "React Native / Expo app for camera scanning, live shift telemetry, WFH/leave requests, profile uploads."),
        ("3. Admin Web Console", "React 18 + Vite dashboard for HR directories, live attendance sheets, WFH approvals, and policy engines.")
    ], border_color=th4["accent"])

    add_card(s4, th4, Inches(6.8), Inches(3.0), Inches(5.7), Inches(3.8), "Core Architectural Strengths", [
        ("Cryptographic Session Tokens", "Tokens auto-expire every 18 seconds via MongoDB TTL indexes preventing replay."),
        ("Dual-Layer Managerial Approvals", "WFH requests undergo HR review followed by Super Admin confirmation."),
        ("Single Source of Truth", "Centralized MongoDB persistent cluster synchronizing web, app, and kiosk in real-time.")
    ], border_color=th4["secondary"])

    # ==========================================
    # SLIDE 5: High-Level Architecture (Electric Blue Theme)
    # ==========================================
    s5, th5 = add_coloured_slide("High-Level Enterprise Architecture Overview", "Architecture Blueprint", 5)
    add_card(s5, th5, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Tier 1: Client Layer", [
        ("Admin Web App", "React 18, Vite, Lucide Icons, Recharts, Tailwind CSS. Consumes REST APIs with JWT Bearer auth."),
        ("Employee Mobile Client", "React Native 0.76, Expo 58, Camera Module, AsyncStorage, Vector Icons."),
        ("Reception Kiosk Screen", "Dedicated wall-mounted terminal running continuous 18s rolling token generator.")
    ], border_color=hex_to_rgb("00F0FF"))

    add_card(s5, th5, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Tier 2: Business Logic Layer", [
        ("REST API Router", "Node.js & Express.js with CORS, JSON body parsers, express-rate-limiters."),
        ("Policy Evaluator", "Strict IST time computation enforcing 09:30 AM boundary and late classification."),
        ("QR Cryptographic Engine", "Random 256-bit token generator with TTL expiration and replay detection."),
        ("WFH Quota Engine", "Concurrent active count query ensuring max 5 approved employees per day."),
        ("Forensic Audit Engine", "Immutable logging service for all manual overrides.")
    ], border_color=hex_to_rgb("3B82F6"))

    add_card(s5, th5, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Tier 3: Persistence Layer", [
        ("Database Engine", "MongoDB Atlas / Replica Set with Mongoose ODM."),
        ("Document Models", "9 distinct Schemas with strict type validations and pre-save hooks."),
        ("Indexing Strategy", "Unique compound indexes (employee, date) to prevent duplicate check-ins."),
        ("TTL Indexes", "Self-cleaning QR session tokens with 18-second auto-expiry."),
        ("Asset Storage", "Local file storage for employee profile avatars under /uploads/avatars.")
    ], border_color=hex_to_rgb("A855F7"))

    # ==========================================
    # SLIDE 6: Tech Stack Table (Vibrant Indigo Table)
    # ==========================================
    s6, th6 = add_coloured_slide("Technology Stack & Tooling Breakdown", "Tech Stack Matrix", 6)
    headers_s6 = ["Layer / Domain", "Primary Framework", "Supporting Libraries", "Core Purpose"]
    rows_s6 = [
        ["Web Frontend", "React 18 + Vite", "Tailwind CSS, Lucide React, Recharts", "Super Admin & HR administrative console"],
        ["Mobile App", "React Native + Expo 58", "Expo Camera, AsyncStorage, Vector Icons", "Cross-platform iOS & Android employee client"],
        ["Backend API", "Node.js + Express.js", "cors, dotenv, express-rate-limit", "RESTful business logic and security middleware"],
        ["Database", "MongoDB (Atlas/Replica)", "Mongoose 8.x ODM", "Persistent multi-collection document store"],
        ["Security / Crypto", "JWT (jsonwebtoken)", "bcryptjs (12 salt rounds)", "Stateless authorization & password hashing"],
        ["DevOps & Tooling", "Metro Bundler, npm", "Git, PowerShell Automation, ESLint", "Build pipelines, zero comment enforcement"]
    ]
    add_coloured_table(s6, th6, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s6, rows_s6)

    # ==========================================
    # SLIDE 7: Security & Cryptographic Model
    # ==========================================
    s7, th7 = add_coloured_slide("Security & Cryptographic Model", "Security Architecture", 7)
    add_card(s7, th7, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Identity & Authentication Defense", [
        ("Stateless JWT Tokens", "Cryptographically signed JSON Web Tokens containing userId, role, and expiration timestamp."),
        ("bcrypt Cost Factor 12", "All passwords hashed using 12 salt rounds against rainbow table attacks."),
        ("Strict .env Credential Binding", "Super Admin credentials exclusively governed by environment variables (ADMIN_ID, ADMIN_PASS)."),
        ("Role Authorization Guards", "Middleware `allowRoles('SUPER_ADMIN')` blocking unauthorized endpoints with HTTP 403."),
        ("Simulated & Dynamic OTP", "Encrypted ephemeral OTPs with strict 10-minute validity and attempt limits.")
    ], border_color=th7["accent"])

    add_card(s7, th7, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Anti-Spoofing & Replay Mitigation", [
        ("18-Second Rolling QR Tokens", "Each session token contains unique cryptographic entropy valid for only 18 seconds."),
        ("Single-Use Invalidation", "When consumed during check-in, token is immediately marked `used: true`."),
        ("Replay Attack Rejection", "Any re-submission of an expired or used token returns immediate HTTP 400 Bad Request."),
        ("Compound Index Lock", "MongoDB unique compound index on `(employee, date)` makes duplicate punches physically impossible."),
        ("Rate Limiting", "Express rate-limit protects auth and punch endpoints against brute-force attacks.")
    ], border_color=hex_to_rgb("10B981"))

    # ==========================================
    # SLIDE 8: Multi-Role RBAC Matrix
    # ==========================================
    s8, th8 = add_coloured_slide("Multi-Role RBAC Matrix: Permissions Architecture", "Access Control", 8)
    headers_s8 = ["Functional Capability", "Super Admin", "HR Admin", "Employee", "Kiosk Display"]
    rows_s8 = [
        ["System Policy Configuration (Cutoffs, WFH limit)", "FULL ACCESS", "READ ONLY", "NO ACCESS", "NO ACCESS"],
        ["HR Admin Provisioning & Deactivation", "EXCLUSIVE", "FORBIDDEN (403)", "FORBIDDEN (403)", "NO ACCESS"],
        ["Employee Directory Management", "FULL ACCESS", "FULL ACCESS", "READ ONLY (Self)", "NO ACCESS"],
        ["Attendance Correction (Manual Override + Audit)", "FULL ACCESS", "READ / SUBMIT", "NO ACCESS", "NO ACCESS"],
        ["WFH Request Approvals", "FINAL APPROVAL", "STAGE 1 REVIEW", "APPLY ONLY", "NO ACCESS"],
        ["Dynamic QR Code Check-In / Check-Out", "N/A", "N/A", "CAMERA SCAN", "QR RENDER ONLY"],
        ["Forensic Audit Trail Inspection", "FULL ACCESS", "VIEW LOGS", "NO ACCESS", "NO ACCESS"]
    ]
    add_coloured_table(s8, th8, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s8, rows_s8)

    # ==========================================
    # SLIDE 9: Database Architecture Blueprint (Emerald Theme)
    # ==========================================
    s9, th9 = add_coloured_slide("Database Architecture Blueprint: 9 Core Collections", "Data Layer", 9)
    add_card(s9, th9, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Identity & Directory Collections", [
        ("User", "Core authentication identity with email, passwordHash, role, avatar, active status."),
        ("Employee", "Workforce metadata linked to User: employeeId, department, designation, shift, phone."),
        ("AuditLog", "Immutable audit collection capturing actor, action, target entity, timestamp, IP address.")
    ], border_color=th9["accent"])

    add_card(s9, th9, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Operations & Requests", [
        ("Attendance", "Daily records: date, status, mode, checkIn, checkOut, checkInMethod, auditHistory."),
        ("WfhRequest", "Remote work applications: startDate, endDate, wfhType, status, hrApprovedBy, adminApprovedBy."),
        ("LeaveRequest", "Time-off records: leaveType (Casual/Sick/Earned), date range, status, reason.")
    ], border_color=th9["secondary"])

    add_card(s9, th9, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Governance & System State", [
        ("QrSession", "Rolling 18-second tokens with TTL index on expiresAt, used flags, and location metadata."),
        ("AttendancePolicy", "Singleton document for officeStartTime (09:00), cutoff (09:30), maxWfhPerDay (5)."),
        ("Notification", "System broadcasts, targeted alerts, and read receipt arrays.")
    ], border_color=hex_to_rgb("84CC16"))

    # ==========================================
    # SLIDE 10: Data Entity Deep-Dive: Users & Employees
    # ==========================================
    s10, th10 = add_coloured_slide("Data Entity Deep-Dive: User & Employee Directory", "Data Models", 10)
    add_card(s10, th10, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: User (Authentication Entity)", [
        ("name", "String, required, trimmed corporate full name"),
        ("email", "String, required, unique index, lowercase, case-insensitive"),
        ("passwordHash", "String, required, bcrypt hash with 12 salt rounds"),
        ("role", "Enum: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE']"),
        ("avatar", "String, URL path to stored profile picture in /uploads/avatars/"),
        ("active", "Boolean, default: true; prevents deactivated accounts from logging in"),
        ("createdAt / updatedAt", "Auto-managed timestamps for lifecycle auditing")
    ], border_color=th10["accent"])

    add_card(s10, th10, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: Employee (Corporate Profile)", [
        ("user", "ObjectId referencing User model (1-to-1 relationship)"),
        ("employeeId", "String, required, unique index (e.g. 'VX-EMP-001')"),
        ("department", "Enum: Engineering, Product, HR, Finance, Operations, Sales"),
        ("designation", "String, organizational title (e.g. Senior Full-Stack Engineer)"),
        ("phone", "String, registered mobile number used for OTP authentication"),
        ("shift", "Default: 'Standard 09:00 - 18:00 IST'"),
        ("avatar", "Synchronized avatar URI for fast directory table lookups")
    ], border_color=th10["secondary"])

    # ==========================================
    # SLIDE 11: Data Entity Deep-Dive: Attendance Records
    # ==========================================
    s11, th11 = add_coloured_slide("Data Entity Deep-Dive: Attendance & Audit Trails", "Data Models", 11)
    add_card(s11, th11, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: Attendance (Daily Punch Record)", [
        ("employee", "ObjectId referencing Employee model; indexed"),
        ("date", "String, YYYY-MM-DD format (Asia/Kolkata IST normalized)"),
        ("Compound Index", "Unique index on (employee, date) - strictly enforces one punch record per day"),
        ("status", "Enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT']"),
        ("mode", "Enum: ['OFFICE', 'WFH']"),
        ("checkIn / checkOut", "Timestamps recording exact IST punch times"),
        ("checkInMethod", "Enum: ['QR_SCAN', 'MANUAL_CORRECTION', 'WFH_REMOTE']"),
        ("workingHours", "Computed numeric duration in hours and minutes")
    ], border_color=th11["accent"])

    add_card(s11, th11, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Embedded Schema: auditHistory Array", [
        ("Purpose", "Tamper-evident record of any administrative corrections"),
        ("modifiedBy", "ObjectId referencing the Admin/HR who initiated change"),
        ("previousStatus", "Snapshot of attendance status before alteration"),
        ("newStatus", "Updated attendance status applied by administrator"),
        ("reason", "Mandatory text justification submitted by manager"),
        ("timestamp", "Exact ISO datetime when the adjustment occurred"),
        ("Compliance Value", "Guarantees full forensic traceability for payroll and labor audits")
    ], border_color=hex_to_rgb("F59E0B"))

    # ==========================================
    # SLIDE 12: Data Entity Deep-Dive: WFH & Leave State Machines
    # ==========================================
    s12, th12 = add_coloured_slide("Data Entity Deep-Dive: WFH & Leave State Machines", "State Machines", 12)
    add_card(s12, th12, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "WfhRequest State Machine (Two-Stage)", [
        ("PENDING", "Initial state upon employee submission with date & reason"),
        ("HR_APPROVED", "Stage 1 passed: HR Admin reviewed and endorsed request"),
        ("APPROVED", "Final state: Super Admin ratified request; attendance unlocked"),
        ("REJECTED", "Denied by HR Admin or Super Admin with formal remarks"),
        ("CANCELLED", "Revoked by employee prior to managerial decision"),
        ("Audit Fields", "hrApprovedBy, hrDecisionDate, adminApprovedBy, adminDecisionDate")
    ], border_color=hex_to_rgb("A855F7"))

    add_card(s12, th12, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "LeaveRequest State Machine", [
        ("leaveType", "Enum: ['CASUAL', 'SICK', 'EARNED']"),
        ("startDate / endDate", "Dates defining leave period duration"),
        ("reason", "Detailed explanation and optional medical attachment link"),
        ("status", "Enum: ['PENDING', 'APPROVED', 'REJECTED']"),
        ("decidedBy", "Reference to the approving HR or Super Admin"),
        ("Balance Deduction", "Automatically adjusts remaining leave balance on approval")
    ], border_color=th12["secondary"])

    # ==========================================
    # SLIDE 13: Data Entity Deep-Dive: QR Sessions & Policies
    # ==========================================
    s13, th13 = add_coloured_slide("Data Entity Deep-Dive: Dynamic QR & System Policy", "Data Models", 13)
    add_card(s13, th13, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: QrSession (Ephemeral Rolling Token)", [
        ("token", "256-bit cryptographically secure token string; unique index"),
        ("officeLocation", "Location descriptor (e.g., 'Lucknow HQ - Reception Screen 1')"),
        ("generatedBy", "Reference to kiosk session or reception admin identity"),
        ("expiresAt", "Date field with MongoDB TTL Index (auto-deletes after 18 seconds)"),
        ("used", "Boolean flag; set to true upon first scan consumption"),
        ("usedBy", "ObjectId of employee who scanned the token"),
        ("usedAt", "Timestamp recording the exact millisecond of consumption")
    ], border_color=th13["accent"])

    add_card(s13, th13, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: AttendancePolicy (Enterprise Singleton)", [
        ("officeStartTime", "String: '09:00' (Official work day start time)"),
        ("checkInCutoffTime", "String: '09:30' (Boundary between PRESENT and LATE)"),
        ("officeEndTime", "String: '18:00' (Standard shift departure time)"),
        ("maxWfhPerDay", "Number: 5 (Maximum allowable remote employees per day)"),
        ("qrCodeExpirySeconds", "Number: 18 (Configurable rotation duration)"),
        ("allowedIpSubnets", "Optional IP ranges permitted for kiosk token generation"),
        ("enforceGeofencing", "Boolean toggle for physical location locking")
    ], border_color=hex_to_rgb("10B981"))

    # ==========================================
    # SLIDE 14: Timezone Engine & Indian Standard Time (IST) - Cyber Orange/Cyan Theme
    # ==========================================
    s14, th14 = add_coloured_slide("Timezone Engine & Indian Standard Time (IST)", "Time Policy Engine", 14)
    add_stat_box(s14, th14, Inches(0.8), Inches(1.6), Inches(3.7), Inches(1.3), "UTC +05:30", "Normalized Timezone", hex_to_rgb("00E5FF"))
    add_stat_box(s14, th14, Inches(4.8), Inches(1.6), Inches(3.7), Inches(1.3), "09:00 AM IST", "Shift Commencement", hex_to_rgb("10B981"))
    add_stat_box(s14, th14, Inches(8.8), Inches(1.6), Inches(3.7), Inches(1.3), "09:30 AM IST", "Strict Late Cutoff", hex_to_rgb("FF6500"))

    add_card(s14, th14, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Time Normalization Architecture", [
        ("Asia/Kolkata Boundary", "All timestamps are converted and parsed in Asia/Kolkata timezone regardless of hosting server zone (AWS, Azure, or local)."),
        ("Date String Key", "Date strings stored in normalized YYYY-MM-DD IST to prevent UTC day-shift bugs."),
        ("No Device Clock Spoofing", "Check-in time is calculated strictly from server NTP clock, rejecting client phone clock manipulations.")
    ], border_color=th14["secondary"])

    add_card(s14, th14, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Automated Classification Algorithm", [
        ("<= 09:30:00 AM IST", "Attendance marked with status 'PRESENT'. Punctuality metrics incremented."),
        ("> 09:30:00 AM IST", "Attendance marked with status 'LATE'. Flagged in red on HR dashboard."),
        ("Post 13:00 PM IST", "Check-ins classified as 'HALF_DAY' automatically."),
        ("Absence Auto-Evaluation", "Employees with no check-in by day close marked 'ABSENT'.")
    ], border_color=th14["accent"])

    # ==========================================
    # SLIDE 15: Dynamic Office QR System & 18s Rotation
    # ==========================================
    s15, th15 = add_coloured_slide("Dynamic Office QR System: 18s Rolling Tokens", "QR Security", 15)
    add_card(s15, th15, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Cryptographic Rolling Mechanics", [
        ("Step 1: Session Polling", "Office display polls `/api/qr/session` or `/api/qr/kiosk` to fetch active session."),
        ("Step 2: Entropy Injection", "Server combines timestamp, office salt, and random 256-bit token."),
        ("Step 3: TTL Index", "MongoDB creates document with 18-second auto-expiration."),
        ("Step 4: Real-Time Rendering", "Kiosk renders SVG/Canvas QR with countdown progress ring."),
        ("Step 5: Immediate Burn", "Scanning marks token as used; second scan fails instantly.")
    ], border_color=th15["secondary"])

    add_card(s15, th15, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Anti-Replay & Anti-Fraud Defense", [
        ("Zero Photo-Sharing Risk", "A photo taken by an employee on messaging apps expires in 18s before an offsite colleague can scan it."),
        ("Replay Token Rejection", "Any replayed token throws HTTP 400: 'Token already used or expired'."),
        ("No Static URLs", "QR encodes ephemeral cryptographic payload, not static web URLs."),
        ("Audit Association", "Every token records generating kiosk IP and scanning employee ID.")
    ], border_color=th15["accent"])

    # ==========================================
    # SLIDE 16: Reception / Wall Kiosk Display Mode
    # ==========================================
    s16, th16 = add_coloured_slide("Reception / Wall Kiosk Mode: Display Engineering", "Kiosk UI/UX", 16)
    add_card(s16, th16, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Visual Design & Atmosphere", [
        ("Cyberpunk Aesthetic", "Sleek dark theme with glowing cyan borders and futuristic HUD typography."),
        ("Laser Beam Sweep", "Animated horizontal cyan laser line sweeping across the QR frame continuously."),
        ("Real-Time Clock", "Digital live 24-hour clock displaying current IST seconds and full date format.")
    ], border_color=hex_to_rgb("00E5FF"))

    add_card(s16, th16, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Countdown & Auto-Refresh", [
        ("Circular Countdown Bar", "Radial progress bar tracking the exact remaining seconds out of 18s."),
        ("Color Shift Warning", "Progress transitions from Cyan (18s-6s) to Amber (5s-2s) to Red (<2s)."),
        ("Seamless Transition", "New QR token generated in background without screen flicker or lag.")
    ], border_color=hex_to_rgb("FF6500"))

    add_card(s16, th16, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Hardware & Kiosk Mode", [
        ("Full-Screen Lock", "Runs in browser full-screen kiosk mode (F11) on tablet or smart TV at reception."),
        ("Tamper Resistant", "No interactive navigation buttons accessible to guests or visitors."),
        ("Low Footprint", "Optimized lightweight canvas rendering consuming minimal CPU on kiosk hardware.")
    ], border_color=hex_to_rgb("FBBF24"))

    # ==========================================
    # SLIDE 17: Employee Onboarding & Demo Verification
    # ==========================================
    s17, th17 = add_coloured_slide("Employee Onboarding & Demo Verification", "Onboarding Flow", 17)
    headers_s17 = ["Demo Account ID", "Full Name", "Assigned Department", "Corporate Role", "Simulated OTP"]
    rows_s17 = [
        ["VX-EMP-001", "Aarav Sharma", "Engineering", "Senior Full-Stack Developer", "8426"],
        ["VX-EMP-002", "Priya Patel", "Product & Design", "Lead Product Manager", "8426"],
        ["VX-EMP-003", "Kavita Reddy", "HR & Operations", "People Operations Specialist", "8426"]
    ]
    add_coloured_table(s17, th17, Inches(0.8), Inches(1.7), Inches(11.733), Inches(2.2), headers_s17, rows_s17)

    add_card(s17, th17, Inches(0.8), Inches(4.2), Inches(5.7), Inches(2.6), "Onboarding Protocol", [
        ("1. Directory Matching", "App queries backend to confirm valid Employee ID."),
        ("2. Simulated OTP Dispatch", "Backend renders instant simulated OTP `8426`."),
        ("3. Account Claiming", "Employee sets strong personal password.")
    ], border_color=th17["accent"])

    add_card(s17, th17, Inches(6.8), Inches(4.2), Inches(5.7), Inches(2.6), "Enterprise Security Benefits", [
        ("No Cold Starts", "Enables seamless demonstration without waiting for third-party SMS delays."),
        ("Production Parity", "Exact same API contract and JWT issuance as live SMS gateway.")
    ], border_color=th17["secondary"])

    # ==========================================
    # SLIDE 18: Simulated & Dynamic SMS OTP Handshake
    # ==========================================
    s18, th18 = add_coloured_slide("Simulated & Dynamic SMS OTP Handshake", "Authentication", 18)
    add_card(s18, th18, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Dual-Mode OTP Architecture", [
        ("Demo Sandbox Mode", "When running in test/demo mode, code `8426` is accepted with instant auto-fill code badges."),
        ("Dynamic SMS Mode", "In production mode, server generates a random 4-digit cryptographic OTP."),
        ("SMS Gateway Abstraction", "Pluggable driver interface supporting Twilio, MSG91, AWS SNS, and Fast2SMS."),
        ("Time-To-Live (TTL)", "OTP expires in 10 minutes; automatically purged from session cache."),
        ("Attempt Throttling", "Maximum 3 failed OTP attempts before temporary phone number cooldown.")
    ], border_color=th18["secondary"])

    add_card(s18, th18, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "API Handshake Lifecycle", [
        ("POST /api/auth/send-otp", "Request payload: `{ phone: '+919876543210' }`. Server generates OTP and returns session ID."),
        ("POST /api/auth/verify-otp", "Payload: `{ phone, otp: '8426' }`. Server verifies hash and expiration."),
        ("Response Envelope", "Returns `{ token: JWT, user: { id, name, role, employeeId } }`."),
        ("Mobile Persistence", "JWT stored securely in AsyncStorage for persistent app authentication.")
    ], border_color=th18["accent"])

    # ==========================================
    # SLIDE 19: Passwordless Mobile Number Authentication
    # ==========================================
    s19, th19 = add_coloured_slide("Passwordless Mobile Number Authentication", "Mobile Security", 19)
    add_stat_box(s19, th19, Inches(0.8), Inches(1.6), Inches(3.7), Inches(1.3), "Zero Passwords", "Eliminates Password Fatigue", hex_to_rgb("00E5FF"))
    add_stat_box(s19, th19, Inches(4.8), Inches(1.6), Inches(3.7), Inches(1.3), "1-Tap Login", "Frictionless Employee UX", hex_to_rgb("10B981"))
    add_stat_box(s19, th19, Inches(8.8), Inches(1.6), Inches(3.7), Inches(1.3), "JWT Encrypted", "Tamper-Proof Claims", hex_to_rgb("FF6500"))

    add_card(s19, th19, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Why Passwordless for Attendance?", [
        ("Zero Credentials Stored on Phone", "Employees never need to remember or rotate complex passwords."),
        ("Eliminates Phishing", "No static passwords for attackers to intercept via credential stuffing."),
        ("Instant Revocation", "If an employee leaves, HR deactivates their account and login tokens expire instantly.")
    ], border_color=th19["secondary"])

    add_card(s19, th19, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Fallback & Emergency Auth", [
        ("Super Admin Master Override", "Super Admin can issue temporary login tokens in emergency network outages."),
        ("Multi-Device Support", "Token binding supports seamless transition across iOS, Android, and Web."),
        ("Biometric Extension Ready", "Architecture ready for FaceID / TouchID biometric token unlock.")
    ], border_color=th19["accent"])

    # ==========================================
    # SLIDE 20: Employee Mobile App (Cosmic Violet Theme)
    # ==========================================
    s20, th20 = add_coloured_slide("Employee Mobile App: Architecture & Framework", "Mobile App", 20)
    add_card(s20, th20, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Core Framework", [
        ("React Native 0.76", "Native component rendering for optimal 60fps performance."),
        ("Expo 58 Platform", "Managed workflow ensuring cross-platform iOS & Android parity."),
        ("Metro Bundler", "Fast Hot Module Replacement (HMR) and zero build errors across 399 bundled modules.")
    ], border_color=th20["accent"])

    add_card(s20, th20, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Hardware & Storage", [
        ("Expo Camera", "High-performance camera integration with barcode/QR scanning engine."),
        ("AsyncStorage", "Encrypted local device storage for JWT and offline cached profile."),
        ("ImagePicker API", "Seamless integration with iOS Camera Roll and Android Gallery.")
    ], border_color=th20["secondary"])

    add_card(s20, th20, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Navigation & State", [
        ("Tab Navigation", "Dashboard, Attendance History, Requests (WFH/Leave), and Profile."),
        ("Offline State Cache", "Renders cached attendance history if connectivity drops."),
        ("Auto-Reconnection", "Automatic synchronization when network connectivity restores.")
    ], border_color=hex_to_rgb("EC4899"))

    # ==========================================
    # SLIDE 21: Mobile App: Daily Attendance Dashboard
    # ==========================================
    s21, th21 = add_coloured_slide("Mobile App: Daily Attendance Dashboard & Telemetry", "Mobile UX", 21)
    add_card(s21, th21, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Live Shift Telemetry Cards", [
        ("Live Digital Clock", "Real-time clock displaying current IST hours, minutes, and seconds."),
        ("Today's Shift Status", "Color-coded badge: 'NOT CHECKED IN' (Gray), 'PRESENT' (Green), 'LATE' (Amber), 'CHECKED OUT' (Blue)."),
        ("Check-In Time Record", "Displays exact timestamp of morning check-in (e.g. 09:14 AM)."),
        ("Live Elapsed Timer", "Dynamically updates elapsed shift duration (e.g. '04h 32m on duty')."),
        ("WFH Quota Bar", "Shows organizational remote capacity: '3/5 Approved Today'.")
    ], border_color=th21["accent"])

    add_card(s21, th21, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Primary Action Buttons", [
        ("Scan Office QR to Check In", "High-contrast action button activating camera scanner."),
        ("Scan Screen QR to Check Out", "Departing action recording official checkout timestamp."),
        ("Apply for Work From Home", "Quick link opening the WFH application dialog."),
        ("Request Time-Off / Leave", "Direct access to casual, sick, and earned leave forms.")
    ], border_color=th21["secondary"])

    # ==========================================
    # SLIDE 22: Mobile App: Camera Dynamic QR Scanner
    # ==========================================
    s22, th22 = add_coloured_slide("Mobile App: Camera Dynamic QR Scanner Module", "Mobile Scanner", 22)
    add_card(s22, th22, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "In-App Camera Experience", [
        ("Full-Screen Viewfinder", "Hardware-accelerated camera feed with blurred backdrop framing."),
        ("Scanning Reticle", "High-visibility cyan corner brackets framing the QR code target."),
        ("Sub-Second Detection", "Scans and decodes 256-bit payload in under 200 milliseconds."),
        ("Haptic Feedback", "Vibration pulse and sound confirmation upon successful decode."),
        ("Torch / Flashlight Toggle", "Manual toggle button for dimly lit reception or evening check-outs.")
    ], border_color=th22["secondary"])

    add_card(s22, th22, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Validation & Payload Dispatch", [
        ("Instant Payload Parsing", "Extracts token ID and verifies structure before network call."),
        ("API Ingestion", "Submits payload to `/api/attendance/check-in` with Authorization Bearer header."),
        ("Graceful Error Modals", "If token expired: 'QR expired, please scan the updated screen QR'."),
        ("Anti-Spam Debounce", "Camera disengages immediately after scan to prevent multi-submissions.")
    ], border_color=th22["accent"])

    # ==========================================
    # SLIDE 23: Mobile App: Attendance Check-In Flow
    # ==========================================
    s23, th23 = add_coloured_slide("Mobile App: Check-In Flow & Policy Classification", "Punctuality Engine", 23)
    add_stat_box(s23, th23, Inches(0.8), Inches(1.6), Inches(5.7), Inches(1.3), "PRESENT", "Check-in time <= 09:30:00 AM IST", hex_to_rgb("10B981"))
    add_stat_box(s23, th23, Inches(6.8), Inches(1.6), Inches(5.7), Inches(1.3), "LATE", "Check-in time > 09:30:00 AM IST", hex_to_rgb("F59E0B"))

    add_card(s23, th23, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Punctual Check-In Lifecycle", [
        ("Employee Scans at 09:12 AM", "Camera decodes active reception QR token."),
        ("Backend Policy Verification", "Time is verified prior to 09:30 AM cutoff threshold."),
        ("Database Update", "Attendance document created with status 'PRESENT'."),
        ("UI Feedback", "Vibrant green celebration banner: 'Welcome Aarav! Checked in at 09:12 AM'.")
    ], border_color=hex_to_rgb("10B981"))

    add_card(s23, th23, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Late Check-In Lifecycle", [
        ("Employee Scans at 09:41 AM", "Camera decodes active reception QR token."),
        ("Backend Policy Verification", "Time exceeds 09:30 AM boundary; late penalty applied."),
        ("Database Update", "Attendance record logged with status 'LATE' and lateMinutes: 11."),
        ("UI Feedback", "Amber notification: 'Checked in at 09:41 AM (Marked Late: 11 mins past cutoff)'.")
    ], border_color=hex_to_rgb("F59E0B"))

    # ==========================================
    # SLIDE 24: Mobile App: Attendance Check-Out Flow
    # ==========================================
    s24, th24 = add_coloured_slide("Mobile App: Check-Out Flow & Working Hours Calculation", "Shift Completion", 24)
    add_card(s24, th24, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Check-Out Verification Steps", [
        ("1. Evening Verification", "Employee taps 'Scan Screen QR to Check Out' at office close."),
        ("2. Token Validation", "Validates that evening QR token is legitimate and active."),
        ("3. Pre-existing Check-In Guard", "Verifies employee already has an active check-in record for today."),
        ("4. Timestamp Ingestion", "Sets checkOut to current IST time (e.g. 18:05 PM)."),
        ("5. State Lock", "Marks daily record as concluded; prevents duplicate check-outs.")
    ], border_color=th24["accent"])

    add_card(s24, th24, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Working Hours Mathematical Engine", [
        ("Delta Computation", "Formula: `durationMs = checkOutTime - checkInTime`."),
        ("Hour & Minute Normalization", "Converts raw duration into standard corporate format (e.g. '08h 51m')."),
        ("Minimum Shift Compliance", "If duration < 4 hours: flags as 'HALF_DAY'; if >= 8 hours: 'FULL_DAY'."),
        ("Overtime Telemetry", "Records any excess minutes past 18:00 PM for HR overtime metrics.")
    ], border_color=th24["secondary"])

    # ==========================================
    # SLIDE 25: Mobile App: Work-From-Home (WFH) Portal
    # ==========================================
    s25, th25 = add_coloured_slide("Mobile App: WFH Application Portal & Quota Counter", "Remote Work", 25)
    add_card(s25, th25, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "WFH Application Parameters", [
        ("Target Date Selection", "Interactive date picker restricting selection to upcoming working days."),
        ("WFH Category", "Enum: 'STANDARD' (routine remote work) or 'URGENT' (family/medical emergency)."),
        ("Detailed Justification", "Mandatory text description of deliverables and remote availability."),
        ("Document Proof Upload", "Optional attachment upload for doctor's certificates or travel tickets."),
        ("Real-Time Capacity Check", "Live counter displaying: '3 of 5 WFH Slots Booked for This Date'.")
    ], border_color=th25["accent"])

    add_card(s25, th25, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Quota Guard & Status Tracking", [
        ("Automated 5-Slot Guard", "If 5 employees are already approved, submission blocks with clear notice."),
        ("Real-Time Status Badge", "Tracks status in real-time: 'Pending HR Review' -> 'Pending Admin Approval' -> 'Approved'."),
        ("Remote Attendance Unlock", "On final approval, mobile app renders remote 1-tap check-in button for that date."),
        ("Cancellation Support", "Employee can withdraw request before managerial review starts.")
    ], border_color=th25["secondary"])

    # ==========================================
    # SLIDE 26: Mobile App: Leave Management Module
    # ==========================================
    s26, th26 = add_coloured_slide("Mobile App: Comprehensive Leave Management", "Leave Engine", 26)
    headers_s26 = ["Leave Category", "Annual Entitlement", "Carryover Policy", "Typical Usage"]
    rows_s26 = [
        ["Casual Leave (CL)", "12 Days / Year", "Expires Annually", "Personal errands, short unannounced breaks"],
        ["Sick Leave (SL)", "10 Days / Year", "Medical Certificate Required > 2 Days", "Illness, medical consultations, recovery"],
        ["Earned Leave (EL)", "15 Days / Year", "Up to 30 Days Carryover", "Planned vacations, family weddings, sabbatical"]
    ]
    add_coloured_table(s26, th26, Inches(0.8), Inches(1.7), Inches(11.733), Inches(2.2), headers_s26, rows_s26)

    add_card(s26, th26, Inches(0.8), Inches(4.2), Inches(5.7), Inches(2.6), "Leave Balance Dashboard", [
        ("Live Balance Counters", "Displays remaining CL, SL, and EL balances in real time."),
        ("Pending Deduction Lock", "Temporarily locks requested days while review is underway.")
    ], border_color=th26["accent"])

    add_card(s26, th26, Inches(6.8), Inches(4.2), Inches(5.7), Inches(2.6), "Managerial Notification", [
        ("HR Alert Dispatch", "Immediately dispatches alert to HR console upon submission."),
        ("Decision Push Alert", "Alerts employee instantly when leave is approved or rejected.")
    ], border_color=th26["secondary"])

    # ==========================================
    # SLIDE 27: Mobile App: Attendance Calendar & History
    # ==========================================
    s27, th27 = add_coloured_slide("Mobile App: Attendance Calendar & Historical Records", "Attendance History", 27)
    add_card(s27, th27, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Monthly Calendar Visualizer", [
        ("Interactive Grid View", "Full monthly calendar with color-coded day markers:"),
        ("  • Green Dot", "Punctual office presence (Checked in <= 09:30 AM)."),
        ("  • Amber Dot", "Late arrival (Checked in > 09:30 AM)."),
        ("  • Blue Dot", "Approved remote work from home (WFH)."),
        ("  • Purple Dot", "Approved paid leave (CL/SL/EL)."),
        ("  • Red Dot", "Unexcused absence or missing check-in.")
    ], border_color=th27["accent"])

    add_card(s27, th27, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Historical Punch Inspector", [
        ("Day Detail Drawer", "Tapping any day opens complete punch telemetry:"),
        ("  • Check-In Time", "Exact time recorded (e.g. 09:18 AM IST)."),
        ("  • Check-Out Time", "Exact time recorded (e.g. 18:10 PM IST)."),
        ("  • Total Duration", "Accumulated shift time (e.g. 08h 52m)."),
        ("  • Ingestion Method", "'Dynamic QR Scan' or 'Managerial Correction'."),
        ("Audit Transparency", "If corrected by HR, shows manager justification note.")
    ], border_color=th27["secondary"])

    # ==========================================
    # SLIDE 28: Mobile App: Avatar & Profile Photo Upload
    # ==========================================
    s28, th28 = add_coloured_slide("Mobile App: Profile Avatar Upload & Storage Pipeline", "Profile Management", 28)
    add_card(s28, th28, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Mobile Image Capture Pipeline", [
        ("Camera & Gallery Pickers", "Employee taps avatar circle; chooses instant Camera snap or Photo Library."),
        ("Client-Side Optimization", "Image resized and compressed on-device to reduce payload size to < 500 KB."),
        ("Multipart Upload", "Dispatched to backend via `POST /api/employees/avatar` with JWT auth."),
        ("Instant App Sync", "Avatar updates immediately across dashboard, sidebar, and profile.")
    ], border_color=th28["secondary"])

    add_card(s28, th28, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Backend Storage & Admin Visibility", [
        ("Safe File System Ingestion", "Stored on server disk under `backend/uploads/avatars/` with unique hash names."),
        ("Directory Cross-Sync", "Avatar URL automatically written to both User and Employee MongoDB documents."),
        ("Immediate Admin Presence", "Photo is instantly visible on Admin Web across directory tables, attendance sheets, and approval cards."),
        ("Security Scrubbing", "File MIME type verified to prevent executable upload exploits.")
    ], border_color=th28["accent"])

    # ==========================================
    # SLIDE 29: Admin Web Console (Oceanic Teal & Sky Theme)
    # ==========================================
    s29, th29 = add_coloured_slide("Admin Web Console: Architecture & Layout Engine", "Web Console", 29)
    add_card(s29, th29, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Core Framework", [
        ("React 18 + Vite", "High-performance SPA with lightning-fast Hot Module Replacement and production bundling."),
        ("Tailwind CSS", "Utility-first design system ensuring crisp typography and responsive layouts."),
        ("Lucide React Icons", "Extensive modern icon library for clear navigational affordance.")
    ], border_color=th29["accent"])

    add_card(s29, th29, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Navigation Architecture", [
        ("Collapsible Sidebar", "Intuitive menu: Dashboard, Attendance Sheet, Directory, Approvals, Policies, HR Admins, Audit."),
        ("Role-Guarded Routes", "`ProtectedRoute` wrapper blocking unauthorized roles at the routing layer."),
        ("User Header Bar", "Active profile badge, role indicator pill, and single-click logout.")
    ], border_color=th29["secondary"])

    add_card(s29, th29, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "State & Telemetry", [
        ("Recharts Telemetry", "Interactive SVG charts for daily attendance trends and department breakdowns."),
        ("Axios Interceptors", "Automatically attaches JWT Bearer tokens and handles token expiration (401)."),
        ("Live Toast System", "Instant notifications for approvals, rejections, and policy updates.")
    ], border_color=hex_to_rgb("FF6B6B"))

    # ==========================================
    # SLIDE 30: Admin Web: Executive Operations Dashboard
    # ==========================================
    s30, th30 = add_coloured_slide("Admin Web: Executive Dashboard & Live Telemetry", "Executive Analytics", 30)
    add_stat_box(s30, th30, Inches(0.8), Inches(1.6), Inches(2.7), Inches(1.2), "42", "Total Headcount", hex_to_rgb("2DD4BF"))
    add_stat_box(s30, th30, Inches(3.8), Inches(1.6), Inches(2.7), Inches(1.2), "36", "Present On-Site", hex_to_rgb("10B981"))
    add_stat_box(s30, th30, Inches(6.8), Inches(1.6), Inches(2.7), Inches(1.2), "4", "Late Arrivals", hex_to_rgb("F59E0B"))
    add_stat_box(s30, th30, Inches(9.8), Inches(1.6), Inches(2.7), Inches(1.2), "2", "Approved WFH", hex_to_rgb("A855F7"))

    add_card(s30, th30, Inches(0.8), Inches(3.0), Inches(5.7), Inches(3.8), "Live Workforce Telemetry Cards", [
        ("Real-Time Presence Tracker", "Live counts of present, late, WFH, on-leave, and absent personnel."),
        ("Punctuality Index", "Automated percentage score measuring organization-wide arrival punctuality."),
        ("WFH Quota Usage", "Visual gauge tracking current day WFH consumption against the 5-employee cap.")
    ], border_color=th30["accent"])

    add_card(s30, th30, Inches(6.8), Inches(3.0), Inches(5.7), Inches(3.8), "Interactive Analytical Charts", [
        ("Weekly Attendance Trends", "Recharts area chart tracking daily attendance patterns over past 30 days."),
        ("Departmental Heatmap", "Bar chart breaking down attendance performance by Engineering, Product, HR, and Sales."),
        ("Recent Activity Feed", "Real-time stream of employee check-ins with avatar photos and timestamps.")
    ], border_color=th30["secondary"])

    # ==========================================
    # SLIDE 31: Admin Web: Real-Time Attendance Sheet
    # ==========================================
    s31, th31 = add_coloured_slide("Admin Web: Real-Time Departmental Attendance Sheet", "Attendance Sheet", 31)
    headers_s31 = ["Employee", "Dept", "Check-In", "Check-Out", "Status", "Mode", "Action"]
    rows_s31 = [
        ["Aarav Sharma", "Engineering", "09:12 AM", "--:--", "PRESENT", "OFFICE", "Edit / Audit"],
        ["Priya Patel", "Product", "09:41 AM", "--:--", "LATE", "OFFICE", "Edit / Audit"],
        ["Kavita Reddy", "HR", "09:05 AM", "18:02 PM", "PRESENT", "WFH", "Edit / Audit"],
        ["Rohan Verma", "Engineering", "--:--", "--:--", "ABSENT", "N/A", "Manual Punch"]
    ]
    add_coloured_table(s31, th31, Inches(0.8), Inches(1.7), Inches(11.733), Inches(2.7), headers_s31, rows_s31)

    add_card(s31, th31, Inches(0.8), Inches(4.7), Inches(5.7), Inches(2.1), "Multi-Criteria Filtering & Search", [
        ("Live Name/ID Search", "Instant search filtering by employee name or ID."),
        ("Department Dropdown", "Filter by Engineering, Product, HR, Finance, etc."),
        ("Status Toggles", "Filter by Present, Late, Half-Day, Absent, or WFH.")
    ], border_color=th31["accent"])

    add_card(s31, th31, Inches(6.8), Inches(4.7), Inches(5.7), Inches(2.1), "Export & Reporting Capabilities", [
        ("One-Click CSV / Excel Export", "Downloads full attendance sheet for payroll processing."),
        ("Audit Badge Indicator", "Displays icon on any record modified manually.")
    ], border_color=th31["secondary"])

    # ==========================================
    # SLIDE 32: Admin Web: Employee Directory Management
    # ==========================================
    s32, th32 = add_coloured_slide("Admin Web: Employee Directory & Lifecycle Management", "Workforce Directory", 32)
    add_card(s32, th32, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Complete Employee Lifecycle Controls", [
        ("Add New Employee", "Modal form collecting Name, Email, Department, Designation, Phone, and Shift."),
        ("Automated Account Provisioning", "Creates both User login credentials and Employee corporate profile."),
        ("Edit Employee Metadata", "Update phone numbers, shift timings, or departmental promotions in real time."),
        ("Deactivate / Reactivate", "Soft-deactivation toggle revoking mobile app login access while preserving historical punch records.")
    ], border_color=th32["accent"])

    add_card(s32, th32, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Enterprise Directory Security", [
        ("Unique ID Constraints", "Prevents duplicate Employee IDs or email addresses at database index level."),
        ("Avatar Synchronization", "Displays uploaded employee photos directly in the directory grid."),
        ("Role Boundaries", "HR Admins can manage employees; only Super Admins can manage HR Admins.")
    ], border_color=th32["secondary"])

    # ==========================================
    # SLIDE 33: Admin Web: Multi-Stage WFH Approvals (Stage 1)
    # ==========================================
    s33, th33 = add_coloured_slide("Multi-Stage WFH Approvals — Stage 1: HR Review", "WFH Workflow", 33)
    add_card(s33, th33, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "HR Admin Review Responsibilities", [
        ("Incoming Request Queue", "HR navigates to `/approvals` to review all pending employee WFH applications."),
        ("Reason & Document Assessment", "HR verifies justification (medical, personal) and checks attached documents."),
        ("Capacity Check", "HR monitors current approved quota for the requested date."),
        ("Decision Action", "HR clicks 'Approve Request' or 'Reject with Remarks'."),
        ("State Transition", "On approval, status shifts from `PENDING` to `HR_APPROVED`.")
    ], border_color=th33["accent"])

    add_card(s33, th33, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Integrity & Escalation Controls", [
        ("Audit Metadata", "Records `hrApprovedBy: req.user._id` and `hrDecisionDate: new Date()`."),
        ("No Premature Attendance", "Request remains inactive for attendance until Super Admin confirms."),
        ("Rejection Finality", "If HR rejects, request reaches final `REJECTED` state; employee notified immediately.")
    ], border_color=hex_to_rgb("F59E0B"))

    # ==========================================
    # SLIDE 34: Admin Web: Super Admin Final WFH Confirmation (Stage 2)
    # ==========================================
    s34, th34 = add_coloured_slide("Multi-Stage WFH Approvals — Stage 2: Super Admin Sign-Off", "Final Approval", 34)
    add_stat_box(s34, th34, Inches(0.8), Inches(1.6), Inches(5.7), Inches(1.3), "5 Max WFH / Day", "Strict Capacity Enforcement", hex_to_rgb("A855F7"))
    add_stat_box(s34, th34, Inches(6.8), Inches(1.6), Inches(5.7), Inches(1.3), "Dual Approval", "HR Endorsement Required", hex_to_rgb("10B981"))

    add_card(s34, th34, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Super Admin Final Ratification", [
        ("Prerequisite Enforcement", "Super Admin only sees requests that have successfully passed HR Review (`HR_APPROVED`)."),
        ("Independent Check", "Ensures organization-wide balance between physical and remote presence."),
        ("Final Action", "Super Admin grants final approval; status shifts to `APPROVED`.")
    ], border_color=hex_to_rgb("10B981"))

    add_card(s34, th34, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "System State Consequences", [
        ("Mobile Unlock", "Employee's mobile app enables remote 1-tap check-in for approved dates."),
        ("Daily Quota Consumption", "Approved slot permanently deducted from day's availability."),
        ("Attendance Sheet Marker", "Employee automatically marked with 'WFH' badge on the daily attendance sheet.")
    ], border_color=th34["secondary"])

    # ==========================================
    # SLIDE 35: Admin Web: Leave Management Console
    # ==========================================
    s35, th35 = add_coloured_slide("Admin Web: Leave Management & Team Balances", "Leave Operations", 35)
    add_card(s35, th35, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Administrative Leave Controls", [
        ("Centralized Leave Queue", "Displays all submitted Casual, Sick, and Earned leave requests across departments."),
        ("Team Calendar Overlap View", "Identifies concurrent leave requests within the same department to prevent coverage gaps."),
        ("Medical Certificate Inspector", "Direct preview of uploaded doctor notes or certificates."),
        ("Instant Approval / Rejection", "One-click approval updates employee leave balance automatically.")
    ], border_color=th35["accent"])

    add_card(s35, th35, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Compliance & Payroll Integration", [
        ("Automated Balance Ledger", "Maintains real-time history of taken, pending, and remaining leaves."),
        ("Loss of Pay (LOP) Flagging", "Alerts managers if an employee applies for leave beyond available balances."),
        ("Audit History", "Logs identity of approving manager and decision timestamp.")
    ], border_color=th35["secondary"])

    # ==========================================
    # SLIDE 36: Admin Web: HR Admin Provisioning (Super Admin Exclusive)
    # ==========================================
    s36, th36 = add_coloured_slide("HR Admin Provisioning & Role Guard Security", "Super Admin Exclusive", 36)
    add_card(s36, th36, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Super Admin Privilege Isolation", [
        ("Exclusive Route Guard", "Route `/hr-admins` is strictly protected by `allowRoles('SUPER_ADMIN')` on backend and `ProtectedRoute` on frontend."),
        ("Unauthorized Access Rejection", "Any call by an HR Admin or Employee throws immediate HTTP 403 Forbidden."),
        ("Provisioning Modal", "Super Admin can onboard new HR Admins with email, password, and contact info."),
        ("One-Click Deactivation", "Super Admin can revoke HR Admin credentials instantly if roles change.")
    ], border_color=hex_to_rgb("EF4444"))

    add_card(s36, th36, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Environment Variable Authority", [
        ("Primary Super Admin Root", "Super Admin authentication strictly verifies against `.env` configuration (`ADMIN_ID`, `ADMIN_PASS`)."),
        ("Immutable Root Credentials", "Cannot be modified or compromised via web UI, guaranteeing master recovery."),
        ("Forensic Traceability", "Every HR account created or deactivated is logged in the immutable Audit collection.")
    ], border_color=th36["accent"])

    # ==========================================
    # SLIDE 37: Admin Web: Forensic Attendance Corrections
    # ==========================================
    s37, th37 = add_coloured_slide("Forensic Attendance Corrections & Audit Justifications", "Forensic Integrity", 37)
    add_card(s37, th37, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Mandatory Justification Protocol", [
        ("Manual Correction Modal", "Initiated when an employee forgets to scan or faces mobile hardware issues."),
        ("Status Adjustment", "Manager can update status from 'ABSENT' to 'PRESENT', 'LATE', or 'HALF_DAY'."),
        ("Time Override", "Optional manual entry of check-in and check-out timestamps."),
        ("Mandatory Reason Field", "Submission button is strictly disabled until manager enters a detailed justification note (min 10 characters).")
    ], border_color=hex_to_rgb("F59E0B"))

    add_card(s37, th37, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Permanent Audit Inscription", [
        ("Embedded Snapshot", "Pushes record into attendance document's `auditHistory` array: `{ modifiedBy, previousStatus, newStatus, reason, timestamp }`."),
        ("Global Audit Collection", "Simultaneously writes entry to system `AuditLog` collection."),
        ("Tamper-Proof Visual Flag", "A warning shield icon appears beside the record in attendance sheets, viewable by auditors.")
    ], border_color=th37["accent"])

    # ==========================================
    # SLIDE 38: Admin Web: Attendance Policy Configuration
    # ==========================================
    s38, th38 = add_coloured_slide("Admin Web: Global Policy Configuration Engine", "System Policies", 38)
    headers_s38 = ["Policy Parameter", "Default Value", "Configurable Range", "Operational Impact"]
    rows_s38 = [
        ["Office Start Time", "09:00 AM IST", "07:00 - 11:00 AM", "Defines expected arrival and shift start"],
        ["Check-In Cutoff Time", "09:30 AM IST", "Start Time + 15 to 60m", "Boundary after which punches are marked LATE"],
        ["Office End Time", "18:00 PM IST", "16:00 - 21:00 PM", "Standard departure time for minimum hours calculation"],
        ["Max WFH Employees / Day", "5 Employees", "1 to 50 / Unlimited", "Enforces in-office collaboration and presence"],
        ["Dynamic QR Expiry", "18 Seconds", "10 to 60 Seconds", "Balances scanning ergonomics with anti-replay defense"]
    ]
    add_coloured_table(s38, th38, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s38, rows_s38)

    # ==========================================
    # SLIDE 39: Admin Web: Notifications & Broadcast Center
    # ==========================================
    s39, th39 = add_coloured_slide("Admin Web: Organization Broadcasts & Alerts", "Communications", 39)
    add_card(s39, th39, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Organization-Wide Broadcasts", [
        ("Company Announcements", "Publish office notices (e.g. holiday declarations, policy updates, town halls)."),
        ("Target Audience Targeting", "Broadcast to All Staff, Specific Departments (Engineering, Sales), or Managers."),
        ("Priority Flags", "Mark announcements as 'STANDARD', 'IMPORTANT', or 'CRITICAL' with color banners."),
        ("Instant Mobile Delivery", "Displays immediately in the employee mobile app alert inbox.")
    ], border_color=th39["accent"])

    add_card(s39, th39, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Automated Workflow Notifications", [
        ("Approval Alerts", "Sends push alert when WFH or leave request is approved or rejected."),
        ("Late Arrival Warning", "Automated alert notifying employee when check-in crosses 09:30 AM cutoff."),
        ("Read Receipt Tracking", "Monitors which employees have read critical organization announcements.")
    ], border_color=th39["secondary"])

    # ==========================================
    # SLIDE 40: REST API Architecture & Endpoints Catalog (Coral & Rose Theme)
    # ==========================================
    s40, th40 = add_coloured_slide("REST API Architecture & Endpoints Catalog", "API Architecture", 40)
    headers_s40 = ["HTTP Method & Endpoint", "Access Role", "Primary Parameters", "Return Payload"]
    rows_s40 = [
        ["POST /api/auth/login", "Public", "{ email, password }", "{ token: JWT, user }"],
        ["POST /api/auth/verify-demo-otp", "Public", "{ employeeId, otp: '8426' }", "{ token: JWT, employee }"],
        ["GET /api/qr/session", "Public / Kiosk", "{ officeLocation }", "{ token, expiresAt, expirySeconds: 18 }"],
        ["POST /api/attendance/check-in", "Employee", "Header: JWT, Body: { token }", "{ status: 'PRESENT'/'LATE', checkIn }"],
        ["POST /api/attendance/check-out", "Employee", "Header: JWT, Body: { token }", "{ status, checkOut, workingHours }"],
        ["POST /api/attendance/correct", "Admin / HR", "{ attendanceId, newStatus, reason }", "{ success: true, auditHistory }"],
        ["POST /api/wfh/approve-admin", "Super Admin", "{ requestId, remarks }", "{ status: 'APPROVED' }"]
    ]
    add_coloured_table(s40, th40, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s40, rows_s40)

    # ==========================================
    # SLIDE 41: Verification & Automated Testing Matrix
    # ==========================================
    s41, th41 = add_coloured_slide("Verification & Automated Testing Matrix: 100% Pass", "Quality Assurance", 41)
    headers_s41 = ["Suite #", "Validation Scope", "Test Parameters", "Verification Outcome"]
    rows_s41 = [
        ["Test 1", "Database Health & Connection Pool", "MongoDB replica connection & read/write", "PASSED (0ms delay)"],
        ["Test 2", "Asia/Kolkata Timezone Engine", "24-hour IST time calculation", "PASSED (Valid format)"],
        ["Test 3", "Policy Cutoff Evaluator", "09:30:00 AM IST PRESENT vs LATE boundary", "PASSED (Accurate)"],
        ["Test 4", "QR 18s Expiry & Anti-Replay", "Expired token rejected with HTTP 400", "PASSED (Tamper-proof)"],
        ["Test 5", "Compound Index Duplicate Prevention", "Duplicate check-in rejected with HTTP 409", "PASSED (Zero duplicates)"],
        ["Test 7", "WFH 5-Employee Quota Enforcement", "6th concurrent request blocked", "PASSED (Enforced)"],
        ["Test 12", "RBAC Super Admin HR Provisioning", "HR Admin forbidden from adding HR (403)", "PASSED (Role secured)"]
    ]
    add_coloured_table(s41, th41, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s41, rows_s41)

    # ==========================================
    # SLIDE 42: Forensic Audit Trail & Regulatory Compliance
    # ==========================================
    s42, th42 = add_coloured_slide("Forensic Audit Trail & Regulatory Compliance", "Forensic Integrity", 42)
    add_card(s42, th42, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Audit Trail Architecture", [
        ("Append-Only Collection", "MongoDB `AuditLog` collection operates under strict append-only constraints; no updates or deletes permitted."),
        ("Actor Identification", "Every entry links actor ID, email, assigned role, and client IP address."),
        ("State Differential Logging", "Captures exact before-and-after JSON snapshots for all entity modifications."),
        ("Tamper-Proof Timestamps", "Server NTP timestamp assigned at insertion time.")
    ], border_color=th42["accent"])

    add_card(s42, th42, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Statutory & Labor Compliance", [
        ("Indian Labor Law Alignment", "Accurate records of work hours, overtime, and leave entitlements compliant with Indian Factories & Shops Acts."),
        ("Payroll Audit Readiness", "Provides forensic verification for accounting teams during wage disbursement."),
        ("Security Audit Export", "Exportable audit logs for ISO 27001 and SOC 2 enterprise compliance assessments.")
    ], border_color=th42["secondary"])

    # ==========================================
    # SLIDE 43: DevOps, Deployment & Environment Security
    # ==========================================
    s43, th43 = add_coloured_slide("DevOps, Deployment & Infrastructure Security", "DevOps & Cloud", 43)
    add_card(s43, th43, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Production Builds", [
        ("Admin Web Build", "Vite production minification producing optimized 66 kB CSS and 806 kB JS bundle with zero errors."),
        ("Mobile Export", "Expo 58 Metro bundler packaging 399 modules with full iOS & Android readiness."),
        ("Zero Comment Policy", "Strict code cleanliness standard enforced across all backend and frontend files.")
    ], border_color=hex_to_rgb("00F0FF"))

    add_card(s43, th43, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Environment Isolation", [
        ("Strict .env Separation", "Sensitive credentials (ADMIN_ID, ADMIN_PASS, JWT_SECRET, MONGO_URI) strictly managed in `.env`."),
        ("Never Committed", "Environment configuration protected by `.gitignore`."),
        ("CORS Security", "Allowed origins restricted to verified corporate domains.")
    ], border_color=th43["accent"])

    add_card(s43, th43, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Containerization Ready", [
        ("Docker Ready", "Lightweight multi-stage Dockerfiles for Node backend and Nginx static web serving."),
        ("Healthcheck Endpoints", "Built-in `/api/health` monitoring connection pool and memory usage."),
        ("Cloud Agnostic", "Runs on AWS ECS, GCP Cloud Run, Azure App Service, or on-premise hardware.")
    ], border_color=th43["secondary"])

    # ==========================================
    # SLIDE 44: Future Roadmap & Enterprise Horizon
    # ==========================================
    s44, th44 = add_coloured_slide("Future Roadmap: Advanced Enterprise Innovations", "Product Roadmap", 44)
    add_card(s44, th44, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Phase 1: Biometrics & Geofence", [
        ("GPS Geofence Validation", "Enforce physical GPS bounding box (< 50 meters from office entrance) during QR scan."),
        ("On-Device Face ID", "Biometric verification on mobile scanner matching live facial features with employee profile photo.")
    ], border_color=hex_to_rgb("00F0FF"))

    add_card(s44, th44, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Phase 2: AI & Analytics", [
        ("Predictive Attrition & Absenteeism", "Machine learning models detecting burnout patterns and chronic Monday/Friday absences."),
        ("Smart Shift Scheduling", "Automated roster allocation based on project demands and employee preferences.")
    ], border_color=th44["accent"])

    add_card(s44, th44, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Phase 3: ERP Integration", [
        ("Automated Payroll Sync", "Direct webhooks to SAP, Workday, QuickBooks, and RazorpayX Payroll for seamless salary calculation."),
        ("Slack & MS Teams Bots", "1-tap leave and WFH approvals directly inside enterprise team chat channels.")
    ], border_color=th44["secondary"])

    # ==========================================
    # SLIDE 45: Conclusion & Executive Deliverables Summary
    # ==========================================
    s45, th45 = add_coloured_slide("Conclusion & Enterprise Deliverables Summary", "Executive Sign-Off", 45)
    add_stat_box(s45, th45, Inches(0.8), Inches(1.6), Inches(3.7), Inches(1.3), "45 Slides", "Exhaustive Specification", th45["accent"])
    add_stat_box(s45, th45, Inches(4.8), Inches(1.6), Inches(3.7), Inches(1.3), "14 Suites", "100% Tests Passed", hex_to_rgb("10B981"))
    add_stat_box(s45, th45, Inches(8.8), Inches(1.6), Inches(3.7), Inches(1.3), "3 Clients", "Web, Mobile & Kiosk", th45["secondary"])

    add_card(s45, th45, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Key Deliverables Recap", [
        ("1. Full-Stack Codebase", "Production-verified Admin Web, Employee Mobile App, Kiosk Screen, and Express API."),
        ("2. Cryptographic Security", "Zero buddy-punching guaranteed by 18s rotating QR sessions and compound indexes."),
        ("3. Hybrid Governance", "Streamlined two-tier WFH approvals enforcing a 5/day daily quota."),
        ("4. Immutable Traceability", "Forensic audit logging for all managerial adjustments.")
    ], border_color=hex_to_rgb("10B981"))

    add_card(s45, th45, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Enterprise Sign-Off & Contacts", [
        ("Organization", "VorldX Industries Private Limited (CIN: U62099UP2026PTC245598)"),
        ("Headquarters", "Lucknow, Uttar Pradesh, India"),
        ("Engineering Review", "Completed & Production Verified"),
        ("Official Contact", "hello@vorldx.com  •  contact@vorldx.com"),
        ("Document Status", "Final Approved Architectural Deliverable (PDF & PPTX)")
    ], border_color=th45["accent"])

    prs.save(output_pptx)
    print(f"Successfully generated {output_pptx} with 45 vibrant multi-coloured slides!")

if __name__ == "__main__":
    create_coloured_deck()
