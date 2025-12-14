import ConnectionStatus from "./features/connection-status/connection-status";
import ObsWebsocketConfiguration from "./features/obs-websocket-configuration/obs-websocket-configuration";

function App() {
  return (
    <main className="container">
      <ConnectionStatus />
      <ObsWebsocketConfiguration />
    </main>
  );
}

export default App;
