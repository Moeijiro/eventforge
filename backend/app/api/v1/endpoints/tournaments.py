from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from app.db.session import get_db
from app.db.models import Tournament, Participant, Match, TournamentAuditLog
from app.schemas.tournament import (
    TournamentCreate, TournamentOut, ParticipantCreate, ParticipantOut
)
from app.schemas.match import MatchOut
from app.services.bracket import generate_single_elimination_matches, generate_round_robin_pairings

router = APIRouter()

@router.get("/{guild_id}", response_model=List[TournamentOut])
async def list_tournaments(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Tournament).where(Tournament.guild_id == guild_id).order_by(Tournament.created_at.desc())
    res = await db.execute(stmt)
    tournaments = res.scalars().all()
    
    out = []
    for t in tournaments:
        stmt_p = select(Participant).where(Participant.tournament_id == t.id)
        res_p = await db.execute(stmt_p)
        count = len(res_p.scalars().all())
        t_out = TournamentOut.model_validate(t)
        t_out.participants_count = count
        out.append(t_out)
    return out

@router.post("/{guild_id}", response_model=TournamentOut, status_code=status.HTTP_201_CREATED)
async def create_tournament(guild_id: str, payload: TournamentCreate, db: AsyncSession = Depends(get_db)):
    t = Tournament(
        guild_id=guild_id,
        title=payload.title,
        description=payload.description,
        format=payload.format,
        max_participants=payload.max_participants,
        start_time=payload.start_time,
        status="registration_open"
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return TournamentOut.model_validate(t)

@router.get("/{guild_id}/{tournament_id}")
async def get_tournament_detail(guild_id: str, tournament_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Tournament).where(and_(Tournament.guild_id == guild_id, Tournament.id == tournament_id))
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found.")

    stmt_p = select(Participant).where(Participant.tournament_id == t.id).order_by(Participant.seed.asc())
    res_p = await db.execute(stmt_p)
    participants = res_p.scalars().all()

    return {
        "tournament": TournamentOut.model_validate(t),
        "participants": [ParticipantOut.model_validate(p) for p in participants]
    }

@router.post("/{guild_id}/{tournament_id}/join", response_model=ParticipantOut)
async def join_tournament(
    guild_id: str,
    tournament_id: int,
    payload: ParticipantCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tournament).where(and_(Tournament.guild_id == guild_id, Tournament.id == tournament_id))
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found.")

    if t.status not in ("registration_open", "check_in_open"):
        raise HTTPException(status_code=409, detail="Registration for this tournament is closed.")

    # Check capacity
    stmt_p = select(Participant).where(Participant.tournament_id == t.id)
    res_p = await db.execute(stmt_p)
    current_count = len(res_p.scalars().all())
    if current_count >= t.max_participants:
        raise HTTPException(status_code=400, detail="Tournament is at maximum capacity.")

    # Check already registered
    stmt_dup = select(Participant).where(
        and_(Participant.tournament_id == t.id, Participant.user_id == payload.user_id)
    )
    res_dup = await db.execute(stmt_dup)
    if res_dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already registered for this tournament.")

    participant = Participant(
        tournament_id=t.id,
        user_id=payload.user_id,
        username=payload.username,
        avatar_url=payload.avatar_url,
        seed=current_count + 1,
        is_checked_in=True
    )
    db.add(participant)
    db.add(TournamentAuditLog(
        tournament_id=t.id,
        guild_id=guild_id,
        actor_id=payload.user_id,
        action="registration",
        details=f"Registered participant '{payload.username}'"
    ))
    await db.commit()
    await db.refresh(participant)
    return participant

@router.post("/{guild_id}/{tournament_id}/generate-bracket")
async def generate_bracket(guild_id: str, tournament_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Tournament).where(and_(Tournament.guild_id == guild_id, Tournament.id == tournament_id))
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found.")

    stmt_p = select(Participant).where(Participant.tournament_id == t.id).order_by(Participant.seed.asc())
    res_p = await db.execute(stmt_p)
    participants = res_p.scalars().all()

    if len(participants) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 participants to generate a bracket.")
    existing = await db.execute(select(Match.id).where(Match.tournament_id == t.id).limit(1))
    if existing.first() is not None:
        raise HTTPException(status_code=409, detail="The bracket has already been generated.")

    if t.format == "round_robin":
        matches = generate_round_robin_pairings(t.id, participants)
    else:
        matches = generate_single_elimination_matches(t.id, participants)

    for m in matches:
        db.add(m)

    t.status = "in_progress"
    db.add(TournamentAuditLog(
        tournament_id=t.id,
        guild_id=guild_id,
        actor_id="system",
        action="bracket_generation",
        details=f"Generated {t.format} bracket with {len(matches)} total matches."
    ))
    await db.commit()
    return {"message": "Bracket generated successfully", "total_matches": len(matches)}

@router.get("/{guild_id}/{tournament_id}/matches", response_model=List[MatchOut])
async def get_tournament_matches(guild_id: str, tournament_id: int, db: AsyncSession = Depends(get_db)):
    owner = await db.execute(select(Tournament.id).where(and_(Tournament.guild_id == guild_id, Tournament.id == tournament_id)))
    if owner.first() is None:
        raise HTTPException(status_code=404, detail="Tournament not found.")
    stmt = select(Match).where(Match.tournament_id == tournament_id).order_by(Match.round_number.asc(), Match.match_number.asc())
    res = await db.execute(stmt)
    return res.scalars().all()
