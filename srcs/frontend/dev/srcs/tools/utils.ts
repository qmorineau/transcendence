// get the content of a input field
async function getValueFromInput(name: string) : Promise<string> {
	const elem = document.getElementById(name) as HTMLInputElement | null;
	if (elem) { return elem.value;}
	else 	  { return "";}
}

// execute a fct on click event
async function evlistener(name: string, event_type: string, fn: (event: Event) => void ) {
	const elem = document.getElementById(name) as HTMLButtonElement | null;
	if (elem) {elem.addEventListener(event_type, fn);}
}

// load a html file in a div
async function load_file_in_div(elem: string, file:string) : Promise<Element | null> {
	const el = document.getElementById(elem) as HTMLElement | null;
	if (el) {
		try {
			const response = await fetch(file);
			const html = await response.text();
			el.innerHTML = html;
		}
		catch (err) { console.error('Error loading HTML:', err);}
	}
	return (el);
}

// html file to sting
async function load_file_as_string(file:string) : Promise<string | null> {
	try {
		const response = await fetch(file);
		const html = await response.text();
		return (html);
	}
	catch (err) { console.error('Error loading HTML:', err);}
	return (null);
}

// load a html file in a div
async function load_file_in_div2(el: Element, file:string) : Promise<Element | null> {
	if (el) {
		try {
			const response = await fetch(file);
			const html = await response.text();
			el.innerHTML = html;
		}
		catch (err) { console.error('Error loading HTML:', err);}
	}
	return (el);
}

function createElementFromString(htmlString: string): HTMLElement | null {
	const container = document.createElement('div');
	container.innerHTML = htmlString;
	return (container.firstElementChild as HTMLElement | null);
}

// load a html file in a div using querySelector
async function load_file_in_sub_div(parent: Element, elem: string, file:string) : Promise<Element | null> {
	const el = parent.querySelector(elem) as Element | null;
	if (el) {
		try {
			const response = await fetch(file);
			const html = await response.text();
			el.innerHTML = html;
		}
		catch (err) { console.error('Error loading HTML:', err);}
	}
	else { console.error('Error loading HTML: query elem does not exist');}
	return (el);
}

// load a html file in a div using querySelector
async function load_text_in_div(elem: string, text:string) : Promise<Element | null> {
	const el = document.getElementById(elem) as HTMLElement | null;
	if (el) { el.innerText = text; }
	else 	{ console.error('Error loading Text: query elem does not exist');}
	return (el);
}

// create a child element in a div and return it
async function create_child_from_file(parent: Element, file:string) : Promise<Element | null> {
	try {
		const response = await fetch(file);
		const html = await response.text();
		
		const el = createElementFromString(html);
		parent.appendChild(el as Node);
		return (el);
	}
	catch (err) { console.error('Error loading HTML:', err);}
	return (null);
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}

// sleep n ms
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


// rm all event listener linked to an element
function resetListenersById(Id: string) : HTMLElement | null {
    const old = document.getElementById(Id);
    if (old) {
        const new_ = old.cloneNode(true) as HTMLElement;
        old.parentNode?.replaceChild(new_, old);
        return new_;
    }
    return null;
}

// Create an element from an HTML string
function createElementFromHTML(html: string): Element {
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    return temp.firstElementChild as Element;
}

export {
	getValueFromInput,
	evlistener,
	load_file_in_div,
	load_file_in_div2,
	load_file_in_sub_div,
	createElementFromString,
	create_child_from_file,
	load_text_in_div,
	uuidv4,
	sleep,
	resetListenersById,
	load_file_as_string,
	createElementFromHTML
}