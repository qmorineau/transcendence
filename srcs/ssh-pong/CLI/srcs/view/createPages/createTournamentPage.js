import blessed from "neo-blessed"
import tournamentPageController from "../../controller/pageHandler/tournamentPageController.js"
import utils from "./utilsCreatePage.js"

const aliasLabel = {
	top: 3,
	left: 0,
	content: "Alias: ",
	bg: "black",
	fg: "white"
}

const maxPlayerLabel = {
	top: 4,
	left: 0,
	content: "Maximum of Players: ",
	bg: "black",
	fg: "white"
}

const maxPlayerInput = {
	top: 4,
	left: 20,
	inputOnFocus: true,
	bg: "black",
	fg: "white"
}

const lobbyLabel = {
	top: 4,
	left: 0,
	content: "Lobby Number: ",
	bg: "black",
	fg: "white"
}

const lobbyInput = {
	top: 4,
	left: 14,
	inputOnFocus: true,
	bg: "black",
	fg: "white"
}

const nextOpponentContainer = {
	tags: true,
	name: "nextOpponent",
	top: 3,
	left: 0,
	bg: "black",
	fg: "white"
}

const roundContainer = {
	name: "round",
	top: 4,
	left: 0,
	bg: "black",
	fg: "white"
}

const readyContainer = {
	name: "ready",
	left: 0,
	align: "center",
	bottom: 1,
	height: 3,
	tags: true,
	bg: "black",
	fg: "white"
}

const watchContainer = {
	left: 0,
	top: 6,
	height: 1,
	bg: "black",
	fg: "white"
}

// Function
// container generator
function createAliasInput()
{
	return {
		name: "aliasInput",
		top: 3,
		left: 7,
		height: 1,
		inputOnFocus: true,
		bg: "black",
		fg: "white",
	}
}

// Init

function initWatch(watchContainer)
{
	watchContainer.setContent("Watch Games");
}

function initCreateTournament(createTournamentContainer)
{
	const aliasLab = blessed.box(aliasLabel);
	createTournamentContainer.append(aliasLab);
	const aliasIn = blessed.textbox(createAliasInput());
	createTournamentContainer.append(aliasIn)
	const maxPlayerLab = blessed.box(maxPlayerLabel);
	createTournamentContainer.append(maxPlayerLab);
	const maxPlayerIn = blessed.textbox(maxPlayerInput);
	createTournamentContainer.append(maxPlayerIn)

	const movement = blessed.box(utils.getKeyMenuContainer());
	movement.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Create a Tournament");

	createTournamentContainer.append(title);
	createTournamentContainer.append(movement);	

	tournamentPageController.eventHandlerCreate(aliasIn, maxPlayerIn);
}

function initJoinTournament(joinTournamentContainer)
{
	const aliasLab = blessed.box(aliasLabel);
	joinTournamentContainer.append(aliasLab);
	const aliasIn = blessed.textbox(createAliasInput());
	joinTournamentContainer.append(aliasIn)
	const lobbyLab = blessed.box(lobbyLabel);
	joinTournamentContainer.append(lobbyLab);
	const lobbyIn = blessed.textbox(lobbyInput);
	joinTournamentContainer.append(lobbyIn)

	const movement = blessed.box(utils.getKeyMenuContainer());
	movement.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Join a Tournament");

	joinTournamentContainer.append(title);
	joinTournamentContainer.append(movement);	

	tournamentPageController.eventHandlerJoin(aliasIn, lobbyIn);
}

function initOverview(overviewContainer)
{
	//get tournament tree w/ request
	const actualRound = 19;
	const maxRound = 42;
	const theNextOppopent = "bloublou";

	const nextOpponent = blessed.box(nextOpponentContainer);
	nextOpponent.setContent("Next Opponent: " + theNextOppopent);	

	const round = blessed.box(roundContainer);
	round.setContent("Round: " + actualRound + "/" + maxRound);

	const ready = blessed.box(readyContainer);
	ready.setContent('{red-fg}Not Ready{/}');

	// const watch = blessed.box(watchContainer);
	// initWatch(watch);

	const movement = blessed.box(utils.getKeyMenuContainer());
	movement.setContent("Press [R] to go be ready");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Informations about the Tournament");

	overviewContainer.append(nextOpponent);
	overviewContainer.append(round);
	overviewContainer.append(ready);
	// overviewContainer.append(watch);
	overviewContainer.append(title);
	overviewContainer.append(movement);	
}

function createTournamentPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const create = blessed.box(utils.getBaseContainer());
	initCreateTournament(create);

	const join = blessed.box(utils.getBaseContainer());
	initJoinTournament(join);

	const overview = blessed.box(utils.getBaseContainer());
	initOverview(overview);

	page.register("join", join);
	page.register("create", create);
	page.register("overview", overview);
}

export default createTournamentPage;