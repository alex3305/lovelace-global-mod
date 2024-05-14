class GlobalMod {

    static version = '0.0.2';

    hass;

    constructor(hass) {
        this.hass = hass;
        console.info(`%c Header Styler %c ${GlobalMod.version}`, "color:white;background:green;", "");
    }

    get componentModConfig() {
        return hass.themes.themes['component-mod'];
    }

    addStyle(tree, cssStyle) {
        let style = tree.querySelector('style.card-modder');

        if (!style) {
            style = this.createStyleElement();
            style.innerText = cssStyle;
            tree.appendChild(style);
        }
        else {
            style.innerText = cssStyle;
            tree.replaceWith(style);
        }
    }

    createStyleElement() {
        let style = document.createElement('style');
        style.classList.add('card-modder');
        return style;
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

let modder = new GlobalMod(document.querySelector('home-assistant').hass);
let tree = modder.selectTree('home-assistant$home-assistant-main$ha-drawer');
// modder.addStyle(tree, 'ha-sidebar { background-color: red; }');
