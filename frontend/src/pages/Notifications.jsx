import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/notifications", { signal: controller.signal })
      .then((data) => setNotifications(data.notifications))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const markAsRead = async (id) => {
    try { const { notification } = await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }); setNotifications((previous) => previous.map((item) => item._id === id ? notification : item)); }
    catch (err) { setError(err.message); }
  };
  const markAllAsRead = async () => {
    setMarkingAll(true); setError("");
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      const readAt = new Date().toISOString();
      setNotifications((previous) => previous.map((item) => ({ ...item, readAt: item.readAt || readAt })));
    } catch (err) { setError(err.message); }
    finally { setMarkingAll(false); }
  };
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  return <div className="notifications-page"><div className="page-header"><div><h1>Notifications 🔔</h1><p>Stay updated about your campus complaints.</p></div><div className="notification-count">{unreadCount} unread</div></div>
    {error && <div role="alert" className="login-error">{error}</div>}{loading && <p role="status">Loading notifications…</p>}
    {!loading && unreadCount > 0 && <button className="mark-all-btn" disabled={markingAll} onClick={markAllAsRead}>{markingAll ? 'Saving…' : 'Mark all as read'}</button>}
    <div className="notification-list">{!loading && notifications.length === 0 ? <div className="empty-notifications"><h2>No notifications 🎉</h2><p>You’re all caught up!</p></div> : notifications.map((item) => <div key={item._id} className={`notification-card ${item.readAt ? "read" : "unread"}`}><div className="notification-icon">🔔</div><div className="notification-content"><h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div>{!item.readAt && <button className="read-btn" onClick={() => markAsRead(item._id)}>Mark as read</button>}</div>)}</div>
  </div>;
}
export default Notifications;
