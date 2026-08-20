import universityLogo from "../assets/university-logo.png";

function Sidebar({
  activePage,
  setActivePage,
  onLogout,
  user
}) {

  // ==========================================
  // SIDEBAR MENU ITEMS
  // ==========================================

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "🏠"
    },
    {
      id: "complaints",
      label: "Complaints",
      icon: "📋"
    },
    {
      id: "report",
      label: "Report Issue",
      icon: "📝"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔"
    },
    {
      id: "knowledge",
      label: "Knowledge Base",
      icon: "📚"
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: "💬"
    }
  ];


  // ==========================================
  // SIDEBAR UI
  // ==========================================

  return (

    <aside className="sidebar">

      {/* =====================================
          CAMPUSFIX BRAND
          ===================================== */}

      <div className="sidebar-logo">

        <div className="sidebar-brand">

          {/* UNIVERSITY LOGO */}

          <img
            src={universityLogo}
            alt="University Logo"
            className="university-logo"
          />


          {/* CAMPUSFIX NAME */}

          <div>

            <h2>
              CampusFix
            </h2>

            <p>
              Campus Issue Management
            </p>

          </div>

        </div>

      </div>


      {/* =====================================
          MAIN NAVIGATION
          ===================================== */}

      <nav className="sidebar-nav">

        {menuItems.map((item) => (

          <button
            key={item.id}
            className={
              activePage === item.id
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(item.id)
            }
          >

            <span>
              {item.icon}
            </span>

            {item.label}

          </button>

        ))}

      </nav>


      {/* =====================================
          BOTTOM NAVIGATION
          ===================================== */}

      <div className="sidebar-bottom">

        {/* SETTINGS */}

        <button
          className={
            activePage === "settings"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePage("settings")
          }
        >

          <span>
            ⚙️
          </span>

          Settings

        </button>


        {/* LOGOUT */}

        <button
          onClick={onLogout}
        >

          <span>
            🚪
          </span>

          Logout

        </button>

      </div>


      {/* =====================================
          LOGGED-IN USER
          ===================================== */}

      <div className="sidebar-user">

        {/* USER AVATAR */}

        <div className="sidebar-avatar">

          {user?.name
            ? user.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "U"}

        </div>


        {/* USER INFORMATION */}

        <div>

          <strong>
            {user?.name || "Student"}
          </strong>

          <span>
            {user?.email || "student@example.com"}
          </span>

        </div>

      </div>

    </aside>

  );
}

export default Sidebar;