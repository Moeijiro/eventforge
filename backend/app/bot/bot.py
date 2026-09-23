import discord
from discord import app_commands
from discord.ext import commands
import datetime
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models import Tournament, Match
from app.bot.views import TournamentPanelView, QueueJoinView

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"[EventForge Bot] Authenticated as {bot.user.name} ({bot.user.id})")
    try:
        synced = await bot.tree.sync()
        print(f"[EventForge Bot] Synced {len(synced)} slash commands.")
    except Exception as e:
        print(f"[EventForge Bot] Failed to sync slash commands: {e}")

@bot.tree.command(name="event_panel", description="Deploy the Tournament Registration & Information Panel")
@app_commands.default_permissions(manage_guild=True)
async def cmd_event_panel(interaction: discord.Interaction, tournament_id: int):
    async with AsyncSessionLocal() as db:
        stmt = select(Tournament).where(Tournament.id == tournament_id)
        res = await db.execute(stmt)
        tournament = res.scalar_one_or_none()
        if not tournament:
            await interaction.response.send_message("Tournament ID not found in database.", ephemeral=True)
            return

        embed = discord.Embed(
            title=f"🏆 {tournament.title}",
            description=f"{tournament.description}\n\n"
                        f"**Format:** {tournament.format.replace('_', ' ').title()}\n"
                        f"**Capacity:** {tournament.max_participants} Competitors\n"
                        f"**Starts:** <t:{int(tournament.start_time.timestamp())}:F>\n"
                        f"**Status:** `{tournament.status.upper()}`",
            color=discord.Color.purple()
        )
        embed.set_footer(text="EventForge • Competitive Esports & Tournament Platform")
        await interaction.channel.send(embed=embed, view=TournamentPanelView(tournament_id=tournament.id))
        await interaction.response.send_message("Tournament Panel posted!", ephemeral=True)

@bot.tree.command(name="queue", description="Deploy the 1v1 Matchmaking Queue Panel")
@app_commands.default_permissions(manage_guild=True)
async def cmd_queue(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🎯 1v1 Matchmaking Queue",
        description="Looking for a quick match? Click below to enter the matchmaking pool.\n\nMatches are automatically generated as soon as two players join.",
        color=discord.Color.blue()
    )
    await interaction.channel.send(embed=embed, view=QueueJoinView())
    await interaction.response.send_message("1v1 Queue Panel deployed!", ephemeral=True)
