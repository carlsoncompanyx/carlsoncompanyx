import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleEmailAction, handleGetEmails, handlePostEmails } from "./routes/emails";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/emails", handleGetEmails);
  app.post("/api/emails", handlePostEmails);
  app.post("/api/emails/:emailId/actions", handleEmailAction);

  // Legacy compatibility for previous `/api/n8n-webhook` route
  app.get("/api/n8n-webhook", handleGetEmails);
  app.post("/api/n8n-webhook", handlePostEmails);
  app.post("/api/n8n-webhook/:emailId/actions", handleEmailAction);

  return app;
}
