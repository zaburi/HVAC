"use client";

import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Download,
  FileBarChart,
  Filter,
  Gauge,
  HardHat,
  History,
  House,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  Upload,
  UserRound,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Viewer = { name: string; email: string; role: string };
type ModuleKey =
  | "overview"
  | "jobs"
  | "inventory"
  | "movements"
  | "technicians"
  | "reports"
  | "settings"
  | "audit";
type ModalKind = "job" | "item" | "receipt" | "issue" | "complete" | null;

type Branch = {
  id: string;
  name: string;
  code: string;
};
type WarehouseRow = {
  id: string;
  name: string;
  branch_id: string;
};
type Item = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  supplier: string;
  unit: string;
  minimum_stock: number;
  reorder_quantity: number;
  standard_cost: number;
  quantity: number;
  average_cost: number;
  value: number;
  health: "HEALTHY" | "LOW" | "CRITICAL";
  warehouse_name: string;
};
type Job = {
  id: string;
  code: string;
  customer: string;
  site: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  logged_at: string;
  target_at: string;
  completed_at: string | null;
  resolution: string | null;
  parts_cost: number;
  technician_id: string;
  technician_name: string;
  branch_id: string;
  branch_name: string;
};
type Technician = {
  id: string;
  code: string;
  name: string;
  phone: string;
  position: string;
  primary_skill: string;
  employment_status: string;
  branch_id: string;
  branch_name: string;
  assigned: number;
  completed: number;
  pending: number;
  on_time: number;
  score: number;
};
type Movement = {
  id: string;
  code: string;
  movement_type: string;
  quantity_delta: number;
  unit_cost: number;
  total_cost: number;
  reference: string;
  actor: string;
  created_at: string;
  item_name: string;
  item_code: string;
  job_id: string | null;
  technician_name: string | null;
};
type AuditRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  after_json: string | null;
  created_at: string;
};
type Snapshot = {
  generatedAt: string;
  organization: {
    id: string;
    name: string;
    currency: string;
    timezone: string;
    target_turnaround_days: number;
    critical_factor: number;
  };
  branches: Branch[];
  warehouses: WarehouseRow[];
  items: Item[];
  jobs: Job[];
  technicians: Technician[];
  movements: Movement[];
  audits: AuditRow[];
};

const navItems: { key: ModuleKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", icon: Wrench },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "movements", label: "Stock movements", icon: ArrowUpRight },
  { key: "technicians", label: "Technicians", icon: HardHat },
  { key: "reports", label: "Reports", icon: FileBarChart },
];

const pageMeta: Record<
  ModuleKey,
  { title: string; eyebrow: string; description: string }
> = {
  overview: {
    eyebrow: "Workspace",
    title: "Operations overview",
    description: "Live exceptions, service delivery and stock position.",
  },
  jobs: {
    eyebrow: "Workspace / Jobs",
    title: "Service jobs",
    description: "Plan, assign and complete field work.",
  },
  inventory: {
    eyebrow: "Workspace / Inventory",
    title: "Inventory control",
    description: "Availability, valuation and reorder decisions.",
  },
  movements: {
    eyebrow: "Workspace / Stock movements",
    title: "Stock movements",
    description: "Immutable receipts, issues, returns and adjustments.",
  },
  technicians: {
    eyebrow: "Workspace / Technicians",
    title: "Technician performance",
    description: "Availability, workload and transparent productivity scores.",
  },
  reports: {
    eyebrow: "Workspace / Reports",
    title: "Reports & analytics",
    description: "Operational summaries with filter-aware exports.",
  },
  settings: {
    eyebrow: "Administration",
    title: "Workspace settings",
    description: "Organization rules, reference data and scoring.",
  },
  audit: {
    eyebrow: "Administration",
    title: "Audit log",
    description: "Every critical change, actor and timestamp.",
  },
};

const compactCurrency = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 1 });

