function ProfilePage({ currentUser }) {
  if (!currentUser) {
    return (
      <section className="form-section">
        <h2>Account</h2>
        <div className="app-message warning">
          Please log in to view your account information.
        </div>
      </section>
    );
  }

  return (
    <section className="form-section">
      <h2>Account Centre</h2>
      <p className="chart-note">
        This page displays the currently logged-in user's account information.
      </p>

      <div className="account-info-card">
        <div className="account-info-row">
          <span>Username</span>
          <strong>{currentUser.username}</strong>
        </div>

        <div className="account-info-row">
          <span>Email</span>
          <strong>{currentUser.email}</strong>
        </div>

        <div className="account-info-row">
          <span>Role</span>
          <strong>{currentUser.role}</strong>
        </div>

        <div className="account-info-row">
          <span>Status</span>
          <strong>Logged in</strong>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;