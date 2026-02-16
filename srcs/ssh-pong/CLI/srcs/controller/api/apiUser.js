import Request from "../../model/Request.js";

// Register
async function register(body)
{
	const req = new Request("POST", "/api/user/register", body);
 	const res = await req.sendRequest();
	
	return res;
}

// Login
async function login(body)
{
	const req = new Request("POST", "/api/user/login", body);
 	const res = await req.sendRequest();
	
	return res;
}

// Logout
async function logout()
{
	const req = new Request("GET", "/api/user/logout", null);
 	const res = await req.sendRequest();
	
	return res;
}

// Guest auth
async function guestLogin()
{
	const req = new Request("POST", "/api/user/guest", {});
 	const res = await req.sendRequest();
	
	return res;
}

async function userUpdate()
{
	const req = new Request("POST", "/api/user/update", body);
 	const res = await req.sendRequest();
	
	return res;
}

// Info about user
async function userInfo()
{
	const req = new Request("GET", "/api/me", null);
 	const res = await req.sendRequest();
	
	return res;
}

// User Names Info
async function userNamesInfo(login)
{
	const req = new Request("GET", `/api/user/${login}/names`, null);
 	const res = await req.sendRequest();
	
	return res;
}

// User Elo Info
async function userEloInfo(login)
{
	const req = new Request("GET", `/api/stats/${login}/elo`, null);
 	const res = await req.sendRequest();
	
	return res;
}

// Get stats of match of the user
async function userMatchInfo(login)
{
	const req = new Request("GET", `/api/matches/played/${login}`, null);
 	const res = await req.sendRequest();
	
	return res;
}

// Match history of user
async function userMatchHistory(login)
{
	const req = new Request("GET", `/api/matches/history/${login}`, null);
 	const res = await req.sendRequest();
	
	return res;
}

async function twoFactorAuth(body)
{
	const req = new Request("POST", `/api/user/2faValidate`, body);
 	const res = await req.sendRequest();
	
	return res;
}


export default {register, login, logout, guestLogin, userUpdate, userInfo, userNamesInfo, userEloInfo, userMatchInfo, userMatchHistory, twoFactorAuth}