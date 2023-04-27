/** The code responsible for actually rendering the graph, using HTML & CSS (not Canvas). */
import Vec2 from "./vec2";
import "./bubbles.sass";

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

/**
 * One of the nodes/particles, rendered as a div displaying its name and score, and with
 * a size proportional to its score.
 */
class Bubble {
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
    public size: number = 1;

    /** How many colours we have allocated so far. */
    private static colourIndex = 0;

    /** Render a new bubble. */
    constructor(private bubbles: Bubbles, public name: string) {
        bubbles.fire("bubbleCreate", name);
        this.el = document.createElement("div");
        this.el.dataset.bubble = name;
        this.el.classList.add("bubble");
        this.el.style.setProperty("--bubble-colour", COLOURS[Bubble.colourIndex++ % COLOURS.length]);
        this.el.addEventListener("mousedown", (e) => {
            new GhostArrow(this.bubbles, this, e);
        });
        this.el.addEventListener("click", (e) => {
            if (e.shiftKey) {
                this.delete();
            }
        });

        this.nameEl = document.createElement("div");
        this.nameEl.classList.add("bubble__name");
        this.el.appendChild(this.nameEl);

        this.scoreEl = document.createElement("div");
        this.scoreEl.classList.add("bubble__score");
        this.el.appendChild(this.scoreEl);

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
}

abstract class ArrowBase {
    protected el: HTMLDivElement;

    constructor(protected bubbles: Bubbles) {
        this.el = document.createElement("div");
        this.el.classList.add("arrow");
        this.bubbles.parent.appendChild(this.el);
    }

    protected abstract getFromAndTo(): [Vec2, Vec2];

    /** Update the relevant CSS variables to display this arrow in the right place. */
    public update(): void {
        const [from, to] = this.getFromAndTo();
        const delta = to.sub(from);
        this.el.style.setProperty("--arrow-x", `${from.x}px`);
        this.el.style.setProperty("--arrow-y", `${from.y}px`);
        this.el.style.setProperty("--arrow-angle", `${delta.angle()}rad`);
        this.el.style.setProperty("--arrow-length", `${delta.length()}px`);
    }

    /** Stop rendering this arrow. */
    public delete(): void {
        this.bubbles.parent.removeChild(this.el);
    }
}

/** An arrow connecting two particles, rendered as a rotated div. */
class Arrow extends ArrowBase {
    /** Render a new arrow, and register it with the relevant bubbles. */
    constructor(bubbles: Bubbles, public from: Bubble, public to: Bubble) {
        super(bubbles);
        this.el.addEventListener("click", () => this.delete());
        from.arrowsFrom.push(this);
        to.arrowsTo.push(this);
        bubbles.fire("arrowCreate", from.name, to.name);
        this.update();
    }

    public getFromAndTo(): [Vec2, Vec2] {
        const direction = this.to.pos.sub(this.from.pos).asUnit();
        const fromEdge = this.from.pos.add(direction.mul(this.from.size / 2));
        const toEdge = this.to.pos.sub(direction.mul(this.to.size / 2));
        return [fromEdge, toEdge];
    }

    /** Stop rendering this arrow and deregister it from the relevant bubbles. */
    public delete(): void {
        this.bubbles.fire("arrowDelete", this.from.name, this.to.name);
        super.delete();
        this.from.arrowsFrom = this.from.arrowsFrom.filter(arrow => arrow !== this);
        this.to.arrowsTo = this.to.arrowsTo.filter(arrow => arrow !== this);
    }
}

class GhostArrow extends ArrowBase {
    private to: Vec2;

    constructor(bubbles: Bubbles, private from: Bubble, e: MouseEvent) {
        super(bubbles);
        this.el.classList.add("arrow--ghost");

        this.to = new Vec2(e.clientX, e.clientY).sub(new Vec2(this.bubbles.parent.getBoundingClientRect().left, this.bubbles.parent.getBoundingClientRect().top));
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.onMouseUp(e));
        this.update();
    }

