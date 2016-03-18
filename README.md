# combo-widget

Displays the offers from a set of filtered events and sorts them according to their lowest outcome

## Configuration example:

__`client-widgets.js`__

```json

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

```

### The widget accepts the following parameter/s:
1. `filter` - string - the filter for the events
2. `defaultListLimit` - integer - default setting for the size of the list, used when resetting
3. `selectionLimit` - integer - the maximum allowed selections, the bet slip supports up to 12 outcomes

# Other tools

For setting up sass maps, follow this tutorial https://www.hackmonkey.com/2014/sep/configuring-css-source-maps-compass

To use Scss Lint, run "gem install scss_lint"

# Build process

1. Install node modules using "npm install"
2. Edit the buildparameters.json file as needed. More details here https://github.com/kambi-sportsbook-widgets/widget-build-tools
3. Run the default gulp task using the "gulp" command. 

# Changelog

changelog can be found [here](CHANGELOG.md)
