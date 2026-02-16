import blessed from "neo-blessed"
import utils from "./utilsCreatePage.js"

const scoreContainer = {
	top: 0,
	left: 0,
	width: "100%",
	height: 3,
	bg: "black",
}

const gameContainer = {
	top: 3,
	bottom: 1,
	left: 0,
	width: "100%",
	border: {
		type: "line"
	},
	style: {
		bg: "black",
		border: {
			fg: "green",
			bg: "black"
		}
	}
}

const keyMovement = {
	height: 1,
	bottom: 0,
	fg: "red",
	bg: "black",
	tags: true,
	align: "center"
}

const p1Name = {
	name: "p1Name",
	top: 0,
	left: 1,
	align: "center",
	valign: "middle",
	width: "30%",
	height: 1,
	content: "p1 Name",
	bg: "red",
	fg: "white"
}

const p1Score = {
	name: "p1Score",
	top: 1,
	left: 1,
	align: "center",
	valign: "middle",
	width: "30%",
	height: 2,
	content: "0",
	bg: "red",
	fg: "white"
}

const p2Name = {
	name: "p2Name",
	top: 0,
	right: 1,
	align: "center",
	valign: "middle",
	height: 1,
	width: "30%",
	content: "p2 Name",
	bg: "blue",
	fg: "white"
}

const p2Score = {
	name: "p2Score",
	top: 1,
	right: 1,
	align: "center",
	valign: "middle",
	height: 2,
	width: "30%",
	content: "0",
	bg: "blue",
	fg: "white"
}

const countContainer = {
	name: "count",
	top: 0,
	left: "center",
	align: "center",
	valign: "middle",
	width: "30%",
	bg: "black",
	fg: "white"
}

const ballContainer = {
	top: "center",
	left: "center",
	width: 1,
	height: 1,
	content: "o",
	fg: "white",
	bg: "black",
}


const p1Container = {
	top: "center",
	left: 1,
	width: 0,
	height: 0,
	bg: "red",
}

const p2Container = {
	top: "center",
	right: 1,
	width: 0,
	height: 0,
	bg: "blue",
}

function initScore(scoreContainer)
{
	const player1Score = blessed.box(p1Score);
	const player1Name = blessed.box(p1Name);
	const player2Score = blessed.box(p2Score);
	const player2Name = blessed.box(p2Name);
	const count = blessed.box(countContainer)

	scoreContainer.append(player1Score);
	scoreContainer.append(player1Name);
	scoreContainer.append(player2Score);
	scoreContainer.append(player2Name);
	scoreContainer.append(count);
}

function createGamePage(page)
{
	const container = blessed.box(utils.getBaseContainer())
	page.container.append(container);
	
	const score = blessed.box(scoreContainer);
	initScore(score);

	const game = blessed.box(gameContainer);
	const ball = blessed.box(ballContainer);
	const p1 = blessed.box(p1Container);
	const p2 = blessed.box(p2Container);
	const keys = blessed.box(keyMovement);
	keys.setContent("Press [↑] & [↓] to move / Press any key to {bold}STOP{/}")

	page.register("game", game);
	page.register("score", score);
	page.register("ball", ball);
	page.register("p1", p1);
	page.register("p2", p2);
	page.register("keysMovement", keys);
}

export default createGamePage;