import { useEffect, useState } from 'react';
import { Menu, Bell, X, CheckCircle } from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notifications';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const Header = ({ onMenuClick, title }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();

      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((item: any) => !item.read).length);
        return;
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-base/95 backdrop-blur supports-[backdrop-filter]:bg-bg-base/60">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <button
          onClick={onMenuClick}
          className="rounded-input p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary lg:hidden"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>

        <div className="relative ml-auto flex items-center gap-2">
          <button
            onClick={() => setOpen((value) => !value)}
            className="relative rounded-input p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-[320px] overflow-hidden rounded-2xl border border-border bg-bg-surface shadow-xl sm:w-[380px]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="font-medium text-text-primary">Notifications</p>
                  <p className="text-xs text-text-muted">{unreadCount} unread alerts</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleReadAll} className="text-xs text-accent hover:underline">
                    Mark all read
                  </button>

                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <CheckCircle size={36} className="mx-auto mb-3 text-text-muted" />
                    <p className="text-sm text-text-secondary">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleRead(item.id)}
                      className={`w-full rounded-xl p-3 text-left transition hover:bg-bg-elevated ${
                        item.read ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.title}</p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {item.body || item.message}
                          </p>
                          <p className="mt-2 text-[11px] text-text-muted">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                          </p>
                        </div>

                        {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-accent" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;