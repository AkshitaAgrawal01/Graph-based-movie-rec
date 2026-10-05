import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="nav">
      <Link to="/" className="wordmark">GraphRec</Link>
      <NavLink to="/" end>Movies</NavLink>
      <NavLink to="/recommendations">For you</NavLink>
      <NavLink to="/login" className="signin">Sign in</NavLink>
    </nav>
  );
}