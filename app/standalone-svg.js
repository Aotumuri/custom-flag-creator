import { createDefaultState } from "./model.js";
import { buildStandaloneSvg } from "./preview.js";
import { readStateFromUrl } from "./share.js";

const root = document.querySelector("#svg-root");
const status = document.querySelector("#svg-status");

let renderToken = 0;

function setStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

async function render() {
  const token = ++renderToken;
  const state = readStateFromUrl() ?? createDefaultState();
  const svg = await buildStandaloneSvg(state);
  if (token !== renderToken) {
    return;
  }

  root.replaceChildren(svg);
  setStatus("");
}

function renderWithStatus() {
  render().catch(() => {
    root.replaceChildren();
    setStatus("SVG could not be rendered.");
  });
}

window.addEventListener("hashchange", renderWithStatus);
renderWithStatus();
