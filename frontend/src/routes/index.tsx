import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BadgeIndianRupee, BarChart3, Bell,
  Building2, CheckCircle2, ChevronRight, CircleDot, Clock3, Download,
  FileCheck2, FileText, Fingerprint, Home, Landmark, Link2, LocateFixed,
  LockKeyhole, Map, MapPin, Menu, Network, Paperclip, Plus, Radar, ReceiptIndianRupee,
  Search, ShieldCheck, Siren, UploadCloud, UserRound, UsersRound, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatCase, scorePercent, type ApiCase, type AuthUser, type CitizenProfile, type Location, type Prediction, type UserRole } from "@/lib/api";
import { LiveIntelReport, LiveInvestigator } from "@/components/LiveIntelligence";
import { LiveStatus } from "@/components/LiveStatus";

type View = "landing" | "login" | "citizen-register" | "citizen" | "report" | "status" | "police" | "case" | "investigator" | "intel-report";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Cybercrime Predictive Intelligence | SIH Prototype" },
    { name: "description", content: "Fictional Smart India Hackathon prototype for complaint-led cybercrime predictive intelligence." },
    { property: "og:title", content: "Telangana Cybercrime Predictive Intelligence" },
    { property: "og:description", content: "Frontend-only civic technology prototype for cybercrime investigation workflows." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: App,
});

const cases = [
  { id: "CASE-2026-00124", type: "UPI Fraud", amount: "₹75,000", district: "Hyderabad", risk: "HIGH", time: "24 min ago" },
  { id: "CASE-2026-00118", type: "Investment Scam", amount: "₹2,40,000", district: "Warangal", risk: "HIGH", time: "1 hr ago" },
  { id: "CASE-2026-00107", type: "Card Fraud", amount: "₹48,500", district: "Nizamabad", risk: "MEDIUM", time: "3 hrs ago" },
  { id: "CASE-2026-00096", type: "Identity Theft", amount: "₹32,000", district: "Karimnagar", risk: "LOW", time: "Yesterday" },
];

const locations = [
  { name: "Central ATM", area: "Secunderabad", score: 86, window: "18:00–20:00", pos: "left-[29%] top-[34%]" },
  { name: "Market Area ATM", area: "Kukatpally", score: 72, window: "18:00–21:00", pos: "left-[57%] top-[58%]" },
  { name: "City Center ATM", area: "Madhapur", score: 61, window: "19:00–22:00", pos: "left-[72%] top-[27%]" },
];

