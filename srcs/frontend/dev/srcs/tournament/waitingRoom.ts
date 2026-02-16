import { 
	load_file_in_div,
	load_file_in_sub_div,
	evlistener,
	sleep
} from "../tools/utils.js";

import { get_api            } from "../tools/api-calls.js";
import { generate_tree_root } from "./tree_gen.js";
import { TreeNode           } from "./tree_gen.js";
import { notify_error       } from "../notifs.js"



function scale(factor: number, treeBox: HTMLElement) {
	const elements = treeBox.querySelectorAll('.match_overview') as NodeListOf<HTMLElement>;
	elements.forEach(element => {
		// width - height
		const currentWidth  = parseFloat(getComputedStyle(element).width);
		const currentHeight = parseFloat(getComputedStyle(element).height);
		const tmpw = currentWidth  * factor;
		const tmph = currentHeight * factor;
		element.style.width  = Math.max(tmpw, 350) + "px";
		element.style.height = Math.max(tmph, 130)  + "px";

		// text
		const bigs = element.querySelectorAll('.scale_text') as NodeListOf<HTMLElement>;
		bigs.forEach(big => {
			const currentSize = parseFloat(getComputedStyle(big).fontSize);
			let newSize = Math.round(currentSize * factor);
			if (newSize < 20) newSize = 20;
			big.style.fontSize = newSize + "px";
		});
		const smalls = element.querySelectorAll('.scale_small_text') as NodeListOf<HTMLElement>;
		smalls.forEach(small => {
			const currentSize = parseFloat(getComputedStyle(small).fontSize);
			let newSize = Math.round(currentSize * factor);
			if (newSize < 17) newSize = 17;
			small.style.fontSize = newSize + "px";
		});
	
	});

	// padding
	const paddings = treeBox.querySelectorAll('.scale_pading') as NodeListOf<HTMLElement>;
	paddings.forEach(pading => {
		const currentPadding = parseFloat(getComputedStyle(pading).padding);
		const tmpp = currentPadding * factor;
		pading.style.padding = Math.max(tmpp, 7) + "px";
	});

	// border radius
	let roundeds = treeBox.querySelectorAll('.scale_rounded_1') as NodeListOf<HTMLElement>;
	roundeds.forEach(rounded => {
		const currentRadius = parseFloat(getComputedStyle(rounded).borderRadius);
		const tmpp = currentRadius * factor;
		rounded.style.borderRadius = Math.max(tmpp, 18) + "px";
	});
	  roundeds = treeBox.querySelectorAll('.scale_rounded_2') as NodeListOf<HTMLElement>;
	roundeds.forEach(rounded => {
		const currentRadius = parseFloat(getComputedStyle(rounded).borderRadius);
		const tmpp = currentRadius * factor;
		rounded.style.borderRadius = Math.max(tmpp, 15) + "px";
	});

	// spaces
	const spaces = treeBox.querySelectorAll('.space') as NodeListOf<HTMLElement>;
	spaces.forEach(space => {
		// height
		const currentHeight = parseFloat(getComputedStyle(space).height);
		const tmph = currentHeight * factor;
		space.style.height = Math.max(tmph, 150)  + "px";
	})

	// spaces
	const root_spacer = treeBox.querySelectorAll('.root_spacer') as NodeListOf<HTMLElement>;
	root_spacer.forEach(space => {
		const current = parseFloat(getComputedStyle(space).width);
		const tmp = current * factor;
		space.style.width = Math.max(tmp, 25)  + "px";
	})
	
}

