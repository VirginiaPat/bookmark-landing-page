/**
 * Hamburger menu: opens and closes the full-screen dialog.
 * @module menu
 */

import { getElement } from "./dom.js";

/**
 * Elements the menu depends on. Filled in by `initMenu`.
 * @typedef {Object} MenuElements
 * @property {HTMLDialogElement} menu - The full-screen menu dialog.
 * @property {HTMLButtonElement} buttonOpen - Button that opens the menu.
 * @property {HTMLButtonElement} buttonClose - Button that closes the menu.
 */

/** @type {MenuElements} */
let elements;

/**
 * Matches when the viewport reaches Tailwind's `xl` breakpoint (80rem),
 * where the desktop navigation replaces the hamburger button.
 * Keep in sync with the `xl` value in the Tailwind theme.
 * @type {MediaQueryList}
 */
const desktopQuery = window.matchMedia("(min-width: 80rem)");

/**
 * Opens the menu in the top layer.
 * @returns {void}
 */
const openMenu = () => {
  elements.menu.showModal();
};

/**
 * Closes the menu (button, link and desktop breakpoint all end here).
 * @returns {void}
 */
const closeMenu = () => {
  elements.menu.close();
};

/**
 * Closes the menu after a click on any link inside it.
 * One listener on the dialog covers all links (event delegation).
 * @param {MouseEvent} event
 * @returns {void}
 */
const handleMenuClick = (event) => {
  if (event.target instanceof Element && event.target.closest("a[href]")) {
    closeMenu();
  }
};

/**
 * Closes an open menu when the viewport grows to the desktop breakpoint.
 * @param {MediaQueryListEvent} event
 * @returns {void}
 */
const handleDesktopChange = (event) => {
  if (event.matches && elements.menu.open) {
    closeMenu();
  }
};

/**
 * Finds the menu elements and attaches the listeners.
 * @returns {void}
 * @throws {Error} If one of the menu elements is missing.
 */
export const initMenu = () => {
  elements = {
    menu: getElement("ham-menu-dialog", HTMLDialogElement),
    buttonOpen: getElement("open-menu-button", HTMLButtonElement),
    buttonClose: getElement("close-menu-button", HTMLButtonElement),
  };

  elements.buttonOpen.addEventListener("click", openMenu);
  elements.buttonClose.addEventListener("click", closeMenu);
  elements.menu.addEventListener("click", handleMenuClick);
  desktopQuery.addEventListener("change", handleDesktopChange);
};
