/**
 * FAQ accordion: opens and closes the answers. The button's `aria-expanded`
 * is the single source of truth; the CSS reads it to show or hide the panel.
 * @module faq
 */

import { getElement, queryAll } from "./dom.js";

/**
 * Elements the accordion depends on. Filled in by `initFaq`.
 * @typedef {Object} FaqElements
 * @property {HTMLElement} list - Container of all the questions.
 * @property {HTMLButtonElement[]} buttons - The question buttons, in DOM order.
 */

/** @type {FaqElements} */
let elements;

/** When false, opening a question closes the others. @type {boolean} */
const ALLOW_MULTIPLE = false;

/**
 * Sets the expanded state of one question.
 * @param {HTMLButtonElement} button
 * @param {boolean} expanded
 * @returns {void}
 */
const setExpanded = (button, expanded) => {
  button.setAttribute("aria-expanded", String(expanded));
};

/**
 * Toggles the clicked question. One listener on the list covers every
 * button (event delegation).
 * @param {MouseEvent} event
 * @returns {void}
 */
const handleClick = (event) => {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[aria-expanded]");
  if (!(button instanceof HTMLButtonElement)) return;

  const willOpen = button.getAttribute("aria-expanded") !== "true";

  if (willOpen && !ALLOW_MULTIPLE) {
    elements.buttons.forEach((other) => {
      if (other !== button) setExpanded(other, false);
    });
  }

  setExpanded(button, willOpen);
};

/**
 * Finds the FAQ elements and attaches the listener.
 * @returns {void}
 * @throws {Error} If the list or its buttons are missing.
 */
export const initFaq = () => {
  const list = getElement("faq-list");

  elements = {
    list,
    buttons: queryAll("button[aria-expanded]", list, HTMLButtonElement),
  };

  list.addEventListener("click", handleClick);
};
