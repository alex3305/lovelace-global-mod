// Path found in https://github.com/thomasloven/lovelace-card-mod/blob/master/src/patch/hui-root.ts
// home-assistant$home-assistant-main$partial-panel-resolver ha-panel-lovelace$hui-root

function getHuiRootDiv() {
    let haPanelLovelace = document.querySelector('home-assistant')
        .shadowRoot
        .querySelector('home-assistant-main')
        .shadowRoot
        .querySelector('partial-panel-resolver ha-panel-lovelace');

    // if (haPanelLovelace === null) {
    //     return null;
    // }

    let huiRootDiv = haPanelLovelace.shadowRoot
        .querySelector('hui-root')
        .shadowRoot
        .querySelector('div');

    return huiRootDiv;
}

window.addEventListener('location-changed', function () {
    let huiRootDiv = getHuiRootDiv();
    
    // console.log(huiRootDiv.querySelector('#view hui-view').style);
    // console.log(huiRootDiv.querySelector('.header').style);

    if (huiRootDiv !== null) {
        if (window.location.pathname.endsWith('rituals-perfume-genie')) {
            huiRootDiv.querySelector('.header').style = `
                background-color: #242222;
                color: #fff;
            `;
        } else {
            huiRootDiv.querySelector('.header').style = '';
        }
    }
});

console.info(`%c Header Styler %c 0.0.1`, "color:white;background:green;", "");
console.log(document.querySelector('home-assistant').hass.themes.themes['header-mod']);
