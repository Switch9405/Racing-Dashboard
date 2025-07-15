const RULES_DOC_URL = "https://docs.google.com/document/d/e/2PACX-1vTWtjkZV5Num6zzMbZCRvO5tcpZCs0qPgDjBIx4AZDP_Mc_rhlRrdHip-UjZqtdUsrXASVNCo1rXKxx/pub";

fetch(RULES_DOC_URL)
  .then(res => res.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const sourceContent = doc.querySelector(".doc-content");
    const targetContainer = document.getElementById("rules-container");

    if (!sourceContent || !targetContainer) {
      targetContainer.textContent = "Error: Document structure not found.";
      return;
    }

    const clone = sourceContent.cloneNode(true);

    // 1. Detect and tag main title
    const title = clone.querySelector("p.title");
    if (title) title.classList.add("mb-subheader");

    // 2. Tag lists and apply rc-heading / rc-body
    clone.querySelectorAll("ol, ul").forEach(list => {
      const depthMatch = list.className.match(/lst-kix_[^-]+-(\d)/);
      const level = depthMatch ? parseInt(depthMatch[1], 10) : 0;
      list.classList.add(`list-level-${level}`);

      const items = list.querySelectorAll("li");
      if (list.tagName === "OL" && level === 0) {
        items.forEach(li => li.classList.add("rc-heading"));
      } else {
        items.forEach(li => li.classList.add("rc-body"));
      }
    });

    // 3. Wrap the table
    const table = clone.querySelector("table");
    if (table) {
      const wrapper = document.createElement("div");
      wrapper.className = "rc-table-table";
      table.replaceWith(wrapper);
      wrapper.appendChild(table);
    }

    // 4. Style the closing signature line
      const paragraphs = clone.querySelectorAll("p");
      const signatureText = "— MidLapCrisis Racing League Admin Team";
      paragraphs.forEach(p => {
        if (p.textContent.trim() === signatureText) {
          p.classList.add("rc-signature");
        }
      });

    // 5. Inject content into container
    targetContainer.innerHTML = "";
    targetContainer.appendChild(clone);

    // 6. Inject hierarchical numbering only on level 1 and 2
(() => {
  const counters = [0, 0, 0]; // level 0 = section, 1 = subsection, 2 = sub-subsection

  document.querySelectorAll("#rules-container ol").forEach(ol => {
    const listClass = [...ol.classList].find(c => c.startsWith("list-level-"));
    const level = listClass ? parseInt(listClass.split("-").pop()) : 0;

    ol.querySelectorAll("li").forEach(li => {
      if (level === 0) {
        counters[0]++;
        counters[1] = 0; // reset sub
        counters[2] = 0; // reset sub-sub
        li.setAttribute("data-prefix", `${counters[0]}`);
        li.dataset.prefixed = "true";
      } else if (level === 1) {
        counters[1]++;
        counters[2] = 0; // reset sub-sub
        li.setAttribute("data-prefix", `${counters[0]}.${counters[1]}`);
        li.dataset.prefixed = "true";
      } else if (level === 2) {
        counters[2]++;
        li.setAttribute("data-prefix", `${counters[0]}.${counters[1]}.${counters[2]}`);
        li.dataset.prefixed = "true";
      } else {
        // No numbering for deeper levels
        li.removeAttribute("data-prefix");
        li.removeAttribute("data-prefixed");
      }
    });
  });
})();    
  

})
  .catch(err => {
    console.error("Failed to fetch or parse rules:", err);
    document.getElementById("rules-container").textContent = "Error loading rulebook.";
  });
