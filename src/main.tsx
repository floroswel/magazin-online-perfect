// Prevent flash of unstyled content
document.documentElement.style.backgroundColor = '#ffffff';
document.body && (document.body.style.backgroundColor = '#ffffff');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Reveal body after React has mounted (FOUC prevention)
document.body.style.visibility = "visible";
