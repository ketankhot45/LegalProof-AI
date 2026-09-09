import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Bell, 
  CheckCheck, 
  Briefcase, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  UserCheck, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  X,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async (silent = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (!silent) setLoading(true);
      const res = await fetch('/api/v1/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for real-time updates every 20 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 20000);

    // Refresh on window focus
    const handleFocus = () => fetchNotifications(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setIsOpen(false);
    
    let destination = item.link;
    if (destination && user?.role === 'COMPLAINANT' && destination.startsWith('/cases/')) {
      // Complainants cannot access raw case files directly; redirect to their dossier
      destination = '/complaints';
    }
    
    if (destination) {
      navigate(destination);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVIDENCE_INTEGRITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />;
      case 'ASSIGNMENT_REQUEST_SUBMITTED':
      case 'CASE_AWAITING_ASSIGNMENT':
        return <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'ASSIGNMENT_APPROVED':
      case 'CASE_ASSIGNED':
        return <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'ASSIGNMENT_REJECTED':
      case 'COMPLAINT_REJECTED':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'COMPLAINT_SUBMITTED':
      case 'COMPLAINT_REGISTERED':
      case 'COMPLAINT_UNDER_REVIEW':
        return <FileText className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'BLOCKCHAIN_ANCHOR_CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'AI_ANALYSIS_COMPLETED':
        return <RefreshCw className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400 shrink-0" />;
    }
  };

  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
          isOpen 
            ? "bg-zinc-800 text-white" 
            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
        )}
        aria-label="Open notifications and platform updates"
        title="Notifications & Updates"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          role="dialog"
          aria-label="Notification center"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Notifications & Updates
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="inline-flex min-h-[44px] items-center px-3 rounded text-[11px] font-medium text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/80 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex border-b border-zinc-800/80 bg-zinc-950/40 px-3 py-1.5 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 min-h-[44px] inline-flex items-center justify-center rounded-md text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap",
                filter === 'all' 
                  ? "bg-zinc-800 text-white font-semibold" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={cn(
                "px-3 min-h-[44px] inline-flex items-center justify-center rounded-md text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap",
                filter === 'unread' 
                  ? "bg-zinc-800 text-white font-semibold" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-800/50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-xs text-zinc-500 font-mono">FETCHING NOTIFICATIONS...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-500">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  {filter === 'unread' ? 'No unread updates' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
                  Real-time events for complaints, cases, evidence, and assignments will appear here.
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "p-3.5 transition-all text-left flex items-start space-x-3 cursor-pointer group hover:bg-zinc-800/60",
                    !item.isRead ? "bg-indigo-950/20" : "bg-transparent opacity-85 hover:opacity-100"
                  )}
                >
                  <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={cn(
                        "text-xs truncate font-medium",
                        !item.isRead ? "text-white font-semibold" : "text-zinc-300"
                      )}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between">
                      {item.link ? (
                        <span className="inline-flex items-center text-[10px] font-medium text-indigo-400 group-hover:text-indigo-300">
                          View details <ExternalLink className="w-2.5 h-2.5 ml-1" />
                        </span>
                      ) : <span />}

                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => markAsRead(item.id, e)}
                          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 min-h-[36px] min-w-[64px] px-2 rounded hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-sm shadow-indigo-500/50"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 text-center">
            <span className="text-[10px] text-zinc-500 font-mono">
              Live updates • Secure event channel
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
