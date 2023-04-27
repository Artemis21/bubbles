import Bubble from "./bubble";
import Bubbles from "./index";
import Vec2 from "../vec2";

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
export default class Arrow extends ArrowBase {
    /** Render a new arrow, and register it with the relevant bubbles. */
    constructor(bubbles: Bubbles, public from: Bubble, public to: Bubble) {
        super(bubbles);
        this.el.addEventListener("click", e => {
            if (e.shiftKey) {
                this.delete();
            } else {
                bubbles.select(this);
            }
        });
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
    public override delete(): void {
        this.bubbles.fire("arrowDelete", this.from.name, this.to.name);
        super.delete();
        this.from.arrowsFrom = this.from.arrowsFrom.filter(arrow => arrow !== this);
        this.to.arrowsTo = this.to.arrowsTo.filter(arrow => arrow !== this);
    }

    public select(): void {
        this.el.classList.add("arrow--selected");
        this.bubbles.fire("arrowSelect", this.from.name, this.to.name);
    }

    public deselect(): void {
        this.el.classList.remove("arrow--selected");
        this.bubbles.fire("arrowDeselect", this.from.name, this.to.name);
    }
}

export class GhostArrow extends ArrowBase {
    private to: Vec2;

    private mouseUpListener: (e: MouseEvent) => void;

    private mouseMoveListener: (e: MouseEvent) => void;

    constructor(bubbles: Bubbles, private from: Bubble, e: MouseEvent) {
        super(bubbles);
        this.el.classList.add("arrow--ghost");
        this.to = new Vec2(e.clientX, e.clientY).sub(
            new Vec2(
                this.bubbles.parent.getBoundingClientRect().left,
                this.bubbles.parent.getBoundingClientRect().top,
            ),
        );
        this.mouseUpListener = this.onMouseUp.bind(this);
        this.mouseMoveListener = this.onMouseMove.bind(this);
        window.addEventListener("mouseup", this.mouseUpListener);
        window.addEventListener("mousemove", this.mouseMoveListener);
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
        window.removeEventListener("mousemove", this.mouseMoveListener);
        window.removeEventListener("mouseup", this.mouseUpListener);
        this.delete();
        if (!(e.target instanceof HTMLElement)) {
            return;
        }
        const to = e.target.dataset.bubble ?? e.target.parentElement?.dataset.bubble;
        if (to && this.from.name !== to) {
            this.bubbles.removeArrow(this.from.name, to); // Ensure there is only one.
            this.bubbles.addArrow(this.from.name, to);
        }
    }
}
