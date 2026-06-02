import { useState } from "react";
import { loginUser, registerUser } from "../services/api";

function AuthModal({ mode, onClose, onAuthSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.username || !formData.password) {
      setMessage("Please enter username and password.");
      return;
    }

    if (!isLogin && !formData.email) {
      setMessage("Please enter email.");
      return;
    }

    try {
      if (isLogin) {
        const loginData = await loginUser(formData.username, formData.password);

        localStorage.setItem("access_token", loginData.access_token);
        localStorage.setItem(
          "current_user",
          JSON.stringify({
            username: loginData.username,
            email: loginData.email,
            role: loginData.role,
          })
        );

        onAuthSuccess({
          username: loginData.username,
          email: loginData.email,
          role: loginData.role,
        });

        onClose();
      } else {
        await registerUser({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        setMessage("Account created successfully. You can now log in.");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      setMessage(error.message || "Authentication failed.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="auth-modal">
        <div className="modal-header">
          <h2>{isLogin ? "Login" : "Register"}</h2>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="chart-note">
          {isLogin
            ? "Log in to manage your personal expenses."
            : "Create an account to start tracking your expenses."}
        </p>

        {message && (
          <div
            className={
              message.includes("successfully")
                ? "app-message success"
                : "app-message error"
            }
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
            />
          </div>

          <button type="submit">
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;