import { request } from "undici";
import { runningTournaments } from "./tournamentController.js";
import { lobbies } from "./lobbyController.js";
import { matches } from "./matchController.js";
import { server } from "../../server.js"

// Functions
async function getLogin(id)
{
	const { body, statusCode } = await request(`http://identity:3000/api/user/id/${id}`, { method: 'GET' });
	if (statusCode >= 400)
		return null;
	const targetUser = await body.json();
	return targetUser.login;
}

async function getId(login)
{
	const { body, statusCode } = await request(`http://identity:3000/api/user/login/${login}`, { method: 'GET' });
	if (statusCode >= 400)
		return null;
	const targetUser = await body.json();
	return targetUser.id;
}

function isUuidAvailable(uuid)
{
	for (const tournament of runningTournaments)
	{
		// Player Set to Array + find uuid
		if ([...tournament.players].find((player) => {return player.uuid == uuid}))
			return false;
	}

	for (const [key, room] of lobbies)
	{
		// Player Set to Array + find uuid
		const test = [...room.players].find((player) => {return player.uuid == uuid ? room : null});
		if (test)
			return false;
	}

	for (const match of matches)
	{
		if (match.p1.uuid == uuid || match.p2.uuid == uuid)
			return false;
	}
	return true;
}

export default {getLogin, getId, isUuidAvailable};