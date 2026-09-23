import pytest
from sqlalchemy import select
from app.db.models import Tournament, Match
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
