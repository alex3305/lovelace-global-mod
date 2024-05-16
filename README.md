# Global mod for Home Assistant

A custom Javascript module that can mod everything in Home Assistant using local style elements. Inspired by the Thomas Lovén's [card-mod](https://github.com/thomasloven/lovelace-card-mod).

## Installing

### HACS

1. Add this repo as custom repo to HACS
2. Install this component

### Manual 

1. Copy the `global-mod.js` to your `/config/www/` directory
2. Add `/local/global-mod.js` as a custom resource

## Usage

Modding is based on theme variables. So basically you'll need to add or modify a theme, add a `mods` key and the modding will be applied automatically based on your selection. The modding keys are used to identify the pages where the modding has to occur. 

Shadow Root elements are identified by `$` to align with [card-mod](https://github.com/thomasloven/lovelace-card-mod) for more information check out their readme on [DOM navigation](https://github.com/thomasloven/lovelace-card-mod?tab=readme-ov-file#dom-navigation).

Note that a selector of `home-assistant$` will be prefixed to all given selectors, because all styled elements are within this context.

### Example

```yaml
default:
  global-mod-yellowDrawer-path: '/'
  global-mod-yellowDrawer-selector: 'home-assistant-main$ha-drawer'
  global-mod-yellowDrawer-style: |
    ha-sidebar { 
      background-color: yellow; 
    }
  global-mod-livingroom-path: 'livingroom'
  global-mod-livingroom-selector: 'home-assistant-main$partial-panel-resolver ha-panel-lovelace$hui-root$div'
  global-mod-livingroom-style: |
    .header { 
      --app-header-background-color: red; 
    }
```

This example will mod the default theme and
- On every page including an `/` (which are all pages) the `ha-drawer` will have a yellow background color
- On the livingroom page, the header will have a red background color

![Example](images/example.png)

