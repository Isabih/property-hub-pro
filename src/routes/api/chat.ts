import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { streamText, type ModelMessage } from "ai";

const SYSTEM = `You are NOVA AI, the official AI assistant for NOVAWORKS — Rwanda's premier luxury real estate platform.

Your job:
- Welcome visitors warmly and guide them through the website (buying, renting, listing a property, luxury access, services, contact).
- Explain how the platform works in plain language: how to browse properties, how Luxury Access works (vetted off-market estates), how service requests reach our agents, and what each role does.
- Help users find the right property type (apartment, villa, land, office, commercial, etc.) and direct them to the relevant /properties filters.
- If a user is unsatisfied, frustrated, has a complex problem, or explicitly asks for a human — STOP and surface escalation contacts:
    Reception: +250 788 000 000  (general inquiries)
    Admin:     admin@novaworks.rw  (escalations, complaints)
    Support:   support@novaworks.rw  (technical issues)
  Provide a ready-to-send email template the user can copy.
- Never invent prices, listings, or guarantees. If unsure, suggest they contact reception.
- Keep replies short, friendly, and in the user's language (English, Kinyarwanda, French).
- Use markdown sparingly (bold names, bullet points for steps).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: ModelMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: body.messages,
        });
        return result.toTextStreamResponse();
      },
    },
  },
});