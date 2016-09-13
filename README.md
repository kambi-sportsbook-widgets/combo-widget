# combo-widget

![](https://github.com/kambi-sportsbook-widgets/combo-widget/blob/master/screenshot.png?raw=true)

Aggregates betoffers into a combination bet. The betoffers shown are from the events that are tied to the links in the highlight (popular) list of the sportsbook AND match the provided `sport` argument. The events are sorted based on the lowest outcome odds.

## Configuration

```json
"args": {
   "sport": "FOOTBALL",
   "defaultListLimit": 3,
   "selectionLimit": 12,
   "replaceOutcomes": true
}
```

1. `sport` - string - the sport name for events request
2. `defaultListLimit` - integer - default starting size of the list
3. `selectionLimit` - integer - the maximum allowed selections, the bet slip supports up to 12 outcomes
4. `replaceOutcomes` When selecting a different outcome in a betoffer that has already been added to the betslip, should we replace it?


### Build Instructions

Please refer to the [core-library](https://github.com/kambi-sportsbook-widgets/widget-core-library)
