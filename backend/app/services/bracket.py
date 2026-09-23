import math
from typing import List, Dict, Any, Tuple
from app.db.models import Participant, Match

def get_next_power_of_two(n: int) -> int:
    if n <= 1:
        return 2
    return 1 << (n - 1).bit_length()

def generate_single_elimination_matches(tournament_id: int, participants: List[Participant]) -> List[Match]:
    """
    Deterministically constructs a single-elimination bracket with optimal bye allocation.
    """
    n = len(participants)
    if n < 2:
        raise ValueError("At least 2 participants are required to generate a bracket.")

    bracket_size = get_next_power_of_two(n)
    total_rounds = int(math.log2(bracket_size))
    byes_count = bracket_size - n

    # Prepare seeds: top seeds receive byes
    # Standard tournament seeding pairing (1 vs S, 2 vs S-1, ...)
    seeds: List[Any] = list(participants)
    for _ in range(byes_count):
        seeds.append(None)  # Bye slot

    # Interleave seeds for fair bracket distribution
    paired_slots = []
    half = bracket_size // 2
    for i in range(half):
        p1 = seeds[i]
        p2 = seeds[bracket_size - 1 - i]
        paired_slots.append((p1, p2))

    all_matches: List[Match] = []
    
    # 1. Create Round 1 matches
    round_1_matches = []
    for m_idx, (p1, p2) in enumerate(paired_slots, start=1):
        # If one is a bye, winner is immediately the existing participant
        has_bye = (p1 is None or p2 is None)
        winner = p1 if p2 is None else (p2 if p1 is None else None)
        status = "completed" if has_bye else "scheduled"

        match = Match(
            tournament_id=tournament_id,
            round_number=1,
            match_number=m_idx,
            participant_a_id=p1.user_id if p1 else None,
            participant_a_name=p1.username if p1 else "BYE",
            participant_b_id=p2.user_id if p2 else None,
            participant_b_name=p2.username if p2 else "BYE",
            winner_id=winner.user_id if winner else None,
            winner_name=winner.username if winner else None,
            status=status
        )
        round_1_matches.append(match)
        all_matches.append(match)

    # 2. Create subsequent rounds up to Final
    current_round_matches = round_1_matches
    for r in range(2, total_rounds + 1):
        next_round_count = len(current_round_matches) // 2
        next_round_matches = []
        for m_idx in range(1, next_round_count + 1):
            m = Match(
                tournament_id=tournament_id,
                round_number=r,
                match_number=m_idx,
                status="scheduled"
            )
            next_round_matches.append(m)
            all_matches.append(m)
        current_round_matches = next_round_matches

    # Players with a first-round bye go straight into their round-2 slot.
    # (Without this, round 2 had empty seats and the bracket could never finish.)
    by_round = {(m.round_number, m.match_number): m for m in all_matches}
    for match in round_1_matches:
        if match.winner_id is None:
            continue
        target = by_round.get((2, (match.match_number + 1) // 2))
        if target is None:
            continue
        if match.match_number % 2 == 1:
            target.participant_a_id, target.participant_a_name = match.winner_id, match.winner_name
        else:
            target.participant_b_id, target.participant_b_name = match.winner_id, match.winner_name

    return all_matches

def generate_round_robin_pairings(tournament_id: int, participants: List[Participant]) -> List[Match]:
    """Generates round-robin schedule so every participant plays every other."""
    n = len(participants)
    players = list(participants)
    if n % 2 != 0:
        players.append(None)  # Dummy player for bye
        n += 1

    matches = []
    match_counter = 1
    total_rounds = n - 1
    half = n // 2

    for r in range(1, total_rounds + 1):
        for i in range(half):
            p1 = players[i]
            p2 = players[n - 1 - i]
            if p1 is not None and p2 is not None:
                matches.append(Match(
                    tournament_id=tournament_id,
                    round_number=r,
                    match_number=match_counter,
                    participant_a_id=p1.user_id,
                    participant_a_name=p1.username,
                    participant_b_id=p2.user_id,
                    participant_b_name=p2.username,
                    status="scheduled"
                ))
                match_counter += 1
        # Rotate players clockwise keeping players[0] fixed
        players = [players[0]] + [players[-1]] + players[1:-1]

    return matches
