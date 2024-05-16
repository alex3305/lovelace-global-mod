'use strict';

export class GlobalMod {

    static instance;
    
    hass;

    config;

    styles;
    
    constructor(hass) {
        GlobalMod.instance = this;

        GlobalMod.instance.hass = hass;
        GlobalMod.instance.styles = [];

        GlobalMod.instance.loadConfig();
        GlobalMod.instance.applyStyles();

        window.addEventListener('location-changed', () => GlobalMod.instance.applyStyles(), false);
        window.addEventListener('popstate', () => GlobalMod.instance.applyStyles(), false);
    }

    static get ActiveClass() { return 'active'; }

    static get DarkMode() { return GlobalMod.instance.hass.themes.darkMode }
    
    static get StyleClass() { return 'global-mod'; }

    static get Version() { return '0.1.0'; }

    async addStyleElement(tree, rule) {
        let style;

        try {
            style = tree.querySelector(`style.${GlobalMod.StyleClass}`);
        } catch (e) { }

        if (!style) {
            style = document.createElement('style');
            
            style.classList?.add(GlobalMod.StyleClass);
            style.classList?.add(GlobalMod.ActiveClass);
            style.setAttribute('type', 'text/css');

            if (rule.style) {
                style.textContent += rule.style;
            }

            if (rule['style-dark'] || rule['style-light']) {
                style.textContent += GlobalMod.instance.DarkMode ? 
                        rule['style-dark'] : rule['style-light'];
            }
            
            tree.appendChild(style);
            return style;
        }

        style.classList.add(GlobalMod.ActiveClass);
    }

    async applyStyles() {
        for (const style of GlobalMod.instance.styles) {
            if (style) {
                style?.classList.remove(GlobalMod.ActiveClass);
            }
        }

        for (const [_, rule] of GlobalMod.instance.config) {
            if (!rule || !rule.path || !rule.selector) {
                console.error(`Rule ${rule} has syntax errors...`);
            }

            const current = window.location.pathname.toLowerCase();

            if (current.includes(rule.path.toLowerCase())) {
                try {
                    const tree = await GlobalMod.instance.selectTree(`home-assistant$${rule.selector}`, 1, 6);
                    const style = await GlobalMod.instance.addStyleElement(tree, rule);

                    GlobalMod.instance.styles.push(style);
                } catch(e) {
                    console.error(`Could not add style element to ${rule.selector}.`);
                }
            }
        }

        for (const style of GlobalMod.instance.styles) {
            if (style && !style.classList.contains(GlobalMod.ActiveClass)) {
                style.remove();
            }
        }
    }

    loadConfig() {
        const currentTheme = GlobalMod.instance.hass.themes.theme;
        GlobalMod.instance.config = new Map();
        GlobalMod.instance.config = new Map();

        for (var k in GlobalMod.instance.hass.themes.themes[currentTheme]) {
            if (!k.startsWith(GlobalMod.StyleClass)) {
                continue;
            }

            const r = k.substring(GlobalMod.StyleClass.length + 1);
            const ruleKey = r.substring(0, r.indexOf('-'));
            const ruleName = r.substring(r.indexOf('-') + 1);

            let rule = {};
            if (GlobalMod.instance.config.has(ruleKey)) {
                rule = GlobalMod.instance.config.get(ruleKey);
            }

            rule[ruleName] = GlobalMod.instance.hass.themes.themes[currentTheme][k];
            GlobalMod.instance.config.set(ruleKey, rule);
        }

        if (!GlobalMod.instance.config || GlobalMod.instance.config.size == 0) {
            console.info(`%c Global mod %c loaded without any config... \n  👉 Add a \'mods\' section to your theme %c ${currentTheme} %c to enable modding.`,
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
                if (components[i]) {
                    tree = tree ? tree.querySelector(components[i]) : 
                                document.querySelector(components[i]);

                    if (i + 1 < components.length) {
                        tree = tree.shadowRoot;
                    }
                }
            }

            if (!tree) {
                throw new Error();
            }

            return tree;
        } catch (e) {
            console.warn(`Retry for ${selector}`);

            if (iterations === maxIterations) {
                throw new Error(`No Element Found for ${selector}`);
            }

            await new Promise((resolve) => setTimeout(resolve, iterations * 25));
            return await GlobalMod.instance.selectTree(selector, iterations + 1, maxIterations);
        }
    }
}

new GlobalMod(document.querySelector('home-assistant').hass);
