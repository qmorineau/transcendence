import { get_api } from "./tools/api-calls.js";
import { dial_window } from "./tools/dial.js";
import { close_dial } from "./tools/dial.js";
import { notify_error } from "./notifs.js";
import { notify_succes } from "./notifs.js";
import { post_json_api } from "./tools/api-calls.js";
import { get_back } from "./login.js";
import { otp } from "./otp.js";
import { evlistener } from "./tools/utils.js";
import { confirm_dial } from "./tools/confirm.js";
async function mfa() {
    const mfa = document.getElementById('mfa');
    const res = (await get_api('/api/user/2faStatus'));
    if (res.ok) {
        if (res.json_data.twoFA && res.json_data.twoFA == true) {
            // disable 2fa
            document.getElementById('disable_2fa')?.classList.remove('hidden');
            evlistener('disable_2fa', 'click', () => {
                confirm_dial('Are you sure to live in this insecure world without 2fa ?', () => {
                    post_json_api({}, '/api/user/2faDisable').then(res => {
                        if (res.ok) {
                            notify_succes('2fa disabled');
                            document.getElementById('disable_2fa')?.classList.add('hidden');
                        }
                        else {
                            notify_error(res.json_data.error);
                        }
                    });
                });
            });
            return;
        }
    }
    else {
        return;
    }
    mfa?.classList.remove('hidden');
    mfa?.addEventListener('click', () => {
        dial_window('modules/dial/mfa.html', () => {
            otp((code) => {
                post_json_api({ 'token': code }, '/api/user/2faVerify').then((res) => {
                    if (!res.ok) {
                        notify_error('wrong code');
                    }
                    else {
                        close_dial();
                        notify_succes('2FA successfully added');
                        const mfa = document.getElementById('mfa');
                        mfa?.classList.add('hidden');
                    }
                });
            });
        })
            .then(() => {
            document.getElementById('qr').src = '/api/user/2faSetup?nocache=' + new Date().getTime();
        });
    });
}
function mfa_login(uuid) {
    dial_window('modules/dial/mfa_login.html', () => {
        otp((code) => {
            post_json_api({ token: code, uuid: uuid }, '/api/user/2faValidate')
                .then((res) => {
                if (res.ok) {
                    get_back();
                    close_dial();
                }
            });
        });
    });
}
export { mfa, mfa_login };
