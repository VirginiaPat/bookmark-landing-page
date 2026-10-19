/**
 * Accessible tabs with a sliding underline, cross-fading panels and an
 * animated container height.
 * @module tabs
 */

import { getElement, query, queryAll } from "./dom.js";

/**
 * Elements the tabs depend on. Filled in by `initTabs`.
 * @typedef {Object} TabsElements
 * @property {HTMLElement} tablist - The element with `role="tablist"`.
 * @property {HTMLButtonElement[]} tabs - All `role="tab"` buttons, in DOM order.
 * @property {HTMLElement[]} panels - The tabpanels, in the same order as `tabs`.
 * @property {HTMLElement} panelsWrap - Wrapper around all panels (its height is animated).
 * @property {HTMLElement} indicator - The sliding red underline.
 */

/** @type {TabsElements} */
let elements;

/** Animation duration in ms, shared by the indicator and the panels. @type {number} */
const DURATION = 400;

/** Easing used by the panel animations. @type {string} */
const EASING = "ease";

/** Horizontal distance panels travel while fading. @type {string} */
const SLIDE = "2rem";

/** Extra width (px) the underline extends past each side of the tab text. @type {number} */
const INDICATOR_PADDING = 12;

/** Class that takes a panel out of the layout flow while it fades out. @type {string} */
const LEAVING_CLASS = "tabpanel-leaving";

/** Matches when the user asked the OS to reduce motion. @type {MediaQueryList} */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Matches from Tailwind's `md` breakpoint (48rem), where the tabs sit side by side. @type {MediaQueryList} */
const tabletQuery = window.matchMedia("(min-width: 48rem)");

/** Index of the currently selected tab. @type {number} */
let currentIndex = 0;

/** Animations of the switch in progress, kept so a new switch can cancel them. @type {Animation[]} */
let animations = [];

/**
 * Moves the red underline under the given tab.
 * - From `md` up (tabs side by side): it spans the full width of the tab cell
 *   and slides left/right via the CSS transition.
 * - On mobile (tabs stacked): it is as wide as the tab's text plus
 *   `INDICATOR_PADDING` on each side, with no sliding, just a short fade-in.
 * @param {HTMLElement} tab - The tab to move under.
 * @param {boolean} [animate=true] - Pass false to jump there with no animation at all.
 * @returns {void}
 */
const moveIndicator = (tab, animate = true) => {
  const { indicator } = elements;
  const isTablet = tabletQuery.matches;
  const wrapRect = /** @type {HTMLElement} */ (
    indicator.parentElement
  ).getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();

  let left = tabRect.left;
  let width = tabRect.width;

  if (!isTablet) {
    // Mobile: the button stretches to fill its grid cell, so measure only the text
    const range = document.createRange();
    range.selectNodeContents(tab);
    const textRect = range.getBoundingClientRect();
    left = textRect.left - INDICATOR_PADDING;
    width = textRect.width + INDICATOR_PADDING * 2;
  }

  // Where the underline is right now (also correct in the middle of an animation)
  const computed = getComputedStyle(indicator);
  const prev = {
    translate: computed.translate,
    width: computed.width,
  };
  const next = {
    translate: `${left - wrapRect.left}px ${
      tabRect.bottom - wrapRect.top - indicator.offsetHeight
    }px`,
    width: `${width}px`,
  };

  // The final values are always written; animations only describe the way there
  Object.assign(indicator.style, next);

  if (!animate || reducedMotion.matches) return;

  if (isTablet) {
    // Tablet/desktop: slide left/right
    indicator.animate([prev, next], {
      duration: DURATION,
      easing: "ease-in-out",
    });
  } else {
    // Mobile: no sliding, just a quick fade-in at the new position
    indicator.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: DURATION,
      easing: "ease-out",
    });
  }
};

/**
 * Resets a panel to the plain hidden state.
 * @param {HTMLElement} panel
 * @returns {void}
 */
const hidePanel = (panel) => {
  panel.classList.remove(LEAVING_CLASS);
  panel.classList.add("hidden");
};

/**
 * Cross-fades and slides two panels at the same time and animates the
 * container height. The incoming panel enters from the side of its tab: from
 * the left when its tab comes before the current one, from the right when it
 * comes after. The outgoing panel leaves in the opposite direction.
 * @param {number} fromIndex - Index of the panel being hidden.
 * @param {number} toIndex - Index of the panel being shown.
 * @returns {void}
 */
