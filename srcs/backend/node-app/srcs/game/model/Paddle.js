class Paddle
{
	constructor(x)
	{
		this.x = x;
		this.y = 0;
		this.speed = 0.1;
		this.size = 1.75;
		this.dir = 0;
	}

	// check if ball is in front of a paddle
	#isBallFacingPaddle(ballNextY)
	{
		const halfSize = this.size / 2;

		if (this.y - halfSize <= ballNextY && this.y + halfSize >= ballNextY)
			return true;
		return false;
	}

	// check if ball hit a x,y point
	#isHittingPoint(ball, y, ballNextX, ballNextY)
	{
		const side_A = Math.pow(Math.abs(this.x - ballNextX), 2);
		const side_B = Math.pow(Math.abs(this.y + y - ballNextY), 2);
		const side_C = Math.pow(ball.radius, 2);

		if (side_A + side_B <= side_C)
			return true;
		return false;
	}

	// ball hitting paddle handler
	#hitPaddle(ballNextX, ball)
	{
		if ((ball.vx > 0 && ballNextX >= this.x) || ballNextX <= this.x)
		{
			if ((ball.vx < 0 && ball.y < this.y) || (ball.vx > 0 && ball.y > this.y))
				ball.rebound(ball.maxAngle, this);
			else
				ball.rebound(-ball.maxAngle, this);
			return true;
		}
		else
		{
			ball.wallRebound();
			return false;
		}
	}

	// paddle rebounce angle calculation
	#calculateAngle(ballNextX, ballNextY, ball)
	{
		const anglePercent =  (ballNextY - this.y) / (this.size) * 100;

		if (Math.abs(ballNextX - this.x) <= ball.radius)
		{
			ball.speedUp();
			if (ball.vx < 0)
				ball.rebound(-ball.maxAngle * anglePercent / 100, this);
			else
				ball.rebound(ball.maxAngle * anglePercent / 100, this);
			return true;
		}
		return false;
	}

	// check if the ball hit a paddle
	isHittingPaddle(ball)
	{
		const ballNextX = ball.x + (ball.vx * ball.speed);
		const ballNextY = ball.y + (ball.vy * ball.speed);
		const halfSize = this.size / 2;

		if (this.#isHittingPoint(ball, -halfSize, ballNextX, ballNextY))
		{
			ball.speedUp();
			return this.#hitPaddle(ballNextX, ball)
		}
		else if (this.#isHittingPoint(ball, halfSize, ballNextX, ballNextY))
		{
			ball.speedUp();
			return this.#hitPaddle(ballNextX, ball)
		}
		if (this.#isBallFacingPaddle(ballNextY))
			return this.#calculateAngle(ballNextX, ballNextY, ball);
		return false;
	}

	// reset paddle position
	reset()
	{
		this.y = 0;
		this.dir = 0;
	}
}

export default Paddle;