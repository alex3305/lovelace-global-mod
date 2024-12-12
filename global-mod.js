(()=>{var c=class{#e;get connection(){return(this.#e??this.update()).connection}get darkMode(){return(this.#e??this.update()).themes.darkMode}get hass(){return this.#e??this.update()}get themeName(){return(this.#e??this.update()).themes.theme}get themes(){return(this.#e??this.update()).themes.themes}async update(){await Promise.race([customElements.whenDefined("home-assistant"),customElements.whenDefined("hc-main")]);let e=customElements.get("home-assistant")?"home-assistant":"hc-main";return this.#e=await new Promise(t=>{let s=()=>{document.querySelector(e)?.hass?t(document.querySelector(e)?.hass):setTimeout(s)};s()}),this.#e}};var y="global-mod",f="0.3.0";var m=class i{#e=[];#t;#n=!1;#s=[];constructor(){this.#t=new c,this.#t.update().then(()=>{Promise.all([this.loadConfig(),this.addEventListeners()])}),console.info(`%c Global Mod %c ${i.Version} `,"color:white;background:purple;","color:white;background:darkgreen;")}static get Current(){return window.location.pathname.toLowerCase()}static get EditMode(){return window.location.search.includes("?edit=1")}static get Name(){return y}static get Version(){return f}get theme(){let e=this.#t.themes,t=this.#t.themeName;return Object.hasOwn(e,`${t}-${i.Name}`)?(console.warn(`Theme still uses the deprecated ${i.Name}-suffix.`),e[`${t}-${i.Name}`]):e[t]}async addEventListener(e,t,s){e?.addEventListener(t,s,!1)}async addEventListeners(){let e=()=>{document.hidden||this.applyStyles()},t=async()=>{await this.#t.update(),await this.loadConfig(),this.#s.forEach(s=>s.classList.add("pending")),this.applyStyles(!0),this.#s.filter(s=>s.classList.contains("pending")).forEach(s=>s.remove())};Promise.all([this.addEventListener(window,"location-changed",e),this.addEventListener(window,"popstate",e),this.addEventListener(document,"visibilitychange",e),this.addEventListener(document.body,"click",e),this.#t.connection.subscribeEvents(()=>{setTimeout(t,500)},"themes_updated"),this.addEventListener(document.querySelector("hc-main"),"settheme",t),this.addEventListener(document.querySelector("home-assistant"),"settheme",t)])}async applyStyle(e,t=void 0,s=!1){if(!i.Current.includes(e.path.toLowerCase())||i.EditMode&&e.disabledOnEdit){t?.remove();return}if(t===void 0)t=await this.createStyleElement(e);else if(s){let n=await this.createStyleElement(e);t.textContent=n.textContent}t.classList.remove("pending");try{let n=await this.findElement(document.body,`home-assistant$${e.selector}`),d=n.querySelector(`style.${i.Name}.${e.name}`)!==null;n&&!d&&Promise.all([n.append(t),this.#s.push(t)])}catch(n){console.error(`Error while applying style: ${n}`)}}async applyStyles(e=!1){this.#e.forEach(t=>{this.applyStyle(t,this.#s.find(s=>s.classList?.contains(t.name)),e)})}async createRule(e,t){let s=t.substring(0,t.lastIndexOf("-"));return{name:s,selector:e[t],path:e[s+"-path"]||"/",style:e[s+"-style"]||"",disabledOnEdit:e[s+"-disable-on-edit"]||!1,darkStyle:e[s+"-style-dark"],lightStyle:e[s+"-style-light"]}}async createStyleElement(e){let t=document.createElement("style");return t.classList?.add(i.Name,e.name),t.style.display="none",(async()=>!e.darkStyle&&!e.lightStyle?t.textContent=e.style:t.textContent=e.style+" "+(this.#t.darkMode?e.darkStyle:e.lightStyle))(),t}async loadConfig(){let e=this.theme;this.#e=await Promise.all(Object.keys(e).filter(t=>t.includes("-selector")).map(t=>this.createRule(e,t))),this.#n||(this.#e.forEach(t=>this.applyStyle(t)),this.#n=!0),(!this.#e||this.#e.size==0)&&console.info("%c Global mod %c loaded without any config...","color:white;background:purple;","","color:black;background:lightblue;","")}async findElement(e,t){let s=t.trim().split("$");for(let n of s)e=await this.waitForElement(e,n);return e}waitForElement(e,t,s=10,n=0){let d={childList:!0,subtree:!0},l=null;return new Promise((o,g)=>{if(t===""){if(e.shadowRoot)return o(e.shadowRoot)}else if(l=e.querySelector(t)||e.shadowRoot?.querySelector(t),l)return o(l);let r=new MutationObserver(w=>{if(t===""){if(e.shadowRoot)return r.disconnect(),clearTimeout(h),o(e.shadowRoot)}else for(let E of w.filter(a=>a.type==="childList"))for(let a of E.addedNodes){if(a.nodeType===Node.ELEMENT_NODE&&a.matches(t))return r.disconnect(),clearTimeout(h),o(a);if(a.shadowRoot){let u=a.shadowRoot.querySelector(t);if(u)return r.disconnect(),clearTimeout(h),o(u);r.observe(a.shadowRoot,d)}}});r.observe(e,d);let h=setTimeout(()=>(r.disconnect(),n<10?o(this.waitForElement(e,t,s,++n)):g(new Error(`Element not found for ${t} in ${e.tagName?.toLowerCase()}`))),s*n)})}};new m;})();
