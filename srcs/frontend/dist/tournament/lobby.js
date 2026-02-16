import { get_api } from "../tools/api-calls.js";
import { post_json_api } from "../tools/api-calls.js";
import { createElementFromString } from "../tools/utils.js";
import { evlistener } from "../tools/utils.js";
import { notify_error } from "../notifs.js";
import { notify_info } from "../notifs.js";
async function getReady(status) {
    const ready = document.getElementById('lobby_readyBtn');
    const text = document.getElementById('lobby_ready_text');
    if (status) {
        ready?.classList.remove('border-catpuccin-red');
        ready?.classList.add('border-catpuccin-green');
        text?.classList.remove('text-catpuccin-red');
        if (text) {
            text.textContent = "Ready";
        }
        text?.classList.add('text-catpuccin-green');
    }
    else {
        ready?.classList.remove('border-catpuccin-green');
        ready?.classList.add('border-catpuccin-red');
        text?.classList.remove('text-catpuccin-green');
        if (text) {
            text.textContent = "Get Ready";
        }
        text?.classList.add('text-catpuccin-red');
    }
}
function createUserInLobby(player_list, alias, login, ready) {
    const player_div = createElementFromString('<div class="' + alias + ' flex flex-row items-center rounded-full p-3 pr-6 gap-5 border '
        + (ready ? 'border-catpuccin-green' : 'border-catpuccin-red')
        + ' min-w-[350px]"> <img src="/api/user/' + login + '/avatar" alt=" " class="aspect-square h-12 rounded-full object-cover"> <p class="font-title text-2xl">'
        + alias
        + '</p></div>');
    if (player_div) {
        player_list.appendChild(player_div);
    }
}
function editReadyStatus(player_list, alias, ready) {
    const player_div = player_list.querySelector('.' + alias);
    if (ready) {
        player_div?.classList.remove('border-catpuccin-red');
        player_div?.classList.add('border-catpuccin-green');
    }
    else {
        player_div?.classList.remove('border-catpuccin-green');
        player_div?.classList.add('border-catpuccin-red');
    }
}
function popUserInLobby(player_list, alias) {
    const player_div = player_list.querySelector('.' + alias);
    player_div?.remove();
}
async function in_lobby() {
    get_api('/api/lobby')
        .then(res => {
        if (!res.ok) {
            window.location.hash = "online";
            notify_error("You don't belong to this lobby");
        }
        else {
            const playersObj = res.json_data.players;
            const players = Object.values(playersObj);
            const player_list = document.getElementById('player_list');
            if (player_list) {
                for (const player of players) {
                    createUserInLobby(player_list, player.alias, player.login, player.isReady);
                }
            }
            // set ready btn status
            getReady(res.json_data.userIsReady);
            // set lobby code
            const lobby_code = document.getElementById("lobby_code");
            if (lobby_code) {
                lobby_code.textContent = res.json_data.lobby;
            }
        }
    });
    evlistener('lobby_readyBtn', 'click', () => {
        get_api('/api/lobby/ready')
            .then(res => {
            if (!res.ok) {
                notify_error('network error');
            }
            else {
                getReady(res.json_data.isReady);
            }
        });
    });
    evlistener('lobby_exit', 'click', () => {
        post_json_api({}, '/api/tournament/leave')
            .then(res => {
            if (!res.ok) {
                notify_error('Impossible to leave lobby');
            }
            else {
                window.location.hash = "home";
            }
        });
    });
    evlistener('lobby_startBtn', 'click', () => {
        post_json_api({}, '/api/tournament/start')
            .then(res => {
            if (!res.ok) {
                notify_info('Not everyone is ready to start');
            }
        });
    });
}
async function ws_lobby(data) {
    const player_list = document.getElementById('player_list');
    if (player_list && "join" in data) {
        createUserInLobby(player_list, data?.join, data?.login, false);
    }
    if (player_list && "leave" in data) {
        popUserInLobby(player_list, data?.leave);
    }
    if (player_list && "ready" in data) {
        editReadyStatus(player_list, data?.ready?.alias, data?.ready?.isReady);
    }
    if (player_list && "start" in data) {
        window.location.hash = 'waiting_room';
    }
}
export { in_lobby, ws_lobby };
