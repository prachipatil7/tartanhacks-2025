import React from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

console.log("Google Maps API Key:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <h1>Passenger Princess</h1>
      <p>Your fun, conversational navigation buddy!</p>
      <button className="start-button" onClick={() => navigate("/navigation")}>
        Let's Go!
      </button>
    </div>
  );
};

export default LandingPage;
