/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Shield, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Search,
  Loader2,
  ArrowRight,
  Info,
  X,
  Copy,
  Download,
  Mail,
  History,
  LayoutDashboard,
  Calendar,
  Clock,
  ChevronRight,
  Moon,
  Sun,
  HelpCircle,
  RefreshCw,
  User as UserIcon,
  LogOut,
  Settings,
  BarChart3,
  BookOpen,
  PieChart,
  Share2,
  FileSearch,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Types
interface Procedure {
  code: string;
  description: string;
  price: number;
  avgPrice?: number;
  isOvercharged?: boolean;
  analysis?: string;
}

interface AuditResult {
  status: "approved" | "flagged" | "rejected";
  confidence_score: number;
  flags: string[];
  recommendation: string;
  error?: string;
}

interface BillDetails {
  hospitalName: string;
  hospitalAddress: string;
  accountNumber: string;
  dateOfService: string;
  patientName: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  address?: string;
  phone?: string;
}

interface AvgPriceData {
  code: string;
  description: string;
  avg_price: number;
}

interface AuditRecord {
  id: number;
  filename: string;
  hospital_name: string;
  total_savings: number;
  items_flagged: number;
  total_items: number;
  results_json: string;
  created_at: string;
}

const Tooltip = ({ text, darkMode }: { text: string, darkMode: boolean }) => (
  <div className="group relative inline-block ml-1">
    <HelpCircle className={`w-3 h-3 cursor-help ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[10px] font-medium leading-tight w-48 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl border ${
      darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-900 text-white border-slate-800'
    }`}>
      {text}
      <div className={`absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent ${
        darkMode ? 'border-t-slate-800' : 'border-t-slate-900'
      }`} />
    </div>
  </div>
);

