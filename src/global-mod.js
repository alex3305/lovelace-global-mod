import { name, version } from '../package.json';

"use strict";

/**
 * GlobalMod for Home Assistant.
 * 
 * @author Alex van den Hoogen
 */
class GlobalMod {

    #hass;

    #config = [];

    #styles = [];
    
    /**
     * Creates a new GlobalMod instance. Also loads configuration,
     * applies initial styling and adds event listeners.
     */
    constructor() {
        new Promise((resolve) => {
            const loop = () => {
                document.querySelector('home-assistant')?.hass !== undefined ?
                    resolve(document.querySelector('home-assistant').hass) :
                    setTimeout(loop);
                }
            loop();
        }).then((hass) => {
            this.#hass = hass;

            Promise.all([
                this.loadConfig(),
                this.addEventListeners()
            ]);
        })
    }

    /**
     * Gets the current path of the URL for the location in lowercase.
     * 
     * @returns {string} Current path of the URL.
     */
    static get Current() { return window.location.pathname.toLowerCase(); }

    /**
     * Gets whether edit mode is enabled for the location.
     * 
     * @returns {boolean} True when edit mode is enabled.
     */
    static get EditMode() { return window.location.search.includes('?edit=1'); }

    /**
     * Gets the name of this component.
     * 
     * @returns {string} Name of this component.
     */
    static get Name() { return name; }
    
    /**
     * Gets the current version of this component.
     * 
     * @returns {string} Current version of this component.
     */
    static get Version() { return version; }
    
