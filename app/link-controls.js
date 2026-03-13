export function createLinkControls(refs) {
  let activeMode = "share";
  let urls = { share: "", svg: "" };

  function syncUi() {
    refs.activeUrl.value = urls[activeMode] ?? "";
    refs.openLink.href = urls[activeMode] || "./";
    refs.linkModeButtons.forEach((button) => {
      const selected = button.dataset.linkMode === activeMode;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  function bindModeButtons() {
    refs.linkModeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeMode = button.dataset.linkMode;
        syncUi();
      });
    });
  }

  return {
    bindModeButtons,
    clear() {
      urls = { share: "", svg: "" };
      syncUi();
    },
    getActiveUrl() {
      return urls[activeMode] ?? "";
    },
    setPending() {
      urls = { share: "Generating...", svg: "Generating..." };
      syncUi();
    },
    setUrls(nextUrls) {
      urls = nextUrls;
      syncUi();
    },
    sync() {
      syncUi();
    }
  };
}
