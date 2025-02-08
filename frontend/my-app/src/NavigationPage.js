import React, { useState, useEffect } from "react";
import { GoogleMap, Autocomplete, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
//import env from "react-dotenv";
import { LoadScript } from "@react-google-maps/api";



const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};


const NavigationPage = () => {
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState("");
  const [directions, setDirections] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => alert("Could not get location.")
    );
  }, []);

  const handlePlaceSelect = () => {
    if (autocomplete && autocomplete.getPlace()) {
      setDestination(autocomplete.getPlace().formatted_address);
    }
  };

  const startNavigation = () => {
    if (!currentLocation || !destination || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };

  return (
    //THIS IS WHERE YOU ADD THE API KEY 
    <LoadScript googleMapsApiKey="{process.env.REACT_APP_GOOGLE_MAPS_API_KEY}" libraries={["places"]}> 
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={14} center={currentLocation}>
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      <div className="controls">
        <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={handlePlaceSelect}>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Autocomplete>
        <button onClick={startNavigation}>Start Navigation</button>
      </div>
    </LoadScript>
  );
};

export default NavigationPage;
