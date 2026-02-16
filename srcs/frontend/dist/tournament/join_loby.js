import { evlistener } from "../tools/utils.js";
import { getValueFromInput } from "../tools/utils.js";
import { post_json_api } from "../tools/api-calls.js";
import { notify_error } from "../notifs.js";
import { close_dial } from "../tools/dial.js";
function join_loby() {
    const otp = [];
    for (let i = 1; i < 7; i++) {
        // create the elem in the array
        otp[i] = document.getElementById('otp' + i);
        // next on char typed
        if (i != 6) {
            otp[i]?.addEventListener('input', () => {
                if (otp[i].value.length === 1) {
                    if (otp[i + 1].value.length != 0) {
                        otp[i + 1].value = "";
                    }
                    otp[i + 1].focus();
                }
            });
        }
        otp[i]?.addEventListener('keydown', (event) => {
            // only num
            if (isNaN(parseInt(event.key, 10)) && !["Backspace", "Enter", "Tab"].includes(event.key)) {
                event.preventDefault();
            }
            // back on backspace
            if (event.key == 'Backspace' && otp[i].value.length === 0 && i != 1) {
                otp[i - 1].value = "";
                otp[i - 1].focus();
            }
        });
        otp[i]?.addEventListener('focus', () => {
            // if empty go to precedent
            if (i != 1 && otp[i - 1].value == "") {
                otp[i - 1]?.focus();
            }
        });
    }
    ;
    // submit logic
    evlistener('join_loby_form', 'submit', async (event) => {
        event.preventDefault();
        document.getElementById('join_lobby_btn').disabled = true;
        // get the txt zone
        let pseudo = await getValueFromInput('pseudo');
        let code = '';
        for (let i = 1; i < 7; i++) {
            code += otp[i].value;
        }
        if (pseudo) {
            // send to api
            post_json_api({ room: Number(code), alias: pseudo }, '/api/tournament/join')
                .then(res => {
                // write error / exit
                document.getElementById('join_lobby_btn').disabled = false;
                if (!res.ok) {
                    notify_error(res.json_data.error);
                }
                else {
                    window.location.hash = "lobby";
                    close_dial();
                }
            });
        }
    });
}
export { join_loby };
