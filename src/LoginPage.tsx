import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@oregonstate\.edu$/i.test(value.trim());
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return false;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid Oregon State email.");
      return false;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    setError("");
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("login submit started");

  if (!validateForm()) {
    console.log("login validateForm failed");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    console.log("login response status", response.status);

    const data = await response.json();
    console.log("login response data", data);

    if (!response.ok || !data.ok) {
      setError(data.error || "Invalid email or password.");
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", data.user?.role || "normal_user");
    localStorage.setItem("userEmail", data.user?.email || email.trim().toLowerCase());
    localStorage.setItem("user", JSON.stringify(data.user || {}));

    console.log("login localStorage set", {
      isLoggedIn: localStorage.getItem("isLoggedIn"),
      role: localStorage.getItem("role"),
      userEmail: localStorage.getItem("userEmail"),
    });

    console.log("navigating to /landing");
    navigate("/landing", {replace: true});
  } catch (error) {
    console.error("login fetch error", error);
    setError("Could not connect to the server.");
  } finally {
    setLoading(false);
    console.log("login finished");
  }
};


  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>Oregon State University · AI Grant Matching</div>

          <h1 style={styles.title}>
            <span style={styles.darkText}>Grant</span>
            <span style={styles.greenText}>Matcher</span>
          </h1>

          <p style={styles.subtitle}>
            AI-powered grant discovery tailored to your research profile and team expertise.
          </p>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <div style={styles.field}>
            <label style={styles.label}>
              Email<span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="email@oregonstate.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Password<span style={styles.required}>*</span>
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/signup")}
            disabled={loading}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    padding: "32px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  error: {
    color: "#dc2626",
    marginBottom: "12px",
    fontSize: "14px",
  },
  required: {
    color: "red",
    marginLeft: "2px",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    margin: "0 0 10px 0",
  },
  darkText: {
    color: "#111827",
  },
  greenText: {
    color: "#16a34a",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "15px",
    marginBottom: "20px",
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "10px",
    transition: "background-color 0.2s ease",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #16a34a",
    backgroundColor: "#ffffff",
    color: "#16a34a",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "12px",
  },
};