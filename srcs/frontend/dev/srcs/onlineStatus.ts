import { get_api } from "./tools/api-calls.js";

function OnlineStatus(holder: Element | null, login: string) {
    if (!holder) { return; }

    const status = holder.querySelector('.onlineStatus');
    if (!status) { return; }

    get_api('/api/user/' + login + '/status')
        .then(res => {
            if (res.ok) {
                if (res.json_data.status === "OFFLINE") {
                    status.classList.add('bg-catpuccin-red');
                } else {
                    status.classList.add('bg-catpuccin-green');
                }
                status.classList.remove('hidden');
            }
        })
}

export {OnlineStatus}