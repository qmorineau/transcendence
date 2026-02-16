// Classes
import Game from "./Game.js"

// Controller
import aiController from "../controller/aiController.js";

class Match
{
	constructor(id, p1, p2, tournamentId, shouldBeDeleted)
	{
		tournamentId ? this.tournamentId = tournamentId : this.tournamentId = null;
		tournamentId ? this.type = "tournament" : this.type = "private";
		this.id = id;
		this.isEnded = false;
		this.p1 = p1;
		this.p2 = p2;
		this.shouldBeDeleted = shouldBeDeleted;
		this.aiIsRegister = false;
		this.aiIsUnregister = false;
		this.spectators = new Map();
		this.game = new Game(this);
	}

	start()
	{
		if (this.hasAI() && !this.aiIsRegister)
		{
			let bot;
			if (this.p1.isAI())
				bot = this.game.p1;
			else
				bot = this.game.p2;
			aiController.requestRegisterAI(this.id, bot.x, bot == this.game.p1 ? "left" : "right", this.type);
			this.aiIsRegister = true;
		}
		this.game.resume();
		if (!this.p1.isAI() && this.p1.uuid) // not AI and connected
			this.p1.ready = false;
		if (!this.p2.isAI() && this.p2.uuid) // not AI and connected
			this.p2.ready = false;
	}

	moveP1(dir)
	{
		this.game.moveP1(dir);
	}

	moveP2(dir)
	{
		this.game.moveP2(dir);
	}

	hasAI()
	{
		if (this.p1.isAI() || this.p2.isAI())
			return true;
		else
			return false;
	}

	isFinished()
	{
		if (this.game.isFinished)
		{
			if (this.hasAI() && !this.aiIsUnregister)
			{
				aiController.requestUnregisterAI(this.id, this.type);
				this.aiIsUnregister = true;
			}
			this.isEnded = true;
			return true;
		}
		return false;
	}

	getWinner()
	{
		if (this.game.isFinished)
		{
			if (this.game.score.p1 > this.game.score.p2)
				return this.p1;
			else
				return this.p2;
		}
		else
			return null;
	}

	print()
	{
		console.log("Match", this.id);
		console.log("{");
		this.game.print();
		this.p1.print("p1");
		this.p2.print("p2");
		console.log("}");
	}
}

export default Match;