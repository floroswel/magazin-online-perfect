// Prevent flash of unstyled content
document.documentElement.style.backgroundColor = '#0A0A0F';
document.body && (document.body.style.backgroundColor = '#0A0A0F');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Reveal body after React has mounted (FOUC prevention)
document.body.style.visibility = "visible";
