import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env first
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Load root .env.local if present (e.g. from Vercel CLI)
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
