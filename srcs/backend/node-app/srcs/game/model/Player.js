// Controllers
import websocketCTL from "../controller/websocketController.js";

class Player
{
	constructor(req)
	{
		this.ready = false;
		this.id = Number(req.user.id);
		if (req.body && req.body.alias)
			this.alias = req.body.alias;
		else
			this.alias = null;
		this.token = req.cookies.session;
		this.uuid = req.headers.uuid;
	}

	getSocket()
	{
		return websocketCTL.getSocket(this.id, this.token, this.uuid);
	}

	changeReadyState()
	{
		if (this.ready)
			this.ready = false;
		else
			this.ready = true;
	}

	isReady()
	{
		if (!this.token && !this.uuid)
			return true;
		return this.ready;
	}

	async print(player)
	{
		console.log("	", player, "{ ID:", this.id, ", Login:", this.login, ", Alias:",this.alias, ", isReady:", this.isReady(), ", UUID:", this.uuid, "}");
	}

	isAI()
	{
		return false;
	}
}

export default Player;