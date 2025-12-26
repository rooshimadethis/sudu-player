import React from 'react';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Sudu Player
      </h1>
      <p className="text-neutral-400 text-center max-w-sm">
        Open this on your iPhone to verify the connection.
      </p>
      <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl">
        <p className="font-mono text-sm text-green-400">System Ready</p>
      </div>
    </div>
  );
}

export default App;
