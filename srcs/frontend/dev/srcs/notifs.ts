import { createElementFromString } from "./tools/utils.js";
import { evlistener              } from "./tools/utils.js";
import { sleep 					 } from "./tools/utils.js"

async function notify_info(body: string) {
	const notif_box = document.getElementById('notif_box');
	const element = createElementFromString('' 
+ '<div class="notif w-full h-[100px] flex flex-row bg-catpuccin-base border border-catpuccin-yellow rounded-xl overflow-hidden">'
+ '    <div class="h-full w-[15px] bg-catpuccin-yellow"></div>'
+ '    <div class="flex-1 h-full flex flex-col p-3 gap-3">'
+ '        <h3 class="text-xl font-title"><i class="bi bi-info-circle-fill"> </i>Info</h3>'
+ '        <p class="text">' + body + '</p>'
+ '    </div>'
+ '</div>'
) as Node;
	notif_box?.appendChild(element);
	await sleep(5000);
	notif_box?.removeChild(element);
}

async function notify_social(body: string) {
	const notif_box = document.getElementById('notif_box');
	const element = createElementFromString('' 
+ '<div class="notif w-full h-[100px] flex flex-row bg-catpuccin-base border border-catpuccin-mauve rounded-xl overflow-hidden">'
+ '    <div class="h-full w-[15px] bg-catpuccin-mauve"></div>'
+ '    <div class="flex-1 h-full flex flex-col p-3 gap-3">'
+ '        <h3 class="text-xl font-title"><i class="bi bi-people-fill"> </i>Friend</h3>'
+ '        <p class="text">' + body + '</p>'
+ '    </div>'
+ '</div>'
) as Node;
	notif_box?.appendChild(element);
	await sleep(5000);
	notif_box?.removeChild(element);
}

async function notify_succes(body: string) {
	const notif_box = document.getElementById('notif_box');
	const element = createElementFromString('' 
+ '<div class="notif w-full h-[100px] flex flex-row bg-catpuccin-base border border-catpuccin-green rounded-xl overflow-hidden">'
+ '    <div class="h-full w-[15px] bg-catpuccin-green"></div>'
+ '    <div class="flex-1 h-full flex flex-col p-3 gap-3">'
+ '        <h3 class="text-xl font-title"><i class="bi bi-check-circle-fill"> </i>Success</h3>'
+ '        <p class="text">' + body + '</p>'
+ '    </div>'
+ '</div>'
) as Node;
	notif_box?.appendChild(element);
	await sleep(5000);
	notif_box?.removeChild(element);
}

async function notify_error(body: string) {
	const notif_box = document.getElementById('notif_box');
	const element = createElementFromString('' 
+ '<div class="notif w-full h-[100px] flex flex-row bg-catpuccin-base border border-catpuccin-red rounded-xl overflow-hidden">'
+ '    <div class="h-full w-[15px] bg-catpuccin-red"></div>'
+ '    <div class="flex-1 h-full flex flex-col p-3 gap-3">'
+ '        <h3 class="text-xl font-title"><i class="bi bi-x-circle-fill"> </i>Error</h3>'
+ '        <p class="text">' + body + '</p>'
+ '    </div>'
+ '</div>'
) as Node;
	notif_box?.appendChild(element);
	await sleep(5000);
	notif_box?.removeChild(element);
}

async function notify_ask(title:string, body: string, b1: string, f1:() => void, b2:string, f2:() => void) {
	const notif_box = document.getElementById('notif_box');
	const element = createElementFromString('' 
+ '<div class="notif w-full h-[130px] flex flex-row bg-catpuccin-base border border-catpuccin-peach rounded-xl overflow-hidden">'
+ '    <div class="h-full w-[15px] bg-catpuccin-peach"></div>'
+ '    <div class="flex-1 h-full flex flex-col p-3 gap-3">'
+ '        <h3 class="text-xl font-title"><i class="bi bi-question-square-fill"></i> ' + title +'</h3>'
+ '        <p class="text">' + body + '</p>'
+ '        <div class="flex flex-row gap-10 items-center">'
+ '            <button id="b1">'+ b1 +'</button>'
+ '            <button id="b2">'+ b2 +'</button>'
+ '        </div>'
+ '    </div>'
+ '</div>'
) as Node;
	notif_box?.appendChild(element);

	evlistener('b1', 'click', () => {
		f1();
		notif_box?.removeChild(element);
	});

	evlistener('b2', 'click', () => {
		f2();
		notif_box?.removeChild(element);
	});

	await sleep(10000);
	notif_box?.removeChild(element);


}

export { notify_info, notify_error, notify_ask, notify_succes, notify_social }