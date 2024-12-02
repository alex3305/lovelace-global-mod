import { name, version } from '../package.json';

class GlobalMod {

    #hass;

    #config = [];

    #styles = [];
    
    constructor() {
        this.refreshHomeAssistant();

        Promise.all([
            this.loadConfig(),
            this.addEventListeners()
        ]);
    }

    static get Current() { return window.location.pathname.toLowerCase(); }

    static get EditMode() { return window.location.search.includes('?edit=1'); }
    
    static get Name() { return name; }
    
    static get Version() { return version; }
    
    get darkMode() { return this.#hass.themes.darkMode; }

    async addEventListener(element, event, fn) {
        element?.addEventListener(event, fn, false);
    }

    async addEventListeners() {
        const applyStylesEvent = () => {
            if (!document.hidden) {
                this.applyStyles();
            }
        };

        const refreshAndApplyStylesEvent = () => {
            this.refreshHomeAssistant();
            this.applyStyles();
        }

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
                                  refreshAndApplyStylesEvent),
            this.addEventListener(document.querySelector('home-assistant'), 
                                  "settheme",
                                  refreshAndApplyStylesEvent)
        ]);
    }


    async applyStyle(rule, current, editMode, style = undefined) {
        if (!current.includes(rule.path.toLowerCase()) || 
                (editMode && rule.disabledOnEdit)) {
            style?.remove();
            return;
        }

        if (style === undefined) {
            style = await this.createStyleElement(rule);
            style?.classList?.add(rule.name);
        }

        try {
            const tree = await this.selectTree(`home-assistant$${rule.selector}`, 1, 9);
            
            if (!tree.contains(style)) {
                Promise.all([
                    tree.append(style),
                    this.#styles.push(style)
                ]);
            }
        } catch {
            console.error(`Could not create rule ${rule.name} after multiple tries...`);
        }
    }

    async applyStyles() {
        this.#config.forEach(rule => {
            this.applyStyle(
                rule,
                GlobalMod.Current,
                GlobalMod.EditMode,
                this.#styles.find(e => e.classList?.contains(rule.name))
            );
        });
    }

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

    async createStyleElement(rule) {
        const style = document.createElement('style');

        style.classList?.add(GlobalMod.Name);
        style.setAttribute('style', 'display:none;');

        (async () => {
            if (!rule.darkStyle && !rule.lightStyle) {
                style.textContent = rule.style;
            } else {
                style.textContent = rule.style + 
                    (this.darkMode ? rule.darkStyle : rule.lightStyle);
            }
        })();

        return style;
    }

    async loadConfig() {
        let currentTheme = `${this.#hass.themes.theme}-${GlobalMod.Name}`;

        // Fall back to theme name without global-mod suffix. This should be temporary.
        if (!(currentTheme in this.#hass.themes.themes)) {
            currentTheme = `${this.#hass.themes.theme}`;
        } else {
            console.warn(`Theme still uses the deprecated ${GlobalMod.Name}-suffix.`);
        }

        const theme = this.#hass.themes.themes[currentTheme];
        this.#config = await Promise.all(Object.keys(theme)
                .filter(elem => elem.includes('-selector'))
                .map(elem => this.createRule(theme, elem))
                .map(elem => {
                    (async () => {
                        this.applyStyle(await elem, GlobalMod.Current, GlobalMod.EditMode)
                    })();
                    return elem;
                }));

        if (!this.#config || this.#config.size == 0) {
            console.info(`%c Global mod %c loaded without any config... \n  👉 Add a 'mods' section to your theme %c ${currentTheme} %c to enable modding.`,
                    'color:white;background:purple;', '', 'color:black;background:lightblue;', '');
        } else {
            console.info(`%c Global Mod %c ${GlobalMod.Version} `, 'color:white;background:purple;', 'color:white;background:darkgreen;');
        }
    }

    refreshHomeAssistant() {
        this.#hass = document.querySelector('home-assistant').hass;
    }

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
