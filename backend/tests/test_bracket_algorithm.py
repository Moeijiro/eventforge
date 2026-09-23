import pytest
from app.db.models import Participant
from app.services.bracket import (
    get_next_power_of_two, generate_single_elimination_matches, generate_round_robin_pairings
)

def test_next_power_of_two():
    assert get_next_power_of_two(2) == 2
    assert get_next_power_of_two(3) == 4
    assert get_next_power_of_two(5) == 8
    assert get_next_power_of_two(8) == 8
    assert get_next_power_of_two(9) == 16

def test_single_elimination_8_players():
    participants = [
        Participant(user_id=f"u_{i}", username=f"Player_{i}", seed=i)
        for i in range(1, 9)
    ]
    matches = generate_single_elimination_matches(tournament_id=1, participants=participants)
    
    # 8 players: 4 (R1) + 2 (R2) + 1 (Final) = 7 matches
    assert len(matches) == 7
    r1 = [m for m in matches if m.round_number == 1]
    r2 = [m for m in matches if m.round_number == 2]
    r3 = [m for m in matches if m.round_number == 3]
    assert len(r1) == 4
    assert len(r2) == 2
    assert len(r3) == 1

def test_single_elimination_non_power_of_two_with_byes():
    # 3 players -> bracket size 4 -> 1 bye
    participants = [
        Participant(user_id=f"u_{i}", username=f"Player_{i}", seed=i)
        for i in range(1, 4)
    ]
    matches = generate_single_elimination_matches(tournament_id=1, participants=participants)
    assert len(matches) == 3  # 2 in R1, 1 in R2
    
    r1 = [m for m in matches if m.round_number == 1]
    # One match should be completed with bye
    bye_matches = [m for m in r1 if m.status == "completed" and "BYE" in [m.participant_a_name, m.participant_b_name]]
    assert len(bye_matches) == 1

def test_round_robin_pairings():
    # 4 players: (4 * 3) / 2 = 6 total matches across 3 rounds
    participants = [
        Participant(user_id=f"u_{i}", username=f"Player_{i}", seed=i)
        for i in range(1, 5)
    ]
    matches = generate_round_robin_pairings(tournament_id=1, participants=participants)
    assert len(matches) == 6
    rounds = {m.round_number for m in matches}
    assert rounds == {1, 2, 3}


def test_bye_winners_are_placed_in_round_two():
    # 5 players -> bracket of 8 -> seeds 1-3 get byes and must already sit in round 2.
    participants = [Participant(user_id=f"u_{i}", username=f"Player_{i}", seed=i) for i in range(1, 6)]
    matches = generate_single_elimination_matches(tournament_id=1, participants=participants)
    round_two = [m for m in matches if m.round_number == 2]
    seated = {pid for m in round_two for pid in (m.participant_a_id, m.participant_b_id) if pid}
    assert seated == {"u_1", "u_2", "u_3"}


def test_round_robin_leader_breaks_ties_on_score_difference():
    from app.db.models import Match
    from app.services.match_flow import round_robin_leader

    def played(a, b, sa, sb):
        return Match(participant_a_id=a, participant_a_name=a, participant_b_id=b, participant_b_name=b,
                     score_a=sa, score_b=sb, winner_id=a if sa > sb else b, status="completed")

    # x and y both win twice; y's wins are bigger, so y leads.
    matches = [played("x", "z", 1, 0), played("x", "y", 1, 0), played("y", "z", 5, 0), played("y", "w", 5, 0), played("w", "x", 1, 0)]
    assert round_robin_leader(matches) == ("y", "y")
