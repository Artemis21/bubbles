import Arrow, { GhostArrow } from "./arrows";
import Bubbles from "./index";
import Vec2 from "../vec2";

const COLOURS = [
    "#b58900",
    "#cb4b16",
    "#dc322f",
    "#d33682",
    "#6c71c4",
    "#268bd2",
    "#2aa198",
    "#859900",
];

const makeDiv = (className: string, children: HTMLElement[] = []): HTMLDivElement => {
    const el = document.createElement("div");
    el.className = className;
    for (const child of children) el.appendChild(child);
    return el;
};

/**
 * One of the nodes/particles, rendered as a div displaying its name and score, and with
 * a size proportional to its score.
 */
export default class Bubble {
    /** The element used to render this bubble. */
    private el: HTMLDivElement;

    /** The element rendering the name within this bubble. */
    private nameEl: HTMLDivElement;

    /** The element rendering the score within this bubble. */
    private scoreEl: HTMLDivElement;

    /** The arrows pointing away from this bubble. */
    public arrowsFrom: Arrow[] = [];

    /** The arrows pointing towards this bubble. */
    public arrowsTo: Arrow[] = [];

    /** The current position of this bubble. */
    public pos: Vec2 = new Vec2(0, 0);

    /** The current size of this bubble. */
    public size = 1;

    /** How many colours we have allocated so far. */
    private static colourIndex = 0;

    /** Render a new bubble. */
    constructor(private bubbles: Bubbles, public name: string) {
        bubbles.fire("bubbleCreate", name);
        this.nameEl = makeDiv("bubble__name");
        this.scoreEl = makeDiv("bubble__score");
        this.el = makeDiv("bubble", [this.nameEl, this.scoreEl]);
        this.el.dataset.bubble = name;
        this.el.style.setProperty(
            "--bubble-colour",
            COLOURS[Bubble.colourIndex++ % COLOURS.length],
        );
        this.el.addEventListener("mousedown", e => {
            new GhostArrow(this.bubbles, this, e);
        });
        this.el.addEventListener("click", e => {
            if (e.shiftKey) {
                this.delete();
            } else {
                bubbles.select(this);
            }
        });
        this.update();
        this.bubbles.parent.appendChild(this.el);
    }

    /** Set the position of this bubble and update its display. */
    public setPosition(pos: Vec2): void {
        this.pos = pos;
        this.update();
    }

    /** Set the size of this bubble and update its display. */
    public setSize(size: number): void {
        this.size = size;
        this.update();
    }

    /** Set the score of this bubble and update its display. */
    public setScore(score: number): void {
        this.scoreEl.innerText = score.toFixed(2);
    }

    /** Update the relevant CSS variables to show this bubble correctly, as well as relevant arrows. */
    private update(): void {
        this.el.style.setProperty("--bubble-x", `${this.pos.x}px`);
        this.el.style.setProperty("--bubble-y", `${this.pos.y}px`);
        this.el.style.setProperty("--bubble-size", `${this.size}px`);
        this.nameEl.innerText = this.name;
        this.scoreEl.innerText = this.size.toFixed(2);
        this.arrowsFrom.forEach(arrow => arrow.update());
        this.arrowsTo.forEach(arrow => arrow.update());
    }

    /** Stop rendering this bubble. */
    public delete(): void {
        this.arrowsFrom.forEach(arrow => arrow.delete());
        this.arrowsTo.forEach(arrow => arrow.delete());
        this.bubbles.parent.removeChild(this.el);
        this.bubbles.fire("bubbleDelete", this.name);
        this.bubbles.bubbles.delete(this.name);
    }

    public select(): void {
        this.el.classList.add("bubble--selected");
        this.bubbles.fire("bubbleSelect", this.name);
    }

    public deselect(): void {
        this.el.classList.remove("bubble--selected");
        this.bubbles.fire("bubbleDeselect", this.name);
    }
}
