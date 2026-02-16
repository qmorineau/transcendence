import blessed from "neo-blessed"

class Page
{
	constructor(parent, name)
	{
		this.name = name;
		this.container = blessed.box({
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			hidden: true
		})
		this.childs = new Map();
		this.currentChild = null;

		parent.append(this.container);
	}

	register(name, child)
	{
		if (this.container)
		{
			this.container.append(child)
			this.childs.set(name, child);
		}
	}

	getChildOfChild(name)
	{
		if (this.currentChild)
			return this.currentChild.children.find(child => child.name === name);
	}

	switch(name)
	{
		if (this.currentChild)
			this.currentChild.hide();
		this.currentChild = this.childs.get(name);
		if (this.currentChild)
		{
			this.currentChild.show();
			this.container.screen.render();
		}
		else
		{
			console.warn(`Child ${name} not found in ${this.name}`);
		}
	}

	show()
	{
		this.container.show();
		this.container.screen.render();
	}

	hide()
	{
		this.container.hide();
		this.container.screen.render();
	}
}

export default Page;