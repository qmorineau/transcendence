import { pageManager } from "../../../pong.js";
import apiUser from "../api/apiUser.js";
import apiGame from "../api/apiGame.js";
import createUser from "../user/user.js";

import init from "../../view/init.js";
import updateGamePage from "../../view/updatePages/updateGamePage.js";
import updateTournamentPage from "../../view/updatePages/updateTournamentPage.js";
import apiTournament from "../api/apiTournament.js";

// =============== Reconnection Check ==================

async function reconnecting()
{
	const res = await apiGame.isReconnect();
	const json = JSON.parse(res.body);
	if (json.isReconnecting == true)
	{
		if (json.redirect == "game")
		{
			const res = await apiGame.gameInfo();
			if (res.error)
				return pageManager.error(res.error);
			const json = JSON.parse(res.body);
			pageManager.switch("gamePage");
			updateGamePage.updateSide();
			updateGamePage.updateName(json.p1, json.p2);
			updateGamePage.updateScore(json.score);
			apiGame.gameResume();
		}
		else if (json.redirect == "waiting")
		{
			pageManager.switchChild("tournamentPage", "overview");
			const res = await apiTournament.tournamentInfo();
			if (res.error)
				pageManager.switchChild("menuPage", "mainMenu");
			else
			{
				pageManager.switchChild("tournamentPage", "overview");
				await updateTournamentPage.updateKeysMovement(res.isReady ? false : true);
				updateTournamentPage.updateNextOpponent();
				updateTournamentPage.updateRound();
				pageManager.render();
			}
		}
		return true;
	}
	return false;
}

// =============== Event Handlers ==================
function eventHandlerLogin(loginInput, passwordInput)
{
    loginInput.on("submit", () => {
        loginInput.cancel()
        passwordInput.focus();
        pageManager.render();
    })
    passwordInput.on("submit", async () => {
        const res = await apiUser.login({
            "login": loginInput.getValue(),
            "password": passwordInput.getValue()
        });
		loginInput.clearValue();
		passwordInput.clearValue();
        if (res.error)
            return pageManager.error(res.error);
		const json = JSON.parse(res.body);
		if (!json.ok)
		{
			pageManager.user.twoFA = json.twoFA;
			pageManager.switchChild("authPage", "twoFA");
			pageManager.currentPage.getChildOfChild("twoFactorInput").focus();
			return ;
		}
        await createUser(res);
		init.initGameConfig();
		if (await reconnecting())
			return ;
        pageManager.switchChild("menuPage", "mainMenu");
        pageManager.render();
    })
}

function eventHandlerRegister(loginInput, passwordInput, firstNameInput, lastNameInput)
{
    loginInput.on("submit", () => {
        loginInput.cancel()
        passwordInput.focus();
        pageManager.render();
    })
    passwordInput.on("submit", () => {
        passwordInput.cancel()
        firstNameInput.focus();
        pageManager.render();
    })
    firstNameInput.on("submit", () => {
        firstNameInput.cancel()
        lastNameInput.focus();
        pageManager.render();
    })
    lastNameInput.on("submit", async () => {
        const res = await apiUser.register({
            "login": loginInput.getValue(),
            "password": passwordInput.getValue(),
            "lastName": lastNameInput.getValue(),
            "firstName": firstNameInput.getValue()
        });
		loginInput.clearValue();
		passwordInput.clearValue();
		lastNameInput.clearValue();
		firstNameInput.clearValue();
        if (res.error)
           return pageManager.error(res.error);
		await createUser(res);
		init.initGameConfig();
		if (await reconnecting())
			return ;
		pageManager.switchChild("menuPage", "mainMenu");
        pageManager.render();
    })
}

function eventHandlerTwoFactorAuth(twoFactorInput)
{
	 twoFactorInput.on("submit", async () => {
		const res = await apiUser.twoFactorAuth({
			"token": twoFactorInput.getValue(),
			"uuid": pageManager.user.twoFA,
		});
        twoFactorInput.clearValue();
		if (res.error)
			pageManager.error(res.error);
		else
		{
			await createUser(res);
			if (await reconnecting())
				return ;
			pageManager.switchChild("menuPage", "mainMenu");
			pageManager.render();
		}
    })
}

// =============== Key Handlers ==================
function authMenuHandler(page, key)
{
    if (key == "escape")
		pageManager.switchChild("menuPage", "authMenu");
}

function loginHandler(page, key)
{
    if (key == "escape")
	{
		page.getChildOfChild("loginInput").clearValue();
		page.getChildOfChild("passwordInput").clearValue();
		pageManager.switch("menuPage");
	}
}

function registerHandler(page, key)
{
    if (key == "escape")
    {
		page.getChildOfChild("loginInput").clearValue();
		page.getChildOfChild("passwordInput").clearValue();
		page.getChildOfChild("firstNameInput").clearValue();
		page.getChildOfChild("lastNameInput").clearValue();
        pageManager.switch("menuPage");
    }
}

function authKeyHandler(page, key)
{
    
    if (page.currentChild == page.childs.get("menu"))
        authMenuHandler(page, key)
    else if (page.currentChild == page.childs.get("login"))
        loginHandler(page, key)
    else if (page.currentChild == page.childs.get("register"))
        registerHandler(page, key)
    pageManager.render();
}

export default {authKeyHandler, eventHandlerLogin, eventHandlerRegister, eventHandlerTwoFactorAuth}