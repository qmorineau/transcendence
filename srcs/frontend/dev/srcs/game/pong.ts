import 
{
	KeyboardEventTypes,
	AnimationGroup,
	Vector3, 
	Engine,
	Scene,
	Mesh,
} from "@babylonjs/core";

import { createScene      } from "./scene.js";
import { load_text_in_div } from "../tools/utils.js"
import { post_json_api    } from "../tools/api-calls.js"
import { get_api          } from "../tools/api-calls.js"
import { sleep            } from "../tools/utils.js"
import { notify_error     } from "../notifs.js";
import { notify_info      } from "../notifs.js";




// global vars
var disc  : Mesh[] = [];
var p1    : Mesh[] = [];
var p2    : Mesh[] = [];
var start : Mesh;
var readyForWs : boolean = false;
var anim  : AnimationGroup;
let engine: Engine | null = null;
let scene : Scene  | null = null;




//////////////////
// destroy game // 
//////////////////

function destroyGame() {
	if (engine) {
		engine.stopRenderLoop();
		engine.dispose();
		engine = null;
	}
	if (scene) {
		scene.dispose();
		scene = null;
	}
	disc = [];
	p1   = [];
	p2   = [];
}




////////////////
// main logic //
////////////////

async function pong(online: boolean, spectator: boolean) 
{
	// destroy just to be sure
	destroyGame();

	const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
	
	// create the engine
	engine = new Engine(canvas, true);
	const resizeObserver = new ResizeObserver(() => {
		engine?.resize();
	});
	resizeObserver.observe(canvas);

	let side ='';
	if (!spectator) {
		// get the player side
		let res = await get_api('/api/game/side');
		let i = 0;
		while (!res.ok) {
			res = await get_api('/api/game/side');
			sleep(100);
			i++;
			if (i > 5) {
				get_api('/api/game/isInGame').then( res => {
					if (res.ok && res.json_data.isInGame) {
						notify_error('Side tryed 5 time but in game wtfffff');
					} else {
						notify_error('You dont belong to any game');
						window.location.hash = '#home';
					}
				});
				return;
			}
		}
		side = res.json_data.game.side;
	}
	
	// scene
	const { scene, animPromise } = createScene(engine, canvas, online, disc, p1, p2, spectator, side);
	animPromise.then(animPromise => {
		if (animPromise) {anim = animPromise;}
	});

	// movements
	if (!spectator) {
		scene.onKeyboardObservable.add((kbInfo) => {
			switch (kbInfo.type) {
				case KeyboardEventTypes.KEYDOWN:
					if (online) {
						if (side === "left") {
							if (kbInfo.event.key === "ArrowLeft")  { post_json_api({ p1:  1, p2:  1 }, '/api/game/move'); };
							if (kbInfo.event.key === "ArrowRight") { post_json_api({ p1: -1, p2: -1 }, '/api/game/move'); };
						}
						else {
							if (kbInfo.event.key === "ArrowLeft")  { post_json_api({ p1: -1, p2: -1 }, '/api/game/move'); };
							if (kbInfo.event.key === "ArrowRight") { post_json_api({ p1:  1, p2:  1 }, '/api/game/move'); };
						}
					} else {
							if (kbInfo.event.key === "ArrowLeft")  { post_json_api({ p1:  1 }, '/api/game/move'); };
							if (kbInfo.event.key === "ArrowRight") { post_json_api({ p1: -1 }, '/api/game/move'); };
							if (kbInfo.event.key === "d")          { post_json_api({ p2:  1 }, '/api/game/move'); };
							if (kbInfo.event.key === "a")          { post_json_api({ p2: -1 }, '/api/game/move'); };
					}
					break;

				case KeyboardEventTypes.KEYUP:
					if (online) {
						if (kbInfo.event.key === "ArrowLeft")  { post_json_api({ p1: 0, p2: 0 }, '/api/game/move'); };
						if (kbInfo.event.key === "ArrowRight") { post_json_api({ p1: 0, p2: 0 }, '/api/game/move'); };
					} else {
						if (kbInfo.event.key === "ArrowLeft")  { post_json_api({ p1: 0 }, '/api/game/move'); };
						if (kbInfo.event.key === "ArrowRight") { post_json_api({ p1: 0 }, '/api/game/move'); };
						if (kbInfo.event.key === "a")          { post_json_api({ p2: 0 }, '/api/game/move'); };
						if (kbInfo.event.key === "d")          { post_json_api({ p2: 0 }, '/api/game/move'); };
					}
					break;
			}
		});
	}

	// focus on the canvas
	canvas.focus();

	readyForWs = true;

	// main loop
	engine.runRenderLoop(() => {
		// disc rotation
		for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].rotate(new Vector3(0, 1, 0), 0.1) }
		scene?.render();
	});
}




/////////////////
// game_update //
/////////////////

var go : boolean = false;

//edit obj property based on game websocket data 
async function game_update(data: any) {

	if (!readyForWs) return;

	// countdown
	if (data.countdown && anim) {
		switch (data.countdown) 
		{
			// countdown animation
			case 3 : anim.start(false, 1.0, 380, 381);
			case 2 : anim.start(false, 1.0, 400, 401);
			case 1 : anim.start(false, 1.0, 420, 421, true); go = true;
		}
		return;
	}
	
	// end game
	if (data.ended) {
		destroyGame();
		if (window.location.hash === '#waiting_room') {
			const div = document.getElementById('spectator');
			div?.classList.remove('flex-1');
			div?.classList.add('w-10');
		} else {
			window.location.hash = '#waiting_room';
		}
		return;
	}

	// go animation
	if (go) { anim.start(false, 1.0, 440, 441); go = false; } 

	// update positions
	for (var i = 0; i < 3; i++) { if (p1[i]) p1[i].position.x = data.p1; } // p1
	for (var i = 0; i < 3; i++) { if (p2[i]) p2[i].position.x = data.p2; } // p2
	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.x =  data.ball.y; } // disc x
	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.z = -data.ball.x; } // disc z
}




//////////
// GOAL //
//////////


async function game_goal(data: any) {

	if (!readyForWs) return;

	// put the ball back at its place
	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].visibility = 0; } // disc hidden
	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.x = 0; } // disc x
	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.z = 0; } // disc z
	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.y = 0; } // disc y

	const wraper = document.getElementById('score_wraper');
	load_text_in_div('orange_score', data.score.p1);
	load_text_in_div  ('blue_score', data.score.p2);
	wraper?.classList.remove('hidden');
	await sleep(1000);
	wraper?.classList.add('hidden');

	for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].visibility = 1; } // disc shown
	anim.start(false, 1.5, 280, 360);

	anim.onAnimationEndObservable.addOnce( async () => {
		for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.x = 0; } // disc x
		for (var i = 0; i < 3; i++) { if (disc[i]) disc[i].position.z = 0; } // disc z
		// send ready signal
		post_json_api({}, '/api/game/resume');
	});
}

export {pong, game_update, game_goal}