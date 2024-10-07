import { name, version } from './package.json';

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
        GlobalMod.instance.applyStyles();

        GlobalMod.instance.addEventListeners();
    }

    static get DarkMode() { return GlobalMod.instance.hass.themes.darkMode; }
    
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

    async addStyleElement(tree, rule) {
        const style = document.createElement('style');
                
        style.classList?.add(GlobalMod.Name);
        style.setAttribute('type', 'text/css');

        if (rule.style) {
            style.textContent += rule.style;
        }

        if (rule['style-dark'] || rule['style-light']) {
            style.textContent += GlobalMod.DarkMode ? 
                    rule['style-dark'] : rule['style-light'];
        }
        
        tree.appendChild(style);
        return style;
    }

    async applyStyles() {
        GlobalMod.instance.styles.forEach(e => e.classList?.remove('active'));

        for (const [name, rule] of GlobalMod.instance.config) {
            if (!rule || !rule.path || !rule.selector) {
                console.error(`Rule ${rule} has syntax errors...`);
            }

            const current = window.location.pathname.toLowerCase();
            const editMode = window.location.search.includes('?edit=1');

            if (current.includes(rule.path.toLowerCase())) {
                if (editMode && rule.disableOnEdit) {
                    continue;
                }

                try {
                    const tree = await GlobalMod.instance.selectTree(`home-assistant$${rule.selector}`, 1, 9);
                    const style = await GlobalMod.instance.addStyleElement(tree, rule);
                    
                    style?.classList?.add(name);
                    style?.classList?.add('active');

                    GlobalMod.instance.styles.push(style);
                } catch {
                    console.error(`Could not create rule ${name} after multiple tries...`);
                }
            }
        }

        GlobalMod.instance.styles.filter(e => !e.classList?.contains('active'))
                                 .forEach(e => e.remove());
    }

    loadConfig() {
        const currentTheme = `${GlobalMod.instance.hass.themes.theme}-${GlobalMod.Name}`;
        GlobalMod.instance.config = new Map();

        for (var k in GlobalMod.instance.hass.themes.themes[currentTheme]) {
            const ruleKey = k.substring(0, k.indexOf('-'));
            const ruleName = k.substring(k.indexOf('-') + 1);

            let rule = {};
            if (GlobalMod.instance.config.has(ruleKey)) {
                rule = GlobalMod.instance.config.get(ruleKey);
            }

            rule[ruleName] = GlobalMod.instance.hass.themes.themes[currentTheme][k];
            GlobalMod.instance.config.set(ruleKey, rule);
        }

        if (!GlobalMod.instance.config || GlobalMod.instance.config.size == 0) {
            console.info(`%c Global mod %c loaded without any config... \n  👉 Add a 'mods' section to your theme %c ${currentTheme} %c to enable modding.`,
                    'color:white;background:purple;', '', 'color:black;background:lightblue;', '');
        } else {
            console.info(`%c Global Mod %c ${GlobalMod.Version} `, 'color:white;background:purple;', 'color:white;background:darkgreen;');
        }
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

            await new Promise((resolve) => setTimeout(resolve, iterations * 25));
            return await GlobalMod.instance.selectTree(selector, iterations + 1, maxIterations);
        }
    }
}

new GlobalMod();
