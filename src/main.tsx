// Prevent flash of unstyled content (Atelier cream base)
document.documentElement.style.backgroundColor = '#F8F5EF';
document.body && (document.body.style.backgroundColor = '#F8F5EF');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Reveal body after React has mounted (FOUC prevention)
document.body.style.visibility = "visible";
