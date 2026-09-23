from pydantic import BaseModel, Field
from typing import Literal, Optional, List
import datetime

class TournamentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    format: Literal["single_elimination", "round_robin"] = "single_elimination"
    max_participants: int = Field(16, ge=4, le=64)
    start_time: datetime.datetime

class ParticipantCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=32)
    username: str = Field(..., min_length=1, max_length=64)
    avatar_url: Optional[str] = None

class ParticipantOut(BaseModel):
    id: int
    user_id: str = Field(..., min_length=1, max_length=32)
    username: str = Field(..., min_length=1, max_length=64)
    avatar_url: Optional[str]
    seed: int
    is_checked_in: bool
    joined_at: datetime.datetime

    class Config:
        from_attributes = True

class TournamentOut(BaseModel):
    id: int
    guild_id: str
    title: str
    description: str
    format: str
    max_participants: int
    status: str
    start_time: datetime.datetime
    winner_id: Optional[str]
    winner_name: Optional[str]
    created_at: datetime.datetime
    participants_count: int = 0

    class Config:
        from_attributes = True
