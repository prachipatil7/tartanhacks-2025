import React, { useState } from "react";
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 40.4433, // Default location (Pittsburgh, CMU)
  lng: -79.9436,
};

const MapComponent = () => {
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const fetchDirections = async () => {
    const response = await fetch(`https://passenger-princess-backend.your-cloudflare.workers.dev/get-directions?start=${start}&end=${end}`);
    const data = await response.json();
    setDirectionsResponse(data.directions);
  };

  return (
    <div>
      <h2>Passenger Princess Navigation</h2>
      <input type="text" placeholder="Enter start" value={start} onChange={(e) => setStart(e.target.value)} />
      <input type="text" placeholder="Enter destination" value={end} onChange={(e) => setEnd(e.target.value)} />
      <button onClick={fetchDirections}>Get Directions</button>
       
      <LoadScript googleMapsApiKey="AIzaSyCPa7bi4KGa4T-Xg5cmYI3yVUVe-MO5N-M">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
        </GoogleMap>
      </LoadScript>

      <div className="gif-container">
    <img src="frontend/my-app/public/media/Glitter Jade Sticker by BRATZ.gif" alt="Animated GIF" className="side-gif" />
    </div>
    </div>
    

  );
};

export default MapComponent;
