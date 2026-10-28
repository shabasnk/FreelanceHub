import "dotenv/config";


import app from "./app.js";
import connectDB from "./src/config/database.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start the server
    app.listen(PORT, () => {
      console.log(`FreelanceHub server running on port ${PORT}`);
      console.log(
        `Health check: http://localhost:${PORT}/api/v1/health`
      );
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

startServer();