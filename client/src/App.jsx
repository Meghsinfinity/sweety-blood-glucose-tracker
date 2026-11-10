import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, ChevronDown, HeartPulse, LogOut, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle } from "lucide-react";
import api, { getErrorMessage } from "./api";

const SLOTS = ["Morning", "After breakfast", "After lunch", "After dinner"];
const todayString = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
};
const formatDate = (value) => {
  if (!value) return "—";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const emptyForm = () => ({ date: todayString(), slot: "Morning", value: "" });

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, form);
      if (mode === "register") {
        setMode("login");
        setError("Account created. Please log in.");
      } else {
        localStorage.setItem("sweety_token", data.token);
        onAuth(data.user);
      }
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <main className="auth-wrap">
    <section className="auth-card">
      <div className="brand-mark"><HeartPulse size={24}/></div>
      <p className="eyebrow">YOUR DAILY HEALTH COMPANION</p>
      <h1>Welcome to <span>Sweety</span></h1>
      <p className="muted center">A simple, calm place to keep track of your glucose readings.</p>
      <div className="tabs"><button className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");}}>Log in</button><button className={mode === "register" ? "active" : ""} onClick={() => {setMode("register");setError("");}}>Create account</button></div>
      <form onSubmit={submit} className="form-stack">
        {mode === "register" && <label>Full name<input required maxLength="100" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength="8" type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
        {error && <div className="notice"><AlertCircle size={16}/>{error}</div>}
        <button className="primary-btn full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <p className="fine-print">Your readings are private to your account. This app is for tracking only, not medical advice.</p>
    </section>
  </main>;
}

function StatCard({ label, value, suffix, icon: Icon, tone }) {
  return <article className={`stat-card ${tone || ""}`}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17}/></span></div><div className="stat-value">{value}<small>{suffix}</small></div></article>;
}

