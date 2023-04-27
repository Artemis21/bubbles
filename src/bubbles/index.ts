/** The code responsible for actually rendering the graph, using HTML & CSS (not Canvas). */
import "./bubbles.sass";
import Arrow from "./arrows";
import Bubble from "./bubble";
import Vec2 from "../vec2";

export type Event = "bubbleCreate" | "bubbleDelete" | "arrowCreate" | "arrowDelete";
type Handler = (...args: string[]) => void;

/** A class which manages rendering of all the bubbles and arrows. */
export default class Bubbles {
    /** All currently rendered bubbles, by name. */
    public bubbles = new Map<string, Bubble>();

    /** Event handlers grouped by event. */
    private eventHandlers = new Map<string, Handler[]>();

    /** Create a new bubble renderer in the given element. */
    constructor(public parent: HTMLDivElement) {
        this.parent.classList.add("bubbles");
        let nextId = 1;
        parent.ondblclick = () => this.add(`Page ${nextId++}`);
    }

    /** Add a new bubble with the specified name (must be unique). */
    public add(name: string): void {
        this.bubbles.set(name, new Bubble(this, name));
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

    /**
     * Draw an arrow from one bubble to another (an arrow in the opposite direction
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
    public fire(event: Event, ...args: string[]): void {
        const handlers = this.eventHandlers.get(event) ?? [];
        handlers.forEach(handler => handler(...args));
    }

    /** Register a callback for an event. */
    public on(event: Event, callback: Handler): void {
        const handlers = this.eventHandlers.get(event) ?? [];
        handlers.push(callback);
        this.eventHandlers.set(event, handlers);
    }

    /** Remove a callback for an event. */
    public removeHandler(event: Event, callback: Handler): void {
        const handlers = this.eventHandlers.get(event) ?? [];
        this.eventHandlers.set(
            event,
            handlers.filter(handler => handler !== callback),
        );
    }

    /** Clear everything rendered. */
    public clear(): void {
        this.bubbles.forEach(bubble => bubble.delete());
        this.bubbles.clear();
    }
}
