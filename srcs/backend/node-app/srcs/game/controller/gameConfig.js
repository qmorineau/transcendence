
// Classes
import Bot from "../model/Bot.js"
import Game from "../model/Game.js"
import Match from "../model/Match.js"

// Variable
const example = initExampleGame()

// Init game
function initExampleGame()
{
	const p1 = new Bot();
	const p2 = new Bot();
	const match = new Match(-1, p1, p2, null, false);
	const game = new Game(match);

	return game;
}

// Send game config
function getConfigGame(req, reply)
{
	const json = {
		"map": {
			"width": example.config.mapWidth,
			"height": example.config.mapHeight
		},
		"playerX": {
			"p1": example.p1.x,
			"p2": example.p2.x,
		},
		"paddleSize": example.p1.size
	}
	reply.send(json);
}

export default getConfigGame;