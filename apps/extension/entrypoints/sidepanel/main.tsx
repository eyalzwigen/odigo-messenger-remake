// Entry point for the side panel UI.
// Mounts the React app into the #root element defined in sidepanel.html.

import ReactDOM from "react-dom/client";
import App from "./App";
import "../../style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
