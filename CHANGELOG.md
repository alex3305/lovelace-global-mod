# Changelog

## 0.1.5
- Bugfix: Switching dashboards wouldn't always trigger global mod
- Bugfix: Fix global mod on theme change

## 0.1.4
- Bugfix: re-add active class
- Add event listener for when HA becomes visible again (ie. alt-tab)

## 0.1.2
- Bugfix: remove active class optimization
- Increased exponential retries

## 0.1.1
- Move to another mod format, otherwise it was incompatible with Home Assistant 🤷‍♀️
- Add `settheme` listener to reload on theme change
- Housekeeping: Add Node to project
- Housekeeping: Add linting to project
- Housekeeping: Add editorconfig

## 0.1.0 _(unreleased)_
- Add global, dark and light styles
- Remove `home-assistant$home-assistant-main$` selector requirement
- Move to `mods` in current theme
- Add exponential backoff to find page elements
- Various bugfixes
- Updated readme

## 0.0.3 _(unreleased)_
- Implemented async/await
- Added documentation
- Added HACS

## 0.0.2 _(unreleased)_
- First fully working version
- Renamed to global-mod
- Implemented ES6 class with functions

## 0.0.1 _(as header-styler, unreleased)_
- Initial proof of concept
- Including event listener for page changes
