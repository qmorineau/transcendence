// Class
import TournamentNode from "./TournamentNode.js"

// Middleware
import tournamentMW from "../../tournament/tournamentMiddleware.js"
import { runningTournaments } from "../controller/tournamentController.js";
import websocketCTL from "../controller/websocketController.js";

class Tournament
{
	constructor(players, id)
	{
		this.id = id;
		this.root = null;
		this.players = new Set(players);
		this.rounds = 0;
		this.maxMatch = 0;
		this.matchFinished = 0;
		this.roundMatchFinished = 0;
		this.actualRound = 0;
		this.isFinished = false;
		this.insert(players);
	}

	// Calculate Match Number to finish the tournament
	static calculateMatchesNumber(maxRounds)
	{
		let base = 1;
		let lastBase = base;
		let matchesNumber = 0;

		for (let i = 1; i <= maxRounds; i++)
		{
			matchesNumber += base;
			base = lastBase * 2;
			lastBase = base;
		}
		return matchesNumber;
	}

	// Check if the round is finished
	isNextRound()
	{
		if (this.roundMatchFinished == Math.pow(2, this.root.round - this.actualRound))
		{
			this.actualRound++;
			this.roundMatchFinished = 0;
			return true;
		}
		return false;
	}

	// Check if all player are ready for the next round
	isReady()
	{
		return this.root.isReady(this.actualRound + 1);
	}

	// Shuffle players set
	static #shuffle(array)
	{
		const shuffledArray = new Array();

		while (array.length)
		{
			const elem = Math.floor(Math.random() * array.length);
			shuffledArray.push(array[elem]);
			array.splice(elem, 1);
		}

		return shuffledArray;
	}

	// Binary Tree insertion to create the tree
	insert(players)
	{
		let playerNumber = players.size;

		let round_number = 1;
		for (round_number = 1; playerNumber > 2; round_number++)
			playerNumber = playerNumber / 2;
		const root = new TournamentNode(null, null, null, round_number, this.id);
		this.root = root;
		const array = Array.from(players);
		const playersArray = Tournament.#shuffle(array);
		this.root.insert(0, players.size - 1, playersArray);
		this.root.createAI();
		this.rounds = this.root.round;
		this.maxMatch = Tournament.calculateMatchesNumber(this.rounds);
	}

	// Update the tournament tree
	update()
	{
		this.root.update();
		if (this.maxMatch == this.matchFinished)
		{
			tournamentMW.onTournamentEnd(this.id, this.root.match.getWinner().id);
			this.isFinished = true;
			setTimeout(() => {
				runningTournaments.delete(this)
			}, 5000);
		}
	}

	// Get tree structure in obj
	async serialize()
	{
		const res = await this.root.serializeTree(this.root);
		return res;
	}

	// Calculate next opponent
	async nextOpponent(id)
	{
		const opponent = await this.root.nextOpponent(id, this.actualRound + 1);
		return opponent;
	}

	// start the next round if last one is finished
	async startRound()
	{
		if (this.actualRound == 0)
		{
			await this.root.startRound(1);
			this.setPlayerNotReady();
			this.actualRound = 1;
			let res = {};
			res.tree = await this.serialize();
			res.isFinish = this.isFinished;
			websocketCTL.notifyTournament(this, {"tournamentInfo": res});
		}
		if (this.isNextRound() && this.maxMatch != this.matchFinished)
		{
			await this.root.startRound(this.actualRound);
			this.setPlayerNotReady();
			let res = {};
			res.tree = await this.serialize();
			res.isFinish = this.isFinished;
			websocketCTL.notifyTournament(this, {"tournamentInfo": res});
		}
	}

	// change all ready state of player to false
	setPlayerNotReady()
	{
		for (const player of this.players)
		{
			if (!player.isAI())
				player.ready = false;
		}
	}

	print()
	{
		if (this.root)
		{
			console.log("Tournament ", this.id, "\n")
			console.log("Max Round:", this.rounds);
			console.log("Numbers of matches:", this.maxMatch);
			console.log("Matches finished:", this.matchFinished);
			console.log("Last Round", this.lastRound);
			for (let i = 1; i <= this.root.round; i++)
			{
				this.root.printRound(i, this.root);
				console.log("");
			}
		}
	}

	async replacePlayerByBot(userId)
	{
		await this.root.replacePlayerByBot(userId);
	}
}

export default Tournament;
