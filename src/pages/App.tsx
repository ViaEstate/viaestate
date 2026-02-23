// This file previously defined a second App component which caused routing conflicts.
// Re-export the canonical App from src/App.tsx to avoid duplicate routers.
export { default } from "../App";