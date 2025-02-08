import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import NavigationPage from "./NavigationPage";
import "./LandingPage.css";
import "./NavigationPage.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/navigation" element={<NavigationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
