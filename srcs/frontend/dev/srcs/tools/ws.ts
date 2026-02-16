import { tournament     } from "../tournament/tournament.js";
import { tournamentInfo } from "../tournament/tournament.js";
import { ws_lobby       } from "../tournament/lobby.js";
import { game_update    } from "../game/pong.js";
import { game_goal      } from "../game/pong.js"
import { notify_ask, notify_error     } from "../notifs.js";
import { notify_info    } from "../notifs.js";
import { notify_social  } from "../notifs.js";
import { post_json_api  } from "./api-calls.js";
import { uuidv4         } from "./utils.js";
import { get_api        } from "./api-calls.js";

function reco() {
    get_api('/api/isReconnect').then(res => {
        if (res.ok && res.json_data.isReconnecting) {
            switch (res.json_data.redirect) {
                case 'game'   : window.location.hash = '#pong'; break;
                case 'waiting': window.location.hash = '#waiting_room'; break;
            }
        }
    });
}

async function createWS() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    window.udef_ws = new WebSocket(`${protocol}//${host}/api/ws`);
    window.udef_ws.onopen = () => {
        window.udef_uuid = uuidv4();
        if (window.udef_ws.readyState === WebSocket.OPEN) {
            window.udef_ws.send(JSON.stringify({ uuid: window.udef_uuid }));
        }
        reco();
    };

    window.udef_ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if ("lobby" in data) { ws_lobby(data.lobby); }
        if ("tournament" in data) { tournament(data.tournament); }
        if ("tournamentInfo" in data) { tournamentInfo(data.tournamentInfo); }
        if ("game" in data) { game_update(data.game); }
        if ("goal" in data) { game_goal(data.goal); }
        if ("private" in data) {
            if (data.private.start) {
                window.location.hash = '#pong';
            } else {
                notify_info('Your game invite as been declined');
            }
        }

        if ("invite" in data) {
            notify_ask(data.invite.player + ' invited you',
                'wanna play online 1v1 ?',
                'yes', () => {
                    post_json_api({ login: data.invite.player, accept: true }, '/api/private/accept');
                    window.location.hash = "#pong";
                },
                'no', () => {
                    post_json_api({ login: data.invite.player, accept: false }, '/api/private/accept');
                }
            )

        }

        if ("friendRequest" in data) { notify_social(data.friendRequest.player + ' sent you a friend request'); }
        if ("friendStatus"  in data) { 
            if (data.friendStatus.status === 'ONLINE') {
                notify_social(data.friendStatus.player + ' is back online');
            } else {
                notify_social(data.friendStatus.player + ' is gone');
            }
        }
    }
}

export { createWS }