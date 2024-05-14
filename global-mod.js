class GlobalMod {

    static version = '0.0.2';

    static styleClass = 'global-mod';

    hass;

    config;

    styles;
    
    self;

    constructor(hass) {
        this.hass = hass;
        this.config = this.hass.themes.themes['global-mod'];
        this.styles = [];
        self = this;
        
        window.addEventListener('location-changed', this.applyStyles);
        this.applyStyles();
    }

    addStyleElement(tree, cssStyle) {
        let style = tree.querySelector(`style.${GlobalMod.styleClass}`);

        if (!style) {
            let style = document.createElement('style');
            
            style.classList.add(GlobalMod.styleClass);
            style.classList.add('active');
            style.setAttribute('type', 'text/css');
            style.innerText = cssStyle;
            
            tree.appendChild(style);
            return style;
        }

        if (style != null || style != undefined) {
            style.classList.add('active');
        }
    }

    applyStyles() {
        for (const style of self.styles) {
            if (style) {
                style.classList.remove('active');
            }
        }

        for (const path in self.config) {
            const current = window.location.pathname.toLowerCase();

            if (current.includes(path.toLowerCase())) {
                for (const rule of self.config[path]) {
                    const tree = self.selectTree(rule.selector);
                    const style = self.addStyleElement(tree, rule.style);
                    self.styles.push(style);
                    console.log(rule, style);
                }
            }
        }

        for (const style of self.styles) {
            if (style && !style.classList.contains('active')) {
                style.remove();
            }
        }
    }

    selectTree(selector) {
        let components = selector.split('$');
        let tree;

        for (let i = 0; i < components.length; i++) {
            if (components[i]) {
                tree = tree ? tree.querySelector(components[i]) : 
                            document.querySelector(components[i]);

                if (i + 1 < components.length) {
                    tree = tree.shadowRoot;
                }
            }
        }
        
        return tree;
    }
}

new GlobalMod(document.querySelector('home-assistant').hass);
console.info(`%c Header Styler %c ${GlobalMod.version}`, "color:white;background:green;", "");