const AdPlaceholder = ({ darkMode, className = "" }: { darkMode: boolean, className?: string }) => (
  <div className={`w-full flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-colors ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'} ${className}`}>
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>Advertisement</span>
    <div className={`w-full h-24 sm:h-32 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
      <p className={`text-xs font-medium italic ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Ad Space Available</p>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<'dashboard' | 'history' | 'profile' | 'auth' | 'analytics' | 'resources' | 'privacy' | 'terms' | 'contact' | 'about' | 'article'>('auth');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Procedure[]>([]);
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [avgPrices, setAvgPrices] = useState<Record<string, AvgPriceData>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [disputeLetter, setDisputeLetter] = useState<string | null>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);
  const [auditMode, setAuditMode] = useState<'upload' | 'manual'>('upload');
  const [claimText, setClaimText] = useState("");
  const [manualAuditResult, setManualAuditResult] = useState<AuditResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // GA4 Integration
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(script2);
    }
  }, []);

  // Articles Data
  const articles = {
    'overcharges': {
      title: "Why is my medical bill so high? 5 common overcharges to look for.",
      content: `
## Why is my medical bill so high? 5 common overcharges to look for.

Medical billing errors are more common than you think. Studies suggest that up to 80% of medical bills contain at least one error. These mistakes can cost patients hundreds or even thousands of dollars. Here are the five most common overcharges to watch out for:

### 1. Upcoding
Upcoding occurs when a provider uses a CPT code for a more expensive service than the one actually performed. For example, billing for a complex office visit when only a simple check-up occurred.

### 2. Unbundling
Unbundling is the practice of billing for several procedures separately when they should be billed under a single, comprehensive code. This often results in a higher total cost than the bundled rate.

### 3. Duplicate Charges
It's surprisingly easy for a hospital to bill you twice for the same item—like a single dose of medication, a set of X-rays, or even a day in the hospital. Always check your itemized bill for repeated entries on the same date.

### 4. Canceled Procedures
Sometimes a doctor orders a test or procedure that is later canceled. However, the billing department might not get the memo, and the charge remains on your statement.

### 5. Incorrect Quantities
Hospitals often bill for supplies like gauze, gloves, or medication by the unit. It's common to see charges for 10 units of a drug when only 1 was administered.

**How to spot them:** Always request an **itemized bill** with CPT codes. Summary bills hide these details, making it impossible to verify the accuracy of the charges.
      `
    },
    'cpt-codes': {
      title: "Understanding CPT Codes",
      content: `
## Understanding CPT Codes: The DNA of Your Medical Bill

Current Procedural Terminology (CPT) codes are a standardized set of five-digit numbers used to describe every medical, surgical, and diagnostic service provided by healthcare professionals.

### Why They Matter
Hospitals and insurance companies use these codes to communicate. When you see a charge on your bill, it's tied to a CPT code. If the code is wrong, the price is wrong.

### Common CPT Code Categories
*   **Evaluation and Management (99201-99499):** Office visits, hospital stays, and consultations.
*   **Anesthesia (00100-01999):** Services related to administering anesthesia.
*   **Surgery (10021-69990):** Surgical procedures ranging from simple stitches to heart surgery.
*   **Radiology (70010-79999):** X-rays, MRIs, and CT scans.
*   **Pathology and Laboratory (80047-89398):** Blood tests and other lab work.

### How to Use Them
Once you have your itemized bill, you can look up CPT codes online to see exactly what you're being charged for. ClaimGuardian automates this process by comparing your billed codes against regional price averages.
      `
    },
    'no-surprises-act': {
      title: "The No Surprises Act: Your Rights",
      content: `
## The No Surprises Act: Protecting You from Unexpected Bills

Effective January 1, 2022, the No Surprises Act is a federal law designed to protect patients from "surprise" medical bills in situations where they have little to no control over who provides their care.

### What it Covers
*   **Emergency Services:** If you have an emergency and receive care at an out-of-network facility or from an out-of-network provider, you cannot be billed more than the in-network rate.
*   **Non-Emergency Services at In-Network Facilities:** If you go to an in-network hospital but receive care from an out-of-network provider (like an anesthesiologist or radiologist), you are protected from balance billing.
*   **Air Ambulance Services:** Protections also apply to emergency air ambulance transportation.

### Your Protections
Providers are prohibited from sending you a "balance bill" for the difference between their charge and what your insurance paid. You are only responsible for your in-network cost-sharing amounts (like deductibles and copays).

### What to Do if You Get a Surprise Bill
If you receive a bill that you believe violates the No Surprises Act, you can file a dispute through the federal government's "No Surprises" help desk or use ClaimGuardian to help draft a formal challenge.
      `
    }
  };

  const openArticle = (id: string) => {
    setSelectedArticle(id);
    setView('article');
  };

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Auto-scroll to results when they are generated
  useEffect(() => {
    if (results.length > 0 && view === 'dashboard') {
      // Small delay to ensure the DOM has updated and the element is rendered
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [results]);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(userData => {
        setUser(userData);
        setView('dashboard');
      })
      .catch(() => {
        setView('auth');
      });

    // Fetch average prices from our backend
    fetch('/api/prices')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      })
      .then(data => {
        const priceMap: Record<string, AvgPriceData> = {};
        data.forEach((item: AvgPriceData) => {
          priceMap[item.code] = item;
        });
        setAvgPrices(priceMap);
      })
      .catch(err => console.error("Failed to fetch prices", err));

    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/audits');
      if (res.status === 401) {
        setUser(null);
        setView('auth');
        return;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      setAuditHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const exportToCSV = () => {
    if (!Array.isArray(results) || results.length === 0) return;

    const totalSavingsVal = results.reduce((acc, curr) => {
      if (curr.isOvercharged && curr.avgPrice) {
        return acc + (curr.price - curr.avgPrice);
      }
      return acc;
    }, 0);

    const flaggedCount = results.filter(r => r.isOvercharged).length;

    // Summary Section
    const summary = [
      ["\"CLAIMGUARDIAN MEDICAL BILL AUDIT REPORT\""],
      [`"Generated on: ${new Date().toLocaleString()}"`],
      [`"Source File: ${file?.name || 'Manual Entry'}"`],
      [""],
      ["\"AUDIT SUMMARY\""],
      ["\"Total Items Analyzed\"", `"${results.length}"`],
      ["\"Items Flagged for Overcharging\"", `"${flaggedCount}"`],
      ["\"Total Potential Savings\"", `"$${totalSavingsVal.toFixed(2)}"`],
      [""],
      ["\"DETAILED AUDIT RESULTS\""],
    ];

    const headers = ["\"Procedure Code\"", "\"Description\"", "\"Billed Price ($)\"", "\"Regional Avg. Price ($)\"", "\"Status\"", "\"Potential Savings ($)\""];
    
    const rows = results.map(item => {
      const savings = item.isOvercharged && item.avgPrice ? (item.price - item.avgPrice) : 0;
      return [
        `"${item.code}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.price.toFixed(2)}"`,
        `"${(item.avgPrice || 0).toFixed(2)}"`,
        `"${item.isOvercharged ? "OVERCHARGED" : "FAIR PRICE"}"`,
        `"${savings.toFixed(2)}"`
      ];
    });

    const csvContent = [
      ...summary.map(row => row.join(",")),
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ClaimGuardian_Audit_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  const resetAudit = () => {
    setFile(null);
    setPreview(null);
    setResults([]);
    setBillDetails(null);
    setDisputeLetter(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualAudit = async () => {
    if (!claimText.trim()) return;
    
    setLoading(true);
    setError(null);
    setManualAuditResult(null);
    
    try {
      const response = await fetch('/api/analyze-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setManualAuditResult(result);
        
        // Save to history if user is logged in
        if (user) {
          try {
            await fetch('/api/audits', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: "manual_audit.txt",
                hospital_name: "Manual Claim Audit",
                total_billed: 0,
                total_savings: 0,
                items_flagged: result.status === 'approved' ? 0 : 1,
                total_items: 1,
                results: result
              })
            });
            fetchHistory();
          } catch (dbErr) {
            console.error("Failed to save manual audit to history:", dbErr);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze the claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const auditBill = async () => {
    if (!file || !preview) return;

    setLoading(true);
    setError(null);
    try {
      const base64Data = preview.split(',')[1];
      
      const response = await fetch('/api/audit-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Audit failed");
      }

      const extractedData = await response.json();
      const procedures: any[] = extractedData.procedures || [];
      const details: BillDetails = {
        hospitalName: extractedData.hospitalName || 'Unknown Hospital',
        hospitalAddress: extractedData.hospitalAddress || '',
        accountNumber: extractedData.accountNumber || '',
        dateOfService: extractedData.dateOfService || '',
        patientName: extractedData.patientName || ''
      };
      
      // Map to our internal Procedure type
      const enrichedData: Procedure[] = procedures.map(proc => ({
        code: proc.code,
        description: proc.description,
        price: proc.price,
        avgPrice: proc.fairPrice, // Use AI's fair price as avgPrice
        isOvercharged: proc.isOvercharged,
        analysis: proc.analysis
      }));

      setResults(enrichedData);
      setBillDetails(details);

      // Save to history if user is logged in
      if (user) {
        try {
          const savings = enrichedData.reduce((acc, curr) => {
            if (curr.isOvercharged && curr.avgPrice) {
              return acc + (curr.price - curr.avgPrice);
            }
            return acc;
          }, 0);

          const res = await fetch('/api/audits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              hospital_name: details.hospitalName,
              total_savings: savings,
              items_flagged: enrichedData.filter(r => r.isOvercharged).length,
              total_items: enrichedData.length,
              results: { details, procedures: enrichedData }
            })
          });

          if (res.status === 401) {
            setUser(null);
            setView('auth');
            return;
          }

          fetchHistory();
        } catch (dbErr) {
          console.error("Failed to save audit to history:", dbErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze the bill. Please ensure the image is clear and try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = Array.isArray(results) ? results.reduce((acc, curr) => {
    if (curr.isOvercharged && curr.avgPrice) {
      return acc + (curr.price - curr.avgPrice);
    }
    return acc;
  }, 0) : 0;

  const loadAuditFromHistory = (record: AuditRecord) => {
    const parsed = JSON.parse(record.results_json);
    
    // Reset all results first
    setResults([]);
    setBillDetails(null);
    setManualAuditResult(null);

    if (record.hospital_name === "Manual Claim Audit") {
      setManualAuditResult(parsed as AuditResult);
      setAuditMode('manual');
    } else if (Array.isArray(parsed)) {
      setResults(parsed);
      setAuditMode('upload');
    } else {
      setResults(parsed.procedures || []);
      setBillDetails(parsed.details || null);
      setAuditMode('upload');
    }
    
    setFile(null);
    setPreview(null);
    setView('dashboard');
    
    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const generateLetter = async () => {
    if (results.length === 0) return;
    
    setIsGeneratingLetter(true);
    try {
      const flaggedItems = results.filter(r => r.isOvercharged);
      const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const userInfo = user ? `
      [Sender Name]: ${user.full_name}
      [Sender Address]: ${user.address || '[Your Address]'}
      [Sender Phone]: ${user.phone || '[Your Phone Number]'}
      [Sender Email]: ${user.email}
      ` : '';

      const response = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          billDetails,
          userInfo
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Letter generation failed");
      }

      const data = await response.json();
      setDisputeLetter(data.letter || "Failed to generate letter.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate the dispute letter. Please try again.");
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setView('auth');
  };

  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '' });
  const [profileForm, setProfileForm] = useState({ full_name: '', address: '', phone: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        address: user.address || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authForm.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (authMode === 'signup') {
      if (authForm.full_name.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      
      // Password strength validation: min 8 chars, at least one letter and one number
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,}$/;
      if (!passwordRegex.test(authForm.password)) {
        setError("Password must be at least 8 characters long and contain both letters and numbers.");
        return;
      }
    } else {
      if (!authForm.password) {
        setError("Please enter your password.");
        return;
      }
    }

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      console.log(`[AUTH] Response status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[AUTH] Unexpected response from server:", text);
        throw new Error(`The server returned an unexpected response (HTML instead of JSON). Status: ${res.status}. Response starts with: ${text.substring(0, 50)}...`);
      }

      const data = await res.json();
      if (!res.ok) {
        if (authMode === 'login' && data.error === "User not found") {
          setAuthMode('signup');
          setError(null); 
          setMessage("Welcome! It looks like you're new here. Please complete your registration.");
          return;
        }
        if (authMode === 'signup' && data.error === "Email already exists") {
          setAuthMode('login');
          setError("This email is already registered. Please sign in.");
          return;
        }
        throw new Error(data.error || 'Auth failed');
      }
      setUser(data);
      setView('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (!res.ok) throw new Error('Update failed');
      setUser(prev => prev ? { ...prev, ...profileForm } : null);
      setView('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    if (disputeLetter) {
      navigator.clipboard.writeText(disputeLetter);
      // Could add a toast here
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${
        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 group cursor-pointer shrink-0" onClick={() => setView(user ? 'dashboard' : 'auth')}>
              <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-display font-bold tracking-tight hidden xs:block">ClaimGuardian</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0">
              {user && (
                <div className={`flex p-1 rounded-full border overflow-x-auto hide-scrollbar ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() => setView('dashboard')}
                    className={`shrink-0 flex items-center justify-center gap-2 p-2 lg:px-4 lg:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      view === 'dashboard'
                        ? (darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden lg:block">Dashboard</span>
                  </button>
                  <button
                    onClick={() => setView('history')}
                    className={`shrink-0 flex items-center justify-center gap-2 p-2 lg:px-4 lg:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      view === 'history'
                        ? (darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="History"
                  >
                    <History className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden lg:block">History</span>
                  </button>
                  <button
                    onClick={() => setView('analytics')}
                    className={`shrink-0 flex items-center justify-center gap-2 p-2 lg:px-4 lg:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      view === 'analytics'
                        ? (darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Analytics"
                  >
                    <BarChart3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden lg:block">Analytics</span>
                  </button>
                  <button
                    onClick={() => setView('resources')}
                    className={`shrink-0 flex items-center justify-center gap-2 p-2 lg:px-4 lg:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      view === 'resources'
                        ? (darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Resources"
                  >
                    <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden lg:block">Resources</span>
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                {user && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setView('profile')}
                      className={`flex items-center gap-2 px-3 py-1.5 lg:py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                        view === 'profile'
                          ? (darkMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white')
                          : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600')
                      }`}
                      title="Profile"
                    >
                      <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs font-bold hidden lg:block">{user.full_name.split(' ')[0]}</span>
                    </button>
                    
                    <button
                      onClick={logout}
                      className={`p-1.5 sm:p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-red-400 hover:bg-red-500/10' : 'bg-white border-slate-200 text-red-500 hover:bg-red-50'
                      }`}
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {view === 'auth' ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="text-center mb-8">
                  <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/20">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-display font-bold">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {authMode === 'login' ? 'Sign in to manage your medical audits' : 'Join ClaimGuardian to start auditing bills'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authForm.full_name}
                        onChange={e => setAuthForm({ ...authForm, full_name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                        placeholder="John Doe"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-sm font-medium text-indigo-500 hover:text-indigo-600"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : view === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: User Summary */}
                <div className="lg:col-span-1 space-y-6">
                  <div className={`p-8 rounded-3xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-600/20">
                      <span className="text-3xl font-display font-bold text-white">
                        {user?.full_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-bold">{user?.full_name}</h2>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                    
                    <div className={`p-4 rounded-2xl border text-left ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium">Verified Member</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Audits Performed</span>
                        <span className="font-bold">{auditHistory.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Total Savings Found</span>
                        <span className="font-bold text-emerald-500">
                          ${auditHistory.reduce((acc, curr) => acc + curr.total_savings, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Edit Details */}
                <div className="lg:col-span-2">
                  <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                        <Settings className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-display font-bold">Account Details</h2>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Update your information for personalized dispute letters</p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.full_name}
                            onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Mailing Address</label>
                          <textarea
                            rows={3}
                            value={profileForm.address}
                            onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                            placeholder="123 Medical Way, Suite 100, City, State, ZIP"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                            placeholder="(555) 000-0000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email (Read-only)</label>
                          <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className={`w-full px-4 py-3 rounded-xl border outline-none opacity-50 cursor-not-allowed ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                          type="submit"
                          className="w-full sm:flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setView('dashboard')}
                          className={`w-full sm:flex-1 py-4 rounded-xl font-bold border-2 transition-all ${darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-tight"
                >
                  Stop <span className="text-indigo-600">Overpaying</span> for Medical Care
                </motion.h1>
                <p className={`text-base sm:text-lg lg:text-xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Upload your medical bill and let our AI audit it against regional averages. 
                  We'll help you spot overcharges and generate a dispute letter in seconds.
                </p>
              </div>

              {/* Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-2xl lg:max-w-none mx-auto">
                {/* Left Column: Audit Input */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                  <div className={`p-1 rounded-2xl flex items-center mb-2 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                    <button 
                      onClick={() => setAuditMode('upload')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${auditMode === 'upload' ? (darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-500'}`}
                    >
                      Upload Bill
                    </button>
                    <button 
                      onClick={() => setAuditMode('manual')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${auditMode === 'manual' ? (darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-500'}`}
                    >
                      Manual Audit
                    </button>
                  </div>

                  {auditMode === 'upload' ? (
                    <section className={`p-5 sm:p-8 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl">
                          <Upload className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-display font-bold">Upload Bill</h3>
                      </div>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const droppedFile = e.dataTransfer.files[0];
                          if (droppedFile && droppedFile.type.startsWith('image/')) {
                            setFile(droppedFile);
                            const reader = new FileReader();
                            reader.onload = () => setPreview(reader.result as string);
                            reader.readAsDataURL(droppedFile);
                          }
                        }}
                        className={`group relative border-2 border-dashed rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                          file 
                            ? (darkMode ? 'border-indigo-500 bg-indigo-500/5' : 'border-indigo-400 bg-indigo-50') 
                            : (darkMode ? 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50' : 'border-slate-200 hover:border-indigo-500/50 hover:bg-slate-50')
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden" 
                          accept="image/*"
                        />
                        
                        {file ? (
                          <div className="text-center space-y-2">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
                              <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div>
                              <p className={`text-xs sm:text-sm font-bold truncate max-w-[150px] sm:max-w-[200px] ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{file.name}</p>
                              <p className="text-[10px] sm:text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-4">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 ${darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                              <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm font-bold">Click to upload</p>
                              <p className="text-[10px] sm:text-xs text-slate-500">or drag and drop bill image</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        disabled={!file || loading}
                        onClick={auditBill}
                        className={`w-full mt-6 sm:mt-8 group relative px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                            Start Audit
                          </>
                        )}
                      </button>

                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${darkMode ? 'bg-red-900/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
                        >
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                      )}
                    </section>
                  ) : (
                    <section className={`p-5 sm:p-8 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl">
                          <FileSearch className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-display font-bold">Manual Claim Audit</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Claim Description / Notes</label>
                        <textarea
                          rows={6}
                          value={claimText}
                          onChange={(e) => setClaimText(e.target.value)}
                          placeholder="Enter claim descriptions, billing codes, or provider notes here for AI auditing..."
                          className={`w-full px-4 py-4 rounded-2xl border outline-none transition-all resize-none text-sm ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                        />
                      </div>

                      <button
                        disabled={!claimText.trim() || loading}
                        onClick={handleManualAudit}
                        className={`w-full mt-6 sm:mt-8 group relative px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            Auditing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                            Run AI Audit
                          </>
                        )}
                      </button>

                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${darkMode ? 'bg-red-900/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
                        >
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                      )}
                    </section>
                  )}

                  {/* Preview Section */}
                  <AnimatePresence>
                    {preview && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/30'}`}
                      >
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Document Preview</h4>
                        <div className="relative rounded-xl overflow-hidden border border-inherit">
                          <img src={preview} alt="Bill Preview" className="w-full h-auto" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-7 space-y-8">
                  {manualAuditResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className={`p-8 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${
                              manualAuditResult.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                              manualAuditResult.status === 'flagged' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {manualAuditResult.status === 'approved' ? <CheckCircle2 className="w-8 h-8" /> :
                               manualAuditResult.status === 'flagged' ? <AlertCircle className="w-8 h-8" /> :
                               <X className="w-8 h-8" />}
                            </div>
                            <div>
                              <h3 className="text-2xl font-display font-bold capitalize">{manualAuditResult.status}</h3>
                              <p className="text-sm text-slate-500 font-medium">Audit Status</p>
                            </div>
                          </div>
                          
                          <div className="text-center sm:text-right">
                            <div className="text-3xl font-display font-extrabold text-indigo-600">{manualAuditResult.confidence_score}%</div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Confidence Score</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Identified Issues</h4>
                            <div className="flex flex-wrap gap-2">
                              {manualAuditResult.flags.length > 0 ? (
                                manualAuditResult.flags.map((flag, i) => (
                                  <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
                                  }`}>
                                    {flag}
                                  </span>
                                ))
                              ) : (
                                <p className="text-sm text-slate-400 italic">No issues identified.</p>
                              )}
                            </div>
                          </div>

                          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/50 border-indigo-100/50'}`}>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Recommendation</h4>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {manualAuditResult.recommendation}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                          <button 
                            onClick={() => {
                              setClaimText("");
                              setManualAuditResult(null);
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            New Audit
                          </button>
                          <button 
                            onClick={() => {
                              const text = `Audit Status: ${manualAuditResult.status}\nConfidence: ${manualAuditResult.confidence_score}%\nFlags: ${manualAuditResult.flags.join(', ')}\nRecommendation: ${manualAuditResult.recommendation}`;
                              navigator.clipboard.writeText(text);
                              setMessage("Audit results copied to clipboard!");
                              setTimeout(() => setMessage(null), 3000);
                            }}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Results
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : results.length > 0 ? (
                    <motion.div 
                      ref={resultsRef}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      {/* Bento Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Potential Savings</p>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-display font-extrabold text-emerald-500">${totalSavings.toFixed(2)}</span>
                            <span className="text-xs text-slate-500 font-medium">USD</span>
                          </div>
                        </div>

                        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Items Flagged</p>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-display font-extrabold text-amber-500">{results.filter(r => r.isOvercharged).length}</span>
                            <span className="text-xs text-slate-500 font-medium">/ {results.length} total items</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Results Table */}
                      <div className={`rounded-3xl border overflow-hidden transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                          <h3 className="text-lg font-display font-bold">Audit Details</h3>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={exportToCSV}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <Download className="w-4 h-4" />
                              Export CSV
                            </button>
                            <button
                              onClick={() => setShowShareModal(true)}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                darkMode ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100'
                              }`}
                            >
                              <Share2 className="w-4 h-4" />
                              Share Audit
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                                <th className="px-4 sm:px-6 py-4">Procedure</th>
                                <th className="px-4 sm:px-6 py-4 text-right">Billed</th>
                                <th className="px-4 sm:px-6 py-4 text-right">Regional Avg</th>
                                <th className="px-4 sm:px-6 py-4 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-inherit">
                              {results.map((proc, idx) => (
                                <tr key={idx} className={`group transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-indigo-50/30'}`}>
                                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                                    <p className="font-bold text-xs sm:text-sm tracking-tight">{proc.description}</p>
                                    <div className="flex flex-col gap-1 mt-1">
                                      <p className="text-[9px] sm:text-[10px] font-mono text-slate-500">CPT {proc.code}</p>
                                      {proc.analysis && (
                                        <p className={`text-[10px] sm:text-xs italic ${proc.isOvercharged ? 'text-amber-500' : 'text-emerald-500'}`}>
                                          "{proc.analysis}"
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                                    <p className={`font-mono font-bold text-xs sm:text-sm ${proc.isOvercharged ? 'text-amber-500' : ''}`}>
                                      ${proc.price.toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                                    <p className="font-mono text-[10px] sm:text-sm text-slate-500">
                                      ${proc.avgPrice?.toFixed(2) || '---'}
                                    </p>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                                    <div className="flex justify-center">
                                      {proc.isOvercharged ? (
                                        <span className="px-2 sm:px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider border border-amber-500/20 whitespace-nowrap">
                                          High Charge
                                        </span>
                                      ) : (
                                        <span className="px-2 sm:px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 whitespace-nowrap">
                                          Fair Rate
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Action Banner */}
                      {totalSavings > 0 && (
                        <div className={`rounded-3xl p-6 sm:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl transition-all ${darkMode ? 'bg-indigo-600 shadow-none' : 'bg-indigo-600 shadow-indigo-200'}`}>
                          <div className="text-center lg:text-left">
                            <h4 className="text-xl sm:text-2xl font-display font-extrabold">Ready to dispute?</h4>
                            <p className="text-indigo-100 text-xs sm:text-sm mt-1">We've drafted a professional dispute letter for you.</p>
                          </div>
                          <button 
                            onClick={generateLetter}
                            disabled={isGeneratingLetter}
                            className={`w-full lg:w-auto group px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 ${darkMode ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl shadow-indigo-700/20'}`}
                          >
                            {isGeneratingLetter ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Mail className="w-5 h-5 sm:w-6 sm:h-6" />}
                            {isGeneratingLetter ? 'Generating...' : 'Generate Letter'}
                            {!isGeneratingLetter && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />}
                          </button>
                        </div>
                      )}

                      {/* Dispute Letter Modal */}
                      <AnimatePresence>
                        {disputeLetter && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md"
                          >
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 20 }}
                              className={`w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
                            >
                              <div className="p-5 sm:p-8 border-b border-inherit flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="p-2 sm:p-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl">
                                    <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl sm:text-2xl font-display font-bold">Dispute Letter</h3>
                                    <p className="text-[10px] sm:text-sm text-slate-500">AI-generated based on your audit results</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setDisputeLetter(null)}
                                  className={`p-1.5 sm:p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
                                >
                                  <X className="w-6 h-6 sm:w-8 sm:h-8" />
                                </button>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 custom-scrollbar">
                                <div className={`p-6 sm:p-10 rounded-2xl sm:rounded-3xl border shadow-inner transition-all ${darkMode ? 'bg-slate-950 border-slate-800 prose-invert' : 'bg-slate-50 border-slate-200 prose-slate'} prose prose-sm sm:prose-base max-w-none`}>
                                  <Markdown>{disputeLetter}</Markdown>
                                </div>
                              </div>

                              <div className={`p-5 sm:p-8 border-t border-inherit flex flex-col items-center justify-between gap-4 ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                                <p className="text-[10px] sm:text-sm text-slate-500 font-medium text-center sm:text-left">Review and edit as needed before sending.</p>
                                <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
                                  <button 
                                    onClick={copyToClipboard}
                                    className={`flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-bold text-xs sm:text-base transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Copy
                                  </button>
                                  <button 
                                    className="flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-bold text-xs sm:text-base hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                                  >
                                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Start New Audit */}
                      <div className="flex justify-center pt-12">
                        <button
                          onClick={resetAudit}
                          className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg transition-all border-2 ${
                            darkMode 
                              ? 'border-slate-800 hover:border-indigo-500 text-slate-500 hover:text-indigo-400' 
                              : 'border-slate-200 hover:border-indigo-500 text-slate-400 hover:text-indigo-600'
                          }`}
                        >
                          <RefreshCw className="w-6 h-6" />
                          Start New Audit
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed transition-all ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-100 shadow-inner'}`}>
                      <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <FileText className={`w-8 h-8 sm:w-12 sm:h-12 ${darkMode ? 'text-slate-700' : 'text-slate-200'}`} />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-display font-bold mb-2">No Audit Results Yet</h3>
                      <p className={`max-w-xs mx-auto text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Upload a medical bill or insurance statement to start the AI-powered audit process.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 sm:space-y-10"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">Audit History</h2>
                  <p className={`text-base sm:text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review and manage your past medical bill audits.</p>
                </div>
                <button
                  onClick={fetchHistory}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${darkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </div>

              {auditHistory.length === 0 ? (
                <div className={`p-12 sm:p-32 text-center rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-slate-50/30'}`}>
                  <History className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-6 opacity-10" />
                  <p className="text-lg sm:text-2xl font-display font-bold opacity-30">No audits found yet.</p>
                  <button 
                    onClick={() => setView('dashboard')}
                    className="mt-6 sm:mt-8 px-6 sm:px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Start Your First Audit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {auditHistory.map((record) => (
                    <motion.div
                      key={record.id}
                      whileHover={{ y: -4, scale: 1.005 }}
                      className={`p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                        darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:border-indigo-500/50 shadow-xl shadow-slate-200/40'
                      }`}
                      onClick={() => loadAuditFromHistory(record)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 relative z-10">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 group-hover:bg-indigo-500/10' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-lg sm:text-2xl mb-1 truncate max-w-[180px] sm:max-w-none">
                              {record.hospital_name || record.filename}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-sm opacity-50 font-medium">
                              {record.hospital_name && record.filename && record.filename !== "manual_audit.txt" && (
                                <span className="flex items-center gap-1.5 italic opacity-70">{record.filename}</span>
                              )}
                              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> {new Date(record.created_at).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 sm:w-4 sm:h-4" /> {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-12 border-t md:border-t-0 pt-4 md:pt-0">
                          <div className="space-y-1">
                            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-black opacity-30">Potential Savings</p>
                            <p className="text-xl sm:text-3xl font-display font-extrabold text-emerald-500 tracking-tight">${record.total_savings.toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-black opacity-30">Items Flagged</p>
                            <p className="text-xl sm:text-3xl font-display font-extrabold text-amber-500 tracking-tight">{record.items_flagged}<span className="text-sm sm:text-lg opacity-30 font-bold">/{record.total_items}</span></p>
                          </div>
                          <div className={`p-2 sm:p-3 rounded-full transition-all ${darkMode ? 'bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Subtle background accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold">Analytics Dashboard</h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track your savings and audit performance over time.</p>
                </div>
              </div>

              {auditHistory.length === 0 ? (
                <div className={`p-12 text-center rounded-[2rem] border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-slate-50/30'}`}>
                  <PieChart className="w-16 h-16 mx-auto mb-6 opacity-10" />
                  <p className="text-xl font-display font-bold opacity-30">No data available for analytics.</p>
                  <p className="mt-2 text-sm opacity-50">Complete some audits to see your savings trends.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Cards */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Total Savings</h3>
                    <p className="text-4xl font-display font-extrabold text-emerald-500">
                      ${auditHistory.reduce((acc, curr) => acc + curr.total_savings, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Total Audits</h3>
                    <p className="text-4xl font-display font-extrabold text-indigo-500">{auditHistory.length}</p>
                  </div>
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Avg Savings / Audit</h3>
                    <p className="text-4xl font-display font-extrabold text-amber-500">
                      ${(auditHistory.reduce((acc, curr) => acc + curr.total_savings, 0) / auditHistory.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Chart */}
                  <div className={`md:col-span-3 p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h3 className="text-lg font-display font-bold mb-6">Savings per Audit</h3>
                    <div className="w-full">
                      <ResponsiveContainer width="100%" height={300} debounce={50}>
                        <BarChart data={auditHistory.slice().reverse().map((a, i) => ({ name: `Audit ${i + 1}`, savings: a.total_savings }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                          <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                          <RechartsTooltip 
                            cursor={{ fill: darkMode ? '#1e293b' : '#f1f5f9' }}
                            contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Savings']}
                          />
                          <Bar dataKey="savings" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === 'resources' ? (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold">Patient Resource Hub</h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Expert guides and SEO-optimized insights to help you navigate medical billing.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Featured Article */}
                  <div className={`p-8 rounded-[2.5rem] border overflow-hidden relative group ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                    <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6">Featured Guide</span>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold mb-4 leading-tight">Why is my medical bill so high? 5 common overcharges to look for.</h3>
                    <p className={`text-base leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Medical billing errors are more common than you think. From "upcoding" to "unbundling," hospitals often use complex terminology that leads to patients overpaying by thousands of dollars. In this guide, we break down the most frequent errors and how to spot them using your itemized statement.
                    </p>
                    <button 
                      onClick={() => openArticle('overcharges')}
                      className="flex items-center gap-2 text-indigo-500 font-bold hover:gap-3 transition-all"
                    >
                      Read Full Article <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Article Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                      <h4 className="font-display font-bold text-lg mb-3">Understanding CPT Codes</h4>
                      <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        CPT codes are the DNA of your medical bill. Learn how to decode them and verify if you're being billed for the right level of care.
                      </p>
                      <button 
                        onClick={() => openArticle('cpt-codes')}
                        className="text-xs font-bold text-indigo-500 hover:underline"
                      >
                        Learn More
                      </button>
                    </div>
                    <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                      <h4 className="font-display font-bold text-lg mb-3">The No Surprises Act</h4>
                      <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        New federal laws protect you from surprise out-of-network bills. Know your rights before you pay that unexpected statement.
                      </p>
                      <button 
                        onClick={() => openArticle('no-surprises-act')}
                        className="text-xs font-bold text-indigo-500 hover:underline"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar: SEO/Quick Tips */}
                <div className="space-y-6">
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-indigo-900/20 border-indigo-900/30' : 'bg-indigo-50 border-indigo-100'}`}>
                    <h4 className="font-display font-bold text-indigo-600 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Quick Negotiation Tips
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">1</div>
                        <p className="text-xs font-medium leading-relaxed">Always request an <strong>itemized bill</strong> with CPT codes.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">2</div>
                        <p className="text-xs font-medium leading-relaxed">Compare prices against <strong>Fair Market Value</strong> (FMV).</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">3</div>
                        <p className="text-xs font-medium leading-relaxed">Ask for a <strong>prompt-pay discount</strong> if you can pay in full.</p>
                      </li>
                    </ul>
                  </div>

                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h4 className="font-display font-bold mb-4">Common Questions</h4>
                    <div className="space-y-4">
                      <details className="group">
                        <summary className="text-xs font-bold cursor-pointer list-none flex justify-between items-center">
                          Can I negotiate a bill after it's paid?
                          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                        </summary>
                        <p className="text-[10px] mt-2 opacity-60 leading-relaxed">Yes, though it's harder. You can still audit for errors and request a refund for overcharges.</p>
                      </details>
                      <details className="group">
                        <summary className="text-xs font-bold cursor-pointer list-none flex justify-between items-center">
                          What is "Balance Billing"?
                          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                        </summary>
                        <p className="text-[10px] mt-2 opacity-60 leading-relaxed">When a provider bills you for the difference between their charge and what your insurance paid.</p>
                      </details>
                    </div>
                  </div>

                  {/* Affiliate/Partner Section */}
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h4 className="font-display font-bold mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Trusted Partners
                    </h4>
                    <div className="space-y-4">
                      <a href="#" className="block group">
                        <p className="text-xs font-bold group-hover:text-indigo-500 transition-colors">Medical Bill Advocates Co.</p>
                        <p className="text-[10px] opacity-60 mt-1">Professional help for bills over $5,000.</p>
                      </a>
                      <div className={`h-px w-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                      <a href="#" className="block group">
                        <p className="text-xs font-bold group-hover:text-indigo-500 transition-colors">Patient Rights Law Group</p>
                        <p className="text-[10px] opacity-60 mt-1">Legal representation for insurance denials.</p>
                      </a>
                    </div>
                  </div>

                  {/* Digital Product CTA */}
                  <div className={`p-6 rounded-3xl border relative overflow-hidden group ${darkMode ? 'bg-indigo-600' : 'bg-indigo-600'} text-white`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
                    <h4 className="font-display font-bold mb-2 relative z-10">Negotiation Toolkit</h4>
                    <p className="text-[10px] text-indigo-100 mb-4 relative z-10">Get our premium templates, scripts, and FMV database access.</p>
                    <button className="w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors relative z-10">
                      Get the Toolkit — $29
                    </button>
                  </div>
                </div>
              </div>

              {/* Ad Placeholder in Resource Hub */}
              <AdPlaceholder darkMode={darkMode} className="mt-8" />
            </motion.div>
          ) : view === 'privacy' ? (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`max-w-4xl mx-auto p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}
            >
              <h2 className="text-3xl font-display font-bold mb-6">Privacy Policy</h2>
              <div className={`space-y-6 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>1. Information We Collect</h3>
                <p>We collect information you provide directly to us when you create an account, upload a medical bill, or communicate with us. This may include your name, email address, phone number, and the contents of the medical bills you upload.</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>2. How We Use Your Information</h3>
                <p>We use the information we collect to provide, maintain, and improve our services, specifically to analyze your medical bills for potential overcharges and generate dispute letters on your behalf.</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>3. Data Security</h3>
                <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>4. Sharing of Information</h3>
                <p>We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as AI processing for bill analysis.</p>
              </div>
            </motion.div>
          ) : view === 'terms' ? (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`max-w-4xl mx-auto p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}
            >
              <h2 className="text-3xl font-display font-bold mb-6">Terms and Conditions</h2>
              <div className={`space-y-6 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>1. Acceptance of Terms</h3>
                <p>By accessing or using ClaimGuardian, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>2. Description of Service</h3>
                <p>ClaimGuardian provides an AI-powered tool to analyze medical bills and generate dispute letters. We do not provide legal or financial advice. The generated letters are templates and should be reviewed by you before sending.</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>3. User Responsibilities</h3>
                <p>You are responsible for the accuracy of the information you provide. You agree not to use the service for any illegal or unauthorized purpose.</p>
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>4. Limitation of Liability</h3>
                <p>ClaimGuardian shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.</p>
              </div>
            </motion.div>
          ) : view === 'contact' ? (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`max-w-2xl mx-auto p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold">Contact Us</h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>We're here to help with your medical billing questions.</p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); setView('dashboard'); }}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    defaultValue={user?.full_name || ''}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    defaultValue={user?.email || ''}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          ) : view === 'about' ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`max-w-4xl mx-auto p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}
            >
              <h2 className="text-3xl font-display font-bold mb-6">About ClaimGuardian</h2>
              <div className={`space-y-6 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <p className="text-lg font-medium text-indigo-500">Empowering patients to take control of their medical finances.</p>
                
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Our Mission</h3>
                <p>Medical billing in the United States is notoriously complex and prone to errors. Studies show that up to 80% of medical bills contain mistakes. ClaimGuardian was founded with a single mission: to provide every patient with the tools and data they need to ensure they are only paying for the care they actually received, at a fair market price.</p>
                
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>How It Works</h3>
                <p>Using advanced AI models and regional healthcare pricing databases, ClaimGuardian analyzes your itemized medical bills. We identify potential duplicate charges, unbundled codes, and prices that significantly exceed regional averages (Fair Market Value). Once an audit is complete, we provide you with a professional dispute letter template to send to your provider's billing department.</p>
                
                <h3 className={`text-xl font-display font-bold mt-8 mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Our Values</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Transparency:</strong> We believe healthcare pricing should be clear and accessible to everyone.</li>
                  <li><strong>Privacy:</strong> Your medical data is sensitive. We use industry-standard security to protect your information.</li>
                  <li><strong>Advocacy:</strong> We are on the patient's side, providing the evidence needed to challenge unfair billing practices.</li>
                </ul>
              </div>
            </motion.div>
          ) : view === 'article' && selectedArticle && articles[selectedArticle as keyof typeof articles] ? (
            <motion.div
              key="article-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={() => setView('resources')}
                className={`flex items-center gap-2 mb-8 font-bold text-sm transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Resources
              </button>

              <div className={`p-8 sm:p-12 rounded-[2.5rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
                <div className="markdown-body prose prose-slate dark:prose-invert max-w-none">
                  <Markdown>{articles[selectedArticle as keyof typeof articles].content}</Markdown>
                </div>
                
                {/* Ad Placeholder inside Article */}
                <AdPlaceholder darkMode={darkMode} className="mt-12" />
                
                {/* Affiliate CTA in Article */}
                <div className={`mt-12 p-8 rounded-3xl border-2 border-indigo-500/20 ${darkMode ? 'bg-indigo-500/5' : 'bg-indigo-50'}`}>
                  <h4 className="text-lg font-display font-bold mb-2">Need professional help?</h4>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    If your bill is over $5,000, you might benefit from a professional medical bill advocate. Our partners at <strong>AdvocateCare</strong> have a 95% success rate in reducing large bills.
                  </p>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                    Get a Free Consultation
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-bold">Share Your Savings</h3>
                <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Help others save on medical bills by sharing your audit results.
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    const text = `I just saved $${totalSavings.toFixed(2)} on my medical bill using ClaimGuardian! Check it out: ${window.location.origin}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </div>
                    <span className="font-bold">Share on X</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => {
                    const title = `I saved $${totalSavings.toFixed(2)} on my medical bill!`;
                    const url = window.location.origin;
                    window.open(`https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FF4500] text-white rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.056 1.597.04.21.06.423.06.637 0 2.512-3.493 4.554-7.8 4.554-4.307 0-7.8-2.042-7.8-4.554 0-.215.02-.426.062-.637a1.75 1.75 0 0 1-1.056-1.597c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.183.479 1.187-.85 2.82-1.419 4.617-1.508l.856-4.015a.4.4 0 0 1 .473-.31l3.327.7a1.25 1.25 0 0 1 1.25-1.245zM10.5 10a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm4.25 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-4.25 4a3 3 0 0 0-3 3 .5.5 0 0 0 1 0 2 2 0 0 1 2-2 2 2 0 0 1 2 2 .5.5 0 0 0 1 0 3 3 0 0 0-3-3z"/></svg>
                    </div>
                    <span className="font-bold">Share on Reddit</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    alert('Link copied to clipboard!');
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                      <Copy className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Copy Link</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 border-t mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2 opacity-50">
          <Shield className="w-5 h-5" />
          <span className="font-bold tracking-tight">ClaimGuardian</span>
        </div>
        <p className={`text-[10px] md:text-sm text-center md:text-left ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>© 2026 ClaimGuardian AI. All rights reserved. For informational purposes only.</p>
        <div className={`flex items-center gap-4 md:gap-6 text-xs md:text-sm font-medium ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          <button onClick={() => setView('about')} className="hover:text-blue-500 transition-colors">About</button>
          <button onClick={() => setView('privacy')} className="hover:text-blue-500 transition-colors">Privacy</button>
          <button onClick={() => setView('terms')} className="hover:text-blue-500 transition-colors">Terms</button>
          <button onClick={() => setView('contact')} className="hover:text-blue-500 transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );
}
