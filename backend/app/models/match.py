import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    match_number = Column(Integer, nullable=False)
    participant_a_id = Column(String(32), nullable=True)
    participant_a_name = Column(String(128), nullable=True)
    participant_b_id = Column(String(32), nullable=True)
    participant_b_name = Column(String(128), nullable=True)
    score_a = Column(Integer, default=0)
    score_b = Column(Integer, default=0)
    winner_id = Column(String(32), nullable=True)
    winner_name = Column(String(128), nullable=True)
    status = Column(String(32), default="scheduled")  # scheduled, in_progress, awaiting_confirmation, disputed, completed
    reported_by = Column(String(32), nullable=True)
    confirmed_by = Column(String(32), nullable=True)
    next_match_id = Column(Integer, nullable=True)
    channel_id = Column(String(32), nullable=True)

    tournament = relationship("Tournament", back_populates="matches")
