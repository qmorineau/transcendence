class Ball
{
	constructor()
	{
		this.x = 0;
		this.y = 0;
		this.vx = 1;
		this.vy = Math.random() * (-0.3 - 0.3) + 0.3;
		this.baseSpeed = 0.1;
		this.speed = 0.1;
		this.radius = 0.5;
		this.maxAngle = 60;
		this.lastVx = 1;
	}

	// check if ball hit a wall
	isHittingWall(config)
	{
		const mapBorder = config.mapHeight / 2;
		if (Math.abs(this.y + (this.vy * this.speed)) > mapBorder - this.radius)
			return true;
		return false;
	}

	// check if someone make a goal
	isOutsideMap(config)
	{
		const nextX = this.x + (this.vx * this.speed);

		if (Math.abs(nextX) > config.mapWidth / 2 + this.radius * 2)
			return true;
		return false;
	}

	// make ball rebounce
	rebound(angle, paddle)
	{
		let radian;

		if (paddle.x < 0)
			radian = (180 + angle) * (Math.PI / 180);
		else
			radian = angle * (Math.PI / 180);
		this.vx = Math.cos(radian);
		this.vy = Math.sin(radian);
	}

	wallRebound()
	{
		this.vy = -this.vy;
	}

	// calculate next position of the ball
	next()
	{
		this.x += this.vx * this.speed;
		this.y += this.vy * this.speed;
	}

	speedUp()
	{
		this.speed = this.baseSpeed * 1.5;
	}

	reset(config)
	{
		const min = -0.5;
		const max = 0.5;

		this.speed = this.baseSpeed;
		this.x = 0;
		this.y = 0;
		this.vx = -this.lastVx;
		this.lastVx = this.vx;
		this.vy = Math.random() * (-0.3 - 0.3) + 0.3;
	}
}

export default Ball;