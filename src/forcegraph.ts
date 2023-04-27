/** Code for calculating the position of nodes in a force-directed graph. */
import Vec2 from "./vec2";

/** A single particle in a force-directed graph. */
class Particle {
    /**
     * The size of the particle - this determines how close other particles are
     * allowed to get to it.
     */
    public size = 1;

    /** The current position of the particle. */
    public pos: Vec2 = Vec2.randomUnit();

    /** The current velocity of the particle. */
    private vel: Vec2 = Vec2.randomUnit();

    constructor(public name: string) {}

    /**
     * Move the particle according to the given acceleration, taking into account its current
     * velocity and the damping factor.
     *
     * @param accel The acceleration to apply to the particle.
     * @param damping A damping factor (between 0 and 1), which accounts for miscellanous energy loss.
     */
    move(accel: Vec2, damping: number): void {
        this.vel = this.vel.add(accel).mul(damping);
        this.pos = this.pos.add(this.vel);
    }
}

/** Simulation settings for a force-directed spring graph. */
interface Settings {
    /**
     * The spring constant controls the strength with which each spring pulls. Since this is the
     * same for all springs it should not have a huge effect on the positions particles settle in,
     * but higher values might make particles settle more quickly. Conversely higher values might
     * make particles more likely to "overshoot", so I'm not sure - more experimentation is needed.
     *
     * The default value is `0.005`.
     */
    springConstant?: number;
    /**
     * How many times stronger a spring should be when it is pushing two particles apart as opposed
     * to pulling them together. This can be any value >0.
     *
     * The default value is `10`.
     */
    repulsionFactor?: number;
    /**
     * How much space particles should have around them in square units. This acts more like an
     * upper bound, set the `size` of particles for a lower bound.
     *
     * The default value is `100`.
     */
    targetDensity?: number;
    /**
     * A value by which velocity is multiplied each tick, used to simulate energy dissipation due
     * to air resistance etc. The simulation should settle into a stable state when
     * `0 <= damping <= 1`.
     *
     * The default value is `0.9`.
     */
    damping?: number;
}

/** A class for simulating a force-directed spring graph. */
export default class Graph {
    /** All the particles in the graph. */
    public particles: Particle[] = [];

    /**
     * The weights connecting each pair of particles.
     *
     * The key is of the form `a\0b` where `a` and `b` are the names of the particles. There may
     * be two entries for each pair (the other being `b\0a`), which is useful for directed graphs.
     * The maximum weight between two particles is used. The weight represents the strength of the
     * spring connecting the two particles - the default is 0, which means there is no spring.
     */
    private weights = new Map<string, number>();

    // Settings, explained in the Settings type.
    private springConstant: number;

    private targetDensity: number;

    private damping: number;

    private repulsionFactor: number;

    /**
     * Create a new, empty graph.
     *
     * @param settings The settings for the simulation.
     */
    constructor({
        springConstant = 0.005,
        targetDensity = 100,
        damping = 0.9,
        repulsionFactor = 10,
    }: Settings = {}) {
        this.springConstant = springConstant;
        this.targetDensity = targetDensity;
        this.damping = damping;
        this.repulsionFactor = repulsionFactor;
    }

    private getParticle(name: string): Particle | undefined {
        return this.particles.find(p => p.name === name);
    }

    private static pairKey(a: Particle, b: Particle): string {
        return `${a.name}\0${b.name}`;
    }

    public addParticle(name: string): void {
        this.particles.push(new Particle(name));
    }

    public removeParticle(name: string): void {
        this.particles = this.particles.filter(p => p.name !== name);
    }

    /**
     * Change the size of a particle.
     *
     * This determines how close other particles are allowed to get to it - the default is 1.
     *
     * @param name The name of the particle to resize.
     * @param size The new size of the particle.
     */
    public resizeParticle(name: string, size: number): void {
        const particle = this.getParticle(name);
        if (particle) {
            particle.size = size;
        } else {
            throw new Error(`Tried to resize particle ${name} but it doesn't exist`);
        }
    }

    /**
     * Set the weight of the spring connecting two particles.
     *
     * The weight represents the strength of the spring connecting the two particles - the default
     * is 0, which means there is no spring. The weight is the same for both directions, if you set
     * the weight in both directions the maximum weight is used.
     *
     * To unset a weight, set it to 0.
     *
     * @param a The name of the first particle.
     * @param b The name of the second particle.
     * @param weight The new weight of the spring connecting the two particles.
     */
    public setWeight(a: string, b: string, weight: number): void {
        const particleA = this.getParticle(a);
        const particleB = this.getParticle(b);
        if (!particleA || !particleB) {
            throw new Error(
                `Tried to set weight between ${a} and ${b} but one or both don't exist`,
            );
        }
        this.weights.set(Graph.pairKey(particleA, particleB), weight);
    }

    /** Force a particle to go to a specific point. */
    public setParticlePosition(name: string, pos: Vec2): void {
        const particle = this.getParticle(name);
        if (particle) {
            particle.pos = pos;
        } else {
            throw new Error(
                `Tried to set position of particle ${name} but it doesn't exist`,
            );
        }
    }

    /** Get the effective weight of the edge between two particles. */
    private getWeight(a: Particle, b: Particle): number {
        return Math.max(
            0,
            this.weights.get(Graph.pairKey(a, b)) ?? 0,
            this.weights.get(Graph.pairKey(b, a)) ?? 0,
        );
    }

    private particleAcceleration(particle: Particle): Vec2 {
        return this.particles
            .filter(p => p !== particle)
            .map(sibling => {
                const weight = this.getWeight(particle, sibling);
                const minDistance = particle.size + sibling.size;
                const maxDistance =
                    Math.sqrt(this.particles.length) * this.targetDensity;
                const springLength = Math.max(maxDistance - weight, minDistance);
                const extension = particle.pos.distance(sibling.pos) - springLength;
                let force = this.springConstant * extension;
                if (force < 0) {
                    force *= this.repulsionFactor;
                }
                const direction = sibling.pos.sub(particle.pos).asUnit();
                return direction.mul(force);
            })
            .reduce((a, b) => a.add(b), new Vec2(0, 0));
    }

    /** Update the position of all particles after one iteration. */
    public step(): void {
        this.particles
            .map<[Particle, Vec2]>(p => [p, this.particleAcceleration(p)])
            .forEach(([p, a]) => p.move(a, this.damping));
    }
}
