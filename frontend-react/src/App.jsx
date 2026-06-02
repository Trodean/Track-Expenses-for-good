import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigationbar from "./components/Navigationbar";
import AuthModal from "./components/AuthModal";
import { getCurrentUser } from "./services/api";

import DashboardPage from "./pages/Dashboard";
import ExpensesPage from "./pages/Expenses";
import ProfilePage from "./pages/Profile";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkStoredLogin() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        localStorage.removeItem("current_user");
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser(token);

        const userInfo = {
          username: userData.username,
          email: userData.email,
          role: userData.role,
        };

        localStorage.setItem("current_user", JSON.stringify(userInfo));
        setCurrentUser(userInfo);
      } catch (error) {
        console.error("Stored login is invalid:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("current_user");
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkStoredLogin();
  }, []);

  function handleOpenLogin() {
    setAuthModalMode("login");
  }

  function handleOpenRegister() {
    setAuthModalMode("register");
  }

  function handleCloseModal() {
    setAuthModalMode(null);
  }

  function handleAuthSuccess(userData) {
    setCurrentUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    setCurrentUser(null);
    window.history.pushState({}, "", "/");
  }

  if (authLoading) {
    return (
      <main className="container landing-container">
        <section className="landing-card">
          <h1>Track your Expense for good!</h1>
          <p>Checking login status...</p>
        </section>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <main className={currentUser ? "container" : "container landing-container"}>
        {!currentUser ? (
          <section className="landing-card">
            <h1>Track your Expense for good!</h1>
            <p>Manage your daily expenses in one place.</p>

            <div className="landing-actions">
              <button
                type="button"
                className="account-btn"
                onClick={handleOpenLogin}
              >
                Login
              </button>

              <button type="button" onClick={handleOpenRegister}>
                Register
              </button>
            </div>
          </section>
        ) : (
          <>
            <Navigationbar
              currentUser={currentUser}
              onOpenLogin={handleOpenLogin}
              onOpenRegister={handleOpenRegister}
              onLogout={handleLogout}
            />

            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route
                path="/expenses"
                element={<ExpensesPage currentUser={currentUser} />}
              />
              <Route
                path="/profile"
                element={<ProfilePage currentUser={currentUser} />}
              />
            </Routes>
          </>
        )}

        {authModalMode && (
          <AuthModal
            mode={authModalMode}
            onClose={handleCloseModal}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </main>
    </BrowserRouter>
  );
}

export default App;