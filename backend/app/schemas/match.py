from pydantic import BaseModel, Field
from typing import Optional

class MatchOut(BaseModel):
    id: int
    tournament_id: int
    round_number: int
    match_number: int
    participant_a_id: Optional[str]
    participant_a_name: Optional[str]
    participant_b_id: Optional[str]
    participant_b_name: Optional[str]
    score_a: int
    score_b: int
    winner_id: Optional[str]
    winner_name: Optional[str]
    status: str
    reported_by: Optional[str]
    confirmed_by: Optional[str]

    class Config:
        from_attributes = True

class MatchScoreSubmit(BaseModel):
    reporter_id: str
    score_a: int = Field(..., ge=0)
    score_b: int = Field(..., ge=0)

class MatchConfirm(BaseModel):
    confirmer_id: str

class MatchDispute(BaseModel):
    disputer_id: str
    reason: Optional[str] = None
