import { dial_window } from "./dial.js";
import { close_dial } from "./dial.js";
import { evlistener } from "./utils.js";
async function confirm_dial(msg, yes) {
    dial_window('/modules/dial/confirm.html', () => {
        document.getElementById('confirm_message').textContent = msg;
        evlistener('confirm_yes', 'click', () => { close_dial(); yes(); });
        evlistener('confirm_no', 'click', () => { close_dial(); });
    });
}
export { confirm_dial };