    /**
     * Gets whether the user has dark mode enabled in Home Assistant.
     * 
     * @returns {boolean} True when the user has dark mode enabled.
     */
    get darkMode() { return this.#hass.themes.darkMode; }

    /**
     * Gets the current theme for modding
     * 
     * @returns {Object} Current theme
     */
    get theme() {
        const themes = this.#hass.themes.themes;
        const themeName = this.#hass.themes.theme;

        if (Object.hasOwn(themes, `${themeName}-${GlobalMod.Name}`)) {
            console.warn(`Theme still uses the deprecated ${GlobalMod.Name}-suffix.`);
            return themes[`${themeName}-${GlobalMod.Name}`];
        } else {
            return themes[themeName];
        }
    }

    /**
     * Adds an event listener to a given target without capturing.
     * 
     * @param {EventTarget} target Target to add the event to.
     * @param {string}      event  Event name.
     * @param {(any)=>void} fn     Callback function.
     */
    async addEventListener(target, event, fn) {
        target?.addEventListener(event, fn, false);
    }

    /**
     * Adds all the required event listeners for Home Assistant.
     */
    async addEventListeners() {
        const applyStylesEvent = () => {
            if (!document.hidden) {
                this.applyStyles();
            }
        };

        Promise.all([
            // Listen to location-changed for navigation.
            // Wrapped in setTimeout to try and execute last.
            // Reference: https://github.com/home-assistant/frontend/blob/fa03c58a93219ad008df3806ac50d2fd893ad87d/hassio/src/hassio-main.ts#L49-L56
            this.addEventListener(window, "location-changed", applyStylesEvent),

            // Listen to popstate for history tracking.
            this.addEventListener(window, "popstate", applyStylesEvent),

            // Listen to visibility change (ie. re-focus) for scroll changes
            // Reference: https://github.com/home-assistant/frontend/issues/20854
            this.addEventListener(document, "visibilitychange", applyStylesEvent),

            // Listen to click event on document body for navigation.
            // Reference: https://github.com/home-assistant/frontend/blob/fa03c58a93219ad008df3806ac50d2fd893ad87d/hassio/src/hassio-main.ts#L58-L65
            this.addEventListener(document.body, "click", applyStylesEvent),

            // Listen to settheme events for when themes change and also reload hass object.
            // Reference: https://github.com/thomasloven/lovelace-card-mod/blob/f59abc785eabb689ac42a9076197254421f96c60/src/theme-watcher.ts
            this.addEventListener(document.querySelector('hc-main'), 
                                  "settheme",
                                  applyStylesEvent),
            this.addEventListener(document.querySelector('home-assistant'), 
                                  "settheme",
                                  applyStylesEvent)
        ]);
    }

    /**
     * Inserts or updates a specific style rule within the DOM and also
     * manages  the backing array with styles.
     * 
     * @param {GlobalModRule} rule  GlobalMod Rule to apply.
     * @param {Element}       style Existing style element to modify.
     */
    async applyStyle(rule, style = undefined) {
        if (!GlobalMod.Current.includes(rule.path.toLowerCase()) || 
                (GlobalMod.EditMode && rule.disabledOnEdit)) {
            style?.remove();
            return;
        }

        if (style === undefined) {
            style = await this.createStyleElement(rule);
        }

        try {
            // const tree = await this.selectTree(`home-assistant$${rule.selector}`);
            const tree = await this.findElement(document.body, `home-assistant$${rule.selector}`);
            
            if (!tree.contains(style)) {
                Promise.all([
                    tree.append(style),
                    this.#styles.push(style)
                ]);
            }
        } catch (e) {
            console.error(`Error while applying style: ${e}`);
        }
    }

    /**
     * Applies all the styles found in the loaded configuration.
     */
    async applyStyles() {
        this.#config.forEach(rule => {
            this.applyStyle(
                rule,
                this.#styles.find(e => e.classList?.contains(rule.name))
            );
        });
    }

    /**
     * Creates a Global Mod Rule based on the current theme and selector.
     * 
     * @param {string} theme    The current selected Home Assistant theme.
     * @param {string} selector The selector that is used to create the rule.
     * @returns {GlobalModRule} Filled rule.
     */
    async createRule(theme, selector) {
        const ruleName = selector.substring(0, selector.lastIndexOf("-"));
        
        return {
            name: ruleName,
            selector: theme[selector],
            path: theme[ruleName + "-path"] || "/",
            style: theme[ruleName + "-style"] || "",
            disabledOnEdit: theme[ruleName + "-disable-on-edit"] || false,
            darkStyle: theme[ruleName + "-style-dark"],
            lightStyle: theme[ruleName + "-style-light"],
        };
    }

    /**
     * Creates a HTML <style> element from a given rule.
     * 
     * @param {GlobalModRule} rule to create the style element from.
     * @returns {Element} A style element.
     */
    async createStyleElement(rule) {
        const style = document.createElement('style');

        style.classList?.add(GlobalMod.Name);
        style.classList?.add(rule.name);
        style.setAttribute('style', 'display:none;');

        (async () => {
            if (!rule.darkStyle && !rule.lightStyle) {
                style.textContent = rule.style;
            } else {
                style.textContent = rule.style + " " +
                    (this.darkMode ? rule.darkStyle : rule.lightStyle);
            }
        })();

        return style;
    }

    /**
     * Loads the current configuration and creates the mods from the given
     * rules that are present within the user selected theme.
     */
    async loadConfig() {
        const theme = this.theme;

        this.#config = await Promise.all(Object.keys(theme)
                .filter(elem => elem.includes('-selector'))
                .map(elem => this.createRule(theme, elem))
                .map(elem => {
                    (async () => this.applyStyle(await elem))();
                    return elem;
                }));

        if (!this.#config || this.#config.size == 0) {
            console.info(`%c Global mod %c loaded without any config...`,
                'color:white;background:purple;', 
                '', 
                'color:black;background:lightblue;', '');
        } else {
            console.info(`%c Global Mod %c ${GlobalMod.Version} `, 
                'color:white;background:purple;', 
                'color:white;background:darkgreen;');
        }
    }

    /**
     * Finds an element based on the given selector.
     * 
     * @param {Node}   node     Node to start the search on.
     * @param {string} selector Selector string based on CSS selector.
     * @returns A found element or an error when no element could be found.
     */
    async findElement(node, selector) {
        const components = selector.trim().split(/([$])/).filter(e => e != "");

        for (const c of components) {
            node = await this.waitForElement(node, c);
        }
        
        return node;
    }

    /**
     * Waits for an element to be added to the DOM.
     * 
     * @param {Node} root       Root node to search on.
     * @param {string} selector A valid CSS selector.
     * @param {number} timeout  Maximum timeout to wait for an element in ms.
     * @returns An element when found or an Error when no element culd be found.
     */
    waitForElement(root, selector, timeout = 1000) {
        const observerOptions = { childList: true, subtree: true };
        let element = null;

        return new Promise((resolve, reject) => {
            if (selector === "$") {
                if (root.shadowRoot) {
                    return resolve(root.shadowRoot);
                }
            } else {
                element = root.querySelector(selector);
    
                if (element) {
                    return resolve(element);
                }
            }

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === "childList") {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (selector === "$") {
                                    if (node.shadowRoot) {
                                        observer.disconnect();
                                        clearTimeout(observeTimeout);
                                        return resolve(node.shadowRoot);
                                    }
                                } else if (node.matches(selector)) {
                                    observer.disconnect();
                                    clearTimeout(observeTimeout);
                                    return resolve(node);
                                } else if (node.shadowRoot) {
                                    const shadowElement = node.shadowRoot.querySelector(selector);
                                    if (shadowElement) {
                                        observer.disconnect();
                                        clearTimeout(observeTimeout);
                                        return resolve(shadowElement);
                                    } else {
                                        observer.observe(node.shadowRoot, observerOptions);
                                    }
                                }
                                
                                element = root.querySelector(selector);
                                if (element) {
                                    observer.disconnect();
                                    clearTimeout(observeTimeout);
                                    return resolve(element);
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(root, observerOptions);
            const observeTimeout = setTimeout(() => {
                observer.disconnect();
                
                if (selector === "$") {
                    if (root.shadowRoot) {
                        return resolve(root.shadowRoot);
                    }
                } else {
                    element = root.querySelector(selector);
                    if (element) {
                        return resolve(element);
                    }
                }

                return reject(new Error
                    (`Element not found for ${selector} in ${root.tagName}`)
                );
            }, timeout);
        });
    }
}

new GlobalMod();
