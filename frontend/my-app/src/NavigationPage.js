import React, { useState, useEffect } from "react";
import { GoogleMap, Autocomplete, DirectionsRenderer } from "@react-google-maps/api";
import { LoadScript } from "@react-google-maps/api";


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
  const [startAddress, setStartAddress] = useState("");  // Store formatted start address
  const [destination, setDestination] = useState("");
  const [directions, setDirections] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [waypoints, setWaypoints] = useState([]);

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

    socket.onmessage = (event) => {
      if (typeof event.data === "string") {
        setWaypoints([{ location: event.data, stopover: true }, ...waypoints])
        console.log(waypoints)
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: currentLocation,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            waypoints: waypoints
          },
          async (result, status) => {
            if (status === "OK") {
              setDirections(result);
            }
          }
        )
      } else {
        playOnEvent(event)
      }
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
    const API_KEY = process.env.REACT_APP_GOOGLE_KEY; // Replace with actual API Key
    console.log(API_KEY)
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
    setupAudioCapture()
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
              lng: currentLocation.lng
            },
            curr: {
              lat: currentLocation.lat,
              lng: currentLocation.lng
            },
            dest: {
              lat: result.routes[0].legs[0].end_location.lat(),
              lng: result.routes[0].legs[0].end_location.lng(),
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
    console.log(data)
    try {
      const response = await fetch("https://172.26.41.122:8000/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      console.log(response)
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
    //THIS IS WHERE YOU ADD THE API KEY  <LoadScript googleMapsApiKey="XXXXXXXXXX" libraries={["places"]}> 
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_KEY} libraries={["places"]}>
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={14} center={currentLocation} options={{ styles: mapStyles, minZoom: 1, maxZoom: 20, }}>
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
