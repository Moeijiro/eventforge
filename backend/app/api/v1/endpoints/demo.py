"""Demo data for the "Apex Arena" Discord server.

Three tournaments, each created once (seeding again changes nothing):
a live 8-player knockout part-way through round one, a cup still taking
sign-ups, and a finished round robin with its champion.
"""

import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Participant, Tournament
from app.db.session import get_db
from app.services.bracket import generate_round_robin_pairings, generate_single_elimination_matches
from app.services.match_flow import round_robin_leader

router = APIRouter()

DEMO_GUILD_ID = "tourn-demo-777"
PLAYERS = ["Valkyrie", "ShadowNinja", "TitanStriker", "FrostByte", "BlazeRider", "Aether", "EchoViper", "Quantum"]


async def _exists(db: AsyncSession, title: str) -> bool:
    res = await db.execute(select(Tournament.id).where(and_(Tournament.guild_id == DEMO_GUILD_ID, Tournament.title == title)))
    return res.first() is not None


async def _tournament(db: AsyncSession, title: str, description: str, fmt: str, size: int, status: str,
                      start: datetime.datetime, names: list[str]) -> tuple[Tournament, list[Participant]]:
    t = Tournament(guild_id=DEMO_GUILD_ID, title=title, description=description, format=fmt,
                   max_participants=size, status=status, start_time=start)
    db.add(t)
    await db.flush()
    players = [
        Participant(tournament_id=t.id, user_id=f"p_{name.lower()}", username=name, seed=seed,
                    avatar_url=None, is_checked_in=True)
        for seed, name in enumerate(names, start=1)
    ]
    db.add_all(players)
    await db.flush()
    return t, players


@router.post("/seed")
async def seed_demo_tournaments(db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.utcnow()
    created = 0

    title = "Apex Summer Championship"
    if not await _exists(db, title):
        t, players = await _tournament(db, title, "8-player invitational, single elimination, best of three.",
                                       "single_elimination", 8, "in_progress", now - datetime.timedelta(hours=3), PLAYERS)
        matches = generate_single_elimination_matches(t.id, players)
        db.add_all(matches)
        round_one = sorted((m for m in matches if m.round_number == 1), key=lambda m: m.match_number)
        # Match 1 is played and confirmed; match 2 is reported and waiting for the other player.
        first, second = round_one[0], round_one[1]
        first.score_a, first.score_b, first.status = 2, 0, "completed"
        first.winner_id, first.winner_name = first.participant_a_id, first.participant_a_name
        first.reported_by, first.confirmed_by = first.participant_a_id, first.participant_b_id
        final_path = next(m for m in matches if m.round_number == 2 and m.match_number == 1)
        final_path.participant_a_id, final_path.participant_a_name = first.winner_id, first.winner_name
        second.score_a, second.score_b, second.status = 2, 1, "awaiting_confirmation"
        second.reported_by = second.participant_a_id
        created += 1

    title = "Autumn Duos Cup"
    if not await _exists(db, title):
        await _tournament(db, title, "Open sign-ups — 16 slots, single elimination, starts Saturday.",
                          "single_elimination", 16, "registration_open", now + datetime.timedelta(days=3),
                          ["Nova", "Kestrel", "Ironclad", "Mirage", "Solstice"])
        created += 1

    title = "Spring Round Robin"
    if not await _exists(db, title):
        t, players = await _tournament(db, title, "Four-player league: everyone plays everyone once.",
                                       "round_robin", 4, "completed", now - datetime.timedelta(days=20), PLAYERS[:4])
        matches = generate_round_robin_pairings(t.id, players)
        results = [(2, 0), (2, 1), (0, 2), (2, 1), (1, 2), (2, 0)]
        for m, (a, b) in zip(matches, results):
            m.score_a, m.score_b, m.status = a, b, "completed"
            winner_is_a = a > b
            m.winner_id = m.participant_a_id if winner_is_a else m.participant_b_id
            m.winner_name = m.participant_a_name if winner_is_a else m.participant_b_name
        db.add_all(matches)
        t.winner_id, t.winner_name = round_robin_leader(matches)
        created += 1

    await db.commit()
    if created == 0:
        return {"message": "Demo tournaments are already loaded.", "created": False}
    return {"message": f"Loaded {created} demo tournaments.", "created": True}
