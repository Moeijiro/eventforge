import discord

from app.core.config import settings
from discord import ui
import datetime
from sqlalchemy import select, and_
from app.db.session import AsyncSessionLocal
from app.models import Tournament, Participant, Match
from app.services.match_flow import submit_match_score, confirm_match_score

class TournamentPanelView(ui.View):
    def __init__(self, tournament_id: int):
        super().__init__(timeout=None)
        self.tournament_id = tournament_id
        # Link buttons can't use the @ui.button decorator (it has no url=); they're added as items.
        self.add_item(ui.Button(label="Bracket Web Portal", style=discord.ButtonStyle.link, emoji="🌳",
                                url=f"{settings.APP_URL}/tournaments/{tournament_id}"))

    @ui.button(label="Register / Join", style=discord.ButtonStyle.success, emoji="⚔️", custom_id="tourn_join")
    async def join_button(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.defer(ephemeral=True)
        async with AsyncSessionLocal() as db:
            stmt = select(Tournament).where(Tournament.id == self.tournament_id)
            res = await db.execute(stmt)
            t = res.scalar_one_or_none()
            if not t or t.status != "registration_open":
                await interaction.followup.send("Registration is currently closed for this tournament.", ephemeral=True)
                return

            stmt_p = select(Participant).where(Participant.tournament_id == self.tournament_id)
            res_p = await db.execute(stmt_p)
            current_participants = res_p.scalars().all()
            if len(current_participants) >= t.max_participants:
                await interaction.followup.send("Tournament has reached maximum player capacity.", ephemeral=True)
                return

            # Check if user already joined
            if any(p.user_id == str(interaction.user.id) for p in current_participants):
                await interaction.followup.send("You are already registered for this tournament!", ephemeral=True)
                return

            p = Participant(
                tournament_id=t.id,
                user_id=str(interaction.user.id),
                username=interaction.user.display_name,
                avatar_url=interaction.user.display_avatar.url if interaction.user.display_avatar else None,
                seed=len(current_participants) + 1,
                is_checked_in=True
            )
            db.add(p)
            await db.commit()

            await interaction.followup.send(
                f"✅ Successfully registered for **{t.title}** as Seed #{p.seed}!",
                ephemeral=True
            )

    @ui.button(label="View Participants", style=discord.ButtonStyle.secondary, emoji="👥", custom_id="tourn_players")
    async def players_button(self, interaction: discord.Interaction, button: ui.Button):
        async with AsyncSessionLocal() as db:
            stmt_p = select(Participant).where(Participant.tournament_id == self.tournament_id).order_by(Participant.seed.asc())
            res_p = await db.execute(stmt_p)
            players = res_p.scalars().all()

        if not players:
            await interaction.response.send_message("No participants registered yet.", ephemeral=True)
            return

        list_str = "\n".join([f"`#{p.seed}` **{p.username}**" for p in players[:20]])
        embed = discord.Embed(
            title="Registered Competitors",
            description=list_str,
            color=discord.Color.purple()
        )
        embed.set_footer(text=f"Total: {len(players)} players")
        await interaction.response.send_message(embed=embed, ephemeral=True)

class QueueJoinView(ui.View):
    queue: list = []

    def __init__(self):
        super().__init__(timeout=None)

    @ui.button(label="Join 1v1 Duel Queue", style=discord.ButtonStyle.primary, emoji="🎯", custom_id="queue_1v1")
    async def join_queue(self, interaction: discord.Interaction, button: ui.Button):
        user_id = interaction.user.id
        if user_id in QueueJoinView.queue:
            await interaction.response.send_message("You are already in queue searching for an opponent.", ephemeral=True)
            return

        QueueJoinView.queue.append(user_id)
        if len(QueueJoinView.queue) >= 2:
            p1_id = QueueJoinView.queue.pop(0)
            p2_id = QueueJoinView.queue.pop(0)

            # Match found! Create a match thread
            p1 = interaction.guild.get_member(p1_id) if interaction.guild else None
            p2 = interaction.guild.get_member(p2_id) if interaction.guild else None
            p1_mention = p1.mention if p1 else f"<@{p1_id}>"
            p2_mention = p2.mention if p2 else f"<@{p2_id}>"

            embed = discord.Embed(
                title="⚔️ Match Found — 1v1 Duel!",
                description=f"{p1_mention} vs {p2_mention}\n\nPlease proceed with your match and report scores when finished.",
                color=discord.Color.gold()
            )
            await interaction.channel.send(content=f"{p1_mention} {p2_mention}", embed=embed)
            await interaction.response.send_message("Match found! Duel thread generated.", ephemeral=True)
        else:
            await interaction.response.send_message("You joined the 1v1 queue! Waiting for 1 opponent...", ephemeral=True)
