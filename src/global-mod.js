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
            const tree = await this.selectTree(`home-assistant$${rule.selector}`, 1, 9);
            
            if (!tree.contains(style)) {
                tree.append(style);
                this.#styles.push(style);
            }
        } catch {
            console.error(`Could not create rule ${rule.name} after multiple tries...`);
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
     * Selects the tree to append the style element to.
     * 
     * @param {string} selector      Semi-DOM selector
     * @param {number} iterations    Current iteration
     * @param {number} maxIterations Maximum iterations to search
     * @returns {Node} Found Node.
     */
    async selectTree(selector, iterations, maxIterations) {
        let components = selector.split('$');
        let tree;

        try {
            for (let i = 0; i < components.length; i++) {
                if (!components[i]) {
                    continue;
                }

                tree = tree ? tree.querySelector(components[i]) : 
                              document.querySelector(components[i]);

                if (i + 1 < components.length) {
                    tree = tree.shadowRoot;
                }
            }

            if (!tree) {
                throw new Error();
            }

            return tree;
        } catch {
            console.warn(`Retry for ${selector}`);

            if (iterations === maxIterations) {
                throw new Error(`No Element Found for ${selector}`);
            }

            await new Promise((resolve) => setTimeout(resolve, iterations * 10));
            return await this.selectTree(selector, iterations + 1, maxIterations);
        }
    }
}

new GlobalMod();
