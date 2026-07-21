/** Native custom elements included with Syntax. */
(function (global) {
  'use strict';

  if (!('customElements' in global)) return;

  class ResponsiveImage extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'srcset', 'sizes', 'alt', 'aspect-ratio', 'lazy'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          figure { margin: 0; }
          .frame { position: relative; overflow: hidden; border-radius: var(--radius-md, .75rem); background: var(--color-surface, #eee); }
          img { display: block; width: 100%; height: 100%; object-fit: cover; }
          figcaption { margin-top: .5rem; color: var(--color-text-secondary, #666); font-size: .875rem; text-align: center; }
          ::slotted([slot="caption"]:empty) { display: none; }
        </style>
        <figure>
          <div class="frame"><img></div>
          <figcaption><slot name="caption"></slot></figcaption>
        </figure>
      `;
      this.image = this.shadowRoot.querySelector('img');
      this.frame = this.shadowRoot.querySelector('.frame');
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    render() {
      const src = this.getAttribute('src');
      const srcset = this.getAttribute('srcset');
      const sizes = this.getAttribute('sizes');
      const ratio = this.getAttribute('aspect-ratio') || '16 / 9';
      const lazy = this.getAttribute('lazy');

      this.frame.style.aspectRatio = ratio.replace(':', ' / ');
      this.image.alt = this.getAttribute('alt') || '';
      this.image.loading = lazy === 'false' ? 'eager' : 'lazy';
      this.image.decoding = 'async';

      if (src) this.image.src = src;
      else this.image.removeAttribute('src');
      if (srcset) this.image.srcset = srcset;
      else this.image.removeAttribute('srcset');
      if (sizes) this.image.sizes = sizes;
      else this.image.removeAttribute('sizes');
    }
  }

  class CustomCard extends HTMLElement {
    static get observedAttributes() {
      return ['title', 'image', 'image-alt', 'shadow-level', 'clickable'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .card { height: 100%; overflow: hidden; border: 1px solid var(--color-border, #ddd); border-radius: var(--radius-lg, 1rem); background: var(--color-bg, #fff); color: var(--color-text, #222); transition: transform var(--transition-fast, 150ms) ease, box-shadow var(--transition-fast, 150ms) ease; }
          .card.clickable { cursor: pointer; }
          .card.clickable:hover { transform: translateY(-2px); }
          :host(:focus-visible) .card { outline: 3px solid var(--color-primary, #087f7f); outline-offset: 3px; }
          .shadow-0 { box-shadow: none; }
          .shadow-1 { box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,.08)); }
          .shadow-2 { box-shadow: var(--shadow-md, 0 12px 32px rgba(0,0,0,.1)); }
          img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
          .content { padding: 1.25rem; }
          h3 { margin: 0 0 .5rem; font-family: var(--font-heading, serif); }
          .footer { display: flex; justify-content: flex-end; padding: 0 1.25rem 1.25rem; }
        </style>
        <article class="card">
          <img alt="" hidden>
          <div class="content"><h3 hidden></h3><slot></slot></div>
          <div class="footer"><slot name="footer"></slot></div>
        </article>
      `;
      this.card = this.shadowRoot.querySelector('.card');
      this.titleElement = this.shadowRoot.querySelector('h3');
      this.imageElement = this.shadowRoot.querySelector('img');
      this.activate = this.activate.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    connectedCallback() {
      this.addEventListener('click', this.activate);
      this.addEventListener('keydown', this.handleKeydown);
      this.render();
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.activate);
      this.removeEventListener('keydown', this.handleKeydown);
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    get clickable() {
      return this.hasAttribute('clickable') && this.getAttribute('clickable') !== 'false';
    }

    activate(event) {
      if (!this.clickable) return;
      this.dispatchEvent(
        new CustomEvent('card-click', {
          bubbles: true,
          composed: true,
          detail: { originalEvent: event },
        }),
      );
    }

    handleKeydown(event) {
      if (!this.clickable || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      this.activate(event);
    }

    render() {
      const title = this.getAttribute('title');
      const image = this.getAttribute('image');
      const level = ['0', '1', '2'].includes(this.getAttribute('shadow-level'))
        ? this.getAttribute('shadow-level')
        : '1';

      this.card.className = `card shadow-${level}${this.clickable ? ' clickable' : ''}`;
      this.titleElement.hidden = !title;
      this.titleElement.textContent = title || '';
      this.imageElement.hidden = !image;
      if (image) {
        this.imageElement.src = image;
        this.imageElement.alt = this.getAttribute('image-alt') || title || '';
        this.imageElement.loading = 'lazy';
      }

      if (this.clickable) {
        this.tabIndex = 0;
        this.setAttribute('role', 'button');
      } else {
        this.removeAttribute('tabindex');
        this.removeAttribute('role');
      }
    }
  }

  class ToggleSwitch extends HTMLElement {
    static get observedAttributes() {
      return ['checked', 'disabled', 'label', 'name'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: inline-block; }
          label { display: inline-flex; align-items: center; gap: .65rem; cursor: pointer; }
          input { position: absolute; opacity: 0; pointer-events: none; }
          .track { position: relative; width: 2.75rem; height: 1.5rem; border-radius: 999px; background: var(--color-border-strong, #aaa); transition: background-color 150ms ease; }
          .thumb { position: absolute; top: .1875rem; left: .1875rem; width: 1.125rem; height: 1.125rem; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform 150ms ease; }
          input:checked + .track { background: var(--color-primary, #087f7f); }
          input:checked + .track .thumb { transform: translateX(1.25rem); }
          input:focus-visible + .track { outline: 3px solid var(--color-primary, #087f7f); outline-offset: 3px; }
          input:disabled + .track, input:disabled ~ .label { opacity: .55; cursor: not-allowed; }
        </style>
        <label>
          <input type="checkbox">
          <span class="track" aria-hidden="true"><span class="thumb"></span></span>
          <span class="label"></span>
        </label>
      `;
      this.input = this.shadowRoot.querySelector('input');
      this.labelElement = this.shadowRoot.querySelector('.label');
      this.input.addEventListener('change', () => {
        this.toggleAttribute('checked', this.input.checked);
        this.dispatchEvent(
          new CustomEvent('change', {
            bubbles: true,
            composed: true,
            detail: { checked: this.input.checked },
          }),
        );
      });
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    render() {
      this.input.checked = this.hasAttribute('checked') && this.getAttribute('checked') !== 'false';
      this.input.disabled =
        this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
      this.input.name = this.getAttribute('name') || '';
      this.labelElement.textContent = this.getAttribute('label') || '';
    }

    get checked() {
      return this.input.checked;
    }

    set checked(value) {
      this.toggleAttribute('checked', Boolean(value));
    }
  }

  class TabItem extends HTMLElement {
    static get observedAttributes() {
      return ['selected'];
    }

    connectedCallback() {
      this.setAttribute('role', 'tabpanel');
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      const selected = this.hasAttribute('selected') && this.getAttribute('selected') !== 'false';
      this.hidden = !selected;
      this.setAttribute('aria-hidden', String(!selected));
    }
  }

  class TabsContainer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .tabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--color-border, #ddd); }
          button { padding: .75rem 1rem; border: 0; border-bottom: 3px solid transparent; background: transparent; color: inherit; font: inherit; font-weight: 600; white-space: nowrap; cursor: pointer; }
          button[aria-selected="true"] { border-bottom-color: var(--color-primary, #087f7f); color: var(--color-primary, #087f7f); }
          button:focus-visible { outline: 3px solid var(--color-primary, #087f7f); outline-offset: -3px; }
          .panels { padding-top: 1rem; }
        </style>
        <div class="tabs" role="tablist"></div>
        <div class="panels"><slot></slot></div>
      `;
      this.tablist = this.shadowRoot.querySelector('.tabs');
      this.handleKeydown = this.handleKeydown.bind(this);
      this.observer = new MutationObserver(() => this.render());
    }

    connectedCallback() {
      this.tablist.addEventListener('keydown', this.handleKeydown);
      this.observer.observe(this, {
        childList: true,
        attributes: true,
        subtree: false,
        attributeFilter: ['label', 'selected'],
      });
      this.render();
    }

    disconnectedCallback() {
      this.tablist.removeEventListener('keydown', this.handleKeydown);
      this.observer.disconnect();
    }

    get items() {
      return Array.from(this.children).filter(
        (child) => child.tagName.toLowerCase() === 'tab-item',
      );
    }

    select(index, focus = false) {
      const items = this.items;
      const buttons = Array.from(this.tablist.querySelectorAll('[role="tab"]'));
      if (!items[index]) return;

      items.forEach((item, itemIndex) => item.toggleAttribute('selected', itemIndex === index));
      buttons.forEach((button, buttonIndex) => {
        const selected = buttonIndex === index;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      if (focus) buttons[index]?.focus();
      this.dispatchEvent(
        new CustomEvent('tab-change', { bubbles: true, composed: true, detail: { index } }),
      );
    }

    render() {
      const items = this.items;
      if (!items.length) return;
      let selectedIndex = items.findIndex((item) => item.hasAttribute('selected'));
      if (selectedIndex < 0) selectedIndex = 0;

      this.tablist.replaceChildren();
      items.forEach((item, index) => {
        const itemId = item.id || `syntax-tab-panel-${Math.random().toString(36).slice(2, 9)}`;
        item.id = itemId;
        const button = document.createElement('button');
        button.type = 'button';
        button.id = `${itemId}-tab`;
        button.setAttribute('role', 'tab');
        const label = item.getAttribute('label') || `Tab ${index + 1}`;
        button.textContent = label;
        button.addEventListener('click', () => this.select(index));
        this.tablist.appendChild(button);
        item.removeAttribute('aria-labelledby');
        item.setAttribute('aria-label', label);
      });
      this.select(selectedIndex);
    }

    handleKeydown(event) {
      const buttons = Array.from(this.tablist.querySelectorAll('[role="tab"]'));
      const current = buttons.findIndex(
        (button) => button.getAttribute('aria-selected') === 'true',
      );
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      this.select(next, true);
    }
  }

  const definitions = [
    ['responsive-image', ResponsiveImage],
    ['custom-card', CustomCard],
    ['toggle-switch', ToggleSwitch],
    ['tab-item', TabItem],
    ['tabs-container', TabsContainer],
  ];

  definitions.forEach(([name, constructor]) => {
    if (!customElements.get(name)) customElements.define(name, constructor);
  });

  global.SyntaxComponents = Object.freeze({
    ResponsiveImage,
    CustomCard,
    ToggleSwitch,
    TabItem,
    TabsContainer,
  });
})(window);
