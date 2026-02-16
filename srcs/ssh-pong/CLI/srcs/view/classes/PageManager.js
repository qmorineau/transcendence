import blessed from "neo-blessed"
import User from "../../model/User.js";

class PageManager {
	constructor(screen, contrib)
	{
		this.screen = screen;
		this.contrib = this.contrib;
		this.pages = new Map();
		this.currentPage = null;
		this.savedPage = null;
		this.user = new User();
		this.log = blessed.log({
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			tags: true,
			border: 'line',
			scrollable: true,
			alwaysScroll: true,
			scrollbar: {
				ch: ' ',
				track: {
				bg: 'grey'
				},
				style: {
				bg: 'white'
				}
			},
			keys: true,
			mouse: true,
			style: {
				fg: 'white',
				border: {
				fg: '#f0f0f0'
				},
				scrollbar: {
				bg: 'blue'
				}
			}
		});
		this.screen.append(this.log);
		this.log.setFront();
	}

	register(page)
	{
		this.pages.set(page.name, page);
	}

	switch(name)
	{
		if (this.currentPage)
			this.currentPage.hide();
		this.currentPage = this.pages.get(name);
		if (this.currentPage)
			this.currentPage.show();
		
	}

	switchChild(parentName, childName)
	{
		this.switch(parentName);
		this.currentPage.switch(childName);
	}

	print(data)
	{
		if (this.currentPage)
			this.currentPage.hide();
		if (this.log)
			this.log.log(data);
	}

	error(data)
	{
		if (this.currentPage.name == "lobbyPage")
			this.savedPage = this.currentPage;
		this.switch("errorPage");
		const error = this.currentPage.childs.get("error");
		error.setContent(data);
		this.render();
	}

	hideError()
	{
		const error = this.currentPage.childs.get("error");
		error.setContent("");
		if (this.user.token)
		{
			if (this.savedPage)
				this.switch(this.savedPage.name);
			else
				this.switchChild("menuPage", "mainMenu");
		}
		else
			this.switchChild("menuPage", "authMenu");
	}

	render()
	{
		this.screen.render();
	}
}

export default PageManager