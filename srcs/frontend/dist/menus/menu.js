import { evlistener } from "../tools/utils.js";
import { load_file_in_div } from "../tools/utils.js";
import { play_btn_click } from "../music.js";
import { play_btn_hover } from "../music.js";
async function change_menu(btns) {
    const menu = document.getElementById("menu");
    btns.forEach((el) => {
        evlistener(el + 'Btn', 'click', async () => {
            play_btn_click();
            // change page
            const onTransitionEnd = () => {
                window.location.hash = el;
                menu.removeEventListener('transitionend', onTransitionEnd);
            };
            menu.addEventListener('transitionend', onTransitionEnd);
            // slide out
            menu.classList.remove('translate-x-0');
            menu.classList.add('translate-x-full');
        });
        evlistener(el + 'Btn', 'mouseover', async () => {
            play_btn_hover();
        });
    });
    evlistener('transBtn', 'click', async () => {
        play_btn_click();
        // change page
        const onTransitionEnd = () => {
            window.location.hash = "home";
            menu.removeEventListener('transitionend', onTransitionEnd);
        };
        menu.addEventListener('transitionend', onTransitionEnd);
        // slide out
        menu.classList.remove('translate-x-0');
        menu.classList.add('translate-x-full');
    });
}
async function create_menu(menuName, pages) {
    await load_file_in_div('app', 'modules/menus/' + menuName + '.html')
        .then(success => {
        if (success) {
            requestAnimationFrame(() => {
                const menu = document.getElementById('menu');
                if (menu) {
                    menu.offsetHeight; // reflow
                    menu.classList.remove('translate-x-full');
                    menu.classList.add('translate-x-0');
                    change_menu(pages);
                }
            });
        }
    });
}
export { create_menu };
