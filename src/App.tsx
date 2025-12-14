import ConnectionStatus from "./features/connection-status/connection-status";
import ObsWebsocket from "./features/obs-websocket/obs-websocket";

function App() {
  return (
    <main className="container">
      <ConnectionStatus />
      <ObsWebsocket />
    </main>
  );
}

export default App;
