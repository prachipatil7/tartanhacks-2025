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
    <div className="app">
      <LandingPage onStart={() => start()} />

      {/* GIF Display */}
      <div className="gif-container">
        <img src={glitterGif} alt="Animated GIF" className="side-gif" />
      </div>
    </div>
  )
}

export default App;
