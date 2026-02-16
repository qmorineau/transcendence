import { OnlineStatus } from "./onlineStatus.js";
import { post_json_api } from "./tools/api-calls.js";
import { get_api } from "./tools/api-calls.js";
import { del_api } from "./tools/api-calls.js";
import { create_child_from_file } from "./tools/utils.js";
import { notify_error } from "./notifs.js";
import { notify_succes } from "./notifs.js";
async function friends() {
    const menu = document.getElementById('friend_menu');
    if (menu) {
        menu.classList.remove('hidden');
    }
    const incoming = document.getElementById('friend_requests');
    if (incoming) {
        get_api('/api/friends/incoming')
            .then(res => {
            res.json_data.forEach((el) => {
                create_child_from_file(incoming, 'modules/friends/pending_friend_elem.html')
                    .then(child => {
                    if (child) {
                        // login
                        let login = child.querySelector('.username');
                        if (login) {
                            login.textContent = el.requester.login;
                        }
                        // pp
                        const img = child.querySelector('.pp');
                        if (img) {
                            img.src = '/api/user/' + el.requester.login + '/avatar';
                        }
                        // yes no events
                        const yes = child.querySelector('.yes');
                        const no = child.querySelector('.no');
                        yes?.addEventListener('click', () => {
                            post_json_api({ login: el.requester.login }, '/api/friends/accept')
                                .then(res => {
                                if (res.ok) {
                                    // rm from pending list
                                    child.remove();
                                    // add to friend list
                                    const firends = document.getElementById('friends');
                                    if (friends) {
                                        create_child_from_file(friends, 'modules/friends/friend_elem.html')
                                            .then(child => {
                                            if (child) {
                                                // login
                                                let login = child.querySelector('.username');
                                                if (login) {
                                                    login.textContent = el.requester.login;
                                                }
                                                // pp
                                                const img = child.querySelector('.pp');
                                                if (img) {
                                                    img.src = '/api/user/' + el.requester.login + '/avatar';
                                                }
                                                // rm_friendship
                                                const rm = child.querySelector('.rm_friendship');
                                                rm?.addEventListener('click', () => {
                                                    del_api({ login: el.requester.login }, '/api/friends/' + el.id)
                                                        .then(ok => {
                                                        if (ok) {
                                                            child.remove();
                                                            setTimeout(() => {
                                                                if (friends.childElementCount === 1) {
                                                                    document.getElementById('nofriends')?.classList.remove('hidden');
                                                                }
                                                            }, 0);
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                    // if no friend rm the nofriend div
                                    document.getElementById('nofriends')?.classList.add('hidden');
                                    document.getElementById('friend_separator')?.classList.add('hidden');
                                }
                            });
                        });
                        no?.addEventListener('click', () => {
                            del_api({ login: el.requester.login }, '/api/friends/pending')
                                .then(ok => {
                                if (ok) {
                                    child.remove();
                                }
                            });
                        });
                        // online status
                        OnlineStatus(child, el.requester.login);
                    }
                });
            });
            if (res.json_data.length != 0) {
                document.getElementById('friend_separator')?.classList.remove('hidden');
            }
        });
    }
    const friends = document.getElementById('friends');
    if (friends) {
        get_api('/api/friends/list')
            .then(res => {
            res.json_data.forEach((el) => {
                create_child_from_file(friends, 'modules/friends/friend_elem.html')
                    .then(child => {
                    if (child) {
                        // login
                        let login = child.querySelector('.username');
                        if (login) {
                            login.textContent = el.login;
                        }
                        // pp
                        const img = child.querySelector('.pp');
                        if (img) {
                            img.src = '/api/user/' + el.login + '/avatar';
                        }
                        // rm_friendship
                        const rm = child.querySelector('.rm_friendship');
                        rm?.addEventListener('click', () => {
                            del_api({ login: el.login }, '/api/friends/unfriend')
                                .then(ok => {
                                if (ok) {
                                    child.remove();
                                    setTimeout(() => {
                                        if (friends.childElementCount === 1) {
                                            document.getElementById('nofriends')?.classList.remove('hidden');
                                        }
                                    }, 0);
                                }
                            });
                        });
                        const invite = child.querySelector('.invite_play');
                        invite?.addEventListener('click', () => {
                            get_api('/api/private/' + el.login)
                                .then(res => {
                                if (res.ok) {
                                    notify_succes('Invitation Send');
                                }
                                else {
                                    notify_error(res.json_data.error);
                                }
                            });
                        });
                        // online status
                        OnlineStatus(child, el.login);
                    }
                });
            });
            if (res.json_data.length == 0) {
                create_child_from_file(friends, 'modules/friends/nofriends.html');
            }
        });
    }
}
export { friends };
