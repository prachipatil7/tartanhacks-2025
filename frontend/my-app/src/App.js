import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage"; // Keep this import
import NavigationPage from "./NavigationPage";
import "./LandingPage.css";
import "./NavigationPage.css";
import glitterGif from "./media/bratz.gif";

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
        </Routes>
      </Router>

      {/* GIF Display */}
      <div className="app">
        <div className="gif-container">
          <img src={glitterGif} alt="Animated GIF" className="side-gif" />
        </div>
      </div>
    </>
  );
}

export default App;
