// Classes
import Config from "./Config.js";
import Score from "./Score.js";
import Ball from "./Ball.js";
import Paddle from "./Paddle.js";

// Websocket
import websocketCTL from "../controller/websocketController.js";
import tournamentCTL from "../controller/tournamentController.js";
import matchCTL from "../controller/matchController.js"

// Middleware
import privateMatchMW from "../../privateMatch/privateMatchMiddleware.js";

// Variables
import { matches } from "../controller/matchController.js";

class Game
{
	constructor(match)
	{
		this.id = match.id;
		this.config = new Config(match);
		this.score = new Score();
		this.isRunning = false;
		this.isFinished = false;
		this.ball = new Ball();
		this.p1 = new Paddle(-9);
		this.p2 = new Paddle(9);
	}

	#pause()
	{
		this.isRunning = false;
	}

	resume()
	{
		if (!this.isFinished)
		{
			const match = matchCTL.getMatch(this.id, this.config.type);
			setTimeout(() => {websocketCTL.notifyMatch(match, {game: {countdown: 3}})}, 0);
			setTimeout(() => {websocketCTL.notifyMatch(match, {game: {countdown: 2}})}, 1000);
			setTimeout(() => {websocketCTL.notifyMatch(match, {game: {countdown: 1}})}, 2000);
			setTimeout(() => {this.isRunning = true;}, 3000);
		}
	}

	nextFrame()
	{
		if (this.isRunning)
		{
			this.moveP1(this.p1.dir);
			this.moveP2(this.p2.dir);
			if (this.ball.vx < 0 && this.p1.isHittingPaddle(this.ball))
				this.ball.vx = -this.ball.vx;
			else if (this.ball.vx > 0 && this.p2.isHittingPaddle(this.ball))
				this.ball.vx = -this.ball.vx;
			else if (this.ball.isHittingWall(this.config))
				this.ball.wallRebound();
			if (this.ball.isOutsideMap(this.config))
				this.#goal();
			this.ball.next();
		}
	}

	async #goal()
	{
		this.score.update(this.ball);
		if (this.id)
			this.config.updatePointDB(this);
		this.#pause();
		this.ball.reset();
		this.p1.reset();
		this.p2.reset();
		if (this.score.getMaxScore() >= this.config.maxScore)
		{
			if (this.config.shouldBeDeleted)
				privateMatchMW.privateMatchDelete(this.id);
			else
				this.config.updateGameDB(this);
			this.isFinished = true;
			this.isRunning = false;
			websocketCTL.notifyMatch(matchCTL.getMatch(this.id, this.config.type), {"game": {"ended":true, "type": this.config.type}});
			if (this.config.tournamentId)
			{
				const tournament = tournamentCTL.getTournament(this.config.tournamentId);
				if (tournament)
				{
					tournament.matchFinished++;
					tournament.roundMatchFinished++;
					tournament.update();
					let res = {};
					res.tree = await tournament.serialize();
					res.isFinish = tournament.isFinished;
					websocketCTL.notifyTournament(tournament, {"tournamentInfo": res});
					if (tournament.isReady())
						await tournament.startRound();
				}
			}
			else
				matches.delete(matchCTL.getMatch(this.id, this.config.type));
			return ;
		}
		this.#notifyWebsocket(this.config.type);
	}

	async #notifyWebsocket(type)
	{
		const match = matchCTL.getMatch(this.id, type);
		const json = {
			goal: {
				score: {
					"p1": this.score.p1,
					"p2": this.score.p2
				}
			}
		}
		if (match.tournamentId)
		{
			const tournament = tournamentCTL.getTournament(match.tournamentId);
			if (tournament)
			{
				let res = {};
				res.tree = await tournament.serialize();
				res.isFinish = tournament.isFinished;
				websocketCTL.notifyTournament(tournament, {"tournamentInfo": res});
			}
		}
		websocketCTL.notifyMatch(match, json);	
	}

	moveP1(dir)
	{
		if (this.isRunning)
		{
			const speed = this.p1.speed;
			const halfSize = this.p1.size / 2;
			const mapBorder = this.config.mapHeight / 2

			if (dir > 0)
			{
				if (Math.abs(this.p1.y - halfSize - speed) > mapBorder)
					this.p1.y = -mapBorder + halfSize;
				else
					this.p1.y -= speed;
			}
			else if (dir < 0)
			{
				if (Math.abs(this.p1.y + halfSize + speed) > mapBorder)
					this.p1.y = mapBorder - halfSize;
				else
					this.p1.y += speed;
			}
		}
	}
	
	moveP2(dir)
	{
		if (this.isRunning)
		{
			const speed = this.p2.speed;
			const halfSize = this.p2.size / 2;
			const mapBorder = this.config.mapHeight / 2

			if (dir > 0)
			{
				if (Math.abs(this.p2.y - halfSize - speed) > mapBorder)
					this.p2.y = -mapBorder + halfSize;
				else
					this.p2.y -= speed;
			}
			else if (dir < 0)
			{
				if (Math.abs(this.p2.y + halfSize + speed) > mapBorder)
					this.p2.y = mapBorder - halfSize;
				else
					this.p2.y += speed;
			}
		}
	}

	changeDirPlayer(player, dir)
	{
		if (player == "p1")
			this.p1.dir = Number(dir);
		else if (player == "p2")
			this.p2.dir = Number(dir);
	}



	print()
	{
		console.log("	", this.score);
	}
}

export default Game;