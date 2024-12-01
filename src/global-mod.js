import { name, version } from '../package.json';

class GlobalMod {

    static instance;
    
    hass;

    config;

    styles;
    
    constructor() {
        GlobalMod.instance = this;
        GlobalMod.instance.styles = [];
        GlobalMod.instance.refreshHomeAssistant();
    
        GlobalMod.instance.loadConfig();
        GlobalMod.instance.addEventListeners();
    }

    static get Current() { return window.location.pathname.toLowerCase(); }

    static get DarkMode() { return GlobalMod.instance.hass.themes.darkMode; }
    
    static get EditMode() { return window.location.search.includes('?edit=1'); }
    
    static get Name() { return name; }

    static get Version() { return version; }

    addEventListeners() {
        // Listen to location-changed for navigation.
        // Wrapped in setTimeout to try and execute last.
        // Reference: https://github.com/home-assistant/frontend/blob/fa03c58a93219ad008df3806ac50d2fd893ad87d/hassio/src/hassio-main.ts#L49-L56
        window.addEventListener('location-changed', () => setTimeout(() => GlobalMod.instance.applyStyles()), false);

        // Listen to popstate for history tracking.
        window.addEventListener('popstate', () => GlobalMod.instance.applyStyles(), false);

        // Listen to visibility change (ie. re-focus) for scroll changes
        // Reference: https://github.com/home-assistant/frontend/issues/20854
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                GlobalMod.instance.applyStyles();
            }
        }, false);

        // Listen to click event on document body for navigation.
        // Reference: https://github.com/home-assistant/frontend/blob/fa03c58a93219ad008df3806ac50d2fd893ad87d/hassio/src/hassio-main.ts#L58-L65
        document.body.addEventListener('click', () => GlobalMod.instance.applyStyles(), false);

        // Listen to settheme events for when themes change and also reload hass object.
        // Reference: https://github.com/thomasloven/lovelace-card-mod/blob/f59abc785eabb689ac42a9076197254421f96c60/src/theme-watcher.ts
        document.querySelector('hc-main')?.addEventListener('settheme', () => {
            GlobalMod.instance.refreshHomeAssistant();
            GlobalMod.instance.applyStyles();
        }, false);
        document.querySelector('home-assistant')?.addEventListener('settheme', () => {
            GlobalMod.instance.refreshHomeAssistant();
            GlobalMod.instance.applyStyles();
        }, false);
    }

    async createStyleElement(rule) {
        const style = document.createElement('style');
                
        style.classList?.add(GlobalMod.Name);
        style.setAttribute('type', 'text/css');
        style.setAttribute('style', 'display:none;');

        style.textContent += rule.style;
        if (rule.darkStyle !== undefined || rule.lightStyle !== undefined) {
            style.textContent += GlobalMod.DarkMode ? 
                rule.darkStyle : rule.lightStyle;
        }

        return style;
    }

    async applyStyle(name, rule, current, editMode, style = undefined) {
        if (!current.includes(rule.path.toLowerCase())) {
            if (style !== undefined) {
                style.remove();
            }

            return;
        }

        if (editMode && rule.disabledOnEdit) {
            return;
        }

        if (style === undefined) {
            style = await GlobalMod.instance.createStyleElement(rule);
            style?.classList?.add(name);
        }

        try {
            const tree = await GlobalMod.instance.selectTree(`home-assistant$${rule.selector}`, 1, 9);
            
            if (!tree.contains(style)) {
                tree.appendChild(style);
                GlobalMod.instance.styles.push(style);
            }
        } catch {
            console.error(`Could not create rule ${name} after multiple tries...`);
        }
    }

    async applyStyles() {
        const current = GlobalMod.Current;
        const editMode = GlobalMod.EditMode;

        for await (const [name, rule] of GlobalMod.instance.config) {
            let style = GlobalMod.instance.styles.find(e => e.classList?.contains(name));
            GlobalMod.instance.applyStyle(name, rule, current, editMode, style);
        }
    }

    async loadConfig() {
        let currentTheme = `${GlobalMod.instance.hass.themes.theme}-${GlobalMod.Name}`;

        // Fall back to theme name without global-mod suffix. This should be temporary.
        if (!(currentTheme in GlobalMod.instance.hass.themes.themes)) {
            currentTheme = `${GlobalMod.instance.hass.themes.theme}`;
        } else {
            console.warn(`Theme still uses the deprecated ${GlobalMod.Name}-suffix.`);
        }

        const theme = GlobalMod.instance.hass.themes.themes[currentTheme];
        GlobalMod.instance.config = await GlobalMod.instance.loadRules(theme);

        if (!GlobalMod.instance.config || GlobalMod.instance.config.size == 0) {
            console.info(`%c Global mod %c loaded without any config... \n  👉 Add a 'mods' section to your theme %c ${currentTheme} %c to enable modding.`,
                    'color:white;background:purple;', '', 'color:black;background:lightblue;', '');
        } else {
            console.info(`%c Global Mod %c ${GlobalMod.Version} `, 'color:white;background:purple;', 'color:white;background:darkgreen;');
        }
    }

    async loadRules(theme) {
        const current = GlobalMod.Current;
        const editMode = GlobalMod.EditMode;
        const rules = new Map();

        for await (var k of Object.keys(theme).filter(e => e.includes('-selector'))) {
            const ruleKey = k.substring(0, k.lastIndexOf("-"));
            const rule = {
                selector: theme[k],
                path: theme[ruleKey + "-path"] || "/",
                style: theme[ruleKey + "-style"] || "",
                disabledOnEdit: theme[ruleKey + "-disable-on-edit"] || false,
                darkStyle: theme[ruleKey + "-style-dark"],
                lightStyle: theme[ruleKey + "-style-light"],
            };

            rules.set(ruleKey, rule);
            GlobalMod.instance.applyStyle(ruleKey, rule, current, editMode);
        }

        return rules;
    }

    refreshHomeAssistant() {
        GlobalMod.instance.hass = document.querySelector('home-assistant').hass;
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
            return await GlobalMod.instance.selectTree(selector, iterations + 1, maxIterations);
        }
    }
}

new GlobalMod();
