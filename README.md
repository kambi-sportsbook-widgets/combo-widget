# combo-widget

![](https://github.com/kambi-sportsbook-widgets/combo-widget/blob/master/screenshot.png?raw=true)

A widget that shows several betoffers in list, the user can add more betoffers to this list. When the user press the "ADD TO BETSLIP" button the widget then aggregates the betoffers shown in the widget into a combination bet and places it in the betslip.

The betoffers shown are from the events that are tied to the links in the highlight (popular) list of the sportsbook AND match the provided `sport` argument. The events are sorted based on the lowest outcome odds.

The user can remove bets by clicking the X icon in the top right corner of the widget

## Configuration

Arguments and default values:
```json
"args": {
   "sport": "FOOTBALL",
   "defaultListLimit": 3,
   "selectionLimit": 12,
   "replaceOutcomes": true,
   "widgetTrackingName": "gm-combo-widget"
   "oddsRange": [1,8]
}
```

1. `sport` - string - the sport name for events request
2. `defaultListLimit` - integer - default starting size of the list
3. `selectionLimit` - integer - the maximum allowed selections, the bet slip supports up to 12 outcomes
4. `replaceOutcomes` When selecting a different outcome in a betoffer that has already been added to the betslip, should we replace it?
5. `widgetTrackingName` - string - tracking name for analytics purposes
6. `oddsRange` - array - Filters out events if none of their bet outcomes is not with this range (Should be an array of 2 numbers for example `[1.5, 5.5]`)


### Build Instructions

Please refer to the [core-library](https://github.com/kambi-sportsbook-widgets/widget-core-library)
