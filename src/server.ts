import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Interview Royale Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});