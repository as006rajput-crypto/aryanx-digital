
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.admin.email);

      onLogin();
    } catch (error) {
      console.error("Admin login error:", error);
      alert("Unable to connect to server. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          AX
        </div>

        <h1>Admin Login</h1>

        <p>
          Welcome to AryanX Digital Admin Panel
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login to Dashboard"}
          </button>
        </form>

        <span className="admin-login-note">
          🔐 Secure Admin Access
        </span>
      </div>
    </div>
  );
}

export default AdminLogin;