function ReadingModal({ initial, onClose, onSave, busy }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setError("");
    const value = Number(form.value);
    if (!form.value) return setError("Please enter a glucose value.");
    if (!Number.isInteger(value) || value < 40 || value > 600) return setError("Value must be between 40 and 600 mg/dl.");
    try { await onSave({...form, value}); } catch (err) { setError(getErrorMessage(err)); }
  };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal">
      <div className="modal-head"><div><p className="eyebrow">{initial?.id ? "UPDATE ENTRY" : "NEW ENTRY"}</p><h2>{initial?.id ? "Edit reading" : "Add a reading"}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></div>
      <form className="form-stack" onSubmit={submit}>
        <label>Date<input type="date" max={todayString()} required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label>Time slot<select value={form.slot} onChange={e=>setForm({...form,slot:e.target.value})}>{SLOTS.map(s=><option key={s}>{s}</option>)}</select></label>
        <label>Glucose value <span className="unit">(mg/dL)</span><input type="number" min="40" max="600" step="1" required value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder="e.g. 110"/></label>
        {error && <div className="notice"><AlertCircle size={16}/>{error}</div>}
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving…" : "Save reading"}</button></div>
      </form>
    </section>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [readings, setReadings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [reportType, setReportType] = useState("daily");
  const [report, setReport] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sweety_token");
    if (!token) { setChecking(false); return; }
    api.get("/auth/me").then(({data}) => setUser(data.user)).catch(() => localStorage.removeItem("sweety_token")).finally(() => setChecking(false));
  }, []);

  const loadReadings = async () => {
    const { data } = await api.get("/readings", { params: { date: selectedDate } });
    setReadings(data.readings);
  };
  const loadReport = async () => {
    const endpoint = reportType === "daily" ? "/reports/daily" : reportType === "month-to-date" ? "/reports/month-to-date" : "/reports/monthly";
    const { data } = await api.get(endpoint, { params: { date: selectedDate } });
    setReport(data);
  };
  useEffect(() => {
    if (!user) return;
    setError("");
    Promise.all([loadReadings(), loadReport()]).catch(err => setError(getErrorMessage(err)));
  }, [user, selectedDate, reportType]);

  const logout = () => { localStorage.removeItem("sweety_token"); setUser(null); setReadings([]); setReport(null); };
  const saveReading = async (form) => {
    setBusy(true);
    try {
      if (modal?.id) await api.put(`/readings/${modal.id}`, form);
      else await api.post("/readings", form);
      setModal(null); setNotice(modal?.id ? "Reading updated." : "Reading saved.");
      await Promise.all([loadReadings(), loadReport()]);
    } finally { setBusy(false); }
  };
  const deleteReading = async (id) => {
    if (!window.confirm("Delete this reading? This cannot be undone.")) return;
    try { await api.delete(`/readings/${id}`); setNotice("Reading deleted."); await Promise.all([loadReadings(), loadReport()]); }
    catch (err) { setError(getErrorMessage(err)); }
  };
  const stats = report?.statistics || {};
  const reportRange = report?.dateRange;
  const reportTitle = reportType === "daily" ? "Daily report" : reportType === "month-to-date" ? "Month to date" : "Previous month";
  const orderedReadings = useMemo(() => [...readings].sort((a,b) => SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot)), [readings]);

  if (checking) return <div className="loading">Loading Sweety…</div>;
  if (!user) return <AuthScreen onAuth={setUser}/>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><span>Sweety</span></div>
      <div className="side-label">WORKSPACE</div>
      <div className="side-link active"><Activity size={18}/> Overview</div>
      <div className="sidebar-note"><div className="note-icon"><HeartPulse size={18}/></div><strong>Small steps, every day.</strong><p>Keep your readings together and bring a clear record to your next appointment.</p></div>
      <div className="side-user"><div className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</div><div className="user-meta"><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-btn" onClick={logout} title="Log out"><LogOut size={17}/></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">YOUR HEALTH OVERVIEW</p><h1>Hello, {user.name?.split(" ")[0]} <span className="wave">✦</span></h1><p className="muted">Here’s your glucose tracking at a glance.</p></div><button className="primary-btn add-top" onClick={()=>setModal(emptyForm())}><Plus size={18}/> Add reading</button></header>
      {(notice || error) && <div className={error ? "notice page-notice" : "success-notice page-notice"}>{error ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}<span>{error || notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={15}/></button></div>}
      <section className="filter-row"><div><CalendarDays size={18}/><strong>Selected date</strong></div><input type="date" max={todayString()} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/><span className="date-human">{formatDate(selectedDate)}</span></section>
      <section className="stats-grid">
        <StatCard label="Highest reading" value={stats.highest ?? "—"} suffix={stats.count ? "mg/dL" : ""} icon={Activity} tone="rose"/>
        <StatCard label="Lowest reading" value={stats.lowest ?? "—"} suffix={stats.count ? "mg/dL" : ""} icon={Activity} tone="mint"/>
        <StatCard label="Average reading" value={stats.average ?? "—"} suffix={stats.count ? "mg/dL" : ""} icon={HeartPulse} tone="lavender"/>
        <StatCard label="Total readings" value={stats.count ?? "—"} suffix={stats.count === 1 ? "entry" : stats.count ? "entries" : ""} icon={CalendarDays} tone="sand"/>
      </section>
      <section className="panel report-panel">
        <div className="section-heading"><div><p className="eyebrow">YOUR SUMMARY</p><h2>{reportTitle}</h2><p className="muted">{reportRange ? `${formatDate(reportRange.startDate)} – ${formatDate(reportRange.endDate)}` : "Loading report…"}</p></div>
          <label className="select-wrap"><span className="sr-only">Report period</span><select value={reportType} onChange={e=>setReportType(e.target.value)}><option value="daily">Daily</option><option value="month-to-date">Month-to-date</option><option value="monthly">Previous month</option></select><ChevronDown size={15}/></label>
        </div>
        {report?.empty ? <div className="empty-state"><div className="empty-icon"><Activity size={25}/></div><strong>No readings for this period yet</strong><p>Add a reading to start building your report.</p></div> :
          reportType === "daily" ? <div className="slot-list">{orderedReadings.map(r=><div className="slot-row" key={r.id}><div className="slot-dot"/><div className="slot-info"><strong>{r.slot}</strong><span>{formatDate(r.reading_date)}</span></div><div className="reading-number">{r.value}<small> mg/dL</small></div><div className="row-actions"><button className="icon-btn" onClick={()=>setModal({...r,date:String(r.reading_date).slice(0,10),value:String(r.value)})} title="Edit"><Pencil size={16}/></button><button className="icon-btn danger" onClick={()=>deleteReading(r.id)} title="Delete"><Trash2 size={16}/></button></div></div>)}</div> :
          <div className="period-summary"><div className="summary-bubble"><Activity size={22}/></div><div><strong>{stats.count} readings recorded</strong><p>Average glucose value: <b>{stats.average} mg/dL</b></p><p>Range: {stats.lowest}–{stats.highest} mg/dL</p></div></div>
        }
      </section>
      <footer className="footer-note">Sweety is a personal tracking tool. Always discuss your readings with your healthcare professional.</footer>
    </main>
    {modal && <ReadingModal initial={modal} onClose={()=>setModal(null)} onSave={saveReading} busy={busy}/>}
  </div>;
}
