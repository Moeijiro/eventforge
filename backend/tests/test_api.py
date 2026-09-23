import pytest
import datetime

@pytest.mark.asyncio
async def test_tournament_api_flow(client):
    guild_id = "test-guild-77"

    # 1. Create tournament
    t_payload = {
        "title": "Weekly Smash Cup",
        "description": "Weekly open tournament.",
        "format": "single_elimination",
        "max_participants": 8,
        "start_time": (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    }
    t_res = await client.post(f"/api/v1/tournaments/{guild_id}", json=t_payload)
    assert t_res.status_code == 201
    tournament_id = t_res.json()["id"]

    # 2. Join participants
    for i in range(1, 5):
        join_res = await client.post(f"/api/v1/tournaments/{guild_id}/{tournament_id}/join", json={
            "user_id": f"usr_{i}",
            "username": f"Gamer_{i}"
        })
        assert join_res.status_code == 200

    # 3. Generate bracket
    bracket_res = await client.post(f"/api/v1/tournaments/{guild_id}/{tournament_id}/generate-bracket")
    assert bracket_res.status_code == 200
    assert bracket_res.json()["total_matches"] == 3  # 4 players -> 2 (R1) + 1 (R2)

@pytest.mark.asyncio
async def test_demo_seed_endpoint(client):
    seed_res = await client.post("/api/v1/demo/seed")
    assert seed_res.status_code == 200

    list_res = await client.get("/api/v1/tournaments/tourn-demo-777")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


@pytest.mark.asyncio
async def test_bracket_is_generated_once_and_closes_registration(client):
    created = await client.post("/api/v1/tournaments/g-rules", json={
        "title": "Rules Cup", "description": "Testing the rules", "format": "single_elimination",
        "max_participants": 8, "start_time": "2026-10-01T18:00:00",
    })
    tid = created.json()["id"]
    for i in range(3):
        await client.post(f"/api/v1/tournaments/g-rules/{tid}/join", json={"user_id": f"u{i}", "username": f"User {i}"})

    assert (await client.post(f"/api/v1/tournaments/g-rules/{tid}/generate-bracket")).status_code == 200
    assert (await client.post(f"/api/v1/tournaments/g-rules/{tid}/generate-bracket")).status_code == 409
    late = await client.post(f"/api/v1/tournaments/g-rules/{tid}/join", json={"user_id": "late", "username": "Late"})
    assert late.status_code == 409


@pytest.mark.asyncio
async def test_demo_seed_is_idempotent(client):
    await client.post("/api/v1/demo/seed")
    await client.post("/api/v1/demo/seed")
    tournaments = (await client.get("/api/v1/tournaments/tourn-demo-777")).json()
    titles = [t["title"] for t in tournaments]
    assert len(titles) == len(set(titles)) == 3
