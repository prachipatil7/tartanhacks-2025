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
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);


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

  useEffect(() => {

    if(navigator.geolocation){
        navigator.geolocation.watchPosition(
            async(position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCurrentLocation({lat, lng});
                const formattedAddress = await getFormattedAddress(lat, lng);
                setStartAddress(formattedAddress);
            },
            () => alert("Could not get location."),
            {enableHighAccuracy: true, maximumAge: 0, timeout: 5000}
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }

  }, []);

//   useEffect(() => {
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lng = position.coords.longitude;
        

//         setCurrentLocation({ lat, lng });

//         // Fetch the formatted address and update state
//         const formattedAddress = await getFormattedAddress(lat, lng);
//         setStartAddress(formattedAddress);
//       },
//       () => alert("Could not get location.")
//     );
//   }, []);

  // Function to get formatted address from lat, lng
  const getFormattedAddress = async (lat, lng) => {
    const API_KEY = "AIzaSyCPa7bi4KGa4T-Xg5cmYI3yVUVe-MO5N-M"; // Replace with actual API Key
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
    setupAudioCapture();
    if (!currentLocation || !destination || !window.google) return;

    let formattedAddress = startAddress;
    if(!formattedAddress){
        formattedAddress = await getFormattedAddress(currentLocation.lat, currentLocation.lng);
        setStartAddress(formattedAddress);
    }
    const directionsService = new window.google.maps.DirectionsService();
    const DirectionsRenderer = new window.google.maps.DirectionsRenderer();

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
                } else {
                    console.error("Error fetching directions:", status);
                }   
            }
        );
    };
    const intervalId = setInterval(() => {
        updateRoute();
    }, 1000);// Update every 10 seconds

    return () => clearInterval(intervalId);
  };








//   const startNavigation = async () => {
//     setupAudioCapture()
//     if (!currentLocation || !destination || !window.google) return;

//     // Ensure we have the formatted address before proceeding
//     let formattedAddress = startAddress;
//     if (!formattedAddress) {
//       formattedAddress = await getFormattedAddress(currentLocation.lat, currentLocation.lng);
//       setStartAddress(formattedAddress); // Save to state
    // }

    // const directionsService = new window.google.maps.DirectionsService();
    // directionsService.route(
    //   {
    //     origin: currentLocation,
    //     destination: destination,
    //     travelMode: window.google.maps.TravelMode.DRIVING,
    //   },
    //   async (result, status) => {
    //     if (status === "OK") {
    //       setDirections(result);

    //     // Extract the ETA and distance from the result
    //     const routeLeg = result.routes[0].legs[0]; // Assuming you're interested in the first leg
    //     const etaText = routeLeg.duration.text; // ETA (e.g., "15 min")
    //     const distanceText = routeLeg.distance.text; // Distance (e.g., "3.5 km")

    //     // Update state for ETA and distance
    //     setEta(etaText);
    //     setDistance(distanceText);


    //       // Extract navigation details with the correct address and modify to match schema
    //       const navigationData = {
    //         start: {
    //           lat: currentLocation.lat,
    //           lng: currentLocation.lng
    //         },
    //         dest: {
    //           lat: result.routes[0].legs[0].end_location.lat(),
    //           lng: result.routes[0].legs[0].end_location.lng(),
    //           address: destination,
    //           name: destination, // You can change this to something else if you want
    //         },
    //         duration: result.routes[0].legs[0].duration.text,
    //         distance: result.routes[0].legs[0].distance.text
    //       };

    //       // Send data to backend API instead of saving a file
    //       sendToBackend(navigationData);
    //     } else {
    //       console.error("Error fetching directions:", status);
    //     }

    //   }
    // );
