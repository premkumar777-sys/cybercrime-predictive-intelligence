import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BadgeIndianRupee,
  UsersRound,
  Building2,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/* ============================================================
   INTERACTIVE LEARNING CORNER & CYBER SAFETY MEASURES
   3-level drill-down: Categories → Sub-types → Detail
   ============================================================ */

export type FraudDetail = {
  name: string;
  howItWorks: string;
  warningSigns: string[];
  whatToDo: string[];
  helpline?: string;
};

export type FraudCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
  borderColor: string;
  frauds: FraudDetail[];
};

export const fraudCategories: FraudCategory[] = [
  {
    id: "financial",
    title: "Financial Fraud",
    subtitle: "UPI, cards, banking, investment & digital payment fraud",
    icon: <BadgeIndianRupee size={22} />,
    color: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-300 dark:border-rose-800",
    frauds: [
      {
        name: "UPI Fraud",
        howItWorks:
          'Fraudsters send collect requests or fake payment links on WhatsApp/SMS, asking victims to enter their UPI PIN to "receive" money. In reality, entering the PIN authorizes a debit from the victim\'s bank account.',
        warningSigns: [
          "Someone asks you to enter your UPI PIN to receive money",
          "Unexpected collect requests from unknown UPI IDs",
          "Links claiming cashback or refund requiring PIN entry",
          'QR codes shared over WhatsApp for "receiving" payments',
        ],
        whatToDo: [
          "Never enter UPI PIN to receive money — PIN is only for sending/debiting",
          "Decline unknown collect requests immediately",
          "Report the UPI ID on your payment app",
          "Call 1930 within the golden hour to freeze fraudulent transfers",
        ],
        helpline: "1930",
      },
      {
        name: "Card Fraud",
        howItWorks:
          "Criminals obtain card details through skimming devices, fake websites, or social engineering calls pretending to be bank officials. They use the stolen card number, expiry, and CVV for unauthorized online transactions.",
        warningSigns: [
          'Calls from "bank officials" asking for card number, CVV, or OTP',
          "Unrecognized transactions in your statement",
          "Suspicious ATM machines with loose card slots or overlays",
          "Emails with links to update card details urgently",
        ],
        whatToDo: [
          "Never share card CVV, PIN, or OTP over phone or email",
          "Block the card immediately via your bank app",
          "File a complaint at cybercrime.gov.in",
          "Report to your bank and request a chargeback",
        ],
      },
      {
        name: "OTP Fraud",
        howItWorks:
          "Fraudsters call pretending to be bank representatives, delivery agents, or government officials. They trick victims into sharing OTPs received on their phone, which are then used to authorize transactions or account changes.",
        warningSigns: [
          "Caller asks you to read out or forward an OTP",
          "Urgent tone — claims your account will be blocked",
          "OTP received without initiating any transaction",
          "Caller knows partial account details to gain trust",
        ],
        whatToDo: [
          "OTPs are confidential — never share with anyone, including bank staff",
          "Hang up and call your bank's official helpline directly",
          "Report the phone number to the Telecom operator",
          "File a report at cybercrime.gov.in immediately",
        ],
      },
      {
        name: "QR Code Scam",
        howItWorks:
          'Scammers share QR codes via online marketplaces (OLX, social media) claiming the buyer needs to scan to "receive" payment. Scanning the QR actually initiates a payment FROM the victim\'s account to the scammer.',
        warningSigns: [
          "Buyer insists on sending QR code for payment",
          "QR code scan asks you to enter UPI PIN",
          "Transaction preview shows money going OUT, not coming IN",
        ],
        whatToDo: [
          "QR codes are only for paying — never scan to receive money",
          'Use your UPI app\'s "request money" feature to receive payments',
          "Report fraudulent QR codes to your payment app",
        ],
      },
      {
        name: "KYC Scam",
        howItWorks:
          "Victims receive SMS/WhatsApp messages claiming their bank account or wallet will be suspended unless they complete KYC verification through a link or by installing an app (APK). The link harvests banking credentials or the APK gives remote access to the device.",
        warningSigns: [
          "SMS threatening account suspension for incomplete KYC",
          "Links to non-official websites for KYC completion",
          "Request to download APK files for verification",
          'Caller asks to install AnyDesk/TeamViewer for "KYC help"',
        ],
        whatToDo: [
          "Banks never ask for KYC via SMS links or APK downloads",
          "Visit your bank branch or use the official banking app",
          "Never install third-party apps on anyone's request",
          "Report suspicious messages to your bank and dial 1930",
        ],
      },
      {
        name: "Investment Scam",
        howItWorks:
          'Fraudsters create fake investment platforms, Telegram/WhatsApp groups promising 300-400% returns on stock trading, cryptocurrency, or forex. Victims are initially shown fake profits to build trust, then asked for larger deposits which are never returned.',
        warningSigns: [
          "Guaranteed high returns with zero risk",
          'Invitation to "VIP trading groups" on Telegram/WhatsApp',
          'Pressure to invest more to "unlock" withdrawal',
          "Platform not registered with SEBI or RBI",
        ],
        whatToDo: [
          "Verify platform registration on SEBI/RBI official websites",
          "Never invest based on social media or messaging app tips",
          'Be suspicious of any "guaranteed return" promises',
          "Report to cybercrime.gov.in with screenshots of communications",
        ],
      },
      {
        name: "Loan Scam",
        howItWorks:
          'Predatory loan apps offer instant loans with minimal documentation. They later harass borrowers with excessive interest, threaten to share morphed photos with contacts, or access personal data from the phone for blackmail.',
        warningSigns: [
          "Loan app requests excessive permissions (contacts, photos, camera)",
          "No RBI registration or NBFC license visible",
          "Interest rates hidden or excessively high",
          "Harassment calls and threats after borrowing",
        ],
        whatToDo: [
          "Only use RBI-registered lending platforms",
          "Check app permissions before installing",
          "Report harassing loan apps to cybercrime.gov.in",
          "Contact your state's cyber cell for immediate intervention",
        ],
      },
      {
        name: "E-Wallet / AePS Fraud",
        howItWorks:
          "In AePS (Aadhaar-enabled Payment System) fraud, criminals use cloned biometric data (fingerprints) stolen from property registration offices or other databases to withdraw money from victims' bank accounts linked to Aadhaar.",
        warningSigns: [
          "Unexplained debits from your Aadhaar-linked bank account",
          "Transaction messages showing AePS withdrawals you didn't make",
          "Your biometric was used at an unfamiliar location",
        ],
        whatToDo: [
          "Lock your Aadhaar biometrics on mAadhaar app or UIDAI website",
          "Link only one bank account to Aadhaar if possible",
          "Report unauthorized AePS transactions to your bank immediately",
          "File a police complaint and report at cybercrime.gov.in",
        ],
      },
    ],
  },
  {
    id: "social",
    title: "Social & Communication",
    subtitle: "Phishing, vishing, impersonation & social media fraud",
    icon: <UsersRound size={22} />,
    color: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-300 dark:border-blue-800",
    frauds: [
      {
        name: "Phishing",
        howItWorks:
          "Fraudsters send emails or messages disguised as trusted organizations (banks, government, e-commerce) containing malicious links. Clicking the link leads to fake websites that steal login credentials, card details, or personal information.",
        warningSigns: [
          "Email from unknown sender with urgent action required",
          "URL doesn't match the official website domain",
          "Grammatical errors or unusual formatting in the email",
          "Attachments with suspicious extensions (.exe, .apk)",
        ],
        whatToDo: [
          "Never click links in unsolicited emails — type the URL manually",
          "Check the sender's actual email address carefully",
          "Enable two-factor authentication on all accounts",
          "Report phishing emails to the impersonated organization",
        ],
      },
      {
        name: "Vishing",
        howItWorks:
          "Voice phishing — criminals call pretending to be bank officials, police, or government officers. They use fear tactics (account blocked, legal action) to extract sensitive information like passwords, OTPs, or card details over the phone.",
        warningSigns: [
          "Caller claims to be from RBI, police, or CBI",
          "Threats of arrest or legal action if you don't comply",
          "Request for sensitive financial information over phone",
          "Caller ID spoofed to show official-looking numbers",
        ],
        whatToDo: [
          "Hang up immediately and call the official helpline yourself",
          "Government agencies never ask for money or personal data over phone",
          "Record the number and report to your telecom provider",
          "File a complaint at cybercrime.gov.in",
        ],
      },
      {
        name: "Smishing",
        howItWorks:
          "SMS phishing — victims receive text messages with links claiming prize wins, delivery updates, or account verification. Clicking leads to credential-harvesting websites or downloads malware onto the phone.",
        warningSigns: [
          "SMS with shortened URLs from unknown numbers",
          "Messages claiming you've won a prize or lottery",
          "Urgent SMS about package delivery requiring action",
          "Messages asking to verify account by clicking a link",
        ],
        whatToDo: [
          "Never click links in SMS from unknown senders",
          "Verify delivery status directly on the courier's official website",
          "Block and report spam numbers",
          "Forward suspicious SMS to your telecom provider",
        ],
      },
      {
        name: "Social Media Fraud",
        howItWorks:
          "Scammers create fake profiles on Facebook, Instagram, or LinkedIn to build trust. They then promote fake products, investment schemes, or romance to extract money. Hacked accounts are also used to message contacts requesting emergency money transfers.",
        warningSigns: [
          "New profile with very few posts or connections",
          "Friend requests from people you already follow",
          "Urgent messages from friends asking for money",
          "Too-good-to-be-true deals on social media marketplaces",
        ],
        whatToDo: [
          "Verify requests by calling the person directly",
          "Enable privacy settings and two-factor authentication",
          "Report fake profiles to the platform",
          "Never send money based on social media messages alone",
        ],
      },
      {
        name: "Impersonation",
        howItWorks:
          "Criminals impersonate senior officials, company executives, or family members via calls, emails, or WhatsApp. Using spoofed numbers or hacked accounts, they create urgency to request immediate fund transfers.",
        warningSigns: [
          "Boss or CEO urgently requesting wire transfer via email/WhatsApp",
          "Family member claiming emergency from an unknown number",
          "Request to keep the transaction confidential",
          "Slight variations in email address or phone number",
        ],
        whatToDo: [
          "Always verify through an independent communication channel",
          "Establish a code word with family for emergencies",
          "Check email headers for spoofing indicators",
          "Report to cyber cell and the impersonated organization",
        ],
      },
      {
        name: "Account Takeover",
        howItWorks:
          "Attackers gain unauthorized access to email, banking, or social media accounts through credential stuffing (reused passwords), SIM swap, or phishing. Once inside, they change passwords, make transactions, or impersonate the victim.",
        warningSigns: [
          "Unable to log in to your own accounts",
          "Password reset emails you didn't request",
          "Unknown devices listed in your account's security settings",
          "Friends report receiving strange messages from your account",
        ],
        whatToDo: [
          "Use unique, strong passwords for every account",
          "Enable two-factor authentication everywhere",
          "Check for unauthorized account activity regularly",
          "Contact the platform's support immediately to recover the account",
        ],
      },
      {
        name: "Romance / Matrimonial Scam",
        howItWorks:
          "Fraudsters create attractive profiles on dating or matrimonial platforms. They build emotional connections over weeks or months, then fabricate emergencies (medical bills, visa fees, customs charges) to request money from victims.",
        warningSigns: [
          "Person refuses to video call or meet in person",
          "Relationship progresses unusually fast",
          "Requests for money citing medical, legal, or travel emergencies",
          "Profile photos look too perfect or are stock images",
        ],
        whatToDo: [
          "Never send money to someone you haven't met in person",
          "Reverse image search their profile photos",
          "Be cautious of overseas contacts with urgent financial requests",
          "Report the profile and file a complaint at cybercrime.gov.in",
        ],
      },
    ],
  },
  {
    id: "employment",
    title: "Employment & Shopping",
    subtitle: "Job fraud, online shopping scams & fake services",
    icon: <Building2 size={22} />,
    color: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-300 dark:border-amber-800",
    frauds: [
      {
        name: "Job Fraud",
        howItWorks:
          'Fake recruiters post job listings on social media, Telegram, or WhatsApp offering high-paying part-time work (Google reviews, YouTube likes, data entry). Victims are asked to pay registration fees or make "task deposits" that are never returned.',
        warningSigns: [
          "Job requires upfront payment for registration or training",
          "Salary seems unrealistically high for minimal work",
          "Communication only through WhatsApp or Telegram — no official email",
          "No verifiable company website or office address",
        ],
        whatToDo: [
          "Legitimate employers never ask for money from applicants",
          "Verify the company on MCA portal and LinkedIn",
          "Research the offer online before paying anything",
          "Report fraudulent job listings to the platform and cybercrime.gov.in",
        ],
      },
      {
        name: "Online Shopping Fraud",
        howItWorks:
          "Scammers create fake e-commerce websites or social media stores offering branded products at deep discounts. After payment, victims receive counterfeit goods, wrong items, or nothing at all. Refund requests are ignored.",
        warningSigns: [
          "Prices significantly lower than market rate",
          "Website has no return policy, contact number, or physical address",
          "Only accepts bank transfer or UPI — no cash on delivery",
          "No customer reviews or only suspiciously positive reviews",
        ],
        whatToDo: [
          "Shop only on verified, well-known e-commerce platforms",
          "Use cash on delivery when possible for unknown sellers",
          "Check for HTTPS and trust seals on the website",
          "Report the website to cybercrime.gov.in with order details",
        ],
      },
      {
        name: "Fake Customer Care",
        howItWorks:
          'Victims searching Google for customer support numbers find fraudulent numbers posted by scammers. When they call, the fake "support agent" asks them to install remote access apps or share banking details to "resolve" the issue.',
        warningSigns: [
          "Customer care number found via Google search instead of official website",
          "Agent asks to install AnyDesk, TeamViewer, or QuickSupport",
          "Agent asks for bank details, OTP, or card information",
          'Agent asks you to transfer money for "verification"',
        ],
        whatToDo: [
          "Always find customer care numbers only from the official app or website",
          "Never install remote access apps on anyone's instructions",
          "Never share OTP, CVV, or banking passwords with support agents",
          "Report fake numbers to the brand and cybercrime.gov.in",
        ],
      },
      {
        name: "Fake Refund Scam",
        howItWorks:
          "Scammers contact victims claiming a refund is pending for a cancelled order or overpayment. They send a link or UPI collect request that actually debits money instead of crediting it.",
        warningSigns: [
          "Unexpected call about a refund you didn't request",
          'Request to enter UPI PIN or scan QR to "receive" refund',
          "Link to a non-official website for refund processing",
          "Caller knows your recent order details (may have been leaked)",
        ],
        whatToDo: [
          "Refunds are processed automatically — you never need to enter PIN to receive money",
          "Check refund status only on the official app or website",
          "Never click refund links sent via SMS or WhatsApp",
          "Report to the e-commerce platform and dial 1930",
        ],
      },
    ],
  },
  {
    id: "emerging",
    title: "Emerging / Serious Threats",
    subtitle: "Digital arrest, malware, sextortion & SIM swap",
    icon: <Shield size={22} />,
    color: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-300 dark:border-purple-800",
    frauds: [
      {
        name: "Digital Arrest",
        howItWorks:
          'Scammers impersonate police, CBI, customs, or RBI officials via video call. They claim the victim is implicated in money laundering or drug trafficking, show fake arrest warrants, and demand immediate payment to "settle" the case. Victims are kept on call for hours ("digital arrest") and threatened not to contact anyone.',
        warningSigns: [
          'Video call from "police" or "CBI" demanding money',
          "Shown fake warrants, court orders, or Aadhaar details",
          "Told to stay on call and not contact family or real police",
          "Demand for large sum via bank transfer or cryptocurrency",
        ],
        whatToDo: [
          "No law enforcement agency conducts arrests or investigations via video call",
          "Hang up immediately — it is 100% a scam",
          "Call your local police station to verify",
          "Report on cybercrime.gov.in and dial 1930",
        ],
        helpline: "1930",
      },
      {
        name: "Malware",
        howItWorks:
          "Malicious software is delivered through email attachments, fake app downloads, or compromised websites. Once installed, malware can steal passwords, record keystrokes, encrypt files for ransom (ransomware), or give attackers remote control of the device.",
        warningSigns: [
          "Device running unusually slow or overheating",
          "Unknown apps appearing on your phone",
          "Pop-up ads even when no browser is open",
          "Unusual data usage or battery drain",
        ],
        whatToDo: [
          "Install apps only from Google Play Store or Apple App Store",
          "Keep your device OS and apps updated",
          "Use reputable antivirus software",
          "If infected, disconnect from internet and factory reset if needed",
        ],
      },
      {
        name: "Sextortion",
        howItWorks:
          "Criminals connect with victims through video calls, record compromising footage (often using pre-recorded videos to trick victims), and then threaten to share the recordings with contacts unless a ransom is paid.",
        warningSigns: [
          "Stranger initiates video call and quickly turns it intimate",
          "Threats to share screenshots or videos with your contacts",
          "Demands for money via cryptocurrency or gift cards",
          "Claims to have hacked your webcam",
        ],
        whatToDo: [
          "Do not pay — payment rarely stops the threats and often leads to more demands",
          "Block the person on all platforms immediately",
          "Save evidence (screenshots, messages) for the police",
          "Report at cybercrime.gov.in — many victims are helped by cyber cells",
        ],
      },
      {
        name: "SIM Swap",
        howItWorks:
          "Fraudsters gather personal information about the victim, then contact the telecom provider pretending to be the victim. They get a new SIM card issued for the victim's number, gaining access to all SMS-based OTPs and banking notifications.",
        warningSigns: [
          "Sudden loss of mobile network signal for no reason",
          "Unable to make calls or send SMS",
          "Notification from telecom about SIM change you didn't request",
          "Unknown transactions in bank account after losing signal",
        ],
        whatToDo: [
          "Contact your telecom provider immediately if you lose signal unexpectedly",
          "Set a SIM PIN or port lock on your number",
          "Use app-based authentication instead of SMS OTP where possible",
          "Report unauthorized SIM swap to police and cybercrime.gov.in",
        ],
      },
      {
        name: "Business Email Compromise",
        howItWorks:
          "Attackers hack or spoof business email accounts to intercept invoice or payment communications. They modify bank account details in legitimate invoices, redirecting payments to fraudulent accounts. Often targets finance teams in organizations.",
        warningSigns: [
          "Email from vendor with changed bank account details",
          "Slight variation in email domain (e.g., .co instead of .com)",
          "Urgency to process payment immediately",
          "Request to change payment method or bank details via email only",
        ],
        whatToDo: [
          "Verify bank account changes by calling the vendor on a known number",
          "Implement dual-authorization for payment changes",
          "Check email headers for signs of spoofing",
          "Report to your organization's IT security team and file a police complaint",
        ],
      },
    ],
  },
];

