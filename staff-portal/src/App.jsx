import { useEffect, useState, useCallback } from "react";
import "./App.css";
import StaffSidebar from "./components/StaffSidebar.jsx";
import StatusUpdateModal from "./components/StatusUpdateModal.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import StaffComplaintDetails from "./pages/StaffComplaintDetails.jsx";
import { authService } from "./services/authService.js";
import { complaintService, updateStatusAndRefresh } from "./services/complaintService.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalComplaint, setModalComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [toastMessage, setToastMessage] = useState("");

  // Check auth session
  useEffect(() => {
    const controller = new AbortController();
    authService.me(controller.signal)
      .then(({ user: currentUser }) => {
        if (currentUser.role === "staff" || currentUser.role === "admin") {
          setUser(currentUser);
          setIsLoggedIn(true);
        } else {
          setError(`You are signed in as a ${currentUser.role}. Please log in with a Staff account.`);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError" && err.status !== 401) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAuthLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Fetch complaints and stats from MongoDB
  const fetchAllData = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        complaintService.list({ limit: 100 }),
        complaintService.stats(),
      ]);

      if (listRes.status === "fulfilled" && listRes.value?.complaints) {
        setComplaints(listRes.value.complaints);
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        const s = statsRes.value;
        setStats({
          total: s.total || 0,
          pending: (s.submitted || 0) + (s.acknowledged || 0),
          inProgress: s.inProgress || 0,
          resolved: s.resolved || 0,
          rejected: s.rejected || 0,
        });
      }
      setLastRefreshed(new Date());
    } catch {
      // Ignore background errors
    } finally {
      if (!isBackground) setRefreshing(false);
    }
  }, []);

  // Sync data whenever logged in, plus auto-polling every 10s
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    fetchAllData(false);

    const interval = setInterval(() => {
      fetchAllData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn, fetchAllData]);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleLogin = (signedInUser) => {
    setUser(signedInUser);
    setIsLoggedIn(true);
    setError("");
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setComplaints([]);
      setSelectedComplaint(null);
      setModalComplaint(null);
    }
  };

  const handleStatusUpdate = async (complaintId, nextStatus, note) => {
    const result = await updateStatusAndRefresh(complaintId, { status: nextStatus, note });
    const updated = result.complaint;

    // Update in list
    setComplaints((current) =>
      current.map((item) => (item._id === updated._id ? updated : item))
    );

    // Update selected if open
    if (selectedComplaint?._id === updated._id) {
      setSelectedComplaint(updated);
    }

    setToastMessage(`✓ Complaint status updated to ${updated.status}. Saved in MongoDB!`);

    // Refresh metrics
    fetchAllData(true);
  };

  if (authLoading) {
    return (
      <div className="staff-loading-screen">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Connecting to CampusFix Operations…</h2>
          <p>Connecting to backend API on port 4000</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <StaffLogin onLogin={handleLogin} initialError={error} />;
  }

  return (
    <div className="staff-portal-app">
      {/* Toast */}
      {toastMessage && <div className="portal-toast">{toastMessage}</div>}

      {/* Sidebar */}
      <StaffSidebar
        activeFilter={statusFilter}
        setActiveFilter={(flt) => {
          setStatusFilter(flt);
          setSelectedComplaint(null);
        }}
        onLogout={handleLogout}
        user={user}
        totalCount={stats.total}
        pendingCount={stats.pending}
      />

      {/* Main View Area */}
      <main className="staff-main-area">
        {selectedComplaint ? (
          <StaffComplaintDetails
            complaint={selectedComplaint}
            onBack={() => setSelectedComplaint(null)}
            onUpdateStatus={handleStatusUpdate}
          />
        ) : (
          <StaffDashboard
            complaints={complaints}
            stats={stats}
            onSelectComplaint={setSelectedComplaint}
            onOpenUpdateModal={setModalComplaint}
            onRefresh={() => fetchAllData(false)}
            refreshing={refreshing}
            lastRefreshed={lastRefreshed}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}
      </main>

      {/* Quick Status Modal */}
      {modalComplaint && (
        <StatusUpdateModal
          complaint={modalComplaint}
          onClose={() => setModalComplaint(null)}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
}

