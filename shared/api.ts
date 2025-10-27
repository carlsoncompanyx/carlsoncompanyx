// app/api/route.ts   ← one global endpoint
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log("Incoming payload from n8n:", body);

  // TODO: decide how to route or store it.
  // You could inspect body.source to branch logic.
  // Example:
  // if (body.source === "emails") { ... }
  // if (body.source === "etsy") { ... }

  return new Response(
    JSON.stringify({ ok: true, received: body }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "API root alive" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
