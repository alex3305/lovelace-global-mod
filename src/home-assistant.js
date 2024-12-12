export class HomeAssistant {

    #hass;

    get connection() {
        return (this.#hass ?? this.update()).connection;
    }

    /**
     * Gets whether the user has dark mode enabled in Home Assistant.
     * 
     * @returns {boolean} True when the user has dark mode enabled.
     */
    get darkMode() {
        return (this.#hass ?? this.update()).themes.darkMode;
    }

    get hass() {
        return this.#hass ?? this.update();
    }

    get themeName() {
        return (this.#hass ?? this.update()).themes.theme;
    }

    get themes() {
        return (this.#hass ?? this.update()).themes.themes;
    }

    async update() {
        // https://github.com/thomasloven/lovelace-card-mod/blob/master/src/helpers/hass.ts
        await Promise.race([
            customElements.whenDefined("home-assistant"),
            customElements.whenDefined("hc-main")
        ]);

        const element = customElements.get("home-assistant")
            ? "home-assistant"
            : "hc-main";

        this.#hass = await new Promise((resolve) => {
            const loop = () => {
                document.querySelector(element)?.hass ?
                    resolve(document.querySelector(element)?.hass) :
                    setTimeout(loop);
            };

            loop();
        });

        return this.#hass;
    }

}
