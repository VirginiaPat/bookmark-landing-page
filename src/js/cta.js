/**
 * CTA form: validates the email field and shows or hides the error message. Screen reader announces the success message.
 * `aria-invalid` on the input drives the error styling in the HTML (border,
 * icon); the message itself is the text of the `role="alert"` paragraph.
 * @module cta
 */

import { getElement } from "./dom.js";

/**
 * Elements the form depends on. Filled in by `initCta`.
 * @typedef {Object} CtaElements
 * @property {HTMLFormElement} form - The CTA form.
 * @property {HTMLInputElement} input - The email field.
 * @property {HTMLElement} error - The `role="alert"` paragraph for the message.
 * @property {HTMLElement} status - The role="status" paragraph for the success message.
 */

/** @type {CtaElements} */
let elements;

/** Message shown when the email is empty or not valid. @type {string} */
const ERROR_MESSAGE = "Whoops, make sure it's an email";

/** Message announced after a valid submit. @type {string} */
const SUCCESS_MESSAGE = "Thanks! We'll be in touch soon.";

/**
 * Marks the field as invalid and shows the message.
 * @returns {void}
 */
const showError = () => {
  elements.input.setAttribute("aria-invalid", "true");
  elements.error.textContent = ERROR_MESSAGE;
};

/**
 * Marks the field as valid and removes the message.
 * @returns {void}
 */
const clearError = () => {
  elements.input.setAttribute("aria-invalid", "false");
  elements.error.textContent = "";
};

/**
 * Validates on submit: shows the error and focuses the field if the email is not valid, otherwise announces the success message and clears the form.
 * @param {SubmitEvent} event
 * @returns {void}
 */
const handleSubmit = (event) => {
  event.preventDefault();

  if (!elements.input.validity.valid) {
    elements.status.textContent = "";
    showError();
    elements.input.focus();
    return;
  }

  clearError();
  elements.status.textContent = SUCCESS_MESSAGE;
  // TODO: send `new FormData(elements.form)` to a server when there is one.
  elements.form.reset();
};

/**
 * While an error is showing, removes it as soon as the value becomes valid.
 * No error is shown while typing for the first time.
 * @returns {void}
 */
const handleInput = () => {
  const { input } = elements;

  elements.status.textContent = "";

  if (input.getAttribute("aria-invalid") === "true" && input.validity.valid) {
    clearError();
  }
};

/**
 * Clears the form and any error. The browser restores the last typed value
 * on refresh or when coming back to the page; `pageshow` runs in both cases.
 * @returns {void}
 */
const resetForm = () => {
  elements.status.textContent = "";
  elements.form.reset();
  clearError();
};

/**
 * Finds the form elements and attaches the listeners.
 * @returns {void}
 * @throws {Error} If one of the form elements is missing.
 */
export const initCta = () => {
  elements = {
    form: getElement("cta-form", HTMLFormElement),
    input: getElement("cta-email", HTMLInputElement),
    error: getElement("cta-email-error"),
    status: getElement("cta-status"),
  };

  elements.form.addEventListener("submit", handleSubmit);
  elements.input.addEventListener("input", handleInput);
  window.addEventListener("pageshow", resetForm);
};
