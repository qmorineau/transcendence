function otp(action: (code: string) => void) {
    const input1 = document.getElementById('input1') as HTMLInputElement;
    const input2 = document.getElementById('input2') as HTMLInputElement;

    input1?.addEventListener('input', () => {
        if (input1.value.length === 3) {
            input2.focus();
        }
    });

    input1?.addEventListener('keydown', (event) => {
        if (isNaN(parseInt(event.key, 10)) && !["Backspace", "Enter"].includes(event.key)) { event.preventDefault(); }
    });

    input2?.addEventListener('keydown', (event) => {
        if (isNaN(parseInt(event.key, 10)) && !["Backspace", "Enter"].includes(event.key)) { event.preventDefault(); }
        if (event.key == 'Backspace' && input2.value.length === 0) {
            input1.value.substring(0, 2);
            input1.focus();
        }
    });

    document.querySelectorAll('#otp input').forEach(input => {
        input.addEventListener('keydown', function (event) {
            if ((event as KeyboardEvent).key === "Enter") {
                event.preventDefault();
                const out = input1.value + input2.value;
                if (out.length == 6) {
                    action(out);
                }
            }
        });
    });
}

export {otp}