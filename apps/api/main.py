import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.routers import health, products, orders, payments, chat, admin, auth, public

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title="Nutra Blue API",
    description="Python FastAPI backend for Nutra Blue E-Commerce",
    version="2.1.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            if response.status_code in (404, 500):
                logger.error(
                    "AUDIT LOG: Request failed with status %s | Method: %s | Path: %s | Client: %s",
                    response.status_code,
                    request.method,
                    request.url.path,
                    request.client.host if request.client else "unknown"
                )
            return response
        except Exception as e:
            logger.error(
                "AUDIT LOG: Exception during request | Method: %s | Path: %s | Error: %s",
                request.method,
                request.url.path,
                str(e),
                exc_info=True
            )
            raise e


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


cors_origins = settings.cors_origin_list
if settings.is_production and not cors_origins:
    logger.warning("CORS_ORIGIN must be set in production. Defaulting to WEBSITE_DOMAIN.")
    cors_origins = [f"https://{settings.website_domain}"]

app.add_middleware(ErrorLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(public.router)



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    detail = str(exc) if not settings.is_production else "An unexpected error occurred"
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": detail},
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=not settings.is_production,
    )
