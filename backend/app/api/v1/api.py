from fastapi import APIRouter
from app.api.v1.endpoints import tournaments, matches, demo

api_router = APIRouter()

api_router.include_router(tournaments.router, prefix="/tournaments", tags=["tournaments"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(demo.router, prefix="/demo", tags=["demo"])
