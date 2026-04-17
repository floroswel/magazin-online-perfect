// Prevent flash of unstyled content (white base)
document.documentElement.style.backgroundColor = '#FFFFFF';
document.body && (document.body.style.backgroundColor = '#FFFFFF');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Reveal body after React has mounted (FOUC prevention)
document.body.style.visibility = "visible";
