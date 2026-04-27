import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

// Maps each notification type to a display icon, colour class, and label
const TYPE_META = {
    idea_draft:     { icon: '📝', color: 'text-slate-500',   label: 'Draft Saved' },
    idea_submitted: { icon: '📤', color: 'text-amber-600',   label: 'Submitted' },
    idea_approved:  { icon: '✅', color: 'text-emerald-600', label: 'Approved' },
    idea_declined:  { icon: '❌', color: 'text-red-500',     label: 'Declined' },
    idea_rework:    { icon: '🔄', color: 'text-orange-500',  label: 'Rework Needed' },
};

function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell({ notifications = [], unreadCount = 0, markRead, markAllRead, onNavigate }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on outside click or Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKey);
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('mousedown', handleClick);
        };
    }, []);

    const handleNotifClick = (notif) => {
        if (!notif.is_read) markRead(notif.id);
        setIsOpen(false);
        onNavigate(`/details/${notif.project_id}`);
    };

    const handleMarkAllRead = () => {
        markAllRead();
    };

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                data-testid="notif-bell"
                onClick={() => setIsOpen(o => !o)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${displayCount} unread` : ''}`}
                className="relative p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span
                        data-testid="notif-badge"
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-[3px]
                                   bg-[#F05A28] text-white text-[9px] font-black
                                   rounded-full flex items-center justify-center
                                   animate-pulse leading-none"
                    >
                        {displayCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    data-testid="notif-dropdown"
                    className="absolute right-0 top-full mt-2 w-80
                               bg-white rounded-2xl shadow-2xl border border-slate-100
                               z-[200] overflow-hidden"
                    style={{ animation: 'fadeIn 0.15s ease-out' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Bell size={13} className="text-slate-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#F05A28]/10 text-[#F05A28] rounded-md">
                                    {displayCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold text-[#F05A28] hover:underline transition-opacity"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <Bell size={24} className="text-slate-200 mb-2" />
                                <p className="text-slate-400 text-xs font-semibold">No notifications yet</p>
                                <p className="text-slate-300 text-[10px] mt-0.5">Actions on your ideas will appear here</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(notif => {
                                const meta = TYPE_META[notif.type] || { icon: '🔔', color: 'text-slate-400', label: 'Update' };
                                const isUnread = !notif.is_read;
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={`w-full text-left px-4 py-3 flex gap-3 items-start
                                                    hover:bg-slate-50 transition-colors group
                                                    ${isUnread ? 'bg-orange-50/40' : 'bg-white'}`}
                                    >
                                        <span className="text-base leading-none mt-0.5 shrink-0" role="img" aria-label={meta.label}>
                                            {meta.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-slate-800 leading-snug line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className={`text-[10px] font-bold mt-1 ${meta.color}`}>
                                                {meta.label} · {timeAgo(notif.created_at)}
                                            </p>
                                        </div>
                                        {isUnread && (
                                            <span
                                                data-testid="notif-unread-dot"
                                                className="w-2 h-2 rounded-full bg-[#F05A28] mt-1.5 shrink-0"
                                            />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer — only shown when there are more than 10 */}
                    {notifications.length > 10 && (
                        <div className="px-4 py-2 border-t border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 font-semibold">
                                Showing 10 of {notifications.length} notifications
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
