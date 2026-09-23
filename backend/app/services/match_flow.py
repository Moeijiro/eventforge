import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models import Match, Tournament, TournamentAuditLog

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

REPORTABLE = ("scheduled", "in_progress", "awaiting_confirmation", "disputed")


async def _tournament(match: Match, db: AsyncSession) -> Tournament | None:
    res = await db.execute(select(Tournament).where(Tournament.id == match.tournament_id))
    return res.scalar_one_or_none()


def round_robin_leader(matches: list[Match]) -> tuple[str, str] | None:
    """Most wins, then best score difference — the same order the standings table shows."""
    table: dict[str, list] = {}
    for m in matches:
        if m.status != "completed" or not m.participant_a_id or not m.participant_b_id:
            continue
        for pid, name, diff in ((m.participant_a_id, m.participant_a_name, m.score_a - m.score_b),
                                (m.participant_b_id, m.participant_b_name, m.score_b - m.score_a)):
            entry = table.setdefault(pid, [0, 0, name])
            entry[1] += diff
            if m.winner_id == pid:
                entry[0] += 1
    if not table:
        return None
    pid, (_, _, name) = max(table.items(), key=lambda item: (item[1][0], item[1][1]))
    return pid, name


async def _finish_round_robin_if_done(tournament: Tournament, db: AsyncSession) -> None:
    """A round robin ends when every match is completed."""
    res = await db.execute(select(Match).where(Match.tournament_id == tournament.id))
    matches = res.scalars().all()
    if not matches or any(m.status != "completed" for m in matches):
        return
    leader = round_robin_leader(matches)
    if leader is None:
        return
    tournament.status = "completed"
    tournament.winner_id, tournament.winner_name = leader
    db.add(TournamentAuditLog(tournament_id=tournament.id, guild_id=tournament.guild_id, actor_id="system",
                              action="winner_advanced", details=f"Round robin finished. Winner: {leader[1]}"))
    await db.commit()


async def _after_result(match: Match, db: AsyncSession) -> None:
    tournament = await _tournament(match, db)
    if tournament is not None and tournament.format == "round_robin":
        await _finish_round_robin_if_done(tournament, db)
    else:
        await advance_winner_to_next_round(match, db)


async def submit_match_score(match: Match, score_a: int, score_b: int, reporter_id: str, db: AsyncSession):
    if not match.participant_a_id or not match.participant_b_id:
        raise ValueError("Both players must be known before a score can be reported.")
    if reporter_id not in [match.participant_a_id, match.participant_b_id]:
        raise ValueError("Only assigned match participants can submit scores.")
    if match.status not in REPORTABLE:
        raise ValueError("This match is already completed.")
    tournament = await _tournament(match, db)
    if score_a == score_b and (tournament is None or tournament.format != "round_robin"):
        raise ValueError("Knockout matches can't end in a tie.")

    match.score_a = score_a
    match.score_b = score_b
    match.reported_by = reporter_id
    match.confirmed_by = None
    match.status = "awaiting_confirmation"
    db.add(TournamentAuditLog(
        tournament_id=match.tournament_id,
        guild_id=tournament.guild_id if tournament else "",
        actor_id=reporter_id,
        action="score_submitted",
        details=f"Round {match.round_number} Match {match.match_number}: Score submitted {score_a}-{score_b}"
    ))
    await db.commit()


async def confirm_match_score(match: Match, confirmer_id: str, db: AsyncSession):
    if match.status != "awaiting_confirmation":
        raise ValueError("There is no reported score waiting for confirmation.")
    if confirmer_id not in [match.participant_a_id, match.participant_b_id]:
        raise ValueError("Only assigned match participants can confirm scores.")
    if confirmer_id == match.reported_by:
        raise ValueError("You cannot confirm your own reported score.")

    if match.score_a > match.score_b:
        match.winner_id, match.winner_name = match.participant_a_id, match.participant_a_name
    elif match.score_b > match.score_a:
        match.winner_id, match.winner_name = match.participant_b_id, match.participant_b_name
    else:
        match.winner_id = match.winner_name = None  # a round-robin draw
    match.confirmed_by = confirmer_id
    match.status = "completed"

    tournament = await _tournament(match, db)
    db.add(TournamentAuditLog(
        tournament_id=match.tournament_id,
        guild_id=tournament.guild_id if tournament else "",
        actor_id=confirmer_id,
        action="score_confirmed",
        details=f"Confirmed match result: {match.winner_name or 'draw'}"
    ))
    await db.commit()
    await _after_result(match, db)


async def override_match(match: Match, winner_id: str, db: AsyncSession):
    """Staff decision on a disputed or stuck match."""
    if match.status == "completed":
        raise ValueError("This match is already completed.")
    if winner_id not in [match.participant_a_id, match.participant_b_id] or not winner_id:
        raise ValueError("The winner must be one of the two players in this match.")
    match.winner_id = winner_id
    match.winner_name = match.participant_a_name if winner_id == match.participant_a_id else match.participant_b_name
    match.status = "completed"
    await db.commit()
    await _after_result(match, db)


async def dispute_match(match: Match, disputer_id: str, db: AsyncSession):
    if disputer_id not in [match.participant_a_id, match.participant_b_id]:
        raise ValueError("Only the two players can dispute this match.")
    if match.status != "awaiting_confirmation":
        raise ValueError("Only a reported, unconfirmed score can be disputed.")
    match.status = "disputed"
    tournament = await _tournament(match, db)
    db.add(TournamentAuditLog(
        tournament_id=match.tournament_id,
        guild_id=tournament.guild_id if tournament else "",
        actor_id=disputer_id,
        action="dispute",
        details=f"Match score disputed by {disputer_id}. Staff review required."
    ))
    await db.commit()
