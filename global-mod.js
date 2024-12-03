(()=>{var y="global-mod",p="0.3.0";var c=class o{#e;#t=[];#s=[];constructor(){new Promise(e=>{let t=()=>{document.querySelector("home-assistant")?.hass!==void 0?e(document.querySelector("home-assistant").hass):setTimeout(t)};t()}).then(e=>{this.#e=e,Promise.all([this.loadConfig(),this.addEventListeners()])})}static get Current(){return window.location.pathname.toLowerCase()}static get EditMode(){return window.location.search.includes("?edit=1")}static get Name(){return y}static get Version(){return p}get darkMode(){return this.#e.themes.darkMode}get theme(){let e=this.#e.themes.themes,t=this.#e.themes.theme;return Object.hasOwn(e,`${t}-${o.Name}`)?(console.warn(`Theme still uses the deprecated ${o.Name}-suffix.`),e[`${t}-${o.Name}`]):e[t]}async addEventListener(e,t,s){e?.addEventListener(t,s,!1)}async addEventListeners(){let e=()=>{document.hidden||this.applyStyles()};Promise.all([this.addEventListener(window,"location-changed",e),this.addEventListener(window,"popstate",e),this.addEventListener(document,"visibilitychange",e),this.addEventListener(document.body,"click",e),this.addEventListener(document.querySelector("hc-main"),"settheme",e),this.addEventListener(document.querySelector("home-assistant"),"settheme",e)])}async applyStyle(e,t=void 0){if(!o.Current.includes(e.path.toLowerCase())||o.EditMode&&e.disabledOnEdit){t?.remove();return}t===void 0&&(t=await this.createStyleElement(e));try{let s=await this.findElement(document.body,`home-assistant$${e.selector}`);s.contains(t)||Promise.all([s.append(t),this.#s.push(t)])}catch(s){console.error(`Error while applying style: ${s}`)}}async applyStyles(){this.#t.forEach(e=>{this.applyStyle(e,this.#s.find(t=>t.classList?.contains(e.name)))})}async createRule(e,t){let s=t.substring(0,t.lastIndexOf("-"));return{name:s,selector:e[t],path:e[s+"-path"]||"/",style:e[s+"-style"]||"",disabledOnEdit:e[s+"-disable-on-edit"]||!1,darkStyle:e[s+"-style-dark"],lightStyle:e[s+"-style-light"]}}async createStyleElement(e){let t=document.createElement("style");return t.classList?.add(o.Name),t.classList?.add(e.name),t.setAttribute("style","display:none;"),(async()=>!e.darkStyle&&!e.lightStyle?t.textContent=e.style:t.textContent=e.style+" "+(this.darkMode?e.darkStyle:e.lightStyle))(),t}async loadConfig(){let e=this.theme;this.#t=await Promise.all(Object.keys(e).filter(t=>t.includes("-selector")).map(t=>this.createRule(e,t)).map(t=>((async()=>this.applyStyle(await t))(),t))),!this.#t||this.#t.size==0?console.info("%c Global mod %c loaded without any config...","color:white;background:purple;","","color:black;background:lightblue;",""):console.info(`%c Global Mod %c ${o.Version} `,"color:white;background:purple;","color:white;background:darkgreen;")}async findElement(e,t){let s=t.trim().split(/([$])/).filter(d=>d!="");for(let d of s)e=await this.waitForElement(e,d);return e}waitForElement(e,t,s=1e3){let d={childList:!0,subtree:!0},n=null;return new Promise((i,f)=>{if(t==="$"){if(e.shadowRoot)return i(e.shadowRoot)}else if(n=e.querySelector(t),n)return i(n);let r=new MutationObserver(g=>{g.forEach(h=>{h.type==="childList"&&h.addedNodes.forEach(a=>{if(a.nodeType===Node.ELEMENT_NODE){if(t==="$"){if(a.shadowRoot)return r.disconnect(),clearTimeout(l),i(a.shadowRoot)}else{if(a.matches(t))return r.disconnect(),clearTimeout(l),i(a);if(a.shadowRoot){let m=a.shadowRoot.querySelector(t);if(m)return r.disconnect(),clearTimeout(l),i(m);r.observe(a.shadowRoot,d)}}if(n=e.querySelector(t),n)return r.disconnect(),clearTimeout(l),i(n)}})})});r.observe(e,d);let l=setTimeout(()=>{if(r.disconnect(),t==="$"){if(e.shadowRoot)return i(e.shadowRoot)}else if(n=e.querySelector(t),n)return i(n);return f(new Error(`Element not found for ${t} in ${e.tagName}`))},s)})}};new c;})();
