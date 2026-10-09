import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { logOut } from "../api/auth.js";
import "./Navbar.css";

export default function Navbar() {
  const { user, setUser } = useAuth();

  return (
    <nav className="nav">
      <Link to="/" className="wordmark">GraphRec</Link>
      <NavLink to="/" end>Movies</NavLink>
      {user && <NavLink to="/profile">{user.name}</NavLink>}
      {user ? (
        <button className="signin" onClick={() => { logOut(); setUser(null); }}>Sign out</button>
      ) : (
        <NavLink to="/login" className="signin">Sign in</NavLink>
      )}
    </nav>
  );
}