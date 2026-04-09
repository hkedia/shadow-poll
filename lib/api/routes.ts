/**
 * Combined API routes for Shadow Poll.
 *
 * Mounts all Hono sub-routers under a single apiRoutes router.
 * CORS middleware is applied globally to all /api/* routes.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { metadataRoutes } from "./metadata-handler";
import { pollsRoutes } from "./polls-handler";
import { indexerRoutes } from "./indexer-handler";
import { healthRoutes } from "./health-handler";

export const apiRoutes = new Hono();

apiRoutes.use("/api/*", cors());

apiRoutes.route("/", healthRoutes);
apiRoutes.route("/", metadataRoutes);
apiRoutes.route("/", pollsRoutes);
apiRoutes.route("/", indexerRoutes);