    private onMouseMove(e: MouseEvent): void {
        this.to.x += e.movementX;
        this.to.y += e.movementY;
        this.update();
    }

    public getFromAndTo(): [Vec2, Vec2] {
        const direction = this.to.sub(this.from.pos).asUnit();
        const fromEdge = this.from.pos.add(direction.mul(this.from.size / 2));
        return [fromEdge, this.to];
    }

    private onMouseUp(e: MouseEvent): void {
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
        this.delete();
        let to;
        if (e.target instanceof HTMLDivElement) {
            if (e.target.dataset.bubble) {
                to = e.target.dataset.bubble;
            } else if (e.target.parentElement?.dataset.bubble) {
                to = e.target.parentElement.dataset.bubble;
            }
        }
        if (to && this.from.name !== to) {
            this.bubbles.removeArrow(this.from.name, to); // Ensure there is only one.
            this.bubbles.addArrow(this.from.name, to);
        }
    }
}

export type Event = "bubbleCreate" | "bubbleDelete" | "arrowCreate" | "arrowDelete";
type Handler = (...args: any[]) => void;

/** A class which manages rendering of all the bubbles and arrows. */
export default class Bubbles {
    /** All currently rendered bubbles, by name. */
    public bubbles: Map<string, Bubble> = new Map()

    /** Event handlers grouped by event. */
    private eventHandlers: Map<string, Handler[]> = new Map();

    /** Create a new bubble renderer in the given element. */
    constructor(public parent: HTMLDivElement) {
        this.parent.classList.add("bubbles");
        let nextId = 1;
        parent.ondblclick = () => this.add(`Page ${nextId++}`);
    }

    /** Add a new bubble with the specified name (must be unique). */
    public add(name: string): void {
        this.bubbles.set(name, new Bubble(
            this,
            name,
        ));
    }

    /** Remove the bubble with the given name. */
    public remove(name: string): void {
        const bubble = this.bubbles.get(name);
        if (bubble) {
            bubble.delete();
            this.bubbles.delete(name);
        }
    }

    /** Update the position of a specific bubble. */
    public setPosition(name: string, pos: Vec2): void {
        const bubble = this.bubbles.get(name);
        if (bubble) {
            bubble.setPosition(pos);
        }
    }

    /** Update the size of a specific bubble. */
    public setSize(name: string, size: number): void {
        const bubble = this.bubbles.get(name);
        if (bubble) {
            bubble.setSize(size);
        }
    }

    /** Update the score of a specific bubble. */
    public setScore(name: string, score: number): void {
        const bubble = this.bubbles.get(name);
        if (bubble) {
            bubble.setScore(score);
        }
    }

    /** Draw an arrow from one bubble to another (an arrow in the opposite direction
     * can be added) with a second call.
     */
    public addArrow(from: string, to: string): void {
        const fromBubble = this.bubbles.get(from);
        const toBubble = this.bubbles.get(to);
        if (fromBubble && toBubble) {
            new Arrow(this, fromBubble, toBubble);
        }
    }

    /** Remove any arrows going from one bubble to another (but not the other way around). */
    public removeArrow(from: string, to: string): void {
        const fromBubble = this.bubbles.get(from);
        const toBubble = this.bubbles.get(to);
        if (fromBubble && toBubble) {
            fromBubble.arrowsFrom.forEach(arrow => {
                if (arrow.from === fromBubble && arrow.to === toBubble) {
                    arrow.delete();
                }
            });
        }
    }

    /** Send a new event out. */
    public fire(event: Event, ...args: any[]): void {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => handler(...args));
    }

    /** Register a callback for an event. */
    public on(event: Event, callback: Handler): void {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.push(callback);
        this.eventHandlers.set(event, handlers);
    }

    /** Remove a callback for an event. */
    public removeHandler(event: Event, callback: Handler): void {
        const handlers = this.eventHandlers.get(event) || [];
        this.eventHandlers.set(event, handlers.filter(handler => handler !== callback));
    }
}
