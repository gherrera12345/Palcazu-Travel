import { env } from "cloudflare:workers";
import { assistantStatus } from "../../../../lib/assistant.mjs";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { return assistantStatus(request, env); }
