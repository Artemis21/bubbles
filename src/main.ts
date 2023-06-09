import "./style.sass";
import { Page, Pages } from "./pagerank";
import Bubbles from "./bubbles";
import ForceGraph from "./forcegraph";
import Vec2 from "./vec2";

const getEl = (id: string): HTMLElement => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`No element with id ${id}`);
    return el;
};

const parent = getEl("graph") as HTMLDivElement;
const bubbles = new Bubbles(parent);
const graph = new ForceGraph();
const pages = new Pages(0.85, []);

let centreOffset = new Vec2(parent.clientWidth / 2, parent.clientHeight / 2);

window.onresize = () => {
    centreOffset = new Vec2(parent.clientWidth / 2, parent.clientHeight / 2);
};

const selectedReport = getEl("selectedReport");
const deleteButton = getEl("delete") as HTMLButtonElement;

bubbles.on("bubbleCreate", name => {
    graph.addParticle(name);
    const page = new Page(name, []);
    pages.pages.push(page);
});
bubbles.on("bubbleDelete", name => {
    graph.removeParticle(name);
    pages.remove(name);
});
bubbles.on("bubbleSelect", name => {
    selectedReport.innerText = name;
    deleteButton.onclick = () => bubbles.remove(name);
    deleteButton.disabled = false;
});
bubbles.on("bubbleDeselect", () => {
    selectedReport.innerText = "nothing selected";
    deleteButton.onclick = null;
    deleteButton.disabled = true;
});
bubbles.on("arrowCreate", (from, to) => {
    graph.setWeight(from, to, 100);
    pages.link(from, to);
});
bubbles.on("arrowDelete", (from, to) => {
    graph.setWeight(from, to, 0);
    pages.unlink(from, to);
});
bubbles.on("arrowSelect", (from, to) => {
    selectedReport.innerText = `Link ${from} -> ${to}`;
    deleteButton.onclick = () => bubbles.removeArrow(from, to);
    deleteButton.disabled = false;
});
bubbles.on("arrowDeselect", () => {
    selectedReport.innerText = "nothing selected";
    deleteButton.onclick = null;
    deleteButton.disabled = true;
});

getEl("damping").oninput = e => {
    const damping = parseFloat((e.target as HTMLInputElement).value);
    pages.damping = damping;
    getEl("dampingReport").textContent = damping.toFixed(2);
};
getEl("reset").onclick = () => pages.reset();
getEl("clear").onclick = () => bubbles.clear();
getEl("addNode").onclick = () => bubbles.add();

const update = () => {
    pages.update();
    graph.step();
    for (const particle of graph.particles) {
        const score = pages.getScore(particle.name);
        graph.resizeParticle(particle.name, 90 + 50 * score);
        bubbles.setPosition(particle.name, particle.pos.add(centreOffset));
        bubbles.setSize(particle.name, particle.size);
        bubbles.setScore(particle.name, score);
    }
    requestAnimationFrame(update);
};

requestAnimationFrame(update);
