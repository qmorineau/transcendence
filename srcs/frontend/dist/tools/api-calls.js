async function login_api(user) {
    const headers = new Headers();
    headers.set('Content-type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('UUID', window.udef_uuid);
    const request = new Request('/api/user/login', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(user)
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return { json_data: null, ok: false, status_code: 0 };
    }
    return {
        json_data: await res.json(),
        ok: res.ok,
        status_code: res.status
    };
}
async function signin_api(user) {
    const headers = new Headers();
    headers.set('Content-type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('UUID', window.udef_uuid);
    const request = new Request('/api/user/register', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(user)
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return { json_data: null, ok: false, status_code: 0 };
    }
    return {
        json_data: await res.json(),
        ok: res.ok,
        status_code: res.status
    };
}
async function me_api() {
    const headers = new Headers();
    headers.set('UUID', window.udef_uuid);
    const request = new Request('/api/me', {
        method: 'GET',
        headers: headers,
        body: null
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return false;
    }
    let data;
    try {
        data = await res.json();
    }
    catch (e) {
        window.udef_whoami = "";
        return res.ok;
    }
    if (res.ok && data && data.login) {
        window.udef_whoami = data.login;
        window.udef_title = data.title;
    }
    else {
        window.udef_whoami = "";
    }
    return (res.ok);
}
async function tree_api() {
    const headers = new Headers();
    headers.set('UUID', window.udef_uuid);
    const request = new Request('/api/test', {
        method: 'GET',
        headers: headers,
        body: null
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return { json_data: null, ok: false, status_code: 0 };
    }
    return {
        json_data: await res.json(),
        ok: res.ok,
        status_code: res.status
    };
}
async function post_json_api(data, route) {
    const headers = new Headers();
    headers.set('Content-type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('UUID', window.udef_uuid);
    const request = new Request(route, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return { json_data: null, ok: false, status_code: 0 };
    }
    try {
        return {
            json_data: await res.json(),
            ok: res.ok,
            status_code: res.status
        };
    }
    catch {
        return {
            json_data: null,
            ok: res.ok,
            status_code: res.status
        };
    }
}
async function get_api(route) {
    const headers = new Headers();
    headers.set('UUID', window.udef_uuid);
    const request = new Request(route, {
        method: 'GET',
        headers: headers,
        body: null
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return { json_data: null, ok: false, status_code: 0 };
    }
    return {
        json_data: await res.json(),
        ok: res.ok,
        status_code: res.status
    };
}
async function del_api(data, route) {
    const headers = new Headers();
    headers.set('Content-type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('UUID', window.udef_uuid);
    const request = new Request(route, {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify(data)
    });
    let res;
    try {
        res = await fetch(request);
    }
    catch (e) {
        return false;
    }
    return res.ok;
}
export { login_api, signin_api, me_api, tree_api, post_json_api, get_api, del_api };
