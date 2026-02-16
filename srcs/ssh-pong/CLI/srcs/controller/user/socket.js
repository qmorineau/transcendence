import fs from "node:fs";
import WebSocket from "ws";
import socketMessageHandler from "../socketHandler/socketHandler.js";
import { pageManager } from "../../../pong.js";

function createSocket(user)
{
  	return new Promise((resolve, reject) => {
		const socket = new WebSocket("wss://nginx:443/api/ws", {
			headers: {
				"Cookie": "session=" + user.token
			},
			ca: [fs.readFileSync("/app/cert.pem")],
			servername: "localhost",
		});
		socket.onopen = () => {
			pageManager.user.socket = socket;
			socketMessageHandler(socket);
			socket.send(JSON.stringify({"uuid": user.uuid}));
			resolve(socket);
		}
		socket.onerrr = (err) => {
			reject (err);
		};
	});
}

export default {createSocket}