import express from "express";
import cardanoRouter from "./routes/cardano.js";
import healthRouter from "./routes/health.js";

const app = express();
app.use(express.json());

app.use("/health", healthRouter);
app.use("/cardano", cardanoRouter);

const port = Number(process.env.API_PORT || 3001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
