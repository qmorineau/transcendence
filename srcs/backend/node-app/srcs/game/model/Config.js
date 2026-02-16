// MiddleWare
import privateMW from "../../privateMatch/privateMatchMiddleware.js";
import tournamentMW from "../../match/matchMiddleware.js";

class Config
{
	constructor(match)
	{
		this.tournamentId = match.tournamentId;
		this.id = match.id;
		this.p1 = match.p1.id;
		this.p2 = match.p2.id;
		this.maxScore = 10;
		this.shouldBeDeleted = match.shouldBeDeleted;
		this.type = match.type;
		this.mapHeight = 10;
		this.mapWidth = 20;
		this.defaultBallSpeed = 0.1;
	}

	updatePointDB(game)
	{
		if (this.type == "private")
		{
			if (game.ball.x < 0)
				privateMW.onPrivateMatchPoint(this.id, this.p2, this.p1, game.score.p1, game.score.p2);
			else
				privateMW.onPrivateMatchPoint(this.id, this.p1, this.p2, game.score.p1, game.score.p2);
		}
		else
		{
			if (game.ball.x < 0)
				tournamentMW.onPoint(this.id, game.score.p1, game.score.p2);
			else
				tournamentMW.onPoint(this.id, game.score.p1, game.score.p2);
		}
	}

	updateGameDB(game)
	{
		if (this.type == "private")
		{
			if (game.score.p1 >= this.maxScore)
				privateMW.onPrivateMatchEnd(this.id, this.p1, this.p2);
			else
				privateMW.onPrivateMatchEnd(this.id, this.p2, this.p1);
		}
		else if (this.type == "tournament")
		{
			if (game.score.p1 >= this.maxScore)
				tournamentMW.onMatchEnd(this.id, this.p1);
			else
				tournamentMW.onMatchEnd(this.id, this.p2);
		}
	}
}

export default Config;
