(()=>{var d="global-mod",c="0.3.0";var r=class n{#e=[];#t=[];constructor(){Promise.all([this.loadConfig(),this.addEventListeners()])}static get Current(){return window.location.pathname.toLowerCase()}static get EditMode(){return window.location.search.includes("?edit=1")}static get Hass(){return document.querySelector("home-assistant").hass}static get Name(){return d}static get Version(){return c}get darkMode(){return n.Hass.themes.darkMode}async addEventListener(e,t,s){e?.addEventListener(t,s,!1)}async addEventListeners(){let e=()=>{document.hidden||this.applyStyles()};Promise.all([this.addEventListener(window,"location-changed",e),this.addEventListener(window,"popstate",e),this.addEventListener(document,"visibilitychange",e),this.addEventListener(document.body,"click",e),this.addEventListener(document.querySelector("hc-main"),"settheme",e),this.addEventListener(document.querySelector("home-assistant"),"settheme",e)])}async applyStyle(e,t=void 0){if(!n.Current.includes(e.path.toLowerCase())||n.EditMode&&e.disabledOnEdit){t?.remove();return}t===void 0&&(t=await this.createStyleElement(e));try{let s=await this.selectTree(`home-assistant$${e.selector}`,1,9);s.contains(t)||(s.append(t),this.#t.push(t))}catch{console.error(`Could not create rule ${e.name} after multiple tries...`)}}async applyStyles(){this.#e.forEach(e=>{this.applyStyle(e,this.#t.find(t=>t.classList?.contains(e.name)))})}async createRule(e,t){let s=t.substring(0,t.lastIndexOf("-"));return{name:s,selector:e[t],path:e[s+"-path"]||"/",style:e[s+"-style"]||"",disabledOnEdit:e[s+"-disable-on-edit"]||!1,darkStyle:e[s+"-style-dark"],lightStyle:e[s+"-style-light"]}}async createStyleElement(e){let t=document.createElement("style");return t.classList?.add(n.Name),t.classList?.add(e.name),t.setAttribute("style","display:none;"),(async()=>!e.darkStyle&&!e.lightStyle?t.textContent=e.style:t.textContent=e.style+(this.darkMode?e.darkStyle:e.lightStyle))(),t}async loadConfig(){let e=`${n.Hass.themes.theme}-${n.Name}`;e in n.Hass.themes.themes?console.warn(`Theme still uses the deprecated ${n.Name}-suffix.`):e=`${n.Hass.themes.theme}`;let t=n.Hass.themes.themes[e];this.#e=await Promise.all(Object.keys(t).filter(s=>s.includes("-selector")).map(s=>this.createRule(t,s)).map(s=>((async()=>this.applyStyle(await s))(),s))),!this.#e||this.#e.size==0?console.info(`%c Global mod %c loaded without any config... 
  \u{1F449} Add a 'mods' section to your theme %c ${e} %c to enable modding.`,"color:white;background:purple;","","color:black;background:lightblue;",""):console.info(`%c Global Mod %c ${n.Version} `,"color:white;background:purple;","color:white;background:darkgreen;")}async selectTree(e,t,s){let o=e.split("$"),i;try{for(let a=0;a<o.length;a++)o[a]&&(i=i?i.querySelector(o[a]):document.querySelector(o[a]),a+1<o.length&&(i=i.shadowRoot));if(!i)throw new Error;return i}catch{if(console.warn(`Retry for ${e}`),t===s)throw new Error(`No Element Found for ${e}`);return await new Promise(a=>setTimeout(a,t*10)),await this.selectTree(e,t+1,s)}}};new r;})();
