import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Catalog from "./pages/Catalog.jsx";
import MovieDetail from "./pages/MovieDetail.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import Auth from "./pages/Auth.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/login" element={<Auth />} />
        </Routes>
      </main>
    </>
  );
}