function tree_actions() {
	const treeBoxParent = document.getElementById('tree_parent');
	const touch 		= document.getElementById('touch_screen');
	const treeBox 		= document.getElementById('tree_holder') as HTMLElement;
	const fg 			= document.getElementById('fg');

	if (touch && treeBox && fg)
	{
		let isDragging = false;
		let lastX = 0;
		let lastY = 0;
		let dragDistance = 0;

		touch.addEventListener('mousedown', (event) => {
			if (event.button === 0) {
				isDragging = true;
				lastX = event.clientX;
				lastY = event.clientY;
				dragDistance = 0;
			}
		});

		touch.addEventListener('mouseup', (event) => {
			if (event.button === 0) {
				isDragging = false;
			}
		});

		touch.addEventListener('mousemove', (event) => {
			if (isDragging) {
				const deltaX = event.clientX - lastX;
				const deltaY = event.clientY - lastY;
				dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
				lastX = event.clientX;
				lastY = event.clientY;

				if (treeBoxParent) {
					const currentLeft = parseFloat(treeBox.style.left) || (treeBoxParent.offsetWidth/2)  - (treeBox.offsetWidth/2);
					const currentTop  = parseFloat(treeBox.style.top)  || (treeBoxParent.offsetHeight/2) - (treeBox.offsetHeight/2);
					treeBox.style.left = `${currentLeft + deltaX}px`;
					treeBox.style.top  = `${currentTop + deltaY}px`;
				}

			}
		});

		touch.addEventListener('wheel', (event) => {
			if (event.deltaY > 0) 	{scale(0.9, treeBox);}
			else { scale(1.1, treeBox); }
		});

		touch.addEventListener('click', event => {
			// to dont triger on drag event
			if (dragDistance < 5) {
				touch.style.pointerEvents = 'none';
				fg.style.pointerEvents = 'none';

				const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
				if (target) {
					const evt = new MouseEvent('click', {
						bubbles: true,
						cancelable: true,
						view: window,
						clientX: event.clientX,
						clientY: event.clientY,
						button: event.button
					});
					target.dispatchEvent(evt);
				}

				touch.style.pointerEvents = '';
				fg.style.pointerEvents = '';
			}
		});
	}
}

async function getReady(status: boolean) 
{
	const ready  = document.getElementById('wr_readyBtn');
	const text   = document.getElementById('wr_ready_text');
	if (status) {
		ready?.classList.remove('border-catpuccin-red'  );
		ready?.classList.add   ('border-catpuccin-green');

		text?.classList.remove('text-catpuccin-red'  );
		if (text) {text.textContent = "Ready";}
		text?.classList.add   ('text-catpuccin-green');
	} 
	else {
		ready?.classList.remove('border-catpuccin-green');
		ready?.classList.add   ('border-catpuccin-red'  );

		text?.classList.remove('text-catpuccin-green');
		if (text) {text.textContent = "Get Ready";}
		text?.classList.add   ('text-catpuccin-red'  );
	}
}

async function finish(tree : TreeNode) {
	// wait to be sure the page is loaded
	await sleep (500);

	// hide unusefull menus
	document.getElementById('spectator')?.classList.add('hidden');
	document.getElementById('bottom_bar')?.classList.add('hidden');

	// finish bar
	const finisher1 = Number(tree.score.p1);
	const finisher2 = Number(tree.score.p2);
	const winer_pp    = (finisher1 > finisher2)? tree.p1.login: tree.p2.login;
	const winer_uname = (finisher1 > finisher2)? tree.p1.alias: tree.p2.alias;
	document.getElementById('finish_bar')?.classList.remove('hidden');
	(document.getElementById('winer_pp') as HTMLImageElement).src = '/api/user/'+winer_pp+'/avatar';
	(document.getElementById('winer_uname') as HTMLElement).textContent = winer_uname;
	evlistener('exit_wr', 'click', ()=>{
		window.location.hash = '#home';
	});
}

async function waitingRoom() {
	
	let ready = false;

	get_api('/api/tournament/info')
		.then(async res => {
			if (res.ok) {
				const data = res.json_data;

				// tree
				const root = await generate_tree_root('tree_holder', data.tree);
				const holder = document.getElementById('tree_holder');
				if (holder && root) {
					holder.innerHTML = '';
					holder.appendChild(root);
				}

				tree_actions();

				// finish 
				if (res.json_data.isFinish && res.json_data.isFinish == true) {
					finish(res.json_data.tree);
					return;
				}

				// next opponent 
				if (data.nextOpponent) {
					const elem = document.getElementById('next_opponent');
					const pp = document.getElementById('pp') as HTMLImageElement;
					if (elem) { elem.textContent = data.nextOpponent.alias; }
					if (pp) { pp.src = '/api/user/' + data.nextOpponent.login + '/avatar'; }
				} else {
					document.getElementById('bottom_bar')?.classList.add('hidden');
					document.getElementById('loser_bar')?.classList.remove('hidden');
				}

				getReady(res.json_data.isReady);
				ready = res.json_data.isReady;
			} else {
				window.location.hash = '#home'
			}
		})

	evlistener('wr_readyBtn', 'click', () => {
		get_api('/api/tournament/ready')
			.then(res => {
				if (!res.ok) { notify_error('network error'); }
				else {
					ready = !ready;
					getReady(ready);
				}
			});
	});
}

export {waitingRoom, finish}