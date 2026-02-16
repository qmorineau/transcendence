import { pageManager } from "../../../pong.js";

const frames = [
	"▐⠂       ▌",
	"▐⠈       ▌",
	"▐ ⠂      ▌",
	"▐ ⠠      ▌",
	"▐  ⡀     ▌",
	"▐  ⠠     ▌",
	"▐   ⠂    ▌",
	"▐   ⠈    ▌",
	"▐    ⠂   ▌",
	"▐    ⠠   ▌",
	"▐     ⡀  ▌",
	"▐     ⠠  ▌",
	"▐      ⠂ ▌",
	"▐      ⠈ ▌",
	"▐       ⠂▌",
	"▐       ⠠▌",
	"▐       ⡀▌",
	"▐      ⠠ ▌",
	"▐      ⠂ ▌",
	"▐     ⠈  ▌",
	"▐     ⠂  ▌",
	"▐    ⠠   ▌",
	"▐    ⡀   ▌",
	"▐   ⠠    ▌",
	"▐   ⠂    ▌",
	"▐  ⠈     ▌",
	"▐  ⠂     ▌",
	"▐ ⠠      ▌",
	"▐ ⡀      ▌",
	"▐⠠       ▌"
]

let animation = null;
let i = 0;

function startAnimation()
{
	animation = setInterval(() => {
		if (pageManager.currentPage.name == "waitingRoomPage")
		{
			const waitingContainer = pageManager.currentPage.childs.get("loading");
			waitingContainer.setContent("Waiting...\n\n" + frames[i]);
			pageManager.render();
			if (++i == frames.length)
				i = 0;
		}
	}, 80);
}

function stopAnimation()
{
	clearInterval(animation);
	animation = null;
}

export default {startAnimation, stopAnimation};