import { friends                } from "./friend.js";
import { del_api                } from "./tools/api-calls.js"
import { post_json_api          } from "./tools/api-calls.js"
import { get_api                } from "./tools/api-calls.js"
import { resetListenersById     } from "./tools/utils.js"
import { load_text_in_div       } from "./tools/utils.js"
import { notify_error           } from "./notifs.js"
import { notify_succes          } from "./notifs.js"
import { evlistener             } from "./tools/utils.js"
import { getValueFromInput      } from "./tools/utils.js"
import { create_child_from_file } from "./tools/utils.js";
import { mfa                    } from "./mfa.js";
import { OnlineStatus           } from "./onlineStatus.js";
import { confirm_dial           } from "./tools/confirm.js";
import { close_dial             } from "./tools/dial.js";

interface Match
{
	type: number
	endedAt: string
	me: string
	opponent: string

	myScore: number
	opponentScore: number
}

async function match_hist(user : string) { 
	const matches = document.getElementById('friends');
	if (matches) {
		get_api('/api/matches/history/'+ user)
		.then ( res => {
			res.json_data.items.forEach((match: Match) => {
				const el = document.getElementById('game_history') as HTMLElement;
				create_child_from_file(el, 'modules/profile/history.html')
				.then ( child => { if (child) {
					// scores
					(child.querySelector('.score_p1') as HTMLElement).textContent = '' + match.myScore ;
					(child.querySelector('.score_p2') as HTMLElement).textContent = '' + match.opponentScore ;
					// pp
					(child.querySelector('.pp_p1')    as HTMLImageElement).src    = '/api/user/' + match.me       + '/avatar';
					(child.querySelector('.pp_p2')    as HTMLImageElement).src    = '/api/user/' + match.opponent + '/avatar';
					// names
					(child.querySelector('.me')       as HTMLElement).textContent = match.me;
					if ((child.querySelector('.enemy') as HTMLElement).textContent != '') {
						(child.querySelector('.enemy')    as HTMLElement).textContent = match.opponent;
					}
				}})
			});
		})
	}
}

function edit_btn(color: string, text: string, icon: string, f:() => void) {
	resetListenersById('big_friendBtn');
    const btn = document.getElementById('big_friendBtn');
    btn?.classList.forEach(cls => {
        if (cls.startsWith('border-catpuccin-')) btn.classList.remove(cls);
    });
    btn?.classList.add(color);

    // btn text
    const txt = btn?.querySelector('.text');
    if (txt) { txt.textContent = text; }

    const iconElem = btn?.querySelector('.icon');
    iconElem?.classList.forEach(cls => {
        if (cls.startsWith('bi-')) iconElem.classList.remove(cls);
    });
    iconElem?.classList.add(icon);
	evlistener('big_friendBtn', 'click', f);
}

async function add_friend(pseudo: string) {
	post_json_api({"login": pseudo}, '/api/friends/request')
	.then( res => {
		if (res.ok) {
			edit_btn('border-catpuccin-yellow', 'Request pending', 'bi-arrow-clockwise', () => {});
		}
		else { notify_error(res.json_data.error); }
	});
}

async function rm_friend(who: string) {
	del_api({ login: who }, '/api/friends/' + who)
		.then(ok => {
			if (ok) {
				edit_btn('border-catpuccin-green', 'Add friend', 'bi-plus-circle-fill', () => { add_friend(who); });
			}
		});
}

