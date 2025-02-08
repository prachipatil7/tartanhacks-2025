import React from "react";
import "./LandingPage.css";
import glitterGif from "./media/bratz.gif";


function LandingPage({ onStart }) {
  return (
    <div className="landing-container">
      <h1>Passenger Princess</h1>
      <p>Your fun, conversational navigation buddy!</p>
      <button className="start-button" onClick={onStart}>Start Navigation</button>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <LandingPage onStart={() => alert("Navigation Starting!")} />

      {/* GIF Display */}
      <div className="gif-container">
        <img src={glitterGif} alt="Animated GIF" className="side-gif" />
      </div>
    </div>
  );
}

export default App;
