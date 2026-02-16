import { load_file_in_sub_div } from "./utils.js";
const dial = document.getElementById('dial');
async function close_dial() {
    dial.classList.add('pointer-events-none');
    dial.classList.remove('opacity-100');
    dial.classList.add('opacity-0');
}
async function dialsetup() {
    dial?.addEventListener('click', (event) => {
        if (event.target === dial) {
            dial.classList.add('pointer-events-none');
            dial.classList.remove('opacity-100');
            dial.classList.add('opacity-0');
        }
    });
}
async function dial_window(page, fct) {
    // put content
    await load_file_in_sub_div(dial, '.dial_content', page);
    fct();
    // show the dial
    dial.classList.remove('pointer-events-none');
    dial.classList.remove('opacity-0');
    dial.classList.add('opacity-100');
}
export { dialsetup, dial_window, close_dial };
