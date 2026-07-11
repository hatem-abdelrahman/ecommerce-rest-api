import app from "./app.js";

// Define server listening port
const PORT = process.env.PORT || 5000;

// Start the Express HTTP server
app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
