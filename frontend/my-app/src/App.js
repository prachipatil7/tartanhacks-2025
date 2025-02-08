import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import NavigationPage from "./NavigationPage";
import "./LandingPage.css";
<<<<<<< HEAD
import "./NavigationPage.css";
=======
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
>>>>>>> b60c0dd21ff161a135fe3e0eea44d7f584ce04b2

function App() {
  let socket
  let recognition


  function setupAudioCapture() {
    socket = new WebSocket('http://127.0.0.1:8000/ws');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const response = event.data;
      console.log("Recieved:", response)
    };

    function sendTranscriptToServer(transcript) {
      socket.send(transcript);
    }


    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true; // Keeps listening
    recognition.interimResults = false; // Provides real-time results

    recognition.onresult = (event) => {
      let transcript = event.results[event.results.length - 1][0].transcript;
      console.log("User said:", transcript);
      sendTranscriptToServer(transcript)
    };

    recognition.start(); // Start listening

    // Handle errors
    recognition.onerror = (event) => {
      console.error("Error occurred:", event.error);
    };
  }

  function start() {
    alert("Navigation Starting!")
    setupAudioCapture()
  }

  return (
<<<<<<< HEAD
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/navigation" element={<NavigationPage />} />
      </Routes>
    </Router>
  );
=======
    <div className="app">
      <LandingPage onStart={() => start()} />

      {/* GIF Display */}
      <div className="gif-container">
        <img src={glitterGif} alt="Animated GIF" className="side-gif" />
      </div>
    </div>
  )
>>>>>>> b60c0dd21ff161a135fe3e0eea44d7f584ce04b2
}

export default App;
