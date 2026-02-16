import { post_json_api } from "./tools/api-calls.js";
import { me_api } from "./tools/api-calls.js";
import { signin_api } from "./tools/api-calls.js";
import { login_api } from "./tools/api-calls.js";
import { load_file_in_div } from "./tools/utils.js";
import { createWS } from "./tools/ws.js";
import { mfa_login } from "./mfa.js";
import { getValueFromInput, evlistener } from "./tools/utils.js";
function get_back() {
    let login_page = document.getElementById('login_page');
    createWS();
    let tmp = window.udef_pending_hash;
    window.udef_pending_hash = "";
    if (login_page) {
        login_page.style.display = 'none';
    }
    window.location.hash = tmp;
}
// logic of signin page
async function signin_logic() {
    let login_page = document.getElementById('login_page');
    if (login_page) {
        // load page modules
        await load_file_in_div('in_main', 'modules/signin/signin.html');
        await load_file_in_div('in_sec', 'modules/signin/to_login.html');
        // display
        login_page.style.display = 'flex';
    }
    // submit signin logic
    evlistener('signin_form', 'submit', async (event) => {
        event.preventDefault();
        document.getElementById('signin_btn')?.setAttribute('disabled', 'true');
        // get the txt zone
        let fname = await getValueFromInput('signin_fname');
        let lname = await getValueFromInput('signin_lname');
        let login = await getValueFromInput('signin_uname');
        let paswd = await getValueFromInput('signin_paswd');
        if (login && paswd) {
            // send to api
            signin_api({ login: login, password: paswd, firstName: fname, lastName: lname })
                .then(res => {
                document.getElementById('signin_btn')?.removeAttribute('disabled');
                // write error / exit
                const error_box = document.getElementById('error_box');
                if (!res.ok && error_box && res.json_data) {
                    error_box.innerHTML = res.json_data.error;
                }
                else {
                    get_back();
                }
            });
        }
    });
    // goto login
    evlistener('to_login', 'click', async () => { login_logic(); });
    evlistener('to_login2', 'click', async () => { login_logic(); });
}
// logic of login page
async function login_logic() {
    let login_page = document.getElementById('login_page');
    if (login_page) {
        // load page modules
        await load_file_in_div('in_main', 'modules/login/login.html');
        await load_file_in_div('in_sec', 'modules/login/to_signin.html');
        // display
        login_page.style.display = 'flex';
    }
    // submit login logic
    evlistener('login_form', 'submit', async (event) => {
        event.preventDefault();
        document.getElementById('login_button')?.setAttribute('disabled', 'true');
        // get the txt zone
        let login = await getValueFromInput('login_uname');
        let paswd = await getValueFromInput('login_paswd');
        if (login && paswd) {
            // send to api
            login_api({ login: login, password: paswd })
                .then(res => {
                document.getElementById('login_button')?.removeAttribute('disabled');
                // write error / exit
                const error_box = document.getElementById('error_box');
                if (!res.ok && error_box && res.json_data) {
                    error_box.innerHTML = res.json_data.error;
                }
                else {
                    if (res.json_data.twoFA) {
                        mfa_login(res.json_data.twoFA);
                    }
                    else {
                        get_back();
                    }
                }
            });
        }
    });
    // guest login
    evlistener('login_guest', 'click', async () => {
        document.getElementById('login_guest')?.setAttribute('disabled', 'true');
        post_json_api({}, '/api/user/guest').then((res) => {
            document.getElementById('login_guest')?.removeAttribute('disabled');
            if (res.ok) {
                get_back();
            }
        });
    });
    // goto signin
    evlistener('to_signin', 'click', async () => { signin_logic(); });
    evlistener('to_signin2', 'click', async () => { signin_logic(); });
}
async function loged_out() {
    let loged_in = await me_api();
    return (!loged_in);
}
export { login_logic, loged_out, get_back };
