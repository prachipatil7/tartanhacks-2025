import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Autocomplete, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { LoadScript } from "@react-google-maps/api";

// Define the custom style object at the top of your file
const mapStyles = [
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0c2d64"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#eae6e7"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0c2d64"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#eaeaea"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "on"
      },
      {
        "color": "#e0dede"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#d6caca"
      },
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0c2d64"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [
      {
        "color": "#f6c6dc"
      }
    ]
  },
  {
    "featureType": "poi.attraction",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.government",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.medical",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.place_of_worship",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "poi.school",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#f6c6dc"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#f6c6dc"
      },
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0c2d64"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0c2d64"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.icon",
    "stylers": [
      {
        "hue": "#ff0000"
      },
      {
        "saturation": "-100"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#613659"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#0c2d64"
      }
    ]
  }
]

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
  const [stops, setStops] = useState([]);


  const mapRef = useRef(null);
  const intervalRef = useRef(null);
  const prevLocationRef = useRef(null);


  let socket;
  let navsocket;
  let recognition;

  const playOnEvent = (event) => {
    const audioData = event.data;

    // Convert the raw data into a Blob, specifying the correct MIME type
    const audioBlob = new Blob([audioData], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create a new Audio object and play the sound
    const audio = new Audio(audioUrl);
    audio.play()
      .then(() => {
        console.log("Playing received audio...");
      }).then(() => {
        socket.send("done")
      })
      .catch((error) => {
        console.error("Error playing audio:", error);
      });
  }

  useEffect(() => {
    setupNavSocket();

    const sendCoordinatesToServer = (latt, long) => {
      const data = { lat: latt, lng: long }
      if (navsocket.readyState === WebSocket.OPEN) {
        console.log("sending location", latt, long)
        navsocket.send(JSON.stringify(data));
      } else {
        console.log("socket unready state", navsocket.readyState)
      }
    }

    // Set up an interval to run every 2 seconds
    setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendCoordinatesToServer(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 1000);
    // return () => clearInterval(intervalId);
  }, [navsocket]);


  function setupNavSocket() {
    navsocket = new WebSocket("https://172.26.41.122:8000/navigation");

    navsocket.onopen = () => {
      console.log("NavSocket connection established");
    };

    navsocket.onmessage = (event) => playOnEvent(event);

  }

  function setupAudioCapture() {
    socket = new WebSocket("https://172.26.41.122:8000/ws");

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => playOnEvent(event);

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


  // Function to fetch a formatted address from latitude and longitude
  const getFormattedAddress = async (lat, lng) => {
    const API_KEY = process.env.REACT_APP_GOOGLE_KEY; // Replace with actual API Key
    console.log(API_KEY)
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
      const response = await fetch("https://172.26.41.122:8000/destination", {
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

  //   const addStop = () => {
  //     setStops([...stops, ""]);
  //   };

  //     // Updates the value of a specific stop based on user input
  //    const handleStopChange = (e, index) => {
  //     const newStops = [...stops];
  //     newStops[index] = e.target.value;
  //     setStops(newStops);
  //     };

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
                name: destination,
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

  // Get the custom car icon
  const getCarIcon = useCallback(() => {
    if (
      window.google &&
      window.google.maps &&
      typeof window.google.maps.Size === "function" &&
      typeof window.google.maps.Point === "function"
    ) {
      return {
        url: "/media/car-steering-wheel-svgrepo-com.svg",
        //url: "/media/car.svg", // Path to your pink car icon
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
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_KEY} libraries={["places"]}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        // options={{
        //     styles: mapStyles,  // Apply custom styles here
        //   }}
        center={currentLocation}
        options={{ mapTypeId: mapType, styles: mapStyles, minZoom: 1, maxZoom: 20, }}
        onLoad={(map) => {
          mapRef.current = map;
        }}

      >
        {directions && <DirectionsRenderer directions={directions} />}
        {navigationStarted && currentLocation && getCarIcon() && (
          <Marker position={currentLocation} icon={{
            // Instead of an image, use a CSS animated div
            url: "/media/car-steering-wheel-svgrepo-com.svg",
            //url: "/media/car.svg", // Path to your pink car icon
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
          }}
          />
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

