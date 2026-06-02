import { Link } from "react-router-dom";

function Navigationbar({ currentUser, onOpenLogin, onOpenRegister, onLogout }) {
  return (
    <header className="page-header">
      <h1>Track your Expense for good!</h1>
      <p>Manage your daily expenses in one place.</p>

      <nav className="top-nav">
        <div className="nav-group main-nav">
          <Link className="nav-btn" to="/">
            Dashboard
          </Link>

          <Link className="nav-btn" to="/expenses">
            Expenses
          </Link>
        </div>

        <div className="nav-group account-nav">
          {currentUser ? (
            <>
              <Link className="nav-btn account-btn" to="/profile">
                Account
              </Link>

              <button type="button" className="nav-btn logout-btn" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" className="nav-btn account-btn" onClick={onOpenLogin}>
                Login
              </button>

              <button type="button" className="nav-btn" onClick={onOpenRegister}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navigationbar;