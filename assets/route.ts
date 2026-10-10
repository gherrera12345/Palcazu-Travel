import { env } from "cloudflare:workers";
import { handleAssistant } from "../../../lib/assistant.mjs";

export const dynamic = "force-dynamic";
export async function POST(request: Request) { return handleAssistant(request, env); }
