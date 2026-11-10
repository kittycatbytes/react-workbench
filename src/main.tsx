import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles.css";

// StrictMode stays off at the root so effect lessons mount once.
// The effects lesson opts into StrictMode for one scenario.
createRoot(document.getElementById("root")!).render(<App />);
