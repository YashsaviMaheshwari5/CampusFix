import universityLogo from "../assets/university-logo.png";
import { getSidebarMenuItems } from "../utils/navigation.js";

function Sidebar({
  activePage,
  setActivePage,
  onLogout,
  user
}) {

  // ==========================================
  // SIDEBAR MENU ITEMS
  // ==========================================

  const menuItems = getSidebarMenuItems(user?.role);


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
              Student Portal
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

        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            color: "#5b3fd3",
            background: "#f0edff",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none",
            marginTop: "12px",
            border: "1px dashed #d8b4fe"
          }}
        >
          <span>🛠️</span>
          Staff Portal (5174) ↗
        </a>
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
