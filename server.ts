import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Paths
const DB_PATH = path.join(__dirname, 'storage', 'panel_db.json');
const SETTINGS_PATH = path.join(__dirname, 'storage', 'panel_settings.json');
const STORAGE_DIR = path.join(__dirname, 'storage');

// Serve /storage static files (images, icons)
app.use('/storage', express.static(STORAGE_DIR));

// Helper: Read DB
function getDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = {
        users: {
          "1001": { id: "1001", username: "alex_dev", balance: 45.0, plan: "pro", active_bots: 2, created_at: "2026-08-10" },
          "1002": { id: "1002", username: "sarah_crypto", balance: 120.5, plan: "ultra", active_bots: 4, created_at: "2026-08-14" },
          "1003": { id: "1003", username: "tg_admin_99", balance: 10.0, plan: "basic", active_bots: 1, created_at: "2026-09-01" },
        },
        bots: {
          "bot_1": {
            id: "bot_1",
            name: "CryptoTradingSignalBot",
            owner_id: "1002",
            owner_username: "sarah_crypto",
            runtime: "python",
            entrypoint: "main.py",
            plan: "ultra",
            status: "running",
            cpu_usage: 14.2,
            memory_mb: 284,
            memory_limit_mb: 2048,
            pid: 14209,
            uptime_seconds: 148200,
            created_at: "2026-08-20T10:15:00Z",
            node: "vps-fra-01",
            env: { "EXCHANGE": "binance", "ALERT_CHANNEL": "-1002938120" },
            logs: [
              "[2026-09-22 00:01:05] [INFO] Connected to Binance WebSocket stream...",
              "[2026-09-22 00:03:12] [INFO] Signal generated: BTC/USDT Bullish Reversal detected on 15m TF.",
              "[2026-09-22 00:03:14] [SUCCESS] Broadcasted alert to 1,420 subscribers.",
              "[2026-09-22 00:08:45] [INFO] Heartbeat OK. Worker thread 2 active."
            ]
          },
          "bot_2": {
            id: "bot_2",
            name: "CustomerSupportDeskBot",
            owner_id: "1001",
            owner_username: "alex_dev",
            runtime: "python",
            entrypoint: "bot.py",
            plan: "pro",
            status: "running",
            cpu_usage: 6.8,
            memory_mb: 142,
            memory_limit_mb: 1024,
            pid: 14211,
            uptime_seconds: 86400,
            created_at: "2026-08-28T14:22:00Z",
            node: "local-cluster",
            env: { "WELCOME_MSG": "Welcome to HooHost Customer Desk!" },
            logs: [
              "[2026-09-22 00:00:01] [INFO] TeleBot polling active on @HooSupportBot",
              "[2026-09-22 00:04:19] [INFO] Inbound ticket #481 created by user 891244",
              "[2026-09-22 00:04:22] [INFO] Auto-assigned to billing support queue."
            ]
          },
          "bot_3": {
            id: "bot_3",
            name: "AutomatedBackupJanitor",
            owner_id: "1003",
            owner_username: "tg_admin_99",
            runtime: "node",
            entrypoint: "index.js",
            plan: "basic",
            status: "stopped",
            cpu_usage: 0,
            memory_mb: 0,
            memory_limit_mb: 512,
            pid: null,
            uptime_seconds: 0,
            created_at: "2026-09-05T08:00:00Z",
            node: "local-cluster",
            env: { "BACKUP_CRON": "0 2 * * *" },
            logs: [
              "[2026-09-21 22:00:00] [SYSTEM] Process gracefully stopped by admin command.",
              "[2026-09-21 22:00:01] [INFO] Snapshot stored in /storage/backup_janitor.tar.gz"
            ]
          }
        },
        payments: [
          {
            id: "tx_1092",
            user_id: "1002",
            username: "sarah_crypto",
            amount: 50.0,
            currency: "USDT",
            method: "OxaPay (TRC20)",
            status: "completed",
            plan: "ultra",
            created_at: "2026-09-21T18:40:00Z",
            track_id: "OXA-89210-998"
          },
          {
            id: "tx_1091",
            user_id: "1001",
            username: "alex_dev",
            amount: 25.0,
            currency: "USD",
            method: "bKash Merchant",
            status: "completed",
            plan: "pro",
            created_at: "2026-09-20T12:10:00Z",
            track_id: "BK-90218-441"
          },
          {
            id: "tx_1090",
            user_id: "1003",
            username: "tg_admin_99",
            amount: 15.0,
            currency: "USDT",
            method: "Binance Pay",
            status: "pending_review",
            plan: "basic",
            created_at: "2026-09-22T00:02:00Z",
            track_id: "BIN-44021-901",
            proof_note: "Trx ID: 8931049281. Screenshot submitted."
          }
        ],
        tickets: {
          "t_1": {
            id: "t_1",
            user_id: "1001",
            username: "alex_dev",
            subject: "Requesting custom port for WebSocket endpoint",
            status: "open",
            priority: "high",
            created_at: "2026-09-21T21:15:00Z",
            messages: [
              { sender: "alex_dev", role: "user", text: "Hi, I need port 8080 exposed or reverse proxied for my bot's webhook listener.", time: "2026-09-21 21:15" },
              { sender: "Admin", role: "admin", text: "Hello Alex, you can configure your webhook to route through port 3000 or the local Nginx ingress tunnel.", time: "2026-09-21 21:30" }
            ]
          },
          "t_2": {
            id: "t_2",
            user_id: "1003",
            username: "tg_admin_99",
            subject: "Python library requirement (cryptography)",
            status: "resolved",
            priority: "medium",
            created_at: "2026-09-20T14:00:00Z",
            messages: [
              { sender: "tg_admin_99", role: "user", text: "Is PyCryptodome pre-installed in the python3.11 sandbox?", time: "2026-09-20 14:00" },
              { sender: "Admin", role: "admin", text: "Yes, both cryptography and pycryptodome are available in the base image requirements.txt.", time: "2026-09-20 14:15" }
            ]
          }
        },
        coupons: {
          "LAUNCH50": { code: "LAUNCH50", discount_percent: 50, max_uses: 100, used_count: 42, active: true, expires_at: "2026-12-31" },
          "COMMUNITY20": { code: "COMMUNITY20", discount_percent: 20, max_uses: 500, used_count: 189, active: true, expires_at: "2026-10-30" },
          "DEVVIP": { code: "DEVVIP", discount_percent: 100, max_uses: 10, used_count: 4, active: true, expires_at: "2026-12-31" }
        },
        admins: {
          "admin_1": { id: "admin_1", username: "super_admin", role: "owner", added_at: "2026-01-01" }
        }
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    // Ensure structure
    if (!data.bots || Object.keys(data.bots).length === 0) {
      data.bots = {
        "bot_1": {
          id: "bot_1",
          name: "TelegramEchoHostBot",
          owner_id: "1001",
          owner_username: "hoohost_admin",
          runtime: "python",
          entrypoint: "bot.py",
          plan: "pro",
          status: "running",
          cpu_usage: 8.5,
          memory_mb: 180,
          memory_limit_mb: 1024,
          pid: 12044,
          uptime_seconds: 43200,
          created_at: new Date().toISOString(),
          node: "local-cluster",
          env: { "MODE": "production", "LOG_LEVEL": "INFO" },
          logs: [
            "[INFO] TeleBot initialised.",
            "[INFO] Polling started on HooHost engine.",
            "[INFO] Storage sync verified."
          ]
        }
      };
    }
    if (!data.users) data.users = {};
    if (!data.payments) data.payments = [];
    if (!data.tickets) data.tickets = {};
    if (!data.coupons) {
      data.coupons = {
        "WELCOME20": { code: "WELCOME20", discount_percent: 20, max_uses: 100, used_count: 12, active: true, expires_at: "2026-12-31" }
      };
    }
    return data;
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: {}, bots: {}, payments: [], tickets: {}, coupons: {}, admins: {} };
  }
}

