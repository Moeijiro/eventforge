import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    format = Column(String(32), default="single_elimination")  # single_elimination, round_robin
    max_participants = Column(Integer, default=16)
    status = Column(String(32), default="registration_open", index=True)  # registration_open, check_in_open, in_progress, completed, cancelled
    start_time = Column(DateTime, nullable=False)
    check_in_start_time = Column(DateTime, nullable=True)
    winner_id = Column(String(32), nullable=True)
    winner_name = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    participants = relationship("Participant", back_populates="tournament", cascade="all, delete-orphan", order_by="Participant.seed")
    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan", order_by="Match.round_number, Match.match_number")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False, index=True)
    user_id = Column(String(32), nullable=False)
    username = Column(String(128), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    seed = Column(Integer, default=1)
    is_checked_in = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    tournament = relationship("Tournament", back_populates="participants")

    __table_args__ = (
        Index("ix_participant_tourn_user", "tournament_id", "user_id", unique=True),
    )

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

class TournamentAuditLog(Base):
    __tablename__ = "tournament_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, nullable=False, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    actor_id = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
