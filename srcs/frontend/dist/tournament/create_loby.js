import { evlistener } from "../tools/utils.js";
import { getValueFromInput } from "../tools/utils.js";
import { post_json_api } from "../tools/api-calls.js";
function create_loby() {
    // submit logic
    evlistener('create_loby_form', 'submit', async (event) => {
        document.getElementById('create_lobby_btn').disabled = true;
        event.preventDefault();
        // get the txt zone
        let pseudo = await getValueFromInput('pseudo');
        const slider = document.getElementById('max_players');
        if (pseudo && slider) {
            // send to api
            let max = 2 ** (Number(slider.value) + 1);
            post_json_api({ alias: pseudo, maxPlayer: max }, '/api/tournament/create')
                .then(res => {
                document.getElementById('create_lobby_btn').disabled = false;
                // write error / exit
                const error_box = document.getElementById('error_box');
                if (!res.ok && error_box && res.json_data) {
                    error_box.innerHTML = res.json_data.error;
                }
                else {
                    window.location.hash = "lobby";
                }
            });
        }
    });
}
export { create_loby };
