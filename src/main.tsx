// Prevent flash of unstyled content (LUMEN//X base)
document.documentElement.style.backgroundColor = '#FAF8FB';
document.body && (document.body.style.backgroundColor = '#FAF8FB');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Reveal body after React has mounted (FOUC prevention)
document.body.style.visibility = "visible";