//   };

  // Function to send navigation data to the backend API
  const sendToBackend = async (data) => {
    console.log(data)
    try {
      const response = await fetch("http://localhost:8000/destination", {
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
    <LoadScript googleMapsApiKey="AIzaSyCPa7bi4KGa4T-Xg5cmYI3yVUVe-MO5N-M" libraries={["places"]}>
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
      
    {/* Display ETA and Distance below the map */}
    {eta && distance && (
  <div className="info">
    <p><strong>ETA:</strong> {eta}</p>
    <p><strong>Distance:</strong> {distance}</p>
  </div>
    )}
  </LoadScript>
)};


export default NavigationPage;




// import React, { useState, useEffect } from "react";
// import { GoogleMap, Autocomplete, DirectionsRenderer } from "@react-google-maps/api";
// import { LoadScript } from "@react-google-maps/api";

// const mapContainerStyle = {
//   width: "100vw",
//   height: "100vh",
// };

// const NavigationPage = () => {
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [startAddress, setStartAddress] = useState("");  // Store formatted start address
//   const [destination, setDestination] = useState("");
//   const [directions, setDirections] = useState(null);
//   const [autocomplete, setAutocomplete] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);

//   let socket;
//   let recognition;

//   // Setup audio capture for voice commands (WebSocket + SpeechRecognition)
//   function setupAudioCapture() {
//     socket = new WebSocket("http://127.0.0.1:8000/ws");

//     socket.onopen = () => {
//       console.log("WebSocket connection established");
//     };

//     socket.onmessage = (event) => {
//       const audioData = event.data;

//       // Convert the raw data into a Blob, specifying the correct MIME type
//       const audioBlob = new Blob([audioData], { type: "audio/wav" });
//       const audioUrl = URL.createObjectURL(audioBlob);

//       // Create a new Audio object and play the sound
//       const audio = new Audio(audioUrl);
//       audio.play()
//         .then(() => {
//           console.log("Playing received audio...");
//         })
//         .catch((error) => {
//           console.error("Error playing audio:", error);
//         });
//     };

//     function sendTranscriptToServer(transcript) {
//       socket.send(transcript);
//     }

//     recognition = new (window.SpeechRecognition ||
//       window.webkitSpeechRecognition)();
//     recognition.continuous = true; // Keeps listening
//     recognition.interimResults = false; // Provides real-time results

//     recognition.onresult = (event) => {
//       let transcript = event.results[event.results.length - 1][0].transcript;
//       console.log("User said:", transcript);
//       sendTranscriptToServer(transcript);
//     };

//     recognition.start(); // Start listening

//     // Handle errors
//     recognition.onerror = (event) => {
//       console.error("Error occurred:", event.error);
//     };
//   }

//   useEffect(() => {
//     // Simulate the current location for testing
//     let simulatedLat = 40.748817; // Starting point (Empire State Building)
//     let simulatedLng = -73.985428;

//     // Interval for every second to update location
//     const simulateMovement = () => {
//       const totalDuration = 180; // 3 minutes (total movement time)
//       const stepDuration = 1000; // 1 second per step
//       const totalSteps = totalDuration;

//       const latIncrement = (40.7580 - 40.748817) / totalSteps;  // Increment per step for latitude
//       const lngIncrement = (-73.9855 - -73.985428) / totalSteps; // Increment per step for longitude

//       const interval = setInterval(() => {
//         simulatedLat += latIncrement;
//         simulatedLng += lngIncrement;

//         setCurrentLocation({ lat: simulatedLat, lng: simulatedLng });  // Update the current location

//         // Fetch and update the address from geolocation
//         getFormattedAddress(simulatedLat, simulatedLng).then((address) => {
//           setStartAddress(address);
//         });

//         // Recalculate the route based on new position
//         updateRoute(simulatedLat, simulatedLng);
//       }, stepDuration);

//       setTimeout(() => clearInterval(interval), totalDuration * 1000); // Stop after 3 minutes
//     };

//     simulateMovement();
//   }, []); // Empty dependency to run this once on mount

//   // Function to get the formatted address for a given lat, lng
//   const getFormattedAddress = async (lat, lng) => {
//     const API_KEY = "YOUR_GOOGLE_API_KEY";  // Replace with your actual API Key
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

//     try {
//       const response = await fetch(url);
//       const data = await response.json();

//       if (data.status === "OK") {
//         return data.results[0].formatted_address;
//       } else {
//         console.error("Geocoding API error:", data.status);
//         return "Unknown Location";
//       }
//     } catch (error) {
//       console.error("Error fetching address:", error);
//       return "Unknown Location";
//     }
//   };

//   const handlePlaceSelect = () => {
//     if (autocomplete && autocomplete.getPlace()) {
//       setDestination(autocomplete.getPlace().formatted_address);
//     }
//   };

//   const updateRoute = (lat, lng) => {
//     if (!destination || !window.google) return;

//     const directionsService = new window.google.maps.DirectionsService();
//     const directionsRenderer = new window.google.maps.DirectionsRenderer();

//     directionsService.route(
//       {
//         origin: { lat, lng },  // Current simulated location
//         destination: destination,
//         travelMode: window.google.maps.TravelMode.DRIVING,
//       },
//       (result, status) => {
//         if (status === "OK") {
//           setDirections(result); // Update the route on the map

//           const routeLeg = result.routes[0].legs[0];
//           setEta(routeLeg.duration.text); // Update ETA
//           setDistance(routeLeg.distance.text); // Update Distance
//         } else {
//           console.error("Error fetching directions:", status);
//         }
//       }
//     );
//   };

//   const startNavigation = async() => {
//     setupAudioCapture();
//     if (!currentLocation || !destination || !window.google) return;

//     let formattedAddress = startAddress;
//     if (!formattedAddress) {
//       formattedAddress = await getFormattedAddress(currentLocation.lat, currentLocation.lng);
//       setStartAddress(formattedAddress); // Save to state
//     }

//     // Start simulating the movement and update route as per current location
//     updateRoute(currentLocation.lat, currentLocation.lng);
//   };

//   return (
//     <LoadScript googleMapsApiKey="AIzaSyCPa7bi4KGa4T-Xg5cmYI3yVUVe-MO5N-M" libraries={["places"]}>
//       <GoogleMap mapContainerStyle={mapContainerStyle} zoom={14} center={currentLocation}>
//         {directions && <DirectionsRenderer directions={directions} />}
//       </GoogleMap>

//       <div className="controls">
//         <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={handlePlaceSelect}>
//           <input
//             type="text"
//             placeholder="Enter destination"
//             value={destination}
//             onChange={(e) => setDestination(e.target.value)}
//           />
//         </Autocomplete>
//         <button onClick={startNavigation}>Start Navigation</button>
//       </div>

//       {/* Display ETA and Distance below the map */}
//       {eta && distance && (
//         <div className="info">
//           <p><strong>ETA:</strong> {eta}</p>
//           <p><strong>Distance:</strong> {distance}</p>
//         </div>
//       )}
//     </LoadScript>
//   );
// };

// export default NavigationPage;
