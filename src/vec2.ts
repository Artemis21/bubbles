/** Utility class for simple operations on 2D vectors. */
export default class Vec2 {
    constructor(public x: number, public y: number) {}

    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    mul(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vec2 {
        return new Vec2(this.x / scalar, this.y / scalar);
    }

    /** Increment this vector in-place by another vector. */
    inc(other: Vec2): void {
        this.x += other.x;
        this.y += other.y;
    }

    /**
     * @returns The magnitude of this vector.
     */
    length(): number {
        return Math.hypot(this.x, this.y);
    }

    /**
     * @returns The direction of this vector in radians clockwise from the positive x-axis.
     */
    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * @returns The absolute distance between this vector and another.
     */
    distance(other: Vec2): number {
        return this.sub(other).length();
    }

    /**
     * @returns A new vector with the same direction as this one, but with a magnitude of 1.
     */
    asUnit(): Vec2 {
        return this.div(this.length());
    }

    /**
     * @returns A random vector with a magnitude of 1.
     */
    static randomUnit(): Vec2 {
        const angle = Math.random() * Math.PI * 2;
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }
}