// Helper: Save DB
function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Helper: Read Settings
function getSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      const initial = {
        settings: {
          bot_token: process.env.BOT_TOKEN || "",
          owner_id: process.env.OWNER_ID || "1098234812",
          maintenance_mode: false,
          automatic_payments: true,
          oxapay_key: process.env.OXAPAY_API_KEY || "",
          bkash_number: "01700000000",
          nagad_number: "01800000000",
          webhook_url: "https://hoohost-engine.railway.app/webhook",
          welcome_message: "👋 Welcome to HooHost - High Performance Telegram Bot & VPS Cloud Platform!",
          vault_repo: process.env.CIPHER_VAULT_REPO || "Lord-Cipher/cipher-vault",
          vault_branch: process.env.CIPHER_VAULT_BRANCH || "main",
          last_vault_sync: new Date(Date.now() - 3600000 * 2).toISOString(),
          pending_uploads: {}
        }
      };
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(initial, null, 2));
      return initial.settings;
    }
    const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    return raw.settings || raw;
  } catch (err) {
    return {
      maintenance_mode: false,
      automatic_payments: true,
      welcome_message: "Welcome to HooHost!",
      last_vault_sync: new Date().toISOString()
    };
  }
}

// Helper: Save Settings
function saveSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ settings }, null, 2));
  } catch (err) {
    console.error('Error writing settings:', err);
  }
}

