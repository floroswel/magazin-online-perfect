// Prevent flash of unstyled content (ivory base)
document.documentElement.style.backgroundColor = '#FBF8F2';
document.body && (document.body.style.backgroundColor = '#FBF8F2');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Reveal body after React has mounted (FOUC prevention)
document.body.style.visibility = "visible";
