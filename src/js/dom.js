/**
 * DOM lookup helpers. If an element is missing (or is the wrong type) they
 * throw a descriptive error, so a typo in the HTML is caught immediately
 * instead of failing silently later. Each feature module calls these for its
 * own elements.
 * @module dom
 */

/**
 * Finds an element by id and verifies its type.
 * @template {HTMLElement} T
 * @param {string} id - The element id (without `#`).
 * @param {{ new (): T }} [type=HTMLElement] - Expected constructor, e.g. HTMLButtonElement.
 * @returns {T}
 * @throws {Error} If the element does not exist or is not an instance of `type`.
 */
export const getElement = (id, type = /** @type {any} */ (HTMLElement)) => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`[dom] Missing element: #${id}`);
  }
  if (!(element instanceof type)) {
    throw new Error(
      `[dom] #${id} should be a ${type.name} but is a ${element.constructor.name}`,
    );
  }
  return /** @type {T} */ (element);
};

/**
 * Finds the first element matching a selector and verifies its type.
 * @template {HTMLElement} T
 * @param {string} selector - CSS selector.
 * @param {ParentNode} [root=document] - Where to search.
 * @param {{ new (): T }} [type=HTMLElement] - Expected constructor.
 * @returns {T}
 * @throws {Error} If nothing matches or the match has the wrong type.
 */
export const query = (
  selector,
  root = document,
  type = /** @type {any} */ (HTMLElement),
) => {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`[dom] Missing element: "${selector}"`);
  }
  if (!(element instanceof type)) {
    throw new Error(
      `[dom] "${selector}" should be a ${type.name} but is a ${element.constructor.name}`,
    );
  }
  return /** @type {T} */ (element);
};

/**
 * Finds all elements matching a selector and verifies their type.
 * @template {HTMLElement} T
 * @param {string} selector - CSS selector.
 * @param {ParentNode} [root=document] - Where to search.
 * @param {{ new (): T }} [type=HTMLElement] - Expected constructor of every match.
 * @param {number} [min=1] - Minimum number of matches required.
 * @returns {T[]}
 * @throws {Error} If fewer than `min` elements match or one has the wrong type.
 */
export const queryAll = (
  selector,
  root = document,
  type = /** @type {any} */ (HTMLElement),
  min = 1,
) => {
  const elements = Array.from(root.querySelectorAll(selector));

  if (elements.length < min) {
    throw new Error(
      `[dom] Expected at least ${min} element(s) for "${selector}", found ${elements.length}`,
    );
  }
  elements.forEach((element) => {
    if (!(element instanceof type)) {
      throw new Error(
        `[dom] An element matching "${selector}" should be a ${type.name} but is a ${element.constructor.name}`,
      );
    }
  });
  return /** @type {T[]} */ (elements);
};
