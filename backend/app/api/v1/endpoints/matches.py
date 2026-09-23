from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Match
from app.schemas.match import MatchOut, MatchScoreSubmit, MatchConfirm, MatchDispute
from app.services.match_flow import (
    submit_match_score, confirm_match_score, dispute_match, advance_winner_to_next_round
)

router = APIRouter()

@router.post("/{match_id}/submit", response_model=MatchOut)
async def submit_score(match_id: int, payload: MatchScoreSubmit, db: AsyncSession = Depends(get_db)):
    stmt = select(Match).where(Match.id == match_id)
    res = await db.execute(stmt)
    match = res.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    try:
        await submit_match_score(match, payload.score_a, payload.score_b, payload.reporter_id, db)
        return match
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{match_id}/confirm", response_model=MatchOut)
async def confirm_score(match_id: int, payload: MatchConfirm, db: AsyncSession = Depends(get_db)):
    stmt = select(Match).where(Match.id == match_id)
    res = await db.execute(stmt)
    match = res.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    try:
        await confirm_match_score(match, payload.confirmer_id, db)
        return match
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{match_id}/dispute", response_model=MatchOut)
async def report_dispute(match_id: int, payload: MatchDispute, db: AsyncSession = Depends(get_db)):
    stmt = select(Match).where(Match.id == match_id)
    res = await db.execute(stmt)
    match = res.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    await dispute_match(match, payload.disputer_id, db)
    return match

@router.post("/{match_id}/override", response_model=MatchOut)
async def admin_override(
    match_id: int,
    winner_id: str = Body(..., embed=True),
    winner_name: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Match).where(Match.id == match_id)
    res = await db.execute(stmt)
    match = res.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    match.winner_id = winner_id
    match.winner_name = winner_name
    match.status = "completed"
    await db.commit()
    await advance_winner_to_next_round(match, db)
    return match
