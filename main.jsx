import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import LikesProvider from "./context/LikesProvider.jsx";
import WatchedProvider from "./context/WatchedProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LikesProvider>
      <WatchedProvider>
        <App />
      </WatchedProvider>
    </LikesProvider>
  </StrictMode>
);
