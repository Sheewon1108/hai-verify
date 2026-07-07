# Global timezone model: multi = zone inference FORBIDDEN. single = one national zone.

$script:MultiTimezoneCountries = @(
  @{ Pattern = 'russia|\bru\b|moscow|siberia'; Label = 'Russia'; Zones = 11 }
  @{ Pattern = 'united states|\bus\b|california|texas|new york|alaska|hawaii|america'; Label = 'United States'; Zones = 6 }
  @{ Pattern = 'canada|\bca\b|ontario|toronto|british columbia|vancouver|quebec|newfoundland'; Label = 'Canada'; Zones = 6 }
  @{ Pattern = 'mexico|\bmx\b'; Label = 'Mexico'; Zones = 4 }
  @{ Pattern = 'australia|\bau\b|sydney|perth'; Label = 'Australia'; Zones = 3 }
  @{ Pattern = 'brazil|\bbr\b|sao paulo'; Label = 'Brazil'; Zones = 3 }
  @{ Pattern = 'indonesia|\bid\b|jakarta'; Label = 'Indonesia'; Zones = 3 }
  @{ Pattern = 'chile|\bcl\b|santiago'; Label = 'Chile'; Zones = 2 }
  @{ Pattern = 'new zealand|\bnz\b|auckland'; Label = 'New Zealand'; Zones = 2 }
  @{ Pattern = 'kiribati'; Label = 'Kiribati'; Zones = 3 }
  @{ Pattern = 'antarctica'; Label = 'Antarctica'; Zones = 9 }
)

$script:SingleTimezoneCountries = @(
  @{ Pattern = 'korea|south korea|seoul|\bkr\b'; Label = 'Korea'; Tz = 'Korea Standard Time' }
  @{ Pattern = 'japan|tokyo|\bjp\b'; Label = 'Japan'; Tz = 'Tokyo Standard Time' }
  @{ Pattern = 'china|beijing|\bcn\b'; Label = 'China'; Tz = 'China Standard Time' }
  @{ Pattern = 'india|\bin\b|delhi|mumbai'; Label = 'India'; Tz = 'India Standard Time' }
  @{ Pattern = 'iceland|\bis\b'; Label = 'Iceland'; Tz = 'Greenwich Standard Time' }
  @{ Pattern = 'saudi arabia|\bsa\b|riyadh'; Label = 'Saudi Arabia'; Tz = 'Arab Standard Time' }
  @{ Pattern = 'singapore|\bsg\b'; Label = 'Singapore'; Tz = 'Singapore Standard Time' }
  @{ Pattern = 'taiwan|\btw\b|taipei'; Label = 'Taiwan'; Tz = 'Taipei Standard Time' }
  @{ Pattern = 'vietnam|\bvn\b|hanoi'; Label = 'Vietnam'; Tz = 'SE Asia Standard Time' }
  @{ Pattern = 'thailand|\bth\b|bangkok'; Label = 'Thailand'; Tz = 'SE Asia Standard Time' }
  @{ Pattern = 'philippines|\bph\b|manila'; Label = 'Philippines'; Tz = 'Singapore Standard Time' }
)

function Get-TimezoneModelForContext {
  param(
    [string]$Region,
    [string]$Country = ""
  )
  $haystack = "$Region $Country".ToLowerInvariant()

  foreach ($entry in $script:MultiTimezoneCountries) {
    if ($haystack -match $entry.Pattern) {
      return @{
        Model = 'multi'
        Label = $entry.Label
        ZoneCount = $entry.Zones
        Rule = 'Zone inference FORBIDDEN — use USER_TIMEZONE only'
      }
    }
  }

  foreach ($entry in $script:SingleTimezoneCountries) {
    if ($haystack -match $entry.Pattern) {
      return @{
        Model = 'single'
        Label = $entry.Label
        Rule = "One national zone ($($entry.Tz)); location-from-language still FORBIDDEN"
      }
    }
  }

  return @{
    Model = 'multi'
    Label = 'unknown (default safe)'
    Rule = 'Assume multi — zone inference FORBIDDEN'
  }
}