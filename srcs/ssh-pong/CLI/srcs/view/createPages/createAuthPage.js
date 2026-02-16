import blessed from "neo-blessed"
import authPageController from "../../controller/pageHandler/authPageController.js"
import utils from "./utilsCreatePage.js"

const loginLabel = {
	top: 3,
	left: 0,
	content: "Username: ",
	bg: "black",
	fg: "white",
}

const loginInput = {
	name: "loginInput",
	top: 3,
	left: 10,
	inputOnFocus: true,
	bg: "black",
	fg: "white",
}

const passwordLabel = {
	top: 4,
	left: 0,
	content: "Password: ",
	bg: "black",
	fg: "white",
}

const passwordInput = {
	name: "passwordInput",
	top: 4,
	left: 10,
	inputOnFocus: true,
	censor: true,
	bg: "black",
	fg: "white",
}

const firstNameLabel = {
	top: 5,
	left: 0,
	content: "First Name: ",
	bg: "black",
	fg: "white",
}

const firstNameInput = {
	name: "firstNameInput",
	top: 5,
	left: 12,
	inputOnFocus: true,
	bg: "black",
	fg: "white",
}

const lastNameLabel = {
	top: 6,
	left: 0,
	content: "Last Name: ",
	bg: "black",
	fg: "white",
}

const lastNameInput = {
	name: "lastNameInput",
	top: 6,
	left: 11,
	inputOnFocus: true,
	bg: "black",
	fg: "white",
}

const twoFactorLabel = {
	top: 3,
	left: 1,
	height: 1,
	bg: "black",
	fg: "white",
	content: "Enter the 6 digits code of your authentifactor:"
}

const twoFactorInput = {
	name: "twoFactorInput",
	top: 4,
	left: 1,
	bottom: 0,
	inputOnFocus: true,
	bg: "black",
	fg: "white",
}

function initLogin(loginContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");
	loginContainer.append(keys);

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Login");
	loginContainer.append(title);

	const logLabel = blessed.box(loginLabel);
	loginContainer.append(logLabel);
	const loginIn = blessed.textbox(loginInput);
	loginContainer.append(loginIn);
	const passLabel = blessed.box(passwordLabel);
	loginContainer.append(passLabel);
	const passwordIn = blessed.textbox(passwordInput);
	loginContainer.append(passwordIn);

	authPageController.eventHandlerLogin(loginIn, passwordIn);
}

function initRegister(registerContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");
	registerContainer.append(keys);

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Register");
	registerContainer.append(title);

	const logLabel = blessed.box(loginLabel);
	registerContainer.append(logLabel);
	const loginIn = blessed.textbox(loginInput);
	registerContainer.append(loginIn);
	const passLabel = blessed.box(passwordLabel);
	registerContainer.append(passLabel);
	const passwordIn = blessed.textbox(passwordInput);
	registerContainer.append(passwordIn);
	const firstNameLab = blessed.box(firstNameLabel);
	registerContainer.append(firstNameLab);
	const firstNameIn = blessed.textbox(firstNameInput);
	registerContainer.append(firstNameIn);
	const lastNameLab = blessed.box(lastNameLabel);
	registerContainer.append(lastNameLab);
	const lastNameIn = blessed.textbox(lastNameInput);
	registerContainer.append(lastNameIn);

	authPageController.eventHandlerRegister(loginIn, passwordIn, firstNameIn, lastNameIn);
}

function initTwoFA(twoFAContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Two Factor Authentification");

	const label = blessed.box(twoFactorLabel);
	const input = blessed.textbox(twoFactorInput);

	twoFAContainer.append(keys);
	twoFAContainer.append(title);
	twoFAContainer.append(label);
	twoFAContainer.append(input);

	authPageController.eventHandlerTwoFactorAuth(input);
}

function createAuthPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const login = blessed.box(utils.getBaseContainer());
	initLogin(login);

	const register = blessed.box(utils.getBaseContainer());
	initRegister(register);

	const twoFA = blessed.box(utils.getBaseContainer());
	initTwoFA(twoFA);


	page.register("login", login);
	page.register("register", register);
	page.register("twoFA", twoFA);
}

export default createAuthPage;