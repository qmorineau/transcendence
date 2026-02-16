import { get_api                } from "./tools/api-calls.js";
import { evlistener             } from "./tools/utils.js";
import { create_child_from_file } from "./tools/utils.js";

function rankingLogic() {

    get_api('/api/stats/ranking').then((res) => {
        if (res.ok) {
            const list = document.getElementById('ranking');
            if (list) {
                let i : number = 1;
                res.json_data.forEach((el: any) => {
                    create_child_from_file(list, 'modules/ranking/ranking_elem.html')
                        .then(child => {
                            if (child) {
                                (child.querySelector('#rank_pp'   ) as HTMLImageElement).src = '/api/user/' + el.login + '/avatar';

                                (child.querySelector('#rank_count') as HTMLElement).textContent = i + '.';
                                if (!el.login) {el.login = '[deleted user]'}
                                (child.querySelector('#rank_uname') as HTMLElement).textContent = el.login;
                                (child.querySelector('#rank_elo'  ) as HTMLElement).textContent = el.elo;
                                i++;
                            }
                        })
                })
            }
        }
    });

    // load annimation
	requestAnimationFrame(() => {
		const profile = document.getElementById('ranking');
		if (profile) {
			profile.offsetHeight; // reflow
			profile.classList.remove('opacity-0');
			profile.classList.add('opacity-100');
		}
	});

    evlistener('transBtn', 'click', () => {
        window.location.hash = '#home';
    });
}

export {rankingLogic}