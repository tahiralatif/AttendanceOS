"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Upload,
  ChevronDown,
  X,
  Loader2,
  UserX,
  UserCheck,
} from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  department: string;
  designation: string;
  join_date: string;
  status: string;
  full_name: string;
  email: string;
  user_status: string;
}

interface NewEmployee {
  full_name: string;
  email: string;
  password: string;
  employee_code: string;
  department: string;
  designation: string;
  join_date: string;
}

const API = "";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newEmp, setNewEmp] = useState<NewEmployee>({
    full_name: "", email: "", password: "", employee_code: "",
    department: "", designation: "", join_date: "",
  });
  const [importFile, setImportFile] = useState<File | null>(null);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }), []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/employees`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : data.employees || []);
      }
    } catch {}
    setLoading(false);
  }, [headers]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/employees/create-with-user`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(newEmp),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to create employee");
        return;
      }
      setSuccess(`Employee created! Temp password: ${data.temp_password}`);
      setShowModal(false);
      setNewEmp({ full_name: "", email: "", password: "", employee_code: "", department: "", designation: "", join_date: "" });
      fetchEmployees();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (empId: string) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return;
    try {
      const res = await fetch(`${API}/api/v1/employees/${empId}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (res.ok) fetchEmployees();
    } catch {}
  };

  const handleReactivate = async (empId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/employees/${empId}/reactivate`, {
        method: "POST",
        headers: headers(),
      });
      if (res.ok) fetchEmployees();
    } catch {}
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch(`${API}/api/v1/employees/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Import failed");
        return;
      }
      setSuccess("Employees imported successfully!");
      setShowImport(false);
      setImportFile(null);
      fetchEmployees();
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const filtered = employees.filter((e) => {
    const matchSearch = !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()) || e.employee_code?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || e.department === deptFilter;
    const matchStatus = !statusFilter || e.status === statusFilter || e.user_status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const statusBadge = (status: string) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold";
    if (status === "active") return `${base} bg-emerald-50 text-emerald-700 border border-emerald-100`;
    if (status === "inactive") return `${base} bg-red-50 text-red-600 border border-red-100`;
    return `${base} bg-gray-50 text-gray-600 border border-gray-100`;
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">Employees</h1>
          <p className="text-sm text-text-secondary mt-1">{filtered.length} total employees</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-text-secondary text-sm font-semibold hover:bg-surface transition-all"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 font-medium animate-fade-in">
          {error}
          <button onClick={() => setError("")} className="ml-2 hover:text-red-800"><X size={14} className="inline" /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4 font-medium animate-fade-in">
          {success}
          <button onClick={() => setSuccess("")} className="ml-2 hover:text-emerald-900"><X size={14} className="inline" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text" placeholder="Search by name, email, or code..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="relative">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="appearance-none w-full sm:w-44 px-4 py-2.5 pr-9 rounded-xl border border-border bg-white text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full sm:w-36 px-4 py-2.5 pr-9 rounded-xl border border-border bg-white text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface/60">
                {["Name", "Email", "Code", "Department", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-text-muted font-medium">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-text-muted font-medium">No employees found</td></tr>
              ) : filtered.map((e) => (
                <tr key={e.id} className="hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary-dark font-bold text-xs">{e.full_name?.split(" ").map((n: string) => n[0]).join("")}</span>
                      </div>
                      <span className="text-sm font-semibold text-text">{e.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{e.email}</td>
                  <td className="px-6 py-3.5 text-sm text-text font-semibold">{e.employee_code || "—"}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{e.department || "—"}</td>
                  <td className="px-6 py-3.5"><span className={statusBadge(e.status || e.user_status)}>{e.status || e.user_status}</span></td>
                  <td className="px-6 py-3.5">
                    {(e.status || e.user_status) === "active" ? (
                      <button onClick={() => handleDeactivate(e.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors">
                        <UserX size={13} /> Deactivate
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(e.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors">
                        <UserCheck size={13} /> Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-text-muted font-medium">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-text-muted font-medium">No employees found</div>
          ) : filtered.map((e) => (
            <div key={e.id} className="px-5 py-4 hover:bg-surface/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary-dark font-bold text-xs">{e.full_name?.split(" ").map((n: string) => n[0]).join("")}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{e.full_name}</p>
                    <p className="text-[11px] text-text-muted font-medium">{e.email}</p>
                  </div>
                </div>
                <span className={statusBadge(e.status || e.user_status)}>{e.status || e.user_status}</span>
              </div>
              <div className="flex items-center justify-between ml-10 mt-2">
                <div className="text-xs text-text-secondary font-medium">
                  <span>{e.department || "—"}</span>
                  <span className="mx-1.5">·</span>
                  <span>{e.employee_code || "—"}</span>
                </div>
                {(e.status || e.user_status) === "active" ? (
                  <button onClick={() => handleDeactivate(e.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Deactivate</button>
                ) : (
                  <button onClick={() => handleReactivate(e.id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Reactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Employee Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04]">
              <h3 className="font-bold text-base text-text tracking-tight">Add Employee</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[
                { label: "Full Name", key: "full_name", type: "text", required: true },
                { label: "Email", key: "email", type: "email", required: true },
                { label: "Password", key: "password", type: "password", required: true },
                { label: "Employee Code", key: "employee_code", type: "text", required: true },
                { label: "Department", key: "department", type: "text", required: false },
                { label: "Designation", key: "designation", type: "text", required: false },
                { label: "Join Date", key: "join_date", type: "date", required: false },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-text mb-1.5">{f.label}</label>
                  <input
                    type={f.type} required={f.required}
                    value={(newEmp as unknown as Record<string, string>)[f.key] || ""}
                    onChange={(e) => setNewEmp({ ...newEmp, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04]">
              <h3 className="font-bold text-base text-text tracking-tight">Import CSV</h3>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={handleImport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">CSV File</label>
                <input
                  type="file" accept=".csv" required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 text-text text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-dark hover:file:bg-primary/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowImport(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={importing || !importFile}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all">
                  {importing ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : "Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