function formatMoney(value: number, compact = false) {
  return compact
    ? `TZS ${compactCurrency.format(value)}`
    : `TZS ${new Intl.NumberFormat("en-TZ", {
        maximumFractionDigits: 0,
      }).format(value)}`;
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function relativeDate(value: string) {
  const days = Math.ceil(
    (new Date(value).getTime() - Date.now()) / 86_400_000,
  );
  if (days < -1) return `${Math.abs(days)} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function slugStatus(status: string) {
  return status.toLowerCase().replaceAll("_", "-");
}

function friendlyStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isOverdue(job: Job) {
  return (
    !["COMPLETED", "CANCELLED"].includes(job.status) &&
    new Date(job.target_at) < new Date()
  );
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.map(escape).join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function CoolOpsApp({
  viewer,
}: {
  viewer: Viewer;
}) {
  const [activeModule, setActiveModule] = useState<ModuleKey>("overview");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [period, setPeriod] = useState("This month");
  const [settingsTab, setSettingsTab] = useState("Organization");
  const commandInputRef = useRef<HTMLInputElement>(null);

  const loadSnapshot = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch("/api/v1/operations", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | Snapshot
        | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(
          "error" in payload
            ? payload.error?.message ?? "Could not load operations."
            : "Could not load operations.",
        );
      }
      setSnapshot(payload as Snapshot);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load the operations workspace.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadSnapshot();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadSnapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setNotificationsOpen(false);
        setModal(null);
        setSelectedJob(null);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (commandOpen) setTimeout(() => commandInputRef.current?.focus(), 20);
  }, [commandOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredJobs = useMemo(() => {
    if (!snapshot) return [];
    const term = search.trim().toLowerCase();
    return snapshot.jobs.filter((job) => {
      const matchesBranch = branch === "all" || job.branch_id === branch;
      const matchesStatus =
        jobFilter === "all" ||
        (jobFilter === "overdue" ? isOverdue(job) : job.status === jobFilter);
      const matchesSearch =
        !term ||
        [job.code, job.customer, job.site, job.technician_name]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchesBranch && matchesStatus && matchesSearch;
    });
  }, [snapshot, search, branch, jobFilter]);

  const filteredItems = useMemo(() => {
    if (!snapshot) return [];
    const term = search.trim().toLowerCase();
    return snapshot.items.filter((item) => {
      const matchesHealth =
        inventoryFilter === "all" || item.health === inventoryFilter;
      const matchesSearch =
        !term ||
        [item.code, item.name, item.category, item.brand, item.supplier]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchesHealth && matchesSearch;
    });
  }, [snapshot, search, inventoryFilter]);

  const notify = (message: string) => setToast(message);

  async function runOperation(payload: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ ...payload, actor: viewer.name }),
      });
      const result = (await response.json()) as Record<string, unknown> & {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(result.error?.message ?? "The action could not be saved.");
      }
      setModal(null);
      setSelectedJob(null);
      await loadSnapshot(true);
      notify(operationSuccess(payload.action as string, result));
      return true;
    } catch (caught) {
      notify(
        caught instanceof Error ? caught.message : "The action could not be saved.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const selectModule = (key: ModuleKey) => {
    setActiveModule(key);
    setSidebarOpen(false);
    setSearch("");
  };

  const primaryAction = () => {
    if (activeModule === "inventory") setModal("item");
    else if (activeModule === "movements") setModal("receipt");
    else setModal("job");
  };

  if (loading) return <WorkspaceLoading />;

  return (
    <div className="app-shell">
      <Sidebar
        activeModule={activeModule}
        selectModule={selectModule}
        viewer={viewer}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-shell">
        <TopBar
          viewer={viewer}
          onMenu={() => setSidebarOpen(true)}
          onCommand={() => setCommandOpen(true)}
          onNotifications={() => setNotificationsOpen((value) => !value)}
          notificationCount={
            snapshot?.items.filter((item) => item.health !== "HEALTHY").length ??
            0
          }
        />

        {notificationsOpen && snapshot && (
          <NotificationsPanel
            items={snapshot.items}
            jobs={snapshot.jobs}
            onClose={() => setNotificationsOpen(false)}
            onOpenItem={(item) => {
              setNotificationsOpen(false);
              setSelectedItem(item);
            }}
            onOpenJob={(job) => {
              setNotificationsOpen(false);
              setSelectedJob(job);
            }}
          />
        )}

        <div className="workspace">
          <PageHeader
            meta={pageMeta[activeModule]}
            activeModule={activeModule}
            snapshot={snapshot}
            period={period}
            setPeriod={setPeriod}
            branch={branch}
            setBranch={setBranch}
            refreshing={refreshing}
            onRefresh={() => void loadSnapshot(true)}
            onPrimary={primaryAction}
          />

          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
              <button onClick={() => void loadSnapshot()}>Retry</button>
            </div>
          )}

          {snapshot && activeModule === "overview" && (
            <Overview
              snapshot={snapshot}
              branch={branch}
              onModule={selectModule}
              onJob={(job) => setSelectedJob(job)}
              onItem={(item) => setSelectedItem(item)}
            />
          )}
          {snapshot && activeModule === "jobs" && (
            <JobsView
              jobs={filteredJobs}
              search={search}
              setSearch={setSearch}
              filter={jobFilter}
              setFilter={setJobFilter}
              onSelect={setSelectedJob}
              onCreate={() => setModal("job")}
            />
          )}
          {snapshot && activeModule === "inventory" && (
            <InventoryView
              items={filteredItems}
              allItems={snapshot.items}
              search={search}
              setSearch={setSearch}
              filter={inventoryFilter}
              setFilter={setInventoryFilter}
              onSelect={setSelectedItem}
              onCreate={() => setModal("item")}
              onReceipt={() => setModal("receipt")}
            />
          )}
          {snapshot && activeModule === "movements" && (
            <MovementsView
              movements={snapshot.movements}
              onReceipt={() => setModal("receipt")}
              onIssue={() => setModal("issue")}
            />
          )}
          {snapshot && activeModule === "technicians" && (
            <TechniciansView
              technicians={snapshot.technicians}
              jobs={snapshot.jobs}
              onJobs={(technician) => {
                setSearch(technician.name);
                selectModule("jobs");
              }}
            />
          )}
          {snapshot && activeModule === "reports" && (
            <ReportsView snapshot={snapshot} notify={notify} />
          )}
          {snapshot && activeModule === "settings" && (
            <SettingsView
              snapshot={snapshot}
              tab={settingsTab}
              setTab={setSettingsTab}
              notify={notify}
            />
          )}
          {snapshot && activeModule === "audit" && (
            <AuditView audits={snapshot.audits} />
          )}
        </div>

        <MobileNav
          active={activeModule}
          onSelect={selectModule}
          onMore={() => setSidebarOpen(true)}
        />
      </main>

      {selectedJob && snapshot && (
        <JobDrawer
          job={selectedJob}
          technician={snapshot.technicians.find(
            (technician) => technician.id === selectedJob.technician_id,
          )}
          movements={snapshot.movements.filter(
            (movement) => movement.job_id === selectedJob.id,
          )}
          onClose={() => setSelectedJob(null)}
          onStatus={(status) => {
            if (status === "COMPLETED") {
              setModal("complete");
            } else {
              void runOperation({
                action: "updateJobStatus",
                jobId: selectedJob.id,
                status,
                reason: status === "ON_HOLD" ? "Awaiting customer/site access" : "",
              });
            }
          }}
          onIssue={() => setModal("issue")}
          submitting={submitting}
        />
      )}

      {selectedItem && (
        <ItemDrawer
          item={selectedItem}
          movements={
            snapshot?.movements.filter(
              (movement) => movement.item_code === selectedItem.code,
            ) ?? []
          }
          onClose={() => setSelectedItem(null)}
          onReceipt={() => setModal("receipt")}
        />
      )}

      {modal && snapshot && (
        <OperationModal
          kind={modal}
          snapshot={snapshot}
          selectedJob={selectedJob}
          selectedItem={selectedItem}
          submitting={submitting}
          onClose={() => setModal(null)}
          onSubmit={runOperation}
        />
      )}

      {commandOpen && (
        <CommandPalette
          inputRef={commandInputRef}
          onClose={() => setCommandOpen(false)}
          onSelect={(module) => {
            selectModule(module);
            setCommandOpen(false);
          }}
          onCreate={(kind) => {
            setModal(kind);
            setCommandOpen(false);
          }}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function operationSuccess(action: string, result: Record<string, unknown>) {
  if (action === "createJob")
    return `${(result.job as { code?: string })?.code ?? "Job"} created and assigned`;
  if (action === "createItem") return "Item created with opening balance";
  if (action === "postReceipt") return `${result.code ?? "Receipt"} posted atomically`;
  if (action === "postIssue") return `${result.code ?? "Issue"} posted to the stock ledger`;
  if (action === "updateJobStatus") return `Job moved to ${friendlyStatus(String(result.toStatus))}`;
  return "Changes saved";
}

function WorkspaceLoading() {
  return (
    <div className="workspace-loading" role="status">
      <div className="brand-mark large">
        <Gauge size={22} />
      </div>
      <div>
        <strong>Opening CoolOps</strong>
        <span>Reconciling jobs, inventory and field teams…</span>
      </div>
      <LoaderCircle className="spin" size={20} />
    </div>
  );
}

function Sidebar({
  activeModule,
  selectModule,
  viewer,
  open,
  onClose,
}: {
  activeModule: ModuleKey;
  selectModule: (key: ModuleKey) => void;
  viewer: Viewer;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Gauge size={17} />
          </div>
          <div>
            <strong>CoolOps</strong>
            <span>HVAC operations</span>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation">
            <PanelLeftClose size={17} />
          </button>
        </div>

        <button className="workspace-switch">
          <div className="org-avatar">KC</div>
          <div>
            <span>Kibo Climate Services</span>
            <small>Operations workspace</small>
          </div>
          <ChevronDown size={14} />
        </button>

        <nav className="nav-section" aria-label="Workspace">
          <div className="nav-label">Workspace</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-item ${activeModule === item.key ? "active" : ""}`}
                onClick={() => selectModule(item.key)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.key === "jobs" && <em>4</em>}
                {item.key === "inventory" && <em className="warning">5</em>}
              </button>
            );
          })}
        </nav>

        <nav className="nav-section saved" aria-label="Saved views">
          <div className="nav-label">Saved views</div>
          <button
            className="nav-item"
            onClick={() => {
              selectModule("inventory");
            }}
          >
            <span className="saved-dot danger" />
            <span>Critical stock</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              selectModule("jobs");
            }}
          >
            <span className="saved-dot warning" />
            <span>Overdue jobs</span>
          </button>
          <button className="nav-item" onClick={() => selectModule("jobs")}>
            <span className="saved-dot accent" />
            <span>My assigned jobs</span>
          </button>
        </nav>

        <nav className="nav-section admin" aria-label="Administration">
          <div className="nav-label">Administration</div>
          <button
            className={`nav-item ${activeModule === "settings" ? "active" : ""}`}
            onClick={() => selectModule("settings")}
          >
            <Settings2 size={16} />
            <span>Settings</span>
          </button>
          <button
            className={`nav-item ${activeModule === "audit" ? "active" : ""}`}
            onClick={() => selectModule("audit")}
          >
            <ShieldCheck size={16} />
            <span>Audit log</span>
          </button>
        </nav>

        <div className="sidebar-profile">
          <Avatar name={viewer.name} />
          <div>
            <strong>{viewer.name}</strong>
            <span>{viewer.role}</span>
          </div>
          <MoreHorizontal size={16} />
        </div>
      </aside>
    </>
  );
}

function TopBar({
  viewer,
  onMenu,
  onCommand,
  onNotifications,
  notificationCount,
}: {
  viewer: Viewer;
  onMenu: () => void;
  onCommand: () => void;
  onNotifications: () => void;
  notificationCount: number;
}) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation">
        <Menu size={19} />
      </button>
      <button className="command-trigger" onClick={onCommand}>
        <Search size={15} />
        <span>Search jobs, items, technicians…</span>
        <kbd>⌘ K</kbd>
      </button>
      <div className="topbar-actions">
        <button className="icon-button" title="Help">
          <CircleGauge size={18} />
        </button>
        <button
          className="icon-button notification-button"
          onClick={onNotifications}
          aria-label={`${notificationCount} notifications`}
        >
          <Bell size={18} />
          {notificationCount > 0 && <span>{notificationCount}</span>}
        </button>
        <div className="topbar-divider" />
        <button className="profile-button">
          <Avatar name={viewer.name} small />
          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}

