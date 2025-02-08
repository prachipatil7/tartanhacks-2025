import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Autocomplete, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { LoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

const NavigationPage = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startAddress, setStartAddress] = useState("");
  const [destination, setDestination] = useState("");
  const [directions, setDirections] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [mapType, setMapType] = useState("roadmap");
  const [navigationStarted, setNavigationStarted] = useState(false);

  const mapRef = useRef(null);
  const intervalRef = useRef(null);
  const prevLocationRef = useRef(null);

  let socket, recognition;

  // Function to fetch a formatted address from latitude and longitude
  const getFormattedAddress = async (lat, lng) => {
    const API_KEY = "AIzaSyCPa7bi4KGa4T-Xg5cmYI3yVUVe-MO5N-M"; // Replace with actual API Key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") return data.results[0].formatted_address;
      else {
        console.error("Geocoding API error:", data.status);
        return "Unknown Location";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Unknown Location";
    }
  };

  // Function to send navigation details to the backend
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

  // Watch geolocation to update current location and address
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);

          if (!prevLocationRef.current) {
            const formattedAddress = await getFormattedAddress(latitude, longitude);
            setStartAddress(formattedAddress);
          }

          prevLocationRef.current = newLocation;

          if (mapRef.current) {
            mapRef.current.panTo(newLocation);
          }
        },
        () => alert("Could not get location."),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // Handle place selection from Autocomplete
  const handlePlaceSelect = () => {
    if (autocomplete && autocomplete.getPlace()) {
      setDestination(autocomplete.getPlace().formatted_address);
    }
  };

  // Start navigation: fetch directions and send details to backend
  const startNavigation = async () => {
    if (!currentLocation || !destination || !window.google) return;

    let formattedAddress = startAddress;
    if (!formattedAddress) {
      formattedAddress = await getFormattedAddress(currentLocation.lat, currentLocation.lng);
      setStartAddress(formattedAddress);
    }

    setNavigationStarted(true);

    const directionsService = new window.google.maps.DirectionsService();
    const updateRoute = () => {
      directionsService.route(
        {
          origin: currentLocation,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
            const routeLeg = result.routes[0].legs[0];
            setEta(routeLeg.duration.text);
            setDistance(routeLeg.distance.text);

            // Prepare navigation data to send to the backend
            const navigationData = {
              start: {
                lat: currentLocation.lat,
                long: currentLocation.lng,
                address: startAddress,
              },
              dest: {
                address: destination,
                lat: routeLeg.end_location.lat(),
                long: routeLeg.end_location.lng(),
              },
              duration: routeLeg.duration.text,
              distance: routeLeg.distance.text,
            };

            sendToBackend(navigationData);
          } else {
            console.error("Error fetching directions:", status);
          }
        }
      );
    };

    intervalRef.current = setInterval(updateRoute, 3000); // Update route every 3 seconds
  };

  // Cleanup the route update interval when the component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Get the custom pink car icon
  const getPinkCarIcon = useCallback(() => {
    if (
      window.google &&
      window.google.maps &&
      typeof window.google.maps.Size === "function" &&
      typeof window.google.maps.Point === "function"
    ) {
      return {
        url: "/media/pink-car.svg", // Path to your pink car icon
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20),
      };
    }
    return null;
  }, []);

  // Toggle between roadmap and satellite views
  const toggleMapType = () => {
    const newMapType = mapType === "roadmap" ? "satellite" : "roadmap";
    setMapType(newMapType);
    if (mapRef.current) {
      mapRef.current.setOptions({ mapTypeId: newMapType });
    }
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyCPa7bi4KGa4T-Xg5cmYI3yVUVe-MO5N-M" libraries={["places"]}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={currentLocation}
        options={{ mapTypeId: mapType }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {directions && <DirectionsRenderer directions={directions} />}
        {navigationStarted && currentLocation && getPinkCarIcon() && (
          <Marker position={currentLocation} icon={getPinkCarIcon()} />
        )}
      </GoogleMap>

      <div className="controls" style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)" }}>
        <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={handlePlaceSelect}>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Autocomplete>
        <button onClick={startNavigation}>Start Navigation</button>
        <button onClick={toggleMapType}>Toggle Map Type ({mapType})</button>
      </div>

      {/* Display ETA and Distance */}
      {eta && distance && (
  <div className="info" style={{
    position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)",
    background: "white", color: "black", fontWeight: "bold",
    padding: "10px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    fontSize: "16px", textAlign: "center", minWidth: "150px",
    userSelect: "none"  // ✅ Prevents accidental text selection
  }}>
    <p><strong>ETA:</strong> {eta}</p>
    <p><strong>Distance:</strong> {distance}</p>
  </div>
)}

      {/* {eta && distance && (
        <div className="info" style={{
          position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          background: "white", color: "black", fontWeight: "bold",
          padding: "10px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          fontSize: "16px", textAlign: "center", minWidth: "150px"
        }}>
          <p><strong>ETA:</strong> {eta}</p>
          <p><strong>Distance:</strong> {distance}</p>
        </div>
      )} */}
    </LoadScript>
  );
};

export default NavigationPage;
