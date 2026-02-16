import { loged_out } from "../login.js";
import { login_logic } from "../login.js";
import { create_menu } from "../menus/menu.js";
import { goto_page } from "./page_loader.js";
import { create_loby } from "../tournament/create_loby.js";
import { join_loby } from "../tournament/join_loby.js";
import { in_lobby } from "../tournament/lobby.js";
import { waitingRoom } from "../tournament/waitingRoom.js";
import { home } from "../menus/home.js";
import { friends } from "../friend.js";
import { profile } from "../profile.js";
import { pong } from "../game/pong.js";
import { get_api } from "../tools/api-calls.js";
import { post_json_api } from "../tools/api-calls.js";
import { evlistener } from "../tools/utils.js";
import { notify_error } from "../notifs.js";
import { dial_window } from "../tools/dial.js";
import { rankingLogic } from "../ranking.js";
// globals
window.udef_old_hash = window.location.hash;
window.udef_pending_hash = "";
var prevent_next = false;
// redirect to the page linked to the #
async function location_manager() {
    // prevent
    if (prevent_next) {
        prevent_next = false;
        return;
    }
    // action on page exit
    if (window.udef_old_hash != window.location.hash && window.udef_old_hash != '') {
        if (window.udef_old_hash === '#lobby' && window.location.hash != '#waiting_room') {
            post_json_api({}, '/api/tournament/leave');
        }
        else if (window.udef_old_hash === '#waiting_room' && window.location.hash != '#pong') {
            post_json_api({}, '/api/tournament/leave');
        }
        else if (window.udef_old_hash.search('#pong') == 0) {
            const res = await get_api('/api/game/isInGame');
            if (res.json_data.game.isInGame) {
                prevent_next = true;
                window.location.hash = window.udef_old_hash;
                return;
            }
        }
    }
    if (window.location.hash === "#login_signin") {
        // handle case where the user load the login page directly
        const elem = document.getElementById('login_page');
        if (elem) {
            if (window.getComputedStyle(elem).display === 'none') {
                if (await loged_out()) {
                    login_logic();
                    return;
                }
                else {
                    window.location.hash = "#home";
                    return;
                }
            }
        }
        return;
    }
    const currentHash = window.location.hash;
    // login logic
    if (await loged_out()) {
        // go to login and pend hash
        login_logic();
        window.udef_pending_hash = currentHash;
        window.location.hash = "#login_signin";
        return;
    }
    // menus																			   back      pages
    const guest = (window.udef_title === 'GUEST');
    //other
    if (currentHash === '#create') {
        await goto_page('tournament/create.html', () => create_loby());
    }
    else if (currentHash === '#lobby') {
        await goto_page('tournament/lobby.html', () => in_lobby());
    }
    else if (currentHash === '#waiting_room') {
        await goto_page('tournament/waiting_room.html', () => waitingRoom());
    }
    else if (currentHash === '#friends') {
        await goto_page('friends/friends.html', () => friends());
    }
    else if (currentHash.search('#profile') == 0 && !guest) {
        await goto_page('profile/profile.html', () => profile());
    }
    else if (currentHash === '#pong') {
        await goto_page('game/pong.html', () => pong(true, false));
    }
    else if (currentHash === '#pong-local') {
        await goto_page('game/pong.html', () => pong(false, false));
    }
    else if (currentHash === '#matchmaking') {
        await goto_page('matchmaking.html', () => { get_api('/api/play'); });
    }
    else if (currentHash === '#ranking' && !guest) {
        await goto_page('ranking/ranking.html', () => { rankingLogic(); });
    }
    else if (currentHash === '#home') {
        await create_menu("home", ["play", "profile", "ranking"]);
        home();
    }
    else if (currentHash === '#play') {
        await create_menu("play", ["home", "matchmaking", "create"]);
        // play other btns
        evlistener('TrainingBtn', 'click', () => {
            get_api('/api/private/ai').then((res) => { if (!res.ok) {
                notify_error(res.json_data.error);
            } });
        });
        evlistener('joinBtn', 'click', () => {
            dial_window('modules/dial/join.html', () => { join_loby(); });
        });
        evlistener('localgameBtn', 'click', () => {
            // code to start the 1v1
            get_api('/api/private/local').then(res => {
                if (res.ok) {
                    window.location.hash = '#pong-local';
                }
                else {
                    notify_error('unexpected error');
                }
            });
        });
    }
    // nothing ? -> home
    else {
        window.location.hash = 'home';
    }
    window.udef_old_hash = window.location.hash;
}
export { location_manager };