function PageHeader({
  meta,
  activeModule,
  snapshot,
  period,
  setPeriod,
  branch,
  setBranch,
  refreshing,
  onRefresh,
  onPrimary,
}: {
  meta: (typeof pageMeta)[ModuleKey];
  activeModule: ModuleKey;
  snapshot: Snapshot | null;
  period: string;
  setPeriod: (value: string) => void;
  branch: string;
  setBranch: (value: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onPrimary: () => void;
}) {
  const showPrimary = !["reports", "settings", "audit"].includes(activeModule);
  return (
    <section className="page-header">
      <div>
        <div className="eyebrow">{meta.eyebrow}</div>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>
      <div className="header-actions">
        <button className="button secondary" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? "spin" : ""} />
          <span>{refreshing ? "Refreshing" : "Refresh"}</span>
        </button>
        {showPrimary && (
          <button className="button primary" onClick={onPrimary}>
            <Plus size={16} />
            {activeModule === "inventory"
              ? "New item"
              : activeModule === "movements"
                ? "Receive stock"
                : "New job"}
          </button>
        )}
      </div>
      {!["settings", "audit"].includes(activeModule) && (
        <div className="filter-row">
          <label className="filter-chip">
            <CalendarDays size={14} />
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option>This month</option>
              <option>Last 30 days</option>
              <option>This quarter</option>
              <option>Year to date</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-chip">
            <Building2 size={14} />
            <select value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option value="all">All branches</option>
              {snapshot?.branches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <button className="filter-chip">
            <SlidersHorizontal size={14} />
            More filters
          </button>
          {snapshot?.generatedAt && (
            <span className="refresh-note">
              <span className="live-dot" />
              Updated {formatDate(snapshot.generatedAt, true)}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function Overview({
  snapshot,
  branch,
  onModule,
  onJob,
  onItem,
}: {
  snapshot: Snapshot;
  branch: string;
  onModule: (module: ModuleKey) => void;
  onJob: (job: Job) => void;
  onItem: (item: Item) => void;
}) {
  const jobs =
    branch === "all"
      ? snapshot.jobs
      : snapshot.jobs.filter((job) => job.branch_id === branch);
  const completed = jobs.filter((job) => job.status === "COMPLETED");
  const open = jobs.filter(
    (job) => !["COMPLETED", "CANCELLED"].includes(job.status),
  );
  const overdue = open.filter(isOverdue);
  const lowItems = snapshot.items.filter((item) => item.health !== "HEALTHY");
  const critical = snapshot.items.filter((item) => item.health === "CRITICAL");
  const stockValue = snapshot.items.reduce((sum, item) => sum + item.value, 0);
  const completionRate = jobs.length
    ? Math.round((completed.length / jobs.filter((job) => job.status !== "CANCELLED").length) * 100)
    : 0;
  const jobStatuses = ["COMPLETED", "IN_PROGRESS", "ASSIGNED", "ON_HOLD"].map(
    (status) => ({
      status,
      value: jobs.filter((job) => job.status === status).length,
    }),
  );
  const maxStatus = Math.max(...jobStatuses.map((item) => item.value), 1);
  const topTechnicians = [...snapshot.technicians]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <div className="dashboard-grid">
      <section className="kpi-grid">
        <MetricCard
          label="Stock value"
          value={formatMoney(stockValue, true)}
          detail={`${snapshot.items.length} active items`}
          icon={Boxes}
          trend="+6.4%"
          onClick={() => onModule("inventory")}
        />
        <MetricCard
          label="Jobs completed"
          value={String(completed.length)}
          detail={`${completionRate}% completion rate`}
          icon={ClipboardCheck}
          trend="+8.2%"
          onClick={() => onModule("jobs")}
        />
        <MetricCard
          label="Open jobs"
          value={String(open.length)}
          detail={`${overdue.length} overdue`}
          icon={Wrench}
          tone={overdue.length ? "danger" : "default"}
          onClick={() => onModule("jobs")}
        />
        <MetricCard
          label="Stock exceptions"
          value={String(lowItems.length)}
          detail={`${critical.length} critical · ${lowItems.length - critical.length} low`}
          icon={TriangleAlert}
          tone="warning"
          onClick={() => onModule("inventory")}
        />
      </section>

      <section className="card chart-card span-7">
        <CardHeader
          title="Jobs completed"
          subtitle="Weekly completion trend"
          action="View jobs"
          onAction={() => onModule("jobs")}
        />
        <div className="trend-summary">
          <strong>{completed.length}</strong>
          <span className="positive">
            <ArrowUpRight size={13} /> 8.2% vs last period
          </span>
        </div>
        <div className="line-chart" aria-label="Completed jobs increased over the last six weeks">
          {[42, 54, 48, 66, 61, 76, 82].map((height, index) => (
            <div className="line-column" key={index}>
              <div className="line-point" style={{ bottom: `${height}%` }} />
              {index < 6 && (
                <div
                  className="line-segment"
                  style={{
                    bottom: `${height}%`,
                    transform: `rotate(${[12, -7, 18, -8, 16, 7][index]}deg)`,
                    width: "calc(100% + 18px)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="chart-axis">
          {["10 Jun", "17 Jun", "24 Jun", "01 Jul", "08 Jul", "15 Jul", "22 Jul"].map(
            (label) => (
              <span key={label}>{label}</span>
            ),
          )}
        </div>
      </section>

      <section className="card span-5">
        <CardHeader
          title="Jobs by status"
          subtitle="Current portfolio"
          action="Explore"
          onAction={() => onModule("jobs")}
        />
        <div className="status-chart">
          {jobStatuses.map((item) => (
            <button
              key={item.status}
              className="status-bar-row"
              onClick={() => onModule("jobs")}
            >
              <span>{friendlyStatus(item.status)}</span>
              <div className="status-bar-track">
                <div
                  className={`status-bar-fill ${slugStatus(item.status)}`}
                  style={{ width: `${(item.value / maxStatus) * 100}%` }}
                />
              </div>
              <strong>{item.value}</strong>
            </button>
          ))}
        </div>
        <div className="chart-callout">
          <Clock3 size={16} />
          <div>
            <strong>{overdue.length} jobs need attention</strong>
            <span>Past target date and not completed</span>
          </div>
          <ChevronRight size={15} />
        </div>
      </section>

      <section className="card span-7 table-card">
        <CardHeader
          title="Jobs needing attention"
          subtitle="Overdue and high-priority work"
          action="All jobs"
          onAction={() => onModule("jobs")}
        />
        <div className="compact-list">
          {[...overdue, ...open.filter((job) => job.priority === "URGENT")]
            .filter(
              (job, index, array) =>
                array.findIndex((candidate) => candidate.id === job.id) === index,
            )
            .slice(0, 5)
            .map((job) => (
              <button
                key={job.id}
                className="compact-row"
                onClick={() => onJob(job)}
              >
                <div className={`priority-mark ${job.priority.toLowerCase()}`} />
                <div className="row-main">
                  <strong>{job.customer}</strong>
                  <span>
                    {job.code} · {job.site}
                  </span>
                </div>
                <StatusBadge status={job.status} />
                <div className={`due-label ${isOverdue(job) ? "overdue" : ""}`}>
                  {relativeDate(job.target_at)}
                </div>
                <Avatar name={job.technician_name || "Unassigned"} small />
              </button>
            ))}
        </div>
      </section>

      <section className="card span-5 table-card">
        <CardHeader
          title="Stock exceptions"
          subtitle="Lowest coverage first"
          action="Inventory"
          onAction={() => onModule("inventory")}
        />
        <div className="compact-list">
          {[...lowItems]
            .sort(
              (a, b) =>
                a.quantity / a.minimum_stock - b.quantity / b.minimum_stock,
            )
            .slice(0, 5)
            .map((item) => (
              <button
                className="stock-row"
                key={item.id}
                onClick={() => onItem(item)}
              >
                <div className="item-icon">
                  <Boxes size={16} />
                </div>
                <div className="row-main">
                  <strong>{item.name}</strong>
                  <span>
                    {item.code} · Min {number.format(item.minimum_stock)} {item.unit}
                  </span>
                </div>
                <div className="stock-quantity">
                  <strong>{number.format(item.quantity)}</strong>
                  <span>{item.unit}</span>
                </div>
                <HealthBadge health={item.health} />
              </button>
            ))}
        </div>
      </section>

      <section className="card span-12">
        <CardHeader
          title="Technician leaderboard"
          subtitle="Completion, volume and timeliness · default weights 50 / 30 / 20"
          action="All technicians"
          onAction={() => onModule("technicians")}
        />
        <div className="leaderboard-grid">
          {topTechnicians.map((technician, index) => (
            <button
              className="leader-card"
              key={technician.id}
              onClick={() => onModule("technicians")}
            >
              <span className="rank">0{index + 1}</span>
              <Avatar name={technician.name} />
              <div className="leader-info">
                <strong>{technician.name}</strong>
                <span>{technician.primary_skill}</span>
              </div>
              <div className="score-ring" style={{ "--score": technician.score } as React.CSSProperties}>
                <span>{number.format(technician.score)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  trend?: string;
  tone?: "default" | "warning" | "danger";
  onClick: () => void;
}) {
  return (
    <button className={`metric-card ${tone}`} onClick={onClick}>
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <div className="metric-detail">
        <span>{detail}</span>
        {trend && <em>{trend}</em>}
      </div>
    </button>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <header className="card-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction}>
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </header>
  );
}

function JobsView({
  jobs,
  search,
  setSearch,
  filter,
  setFilter,
  onSelect,
  onCreate,
}: {
  jobs: Job[];
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  onSelect: (job: Job) => void;
  onCreate: () => void;
}) {
  const filters = [
    ["all", "All jobs"],
    ["overdue", "Overdue"],
    ["ASSIGNED", "Assigned"],
    ["IN_PROGRESS", "In progress"],
    ["ON_HOLD", "On hold"],
    ["COMPLETED", "Completed"],
  ];
  return (
    <section className="module-card">
      <div className="module-toolbar">
        <div className="segmented">
          {filters.map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search jobs"
        />
        <button className="button secondary">
          <ListFilter size={15} /> Filters
        </button>
        <button
          className="button icon-only"
          title="Export jobs"
          onClick={() =>
            downloadCsv(
              "coolops-jobs.csv",
              jobs.map((job) => ({
                code: job.code,
                customer: job.customer,
                site: job.site,
                status: job.status,
                priority: job.priority,
                technician: job.technician_name,
                target: job.target_at,
                parts_cost_tzs: job.parts_cost,
              })),
            )
          }
        >
          <Download size={15} />
        </button>
      </div>
      {jobs.length ? (
        <div className="data-table jobs-table">
          <div className="table-row table-head">
            <span>Job</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Technician</span>
            <span>Target</span>
            <span>Parts cost</span>
            <span />
          </div>
          {jobs.map((job) => (
            <button
              className={`table-row ${isOverdue(job) ? "row-overdue" : ""}`}
              key={job.id}
              onClick={() => onSelect(job)}
            >
              <span className="table-primary">
                <strong>{job.customer}</strong>
                <small>
                  {job.code} · {job.site}
                </small>
              </span>
              <span>
                <StatusBadge status={job.status} />
              </span>
              <span>
                <PriorityBadge priority={job.priority} />
              </span>
              <span className="person-cell">
                <Avatar name={job.technician_name || "Unassigned"} small />
                {job.technician_name || "Unassigned"}
              </span>
              <span className={isOverdue(job) ? "danger-text" : ""}>
                <strong>{formatDate(job.target_at)}</strong>
                <small>{relativeDate(job.target_at)}</small>
              </span>
              <span className="numeric">{formatMoney(job.parts_cost)}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="No jobs match this view"
          description="Clear a filter or log a new service job."
          action="New job"
          onAction={onCreate}
        />
      )}
      <TableFooter count={jobs.length} label="jobs" />
    </section>
  );
}

function InventoryView({
  items,
  allItems,
  search,
  setSearch,
  filter,
  setFilter,
  onSelect,
  onCreate,
  onReceipt,
}: {
  items: Item[];
  allItems: Item[];
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  onSelect: (item: Item) => void;
  onCreate: () => void;
  onReceipt: () => void;
}) {
  const healthy = allItems.filter((item) => item.health === "HEALTHY").length;
  const low = allItems.filter((item) => item.health === "LOW").length;
  const critical = allItems.filter((item) => item.health === "CRITICAL").length;
  return (
    <>
      <section className="inventory-summary">
        <button onClick={() => setFilter("all")}>
          <Boxes size={18} />
          <span>Total items</span>
          <strong>{allItems.length}</strong>
        </button>
        <button onClick={() => setFilter("HEALTHY")}>
          <CheckCircle2 size={18} />
          <span>Healthy</span>
          <strong>{healthy}</strong>
        </button>
        <button onClick={() => setFilter("LOW")}>
          <AlertCircle size={18} />
          <span>Low stock</span>
          <strong>{low}</strong>
        </button>
        <button onClick={() => setFilter("CRITICAL")}>
          <TriangleAlert size={18} />
          <span>Critical</span>
          <strong>{critical}</strong>
        </button>
      </section>
      <section className="module-card">
        <div className="module-toolbar">
          <div className="segmented">
            {[
              ["all", "All"],
              ["CRITICAL", "Critical"],
              ["LOW", "Low"],
              ["HEALTHY", "Healthy"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search inventory"
          />
          <button className="button secondary" onClick={onReceipt}>
            <PackagePlus size={15} /> Receive
          </button>
          <button
            className="button icon-only"
            onClick={() =>
              downloadCsv(
                "coolops-inventory.csv",
                items.map((item) => ({
                  code: item.code,
                  item: item.name,
                  category: item.category,
                  stock: item.quantity,
                  unit: item.unit,
                  average_cost_tzs: item.average_cost,
                  value_tzs: item.value,
                  health: item.health,
                })),
              )
            }
          >
            <Download size={15} />
          </button>
        </div>
        {items.length ? (
          <div className="data-table inventory-table">
            <div className="table-row table-head">
              <span>Item</span>
              <span>Category</span>
              <span>Current stock</span>
              <span>Minimum</span>
              <span>Avg. cost</span>
              <span>Stock value</span>
              <span>Health</span>
              <span />
            </div>
            {items.map((item) => (
              <button
                className="table-row"
                key={item.id}
                onClick={() => onSelect(item)}
              >
                <span className="item-cell">
                  <span className="item-icon">
                    <Boxes size={16} />
                  </span>
                  <span className="table-primary">
                    <strong>{item.name}</strong>
                    <small>
                      {item.code} · {item.brand}
                    </small>
                  </span>
                </span>
                <span>{item.category}</span>
                <span className="numeric">
                  <strong>{number.format(item.quantity)}</strong> {item.unit}
                </span>
                <span className="numeric">
                  {number.format(item.minimum_stock)} {item.unit}
                </span>
                <span className="numeric">{formatMoney(item.average_cost)}</span>
                <span className="numeric">{formatMoney(item.value)}</span>
                <span>
                  <HealthBadge health={item.health} />
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Boxes}
            title="No inventory items found"
            description="Try a different filter or add the first item."
            action="New item"
            onAction={onCreate}
          />
        )}
        <TableFooter count={items.length} label="items" />
      </section>
    </>
  );
}

function MovementsView({
  movements,
  onReceipt,
  onIssue,
}: {
  movements: Movement[];
  onReceipt: () => void;
  onIssue: () => void;
}) {
  const received = movements
    .filter((movement) => movement.quantity_delta > 0)
    .reduce((sum, movement) => sum + movement.total_cost, 0);
  const issued = movements
    .filter((movement) => movement.quantity_delta < 0)
    .reduce((sum, movement) => sum + movement.total_cost, 0);
  return (
    <>
      <div className="movement-actions">
        <button className="movement-action receipt" onClick={onReceipt}>
          <div>
            <PackagePlus size={20} />
          </div>
          <span>
            <strong>Receive stock</strong>
            <small>Post a GRN and update weighted cost</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="movement-action issue" onClick={onIssue}>
          <div>
            <PackageMinus size={20} />
          </div>
          <span>
            <strong>Issue parts</strong>
            <small>Link stock cost to a job and technician</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <div className="movement-total">
          <span>Posted this period</span>
          <strong>{formatMoney(received + issued, true)}</strong>
          <small>
            <span className="positive">In {formatMoney(received, true)}</span>
            <span className="negative">Out {formatMoney(issued, true)}</span>
          </small>
        </div>
      </div>
      <section className="module-card">
        <div className="module-toolbar">
          <div className="segmented">
            <button className="active">All movements</button>
            <button>Receipts</button>
            <button>Issues</button>
            <button>Returns</button>
          </div>
          <button className="button secondary">
            <Filter size={15} /> Filters
          </button>
          <button className="button icon-only">
            <Download size={15} />
          </button>
        </div>
        <div className="data-table movements-table">
          <div className="table-row table-head">
            <span>Movement</span>
            <span>Type</span>
            <span>Item</span>
            <span>Quantity</span>
            <span>Unit cost</span>
            <span>Total</span>
            <span>Posted by</span>
            <span>Date</span>
          </div>
          {movements.map((movement) => (
            <div className="table-row" key={movement.id}>
              <span className="table-primary">
                <strong>{movement.code}</strong>
                <small>{movement.reference || "No reference"}</small>
              </span>
              <span className={`movement-type ${movement.quantity_delta > 0 ? "in" : "out"}`}>
                {movement.quantity_delta > 0 ? (
                  <ArrowDownLeft size={14} />
                ) : (
                  <ArrowUpRight size={14} />
                )}
                {friendlyStatus(movement.movement_type)}
              </span>
              <span className="table-primary">
                <strong>{movement.item_name}</strong>
                <small>{movement.item_code}</small>
              </span>
              <span className={`numeric ${movement.quantity_delta > 0 ? "positive" : ""}`}>
                {movement.quantity_delta > 0 ? "+" : ""}
                {number.format(movement.quantity_delta)}
              </span>
              <span className="numeric">{formatMoney(movement.unit_cost)}</span>
              <span className="numeric">{formatMoney(movement.total_cost)}</span>
              <span>{movement.actor}</span>
              <span>{formatDate(movement.created_at, true)}</span>
            </div>
          ))}
        </div>
        <TableFooter count={movements.length} label="movements" />
      </section>
    </>
  );
}

function TechniciansView({
  technicians,
  jobs,
  onJobs,
}: {
  technicians: Technician[];
  jobs: Job[];
  onJobs: (technician: Technician) => void;
}) {
  const maxCompleted = Math.max(
    ...technicians.map((technician) => technician.completed),
    1,
  );
  return (
    <div className="technician-layout">
      <section className="card score-explainer">
        <div>
          <Sparkles size={18} />
          <strong>Productivity score</strong>
          <span>
            A transparent weighted score across completion, completed volume and
            on-time delivery.
          </span>
        </div>
        <div className="weight-pills">
          <span>
            <b>50%</b> Completion
          </span>
          <span>
            <b>30%</b> Volume
          </span>
          <span>
            <b>20%</b> On time
          </span>
        </div>
      </section>
      <section className="technician-grid">
        {[...technicians]
          .sort((a, b) => b.score - a.score)
          .map((technician) => {
            const completion = technician.assigned
              ? Math.round((technician.completed / technician.assigned) * 100)
              : 0;
            const onTime = technician.completed
              ? Math.round((technician.on_time / technician.completed) * 100)
              : 0;
            const activeJob = jobs.find(
              (job) =>
                job.technician_id === technician.id &&
                job.status === "IN_PROGRESS",
            );
            return (
              <article className="technician-card" key={technician.id}>
                <div className="technician-card-top">
                  <Avatar name={technician.name} />
                  <div>
                    <strong>{technician.name}</strong>
                    <span>
                      {technician.code} · {technician.branch_name}
                    </span>
                  </div>
                  <StatusBadge status={technician.employment_status} />
                </div>
                <div className="technician-role">
                  <Wrench size={14} />
                  <span>
                    {technician.position} · {technician.primary_skill}
                  </span>
                </div>
                <div className="technician-score">
                  <div
                    className="score-ring large"
                    style={{ "--score": technician.score } as React.CSSProperties}
                  >
                    <span>{number.format(technician.score)}</span>
                  </div>
                  <div className="score-bars">
                    <ScoreBar label="Completion" value={completion} />
                    <ScoreBar
                      label="Volume"
                      value={Math.round(
                        (technician.completed / maxCompleted) * 100,
                      )}
                    />
                    <ScoreBar label="On time" value={onTime} />
                  </div>
                </div>
                <div className="technician-stats">
                  <span>
                    <strong>{technician.assigned}</strong>
                    Assigned
                  </span>
                  <span>
                    <strong>{technician.completed}</strong>
                    Completed
                  </span>
                  <span>
                    <strong>{technician.pending}</strong>
                    Pending
                  </span>
                </div>
                {activeJob ? (
                  <button className="active-job" onClick={() => onJobs(technician)}>
                    <span className="live-dot" />
                    <span>
                      <small>Working now</small>
                      <strong>
                        {activeJob.code} · {activeJob.customer}
                      </strong>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button className="active-job available">
                    <Check size={14} />
                    Available for assignment
                  </button>
                )}
              </article>
            );
          })}
      </section>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-bar">
      <span>
        {label} <b>{Math.min(100, value)}%</b>
      </span>
      <div>
        <i style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function ReportsView({
  snapshot,
  notify,
}: {
  snapshot: Snapshot;
  notify: (message: string) => void;
}) {
  const completed = snapshot.jobs.filter((job) => job.status === "COMPLETED");
  const logged = snapshot.jobs.filter((job) => job.status !== "CANCELLED");
  const stockValue = snapshot.items.reduce((sum, item) => sum + item.value, 0);
  const issuedValue = snapshot.movements
    .filter((movement) => movement.quantity_delta < 0)
    .reduce((sum, movement) => sum + movement.total_cost, 0);
  const reportCards = [
    {
      icon: ChartNoAxesCombined,
      title: "Monthly operations summary",
      description: "Stock receipts, issues, closing value and job delivery.",
      stat: `${Math.round((completed.length / logged.length) * 100)}% completion`,
    },
    {
      icon: HardHat,
      title: "Technician leaderboard",
      description: "Score components, turnaround and parts cost by technician.",
      stat: `${snapshot.technicians.length} technicians`,
    },
    {
      icon: Building2,
      title: "Branch comparison",
      description: "Logged, completed, average days and active field capacity.",
      stat: `${snapshot.branches.length} branches`,
    },
    {
      icon: Boxes,
      title: "Inventory valuation",
      description: "Closing stock, average cost and value by category.",
      stat: formatMoney(stockValue, true),
    },
    {
      icon: ShieldCheck,
      title: "Data health",
      description: "Negative stock, date inconsistencies and overdue jobs.",
      stat: `${snapshot.items.filter((item) => item.health !== "HEALTHY").length} exceptions`,
    },
    {
      icon: History,
      title: "Stock ledger export",
      description: "Movement-level audit trail with reference and actor.",
      stat: formatMoney(issuedValue, true),
    },
  ];
  const branchStats = snapshot.branches.map((branch) => {
    const jobs = snapshot.jobs.filter((job) => job.branch_id === branch.id);
    const completedJobs = jobs.filter((job) => job.status === "COMPLETED");
    return {
      name: branch.name,
      logged: jobs.length,
      completed: completedJobs.length,
      rate: jobs.length ? Math.round((completedJobs.length / jobs.length) * 100) : 0,
      technicians: snapshot.technicians.filter(
        (technician) => technician.branch_id === branch.id,
      ).length,
    };
  });
  return (
    <>
      <section className="report-grid">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <article className="report-card" key={report.title}>
              <div className="report-icon">
                <Icon size={19} />
              </div>
              <button className="icon-button">
                <MoreHorizontal size={16} />
              </button>
              <h2>{report.title}</h2>
              <p>{report.description}</p>
              <span>{report.stat}</span>
              <div className="report-actions">
                <button
                  onClick={() => notify(`${report.title} preview is ready`)}
                >
                  Preview
                </button>
                <button
                  onClick={() => {
                    downloadCsv("coolops-report.csv", branchStats);
                    notify("CSV export generated with active filters");
                  }}
                >
                  <Download size={14} /> Export
                </button>
              </div>
            </article>
          );
        })}
      </section>
      <section className="card branch-comparison">
        <CardHeader
          title="Branch performance"
          subtitle="Current reporting period · all job types"
        />
        <div className="branch-chart">
          {branchStats.map((item) => (
            <div className="branch-column" key={item.name}>
              <div className="branch-bar-area">
                <div
                  className="branch-bar logged"
                  style={{ height: `${Math.max(12, item.logged * 13)}px` }}
                  title={`${item.logged} logged`}
                />
                <div
                  className="branch-bar completed"
                  style={{ height: `${Math.max(12, item.completed * 13)}px` }}
                  title={`${item.completed} completed`}
                />
              </div>
              <strong>{item.name}</strong>
              <span>
                {item.rate}% · {item.technicians} techs
              </span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <i className="logged" /> Logged
          </span>
          <span>
            <i className="completed" /> Completed
          </span>
        </div>
      </section>
    </>
  );
}

function SettingsView({
  snapshot,
  tab,
  setTab,
  notify,
}: {
  snapshot: Snapshot;
  tab: string;
  setTab: (value: string) => void;
  notify: (message: string) => void;
}) {
  const tabs = [
    "Organization",
    "Branches",
    "Inventory",
    "Jobs",
    "Technicians",
    "Scoring",
    "Identifiers",
  ];
  return (
    <section className="settings-layout">
      <nav>
        {tabs.map((item) => (
          <button
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => setTab(item)}
          >
            {item}
            <ChevronRight size={14} />
          </button>
        ))}
      </nav>
      <div className="settings-panel">
        {tab === "Organization" && (
          <>
            <SettingsHeading
              title="Organization profile"
              description="Core settings applied across records, reports and exports."
            />
            <div className="logo-upload">
              <div className="org-logo">KC</div>
              <div>
                <strong>Workspace logo</strong>
                <span>PNG or JPG, at least 256 × 256 px</span>
              </div>
              <button className="button secondary">
                <Upload size={14} /> Replace
              </button>
            </div>
            <div className="form-grid">
              <Field label="Organization name">
                <input defaultValue={snapshot.organization.name} />
              </Field>
              <Field label="Currency">
                <select defaultValue={snapshot.organization.currency}>
                  <option>TZS</option>
                  <option>USD</option>
                  <option>KES</option>
                </select>
              </Field>
              <Field label="Timezone">
                <select defaultValue={snapshot.organization.timezone}>
                  <option>Africa/Dar_es_Salaam</option>
                  <option>Africa/Nairobi</option>
                </select>
              </Field>
              <Field label="Financial year starts">
                <select defaultValue="January">
                  <option>January</option>
                  <option>July</option>
                </select>
              </Field>
            </div>
            <SettingsSave onSave={() => notify("Organization settings saved")} />
          </>
        )}
        {tab === "Branches" && (
          <>
            <SettingsHeading
              title="Branches & warehouses"
              description="Operational scopes used for access, scheduling and stock."
              action="Add branch"
            />
            <div className="reference-list">
              {snapshot.branches.map((branch) => (
                <div key={branch.id}>
                  <div className="reference-icon">
                    <Building2 size={17} />
                  </div>
                  <span>
                    <strong>{branch.name}</strong>
                    <small>
                      {branch.code} ·{" "}
                      {snapshot.warehouses.find(
                        (warehouse) => warehouse.branch_id === branch.id,
                      )?.name ?? "No warehouse"}
                    </small>
                  </span>
                  <StatusBadge status="ACTIVE" />
                  <MoreHorizontal size={16} />
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "Scoring" && (
          <>
            <SettingsHeading
              title="Technician scoring"
              description="Weights must total 100. Score components remain visible in reports."
            />
            <div className="weight-editor">
              <WeightEditor label="Completion rate" value={50} color="#7c83ff" />
              <WeightEditor label="Completed volume" value={30} color="#57d39a" />
              <WeightEditor label="On-time rate" value={20} color="#f6c567" />
              <div className="weight-total">
                <span>Total weight</span>
                <strong>100%</strong>
                <CheckCircle2 size={17} />
              </div>
            </div>
            <SettingsSave onSave={() => notify("Scoring weights saved")} />
          </>
        )}
        {tab === "Inventory" && (
          <>
            <SettingsHeading
              title="Inventory rules"
              description="Thresholds and defaults for stock health and replenishment."
            />
            <div className="form-grid">
              <Field label="Critical stock factor">
                <div className="input-suffix">
                  <input
                    type="number"
                    step="0.05"
                    defaultValue={snapshot.organization.critical_factor}
                  />
                  <span>× minimum</span>
                </div>
              </Field>
              <Field label="Default warehouse">
                <select defaultValue="wh_central">
                  {snapshot.warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Negative stock override">
                <select defaultValue="Disabled">
                  <option>Disabled</option>
                  <option>Administrators only</option>
                </select>
              </Field>
              <Field label="Reorder suggestion">
                <select defaultValue="Configured quantity">
                  <option>Configured quantity</option>
                  <option>Minimum shortfall</option>
                </select>
              </Field>
            </div>
            <SettingsSave onSave={() => notify("Inventory rules saved")} />
          </>
        )}
        {tab === "Jobs" && (
          <>
            <SettingsHeading
              title="Job workflow"
              description="Scheduling defaults and controlled lifecycle values."
            />
            <div className="form-grid">
              <Field label="Default turnaround">
                <div className="input-suffix">
                  <input
                    type="number"
                    defaultValue={snapshot.organization.target_turnaround_days}
                  />
                  <span>days</span>
                </div>
              </Field>
              <Field label="Completion checklist">
                <select defaultValue="Optional">
                  <option>Optional</option>
                  <option>Required</option>
                </select>
              </Field>
            </div>
            <div className="workflow-row">
              {["Assigned", "In progress", "On hold", "Completed"].map(
                (status, index) => (
                  <div key={status}>
                    <span>{index + 1}</span>
                    <strong>{status}</strong>
                    {index < 3 && <ChevronRight size={15} />}
                  </div>
                ),
              )}
            </div>
            <SettingsSave onSave={() => notify("Job workflow saved")} />
          </>
        )}
        {!["Organization", "Branches", "Scoring", "Inventory", "Jobs"].includes(
          tab,
        ) && (
          <>
            <SettingsHeading
              title={tab}
              description={`Configure organization-wide ${tab.toLowerCase()} reference values.`}
              action={`Add ${tab === "Identifiers" ? "sequence" : "value"}`}
            />
            <div className="reference-list">
              {referenceValues(tab).map((value, index) => (
                <div key={value}>
                  <div className="drag-handle">⋮⋮</div>
                  <span>
                    <strong>{value}</strong>
                    <small>Active · used by {3 + index * 4} records</small>
                  </span>
                  <StatusBadge status="ACTIVE" />
                  <MoreHorizontal size={16} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function referenceValues(tab: string) {
  if (tab === "Identifiers")
    return ["Items · ITM-0001", "Receipts · GRN-0001", "Issues · ISS-0001", "Technicians · TEC-001", "Jobs · JOB-0001"];
  return ["HVAC Technician", "Senior Technician", "Installer", "Field Supervisor"];
}

function SettingsHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="settings-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action && (
        <button className="button secondary">
          <Plus size={14} /> {action}
        </button>
      )}
    </div>
  );
}

function SettingsSave({ onSave }: { onSave: () => void }) {
  return (
    <div className="settings-save">
      <span>Changes are recorded in the audit log.</span>
      <button className="button primary" onClick={onSave}>
        Save changes
      </button>
    </div>
  );
}

function WeightEditor({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="weight-row">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        defaultValue={value}
        style={{ accentColor: color }}
      />
      <div className="input-suffix small">
        <input type="number" defaultValue={value} />
        <span>%</span>
      </div>
    </div>
  );
}

function AuditView({ audits }: { audits: AuditRow[] }) {
  return (
    <section className="module-card">
      <div className="module-toolbar">
        <SearchField value="" onChange={() => {}} placeholder="Search audit log" />
        <button className="button secondary">
          <Filter size={15} /> Action
        </button>
        <button className="button secondary">
          <UserRound size={15} /> Actor
        </button>
        <button className="button icon-only">
          <Download size={15} />
        </button>
      </div>
      <div className="audit-timeline">
        {audits.map((audit) => (
          <div className="audit-event" key={audit.id}>
            <div className="audit-icon">
              {audit.action === "POST" ? (
                <PackageCheck size={16} />
              ) : audit.action === "COMPLETE" ? (
                <CheckCircle2 size={16} />
              ) : (
                <Activity size={16} />
              )}
            </div>
            <div>
              <strong>
                {audit.actor} {auditVerb(audit.action)}{" "}
                <button>{audit.entity_id}</button>
              </strong>
              <span>
                {audit.entity_type} · Request recorded with actor and timestamp
              </span>
            </div>
            <StatusBadge status={audit.action} />
            <time>{formatDate(audit.created_at, true)}</time>
          </div>
        ))}
      </div>
      <TableFooter count={audits.length} label="audit events" />
    </section>
  );
}

function auditVerb(action: string) {
  if (action === "POST") return "posted";
  if (action === "COMPLETE") return "completed";
  if (action === "STATUS_CHANGE") return "changed the status of";
  if (action === "CREATE") return "created";
  return action.toLowerCase();
}

function JobDrawer({
  job,
  technician,
  movements,
  onClose,
  onStatus,
  onIssue,
  submitting,
}: {
  job: Job;
  technician?: Technician;
  movements: Movement[];
  onClose: () => void;
  onStatus: (status: string) => void;
  onIssue: () => void;
  submitting: boolean;
}) {
  const [tab, setTab] = useState("Activity");
  return (
    <Drawer onClose={onClose} wide>
      <div className="record-header">
        <div className="record-breadcrumb">
          <button onClick={onClose}>
            <ArrowLeft size={16} />
          </button>
          Jobs <ChevronRight size={13} /> {job.code}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close job">
          <X size={17} />
        </button>
      </div>
      <div className="record-title">
        <div className={`record-icon priority-${job.priority.toLowerCase()}`}>
          <Wrench size={20} />
        </div>
        <div>
          <div>
            <span>{job.code}</span>
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
          </div>
          <h2>{job.customer}</h2>
          <p>{job.site}</p>
        </div>
      </div>
      <div className="record-actions">
        {job.status === "ASSIGNED" && (
          <button
            className="button primary"
            onClick={() => onStatus("IN_PROGRESS")}
            disabled={submitting}
          >
            <Activity size={15} /> Start job
          </button>
        )}
        {job.status === "IN_PROGRESS" && (
          <>
            <button
              className="button primary"
              onClick={() => onStatus("COMPLETED")}
              disabled={submitting}
            >
              <Check size={15} /> Complete
            </button>
            <button
              className="button secondary"
              onClick={() => onStatus("ON_HOLD")}
              disabled={submitting}
            >
              <Clock3 size={15} /> Put on hold
            </button>
          </>
        )}
        {job.status === "ON_HOLD" && (
          <button
            className="button primary"
            onClick={() => onStatus("IN_PROGRESS")}
            disabled={submitting}
          >
            <Activity size={15} /> Resume work
          </button>
        )}
        {!["COMPLETED", "CANCELLED"].includes(job.status) && (
          <button className="button secondary" onClick={onIssue}>
            <PackageMinus size={15} /> Issue parts
          </button>
        )}
        <button className="button icon-only">
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div className="record-tabs">
        {["Overview", "Activity", "Parts", "Attachments", "Audit"].map((item) => (
          <button
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => setTab(item)}
          >
            {item}
            {item === "Parts" && movements.length > 0 && (
              <span>{movements.length}</span>
            )}
          </button>
        ))}
      </div>
      <div className="record-body">
        <div className="record-content">
          {tab === "Overview" && (
            <>
              <RecordSection title="Work description">
                <p className="description-copy">{job.description}</p>
              </RecordSection>
              <RecordSection title="Resolution">
                <p className="description-copy muted">
                  {job.resolution ??
                    "Resolution will be required when the technician completes this job."}
                </p>
              </RecordSection>
              <RecordSection title="Completion checklist">
                {[
                  "Site and equipment made safe",
                  "Service readings recorded",
                  "Customer handover completed",
                ].map((item, index) => (
                  <label className="checklist-row" key={item}>
                    <input
                      type="checkbox"
                      defaultChecked={job.status === "COMPLETED" || index === 0}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </RecordSection>
            </>
          )}
          {tab === "Activity" && (
            <div className="activity-feed">
              <div className="note-composer">
                <Avatar name="Asha Mwita" small />
                <input placeholder="Write an update…" />
                <button className="button secondary">Add note</button>
              </div>
              <TimelineEvent
                icon={job.status === "COMPLETED" ? CheckCircle2 : Activity}
                title={`${friendlyStatus(job.status)} · current status`}
                description={
                  job.resolution ?? "Operational status updated by the field team."
                }
                time={formatDate(job.completed_at ?? job.logged_at, true)}
              />
              {movements.map((movement) => (
                <TimelineEvent
                  key={movement.id}
                  icon={PackageMinus}
                  title={`${movement.code} · ${movement.item_name}`}
                  description={`${Math.abs(movement.quantity_delta)} issued · ${formatMoney(
                    movement.total_cost,
                  )}`}
                  time={formatDate(movement.created_at, true)}
                />
              ))}
              <TimelineEvent
                icon={UserRound}
                title={`Assigned to ${job.technician_name}`}
                description={`Service target set for ${formatDate(job.target_at)}.`}
                time={formatDate(job.logged_at, true)}
              />
              <TimelineEvent
                icon={Plus}
                title="Job created"
                description={`${job.type.toLowerCase()} job logged for ${job.site}.`}
                time={formatDate(job.logged_at, true)}
              />
            </div>
          )}
          {tab === "Parts" && (
            <RecordSection title="Parts consumed">
              {movements.length ? (
                <div className="parts-list">
                  {movements.map((movement) => (
                    <div key={movement.id}>
                      <div className="item-icon">
                        <Boxes size={15} />
                      </div>
                      <span>
                        <strong>{movement.item_name}</strong>
                        <small>
                          {movement.code} · {Math.abs(movement.quantity_delta)} units
                        </small>
                      </span>
                      <strong>{formatMoney(movement.total_cost)}</strong>
                    </div>
                  ))}
                  <footer>
                    <span>Total job parts cost</span>
                    <strong>{formatMoney(job.parts_cost)}</strong>
                  </footer>
                </div>
              ) : (
                <EmptyState
                  icon={PackageMinus}
                  title="No parts issued yet"
                  description="Issue a part from store to link its cost to this job."
                  action="Issue parts"
                  onAction={onIssue}
                />
              )}
            </RecordSection>
          )}
          {tab === "Attachments" && (
            <EmptyState
              icon={Upload}
              title="Keep site evidence together"
              description="Upload photos or PDF service documents up to 10 MB."
              action="Upload attachment"
              onAction={() => {}}
            />
          )}
          {tab === "Audit" && (
            <div className="audit-summary">
              <ShieldCheck size={24} />
              <h3>Complete activity attribution</h3>
              <p>
                Creation, assignment, status, parts and completion actions are
                retained with actor, time and request identifiers.
              </p>
            </div>
          )}
        </div>
        <aside className="metadata-panel">
          <h3>Job details</h3>
          <MetaRow label="Type" value={friendlyStatus(job.type)} />
          <MetaRow label="Branch" value={job.branch_name} />
          <MetaRow label="Logged" value={formatDate(job.logged_at)} />
          <MetaRow
            label="Target"
            value={formatDate(job.target_at)}
            danger={isOverdue(job)}
          />
          <MetaRow
            label="Completed"
            value={formatDate(job.completed_at)}
          />
          <div className="meta-divider" />
          <h3>Assignment</h3>
          <div className="assignee-card">
            <Avatar name={job.technician_name || "Unassigned"} small />
            <span>
              <strong>{job.technician_name || "Unassigned"}</strong>
              <small>{technician?.primary_skill ?? "No technician selected"}</small>
            </span>
          </div>
          <MetaRow label="Parts cost" value={formatMoney(job.parts_cost)} />
          <MetaRow label="On time" value={job.completed_at ? (new Date(job.completed_at) <= new Date(job.target_at) ? "Yes" : "No") : "Pending"} />
        </aside>
      </div>
    </Drawer>
  );
}

function ItemDrawer({
  item,
  movements,
  onClose,
  onReceipt,
}: {
  item: Item;
  movements: Movement[];
  onClose: () => void;
  onReceipt: () => void;
}) {
  const coverage =
    item.minimum_stock > 0
      ? Math.round((item.quantity / item.minimum_stock) * 100)
      : 100;
  return (
    <Drawer onClose={onClose}>
      <div className="record-header">
        <div className="record-breadcrumb">
          <button onClick={onClose}>
            <ArrowLeft size={16} />
          </button>
          Inventory <ChevronRight size={13} /> {item.code}
        </div>
        <button className="icon-button" onClick={onClose}>
          <X size={17} />
        </button>
      </div>
      <div className="record-title item-title">
        <div className="record-icon">
          <Boxes size={20} />
        </div>
        <div>
          <div>
            <span>{item.code}</span>
            <HealthBadge health={item.health} />
          </div>
          <h2>{item.name}</h2>
          <p>
            {item.brand} · {item.category}
          </p>
        </div>
      </div>
      <div className="record-actions">
        <button className="button primary" onClick={onReceipt}>
          <PackagePlus size={15} /> Receive stock
        </button>
        <button className="button secondary">
          <ArrowUpRight size={15} /> View ledger
        </button>
      </div>
      <div className="item-balance-card">
        <div>
          <span>Available stock</span>
          <strong>
            {number.format(item.quantity)} <small>{item.unit}</small>
          </strong>
          <HealthBadge health={item.health} />
        </div>
        <div>
          <span>Stock value</span>
          <strong>{formatMoney(item.value)}</strong>
          <small>at {formatMoney(item.average_cost)} average cost</small>
        </div>
      </div>
      <div className="coverage-card">
        <div>
          <span>Minimum stock coverage</span>
          <strong>{coverage}%</strong>
        </div>
        <div className="coverage-track">
          <i
            className={slugStatus(item.health)}
            style={{ width: `${Math.min(100, coverage)}%` }}
          />
        </div>
        <p>
          Minimum {number.format(item.minimum_stock)} · Reorder{" "}
          {number.format(item.reorder_quantity)} {item.unit}
        </p>
      </div>
      <RecordSection title="Item details">
        <div className="detail-grid">
          <MetaRow label="Category" value={item.category} />
          <MetaRow label="Brand" value={item.brand} />
          <MetaRow label="Supplier" value={item.supplier} />
          <MetaRow label="Warehouse" value={item.warehouse_name} />
          <MetaRow label="Standard cost" value={formatMoney(item.standard_cost)} />
          <MetaRow label="Average cost" value={formatMoney(item.average_cost)} />
        </div>
      </RecordSection>
      <RecordSection title="Recent movements">
        <div className="parts-list">
          {movements.length ? (
            movements.map((movement) => (
              <div key={movement.id}>
                <div
                  className={`movement-mini ${
                    movement.quantity_delta > 0 ? "in" : "out"
                  }`}
                >
                  {movement.quantity_delta > 0 ? (
                    <ArrowDownLeft size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </div>
                <span>
                  <strong>{movement.code}</strong>
                  <small>{formatDate(movement.created_at, true)}</small>
                </span>
                <strong>
                  {movement.quantity_delta > 0 ? "+" : ""}
                  {movement.quantity_delta}
                </strong>
              </div>
            ))
          ) : (
            <p className="muted">No recent movements beyond the opening balance.</p>
          )}
        </div>
      </RecordSection>
    </Drawer>
  );
}

function Drawer({
  children,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="drawer-layer">
      <button className="drawer-scrim" onClick={onClose} aria-label="Close panel" />
      <aside className={`drawer ${wide ? "wide" : ""}`}>{children}</aside>
    </div>
  );
}

function OperationModal({
  kind,
  snapshot,
  selectedJob,
  selectedItem,
  submitting,
  onClose,
  onSubmit,
}: {
  kind: Exclude<ModalKind, null>;
  snapshot: Snapshot;
  selectedJob: Job | null;
  selectedItem: Item | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const labels = {
    job: { title: "Log a new job", subtitle: "Create, target and assign field work." },
    item: { title: "Create inventory item", subtitle: "Set control levels and opening stock." },
    receipt: { title: "Receive stock", subtitle: "Post an immutable goods-received movement." },
    issue: { title: "Issue parts", subtitle: "Consume stock at the current weighted-average cost." },
    complete: { title: "Complete job", subtitle: "Record the resolution and close the work." },
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const action =
      kind === "job"
        ? "createJob"
        : kind === "item"
          ? "createItem"
          : kind === "receipt"
            ? "postReceipt"
            : kind === "issue"
              ? "postIssue"
              : "updateJobStatus";
    await onSubmit({
      ...data,
      action,
      ...(kind === "complete"
        ? { jobId: selectedJob?.id, status: "COMPLETED" }
        : {}),
    });
  }

  return (
    <div className="modal-layer">
      <button className="modal-scrim" onClick={onClose} aria-label="Close dialog" />
      <form className="operation-modal" onSubmit={submit}>
        <header>
          <div>
            <h2>{labels[kind].title}</h2>
            <p>{labels[kind].subtitle}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="modal-body">
          {kind === "job" && (
            <JobForm snapshot={snapshot} />
          )}
          {kind === "item" && <ItemForm />}
          {(kind === "receipt" || kind === "issue") && (
            <MovementForm
              kind={kind}
              snapshot={snapshot}
              selectedJob={selectedJob}
              selectedItem={selectedItem}
            />
          )}
          {kind === "complete" && selectedJob && (
            <CompleteForm job={selectedJob} />
          )}
        </div>
        <footer>
          <span>
            <ShieldCheck size={14} /> This action will be audited.
          </span>
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={submitting}>
            {submitting && <LoaderCircle className="spin" size={15} />}
            {kind === "receipt" || kind === "issue"
              ? "Post transaction"
              : kind === "complete"
                ? "Complete job"
                : "Create"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function JobForm({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div className="form-grid">
      <Field label="Customer" required full>
        <input name="customer" placeholder="e.g. Serena Hotel" required />
      </Field>
      <Field label="Site" required full>
        <input name="site" placeholder="Building, floor or equipment area" required />
      </Field>
      <Field label="Branch" required>
        <select name="branchId" defaultValue={snapshot.branches[0]?.id} required>
          {snapshot.branches.map((branch) => (
            <option value={branch.id} key={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Technician" required>
        <select
          name="technicianId"
          defaultValue={snapshot.technicians[0]?.id}
          required
        >
          {snapshot.technicians
            .filter((technician) => technician.employment_status === "ACTIVE")
            .map((technician) => (
              <option value={technician.id} key={technician.id}>
                {technician.name} · {technician.primary_skill}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Job type" required>
        <select name="type" defaultValue="MAINTENANCE">
          <option>INSTALLATION</option>
          <option>MAINTENANCE</option>
          <option>REPAIR</option>
        </select>
      </Field>
      <Field label="Priority" required>
        <select name="priority" defaultValue="NORMAL">
          <option>LOW</option>
          <option>NORMAL</option>
          <option>HIGH</option>
          <option>URGENT</option>
        </select>
      </Field>
      <Field label="Description" required full>
        <textarea
          name="description"
          rows={4}
          placeholder="Describe the fault, request or scope of work."
          required
        />
      </Field>
      <div className="form-callout full">
        <CalendarDays size={17} />
        <span>
          <strong>Target date will default to 3 days after logging.</strong>
          It can be overridden later with a recorded reason.
        </span>
      </div>
    </div>
  );
}

function ItemForm() {
  return (
    <div className="form-grid">
      <Field label="Item name" required full>
        <input name="name" placeholder="e.g. Compressor 18,000 BTU" required />
      </Field>
      <Field label="Category" required>
        <select name="category" defaultValue="Electrical">
          {["Compressors", "Condensate", "Controls", "Electrical", "Filtration", "Motors", "Piping", "Refrigerants"].map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </select>
      </Field>
      <Field label="Unit" required>
        <select name="unit" defaultValue="unit">
          <option>unit</option>
          <option>piece</option>
          <option>coil</option>
          <option>roll</option>
          <option>cylinder</option>
        </select>
      </Field>
      <Field label="Brand" required>
        <input name="brand" placeholder="Manufacturer" required />
      </Field>
      <Field label="Preferred supplier" required>
        <input name="supplier" placeholder="Supplier name" required />
      </Field>
      <Field label="Minimum stock" required>
        <input name="minimumStock" type="number" min="0.01" step="0.01" defaultValue="5" required />
      </Field>
      <Field label="Reorder quantity" required>
        <input name="reorderQuantity" type="number" min="0.01" step="0.01" defaultValue="10" required />
      </Field>
      <Field label="Standard cost (TZS)" required>
        <input name="standardCost" type="number" min="1" step="1" placeholder="0" required />
      </Field>
      <Field label="Opening quantity">
        <input name="openingQuantity" type="number" min="0" step="0.01" defaultValue="0" />
      </Field>
    </div>
  );
}

function MovementForm({
  kind,
  snapshot,
  selectedJob,
  selectedItem,
}: {
  kind: "receipt" | "issue";
  snapshot: Snapshot;
  selectedJob: Job | null;
  selectedItem: Item | null;
}) {
  const [itemId, setItemId] = useState(
    selectedItem?.id ?? snapshot.items[0]?.id ?? "",
  );
  const item = snapshot.items.find((candidate) => candidate.id === itemId);
  const defaultJob =
    selectedJob ??
    snapshot.jobs.find(
      (job) => !["COMPLETED", "CANCELLED"].includes(job.status),
    );
  return (
    <div className="form-grid">
      <Field label="Warehouse" required full>
        <select defaultValue="wh_central">
          {snapshot.warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </Field>
      {kind === "issue" && (
        <>
          <Field label="Job" required>
            <select name="jobId" defaultValue={defaultJob?.id} required>
              {snapshot.jobs
                .filter(
                  (job) => !["COMPLETED", "CANCELLED"].includes(job.status),
                )
                .map((job) => (
                  <option value={job.id} key={job.id}>
                    {job.code} · {job.customer}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Technician" required>
            <select
              name="technicianId"
              defaultValue={selectedJob?.technician_id ?? defaultJob?.technician_id}
              required
            >
              {snapshot.technicians.map((technician) => (
                <option value={technician.id} key={technician.id}>
                  {technician.name}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      <Field label="Item" required full>
        <select
          name="itemId"
          value={itemId}
          onChange={(event) => setItemId(event.target.value)}
          required
        >
          {snapshot.items.map((candidate) => (
            <option value={candidate.id} key={candidate.id}>
              {candidate.code} · {candidate.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="stock-availability full">
        <div>
          <span>Available</span>
          <strong>
            {number.format(item?.quantity ?? 0)} {item?.unit}
          </strong>
        </div>
        <div>
          <span>Average cost</span>
          <strong>{formatMoney(item?.average_cost ?? 0)}</strong>
        </div>
        <HealthBadge health={item?.health ?? "HEALTHY"} />
      </div>
      <Field label="Quantity" required>
        <input
          name="quantity"
          type="number"
          min="0.01"
          max={kind === "issue" ? item?.quantity : undefined}
          step="0.01"
          defaultValue="1"
          required
        />
      </Field>
      {kind === "receipt" && (
        <Field label="Unit cost (TZS)" required>
          <input name="unitCost" type="number" min="1" step="1" required />
        </Field>
      )}
      <Field label={kind === "receipt" ? "Supplier / invoice reference" : "Purpose"} full>
        <input
          name="reference"
          placeholder={kind === "receipt" ? "PO, invoice or GRN reference" : "Reason for issue"}
        />
      </Field>
      <div className="form-callout full">
        <ShieldCheck size={17} />
        <span>
          <strong>
            {kind === "receipt"
              ? "Weighted-average cost is calculated server-side."
              : "The current average cost is captured permanently."}
          </strong>
          Posting updates the ledger, balance, audit trail and linked job atomically.
        </span>
      </div>
    </div>
  );
}

function CompleteForm({ job }: { job: Job }) {
  return (
    <div className="form-grid">
      <div className="completion-job full">
        <StatusBadge status={job.status} />
        <span>
          <strong>
            {job.code} · {job.customer}
          </strong>
          <small>{job.site}</small>
        </span>
      </div>
      <Field label="Resolution summary" required full>
        <textarea
          name="resolution"
          rows={5}
          placeholder="Describe the work completed, readings and customer handover."
          required
        />
      </Field>
      <div className="form-callout full success">
        <CheckCircle2 size={17} />
        <span>
          <strong>Completion time will be recorded now.</strong>
          Turnaround, on-time delivery and technician score will refresh automatically.
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
  full = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {children}
    </label>
  );
}

function NotificationsPanel({
  items,
  jobs,
  onClose,
  onOpenItem,
  onOpenJob,
}: {
  items: Item[];
  jobs: Job[];
  onClose: () => void;
  onOpenItem: (item: Item) => void;
  onOpenJob: (job: Job) => void;
}) {
  const alerts = items.filter((item) => item.health !== "HEALTHY").slice(0, 3);
  const overdue = jobs.filter(isOverdue).slice(0, 2);
  return (
    <aside className="notifications-panel">
      <header>
        <div>
          <h2>Notifications</h2>
          <span>{alerts.length + overdue.length} need attention</span>
        </div>
        <button className="icon-button" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      <div className="notification-tabs">
        <button className="active">Inbox</button>
        <button>Read</button>
      </div>
      <div className="notification-list">
        {alerts.map((item) => (
          <button key={item.id} onClick={() => onOpenItem(item)}>
            <div className={`notification-icon ${slugStatus(item.health)}`}>
              <TriangleAlert size={15} />
            </div>
            <span>
              <strong>{friendlyStatus(item.health)} stock · {item.name}</strong>
              <small>
                {item.quantity} {item.unit} available · minimum {item.minimum_stock}
              </small>
              <em>Inventory alert · now</em>
            </span>
          </button>
        ))}
        {overdue.map((job) => (
          <button key={job.id} onClick={() => onOpenJob(job)}>
            <div className="notification-icon overdue">
              <Clock3 size={15} />
            </div>
            <span>
              <strong>{job.code} is overdue</strong>
              <small>
                {job.customer} · {job.technician_name}
              </small>
              <em>{relativeDate(job.target_at)}</em>
            </span>
          </button>
        ))}
      </div>
      <footer>
        <button>Notification preferences</button>
        <button>Mark all read</button>
      </footer>
    </aside>
  );
}

function CommandPalette({
  inputRef,
  onClose,
  onSelect,
  onCreate,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSelect: (module: ModuleKey) => void;
  onCreate: (kind: Exclude<ModalKind, null>) => void;
}) {
  const [query, setQuery] = useState("");
  const commands: {
    label: string;
    hint: string;
    icon: LucideIcon;
    run: () => void;
  }[] = [
    { label: "Go to Overview", hint: "Workspace", icon: LayoutDashboard, run: () => onSelect("overview") },
    { label: "Go to Jobs", hint: "Workspace", icon: Wrench, run: () => onSelect("jobs") },
    { label: "Go to Inventory", hint: "Workspace", icon: Boxes, run: () => onSelect("inventory") },
    { label: "Create new job", hint: "Action", icon: Plus, run: () => onCreate("job") },
    { label: "Receive stock", hint: "Action", icon: PackagePlus, run: () => onCreate("receipt") },
    { label: "Issue parts", hint: "Action", icon: PackageMinus, run: () => onCreate("issue") },
    { label: "Open reports", hint: "Workspace", icon: FileBarChart, run: () => onSelect("reports") },
  ];
  const filtered = commands.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="command-layer">
      <button className="modal-scrim" onClick={onClose} aria-label="Close command palette" />
      <div className="command-palette">
        <div className="command-input">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command or search…"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-results">
          <span>Suggested</span>
          {filtered.map((command) => {
            const Icon = command.icon;
            return (
              <button key={command.label} onClick={command.run}>
                <Icon size={17} />
                <strong>{command.label}</strong>
                <span>{command.hint}</span>
              </button>
            );
          })}
          {!filtered.length && <p>No commands match “{query}”.</p>}
        </div>
        <footer>
          <span>
            <kbd>↑</kbd><kbd>↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
        </footer>
      </div>
    </div>
  );
}

function MobileNav({
  active,
  onSelect,
  onMore,
}: {
  active: ModuleKey;
  onSelect: (module: ModuleKey) => void;
  onMore: () => void;
}) {
  return (
    <nav className="mobile-nav">
      {[
        ["overview", "Home", House],
        ["jobs", "Jobs", Wrench],
        ["inventory", "Stock", Boxes],
        ["technicians", "Team", Users],
      ].map(([key, label, Icon]) => {
        const NavIcon = Icon as LucideIcon;
        return (
          <button
            key={key as string}
            className={active === key ? "active" : ""}
            onClick={() => onSelect(key as ModuleKey)}
          >
            <NavIcon size={18} />
            {label as string}
          </button>
        );
      })}
      <button onClick={onMore}>
        <Menu size={18} />
        More
      </button>
    </nav>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-field">
      <Search size={15} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button type="button" onClick={() => onChange("")}>
          <X size={13} />
        </button>
      )}
    </label>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const colors = ["violet", "green", "amber", "rose", "blue"];
  const index =
    name.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    colors.length;
  return (
    <span className={`avatar ${colors[index]} ${small ? "small" : ""}`}>
      {initials(name)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${slugStatus(status)}`}>
      <i />
      {friendlyStatus(status)}
    </span>
  );
}

function HealthBadge({ health }: { health: Item["health"] }) {
  return (
    <span className={`health-badge ${health.toLowerCase()}`}>
      {health === "HEALTHY" ? (
        <CheckCircle2 size={12} />
      ) : health === "LOW" ? (
        <AlertCircle size={12} />
      ) : (
        <TriangleAlert size={12} />
      )}
      {friendlyStatus(health)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`priority-badge ${priority.toLowerCase()}`}>
      <i />
      {friendlyStatus(priority)}
    </span>
  );
}

function TableFooter({ count, label }: { count: number; label: string }) {
  return (
    <footer className="table-footer">
      <span>
        Showing <strong>{count}</strong> {label}
      </span>
      <div>
        <button disabled>
          <ChevronRight size={14} className="flip" />
        </button>
        <button className="active">1</button>
        <button>2</button>
        <button>
          <ChevronRight size={14} />
        </button>
      </div>
    </footer>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <div>
        <Icon size={22} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="button secondary" onClick={onAction}>
        <Plus size={14} /> {action}
      </button>
    </div>
  );
}

function RecordSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="record-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetaRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="meta-row">
      <span>{label}</span>
      <strong className={danger ? "danger-text" : ""}>{value}</strong>
    </div>
  );
}

function TimelineEvent({
  icon: Icon,
  title,
  description,
  time,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="timeline-event">
      <div>
        <Icon size={15} />
      </div>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <time>{time}</time>
    </div>
  );
}