const showPanel = (fromIndex, toIndex) => {
  const { panels, panelsWrap } = elements;
  const outgoing = panels[fromIndex];
  const incoming = panels[toIndex];

  // Read before cancelling: an interrupted animation would otherwise jump
  // (where the outgoing panel visually is right now, and the current height)
  const { opacity, transform } = getComputedStyle(outgoing);
  const oldHeight = panelsWrap.getBoundingClientRect().height;
  animations.forEach((animation) => animation.cancel());
  animations = [];
  panels.forEach((panel, index) => {
    if (index !== fromIndex) hidePanel(panel);
  });
  outgoing.classList.remove(LEAVING_CLASS);

  if (reducedMotion.matches) {
    hidePanel(outgoing);
    incoming.classList.remove("hidden");
    return;
  }

  // Outgoing leaves the flow, so the container takes the incoming height
  outgoing.classList.add(LEAVING_CLASS);
  incoming.classList.remove("hidden");

  const newHeight = panelsWrap.getBoundingClientRect().height;

  const fromLeft = toIndex < fromIndex;
  const enterX = fromLeft ? `-${SLIDE}` : SLIDE;
  const exitX = fromLeft ? SLIDE : `-${SLIDE}`;
  const timing = { duration: DURATION, easing: EASING };

  const inAnim = incoming.animate(
    [
      { opacity: 0, transform: `translateX(${enterX})` },
      { opacity: 1, transform: "translateX(0)" },
    ],
    timing,
  );

  const outAnim = outgoing.animate(
    [
      { opacity, transform },
      { opacity: 0, transform: `translateX(${exitX})` },
    ],
    { ...timing, fill: "forwards" },
  );

  const heightAnim = panelsWrap.animate(
    [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
    timing,
  );

  animations = [inAnim, outAnim, heightAnim];

  // `finish` fires only on normal completion; a newer switch cancels the animation instead, so there is nothing to clean up in that case.
  outAnim.addEventListener("finish", () => {
    hidePanel(outgoing);
    outAnim.cancel();
  });
};

/**
 * Selects a tab: updates ARIA state, moves the underline and
 * switches the panels.
 * @param {HTMLButtonElement} newTab - The tab to select.
 * @param {Object} [options]
 * @param {boolean} [options.focus=true] - Move keyboard focus to the tab.
 * @param {boolean} [options.animate=true] - Animate the underline.
 * @returns {void}
 */
const activateTab = (newTab, { focus = true, animate = true } = {}) => {
  const { tabs } = elements;
  const newIndex = tabs.indexOf(newTab);

  tabs.forEach((tab) => {
    const isActive = tab === newTab;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  moveIndicator(newTab, animate);

  if (newIndex !== currentIndex) {
    showPanel(currentIndex, newIndex);
    currentIndex = newIndex;
  }

  if (focus) newTab.focus();
};

/**
 * Selects a tab with the arrow keys, Home and End (roving tabindex pattern).
 * Both arrow pairs work because the tabs are vertical on mobile and
 * horizontal from `md` up.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
const handleKeydown = (event) => {
  const { tabs } = elements;
  const index = tabs.findIndex((tab) => tab === document.activeElement);
  if (index === -1) return;

  let newIndex;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      newIndex = (index + 1) % tabs.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      newIndex = (index - 1 + tabs.length) % tabs.length;
      break;
    case "Home":
      newIndex = 0;
      break;
    case "End":
      newIndex = tabs.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  activateTab(tabs[newIndex]);
};

/**
 * Keeps the underline under the selected tab (resize, font load).
 * @returns {void}
 */
const realignIndicator = () => {
  moveIndicator(elements.tabs[currentIndex], false);
};

/**
 * Finds the tab elements, sets the initial state and attaches the listeners.
 * @returns {void}
 * @throws {Error} If one of the tab elements is missing.
 */
export const initTabs = () => {
  const tablist = query('[role="tablist"]');
  const tabs = queryAll('[role="tab"]', tablist, HTMLButtonElement);

  elements = {
    tablist,
    tabs,
    panels: tabs.map((tab) => {
      const panelId = tab.getAttribute("aria-controls");
      if (!panelId) {
        throw new Error(`[tabs] Tab #${tab.id} has no aria-controls attribute`);
      }
      return getElement(panelId);
    }),
    panelsWrap: getElement("tabpanels"),
    indicator: getElement("tab-indicator"),
  };

  currentIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
  );

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
  });
  tablist.addEventListener("keydown", handleKeydown);

  // Initial state (no animation)
  activateTab(tabs[currentIndex], { focus: false, animate: false });

  new ResizeObserver(realignIndicator).observe(tablist);
  document.fonts?.ready.then(realignIndicator);
};
