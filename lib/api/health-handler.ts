import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/api/health", async (c) => {
  try {
    const { sql } = await import("@/lib/db/client");
    await sql`SELECT 1`;
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      503,
    );
  }
});