import { get_api } from "./tools/api-calls.js";
import { evlistener } from "./tools/utils.js";
import { create_child_from_file } from "./tools/utils.js";
function rankingLogic() {
    get_api('/api/stats/ranking').then((res) => {
        if (res.ok) {
            const list = document.getElementById('ranking');
            if (list) {
                let i = 1;
                res.json_data.forEach((el) => {
                    create_child_from_file(list, 'modules/ranking/ranking_elem.html')
                        .then(child => {
                        if (child) {
                            child.querySelector('#rank_pp').src = '/api/user/' + el.login + '/avatar';
                            child.querySelector('#rank_count').textContent = i + '.';
                            if (!el.login) {
                                el.login = '[deleted user]';
                            }
                            child.querySelector('#rank_uname').textContent = el.login;
                            child.querySelector('#rank_elo').textContent = el.elo;
                            i++;
                        }
                    });
                });
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
export { rankingLogic };
