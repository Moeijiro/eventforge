import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.models import Match, Tournament, TournamentAuditLog

async def advance_winner_to_next_round(match: Match, db: AsyncSession):
    """Places the winner into the corresponding match of round R+1."""
    next_round = match.round_number + 1
    # Match 1 and 2 of round R feed Match 1 of round R+1, etc.
    next_match_num = (match.match_number + 1) // 2
    is_slot_a = (match.match_number % 2 == 1)

    stmt = select(Match).where(
        and_(
            Match.tournament_id == match.tournament_id,
            Match.round_number == next_round,
            Match.match_number == next_match_num
        )
    )
    res = await db.execute(stmt)
    next_match = res.scalar_one_or_none()

    if next_match:
        if is_slot_a:
            next_match.participant_a_id = match.winner_id
            next_match.participant_a_name = match.winner_name
        else:
            next_match.participant_b_id = match.winner_id
            next_match.participant_b_name = match.winner_name
        await db.commit()
    else:
        # If no next match exists, this was the Final! Declare tournament champion
        stmt_t = select(Tournament).where(Tournament.id == match.tournament_id)
        res_t = await db.execute(stmt_t)
        tournament = res_t.scalar_one_or_none()
        if tournament:
            tournament.status = "completed"
            tournament.winner_id = match.winner_id
            tournament.winner_name = match.winner_name
            db.add(TournamentAuditLog(
                tournament_id=tournament.id,
                guild_id=tournament.guild_id,
                actor_id=match.winner_id or "system",
                action="winner_advanced",
                details=f"Tournament concluded! Winner declared: {match.winner_name}"
            ))
            await db.commit()

async def submit_match_score(match: Match, score_a: int, score_b: int, reporter_id: str, db: AsyncSession):
    if reporter_id not in [match.participant_a_id, match.participant_b_id]:
        raise ValueError("Only assigned match participants can submit scores.")

    match.score_a = score_a
    match.score_b = score_b
    match.reported_by = reporter_id
    match.status = "awaiting_confirmation"

    db.add(TournamentAuditLog(
        tournament_id=match.tournament_id,
        guild_id="",
        actor_id=reporter_id,
        action="score_submitted",
        details=f"Round {match.round_number} Match {match.match_number}: Score submitted {score_a}-{score_b}"
    ))
    await db.commit()

async def confirm_match_score(match: Match, confirmer_id: str, db: AsyncSession):
    if confirmer_id not in [match.participant_a_id, match.participant_b_id]:
        raise ValueError("Only assigned match participants can confirm scores.")
    if confirmer_id == match.reported_by:
        raise ValueError("You cannot confirm your own reported score.")

    match.confirmed_by = confirmer_id
    match.status = "completed"

    # Determine winner
    if match.score_a > match.score_b:
        match.winner_id = match.participant_a_id
        match.winner_name = match.participant_a_name
    elif match.score_b > match.score_a:
        match.winner_id = match.participant_b_id
        match.winner_name = match.participant_b_name
    else:
        raise ValueError("Match scores cannot be tied in knockout format.")

    db.add(TournamentAuditLog(
        tournament_id=match.tournament_id,
        guild_id="",
        actor_id=confirmer_id,
        action="score_confirmed",
        details=f"Confirmed match winner: {match.winner_name}"
    ))
    await db.commit()

    # Advance winner to next round
    await advance_winner_to_next_round(match, db)

async def dispute_match(match: Match, disputer_id: str, db: AsyncSession):
    match.status = "disputed"
    db.add(TournamentAuditLog(
        tournament_id=match.tournament_id,
        guild_id="",
        actor_id=disputer_id,
        action="dispute",
        details=f"Match score disputed by {disputer_id}. Staff review required."
    ))
    await db.commit()
