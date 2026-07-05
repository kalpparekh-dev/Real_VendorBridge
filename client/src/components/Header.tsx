import { useEffect, useState } from "react";
import { Menu, Bell, X, CheckCircle } from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../api/notifications";

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
      console.error("Failed to load notifications:", error);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0C0F14]/80 backdrop-blur-2xl">
      <div className="flex h-20 items-center gap-4 px-4 lg:px-6">
        <button
          onClick={onMenuClick}
          className="rounded-2xl p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-xs text-gray-400">Enterprise Procurement Platform</p>
        </div>

        <div className="relative ml-auto flex items-center gap-2">
          <button
            onClick={() => setOpen((value) => !value)}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-gray-300 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/10 hover:text-white"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-14 w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#111318]/95 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,.6)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="font-medium text-white">Notifications</p>
                  <p className="text-xs text-gray-400">{unreadCount} unread alerts</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleReadAll} className="text-xs text-amber-300 hover:underline">
                    Mark all read
                  </button>

                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <CheckCircle size={36} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-sm text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleRead(item.id)}
                      className={`w-full rounded-2xl border border-transparent p-4 text-left transition-all duration-300 hover:border-white/10 hover:bg-white/5 ${
                        item.read ? "opacity-60" : "opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {item.body || item.message}
                          </p>
                          <p className="mt-2 text-[11px] text-gray-500">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                          </p>
                        </div>

                        {!item.read && (
                          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,.8)]" />
                        )}
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