import React, { useState, useEffect } from "react";
import { GoogleMap, Autocomplete, DirectionsRenderer } from "@react-google-maps/api";
import { LoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

const NavigationPage = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startAddress, setStartAddress] = useState("");  // Store formatted start address
  const [destination, setDestination] = useState("");
  const [directions, setDirections] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLocation({ lat, lng });

        // Fetch the formatted address and update state
        const formattedAddress = await getFormattedAddress(lat, lng);
        setStartAddress(formattedAddress);
      },
      () => alert("Could not get location.")
    );
  }, []);

  // Function to get formatted address from lat, lng
  const getFormattedAddress = async (lat, lng) => {
    const API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with actual API Key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.results[0].formatted_address;
      } else {
        console.error("Geocoding API error:", data.status);
        return "Unknown Location";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Unknown Location";
    }
  };

  const handlePlaceSelect = () => {
    if (autocomplete && autocomplete.getPlace()) {
      setDestination(autocomplete.getPlace().formatted_address);
    }
  };

  const startNavigation = async () => {
    if (!currentLocation || !destination || !window.google) return;

    // Ensure we have the formatted address before proceeding
    let formattedAddress = startAddress;
    if (!formattedAddress) {
      formattedAddress = await getFormattedAddress(currentLocation.lat, currentLocation.lng);
      setStartAddress(formattedAddress); // Save to state
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      async (result, status) => {
        if (status === "OK") {
          setDirections(result);

          // Extract navigation details with the correct address and modify to match schema
          const navigationData = {
            start: {
              lat: currentLocation.lat,
              long: currentLocation.lng
            },
            dest: {
              lat: result.routes[0].legs[0].end_location.lat(),
              long: result.routes[0].legs[0].end_location.lng(),
              address: destination,
              name: destination, // You can change this to something else if you want
            },
            duration: result.routes[0].legs[0].duration.text,
            distance: result.routes[0].legs[0].distance.text
          };

          // Send data to backend API instead of saving a file
          sendToBackend(navigationData);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };

  // Function to send navigation data to the backend API
  const sendToBackend = async (data) => {
    try {
      const response = await fetch("http://localhost:8000/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send data to backend");
      }

      const result = await response.json();
      console.log("Backend Response:", result);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  return (
    //THIS IS WHERE YOU ADD THE API KEY  <LoadScript googleMapsApiKey="XXXXXXXXXX" librarie 
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
