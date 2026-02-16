// get the content of a input field
async function getValueFromInput(name) {
    const elem = document.getElementById(name);
    if (elem) {
        return elem.value;
    }
    else {
        return "";
    }
}
// execute a fct on click event
async function evlistener(name, event_type, fn) {
    const elem = document.getElementById(name);
    if (elem) {
        elem.addEventListener(event_type, fn);
    }
}
// load a html file in a div
async function load_file_in_div(elem, file) {
    const el = document.getElementById(elem);
    if (el) {
        try {
            const response = await fetch(file);
            const html = await response.text();
            el.innerHTML = html;
        }
        catch (err) {
            console.error('Error loading HTML:', err);
        }
    }
    return (el);
}
// html file to sting
async function load_file_as_string(file) {
    try {
        const response = await fetch(file);
        const html = await response.text();
        return (html);
    }
    catch (err) {
        console.error('Error loading HTML:', err);
    }
    return (null);
}
// load a html file in a div
async function load_file_in_div2(el, file) {
    if (el) {
        try {
            const response = await fetch(file);
            const html = await response.text();
            el.innerHTML = html;
        }
        catch (err) {
            console.error('Error loading HTML:', err);
        }
    }
    return (el);
}
function createElementFromString(htmlString) {
    const container = document.createElement('div');
    container.innerHTML = htmlString;
    return container.firstElementChild;
}
// load a html file in a div using querySelector
async function load_file_in_sub_div(parent, elem, file) {
    const el = parent.querySelector(elem);
    if (el) {
        try {
            const response = await fetch(file);
            const html = await response.text();
            el.innerHTML = html;
        }
        catch (err) {
            console.error('Error loading HTML:', err);
        }
    }
    else {
        console.error('Error loading HTML: query elem does not exist');
    }
    return (el);
}
// load a html file in a div using querySelector
async function load_text_in_div(elem, text) {
    const el = document.getElementById(elem);
    if (el) {
        el.innerText = text;
    }
    else {
        console.error('Error loading Text: query elem does not exist');
    }
    return (el);
}
// create a child element in a div and return it
async function create_child_from_file(parent, file) {
    try {
        const response = await fetch(file);
        const html = await response.text();
        const el = createElementFromString(html);
        parent.appendChild(el);
        return (el);
    }
    catch (err) {
        console.error('Error loading HTML:', err);
    }
    return (null);
}
function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
}
// sleep n ms
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// rm all event listener linked to an element
function resetListenersById(Id) {
    const old = document.getElementById(Id);
    if (old) {
        const new_ = old.cloneNode(true);
        old.parentNode?.replaceChild(new_, old);
        return new_;
    }
    return null;
}
// Create an element from an HTML string
function createElementFromHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    return temp.firstElementChild;
}
export { getValueFromInput, evlistener, load_file_in_div, load_file_in_div2, load_file_in_sub_div, createElementFromString, create_child_from_file, load_text_in_div, uuidv4, sleep, resetListenersById, load_file_as_string, createElementFromHTML };