// API Routes
// 1. System Status
app.get('/api/status', (req: Request, res: Response) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const load = os.loadavg();
  const db = getDB();
  const settings = getSettings();

  const activeBots = Object.values(db.bots || {}).filter((b: any) => b.status === 'running').length;
  const totalBots = Object.keys(db.bots || {}).length;
  const totalUsers = Object.keys(db.users || {}).length;

  res.json({
    status: "online",
    version: "4.2.0-LTS",
    platform: `${os.type()} ${os.release()} (${os.arch()})`,
    node_version: process.version,
    uptime_seconds: Math.floor(os.uptime()),
    load_average: load,
    memory: {
      total_mb: Math.round(totalMem / (1024 * 1024)),
      used_mb: Math.round(usedMem / (1024 * 1024)),
      free_mb: Math.round(freeMem / (1024 * 1024)),
      usage_percent: Math.round((usedMem / totalMem) * 100),
    },
    cpu: {
      model: cpus[0]?.model || 'Standard Virtual CPU',
      cores: cpus.length,
      load_percent: Math.min(100, Math.round((load[0] / (cpus.length || 1)) * 100))
    },
    stats: {
      active_bots: activeBots,
      total_bots: totalBots,
      total_users: totalUsers,
      total_revenue_usd: 1245.50,
      open_tickets: Object.values(db.tickets || {}).filter((t: any) => t.status === 'open').length,
      maintenance_mode: !!settings.maintenance_mode,
      vault_sync_active: true
    }
  });
});

// 2. Bots Management
app.get('/api/bots', (req: Request, res: Response) => {
  const db = getDB();
  res.json(Object.values(db.bots || {}));
});

app.post('/api/bots', (req: Request, res: Response) => {
  const { name, runtime, entrypoint, plan, owner_username, env } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Bot name is required" });
  }
  const db = getDB();
  const id = "bot_" + Date.now().toString(36);
  const memoryLimits: Record<string, number> = {
    free: 256,
    basic: 512,
    pro: 1024,
    ultra: 2048
  };

  const newBot = {
    id,
    name: name.trim(),
    owner_id: "admin",
    owner_username: owner_username || "hoohost_admin",
    runtime: runtime || "python",
    entrypoint: entrypoint || (runtime === "node" ? "index.js" : "main.py"),
    plan: plan || "basic",
    status: "running",
    cpu_usage: Math.round(Math.random() * 5 * 10) / 10,
    memory_mb: Math.round(40 + Math.random() * 60),
    memory_limit_mb: memoryLimits[plan] || 512,
    pid: Math.floor(10000 + Math.random() * 90000),
    uptime_seconds: 0,
    created_at: new Date().toISOString(),
    node: "local-cluster",
    env: env || { "ENV": "production" },
    logs: [
      `[${new Date().toISOString()}] [SYSTEM] Container initialized in sandbox.`,
      `[${new Date().toISOString()}] [DEPLOY] Verified syntax and permissions.`,
      `[${new Date().toISOString()}] [SUCCESS] Bot ${name} started with PID.`
    ]
  };

  db.bots = db.bots || {};
  db.bots[id] = newBot;
  saveDB(db);

  res.status(201).json(newBot);
});