export function LearningCorner() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedFraudName, setSelectedFraudName] = useState<string | null>(null);

  const selectedCategory = fraudCategories.find((c) => c.id === selectedCategoryId) || null;
  const selectedFraud = selectedCategory?.frauds.find((f) => f.name === selectedFraudName) || null;

  const goBack = () => {
    if (selectedFraud) {
      setSelectedFraudName(null);
    } else if (selectedCategory) {
      setSelectedCategoryId(null);
    }
  };

  return (
    <div className="border border-border bg-card civic-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        {(selectedCategory || selectedFraud) && (
          <button
            onClick={goBack}
            className="grid size-7 place-items-center rounded-xs border border-border bg-muted hover:bg-muted/80 text-foreground mr-1 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={15} />
          </button>
        )}
        <BookOpen className="text-primary" size={20} />
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-foreground leading-tight">
            {selectedFraud
              ? selectedFraud.name
              : selectedCategory
              ? selectedCategory.title
              : "Cyber Safety Measures & Citizen Learning Corner"}
          </h2>
          {!selectedFraud && !selectedCategory && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Learn about different types of cybercrimes and how to protect yourself
            </p>
          )}
          {selectedCategory && !selectedFraud && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selectedCategory.subtitle} — select a fraud type to learn more
            </p>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* ===== LEVEL 1: Fraud Categories ===== */}
        {!selectedCategory && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fraudCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-start gap-4 border ${cat.borderColor} ${cat.color} p-5 text-left transition-all hover:shadow-md hover:scale-[1.01] group`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xs bg-white dark:bg-slate-800 border border-border text-primary shadow-sm">
                  {cat.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {cat.subtitle}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-primary">
                    {cat.frauds.length} fraud types →
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ===== LEVEL 2: Fraud Sub-types List ===== */}
        {selectedCategory && !selectedFraud && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCategory.frauds.map((fraud, idx) => (
              <button
                key={fraud.name}
                onClick={() => setSelectedFraudName(fraud.name)}
                className="flex items-center gap-3 border border-border bg-background p-4 text-left transition-all hover:bg-muted/50 hover:border-primary/40 hover:shadow-sm group"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xs bg-primary/10 text-primary text-xs font-bold">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {fraud.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {fraud.howItWorks.substring(0, 80)}…
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* ===== LEVEL 3: Fraud Detail View ===== */}
        {selectedFraud && (
          <div className="space-y-6">
            {/* How it Works */}
            <div className="border-l-4 border-primary bg-muted/30 p-4">
              <h3 className="text-xs font-bold uppercase text-primary tracking-wider">How it works</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {selectedFraud.howItWorks}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Warning Signs */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-amber-500" />
                  <h3 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Warning Signs
                  </h3>
                </div>
                <ul className="space-y-2">
                  {selectedFraud.warningSigns.map((sign, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-400" />
                      {sign}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to Do */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    What to Do
                  </h3>
                </div>
                <ul className="space-y-2">
                  {selectedFraud.whatToDo.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Helpline callout */}
            {selectedFraud.helpline && (
              <div className="flex items-center gap-3 border border-border bg-muted/20 p-4">
                <span className="grid size-10 shrink-0 place-items-center bg-amber-400 text-slate-950 font-extrabold text-lg rounded-xs">
                  {selectedFraud.helpline}
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">National Cyber Crime Helpline</p>
                  <p className="text-[11px] text-muted-foreground">Dial immediately for Golden Hour response — available 24×7</p>
                </div>
              </div>
            )}

            {/* General helpline strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>
                Report all cybercrimes at <strong className="text-foreground">cybercrime.gov.in</strong> or dial <strong className="text-foreground">1930</strong>
              </span>
              <button
                onClick={goBack}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <ChevronLeft size={13} /> Back to {selectedCategory?.title}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Also export as CyberSafetyLearningCorner for backwards compatibility
export { LearningCorner as CyberSafetyLearningCorner };
