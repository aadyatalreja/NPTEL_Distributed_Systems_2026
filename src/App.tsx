import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import WeekPage from "./pages/WeekPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/week/:weekNum" element={<WeekPage />} />
      </Routes>
    </BrowserRouter>
  );
}