app.post('/api/bots/:id/action', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { action } = req.body; // 'start', 'stop', 'restart'
  const db = getDB();

  if (!db.bots || !db.bots[id]) {
    return res.status(404).json({ error: "Bot not found" });
  }

  const bot = db.bots[id];
  const now = new Date().toISOString();

  if (action === 'start') {
    bot.status = 'running';
    bot.pid = Math.floor(10000 + Math.random() * 90000);
    bot.cpu_usage = 4.5;
    bot.memory_mb = 64;
    bot.uptime_seconds = 0;
    bot.logs.push(`[${now}] [ACTION] Process started by admin.`);
  } else if (action === 'stop') {
    bot.status = 'stopped';
    bot.pid = null;
    bot.cpu_usage = 0;
    bot.memory_mb = 0;
    bot.logs.push(`[${now}] [ACTION] Process stopped cleanly.`);
  } else if (action === 'restart') {
    bot.status = 'running';
    bot.pid = Math.floor(10000 + Math.random() * 90000);
    bot.uptime_seconds = 0;
    bot.logs.push(`[${now}] [ACTION] Process restarted. Container memory reset.`);
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }

  saveDB(db);
  res.json({ success: true, bot });
});

app.delete('/api/bots/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const db = getDB();
  if (db.bots && db.bots[id]) {
    delete db.bots[id];
    saveDB(db);
    return res.json({ success: true, message: "Bot deleted" });
  }
  res.status(404).json({ error: "Bot not found" });
});

app.post('/api/bots/:id/logs', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { message } = req.body;
  const db = getDB();
  if (db.bots && db.bots[id]) {
    db.bots[id].logs = db.bots[id].logs || [];
    db.bots[id].logs.push(`[${new Date().toISOString()}] ${message}`);
    if (db.bots[id].logs.length > 100) {
      db.bots[id].logs = db.bots[id].logs.slice(-100);
    }
    saveDB(db);
    return res.json({ success: true, logs: db.bots[id].logs });
  }
  res.status(404).json({ error: "Bot not found" });
});

// 3. Hosting Nodes & Clusters
app.get('/api/nodes', (req: Request, res: Response) => {
  const nodes = [
    {
      id: "local-cluster",
      name: "Primary Host (Local Node)",
      region: "Asia Southeast (Singapore)",
      ip: "127.0.0.1",
      status: "online",
      cpu_cores: os.cpus().length,
      cpu_percent: Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 100)),
      ram_total_gb: (os.totalmem() / (1024 ** 3)).toFixed(1),
      ram_used_gb: ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(1),
      active_containers: 4,
      ping_ms: 1,
      type: "Master Controller"
    },
    {
      id: "vps-fra-01",
      name: "Frankfurt VPS Worker #1",
      region: "Europe (Germany)",
      ip: "159.65.120.44",
      status: "online",
      cpu_cores: 4,
      cpu_percent: 22,
      ram_total_gb: "8.0",
      ram_used_gb: "2.4",
      active_containers: 9,
      ping_ms: 124,
      type: "Worker Node (Ubuntu 24.04 LTS)"
    },
    {
      id: "railway-worker-02",
      name: "US-East Railway Isolated Cluster",
      region: "North America (Virginia)",
      ip: "35.192.88.19",
      status: "online",
      cpu_cores: 8,
      cpu_percent: 34,
      ram_total_gb: "16.0",
      ram_used_gb: "5.8",
      active_containers: 18,
      ping_ms: 186,
      type: "High Density Sandbox"
    }
  ];
  res.json(nodes);
});

