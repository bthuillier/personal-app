package http

import sttp.tapir.*

/**
 * Base endpoint for all API routes, prefixed with /api so the backend can
 * also serve the frontend static files at the root path.
 */
def apiEndpoint: PublicEndpoint[Unit, Unit, Unit, Any] = endpoint.in("api")
