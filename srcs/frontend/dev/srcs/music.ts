let max_i = 5;
let i = 0;

let audio = new Audio('/assets/music/ambiant/'+ i +'.mp3');
audio.volume = 0.1;

audio.addEventListener('ended', () => {
    i++;
    if (i > max_i) { i = 0; }
    audio.src = '/assets/music/ambiant/' + i + '.mp3';
    audio.play();
})

function play_ambiant () {
    i = Math.floor(Math.random() * max_i + 1) ;
    audio.src = '/assets/music/ambiant/' + i + '.mp3';
    audio.play();
}
// play_ambiant();

let btnClick = new Audio('/assets/sfx/btn2.mp3')

function play_btn_click() {
    btnHover.volume = 1;
    btnClick.currentTime = 0;
    btnClick.play();
}

let btnHover = new Audio('/assets/sfx/hover.wav')

function play_btn_hover() {
    // btnHover.volume = 1;
    // btnHover.currentTime = 0;
    // btnHover.play();
}

export { play_ambiant, play_btn_click, play_btn_hover}