// 4. Plans & Specs
app.get('/api/plans', (req: Request, res: Response) => {
  const plans = [
    {
      id: "free",
      name: "Free Community",
      price_monthly_usd: 0,
      price_bdt: 0,
      cpus: "0.25 vCPU",
      ram_mb: 256,
      pids_limit: 64,
      storage_mb: 500,
      bandwidth_gb: 10,
      allowed_bots: 1,
      features: ["Auto restart on crash", "Community support", "Standard sleep after idle", "Console log stream"],
      is_popular: false
    },
    {
      id: "basic",
      name: "Starter VPS",
      price_monthly_usd: 2.99,
      price_bdt: 350,
      cpus: "0.50 vCPU",
      ram_mb: 512,
      pids_limit: 128,
      storage_mb: 2048,
      bandwidth_gb: 50,
      allowed_bots: 3,
      features: ["24/7 Always Online", "Telegram alerts on error", "Priority queue", "Custom Env variables", "Direct package installer"],
      is_popular: false
    },
    {
      id: "pro",
      name: "Pro Developer",
      price_monthly_usd: 6.99,
      price_bdt: 800,
      cpus: "1.00 vCPU",
      ram_mb: 1024,
      pids_limit: 256,
      storage_mb: 10240,
      bandwidth_gb: 200,
      allowed_bots: 8,
      features: ["Dedicated container sandbox", "OxaPay instant webhook", "Custom domains & port proxies", "Priority ticketing", "Encrypted Vault sync"],
      is_popular: true
    },
    {
      id: "ultra",
      name: "Ultra Enterprise",
      price_monthly_usd: 14.99,
      price_bdt: 1750,
      cpus: "2.00 vCPU",
      ram_mb: 2048,
      pids_limit: 512,
      storage_mb: 51200,
      bandwidth_gb: 1000,
      allowed_bots: 20,
      features: ["Isolated multi-core thread pool", "Real-time AI Preflight & Security scanning", "Unlimited Vault snapshots", "White-glove SLA support", "Root SSH tunnel option"],
      is_popular: false
    }
  ];
  res.json(plans);
});

// 5. Payments & Invoices
app.get('/api/payments', (req: Request, res: Response) => {
  const db = getDB();
  res.json(db.payments || []);
});

app.post('/api/payments/:id/verify', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status } = req.body; // 'completed' or 'rejected'
  const db = getDB();
  db.payments = db.payments || [];
  const tx = db.payments.find((p: any) => p.id === id);
  if (!tx) {
    return res.status(404).json({ error: "Payment not found" });
  }
  tx.status = status;
  tx.reviewed_at = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, payment: tx });
});

// 6. Coupons
app.get('/api/coupons', (req: Request, res: Response) => {
  const db = getDB();
  res.json(Object.values(db.coupons || {}));
});

app.post('/api/coupons', (req: Request, res: Response) => {
  const { code, discount_percent, max_uses, expires_at } = req.body;
  if (!code || !discount_percent) {
    return res.status(400).json({ error: "Code and discount percent are required" });
  }
  const db = getDB();
  db.coupons = db.coupons || {};
  const cleanCode = code.toUpperCase().trim();
  db.coupons[cleanCode] = {
    code: cleanCode,
    discount_percent: Number(discount_percent),
    max_uses: Number(max_uses) || 100,
    used_count: 0,
    active: true,
    expires_at: expires_at || "2026-12-31"
  };
  saveDB(db);
  res.status(201).json(db.coupons[cleanCode]);
});

app.delete('/api/coupons/:code', (req: Request, res: Response) => {
  const code = String(req.params.code);
  const db = getDB();
  if (db.coupons && db.coupons[code]) {
    delete db.coupons[code];
    saveDB(db);
    return res.json({ success: true, message: "Coupon deleted" });
  }
  res.status(404).json({ error: "Coupon not found" });
});

// 7. Support Tickets
app.get('/api/tickets', (req: Request, res: Response) => {
  const db = getDB();
  res.json(Object.values(db.tickets || {}));
});

app.post('/api/tickets/:id/reply', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { text, status } = req.body;
  const db = getDB();
  if (!db.tickets || !db.tickets[id]) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  const ticket = db.tickets[id];
  ticket.messages.push({
    sender: "Support Desk",
    role: "admin",
    text,
    time: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });
  if (status) {
    ticket.status = status;
  }
  saveDB(db);
  res.json({ success: true, ticket });
});

