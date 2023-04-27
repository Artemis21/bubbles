/** Code resposible for the actual PageRank implementation. */

/** A single page in a single simulation of the PageRank algorithm. */
export class Page {
    /** The current score of the page. */
    public score = 1;

    private newScore = 0;

    /**
     * Create a new page to calculate the score for.
     *
     * @param name A readable name for the page, unique among the other pages in the simulation.
     * @param links The names of the other pages that this page links to.
     */
    constructor(public name: string, public links: string[]) {}

    /**
     * Calculate the new score for this page, but do not save it yet.
     *
     * This is useful to allow all pages to calculate their new score "simultaneously",
     * so that they can use the old score of each other page.
     *
     * @param pages The other pages in the simulation.
     * @returns Whether the score has changed significantly since the last iteration.
     */
    calculateNew(pages: Pages): boolean {
        this.newScore = 1 - pages.damping;
        for (const page of pages.pages) {
            if (page.links.includes(this.name)) {
                this.newScore += (pages.damping * page.score) / page.links.length;
            }
        }
        return Math.abs(this.newScore - this.score) < 0.0001;
    }

    /** Save the new score for this page, as calculated by the last call to `calculateNew`. */
    saveNew() {
        this.score = this.newScore;
    }
}

/** All the pages in a single simulation of the PageRank algorithm. */
export class Pages {
    /** The number of iterations that have been run so far. */
    public tick = 0;

    /**
     * Create a new set of pages to calculate the scores for.
     *
     * @example
     * ```ts
     * const pages = new Pages(0.85, [
     *     new Page("A", ["B", "C"]),
     *     new Page("B", ["C"]),
     *     new Page("C", ["A"]),
     * ]);
     * ```
     *
     * @param damping The damping factor to use for the simulation.
     * @param pages The pages to calculate the scores for.
     */
    constructor(public damping: number, public pages: Page[]) {}

    /**
     * Update the scores of all the pages in the simulation for a single iteration.
     *
     * @returns Whether the scores have stabilised.
     */
    update(): boolean {
        this.tick++;
        let stable = true;
        for (const page of this.pages) {
            stable &&= page.calculateNew(this);
        }
        for (const page of this.pages) {
            page.saveNew();
        }
        return stable;
    }

    /** Get the score of a given page. */
    getScore(name: string): number {
        const page = this.pages.find(p => p.name === name);
        if (!page) {
            throw new Error(`Page ${name} not found`);
        }
        return page.score;
    }

    /** Remove a given page. */
    remove(name: string) {
        this.pages = this.pages.filter(p => p.name !== name);
    }

    /** Add a new page. */
    add(name: string) {
        this.pages.push(new Page(name, []));
    }

    /** Add a link between two pages. */
    link(from: string, to: string) {
        const page = this.pages.find(p => p.name === from);
        if (!page) {
            throw new Error(`Page ${from} not found`);
        }
        page.links.push(to);
    }

    /** Remove a link between two pages. */
    unlink(from: string, to: string) {
        const page = this.pages.find(p => p.name === from);
        if (!page) {
            throw new Error(`Page ${from} not found`);
        }
        page.links = page.links.filter(p => p !== to);
    }

    /** Reset all page scores. */
    reset() {
        for (const page of this.pages) {
            page.score = 1;
        }
        this.tick = 0;
    }
}
