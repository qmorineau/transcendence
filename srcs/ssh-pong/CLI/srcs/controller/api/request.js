import https from "https";
import { pageManager } from "../../../pong.js"
import fs from "node:fs";

const agent = new https.Agent({
	ca: fs.readFileSync("/app/cert.pem"),
	rejectUnauthorized: true,
});

function httpsPost({body, ...options}) {
	return new Promise((resolve, reject) => {
		const req = https.request({
			method: "POST",
			agent,
			...options,
		}, res => {
			const chunks = [];
			res.on("data", data => chunks.push(data))
			res.on("end", () => {
				let resBody = Buffer.concat(chunks);
				switch(res.headers['content-type']) {
					case 'application/json':
						resBody = JSON.parse(resBody);
						break;
				}
				try {
					resolve(handleResponse({
						status: res.statusCode,
						headers: res.headers,
						body: resBody
					}));
				} catch (err) {
					reject(err);
				}
			})
		})
		req.on('error', reject);
		if (body) {
			req.write(body);
		}
		req.end();
	})
}

function httpsGet({body, ...options}) {
	return new Promise((resolve, reject) => {
		const req = https.request({
			method: "GET",
			agent,
			...options,
		}, res => {
			const chunks = [];
			res.on("data", data => chunks.push(data))
			res.on("end", () => {
				let resBody = Buffer.concat(chunks);
				switch(res.headers['content-type']) {
					case 'application/json':
						resBody = JSON.parse(resBody);
						break;
				}
				try {
					resolve(handleResponse({
						status: res.statusCode,
						headers: res.headers,
						body: resBody
					}));
				} catch (err) {
					reject(err);
				}
			})
		})
		req.on('error', reject);
		if (body) {
			req.write(body);
		}
		req.end();
	})
}

function httpsDelete({body, ...options}) {
	return new Promise((resolve, reject) => {
		const req = https.request({
			method: "DELETE",
			agent,
			...options,
		}, res => {
			const chunks = [];
			res.on("data", data => chunks.push(data))
			res.on("end", () => {
				let resBody = Buffer.concat(chunks);
				switch(res.headers['content-type']) {
					case 'application/json':
						resBody = JSON.parse(resBody);
						break;
				}
				try {
					resolve(handleResponse({
						status: res.statusCode,
						headers: res.headers,
						body: resBody
					}));
				} catch (err) {
					reject(err);
				}
			})
		})
		req.on('error', reject);
		if (body) {
			req.write(body);
		}
		req.end();
	})
}

function handleResponse({status, headers, body})
{
	if (Number(status) < 200 || Number(status) >= 300)
	{
		const error = new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
		error.status = status;
		error.body = body;
		throw error;
	}
	return {status, headers, body};
}

function createRequest(request)
{
	let req = {
		hostname: "nginx",
		servername: "localhost",
		port: 443,
		path: request.path,
		method: request.method,
		headers: {
			"Content-Type": "application/json",
			"uuid": pageManager.user.uuid
		}
	}
	if (pageManager.user.token)
		req.headers.cookie = "session=" + pageManager.user.token;
	if (request.body)
	{
		req.body = JSON.stringify(request.body);
		req.headers["Content-Length"] = JSON.stringify(request.body).length
	}
	return req;
}

export default { httpsPost, httpsGet, httpsDelete, createRequest}