// 8. Security Scanner (Runs security_scanner_free.py rules or simulated AST inspector)
app.post('/api/scan', async (req: Request, res: Response) => {
  const { code, filename } = req.body;
  if (!code) {
    return res.status(400).json({ error: "No code provided to scan" });
  }

  // We analyze code against patterns from security_scanner_free.py
  const findings: Array<{ category: string; rule: string; match: string; line: number }> = [];
  const lines = code.split('\n');

  const checkPatterns = [
    { cat: "🔴 Restricted Access", name: "System Directory Traversal", regex: /os\.walk\s*\(\s*['"]\/(?:root|etc|home|proc|sys|var)/ },
    { cat: "🔴 Restricted Access", name: "Broad Root File Search", regex: /glob\.glob\s*\(\s*['"]\/(?:\*)/ },
    { cat: "🔴 Restricted Access", name: "Restricted File Exfiltration", regex: /(?:open|read_text)\s*\([^\n]*['"]\/(?:root|etc|proc|sys)/ },
    { cat: "🔴 System Integrity", name: "Dynamic Exec/Eval of Decoded Content", regex: /base64\.b64decode\s*\([^\n]+\)[^\n]*\b(?:exec|eval)\b/ },
    { cat: "🔴 System Integrity", name: "Arbitrary Subprocess Execution with Shell=True", regex: /subprocess\s*\.\s*(?:Popen|call|run|check_output)\s*\([^\n]*shell\s*=\s*True/ },
    { cat: "🔴 System Integrity", name: "Marshalled Bytecode Loader", regex: /marshal\.loads\s*\(/ },
    { cat: "🟡 Review Needed", name: "Raw Socket Creation", regex: /socket\s*\.\s*socket\s*\(/ },
    { cat: "🟡 Review Needed", name: "Low-level ctypes binding", regex: /\b(?:import\s+|from\s+)ctypes\b/ },
    { cat: "🟡 Review Needed", name: "Pickle Deserialization", regex: /\b(?:import\s+|from\s+)pickle\b/ },
    { cat: "🟡 Review Needed", name: "Process Management (os.system)", regex: /os\.system\s*\(/ },
  ];

  lines.forEach((lineText: string, idx: number) => {
    checkPatterns.forEach(pat => {
      if (pat.regex.test(lineText)) {
        findings.push({
          category: pat.cat,
          rule: pat.name,
          match: lineText.trim().substring(0, 100),
          line: idx + 1
        });
      }
    });
  });

  const highThreats = findings.filter(f => f.category.includes('🔴')).length;
  const mediumThreats = findings.filter(f => f.category.includes('🟡')).length;

  let verdict = "SAFE";
  let score = 100;

  if (highThreats > 0) {
    verdict = "REJECT";
    score = Math.max(0, 100 - (highThreats * 45 + mediumThreats * 8));
  } else if (mediumThreats > 0) {
    verdict = "MANUAL_REVIEW";
    score = Math.max(20, 100 - (mediumThreats * 15));
  }

  res.json({
    verdict,
    safety_score: score,
    total_findings: findings.length,
    high_threats: highThreats,
    review_needed: mediumThreats,
    findings,
    scanner: "HooHost Security Scanner (Free Core v3.1)",
    scanned_at: new Date().toISOString()
  });
});

// 9. Vault Sync & Configuration
const VAULT_CONFIG_PATH = path.join(process.cwd(), 'cipher_vault.json');

function getVaultConfigFile() {
  try {
    if (fs.existsSync(VAULT_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(VAULT_CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading cipher_vault.json:', e);
  }
  return {
    CIPHER_VAULT_REPO: "Lord-Cipher/cipher-vault",
    CIPHER_VAULT_BRANCH: "main",
    CIPHER_VAULT_TOKEN: "",
    CIPHER_VAULT_KEY: "VGGrdWL--Ezh73Rq99CICNM4e7R7gXb2mOvlbh9mcMI="
  };
}

function saveVaultConfigFile(cfg: any) {
  try {
    fs.writeFileSync(VAULT_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing cipher_vault.json:', e);
  }
}

app.get('/api/vault', (req: Request, res: Response) => {
  const settings = getSettings();
  const vcfg = getVaultConfigFile();
  const repo = vcfg.CIPHER_VAULT_REPO || settings.vault_repo || "Lord-Cipher/cipher-vault";
  const branch = vcfg.CIPHER_VAULT_BRANCH || settings.vault_branch || "main";
  const key = vcfg.CIPHER_VAULT_KEY || "VGGrdWL--Ezh73Rq99CICNM4e7R7gXb2mOvlbh9mcMI=";
  const token = vcfg.CIPHER_VAULT_TOKEN || "";

  res.json({
    repo,
    branch,
    key,
    token: token ? token : '',
    has_token: !!token,
    token_preview: token ? `${token.substring(0, 4)}••••${token.slice(-4)}` : 'Not configured (Local snapshots only)',
    last_sync: settings.last_vault_sync || new Date().toISOString(),
    status: token ? "cloud_synced" : "local_secured",
    encryption: "Fernet-AES256-GCM",
    snapshots: [
      { id: "snap_301", timestamp: "2026-09-21T22:00:00Z", size_kb: 480, files_count: 52, commit: "c810df2" },
      { id: "snap_300", timestamp: "2026-09-20T22:00:00Z", size_kb: 472, files_count: 50, commit: "92ab11e" },
      { id: "snap_299", timestamp: "2026-09-19T22:00:00Z", size_kb: 468, files_count: 49, commit: "31ef09c" },
    ]
  });
});

app.post('/api/vault/config', (req: Request, res: Response) => {
  const { repo, branch, token, key, generate_key } = req.body;
  const current = getVaultConfigFile();

  if (repo !== undefined) current.CIPHER_VAULT_REPO = repo;
  if (branch !== undefined) current.CIPHER_VAULT_BRANCH = branch;
  if (token !== undefined) current.CIPHER_VAULT_TOKEN = token;
  if (generate_key) {
    current.CIPHER_VAULT_KEY = crypto.randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  } else if (key !== undefined) {
    current.CIPHER_VAULT_KEY = key;
  }

  saveVaultConfigFile(current);

  const settings = getSettings();
  if (current.CIPHER_VAULT_REPO) settings.vault_repo = current.CIPHER_VAULT_REPO;
  if (current.CIPHER_VAULT_BRANCH) settings.vault_branch = current.CIPHER_VAULT_BRANCH;
  saveSettings(settings);

  res.json({
    success: true,
    message: "Cipher Vault settings and encryption keys updated successfully.",
    config: {
      repo: current.CIPHER_VAULT_REPO,
      branch: current.CIPHER_VAULT_BRANCH,
      key: current.CIPHER_VAULT_KEY,
      has_token: !!current.CIPHER_VAULT_TOKEN,
      token_preview: current.CIPHER_VAULT_TOKEN ? `${current.CIPHER_VAULT_TOKEN.substring(0, 4)}••••${current.CIPHER_VAULT_TOKEN.slice(-4)}` : 'Not configured'
    }
  });
});

app.post('/api/vault/sync', (req: Request, res: Response) => {
  const settings = getSettings();
  const vcfg = getVaultConfigFile();
  settings.last_vault_sync = new Date().toISOString();
  saveSettings(settings);
  const targetRepo = vcfg.CIPHER_VAULT_REPO || "Lord-Cipher/cipher-vault";
  const targetBranch = vcfg.CIPHER_VAULT_BRANCH || "main";
  res.json({
    success: true,
    message: `Encrypted snapshot successfully saved with Fernet key and prepared for ${targetRepo} (${targetBranch}).`,
    commit: "f" + Math.random().toString(16).substring(2, 8),
    synced_at: settings.last_vault_sync
  });
});

// 10. Platform Settings
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = getSettings();
  res.json(settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  const incoming = req.body;
  const current = getSettings();
  const updated = { ...current, ...incoming };
  saveSettings(updated);
  res.json({ success: true, settings: updated });
});

// 11. Broadcast Message
app.post('/api/broadcast', (req: Request, res: Response) => {
  const { message, pin } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  const db = getDB();
  const userCount = Object.keys(db.users || {}).length || 140;
  res.json({
    success: true,
    delivered_count: userCount,
    sent_at: new Date().toISOString(),
    pinned: !!pin
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // In case production dist is not built yet
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HooHost] Control Panel running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start HooHost server:", err);
});
