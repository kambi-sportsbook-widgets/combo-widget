import {
  offeringModule,
  widgetModule,
  coreLibrary,
} from 'kambi-widget-core-library'

const pickBetOfferMapper = function(event) {
  event.betOffers = event.betOffers[0]
  return event
}

const isEventInRangeFilter = function(range) {
  range.sort()

  return event => {
    return event.betOffers.outcomes.reduce((inRange, outcome, i) => {
      if (inRange) {
        return inRange
      }

      if (i < 1) {
        return false
      }

      return outcome.odds >= range[0] * 1000 && outcome.odds <= range[1] * 1000
    }, false)
  }
}

const lowestOutcomeSort = function(event1, event2) {
  return (
    Math.min.apply(null, event1.betOffers.outcomes.map(o => o.odds)) -
    Math.min.apply(null, event2.betOffers.outcomes.map(o => o.odds))
  )
}

const getEvents = function(sport, defaultListLimit, range) {
  // Check that we get a valid range, revert to default one if not
  if (
    typeof range !== 'object' ||
    range.length !== 2 ||
    isNaN(range[0] + range[1]) ||
    (range[0] < 1 || range[1] < 1) ||
    range[0] == range[1]
  ) {
    console.debug(
      'Combo widget: Invalid oddsRange',
      range,
      '. Using default value:',
      coreLibrary.defaultArgs.oddsRange
    )
    range = coreLibrary.defaultArgs.oddsRange
  }

  // Call the api and get the filtered events
  return offeringModule
    .getHighlight()
    .then(response => {
      if (!Array.isArray(response.groups)) {
        throw new Error('Invalid response from highlights api')
      }

      // extract separate filters from higlights
      const filters = response.groups
        .filter(group => group.sport === sport)
        .map(group => group.pathTermId)

      // create single filter for Kambi API query
      const filter = widgetModule
        .createFilterUrl(filters)
        .replace(/#.*filter\//, '')

      return offeringModule.getEventsByFilter(filter)
    })
    .then(response => {
      return response.events
        .map(pickBetOfferMapper)
        .filter(event => event.betOffers && event.betOffers.outcomes)
        .filter(
          event =>
            event.betOffers.outcomes.length > 0 &&
            event.betOffers.outcomes.length <= 3
        )
        .filter(event => event.event.openForLiveBetting !== true)
        .filter(isEventInRangeFilter(range))
        .map(event => {
          // find lowest outcome
          // @todo will be removed
          event.betOffers.lowestOutcome = event.betOffers.outcomes.reduce(
            (lowestOutcomeIdx, outcome, i) =>
              outcome.odds < event.betOffers.outcomes[lowestOutcomeIdx].odds
                ? i
                : lowestOutcomeIdx,
            0
          )

          return event
        })
        .sort(lowestOutcomeSort)
        .reduce(
          (acc, event) => {
            let exists = false

            if (event.event.homeName) {
              if (acc.teams.indexOf(event.event.homeName) < 0) {
                acc.teams.push(event.event.homeName)
              } else {
                exists = true
              }
            }

            if (event.event.awayName) {
              if (acc.teams.indexOf(event.event.awayName) < 0) {
                acc.teams.push(event.event.awayName)
              } else {
                exists = true
              }
            }

            if (!exists) {
              if (acc.selected < defaultListLimit) {
                event.betOffers.outcomes[
                  event.betOffers.lowestOutcome
                ].selected = true
                acc.selected++
              }

              acc.events.push(event)
            }

            return acc
          },
          { events: [], teams: [], selected: 0 }
        ).events
    })
}

export default { getEvents }
