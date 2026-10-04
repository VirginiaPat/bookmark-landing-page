// @ts-check

/**
 * @file Hamburger menu dialog: open/close behaviour.
 */

/**
 * Finds an element and checks its type, so the result is typed and non-null.
 * Throws a clear error when the element is missing or has the wrong type.
 *
 * @template {Element} T
 * @param {string} selector CSS selector of the element.
 * @param {new () => T} type Expected constructor, e.g. `HTMLDialogElement`.
 * @returns {T}
 */
function getElement(selector, type) {
  const element = document.querySelector(selector);

  if (!(element instanceof type)) {
    throw new Error(`Expected ${type.name} for "${selector}"`);
  }

  return element;
}

/** DOM elements used by the hamburger menu dialog. */
const dom = {
  menu: getElement("#ham-menu-dialog", HTMLDialogElement),
  buttonOpen: getElement("#open-menu-button", HTMLButtonElement),
  buttonClose: getElement("#close-menu-button", HTMLButtonElement),
};

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
function openMenu() {
  dom.menu.showModal();
}

/**
 * Closes the menu (button, link and desktop breakpoint all end here).
 * @returns {void}
 */
function closeMenu() {
  dom.menu.close();
}

/**
 * Closes the menu after a click on any link inside it.
 * One listener on the dialog covers all links (event delegation).
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleMenuClick(event) {
  if (event.target instanceof Element && event.target.closest("a[href]")) {
    closeMenu();
  }
}

/**
 * Closes an open menu when the viewport grows to the desktop breakpoint.
 * @param {MediaQueryListEvent} event
 * @returns {void}
 */
function handleDesktopChange(event) {
  if (event.matches && dom.menu.open) {
    closeMenu();
  }
}

dom.buttonOpen.addEventListener("click", openMenu);
dom.buttonClose.addEventListener("click", closeMenu);
dom.menu.addEventListener("click", handleMenuClick);
desktopQuery.addEventListener("change", handleDesktopChange);
