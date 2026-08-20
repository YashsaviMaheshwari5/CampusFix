import { useState, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import ReportIssue from "./pages/ReportIssue";
import ComplaintDetails from "./pages/ComplaintDetails";
import Notifications from "./pages/Notifications";
import KnowledgeBase from "./pages/KnowledgeBase";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";


function App() {

  // ==========================================
  // CHECK LOGIN STATUS
  // ==========================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("campusFixLoggedIn") === "true"
  );


  // ==========================================
  // USER
  // ==========================================

  const savedUser =
    localStorage.getItem("campusFixUser");

  const [user, setUser] = useState(
    savedUser
      ? JSON.parse(savedUser)
      : null
  );


  // ==========================================
  // COMPLAINTS
  // ==========================================

  const savedComplaints =
    localStorage.getItem("campusFixComplaints");

  const initialComplaints = savedComplaints
    ? JSON.parse(savedComplaints)
    : [
        {
          title: "AC not working in Room 204",
          location: "Hostel Block A",
          category: "Maintenance",
          description:
            "The AC is not working properly.",
          status: "In Progress",
          priority: "High"
        },

        {
          title: "Wi-Fi not working in Library",
          location: "Central Library",
          category: "Internet",
          description:
            "Wi-Fi connection is very slow.",
          status: "In Progress",
          priority: "Medium"
        },

        {
          title: "Washroom faucet leaking",
          location: "Hostel Block B",
          category: "Water Supply",
          description:
            "The faucet is continuously leaking.",
          status: "Resolved",
          priority: "Low"
        }
      ];


  const [complaints, setComplaints] =
    useState(initialComplaints);


  // ==========================================
  // ACTIVE PAGE
  // ==========================================

  const [activePage, setActivePage] =
    useState("dashboard");


  // ==========================================
  // SELECTED COMPLAINT
  // ==========================================

  const [selectedComplaint, setSelectedComplaint] =
    useState(null);


  // ==========================================
  // DARK MODE
  // ==========================================

  const getDarkMode = () => {

    const saved =
      localStorage.getItem("campusFixSettings");

    if (!saved) {
      return false;
    }

    try {

      const settings =
        JSON.parse(saved);

      return settings.darkMode === true;

    } catch {

      return false;

    }
  };


  const [darkMode, setDarkMode] =
    useState(getDarkMode());


  // ==========================================
  // SAVE COMPLAINTS
  // ==========================================

  useEffect(() => {

    localStorage.setItem(
      "campusFixComplaints",
      JSON.stringify(complaints)
    );

  }, [complaints]);


  // ==========================================
  // DARK MODE LISTENER
  // ==========================================

  useEffect(() => {

    const updateDarkMode = () => {

      setDarkMode(getDarkMode());

    };


    window.addEventListener(
      "campusFixSettingsChanged",
      updateDarkMode
    );


    return () => {

      window.removeEventListener(
        "campusFixSettingsChanged",
        updateDarkMode
      );

    };

  }, []);


  // ==========================================
  // LOGIN FUNCTION
  // ==========================================

  const handleLogin = (loggedInUser) => {

    setUser(loggedInUser);

    setIsLoggedIn(true);

    setActivePage("dashboard");

  };


  // ==========================================
  // LOGOUT FUNCTION
  // ==========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "campusFixLoggedIn"
    );

    localStorage.removeItem(
      "campusFixUser"
    );

    setUser(null);

    setIsLoggedIn(false);

  };


  // ==========================================
  // SHOW LOGIN
  // ==========================================

  if (!isLoggedIn) {

    return (
      <Login
        onLogin={handleLogin}
      />
    );

  }


  // ==========================================
  // PAGE RENDER
  // ==========================================

  const renderPage = () => {

    // DASHBOARD

    if (activePage === "dashboard") {

      return (
        <Dashboard
          complaints={complaints}
          onSelectComplaint={
            setSelectedComplaint
          }
        />
      );

    }


    // COMPLAINTS

    if (activePage === "complaints") {

      return (
        <Complaints
          complaints={complaints}
          onSelectComplaint={
            setSelectedComplaint
          }
        />
      );

    }


    // REPORT ISSUE

    if (activePage === "report") {

      return (
        <ReportIssue
          setComplaints={setComplaints}
        />
      );

    }


    // NOTIFICATIONS

    if (activePage === "notifications") {

      return <Notifications />;

    }


    // KNOWLEDGE BASE

    if (activePage === "knowledge") {

      return <KnowledgeBase />;

    }


    // FEEDBACK

    if (activePage === "feedback") {

      return <Feedback />;

    }


    // SETTINGS

    if (activePage === "settings") {

      return <Settings />;

    }


    // DEFAULT

    return (
      <Dashboard
        complaints={complaints}
        onSelectComplaint={
          setSelectedComplaint
        }
      />
    );

  };


  // ==========================================
  // MAIN APP
  // ==========================================

  return (

    <div
      className={
        darkMode
          ? "app dark-mode"
          : "app"
      }
    >

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        user={user}
      />


      <main className="main-content">

        {selectedComplaint ? (

          <ComplaintDetails
            complaint={selectedComplaint}
            onBack={() =>
              setSelectedComplaint(null)
            }
          />

        ) : (

          renderPage()

        )}

      </main>

    </div>

  );

}

export default App;