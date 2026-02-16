// Classes
import Player from "./Player.js";

class Lobby
{
	constructor(id, newPlayer, maxPlayer, type)
	{
		this.type = type;
		this.id = id;
		this.maxPlayer = maxPlayer;
		this.players = new Set();
		this.players.add(newPlayer);
	}

	addPlayer(req)
	{
		if (this.players.size < this.maxPlayer)
		{
			const newPlayer = new Player(req);
			this.players.add(newPlayer);
			return true;
		}
		else
			return false;
	}

	isDuplicateAlias(alias)
	{
		for (const player of this.players)
		{
			if (player.alias == alias)
				return true;
		}
		return false;
	}

	removePlayer(id)
	{
		for (const player of this.players)
		{
			if (player.id == id)
				this.players.delete(player);
		}
	}

	isClientInside(req)
	{
		const id = req.user.id; 
		const token = req.cookies.session;
		const uuid = req.headers.uuid;
		
		let isInside = null;
		for (const player of this.players)
		{
			if (player.id == id && player.token == token && player.uuid == uuid)
				isInside = player;
		}
		return isInside;
	}

	isUserInside(req)
	{
		const id = req.user.id; 
		
		let isInside = null;
		for (const player of this.players)
		{
			if (player.id == id)
				isInside = player;
		}
		return isInside;
	}

	getPlayer(id)
	{
		let searchPlayer = null;
		for (const player of this.players)
		{
			if (id == player.id)
				searchPlayer = player;
		}
		return searchPlayer;
	}

	playersAreReady()
	{
		let isReady = true;
		for (const player of this.players)
		{
			if (!player.isReady())
				isReady = false;
		}
		return isReady;
	}

	print()
	{
		console.log("{");
		console.log(this.type, "Lobby", this.id);
		for (const player of this.players)
			player.print("");
		console.log("}");
	}
}

export default Lobby;