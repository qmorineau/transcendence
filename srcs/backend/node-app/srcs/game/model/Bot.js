class Bot {
	constructor()
	{
		this.ready = true;
		this.id = 1;
		this.alias = "Bot-" + Math.floor(Math.random() * 1000);
		this.login = "IA";
		this.token = null;
		this.uuid = null;
	}

	isAI()
	{
		return true;
	}

	isReady()
	{
		return this.ready;
	}

	print(player)
	{
		console.log("	", player, "{ ID:", this.id, ", Login:", this.login, "Alias:", this.alias, "}"); 
	}
}

export default Bot;