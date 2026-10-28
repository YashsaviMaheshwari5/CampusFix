import { useEffect, useState } from "react";
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
import { authService } from "./services/authService";
import { complaintService } from "./services/complaintService";
import { canManageComplaints } from "./utils/complaintStatus.js";

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem("campusFixSettings") || "{}").darkMode === true; }
    catch { return false; }
  });

  useEffect(() => {
    const controller = new AbortController();
    authService.me(controller.signal)
      .then(({ user: currentUser }) => { setUser(currentUser); setIsLoggedIn(true); })
      .catch((err) => { if (err.name !== "AbortError" && err.status !== 401) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setAuthLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const controller = new AbortController();
    complaintService.list({ limit: 50 }, controller.signal)
      .then(({ complaints: rows }) => setComplaints(rows))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setDataLoading(false); });
    return () => controller.abort();
  }, [isLoggedIn]);

  useEffect(() => {
    const update = () => {
      try { setDarkMode(JSON.parse(localStorage.getItem("campusFixSettings") || "{}").darkMode === true); }
      catch { setDarkMode(false); }
    };
    window.addEventListener("campusFixSettingsChanged", update);
    return () => window.removeEventListener("campusFixSettingsChanged", update);
  }, []);

  const handleLogin = (nextUser) => { setUser(nextUser); setDataLoading(true); setIsLoggedIn(true); setActivePage("dashboard"); setSelectedComplaint(null); setError(""); };
  const handleLogout = async () => {
    try { await authService.logout(); }
    catch (logoutError) { setError(logoutError.message); }
    finally { setUser(null); setIsLoggedIn(false); setComplaints([]); setSelectedComplaint(null); setActivePage("dashboard"); }
  };

  const handleComplaintUpdated = (updatedComplaint) => {
    setComplaints((current) => current.map((item) => item._id === updatedComplaint._id ? updatedComplaint : item));
    setSelectedComplaint(updatedComplaint);
  };

  if (authLoading) return <div className="login-page"><div className="login-card">Connecting to CampusFix…</div></div>;
  if (!isLoggedIn) return <Login onLogin={handleLogin} initialError={error} />;

  const props = { complaints, onSelectComplaint: setSelectedComplaint };
  const pages = {
    dashboard: <Dashboard {...props} user={user} />,
    complaints: <Complaints {...props} loading={dataLoading} />,
    report: <ReportIssue onCreated={(complaint) => setComplaints((old) => [complaint, ...old])} />,
    notifications: <Notifications />,
    knowledge: <KnowledgeBase />,
    feedback: <Feedback />,
    settings: <Settings darkMode={darkMode} onDarkModeChange={setDarkMode} user={user} onUserChange={setUser} />,
  };
  if (canManageComplaints(user?.role)) {
    pages["staff-complaints"] = <Complaints {...props} loading={dataLoading} staffView user={user} />;
  }

  return <div className={darkMode ? "app dark-mode" : "app"}>
    <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} user={user} />
    <main className="main-content">
      {error && <div role="alert" className="login-error">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
      {selectedComplaint
        ? <ComplaintDetails complaint={selectedComplaint} user={user} onUpdated={handleComplaintUpdated} onBack={() => setSelectedComplaint(null)} />
        : (pages[activePage] || pages.dashboard)}
    </main>
  </div>;
}
export default App;
