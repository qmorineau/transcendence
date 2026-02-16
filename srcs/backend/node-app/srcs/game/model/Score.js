class Score
{
	constructor()
	{
		this.p1 = 0;
		this.p2 = 0;
	}

	update(ball)
	{
		if (ball.x < 0)
			this.p2++;
		else
			this.p1++;
	}

	getMaxScore()
	{
		if (this.p1 > this.p2)
			return this.p1;
		return this.p2;
	}
}

export default Score;