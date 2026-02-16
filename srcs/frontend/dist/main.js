// create the websocket and uuid in the global space
import { createWS } from "./tools/ws.js";
import { loged_out } from "./login.js";
import { close_dial } from "./tools/dial.js";
import { dialsetup } from "./tools/dial.js";
import { location_manager } from "./location/location_manager.js";
if (!await loged_out()) {
    await createWS();
}
// remove loader when ready
const blur_bg = document.getElementById('blur_bg');
addEventListener('load', () => {
    const load = document.getElementById('load');
    if (blur_bg)
        blur_bg.style.display = 'none';
    if (load)
        load.style.display = 'none';
});
// keyboard ctrls
window.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        // dial box
        const triger = document.getElementById('dial');
        if (triger && triger.classList.contains('opacity-100')) {
            close_dial();
        }
    }
});
// setup the dial module
dialsetup();
// navigation handler
location_manager();
window.addEventListener('hashchange', function () { location_manager(); });
