import os
import sys
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_pptx="VorldX_Enterprise_Attendance_System_45_Pages.pptx"):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    BG_DARK = RGBColor(10, 15, 29)         # #0A0F1D
    CARD_BG = RGBColor(21, 30, 50)         # #151E32
    CARD_BORDER = RGBColor(37, 99, 235)    # #2563EB
    TEXT_WHITE = RGBColor(255, 255, 255)   # #FFFFFF
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8
    TEXT_BODY = RGBColor(203, 213, 225)    # #CBD5E1
    CYAN_ACCENT = RGBColor(0, 229, 255)    # #00E5FF
    BLUE_ACCENT = RGBColor(59, 130, 246)   # #3B82F6
    GREEN_ACCENT = RGBColor(16, 185, 129)  # #10B981
    AMBER_ACCENT = RGBColor(245, 158, 11)  # #F59E0B
    PURPLE_ACCENT = RGBColor(139, 92, 246) # #8B5CF6
    RED_ACCENT = RGBColor(239, 68, 68)     # #EF4444

    def add_base_slide(title, category, slide_num, total=45):
        slide = prs.slides.add_slide(blank_layout)
        
        # Background shape
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()

        # Top Category Pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.35), Inches(3.2), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = RGBColor(24, 38, 70)
        pill.line.color.rgb = BLUE_ACCENT
        pill.line.width = Pt(1)
        tf_pill = pill.text_frame
        tf_pill.word_wrap = True
        p_pill = tf_pill.paragraphs[0]
        p_pill.text = category.upper()
        p_pill.font.size = Pt(9.5)
        p_pill.font.bold = True
        p_pill.font.color.rgb = CYAN_ACCENT
        p_pill.alignment = PP_ALIGN.CENTER

        # Slide Number Badge (Right)
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.2), Inches(0.35), Inches(1.333), Inches(0.32))
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(24, 38, 70)
        badge.line.color.rgb = RGBColor(71, 85, 105)
        badge.line.width = Pt(1)
        tf_b = badge.text_frame
        p_b = tf_b.paragraphs[0]
        p_b.text = f"{slide_num:02d} / {total}"
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = TEXT_MUTED
        p_b.alignment = PP_ALIGN.CENTER

        # Title Text
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.733), Inches(0.65))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE

        # Accent Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.42), Inches(11.733), Inches(0.03))
        line.fill.solid()
        line.fill.fore_color.rgb = CYAN_ACCENT
        line.line.fill.background()

        # Footer
        ft = slide.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(11.733), Inches(0.3))
        tf_ft = ft.text_frame
        p_ft = tf_ft.paragraphs[0]
        p_ft.text = "VorldX Industries Private Limited  •  Confidential & Proprietary  •  Enterprise Attendance & Workforce Telemetry"
        p_ft.font.size = Pt(8.5)
        p_ft.font.color.rgb = RGBColor(100, 116, 139)

        return slide

    def add_card(slide, left, top, width, height, title, items, accent=BLUE_ACCENT, bg_col=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_col
        card.line.color.rgb = accent
        card.line.width = Pt(1.2)

        # Header bar inside card
        header_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.45))
        header_bar.fill.solid()
        header_bar.fill.fore_color.rgb = RGBColor(28, 42, 75)
        header_bar.line.fill.background()
        tf_hb = header_bar.text_frame
        p_hb = tf_hb.paragraphs[0]
        p_hb.text = title.upper()
        p_hb.font.size = Pt(11)
        p_hb.font.bold = True
        p_hb.font.color.rgb = accent
        p_hb.alignment = PP_ALIGN.CENTER

        # Content Box
        tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.5), width - Inches(0.3), height - Inches(0.55))
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
                run1.font.color.rgb = TEXT_WHITE

                run2 = p.add_run()
                run2.text = b
                run2.font.size = Pt(10)
                run2.font.color.rgb = TEXT_BODY
            else:
                p.text = f"• {item}"
                p.font.size = Pt(10)
                p.font.color.rgb = TEXT_BODY

    def add_stat_box(slide, left, top, width, height, value, label, accent=CYAN_ACCENT):
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(18, 28, 52)
        box.line.color.rgb = accent
        box.line.width = Pt(1.5)

        tb = slide.shapes.add_textbox(left, top + Inches(0.08), width, height - Inches(0.16))
        tf = tb.text_frame
        p1 = tf.paragraphs[0]
        p1.text = value
        p1.font.size = Pt(24)
        p1.font.bold = True
        p1.font.color.rgb = accent
        p1.alignment = PP_ALIGN.CENTER

        p2 = tf.add_paragraph()
        p2.text = label
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.bold = True
        p2.alignment = PP_ALIGN.CENTER

    def add_table_custom(slide, left, top, width, height, headers, rows):
        table_shape = slide.shapes.add_table(len(rows) + 1, len(headers), left, top, width, height)
        tbl = table_shape.table

        # Format Header
        for col_idx, h in enumerate(headers):
            cell = tbl.cell(0, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(30, 48, 88)
            p = cell.text_frame.paragraphs[0]
            p.text = h
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = CYAN_ACCENT
            p.alignment = PP_ALIGN.CENTER

        # Format Rows
        for r_idx, row in enumerate(rows):
            bg = RGBColor(20, 29, 52) if r_idx % 2 == 0 else RGBColor(14, 21, 38)
            for c_idx, val in enumerate(row):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.fill.solid()
                cell.fill.fore_color.rgb = bg
                p = cell.text_frame.paragraphs[0]
                p.text = str(val)
                p.font.size = Pt(9)
                p.font.color.rgb = TEXT_BODY
                if c_idx == 0:
                    p.font.bold = True
                    p.font.color.rgb = TEXT_WHITE

    # ==========================================
    # SLIDE 1: Cover Slide
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_DARK
    bg1.line.fill.background()

    # Cover Decorative Accents
    dec1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(11.733), Inches(5.1))
    dec1.fill.solid()
    dec1.fill.fore_color.rgb = RGBColor(16, 24, 46)
    dec1.line.color.rgb = CYAN_ACCENT
    dec1.line.width = Pt(2)

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.6), Inches(10.9), Inches(1.2))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "VORLDX EMPLOYEE ATTENDANCE SYSTEM"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "Enterprise Architecture, Telemetry, and Complete Functional Specification"
    p2.font.size = Pt(18)
    p2.font.color.rgb = CYAN_ACCENT
    p2.alignment = PP_ALIGN.CENTER

    # Pill container on cover
    pill_c = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.2), Inches(3.2), Inches(6.9), Inches(0.5))
    pill_c.fill.solid()
    pill_c.fill.fore_color.rgb = RGBColor(28, 44, 82)
    pill_c.line.color.rgb = BLUE_ACCENT
    tf_pc = pill_c.text_frame
    p_pc = tf_pc.paragraphs[0]
    p_pc.text = "React 18  •  React Native & Expo 58  •  Node.js & Express  •  MongoDB Atlas  •  Dynamic QR Engine"
    p_pc.font.size = Pt(11)
    p_pc.font.bold = True
    p_pc.font.color.rgb = TEXT_WHITE
    p_pc.alignment = PP_ALIGN.CENTER

    # Corporate block
    tb_corp = s1.shapes.add_textbox(Inches(1.5), Inches(4.2), Inches(10.3), Inches(1.6))
    tf_corp = tb_corp.text_frame
    p_c1 = tf_corp.paragraphs[0]
    p_c1.text = "VorldX Industries Private Limited  |  CIN: U62099UP2026PTC245598"
    p_c1.font.size = Pt(13)
    p_c1.font.bold = True
    p_c1.font.color.rgb = CYAN_ACCENT
    p_c1.alignment = PP_ALIGN.CENTER

    p_c2 = tf_corp.add_paragraph()
    p_c2.text = "Headquarters: Lucknow, Uttar Pradesh, India  •  Official Contact: hello@vorldx.com"
    p_c2.font.size = Pt(11.5)
    p_c2.font.color.rgb = TEXT_MUTED
    p_c2.alignment = PP_ALIGN.CENTER

    p_c3 = tf_corp.add_paragraph()
    p_c3.text = "Comprehensive 45-Page Architectural Review & Product Showcase"
    p_c3.font.size = Pt(12)
    p_c3.font.bold = True
    p_c3.font.color.rgb = GREEN_ACCENT
    p_c3.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 2: Corporate Profile & Executive Overview
    # ==========================================
    s2 = add_base_slide("Corporate Profile & Executive Mission", "Company Background", 2)
    add_card(s2, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Organization DNA & Governance", [
        ("Company Name", "VorldX Industries Private Limited"),
        ("Corporate Identity (CIN)", "U62099UP2026PTC245598"),
        ("Headquarters", "Lucknow, Uttar Pradesh, India"),
        ("Global Support", "hello@vorldx.com / contact@vorldx.com"),
        ("Industry Domain", "Next-Gen Enterprise SaaS & Workforce Intelligence"),
        ("Core Mandate", "Eliminate proxy punches, establish verifiable cryptographic attendance, and empower hybrid workforce flexibility.")
    ], CYAN_ACCENT)

    add_card(s2, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Executive Product Objectives", [
        ("Zero-Trust Verification", "Eliminate buddy punching and static badge copying using 18s rotating dynamic tokens."),
        ("Multi-Role Governance", "Clear separation between Super Admin, HR Admin, Employee, and Kiosk."),
        ("Timezone Rigor", "Hardened Indian Standard Time (IST) schedule with strict 09:30 AM cutoff and automated late tracking."),
        ("Hybrid Flexibility", "Regulated 5-employee/day WFH quota with two-tier managerial review."),
        ("Audit Compliance", "Forensic immutable audit logging for all manual punches and attendance adjustments.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 3: The Enterprise Challenge (Problem Statement)
    # ==========================================
    s3 = add_base_slide("The Enterprise Challenge: Legacy Attendance Pitfalls", "Problem Analysis", 3)
    add_card(s3, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "1. Static Punch Vulnerabilities", [
        ("Buddy Punching", "Co-workers clocking in for absent colleagues via shared RFID tags or PINs."),
        ("Static QR Photocopies", "Employees photographing static QR posters to check in remotely from parking lots or cafes."),
        ("No Identity Assurance", "Lack of biometric or device cryptographic linkage.")
    ], RED_ACCENT)

    add_card(s3, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "2. Hybrid Workforce Friction", [
        ("Unregulated WFH Chaos", "Uncontrolled remote days leading to empty physical offices and communication voids."),
        ("Messy Email Threads", "Leave requests lost across chats and inboxes with no real-time quota visibility."),
        ("Inflexible Cutoffs", "No automated distinction between punctual staff and chronic latecomers.")
    ], AMBER_ACCENT)

    add_card(s3, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "3. Administrative Overhead", [
        ("Manual Excel Aggregations", "HR spending dozens of hours monthly consolidating punch logs and fixing discrepancies."),
        ("Audit Non-Compliance", "Unverified manual corrections lacking tamper-evident audit logs."),
        ("Disjointed Systems", "Mobile apps, admin dashboards, and office displays operating on disconnected databases.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 4: Strategic Solution Vision & Ecosystem
    # ==========================================
    s4 = add_base_slide("Strategic Solution Vision & Ecosystem", "Solution Overview", 4)
    add_stat_box(s4, Inches(0.8), Inches(1.6), Inches(2.7), Inches(1.2), "18s", "Dynamic QR Life", CYAN_ACCENT)
    add_stat_box(s4, Inches(3.8), Inches(1.6), Inches(2.7), Inches(1.2), "09:30 AM", "IST Late Cutoff", AMBER_ACCENT)
    add_stat_box(s4, Inches(6.8), Inches(1.6), Inches(2.7), Inches(1.2), "5 / Day", "Max WFH Quota", PURPLE_ACCENT)
    add_stat_box(s4, Inches(9.8), Inches(1.6), Inches(2.7), Inches(1.2), "100%", "Audited Corrections", GREEN_ACCENT)

    add_card(s4, Inches(0.8), Inches(3.0), Inches(5.7), Inches(3.8), "Three Coordinated Ecosystem Clients", [
        ("1. Office QR Display (Kiosk)", "Dedicated reception screen generating dynamic tokens, laser scanning beam, countdown timer."),
        ("2. Employee Mobile App", "React Native / Expo app for camera scanning, live shift telemetry, WFH/leave requests, profile uploads."),
        ("3. Admin Web Console", "React 18 + Vite dashboard for HR directories, live attendance sheets, WFH approvals, and policy engines.")
    ], CYAN_ACCENT)

    add_card(s4, Inches(6.8), Inches(3.0), Inches(5.7), Inches(3.8), "Core Architectural Strengths", [
        ("Cryptographic Session Tokens", "Tokens auto-expire every 18 seconds via MongoDB TTL indexes preventing replay."),
        ("Dual-Layer Managerial Approvals", "WFH requests undergo HR review followed by Super Admin confirmation."),
        ("Single Source of Truth", "Centralized MongoDB persistent cluster synchronizing web, app, and kiosk in real-time.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 5: High-Level Enterprise Architecture
    # ==========================================
    s5 = add_base_slide("High-Level Enterprise Architecture Overview", "Architecture", 5)
    add_card(s5, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Tier 1: Client Layer", [
        ("Admin Web App", "React 18, Vite, Lucide Icons, Recharts, Tailwind CSS. Consumes REST APIs with JWT Bearer auth."),
        ("Employee Mobile Client", "React Native 0.76, Expo 58, Camera Module, AsyncStorage, Vector Icons."),
        ("Reception Kiosk Screen", "Dedicated wall-mounted terminal running continuous 18s rolling token generator.")
    ], CYAN_ACCENT)

    add_card(s5, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Tier 2: Business Logic Layer", [
        ("REST API Router", "Node.js & Express.js with CORS, JSON body parsers, express-rate-limiters."),
        ("Policy Evaluator", "Strict IST time computation enforcing 09:30 AM boundary and late classification."),
        ("QR Cryptographic Engine", "Random 256-bit token generator with TTL expiration and replay detection."),
        ("WFH Quota Engine", "Concurrent active count query ensuring max 5 approved employees per day."),
        ("Forensic Audit Engine", "Immutable logging service for all manual overrides.")
    ], BLUE_ACCENT)

    add_card(s5, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Tier 3: Persistence Layer", [
        ("Database Engine", "MongoDB Atlas / Replica Set with Mongoose ODM."),
        ("Document Models", "9 distinct Schemas with strict type validations and pre-save hooks."),
        ("Indexing Strategy", "Unique compound indexes (employee, date) to prevent duplicate check-ins."),
        ("TTL Indexes", "Self-cleaning QR session tokens with 18-second auto-expiry."),
        ("Asset Storage", "Local file storage for employee profile avatars under /uploads/avatars.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 6: Technology Stack Deep Dive
    # ==========================================
    s6 = add_base_slide("Technology Stack & Tooling Breakdown", "Tech Stack", 6)
    headers_s6 = ["Layer / Domain", "Primary Framework", "Supporting Libraries", "Core Purpose"]
    rows_s6 = [
        ["Web Frontend", "React 18 + Vite", "Tailwind CSS, Lucide React, Recharts", "Super Admin & HR administrative console"],
        ["Mobile App", "React Native + Expo 58", "Expo Camera, AsyncStorage, Vector Icons", "Cross-platform iOS & Android employee client"],
        ["Backend API", "Node.js + Express.js", "cors, dotenv, express-rate-limit", "RESTful business logic and security middleware"],
        ["Database", "MongoDB (Atlas/Replica)", "Mongoose 8.x ODM", "Persistent multi-collection document store"],
        ["Security / Crypto", "JWT (jsonwebtoken)", "bcryptjs (12 salt rounds)", "Stateless authorization & password hashing"],
        ["DevOps & Tooling", "Metro Bundler, npm", "Git, PowerShell Automation, ESLint", "Build pipelines, zero comment enforcement"]
    ]
    add_table_custom(s6, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s6, rows_s6)

    # ==========================================
    # SLIDE 7: Security & Cryptographic Model
    # ==========================================
    s7 = add_base_slide("Security & Cryptographic Model", "Security Architecture", 7)
    add_card(s7, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Identity & Authentication Defense", [
        ("Stateless JWT Tokens", "Cryptographically signed JSON Web Tokens containing userId, role, and expiration timestamp."),
        ("bcrypt Cost Factor 12", "All passwords hashed using 12 salt rounds against rainbow table attacks."),
        ("Strict .env Credential Binding", "Super Admin credentials exclusively governed by environment variables (ADMIN_ID, ADMIN_PASS)."),
        ("Role Authorization Guards", "Middleware `allowRoles('SUPER_ADMIN')` blocking unauthorized endpoints with HTTP 403."),
        ("Simulated & Dynamic OTP", "Encrypted ephemeral OTPs with strict 10-minute validity and attempt limits.")
    ], CYAN_ACCENT)

    add_card(s7, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Anti-Spoofing & Replay Mitigation", [
        ("18-Second Rolling QR Tokens", "Each session token contains unique cryptographic entropy valid for only 18 seconds."),
        ("Single-Use Invalidation", "When consumed during check-in, token is immediately marked `used: true`."),
        ("Replay Attack Rejection", "Any re-submission of an expired or used token returns immediate HTTP 400 Bad Request."),
        ("Compound Index Lock", "MongoDB unique compound index on `(employee, date)` makes duplicate punches physically impossible."),
        ("Rate Limiting", "Express rate-limit protects auth and punch endpoints against brute-force attacks.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 8: Multi-Role RBAC Matrix
    # ==========================================
    s8 = add_base_slide("Multi-Role RBAC Matrix: Permissions Architecture", "Access Control", 8)
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
    add_table_custom(s8, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s8, rows_s8)

    # ==========================================
    # SLIDE 9: Database Architecture Blueprint
    # ==========================================
    s9 = add_base_slide("Database Architecture Blueprint: 9 Core Collections", "Data Layer", 9)
    add_card(s9, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Identity & Directory Collections", [
        ("User", "Core authentication identity with email, passwordHash, role, avatar, active status."),
        ("Employee", "Workforce metadata linked to User: employeeId, department, designation, shift, phone."),
        ("AuditLog", "Immutable audit collection capturing actor, action, target entity, timestamp, IP address.")
    ], CYAN_ACCENT)

    add_card(s9, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Operations & Requests", [
        ("Attendance", "Daily records: date, status, mode, checkIn, checkOut, checkInMethod, auditHistory."),
        ("WfhRequest", "Remote work applications: startDate, endDate, wfhType, status, hrApprovedBy, adminApprovedBy."),
        ("LeaveRequest", "Time-off records: leaveType (Casual/Sick/Earned), date range, status, reason.")
    ], BLUE_ACCENT)

    add_card(s9, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Governance & System State", [
        ("QrSession", "Rolling 18-second tokens with TTL index on expiresAt, used flags, and location metadata."),
        ("AttendancePolicy", "Singleton document for officeStartTime (09:00), cutoff (09:30), maxWfhPerDay (5)."),
        ("Notification", "System broadcasts, targeted alerts, and read receipt arrays.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 10: Data Entity Deep-Dive: Users & Employees
    # ==========================================
    s10 = add_base_slide("Data Entity Deep-Dive: User & Employee Directory", "Data Models", 10)
    add_card(s10, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: User (Authentication Entity)", [
        ("name", "String, required, trimmed corporate full name"),
        ("email", "String, required, unique index, lowercase, case-insensitive"),
        ("passwordHash", "String, required, bcrypt hash with 12 salt rounds"),
        ("role", "Enum: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE']"),
        ("avatar", "String, URL path to stored profile picture in /uploads/avatars/"),
        ("active", "Boolean, default: true; prevents deactivated accounts from logging in"),
        ("createdAt / updatedAt", "Auto-managed timestamps for lifecycle auditing")
    ], CYAN_ACCENT)

    add_card(s10, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: Employee (Corporate Profile)", [
        ("user", "ObjectId referencing User model (1-to-1 relationship)"),
        ("employeeId", "String, required, unique index (e.g. 'VX-EMP-001')"),
        ("department", "Enum: Engineering, Product, HR, Finance, Operations, Sales"),
        ("designation", "String, organizational title (e.g. Senior Full-Stack Engineer)"),
        ("phone", "String, registered mobile number used for OTP authentication"),
        ("shift", "Default: 'Standard 09:00 - 18:00 IST'"),
        ("avatar", "Synchronized avatar URI for fast directory table lookups")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 11: Data Entity Deep-Dive: Attendance Records
    # ==========================================
    s11 = add_base_slide("Data Entity Deep-Dive: Attendance & Audit Trails", "Data Models", 11)
    add_card(s11, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: Attendance (Daily Punch Record)", [
        ("employee", "ObjectId referencing Employee model; indexed"),
        ("date", "String, YYYY-MM-DD format (Asia/Kolkata IST normalized)"),
        ("Compound Index", "Unique index on (employee, date) - strictly enforces one punch record per day"),
        ("status", "Enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT']"),
        ("mode", "Enum: ['OFFICE', 'WFH']"),
        ("checkIn / checkOut", "Timestamps recording exact IST punch times"),
        ("checkInMethod", "Enum: ['QR_SCAN', 'MANUAL_CORRECTION', 'WFH_REMOTE']"),
        ("workingHours", "Computed numeric duration in hours and minutes")
    ], GREEN_ACCENT)

    add_card(s11, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Embedded Schema: auditHistory Array", [
        ("Purpose", "Tamper-evident record of any administrative corrections"),
        ("modifiedBy", "ObjectId referencing the Admin/HR who initiated change"),
        ("previousStatus", "Snapshot of attendance status before alteration"),
        ("newStatus", "Updated attendance status applied by administrator"),
        ("reason", "Mandatory text justification submitted by manager"),
        ("timestamp", "Exact ISO datetime when the adjustment occurred"),
        ("Compliance Value", "Guarantees full forensic traceability for payroll and labor audits")
    ], AMBER_ACCENT)

    # ==========================================
    # SLIDE 12: Data Entity Deep-Dive: WFH & Leave State Machines
    # ==========================================
    s12 = add_base_slide("Data Entity Deep-Dive: WFH & Leave State Machines", "State Machines", 12)
    add_card(s12, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "WfhRequest State Machine (Two-Stage)", [
        ("PENDING", "Initial state upon employee submission with date & reason"),
        ("HR_APPROVED", "Stage 1 passed: HR Admin reviewed and endorsed request"),
        ("APPROVED", "Final state: Super Admin ratified request; attendance unlocked"),
        ("REJECTED", "Denied by HR Admin or Super Admin with formal remarks"),
        ("CANCELLED", "Revoked by employee prior to managerial decision"),
        ("Audit Fields", "hrApprovedBy, hrDecisionDate, adminApprovedBy, adminDecisionDate")
    ], PURPLE_ACCENT)

    add_card(s12, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "LeaveRequest State Machine", [
        ("leaveType", "Enum: ['CASUAL', 'SICK', 'EARNED']"),
        ("startDate / endDate", "Dates defining leave period duration"),
        ("reason", "Detailed explanation and optional medical attachment link"),
        ("status", "Enum: ['PENDING', 'APPROVED', 'REJECTED']"),
        ("decidedBy", "Reference to the approving HR or Super Admin"),
        ("Balance Deduction", "Automatically adjusts remaining leave balance on approval")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 13: Data Entity Deep-Dive: QR Sessions & Policies
    # ==========================================
    s13 = add_base_slide("Data Entity Deep-Dive: Dynamic QR & System Policy", "Data Models", 13)
    add_card(s13, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: QrSession (Ephemeral Rolling Token)", [
        ("token", "256-bit cryptographically secure token string; unique index"),
        ("officeLocation", "Location descriptor (e.g., 'Lucknow HQ - Reception Screen 1')"),
        ("generatedBy", "Reference to kiosk session or reception admin identity"),
        ("expiresAt", "Date field with MongoDB TTL Index (auto-deletes after 18 seconds)"),
        ("used", "Boolean flag; set to true upon first scan consumption"),
        ("usedBy", "ObjectId of employee who scanned the token"),
        ("usedAt", "Timestamp recording the exact millisecond of consumption")
    ], CYAN_ACCENT)

    add_card(s13, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Schema: AttendancePolicy (Enterprise Singleton)", [
        ("officeStartTime", "String: '09:00' (Official work day start time)"),
        ("checkInCutoffTime", "String: '09:30' (Boundary between PRESENT and LATE)"),
        ("officeEndTime", "String: '18:00' (Standard shift departure time)"),
        ("maxWfhPerDay", "Number: 5 (Maximum allowable remote employees per day)"),
        ("qrCodeExpirySeconds", "Number: 18 (Configurable rotation duration)"),
        ("allowedIpSubnets", "Optional IP ranges permitted for kiosk token generation"),
        ("enforceGeofencing", "Boolean toggle for physical location locking")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 14: Timezone Engine & Indian Standard Time (IST)
    # ==========================================
    s14 = add_base_slide("Timezone Engine & Indian Standard Time (IST)", "Time Policy", 14)
    add_stat_box(s14, Inches(0.8), Inches(1.6), Inches(3.7), Inches(1.3), "UTC +05:30", "Normalized Timezone", CYAN_ACCENT)
    add_stat_box(s14, Inches(4.8), Inches(1.6), Inches(3.7), Inches(1.3), "09:00 AM IST", "Shift Commencement", GREEN_ACCENT)
    add_stat_box(s14, Inches(8.8), Inches(1.6), Inches(3.7), Inches(1.3), "09:30 AM IST", "Strict Late Cutoff", AMBER_ACCENT)

    add_card(s14, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Time Normalization Architecture", [
        ("Asia/Kolkata Boundary", "All timestamps are converted and parsed in Asia/Kolkata timezone regardless of hosting server zone (AWS, Azure, or local)."),
        ("Date String Key", "Date strings stored in normalized YYYY-MM-DD IST to prevent UTC day-shift bugs."),
        ("No Device Clock Spoofing", "Check-in time is calculated strictly from server NTP clock, rejecting client phone clock manipulations.")
    ], BLUE_ACCENT)

    add_card(s14, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Automated Classification Algorithm", [
        ("<= 09:30:00 AM IST", "Attendance marked with status 'PRESENT'. Punctuality metrics incremented."),
        ("> 09:30:00 AM IST", "Attendance marked with status 'LATE'. Flagged in red on HR dashboard."),
        ("Post 13:00 PM IST", "Check-ins classified as 'HALF_DAY' automatically."),
        ("Absence Auto-Evaluation", "Employees with no check-in by day close marked 'ABSENT'.")
    ], AMBER_ACCENT)

    # ==========================================
    # SLIDE 15: Dynamic Office QR System & 18s Rotation
    # ==========================================
    s15 = add_base_slide("Dynamic Office QR System: 18s Rolling Tokens", "QR Security", 15)
    add_card(s15, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Cryptographic Rolling Mechanics", [
        ("Step 1: Session Polling", "Office display polls `/api/qr/session` or `/api/qr/kiosk` to fetch active session."),
        ("Step 2: Entropy Injection", "Server combines timestamp, office salt, and random 256-bit token."),
        ("Step 3: TTL Index", "MongoDB creates document with 18-second auto-expiration."),
        ("Step 4: Real-Time Rendering", "Kiosk renders SVG/Canvas QR with countdown progress ring."),
        ("Step 5: Immediate Burn", "Scanning marks token as used; second scan fails instantly.")
    ], CYAN_ACCENT)

    add_card(s15, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Anti-Replay & Anti-Fraud Defense", [
        ("Zero Photo-Sharing Risk", "A photo taken by an employee on messaging apps expires in 18s before an offsite colleague can scan it."),
        ("Replay Token Rejection", "Any replayed token throws HTTP 400: 'Token already used or expired'."),
        ("No Static URLs", "QR encodes ephemeral cryptographic payload, not static web URLs."),
        ("Audit Association", "Every token records generating kiosk IP and scanning employee ID.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 16: Reception / Wall Kiosk Display Mode
    # ==========================================
    s16 = add_base_slide("Reception / Wall Kiosk Mode: Display Engineering", "Kiosk UI/UX", 16)
    add_card(s16, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Visual Design & Atmosphere", [
        ("Cyberpunk Aesthetic", "Sleek dark theme with glowing cyan borders and futuristic HUD typography."),
        ("Laser Beam Sweep", "Animated horizontal cyan laser line sweeping across the QR frame continuously."),
        ("Real-Time Clock", "Digital live 24-hour clock displaying current IST seconds and full date format.")
    ], CYAN_ACCENT)

    add_card(s16, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Countdown & Auto-Refresh", [
        ("Circular Countdown Bar", "Radial progress bar tracking the exact remaining seconds out of 18s."),
        ("Color Shift Warning", "Progress transitions from Cyan (18s-6s) to Amber (5s-2s) to Red (<2s)."),
        ("Seamless Transition", "New QR token generated in background without screen flicker or lag.")
    ], AMBER_ACCENT)

    add_card(s16, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Hardware & Kiosk Mode", [
        ("Full-Screen Lock", "Runs in browser full-screen kiosk mode (F11) on tablet or smart TV at reception."),
        ("Tamper Resistant", "No interactive navigation buttons accessible to guests or visitors."),
        ("Low Footprint", "Optimized lightweight canvas rendering consuming minimal CPU on kiosk hardware.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 17: Employee Onboarding & Demo Verification
    # ==========================================
    s17 = add_base_slide("Employee Onboarding & Demo Verification", "Onboarding Flow", 17)
    headers_s17 = ["Demo Account ID", "Full Name", "Assigned Department", "Corporate Role", "Simulated OTP"]
    rows_s17 = [
        ["VX-EMP-001", "Aarav Sharma", "Engineering", "Senior Full-Stack Developer", "8426"],
        ["VX-EMP-002", "Priya Patel", "Product & Design", "Lead Product Manager", "8426"],
        ["VX-EMP-003", "Kavita Reddy", "HR & Operations", "People Operations Specialist", "8426"]
    ]
    add_table_custom(s17, Inches(0.8), Inches(1.7), Inches(11.733), Inches(2.2), headers_s17, rows_s17)

    add_card(s17, Inches(0.8), Inches(4.2), Inches(5.7), Inches(2.6), "Onboarding Protocol", [
        ("1. Directory Matching", "App queries backend to confirm valid Employee ID."),
        ("2. Simulated OTP Dispatch", "Backend renders instant simulated OTP `8426`."),
        ("3. Account Claiming", "Employee sets strong personal password.")
    ], CYAN_ACCENT)

    add_card(s17, Inches(6.8), Inches(4.2), Inches(5.7), Inches(2.6), "Enterprise Security Benefits", [
        ("No Cold Starts", "Enables seamless demonstration without waiting for third-party SMS delays."),
        ("Production Parity", "Exact same API contract and JWT issuance as live SMS gateway.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 18: Simulated & Dynamic SMS OTP Handshake
    # ==========================================
    s18 = add_base_slide("Simulated & Dynamic SMS OTP Handshake", "Authentication", 18)
    add_card(s18, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Dual-Mode OTP Architecture", [
        ("Demo Sandbox Mode", "When running in test/demo mode, code `8426` is accepted with instant auto-fill code badges."),
        ("Dynamic SMS Mode", "In production mode, server generates a random 4-digit cryptographic OTP."),
        ("SMS Gateway Abstraction", "Pluggable driver interface supporting Twilio, MSG91, AWS SNS, and Fast2SMS."),
        ("Time-To-Live (TTL)", "OTP expires in 10 minutes; automatically purged from session cache."),
        ("Attempt Throttling", "Maximum 3 failed OTP attempts before temporary phone number cooldown.")
    ], PURPLE_ACCENT)

    add_card(s18, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "API Handshake Lifecycle", [
        ("POST /api/auth/send-otp", "Request payload: `{ phone: '+919876543210' }`. Server generates OTP and returns session ID."),
        ("POST /api/auth/verify-otp", "Payload: `{ phone, otp: '8426' }`. Server verifies hash and expiration."),
        ("Response Envelope", "Returns `{ token: JWT, user: { id, name, role, employeeId } }`."),
        ("Mobile Persistence", "JWT stored securely in AsyncStorage for persistent app authentication.")
    ], CYAN_ACCENT)

    # ==========================================
    # SLIDE 19: Passwordless Mobile Number Authentication
    # ==========================================
    s19 = add_base_slide("Passwordless Mobile Number Authentication", "Mobile Security", 19)
    add_stat_box(s19, Inches(0.8), Inches(1.6), Inches(3.7), Inches(1.3), "Zero Passwords", "Eliminates Password Fatigue", CYAN_ACCENT)
    add_stat_box(s19, Inches(4.8), Inches(1.6), Inches(3.7), Inches(1.3), "1-Tap Login", "Frictionless Employee UX", GREEN_ACCENT)
    add_stat_box(s19, Inches(8.8), Inches(1.6), Inches(3.7), Inches(1.3), "JWT Encrypted", "Tamper-Proof Claims", BLUE_ACCENT)

    add_card(s19, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Why Passwordless for Attendance?", [
        ("Zero Credentials Stored on Phone", "Employees never need to remember or rotate complex passwords."),
        ("Eliminates Phishing", "No static passwords for attackers to intercept via credential stuffing."),
        ("Instant Revocation", "If an employee leaves, HR deactivates their account and login tokens expire instantly.")
    ], BLUE_ACCENT)

    add_card(s19, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Fallback & Emergency Auth", [
        ("Super Admin Master Override", "Super Admin can issue temporary login tokens in emergency network outages."),
        ("Multi-Device Support", "Token binding supports seamless transition across iOS, Android, and Web."),
        ("Biometric Extension Ready", "Architecture ready for FaceID / TouchID biometric token unlock.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 20: Employee Mobile App: Architecture & Engine
    # ==========================================
    s20 = add_base_slide("Employee Mobile App: Architecture & Framework", "Mobile App", 20)
    add_card(s20, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Core Framework", [
        ("React Native 0.76", "Native component rendering for optimal 60fps performance."),
        ("Expo 58 Platform", "Managed workflow ensuring cross-platform iOS & Android parity."),
        ("Metro Bundler", "Fast Hot Module Replacement (HMR) and zero build errors across 399 bundled modules.")
    ], CYAN_ACCENT)

    add_card(s20, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Hardware & Storage", [
        ("Expo Camera", "High-performance camera integration with barcode/QR scanning engine."),
        ("AsyncStorage", "Encrypted local device storage for JWT and offline cached profile."),
        ("ImagePicker API", "Seamless integration with iOS Camera Roll and Android Gallery.")
    ], BLUE_ACCENT)

    add_card(s20, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Navigation & State", [
        ("Tab Navigation", "Dashboard, Attendance History, Requests (WFH/Leave), and Profile."),
        ("Offline State Cache", "Renders cached attendance history if connectivity drops."),
        ("Auto-Reconnection", "Automatic synchronization when network connectivity restores.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 21: Mobile App: Daily Attendance Dashboard
    # ==========================================
    s21 = add_base_slide("Mobile App: Daily Attendance Dashboard & Telemetry", "Mobile UX", 21)
    add_card(s21, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Live Shift Telemetry Cards", [
        ("Live Digital Clock", "Real-time clock displaying current IST hours, minutes, and seconds."),
        ("Today's Shift Status", "Color-coded badge: 'NOT CHECKED IN' (Gray), 'PRESENT' (Green), 'LATE' (Amber), 'CHECKED OUT' (Blue)."),
        ("Check-In Time Record", "Displays exact timestamp of morning check-in (e.g. 09:14 AM)."),
        ("Live Elapsed Timer", "Dynamically updates elapsed shift duration (e.g. '04h 32m on duty')."),
        ("WFH Quota Bar", "Shows organizational remote capacity: '3/5 Approved Today'.")
    ], CYAN_ACCENT)

    add_card(s21, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Primary Action Buttons", [
        ("Scan Office QR to Check In", "High-contrast action button activating camera scanner."),
        ("Scan Screen QR to Check Out", "Departing action recording official checkout timestamp."),
        ("Apply for Work From Home", "Quick link opening the WFH application dialog."),
        ("Request Time-Off / Leave", "Direct access to casual, sick, and earned leave forms.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 22: Mobile App: Camera Dynamic QR Scanner
    # ==========================================
    s22 = add_base_slide("Mobile App: Camera Dynamic QR Scanner Module", "Mobile Scanner", 22)
    add_card(s22, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "In-App Camera Experience", [
        ("Full-Screen Viewfinder", "Hardware-accelerated camera feed with blurred backdrop framing."),
        ("Scanning Reticle", "High-visibility cyan corner brackets framing the QR code target."),
        ("Sub-Second Detection", "Scans and decodes 256-bit payload in under 200 milliseconds."),
        ("Haptic Feedback", "Vibration pulse and sound confirmation upon successful decode."),
        ("Torch / Flashlight Toggle", "Manual toggle button for dimly lit reception or evening check-outs.")
    ], CYAN_ACCENT)

    add_card(s22, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Validation & Payload Dispatch", [
        ("Instant Payload Parsing", "Extracts token ID and verifies structure before network call."),
        ("API Ingestion", "Submits payload to `/api/attendance/check-in` with Authorization Bearer header."),
        ("Graceful Error Modals", "If token expired: 'QR expired, please scan the updated screen QR'."),
        ("Anti-Spam Debounce", "Camera disengages immediately after scan to prevent multi-submissions.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 23: Mobile App: Attendance Check-In Flow
    # ==========================================
    s23 = add_base_slide("Mobile App: Check-In Flow & Policy Classification", "Punctuality Engine", 23)
    add_stat_box(s23, Inches(0.8), Inches(1.6), Inches(5.7), Inches(1.3), "PRESENT", "Check-in time <= 09:30:00 AM IST", GREEN_ACCENT)
    add_stat_box(s23, Inches(6.8), Inches(1.6), Inches(5.7), Inches(1.3), "LATE", "Check-in time > 09:30:00 AM IST", AMBER_ACCENT)

    add_card(s23, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Punctual Check-In Lifecycle", [
        ("Employee Scans at 09:12 AM", "Camera decodes active reception QR token."),
        ("Backend Policy Verification", "Time is verified prior to 09:30 AM cutoff threshold."),
        ("Database Update", "Attendance document created with status 'PRESENT'."),
        ("UI Feedback", "Vibrant green celebration banner: 'Welcome Aarav! Checked in at 09:12 AM'.")
    ], GREEN_ACCENT)

    add_card(s23, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Late Check-In Lifecycle", [
        ("Employee Scans at 09:41 AM", "Camera decodes active reception QR token."),
        ("Backend Policy Verification", "Time exceeds 09:30 AM boundary; late penalty applied."),
        ("Database Update", "Attendance record logged with status 'LATE' and lateMinutes: 11."),
        ("UI Feedback", "Amber notification: 'Checked in at 09:41 AM (Marked Late: 11 mins past cutoff)'.")
    ], AMBER_ACCENT)

    # ==========================================
    # SLIDE 24: Mobile App: Attendance Check-Out Flow
    # ==========================================
    s24 = add_base_slide("Mobile App: Check-Out Flow & Working Hours Calculation", "Shift Completion", 24)
    add_card(s24, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Check-Out Verification Steps", [
        ("1. Evening Verification", "Employee taps 'Scan Screen QR to Check Out' at office close."),
        ("2. Token Validation", "Validates that evening QR token is legitimate and active."),
        ("3. Pre-existing Check-In Guard", "Verifies employee already has an active check-in record for today."),
        ("4. Timestamp Ingestion", "Sets checkOut to current IST time (e.g. 18:05 PM)."),
        ("5. State Lock", "Marks daily record as concluded; prevents duplicate check-outs.")
    ], BLUE_ACCENT)

    add_card(s24, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Working Hours Mathematical Engine", [
        ("Delta Computation", "Formula: `durationMs = checkOutTime - checkInTime`."),
        ("Hour & Minute Normalization", "Converts raw duration into standard corporate format (e.g. '08h 51m')."),
        ("Minimum Shift Compliance", "If duration < 4 hours: flags as 'HALF_DAY'; if >= 8 hours: 'FULL_DAY'."),
        ("Overtime Telemetry", "Records any excess minutes past 18:00 PM for HR overtime metrics.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 25: Mobile App: Work-From-Home (WFH) Portal
    # ==========================================
    s25 = add_base_slide("Mobile App: WFH Application Portal & Quota Counter", "Remote Work", 25)
    add_card(s25, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "WFH Application Parameters", [
        ("Target Date Selection", "Interactive date picker restricting selection to upcoming working days."),
        ("WFH Category", "Enum: 'STANDARD' (routine remote work) or 'URGENT' (family/medical emergency)."),
        ("Detailed Justification", "Mandatory text description of deliverables and remote availability."),
        ("Document Proof Upload", "Optional attachment upload for doctor's certificates or travel tickets."),
        ("Real-Time Capacity Check", "Live counter displaying: '3 of 5 WFH Slots Booked for This Date'.")
    ], PURPLE_ACCENT)

    add_card(s25, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Quota Guard & Status Tracking", [
        ("Automated 5-Slot Guard", "If 5 employees are already approved, submission blocks with clear notice."),
        ("Real-Time Status Badge", "Tracks status in real-time: 'Pending HR Review' -> 'Pending Admin Approval' -> 'Approved'."),
        ("Remote Attendance Unlock", "On final approval, mobile app renders remote 1-tap check-in button for that date."),
        ("Cancellation Support", "Employee can withdraw request before managerial review starts.")
    ], CYAN_ACCENT)

    # ==========================================
    # SLIDE 26: Mobile App: Leave Management Module
    # ==========================================
    s26 = add_base_slide("Mobile App: Comprehensive Leave Management", "Leave Engine", 26)
    headers_s26 = ["Leave Category", "Annual Entitlement", "Carryover Policy", "Typical Usage"]
    rows_s26 = [
        ["Casual Leave (CL)", "12 Days / Year", "Expires Annually", "Personal errands, short unannounced breaks"],
        ["Sick Leave (SL)", "10 Days / Year", "Medical Certificate Required > 2 Days", "Illness, medical consultations, recovery"],
        ["Earned Leave (EL)", "15 Days / Year", "Up to 30 Days Carryover", "Planned vacations, family weddings, sabbatical"]
    ]
    add_table_custom(s26, Inches(0.8), Inches(1.7), Inches(11.733), Inches(2.2), headers_s26, rows_s26)

    add_card(s26, Inches(0.8), Inches(4.2), Inches(5.7), Inches(2.6), "Leave Balance Dashboard", [
        ("Live Balance Counters", "Displays remaining CL, SL, and EL balances in real time."),
        ("Pending Deduction Lock", "Temporarily locks requested days while review is underway.")
    ], GREEN_ACCENT)

    add_card(s26, Inches(6.8), Inches(4.2), Inches(5.7), Inches(2.6), "Managerial Notification", [
        ("HR Alert Dispatch", "Immediately dispatches alert to HR console upon submission."),
        ("Decision Push Alert", "Alerts employee instantly when leave is approved or rejected.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 27: Mobile App: Attendance Calendar & History
    # ==========================================
    s27 = add_base_slide("Mobile App: Attendance Calendar & Historical Records", "Attendance History", 27)
    add_card(s27, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Monthly Calendar Visualizer", [
        ("Interactive Grid View", "Full monthly calendar with color-coded day markers:"),
        ("  • Green Dot", "Punctual office presence (Checked in <= 09:30 AM)."),
        ("  • Amber Dot", "Late arrival (Checked in > 09:30 AM)."),
        ("  • Blue Dot", "Approved remote work from home (WFH)."),
        ("  • Purple Dot", "Approved paid leave (CL/SL/EL)."),
        ("  • Red Dot", "Unexcused absence or missing check-in.")
    ], CYAN_ACCENT)

    add_card(s27, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Historical Punch Inspector", [
        ("Day Detail Drawer", "Tapping any day opens complete punch telemetry:"),
        ("  • Check-In Time", "Exact time recorded (e.g. 09:18 AM IST)."),
        ("  • Check-Out Time", "Exact time recorded (e.g. 18:10 PM IST)."),
        ("  • Total Duration", "Accumulated shift time (e.g. 08h 52m)."),
        ("  • Ingestion Method", "'Dynamic QR Scan' or 'Managerial Correction'."),
        ("Audit Transparency", "If corrected by HR, shows manager justification note.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 28: Mobile App: Avatar & Profile Photo Upload
    # ==========================================
    s28 = add_base_slide("Mobile App: Profile Avatar Upload & Storage Pipeline", "Profile Management", 28)
    add_card(s28, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Mobile Image Capture Pipeline", [
        ("Camera & Gallery Pickers", "Employee taps avatar circle; chooses instant Camera snap or Photo Library."),
        ("Client-Side Optimization", "Image resized and compressed on-device to reduce payload size to < 500 KB."),
        ("Multipart Upload", "Dispatched to backend via `POST /api/employees/avatar` with JWT auth."),
        ("Instant App Sync", "Avatar updates immediately across dashboard, sidebar, and profile.")
    ], GREEN_ACCENT)

    add_card(s28, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Backend Storage & Admin Visibility", [
        ("Safe File System Ingestion", "Stored on server disk under `backend/uploads/avatars/` with unique hash names."),
        ("Directory Cross-Sync", "Avatar URL automatically written to both User and Employee MongoDB documents."),
        ("Immediate Admin Presence", "Photo is instantly visible on Admin Web across directory tables, attendance sheets, and approval cards."),
        ("Security Scrubbing", "File MIME type verified to prevent executable upload exploits.")
    ], CYAN_ACCENT)

    # ==========================================
    # SLIDE 29: Admin Web Console: Architecture & Layout
    # ==========================================
    s29 = add_base_slide("Admin Web Console: Architecture & Layout Engine", "Web Console", 29)
    add_card(s29, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Core Framework", [
        ("React 18 + Vite", "High-performance SPA with lightning-fast Hot Module Replacement and production bundling."),
        ("Tailwind CSS", "Utility-first design system ensuring crisp typography and responsive layouts."),
        ("Lucide React Icons", "Extensive modern icon library for clear navigational affordance.")
    ], CYAN_ACCENT)

    add_card(s29, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Navigation Architecture", [
        ("Collapsible Sidebar", "Intuitive menu: Dashboard, Attendance Sheet, Directory, Approvals, Policies, HR Admins, Audit."),
        ("Role-Guarded Routes", "`ProtectedRoute` wrapper blocking unauthorized roles at the routing layer."),
        ("User Header Bar", "Active profile badge, role indicator pill, and single-click logout.")
    ], BLUE_ACCENT)

    add_card(s29, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "State & Telemetry", [
        ("Recharts Telemetry", "Interactive SVG charts for daily attendance trends and department breakdowns."),
        ("Axios Interceptors", "Automatically attaches JWT Bearer tokens and handles token expiration (401)."),
        ("Live Toast System", "Instant notifications for approvals, rejections, and policy updates.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 30: Admin Web: Executive Operations Dashboard
    # ==========================================
    s30 = add_base_slide("Admin Web: Executive Dashboard & Live Telemetry", "Executive Analytics", 30)
    add_stat_box(s30, Inches(0.8), Inches(1.6), Inches(2.7), Inches(1.2), "42", "Total Headcount", CYAN_ACCENT)
    add_stat_box(s30, Inches(3.8), Inches(1.6), Inches(2.7), Inches(1.2), "36", "Present On-Site", GREEN_ACCENT)
    add_stat_box(s30, Inches(6.8), Inches(1.6), Inches(2.7), Inches(1.2), "4", "Late Arrivals", AMBER_ACCENT)
    add_stat_box(s30, Inches(9.8), Inches(1.6), Inches(2.7), Inches(1.2), "2", "Approved WFH", PURPLE_ACCENT)

    add_card(s30, Inches(0.8), Inches(3.0), Inches(5.7), Inches(3.8), "Live Workforce Telemetry Cards", [
        ("Real-Time Presence Tracker", "Live counts of present, late, WFH, on-leave, and absent personnel."),
        ("Punctuality Index", "Automated percentage score measuring organization-wide arrival punctuality."),
        ("WFH Quota Usage", "Visual gauge tracking current day WFH consumption against the 5-employee cap.")
    ], CYAN_ACCENT)

    add_card(s30, Inches(6.8), Inches(3.0), Inches(5.7), Inches(3.8), "Interactive Analytical Charts", [
        ("Weekly Attendance Trends", "Recharts area chart tracking daily attendance patterns over past 30 days."),
        ("Departmental Heatmap", "Bar chart breaking down attendance performance by Engineering, Product, HR, and Sales."),
        ("Recent Activity Feed", "Real-time stream of employee check-ins with avatar photos and timestamps.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 31: Admin Web: Real-Time Attendance Sheet
    # ==========================================
    s31 = add_base_slide("Admin Web: Real-Time Departmental Attendance Sheet", "Attendance Sheet", 31)
    headers_s31 = ["Employee", "Dept", "Check-In", "Check-Out", "Status", "Mode", "Action"]
    rows_s31 = [
        ["Aarav Sharma", "Engineering", "09:12 AM", "--:--", "PRESENT", "OFFICE", "Edit / Audit"],
        ["Priya Patel", "Product", "09:41 AM", "--:--", "LATE", "OFFICE", "Edit / Audit"],
        ["Kavita Reddy", "HR", "09:05 AM", "18:02 PM", "PRESENT", "WFH", "Edit / Audit"],
        ["Rohan Verma", "Engineering", "--:--", "--:--", "ABSENT", "N/A", "Manual Punch"]
    ]
    add_table_custom(s31, Inches(0.8), Inches(1.7), Inches(11.733), Inches(2.7), headers_s31, rows_s31)

    add_card(s31, Inches(0.8), Inches(4.7), Inches(5.7), Inches(2.1), "Multi-Criteria Filtering & Search", [
        ("Live Name/ID Search", "Instant search filtering by employee name or ID."),
        ("Department Dropdown", "Filter by Engineering, Product, HR, Finance, etc."),
        ("Status Toggles", "Filter by Present, Late, Half-Day, Absent, or WFH.")
    ], CYAN_ACCENT)

    add_card(s31, Inches(6.8), Inches(4.7), Inches(5.7), Inches(2.1), "Export & Reporting Capabilities", [
        ("One-Click CSV / Excel Export", "Downloads full attendance sheet for payroll processing."),
        ("Audit Badge Indicator", "Displays icon on any record modified manually.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 32: Admin Web: Employee Directory Management
    # ==========================================
    s32 = add_base_slide("Admin Web: Employee Directory & Lifecycle Management", "Workforce Directory", 32)
    add_card(s32, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Complete Employee Lifecycle Controls", [
        ("Add New Employee", "Modal form collecting Name, Email, Department, Designation, Phone, and Shift."),
        ("Automated Account Provisioning", "Creates both User login credentials and Employee corporate profile."),
        ("Edit Employee Metadata", "Update phone numbers, shift timings, or departmental promotions in real time."),
        ("Deactivate / Reactivate", "Soft-deactivation toggle revoking mobile app login access while preserving historical punch records.")
    ], BLUE_ACCENT)

    add_card(s32, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Enterprise Directory Security", [
        ("Unique ID Constraints", "Prevents duplicate Employee IDs or email addresses at database index level."),
        ("Avatar Synchronization", "Displays uploaded employee photos directly in the directory grid."),
        ("Role Boundaries", "HR Admins can manage employees; only Super Admins can manage HR Admins.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 33: Admin Web: Multi-Stage WFH Approvals (Stage 1)
    # ==========================================
    s33 = add_base_slide("Multi-Stage WFH Approvals — Stage 1: HR Review", "WFH Workflow", 33)
    add_card(s33, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "HR Admin Review Responsibilities", [
        ("Incoming Request Queue", "HR navigates to `/approvals` to review all pending employee WFH applications."),
        ("Reason & Document Assessment", "HR verifies justification (medical, personal) and checks attached documents."),
        ("Capacity Check", "HR monitors current approved quota for the requested date."),
        ("Decision Action", "HR clicks 'Approve Request' or 'Reject with Remarks'."),
        ("State Transition", "On approval, status shifts from `PENDING` to `HR_APPROVED`.")
    ], CYAN_ACCENT)

    add_card(s33, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Integrity & Escalation Controls", [
        ("Audit Metadata", "Records `hrApprovedBy: req.user._id` and `hrDecisionDate: new Date()`."),
        ("No Premature Attendance", "Request remains inactive for attendance until Super Admin confirms."),
        ("Rejection Finality", "If HR rejects, request reaches final `REJECTED` state; employee notified immediately.")
    ], AMBER_ACCENT)

    # ==========================================
    # SLIDE 34: Admin Web: Super Admin Final WFH Confirmation (Stage 2)
    # ==========================================
    s34 = add_base_slide("Multi-Stage WFH Approvals — Stage 2: Super Admin Sign-Off", "Final Approval", 34)
    add_stat_box(s34, Inches(0.8), Inches(1.6), Inches(5.7), Inches(1.3), "5 Max WFH / Day", "Strict Capacity Enforcement", PURPLE_ACCENT)
    add_stat_box(s34, Inches(6.8), Inches(1.6), Inches(5.7), Inches(1.3), "Dual Approval", "HR Endorsement Required", GREEN_ACCENT)

    add_card(s34, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Super Admin Final Ratification", [
        ("Prerequisite Enforcement", "Super Admin only sees requests that have successfully passed HR Review (`HR_APPROVED`)."),
        ("Independent Check", "Ensures organization-wide balance between physical and remote presence."),
        ("Final Action", "Super Admin grants final approval; status shifts to `APPROVED`.")
    ], GREEN_ACCENT)

    add_card(s34, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "System State Consequences", [
        ("Mobile Unlock", "Employee's mobile app enables remote 1-tap check-in for approved dates."),
        ("Daily Quota Consumption", "Approved slot permanently deducted from day's availability."),
        ("Attendance Sheet Marker", "Employee automatically marked with 'WFH' badge on the daily attendance sheet.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 35: Admin Web: Leave Management Console
    # ==========================================
    s35 = add_base_slide("Admin Web: Leave Management & Team Balances", "Leave Operations", 35)
    add_card(s35, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Administrative Leave Controls", [
        ("Centralized Leave Queue", "Displays all submitted Casual, Sick, and Earned leave requests across departments."),
        ("Team Calendar Overlap View", "Identifies concurrent leave requests within the same department to prevent coverage gaps."),
        ("Medical Certificate Inspector", "Direct preview of uploaded doctor notes or certificates."),
        ("Instant Approval / Rejection", "One-click approval updates employee leave balance automatically.")
    ], GREEN_ACCENT)

    add_card(s35, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Compliance & Payroll Integration", [
        ("Automated Balance Ledger", "Maintains real-time history of taken, pending, and remaining leaves."),
        ("Loss of Pay (LOP) Flagging", "Alerts managers if an employee applies for leave beyond available balances."),
        ("Audit History", "Logs identity of approving manager and decision timestamp.")
    ], BLUE_ACCENT)

    # ==========================================
    # SLIDE 36: Admin Web: HR Admin Provisioning (Super Admin Exclusive)
    # ==========================================
    s36 = add_base_slide("HR Admin Provisioning & Role Guard Security", "Super Admin Exclusive", 36)
    add_card(s36, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Super Admin Privilege Isolation", [
        ("Exclusive Route Guard", "Route `/hr-admins` is strictly protected by `allowRoles('SUPER_ADMIN')` on backend and `ProtectedRoute` on frontend."),
        ("Unauthorized Access Rejection", "Any call by an HR Admin or Employee throws immediate HTTP 403 Forbidden."),
        ("Provisioning Modal", "Super Admin can onboard new HR Admins with email, password, and contact info."),
        ("One-Click Deactivation", "Super Admin can revoke HR Admin credentials instantly if roles change.")
    ], RED_ACCENT)

    add_card(s36, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Environment Variable Authority", [
        ("Primary Super Admin Root", "Super Admin authentication strictly verifies against `.env` configuration (`ADMIN_ID`, `ADMIN_PASS`)."),
        ("Immutable Root Credentials", "Cannot be modified or compromised via web UI, guaranteeing master recovery."),
        ("Forensic Traceability", "Every HR account created or deactivated is logged in the immutable Audit collection.")
    ], CYAN_ACCENT)

    # ==========================================
    # SLIDE 37: Admin Web: Forensic Attendance Corrections
    # ==========================================
    s37 = add_base_slide("Forensic Attendance Corrections & Audit Justifications", "Forensic Integrity", 37)
    add_card(s37, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Mandatory Justification Protocol", [
        ("Manual Correction Modal", "Initiated when an employee forgets to scan or faces mobile hardware issues."),
        ("Status Adjustment", "Manager can update status from 'ABSENT' to 'PRESENT', 'LATE', or 'HALF_DAY'."),
        ("Time Override", "Optional manual entry of check-in and check-out timestamps."),
        ("Mandatory Reason Field", "Submission button is strictly disabled until manager enters a detailed justification note (min 10 characters).")
    ], AMBER_ACCENT)

    add_card(s37, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Permanent Audit Inscription", [
        ("Embedded Snapshot", "Pushes record into attendance document's `auditHistory` array: `{ modifiedBy, previousStatus, newStatus, reason, timestamp }`."),
        ("Global Audit Collection", "Simultaneously writes entry to system `AuditLog` collection."),
        ("Tamper-Proof Visual Flag", "A warning shield icon appears beside the record in attendance sheets, viewable by auditors.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 38: Admin Web: Attendance Policy Configuration
    # ==========================================
    s38 = add_base_slide("Admin Web: Global Policy Configuration Engine", "System Policies", 38)
    headers_s38 = ["Policy Parameter", "Default Value", "Configurable Range", "Operational Impact"]
    rows_s38 = [
        ["Office Start Time", "09:00 AM IST", "07:00 - 11:00 AM", "Defines expected arrival and shift start"],
        ["Check-In Cutoff Time", "09:30 AM IST", "Start Time + 15 to 60m", "Boundary after which punches are marked LATE"],
        ["Office End Time", "18:00 PM IST", "16:00 - 21:00 PM", "Standard departure time for minimum hours calculation"],
        ["Max WFH Employees / Day", "5 Employees", "1 to 50 / Unlimited", "Enforces in-office collaboration and presence"],
        ["Dynamic QR Expiry", "18 Seconds", "10 to 60 Seconds", "Balances scanning ergonomics with anti-replay defense"]
    ]
    add_table_custom(s38, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s38, rows_s38)

    # ==========================================
    # SLIDE 39: Admin Web: Notifications & Broadcast Center
    # ==========================================
    s39 = add_base_slide("Admin Web: Organization Broadcasts & Alerts", "Communications", 39)
    add_card(s39, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Organization-Wide Broadcasts", [
        ("Company Announcements", "Publish office notices (e.g. holiday declarations, policy updates, town halls)."),
        ("Target Audience Targeting", "Broadcast to All Staff, Specific Departments (Engineering, Sales), or Managers."),
        ("Priority Flags", "Mark announcements as 'STANDARD', 'IMPORTANT', or 'CRITICAL' with color banners."),
        ("Instant Mobile Delivery", "Displays immediately in the employee mobile app alert inbox.")
    ], CYAN_ACCENT)

    add_card(s39, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Automated Workflow Notifications", [
        ("Approval Alerts", "Sends push alert when WFH or leave request is approved or rejected."),
        ("Late Arrival Warning", "Automated alert notifying employee when check-in crosses 09:30 AM cutoff."),
        ("Read Receipt Tracking", "Monitors which employees have read critical organization announcements.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 40: REST API Architecture & Endpoints Catalog
    # ==========================================
    s40 = add_base_slide("REST API Architecture & Endpoints Catalog", "API Architecture", 40)
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
    add_table_custom(s40, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s40, rows_s40)

    # ==========================================
    # SLIDE 41: Verification & Automated Testing Matrix
    # ==========================================
    s41 = add_base_slide("Verification & Automated Testing Matrix: 100% Pass", "Quality Assurance", 41)
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
    add_table_custom(s41, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.0), headers_s41, rows_s41)

    # ==========================================
    # SLIDE 42: Forensic Audit Trail & Regulatory Compliance
    # ==========================================
    s42 = add_base_slide("Forensic Audit Trail & Regulatory Compliance", "Forensic Integrity", 42)
    add_card(s42, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Audit Trail Architecture", [
        ("Append-Only Collection", "MongoDB `AuditLog` collection operates under strict append-only constraints; no updates or deletes permitted."),
        ("Actor Identification", "Every entry links actor ID, email, assigned role, and client IP address."),
        ("State Differential Logging", "Captures exact before-and-after JSON snapshots for all entity modifications."),
        ("Tamper-Proof Timestamps", "Server NTP timestamp assigned at insertion time.")
    ], PURPLE_ACCENT)

    add_card(s42, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Statutory & Labor Compliance", [
        ("Indian Labor Law Alignment", "Accurate records of work hours, overtime, and leave entitlements compliant with Indian Factories & Shops Acts."),
        ("Payroll Audit Readiness", "Provides forensic verification for accounting teams during wage disbursement."),
        ("Security Audit Export", "Exportable audit logs for ISO 27001 and SOC 2 enterprise compliance assessments.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 43: DevOps, Deployment & Environment Security
    # ==========================================
    s43 = add_base_slide("DevOps, Deployment & Infrastructure Security", "DevOps & Cloud", 43)
    add_card(s43, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Production Builds", [
        ("Admin Web Build", "Vite production minification producing optimized 66 kB CSS and 806 kB JS bundle with zero errors."),
        ("Mobile Export", "Expo 58 Metro bundler packaging 399 modules with full iOS & Android readiness."),
        ("Zero Comment Policy", "Strict code cleanliness standard enforced across all backend and frontend files.")
    ], CYAN_ACCENT)

    add_card(s43, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Environment Isolation", [
        ("Strict .env Separation", "Sensitive credentials (ADMIN_ID, ADMIN_PASS, JWT_SECRET, MONGO_URI) strictly managed in `.env`."),
        ("Never Committed", "Environment configuration protected by `.gitignore`."),
        ("CORS Security", "Allowed origins restricted to verified corporate domains.")
    ], BLUE_ACCENT)

    add_card(s43, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Containerization Ready", [
        ("Docker Ready", "Lightweight multi-stage Dockerfiles for Node backend and Nginx static web serving."),
        ("Healthcheck Endpoints", "Built-in `/api/health` monitoring connection pool and memory usage."),
        ("Cloud Agnostic", "Runs on AWS ECS, GCP Cloud Run, Azure App Service, or on-premise hardware.")
    ], PURPLE_ACCENT)

    # ==========================================
    # SLIDE 44: Future Roadmap & Enterprise Horizon
    # ==========================================
    s44 = add_base_slide("Future Roadmap: Advanced Enterprise Innovations", "Product Roadmap", 44)
    add_card(s44, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Phase 1: Biometrics & Geofence", [
        ("GPS Geofence Validation", "Enforce physical GPS bounding box (< 50 meters from office entrance) during QR scan."),
        ("On-Device Face ID", "Biometric verification on mobile scanner matching live facial features with employee profile photo.")
    ], CYAN_ACCENT)

    add_card(s44, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "Phase 2: AI & Analytics", [
        ("Predictive Attrition & Absenteeism", "Machine learning models detecting burnout patterns and chronic Monday/Friday absences."),
        ("Smart Shift Scheduling", "Automated roster allocation based on project demands and employee preferences.")
    ], BLUE_ACCENT)

    add_card(s44, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Phase 3: ERP Integration", [
        ("Automated Payroll Sync", "Direct webhooks to SAP, Workday, QuickBooks, and RazorpayX Payroll for seamless salary calculation."),
        ("Slack & MS Teams Bots", "1-tap leave and WFH approvals directly inside enterprise team chat channels.")
    ], GREEN_ACCENT)

    # ==========================================
    # SLIDE 45: Conclusion & Executive Deliverables Summary
    # ==========================================
    s45 = add_base_slide("Conclusion & Enterprise Deliverables Summary", "Executive Sign-Off", 45)
    add_stat_box(s45, Inches(0.8), Inches(1.6), Inches(3.7), Inches(1.3), "45 Slides", "Exhaustive Specification", CYAN_ACCENT)
    add_stat_box(s45, Inches(4.8), Inches(1.6), Inches(3.7), Inches(1.3), "14 Suites", "100% Verification Tests Passed", GREEN_ACCENT)
    add_stat_box(s45, Inches(8.8), Inches(1.6), Inches(3.7), Inches(1.3), "3 Clients", "Web, Mobile & Office Kiosk", BLUE_ACCENT)

    add_card(s45, Inches(0.8), Inches(3.2), Inches(5.7), Inches(3.6), "Key Deliverables Recap", [
        ("1. Full-Stack Codebase", "Production-verified Admin Web, Employee Mobile App, Kiosk Screen, and Express API."),
        ("2. Cryptographic Security", "Zero buddy-punching guaranteed by 18s rotating QR sessions and compound indexes."),
        ("3. Hybrid Governance", "Streamlined two-tier WFH approvals enforcing a 5/day daily quota."),
        ("4. Immutable Traceability", "Forensic audit logging for all managerial adjustments.")
    ], GREEN_ACCENT)

    add_card(s45, Inches(6.8), Inches(3.2), Inches(5.7), Inches(3.6), "Enterprise Sign-Off & Contacts", [
        ("Organization", "VorldX Industries Private Limited (CIN: U62099UP2026PTC245598)"),
        ("Headquarters", "Lucknow, Uttar Pradesh, India"),
        ("Engineering Review", "Completed & Production Verified"),
        ("Official Contact", "hello@vorldx.com  •  contact@vorldx.com"),
        ("Document Status", "Final Approved Architectural Deliverable (PDF & PPTX)")
    ], CYAN_ACCENT)

    # Save presentation
    prs.save(output_pptx)
    print(f"Successfully generated {output_pptx} with 45 detailed slides!")

if __name__ == "__main__":
    create_deck()
