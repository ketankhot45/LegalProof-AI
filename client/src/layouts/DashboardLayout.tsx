import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link, useLocation, Outlet } from 'react-router';
import { 
  Shield, 
  FileText, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle,
  Menu,
  X,
  Radio,
  ExternalLink,
  FolderLock,
  PlusCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export const DashboardLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="text-xs text-zinc-500 font-mono tracking-wider">INITIALIZING SESSION...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isComplainant = user.role === 'COMPLAINANT';

  const navItems = isComplainant
    ? [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'My Complaints',
          path: '/complaints',
          icon: FileText,
        },
        {
          label: 'New Complaint',
          path: '/complaints/new',
          icon: PlusCircle,
        },
        {
          label: 'Public Verification',
          path: '/verify',
          icon: CheckCircle,
        }
      ]
    : [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Complaints',
          path: '/complaints',
          icon: FileText,
        },
        {
          label: 'Cases',
          path: '/cases',
          icon: Briefcase,
        },
        {
          label: 'Evidence Vault',
          path: '/evidence',
          icon: FolderLock,
        },
        {
          label: 'Public Verification',
          path: '/verify',
          icon: CheckCircle,
        }
      ];

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/complaints/new') return location.pathname === '/complaints/new';
    if (path === '/complaints') {
      return location.pathname === '/complaints' || (location.pathname.startsWith('/complaints/') && location.pathname !== '/complaints/new');
    }
    if (path === '/evidence') {
      return location.pathname === '/evidence' || location.pathname.startsWith('/evidence/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-zinc-950 border-b border-zinc-800 z-30">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-6 h-6 text-indigo-500" />
          <span className="font-semibold text-base tracking-tight text-white">LegalProof AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-zinc-400 hover:text-white rounded-md bg-zinc-900 border border-zinc-800"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside 
            className="w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800 flex flex-col p-4 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-6 h-6 text-indigo-500" />
                <span className="font-semibold text-base tracking-tight text-white">LegalProof AI</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActiveRoute(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all",
                      active 
                        ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/30" 
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mr-3", active ? "text-indigo-400" : "text-zinc-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex items-center px-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-indigo-400 mr-2.5 border border-zinc-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">{user.name}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">{user.role}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center px-3 py-2 text-xs font-medium rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-zinc-950 flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Shield className="w-6 h-6 text-indigo-500 mr-3" />
          <span className="font-semibold text-lg tracking-tight text-white">LegalProof AI</span>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Workspace
          </div>
          {navItems.map((item) => {
            const active = isActiveRoute(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  active 
                    ? "bg-indigo-600/10 text-indigo-300 font-semibold border border-indigo-500/30" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-3", active ? "text-indigo-400" : "text-zinc-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 mb-2">
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 mr-2.5">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-white truncate">{user.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 lg:px-8 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-400">Polygon Amoy Testnet • Active</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
              SHA-256 Verified Storage
            </span>
          </div>
        </header>

        {/* Page Outlet */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
