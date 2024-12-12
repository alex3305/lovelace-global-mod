import { HomeAssistant } from './home-assistant.js';
import { name, version } from '../package.json';

"use strict";

/**
 * Global Mod for Home Assistant.
 * 
 * @author Alex van den Hoogen
 */
class GlobalMod {
    
    #config = [];
    
    #homeAssistant;

    #initialized = false;

    #styles = [];
    
    /**
     * Creates a new GlobalMod instance. Also loads configuration,
     * applies initial styling and adds event listeners.
     */
    constructor() {
        this.#homeAssistant = new HomeAssistant();
        this.#homeAssistant.update().then(() => {
            Promise.all([
                this.loadConfig(),
                this.addEventListeners()
            ]);
        });

        console.info(`%c Global Mod %c ${GlobalMod.Version} `, 
            'color:white;background:purple;', 
            'color:white;background:darkgreen;');
    }

    /**
     * Gets the current path of the URL for the location in lowercase.
     * 
     * @returns {string} Current path of the URL.
     */
    static get Current() { 
        return window.location.pathname.toLowerCase(); 
    }

    /**
     * Gets whether edit mode is enabled for the location.
     * 
     * @returns {boolean} True when edit mode is enabled.
     */
    static get EditMode() { 
        return window.location.search.includes('?edit=1'); 
    }

    /**
     * Gets the name of this component.
     * 
     * @returns {string} Name of this component.
     */
    static get Name() { 
        return name; 
    }
    
    /**
     * Gets the current version of this component.
     * 
     * @returns {string} Current version of this component.
     */
    static get Version() { 
        return version; 
    }
    
    /**
     * Gets the current theme for modding
     * 
     * @returns {Object} Current theme
     */
    get theme() {
        const themes = this.#homeAssistant.themes;
        const themeName = this.#homeAssistant.themeName;

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

        const updateThemeEvent = (async () => {
            await this.#homeAssistant.update();
            await this.loadConfig();

            this.#styles.forEach(e => e.classList.add("pending"));
            this.applyStyles(true);
            this.#styles.filter(e => e.classList.contains("pending"))
                        .forEach(e => e.remove());
        });

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

            // Listen to theme update events.
            // Reference: https://github.com/thomasloven/lovelace-card-mod/blob/f59abc785eabb689ac42a9076197254421f96c60/src/theme-watcher.ts
            this.#homeAssistant.connection.subscribeEvents(
                () => { setTimeout(updateThemeEvent, 500); }, 
                "themes_updated"),

            this.addEventListener(document.querySelector('hc-main'), 
                "settheme", updateThemeEvent),
            
            this.addEventListener(document.querySelector('home-assistant'), 
                "settheme", updateThemeEvent)
        ]);
    }

    /**
    * Inserts or updates a specific style rule within the DOM and also
     * manages  the backing array with styles.
     * 
     * @param {GlobalModRule} rule   GlobalMod Rule to apply.
     * @param {Element}       style  Existing style element to modify.
     * @param {boolean}       update Whether this is a forced update.
     */
    async applyStyle(rule, style = undefined, update = false) {
        if (!GlobalMod.Current.includes(rule.path.toLowerCase()) || 
                (GlobalMod.EditMode && rule.disabledOnEdit)) {
            style?.remove();
            return;
        }

        if (style === undefined) {
            style = await this.createStyleElement(rule);
        } else if (update) {
            const updatedStyle = await this.createStyleElement(rule);
            style.textContent = updatedStyle.textContent;
        }

        style.classList.remove("pending");

        try {
            const tree = await this.findElement(document.body, `home-assistant$${rule.selector}`);
            const contains = tree.querySelector(`style.${GlobalMod.Name}.${rule.name}`) !== null;
            
            if (tree && !contains) {
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
     * @param {boolean} update Whether this is a forced update.
     */
    async applyStyles(update = false) {
        this.#config.forEach(rule => {
            this.applyStyle(
                rule,
                this.#styles.find(e => e.classList?.contains(rule.name)),
                update
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

        style.classList?.add(GlobalMod.Name, rule.name);
        style.style.display = "none";
        // style.setAttribute('style', 'display:none;');

        (async () => {
            if (!rule.darkStyle && !rule.lightStyle) {
                style.textContent = rule.style;
            } else {
                style.textContent = rule.style + " " +
                    (this.#homeAssistant.darkMode ? 
                            rule.darkStyle : rule.lightStyle);
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
                .map(elem => this.createRule(theme, elem)));

        if (!this.#initialized) {
            this.#config.forEach(elem => this.applyStyle(elem));
            this.#initialized = true;
        }

        if (!this.#config || this.#config.size == 0) {
            console.info(`%c Global mod %c loaded without any config...`,
                'color:white;background:purple;', '', 
                'color:black;background:lightblue;', '');
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
        const components = selector.trim().split("$");

        for (const c of components) {
            node = await this.waitForElement(node, c);
        }
        
        return node;
    }

    /**
     * Waits for an element to be added to the DOM.
     * 
     * @param {Node} root        Root node to search on.
     * @param {string} selector  A valid CSS selector.
     * @param {number} timeout   Maximum timeout to wait for an element in ms.
     * @param {number} iteration Current iteration for retry
     * @returns An element when found or an Error when no element culd be found.
     */
    waitForElement(root, selector, timeout = 10, iteration = 0) {
        const observerOptions = { childList: true, subtree: true };
        let element = null;

        return new Promise((resolve, reject) => {
            if (selector === "") {
                if (root.shadowRoot) {
                    return resolve(root.shadowRoot);
                }
            } else {
                element = root.querySelector(selector) || 
                          root.shadowRoot?.querySelector(selector);
        
                if (element) {
                    return resolve(element);
                }
            }

            const observer = new MutationObserver((mutations) => {
                if (selector === "") {
                    if (root.shadowRoot) {
                        observer.disconnect();
                        clearTimeout(observeTimeout);

                        return resolve(root.shadowRoot);
                    }
                } else {
                    for (const mutation of mutations.filter(m => m.type === "childList")) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE && node.matches(selector)) {
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
                        }
                    }
                }
            });

            observer.observe(root, observerOptions);
            
            const observeTimeout = setTimeout(() => {
                observer.disconnect();

                if (iteration < 10) {
                    return resolve(this.waitForElement(root, selector, timeout, ++iteration));
                }

                return reject(new Error
                    (`Element not found for ${selector} in ${root.tagName?.toLowerCase()}`)
                );
            }, timeout * iteration);
        });
    }
}

new GlobalMod();
