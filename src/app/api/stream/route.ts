import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");

  if (!runId) {
    return new Response("runId is required", { status: 400 });
  }

  const url = `https://api.genx-dev.insightgen.ai/agent-runner/api/v1/stream/sse/${runId}`;

  try {
    console.log("Connecting to stream:", url);

    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = authHeader.substring(7);
    const xtenantId = request.headers.get("x-tenant-id") || "e6e0a6cc-c509-45d4-b5a7-b92c619cb343";

    // Create an AbortController for the upstream fetch
    const abortController = new AbortController();

    const upstream = await fetch(url, {
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${accessToken}`,
        "x-tenant-id": xtenantId,
      },
      signal: abortController.signal,
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(`Failed to connect: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let buffer = "";
    let closedByUpstream = false; // Track if closed by <CLOSED> message
    let clientDisconnected = false; // Track if client disconnected

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (!closedByUpstream && !clientDisconnected) {
            const { done, value } = await reader.read();

            if (done) {
              console.log("Upstream stream finished (EOF):", runId);
              if (!closedByUpstream && !clientDisconnected) {
                controller.close();
              }
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
              if (closedByUpstream || clientDisconnected) break;

              // Forward the event to the client
              controller.enqueue(encoder.encode(event + "\n\n"));

              // Check for <CLOSED> status
              if (event.startsWith("data:")) {
                const json = event.replace("data:", "").trim();

                try {
                  const parsed = JSON.parse(json);

                  if (parsed.status === "<CLOSED>") {
                    console.log("Received <CLOSED> from upstream:", runId);
                    closedByUpstream = true;
                    controller.close();
                    
                    // Cancel the upstream reader since we're done
                    await reader.cancel();
                    abortController.abort();
                    return;
                  }
                } catch {
                  // Ignore JSON parsing errors for non-JSON events
                }
              }
            }
          }
        } catch (err) {
          // Only treat as error if not intentionally closed
          if (!closedByUpstream && !clientDisconnected) {
            console.error("Stream error:", err);
            controller.error(err);
          }
        }
      },

      cancel() {
        // Client disconnected - log but DON'T close the stream
        // Just mark that client disconnected and continue reading from upstream
        console.log("Client disconnected (but continuing upstream):", runId);
        clientDisconnected = true;
        
        // Don't cancel the reader or abort - let upstream continue
        // We just stop sending data to the client
      },
    });

    // Handle client disconnect via the request signal
    request.signal.addEventListener("abort", () => {
      console.log("Request aborted (client disconnected):", runId);
      clientDisconnected = true;
      
      // Don't abort the upstream fetch - let it continue
      // This way the upstream connection stays alive until <CLOSED>
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Stream route error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}