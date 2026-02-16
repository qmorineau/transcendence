import setCookie from "set-cookie-parser";

function fetchToken(res)
{
    const cookies = setCookie.parse(res);

    let token = null;
    for (const cookie of cookies)
    {
        if (cookie.name == "session")
        {
            token = cookie.value;
            break;
        }
    }
    return token;
}

export default fetchToken;