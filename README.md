# combo-widget

Displays the offers from a group and sorts them according to their lowest outcome and then combines them with their related event

## Configuration example:

__`client-widgets.js`__

```json

...
{
    "order": 1,
    "widgetId": "Event poll widget",
    "args": {
        "groupId": 1000461733,
        "defaultListLimit": 3,
        "selectionLimit": 12
    }
},
...

```

### The widget accepts the following parameter/s:
1. `groupId` - integer - the sports group id
2. `defaultListLimit` - integer - default setting for the size of the list, used when resetting
3. `selectionLimit` - integer - the maximum allowed selections, the bet slip supports up to 12 outcomes

# Other tools

For setting up sass maps, follow this tutorial https://www.hackmonkey.com/2014/sep/configuring-css-source-maps-compass

To use Scss Lint, run "gem install scss_lint"

# Changelog

changelog can be found [here](CHANGELOG.md)
