import "./style.sass";
import Bubbles from "./bubbles";
import { Page, Pages } from "./pagerank";
import ForceGraph from "./forcegraph";
import Vec2 from "./vec2";

const parent = document.querySelector<HTMLDivElement>("#graph")!;
const bubbles = new Bubbles(parent);
const graph = new ForceGraph();
const pages = new Pages(0.85, []);

const centreOffset = new Vec2(parent.clientWidth / 2, parent.clientHeight / 2);

bubbles.on("bubbleCreate", name => {
    graph.addParticle(name);
    graph.resizeParticle(name, 100);
    const page = new Page(name, []);
    pages.pages.push(page);
});
bubbles.on("bubbleDelete", (name) => {
    graph.removeParticle(name);
    pages.pages = pages.pages.filter(page => page.name !== name);
});
bubbles.on("arrowCreate", (from, to) => {
    graph.setWeight(from, to, 1);
    const fromPage = pages.pages.find(page => page.name === from)!;
    fromPage.links.push(to);
});
bubbles.on("arrowDelete", (from, to) => {
    graph.setWeight(from, to, 0);
    const fromPage = pages.pages.find(page => page.name === from)!;
    fromPage.links = fromPage.links.filter(link => link !== to);
});

document.getElementById("damping")!.oninput = (e) => {
    const damping = parseFloat((e.target as HTMLInputElement).value);
    pages.damping = damping;
    document.getElementById("dampingReport")!.textContent = damping.toFixed(2);
};
document.getElementById("reset")!.onclick = () => {
    pages.pages.forEach(page => page.score = 1);
    pages.tick = 0;
};
document.getElementById("clear")!.onclick = () => {
    bubbles.bubbles.forEach(bubble => bubble.delete());
};

function update() {
    pages.update();
    graph.step();
    for (const particle of graph.particles) {
        const page = pages.pages.find(page => page.name === particle.name)!;
        graph.resizeParticle(particle.name, 90 + 50 * page.score);
        bubbles.setPosition(particle.name, particle.pos.add(centreOffset));
        bubbles.setSize(particle.name, particle.size);
        bubbles.setScore(particle.name, page.score);
    }
    requestAnimationFrame(update);
}

requestAnimationFrame(update);
