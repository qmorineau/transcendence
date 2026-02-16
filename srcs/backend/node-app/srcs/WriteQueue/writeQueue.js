class WriteQueue {
    constructor() {
        this.queue = [];
        this.running = false;
    }

    push(job) {
        this.queue.push(job);
        if (!this.running)
            this.drain();
    }

    async drain() {
        this.running = true;
        try {
            while (this.queue.length) {
                const job = this.queue.shift();
                try { await job(); }
                catch (error) { console.error("DB Write failed", error); }
            }
        } finally {
            this.running = false;
        }
    }
}

export const writes = new WriteQueue();