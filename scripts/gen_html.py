#!/usr/bin/env python3
"""Generate a beautiful standalone HTML file matching the Next.js design."""

html = r'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>صناديق خاصة وموازنة أعضاء هيئة التدريس ومعاونيهم</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
:root {
  --primary: #0E7C7B;
  --primary-light: #14a3a2;
  --primary-dark: #095e5d;
  --primary-fg: #ffffff;
  --accent: #FFF3E0;
  --accent-fg: #E65100;
  --bg: #FCFAF5;
  --card: #ffffff;
  --border: #e2e8f0;
  --muted: #f1f5f9;
  --muted-fg: #64748b;
  --fg: #1e293b;
  --red: #ef4444;
  --red-bg: #fef2f2;
  --amber: #f59e0b;
  --amber-bg: #fffbeb;
  --green: #22c55e;
  --green-bg: #f0fdf4;
  --blue: #3b82f6;
  --blue-bg: #eff6ff;
  --radius: 12px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-lg: 0 10px 30px rgba(14,124,123,0.12);
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Cairo', system-ui, sans-serif;
  background: var(--bg);
  color: var(--fg);
  direction: rtl;
  min-height: 100vh;
}
/* Header */
.app-header {
  background: linear-gradient(135deg, #0E7C7B 0%, #14a3a2 50%, #0E7C7B 100%);
  color: #fff;
  padding: 16px 24px;
  box-shadow: 0 4px 20px rgba(14,124,123,0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.app-header h1 { font-size: 1.3rem; font-weight: 800; }
.app-header p { font-size: 0.8rem; opacity: 0.9; }
.app-header .logo-icon {
  width: 48px; height: 48px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
}
.app-header .header-left { display: flex; align-items: center; gap: 12px; }
.app-header .header-right { text-align: left; font-size: 0.75rem; opacity: 0.9; }
/* Login */
.login-overlay {
  position: fixed; inset: 0; background: rgba(14,124,123,0.1);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.login-card {
  background: #fff; border-radius: 20px; padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  width: 380px; max-width: 90vw;
}
.login-card h2 { color: var(--primary); font-size: 1.5rem; margin-bottom: 8px; }
.login-card p { color: var(--muted-fg); font-size: 0.85rem; margin-bottom: 24px; }
.login-card .field { margin-bottom: 16px; }
.login-card label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--fg); }
.login-card input {
  width: 100%; padding: 10px 14px; border: 2px solid var(--border);
  border-radius: 10px; font-family: 'Cairo'; font-size: 0.9rem;
  transition: border 0.2s;
}
.login-card input:focus { outline: none; border-color: var(--primary); }
.login-card .btn-login {
  width: 100%; padding: 12px; background: var(--primary); color: #fff;
  border: none; border-radius: 10px; font-family: 'Cairo'; font-size: 1rem;
  font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.login-card .btn-login:hover { background: var(--primary-dark); }
.login-card .hint { text-align: center; font-size: 0.75rem; color: var(--muted-fg); margin-top: 16px; }
/* Tabs */
.tabs-bar {
  display: flex; gap: 4px; padding: 8px 16px;
  background: #fff; border-bottom: 2px solid var(--border);
  overflow-x: auto; position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.tab-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 16px; border: none; background: transparent;
  font-family: 'Cairo'; font-size: 0.8rem; font-weight: 600;
  color: var(--muted-fg); cursor: pointer; border-radius: 10px;
  transition: all 0.2s; white-space: nowrap;
}
.tab-btn:hover { background: var(--muted); color: var(--fg); }
.tab-btn.active { background: var(--primary); color: #fff; }
.tab-btn .icon { font-size: 1.2rem; }
/* Main content */
.main-content { padding: 24px; max-width: 1400px; margin: 0 auto; }
.tab-content { display: none; }
.tab-content.active { display: block; animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
/* Cards */
.card {
  background: var(--card); border-radius: var(--radius);
  box-shadow: var(--shadow); overflow: hidden; margin-bottom: 20px;
}
.card-header {
  background: rgba(14,124,123,0.05);
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.card-header h3 { color: var(--primary); font-size: 1.1rem; font-weight: 700; }
.card-header p { color: var(--muted-fg); font-size: 0.8rem; margin-top: 4px; }
.card-body { padding: 20px; }
/* Form fields */
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--fg); }
.field input, .field select, .field textarea {
  width: 100%; padding: 9px 12px; border: 2px solid var(--border);
  border-radius: 8px; font-family: 'Cairo'; font-size: 0.85rem;
  background: #fff; transition: border 0.2s;
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none; border-color: var(--primary);
}
.field input[type="file"] { padding: 6px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
@media (max-width: 768px) { .grid-2,.grid-3,.grid-4 { grid-template-columns: 1fr; } }
/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border: none; border-radius: 8px;
  font-family: 'Cairo'; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-outline { background: #fff; border: 2px solid var(--border); color: var(--fg); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-danger { color: var(--red); border: 2px solid var(--red); background: #fff; }
.btn-danger:hover { background: var(--red-bg); }
.btn-sm { padding: 6px 10px; font-size: 0.75rem; }
.btn-icon { padding: 6px; min-width: 32px; }
/* Action bar */
.action-bar {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  justify-content: space-between; padding: 12px;
  background: rgba(14,124,123,0.05); border-radius: 10px; margin-bottom: 16px;
}
.action-bar .left { display: flex; flex-wrap: wrap; gap: 8px; }
/* Tables */
.data-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.data-table thead { position: sticky; top: 0; z-index: 10; }
.data-table th {
  background: var(--primary); color: #fff; padding: 8px 10px;
  text-align: center; border: 1px solid rgba(255,255,255,0.2);
  font-weight: 700; white-space: nowrap;
}
.data-table td { padding: 4px; border: 1px solid var(--border); text-align: center; }
.data-table td input, .data-table td select {
  width: 100%; border: none; padding: 4px 6px; text-align: center;
  font-family: 'Cairo'; font-size: 0.82rem; background: transparent;
  border-radius: 4px;
}
.data-table td input:focus, .data-table td select:focus {
  outline: 2px solid var(--primary); background: #fff;
}
.data-table tbody tr:nth-child(even) { background: var(--muted); }
.data-table tbody tr:hover { background: rgba(14,124,123,0.04); }
.data-table tfoot td {
  background: var(--accent); font-weight: 700; padding: 8px 10px;
  border: 1px solid var(--border);
}
.data-table .row-forfeited { background: var(--red-bg) !important; border-right: 4px solid var(--red); }
.data-table .row-forfeited td input { color: var(--red); text-decoration: line-through; font-weight: 700; }
.data-table .row-onleave { background: var(--amber-bg) !important; border-right: 4px solid var(--amber); }
.data-table .sticky-col { position: sticky; right: 0; background: inherit; z-index: 5; }
/* Report header */
.report-header {
  display: flex; align-items: stretch; justify-content: space-between; gap: 16px;
  padding: 16px; border-bottom: 4px double var(--primary); background: var(--card);
}
.report-header .logos { display: flex; align-items: center; gap: 12px; }
.report-header .logos img { height: 96px; width: 96px; object-fit: contain; }
.report-header .title { flex: 1; text-align: center; padding: 0 16px; }
.report-header .title h1 { font-size: 1.5rem; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
.report-header .title h2 { font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; }
.report-header .title h3 {
  display: inline-block; background: var(--accent); color: var(--accent-fg);
  padding: 4px 16px; border-radius: 8px; font-size: 1rem; font-weight: 700;
}
.report-header .title h4 {
  display: inline-block; background: var(--muted); color: var(--fg);
  padding: 2px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
  margin: 4px 2px; border: 1px solid var(--border);
}
.report-header .title .meta { font-size: 0.8rem; color: var(--muted-fg); margin-top: 8px; }
/* Signatures */
.signatures-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
  padding: 24px; border-top: 1px solid var(--border); background: var(--card);
}
.signatures-row .sig { display: flex; flex-direction: column; align-items: center; text-align: center; }
.signatures-row .sig .line { width: 100%; border-bottom: 2px solid var(--fg); margin-bottom: 8px; height: 48px; }
.signatures-row .sig .label { font-size: 0.85rem; font-weight: 700; }
.signatures-row .sig .name { font-size: 0.8rem; color: var(--muted-fg); }
@media(max-width:768px){ .signatures-row { grid-template-columns: 1fr; } }
/* Dialog/Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal-card {
  background: #fff; border-radius: 16px; width: 100%; max-width: 800px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { color: var(--primary); font-size: 1.2rem; }
.modal-body { padding: 20px; }
.modal-footer { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--muted-fg); }
/* Badges */
.badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
.badge-green { background: var(--green-bg); color: #15803d; }
.badge-amber { background: var(--amber-bg); color: #b45309; }
.badge-red { background: var(--red-bg); color: #b91c1c; }
.badge-blue { background: var(--blue-bg); color: #1d4ed8; }
.badge-outline { background: #fff; border: 1px solid var(--border); color: var(--fg); }
/* Sub-tabs */
.sub-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
.sub-tab {
  padding: 8px 20px; border: none; background: var(--muted);
  font-family: 'Cairo'; font-size: 0.85rem; font-weight: 600;
  color: var(--muted-fg); cursor: pointer; border-radius: 8px 8px 0 0;
  transition: all 0.2s;
}
.sub-tab.active { background: var(--primary); color: #fff; }
/* Stat cards */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.stat-card { border: 2px solid; border-radius: 10px; padding: 12px; text-align: center; }
.stat-card .num { font-size: 1.5rem; font-weight: 800; }
.stat-card .lbl { font-size: 0.75rem; }
.stat-card.green { border-color: var(--green); background: var(--green-bg); }
.stat-card.green .num, .stat-card.green .lbl { color: #15803d; }
.stat-card.amber { border-color: var(--amber); background: var(--amber-bg); }
.stat-card.amber .num, .stat-card.amber .lbl { color: #b45309; }
.stat-card.red { border-color: var(--red); background: var(--red-bg); }
.stat-card.red .num, .stat-card.red .lbl { color: #b91c1c; }
.stat-card.blue { border-color: var(--blue); background: var(--blue-bg); }
.stat-card.blue .num, .stat-card.blue .lbl { color: #1d4ed8; }
/* Radio */
.radio-group { display: flex; gap: 16px; }
.radio-item { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
.radio-item:hover { background: var(--muted); }
.radio-item input { width: auto; }
/* Checkbox list */
.check-list { border: 1px solid var(--border); border-radius: 8px; max-height: 200px; overflow-y: auto; }
.check-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); cursor: pointer; }
.check-item:hover { background: var(--muted); }
.check-item input { width: auto; }
.check-item.selected { background: var(--red-bg); border-color: var(--red); }
/* Logo upload */
.logo-upload { border: 2px dashed var(--primary); border-radius: 12px; padding: 16px; text-align: center; min-height: 128px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.logo-upload img { height: 80px; max-width: 100%; object-fit: contain; }
.logo-upload .upload-btn { background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
/* Toast */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; border-radius: 10px; font-family: 'Cairo'; font-size: 0.9rem; font-weight: 600; z-index: 9999; animation: slideUp 0.3s; }
.toast.success { background: var(--green); color: #fff; }
.toast.error { background: var(--red); color: #fff; }
.toast.info { background: var(--blue); color: #fff; }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
/* Print */
@media print {
  .app-header, .tabs-bar, .action-bar, .no-print { display: none !important; }
  body { background: #fff; }
  .main-content { padding: 0; max-width: 100%; }
  .card { box-shadow: none; border: 1px solid #ccc; }
}
/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--muted); border-radius: 4px; }
::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary-dark); }
/* Footer */
.app-footer { background: var(--primary); color: #fff; padding: 12px 24px; text-align: center; font-size: 0.8rem; margin-top: 40px; }
.app-footer p { opacity: 0.9; }
</style>
</head>
<body>

<!-- Login -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-card">
    <div style="text-align:center;margin-bottom:20px">
      <div style="width:64px;height:64px;background:var(--primary);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:2rem;color:#fff">🛡️</div>
    </div>
    <h2>تسجيل الدخول</h2>
    <p>صناديق خاصة وموازنة أعضاء هيئة التدريس ومعاونيهم</p>
    <div class="field">
      <label>اسم المستخدم</label>
      <input type="text" id="loginUser" value="admin" placeholder="admin">
    </div>
    <div class="field">
      <label>كلمة المرور</label>
      <input type="password" id="loginPass" value="admin123" placeholder="admin123">
    </div>
    <button class="btn-login" onclick="doLogin()">دخول</button>
    <div class="hint">المستخدم الافتراضي: admin / كلمة المرور: admin123</div>
  </div>
</div>

<!-- Header -->
<header class="app-header no-print">
  <div class="header-left">
    <div class="logo-icon">🛡️</div>
    <div>
      <h1>صناديق خاصة وموازنة أعضاء هيئة التدريس ومعاونيهم</h1>
      <p id="headerSubtitle">كلية الحاسبات والذكاء الاصطناعي - جامعة بني سويف</p>
    </div>
  </div>
  <div class="header-right">
    <p>تصميم: أ. هشام محمد عيد عبد السلام</p>
    <p id="headerYear">مدير الكلية</p>
    <button onclick="logout()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:4px 12px;border-radius:6px;cursor:pointer;font-family:Cairo;font-size:0.75rem;margin-top:4px">خروج</button>
  </div>
</header>

<!-- Tabs -->
<nav class="tabs-bar no-print">
  <button class="tab-btn active" onclick="switchTab('settings',this)"><span class="icon">⚙️</span><span>الإعدادات</span></button>
  <button class="tab-btn" onclick="switchTab('users',this)"><span class="icon">👥</span><span>مدير النظام</span></button>
  <button class="tab-btn" onclick="switchTab('leaves',this)"><span class="icon">📅</span><span>الإجازات</span></button>
  <button class="tab-btn" onclick="switchTab('data',this)"><span class="icon">📊</span><span>الداتا</span></button>
  <button class="tab-btn" onclick="switchTab('reports',this)"><span class="icon">📄</span><span>التقارير</span></button>
  <button class="tab-btn" onclick="switchTab('comparison',this)"><span class="icon">🔍</span><span>المقارنة</span></button>
</nav>

<!-- Main Content -->
<main class="main-content">
  <div id="tab-settings" class="tab-content active"></div>
  <div id="tab-users" class="tab-content"></div>
  <div id="tab-leaves" class="tab-content"></div>
  <div id="tab-data" class="tab-content"></div>
  <div id="tab-reports" class="tab-content"></div>
  <div id="tab-comparison" class="tab-content"></div>
</main>

<!-- Footer -->
<footer class="app-footer no-print">
  <p>برنامج صناديق خاصة وموازنة أعضاء هيئة التدريس ومعاونيهم</p>
  <p style="opacity:0.8">تصميم: أ. هشام محمد عيد عبد السلام - مدير كلية الحاسبات والذكاء الاصطناعي - جامعة بني سويف</p>
</footer>

<script>
// ============ DATA STORAGE ============
const STORE = {
  get(key, def) { try { return JSON.parse(localStorage.getItem('sp_'+key)) ?? def; } catch { return def; } },
  set(key, val) { localStorage.setItem('sp_'+key, JSON.stringify(val)); }
};
// Default setting
const DEFAULT_SETTING = {
  universityName:'جامعة بني سويف', facultyName:'كلية الحاسبات والذكاء الاصطناعي',
  deanName:'', directorName:'هشام محمد عيد عبد السلام', assistantDirectorName:'',
  cadreOfficerName:'', financialAffairsOfficerName:'',
  administrationName:'', jobName:'', degreeName:'',
  academicYear:'2025/2026', month:'', day:'',
  universityLogo:'', facultyLogo:'',
  universityLogoPosition:'right', facultyLogoPosition:'right',
  currentReportName:'صناديق خاصة أعضاء هيئة التدريس ومعاونيهم',
  reportNames:'[]', signatures:JSON.stringify([{label:'عميد الكلية',name:''},{label:'مدير الكلية',name:''},{label:'مسئول الشئون المالي',name:''}]),
  forfeitingLeaveTypes:JSON.stringify(['بدون مرتب'])
};
const DEFAULT_DD = {
  degrees:['أستاذ','أستاذ مساعد','مدرس','معيد','محاضر','مساعد باحث'],
  jobs:['أستاذ','أستاذ مساعد','مدرس','معيد','إداري','فني'],
  administrations:['شئون أعضاء هيئة التدريس','شئون المعاونين','البعثات','الأبحاث','الدراسات العليا'],
  leave_types:['اعتيادية','مرضية','خاصة','وضع','بدون مرتب','ساعة','مهمة علمية'],
  reward_types:['جودة','تدريس','ساعات زائدة','فروق 90 يوم','200%'],
  reward_categories:['مكافأة الجودة','مكافأة التدريس','الساعات الزائدة','فروق 90 يوم','الـ 200%'],
  report_names:['صناديق خاصة أعضاء هيئة التدريس ومعاونيهم','موازنة أعضاء هيئة التدريس ومعاونيهم','تقرير الإجازات','تقرير المكافآت'],
  cadre_officers:[]
};
const FUNDS_COLS = [
  {key:'serial',header:'م',type:'text'},{key:'code',header:'رمزه م',type:'text'},
  {key:'basic',header:'الأساسي',type:'number'},{key:'bound',header:'المربوط',type:'number'},
  {key:'exchangeNo',header:'رقم الصرف',type:'text'},{key:'name',header:'الاسم',type:'text'},
  {key:'administration',header:'الإدارة',type:'dropdown'},{key:'degree',header:'الدرجة',type:'dropdown'},
  {key:'job',header:'الوظيفة',type:'dropdown'},{key:'nationalId',header:'الرقم القومي',type:'text'},
  {key:'qualityReward',header:'مكافأة الجودة',type:'number'},{key:'extraHours',header:'الساعات الزائدة',type:'number'},
  {key:'diff90',header:'فروق 90 يوم',type:'number'},{key:'total',header:'الإجمالي',type:'number'}
];
const BUDGET_COLS = [
  {key:'code',header:'م',type:'text'},
  {key:'basic',header:'الأساسي',type:'number'},{key:'bound',header:'المربوط',type:'number'},
  {key:'exchangeNo',header:'رقم الصرف',type:'text'},{key:'name',header:'الاسم',type:'text'},
  {key:'administration',header:'الإدارة',type:'dropdown'},{key:'degree',header:'الدرجة',type:'dropdown'},
  {key:'job',header:'الوظيفة',type:'dropdown'},{key:'nationalId',header:'الرقم القومي',type:'text'},
  {key:'teachingReward',header:'مكافأة تدريس',type:'number'},{key:'percent200',header:'الـ 200%',type:'number'},
  {key:'total',header:'الإجمالي',type:'number'}
];
const DD_MAP = {administration:'administrations',degree:'degrees',job:'jobs'};
const REWARD_KEYS = ['qualityReward','extraHours','diff90','teachingReward','percent200'];
const MONTHS = ['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ============ UTILS ============
function toast(msg, type='success') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
function parseNum(v) { v = String(v||'').replace(/[^\d.-]/g,''); const n = parseFloat(v); return isNaN(n)?0:n; }
function fmtNum(v) { return parseNum(v).toLocaleString('en-US',{maximumFractionDigits:2}); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function newMember(kind) {
  return {kind,serial:'',code:'',basic:'',bound:'',basicSalary:'',exchangeNo:'',name:'',administration:'',degree:'',job:'',nationalId:'',qualityReward:'',extraHours:'',diff90:'',teachingReward:'',percent200:'',total:'',extraColumns:'{}',order:0};
}
function computeTotal(m, kind) {
  if (kind==='funds') return parseNum(m.qualityReward)+parseNum(m.extraHours)+parseNum(m.diff90);
  return parseNum(m.teachingReward)+parseNum(m.percent200);
}
function getForfeitingTypes() { try { return JSON.parse(getSetting().forfeitingLeaveTypes||'["بدون مرتب"]'); } catch { return ['بدون مرتب']; } }
function getSetting() { return {...DEFAULT_SETTING, ...STORE.get('setting',{})}; }
function saveSetting(s) { STORE.set('setting', s); }
function getDD(key) { const dd = STORE.get('dropdowns', {}); return dd[key] || DEFAULT_DD[key] || []; }
function setDD(key, val) { const dd = STORE.get('dropdowns', {}); dd[key] = val; STORE.set('dropdowns', dd); }
function getMembers(kind) { return STORE.get('members_'+kind, []); }
function setMembers(kind, arr) { STORE.set('members_'+kind, arr); }
function getLeaves() { return STORE.get('leaves', []); }
function setLeaves(arr) { STORE.set('leaves', arr); }
function getUsers() { return STORE.get('users', [{id:'1',name:'هشام محمد عيد عبد السلام',username:'admin',password:'admin123',role:'admin',permissions:'{}',active:true}]); }
function setUsers(arr) { STORE.set('users', arr); }
function getRewards() { return STORE.get('rewards', []); }
function setRewards(arr) { STORE.set('rewards', arr); }
function getComparisons() { return STORE.get('comparisons', []); }
function setComparisons(arr) { STORE.set('comparisons', arr); }
function checkForfeited(member) {
  const s = getSetting();
  if (!s.month) return false;
  const leaves = getLeaves().filter(l => l.doctorName === member.name);
  if (!leaves.length) return false;
  const mi = MONTHS.indexOf(s.month);
  if (mi < 0) return false;
  const ym = (s.academicYear||'').match(/^(\d{4})/);
  const yr = ym ? parseInt(ym[1]) : new Date().getFullYear();
  const ft = getForfeitingTypes();
  for (const py of [yr, yr+1]) {
    const ps = new Date(py, mi, 1), pe = new Date(py, mi+1, 0, 23, 59, 59);
    for (const l of leaves) {
      if (!l.fromDate || !l.toDate) continue;
      const f = new Date(l.fromDate), t = new Date(l.toDate);
      if (f <= pe && t >= ps && ft.includes(l.leaveType)) return true;
    }
  }
  return false;
}
function checkOnLeave(member) {
  const s = getSetting();
  if (!s.month) return false;
  const leaves = getLeaves().filter(l => l.doctorName === member.name);
  if (!leaves.length) return false;
  const mi = MONTHS.indexOf(s.month);
  if (mi < 0) return false;
  const ym = (s.academicYear||'').match(/^(\d{4})/);
  const yr = ym ? parseInt(ym[1]) : new Date().getFullYear();
  for (const py of [yr, yr+1]) {
    const ps = new Date(py, mi, 1), pe = new Date(py, mi+1, 0, 23, 59, 59);
    for (const l of leaves) {
      if (!l.fromDate || !l.toDate) continue;
      const f = new Date(l.fromDate), t = new Date(l.toDate);
      if (f <= pe && t >= ps) return true;
    }
  }
  return false;
}
function renderReportHeader(reportName) {
  const s = getSetting();
  let extra = []; try { extra = JSON.parse(s.reportNames||'[]'); } catch {}
  const isAuto = n => n && (n.includes('صناديق') || n.includes('موازنة'));
  const line4 = extra.filter(n => n && n !== reportName && !isAuto(n));
  let logosR = '', logosL = '';
  const uniLogo = s.universityLogo ? `<img src="${s.universityLogo}" alt="جامعة">` : '';
  const facLogo = s.facultyLogo ? `<img src="${s.facultyLogo}" alt="كلية">` : '';
  const uniPos = s.universityLogoPosition || 'right';
  const facPos = s.facultyLogoPosition || 'right';
  if (uniPos === facPos) {
    const both = `<div class="logos">${uniLogo}${facLogo}</div>`;
    if (uniPos === 'right') { logosR = both; } else { logosL = both; }
  } else {
    if (uniPos === 'right') { logosR = `<div class="logos">${uniLogo}</div>`; logosL = `<div class="logos">${facLogo}</div>`; }
    else { logosR = `<div class="logos">${facLogo}</div>`; logosL = `<div class="logos">${uniLogo}</div>`; }
  }
  const h4 = line4.length ? `<div style="margin-top:8px">${line4.map((n,i)=>`<h4>${esc(n)}${i<line4.length-1?' •':''}</h4>`).join('')}</div>` : '';
  return `<div class="report-header">
    ${logosR}
    <div class="title">
      <h1>${esc(s.universityName)}</h1>
      <h2>${esc(s.facultyName)}</h2>
      <h3>${esc(reportName)}</h3>
      ${h4}
      <div class="meta">العام: ${esc(s.academicYear)}${s.month?' &nbsp; شهر: '+esc(s.month):''}${s.day?' &nbsp; اليوم: '+esc(s.day):''}</div>
    </div>
    ${logosL}
  </div>`;
}
function renderSignatures() {
  const s = getSetting();
  let sigs = []; try { sigs = JSON.parse(s.signatures||'[]'); } catch {}
  if (!sigs.length) return '';
  return `<div class="signatures-row">${sigs.map(sig => `<div class="sig"><div class="line"></div><div class="label">${esc(sig.label)}</div>${sig.name?`<div class="name">${esc(sig.name)}</div>`:''}</div>`).join('')}</div>`;
}
function editableDD(key, val, onChange, placeholder='اختر') {
  const opts = getDD(key);
  const id = 'dd_' + key + '_' + Math.random().toString(36).slice(2,6);
  setTimeout(() => {
    const sel = document.getElementById(id);
    if (sel) sel.onchange = () => onChange(sel.value);
  }, 0);
  return `<select id="${id}" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-family:Cairo;font-size:0.82rem;background:#fff">
    <option value="">${placeholder}</option>
    ${opts.map(o => `<option value="${esc(o)}" ${o===val?'selected':''}>${esc(o)}</option>`).join('')}
  </select>`;
}

// ============ LOGIN ============
function doLogin() {
  const u = document.getElementById('loginUser').value;
  const p = document.getElementById('loginPass').value;
  const users = getUsers();
  const user = users.find(x => x.username === u && x.password === p && x.active);
  if (user) {
    STORE.set('session', {name: user.name, username: user.username, role: user.role});
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('headerYear').textContent = 'مدير الكلية - العام: ' + getSetting().academicYear;
    document.getElementById('headerSubtitle').textContent = getSetting().universityName + ' - ' + getSetting().facultyName;
    renderAll();
  } else {
    toast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
  }
}
function logout() {
  STORE.set('session', null);
  document.getElementById('loginOverlay').style.display = 'flex';
}
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if (btn) btn.classList.add('active');
}
function renderAll() {
  renderSettings();
  renderUsers();
  renderLeaves();
  renderData();
  renderReports();
  renderComparison();
}
// ============ SETTINGS ============
function renderSettings() {
  const s = getSetting();
  const dd = (key, val, ph='اختر') => {
    const opts = getDD(key);
    return `<select onchange="updateSetting('${key}',this.value)" style="width:100%;padding:9px 12px;border:2px solid var(--border);border-radius:8px;font-family:Cairo;font-size:0.85rem;background:#fff">
      <option value="">${ph}</option>${opts.map(o=>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  };
  let sigs = []; try { sigs = JSON.parse(s.signatures||'[]'); } catch {}
  let ft = []; try { ft = JSON.parse(s.forfeitingLeaveTypes||'[]'); } catch {}
  const leaveTypes = getDD('leave_types');
  document.getElementById('tab-settings').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:1.5rem;font-weight:800;color:var(--primary)">الإعدادات العامة</h2>
      <p style="color:var(--muted-fg);font-size:0.85rem">بيانات الكلية والشعارات والترويسة</p></div>
      <button class="btn btn-primary" onclick="saveSettingsBtn()">💾 حفظ الإعدادات</button>
    </div>
    <div class="card"><div class="card-header"><h3>📋 بيانات الجامعة والكلية</h3></div><div class="card-body">
      <div class="grid-2">
        <div class="field"><label>اسم الجامعة</label><input value="${esc(s.universityName)}" onchange="updateSetting('universityName',this.value)"></div>
        <div class="field"><label>اسم الكلية</label><input value="${esc(s.facultyName)}" onchange="updateSetting('facultyName',this.value)"></div>
        <div class="field"><label>اسم عميد الكلية</label><input value="${esc(s.deanName)}" onchange="updateSetting('deanName',this.value)"></div>
        <div class="field"><label>اسم مدير الكلية</label><input value="${esc(s.directorName)}" onchange="updateSetting('directorName',this.value)"></div>
        <div class="field"><label>اسم مساعد مدير الكلية</label><input value="${esc(s.assistantDirectorName)}" onchange="updateSetting('assistantDirectorName',this.value)"></div>
        <div class="field"><label>اسم مسئول الكادر (قائمة)</label>${dd('cadre_officers',s.cadreOfficerName,'اختر مسئول الكادر')}</div>
        <div class="field"><label>اسم مسئول الشئون المالية</label><input value="${esc(s.financialAffairsOfficerName)}" onchange="updateSetting('financialAffairsOfficerName',this.value)"></div>
        <div class="field"><label>العام</label><input value="${esc(s.academicYear)}" onchange="updateSetting('academicYear',this.value)" placeholder="2025/2026"></div>
        <div class="field"><label>الشهر</label><select onchange="updateSetting('month',this.value)" style="width:100%;padding:9px 12px;border:2px solid var(--border);border-radius:8px;font-family:Cairo"><option value="">اختر الشهر</option>${MONTHS.map(m=>`<option ${m===s.month?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="field"><label>اليوم</label><input value="${esc(s.day)}" onchange="updateSetting('day',this.value)" placeholder="مثال: الأحد"></div>
        <div class="field"><label>اسم الإدارة (قائمة)</label>${dd('administrations',s.administrationName,'اختر الإدارة')}</div>
        <div class="field"><label>الوظيفة (قائمة)</label>${dd('jobs',s.jobName,'اختر الوظيفة')}</div>
        <div class="field"><label>الدرجة (قائمة)</label>${dd('degrees',s.degreeName,'اختر الدرجة')}</div>
      </div>
    </div></div>
    <div class="card"><div class="card-header"><h3>🏷️ شعار الجامعة والكلية</h3></div><div class="card-body">
      <div class="grid-3">
        <div>
          <div class="logo-upload" id="logoUniUpload">
            ${s.universityLogo?`<img src="${s.universityLogo}" alt="شعار الجامعة">`:'<span style="font-size:3rem;color:var(--muted-fg)">🖼️</span>'}
            <label class="upload-btn">رفع<input type="file" accept="image/*" style="display:none" onchange="uploadLogo('universityLogo',this)"></label>
            ${s.universityLogo?`<button class="btn btn-sm btn-danger" onclick="updateSetting('universityLogo','');renderSettings()">حذف</button>`:''}
          </div>
          <div style="margin-top:8px"><label style="font-size:0.8rem;font-weight:600">مكان شعار الجامعة</label>
          <div class="radio-group" style="margin-top:4px">
            <label class="radio-item"><input type="radio" name="uniPos" value="right" ${s.universityLogoPosition!=='left'?'checked':''} onchange="updateSetting('universityLogoPosition',this.value);renderSettings()"> أقصى اليمين</label>
            <label class="radio-item"><input type="radio" name="uniPos" value="left" ${s.universityLogoPosition==='left'?'checked':''} onchange="updateSetting('universityLogoPosition',this.value);renderSettings()"> أقصى الشمال</label>
          </div></div>
        </div>
        <div>
          <div class="logo-upload" id="logoFacUpload">
            ${s.facultyLogo?`<img src="${s.facultyLogo}" alt="شعار الكلية">`:'<span style="font-size:3rem;color:var(--muted-fg)">🖼️</span>'}
            <label class="upload-btn">رفع<input type="file" accept="image/*" style="display:none" onchange="uploadLogo('facultyLogo',this)"></label>
            ${s.facultyLogo?`<button class="btn btn-sm btn-danger" onclick="updateSetting('facultyLogo','');renderSettings()">حذف</button>`:''}
          </div>
          <div style="margin-top:8px"><label style="font-size:0.8rem;font-weight:600">مكان شعار الكلية</label>
          <div class="radio-group" style="margin-top:4px">
            <label class="radio-item"><input type="radio" name="facPos" value="right" ${s.facultyLogoPosition!=='left'?'checked':''} onchange="updateSetting('facultyLogoPosition',this.value);renderSettings()"> أقصى اليمين</label>
            <label class="radio-item"><input type="radio" name="facPos" value="left" ${s.facultyLogoPosition==='left'?'checked':''} onchange="updateSetting('facultyLogoPosition',this.value);renderSettings()"> أقصى الشمال</label>
          </div></div>
        </div>
        <div style="border:2px solid var(--primary);border-radius:12px;overflow:hidden;background:#fff">
          ${renderReportHeader(s.currentReportName)}
          ${renderSignatures()}
        </div>
      </div>
    </div></div>
    <div class="card"><div class="card-header"><h3>📝 اسم/أسماء التقرير في الترويسة</h3></div><div class="card-body">
      <div class="field"><label>اختر اسم التقرير الحالي</label>${dd('report_names',s.currentReportName,'اختر اسم التقرير')}</div>
    </div></div>
    <div class="card"><div class="card-header"><h3>✍️ التوقيعات تحت الشيت</h3></div><div class="card-body">
      <div id="sigsList">${sigs.map((sig,i)=>`
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
          <input style="flex:1;padding:8px;border:2px solid var(--border);border-radius:8px;font-family:Cairo" value="${esc(sig.label)}" placeholder="عنوان التوقيع" onchange="updateSig(${i},'label',this.value)">
          <input style="flex:1;padding:8px;border:2px solid var(--border);border-radius:8px;font-family:Cairo" value="${esc(sig.name)}" placeholder="الاسم (اختياري)" onchange="updateSig(${i},'name',this.value)">
          <button class="btn btn-icon btn-danger" onclick="delSig(${i})">🗑️</button>
        </div>`).join('')}</div>
      <button class="btn btn-outline btn-sm" onclick="addSig()">➕ إضافة توقيع</button>
    </div></div>
    <div class="card"><div class="card-header"><h3>🚫 أنواع الإجازات الحرمانية من المكافآت</h3></div><div class="card-body">
      <div class="check-list">
        ${leaveTypes.map(lt => `
          <label class="check-item ${ft.includes(lt)?'selected':''}">
            <input type="checkbox" ${ft.includes(lt)?'checked':''} onchange="toggleForfeit('${esc(lt)}',this.checked)">
            <span style="flex:1;font-size:0.85rem">${esc(lt)}</span>
            ${ft.includes(lt)?'<span class="badge badge-red">حرمان</span>':''}
          </label>`).join('')}
      </div>
    </div></div>
    <div class="card"><div class="card-header"><h3>💰 مكافآت الدرجات والوظائف</h3></div><div class="card-body" id="rewardsCard">
      ${renderRewardsForm()}
    </div></div>
  `;
}
function updateSetting(k,v) { const s=getSetting(); s[k]=v; saveSetting(s); }
function saveSettingsBtn() { toast('تم حفظ الإعدادات بنجاح'); document.getElementById('headerSubtitle').textContent=getSetting().universityName+' - '+getSetting().facultyName; document.getElementById('headerYear').textContent='مدير الكلية - العام: '+getSetting().academicYear; }
function uploadLogo(key, input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => { updateSetting(key, reader.result); renderSettings(); toast('تم تحميل الشعار'); };
  reader.readAsDataURL(file);
}
function addSig() { const s=getSetting(); let sigs=[]; try{sigs=JSON.parse(s.signatures||'[]')}catch{} sigs.push({label:'',name:''}); s.signatures=JSON.stringify(sigs); saveSetting(s); renderSettings(); }
function delSig(i) { const s=getSetting(); let sigs=[]; try{sigs=JSON.parse(s.signatures||'[]')}catch{} sigs.splice(i,1); s.signatures=JSON.stringify(sigs); saveSetting(s); renderSettings(); }
function updateSig(i,k,v) { const s=getSetting(); let sigs=[]; try{sigs=JSON.parse(s.signatures||'[]')}catch{} sigs[i][k]=v; s.signatures=JSON.stringify(sigs); saveSetting(s); }
function toggleForfeit(type, checked) {
  const s=getSetting(); let ft=[]; try{ft=JSON.parse(s.forfeitingLeaveTypes||'[]')}catch{}
  if(checked && !ft.includes(type)) ft.push(type);
  if(!checked) ft=ft.filter(t=>t!==type);
  s.forfeitingLeaveTypes=JSON.stringify(ft); saveSetting(s); renderSettings();
}
function renderRewardsForm() {
  const rewards = getRewards();
  const cats = getDD('reward_categories');
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:12px;align-items:end">
      <div><label style="font-size:0.75rem;font-weight:600">مبني على</label><select id="rwType" style="width:100%;padding:6px;border:2px solid var(--border);border-radius:6px;font-family:Cairo"><option value="degree">الدرجة</option><option value="job">الوظيفة</option></select></div>
      <div><label style="font-size:0.75rem;font-weight:600">الدرجة/الوظيفة</label><select id="rwName" style="width:100%;padding:6px;border:2px solid var(--border);border-radius:6px;font-family:Cairo"><option value="">اختر</option>${getDD('degrees').concat(getDD('jobs')).map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>
      <div><label style="font-size:0.75rem;font-weight:600">نوع المكافأة</label><select id="rwRT" style="width:100%;padding:6px;border:2px solid var(--border);border-radius:6px;font-family:Cairo"><option value="fixed">مبلغ مقطوع</option><option value="percent">نسبة % من الأساسي</option></select></div>
      <div><label style="font-size:0.75rem;font-weight:600">البند</label><select id="rwCat" style="width:100%;padding:6px;border:2px solid var(--border);border-radius:6px;font-family:Cairo"><option value="">اختر</option>${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
      <div><label style="font-size:0.75rem;font-weight:600">القيمة</label><input id="rwAmt" type="number" style="width:80px;padding:6px;border:2px solid var(--border);border-radius:6px;font-family:Cairo" placeholder="0"></div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="addReward()">➕ حفظ المكافأة</button>
    <div style="margin-top:16px;max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
      <table class="data-table"><thead><tr><th>مبني على</th><th>الدرجة/الوظيفة</th><th>البند</th><th>النوع</th><th>القيمة</th><th>حذف</th></tr></thead><tbody>
        ${rewards.map(r=>`<tr><td><span class="badge badge-outline">${r.type==='degree'?'الدرجة':'الوظيفة'}</span></td><td style="font-weight:600">${esc(r.name)}</td><td>${esc(r.category)}</td><td>${r.rewardType==='percent'?'<span class="badge badge-blue">نسبة %</span>':'<span class="badge badge-amber">مبلغ</span>'}</td><td style="font-weight:700;font-family:monospace">${r.rewardType==='percent'?r.amount+'%':fmtNum(r.amount)}</td><td><button class="btn btn-icon btn-danger" onclick="delReward('${r.id}')">🗑️</button></td></tr>`).join('')}
      </tbody></table>
    </div>`;
}
function addReward() {
  const rw = {id:Date.now().toString(), type:document.getElementById('rwType').value, name:document.getElementById('rwName').value, category:document.getElementById('rwCat').value, rewardType:document.getElementById('rwRT').value, amount:document.getElementById('rwAmt').value};
  if(!rw.name||!rw.category){toast('اختر الدرجة/الوظيفة والبند','error');return;}
  const arr=getRewards(); arr.push(rw); setRewards(arr); document.getElementById('rewardsCard').innerHTML=renderRewardsForm(); toast('تمت إضافة المكافأة');
}
function delReward(id) { setRewards(getRewards().filter(r=>r.id!==id)); document.getElementById('rewardsCard').innerHTML=renderRewardsForm(); toast('تم الحذف'); }

// ============ USERS ============
function renderUsers() {
  const users = getUsers();
  document.getElementById('tab-users').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:1.5rem;font-weight:800;color:var(--primary)">مدير النظام والعاملين</h2>
      <p style="color:var(--muted-fg);font-size:0.85rem">إدارة المستخدمين والصلاحيات</p></div>
      <button class="btn btn-primary" onclick="openUserModal()">➕ إضافة مستخدم</button>
    </div>
    <div class="card"><div class="card-body">
      <table class="data-table"><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>
        ${users.map(u=>`<tr><td style="font-weight:600">${esc(u.name)}</td><td style="color:var(--muted-fg)">${esc(u.username)}</td><td><span class="badge ${u.role==='admin'?'badge-red':u.role==='manager'?'badge-blue':'badge-outline'}">${u.role==='admin'?'مدير النظام':u.role==='manager'?'مدير':'مشاهد'}</span></td><td>${u.active?'<span class="badge badge-green">نشط</span>':'<span class="badge badge-red">موقوف</span>'}</td><td><button class="btn btn-icon btn-outline" onclick="openUserModal('${u.id}')">✏️</button> <button class="btn btn-icon btn-danger" onclick="delUser('${u.id}')">🗑️</button></td></tr>`).join('')}
      </tbody></table>
    </div></div>
    <div id="userModalContainer"></div>`;
}
function openUserModal(id) {
  const users = getUsers();
  const u = id ? users.find(x=>x.id===id) : {id:'',name:'',username:'',password:'',role:'viewer',permissions:'{}',active:true};
  document.getElementById('userModalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
      <div class="modal-card">
        <div class="modal-header"><h3>${id?'تعديل مستخدم':'إضافة مستخدم'}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="field"><label>الاسم</label><input id="uName" value="${esc(u.name)}"></div>
            <div class="field"><label>اسم المستخدم</label><input id="uUser" value="${esc(u.username)}"></div>
            <div class="field"><label>كلمة المرور</label><input id="uPass" type="password" value="${esc(u.password)}"></div>
            <div class="field"><label>الدور</label><select id="uRole" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"><option value="admin" ${u.role==='admin'?'selected':''}>مدير النظام</option><option value="manager" ${u.role==='manager'?'selected':''}>مدير</option><option value="viewer" ${u.role==='viewer'?'selected':''}>مشاهد</option></select></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إلغاء</button><button class="btn btn-primary" onclick="saveUser('${id||''}')">حفظ</button></div>
      </div>
    </div>`;
}
function saveUser(id) {
  const name=document.getElementById('uName').value, username=document.getElementById('uUser').value, password=document.getElementById('uPass').value, role=document.getElementById('uRole').value;
  if(!name||!username){toast('أدخل الاسم واسم المستخدم','error');return;}
  const users=getUsers();
  if(id){const i=users.findIndex(u=>u.id===id);users[i]={...users[i],name,username,password,role};}
  else{users.push({id:Date.now().toString(),name,username,password,role,permissions:'{}',active:true});}
  setUsers(users); document.getElementById('userModalContainer').innerHTML=''; renderUsers(); toast(id?'تم التعديل':'تمت الإضافة');
}
function delUser(id) { if(!confirm('حذف المستخدم؟'))return; setUsers(getUsers().filter(u=>u.id!==id)); renderUsers(); toast('تم الحذف'); }

// ============ LEAVES ============
function renderLeaves() {
  const leaves = getLeaves();
  const members = getMembers('funds');
  document.getElementById('tab-leaves').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:1.5rem;font-weight:800;color:var(--primary)">إجازات أعضاء هيئة التدريس ومعاونيهم</h2>
      <p style="color:var(--muted-fg);font-size:0.85rem">إدارة الإجازات والمكافآت بشروط مرنة</p></div>
      <button class="btn btn-primary" onclick="openLeaveModal()">➕ إضافة إجازة</button>
    </div>
    <div class="card"><div class="card-body">
      <table class="data-table"><thead><tr><th>الدكتور</th><th>نوع الإجازة</th><th>من</th><th>إلى</th><th>الدرجة</th><th>إجراءات</th></tr></thead><tbody>
        ${leaves.length?leaves.map(l=>`<tr><td style="font-weight:600">${esc(l.doctorName)}</td><td><span class="badge badge-outline">${esc(l.leaveType)}</span></td><td style="color:var(--muted-fg)">${esc(l.fromDate)}</td><td style="color:var(--muted-fg)">${esc(l.toDate)}</td><td>${esc(l.degree)}</td><td><button class="btn btn-icon btn-outline" onclick="openLeaveModal('${l.id}')">✏️</button> <button class="btn btn-icon btn-danger" onclick="delLeave('${l.id}')">🗑️</button></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted-fg)">لا توجد إجازات مسجلة</td></tr>'}
      </tbody></table>
    </div></div>
    <div id="leaveModalContainer"></div>`;
}
function openLeaveModal(id) {
  const leaves=getLeaves(); const l=id?leaves.find(x=>x.id===id):{id:'',doctorName:'',leaveType:'',fromDate:'',toDate:'',degree:'',conditions:'[]',notes:''};
  const members=getMembers('funds');
  document.getElementById('leaveModalContainer').innerHTML=`
    <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
      <div class="modal-card">
        <div class="modal-header"><h3>${id?'تعديل إجازة':'إضافة إجازة'}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="field"><label>اسم الدكتور</label><select id="lDoctor" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"><option value="">اختر</option>${members.map(m=>`<option ${m.name===l.doctorName?'selected':''}>${esc(m.name)}</option>`).join('')}</select></div>
            <div class="field"><label>نوع الإجازة</label><select id="lType" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"><option value="">اختر</option>${getDD('leave_types').map(t=>`<option ${t===l.leaveType?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
            <div class="field"><label>من تاريخ</label><input id="lFrom" type="date" value="${esc(l.fromDate)}" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"></div>
            <div class="field"><label>إلى تاريخ</label><input id="lTo" type="date" value="${esc(l.toDate)}" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"></div>
            <div class="field"><label>الدرجة</label><select id="lDegree" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"><option value="">اختر</option>${getDD('degrees').map(d=>`<option ${d===l.degree?'selected':''}>${esc(d)}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>ملاحظات</label><input id="lNotes" value="${esc(l.notes)}" style="width:100%;padding:9px;border:2px solid var(--border);border-radius:8px"></div>
        </div>
        <div class="modal-footer"><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إلغاء</button><button class="btn btn-primary" onclick="saveLeave('${id||''}')">حفظ</button></div>
      </div>
    </div>`;
}
function saveLeave(id) {
  const doctor=document.getElementById('lDoctor').value, type=document.getElementById('lType').value, from=document.getElementById('lFrom').value, to=document.getElementById('lTo').value, degree=document.getElementById('lDegree').value, notes=document.getElementById('lNotes').value;
  if(!doctor||!type){toast('اختر الدكتور ونوع الإجازة','error');return;}
  const leaves=getLeaves();
  if(id){const i=leaves.findIndex(l=>l.id===id);leaves[i]={...leaves[i],doctorName:doctor,leaveType:type,fromDate:from,toDate:to,degree,notes};}
  else{leaves.push({id:Date.now().toString(),doctorName:doctor,leaveType:type,fromDate:from,toDate:to,degree,conditions:'[]',notes});}
  setLeaves(leaves); document.getElementById('leaveModalContainer').innerHTML=''; renderLeaves(); toast(id?'تم التعديل':'تمت الإضافة');
}
function delLeave(id){if(!confirm('حذف الإجازة؟'))return;setLeaves(getLeaves().filter(l=>l.id!==id));renderLeaves();toast('تم الحذف');}

// ============ DATA ============
let dataSubTab = 'funds';
function renderData() {
  document.getElementById('tab-data').innerHTML = `
    <div style="margin-bottom:20px"><h2 style="font-size:1.5rem;font-weight:800;color:var(--primary)">تابة الداتا</h2>
    <p style="color:var(--muted-fg);font-size:0.85rem">استيراد/تصدير Excel - إضافة أعمدة وصفوف - تعديل وحذف</p></div>
    <div class="sub-tabs">
      <button class="sub-tab ${dataSubTab==='funds'?'active':''}" onclick="dataSubTab='funds';renderData()">صناديق خاصة</button>
      <button class="sub-tab ${dataSubTab==='budget'?'active':''}" onclick="dataSubTab='budget';renderData()">الموازنة</button>
    </div>
    <div id="dataSheet"></div>`;
  renderSheet();
}
function renderSheet() {
  const kind = dataSubTab;
  const cols = kind==='funds'?FUNDS_COLS:BUDGET_COLS;
  const members = getMembers(kind);
  const s = getSetting();
  const reportTitle = kind==='funds'?'صناديق خاصة أعضاء هيئة التدريس ومعاونيهم':'موازنة أعضاء هيئة التدريس ومعاونيهم';
  // Compute totals (exclude forfeited)
  const totals = {};
  cols.forEach(c => {
    if(c.type==='number') {
      totals[c.key] = members.reduce((sum,m) => {
        const f = checkForfeited(m);
        if(f && (REWARD_KEYS.includes(c.key) || c.key==='total')) return sum;
        return sum + parseNum(m[c.key]);
      }, 0);
    }
  });
  document.getElementById('dataSheet').innerHTML = `
    <div class="action-bar no-print">
      <div class="left">
        <button class="btn btn-primary btn-sm" onclick="addRow()">➕ صف جديد</button>
        <label class="btn btn-outline btn-sm" style="cursor:pointer">📥 استيراد Excel<input type="file" accept=".xlsx,.xls" style="display:none" onchange="importExcel(this)"></label>
        <button class="btn btn-outline btn-sm" onclick="exportExcel()">📤 تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="downloadTemplate()">📋 قالب فارغ</button>
        <button class="btn btn-outline btn-sm" style="color:var(--red)" onclick="clearAll()">🗑️ مسح الكل</button>
        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ طباعة</button>
      </div>
      <button class="btn btn-primary btn-sm" onclick="saveAll()">💾 حفظ الكل</button>
    </div>
    <div class="card" style="overflow-x:auto">
      ${renderReportHeader(reportTitle)}
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th class="sticky-col">#</th>${cols.map(c=>`<th>${c.header}</th>`).join('')}<th class="no-print">إجراءات</th></tr></thead>
          <tbody>
            ${members.length?members.map((m,idx)=>{
              const f=checkForfeited(m), ol=checkOnLeave(m);
              const cls = f?'row-forfeited':ol?'row-onleave':(idx%2===0?'':'');
              return `<tr class="${cls}">
                <td class="sticky-col" style="background:inherit">${idx+1}${f?' ⛔':ol?' ⚠️':''}</td>
                ${cols.map(c=>{
                  let v=m[c.key]||'';
                  if(f&&(REWARD_KEYS.includes(c.key)||c.key==='total')) v='0';
                  if(c.type==='dropdown'&&DD_MAP[c.key]){
                    const opts=getDD(DD_MAP[c.key]);
                    return `<td><select onchange="updCell(${idx},'${c.key}',this.value)" style="width:100%;border:none;background:transparent;padding:4px;text-align:center;font-family:Cairo;font-size:0.82rem"><option value="">-</option>${opts.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></td>`;
                  }
                  return `<td><input type="${c.type==='number'?'number':'text'}" value="${esc(v)}" onchange="updCell(${idx},'${c.key}',this.value)" style="width:100%;border:none;background:transparent;padding:4px;text-align:center;font-family:Cairo;font-size:0.82rem;border-radius:4px"></td>`;
                }).join('')}
                <td class="no-print"><button class="btn btn-icon btn-danger" onclick="delRow(${idx})">🗑️</button></td>
              </tr>`;
            }).join(''):'<tr><td colspan="'+(cols.length+2)+'" style="text-align:center;padding:32px;color:var(--muted-fg)">لا توجد بيانات</td></tr>'}
          </tbody>
          ${members.length?`<tfoot><tr><td class="sticky-col" style="background:var(--accent)">الإجمالي</td>${cols.map(c=>`<td style="text-align:center">${c.type==='number'?fmtNum(totals[c.key]||0):''}</td>`).join('')}<td class="no-print"></td></tr></tfoot>`:''}
        </table>
      </div>
      ${renderSignatures()}
    </div>`;
}
function addRow() {
  const kind=dataSubTab; const members=getMembers(kind); const m=newMember(kind); m.serial=String(members.length+1); m.kind=kind; members.push(m); setMembers(kind,members); renderSheet();
}
function delRow(idx) { const kind=dataSubTab; const members=getMembers(kind); members.splice(idx,1); setMembers(kind,members); renderSheet(); }
function updCell(idx,key,val) {
  const kind=dataSubTab; const members=getMembers(kind); const m={...members[idx],[key]:val};
  if(['qualityReward','extraHours','diff90','teachingReward','percent200'].includes(key)) m.total=computeTotal(m,kind).toString();
  members[idx]=m; setMembers(kind,members); renderSheet();
}
function saveAll() { toast('تم حفظ البيانات بنجاح'); }
function clearAll() { const kind=dataSubTab; if(!confirm('مسح جميع البيانات؟'))return; setMembers(kind,[]); renderSheet(); toast('تم المسح'); }
function importExcel(input) {
  const file=input.files[0]; if(!file)return; const kind=dataSubTab; const cols=kind==='funds'?FUNDS_COLS:BUDGET_COLS;
  const reader=new FileReader();
  reader.onload=(e)=>{
    const wb=XLSX.read(e.target.result,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{header:1});
    if(rows.length<2){toast('الملف فارغ','error');return;}
    const header=rows[0]; const members=[];
    for(let i=1;i<rows.length;i++){
      const row=rows[i]; if(!row||row.every(c=>!c&&c!==0))continue;
      const m=newMember(kind); m.serial=String(members.length+1);
      cols.forEach((c,ci)=>{
        const hi=header.findIndex(h=>String(h).trim()===c.header);
        if(hi>=0&&hi<row.length) m[c.key]=String(row[hi]||'');
      });
      m.total=computeTotal(m,kind).toString();
      if(m.name||m.code||m.nationalId||parseNum(m.total)>0) members.push(m);
    }
    setMembers(kind,members); input.value=''; renderSheet(); toast(`تم استيراد ${members.length} صف`);
  };
  reader.readAsArrayBuffer(file);
}
function exportExcel() {
  const kind=dataSubTab; const cols=kind==='funds'?FUNDS_COLS:BUDGET_COLS; const members=getMembers(kind);
  const data=[cols.map(c=>c.header)];
  members.forEach(m=>{data.push(cols.map(c=>m[c.key]||''));});
  const totals=cols.map(c=>{if(c.type==='number'){return members.reduce((s,m)=>{const f=checkForfeited(m);if(f&&(REWARD_KEYS.includes(c.key)||c.key==='total'))return s;return s+parseNum(m[c.key]);},0);}return'';});data.push(totals);});
  const ws=XLSX.utils.aoa_to_sheet(data); ws['!cols']=cols.map(c=>({wch:15})); ws['!rtl']=true;
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,kind==='funds'?'صناديق خاصة':'موازنة'); XLSX.writeFile(wb,kind==='funds'?'special-funds.xlsx':'budget.xlsx');
}
function downloadTemplate() {
  const kind=dataSubTab; const cols=kind==='funds'?FUNDS_COLS:BUDGET_COLS;
  const data=[cols.map(c=>c.header)]; for(let i=0;i<10;i++){data.push(cols.map((c,j)=>c.key==='serial'||c.key==='code'?i+1:''));}
  const ws=XLSX.utils.aoa_to_sheet(data); ws['!cols']=cols.map(c=>({wch:15})); ws['!rtl']=true;
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,kind==='funds'?'صناديق خاصة':'موازنة'); XLSX.writeFile(wb,kind==='funds'?'template-funds.xlsx':'template-budget.xlsx');
}

// ============ REPORTS ============
let reportSubTab='funds';
function renderReports() {
  document.getElementById('tab-reports').innerHTML=`
    <div style="margin-bottom:20px"><h2 style="font-size:1.5rem;font-weight:800;color:var(--primary)">تابة التقارير</h2>
    <p style="color:var(--muted-fg);font-size:0.85rem">ثلاثة تقارير: صناديق خاصة - موازنة - الإجازات</p></div>
    <div class="sub-tabs">
      <button class="sub-tab ${reportSubTab==='funds'?'active':''}" onclick="reportSubTab='funds';renderReports()">تقرير الصناديق الخاصة</button>
      <button class="sub-tab ${reportSubTab==='budget'?'active':''}" onclick="reportSubTab='budget';renderReports()">تقرير الموازنة</button>
      <button class="sub-tab ${reportSubTab==='leaves'?'active':''}" onclick="reportSubTab='leaves';renderReports()">تقرير الإجازات</button>
    </div>
    <div id="reportView"></div>`;
  renderReportView();
}
function renderReportView() {
  if(reportSubTab==='leaves') return renderLeavesReport();
  const kind=reportSubTab; const cols=kind==='funds'?FUNDS_COLS:BUDGET_COLS; const members=getMembers(kind);
  const s=getSetting(); const reportTitle=kind==='funds'?'صناديق خاصة أعضاء هيئة التدريس ومعاونيهم':'موازنة أعضاء هيئة التدريس ومعاونيهم';
  const totals={};
  cols.forEach(c=>{if(['basic','bound','qualityReward','extraHours','diff90','teachingReward','percent200','total'].includes(c.key)){totals[c.key]=members.reduce((sum,m)=>{const f=checkForfeited(m);if(f&&(REWARD_KEYS.includes(c.key)||c.key==='total'))return sum;return sum+parseNum(m[c.key]);},0);}});
  document.getElementById('reportView').innerHTML=`
    <div class="card" style="overflow:hidden">
      <div class="action-bar no-print">
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ طباعة</button>
          <button class="btn btn-outline btn-sm" onclick="exportExcel()">📤 تصدير Excel</button>
          <button class="btn btn-primary btn-sm" onclick="exportPDF()">📄 تصدير PDF</button>
        </div>
      </div>
      <div id="reportContent" style="background:#fff">
        ${renderReportHeader(reportTitle)}
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr>${cols.map(c=>`<th>${c.header}</th>`).join('')}</tr></thead>
            <tbody>
              ${members.length?members.map((m,idx)=>{
                const f=checkForfeited(m); const cls=f?'row-forfeited':(idx%2===0?'':'');
                return `<tr class="${cls}">${cols.map(c=>{
                  let v=m[c.key]||'';
                  if(f&&(REWARD_KEYS.includes(c.key)||c.key==='total')) v='0';
                  if(['basic','bound','qualityReward','extraHours','diff90','teachingReward','percent200','total'].includes(c.key)) return `<td style="font-family:monospace">${fmtNum(v||'0')}</td>`;
                  return `<td>${esc(v||'-')}</td>`;
                }).join('')}</tr>`;
              }).join(''):'<tr><td colspan="'+cols.length+'" style="text-align:center;padding:32px;color:var(--muted-fg)">لا توجد بيانات</td></tr>'}
            </tbody>
            ${members.length?`<tfoot><tr>${cols.map((c,i)=>`<td>${i===0?'الإجمالي':['basic','bound','qualityReward','extraHours','diff90','teachingReward','percent200','total'].includes(c.key)?fmtNum(totals[c.key]||0):''}</td>`).join('')}</tr></tfoot>`:''}
          </table>
        </div>
        <div style="padding:16px;background:rgba(14,124,123,0.05);border-top:1px solid var(--border)">
          <div class="grid-3" style="font-size:0.85rem">
            <div style="display:flex;justify-content:space-between"><span style="color:var(--muted-fg)">عدد الأعضاء:</span><span style="font-weight:700">${members.length}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--muted-fg)">إجمالي القيم:</span><span style="font-weight:700;color:var(--primary)">${fmtNum(totals.total||0)}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--muted-fg)">العام:</span><span style="font-weight:700">${esc(s.academicYear)}</span></div>
          </div>
        </div>
        ${renderSignatures()}
      </div>
    </div>`;
}
function renderLeavesReport() {
  const leaves=getLeaves(); const s=getSetting();
  let totalDays=0; const stats={};
  leaves.forEach(l=>{const f=new Date(l.fromDate),t=new Date(l.toDate);if(l.fromDate&&l.toDate){const d=Math.floor((t-f)/(1000*60*60*24))+1;totalDays+=d;}if(l.leaveType)stats[l.leaveType]=(stats[l.leaveType]||0)+1;});
  document.getElementById('reportView').innerHTML=`
    <div class="card" style="overflow:hidden">
      <div class="action-bar no-print"><div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ طباعة</button>
        <button class="btn btn-primary btn-sm" onclick="exportLeavesPDF()">📄 تصدير PDF</button>
      </div></div>
      <div id="reportContent" style="background:#fff">
        ${renderReportHeader('تقرير إجازات أعضاء هيئة التدريس ومعاونيهم')}
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr><th>م</th><th>اسم الدكتور</th><th>نوع الإجازة</th><th>من</th><th>إلى</th><th>الأيام</th><th>الدرجة</th><th>ملاحظات</th></tr></thead>
            <tbody>${leaves.length?leaves.map((l,i)=>{const f=new Date(l.fromDate),t=new Date(l.toDate);const days=(l.fromDate&&l.toDate)?Math.floor((t-f)/(1000*60*60*24))+1:0;return `<tr><td>${i+1}</td><td style="font-weight:600">${esc(l.doctorName)}</td><td>${esc(l.leaveType)}</td><td>${esc(l.fromDate)}</td><td>${esc(l.toDate)}</td><td style="font-family:monospace">${days}</td><td>${esc(l.degree)}</td><td style="font-size:0.75rem;color:var(--muted-fg)">${esc(l.notes)||'-'}</td></tr>`;}).join(''):'<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted-fg)">لا توجد إجازات</td></tr>'}</tbody>
          </table>
        </div>
        <div style="padding:16px;background:rgba(14,124,123,0.05);border-top:1px solid var(--border)">
          <div class="grid-3" style="font-size:0.85rem">
            <div style="display:flex;justify-content:space-between"><span style="color:var(--muted-fg)">عدد الإجازات:</span><span style="font-weight:700">${leaves.length}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--muted-fg)">إجمالي الأيام:</span><span style="font-weight:700;color:var(--primary)">${totalDays}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--muted-fg)">العام:</span><span style="font-weight:700">${esc(s.academicYear)}</span></div>
          </div>
          ${Object.keys(stats).length?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><div style="font-size:0.75rem;color:var(--muted-fg);margin-bottom:4px">إحصائية الأنواع:</div><div style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(stats).map(([t,c])=>`<span class="badge badge-outline">${esc(t)}: ${c}</span>`).join('')}</div></div>`:''}
        </div>
        ${renderSignatures()}
      </div>
    </div>`;
}
function exportPDF() {
  const el=document.getElementById('reportContent'); if(!el)return; toast('جارٍ تجهيز PDF...','info');
  html2canvas(el,{scale:2,backgroundColor:'#ffffff'}).then(canvas=>{
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
    const iw=pw-20,ih=(canvas.height*iw)/canvas.width; let hl=ih,pos=10;
    pdf.addImage(canvas.toDataURL('image/jpeg',0.92),'JPEG',10,pos,iw,ih); hl-=(ph-20);
    while(hl>0){pos=hl-ih+10;pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',0.92),'JPEG',10,pos,iw,ih);hl-=(ph-20);}
    pdf.save(reportSubTab==='funds'?'report-funds.pdf':reportSubTab==='budget'?'report-budget.pdf':'report-leaves.pdf'); toast('تم تصدير PDF');
  }).catch(e=>toast('فشل:'+e.message,'error'));
}
function exportLeavesPDF() { reportSubTab='leaves'; exportPDF(); }

// ============ COMPARISON ============
let cmpSubTab='funds', pdfEntries=[];
function renderComparison() {
  document.getElementById('tab-comparison').innerHTML=`
    <div style="margin-bottom:20px"><h2 style="font-size:1.5rem;font-weight:800;color:var(--primary)">تابة المقارنة</h2>
    <p style="color:var(--muted-fg);font-size:0.85rem">مقارنة إجمالي الاستحقاقات من PDF مع الشيت</p></div>
    <div class="sub-tabs">
      <button class="sub-tab ${cmpSubTab==='funds'?'active':''}" onclick="cmpSubTab='funds';renderComparison()">صناديق خاصة</button>
      <button class="sub-tab ${cmpSubTab==='budget'?'active':''}" onclick="cmpSubTab='budget';renderComparison()">الموازنة</button>
    </div>
    <div id="cmpView"></div>`;
  renderCmpView();
}
function renderCmpView() {
  const kind=cmpSubTab; const members=getMembers(kind);
  const sheetTotal=members.reduce((s,m)=>{const f=checkForfeited(m);if(f)return s;return s+parseNum(m.total);},0);
  const pdfTotal=pdfEntries.reduce((s,e)=>s+parseNum(e.amount),0);
  document.getElementById('cmpView').innerHTML=`
    <div class="card"><div class="card-header"><h3>📤 رفع ملف PDF</h3></div><div class="card-body">
      <label class="btn btn-primary" style="cursor:pointer">📄 اختر ملف PDF<input type="file" accept="application/pdf" style="display:none" onchange="uploadPDF(this)"></label>
      ${pdfEntries.length?`<div style="margin-top:16px">
        <div class="stats-grid">
          <div class="stat-card blue"><div class="num">${pdfEntries.length}</div><div class="lbl">دكاترة PDF</div></div>
          <div class="stat-card green"><div class="num">${members.length}</div><div class="lbl">دكاترة الشيت</div></div>
          <div class="stat-card"><div class="num" style="color:var(--primary)">${fmtNum(sheetTotal)}</div><div class="lbl" style="color:var(--primary)">إجمالي الشيت</div></div>
          <div class="stat-card"><div class="num" style="color:var(--accent-fg)">${fmtNum(pdfTotal)}</div><div class="lbl" style="color:var(--accent-fg)">إجمالي PDF</div></div>
        </div>
        ${renderComparisonResults()}
      </div>`:''}
    </div></div>`;
}
async function uploadPDF(input) {
  const file=input.files[0]; if(!file)return; toast('جارٍ تحليل PDF...','info');
  try {
    const buf=new Uint8Array(await file.arrayBuffer());
    const doc=await pdfjsLib.getDocument({data:buf}).promise;
    pdfEntries=[];
    for(let p=1;p<=doc.numPages;p++){
      const page=await doc.getPage(p); const content=await page.getTextContent();
      const lines=new Map();
      content.items.forEach(item=>{
        if(!item.str||!item.str.trim())return;
        const y=Math.round(item.transform[5]); const x=item.transform[4];
        if(!lines.has(y))lines.set(y,[]);
        lines.get(y).push({text:item.str,x});
      });
      const sortedYs=Array.from(lines.keys()).sort((a,b)=>b-a);
      const lineTexts=[];
      sortedYs.forEach(y=>{
        const items=lines.get(y).sort((a,b)=>a.x-b.x);
        const parts=[];let prevX=null;
        items.forEach(it=>{if(prevX!==null&&it.x-prevX>5)parts.push(' ');parts.push(it.text);prevX=it.x+it.text.length*2;});
        const lt=parts.join('').replace(/\s+/g,' ').trim(); if(lt)lineTexts.push(lt);
      });
      let name=null,natId=null,amount=null;
      const norm=s=>s.normalize('NFKC').replace(/[\u0660-\u0669]/g,d=>String(d.charCodeAt(0)-0x0660));
      for(const line of lineTexts){
        const n=norm(line);
        if(!name){const ei=n.indexOf('اسم الموظف');if(ei>=0){const si=n.indexOf('رقم الصرف');if(si>=0&&si<ei){const b=n.slice(si+'رقم الصرف'.length,ei).replace(/^[:\s]+/,'').trim();const m=b.match(/^[\u0600-\u06FF\s]+/);if(m&&m[0].trim().length>=3)name=m[0].trim();}}}
        if(!natId){const ni=n.indexOf('الرقم القوم');if(ni>=0){const before=n.slice(0,ni);const m=before.match(/\d{14}/g);if(m)natId=m[m.length-1];}}
      }
      for(let i=0;i<lineTexts.length;i++){
        const n=norm(lineTexts[i]);
        if(n.includes('الاستحقاقات')&&(n.includes('إجمالي')||n.includes('أجمالى')||n.includes('اجمالى'))){
          const m=n.match(/\d+[.,٫]\d+/g);if(m){const a=parseFloat(m[m.length-1].replace(/[,٫]/g,'.'));if(a>0){amount=a;break;}}
          if(i>0){const pn=norm(lineTexts[i-1]);const pm=pn.match(/\d+[.,٫]\d+/g);if(pm){const a=parseFloat(pm[pm.length-1].replace(/[,٫]/g,'.'));if(a>0){amount=a;break;}}}
        }
      }
      if(name&&amount)pdfEntries.push({name,amount:amount.toFixed(2),nationalId:natId||'',page:p});
    }
    input.value=''; renderCmpView(); toast(`تم استخراج ${pdfEntries.length} دكتور`);
  } catch(e){toast('فشل:'+e.message,'error');}
}
function renderComparisonResults() {
  const kind=cmpSubTab; const members=getMembers(kind);
  const norm=s=>s.trim().replace(/\s+/g,' ').toLowerCase();
  const rev=s=>s.trim().split(/\s+/).reverse().join(' ');
  const pdfByName=new Map(),pdfByRev=new Map(),pdfByNat=new Map();
  pdfEntries.forEach(e=>{if(e.name){pdfByName.set(norm(e.name),e);pdfByRev.set(norm(rev(e.name)),e);}if(e.nationalId)pdfByNat.set(e.nationalId,e);});
  const results=[];let matched=0,diff=0,miss=0,extra=0;
  members.forEach(m=>{
    const sn=norm(m.name);let f=pdfByNat.get(m.nationalId)||pdfByName.get(sn)||pdfByRev.get(sn);
    if(!f){results.push({name:m.name,sheet:m.total,pdf:'',diff:m.total,status:'missing',note:'ناقص في PDF'});miss++;}
    else{const d=parseNum(m.total)-parseNum(f.amount);if(Math.abs(d)<0.01){results.push({name:m.name,sheet:m.total,pdf:f.amount,diff:0,status:'matched',note:'مطابق'});matched++;}
    else{results.push({name:m.name,sheet:m.total,pdf:f.amount,diff:d,status:'different',note:(d>0?'الشيت أكبر':'PDF أكبر')});diff++;}}
  });
  const sheetNames=new Set(members.map(m=>norm(m.name)));
  pdfEntries.forEach(e=>{if(!sheetNames.has(norm(e.name))){const sm=members.find(m=>m.nationalId&&e.nationalId===m.nationalId);if(!sm){results.push({name:'',sheet:'',pdf:e.amount,diff:e.amount,status:'extra',note:'زائد في PDF'});extra++;}}});
  return `
    <div class="stats-grid">
      <div class="stat-card green"><div class="num">${matched}</div><div class="lbl">مطابق</div></div>
      <div class="stat-card amber"><div class="num">${diff}</div><div class="lbl">مختلف</div></div>
      <div class="stat-card red"><div class="num">${miss}</div><div class="lbl">ناقص في PDF</div></div>
      <div class="stat-card blue"><div class="num">${extra}</div><div class="lbl">زائد في PDF</div></div>
    </div>
    <div style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
      <table class="data-table"><thead><tr><th>الدكتور</th><th>الشيت</th><th>PDF</th><th>الفرق</th><th>الحالة</th></tr></thead><tbody>
        ${results.map(r=>`<tr><td style="font-weight:600">${esc(r.name)}</td><td style="font-family:monospace">${fmtNum(r.sheet)}</td><td style="font-family:monospace">${r.pdf?fmtNum(r.pdf):'-'}</td><td style="font-family:monospace;font-weight:700">${r.diff===0?'-':fmtNum(Math.abs(r.diff))}</td><td>${r.status==='matched'?'<span class="badge badge-green">مطابق</span>':r.status==='different'?'<span class="badge badge-amber">مختلف</span>':r.status==='missing'?'<span class="badge badge-red">ناقص</span>':'<span class="badge badge-blue">زائد</span>'}</td></tr>`).join('')}
      </tbody></table>
    </div>`;
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  // Initialize default data
  if (!STORE.get('dropdowns', null)) STORE.set('dropdowns', DEFAULT_DD);
  if (!STORE.get('users', null)) setUsers(getUsers());
  // Check session
  const session = STORE.get('session', null);
  if (session) {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('headerYear').textContent = 'مدير الكلية - العام: ' + getSetting().academicYear;
    document.getElementById('headerSubtitle').textContent = getSetting().universityName + ' - ' + getSetting().facultyName;
    renderAll();
  }
});
</script>
</body>
</html>'''

with open('/home/z/my-project/download/صناديق-خاصة-وموازنة.html', 'w', encoding='utf-8') as f:
    f.write(html)

import os
size = os.path.getsize('/home/z/my-project/download/صناديق-خاصة-وموازنة.html')
lines = html.count('\n')
print(f"File created: {size} bytes, {lines} lines")
