import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.db.models import Tournament, Participant
from app.services.bracket import generate_single_elimination_matches

router = APIRouter()

DEMO_GUILD_ID = "tourn-demo-777"

@router.post("/seed")
async def seed_demo_tournaments(db: AsyncSession = Depends(get_db)):
    stmt_t = select(Tournament).where(and_(Tournament.guild_id == DEMO_GUILD_ID, Tournament.title == "Apex Summer Championship 2026"))
    res_t = await db.execute(stmt_t)
    if not res_t.scalar_one_or_none():
        now = datetime.datetime.utcnow()
        t = Tournament(
            guild_id=DEMO_GUILD_ID,
            title="Apex Summer Championship 2026",
            description="8-Player invitational single elimination championship tournament.",
            format="single_elimination",
            max_participants=8,
            status="in_progress",
            start_time=now + datetime.timedelta(days=2)
        )
        db.add(t)
        await db.commit()
        await db.refresh(t)

        players = [
            ("p_1", "Valkyrie", 1),
            ("p_2", "ShadowNinja", 2),
            ("p_3", "TitanStriker", 3),
            ("p_4", "FrostByte", 4),
            ("p_5", "BlazeRider", 5),
            ("p_6", "Aether", 6),
            ("p_7", "EchoViper", 7),
            ("p_8", "Quantum", 8)
        ]

        participants = []
        for uid, uname, seed in players:
            p = Participant(
                tournament_id=t.id,
                user_id=uid,
                username=uname,
                avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={uname}",
                seed=seed,
                is_checked_in=True
            )
            db.add(p)
            participants.append(p)
        await db.commit()

        # Generate bracket matches
        matches = generate_single_elimination_matches(t.id, participants)
        for m in matches:
            db.add(m)
        await db.commit()

    return {"message": "EventForge demo seeded successfully for tourn-demo-777"}
