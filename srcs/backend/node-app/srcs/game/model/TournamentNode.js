// Classes
import Match from "./Match.js";
import Bot from "./Bot.js"

// MiddleWare
import matchMW from "../../match/matchMiddleware.js";

// Variables
import { matches } from "../controller/matchController.js";

// Controller
import websocketCTL from "../controller/websocketController.js";
import aiController from "../controller/aiController.js";
import tournamentCTL from "../controller/tournamentController.js";

// Utils
import utils from "../controller/utils.js";

class TournamentNode
{
	constructor(root, p1, p2, round_number, tournamentId)
	{
		this.tournamentId = tournamentId;
		this.round = round_number;
		this.p1 = p1;
		this.p2 = p2;
		this.root = root;
		this.match = null;
		this.left = null;
		this.right = null;
	}

	// Recursive creation of binary tree
	insert(startRange, endRange, players)
	{
		if (this.round == 1)
		{
			this.p1 = players[startRange];
			if (endRange - startRange == 1)
				this.p2 = players[endRange];
		}
		else
		{
			const left = new TournamentNode(this, null, null, this.round - 1, this.tournamentId);
			const right = new TournamentNode(this, null, null, this.round - 1, this.tournamentId);
			const median = Math.floor((endRange - startRange) / 2) + startRange;

			this.left = left;
			this.right = right;
			this.left.insert(startRange, median, players);
			this.right.insert(median + 1, endRange, players);
		}
	}

	// Insert AI player
	createAI()
	{
		if (this.round == 1)
		{
			if (!this.p1)
				this.p1 = new Bot();
			if (!this.p2)
				this.p2 = new Bot();
		}
		else
		{
			this.left.createAI();
			this.right.createAI();
		}
	}

	// Update the tree structure
	update()
	{
		if (this.match && this.match.isFinished())
		{
			if (matches.has(this.match))
				matches.delete(this.match);
			if (this.root)
			{
				const winner = this.match.getWinner();
				if (winner)
				{
					if (this == this.root.left)
						this.root.p1 = winner;
					else
						this.root.p2 = winner;
				}
			}
		}
		if (this.left)
			this.left.update();
		if (this.right)
			this.right.update();
	}

	// check if all player are ready for the round
	isReady(round)
	{
		if (this.round == round || this.round == 1)
			return ((this.p1 && this.p1.isReady(round)) && (this.p2 && this.p2.isReady(round)));
		else
			return (this.left.isReady(round) && this.right.isReady(round));
	}

	// start the round
	async startRound(round)
	{
		if (this.round == round)
		{
			if (this.p1.isAI() && this.p2.isAI())
			{
				this.match = new Match(0, this.p1, this.p2, this.tournamentId, false);
				this.match.game.score.p1 = this.match.game.config.maxScore;
				this.match.game.isFinished = true;
				this.match.aiIsRegister = true;
				this.match.aiIsUnregister = true;
				this.match.isFinished();
				const tournament = tournamentCTL.getTournament(this.tournamentId);
				tournament.roundMatchFinished++;
				tournament.matchFinished++;
				tournament.update();
				let res = {};
				res.tree = await tournament.serialize();
				res.isFinish = tournament.isFinished;
				websocketCTL.notifyTournament(tournament, {"tournamentInfo": res});
				if (tournament.isReady())
					await tournament.startRound();
			}
			else
			{
				const body = {
					tournamentId: this.tournamentId,
					player1Id: Number(this.p1.id),
					player2Id: Number(this.p2.id),
					player1Alias: this.p1.alias,
					player2Alias: this.p2.alias
				}
				const match = await matchMW.matchCreate(body);

				this.match = new Match(match.id, this.p1, this.p2, this.tournamentId, false);
				const json = {
					"tournament": {
						"match": {
							"p1": this.p1.alias,
							"p2": this.p2.alias
						}
					}
				}
				websocketCTL.notifyPlayer(this.p1, json);
				websocketCTL.notifyPlayer(this.p2, json)
				matches.add(this.match);
			}
		}
		else if (this.round > round)
		{
			this.left.startRound(round);
			this.right.startRound(round);
		}
	}

	printRound(round, node)
	{
		if (round == node.round)
		{
			console.log("Round ", round, ": MatchId ", node.match?.id);
			if (node.p1)
				node.p1.print("p1");
			else
				console.log("Not known");
			console.log(" 	vs");
			if (node.p2)
				node.p2.print("p2");
			else
				console.log("Not known");
		}
		else
		{
			if (node.left)
				this.printRound(round, node.left);
			if (node.right)
				this.printRound(round, node.right);
		}
	}

	// recursive creation of obj tree
	async serializeTree(node)
	{
		let res = {};

		if (node.p1)
			res.p1 = await this.#playerJson(node.p1);
		else
			res.p1 = null;
		if (node.p2)
			res.p2 = await this.#playerJson(node.p2);
		else
			res.p2 = null;
		res.round = node.round;
		if (node.match)
		{
			res.score = {
				"p1": node.match.game.score.p1,
				"p2": node.match.game.score.p2,
			};
			if (!node.match.isEnded)
				res.id = node.match.id;
			// console.log("===================", res, "================");
		}
		if (node.left && node.right)
		{
			res.left = await node.serializeTree(node.left);
			res.right = await node.serializeTree(node.right);
		}
		return res;
	}

	// calculate next opponent of login
	async nextOpponent(id, actualRound)
	{
		if (this.round < actualRound)
			return null;
		else if (this.p1 && this.p1.id == id)
			return await this.#playerJson(this.p2);
		else if (this.p2 && this.p2.id == id)
			return await this.#playerJson(this.p1);
		else
		{
			if (!this.left)
				return null;
			const leftOpp = await this.left.nextOpponent(id, actualRound);
			const rightOpp = await this.right.nextOpponent(id, actualRound);
			if (leftOpp)
				return leftOpp;
			else
				return rightOpp;
		}
	}

	// create json of next opponent
	async #playerJson(player)
	{
		if (player)
		{
			const login = await utils.getLogin(player.id)
			if (!login)
				return {"error": "Player doesn't exist"};
			else
				return {"alias": player.alias, "login": login};
		}
		else
			return {"alias": null, "login": null};
	}

	// replace player by bot on user deletion
	async replacePlayerByBot(userId)
	{
		let bot = null;
		if ((this.p1 && this.p1.id == userId) || (this.p2 && this.p2.id == userId))
		{
			if (this.match && !this.match.isEnded)
				bot = await aiController.matchChangePlayerToAI(this.match, userId)
			else
				bot = new Bot();
			if (this.p1 && this.p1.id == userId)
				this.p1 = bot;
			else
				this.p2 = bot;
		}
		else if (!this.left)
			return;
		else
		{
			await this.left.replacePlayerByBot(userId, bot);
			await this.right.replacePlayerByBot(userId, bot);
		}
	}
}

export default TournamentNode;