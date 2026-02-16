import { 
	load_file_in_div2,
	load_file_in_sub_div,
	load_file_as_string,
	createElementFromHTML
} from "../tools/utils.js";

import { pong         } from "../game/pong.js"
import { get_api      } from "../tools/api-calls.js";
import { notify_error } from "../notifs.js"

interface TreeNode {
	p1   : { alias: string, login: string};
	p2   : { alias: string, login: string};

	score : { p1: number, p2: number };
	id    : string;

	left : TreeNode | null;
	right: TreeNode | null;
}

enum TreeType {
	Left,
	Right
}


async function create_match_overview(root: Element, node: TreeNode, type: string) {
	// load main match 
	const match_overview = await load_file_in_sub_div(root, type, './modules/tournament/tree/match_overview.html');

	// scores
	if (node.score && match_overview) {
		(match_overview.querySelector('.score_p1') as HTMLElement).textContent = '' + node.score.p1;
		(match_overview.querySelector('.score_p2') as HTMLElement).textContent = '' + node.score.p2;

		// Calculate the percentage for p1
		const total = node.score.p1 + node.score.p2;
		let percent;
		if (node.score.p1 == 10) { percent = 100; }
		else if (node.score.p2 == 10) { percent = 0; }
		else {
			percent = total === 0 ? 50 : Math.round((node.score.p1 / total) * 100);
		}

		// Set the gradient as an inline style
		const gradient = `linear-gradient(to bottom, var(--color-catpuccin-peach) 0%, var(--color-catpuccin-peach) ${percent}%, var(--color-catpuccin-sapphire) ${percent}%, var(--color-catpuccin-sapphire) 100%)`;
		(match_overview.querySelector('.match_overview') as HTMLElement).style.background = gradient;
	}

	//pp
	if (node.p1 && node.p2 && match_overview) {
		(match_overview.querySelector('.pp1') as HTMLImageElement).src = '/api/user/' + node.p1.login + '/avatar';
		(match_overview.querySelector('.pp2') as HTMLImageElement).src = '/api/user/' + node.p2.login + '/avatar';
	}

	//alias
	if (node.p1 && node.p2 && match_overview) {
		(match_overview.querySelector('.p1_alias') as HTMLElement).textContent = node.p1.alias;
		(match_overview.querySelector('.p2_alias') as HTMLElement).textContent = node.p2.alias;
	}

	// create match id
	if (node.id) { match_overview?.setAttribute('id', node.id + ''); }
	else         { match_overview?.setAttribute('id', ''); }

	// click to spectate match
	match_overview?.addEventListener('click', () => {
		const div = document.getElementById('spectator');
		const msg = document.getElementById('not_spectating');
		const canva = document.getElementById('renderCanvas');
		const id = match_overview.getAttribute('id');

		if (id && id != '') {
			get_api('/api/game/watching/' + id).then((res) => {
				if (res.ok) {
					// make it big
					msg?.classList.add('hidden');
					canva?.classList.remove('hidden');
					div?.classList.remove('w-10');
					div?.classList.add('flex-1');

					// triger game logic
					pong(true, true);
				} else {
					notify_error('match finished (notif to rm)');
				}
			})
		}
		else {
			notify_error('not playing (notif to rm)');
		}
	});
}

async function generate_tree_root(parent: string, node: TreeNode) {
	// load tree root
	const root = createElementFromHTML(await load_file_as_string('./modules/tournament/tree/tree_root.html') as string);

	if (root)
	{
		create_match_overview(root, node, '.root_head');

		// create left
		if (node.left) {
			let left = root.querySelector('.root_left') as Element;
			generate_tree(left, TreeType.Left, node.left);
		}

		// create right
		if (node.right) {
			let right = root.querySelector('.root_right') as Element;
			generate_tree(right, TreeType.Right, node.right);
		}
	}
	return root;
	
}


async function generate_tree(parent : Element, type: TreeType, node: TreeNode) {

	if (!parent) {return;}

	let root;

	if (type == TreeType.Left) {
		root = await load_file_in_div2(parent, './modules/tournament/tree/l_tree_group.html');
	} else {
		root = await load_file_in_div2(parent, './modules/tournament/tree/r_tree_group.html');
	}

	if (root) {

		create_match_overview(root, node, '.tree_group_head');

		// gen childs
		if (node.left) {
			let left = root.querySelector('.tree_group_child_left') as Element;
			generate_tree(left, type, node.left);
		}
		if (node.right) {
			let right = root.querySelector('.tree_group_child_right') as Element;
			generate_tree(right, type, node.right);
		}
	}
}

export {generate_tree_root, TreeNode}