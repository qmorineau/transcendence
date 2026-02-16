import request from "../controller/api/request.js";
import { pageManager } from "../../pong.js";

class Request
{
	constructor(method, path, body)
	{
		this.method = method;
		this.path = path;
		this.body = body;
		this.req = null;
		this.initRequest();
	}

	initRequest()
	{
		this.req = {
			hostname: "nginx",
			servername: "localhost",
			port: 443,
			path: this.path,
			method: this.method,
			headers: {
				"Content-Type": "application/json",
				"uuid": pageManager.user.uuid
			}
		}
		if (pageManager.user.token)
			this.req.headers.cookie = "session=" + pageManager.user.token;
		if (this.body)
		{
			const bodyStr = JSON.stringify(this.body)
			this.req.body = bodyStr;
			this.req.headers["Content-Length"] = bodyStr.length
		}
	}

	async sendRequest()
	{
		try 
		{
			if (this.method == "GET")
				return await request.httpsGet(this.req)
			else if (this.method == "POST")
				return await request.httpsPost(this.req)
			else if (this.method == "DELETE")
				return await request.httpsDelete(this.req)
		} catch (err) {
			return {"error": await JSON.parse(err.body).error};
		}
	}	
}

export default Request;