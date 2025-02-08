import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage"; // Keep this import
import NavigationPage from "./NavigationPage";
import "./LandingPage.css";
import "./NavigationPage.css";
import glitterGif from "./media/bratz.gif";

function App() {
  let socket;
  let recognition;

  function setupAudioCapture() {
    socket = new WebSocket("http://127.0.0.1:8000/ws");

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const audioData = event.data;

      // Convert the raw data into a Blob, specifying the correct MIME type
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
  
      // Create a new Audio object and play the sound
      const audio = new Audio(audioUrl);
      audio.play()
        .then(() => {
          console.log("Playing received audio...");
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    };

    function sendTranscriptToServer(transcript) {
      socket.send(transcript);
    }

    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.continuous = true; // Keeps listening
    recognition.interimResults = false; // Provides real-time results

    recognition.onresult = (event) => {
      let transcript = event.results[event.results.length - 1][0].transcript;
      console.log("User said:", transcript);
      sendTranscriptToServer(transcript);
    };

    recognition.start(); // Start listening

    // Handle errors
    recognition.onerror = (event) => {
      console.error("Error occurred:", event.error);
    };
  }



  function start() {
    alert("Navigation Starting!");
    setupAudioCapture();
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage onStart={start} />} />
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
