import pytest
from sqlalchemy import select
from app.models import Tournament, Match
from app.services.match_flow import submit_match_score, confirm_match_score, dispute_match
from tests.conftest import TestingSessionLocal
import datetime

@pytest.mark.asyncio
async def test_score_flow_and_winner_advancement():
    async with TestingSessionLocal() as db:
        now = datetime.datetime.utcnow()
        t = Tournament(
            guild_id="g1", title="Championship", description="desc",
            format="single_elimination", start_time=now
        )
        db.add(t)
        await db.commit()
        await db.refresh(t)

        # Round 1 Match 1
        m1 = Match(
            tournament_id=t.id, round_number=1, match_number=1,
            participant_a_id="p1", participant_a_name="Player 1",
            participant_b_id="p2", participant_b_name="Player 2",
            status="in_progress"
        )
        # Round 2 Match 1 (Final)
        m_final = Match(
            tournament_id=t.id, round_number=2, match_number=1,
            status="scheduled"
        )
        db.add(m1)
        db.add(m_final)
        await db.commit()
        await db.refresh(m1)
        await db.refresh(m_final)

        # P1 submits score 2-1
        await submit_match_score(m1, 2, 1, "p1", db)
        assert m1.status == "awaiting_confirmation"

        # P2 confirms score
        await confirm_match_score(m1, "p2", db)
        assert m1.status == "completed"
        assert m1.winner_id == "p1"

        # Check m_final received winner
        await db.refresh(m_final)
        assert m_final.participant_a_id == "p1"
        assert m_final.participant_a_name == "Player 1"


async def _tournament_with_match(db, fmt="single_elimination"):
    t = Tournament(guild_id="g2", title="Cup", description="desc", format=fmt, start_time=datetime.datetime.utcnow())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    m = Match(tournament_id=t.id, round_number=1, match_number=1, participant_a_id="p1", participant_a_name="One",
              participant_b_id="p2", participant_b_name="Two", status="scheduled")
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return t, m


@pytest.mark.asyncio
async def test_a_confirmed_match_cannot_be_confirmed_or_reported_again():
    async with TestingSessionLocal() as db:
        _, m = await _tournament_with_match(db)
        await submit_match_score(m, 3, 1, "p1", db)
        await confirm_match_score(m, "p2", db)
        with pytest.raises(ValueError):
            await confirm_match_score(m, "p2", db)
        with pytest.raises(ValueError):
            await submit_match_score(m, 0, 3, "p2", db)


@pytest.mark.asyncio
async def test_knockout_ties_are_rejected_when_reported():
    async with TestingSessionLocal() as db:
        _, m = await _tournament_with_match(db)
        with pytest.raises(ValueError):
            await submit_match_score(m, 2, 2, "p1", db)
        assert m.status == "scheduled"


@pytest.mark.asyncio
async def test_round_robin_finishes_only_when_every_match_is_played():
    async with TestingSessionLocal() as db:
        t, m1 = await _tournament_with_match(db, fmt="round_robin")
        m2 = Match(tournament_id=t.id, round_number=2, match_number=2, participant_a_id="p1", participant_a_name="One",
                   participant_b_id="p2", participant_b_name="Two", status="scheduled")
        db.add(m2)
        await db.commit()

        await submit_match_score(m1, 1, 0, "p1", db)
        await confirm_match_score(m1, "p2", db)
        await db.refresh(t)
        assert t.status != "completed"  # used to crown a champion after the first match

        await submit_match_score(m2, 2, 0, "p1", db)
        await confirm_match_score(m2, "p2", db)
        await db.refresh(t)
        assert t.status == "completed" and t.winner_id == "p1"
