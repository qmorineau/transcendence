import { generate_tree_root } from "../tournament/tree_gen.js";
import { TreeNode           } from "../tournament/tree_gen.js";
import { finish             } from "../tournament/waitingRoom.js"
import { get_api            } from "../tools/api-calls.js";

async function tournament(data: any) {
	// switch to pong
	if ('match' in data) { window.location.hash = "pong"; }
}

async function tournamentInfo(data: any) {
	if (data.tree) {
		generate_tree_root('tree_holder', data.tree as TreeNode).then ((root) => {
			const holder = document.getElementById('tree_holder');
			if (holder && root) {
				holder.innerHTML = '';
				holder.appendChild(root);
			}
		});
		if (data.isFinish) {finish(data.tree);}
	}

	get_api('/api/tournament/nextOpponent').then((res)=>{ if (res.ok) {

		const opp  = document.getElementById('next_opponent') as HTMLElement;
		const oppp = document.getElementById('pp') 			  as HTMLImageElement;
		const next = res.json_data.nextOpponent;

		if (next) { 
			if (opp ) { opp.textContent = next.alias; }
			if (oppp) { oppp.src = '/api/user/' + next.login + '/avatar'; }
		}
		else {
			document.getElementById('bottom_bar')?.classList.add    ('hidden');
			document.getElementById('loser_bar' )?.classList.remove ('hidden');
		}
	}})
}

export { tournament, tournamentInfo }