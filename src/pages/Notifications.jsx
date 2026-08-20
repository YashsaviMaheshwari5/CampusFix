import { useState } from "react";

function Notifications() {

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Complaint Submitted",
      message: "Your AC complaint has been successfully submitted.",
      time: "10 minutes ago",
      type: "success",
      read: false
    },
    {
      id: 2,
      title: "Complaint In Progress",
      message: "Your Wi-Fi complaint is now being handled by the maintenance team.",
      time: "1 hour ago",
      type: "progress",
      read: false
    },
    {
      id: 3,
      title: "Complaint Resolved",
      message: "Your washroom complaint has been successfully resolved.",
      time: "Yesterday",
      type: "resolved",
      read: true
    }
  ]);


  // Mark one notification as read
  const markAsRead = (id) => {

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );

  };


  // Mark all notifications as read
  const markAllAsRead = () => {

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        read: true
      }))
    );

  };


  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;


  return (
    <div className="notifications-page">

      {/* Header */}
      <div className="page-header">

        <div>
          <h1>Notifications 🔔</h1>

          <p>
            Stay updated about your campus complaints.
          </p>
        </div>

        <div className="notification-count">
          {unreadCount} unread
        </div>

      </div>


      {/* Mark all button */}
      {unreadCount > 0 && (

        <button
          className="mark-all-btn"
          onClick={markAllAsRead}
        >
          Mark all as read
        </button>

      )}


      {/* Notification List */}
      <div className="notification-list">

        {notifications.length === 0 ? (

          <div className="empty-notifications">
            <h2>No notifications 🎉</h2>

            <p>
              You're all caught up!
            </p>
          </div>

        ) : (

          notifications.map((notification) => (

            <div
              key={notification.id}
              className={
                notification.read
                  ? "notification-card read"
                  : "notification-card unread"
              }
            >

              {/* Icon */}
              <div className="notification-icon">

                {notification.type === "success"
                  ? "📩"
                  : notification.type === "progress"
                  ? "🔧"
                  : "✅"}

              </div>


              {/* Content */}
              <div className="notification-content">

                <h3>
                  {notification.title}
                </h3>

                <p>
                  {notification.message}
                </p>

                <small>
                  {notification.time}
                </small>

              </div>


              {/* Read Button */}
              {!notification.read && (

                <button
                  className="read-btn"
                  onClick={() =>
                    markAsRead(notification.id)
                  }
                >
                  Mark as read
                </button>

              )}

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Notifications;