async function profile() {

	let who = window.location.hash.substring(9);
	if (!who) {who = window.udef_whoami;}

	// user info
	get_api('/api/user/'+ who + '/names')
	.then ( res => {
		if (!res.ok) {notify_error('The user does not exist'); window.location.hash = 'profile'; return;}
		load_text_in_div('profile_login'    , res.json_data?.login);
		load_text_in_div('profile_firstName', res.json_data?.firstName);
		load_text_in_div('profile_lastName' , res.json_data?.lastName);
	});

	// if my profile
	if (who === window.udef_whoami) {

		// 2FA banner
		mfa();

		// display friends
		friends();

		// image evlistener
		evlistener('profile_pp_holder','mouseover', () => {
			const up = document.getElementById('profile_pp_upload');
			up?.classList.remove('opacity-0');
			up?.classList.add   ('opacity-30');
		})

		evlistener('profile_pp_holder','mouseout', () => {
			const up = document.getElementById('profile_pp_upload');
			up?.classList.remove('opacity-30');
			up?.classList.add   ('opacity-0');
		})

		// change the image
		const displayImg = document.getElementById('profile_pp');
		const fileInput = document.getElementById('image-upload');
		const click_upload = document.getElementById('profile_pp_upload');
		if (!displayImg) console.error('display-image element not found');
		if (!fileInput) console.error('image-upload element not found');
		click_upload?.addEventListener('click', () => { fileInput?.click(); });
		fileInput?.addEventListener('change', function (event) {
			const input = event?.target as HTMLInputElement;
			const file = input?.files?.[0];
			if (!file) return;

			// Update front-end image preview
			const reader = new FileReader();
			reader.onload = function (e) { 
				if (displayImg instanceof HTMLImageElement) {
					displayImg.src = e?.target?.result as string;
				}
			};
			reader.readAsDataURL(file);

			// Send to API
			const formData = new FormData();
			formData.append('image', file);

			fetch('/api/user/me/avatar', {
				method: 'POST',
				body: formData,
			})
				.then (response => response.json())
		});

		// personal info
		(document.getElementById('profile_login')        as HTMLElement).contentEditable = 'true' ;
		(document.getElementById('profile_firstName')    as HTMLElement).contentEditable = 'true' ;
		(document.getElementById('profile_lastName')     as HTMLElement).contentEditable = 'true' ;
		(document.getElementById('profile_password_wrap') as HTMLElement).classList.remove('hidden') ;

		evlistener('profile_login'    , 'input', () => { (document.getElementById('profile_send_update')  as HTMLElement).classList.remove('hidden') ; });
		evlistener('profile_firstName', 'input', () => { (document.getElementById('profile_send_update')  as HTMLElement).classList.remove('hidden') ; });
		evlistener('profile_lastName' , 'input', () => { (document.getElementById('profile_send_update')  as HTMLElement).classList.remove('hidden') ; });
		evlistener('profile_password' , 'input', () => { (document.getElementById('profile_send_update')  as HTMLElement).classList.remove('hidden') ; });

		evlistener('profile_send_update', 'click', () => {
			(document.getElementById('profile_send_update') as HTMLElement).classList.add('hidden');

			const login = (document.getElementById('profile_login')     as HTMLElement).textContent ;
			const fname = (document.getElementById('profile_firstName') as HTMLElement).textContent ;
			const lname = (document.getElementById('profile_lastName')  as HTMLElement).textContent ;
			const pswd  = (document.getElementById('profile_password')  as HTMLInputElement).value;
			if (pswd === '') {
				post_json_api({
					"login": login,
					"firstName": fname,
					"lastName": lname
				}, '/api/user/update')
				.then ( (res) => { if (!res.ok) {
					notify_error(res.json_data.error);
					get_api('/api/user/' + who + '/names')
						.then(res => {
							if (!res.ok) { notify_error('The user does not exist'); window.location.hash = 'profile'; return; }
							load_text_in_div('profile_login', res.json_data?.login);
							load_text_in_div('profile_firstName', res.json_data?.firstName);
							load_text_in_div('profile_lastName', res.json_data?.lastName);
						});
				}
				})
			}
			else {
				post_json_api({
					"login": login,
					"password": pswd,
					"firstName": fname,
					"lastName": lname
				}, '/api/user/update')
				.then ( (res) => { if (!res.ok) {
					notify_error(res.json_data.error);
					get_api('/api/user/' + who + '/names')
						.then(res => {
							if (!res.ok) { notify_error('The user does not exist'); window.location.hash = 'profile'; return; }
							load_text_in_div('profile_login', res.json_data?.login);
							load_text_in_div('profile_firstName', res.json_data?.firstName);
							load_text_in_div('profile_lastName', res.json_data?.lastName);
						});
				}
				})
			}
		});

		document.getElementById('bottom-menu')?.classList.remove('hidden');
		// mini bottom menu
		evlistener('logout', 'click', () => {
			confirm_dial('Are you sure you want to logout ?', () => {
				get_api('/api/user/logout').then(res => {
					if (res.ok) {
						window.udef_ws.close();
						window.location.hash = '#login_signin';
					}
					else {
						notify_error(res.json_data.error);
					}
				});
			});
		});
		// delete account
		evlistener('del_account', 'click', () => {
			confirm_dial('Are you sure to quit us ? :<', () => {
				del_api({}, '/api/user/delete').then(ok => {
					if (ok) {
						window.udef_ws.close();
						window.location.hash = '#login_signin';
					}
					else {
						notify_error('An error occured');
						close_dial();
					}
				});
			});
		})
	}
	// if other profile
	else {

		// show btn menu
		document.getElementById('btn_menu')?.classList.remove('hidden');

		// online
		OnlineStatus(document.getElementById('profile_pp_holder'), who);

		// friend
		const friendBtn = document.getElementById('big_friendBtn');
		friendBtn?.classList.remove('hidden');
		friendBtn?.classList.add   ('flex');
		post_json_api({login: who}, '/api/friends/status')
			.then ( res => {
				if (!res.ok) {  // not friends
					// send friend request btn
					edit_btn('border-catpuccin-green', 'Add friend', 'bi-plus-circle-fill', () => {add_friend(who);});
				}
				else {
					switch (res.json_data.status) {
						case 'ACCEPTED':
							edit_btn('border-catpuccin-red', 'Remove friend', 'bi-x-circle-fill', () => {rm_friend(who);});
							break;
						case 'PENDING':
							edit_btn('border-catpuccin-yellow', 'Request pending', 'bi-arrow-clockwise', () => {});
							(document.getElementById('big_friendBtn') as HTMLButtonElement).disabled = true;
							break;
					}
				}
			})

		// invite to play
		const inviteBtn = document.getElementById('big_inviteBtn');
		inviteBtn?.classList.remove('hidden');
		inviteBtn?.classList.add('flex');	

		evlistener('big_inviteBtn', 'click', async () => {
			get_api('/api/private/' + who)
			.then ( res => {
				if (res.ok) {
					notify_succes('Invitation Send');
				}
				else {
					notify_error(res.json_data.error);
					close_dial();
				}
			});
		});

		// match history
		document.getElementById('hist')?.classList.remove('h-[585px]');
		document.getElementById('hist')?.classList.add('h-[690px]');
	}

	match_hist(who);

	// elo
	get_api('/api/stats/' + who + '/elo')
	.then ( res => {
		load_text_in_div('profile_elo', res.json_data?.elo + ' elo');
	})

	// streaks
	get_api('/api/stats/' + who + '/streak')
	.then( res => {
		load_text_in_div('currentStreak', res.json_data.streak);
		load_text_in_div('bestStreak', res.json_data.bestStreak);
	})

	// playtime
	get_api('/api/matches/played/' + who)
	.then ( res => {
		load_text_in_div('profile_playtime', res.json_data?.duration);
	})

	// match
	get_api('/api/stats/' + who + '/matches/stats')
	.then ( res => {
		let ratio : number;
		if ((res.json_data?.wins + res.json_data?.losses) != 0) {
			ratio = res.json_data?.wins / (res.json_data?.wins + res.json_data?.losses);
			load_text_in_div('profile_win_ratio', (ratio * 100).toFixed(1) + '%' );
		}
		else {
			load_text_in_div('profile_win_ratio', 'NC' );
		}

	})

	// goals
	get_api('/api/stats/' + who + '/goals')
	.then ( res => {
		let ratio : number;
		if ((res.json_data?.scored + res.json_data?.conceded) != 0) {
			ratio = res.json_data?.scored / (res.json_data?.scored + res.json_data?.conceded);
			load_text_in_div('profile_goal_ratio', (ratio * 100).toFixed(1) + '%' );
		}
		else {
			load_text_in_div('profile_goal_ratio', 'NC' );
		}

	})

	// pp 
	const elem = document.getElementById('profile_pp') as HTMLImageElement;
	if (elem) {elem.src ='/api/user/' + who + '/avatar';}

	// search bar
	evlistener('search_profile', 'input', (event) => {
		let val = (event.target as HTMLInputElement).value;
		get_api('/api/user/search/' + val)
			.then(res => {
				if (res.ok) {
					const parent = document.getElementById('sr');
					if (parent) {
						parent.innerHTML = '';
						parent.classList.add('hidden');
						res.json_data.forEach((el: any) => {
							parent.classList.remove('hidden');
							create_child_from_file(parent, '/modules/profile/search_result.html')
								.then(child => {
									// pp
									(child?.querySelector('.sr_pp') as HTMLImageElement).src = '/api/user/' + el.login + '/avatar';

									// uname
									(child?.querySelector('.sr_uname') as HTMLElement).textContent = el.login;
									child?.addEventListener('click', () => {
										window.location.hash = '#profile-'+ el.login;
									}); 
								});
						});
					};
				}
				else {
					const parent = document.getElementById('sr');
					if (parent) {
						parent.innerHTML = '';
						parent.classList.add('hidden');
					};
				}
			})
	});

	const input = document.querySelector('input'); // Reference to your search input

	input?.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const firstResult = document.querySelector('#sr .sr_uname');
			if (firstResult) {
				firstResult?.parentElement?.click();
			}
		}
	});


	evlistener('search_profile_form', 'submit', async (event) => {
		event.preventDefault();
		const login = await getValueFromInput('search_profile');

		get_api('/api/user/'+ login)
		.then ( res => {
			if (res.ok) { window.location.hash = 'profile-' + login; }
		})
	})

	// load annimation
	requestAnimationFrame(() => {
		const profile = document.getElementById('profile');
		if (profile) {
			profile.offsetHeight; // reflow
			profile.classList.remove('opacity-0');
			profile.classList.add('opacity-100');
		}
	});
}

export { profile }