function App() {
  const [view, setView] = useState<View>("landing");
  const [mobile, setMobile] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [complaintCategory, setComplaintCategory] = useState("Financial fraud");
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile | null>(null);
  const [liveCases, setLiveCases] = useState<ApiCase[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  useEffect(() => { api.listCases().then(setLiveCases).catch(() => setLiveCases([])); }, []);
  const roleForView: Partial<Record<View, UserRole>> = {
    police: "police", case: "police", investigator: "investigator", "intel-report": "investigator",
  };
  const go = (next: View) => {
    if (roleForView[next] && (!user || user.role !== roleForView[next])) next = "login";
    setView(next); setMobile(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    go(loggedInUser.role);
  };
  const logout = () => { setUser(null); go("landing"); };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="bg-secondary text-secondary-foreground">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-1.5 text-[10px] sm:px-6">
            <span className="hidden sm:block">English · తెలుగు</span>
          </div>
        </div>
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <button aria-label="Go to home" onClick={() => go("landing")} className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm bg-primary text-primary-foreground"><img src="/telangana-cybercrime-logo.jpeg" alt="Telangana Cybercrime Predictive Intelligence logo" className="size-full object-cover" /></button>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-semibold text-primary sm:text-sm">తెలంగాణ సైబర్ క్రైమ్ ప్రిడిక్టివ్ ఇంటెలిజెన్స్</div>
            <div className="truncate text-sm font-extrabold sm:text-lg">Telangana Cybercrime Predictive Intelligence Platform</div>
          </div>
          <button className="ml-auto p-2 lg:hidden" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</button>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            <NavButton active={view === "landing"} onClick={() => go("landing")} icon={<Home/>}>Home</NavButton>
            {user ? <><NavButton active={view !== "landing"} onClick={() => go(user.role)} icon={<UserRound/>}>Dashboard</NavButton><Button variant="outline" onClick={logout}>Logout</Button></> : <Button onClick={() => go("login")}><LockKeyhole/>Login</Button>}
          </nav>
        </div>
        {mobile && <nav className="grid grid-cols-2 gap-2 border-t border-border bg-card p-3 lg:hidden">
          <Button variant="outline" onClick={() => go("landing")}>Home</Button>{user ? <><Button variant="outline" onClick={() => go(user.role)}>Dashboard</Button><Button className="col-span-2" variant="outline" onClick={logout}>Logout</Button></> : <Button onClick={() => go("login")}>Staff Login</Button>}
        </nav>}
      </header>
      {view === "landing" && <Landing go={go} onRegister={(category) => { setComplaintCategory(category); go("citizen-register"); }}/>} 
      {view === "login" && <Login onLogin={handleLogin} onCancel={() => go("landing")}/>} 
      {view === "citizen-register" && <CitizenRegistration category={complaintCategory} onComplete={(profile) => { setCitizenProfile(profile); go("citizen"); }} onCancel={() => go("landing")}/>} 
      {view === "citizen" && <Citizen go={go} profile={citizenProfile}/>} 
      {view === "report" && <ReportForm go={go} onCreated={(caseId) => { setActiveCaseId(caseId); api.listCases().then(setLiveCases).catch(() => undefined); }}/>} 
      {view === "status" && <LiveStatus go={go} caseId={activeCaseId}/>} 
      {view === "police" && <Police go={go} liveCases={liveCases} onSelect={(caseId) => { setActiveCaseId(caseId); go("case"); }}/>} 
      {view === "case" && <CaseDetail go={go} caseId={activeCaseId}/>} 
      {view === "investigator" && <LiveInvestigator go={go} caseId={activeCaseId}/>} 
      {view === "intel-report" && <LiveIntelReport go={go} caseId={activeCaseId}/>} 
      <footer className="border-t border-border bg-secondary px-4 py-5 text-secondary-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 text-xs sm:flex-row"><span>© 2026 SIH</span></div>
      </footer>
    </div>
  );
}

function NavButton({ children, icon, active, onClick }: { children: ReactNode; icon: ReactNode; active: boolean; onClick: () => void }) {
  return <Button variant={active ? "default" : "ghost"} onClick={onClick} className="h-10">{icon}{children}</Button>;
}

function Landing({ go, onRegister }: { go: (v: View) => void; onRegister: (category: string) => void }) {
  const steps = ["Complaint","Transaction Intelligence","Analysis","Geospatial Intelligence","Location Ranking","Actionable Intelligence"];
  return <main>
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 border-l-4 border-accent bg-muted px-3 py-2 text-xs font-bold uppercase text-secondary"><Radar size={16}/> Predictive Cybercrime Intelligence</div>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.12] sm:text-5xl lg:text-6xl">From cybercrime complaints to proactive, location-based investigative intelligence.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">Register a complaint without signing in. Police and investigators can use the secure staff login for their workspaces.</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">{[
          { title: "Women & children related crime", category: "Women and children related crime", image: "/complaint-cards/safety-support.png", description: "Get support and submit a protected report." },
          { title: "Financial fraud", category: "Financial fraud", image: "/complaint-cards/financial-fraud.png", description: "Report UPI, card, banking, or investment fraud." },
          { title: "Other cybercrime", category: "Other cybercrime", image: "/complaint-cards/cyber-safety.png", description: "Report impersonation, account misuse, and more." },
        ].map((card) => <article className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-lg" key={card.category}><img src={card.image} alt="" className="h-52 w-full object-cover"/><div className="bg-gradient-to-br from-slate-800 to-primary p-6 text-primary-foreground"><h2 className="text-xl font-extrabold uppercase">{card.title}</h2><p className="mt-2 min-h-10 text-sm text-primary-foreground/80">{card.description}</p><Button className="mt-5 bg-cyan-500 text-white hover:bg-cyan-400" onClick={() => onRegister(card.category)}>Register a complaint<ArrowRight/></Button></div></article>)}</div>
      </div>
    </section>
    <section className="bg-primary py-8 text-primary-foreground"><div className="mx-auto max-w-[1440px] px-4 sm:px-6"><p className="mb-5 text-center text-xs font-bold uppercase">Complaint-to-action workflow</p><div className="grid gap-px bg-primary-foreground/20 sm:grid-cols-3 lg:grid-cols-6">{steps.map((s,i)=><div className="bg-primary p-4" key={s}><span className="text-xs opacity-70">0{i+1}</span><p className="mt-4 text-sm font-semibold">{s}</p></div>)}</div></div></section>
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6"><div className="grid gap-10 lg:grid-cols-3"><Info title="Why this platform?" icon={<ShieldCheck/>}>Transforms fragmented complaint and transaction details into a consistent, explainable investigative picture.</Info><Info title="How it works" icon={<Activity/>}>Fictional rules connect complaint signals, transaction patterns, relationships, time windows, and likely cash-out areas.</Info><Info title="Key capabilities" icon={<LocateFixed/>}>Case triage, timelines, network context, ranked candidate locations, map intelligence, and downloadable reports.</Info></div></section>
    <section className="border-y border-border bg-card"><div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6"><div className="flex gap-4 border-l-4 border-accent bg-muted p-5"><AlertTriangle className="shrink-0 text-accent"/><div><h2 className="font-bold">Important prediction disclaimer</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">All locations, scores, timelines, and insights shown are fictional, illustrative likelihood estimates. They do not constitute official intelligence, legal evidence, or guaranteed future outcomes.</p></div></div></div></section>
  </main>;
}

function CitizenRegistration({ category, onComplete, onCancel }: { category: string; onComplete: (profile: CitizenProfile) => void; onCancel: () => void }) {
  const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [identityType, setIdentityType] = useState("Aadhaar"); const [identityNumber, setIdentityNumber] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(null); try { onComplete(await api.registerCitizen({ full_name: fullName.trim(), phone: phone.trim(), email: email.trim(), identity_type: identityType, identity_number: identityNumber.trim() })); } catch { setError("We could not verify your details. Please check them and try again."); } finally { setBusy(false); } };
  return <Page eyebrow="Citizen complaint registration" title="Tell us about yourself first"><form onSubmit={submit} className="mx-auto max-w-3xl border border-border bg-card p-6 civic-shadow sm:p-8"><div className="mb-6 border-l-4 border-accent bg-muted p-4"><p className="font-bold">{category}</p><p className="mt-1 text-sm text-muted-foreground">These details are checked against the citizen profile registry before opening your dashboard.</p></div><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-10 w-full border border-input bg-background px-3"/></label><label className="text-sm font-semibold">Mobile number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-10 w-full border border-input bg-background px-3"/></label><label className="text-sm font-semibold">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-10 w-full border border-input bg-background px-3"/></label><label className="text-sm font-semibold">Identity document<select value={identityType} onChange={(event) => setIdentityType(event.target.value)} className="mt-2 h-10 w-full border border-input bg-background px-3"><option>Aadhaar</option><option>Voter ID</option><option>Driving licence</option><option>Passport</option></select></label><label className="text-sm font-semibold sm:col-span-2">Identity document number<input required value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value)} className="mt-2 h-10 w-full border border-input bg-background px-3"/></label></div>{error && <p className="mt-5 border-l-4 border-destructive bg-muted p-3 text-xs text-destructive">{error}</p>}<p className="mt-5 text-xs text-muted-foreground">Use your own identity information.</p><div className="mt-6 flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Verifying details..." : "Continue to citizen dashboard"}<ArrowRight/></Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div></form></Page>;
}

function Login({ onLogin, onCancel }: { onLogin: (user: AuthUser) => void; onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("police");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const matchesRolePattern = (value: string, selectedRole: UserRole) => {
    const cleanEmail = value.trim().toLowerCase();
    if (selectedRole === "citizen") return /^[^@\s]+@gmail\.com$/.test(cleanEmail);
    return cleanEmail === `${selectedRole}@gmail.com`;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!matchesRolePattern(email, role)) {
      setError(role === "citizen" ? "Citizen accounts must use a Gmail address (for example, citizen@gmail.com)." : `${role[0].toUpperCase() + role.slice(1)} accounts must use ${role}@gmail.com.`);
      return;
    }
    setBusy(true);
    try { onLogin(await api.login({ email: email.trim(), role })); }
    catch { setError("Login was not approved. This email is not registered for the selected role."); }
    finally { setBusy(false); }
  };
  return <Page eyebrow="Secure staff access" title="Police / Investigator Login"><div className="mx-auto max-w-md border border-border bg-card p-6 civic-shadow sm:p-8"><div className="mb-6 flex gap-3"><span className="grid size-10 place-items-center bg-primary text-primary-foreground"><LockKeyhole/></span><div><h2 className="font-bold">Select your role</h2><p className="text-sm text-muted-foreground">Your email must match the selected role in the user registry.</p></div></div><form className="space-y-5" onSubmit={submit}><label className="block text-sm font-semibold">Role<select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm"><option value="police">Police</option><option value="investigator">Investigator</option></select></label><label className="block text-sm font-semibold">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={`${role}@gmail.com`} className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"/></label>{error && <p className="border-l-4 border-destructive bg-muted p-3 text-xs text-destructive">{error}</p>}<p className="text-xs leading-relaxed text-muted-foreground">Demo registry: police@gmail.com and investigator@gmail.com. Select the matching role.</p><div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Checking access..." : "Login"}<ArrowRight/></Button><Button type="button" variant="outline" onClick={onCancel}>Back to home</Button></div></form></div></Page>;
}

function Info({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) { return <div className="border-t-4 border-primary pt-5"><div className="text-primary">{icon}</div><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p></div>; }
function Page({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children: ReactNode; actions?: ReactNode }) { return <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h1></div>{actions}</div>{children}</main>; }
function Card({ title, icon, children, className="" }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) { return <section className={`border border-border bg-card civic-shadow ${className}`}><div className="flex items-center gap-2 border-b border-border px-5 py-4 font-bold">{icon && <span className="text-primary">{icon}</span>}{title}</div><div className="p-5">{children}</div></section>; }
function Metric({ label, value, icon, note }: { label: string; value: string; icon: ReactNode; note: string }) { return <div className="border border-border bg-card p-4"><div className="flex justify-between text-primary"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span>{icon}</div><p className="mt-3 text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>; }
function Risk({ risk }: { risk: string }) { const c = risk === "HIGH" ? "bg-destructive text-destructive-foreground" : risk === "MEDIUM" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"; return <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold ${c}`}><CircleDot size={11}/>{risk}</span>; }

function Citizen({ go, profile }: { go: (v: View) => void; profile: CitizenProfile | null }) { const isReturning = profile?.returning_citizen; return <Page eyebrow={isReturning ? "Returning citizen verified" : "New citizen profile created"} title={profile ? `Welcome, ${profile.full_name}` : "Citizen Dashboard"} actions={<Button onClick={() => go("report")}><Plus/>Register Complaint</Button>}>
  {profile && <div className={`mb-6 border-l-4 p-4 text-sm ${isReturning ? "border-primary bg-muted" : "border-accent bg-muted"}`}><p className="font-bold">{isReturning ? "Your profile details matched our registry." : "Your new citizen profile is ready."}</p><p className="mt-1 text-muted-foreground">{profile.email} · {profile.identity_type} ending {profile.identity_number.slice(-4)}</p></div>}
  <div className="grid gap-4 sm:grid-cols-3"><Metric label="Active complaints" value={isReturning ? "1" : "0"} icon={<FileText/>} note={isReturning ? "Currently under review" : "Register your first complaint"}/><Metric label="Latest status" value={isReturning ? "Analyzing" : "New profile"} icon={<Activity/>} note={isReturning ? "Updated 18 minutes ago" : "Details verified for this session"}/><Metric label="Evidence files" value={isReturning ? "4" : "0"} icon={<Paperclip/>} note={isReturning ? "Successfully attached" : "Attach evidence with your complaint"}/></div>
  <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]"><Card title="Your recent complaint" icon={<FileCheck2/>}><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs text-muted-foreground">CASE ID</p><p className="mt-1 font-bold">CASE-2026-00124</p><p className="mt-3 text-sm">UPI Fraud · ₹75,000</p><p className="text-sm text-muted-foreground">Reported from Hyderabad · 14 March 2026</p></div><Risk risk="HIGH"/></div><div className="mt-5 flex gap-3"><Button onClick={() => go("status")}>Track Status<ArrowRight/></Button><Button variant="outline" onClick={() => go("report")}>View Details</Button></div></Card><Card title="Safety guidance" icon={<ShieldCheck/>}><ul className="space-y-3 text-sm text-muted-foreground"><li>• Contact 1930 immediately for financial cyber fraud.</li><li>• Do not delete messages or transaction records.</li><li>• Never share OTP, PIN, or remote access.</li></ul></Card></div>
 </Page>; }

function ReportForm({ go, onCreated }: { go: (v: View) => void; onCreated: (caseId: string) => void }) {
 const [submitted,setSubmitted]=useState<string | null>(null); const [error,setError]=useState<string | null>(null); const [amount,setAmount]=useState("75000"); const [destination,setDestination]=useState("ACC-DEMO"); const [busy,setBusy]=useState(false);
 const submit = async () => { setBusy(true); setError(null); try { const result = await api.createCase({ fraud_type: "UPI_FRAUD", amount: Number(amount), transaction_time: new Date().toISOString(), destination_account: destination }); setSubmitted(result.case_id); onCreated(result.case_id); } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit complaint"); } finally { setBusy(false); } };
 if(submitted) return <Page eyebrow="Complaint submitted" title="Your Case ID has been generated"><div className="mx-auto max-w-xl border border-border bg-card p-8 text-center civic-shadow"><CheckCircle2 className="mx-auto text-primary" size={48}/><p className="mt-5 text-sm text-muted-foreground">Please save this live case reference</p><p className="mt-2 text-3xl font-extrabold text-primary">{submitted}</p><p className="mt-4 text-sm text-muted-foreground">Your complaint has moved to initial police review.</p><Button className="mt-6" onClick={() => go("status")}>Track Complaint<ArrowRight/></Button></div></Page>;
 return <Page eyebrow="Citizen services" title="Report Cybercrime" actions={<span className="text-xs text-muted-foreground">Data is submitted to the local FastAPI service</span>}><div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]"><Card title="Complaint & transaction details" icon={<FileText/>}><div className="grid gap-4 sm:grid-cols-2"><Field label="Fraud category" value="UPI Fraud"/><Field label="Incident date" value={new Date().toLocaleDateString("en-IN")}/><label className="text-xs font-semibold">Amount lost<input className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={amount} onChange={(e)=>setAmount(e.target.value)} type="number"/></label><label className="text-xs font-semibold">Destination account<input className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={destination} onChange={(e)=>setDestination(e.target.value)}/></label><Field label="Transaction reference" value="UPI-TXN-DEMO-84721"/><Field label="Location" value="Hyderabad, Telangana"/></div><label className="mt-4 block text-xs font-semibold">Incident description<textarea className="mt-2 min-h-28 w-full border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" defaultValue="Received a fraudulent payment request presented as account verification. Three unauthorized transfers followed."/></label>{error && <p className="mt-4 border-l-4 border-destructive bg-muted p-3 text-xs text-destructive">{error}</p>}<Button className="mt-5" disabled={busy} onClick={submit}>{busy ? "Submitting..." : "Submit Complaint"}<ArrowRight/></Button></Card><Card title="Evidence upload" icon={<UploadCloud/>}><button type="button" className="w-full border-2 border-dashed border-border bg-muted p-8 text-center"><UploadCloud className="mx-auto text-primary"/><p className="mt-3 text-sm font-semibold">Add evidence files</p><p className="mt-1 text-xs text-muted-foreground">Prototype file area; case data is submitted live</p></button><div className="mt-4 space-y-2 text-xs"><Evidence name="upi-receipt-demo.pdf"/><Evidence name="chat-screenshot-demo.png"/><Evidence name="bank-statement-demo.pdf"/></div></Card></div></Page>; }
function Field({label,value}:{label:string;value:string}){return <label className="text-xs font-semibold">{label}<input className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" defaultValue={value}/></label>}
function Evidence({name}:{name:string}){return <div className="flex items-center gap-2 border border-border bg-background p-2"><Paperclip size={14} className="text-primary"/><span className="truncate">{name}</span><CheckCircle2 size={14} className="ml-auto text-primary"/></div>}

function Status({go}:{go:(v:View)=>void}) { const events=[["Complaint registered","14 Mar · 09:41","complete"],["Police verification","14 Mar · 10:18","complete"],["Transaction analysis","In progress","active"],["Investigator review","Pending","pending"],["Action update","Pending","pending"]]; return <Page eyebrow="Case CASE-2026-00124" title="Complaint Status" actions={<Button variant="outline" onClick={()=>go("citizen")}>Back to dashboard</Button>}><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><Card title="Status timeline" icon={<Clock3/>}><div className="space-y-0">{events.map(([name,time,state],i)=><div className="relative flex gap-4 pb-8 last:pb-0" key={name}>{i<events.length-1&&<span className="absolute left-[11px] top-6 h-full w-px bg-border"/>}<span className={`z-10 mt-1 size-6 rounded-full border-4 ${state==="complete"?"border-primary bg-primary":state==="active"?"border-accent bg-accent":"border-border bg-card"}`}/><div><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">{time}</p></div></div>)}</div></Card><Card title="Complaint summary" icon={<ReceiptIndianRupee/>}><p className="text-2xl font-extrabold">₹75,000</p><p className="mt-1 text-sm text-muted-foreground">UPI Fraud</p><dl className="mt-5 grid gap-3 text-sm"><Row k="Case ID" v="CASE-2026-00124"/><Row k="District" v="Hyderabad"/><Row k="Evidence" v="4 files"/><Row k="Current team" v="Cyber Review Unit"/></dl></Card></div></Page> }
function Row({k,v}:{k:string;v:string}){return <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>}

function Police({go, liveCases, onSelect}:{go:(v:View)=>void; liveCases: ApiCase[]; onSelect: (caseId: string) => void}) { 
  const [filterType, setFilterType] = useState("ALL");
  const [filterRisk, setFilterRisk] = useState("ALL");
  
  let rows = liveCases.length ? liveCases.map(formatCase) : cases; 
  
  if (filterType !== "ALL") rows = rows.filter(r => r.type === filterType);
  if (filterRisk !== "ALL") rows = rows.filter(r => r.risk === filterRisk);
  
  return <Page eyebrow="Police operations" title="Police Dashboard" actions={<Button variant="outline"><Download/>Daily Brief</Button>}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Open cases" value={String(rows.length)} icon={<FileText/>} note="Live from case register"/><Metric label="High risk" value={String(rows.filter((c)=>c.risk === "HIGH").length)} icon={<AlertTriangle/>} note="Requires priority review"/><Metric label="Under analysis" value={String(liveCases.filter((c)=>c.status === "ANALYZED").length)} icon={<Activity/>} note="Using prediction engine"/><Metric label="Service" value="LIVE" icon={<CheckCircle2/>} note="FastAPI connected"/></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_.5fr]"><Card title="Priority case queue" icon={<Search/>}>
    <div className="mb-4 flex gap-3">
      <select className="h-9 border border-input bg-background px-3 text-xs" value={filterType} onChange={e => setFilterType(e.target.value)}>
        <option value="ALL">All Crime Types</option>
        <option value="UPI Fraud">UPI Fraud</option>
        <option value="Investment Scam">Investment Scam</option>
        <option value="Card Fraud">Card Fraud</option>
        <option value="Identity Theft">Identity Theft</option>
      </select>
      <select className="h-9 border border-input bg-background px-3 text-xs" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
        <option value="ALL">All Risk Levels</option>
        <option value="HIGH">High Risk</option>
        <option value="MEDIUM">Medium Risk</option>
        <option value="LOW">Low Risk</option>
      </select>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">Case</th><th>Fraud type</th><th>Amount</th><th>District</th><th>Risk</th><th>Updated</th><th/></tr></thead><tbody>{rows.map(c=><tr key={c.id} className="border-b border-border"><td className="p-3 font-semibold">{c.id}</td><td>{c.type}</td><td>{c.amount}</td><td>{c.district}</td><td><Risk risk={c.risk}/></td><td className="text-muted-foreground">{c.time}</td><td><Button size="sm" variant="ghost" aria-label={`Open ${c.id}`} onClick={()=>onSelect(c.id)}><ChevronRight/></Button></td></tr>)}</tbody></table></div></Card><div className="space-y-6"><Card title="Active alerts" icon={<Bell/>}><Alert text="Rapid split transfers detected" time="8 min"/><Alert text="Likely cash-out window approaching" time="21 min"/><Alert text="Account linked to prior case" time="1 hr"/></Card><Card title="Fraud mix" icon={<BarChart3/>}><Bars/></Card></div></div></Page> 
}
function Alert({text,time}:{text:string;time:string}){return <div className="mb-3 flex gap-3 border-l-2 border-destructive bg-muted p-3 last:mb-0"><AlertTriangle size={16} className="shrink-0 text-destructive"/><div><p className="text-xs font-semibold">{text}</p><p className="mt-1 text-[10px] text-muted-foreground">{time} ago</p></div></div>}
function Bars(){return <div className="space-y-4">{[["UPI fraud",72],["Investment scam",48],["Card fraud",35],["Identity theft",24]].map(([n,v])=><div key={n as string}><div className="mb-1 flex justify-between text-xs"><span>{n}</span><span>{v}%</span></div><div className="h-2 bg-muted"><div className="h-full bg-primary" style={{width:`${v}%`}}/></div></div>)}</div>}

function CaseDetail({go, caseId}:{go:(v:View)=>void; caseId:string | null}) { const [caseData,setCaseData]=useState<ApiCase | null>(null); const [prediction,setPrediction]=useState<Prediction | null>(null); const [busy,setBusy]=useState(false); useEffect(()=>{ if(!caseId) return; api.getCase(caseId).then(setCaseData).catch(()=>setCaseData(null)); api.getPrediction(caseId).then(setPrediction).catch(()=>setPrediction(null)); },[caseId]); if(!caseId || !caseData) return <Page eyebrow="Police case detail" title="No case selected"><p className="text-sm text-muted-foreground">Select a case from the police queue first.</p></Page>; const analyze=async()=>{setBusy(true); try { setPrediction(await api.analyzeCase(caseId)); } finally { setBusy(false); }}; const risk=prediction?.risk_level ?? "PENDING"; const score=prediction?.predictions[0]?.risk_score ?? 0; return <Page eyebrow="Police case detail" title={caseData.case_id} actions={<Button onClick={()=>go("investigator")}>Open Investigator Analysis<ArrowRight/></Button>}><div className="grid gap-px bg-border border border-border sm:grid-cols-4"><div className="bg-secondary p-4 text-secondary-foreground"><p className="text-[10px] uppercase opacity-70">Case</p><p className="mt-1 font-bold">{caseData.case_id}</p></div>{[["Fraud type",caseData.fraud_type.replaceAll("_"," ")],["Reported amount",`₹${caseData.amount.toLocaleString("en-IN")}`],["Status",caseData.status]].map(([k,v])=><div className="bg-card p-4" key={k}><p className="text-[10px] uppercase text-muted-foreground">{k}</p><p className="mt-1 font-bold">{v}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Card title="Transaction activity" icon={<Activity/>}><Timeline/><Button className="mt-4" disabled={busy} onClick={analyze}>{busy ? "Analysing..." : prediction ? "Re-run analysis" : "Analyse case"}<Radar/></Button></Card><Card title="Risk-level overview" icon={<AlertTriangle/>}><div className="flex items-center gap-5 border-b border-border pb-5"><div className="grid size-24 place-items-center rounded-full border-[10px] border-destructive text-2xl font-extrabold">{scorePercent(score)}</div><div><Risk risk={risk}/><p className="mt-2 text-sm text-muted-foreground">{prediction ? "Ranked prediction returned by the backend." : "Run analysis to calculate candidate location risk."}</p></div></div>{prediction && <ol className="mt-5 space-y-3">{prediction.predictions.map((item)=><li className="border-b border-border pb-3 text-sm" key={item.location_id}><span className="font-bold">#{item.rank} {item.location_name}</span><span className="float-right text-destructive">{scorePercent(item.risk_score)}</span><p className="mt-1 text-xs text-muted-foreground">{item.time_window}</p></li>)}</ol>}</Card></div></Page> }
function CaseStrip(){return <div className="grid gap-px bg-border border border-border sm:grid-cols-4"><div className="bg-secondary p-4 text-secondary-foreground"><p className="text-[10px] uppercase opacity-70">Case</p><p className="mt-1 font-bold">CASE-2026-00124</p></div>{[["Fraud type","UPI Fraud"],["Reported amount","₹75,000"],["Priority","High risk estimate"]].map(([k,v])=><div className="bg-card p-4" key={k}><p className="text-[10px] uppercase text-muted-foreground">{k}</p><p className="mt-1 font-bold">{v}</p></div>)}</div>}
function Timeline(){return <div className="space-y-4">{[["09:12","Victim account debited","₹75,000"],["09:14","Split to mule wallet 7712","₹22,500"],["09:19","Split to mule wallet 4409","₹37,500"],["10:03","Transfer to cash-out account","₹15,000"],["18:00","Estimated withdrawal window","Risk estimate"]].map(([t,n,a],i)=><div className="flex gap-3" key={t}><span className={`grid size-9 shrink-0 place-items-center text-[10px] font-bold ${i===4?"bg-accent text-accent-foreground":"bg-muted text-primary"}`}>{t}</span><div className="flex-1 border-b border-border pb-3"><p className="text-sm font-semibold">{n}</p><p className="text-xs text-muted-foreground">{a}</p></div></div>)}</div>}

function Investigator({go}:{go:(v:View)=>void}) { const [selected,setSelected]=useState(0); const selectedLocation=locations[selected] ?? locations[0]; if (!selectedLocation) return null; return <Page eyebrow="Investigator command workspace" title="Predictive Case Analysis" actions={<Button onClick={()=>go("intel-report")}><FileText/>Generate Intelligence Report</Button>}><CaseStrip/><div className="mt-6 grid gap-6 xl:grid-cols-12"><div className="space-y-6 xl:col-span-7"><Card title="Transaction timeline" icon={<Activity/>}><Timeline/></Card><Card title="Transaction relationship" icon={<Network/>}><div className="overflow-x-auto"><div className="flex min-w-[600px] items-center justify-between gap-3 py-5"><Node type="SOURCE" name="Victim A/C" active/><Link/><Node type="MULE 1" name="Wallet ·7712"/><Link/><Node type="MULE 2" name="Wallet ·4409"/><Link/><Node type="CASH-OUT" name="A/C ·9031" risk/></div></div><div className="grid gap-2 sm:grid-cols-3"><Mini text="2 linked mule wallets"/><Mini text="4 transaction hops"/><Mini text="1 probable cash-out node"/></div></Card><Card title="Explainability & supporting factors" icon={<Fingerprint/>}><Factors/></Card></div><div className="space-y-6 xl:col-span-5"><Card title="Predictive intelligence" icon={<Radar/>}><div className="flex items-start justify-between"><div><p className="text-xs uppercase text-muted-foreground">Location risk assessment</p><p className="mt-1 text-xl font-extrabold">Cash-withdrawal likelihood</p></div><Risk risk="HIGH"/></div><p className="mt-4 border-l-4 border-accent bg-muted p-3 text-xs text-muted-foreground">Probabilistic estimate only. Use with corroborating evidence and field verification.</p></Card><Card title="Ranked candidate locations" icon={<MapPin/>}>{locations.map((l,i)=><button key={l.name} onClick={()=>setSelected(i)} className={`mb-3 w-full border p-3 text-left last:mb-0 ${selected===i?"border-primary bg-muted":"border-border bg-card"}`}><div className="flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center bg-secondary text-xs font-bold text-secondary-foreground">{i+1}</span><div className="flex-1"><p className="text-sm font-bold">{l.name} — {l.area}</p><p className="mt-1 text-xs text-muted-foreground">Likely window {l.window}</p><div className="mt-2 h-1.5 bg-border"><div className={i===0?"h-full bg-destructive":"h-full bg-primary"} style={{width:`${l.score}%`}}/></div></div><span className="font-extrabold text-destructive">{l.score}%</span></div></button>)}</Card><Card title="Interactive investigation map" icon={<Map/>}><div className="map-grid relative aspect-[16/10] overflow-hidden border border-border"><span className="absolute left-3 top-3 bg-card px-2 py-1 text-[10px] font-bold civic-shadow">HYDERABAD · FICTIONAL MAP</span><div className="absolute left-[12%] top-[60%] h-1 w-[78%] rotate-[-11deg] bg-primary/20"/><div className="absolute left-[28%] top-[10%] h-[80%] w-1 rotate-[22deg] bg-primary/20"/>{locations.map((l,i)=><button key={l.name} onClick={()=>setSelected(i)} aria-label={l.name} className={`absolute ${l.pos} grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-card text-xs font-bold text-primary-foreground civic-shadow ${selected===i?"bg-destructive scale-125":"bg-primary"}`}>{i+1}</button>)}</div><div className="mt-3 flex justify-between text-xs"><span className="font-semibold">Selected: {selectedLocation.name}</span><span className="text-muted-foreground">Risk {selectedLocation.score}%</span></div></Card></div></div></Page> }
function Node({type,name,active,risk}:{type:string;name:string;active?:boolean;risk?:boolean}){return <div className={`min-w-28 border p-3 text-center ${risk?"border-destructive bg-muted":active?"border-primary bg-secondary text-secondary-foreground":"border-border bg-background"}`}><p className="text-[9px] font-bold uppercase opacity-70">{type}</p><p className="mt-1 text-xs font-semibold">{name}</p></div>}
function Link(){return <div className="flex min-w-10 flex-1 items-center"><span className="h-px flex-1 bg-border"/><ChevronRight size={16} className="text-primary"/></div>}
function Mini({text}:{text:string}){return <div className="bg-muted p-3 text-center text-xs font-semibold">{text}</div>}
function Factors(){return <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{[["Temporal similarity",88],["Geographic relevance",81],["Transaction similarity",74],["Network relationship",67],["Historical pattern",59]].map(([n,v])=><div key={n as string}><div className="flex justify-between text-xs"><span>{n}</span><strong>{v}%</strong></div><div className="mt-2 h-2 bg-muted"><div className="h-full bg-primary" style={{width:`${v}%`}}/></div></div>)}</div>}

function IntelReport({go}:{go:(v:View)=>void}) { return <Page eyebrow="Intelligence report" title="CASE-2026-00124 · Investigative Brief" actions={<div className="flex gap-2"><Button variant="outline" onClick={()=>go("investigator")}>Back to analysis</Button><Button><Download/>Download PDF</Button></div>}><div className="mx-auto max-w-5xl border border-border bg-card p-6 civic-shadow sm:p-10"><div className="flex flex-wrap justify-between gap-4 border-b-2 border-secondary pb-6"><div className="flex gap-3"><span className="grid size-12 place-items-center bg-primary text-primary-foreground"><ShieldCheck/></span><div><p className="font-extrabold">Predictive Intelligence Brief</p><p className="text-xs text-muted-foreground">Fictional SIH demonstration · Not official intelligence</p></div></div><div className="text-right text-xs"><p>Generated: 14 Mar 2026 · 14:30 IST</p><p className="font-bold">Classification: DEMO ONLY</p></div></div><div className="mt-7 grid gap-6 sm:grid-cols-3"><ReportStat label="Case reference" value="CASE-2026-00124"/><ReportStat label="Incident" value="UPI Fraud · ₹75,000"/><ReportStat label="Assessed risk" value="HIGH · 86%"/></div><section className="mt-8"><h2 className="border-b border-border pb-2 font-bold">Executive assessment</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">The fictional transaction pattern shows rapid fund splitting across two linked wallets and onward movement toward a probable cash-out account. The highest-ranked candidate is Central ATM, Secunderabad, with an estimated likelihood score of 86% during 18:00–20:00.</p></section><section className="mt-8"><h2 className="border-b border-border pb-2 font-bold">Ranked candidate locations</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Rank</th><th>Location</th><th>Risk estimate</th><th>Likely window</th></tr></thead><tbody>{locations.map((l,i)=><tr className="border-b border-border" key={l.name}><td className="p-3">0{i+1}</td><td className="font-semibold">{l.name}, {l.area}</td><td>{l.score}%</td><td>{l.window}</td></tr>)}</tbody></table></div></section><section className="mt-8"><h2 className="border-b border-border pb-2 font-bold">Supporting factors</h2><div className="mt-4"><Factors/></div></section><div className="mt-8 flex gap-3 border-l-4 border-accent bg-muted p-4 text-xs leading-relaxed text-muted-foreground"><AlertTriangle className="shrink-0 text-accent"/>This report contains fictional, probabilistic risk estimates for a frontend demonstration. It is not a prediction guarantee, operational instruction, or official record.</div></div></Page> }
function ReportStat({label,value}:{label:string;value:string}){return <div className="border border-border p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-sm font-extrabold">{value}</p></div>}
