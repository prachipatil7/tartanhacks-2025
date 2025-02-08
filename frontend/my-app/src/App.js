import { useState } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/users/1');
      console.log(response)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setUser(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setUser(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={fetchUser}>Get User 1</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {user && (
          <div>
            <h2>User Details</h2>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
