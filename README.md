# combo-widget

Displays the offers from a set of filtered events and sorts them according to their lowest outcome.
The lowest outcome of each betoffer is selected by default

## Configuration example:

__`widget-settings.js`__

```json
var widgetSettings = {
...
   {
       "order": 1,
       "widgetId": "Combo widget",
       "args": {
           "filter": "football/all/all/",
           "defaultListLimit": 3,
           "selectionLimit": 12
       }
   },
...
}

```

### The widget accepts the following parameter/s:
1. `filter` - string - the filter request for the events
2. `defaultListLimit` - integer - default setting for the size of the list, used when resetting the widget
3. `selectionLimit` - integer - the maximum allowed selections, the bet slip supports up to 12 outcomes

# Other tools

For setting up sass maps, follow this tutorial https://www.hackmonkey.com/2014/sep/configuring-css-source-maps-compass

To use Scss Lint, run "gem install scss_lint"

# Build process

### Non-bundled version ( loads the required third party libraries externally )
1. Install node modules using "npm install"
2. Edit the resourcepaths.json file as needed. More details here https://github.com/kambi-sportsbook-widgets/widget-build-tools
3. Run the default gulp task using the "gulp" command. 
4. The built widget is output to the dist folder.

### Bundled version ( includes all third party libraries in the package
1. Install node modules using "npm install"
2. Run the default-bundle gulp task using the "gulp default-bundle" command.
3. The built widget is output to the dist folder.