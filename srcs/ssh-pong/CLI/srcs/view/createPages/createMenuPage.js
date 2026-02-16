import blessed from "neo-blessed"
import utils from "./utilsCreatePage.js"

function getMenuContainer() {
    return {
		name: "menu",
        top: 3,
        left: 0,
        width: "100%",
        height: "100%",
        style: {
			bg: "black",
			fg: "white",
            selected: {
                fg: "green",
				bg: "black",
            }
        }
    };
}

function initLoginMenu(loginContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [ENTER] to validate / [ESC] to quit");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Authentification");

	const menu = blessed.list(getMenuContainer());
	menu.add("Login");
	menu.add("Register");
	menu.add("Stay as guest");
	menu.add("Quit");

	loginContainer.append(keys);
	loginContainer.append(title);
	loginContainer.append(menu);
}

function initTournamentMenu(tournamentContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [ENTER] to validate / [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Tournament Menu");

	const menu = blessed.list(getMenuContainer());
	menu.add("Create Tournament");
	menu.add("Join Tournament");
	menu.add("Back to menu");

	tournamentContainer.append(keys);
	tournamentContainer.append(title);
	tournamentContainer.append(menu);
}

function initPrivateMenu(privateContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [ENTER] to validate / [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Private Match Menu");

	const menu = blessed.list(getMenuContainer());
	menu.add("private");

	privateContainer.append(keys);
	privateContainer.append(title);
	privateContainer.append(menu);
}

function initMainMenu(mainMenuContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [ENTER] to validate / [ESC] to logout");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Menu");

	const menu = blessed.list(getMenuContainer());
	menu.add("Random Matchmaking");
	menu.add("Play AI")
	menu.add("Profil");
	menu.add("Friends");
	menu.add("Tournament");
	menu.add("Logout");

	mainMenuContainer.append(keys);
	mainMenuContainer.append(title);
	mainMenuContainer.append(menu);
}

function initFriendsMenu(friendsMenuContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [ENTER] to validate / [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Your Friends");

	const menu = blessed.list(getMenuContainer());
	menu.add("Your friends request");
	menu.add("Pending request");
	menu.add("Friends List");
	menu.add("Back to menu");

	friendsMenuContainer.append(keys);
	friendsMenuContainer.append(title);
	friendsMenuContainer.append(menu);
}

function initProfilMenu(profilContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [ENTER] to validate / [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Profil");

	const menu = blessed.list(getMenuContainer());
	menu.add("See my profil");
	menu.add("Search a player profil");
	menu.add("History of match");
	menu.add("Back to menu");

	profilContainer.append(keys);
	profilContainer.append(title);
	profilContainer.append(menu);
}

function createMenuPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const profilMenu = blessed.box(utils.getBaseContainer())
	initProfilMenu(profilMenu);

	const privateMenu = blessed.box(utils.getBaseContainer());
	initPrivateMenu(privateMenu);

	const tournamentMenu = blessed.box(utils.getBaseContainer());
	initTournamentMenu(tournamentMenu);

	const loginMenu = blessed.box(utils.getBaseContainer());
	initLoginMenu(loginMenu);

	const mainMenu = blessed.box(utils.getBaseContainer());
	initMainMenu(mainMenu);

	const friendsMenu = blessed.box(utils.getBaseContainer());
	initFriendsMenu(friendsMenu);

	page.register("profilMenu", profilMenu);
	page.register("tournamentMenu", tournamentMenu);
	page.register("authMenu", loginMenu);
	page.register("friendsMenu", friendsMenu);
	page.register("mainMenu", mainMenu);
	page.switch("authMenu");
}

export default createMenuPage;