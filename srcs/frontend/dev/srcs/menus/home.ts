async function home() {
	if (window.udef_title === 'GUEST') {
		document.getElementById('profileBtn')?.classList.add('hidden');
		document.getElementById('rankingBtn')?.classList.add('hidden');
	}
}

export {home}
