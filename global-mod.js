'use strict';

class GlobalMod {

    static instance;
    
    hass;

    config;

    styles;
    
    constructor() {
        GlobalMod.instance = this;

        GlobalMod.instance.hass = document.querySelector('home-assistant').hass;
        GlobalMod.instance.styles = [];

        GlobalMod.instance.loadConfig();
        GlobalMod.instance.applyStyles();

        window.addEventListener('location-changed', () => GlobalMod.instance.applyStyles(), false);
        window.addEventListener('popstate', () => GlobalMod.instance.applyStyles(), false);
        window.addEventListener('settheme', () => {
            GlobalMod.instance.hass = document.querySelector('home-assistant').hass;
            GlobalMod.instance.applyStyles();
        }, false);
    }

    static get DarkMode() { return GlobalMod.instance.hass.themes.darkMode; }
    
    static get Name() { return 'global-mod'; }

    static get Version() { return '0.1.4'; }

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

            if (current.includes(rule.path.toLowerCase())) {
                try {
                        const tree = await GlobalMod.instance.selectTree(`home-assistant$${rule.selector}`, 1, 9);
                    const style = await GlobalMod.instance.addStyleElement(tree, rule);
                    
                    style?.classList?.add(name);
                    style?.classList?.add('active');

                    GlobalMod.instance.styles.push(style);
                } catch {
                    console.error(`Could not add style element to ${rule.selector}.`);
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
