// Import dependencies
const express = require("express");

const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const OPENAI_API_KEY = "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";
// Create an Express app
const { AssemblyAI } = require("assemblyai");

const client = new AssemblyAI({
  apiKey: "f4a4c2f3b1774e53b4c1be45917af949",
});

const fs = require("fs");
const path = require("path");
const { log } = require("console");

// Save the base64 audio data to a file

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json());
app.use(morgan("tiny"));
// Allow preflight requests for /api/convert
app.options("/api/convert", cors());
// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// simple route
app.get("/", (req, res) => {
  res.status(200).json("welcome to the api");
});

app.post(
  "/api/convert",
  express.raw({ type: "audio/wav" }),
  async (req, res) => {
    try {
      // Convert the Buffer to a base64-encoded string
      const base64AudioData = req.body.toString("base64");
      // console.log("base64: ", base64AudioData);
      const audioFilePath = path.join(__dirname, "uploads", "audio.wav");
      console.log("path: ", audioFilePath);
      // Check if the file exists
      if (fs.existsSync(audioFilePath)) {
        // If it exists, remove the file
        fs.unlinkSync(audioFilePath);
      }

      // Now, you can use the same variable to write the new file
      fs.writeFileSync(audioFilePath, Buffer.from(base64AudioData, "base64"));
      console.log("body", req.body);
      const FILE_URL =
        "https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3";

      const config = {
        audio_url: "http://localhost:8080/uploads/audio.wav",
        speaker_labels: true,
      };
      // console.log("config: ", config);
      const transcript = await client.transcripts.create(config);

      // console.log("text:", transcript);
      //  for (let utterance of transcript.utterances) {
      //     console.log(`Speaker ${utterance.speaker}: ${utterance.text}`)
      res.json({ message: "success", transcript: transcript });
    } catch (error) {
      console.log("error: ", error);
      res.json({ message: "something went wrong:", error: error });
    }
  }
);
// Middleware to handle 404 errors (Not Found)
app.use(function (req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handling middleware for development environment
if (app.get("env") === "development") {
  app.use((err, req, res, next) => {
    // Set the HTTP status code based on the error status or default to 500 (Internal Server Error)
    res.status(err.status || 500);

    // Send a JSON response with error details in the development environment
    res.send({ message: err.message, error: err });
  });
}

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
