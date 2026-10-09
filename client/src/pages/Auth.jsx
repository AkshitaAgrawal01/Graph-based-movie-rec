import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logIn, signUp } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = mode === "login"
        ? await logIn(email, password)
        : await signUp(name, email, password);
      setUser(user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <h1 className="page-title">{mode === "login" ? "Sign in" : "Create account"}</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <label className="field">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        className="auth-toggle"
        type="button"
        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}