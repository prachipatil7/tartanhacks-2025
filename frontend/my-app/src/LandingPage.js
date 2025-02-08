import React from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";
import bgvid from './media/bgvid.mp4'
console.log("Google Maps API Key:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Background Video */}
      <video id="background-video"
        className="background-video"
        src={bgvid}
        type="video/mp4"// Replace with your video file path
        autoPlay
        muted
      ></video>

      {/* Main Content */}
      <h1>Passenger Princess</h1>
      <p>Let's drive, bestie!</p>
      <button
        className="start-button"
        onClick={() => {
          navigate("/navigation");
        }}
      >
        Let's Go!
      </button>
    </div>
  );
};

export default LandingPage;