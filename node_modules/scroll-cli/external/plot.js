// @observablehq/plot v0.6.15 Copyright 2020-2023 Observable, Inc.
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3@7.9.0/dist/d3.min.js')) :
typeof define === 'function' && define.amd ? define(['exports', 'd3@7.9.0/dist/d3.min.js'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Plot = global.Plot || {}, global.d3));
})(this, (function (exports, d3) { 'use strict';

var version = "0.6.15";

function defined(x) {
  return x != null && !Number.isNaN(x);
}

function ascendingDefined(a, b) {
  return +defined(b) - +defined(a) || d3.ascending(a, b);
}

function descendingDefined(a, b) {
  return +defined(b) - +defined(a) || d3.descending(a, b);
}

function nonempty(x) {
  return x != null && `${x}` !== "";
}

function finite$1(x) {
  return isFinite(x) ? x : NaN;
}

function positive(x) {
  return x > 0 && isFinite(x) ? x : NaN;
}

function negative(x) {
  return x < 0 && isFinite(x) ? x : NaN;
}

function format(date, fallback) {
  if (!(date instanceof Date)) date = new Date(+date);
  if (isNaN(date)) return typeof fallback === "function" ? fallback(date) : fallback;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  return `${formatYear(date.getUTCFullYear())}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}${
    hours || minutes || seconds || milliseconds ? `T${pad(hours, 2)}:${pad(minutes, 2)}${
      seconds || milliseconds ? `:${pad(seconds, 2)}${
        milliseconds ? `.${pad(milliseconds, 3)}` : ``
      }` : ``
    }Z` : ``
  }`;
}

function formatYear(year) {
  return year < 0 ? `-${pad(-year, 6)}`
    : year > 9999 ? `+${pad(year, 6)}`
    : pad(year, 4);
}

function pad(value, width) {
  return `${value}`.padStart(width, "0");
}

const re = /^(?:[-+]\d{2})?\d{4}(?:-\d{2}(?:-\d{2})?)?(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[-+]\d{2}:?\d{2})?)?$/;

function parse(string, fallback) {
  if (!re.test(string += "")) return typeof fallback === "function" ? fallback(string) : fallback;
  return new Date(string);
}

// Like a sort comparator, returns a positive value if the given array of values
// is in ascending order, a negative value if the values are in descending
// order. Assumes monotonicity; only tests the first and last values.
function orderof(values) {
  if (values == null) return;
  const first = values[0];
  const last = values[values.length - 1];
  return d3.descending(first, last);
}

const durationSecond = 1000;
const durationMinute = durationSecond * 60;
const durationHour = durationMinute * 60;
const durationDay = durationHour * 24;
const durationWeek = durationDay * 7;
const durationMonth = durationDay * 30;
const durationYear = durationDay * 365;

// See https://github.com/d3/d3-time/blob/9e8dc940f38f78d7588aad68a54a25b1f0c2d97b/src/ticks.js#L14-L33
const tickIntervals = [
  ["millisecond", 1],
  ["2 milliseconds", 2],
  ["5 milliseconds", 5],
  ["10 milliseconds", 10],
  ["20 milliseconds", 20],
  ["50 milliseconds", 50],
  ["100 milliseconds", 100],
  ["200 milliseconds", 200],
  ["500 milliseconds", 500],
  ["second", durationSecond],
  ["5 seconds", 5 * durationSecond],
  ["15 seconds", 15 * durationSecond],
  ["30 seconds", 30 * durationSecond],
  ["minute", durationMinute],
  ["5 minutes", 5 * durationMinute],
  ["15 minutes", 15 * durationMinute],
  ["30 minutes", 30 * durationMinute],
  ["hour", durationHour],
  ["3 hours", 3 * durationHour],
  ["6 hours", 6 * durationHour],
  ["12 hours", 12 * durationHour],
  ["day", durationDay],
  ["2 days", 2 * durationDay],
  ["week", durationWeek],
  ["2 weeks", 2 * durationWeek], // https://github.com/d3/d3-time/issues/46
  ["month", durationMonth],
  ["3 months", 3 * durationMonth],
  ["6 months", 6 * durationMonth], // https://github.com/d3/d3-time/issues/46
  ["year", durationYear],
  ["2 years", 2 * durationYear],
  ["5 years", 5 * durationYear],
  ["10 years", 10 * durationYear],
  ["20 years", 20 * durationYear],
  ["50 years", 50 * durationYear],
  ["100 years", 100 * durationYear] // TODO generalize to longer time scales
];

const durations = new Map([
  ["second", durationSecond],
  ["minute", durationMinute],
  ["hour", durationHour],
  ["day", durationDay],
  ["monday", durationWeek],
  ["tuesday", durationWeek],
  ["wednesday", durationWeek],
  ["thursday", durationWeek],
  ["friday", durationWeek],
  ["saturday", durationWeek],
  ["sunday", durationWeek],
  ["week", durationWeek],
  ["month", durationMonth],
  ["year", durationYear]
]);

const timeIntervals = new Map([
  ["second", d3.timeSecond],
  ["minute", d3.timeMinute],
  ["hour", d3.timeHour],
  ["day", d3.timeDay], // https://github.com/d3/d3-time/issues/62
  ["monday", d3.timeMonday],
  ["tuesday", d3.timeTuesday],
  ["wednesday", d3.timeWednesday],
  ["thursday", d3.timeThursday],
  ["friday", d3.timeFriday],
  ["saturday", d3.timeSaturday],
  ["sunday", d3.timeSunday],
  ["week", d3.timeWeek],
  ["month", d3.timeMonth],
  ["year", d3.timeYear]
]);

const utcIntervals = new Map([
  ["second", d3.utcSecond],
  ["minute", d3.utcMinute],
  ["hour", d3.utcHour],
  ["day", d3.unixDay],
  ["monday", d3.utcMonday],
  ["tuesday", d3.utcTuesday],
  ["wednesday", d3.utcWednesday],
  ["thursday", d3.utcThursday],
  ["friday", d3.utcFriday],
  ["saturday", d3.utcSaturday],
  ["sunday", d3.utcSunday],
  ["week", d3.utcWeek],
  ["month", d3.utcMonth],
  ["year", d3.utcYear]
]);

// These hidden fields describe standard intervals so that we can, for example,
// generalize a scale’s time interval to a larger ticks time interval to reduce
// the number of displayed ticks. TODO We could instead allow the interval
// implementation to expose a “generalize” method that returns a larger, aligned
// interval; that would allow us to move this logic to D3, and allow
// generalization even when a custom interval is provided.
const intervalDuration = Symbol("intervalDuration");
const intervalType = Symbol("intervalType");

// We greedily mutate D3’s standard intervals on load so that the hidden fields
// are available even if specified as e.g. d3.utcMonth instead of "month".
for (const [name, interval] of timeIntervals) {
  interval[intervalDuration] = durations.get(name);
  interval[intervalType] = "time";
}
for (const [name, interval] of utcIntervals) {
  interval[intervalDuration] = durations.get(name);
  interval[intervalType] = "utc";
}

const utcFormatIntervals = [
  ["year", d3.utcYear, "utc"],
  ["month", d3.utcMonth, "utc"],
  ["day", d3.unixDay, "utc", 6 * durationMonth],
  ["hour", d3.utcHour, "utc", 3 * durationDay],
  ["minute", d3.utcMinute, "utc", 6 * durationHour],
  ["second", d3.utcSecond, "utc", 30 * durationMinute]
];

const timeFormatIntervals = [
  ["year", d3.timeYear, "time"],
  ["month", d3.timeMonth, "time"],
  ["day", d3.timeDay, "time", 6 * durationMonth],
  ["hour", d3.timeHour, "time", 3 * durationDay],
  ["minute", d3.timeMinute, "time", 6 * durationHour],
  ["second", d3.timeSecond, "time", 30 * durationMinute]
];

// An interleaved array of UTC and local time intervals, in descending order
// from largest to smallest, used to determine the most specific standard time
// format for a given array of dates. This is a subset of the tick intervals
// listed above; we only need the breakpoints where the format changes.
const formatIntervals = [
  utcFormatIntervals[0],
  timeFormatIntervals[0],
  utcFormatIntervals[1],
  timeFormatIntervals[1],
  utcFormatIntervals[2],
  timeFormatIntervals[2],
  // Below day, local time typically has an hourly offset from UTC and hence the
  // two are aligned and indistinguishable; therefore, we only consider UTC, and
  // we don’t consider these if the domain only has a single value.
  ...utcFormatIntervals.slice(3)
];

function parseTimeInterval(input) {
  let name = `${input}`.toLowerCase();
  if (name.endsWith("s")) name = name.slice(0, -1); // drop plural
  let period = 1;
  const match = /^(?:(\d+)\s+)/.exec(name);
  if (match) {
    name = name.slice(match[0].length);
    period = +match[1];
  }
  switch (name) {
    case "quarter":
      name = "month";
      period *= 3;
      break;
    case "half":
      name = "month";
      period *= 6;
      break;
  }
  let interval = utcIntervals.get(name);
  if (!interval) throw new Error(`unknown interval: ${input}`);
  if (period > 1 && !interval.every) throw new Error(`non-periodic interval: ${name}`);
  return [name, period];
}

function timeInterval(input) {
  return asInterval(parseTimeInterval(input), "time");
}

function utcInterval(input) {
  return asInterval(parseTimeInterval(input), "utc");
}

function asInterval([name, period], type) {
  let interval = (type === "time" ? timeIntervals : utcIntervals).get(name);
  if (period > 1) {
    interval = interval.every(period);
    interval[intervalDuration] = durations.get(name) * period;
    interval[intervalType] = type;
  }
  return interval;
}

// If the given interval is a standard time interval, we may be able to promote
// it a larger aligned time interval, rather than showing every nth tick.
function generalizeTimeInterval(interval, n) {
  if (!(n > 1)) return; // no need to generalize
  const duration = interval[intervalDuration];
  if (!tickIntervals.some(([, d]) => d === duration)) return; // nonstandard or unknown interval
  if (duration % durationDay === 0 && durationDay < duration && duration < durationMonth) return; // not generalizable
  const [i] = tickIntervals[d3.bisector(([, step]) => Math.log(step)).center(tickIntervals, Math.log(duration * n))];
  return (interval[intervalType] === "time" ? timeInterval : utcInterval)(i);
}

function formatTimeInterval(name, type, anchor) {
  const format = type === "time" ? d3.timeFormat : d3.utcFormat;
  // For tips and legends, use a format that doesn’t require context.
  if (anchor == null) {
    return format(
      name === "year"
        ? "%Y"
        : name === "month"
        ? "%Y-%m"
        : name === "day"
        ? "%Y-%m-%d"
        : name === "hour" || name === "minute"
        ? "%Y-%m-%dT%H:%M"
        : name === "second"
        ? "%Y-%m-%dT%H:%M:%S"
        : "%Y-%m-%dT%H:%M:%S.%L"
    );
  }
  // Otherwise, assume that this is for axis ticks.
  const template = getTimeTemplate(anchor);
  switch (name) {
    case "millisecond":
      return formatConditional(format(".%L"), format(":%M:%S"), template);
    case "second":
      return formatConditional(format(":%S"), format("%-I:%M"), template);
    case "minute":
      return formatConditional(format("%-I:%M"), format("%p"), template);
    case "hour":
      return formatConditional(format("%-I %p"), format("%b %-d"), template);
    case "day":
      return formatConditional(format("%-d"), format("%b"), template);
    case "month":
      return formatConditional(format("%b"), format("%Y"), template);
    case "year":
      return format("%Y");
  }
  throw new Error("unable to format time ticks");
}

function getTimeTemplate(anchor) {
  return anchor === "left" || anchor === "right"
    ? (f1, f2) => `\n${f1}\n${f2}` // extra newline to keep f1 centered
    : anchor === "top"
    ? (f1, f2) => `${f2}\n${f1}`
    : (f1, f2) => `${f1}\n${f2}`;
}

function getFormatIntervals(type) {
  return type === "time" ? timeFormatIntervals : type === "utc" ? utcFormatIntervals : formatIntervals;
}

// Given an array of dates, returns the largest compatible standard time
// interval. If no standard interval is compatible (other than milliseconds,
// which is universally compatible), returns undefined.
function inferTimeFormat(type, dates, anchor) {
  const step = d3.max(d3.pairs(dates, (a, b) => Math.abs(b - a))); // maybe undefined!
  if (step < 1000) return formatTimeInterval("millisecond", "utc", anchor);
  for (const [name, interval, intervalType, maxStep] of getFormatIntervals(type)) {
    if (step > maxStep) break; // e.g., 52 weeks
    if (name === "hour" && !step) break; // e.g., domain with a single date
    if (dates.every((d) => interval.floor(d) >= d)) return formatTimeInterval(name, intervalType, anchor);
  }
}

function formatConditional(format1, format2, template) {
  return (x, i, X) => {
    const f1 = format1(x, i); // always shown
    const f2 = format2(x, i); // only shown if different
    const j = i - orderof(X); // detect reversed domains
    return i !== j && X[j] !== undefined && f2 === format2(X[j], j) ? f1 : template(f1, f2);
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
const TypedArray = Object.getPrototypeOf(Uint8Array);
const objectToString = Object.prototype.toString;

// If a reindex is attached to the data, channel values expressed as arrays will
// be reindexed when the channels are instantiated. See exclusiveFacets.
const reindex = Symbol("reindex");

function valueof(data, value, type) {
  const valueType = typeof value;
  return valueType === "string"
    ? maybeTypedMap(data, field(value), type)
    : valueType === "function"
    ? maybeTypedMap(data, value, type)
    : valueType === "number" || value instanceof Date || valueType === "boolean"
    ? map$1(data, constant(value), type)
    : typeof value?.transform === "function"
    ? maybeTypedArrayify(value.transform(data), type)
    : maybeTake(maybeTypedArrayify(value, type), data?.[reindex]);
}

function maybeTake(values, index) {
  return values != null && index ? take(values, index) : values;
}

function maybeTypedMap(data, f, type) {
  return map$1(data, type?.prototype instanceof TypedArray ? floater(f) : f, type);
}

function maybeTypedArrayify(data, type) {
  return type === undefined
    ? arrayify(data) // preserve undefined type
    : data instanceof type
    ? data
    : type.prototype instanceof TypedArray && !(data instanceof TypedArray)
    ? type.from(data, coerceNumber)
    : type.from(data);
}

function floater(f) {
  return (d, i) => coerceNumber(f(d, i));
}

const singleton = [null]; // for data-less decoration marks, e.g. frame
const field = (name) => (d) => { const v = d[name]; return v === undefined && d.type === "Feature" ? d.properties?.[name] : v; }; // prettier-ignore
const indexOf = {transform: range};
const identity$1 = {transform: (d) => d};
const one = () => 1;
const yes = () => true;
const string = (x) => (x == null ? x : `${x}`);
const number$1 = (x) => (x == null ? x : +x);
const first = (x) => (x ? x[0] : undefined);
const second = (x) => (x ? x[1] : undefined);
const third = (x) => (x ? x[2] : undefined);
const constant = (x) => () => x;

// Converts a string like “p25” into a function that takes an index I and an
// accessor function f, returning the corresponding percentile value.
function percentile(reduce) {
  const p = +`${reduce}`.slice(1) / 100;
  return (I, f) => d3.quantile(I, p, f);
}

// If the values are specified as a typed array, no coercion is required.
function coerceNumbers(values) {
  return values instanceof TypedArray ? values : map$1(values, coerceNumber, Float64Array);
}

// Unlike Mark’s number, here we want to convert null and undefined to NaN since
// the result will be stored in a Float64Array and we don’t want null to be
// coerced to zero. We use Number instead of unary + to allow BigInt coercion.
function coerceNumber(x) {
  return x == null ? NaN : Number(x);
}

function coerceDates(values) {
  return map$1(values, coerceDate);
}

// When coercing strings to dates, we only want to allow the ISO 8601 format
// since the built-in string parsing of the Date constructor varies across
// browsers. (In the future, this could be made more liberal if desired, though
// it is still generally preferable to do date parsing yourself explicitly,
// rather than rely on Plot.) Any non-string values are coerced to number first
// and treated as milliseconds since UNIX epoch.
function coerceDate(x) {
  return x instanceof Date && !isNaN(x)
    ? x
    : typeof x === "string"
    ? parse(x)
    : x == null || isNaN((x = +x))
    ? undefined
    : new Date(x);
}

// Some channels may allow a string constant to be specified; to differentiate
// string constants (e.g., "red") from named fields (e.g., "date"), this
// function tests whether the given value is a CSS color string and returns a
// tuple [channel, constant] where one of the two is undefined, and the other is
// the given value. If you wish to reference a named field that is also a valid
// CSS color, use an accessor (d => d.red) instead.
function maybeColorChannel(value, defaultValue) {
  if (value === undefined) value = defaultValue;
  return value === null ? [undefined, "none"] : isColor(value) ? [undefined, value] : [value, undefined];
}

// Similar to maybeColorChannel, this tests whether the given value is a number
// indicating a constant, and otherwise assumes that it’s a channel value.
function maybeNumberChannel(value, defaultValue) {
  if (value === undefined) value = defaultValue;
  return value === null || typeof value === "number" ? [undefined, value] : [value, undefined];
}

// Validates the specified optional string against the allowed list of keywords.
function maybeKeyword(input, name, allowed) {
  if (input != null) return keyword(input, name, allowed);
}

// Validates the specified required string against the allowed list of keywords.
function keyword(input, name, allowed) {
  const i = `${input}`.toLowerCase();
  if (!allowed.includes(i)) throw new Error(`invalid ${name}: ${input}`);
  return i;
}

// Promotes the specified data to an array as needed.
function arrayify(values) {
  if (values == null || values instanceof Array || values instanceof TypedArray) return values;
  switch (values.type) {
    case "FeatureCollection":
      return values.features;
    case "GeometryCollection":
      return values.geometries;
    case "Feature":
    case "LineString":
    case "MultiLineString":
    case "MultiPoint":
    case "MultiPolygon":
    case "Point":
    case "Polygon":
    case "Sphere":
      return [values];
  }
  return Array.from(values);
}

// An optimization of type.from(values, f): if the given values are already an
// instanceof the desired array type, the faster values.map method is used.
function map$1(values, f, type = Array) {
  return values == null ? values : values instanceof type ? values.map(f) : type.from(values, f);
}

// An optimization of type.from(values): if the given values are already an
// instanceof the desired array type, the faster values.slice method is used.
function slice(values, type = Array) {
  return values instanceof type ? values.slice() : type.from(values);
}

// Returns true if any of x, x1, or x2 is not (strictly) undefined.
function hasX({x, x1, x2}) {
  return x !== undefined || x1 !== undefined || x2 !== undefined;
}

// Returns true if any of y, y1, or y2 is not (strictly) undefined.
function hasY({y, y1, y2}) {
  return y !== undefined || y1 !== undefined || y2 !== undefined;
}

// Returns true if has x or y, or if interval is not (strictly) undefined.
function hasXY(options) {
  return hasX(options) || hasY(options) || options.interval !== undefined;
}

// Disambiguates an options object (e.g., {y: "x2"}) from a primitive value.
function isObject(option) {
  return option?.toString === objectToString;
}

// Disambiguates a scale options object (e.g., {color: {type: "linear"}}) from
// some other option (e.g., {color: "red"}). When creating standalone legends,
// this is used to test whether a scale is defined; this should be consistent
// with inferScaleType when there are no channels associated with the scale, and
// if this returns true, then normalizeScale must return non-null.
function isScaleOptions(option) {
  return isObject(option) && (option.type !== undefined || option.domain !== undefined);
}

// Disambiguates an options object (e.g., {y: "x2"}) from a channel value
// definition expressed as a channel transform (e.g., {transform: …}).
// TODO Check typeof option[Symbol.iterator] !== "function"?
function isOptions(option) {
  return isObject(option) && typeof option.transform !== "function";
}

// Disambiguates a sort transform (e.g., {sort: "date"}) from a channel domain
// sort definition (e.g., {sort: {y: "x"}}).
function isDomainSort(sort) {
  return isOptions(sort) && sort.value === undefined && sort.channel === undefined;
}

// For marks specified either as [0, x] or [x1, x2], such as areas and bars.
function maybeZero(x, x1, x2, x3 = identity$1) {
  if (x1 === undefined && x2 === undefined) {
    // {x} or {}
    (x1 = 0), (x2 = x === undefined ? x3 : x);
  } else if (x1 === undefined) {
    // {x, x2} or {x2}
    x1 = x === undefined ? 0 : x;
  } else if (x2 === undefined) {
    // {x, x1} or {x1}
    x2 = x === undefined ? 0 : x;
  }
  return [x1, x2];
}

// For marks that have x and y channels (e.g., cell, dot, line, text).
function maybeTuple(x, y) {
  return x === undefined && y === undefined ? [first, second] : [x, y];
}

// A helper for extracting the z channel, if it is variable. Used by transforms
// that require series, such as moving average and normalize.
function maybeZ({z, fill, stroke} = {}) {
  if (z === undefined) [z] = maybeColorChannel(fill);
  if (z === undefined) [z] = maybeColorChannel(stroke);
  return z;
}

// Returns a Uint32Array with elements [0, 1, 2, … data.length - 1].
function range(data) {
  const n = data.length;
  const r = new Uint32Array(n);
  for (let i = 0; i < n; ++i) r[i] = i;
  return r;
}

// Returns an array [values[index[0]], values[index[1]], …].
function take(values, index) {
  return map$1(index, (i) => values[i], values.constructor);
}

// If f does not take exactly one argument, wraps it in a function that uses take.
function taker(f) {
  return f.length === 1 ? (index, values) => f(take(values, index)) : f;
}

// Uses subarray if available, and otherwise slice.
function subarray(I, i, j) {
  return I.subarray ? I.subarray(i, j) : I.slice(i, j);
}

// Based on InternMap (d3.group).
function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

function maybeInput(key, options) {
  if (options[key] !== undefined) return options[key];
  switch (key) {
    case "x1":
    case "x2":
      key = "x";
      break;
    case "y1":
    case "y2":
      key = "y";
      break;
  }
  return options[key];
}

function column(source) {
  // Defines a column whose values are lazily populated by calling the returned
  // setter. If the given source is labeled, the label is propagated to the
  // returned column definition.
  let value;
  return [
    {
      transform: () => value,
      label: labelof(source)
    },
    (v) => (value = v)
  ];
}

// Like column, but allows the source to be null.
function maybeColumn(source) {
  return source == null ? [source] : column(source);
}

function labelof(value, defaultValue) {
  return typeof value === "string" ? value : value && value.label !== undefined ? value.label : defaultValue;
}

// Assuming that both x1 and x2 and lazy columns (per above), this derives a new
// a column that’s the average of the two, and which inherits the column label
// (if any). Both input columns are assumed to be quantitative. If either column
// is temporal, the returned column is also temporal.
function mid(x1, x2) {
  return {
    transform(data) {
      const X1 = x1.transform(data);
      const X2 = x2.transform(data);
      return isTemporal(X1) || isTemporal(X2)
        ? map$1(X1, (_, i) => new Date((+X1[i] + +X2[i]) / 2))
        : map$1(X1, (_, i) => (+X1[i] + +X2[i]) / 2, Float64Array);
    },
    label: x1.label
  };
}

// If the scale options declare an interval, applies it to the values V.
function maybeApplyInterval(V, scale) {
  const t = maybeIntervalTransform(scale?.interval, scale?.type);
  return t ? map$1(V, t) : V;
}

// Returns the equivalent scale transform for the specified interval option.
function maybeIntervalTransform(interval, type) {
  const i = maybeInterval(interval, type);
  return i && ((v) => (defined(v) ? i.floor(v) : v));
}

// If interval is not nullish, converts interval shorthand such as a number (for
// multiples) or a time interval name (such as “day”) to a {floor, offset,
// range} object similar to a D3 time interval.
function maybeInterval(interval, type) {
  if (interval == null) return;
  if (typeof interval === "number") return numberInterval(interval);
  if (typeof interval === "string") return (type === "time" ? timeInterval : utcInterval)(interval);
  if (typeof interval.floor !== "function") throw new Error("invalid interval; missing floor method");
  if (typeof interval.offset !== "function") throw new Error("invalid interval; missing offset method");
  return interval;
}

function numberInterval(interval) {
  interval = +interval;
  if (0 < interval && interval < 1 && Number.isInteger(1 / interval)) interval = -1 / interval;
  const n = Math.abs(interval);
  return interval < 0
    ? {
        floor: (d) => Math.floor(d * n) / n,
        offset: (d, s = 1) => (d * n + Math.floor(s)) / n,
        range: (lo, hi) => d3.range(Math.ceil(lo * n), hi * n).map((x) => x / n)
      }
    : {
        floor: (d) => Math.floor(d / n) * n,
        offset: (d, s = 1) => d + n * Math.floor(s),
        range: (lo, hi) => d3.range(Math.ceil(lo / n), hi / n).map((x) => x * n)
      };
}

// Like maybeInterval, but requires a range method too.
function maybeRangeInterval(interval, type) {
  interval = maybeInterval(interval, type);
  if (interval && typeof interval.range !== "function") throw new Error("invalid interval: missing range method");
  return interval;
}

// Like maybeRangeInterval, but requires a ceil method too.
function maybeNiceInterval(interval, type) {
  interval = maybeRangeInterval(interval, type);
  if (interval && typeof interval.ceil !== "function") throw new Error("invalid interval: missing ceil method");
  return interval;
}

function isTimeInterval(t) {
  return isInterval(t) && typeof t?.floor === "function" && t.floor() instanceof Date;
}

function isInterval(t) {
  return typeof t?.range === "function";
}

// This distinguishes between per-dimension options and a standalone value.
function maybeValue(value) {
  return value === undefined || isOptions(value) ? value : {value};
}

// Coerces the given channel values (if any) to numbers. This is useful when
// values will be interpolated into other code, such as an SVG transform, and
// where we don’t wish to allow unexpected behavior for weird input.
function numberChannel(source) {
  return source == null
    ? null
    : {
        transform: (data) => valueof(data, source, Float64Array),
        label: labelof(source)
      };
}

function isTuples(data) {
  if (!isIterable(data)) return false;
  for (const d of data) {
    if (d == null) continue;
    return typeof d === "object" && "0" in d && "1" in d;
  }
}

function isIterable(value) {
  return value && typeof value[Symbol.iterator] === "function";
}

function isTextual(values) {
  for (const value of values) {
    if (value == null) continue;
    return typeof value !== "object" || value instanceof Date;
  }
}

function isOrdinal(values) {
  for (const value of values) {
    if (value == null) continue;
    const type = typeof value;
    return type === "string" || type === "boolean";
  }
}

function isTemporal(values) {
  for (const value of values) {
    if (value == null) continue;
    return value instanceof Date;
  }
}

// Are these strings that might represent dates? This is stricter than ISO 8601
// because we want to ignore false positives on numbers; for example, the string
// "1192" is more likely to represent a number than a date even though it is
// valid ISO 8601 representing 1192-01-01.
function isTemporalString(values) {
  for (const value of values) {
    if (value == null) continue;
    return typeof value === "string" && isNaN(value) && parse(value);
  }
}

// Are these strings that might represent numbers? This is stricter than
// coercion because we want to ignore false positives on e.g. empty strings.
function isNumericString(values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value !== "string") return false;
    if (!value.trim()) continue;
    return !isNaN(value);
  }
}

function isNumeric(values) {
  for (const value of values) {
    if (value == null) continue;
    return typeof value === "number";
  }
}

// Returns true if every non-null value in the specified iterable of values
// passes the specified predicate, and there is at least one non-null value;
// returns false if at least one non-null value does not pass the specified
// predicate; otherwise returns undefined (as if all values are null).
function isEvery(values, is) {
  let every;
  for (const value of values) {
    if (value == null) continue;
    if (!is(value)) return false;
    every = true;
  }
  return every;
}

const namedColors = new Set("none,currentcolor,transparent,aliceblue,antiquewhite,aqua,aquamarine,azure,beige,bisque,black,blanchedalmond,blue,blueviolet,brown,burlywood,cadetblue,chartreuse,chocolate,coral,cornflowerblue,cornsilk,crimson,cyan,darkblue,darkcyan,darkgoldenrod,darkgray,darkgreen,darkgrey,darkkhaki,darkmagenta,darkolivegreen,darkorange,darkorchid,darkred,darksalmon,darkseagreen,darkslateblue,darkslategray,darkslategrey,darkturquoise,darkviolet,deeppink,deepskyblue,dimgray,dimgrey,dodgerblue,firebrick,floralwhite,forestgreen,fuchsia,gainsboro,ghostwhite,gold,goldenrod,gray,green,greenyellow,grey,honeydew,hotpink,indianred,indigo,ivory,khaki,lavender,lavenderblush,lawngreen,lemonchiffon,lightblue,lightcoral,lightcyan,lightgoldenrodyellow,lightgray,lightgreen,lightgrey,lightpink,lightsalmon,lightseagreen,lightskyblue,lightslategray,lightslategrey,lightsteelblue,lightyellow,lime,limegreen,linen,magenta,maroon,mediumaquamarine,mediumblue,mediumorchid,mediumpurple,mediumseagreen,mediumslateblue,mediumspringgreen,mediumturquoise,mediumvioletred,midnightblue,mintcream,mistyrose,moccasin,navajowhite,navy,oldlace,olive,olivedrab,orange,orangered,orchid,palegoldenrod,palegreen,paleturquoise,palevioletred,papayawhip,peachpuff,peru,pink,plum,powderblue,purple,rebeccapurple,red,rosybrown,royalblue,saddlebrown,salmon,sandybrown,seagreen,seashell,sienna,silver,skyblue,slateblue,slategray,slategrey,snow,springgreen,steelblue,tan,teal,thistle,tomato,turquoise,violet,wheat,white,whitesmoke,yellow".split(",")); // prettier-ignore

// Returns true if value is a valid CSS color string. This is intentionally lax
// because the CSS color spec keeps growing, and we don’t need to parse these
// colors—we just need to disambiguate them from column names.
// https://www.w3.org/TR/SVG11/painting.html#SpecifyingPaint
// https://www.w3.org/TR/css-color-5/
function isColor(value) {
  if (typeof value !== "string") return false;
  value = value.toLowerCase().trim();
  return (
    /^#[0-9a-f]{3,8}$/.test(value) || // hex rgb, rgba, rrggbb, rrggbbaa
    /^(?:url|var|rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\(.*\)$/.test(value) || // <funciri>, CSS variable, color, etc.
    namedColors.has(value) // currentColor, red, etc.
  );
}

function isOpacity(value) {
  return typeof value === "number" && ((0 <= value && value <= 1) || isNaN(value));
}

function isNoneish(value) {
  return value == null || isNone(value);
}

function isNone(value) {
  return /^\s*none\s*$/i.test(value);
}

function isRound(value) {
  return /^\s*round\s*$/i.test(value);
}

function maybeAnchor$3(value, name) {
  return maybeKeyword(value, name, [
    "middle",
    "top-left",
    "top",
    "top-right",
    "right",
    "bottom-right",
    "bottom",
    "bottom-left",
    "left"
  ]);
}

function maybeFrameAnchor(value = "middle") {
  return maybeAnchor$3(value, "frameAnchor");
}

// Unlike {...defaults, ...options}, this ensures that any undefined (but
// present) properties in options inherit the given default value.
function inherit(options = {}, ...rest) {
  let o = options;
  for (const defaults of rest) {
    for (const key in defaults) {
      if (o[key] === undefined) {
        const value = defaults[key];
        if (o === options) o = {...o, [key]: value};
        else o[key] = value;
      }
    }
  }
  return o;
}

// Given an iterable of named things (objects with a name property), returns a
// corresponding object with properties associated with the given name.
function named(things) {
  console.warn("named iterables are deprecated; please use an object instead");
  const names = new Set();
  return Object.fromEntries(
    Array.from(things, (thing) => {
      const {name} = thing;
      if (name == null) throw new Error("missing name");
      const key = `${name}`;
      if (key === "__proto__") throw new Error(`illegal name: ${key}`);
      if (names.has(key)) throw new Error(`duplicate name: ${key}`);
      names.add(key);
      return [name, thing];
    })
  );
}

function maybeNamed(things) {
  return isIterable(things) ? named(things) : things;
}

// TODO Accept other types of clips (paths, urls, x, y, other marks…)?
// https://github.com/observablehq/plot/issues/181
function maybeClip(clip) {
  if (clip === true) clip = "frame";
  else if (clip === false) clip = null;
  else if (clip != null) clip = keyword(clip, "clip", ["frame", "sphere"]);
  return clip;
}

// Positional scales have associated axes, and for ordinal data, a point or band
// scale is used instead of an ordinal scale.
const position$1 = Symbol("position");

// Color scales default to the turbo interpolator for quantitative data, and to
// the Tableau10 scheme for ordinal data. Color scales may also have an
// associated legend.
const color = Symbol("color");

// Radius scales default to the sqrt type, have a default range of [0, 3], and a
// default domain from 0 to the median first quartile of associated channels.
const radius = Symbol("radius");

// Length scales default to the linear type, have a default range of [0, 12],
// and a default domain from 0 to the median median of associated channels.
const length = Symbol("length");

// Opacity scales have a default range of [0, 1], and a default domain from 0 to
// the maximum value of associated channels.
const opacity = Symbol("opacity");

// Symbol scales have a default range of categorical symbols.
const symbol = Symbol("symbol");

// There isn’t really a projection scale; this represents x and y for geometry.
// This is used to denote channels that should be projected.
const projection = Symbol("projection");

// TODO Rather than hard-coding the list of known scale names, collect the names
// and categories for each plot specification, so that custom marks can register
// custom scales.
const registry = new Map([
  ["x", position$1],
  ["y", position$1],
  ["fx", position$1],
  ["fy", position$1],
  ["r", radius],
  ["color", color],
  ["opacity", opacity],
  ["symbol", symbol],
  ["length", length],
  ["projection", projection]
]);

function isPosition(kind) {
  return kind === position$1 || kind === projection;
}

function hasNumericRange(kind) {
  return kind === position$1 || kind === radius || kind === length || kind === opacity;
}

const sqrt3 = Math.sqrt(3);
const sqrt4_3 = 2 / sqrt3;

const symbolHexagon = {
  draw(context, size) {
    const rx = Math.sqrt(size / Math.PI),
      ry = rx * sqrt4_3,
      hy = ry / 2;
    context.moveTo(0, ry);
    context.lineTo(rx, hy);
    context.lineTo(rx, -hy);
    context.lineTo(0, -ry);
    context.lineTo(-rx, -hy);
    context.lineTo(-rx, hy);
    context.closePath();
  }
};

const symbols = new Map([
  ["asterisk", d3.symbolAsterisk],
  ["circle", d3.symbolCircle],
  ["cross", d3.symbolCross],
  ["diamond", d3.symbolDiamond],
  ["diamond2", d3.symbolDiamond2],
  ["hexagon", symbolHexagon],
  ["plus", d3.symbolPlus],
  ["square", d3.symbolSquare],
  ["square2", d3.symbolSquare2],
  ["star", d3.symbolStar],
  ["times", d3.symbolTimes],
  ["triangle", d3.symbolTriangle],
  ["triangle2", d3.symbolTriangle2],
  ["wye", d3.symbolWye]
]);

function isSymbolObject(value) {
  return value && typeof value.draw === "function";
}

function isSymbol(value) {
  if (isSymbolObject(value)) return true;
  if (typeof value !== "string") return false;
  return symbols.has(value.toLowerCase());
}

function maybeSymbol(symbol) {
  if (symbol == null || isSymbolObject(symbol)) return symbol;
  const value = symbols.get(`${symbol}`.toLowerCase());
  if (value) return value;
  throw new Error(`invalid symbol: ${symbol}`);
}

function maybeSymbolChannel(symbol) {
  if (symbol == null || isSymbolObject(symbol)) return [undefined, symbol];
  if (typeof symbol === "string") {
    const value = symbols.get(`${symbol}`.toLowerCase());
    if (value) return [undefined, value];
  }
  return [symbol, undefined];
}

function basic({filter: f1, sort: s1, reverse: r1, transform: t1, initializer: i1, ...options} = {}, transform) {
  // If both t1 and t2 are defined, returns a composite transform that first
  // applies t1 and then applies t2.
  if (t1 === undefined) {
    // explicit transform overrides filter, sort, and reverse
    if (f1 != null) t1 = filterTransform(f1);
    if (s1 != null && !isDomainSort(s1)) t1 = composeTransform(t1, sortTransform(s1));
    if (r1) t1 = composeTransform(t1, reverseTransform);
  }
  if (transform != null && i1 != null) throw new Error("transforms cannot be applied after initializers");
  return {
    ...options,
    ...((s1 === null || isDomainSort(s1)) && {sort: s1}),
    transform: composeTransform(t1, transform)
  };
}

function initializer({filter: f1, sort: s1, reverse: r1, initializer: i1, ...options} = {}, initializer) {
  // If both i1 and i2 are defined, returns a composite initializer that first
  // applies i1 and then applies i2.
  if (i1 === undefined) {
    // explicit initializer overrides filter, sort, and reverse
    if (f1 != null) i1 = filterTransform(f1);
    if (s1 != null && !isDomainSort(s1)) i1 = composeInitializer(i1, sortTransform(s1));
    if (r1) i1 = composeInitializer(i1, reverseTransform);
  }
  return {
    ...options,
    ...((s1 === null || isDomainSort(s1)) && {sort: s1}),
    initializer: composeInitializer(i1, initializer)
  };
}

function composeTransform(t1, t2) {
  if (t1 == null) return t2 === null ? undefined : t2;
  if (t2 == null) return t1 === null ? undefined : t1;
  return function (data, facets, plotOptions) {
    ({data, facets} = t1.call(this, data, facets, plotOptions));
    return t2.call(this, arrayify(data), facets, plotOptions);
  };
}

function composeInitializer(i1, i2) {
  if (i1 == null) return i2 === null ? undefined : i2;
  if (i2 == null) return i1 === null ? undefined : i1;
  return function (data, facets, channels, ...args) {
    let c1, d1, f1, c2, d2, f2;
    ({data: d1 = data, facets: f1 = facets, channels: c1} = i1.call(this, data, facets, channels, ...args));
    ({data: d2 = d1, facets: f2 = f1, channels: c2} = i2.call(this, d1, f1, {...channels, ...c1}, ...args));
    return {data: d2, facets: f2, channels: {...c1, ...c2}};
  };
}

function apply(options, t) {
  return (options.initializer != null ? initializer : basic)(options, t);
}

function filter(test, options) {
  return apply(options, filterTransform(test));
}

function filterTransform(value) {
  return (data, facets) => {
    const V = valueof(data, value);
    return {data, facets: facets.map((I) => I.filter((i) => V[i]))};
  };
}

function reverse({sort, ...options} = {}) {
  return {
    ...apply(options, reverseTransform),
    sort: isDomainSort(sort) ? sort : null
  };
}

function reverseTransform(data, facets) {
  return {data, facets: facets.map((I) => I.slice().reverse())};
}

function shuffle({seed, sort, ...options} = {}) {
  return {
    ...apply(options, sortValue(seed == null ? Math.random : d3.randomLcg(seed))),
    sort: isDomainSort(sort) ? sort : null
  };
}

function sort(order, {sort, ...options} = {}) {
  return {
    ...(isOptions(order) && order.channel !== undefined ? initializer : apply)(options, sortTransform(order)),
    sort: isDomainSort(sort) ? sort : null
  };
}

function sortTransform(value) {
  return (typeof value === "function" && value.length !== 1 ? sortData : sortValue)(value);
}

function sortData(compare) {
  return (data, facets) => {
    const compareData = (i, j) => compare(data[i], data[j]);
    return {data, facets: facets.map((I) => I.slice().sort(compareData))};
  };
}

function sortValue(value) {
  let channel, order;
  ({channel, value, order} = {...maybeValue(value)});
  const negate = channel?.startsWith("-");
  if (negate) channel = channel.slice(1);
  if (order === undefined) order = negate ? descendingDefined : ascendingDefined;
  if (typeof order !== "function") {
    switch (`${order}`.toLowerCase()) {
      case "ascending":
        order = ascendingDefined;
        break;
      case "descending":
        order = descendingDefined;
        break;
      default:
        throw new Error(`invalid order: ${order}`);
    }
  }
  return (data, facets, channels) => {
    let V;
    if (channel === undefined) {
      V = valueof(data, value);
    } else {
      if (channels === undefined) throw new Error("channel sort requires an initializer");
      V = channels[channel];
      if (!V) return {}; // ignore missing channel
      V = V.value;
    }
    const compareValue = (i, j) => order(V[i], V[j]);
    return {data, facets: facets.map((I) => I.slice().sort(compareValue))};
  };
}

// Group on {z, fill, stroke}.
function groupZ$1(outputs, options) {
  return groupn(null, null, outputs, options);
}

// Group on {z, fill, stroke}, then on x.
function groupX(outputs = {y: "count"}, options = {}) {
  const {x = identity$1} = options;
  if (x == null) throw new Error("missing channel: x");
  return groupn(x, null, outputs, options);
}

// Group on {z, fill, stroke}, then on y.
function groupY(outputs = {x: "count"}, options = {}) {
  const {y = identity$1} = options;
  if (y == null) throw new Error("missing channel: y");
  return groupn(null, y, outputs, options);
}

// Group on {z, fill, stroke}, then on x and y.
function group(outputs = {fill: "count"}, options = {}) {
  let {x, y} = options;
  [x, y] = maybeTuple(x, y);
  if (x == null) throw new Error("missing channel: x");
  if (y == null) throw new Error("missing channel: y");
  return groupn(x, y, outputs, options);
}

function groupn(
  x, // optionally group on x
  y, // optionally group on y
  {
    data: reduceData = reduceIdentity,
    filter,
    sort,
    reverse,
    ...outputs // output channel definitions
  } = {},
  inputs = {} // input channels and options
) {
  // Compute the outputs.
  outputs = maybeGroupOutputs(outputs, inputs);
  reduceData = maybeGroupReduce(reduceData, identity$1);
  sort = sort == null ? undefined : maybeGroupOutput("sort", sort, inputs);
  filter = filter == null ? undefined : maybeGroupEvaluator("filter", filter, inputs);

  // Produce x and y output channels as appropriate.
  const [GX, setGX] = maybeColumn(x);
  const [GY, setGY] = maybeColumn(y);

  // Greedily materialize the z, fill, and stroke channels (if channels and not
  // constants) so that we can reference them for subdividing groups without
  // computing them more than once.
  const {
    z,
    fill,
    stroke,
    x1,
    x2, // consumed if x is an output
    y1,
    y2, // consumed if y is an output
    ...options
  } = inputs;
  const [GZ, setGZ] = maybeColumn(z);
  const [vfill] = maybeColorChannel(fill);
  const [vstroke] = maybeColorChannel(stroke);
  const [GF, setGF] = maybeColumn(vfill);
  const [GS, setGS] = maybeColumn(vstroke);

  return {
    ...("z" in inputs && {z: GZ || z}),
    ...("fill" in inputs && {fill: GF || fill}),
    ...("stroke" in inputs && {stroke: GS || stroke}),
    ...basic(options, (data, facets, plotOptions) => {
      const X = maybeApplyInterval(valueof(data, x), plotOptions?.x);
      const Y = maybeApplyInterval(valueof(data, y), plotOptions?.y);
      const Z = valueof(data, z);
      const F = valueof(data, vfill);
      const S = valueof(data, vstroke);
      const G = maybeSubgroup(outputs, {z: Z, fill: F, stroke: S});
      const groupFacets = [];
      const groupData = [];
      const GX = X && setGX([]);
      const GY = Y && setGY([]);
      const GZ = Z && setGZ([]);
      const GF = F && setGF([]);
      const GS = S && setGS([]);
      let i = 0;
      for (const o of outputs) o.initialize(data);
      if (sort) sort.initialize(data);
      if (filter) filter.initialize(data);
      for (const facet of facets) {
        const groupFacet = [];
        for (const o of outputs) o.scope("facet", facet);
        if (sort) sort.scope("facet", facet);
        if (filter) filter.scope("facet", facet);
        for (const [f, I] of maybeGroup(facet, G)) {
          for (const [y, gg] of maybeGroup(I, Y)) {
            for (const [x, g] of maybeGroup(gg, X)) {
              const extent = {data};
              if (X) extent.x = x;
              if (Y) extent.y = y;
              if (G) extent.z = f;
              if (filter && !filter.reduce(g, extent)) continue;
              groupFacet.push(i++);
              groupData.push(reduceData.reduceIndex(g, data, extent));
              if (X) GX.push(x);
              if (Y) GY.push(y);
              if (Z) GZ.push(G === Z ? f : Z[g[0]]);
              if (F) GF.push(G === F ? f : F[g[0]]);
              if (S) GS.push(G === S ? f : S[g[0]]);
              for (const o of outputs) o.reduce(g, extent);
              if (sort) sort.reduce(g, extent);
            }
          }
        }
        groupFacets.push(groupFacet);
      }
      maybeSort(groupFacets, sort, reverse);
      return {data: groupData, facets: groupFacets};
    }),
    ...(!hasOutput(outputs, "x") && (GX ? {x: GX} : {x1, x2})),
    ...(!hasOutput(outputs, "y") && (GY ? {y: GY} : {y1, y2})),
    ...Object.fromEntries(outputs.map(({name, output}) => [name, output]))
  };
}

function hasOutput(outputs, ...names) {
  for (const {name} of outputs) {
    if (names.includes(name)) {
      return true;
    }
  }
  return false;
}

function maybeOutputs(outputs, inputs, asOutput = maybeOutput) {
  const entries = Object.entries(outputs);
  // Propagate standard mark channels by default.
  if (inputs.title != null && outputs.title === undefined) entries.push(["title", reduceTitle]);
  if (inputs.href != null && outputs.href === undefined) entries.push(["href", reduceFirst$1]);
  return entries
    .filter(([, reduce]) => reduce !== undefined)
    .map(([name, reduce]) => (reduce === null ? nullOutput(name) : asOutput(name, reduce, inputs)));
}

function maybeOutput(name, reduce, inputs, asEvaluator = maybeEvaluator) {
  let scale; // optional per-channel scale override
  if (isObject(reduce) && "reduce" in reduce) (scale = reduce.scale), (reduce = reduce.reduce); // N.B. array.reduce
  const evaluator = asEvaluator(name, reduce, inputs);
  const [output, setOutput] = column(evaluator.label);
  let O;
  return {
    name,
    output: scale === undefined ? output : {value: output, scale},
    initialize(data) {
      evaluator.initialize(data);
      O = setOutput([]);
    },
    scope(scope, I) {
      evaluator.scope(scope, I);
    },
    reduce(I, extent) {
      O.push(evaluator.reduce(I, extent));
    }
  };
}

function nullOutput(name) {
  return {name, initialize() {}, scope() {}, reduce() {}};
}

function maybeEvaluator(name, reduce, inputs, asReduce = maybeReduce$1) {
  const input = maybeInput(name, inputs);
  const reducer = asReduce(reduce, input);
  let V, context;
  return {
    label: labelof(reducer === reduceCount ? null : input, reducer.label),
    initialize(data) {
      V = input === undefined ? data : valueof(data, input);
      if (reducer.scope === "data") {
        context = reducer.reduceIndex(range(data), V);
      }
    },
    scope(scope, I) {
      if (reducer.scope === scope) {
        context = reducer.reduceIndex(I, V);
      }
    },
    reduce(I, extent) {
      return reducer.scope == null ? reducer.reduceIndex(I, V, extent) : reducer.reduceIndex(I, V, context, extent);
    }
  };
}

function maybeGroup(I, X) {
  return X ? d3.group(I, (i) => X[i]) : [[, I]];
}

function maybeReduce$1(reduce, value, fallback = invalidReduce) {
  if (reduce == null) return fallback(reduce);
  if (typeof reduce.reduceIndex === "function") return reduce;
  if (typeof reduce.reduce === "function" && isObject(reduce)) return reduceReduce(reduce); // N.B. array.reduce
  if (typeof reduce === "function") return reduceFunction(reduce);
  if (/^p\d{2}$/i.test(reduce)) return reduceAccessor$1(percentile(reduce));
  switch (`${reduce}`.toLowerCase()) {
    case "first":
      return reduceFirst$1;
    case "last":
      return reduceLast$1;
    case "identity":
      return reduceIdentity;
    case "count":
      return reduceCount;
    case "distinct":
      return reduceDistinct;
    case "sum":
      return value == null ? reduceCount : reduceSum$1;
    case "proportion":
      return reduceProportion(value, "data");
    case "proportion-facet":
      return reduceProportion(value, "facet");
    case "deviation":
      return reduceAccessor$1(d3.deviation);
    case "min":
      return reduceAccessor$1(d3.min);
    case "min-index":
      return reduceAccessor$1(d3.minIndex);
    case "max":
      return reduceAccessor$1(d3.max);
    case "max-index":
      return reduceAccessor$1(d3.maxIndex);
    case "mean":
      return reduceMaybeTemporalAccessor(d3.mean);
    case "median":
      return reduceMaybeTemporalAccessor(d3.median);
    case "variance":
      return reduceAccessor$1(d3.variance);
    case "mode":
      return reduceAccessor$1(d3.mode);
  }
  return fallback(reduce);
}

function invalidReduce(reduce) {
  throw new Error(`invalid reduce: ${reduce}`);
}

function maybeGroupOutputs(outputs, inputs) {
  return maybeOutputs(outputs, inputs, maybeGroupOutput);
}

function maybeGroupOutput(name, reduce, inputs) {
  return maybeOutput(name, reduce, inputs, maybeGroupEvaluator);
}

function maybeGroupEvaluator(name, reduce, inputs) {
  return maybeEvaluator(name, reduce, inputs, maybeGroupReduce);
}

function maybeGroupReduce(reduce, value) {
  return maybeReduce$1(reduce, value, maybeGroupReduceFallback);
}

function maybeGroupReduceFallback(reduce) {
  switch (`${reduce}`.toLowerCase()) {
    case "x":
      return reduceX$1;
    case "y":
      return reduceY$1;
    case "z":
      return reduceZ;
  }
  throw new Error(`invalid group reduce: ${reduce}`);
}

function maybeSubgroup(outputs, inputs) {
  for (const name in inputs) {
    const value = inputs[name];
    if (value !== undefined && !outputs.some((o) => o.name === name)) {
      return value;
    }
  }
}

function maybeSort(facets, sort, reverse) {
  if (sort) {
    const S = sort.output.transform();
    const compare = (i, j) => ascendingDefined(S[i], S[j]);
    facets.forEach((f) => f.sort(compare));
  }
  if (reverse) {
    facets.forEach((f) => f.reverse());
  }
}

function reduceReduce(reduce) {
  console.warn("deprecated reduce interface; implement reduceIndex instead.");
  return {...reduce, reduceIndex: reduce.reduce.bind(reduce)};
}

function reduceFunction(f) {
  return {
    reduceIndex(I, X, extent) {
      return f(take(X, I), extent);
    }
  };
}

function reduceAccessor$1(f) {
  return {
    reduceIndex(I, X) {
      return f(I, (i) => X[i]);
    }
  };
}

function reduceMaybeTemporalAccessor(f) {
  return {
    reduceIndex(I, X) {
      const x = f(I, (i) => X[i]);
      return isTemporal(X) ? new Date(x) : x;
    }
  };
}

const reduceIdentity = {
  reduceIndex(I, X) {
    return take(X, I);
  }
};

const reduceFirst$1 = {
  reduceIndex(I, X) {
    return X[I[0]];
  }
};

const reduceTitle = {
  reduceIndex(I, X) {
    const n = 5;
    const groups = d3.sort(
      d3.rollup(
        I,
        (V) => V.length,
        (i) => X[i]
      ),
      second
    );
    const top = groups.slice(-n).reverse();
    if (top.length < groups.length) {
      const bottom = groups.slice(0, 1 - n);
      top[n - 1] = [`… ${bottom.length.toLocaleString("en-US")} more`, d3.sum(bottom, second)];
    }
    return top.map(([key, value]) => `${key} (${value.toLocaleString("en-US")})`).join("\n");
  }
};

const reduceLast$1 = {
  reduceIndex(I, X) {
    return X[I[I.length - 1]];
  }
};

const reduceCount = {
  label: "Frequency",
  reduceIndex(I) {
    return I.length;
  }
};

const reduceDistinct = {
  label: "Distinct",
  reduceIndex(I, X) {
    const s = new d3.InternSet();
    for (const i of I) s.add(X[i]);
    return s.size;
  }
};

const reduceSum$1 = reduceAccessor$1(d3.sum);

function reduceProportion(value, scope) {
  return value == null
    ? {scope, label: "Frequency", reduceIndex: (I, V, basis = 1) => I.length / basis}
    : {scope, reduceIndex: (I, V, basis = 1) => d3.sum(I, (i) => V[i]) / basis};
}

const reduceX$1 = {
  reduceIndex(I, X, {x}) {
    return x;
  }
};

const reduceY$1 = {
  reduceIndex(I, X, {y}) {
    return y;
  }
};

const reduceZ = {
  reduceIndex(I, X, {z}) {
    return z;
  }
};

function find(test) {
  if (typeof test !== "function") throw new Error(`invalid test function: ${test}`);
  return {
    reduceIndex(I, V, {data}) {
      return V[I.find((i) => test(data[i], i, data))];
    }
  };
}

function createChannel(data, {scale, type, value, filter, hint, label = labelof(value)}, name) {
  if (hint === undefined && typeof value?.transform === "function") hint = value.hint;
  return inferChannelScale(name, {
    scale,
    type,
    value: valueof(data, value),
    label,
    filter,
    hint
  });
}

function createChannels(channels, data) {
  return Object.fromEntries(
    Object.entries(channels).map(([name, channel]) => [name, createChannel(data, channel, name)])
  );
}

// TODO Use Float64Array for scales with numeric ranges, e.g. position?
function valueObject(channels, scales) {
  const values = Object.fromEntries(
    Object.entries(channels).map(([name, {scale: scaleName, value}]) => {
      const scale = scaleName == null ? null : scales[scaleName];
      return [name, scale == null ? value : map$1(value, scale)];
    })
  );
  values.channels = channels; // expose channel state for advanced usage
  return values;
}

// If the channel uses the "auto" scale (or equivalently true), infer the scale
// from the channel name and the provided values. For color and symbol channels,
// no scale is applied if the values are literal; however for symbols, we must
// promote symbol names (e.g., "plus") to symbol implementations (symbolPlus).
// Note: mutates channel!
function inferChannelScale(name, channel) {
  const {scale, value} = channel;
  if (scale === true || scale === "auto") {
    switch (name) {
      case "fill":
      case "stroke":
      case "color":
        channel.scale = scale !== true && isEvery(value, isColor) ? null : "color";
        channel.defaultScale = "color";
        break;
      case "fillOpacity":
      case "strokeOpacity":
      case "opacity":
        channel.scale = scale !== true && isEvery(value, isOpacity) ? null : "opacity";
        channel.defaultScale = "opacity";
        break;
      case "symbol":
        if (scale !== true && isEvery(value, isSymbol)) {
          channel.scale = null;
          channel.value = map$1(value, maybeSymbol);
        } else {
          channel.scale = "symbol";
        }
        channel.defaultScale = "symbol";
        break;
      default:
        channel.scale = registry.has(name) ? name : null;
        break;
    }
  } else if (scale === false) {
    channel.scale = null;
  } else if (scale != null && !registry.has(scale)) {
    throw new Error(`unknown scale: ${scale}`);
  }
  return channel;
}

// Note: mutates channel.domain! This is set to a function so that it is lazily
// computed; i.e., if the scale’s domain is set explicitly, that takes priority
// over the sort option, and we don’t need to do additional work.
function channelDomain(data, facets, channels, facetChannels, options) {
  const {order: defaultOrder, reverse: defaultReverse, reduce: defaultReduce = true, limit: defaultLimit} = options;
  for (const x in options) {
    if (!registry.has(x)) continue; // ignore unknown scale keys (including generic options)
    let {value: y, order = defaultOrder, reverse = defaultReverse, reduce = defaultReduce, limit = defaultLimit} = maybeValue(options[x]); // prettier-ignore
    const negate = y?.startsWith("-");
    if (negate) y = y.slice(1);
    order = order === undefined ? negate !== (y === "width" || y === "height") ? descendingGroup : ascendingGroup : maybeOrder$1(order); // prettier-ignore
    if (reduce == null || reduce === false) continue; // disabled reducer
    const X = x === "fx" || x === "fy" ? reindexFacetChannel(facets, facetChannels[x]) : findScaleChannel(channels, x);
    if (!X) throw new Error(`missing channel for scale: ${x}`);
    const XV = X.value;
    const [lo = 0, hi = Infinity] = isIterable(limit) ? limit : limit < 0 ? [limit] : [0, limit];
    if (y == null) {
      X.domain = () => {
        let domain = Array.from(new d3.InternSet(XV)); // remove any duplicates
        if (reverse) domain = domain.reverse();
        if (lo !== 0 || hi !== Infinity) domain = domain.slice(lo, hi);
        return domain;
      };
    } else {
      const YV =
        y === "data"
          ? data
          : y === "height"
          ? difference(channels, "y1", "y2")
          : y === "width"
          ? difference(channels, "x1", "x2")
          : values(channels, y, y === "y" ? "y2" : y === "x" ? "x2" : undefined);
      const reducer = maybeReduce$1(reduce === true ? "max" : reduce, YV);
      X.domain = () => {
        let domain = d3.rollups(
          range(XV),
          (I) => reducer.reduceIndex(I, YV),
          (i) => XV[i]
        );
        if (order) domain.sort(order);
        if (reverse) domain.reverse();
        if (lo !== 0 || hi !== Infinity) domain = domain.slice(lo, hi);
        return domain.map(first);
      };
    }
  }
}

function findScaleChannel(channels, scale) {
  for (const name in channels) {
    const channel = channels[name];
    if (channel.scale === scale) return channel;
  }
}

// Facet channels are not affected by transforms; so, to compute the domain of a
// facet scale, we must first re-index the facet channel according to the
// transformed mark index. Note: mutates channel, but that should be safe here?
function reindexFacetChannel(facets, channel) {
  const originalFacets = facets.original;
  if (originalFacets === facets) return channel; // not transformed
  const V1 = channel.value;
  const V2 = (channel.value = []); // mutates channel!
  for (let i = 0; i < originalFacets.length; ++i) {
    const vi = V1[originalFacets[i][0]];
    for (const j of facets[i]) V2[j] = vi;
  }
  return channel;
}

function difference(channels, k1, k2) {
  const X1 = values(channels, k1);
  const X2 = values(channels, k2);
  return map$1(X2, (x2, i) => Math.abs(x2 - X1[i]), Float64Array);
}

function values(channels, name, alias) {
  let channel = channels[name];
  if (!channel && alias !== undefined) channel = channels[alias];
  if (channel) return channel.value;
  throw new Error(`missing channel: ${name}`);
}

function maybeOrder$1(order) {
  if (order == null || typeof order === "function") return order;
  switch (`${order}`.toLowerCase()) {
    case "ascending":
      return ascendingGroup;
    case "descending":
      return descendingGroup;
  }
  throw new Error(`invalid order: ${order}`);
}

function ascendingGroup([ak, av], [bk, bv]) {
  return ascendingDefined(av, bv) || ascendingDefined(ak, bk);
}

function descendingGroup([ak, av], [bk, bv]) {
  return descendingDefined(av, bv) || ascendingDefined(ak, bk);
}

function getSource(channels, key) {
  let channel = channels[key];
  if (!channel) return;
  while (channel.source) channel = channel.source;
  return channel.source === null ? null : channel;
}

const categoricalSchemes = new Map([
  ["accent", d3.schemeAccent],
  ["category10", d3.schemeCategory10],
  ["dark2", d3.schemeDark2],
  ["observable10", d3.schemeObservable10],
  ["paired", d3.schemePaired],
  ["pastel1", d3.schemePastel1],
  ["pastel2", d3.schemePastel2],
  ["set1", d3.schemeSet1],
  ["set2", d3.schemeSet2],
  ["set3", d3.schemeSet3],
  ["tableau10", d3.schemeTableau10]
]);

function isCategoricalScheme(scheme) {
  return scheme != null && categoricalSchemes.has(`${scheme}`.toLowerCase());
}

const ordinalSchemes = new Map([
  ...categoricalSchemes,

  // diverging
  ["brbg", scheme11(d3.schemeBrBG, d3.interpolateBrBG)],
  ["prgn", scheme11(d3.schemePRGn, d3.interpolatePRGn)],
  ["piyg", scheme11(d3.schemePiYG, d3.interpolatePiYG)],
  ["puor", scheme11(d3.schemePuOr, d3.interpolatePuOr)],
  ["rdbu", scheme11(d3.schemeRdBu, d3.interpolateRdBu)],
  ["rdgy", scheme11(d3.schemeRdGy, d3.interpolateRdGy)],
  ["rdylbu", scheme11(d3.schemeRdYlBu, d3.interpolateRdYlBu)],
  ["rdylgn", scheme11(d3.schemeRdYlGn, d3.interpolateRdYlGn)],
  ["spectral", scheme11(d3.schemeSpectral, d3.interpolateSpectral)],

  // reversed diverging (for temperature data)
  ["burd", scheme11r(d3.schemeRdBu, d3.interpolateRdBu)],
  ["buylrd", scheme11r(d3.schemeRdYlBu, d3.interpolateRdYlBu)],

  // sequential (single-hue)
  ["blues", scheme9(d3.schemeBlues, d3.interpolateBlues)],
  ["greens", scheme9(d3.schemeGreens, d3.interpolateGreens)],
  ["greys", scheme9(d3.schemeGreys, d3.interpolateGreys)],
  ["oranges", scheme9(d3.schemeOranges, d3.interpolateOranges)],
  ["purples", scheme9(d3.schemePurples, d3.interpolatePurples)],
  ["reds", scheme9(d3.schemeReds, d3.interpolateReds)],

  // sequential (multi-hue)
  ["turbo", schemei(d3.interpolateTurbo)],
  ["viridis", schemei(d3.interpolateViridis)],
  ["magma", schemei(d3.interpolateMagma)],
  ["inferno", schemei(d3.interpolateInferno)],
  ["plasma", schemei(d3.interpolatePlasma)],
  ["cividis", schemei(d3.interpolateCividis)],
  ["cubehelix", schemei(d3.interpolateCubehelixDefault)],
  ["warm", schemei(d3.interpolateWarm)],
  ["cool", schemei(d3.interpolateCool)],
  ["bugn", scheme9(d3.schemeBuGn, d3.interpolateBuGn)],
  ["bupu", scheme9(d3.schemeBuPu, d3.interpolateBuPu)],
  ["gnbu", scheme9(d3.schemeGnBu, d3.interpolateGnBu)],
  ["orrd", scheme9(d3.schemeOrRd, d3.interpolateOrRd)],
  ["pubu", scheme9(d3.schemePuBu, d3.interpolatePuBu)],
  ["pubugn", scheme9(d3.schemePuBuGn, d3.interpolatePuBuGn)],
  ["purd", scheme9(d3.schemePuRd, d3.interpolatePuRd)],
  ["rdpu", scheme9(d3.schemeRdPu, d3.interpolateRdPu)],
  ["ylgn", scheme9(d3.schemeYlGn, d3.interpolateYlGn)],
  ["ylgnbu", scheme9(d3.schemeYlGnBu, d3.interpolateYlGnBu)],
  ["ylorbr", scheme9(d3.schemeYlOrBr, d3.interpolateYlOrBr)],
  ["ylorrd", scheme9(d3.schemeYlOrRd, d3.interpolateYlOrRd)],

  // cyclical
  ["rainbow", schemeicyclical(d3.interpolateRainbow)],
  ["sinebow", schemeicyclical(d3.interpolateSinebow)]
]);

function scheme9(scheme, interpolate) {
  return ({length: n}) => {
    if (n === 1) return [scheme[3][1]]; // favor midpoint
    if (n === 2) return [scheme[3][1], scheme[3][2]]; // favor darker
    n = Math.max(3, Math.floor(n));
    return n > 9 ? d3.quantize(interpolate, n) : scheme[n];
  };
}

function scheme11(scheme, interpolate) {
  return ({length: n}) => {
    if (n === 2) return [scheme[3][0], scheme[3][2]]; // favor diverging extrema
    n = Math.max(3, Math.floor(n));
    return n > 11 ? d3.quantize(interpolate, n) : scheme[n];
  };
}

function scheme11r(scheme, interpolate) {
  return ({length: n}) => {
    if (n === 2) return [scheme[3][2], scheme[3][0]]; // favor diverging extrema
    n = Math.max(3, Math.floor(n));
    return n > 11 ? d3.quantize((t) => interpolate(1 - t), n) : scheme[n].slice().reverse();
  };
}

function schemei(interpolate) {
  return ({length: n}) => d3.quantize(interpolate, Math.max(2, Math.floor(n)));
}

function schemeicyclical(interpolate) {
  return ({length: n}) => d3.quantize(interpolate, Math.floor(n) + 1).slice(0, -1);
}

function ordinalScheme(scheme) {
  const s = `${scheme}`.toLowerCase();
  if (!ordinalSchemes.has(s)) throw new Error(`unknown ordinal scheme: ${s}`);
  return ordinalSchemes.get(s);
}

function ordinalRange(scheme, length) {
  const s = ordinalScheme(scheme);
  const r = typeof s === "function" ? s({length}) : s;
  return r.length !== length ? r.slice(0, length) : r;
}

// If the specified domain contains only booleans (ignoring null and undefined),
// returns a corresponding range where false is mapped to the low color and true
// is mapped to the high color of the specified scheme.
function maybeBooleanRange(domain, scheme = "greys") {
  const range = new Set();
  const [f, t] = ordinalRange(scheme, 2);
  for (const value of domain) {
    if (value == null) continue;
    if (value === true) range.add(t);
    else if (value === false) range.add(f);
    else return;
  }
  return [...range];
}

const quantitativeSchemes = new Map([
  // diverging
  ["brbg", d3.interpolateBrBG],
  ["prgn", d3.interpolatePRGn],
  ["piyg", d3.interpolatePiYG],
  ["puor", d3.interpolatePuOr],
  ["rdbu", d3.interpolateRdBu],
  ["rdgy", d3.interpolateRdGy],
  ["rdylbu", d3.interpolateRdYlBu],
  ["rdylgn", d3.interpolateRdYlGn],
  ["spectral", d3.interpolateSpectral],

  // reversed diverging (for temperature data)
  ["burd", (t) => d3.interpolateRdBu(1 - t)],
  ["buylrd", (t) => d3.interpolateRdYlBu(1 - t)],

  // sequential (single-hue)
  ["blues", d3.interpolateBlues],
  ["greens", d3.interpolateGreens],
  ["greys", d3.interpolateGreys],
  ["purples", d3.interpolatePurples],
  ["reds", d3.interpolateReds],
  ["oranges", d3.interpolateOranges],

  // sequential (multi-hue)
  ["turbo", d3.interpolateTurbo],
  ["viridis", d3.interpolateViridis],
  ["magma", d3.interpolateMagma],
  ["inferno", d3.interpolateInferno],
  ["plasma", d3.interpolatePlasma],
  ["cividis", d3.interpolateCividis],
  ["cubehelix", d3.interpolateCubehelixDefault],
  ["warm", d3.interpolateWarm],
  ["cool", d3.interpolateCool],
  ["bugn", d3.interpolateBuGn],
  ["bupu", d3.interpolateBuPu],
  ["gnbu", d3.interpolateGnBu],
  ["orrd", d3.interpolateOrRd],
  ["pubugn", d3.interpolatePuBuGn],
  ["pubu", d3.interpolatePuBu],
  ["purd", d3.interpolatePuRd],
  ["rdpu", d3.interpolateRdPu],
  ["ylgnbu", d3.interpolateYlGnBu],
  ["ylgn", d3.interpolateYlGn],
  ["ylorbr", d3.interpolateYlOrBr],
  ["ylorrd", d3.interpolateYlOrRd],

  // cyclical
  ["rainbow", d3.interpolateRainbow],
  ["sinebow", d3.interpolateSinebow]
]);

function quantitativeScheme(scheme) {
  const s = `${scheme}`.toLowerCase();
  if (!quantitativeSchemes.has(s)) throw new Error(`unknown quantitative scheme: ${s}`);
  return quantitativeSchemes.get(s);
}

const divergingSchemes = new Set([
  "brbg",
  "prgn",
  "piyg",
  "puor",
  "rdbu",
  "rdgy",
  "rdylbu",
  "rdylgn",
  "spectral",
  "burd",
  "buylrd"
]);

function isDivergingScheme(scheme) {
  return scheme != null && divergingSchemes.has(`${scheme}`.toLowerCase());
}

const flip = (i) => (t) => i(1 - t);
const unit = [0, 1];

const interpolators = new Map([
  // numbers
  ["number", d3.interpolateNumber],

  // color spaces
  ["rgb", d3.interpolateRgb],
  ["hsl", d3.interpolateHsl],
  ["hcl", d3.interpolateHcl],
  ["lab", d3.interpolateLab]
]);

function maybeInterpolator(interpolate) {
  const i = `${interpolate}`.toLowerCase();
  if (!interpolators.has(i)) throw new Error(`unknown interpolator: ${i}`);
  return interpolators.get(i);
}

function createScaleQ(
  key,
  scale,
  channels,
  {
    type,
    nice,
    clamp,
    zero,
    domain = inferAutoDomain(key, channels),
    unknown,
    round,
    scheme,
    interval,
    range = registry.get(key) === radius
      ? inferRadialRange(channels, domain)
      : registry.get(key) === length
      ? inferLengthRange(channels, domain)
      : registry.get(key) === opacity
      ? unit
      : undefined,
    interpolate = registry.get(key) === color
      ? scheme == null && range !== undefined
        ? d3.interpolateRgb
        : quantitativeScheme(scheme !== undefined ? scheme : type === "cyclical" ? "rainbow" : "turbo")
      : round
      ? d3.interpolateRound
      : d3.interpolateNumber,
    reverse
  }
) {
  interval = maybeRangeInterval(interval, type);
  if (type === "cyclical" || type === "sequential") type = "linear"; // shorthand for color schemes
  if (typeof interpolate !== "function") interpolate = maybeInterpolator(interpolate); // named interpolator
  reverse = !!reverse;

  // If an explicit range is specified, and it has a different length than the
  // domain, then redistribute the range using a piecewise interpolator.
  if (range !== undefined) {
    const n = (domain = arrayify(domain)).length;
    const m = (range = arrayify(range)).length;
    if (n !== m) {
      if (interpolate.length === 1) throw new Error("invalid piecewise interpolator"); // e.g., turbo
      interpolate = d3.piecewise(interpolate, range);
      range = undefined;
    }
  }

  // Disambiguate between a two-argument interpolator that is used in
  // conjunction with the range, and a one-argument “fixed” interpolator on the
  // [0, 1] interval as with the RdBu color scheme.
  if (interpolate.length === 1) {
    if (reverse) {
      interpolate = flip(interpolate);
      reverse = false;
    }
    if (range === undefined) {
      range = Float64Array.from(domain, (_, i) => i / (domain.length - 1));
      if (range.length === 2) range = unit; // optimize common case of [0, 1]
    }
    scale.interpolate((range === unit ? constant : interpolatePiecewise)(interpolate));
  } else {
    scale.interpolate(interpolate);
  }

  // If a zero option is specified, we assume that the domain is numeric, and we
  // want to ensure that the domain crosses zero. However, note that the domain
  // may be reversed (descending) so we shouldn’t assume that the first value is
  // smaller than the last; and also it’s possible that the domain has more than
  // two values for a “poly” scale. And lastly be careful not to mutate input!
  if (zero) {
    const [min, max] = d3.extent(domain);
    if (min > 0 || max < 0) {
      domain = slice(domain);
      const o = orderof(domain) || 1; // treat degenerate as ascending
      if (o === Math.sign(min)) domain[0] = 0; // [1, 2] or [-1, -2]
      else domain[domain.length - 1] = 0; // [2, 1] or [-2, -1]
    }
  }

  if (reverse) domain = d3.reverse(domain);
  scale.domain(domain).unknown(unknown);
  if (nice) scale.nice(maybeNice(nice, type)), (domain = scale.domain());
  if (range !== undefined) scale.range(range);
  if (clamp) scale.clamp(clamp);
  return {type, domain, range, scale, interpolate, interval};
}

function maybeNice(nice, type) {
  return nice === true ? undefined : typeof nice === "number" ? nice : maybeNiceInterval(nice, type);
}

function createScaleLinear(key, channels, options) {
  return createScaleQ(key, d3.scaleLinear(), channels, options);
}

function createScaleSqrt(key, channels, options) {
  return createScalePow(key, channels, {...options, exponent: 0.5});
}

function createScalePow(key, channels, {exponent = 1, ...options}) {
  return createScaleQ(key, d3.scalePow().exponent(exponent), channels, {...options, type: "pow"});
}

function createScaleLog(key, channels, {base = 10, domain = inferLogDomain(channels), ...options}) {
  return createScaleQ(key, d3.scaleLog().base(base), channels, {...options, domain});
}

function createScaleSymlog(key, channels, {constant = 1, ...options}) {
  return createScaleQ(key, d3.scaleSymlog().constant(constant), channels, options);
}

function createScaleQuantile(
  key,
  channels,
  {
    range,
    quantiles = range === undefined ? 5 : (range = [...range]).length, // deprecated; use n instead
    n = quantiles,
    scheme = "rdylbu",
    domain = inferQuantileDomain(channels),
    unknown,
    interpolate,
    reverse
  }
) {
  if (range === undefined) {
    range =
      interpolate !== undefined
        ? d3.quantize(interpolate, n)
        : registry.get(key) === color
        ? ordinalRange(scheme, n)
        : undefined;
  }
  if (domain.length > 0) {
    domain = d3.scaleQuantile(domain, range === undefined ? {length: n} : range).quantiles();
  }
  return createScaleThreshold(key, channels, {domain, range, reverse, unknown});
}

function createScaleQuantize(
  key,
  channels,
  {
    range,
    n = range === undefined ? 5 : (range = [...range]).length,
    scheme = "rdylbu",
    domain = inferAutoDomain(key, channels),
    unknown,
    interpolate,
    reverse
  }
) {
  const [min, max] = d3.extent(domain);
  let thresholds;
  if (range === undefined) {
    thresholds = d3.ticks(min, max, n); // approximate number of nice, round thresholds
    if (thresholds[0] <= min) thresholds.splice(0, 1); // drop exact lower bound
    if (thresholds[thresholds.length - 1] >= max) thresholds.pop(); // drop exact upper bound
    n = thresholds.length + 1;
    range =
      interpolate !== undefined
        ? d3.quantize(interpolate, n)
        : registry.get(key) === color
        ? ordinalRange(scheme, n)
        : undefined;
  } else {
    thresholds = d3.quantize(d3.interpolateNumber(min, max), n + 1).slice(1, -1); // exactly n - 1 thresholds to match range
    if (min instanceof Date) thresholds = thresholds.map((x) => new Date(x)); // preserve date types
  }
  if (orderof(arrayify(domain)) < 0) thresholds.reverse(); // preserve descending domain
  return createScaleThreshold(key, channels, {domain: thresholds, range, reverse, unknown});
}

function createScaleThreshold(
  key,
  channels,
  {
    domain = [0], // explicit thresholds in ascending order
    unknown,
    scheme = "rdylbu",
    interpolate,
    range = interpolate !== undefined
      ? d3.quantize(interpolate, domain.length + 1)
      : registry.get(key) === color
      ? ordinalRange(scheme, domain.length + 1)
      : undefined,
    reverse
  }
) {
  domain = arrayify(domain);
  const sign = orderof(domain); // preserve descending domain
  if (!isNaN(sign) && !isOrdered(domain, sign)) throw new Error(`the ${key} scale has a non-monotonic domain`);
  if (reverse) range = d3.reverse(range); // domain ascending, so reverse range
  return {
    type: "threshold",
    scale: d3.scaleThreshold(sign < 0 ? d3.reverse(domain) : domain, range === undefined ? [] : range).unknown(unknown),
    domain,
    range
  };
}

function isOrdered(domain, sign) {
  for (let i = 1, n = domain.length, d = domain[0]; i < n; ++i) {
    const s = d3.descending(d, (d = domain[i]));
    if (s !== 0 && s !== sign) return false;
  }
  return true;
}

// For non-numeric identity scales such as color and symbol, we can’t use D3’s
// identity scale because it coerces to number; and we can’t compute the domain
// (and equivalently range) since we can’t know whether the values are
// continuous or discrete.
function createScaleIdentity(key) {
  return {type: "identity", scale: hasNumericRange(registry.get(key)) ? d3.scaleIdentity() : (d) => d};
}

function inferDomain$1(channels, f = finite$1) {
  return channels.length
    ? [
        d3.min(channels, ({value}) => (value === undefined ? value : d3.min(value, f))),
        d3.max(channels, ({value}) => (value === undefined ? value : d3.max(value, f)))
      ]
    : [0, 1];
}

function inferAutoDomain(key, channels) {
  const type = registry.get(key);
  return (type === radius || type === opacity || type === length ? inferZeroDomain : inferDomain$1)(channels);
}

function inferZeroDomain(channels) {
  return [0, channels.length ? d3.max(channels, ({value}) => (value === undefined ? value : d3.max(value, finite$1))) : 1];
}

// We don’t want the upper bound of the radial domain to be zero, as this would
// be degenerate, so we ignore nonpositive values. We also don’t want the
// maximum default radius to exceed 30px.
function inferRadialRange(channels, domain) {
  const hint = channels.find(({radius}) => radius !== undefined);
  if (hint !== undefined) return [0, hint.radius]; // a natural maximum radius, e.g. hexbins
  const h25 = d3.quantile(channels, 0.5, ({value}) => (value === undefined ? NaN : d3.quantile(value, 0.25, positive)));
  const range = domain.map((d) => 3 * Math.sqrt(d / h25));
  const k = 30 / d3.max(range);
  return k < 1 ? range.map((r) => r * k) : range;
}

// We want a length scale’s domain to go from zero to a positive value, and to
// treat negative lengths if any as inverted vectors of equivalent magnitude. We
// also don’t want the maximum default length to exceed 60px.
function inferLengthRange(channels, domain) {
  const h50 = d3.median(channels, ({value}) => (value === undefined ? NaN : d3.median(value, Math.abs)));
  const range = domain.map((d) => (12 * d) / h50);
  const k = 60 / d3.max(range);
  return k < 1 ? range.map((r) => r * k) : range;
}

function inferLogDomain(channels) {
  for (const {value} of channels) {
    if (value !== undefined) {
      for (let v of value) {
        if (v > 0) return inferDomain$1(channels, positive);
        if (v < 0) return inferDomain$1(channels, negative);
      }
    }
  }
  return [1, 10];
}

function inferQuantileDomain(channels) {
  const domain = [];
  for (const {value} of channels) {
    if (value === undefined) continue;
    for (const v of value) domain.push(v);
  }
  return domain;
}

function interpolatePiecewise(interpolate) {
  return (i, j) => (t) => interpolate(i + t * (j - i));
}

let warnings = 0;
let lastMessage;

function consumeWarnings() {
  const w = warnings;
  warnings = 0;
  lastMessage = undefined;
  return w;
}

function warn(message) {
  if (message === lastMessage) return;
  lastMessage = message;
  console.warn(message);
  ++warnings;
}

function createScaleD(
  key,
  scale,
  transform,
  channels,
  {
    type,
    nice,
    clamp,
    domain = inferDomain$1(channels),
    unknown,
    pivot = 0,
    scheme,
    range,
    symmetric = true,
    interpolate = registry.get(key) === color
      ? scheme == null && range !== undefined
        ? d3.interpolateRgb
        : quantitativeScheme(scheme !== undefined ? scheme : "rdbu")
      : d3.interpolateNumber,
    reverse
  }
) {
  pivot = +pivot;
  domain = arrayify(domain);
  let [min, max] = domain;
  if (domain.length > 2) warn(`Warning: the diverging ${key} scale domain contains extra elements.`);

  if (d3.descending(min, max) < 0) ([min, max] = [max, min]), (reverse = !reverse);
  min = Math.min(min, pivot);
  max = Math.max(max, pivot);

  // Sometimes interpolate is a named interpolator, such as "lab" for Lab color
  // space. Other times interpolate is a function that takes two arguments and
  // is used in conjunction with the range. And other times the interpolate
  // function is a “fixed” interpolator on the [0, 1] interval, as when a
  // color scheme such as interpolateRdBu is used.
  if (typeof interpolate !== "function") {
    interpolate = maybeInterpolator(interpolate);
  }

  // If an explicit range is specified, promote it to a piecewise interpolator.
  if (range !== undefined) {
    interpolate =
      interpolate.length === 1 ? interpolatePiecewise(interpolate)(...range) : d3.piecewise(interpolate, range);
  }

  // Reverse before normalization.
  if (reverse) interpolate = flip(interpolate);

  // Normalize the interpolator for symmetric difference around the pivot.
  if (symmetric) {
    const mid = transform.apply(pivot);
    const mindelta = mid - transform.apply(min);
    const maxdelta = transform.apply(max) - mid;
    if (mindelta < maxdelta) min = transform.invert(mid - maxdelta);
    else if (mindelta > maxdelta) max = transform.invert(mid + mindelta);
  }

  scale.domain([min, pivot, max]).unknown(unknown).interpolator(interpolate);
  if (clamp) scale.clamp(clamp);
  if (nice) scale.nice(nice);
  return {type, domain: [min, max], pivot, interpolate, scale};
}

function createScaleDiverging(key, channels, options) {
  return createScaleD(key, d3.scaleDiverging(), transformIdentity, channels, options);
}

function createScaleDivergingSqrt(key, channels, options) {
  return createScaleDivergingPow(key, channels, {...options, exponent: 0.5});
}

function createScaleDivergingPow(key, channels, {exponent = 1, ...options}) {
  return createScaleD(key, d3.scaleDivergingPow().exponent((exponent = +exponent)), transformPow(exponent), channels, {
    ...options,
    type: "diverging-pow"
  });
}

function createScaleDivergingLog(
  key,
  channels,
  {base = 10, pivot = 1, domain = inferDomain$1(channels, pivot < 0 ? negative : positive), ...options}
) {
  return createScaleD(key, d3.scaleDivergingLog().base((base = +base)), transformLog, channels, {
    domain,
    pivot,
    ...options
  });
}

function createScaleDivergingSymlog(key, channels, {constant = 1, ...options}) {
  return createScaleD(
    key,
    d3.scaleDivergingSymlog().constant((constant = +constant)),
    transformSymlog(constant),
    channels,
    options
  );
}

const transformIdentity = {
  apply(x) {
    return x;
  },
  invert(x) {
    return x;
  }
};

const transformLog = {
  apply: Math.log,
  invert: Math.exp
};

const transformSqrt = {
  apply(x) {
    return Math.sign(x) * Math.sqrt(Math.abs(x));
  },
  invert(x) {
    return Math.sign(x) * (x * x);
  }
};

function transformPow(exponent) {
  return exponent === 0.5
    ? transformSqrt
    : {
        apply(x) {
          return Math.sign(x) * Math.pow(Math.abs(x), exponent);
        },
        invert(x) {
          return Math.sign(x) * Math.pow(Math.abs(x), 1 / exponent);
        }
      };
}

function transformSymlog(constant) {
  return {
    apply(x) {
      return Math.sign(x) * Math.log1p(Math.abs(x / constant));
    },
    invert(x) {
      return Math.sign(x) * Math.expm1(Math.abs(x)) * constant;
    }
  };
}

function createScaleT(key, scale, channels, options) {
  return createScaleQ(key, scale, channels, options);
}

function createScaleTime(key, channels, options) {
  return createScaleT(key, d3.scaleTime(), channels, options);
}

function createScaleUtc(key, channels, options) {
  return createScaleT(key, d3.scaleUtc(), channels, options);
}

// This denotes an implicitly ordinal color scale: the scale type was not set,
// but the associated values are strings or booleans. If the associated defined
// values are entirely boolean, the range will default to greys. You can opt out
// of this by setting the type explicitly.
const ordinalImplicit = Symbol("ordinal");

function createScaleO(key, scale, channels, {type, interval, domain, range, reverse, hint}) {
  interval = maybeRangeInterval(interval, type);
  if (domain === undefined) domain = inferDomain(channels, interval, key);
  if (type === "categorical" || type === ordinalImplicit) type = "ordinal"; // shorthand for color schemes
  if (reverse) domain = d3.reverse(domain);
  domain = scale.domain(domain).domain(); // deduplicate
  if (range !== undefined) {
    // If the range is specified as a function, pass it the domain.
    if (typeof range === "function") range = range(domain);
    scale.range(range);
  }
  return {type, domain, range, scale, hint, interval};
}

function createScaleOrdinal(key, channels, {type, interval, domain, range, scheme, unknown, ...options}) {
  interval = maybeRangeInterval(interval, type);
  if (domain === undefined) domain = inferDomain(channels, interval, key);
  let hint;
  if (registry.get(key) === symbol) {
    hint = inferSymbolHint(channels);
    range = range === undefined ? inferSymbolRange(hint) : map$1(range, maybeSymbol);
  } else if (registry.get(key) === color) {
    if (range === undefined && (type === "ordinal" || type === ordinalImplicit)) {
      range = maybeBooleanRange(domain, scheme);
      if (range !== undefined) scheme = undefined; // Don’t re-apply scheme.
    }
    if (scheme === undefined && range === undefined) {
      scheme = type === "ordinal" ? "turbo" : "observable10";
    }
    if (scheme !== undefined) {
      if (range !== undefined) {
        const interpolate = quantitativeScheme(scheme);
        const t0 = range[0],
          d = range[1] - range[0];
        range = ({length: n}) => d3.quantize((t) => interpolate(t0 + d * t), n);
      } else {
        range = ordinalScheme(scheme);
      }
    }
  }
  if (unknown === d3.scaleImplicit) {
    throw new Error(`implicit unknown on ${key} scale is not supported`);
  }
  return createScaleO(key, d3.scaleOrdinal().unknown(unknown), channels, {...options, type, domain, range, hint});
}

function createScalePoint(key, channels, {align = 0.5, padding = 0.5, ...options}) {
  return maybeRound(d3.scalePoint().align(align).padding(padding), channels, options, key);
}

function createScaleBand(
  key,
  channels,
  {
    align = 0.5,
    padding = 0.1,
    paddingInner = padding,
    paddingOuter = key === "fx" || key === "fy" ? 0 : padding,
    ...options
  }
) {
  return maybeRound(
    d3.scaleBand().align(align).paddingInner(paddingInner).paddingOuter(paddingOuter),
    channels,
    options,
    key
  );
}

function maybeRound(scale, channels, options, key) {
  let {round} = options;
  if (round !== undefined) scale.round((round = !!round));
  scale = createScaleO(key, scale, channels, options);
  scale.round = round; // preserve for autoScaleRound
  return scale;
}

function inferDomain(channels, interval, key) {
  const values = new d3.InternSet();
  for (const {value, domain} of channels) {
    if (domain !== undefined) return domain(); // see channelDomain
    if (value === undefined) continue;
    for (const v of value) values.add(v);
  }
  if (interval !== undefined) {
    const [min, max] = d3.extent(values).map(interval.floor, interval);
    return interval.range(min, interval.offset(max));
  }
  if (values.size > 10e3 && registry.get(key) === position$1) {
    throw new Error(`implicit ordinal domain of ${key} scale has more than 10,000 values`);
  }
  return d3.sort(values, ascendingDefined);
}

// If all channels provide a consistent hint, propagate it to the scale.
function inferHint(channels, key) {
  let value;
  for (const {hint} of channels) {
    const candidate = hint?.[key];
    if (candidate === undefined) continue; // no hint here
    if (value === undefined) value = candidate; // first hint
    else if (value !== candidate) return; // inconsistent hint
  }
  return value;
}

function inferSymbolHint(channels) {
  return {
    fill: inferHint(channels, "fill"),
    stroke: inferHint(channels, "stroke")
  };
}

function inferSymbolRange(hint) {
  return isNoneish(hint.fill) ? d3.symbolsStroke : d3.symbolsFill;
}

function createScales(
  channelsByScale,
  {
    label: globalLabel,
    inset: globalInset = 0,
    insetTop: globalInsetTop = globalInset,
    insetRight: globalInsetRight = globalInset,
    insetBottom: globalInsetBottom = globalInset,
    insetLeft: globalInsetLeft = globalInset,
    round,
    nice,
    clamp,
    zero,
    align,
    padding,
    projection,
    facet: {label: facetLabel = globalLabel} = {},
    ...options
  } = {}
) {
  const scales = {};
  for (const [key, channels] of channelsByScale) {
    const scaleOptions = options[key];
    const scale = createScale(key, channels, {
      round: registry.get(key) === position$1 ? round : undefined, // only for position
      nice,
      clamp,
      zero,
      align,
      padding,
      projection,
      ...scaleOptions
    });
    if (scale) {
      // populate generic scale options (percent, transform, insets)
      let {
        label = key === "fx" || key === "fy" ? facetLabel : globalLabel,
        percent,
        transform,
        inset,
        insetTop = inset !== undefined ? inset : key === "y" ? globalInsetTop : 0, // not fy
        insetRight = inset !== undefined ? inset : key === "x" ? globalInsetRight : 0, // not fx
        insetBottom = inset !== undefined ? inset : key === "y" ? globalInsetBottom : 0, // not fy
        insetLeft = inset !== undefined ? inset : key === "x" ? globalInsetLeft : 0 // not fx
      } = scaleOptions || {};
      if (transform == null) transform = undefined;
      else if (typeof transform !== "function") throw new Error("invalid scale transform; not a function");
      scale.percent = !!percent;
      scale.label = label === undefined ? inferScaleLabel(channels, scale) : label;
      scale.transform = transform;
      if (key === "x" || key === "fx") {
        scale.insetLeft = +insetLeft;
        scale.insetRight = +insetRight;
      } else if (key === "y" || key === "fy") {
        scale.insetTop = +insetTop;
        scale.insetBottom = +insetBottom;
      }
      scales[key] = scale;
    }
  }
  return scales;
}

function createScaleFunctions(descriptors) {
  const scales = {};
  const scaleFunctions = {scales};
  for (const [key, descriptor] of Object.entries(descriptors)) {
    const {scale, type, interval, label} = descriptor;
    scales[key] = exposeScale(descriptor);
    scaleFunctions[key] = scale;
    // TODO: pass these properties, which are needed for axes, in the descriptor.
    scale.type = type;
    if (interval != null) scale.interval = interval;
    if (label != null) scale.label = label;
  }
  return scaleFunctions;
}

// Mutates scale.range!
function autoScaleRange(scales, dimensions) {
  const {x, y, fx, fy} = scales;
  const superdimensions = fx || fy ? outerDimensions(dimensions) : dimensions;
  if (fx) autoScaleRangeX(fx, superdimensions);
  if (fy) autoScaleRangeY(fy, superdimensions);
  const subdimensions = fx || fy ? innerDimensions(scales, dimensions) : dimensions;
  if (x) autoScaleRangeX(x, subdimensions);
  if (y) autoScaleRangeY(y, subdimensions);
}

// Channels can have labels; if all the channels for a given scale are
// consistently labeled (i.e., have the same value if not undefined), and the
// corresponding scale doesn’t already have an explicit label, then the
// channels’ label is promoted to the scale. This inferred label should have an
// orientation-appropriate arrow added when used as an axis, but we don’t want
// to add the arrow when the label is set explicitly as an option; so, the
// inferred label is distinguished as an object with an “inferred” property.
function inferScaleLabel(channels = [], scale) {
  let label;
  for (const {label: l} of channels) {
    if (l === undefined) continue;
    if (label === undefined) label = l;
    else if (label !== l) return;
  }
  if (label === undefined) return;
  if (!isOrdinalScale(scale) && scale.percent) label = `${label} (%)`;
  return {inferred: true, toString: () => label};
}

// Determines whether the scale points in the “positive” (right or down) or
// “negative” (left or up) direction; if the scale order cannot be determined,
// returns NaN; used to assign an appropriate label arrow.
function inferScaleOrder(scale) {
  return Math.sign(orderof(scale.domain())) * Math.sign(orderof(scale.range()));
}

// Returns the dimensions of the outer frame; this is subdivided into facets
// with the margins of each facet collapsing into the outer margins.
function outerDimensions(dimensions) {
  const {
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    width,
    height,
    facet: {
      marginTop: facetMarginTop,
      marginRight: facetMarginRight,
      marginBottom: facetMarginBottom,
      marginLeft: facetMarginLeft
    }
  } = dimensions;
  return {
    marginTop: Math.max(marginTop, facetMarginTop),
    marginRight: Math.max(marginRight, facetMarginRight),
    marginBottom: Math.max(marginBottom, facetMarginBottom),
    marginLeft: Math.max(marginLeft, facetMarginLeft),
    width,
    height
  };
}

// Returns the dimensions of each facet.
function innerDimensions({fx, fy}, dimensions) {
  const {marginTop, marginRight, marginBottom, marginLeft, width, height} = outerDimensions(dimensions);
  return {
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    width: fx ? fx.scale.bandwidth() + marginLeft + marginRight : width,
    height: fy ? fy.scale.bandwidth() + marginTop + marginBottom : height,
    facet: {width, height}
  };
}

function autoScaleRangeX(scale, dimensions) {
  if (scale.range === undefined) {
    const {insetLeft, insetRight} = scale;
    const {width, marginLeft = 0, marginRight = 0} = dimensions;
    const left = marginLeft + insetLeft;
    const right = width - marginRight - insetRight;
    scale.range = [left, Math.max(left, right)];
    if (!isOrdinalScale(scale)) scale.range = piecewiseRange(scale);
    scale.scale.range(scale.range);
  }
  autoScaleRound(scale);
}

function autoScaleRangeY(scale, dimensions) {
  if (scale.range === undefined) {
    const {insetTop, insetBottom} = scale;
    const {height, marginTop = 0, marginBottom = 0} = dimensions;
    const top = marginTop + insetTop;
    const bottom = height - marginBottom - insetBottom;
    scale.range = [Math.max(top, bottom), top];
    if (!isOrdinalScale(scale)) scale.range = piecewiseRange(scale);
    else scale.range.reverse();
    scale.scale.range(scale.range);
  }
  autoScaleRound(scale);
}

function autoScaleRound(scale) {
  if (scale.round === undefined && isBandScale(scale) && roundError(scale) <= 30) {
    scale.scale.round(true);
  }
}

// If we were to turn on rounding for this band or point scale, how much wasted
// space would it introduce (on both ends of the range)? This must match
// d3.scaleBand’s rounding behavior:
// https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/band.js#L20-L32
function roundError({scale}) {
  const n = scale.domain().length;
  const [start, stop] = scale.range();
  const paddingInner = scale.paddingInner ? scale.paddingInner() : 1;
  const paddingOuter = scale.paddingOuter ? scale.paddingOuter() : scale.padding();
  const m = n - paddingInner;
  const step = Math.abs(stop - start) / Math.max(1, m + paddingOuter * 2);
  return (step - Math.floor(step)) * m;
}

function piecewiseRange(scale) {
  const length = scale.scale.domain().length + isThresholdScale(scale);
  if (!(length > 2)) return scale.range;
  const [start, end] = scale.range;
  return Array.from({length}, (_, i) => start + (i / (length - 1)) * (end - start));
}

function normalizeScale(key, scale, hint) {
  return createScale(key, hint === undefined ? undefined : [{hint}], {...scale});
}

function createScale(key, channels = [], options = {}) {
  const type = inferScaleType(key, channels, options);

  // Warn for common misuses of implicit ordinal scales. We disable this test if
  // you specify a scale interval or if you set the domain or range explicitly,
  // since setting the domain or range (typically with a cardinality of more than
  // two) is another indication that you intended for the scale to be ordinal; we
  // also disable it for facet scales since these are always band scales.
  if (
    options.type === undefined &&
    options.domain === undefined &&
    options.range === undefined &&
    options.interval == null &&
    key !== "fx" &&
    key !== "fy" &&
    isOrdinalScale({type})
  ) {
    const values = channels.map(({value}) => value).filter((value) => value !== undefined);
    if (values.some(isTemporal))
      warn(
        `Warning: some data associated with the ${key} scale are dates. Dates are typically associated with a "utc" or "time" scale rather than a "${formatScaleType(
          type
        )}" scale. If you are using a bar mark, you probably want a rect mark with the interval option instead; if you are using a group transform, you probably want a bin transform instead. If you want to treat this data as ordinal, you can specify the interval of the ${key} scale (e.g., d3.utcDay), or you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(
          type
        )}".`
      );
    else if (values.some(isTemporalString))
      warn(
        `Warning: some data associated with the ${key} scale are strings that appear to be dates (e.g., YYYY-MM-DD). If these strings represent dates, you should parse them to Date objects. Dates are typically associated with a "utc" or "time" scale rather than a "${formatScaleType(
          type
        )}" scale. If you are using a bar mark, you probably want a rect mark with the interval option instead; if you are using a group transform, you probably want a bin transform instead. If you want to treat this data as ordinal, you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(
          type
        )}".`
      );
    else if (values.some(isNumericString))
      warn(
        `Warning: some data associated with the ${key} scale are strings that appear to be numbers. If these strings represent numbers, you should parse or coerce them to numbers. Numbers are typically associated with a "linear" scale rather than a "${formatScaleType(
          type
        )}" scale. If you want to treat this data as ordinal, you can specify the interval of the ${key} scale (e.g., 1 for integers), or you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(
          type
        )}".`
      );
  }

  options.type = type; // Mutates input!

  // Once the scale type is known, coerce the associated channel values and any
  // explicitly-specified domain to the expected type.
  switch (type) {
    case "diverging":
    case "diverging-sqrt":
    case "diverging-pow":
    case "diverging-log":
    case "diverging-symlog":
    case "cyclical":
    case "sequential":
    case "linear":
    case "sqrt":
    case "threshold":
    case "quantile":
    case "pow":
    case "log":
    case "symlog":
      options = coerceType(channels, options, coerceNumbers);
      break;
    case "identity":
      switch (registry.get(key)) {
        case position$1:
          options = coerceType(channels, options, coerceNumbers);
          break;
        case symbol:
          options = coerceType(channels, options, coerceSymbols);
          break;
      }
      break;
    case "utc":
    case "time":
      options = coerceType(channels, options, coerceDates);
      break;
  }

  switch (type) {
    case "diverging":
      return createScaleDiverging(key, channels, options);
    case "diverging-sqrt":
      return createScaleDivergingSqrt(key, channels, options);
    case "diverging-pow":
      return createScaleDivergingPow(key, channels, options);
    case "diverging-log":
      return createScaleDivergingLog(key, channels, options);
    case "diverging-symlog":
      return createScaleDivergingSymlog(key, channels, options);
    case "categorical":
    case "ordinal":
    case ordinalImplicit:
      return createScaleOrdinal(key, channels, options);
    case "cyclical":
    case "sequential":
    case "linear":
      return createScaleLinear(key, channels, options);
    case "sqrt":
      return createScaleSqrt(key, channels, options);
    case "threshold":
      return createScaleThreshold(key, channels, options);
    case "quantile":
      return createScaleQuantile(key, channels, options);
    case "quantize":
      return createScaleQuantize(key, channels, options);
    case "pow":
      return createScalePow(key, channels, options);
    case "log":
      return createScaleLog(key, channels, options);
    case "symlog":
      return createScaleSymlog(key, channels, options);
    case "utc":
      return createScaleUtc(key, channels, options);
    case "time":
      return createScaleTime(key, channels, options);
    case "point":
      return createScalePoint(key, channels, options);
    case "band":
      return createScaleBand(key, channels, options);
    case "identity":
      return createScaleIdentity(key);
    case undefined:
      return;
    default:
      throw new Error(`unknown scale type: ${type}`);
  }
}

function formatScaleType(type) {
  return typeof type === "symbol" ? type.description : type;
}

function maybeScaleType(type) {
  return typeof type === "string" ? `${type}`.toLowerCase() : type;
}

// A special type symbol when the x and y scales are replaced with a projection.
const typeProjection = {toString: () => "projection"};

function inferScaleType(key, channels, {type, domain, range, scheme, pivot, projection}) {
  type = maybeScaleType(type);

  // The facet scales are always band scales; this cannot be changed.
  if (key === "fx" || key === "fy") return "band";

  // If a projection is specified, the x- and y-scales are disabled; these
  // channels will be projected rather than scaled. (But still check that none
  // of the associated channels are incompatible with a projection.)
  if ((key === "x" || key === "y") && projection != null) type = typeProjection;

  // If a channel dictates a scale type, make sure that it is consistent with
  // the user-specified scale type (if any) and all other channels. For example,
  // barY requires x to be a band scale and disallows any other scale type.
  for (const channel of channels) {
    const t = maybeScaleType(channel.type);
    if (t === undefined) continue;
    else if (type === undefined) type = t;
    else if (type !== t) throw new Error(`scale incompatible with channel: ${type} !== ${t}`);
  }

  // If the scale, a channel, or user specified a (consistent) type, return it.
  if (type === typeProjection) return;
  if (type !== undefined) return type;

  // If there’s no data (and no type) associated with this scale, don’t create a scale.
  if (domain === undefined && !channels.some(({value}) => value !== undefined)) return;

  // Some scales have default types.
  const kind = registry.get(key);
  if (kind === radius) return "sqrt";
  if (kind === opacity || kind === length) return "linear";
  if (kind === symbol) return "ordinal";

  // If the domain or range has more than two values, assume it’s ordinal. You
  // can still use a “piecewise” (or “polylinear”) scale, but you must set the
  // type explicitly.
  if ((domain || range || []).length > 2) return asOrdinalType(kind);

  // Otherwise, infer the scale type from the data! Prefer the domain, if
  // present, over channels. (The domain and channels should be consistently
  // typed, and the domain is more explicit and typically much smaller.) We only
  // check the first defined value for expedience and simplicity; we expect
  // that the types are consistent.
  if (domain !== undefined) {
    if (isOrdinal(domain)) return asOrdinalType(kind);
    if (isTemporal(domain)) return "utc";
  } else {
    const values = channels.map(({value}) => value).filter((value) => value !== undefined);
    if (values.some(isOrdinal)) return asOrdinalType(kind);
    if (values.some(isTemporal)) return "utc";
  }

  // For color scales, take a hint from the color scheme and pivot option.
  if (kind === color) {
    if (pivot != null || isDivergingScheme(scheme)) return "diverging";
    if (isCategoricalScheme(scheme)) return "categorical";
  }

  return "linear";
}

// Positional scales default to a point scale instead of an ordinal scale.
function asOrdinalType(kind) {
  switch (kind) {
    case position$1:
      return "point";
    case color:
      return ordinalImplicit;
    default:
      return "ordinal";
  }
}

function isOrdinalScale({type}) {
  return type === "ordinal" || type === "point" || type === "band" || type === ordinalImplicit;
}

function isThresholdScale({type}) {
  return type === "threshold";
}

function isBandScale({type}) {
  return type === "point" || type === "band";
}

// Certain marks have special behavior if a scale is collapsed, i.e. if the
// domain is degenerate and represents only a single value such as [3, 3]; for
// example, a rect will span the full extent of the chart along a collapsed
// dimension (whereas a dot will simply be drawn in the center).
function isCollapsed(scale) {
  if (scale === undefined) return true; // treat missing scale as collapsed
  const domain = scale.domain();
  const value = scale(domain[0]);
  for (let i = 1, n = domain.length; i < n; ++i) {
    if (scale(domain[i]) - value) {
      return false;
    }
  }
  return true;
}

// Mutates channel.value!
function coerceType(channels, {domain, ...options}, coerceValues) {
  for (const c of channels) {
    if (c.value !== undefined) {
      if (domain === undefined) domain = c.value?.domain; // promote channel domain
      c.value = coerceValues(c.value);
    }
  }
  return {
    domain: domain === undefined ? domain : coerceValues(domain),
    ...options
  };
}

function coerceSymbols(values) {
  return map$1(values, maybeSymbol);
}

function scale(options = {}) {
  let scale;
  for (const key in options) {
    if (!registry.has(key)) continue; // ignore unknown properties
    if (!isScaleOptions(options[key])) continue; // e.g., ignore {color: "red"}
    if (scale !== undefined) throw new Error("ambiguous scale definition; multiple scales found");
    scale = exposeScale(normalizeScale(key, options[key]));
  }
  if (scale === undefined) throw new Error("invalid scale definition; no scale found");
  return scale;
}

function exposeScales(scales) {
  return (key) => {
    if (!registry.has((key = `${key}`))) throw new Error(`unknown scale: ${key}`);
    return scales[key];
  };
}

// Note: axis- and legend-related properties (such as label, ticks and
// tickFormat) are not included here as they do not affect the scale’s behavior.
function exposeScale({scale, type, domain, range, interpolate, interval, transform, percent, pivot}) {
  if (type === "identity") return {type: "identity", apply: (d) => d, invert: (d) => d};
  const unknown = scale.unknown ? scale.unknown() : undefined;
  return {
    type,
    domain: slice(domain), // defensive copy
    ...(range !== undefined && {range: slice(range)}), // defensive copy
    ...(transform !== undefined && {transform}),
    ...(percent && {percent}), // only exposed if truthy
    ...(unknown !== undefined && {unknown}),
    ...(interval !== undefined && {interval}),

    // quantitative
    ...(interpolate !== undefined && {interpolate}),
    ...(scale.clamp && {clamp: scale.clamp()}),

    // diverging (always asymmetric; we never want to apply the symmetric transform twice)
    ...(pivot !== undefined && {pivot, symmetric: false}),

    // log, diverging-log
    ...(scale.base && {base: scale.base()}),

    // pow, diverging-pow
    ...(scale.exponent && {exponent: scale.exponent()}),

    // symlog, diverging-symlog
    ...(scale.constant && {constant: scale.constant()}),

    // band, point
    ...(scale.align && {align: scale.align(), round: scale.round()}),
    ...(scale.padding &&
      (scale.paddingInner
        ? {paddingInner: scale.paddingInner(), paddingOuter: scale.paddingOuter()}
        : {padding: scale.padding()})),
    ...(scale.bandwidth && {bandwidth: scale.bandwidth(), step: scale.step()}),

    // utilities
    apply: (t) => scale(t),
    ...(scale.invert && {invert: (t) => scale.invert(t)})
  };
}

// Returns an array of {x?, y?, i} objects representing the facet domain.
function createFacets(channelsByScale, options) {
  const {fx, fy} = createScales(channelsByScale, options);
  const fxDomain = fx?.scale.domain();
  const fyDomain = fy?.scale.domain();
  return fxDomain && fyDomain
    ? d3.cross(fxDomain, fyDomain).map(([x, y], i) => ({x, y, i}))
    : fxDomain
    ? fxDomain.map((x, i) => ({x, i}))
    : fyDomain
    ? fyDomain.map((y, i) => ({y, i}))
    : undefined;
}

function recreateFacets(facets, {x: X, y: Y}) {
  X &&= facetIndex(X);
  Y &&= facetIndex(Y);
  return facets
    .filter(
      X && Y // remove any facets no longer present in the domain
        ? (f) => X.has(f.x) && Y.has(f.y)
        : X
        ? (f) => X.has(f.x)
        : (f) => Y.has(f.y)
    )
    .sort(
      X && Y // reorder facets to match the new scale domains
        ? (a, b) => X.get(a.x) - X.get(b.x) || Y.get(a.y) - Y.get(b.y)
        : X
        ? (a, b) => X.get(a.x) - X.get(b.x)
        : (a, b) => Y.get(a.y) - Y.get(b.y)
    );
}

// Returns a (possibly nested) Map of [[key1, index1], [key2, index2], …]
// representing the data indexes associated with each facet.
function facetGroups(data, {fx, fy}) {
  const I = range(data);
  const FX = fx?.value;
  const FY = fy?.value;
  return fx && fy
    ? d3.rollup(
        I,
        (G) => ((G.fx = FX[G[0]]), (G.fy = FY[G[0]]), G),
        (i) => FX[i],
        (i) => FY[i]
      )
    : fx
    ? d3.rollup(
        I,
        (G) => ((G.fx = FX[G[0]]), G),
        (i) => FX[i]
      )
    : d3.rollup(
        I,
        (G) => ((G.fy = FY[G[0]]), G),
        (i) => FY[i]
      );
}

function facetTranslator(fx, fy, {marginTop, marginLeft}) {
  return fx && fy
    ? ({x, y}) => `translate(${fx(x) - marginLeft},${fy(y) - marginTop})`
    : fx
    ? ({x}) => `translate(${fx(x) - marginLeft},0)`
    : ({y}) => `translate(0,${fy(y) - marginTop})`;
}

// Returns an index that for each facet lists all the elements present in other
// facets in the original index. TODO Memoize to avoid repeated work?
function facetExclude(index) {
  const ex = [];
  const e = new Uint32Array(d3.sum(index, (d) => d.length));
  for (const i of index) {
    let n = 0;
    for (const j of index) {
      if (i === j) continue;
      e.set(j, n);
      n += j.length;
    }
    ex.push(e.slice(0, n));
  }
  return ex;
}

const facetAnchors = new Map([
  ["top", facetAnchorTop],
  ["right", facetAnchorRight],
  ["bottom", facetAnchorBottom],
  ["left", facetAnchorLeft],
  ["top-left", and(facetAnchorTop, facetAnchorLeft)],
  ["top-right", and(facetAnchorTop, facetAnchorRight)],
  ["bottom-left", and(facetAnchorBottom, facetAnchorLeft)],
  ["bottom-right", and(facetAnchorBottom, facetAnchorRight)],
  ["top-empty", facetAnchorTopEmpty],
  ["right-empty", facetAnchorRightEmpty],
  ["bottom-empty", facetAnchorBottomEmpty],
  ["left-empty", facetAnchorLeftEmpty],
  ["empty", facetAnchorEmpty]
]);

function maybeFacetAnchor(facetAnchor) {
  if (facetAnchor == null) return null;
  const anchor = facetAnchors.get(`${facetAnchor}`.toLowerCase());
  if (anchor) return anchor;
  throw new Error(`invalid facet anchor: ${facetAnchor}`);
}

const indexCache = new WeakMap();

function facetIndex(V) {
  let I = indexCache.get(V);
  if (!I) indexCache.set(V, (I = new d3.InternMap(map$1(V, (v, i) => [v, i]))));
  return I;
}

// Like V.indexOf(v), but with the same semantics as InternMap.
function facetIndexOf(V, v) {
  return facetIndex(V).get(v);
}

// Like facets.find, but with the same semantics as InternMap.
function facetFind(facets, x, y) {
  x = keyof(x);
  y = keyof(y);
  return facets.find((f) => Object.is(keyof(f.x), x) && Object.is(keyof(f.y), y));
}

function facetEmpty(facets, x, y) {
  return facetFind(facets, x, y)?.empty;
}

function facetAnchorTop(facets, {y: Y}, {y}) {
  return Y ? facetIndexOf(Y, y) === 0 : true;
}

function facetAnchorBottom(facets, {y: Y}, {y}) {
  return Y ? facetIndexOf(Y, y) === Y.length - 1 : true;
}

function facetAnchorLeft(facets, {x: X}, {x}) {
  return X ? facetIndexOf(X, x) === 0 : true;
}

function facetAnchorRight(facets, {x: X}, {x}) {
  return X ? facetIndexOf(X, x) === X.length - 1 : true;
}

function facetAnchorTopEmpty(facets, {y: Y}, {x, y, empty}) {
  if (empty) return false;
  if (!Y) return;
  const i = facetIndexOf(Y, y);
  if (i > 0) return facetEmpty(facets, x, Y[i - 1]);
}

function facetAnchorBottomEmpty(facets, {y: Y}, {x, y, empty}) {
  if (empty) return false;
  if (!Y) return;
  const i = facetIndexOf(Y, y);
  if (i < Y.length - 1) return facetEmpty(facets, x, Y[i + 1]);
}

function facetAnchorLeftEmpty(facets, {x: X}, {x, y, empty}) {
  if (empty) return false;
  if (!X) return;
  const i = facetIndexOf(X, x);
  if (i > 0) return facetEmpty(facets, X[i - 1], y);
}

function facetAnchorRightEmpty(facets, {x: X}, {x, y, empty}) {
  if (empty) return false;
  if (!X) return;
  const i = facetIndexOf(X, x);
  if (i < X.length - 1) return facetEmpty(facets, X[i + 1], y);
}

function facetAnchorEmpty(facets, channels, {empty}) {
  return empty;
}

function and(a, b) {
  return function () {
    return a.apply(null, arguments) && b.apply(null, arguments);
  };
}

// Facet filter, by mark; for now only the "eq" filter is provided.
function facetFilter(facets, {channels: {fx, fy}, groups}) {
  return fx && fy
    ? facets.map(({x, y}) => groups.get(x)?.get(y) ?? [])
    : fx
    ? facets.map(({x}) => groups.get(x) ?? [])
    : facets.map(({y}) => groups.get(y) ?? []);
}

const pi = Math.PI;
const tau = 2 * pi;
const defaultAspectRatio = 0.618;

function createProjection(
  {
    projection,
    inset: globalInset = 0,
    insetTop = globalInset,
    insetRight = globalInset,
    insetBottom = globalInset,
    insetLeft = globalInset
  } = {},
  dimensions
) {
  if (projection == null) return;
  if (typeof projection.stream === "function") return projection; // d3 projection
  let options;
  let domain;
  let clip = "frame";

  // If the projection was specified as an object with additional options,
  // extract those. The order of precedence for insetTop (and other insets) is:
  // projection.insetTop, projection.inset, (global) insetTop, (global) inset.
  // Any other options on this object will be passed through to the initializer.
  if (isObject(projection)) {
    let inset;
    ({
      type: projection,
      domain,
      inset,
      insetTop = inset !== undefined ? inset : insetTop,
      insetRight = inset !== undefined ? inset : insetRight,
      insetBottom = inset !== undefined ? inset : insetBottom,
      insetLeft = inset !== undefined ? inset : insetLeft,
      clip = clip,
      ...options
    } = projection);
    if (projection == null) return;
  }

  // For named projections, retrieve the corresponding projection initializer.
  if (typeof projection !== "function") ({type: projection} = namedProjection(projection));

  // Compute the frame dimensions and invoke the projection initializer.
  const {width, height, marginLeft, marginRight, marginTop, marginBottom} = dimensions;
  const dx = width - marginLeft - marginRight - insetLeft - insetRight;
  const dy = height - marginTop - marginBottom - insetTop - insetBottom;
  projection = projection?.({width: dx, height: dy, clip, ...options});

  // The projection initializer might decide to not use a projection.
  if (projection == null) return;
  clip = maybePostClip(clip, marginLeft, marginTop, width - marginRight, height - marginBottom);

  // Translate the origin to the top-left corner, respecting margins and insets.
  let tx = marginLeft + insetLeft;
  let ty = marginTop + insetTop;
  let transform;

  // If a domain is specified, fit the projection to the frame.
  if (domain != null) {
    const [[x0, y0], [x1, y1]] = d3.geoPath(projection).bounds(domain);
    const k = Math.min(dx / (x1 - x0), dy / (y1 - y0));
    if (k > 0) {
      tx -= (k * (x0 + x1) - dx) / 2;
      ty -= (k * (y0 + y1) - dy) / 2;
      transform = d3.geoTransform({
        point(x, y) {
          this.stream.point(x * k + tx, y * k + ty);
        }
      });
    } else {
      warn(`Warning: the projection could not be fit to the specified domain; using the default scale.`);
    }
  }

  transform ??=
    tx === 0 && ty === 0
      ? identity()
      : d3.geoTransform({
          point(x, y) {
            this.stream.point(x + tx, y + ty);
          }
        });

  return {stream: (s) => projection.stream(transform.stream(clip(s)))};
}

function namedProjection(projection) {
  switch (`${projection}`.toLowerCase()) {
    case "albers-usa":
      return scaleProjection$1(d3.geoAlbersUsa, 0.7463, 0.4673);
    case "albers":
      return conicProjection(d3.geoAlbers, 0.7463, 0.4673);
    case "azimuthal-equal-area":
      return scaleProjection$1(d3.geoAzimuthalEqualArea, 4, 4);
    case "azimuthal-equidistant":
      return scaleProjection$1(d3.geoAzimuthalEquidistant, tau, tau);
    case "conic-conformal":
      return conicProjection(d3.geoConicConformal, tau, tau);
    case "conic-equal-area":
      return conicProjection(d3.geoConicEqualArea, 6.1702, 2.9781);
    case "conic-equidistant":
      return conicProjection(d3.geoConicEquidistant, 7.312, 3.6282);
    case "equal-earth":
      return scaleProjection$1(d3.geoEqualEarth, 5.4133, 2.6347);
    case "equirectangular":
      return scaleProjection$1(d3.geoEquirectangular, tau, pi);
    case "gnomonic":
      return scaleProjection$1(d3.geoGnomonic, 3.4641, 3.4641);
    case "identity":
      return {type: identity};
    case "reflect-y":
      return {type: reflectY};
    case "mercator":
      return scaleProjection$1(d3.geoMercator, tau, tau);
    case "orthographic":
      return scaleProjection$1(d3.geoOrthographic, 2, 2);
    case "stereographic":
      return scaleProjection$1(d3.geoStereographic, 2, 2);
    case "transverse-mercator":
      return scaleProjection$1(d3.geoTransverseMercator, tau, tau);
    default:
      throw new Error(`unknown projection type: ${projection}`);
  }
}

function maybePostClip(clip, x1, y1, x2, y2) {
  if (clip === false || clip == null || typeof clip === "number") return (s) => s;
  if (clip === true) clip = "frame";
  switch (`${clip}`.toLowerCase()) {
    case "frame":
      return d3.geoClipRectangle(x1, y1, x2, y2);
    default:
      throw new Error(`unknown projection clip type: ${clip}`);
  }
}

function scaleProjection$1(createProjection, kx, ky) {
  return {
    type: ({width, height, rotate, precision = 0.15, clip}) => {
      const projection = createProjection();
      if (precision != null) projection.precision?.(precision);
      if (rotate != null) projection.rotate?.(rotate);
      if (typeof clip === "number") projection.clipAngle?.(clip);
      projection.scale(Math.min(width / kx, height / ky));
      projection.translate([width / 2, height / 2]);
      return projection;
    },
    aspectRatio: ky / kx
  };
}

function conicProjection(createProjection, kx, ky) {
  const {type, aspectRatio} = scaleProjection$1(createProjection, kx, ky);
  return {
    type: (options) => {
      const {parallels, domain, width, height} = options;
      const projection = type(options);
      if (parallels != null) {
        projection.parallels(parallels);
        if (domain === undefined) {
          projection.fitSize([width, height], {type: "Sphere"});
        }
      }
      return projection;
    },
    aspectRatio
  };
}

const identity = constant({stream: (stream) => stream});

const reflectY = constant(
  d3.geoTransform({
    point(x, y) {
      this.stream.point(x, -y);
    }
  })
);

// Applies a point-wise projection to the given paired x and y channels.
// Note: mutates values!
function project(cx, cy, values, projection) {
  const x = values[cx];
  const y = values[cy];
  const n = x.length;
  const X = (values[cx] = new Float64Array(n).fill(NaN));
  const Y = (values[cy] = new Float64Array(n).fill(NaN));
  let i;
  const stream = projection.stream({
    point(x, y) {
      X[i] = x;
      Y[i] = y;
    }
  });
  for (i = 0; i < n; ++i) {
    stream.point(x[i], y[i]);
  }
}

// Returns true if a projection was specified. This should match the logic of
// createProjection above, and is called before we construct the projection.
// (Though note that we ignore the edge case where the projection initializer
// may return null.)
function hasProjection({projection} = {}) {
  if (projection == null) return false;
  if (typeof projection.stream === "function") return true;
  if (isObject(projection)) projection = projection.type;
  return projection != null;
}

// When a named projection is specified, we can use its natural aspect ratio to
// determine a good value for the projection’s height based on the desired
// width. When we don’t have a way to know, the golden ratio is our best guess.
// Due to a circular dependency (we need to know the height before we can
// construct the projection), we have to test the raw projection option rather
// than the materialized projection; therefore we must be extremely careful that
// the logic of this function exactly matches createProjection above!
function projectionAspectRatio(projection) {
  if (typeof projection?.stream === "function") return defaultAspectRatio;
  if (isObject(projection)) projection = projection.type;
  if (projection == null) return;
  if (typeof projection !== "function") {
    const {aspectRatio} = namedProjection(projection);
    if (aspectRatio) return aspectRatio;
  }
  return defaultAspectRatio;
}

// Extract the (possibly) scaled values for the x and y channels, and apply the
// projection if any.
function applyPosition(channels, scales, {projection}) {
  const {x, y} = channels;
  let position = {};
  if (x) position.x = x;
  if (y) position.y = y;
  position = valueObject(position, scales);
  if (projection && x?.scale === "x" && y?.scale === "y") project("x", "y", position, projection);
  if (x) position.x = coerceNumbers(position.x);
  if (y) position.y = coerceNumbers(position.y);
  return position;
}

function getGeometryChannels(channel) {
  const X = [];
  const Y = [];
  const x = {scale: "x", value: X};
  const y = {scale: "y", value: Y};
  const sink = {
    point(x, y) {
      X.push(x);
      Y.push(y);
    },
    lineStart() {},
    lineEnd() {},
    polygonStart() {},
    polygonEnd() {},
    sphere() {}
  };
  for (const object of channel.value) d3.geoStream(object, sink);
  return [x, y];
}

function createContext(options = {}) {
  const {document = typeof window !== "undefined" ? window.document : undefined, clip} = options;
  return {document, clip: maybeClip(clip)};
}

function create(name, {document}) {
  return d3.select(d3.creator(name).call(document.documentElement));
}

const unset = Symbol("unset");

function memoize1(compute) {
  return (compute.length === 1 ? memoize1Arg : memoize1Args)(compute);
}

function memoize1Arg(compute) {
  let cacheValue;
  let cacheKey = unset;
  return (key) => {
    if (!Object.is(cacheKey, key)) {
      cacheKey = key;
      cacheValue = compute(key);
    }
    return cacheValue;
  };
}

function memoize1Args(compute) {
  let cacheValue, cacheKeys;
  return (...keys) => {
    if (cacheKeys?.length !== keys.length || cacheKeys.some((k, i) => !Object.is(k, keys[i]))) {
      cacheKeys = keys;
      cacheValue = compute(...keys);
    }
    return cacheValue;
  };
}

const numberFormat = memoize1((locale) => {
  return new Intl.NumberFormat(locale);
});

const monthFormat = memoize1((locale, month) => {
  return new Intl.DateTimeFormat(locale, {timeZone: "UTC", ...(month && {month})});
});

const weekdayFormat = memoize1((locale, weekday) => {
  return new Intl.DateTimeFormat(locale, {timeZone: "UTC", ...(weekday && {weekday})});
});

function formatNumber(locale = "en-US") {
  const format = numberFormat(locale);
  return (i) => (i != null && !isNaN(i) ? format.format(i) : undefined);
}

function formatMonth(locale = "en-US", format = "short") {
  const fmt = monthFormat(locale, format);
  return (i) => (i != null && !isNaN((i = +new Date(Date.UTC(2000, +i)))) ? fmt.format(i) : undefined);
}

function formatWeekday(locale = "en-US", format = "short") {
  const fmt = weekdayFormat(locale, format);
  return (i) => (i != null && !isNaN((i = +new Date(Date.UTC(2001, 0, +i)))) ? fmt.format(i) : undefined);
}

function formatIsoDate(date) {
  return format(date, "Invalid Date");
}

function formatAuto(locale = "en-US") {
  const number = formatNumber(locale);
  return (v) => (v instanceof Date ? formatIsoDate : typeof v === "number" ? number : string)(v);
}

// TODO When Plot supports a top-level locale option, this should be removed
// because it lacks context to know which locale to use; formatAuto should be
// used instead whenever possible.
const formatDefault = formatAuto();

const offset = (typeof window !== "undefined" ? window.devicePixelRatio > 1 : typeof it === "undefined") ? 0 : 0.5; // prettier-ignore

let nextClipId = 0;

function getClipId() {
  return `plot-clip-${++nextClipId}`;
}

function styles(
  mark,
  {
    title,
    href,
    ariaLabel: variaLabel,
    ariaDescription,
    ariaHidden,
    target,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    strokeOpacity,
    strokeLinejoin,
    strokeLinecap,
    strokeMiterlimit,
    strokeDasharray,
    strokeDashoffset,
    opacity,
    mixBlendMode,
    imageFilter,
    paintOrder,
    pointerEvents,
    shapeRendering,
    channels
  },
  {
    ariaLabel: cariaLabel,
    fill: defaultFill = "currentColor",
    fillOpacity: defaultFillOpacity,
    stroke: defaultStroke = "none",
    strokeOpacity: defaultStrokeOpacity,
    strokeWidth: defaultStrokeWidth,
    strokeLinecap: defaultStrokeLinecap,
    strokeLinejoin: defaultStrokeLinejoin,
    strokeMiterlimit: defaultStrokeMiterlimit,
    paintOrder: defaultPaintOrder
  }
) {
  // Some marks don’t support fill (e.g., tick and rule).
  if (defaultFill === null) {
    fill = null;
    fillOpacity = null;
  }

  // Some marks don’t support stroke (e.g., image).
  if (defaultStroke === null) {
    stroke = null;
    strokeOpacity = null;
  }

  // Some marks default to fill with no stroke, while others default to stroke
  // with no fill. For example, bar and area default to fill, while dot and line
  // default to stroke. For marks that fill by default, the default fill only
  // applies if the stroke is (constant) none; if you set a stroke, then the
  // default fill becomes none. Similarly for marks that stroke by stroke, the
  // default stroke only applies if the fill is (constant) none.
  if (isNoneish(defaultFill)) {
    if (!isNoneish(defaultStroke) && (!isNoneish(fill) || channels?.fill)) defaultStroke = "none";
  } else {
    if (isNoneish(defaultStroke) && (!isNoneish(stroke) || channels?.stroke)) defaultFill = "none";
  }

  const [vfill, cfill] = maybeColorChannel(fill, defaultFill);
  const [vfillOpacity, cfillOpacity] = maybeNumberChannel(fillOpacity, defaultFillOpacity);
  const [vstroke, cstroke] = maybeColorChannel(stroke, defaultStroke);
  const [vstrokeOpacity, cstrokeOpacity] = maybeNumberChannel(strokeOpacity, defaultStrokeOpacity);
  const [vopacity, copacity] = maybeNumberChannel(opacity);

  // For styles that have no effect if there is no stroke, only apply the
  // defaults if the stroke is not the constant none. (If stroke is a channel,
  // then cstroke will be undefined, but there’s still a stroke; hence we don’t
  // use isNoneish here.)
  if (!isNone(cstroke)) {
    if (strokeWidth === undefined) strokeWidth = defaultStrokeWidth;
    if (strokeLinecap === undefined) strokeLinecap = defaultStrokeLinecap;
    if (strokeLinejoin === undefined) strokeLinejoin = defaultStrokeLinejoin;

    // The default stroke miterlimit need not be applied if the current stroke
    // is the constant round; this only has effect on miter joins.
    if (strokeMiterlimit === undefined && !isRound(strokeLinejoin)) strokeMiterlimit = defaultStrokeMiterlimit;

    // The paint order only takes effect if there is both a fill and a stroke
    // (at least if we ignore markers, which no built-in marks currently use).
    if (!isNone(cfill) && paintOrder === undefined) paintOrder = defaultPaintOrder;
  }

  const [vstrokeWidth, cstrokeWidth] = maybeNumberChannel(strokeWidth);

  // Some marks don’t support fill (e.g., tick and rule).
  if (defaultFill !== null) {
    mark.fill = impliedString(cfill, "currentColor");
    mark.fillOpacity = impliedNumber(cfillOpacity, 1);
  }

  // Some marks don’t support stroke (e.g., image).
  if (defaultStroke !== null) {
    mark.stroke = impliedString(cstroke, "none");
    mark.strokeWidth = impliedNumber(cstrokeWidth, 1);
    mark.strokeOpacity = impliedNumber(cstrokeOpacity, 1);
    mark.strokeLinejoin = impliedString(strokeLinejoin, "miter");
    mark.strokeLinecap = impliedString(strokeLinecap, "butt");
    mark.strokeMiterlimit = impliedNumber(strokeMiterlimit, 4);
    mark.strokeDasharray = impliedString(strokeDasharray, "none");
    mark.strokeDashoffset = impliedString(strokeDashoffset, "0");
  }

  mark.target = string(target);
  mark.ariaLabel = string(cariaLabel);
  mark.ariaDescription = string(ariaDescription);
  mark.ariaHidden = string(ariaHidden);
  mark.opacity = impliedNumber(copacity, 1);
  mark.mixBlendMode = impliedString(mixBlendMode, "normal");
  mark.imageFilter = impliedString(imageFilter, "none");
  mark.paintOrder = impliedString(paintOrder, "normal");
  mark.pointerEvents = impliedString(pointerEvents, "auto");
  mark.shapeRendering = impliedString(shapeRendering, "auto");

  return {
    title: {value: title, optional: true, filter: null},
    href: {value: href, optional: true, filter: null},
    ariaLabel: {value: variaLabel, optional: true, filter: null},
    fill: {value: vfill, scale: "auto", optional: true},
    fillOpacity: {value: vfillOpacity, scale: "auto", optional: true},
    stroke: {value: vstroke, scale: "auto", optional: true},
    strokeOpacity: {value: vstrokeOpacity, scale: "auto", optional: true},
    strokeWidth: {value: vstrokeWidth, optional: true},
    opacity: {value: vopacity, scale: "auto", optional: true}
  };
}

// Applies the specified titles via selection.call.
function applyTitle(selection, L) {
  if (L)
    selection
      .filter((i) => nonempty(L[i]))
      .append("title")
      .call(applyText, L);
}

// Like applyTitle, but for grouped data (lines, areas).
function applyTitleGroup(selection, L) {
  if (L)
    selection
      .filter(([i]) => nonempty(L[i]))
      .append("title")
      .call(applyTextGroup, L);
}

function applyText(selection, T) {
  if (T) selection.text((i) => formatDefault(T[i]));
}

function applyTextGroup(selection, T) {
  if (T) selection.text(([i]) => formatDefault(T[i]));
}

function applyChannelStyles(
  selection,
  {target, tip},
  {
    ariaLabel: AL,
    title: T,
    fill: F,
    fillOpacity: FO,
    stroke: S,
    strokeOpacity: SO,
    strokeWidth: SW,
    opacity: O,
    href: H
  }
) {
  if (AL) applyAttr(selection, "aria-label", (i) => AL[i]);
  if (F) applyAttr(selection, "fill", (i) => F[i]);
  if (FO) applyAttr(selection, "fill-opacity", (i) => FO[i]);
  if (S) applyAttr(selection, "stroke", (i) => S[i]);
  if (SO) applyAttr(selection, "stroke-opacity", (i) => SO[i]);
  if (SW) applyAttr(selection, "stroke-width", (i) => SW[i]);
  if (O) applyAttr(selection, "opacity", (i) => O[i]);
  if (H) applyHref(selection, (i) => H[i], target);
  if (!tip) applyTitle(selection, T);
}

function applyGroupedChannelStyles(
  selection,
  {target, tip},
  {
    ariaLabel: AL,
    title: T,
    fill: F,
    fillOpacity: FO,
    stroke: S,
    strokeOpacity: SO,
    strokeWidth: SW,
    opacity: O,
    href: H
  }
) {
  if (AL) applyAttr(selection, "aria-label", ([i]) => AL[i]);
  if (F) applyAttr(selection, "fill", ([i]) => F[i]);
  if (FO) applyAttr(selection, "fill-opacity", ([i]) => FO[i]);
  if (S) applyAttr(selection, "stroke", ([i]) => S[i]);
  if (SO) applyAttr(selection, "stroke-opacity", ([i]) => SO[i]);
  if (SW) applyAttr(selection, "stroke-width", ([i]) => SW[i]);
  if (O) applyAttr(selection, "opacity", ([i]) => O[i]);
  if (H) applyHref(selection, ([i]) => H[i], target);
  if (!tip) applyTitleGroup(selection, T);
}

function groupAesthetics(
  {
    ariaLabel: AL,
    title: T,
    fill: F,
    fillOpacity: FO,
    stroke: S,
    strokeOpacity: SO,
    strokeWidth: SW,
    opacity: O,
    href: H
  },
  {tip}
) {
  return [AL, tip ? undefined : T, F, FO, S, SO, SW, O, H].filter((c) => c !== undefined);
}

function groupZ(I, Z, z) {
  const G = d3.group(I, (i) => Z[i]);
  if (z === undefined && G.size > (1 + I.length) >> 1) {
    warn(
      `Warning: the implicit z channel has high cardinality. This may occur when the fill or stroke channel is associated with quantitative data rather than ordinal or categorical data. You can suppress this warning by setting the z option explicitly; if this data represents a single series, set z to null.`
    );
  }
  return G.values();
}

function* groupIndex(I, position, mark, channels) {
  const {z} = mark;
  const {z: Z} = channels; // group channel
  const A = groupAesthetics(channels, mark); // aesthetic channels
  const C = [...position, ...A]; // all channels

  // Group the current index by Z (if any).
  for (const G of Z ? groupZ(I, Z, z) : [I]) {
    let Ag; // the A-values (aesthetics) of the current group, if any
    let Gg; // the current group index (a subset of G, and I), if any
    out: for (const i of G) {
      // If any channel has an undefined value for this index, skip it.
      for (const c of C) {
        if (!defined(c[i])) {
          if (Gg) Gg.push(-1);
          continue out;
        }
      }

      // Otherwise, if this is a new group, record the aesthetics for this
      // group. Yield the current group and start a new one.
      if (Ag === undefined) {
        if (Gg) yield Gg;
        (Ag = A.map((c) => keyof(c[i]))), (Gg = [i]);
        continue;
      }

      // Otherwise, add the current index to the current group. Then, if any of
      // the aesthetics don’t match the current group, yield the current group
      // and start a new group of the current index.
      Gg.push(i);
      for (let j = 0; j < A.length; ++j) {
        const k = keyof(A[j][i]);
        if (k !== Ag[j]) {
          yield Gg;
          (Ag = A.map((c) => keyof(c[i]))), (Gg = [i]);
          continue out;
        }
      }
    }

    // Yield the current group, if any.
    if (Gg) yield Gg;
  }
}

// Note: may mutate selection.node!
function applyClip(selection, mark, dimensions, context) {
  let clipUrl;
  const {clip = context.clip} = mark;
  switch (clip) {
    case "frame": {
      const {width, height, marginLeft, marginRight, marginTop, marginBottom} = dimensions;
      const id = getClipId();
      clipUrl = `url(#${id})`;
      selection = create("svg:g", context)
        .call((g) =>
          g
            .append("svg:clipPath")
            .attr("id", id)
            .append("rect")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginRight - marginLeft)
            .attr("height", height - marginTop - marginBottom)
        )
        .each(function () {
          this.appendChild(selection.node());
          selection.node = () => this; // Note: mutation!
        });
      break;
    }
    case "sphere": {
      const {projection} = context;
      if (!projection) throw new Error(`the "sphere" clip option requires a projection`);
      const id = getClipId();
      clipUrl = `url(#${id})`;
      selection
        .append("clipPath")
        .attr("id", id)
        .append("path")
        .attr("d", d3.geoPath(projection)({type: "Sphere"}));
      break;
    }
  }
  // Here we’re careful to apply the ARIA attributes to the outer G element when
  // clipping is applied, and to apply the ARIA attributes before any other
  // attributes (for readability).
  applyAttr(selection, "aria-label", mark.ariaLabel);
  applyAttr(selection, "aria-description", mark.ariaDescription);
  applyAttr(selection, "aria-hidden", mark.ariaHidden);
  applyAttr(selection, "clip-path", clipUrl);
}

// Note: may mutate selection.node!
function applyIndirectStyles(selection, mark, dimensions, context) {
  applyClip(selection, mark, dimensions, context);
  applyAttr(selection, "fill", mark.fill);
  applyAttr(selection, "fill-opacity", mark.fillOpacity);
  applyAttr(selection, "stroke", mark.stroke);
  applyAttr(selection, "stroke-width", mark.strokeWidth);
  applyAttr(selection, "stroke-opacity", mark.strokeOpacity);
  applyAttr(selection, "stroke-linejoin", mark.strokeLinejoin);
  applyAttr(selection, "stroke-linecap", mark.strokeLinecap);
  applyAttr(selection, "stroke-miterlimit", mark.strokeMiterlimit);
  applyAttr(selection, "stroke-dasharray", mark.strokeDasharray);
  applyAttr(selection, "stroke-dashoffset", mark.strokeDashoffset);
  applyAttr(selection, "shape-rendering", mark.shapeRendering);
  applyAttr(selection, "filter", mark.imageFilter);
  applyAttr(selection, "paint-order", mark.paintOrder);
  const {pointerEvents = context.pointerSticky === false ? "none" : undefined} = mark;
  applyAttr(selection, "pointer-events", pointerEvents);
}

function applyDirectStyles(selection, mark) {
  applyStyle(selection, "mix-blend-mode", mark.mixBlendMode);
  applyAttr(selection, "opacity", mark.opacity);
}

function applyHref(selection, href, target) {
  selection.each(function (i) {
    const h = href(i);
    if (h != null) {
      const a = this.ownerDocument.createElementNS(d3.namespaces.svg, "a");
      a.setAttribute("fill", "inherit");
      a.setAttributeNS(d3.namespaces.xlink, "href", h);
      if (target != null) a.setAttribute("target", target);
      this.parentNode.insertBefore(a, this).appendChild(this);
    }
  });
}

function applyAttr(selection, name, value) {
  if (value != null) selection.attr(name, value);
}

function applyStyle(selection, name, value) {
  if (value != null) selection.style(name, value);
}

function applyTransform(selection, mark, {x, y}, tx = offset, ty = offset) {
  tx += mark.dx;
  ty += mark.dy;
  if (x?.bandwidth) tx += x.bandwidth() / 2;
  if (y?.bandwidth) ty += y.bandwidth() / 2;
  if (tx || ty) selection.attr("transform", `translate(${tx},${ty})`);
}

function impliedString(value, impliedValue) {
  if ((value = string(value)) !== impliedValue) return value;
}

function impliedNumber(value, impliedValue) {
  if ((value = number$1(value)) !== impliedValue) return value;
}

// https://www.w3.org/TR/CSS21/grammar.html
const validClassName =
  /^-?([_a-z]|[\240-\377]|\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])([_a-z0-9-]|[\240-\377]|\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])*$/i;

function maybeClassName(name) {
  // The default should be changed whenever the default styles are changed, so
  // as to avoid conflict when multiple versions of Plot are on the page.
  if (name === undefined) return "plot-d6a7b5";
  name = `${name}`;
  if (!validClassName.test(name)) throw new Error(`invalid class name: ${name}`);
  return name;
}

function applyInlineStyles(selection, style) {
  if (typeof style === "string") {
    selection.property("style", style);
  } else if (style != null) {
    for (const element of selection) {
      Object.assign(element.style, style);
    }
  }
}

function applyFrameAnchor({frameAnchor}, {width, height, marginTop, marginRight, marginBottom, marginLeft}) {
  return [
    /left$/.test(frameAnchor)
      ? marginLeft
      : /right$/.test(frameAnchor)
      ? width - marginRight
      : (marginLeft + width - marginRight) / 2,
    /^top/.test(frameAnchor)
      ? marginTop
      : /^bottom/.test(frameAnchor)
      ? height - marginBottom
      : (marginTop + height - marginBottom) / 2
  ];
}

class Mark {
  constructor(data, channels = {}, options = {}, defaults) {
    const {
      facet = "auto",
      facetAnchor,
      fx,
      fy,
      sort,
      dx = 0,
      dy = 0,
      margin = 0,
      marginTop = margin,
      marginRight = margin,
      marginBottom = margin,
      marginLeft = margin,
      clip = defaults?.clip,
      channels: extraChannels,
      tip,
      render
    } = options;
    this.data = data;
    this.sort = isDomainSort(sort) ? sort : null;
    this.initializer = initializer(options).initializer;
    this.transform = this.initializer ? options.transform : basic(options).transform;
    if (facet === null || facet === false) {
      this.facet = null;
    } else {
      this.facet = keyword(facet === true ? "include" : facet, "facet", ["auto", "include", "exclude", "super"]);
      this.fx = data === singleton && typeof fx === "string" ? [fx] : fx;
      this.fy = data === singleton && typeof fy === "string" ? [fy] : fy;
    }
    this.facetAnchor = maybeFacetAnchor(facetAnchor);
    channels = maybeNamed(channels);
    if (extraChannels !== undefined) channels = {...maybeChannels(extraChannels), ...channels};
    if (defaults !== undefined) channels = {...styles(this, options, defaults), ...channels};
    this.channels = Object.fromEntries(
      Object.entries(channels)
        .map(([name, channel]) => {
          if (isOptions(channel.value)) {
            // apply scale and label overrides
            const {value, label = channel.label, scale = channel.scale} = channel.value;
            channel = {...channel, label, scale, value};
          }
          if (data === singleton && typeof channel.value === "string") {
            // convert field names to singleton values for decoration marks (e.g., frame)
            const {value} = channel;
            channel = {...channel, value: [value]};
          }
          return [name, channel];
        })
        .filter(([name, {value, optional}]) => {
          if (value != null) return true;
          if (optional) return false;
          throw new Error(`missing channel value: ${name}`);
        })
    );
    this.dx = +dx;
    this.dy = +dy;
    this.marginTop = +marginTop;
    this.marginRight = +marginRight;
    this.marginBottom = +marginBottom;
    this.marginLeft = +marginLeft;
    this.clip = maybeClip(clip);
    this.tip = maybeTip(tip);
    // Super-faceting currently disallow position channels; in the future, we
    // could allow position to be specified in fx and fy in addition to (or
    // instead of) x and y.
    if (this.facet === "super") {
      if (fx || fy) throw new Error(`super-faceting cannot use fx or fy`);
      for (const name in this.channels) {
        const {scale} = channels[name];
        if (scale !== "x" && scale !== "y") continue;
        throw new Error(`super-faceting cannot use x or y`);
      }
    }
    if (render != null) {
      this.render = composeRender(render, this.render);
    }
  }
  initialize(facets, facetChannels, plotOptions) {
    let data = arrayify(this.data);
    if (facets === undefined && data != null) facets = [range(data)];
    const originalFacets = facets;
    if (this.transform != null) (({facets, data} = this.transform(data, facets, plotOptions))), (data = arrayify(data));
    if (facets !== undefined) facets.original = originalFacets; // needed to read facetChannels
    const channels = createChannels(this.channels, data);
    if (this.sort != null) channelDomain(data, facets, channels, facetChannels, this.sort); // mutates facetChannels!
    return {data, facets, channels};
  }
  filter(index, channels, values) {
    for (const name in channels) {
      const {filter = defined} = channels[name];
      if (filter !== null) {
        const value = values[name];
        index = index.filter((i) => filter(value[i]));
      }
    }
    return index;
  }
  // If there is a projection, and there are paired x and y channels associated
  // with the x and y scale respectively (and not already in screen coordinates
  // as with an initializer), then apply the projection, replacing the x and y
  // values. Note that the x and y scales themselves don’t exist if there is a
  // projection, but whether the channels are associated with scales still
  // determines whether the projection should apply; think of the projection as
  // a combination xy-scale.
  project(channels, values, context) {
    for (const cx in channels) {
      if (channels[cx].scale === "x" && /^x|x$/.test(cx)) {
        const cy = cx.replace(/^x|x$/, "y");
        if (cy in channels && channels[cy].scale === "y") {
          project(cx, cy, values, context.projection);
        }
      }
    }
  }
  scale(channels, scales, context) {
    const values = valueObject(channels, scales);
    if (context.projection) this.project(channels, values, context);
    return values;
  }
}

function marks(...marks) {
  marks.plot = Mark.prototype.plot;
  return marks;
}

function composeRender(r1, r2) {
  if (r1 == null) return r2 === null ? undefined : r2;
  if (r2 == null) return r1 === null ? undefined : r1;
  if (typeof r1 !== "function") throw new TypeError(`invalid render transform: ${r1}`);
  if (typeof r2 !== "function") throw new TypeError(`invalid render transform: ${r2}`);
  return function (i, s, v, d, c, next) {
    return r1.call(this, i, s, v, d, c, (i, s, v, d, c) => {
      return r2.call(this, i, s, v, d, c, next); // preserve this
    });
  };
}

function maybeChannels(channels) {
  return Object.fromEntries(
    Object.entries(maybeNamed(channels)).map(([name, channel]) => {
      channel = typeof channel === "string" ? {value: channel, label: name} : maybeValue(channel); // for shorthand extra channels, use name as label
      if (channel.filter === undefined && channel.scale == null) channel = {...channel, filter: null};
      return [name, channel];
    })
  );
}

function maybeTip(tip) {
  return tip === true
    ? "xy"
    : tip === false || tip == null
    ? null
    : typeof tip === "string"
    ? keyword(tip, "tip", ["x", "y", "xy"])
    : tip; // tip options object
}

function withTip(options, pointer) {
  return options?.tip === true
    ? {...options, tip: pointer}
    : isObject(options?.tip) && options.tip.pointer === undefined
    ? {...options, tip: {...options.tip, pointer}}
    : options;
}

function createDimensions(scales, marks, options = {}) {
  // Compute the default margins: the maximum of the marks’ margins. While not
  // always used, they may be needed to compute the default height of the plot.
  let marginTopDefault = 0.5 - offset,
    marginRightDefault = 0.5 + offset,
    marginBottomDefault = 0.5 + offset,
    marginLeftDefault = 0.5 - offset;

  for (const {marginTop, marginRight, marginBottom, marginLeft} of marks) {
    if (marginTop > marginTopDefault) marginTopDefault = marginTop;
    if (marginRight > marginRightDefault) marginRightDefault = marginRight;
    if (marginBottom > marginBottomDefault) marginBottomDefault = marginBottom;
    if (marginLeft > marginLeftDefault) marginLeftDefault = marginLeft;
  }

  // Compute the actual margins. The order of precedence is: the side-specific
  // margin options, then the global margin option, then the defaults.
  let {
    margin,
    marginTop = margin !== undefined ? margin : marginTopDefault,
    marginRight = margin !== undefined ? margin : marginRightDefault,
    marginBottom = margin !== undefined ? margin : marginBottomDefault,
    marginLeft = margin !== undefined ? margin : marginLeftDefault
  } = options;

  // Coerce the margin options to numbers.
  marginTop = +marginTop;
  marginRight = +marginRight;
  marginBottom = +marginBottom;
  marginLeft = +marginLeft;

  // Compute the outer dimensions of the plot. If the top and bottom margins are
  // specified explicitly, adjust the automatic height accordingly.
  let {
    width = 640,
    height = autoHeight(scales, options, {
      width,
      marginTopDefault,
      marginRightDefault,
      marginBottomDefault,
      marginLeftDefault
    }) + Math.max(0, marginTop - marginTopDefault + marginBottom - marginBottomDefault)
  } = options;

  // Coerce the width and height.
  width = +width;
  height = +height;

  const dimensions = {
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft
  };

  // Compute the facet margins.
  if (scales.fx || scales.fy) {
    let {
      margin: facetMargin,
      marginTop: facetMarginTop = facetMargin !== undefined ? facetMargin : marginTop,
      marginRight: facetMarginRight = facetMargin !== undefined ? facetMargin : marginRight,
      marginBottom: facetMarginBottom = facetMargin !== undefined ? facetMargin : marginBottom,
      marginLeft: facetMarginLeft = facetMargin !== undefined ? facetMargin : marginLeft
    } = options.facet ?? {};

    // Coerce the facet margin options to numbers.
    facetMarginTop = +facetMarginTop;
    facetMarginRight = +facetMarginRight;
    facetMarginBottom = +facetMarginBottom;
    facetMarginLeft = +facetMarginLeft;

    dimensions.facet = {
      marginTop: facetMarginTop,
      marginRight: facetMarginRight,
      marginBottom: facetMarginBottom,
      marginLeft: facetMarginLeft
    };
  }

  return dimensions;
}

function autoHeight(
  {x, y, fy, fx},
  {projection, aspectRatio},
  {width, marginTopDefault, marginRightDefault, marginBottomDefault, marginLeftDefault}
) {
  const nfy = fy ? fy.scale.domain().length : 1;

  // If a projection is specified, use its natural aspect ratio (if known).
  const ar = projectionAspectRatio(projection);
  if (ar) {
    const nfx = fx ? fx.scale.domain().length : 1;
    const far = ((1.1 * nfy - 0.1) / (1.1 * nfx - 0.1)) * ar; // 0.1 is default facet padding
    const lar = Math.max(0.1, Math.min(10, far)); // clamp the aspect ratio to a “reasonable” value
    return Math.round((width - marginLeftDefault - marginRightDefault) * lar + marginTopDefault + marginBottomDefault);
  }

  const ny = y ? (isOrdinalScale(y) ? y.scale.domain().length : Math.max(7, 17 / nfy)) : 1;

  // If a desired aspect ratio is given, compute a default height to match.
  if (aspectRatio != null) {
    aspectRatio = +aspectRatio;
    if (!(isFinite(aspectRatio) && aspectRatio > 0)) throw new Error(`invalid aspectRatio: ${aspectRatio}`);
    const ratio = aspectRatioLength("y", y) / (aspectRatioLength("x", x) * aspectRatio);
    const fxb = fx ? fx.scale.bandwidth() : 1;
    const fyb = fy ? fy.scale.bandwidth() : 1;
    const w = fxb * (width - marginLeftDefault - marginRightDefault) - x.insetLeft - x.insetRight;
    return (ratio * w + y.insetTop + y.insetBottom) / fyb + marginTopDefault + marginBottomDefault;
  }

  return !!(y || fy) * Math.max(1, Math.min(60, ny * nfy)) * 20 + !!fx * 30 + 60;
}

function aspectRatioLength(k, scale) {
  if (!scale) throw new Error(`aspectRatio requires ${k} scale`);
  const {type, domain} = scale;
  let transform;
  switch (type) {
    case "linear":
    case "utc":
    case "time":
      transform = Number;
      break;
    case "pow": {
      const exponent = scale.scale.exponent();
      transform = (x) => Math.pow(x, exponent);
      break;
    }
    case "log":
      transform = Math.log;
      break;
    case "point":
    case "band":
      return domain.length;
    default:
      throw new Error(`unsupported ${k} scale for aspectRatio: ${type}`);
  }
  const [min, max] = d3.extent(domain);
  return Math.abs(transform(max) - transform(min));
}

const states = new WeakMap();

function pointerK(kx, ky, {x, y, px, py, maxRadius = 40, channels, render, ...options} = {}) {
  maxRadius = +maxRadius;
  // When px or py is used, register an extra channel that the pointer
  // interaction can use to control which point is focused; this allows pointing
  // to function independently of where the downstream mark (e.g., a tip) is
  // displayed. Also default x or y to null to disable maybeTuple etc.
  if (px != null) (x ??= null), (channels = {...channels, px: {value: px, scale: "x"}});
  if (py != null) (y ??= null), (channels = {...channels, py: {value: py, scale: "y"}});
  return {
    x,
    y,
    channels,
    ...options,
    // Unlike other composed transforms, the render transform must be the
    // outermost render function because it will re-render dynamically in
    // response to pointer events.
    render: composeRender(function (index, scales, values, dimensions, context, next) {
      context = {...context, pointerSticky: false};
      const svg = context.ownerSVGElement;
      const {data} = context.getMarkState(this);

      // Isolate state per-pointer, per-plot; if the pointer is reused by
      // multiple marks, they will share the same state (e.g., sticky modality).
      let state = states.get(svg);
      if (!state) states.set(svg, (state = {sticky: false, roots: [], renders: []}));

      // This serves as a unique identifier of the rendered mark per-plot; it is
      // used to record the currently-rendered elements (state.roots) so that we
      // can tell when a rendered element is clicked on.
      let renderIndex = state.renders.push(render) - 1;

      // For faceting, we want to compute the local coordinates of each point,
      // which means subtracting out the facet translation, if any. (It’s
      // tempting to do this using the local coordinates in SVG, but that’s
      // complicated by mark-specific transforms such as dx and dy.) Also, since
      // band scales return the upper bound of the band, we have to offset by
      // half the bandwidth.
      const {x, y, fx, fy} = scales;
      let tx = fx ? fx(index.fx) - dimensions.marginLeft : 0;
      let ty = fy ? fy(index.fy) - dimensions.marginTop : 0;
      if (x?.bandwidth) tx += x.bandwidth() / 2;
      if (y?.bandwidth) ty += y.bandwidth() / 2;

      // For faceting, we also need to record the closest point per facet per
      // mark (!), since each facet has its own pointer event listeners; we only
      // want the closest point across facets to be visible.
      const faceted = index.fi != null;
      let facetState;
      if (faceted) {
        let facetStates = state.facetStates;
        if (!facetStates) state.facetStates = facetStates = new Map();
        facetState = facetStates.get(this);
        if (!facetState) facetStates.set(this, (facetState = new Map()));
      }

      // The order of precedence for the pointer position is: px & py; the
      // middle of x1 & y1 and x2 & y2; or x1 & y1 (e.g., area); or lastly x &
      // y. If a dimension is unspecified, the frame anchor is used.
      const [cx, cy] = applyFrameAnchor(this, dimensions);
      const {px: PX, py: PY} = values;
      const px = PX ? (i) => PX[i] : anchorX$1(values, cx);
      const py = PY ? (i) => PY[i] : anchorY$1(values, cy);

      let i; // currently focused index
      let g; // currently rendered mark
      let s; // currently rendered stickiness
      let f; // current animation frame

      // When faceting, if more than one pointer would be visible, only show
      // this one if it is the closest. We defer rendering using an animation
      // frame to allow all pointer events to be received before deciding which
      // mark to render; although when hiding, we render immediately.
      function update(ii, ri) {
        if (faceted) {
          if (f) f = cancelAnimationFrame(f);
          if (ii == null) facetState.delete(index.fi);
          else {
            facetState.set(index.fi, ri);
            f = requestAnimationFrame(() => {
              f = null;
              for (const [fi, r] of facetState) {
                if (r < ri || (r === ri && fi < index.fi)) {
                  ii = null;
                  break;
                }
              }
              render(ii);
            });
            return;
          }
        }
        render(ii);
      }

      function render(ii) {
        if (i === ii && s === state.sticky) return; // the tooltip hasn’t moved
        i = ii;
        s = context.pointerSticky = state.sticky;
        const I = i == null ? [] : [i];
        if (faceted) (I.fx = index.fx), (I.fy = index.fy), (I.fi = index.fi);
        const r = next(I, scales, values, dimensions, context);
        if (g) {
          // When faceting, preserve swapped mark and facet transforms; also
          // remove ARIA attributes since these are promoted to the parent. This
          // is perhaps brittle in that it depends on how Plot renders facets,
          // but it produces a cleaner and more accessible SVG structure.
          if (faceted) {
            const p = g.parentNode;
            const ft = g.getAttribute("transform");
            const mt = r.getAttribute("transform");
            ft ? r.setAttribute("transform", ft) : r.removeAttribute("transform");
            mt ? p.setAttribute("transform", mt) : p.removeAttribute("transform");
            r.removeAttribute("aria-label");
            r.removeAttribute("aria-description");
            r.removeAttribute("aria-hidden");
          }
          g.replaceWith(r);
        }
        state.roots[renderIndex] = g = r;

        // Dispatch the value. When simultaneously exiting this facet and
        // entering a new one, prioritize the entering facet.
        if (!(i == null && facetState?.size > 1)) context.dispatchValue(i == null ? null : data[i]);
        return r;
      }

      // Select the closest point to the mouse in the current facet; for
      // pointerX or pointerY, the orthogonal component of the distance is
      // squashed, selecting primarily on the dominant dimension. Across facets,
      // use unsquashed distance to determine the winner.
      function pointermove(event) {
        if (state.sticky || (event.pointerType === "mouse" && event.buttons === 1)) return; // dragging
        let [xp, yp] = d3.pointer(event);
        (xp -= tx), (yp -= ty); // correct for facets and band scales
        const kpx = xp < dimensions.marginLeft || xp > dimensions.width - dimensions.marginRight ? 1 : kx;
        const kpy = yp < dimensions.marginTop || yp > dimensions.height - dimensions.marginBottom ? 1 : ky;
        let ii = null;
        let ri = maxRadius * maxRadius;
        for (const j of index) {
          const dx = kpx * (px(j) - xp);
          const dy = kpy * (py(j) - yp);
          const rj = dx * dx + dy * dy;
          if (rj <= ri) (ii = j), (ri = rj);
        }
        if (ii != null && (kx !== 1 || ky !== 1)) {
          const dx = px(ii) - xp;
          const dy = py(ii) - yp;
          ri = dx * dx + dy * dy;
        }
        update(ii, ri);
      }

      function pointerdown(event) {
        if (event.pointerType !== "mouse") return;
        if (i == null) return; // not pointing
        if (state.sticky && state.roots.some((r) => r?.contains(event.target))) return; // stay sticky
        if (state.sticky) (state.sticky = false), state.renders.forEach((r) => r(null)); // clear all pointers
        else (state.sticky = true), render(i);
        event.stopImmediatePropagation(); // suppress other pointers
      }

      function pointerleave(event) {
        if (event.pointerType !== "mouse") return;
        if (!state.sticky) update(null);
      }

      // We listen to the svg element; listening to the window instead would let
      // us receive pointer events from farther away, but would also make it
      // hard to know when to remove the listeners. (Using a mutation observer
      // to watch the entire document is likely too expensive.)
      svg.addEventListener("pointerenter", pointermove);
      svg.addEventListener("pointermove", pointermove);
      svg.addEventListener("pointerdown", pointerdown);
      svg.addEventListener("pointerleave", pointerleave);

      return render(null);
    }, render)
  };
}

function pointer(options) {
  return pointerK(1, 1, options);
}

function pointerX(options) {
  return pointerK(1, 0.01, options);
}

function pointerY(options) {
  return pointerK(0.01, 1, options);
}

function anchorX$1({x1: X1, x2: X2, x: X = X1}, cx) {
  return X1 && X2 ? (i) => (X1[i] + X2[i]) / 2 : X ? (i) => X[i] : () => cx;
}

function anchorY$1({y1: Y1, y2: Y2, y: Y = Y1}, cy) {
  return Y1 && Y2 ? (i) => (Y1[i] + Y2[i]) / 2 : Y ? (i) => Y[i] : () => cy;
}

function inferFontVariant$2(scale) {
  return isOrdinalScale(scale) && scale.interval === undefined ? undefined : "tabular-nums";
}

function legendRamp(color, options) {
  let {
    label = color.label,
    tickSize = 6,
    width = 240,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    style,
    ticks = (width - marginLeft - marginRight) / 64,
    tickFormat,
    fontVariant = inferFontVariant$2(color),
    round = true,
    opacity,
    className
  } = options;
  const context = createContext(options);
  className = maybeClassName(className);
  opacity = maybeNumberChannel(opacity)[1];
  if (tickFormat === null) tickFormat = () => null;

  const svg = create("svg", context)
    .attr("class", `${className}-ramp`)
    .attr("font-family", "system-ui, sans-serif")
    .attr("font-size", 10)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .call((svg) =>
      // Warning: if you edit this, change defaultClassName.
      svg.append("style").text(
        `:where(.${className}-ramp) {
  display: block;
  height: auto;
  height: intrinsic;
  max-width: 100%;
  overflow: visible;
}
:where(.${className}-ramp text) {
  white-space: pre;
}`
      )
    )
    .call(applyInlineStyles, style);

  let tickAdjust = (g) => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);

  let x;

  // Some D3 scales use scale.interpolate, some scale.interpolator, and some
  // scale.round; this normalizes the API so it works with all scale types.
  const applyRange = round ? (x, range) => x.rangeRound(range) : (x, range) => x.range(range);

  const {type, domain, range, interpolate, scale, pivot} = color;

  // Continuous
  if (interpolate) {
    // Often interpolate is a “fixed” interpolator on the [0, 1] interval, as
    // with a built-in color scheme, but sometimes it is a function that takes
    // two arguments and is used in conjunction with the range.
    const interpolator =
      range === undefined
        ? interpolate
        : d3.piecewise(interpolate.length === 1 ? interpolatePiecewise(interpolate) : interpolate, range);

    // Construct a D3 scale of the same type, but with a range that evenly
    // divides the horizontal extent of the legend. (In the common case, the
    // domain.length is two, and so the range is simply the extent.) For a
    // diverging scale, we need an extra point in the range for the pivot such
    // that the pivot is always drawn in the middle.
    x = applyRange(
      scale.copy(),
      d3.quantize(
        d3.interpolateNumber(marginLeft, width - marginRight),
        Math.min(domain.length + (pivot !== undefined), range === undefined ? Infinity : range.length)
      )
    );

    // Construct a 256×1 canvas, filling each pixel using the interpolator.
    const n = 256;
    const canvas = context.document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context2 = canvas.getContext("2d");
    for (let i = 0, j = n - 1; i < n; ++i) {
      context2.fillStyle = interpolator(i / j);
      context2.fillRect(i, 0, 1, 1);
    }

    svg
      .append("image")
      .attr("opacity", opacity)
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", canvas.toDataURL());
  }

  // Threshold
  else if (type === "threshold") {
    const thresholds = domain;

    const thresholdFormat =
      tickFormat === undefined ? (d) => d : typeof tickFormat === "string" ? d3.format(tickFormat) : tickFormat;

    // Construct a linear scale with evenly-spaced ticks for each of the
    // thresholds; the domain extends one beyond the threshold extent.
    x = applyRange(d3.scaleLinear().domain([-1, range.length - 1]), [marginLeft, width - marginRight]);

    svg
      .append("g")
      .attr("fill-opacity", opacity)
      .selectAll()
      .data(range)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", (d) => d);

    ticks = map$1(thresholds, (_, i) => i);
    tickFormat = (i) => thresholdFormat(thresholds[i], i);
  }

  // Ordinal (hopefully!)
  else {
    x = applyRange(d3.scaleBand().domain(domain), [marginLeft, width - marginRight]);

    svg
      .append("g")
      .attr("fill-opacity", opacity)
      .selectAll()
      .data(domain)
      .enter()
      .append("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", scale);

    tickAdjust = () => {};
  }

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3.axisBottom(x)
        .ticks(Array.isArray(ticks) ? null : ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(Array.isArray(ticks) ? ticks : null)
    )
    .attr("font-size", null)
    .attr("font-family", null)
    .attr("font-variant", impliedString(fontVariant, "normal"))
    .call(tickAdjust)
    .call((g) => g.select(".domain").remove());

  if (label !== undefined) {
    svg
      .append("text")
      .attr("x", marginLeft)
      .attr("y", marginTop - 6)
      .attr("fill", "currentColor") // TODO move to stylesheet?
      .attr("font-weight", "bold")
      .text(label);
  }

  return svg.node();
}

const radians = Math.PI / 180;

function markers(mark, {marker, markerStart = marker, markerMid = marker, markerEnd = marker} = {}) {
  mark.markerStart = maybeMarker(markerStart);
  mark.markerMid = maybeMarker(markerMid);
  mark.markerEnd = maybeMarker(markerEnd);
}

function maybeMarker(marker) {
  if (marker == null || marker === false) return null;
  if (marker === true) return markerCircleFill;
  if (typeof marker === "function") return marker;
  switch (`${marker}`.toLowerCase()) {
    case "none":
      return null;
    case "arrow":
      return markerArrow("auto");
    case "arrow-reverse":
      return markerArrow("auto-start-reverse");
    case "dot":
      return markerDot;
    case "circle":
    case "circle-fill":
      return markerCircleFill;
    case "circle-stroke":
      return markerCircleStroke;
    case "tick":
      return markerTick("auto");
    case "tick-x":
      return markerTick(90);
    case "tick-y":
      return markerTick(0);
  }
  throw new Error(`invalid marker: ${marker}`);
}

function markerArrow(orient) {
  return (color, context) =>
    create("svg:marker", context)
      .attr("viewBox", "-5 -5 10 10")
      .attr("markerWidth", 6.67)
      .attr("markerHeight", 6.67)
      .attr("orient", orient)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .call((marker) => marker.append("path").attr("d", "M-1.5,-3l3,3l-3,3"))
      .node();
}

function markerDot(color, context) {
  return create("svg:marker", context)
    .attr("viewBox", "-5 -5 10 10")
    .attr("markerWidth", 6.67)
    .attr("markerHeight", 6.67)
    .attr("fill", color)
    .attr("stroke", "none")
    .call((marker) => marker.append("circle").attr("r", 2.5))
    .node();
}

function markerCircleFill(color, context) {
  return create("svg:marker", context)
    .attr("viewBox", "-5 -5 10 10")
    .attr("markerWidth", 6.67)
    .attr("markerHeight", 6.67)
    .attr("fill", color)
    .attr("stroke", "var(--plot-background)")
    .attr("stroke-width", 1.5)
    .call((marker) => marker.append("circle").attr("r", 3))
    .node();
}

function markerCircleStroke(color, context) {
  return create("svg:marker", context)
    .attr("viewBox", "-5 -5 10 10")
    .attr("markerWidth", 6.67)
    .attr("markerHeight", 6.67)
    .attr("fill", "var(--plot-background)")
    .attr("stroke", color)
    .attr("stroke-width", 1.5)
    .call((marker) => marker.append("circle").attr("r", 3))
    .node();
}

function markerTick(orient) {
  return (color, context) =>
    create("svg:marker", context)
      .attr("viewBox", "-3 -3 6 6")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", orient)
      .attr("stroke", color)
      .call((marker) => marker.append("path").attr("d", "M0,-3v6"))
      .node();
}

let nextMarkerId = 0;

function applyMarkers(path, mark, {stroke: S}, context) {
  return applyMarkersColor(path, mark, S && ((i) => S[i]), context);
}

function applyGroupedMarkers(path, mark, {stroke: S}, context) {
  return applyMarkersColor(path, mark, S && (([i]) => S[i]), context);
}

function applyMarkersColor(path, {markerStart, markerMid, markerEnd, stroke}, strokeof = () => stroke, context) {
  const iriByMarkerColor = new Map();

  function applyMarker(marker) {
    return function (i) {
      const color = strokeof(i);
      let iriByColor = iriByMarkerColor.get(marker);
      if (!iriByColor) iriByMarkerColor.set(marker, (iriByColor = new Map()));
      let iri = iriByColor.get(color);
      if (!iri) {
        const node = this.parentNode.insertBefore(marker(color, context), this);
        const id = `plot-marker-${++nextMarkerId}`;
        node.setAttribute("id", id);
        iriByColor.set(color, (iri = `url(#${id})`));
      }
      return iri;
    };
  }

  if (markerStart) path.attr("marker-start", applyMarker(markerStart));
  if (markerMid) path.attr("marker-mid", applyMarker(markerMid));
  if (markerEnd) path.attr("marker-end", applyMarker(markerEnd));
}

function maybeInsetX({inset, insetLeft, insetRight, ...options} = {}) {
  [insetLeft, insetRight] = maybeInset(inset, insetLeft, insetRight);
  return {inset, insetLeft, insetRight, ...options};
}

function maybeInsetY({inset, insetTop, insetBottom, ...options} = {}) {
  [insetTop, insetBottom] = maybeInset(inset, insetTop, insetBottom);
  return {inset, insetTop, insetBottom, ...options};
}

function maybeInset(inset, inset1, inset2) {
  return inset === undefined && inset1 === undefined && inset2 === undefined
    ? offset
      ? [1, 0]
      : [0.5, 0.5]
    : [inset1, inset2];
}

// The interval may be specified either as x: {value, interval} or as {x,
// interval}. The former can be used to specify separate intervals for x and y,
// for example with Plot.rect.
function maybeIntervalValue(value, {interval}) {
  value = {...maybeValue(value)};
  value.interval = maybeInterval(value.interval === undefined ? interval : value.interval);
  return value;
}

function maybeIntervalK(k, maybeInsetK, options, trivial) {
  const {[k]: v, [`${k}1`]: v1, [`${k}2`]: v2} = options;
  const {value, interval} = maybeIntervalValue(v, options);
  if (value == null || (interval == null && !trivial)) return options;
  const label = labelof(v);
  if (interval == null) {
    let V;
    const kv = {transform: (data) => V || (V = valueof(data, value)), label};
    return {
      ...options,
      [k]: undefined,
      [`${k}1`]: v1 === undefined ? kv : v1,
      [`${k}2`]: v2 === undefined && !(v1 === v2 && trivial) ? kv : v2
    };
  }
  let D1, V1;
  function transform(data) {
    if (V1 !== undefined && data === D1) return V1; // memoize
    return (V1 = map$1(valueof((D1 = data), value), (v) => interval.floor(v)));
  }
  return maybeInsetK({
    ...options,
    [k]: undefined,
    [`${k}1`]: v1 === undefined ? {transform, label} : v1,
    [`${k}2`]: v2 === undefined ? {transform: (data) => transform(data).map((v) => interval.offset(v)), label} : v2
  });
}

function maybeIntervalMidK(k, maybeInsetK, options) {
  const {[k]: v} = options;
  const {value, interval} = maybeIntervalValue(v, options);
  if (value == null || interval == null) return options;
  return maybeInsetK({
    ...options,
    [k]: {
      label: labelof(v),
      transform: (data) => {
        const V1 = map$1(valueof(data, value), (v) => interval.floor(v));
        const V2 = V1.map((v) => interval.offset(v));
        return V1.map(
          isTemporal(V1)
            ? (v1, v2) =>
                v1 == null || isNaN((v1 = +v1)) || ((v2 = V2[v2]), v2 == null) || isNaN((v2 = +v2))
                  ? undefined
                  : new Date((v1 + v2) / 2)
            : (v1, v2) => (v1 == null || ((v2 = V2[v2]), v2 == null) ? NaN : (+v1 + +v2) / 2)
        );
      }
    }
  });
}

function maybeTrivialIntervalX(options = {}) {
  return maybeIntervalK("x", maybeInsetX, options, true);
}

function maybeTrivialIntervalY(options = {}) {
  return maybeIntervalK("y", maybeInsetY, options, true);
}

function maybeIntervalX(options = {}) {
  return maybeIntervalK("x", maybeInsetX, options);
}

function maybeIntervalY(options = {}) {
  return maybeIntervalK("y", maybeInsetY, options);
}

function maybeIntervalMidX(options = {}) {
  return maybeIntervalMidK("x", maybeInsetX, options);
}

function maybeIntervalMidY(options = {}) {
  return maybeIntervalMidK("y", maybeInsetY, options);
}

const defaults$l = {
  ariaLabel: "rule",
  fill: null,
  stroke: "currentColor"
};

class RuleX extends Mark {
  constructor(data, options = {}) {
    const {x, y1, y2, inset = 0, insetTop = inset, insetBottom = inset} = options;
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y1: {value: y1, scale: "y", optional: true},
        y2: {value: y2, scale: "y", optional: true}
      },
      withTip(options, "x"),
      defaults$l
    );
    this.insetTop = number$1(insetTop);
    this.insetBottom = number$1(insetBottom);
    markers(this, options);
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y1: Y1, y2: Y2} = channels;
    const {width, height, marginTop, marginRight, marginLeft, marginBottom} = dimensions;
    const {insetTop, insetBottom} = this;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x}, offset, 0)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("line")
          .call(applyDirectStyles, this)
          .attr("x1", X ? (i) => X[i] : (marginLeft + width - marginRight) / 2)
          .attr("x2", X ? (i) => X[i] : (marginLeft + width - marginRight) / 2)
          .attr("y1", Y1 && !isCollapsed(y) ? (i) => Y1[i] + insetTop : marginTop + insetTop)
          .attr(
            "y2",
            Y2 && !isCollapsed(y)
              ? y.bandwidth
                ? (i) => Y2[i] + y.bandwidth() - insetBottom
                : (i) => Y2[i] - insetBottom
              : height - marginBottom - insetBottom
          )
          .call(applyChannelStyles, this, channels)
          .call(applyMarkers, this, channels, context)
      )
      .node();
  }
}

class RuleY extends Mark {
  constructor(data, options = {}) {
    const {x1, x2, y, inset = 0, insetRight = inset, insetLeft = inset} = options;
    super(
      data,
      {
        y: {value: y, scale: "y", optional: true},
        x1: {value: x1, scale: "x", optional: true},
        x2: {value: x2, scale: "x", optional: true}
      },
      withTip(options, "y"),
      defaults$l
    );
    this.insetRight = number$1(insetRight);
    this.insetLeft = number$1(insetLeft);
    markers(this, options);
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {y: Y, x1: X1, x2: X2} = channels;
    const {width, height, marginTop, marginRight, marginLeft, marginBottom} = dimensions;
    const {insetLeft, insetRight} = this;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {y: Y && y}, 0, offset)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("line")
          .call(applyDirectStyles, this)
          .attr("x1", X1 && !isCollapsed(x) ? (i) => X1[i] + insetLeft : marginLeft + insetLeft)
          .attr(
            "x2",
            X2 && !isCollapsed(x)
              ? x.bandwidth
                ? (i) => X2[i] + x.bandwidth() - insetRight
                : (i) => X2[i] - insetRight
              : width - marginRight - insetRight
          )
          .attr("y1", Y ? (i) => Y[i] : (marginTop + height - marginBottom) / 2)
          .attr("y2", Y ? (i) => Y[i] : (marginTop + height - marginBottom) / 2)
          .call(applyChannelStyles, this, channels)
          .call(applyMarkers, this, channels, context)
      )
      .node();
  }
}

function ruleX(data, options) {
  let {x = identity$1, y, y1, y2, ...rest} = maybeIntervalY(options);
  [y1, y2] = maybeOptionalZero(y, y1, y2);
  return new RuleX(data, {...rest, x, y1, y2});
}

function ruleY(data, options) {
  let {y = identity$1, x, x1, x2, ...rest} = maybeIntervalX(options);
  [x1, x2] = maybeOptionalZero(x, x1, x2);
  return new RuleY(data, {...rest, y, x1, x2});
}

// For marks specified either as [0, x] or [x1, x2], or nothing.
function maybeOptionalZero(x, x1, x2) {
  if (x == null) {
    if (x1 === undefined) {
      if (x2 !== undefined) return [0, x2];
    } else {
      if (x2 === undefined) return [0, x1];
    }
  } else if (x1 === undefined) {
    return x2 === undefined ? [0, x] : [x, x2];
  } else if (x2 === undefined) {
    return [x, x1];
  }
  return [x1, x2];
}

function template(strings, ...parts) {
  let n = parts.length;

  // If any of the interpolated parameters are strings rather than functions,
  // bake them into the template to optimize performance during render.
  for (let j = 0, copy = true; j < n; ++j) {
    if (typeof parts[j] !== "function") {
      if (copy) {
        strings = strings.slice(); // copy before mutate
        copy = false;
      }
      strings.splice(j, 2, strings[j] + parts[j] + strings[j + 1]);
      parts.splice(j, 1);
      --j, --n;
    }
  }

  return (i) => {
    let s = strings[0];
    for (let j = 0; j < n; ++j) {
      s += parts[j](i) + strings[j + 1];
    }
    return s;
  };
}

const defaults$k = {
  ariaLabel: "text",
  strokeLinejoin: "round",
  strokeWidth: 3,
  paintOrder: "stroke"
};

const softHyphen = "\u00ad";

class Text extends Mark {
  constructor(data, options = {}) {
    const {
      x,
      y,
      text = isIterable(data) && isTextual(data) ? identity$1 : indexOf,
      frameAnchor,
      textAnchor = /right$/i.test(frameAnchor) ? "end" : /left$/i.test(frameAnchor) ? "start" : "middle",
      lineAnchor = /^top/i.test(frameAnchor) ? "top" : /^bottom/i.test(frameAnchor) ? "bottom" : "middle",
      lineHeight = 1,
      lineWidth = Infinity,
      textOverflow,
      monospace,
      fontFamily = monospace ? "ui-monospace, monospace" : undefined,
      fontSize,
      fontStyle,
      fontVariant,
      fontWeight,
      rotate
    } = options;
    const [vrotate, crotate] = maybeNumberChannel(rotate, 0);
    const [vfontSize, cfontSize] = maybeFontSizeChannel(fontSize);
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        fontSize: {value: vfontSize, optional: true},
        rotate: {value: numberChannel(vrotate), optional: true},
        text: {value: text, filter: nonempty, optional: true}
      },
      options,
      defaults$k
    );
    this.rotate = crotate;
    this.textAnchor = impliedString(textAnchor, "middle");
    this.lineAnchor = keyword(lineAnchor, "lineAnchor", ["top", "middle", "bottom"]);
    this.lineHeight = +lineHeight;
    this.lineWidth = +lineWidth;
    this.textOverflow = maybeTextOverflow(textOverflow);
    this.monospace = !!monospace;
    this.fontFamily = string(fontFamily);
    this.fontSize = cfontSize;
    this.fontStyle = string(fontStyle);
    this.fontVariant = string(fontVariant);
    this.fontWeight = string(fontWeight);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    if (!(this.lineWidth >= 0)) throw new Error(`invalid lineWidth: ${lineWidth}`);
    this.splitLines = splitter(this);
    this.clipLine = clipper(this);
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, rotate: R, text: T, title: TL, fontSize: FS} = channels;
    const {rotate} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyIndirectTextStyles, this, T, dimensions)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("text")
          .call(applyDirectStyles, this)
          .call(applyMultilineText, this, T, TL)
          .attr(
            "transform",
            template`translate(${X ? (i) => X[i] : cx},${Y ? (i) => Y[i] : cy})${
              R ? (i) => ` rotate(${R[i]})` : rotate ? ` rotate(${rotate})` : ``
            }`
          )
          .call(applyAttr, "font-size", FS && ((i) => FS[i]))
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
}

function maybeTextOverflow(textOverflow) {
  return textOverflow == null
    ? null
    : keyword(textOverflow, "textOverflow", [
        "clip", // shorthand for clip-end
        "ellipsis", // … ellipsis-end
        "clip-start",
        "clip-end",
        "ellipsis-start",
        "ellipsis-middle",
        "ellipsis-end"
      ]).replace(/^(clip|ellipsis)$/, "$1-end");
}

function applyMultilineText(selection, mark, T, TL) {
  if (!T) return;
  const {lineAnchor, lineHeight, textOverflow, splitLines, clipLine} = mark;
  selection.each(function (i) {
    const lines = splitLines(formatDefault(T[i]) ?? "").map(clipLine);
    const n = lines.length;
    const y = lineAnchor === "top" ? 0.71 : lineAnchor === "bottom" ? 1 - n : (164 - n * 100) / 200;
    if (n > 1) {
      let m = 0;
      for (let i = 0; i < n; ++i) {
        ++m;
        if (!lines[i]) continue;
        const tspan = this.ownerDocument.createElementNS(d3.namespaces.svg, "tspan");
        tspan.setAttribute("x", 0);
        if (i === m - 1) tspan.setAttribute("y", `${(y + i) * lineHeight}em`);
        else tspan.setAttribute("dy", `${m * lineHeight}em`);
        tspan.textContent = lines[i];
        this.appendChild(tspan);
        m = 0;
      }
    } else {
      if (y) this.setAttribute("y", `${y * lineHeight}em`);
      this.textContent = lines[0];
    }
    if (textOverflow && !TL && lines[0] !== T[i]) {
      const title = this.ownerDocument.createElementNS(d3.namespaces.svg, "title");
      title.textContent = T[i];
      this.appendChild(title);
    }
  });
}

function text(data, {x, y, ...options} = {}) {
  if (options.frameAnchor === undefined) [x, y] = maybeTuple(x, y);
  return new Text(data, {...options, x, y});
}

function textX(data, {x = identity$1, ...options} = {}) {
  return new Text(data, maybeIntervalMidY({...options, x}));
}

function textY(data, {y = identity$1, ...options} = {}) {
  return new Text(data, maybeIntervalMidX({...options, y}));
}

function applyIndirectTextStyles(selection, mark, T) {
  applyAttr(selection, "text-anchor", mark.textAnchor);
  applyAttr(selection, "font-family", mark.fontFamily);
  applyAttr(selection, "font-size", mark.fontSize);
  applyAttr(selection, "font-style", mark.fontStyle);
  applyAttr(selection, "font-variant", mark.fontVariant === undefined ? inferFontVariant$1(T) : mark.fontVariant);
  applyAttr(selection, "font-weight", mark.fontWeight);
}

function inferFontVariant$1(T) {
  return T && (isNumeric(T) || isTemporal(T)) ? "tabular-nums" : undefined;
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-size
const fontSizes = new Set([
  // global keywords
  "inherit",
  "initial",
  "revert",
  "unset",
  // absolute keywords
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
  // relative keywords
  "larger",
  "smaller"
]);

// The font size may be expressed as a constant in the following forms:
// - number in pixels
// - string keyword: see above
// - string <length>: e.g., "12px"
// - string <percentage>: e.g., "80%"
// Anything else is assumed to be a channel definition.
function maybeFontSizeChannel(fontSize) {
  if (fontSize == null || typeof fontSize === "number") return [undefined, fontSize];
  if (typeof fontSize !== "string") return [fontSize, undefined];
  fontSize = fontSize.trim().toLowerCase();
  return fontSizes.has(fontSize) || /^[+-]?\d*\.?\d+(e[+-]?\d+)?(\w*|%)$/.test(fontSize)
    ? [undefined, fontSize]
    : [fontSize, undefined];
}

// This is a greedy algorithm for line wrapping. It would be better to use the
// Knuth–Plass line breaking algorithm (but that would be much more complex).
// https://en.wikipedia.org/wiki/Line_wrap_and_word_wrap
function lineWrap(input, maxWidth, widthof) {
  const lines = [];
  let lineStart,
    lineEnd = 0;
  for (const [wordStart, wordEnd, required] of lineBreaks(input)) {
    // Record the start of a line. This isn’t the same as the previous line’s
    // end because we often skip spaces between lines.
    if (lineStart === undefined) lineStart = wordStart;

    // If the current line is not empty, and if adding the current word would
    // make the line longer than the allowed width, then break the line at the
    // previous word end.
    if (lineEnd > lineStart && widthof(input, lineStart, wordEnd) > maxWidth) {
      lines.push(input.slice(lineStart, lineEnd) + (input[lineEnd - 1] === softHyphen ? "-" : ""));
      lineStart = wordStart;
    }

    // If this is a required break (a newline), emit the line and reset.
    if (required) {
      lines.push(input.slice(lineStart, wordEnd));
      lineStart = undefined;
      continue;
    }

    // Extend the current line to include the new word.
    lineEnd = wordEnd;
  }
  return lines;
}

// This is a rudimentary (and U.S.-centric) algorithm for finding opportunities
// to break lines between words. A better and far more comprehensive approach
// would be to use the official Unicode Line Breaking Algorithm.
// https://unicode.org/reports/tr14/
function* lineBreaks(input) {
  let i = 0,
    j = 0;
  const n = input.length;
  while (j < n) {
    let k = 1;
    switch (input[j]) {
      case softHyphen:
      case "-": // hyphen
        ++j;
        yield [i, j, false];
        i = j;
        break;
      case " ":
        yield [i, j, false];
        while (input[++j] === " "); // skip multiple spaces
        i = j;
        break;
      case "\r":
        if (input[j + 1] === "\n") ++k; // falls through
      case "\n":
        yield [i, j, true];
        j += k;
        i = j;
        break;
      default:
        ++j;
        break;
    }
  }
  yield [i, j, true];
}

// Computed as round(measureText(text).width * 10) at 10px system-ui. For
// characters that are not represented in this map, we’d ideally want to use a
// weighted average of what we expect to see. But since we don’t really know
// what that is, using “e” seems reasonable.
const defaultWidthMap = {
  a: 56,
  b: 63,
  c: 57,
  d: 63,
  e: 58,
  f: 37,
  g: 62,
  h: 60,
  i: 26,
  j: 26,
  k: 55,
  l: 26,
  m: 88,
  n: 60,
  o: 60,
  p: 62,
  q: 62,
  r: 39,
  s: 54,
  t: 38,
  u: 60,
  v: 55,
  w: 79,
  x: 54,
  y: 55,
  z: 55,
  A: 69,
  B: 67,
  C: 73,
  D: 74,
  E: 61,
  F: 58,
  G: 76,
  H: 75,
  I: 28,
  J: 55,
  K: 67,
  L: 58,
  M: 89,
  N: 75,
  O: 78,
  P: 65,
  Q: 78,
  R: 67,
  S: 65,
  T: 65,
  U: 75,
  V: 69,
  W: 98,
  X: 69,
  Y: 67,
  Z: 67,
  0: 64,
  1: 48,
  2: 62,
  3: 64,
  4: 66,
  5: 63,
  6: 65,
  7: 58,
  8: 65,
  9: 65,
  " ": 29,
  "!": 32,
  '"': 49,
  "'": 31,
  "(": 39,
  ")": 39,
  ",": 31,
  "-": 48,
  ".": 31,
  "/": 32,
  ":": 31,
  ";": 31,
  "?": 52,
  "‘": 31,
  "’": 31,
  "“": 47,
  "”": 47,
  "…": 82
};

// This is a rudimentary (and U.S.-centric) algorithm for measuring the width of
// a string based on a technique of Gregor Aisch; it assumes that individual
// characters are laid out independently and does not implement the Unicode
// grapheme cluster breaking algorithm. It does understand code points, though,
// and so treats things like emoji as having the width of a lowercase e (and
// should be equivalent to using for-of to iterate over code points, while also
// being fast). TODO Optimize this by noting that we often re-measure characters
// that were previously measured?
// http://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries
// https://exploringjs.com/impatient-js/ch_strings.html#atoms-of-text
function defaultWidth(text, start = 0, end = text.length) {
  let sum = 0;
  for (let i = start; i < end; i = readCharacter(text, i)) {
    sum += defaultWidthMap[text[i]] ?? (isPictographic(text, i) ? 120 : defaultWidthMap.e);
  }
  return sum;
}

// Even for monospaced text, we can’t assume that the number of UTF-16 code
// points (i.e., the length of a string) corresponds to the number of visible
// characters; we still have to count graphemes. And note that pictographic
// characters such as emojis are typically not monospaced!
function monospaceWidth(text, start = 0, end = text.length) {
  let sum = 0;
  for (let i = start; i < end; i = readCharacter(text, i)) {
    sum += isPictographic(text, i) ? 126 : 63;
  }
  return sum;
}

function splitter({monospace, lineWidth, textOverflow}) {
  if (textOverflow != null || lineWidth == Infinity) return (text) => text.split(/\r\n?|\n/g);
  const widthof = monospace ? monospaceWidth : defaultWidth;
  const maxWidth = lineWidth * 100;
  return (text) => lineWrap(text, maxWidth, widthof);
}

function clipper({monospace, lineWidth, textOverflow}) {
  if (textOverflow == null || lineWidth == Infinity) return (text) => text;
  const widthof = monospace ? monospaceWidth : defaultWidth;
  const maxWidth = lineWidth * 100;
  switch (textOverflow) {
    case "clip-start":
      return (text) => clipStart(text, maxWidth, widthof, "");
    case "clip-end":
      return (text) => clipEnd(text, maxWidth, widthof, "");
    case "ellipsis-start":
      return (text) => clipStart(text, maxWidth, widthof, ellipsis);
    case "ellipsis-middle":
      return (text) => clipMiddle(text, maxWidth, widthof, ellipsis);
    case "ellipsis-end":
      return (text) => clipEnd(text, maxWidth, widthof, ellipsis);
  }
}

const ellipsis = "…";

// Cuts the given text to the given width, using the specified widthof function;
// the returned [index, error] guarantees text.slice(0, index) fits within the
// specified width with the given error. If the text fits naturally within the
// given width, returns [-1, 0]. If the text needs cutting, the given inset
// specifies how much space (in the same units as width and widthof) to reserve
// for a possible ellipsis character.
function cut(text, width, widthof, inset) {
  const I = []; // indexes of read character boundaries
  let w = 0; // current line width
  for (let i = 0, j = 0, n = text.length; i < n; i = j) {
    j = readCharacter(text, i); // read the next character
    const l = widthof(text, i, j); // current character width
    if (w + l > width) {
      w += inset;
      while (w > width && i > 0) (j = i), (i = I.pop()), (w -= widthof(text, i, j)); // remove excess
      return [i, width - w];
    }
    w += l;
    I.push(i);
  }
  return [-1, 0];
}

function clipEnd(text, width, widthof, ellipsis) {
  text = text.trim(); // ignore leading and trailing whitespace
  const e = widthof(ellipsis);
  const [i] = cut(text, width, widthof, e);
  return i < 0 ? text : text.slice(0, i).trimEnd() + ellipsis;
}

function clipMiddle(text, width, widthof, ellipsis) {
  text = text.trim(); // ignore leading and trailing whitespace
  const w = widthof(text);
  if (w <= width) return text;
  const e = widthof(ellipsis) / 2;
  const [i, ei] = cut(text, width / 2, widthof, e);
  const [j] = cut(text, w - width / 2 - ei + e, widthof, -e); // TODO read spaces?
  return j < 0 ? ellipsis : text.slice(0, i).trimEnd() + ellipsis + text.slice(readCharacter(text, j)).trimStart();
}

function clipStart(text, width, widthof, ellipsis) {
  text = text.trim(); // ignore leading and trailing whitespace
  const w = widthof(text);
  if (w <= width) return text;
  const e = widthof(ellipsis);
  const [j] = cut(text, w - width + e, widthof, -e); // TODO read spaces?
  return j < 0 ? ellipsis : ellipsis + text.slice(readCharacter(text, j)).trimStart();
}

const reCombiner = /[\p{Combining_Mark}\p{Emoji_Modifier}]+/uy;
const rePictographic = /\p{Extended_Pictographic}/uy;

// Reads a single “character” element from the given text starting at the given
// index, returning the index after the read character. Ideally, this implements
// the Unicode text segmentation algorithm and understands grapheme cluster
// boundaries, etc., but in practice this is only smart enough to detect UTF-16
// surrogate pairs, combining marks, and zero-width joiner (zwj) sequences such
// as emoji skin color modifiers. https://unicode.org/reports/tr29/
function readCharacter(text, i) {
  i += isSurrogatePair(text, i) ? 2 : 1;
  if (isCombiner(text, i)) i = reCombiner.lastIndex;
  if (isZeroWidthJoiner(text, i)) return readCharacter(text, i + 1);
  return i;
}

// We avoid more expensive regex tests involving Unicode property classes by
// first checking for the common case of 7-bit ASCII characters.
function isAscii(text, i) {
  return text.charCodeAt(i) < 0x80;
}

function isSurrogatePair(text, i) {
  const hi = text.charCodeAt(i);
  if (hi >= 0xd800 && hi < 0xdc00) {
    const lo = text.charCodeAt(i + 1);
    return lo >= 0xdc00 && lo < 0xe000;
  }
  return false;
}

function isZeroWidthJoiner(text, i) {
  return text.charCodeAt(i) === 0x200d;
}

function isCombiner(text, i) {
  return isAscii(text, i) ? false : ((reCombiner.lastIndex = i), reCombiner.test(text));
}

function isPictographic(text, i) {
  return isAscii(text, i) ? false : ((rePictographic.lastIndex = i), rePictographic.test(text));
}

const defaults$j = {
  ariaLabel: "vector",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round",
  strokeLinecap: "round"
};

const defaultRadius = 3.5;

// The size of the arrowhead is proportional to its length, but we still allow
// the relative size of the head to be controlled via the mark’s width option;
// doubling the default radius will produce an arrowhead that is twice as big.
// That said, we’ll probably want a arrow with a fixed head size, too.
const wingRatio = defaultRadius * 5;

const shapeArrow = {
  draw(context, l, r) {
    const wing = (l * r) / wingRatio;
    context.moveTo(0, 0);
    context.lineTo(0, -l);
    context.moveTo(-wing, wing - l);
    context.lineTo(0, -l);
    context.lineTo(wing, wing - l);
  }
};

const shapeSpike = {
  draw(context, l, r) {
    context.moveTo(-r, 0);
    context.lineTo(0, -l);
    context.lineTo(r, 0);
  }
};

const shapes = new Map([
  ["arrow", shapeArrow],
  ["spike", shapeSpike]
]);

function isShapeObject(value) {
  return value && typeof value.draw === "function";
}

function maybeShape(shape) {
  if (isShapeObject(shape)) return shape;
  const value = shapes.get(`${shape}`.toLowerCase());
  if (value) return value;
  throw new Error(`invalid shape: ${shape}`);
}

class Vector extends Mark {
  constructor(data, options = {}) {
    const {x, y, r = defaultRadius, length, rotate, shape = shapeArrow, anchor = "middle", frameAnchor} = options;
    const [vl, cl] = maybeNumberChannel(length, 12);
    const [vr, cr] = maybeNumberChannel(rotate, 0);
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        length: {value: vl, scale: "length", optional: true},
        rotate: {value: vr, optional: true}
      },
      options,
      defaults$j
    );
    this.r = +r;
    this.length = cl;
    this.rotate = cr;
    this.shape = maybeShape(shape);
    this.anchor = keyword(anchor, "anchor", ["start", "middle", "end"]);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, length: L, rotate: A} = channels;
    const {length, rotate, anchor, shape, r} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .attr(
            "transform",
            template`translate(${X ? (i) => X[i] : cx},${Y ? (i) => Y[i] : cy})${
              A ? (i) => ` rotate(${A[i]})` : rotate ? ` rotate(${rotate})` : ``
            }${
              anchor === "start"
                ? ``
                : anchor === "end"
                ? L
                  ? (i) => ` translate(0,${L[i]})`
                  : ` translate(0,${length})`
                : L
                ? (i) => ` translate(0,${L[i] / 2})`
                : ` translate(0,${length / 2})`
            }`
          )
          .attr(
            "d",
            L
              ? (i) => {
                  const p = d3.pathRound();
                  shape.draw(p, L[i], r);
                  return p;
                }
              : (() => {
                  const p = d3.pathRound();
                  shape.draw(p, length, r);
                  return p;
                })()
          )
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
}

function vector(data, options = {}) {
  let {x, y, ...rest} = options;
  if (options.frameAnchor === undefined) [x, y] = maybeTuple(x, y);
  return new Vector(data, {...rest, x, y});
}

function vectorX(data, options = {}) {
  const {x = identity$1, ...rest} = options;
  return new Vector(data, {...rest, x});
}

function vectorY(data, options = {}) {
  const {y = identity$1, ...rest} = options;
  return new Vector(data, {...rest, y});
}

function spike(data, options = {}) {
  const {
    shape = shapeSpike,
    stroke = defaults$j.stroke,
    strokeWidth = 1,
    fill = stroke,
    fillOpacity = 0.3,
    anchor = "start",
    ...rest
  } = options;
  return vector(data, {...rest, shape, stroke, strokeWidth, fill, fillOpacity, anchor});
}

function maybeData(data, options) {
  if (arguments.length < 2 && !isIterable(data)) (options = data), (data = null);
  if (options === undefined) options = {};
  return [data, options];
}

function maybeAnchor$2({anchor} = {}, anchors) {
  return anchor === undefined ? anchors[0] : keyword(anchor, "anchor", anchors);
}

function anchorY(options) {
  return maybeAnchor$2(options, ["left", "right"]);
}

function anchorFy(options) {
  return maybeAnchor$2(options, ["right", "left"]);
}

function anchorX(options) {
  return maybeAnchor$2(options, ["bottom", "top"]);
}

function anchorFx(options) {
  return maybeAnchor$2(options, ["top", "bottom"]);
}

function axisY() {
  const [data, options] = maybeData(...arguments);
  return axisKy("y", anchorY(options), data, options);
}

function axisFy() {
  const [data, options] = maybeData(...arguments);
  return axisKy("fy", anchorFy(options), data, options);
}

function axisX() {
  const [data, options] = maybeData(...arguments);
  return axisKx("x", anchorX(options), data, options);
}

function axisFx() {
  const [data, options] = maybeData(...arguments);
  return axisKx("fx", anchorFx(options), data, options);
}

function axisKy(
  k,
  anchor,
  data,
  {
    color = "currentColor",
    opacity = 1,
    stroke = color,
    strokeOpacity = opacity,
    strokeWidth = 1,
    fill = color,
    fillOpacity = opacity,
    textAnchor,
    textStroke,
    textStrokeOpacity,
    textStrokeWidth,
    tickSize = k === "y" ? 6 : 0,
    tickPadding,
    tickRotate,
    x,
    margin,
    marginTop = margin === undefined ? 20 : margin,
    marginRight = margin === undefined ? (anchor === "right" ? 40 : 0) : margin,
    marginBottom = margin === undefined ? 20 : margin,
    marginLeft = margin === undefined ? (anchor === "left" ? 40 : 0) : margin,
    label,
    labelAnchor,
    labelArrow,
    labelOffset,
    ...options
  }
) {
  tickSize = number$1(tickSize);
  tickPadding = number$1(tickPadding);
  tickRotate = number$1(tickRotate);
  if (labelAnchor !== undefined) labelAnchor = keyword(labelAnchor, "labelAnchor", ["center", "top", "bottom"]);
  labelArrow = maybeLabelArrow(labelArrow);
  return marks(
    tickSize && !isNoneish(stroke)
      ? axisTickKy(k, anchor, data, {
          stroke,
          strokeOpacity,
          strokeWidth,
          tickSize,
          tickPadding,
          tickRotate,
          x,
          ...options
        })
      : null,
    !isNoneish(fill)
      ? axisTextKy(k, anchor, data, {
          fill,
          fillOpacity,
          stroke: textStroke,
          strokeOpacity: textStrokeOpacity,
          strokeWidth: textStrokeWidth,
          textAnchor,
          tickSize,
          tickPadding,
          tickRotate,
          x,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          ...options
        })
      : null,
    !isNoneish(fill) && label !== null
      ? text(
          [],
          labelOptions({fill, fillOpacity, ...options}, function (data, facets, channels, scales, dimensions) {
            const scale = scales[k];
            const {marginTop, marginRight, marginBottom, marginLeft} = (k === "y" && dimensions.inset) || dimensions;
            const cla = labelAnchor ?? (scale.bandwidth ? "center" : "top");
            const clo = labelOffset ?? (anchor === "right" ? marginRight : marginLeft) - 3;
            if (cla === "center") {
              this.textAnchor = undefined; // middle
              this.lineAnchor = anchor === "right" ? "bottom" : "top";
              this.frameAnchor = anchor;
              this.rotate = -90;
            } else {
              this.textAnchor = anchor === "right" ? "end" : "start";
              this.lineAnchor = cla;
              this.frameAnchor = `${cla}-${anchor}`;
              this.rotate = 0;
            }
            this.dy = cla === "top" ? 3 - marginTop : cla === "bottom" ? marginBottom - 3 : 0;
            this.dx = anchor === "right" ? clo : -clo;
            this.ariaLabel = `${k}-axis label`;
            return {
              facets: [[0]],
              channels: {text: {value: [formatAxisLabel(k, scale, {anchor, label, labelAnchor: cla, labelArrow})]}}
            };
          })
        )
      : null
  );
}

function axisKx(
  k,
  anchor,
  data,
  {
    color = "currentColor",
    opacity = 1,
    stroke = color,
    strokeOpacity = opacity,
    strokeWidth = 1,
    fill = color,
    fillOpacity = opacity,
    textAnchor,
    textStroke,
    textStrokeOpacity,
    textStrokeWidth,
    tickSize = k === "x" ? 6 : 0,
    tickPadding,
    tickRotate,
    y,
    margin,
    marginTop = margin === undefined ? (anchor === "top" ? 30 : 0) : margin,
    marginRight = margin === undefined ? 20 : margin,
    marginBottom = margin === undefined ? (anchor === "bottom" ? 30 : 0) : margin,
    marginLeft = margin === undefined ? 20 : margin,
    label,
    labelAnchor,
    labelArrow,
    labelOffset,
    ...options
  }
) {
  tickSize = number$1(tickSize);
  tickPadding = number$1(tickPadding);
  tickRotate = number$1(tickRotate);
  if (labelAnchor !== undefined) labelAnchor = keyword(labelAnchor, "labelAnchor", ["center", "left", "right"]);
  labelArrow = maybeLabelArrow(labelArrow);
  return marks(
    tickSize && !isNoneish(stroke)
      ? axisTickKx(k, anchor, data, {
          stroke,
          strokeOpacity,
          strokeWidth,
          tickSize,
          tickPadding,
          tickRotate,
          y,
          ...options
        })
      : null,
    !isNoneish(fill)
      ? axisTextKx(k, anchor, data, {
          fill,
          fillOpacity,
          stroke: textStroke,
          strokeOpacity: textStrokeOpacity,
          strokeWidth: textStrokeWidth,
          textAnchor,
          tickSize,
          tickPadding,
          tickRotate,
          y,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          ...options
        })
      : null,
    !isNoneish(fill) && label !== null
      ? text(
          [],
          labelOptions({fill, fillOpacity, ...options}, function (data, facets, channels, scales, dimensions) {
            const scale = scales[k];
            const {marginTop, marginRight, marginBottom, marginLeft} = (k === "x" && dimensions.inset) || dimensions;
            const cla = labelAnchor ?? (scale.bandwidth ? "center" : "right");
            const clo = labelOffset ?? (anchor === "top" ? marginTop : marginBottom) - 3;
            if (cla === "center") {
              this.frameAnchor = anchor;
              this.textAnchor = undefined; // middle
            } else {
              this.frameAnchor = `${anchor}-${cla}`;
              this.textAnchor = cla === "right" ? "end" : "start";
            }
            this.lineAnchor = anchor;
            this.dy = anchor === "top" ? -clo : clo;
            this.dx = cla === "right" ? marginRight - 3 : cla === "left" ? 3 - marginLeft : 0;
            this.ariaLabel = `${k}-axis label`;
            return {
              facets: [[0]],
              channels: {text: {value: [formatAxisLabel(k, scale, {anchor, label, labelAnchor: cla, labelArrow})]}}
            };
          })
        )
      : null
  );
}

function axisTickKy(
  k,
  anchor,
  data,
  {
    strokeWidth = 1,
    strokeLinecap = null,
    strokeLinejoin = null,
    facetAnchor = anchor + (k === "y" ? "-empty" : ""),
    frameAnchor = anchor,
    tickSize,
    inset = 0,
    insetLeft = inset,
    insetRight = inset,
    dx = 0,
    y = k === "y" ? undefined : null,
    ...options
  }
) {
  return axisMark(
    vectorY,
    k,
    data,
    {
      ariaLabel: `${k}-axis tick`,
      ariaHidden: true
    },
    {
      strokeWidth,
      strokeLinecap,
      strokeLinejoin,
      facetAnchor,
      frameAnchor,
      y,
      ...options,
      dx: anchor === "left" ? +dx - offset + +insetLeft : +dx + offset - insetRight,
      anchor: "start",
      length: tickSize,
      shape: anchor === "left" ? shapeTickLeft : shapeTickRight
    }
  );
}

function axisTickKx(
  k,
  anchor,
  data,
  {
    strokeWidth = 1,
    strokeLinecap = null,
    strokeLinejoin = null,
    facetAnchor = anchor + (k === "x" ? "-empty" : ""),
    frameAnchor = anchor,
    tickSize,
    inset = 0,
    insetTop = inset,
    insetBottom = inset,
    dy = 0,
    x = k === "x" ? undefined : null,
    ...options
  }
) {
  return axisMark(
    vectorX,
    k,
    data,
    {
      ariaLabel: `${k}-axis tick`,
      ariaHidden: true
    },
    {
      strokeWidth,
      strokeLinejoin,
      strokeLinecap,
      facetAnchor,
      frameAnchor,
      x,
      ...options,
      dy: anchor === "bottom" ? +dy - offset - insetBottom : +dy + offset + +insetTop,
      anchor: "start",
      length: tickSize,
      shape: anchor === "bottom" ? shapeTickBottom : shapeTickTop
    }
  );
}

function axisTextKy(
  k,
  anchor,
  data,
  {
    facetAnchor = anchor + (k === "y" ? "-empty" : ""),
    frameAnchor = anchor,
    tickSize,
    tickRotate = 0,
    tickPadding = Math.max(3, 9 - tickSize) + (Math.abs(tickRotate) > 60 ? 4 * Math.cos(tickRotate * radians) : 0),
    text,
    textAnchor = Math.abs(tickRotate) > 60 ? "middle" : anchor === "left" ? "end" : "start",
    lineAnchor = tickRotate > 60 ? "top" : tickRotate < -60 ? "bottom" : "middle",
    fontVariant,
    inset = 0,
    insetLeft = inset,
    insetRight = inset,
    dx = 0,
    y = k === "y" ? undefined : null,
    ...options
  }
) {
  return axisMark(
    textY,
    k,
    data,
    {ariaLabel: `${k}-axis tick label`},
    {
      facetAnchor,
      frameAnchor,
      text,
      textAnchor,
      lineAnchor,
      fontVariant,
      rotate: tickRotate,
      y,
      ...options,
      dx: anchor === "left" ? +dx - tickSize - tickPadding + +insetLeft : +dx + +tickSize + +tickPadding - insetRight
    },
    function (scale, data, ticks, tickFormat, channels) {
      if (fontVariant === undefined) this.fontVariant = inferFontVariant(scale);
      if (text === undefined) channels.text = inferTextChannel(scale, data, ticks, tickFormat, anchor);
    }
  );
}

function axisTextKx(
  k,
  anchor,
  data,
  {
    facetAnchor = anchor + (k === "x" ? "-empty" : ""),
    frameAnchor = anchor,
    tickSize,
    tickRotate = 0,
    tickPadding = Math.max(3, 9 - tickSize) + (Math.abs(tickRotate) >= 10 ? 4 * Math.cos(tickRotate * radians) : 0),
    text,
    textAnchor = Math.abs(tickRotate) >= 10 ? ((tickRotate < 0) ^ (anchor === "bottom") ? "start" : "end") : "middle",
    lineAnchor = Math.abs(tickRotate) >= 10 ? "middle" : anchor === "bottom" ? "top" : "bottom",
    fontVariant,
    inset = 0,
    insetTop = inset,
    insetBottom = inset,
    dy = 0,
    x = k === "x" ? undefined : null,
    ...options
  }
) {
  return axisMark(
    textX,
    k,
    data,
    {ariaLabel: `${k}-axis tick label`},
    {
      facetAnchor,
      frameAnchor,
      text: text === undefined ? null : text,
      textAnchor,
      lineAnchor,
      fontVariant,
      rotate: tickRotate,
      x,
      ...options,
      dy: anchor === "bottom" ? +dy + +tickSize + +tickPadding - insetBottom : +dy - tickSize - tickPadding + +insetTop
    },
    function (scale, data, ticks, tickFormat, channels) {
      if (fontVariant === undefined) this.fontVariant = inferFontVariant(scale);
      if (text === undefined) channels.text = inferTextChannel(scale, data, ticks, tickFormat, anchor);
    }
  );
}

function gridY() {
  const [data, options] = maybeData(...arguments);
  return gridKy("y", anchorY(options), data, options);
}

function gridFy() {
  const [data, options] = maybeData(...arguments);
  return gridKy("fy", anchorFy(options), data, options);
}

function gridX() {
  const [data, options] = maybeData(...arguments);
  return gridKx("x", anchorX(options), data, options);
}

function gridFx() {
  const [data, options] = maybeData(...arguments);
  return gridKx("fx", anchorFx(options), data, options);
}

function gridKy(
  k,
  anchor,
  data,
  {
    y = k === "y" ? undefined : null,
    x = null,
    x1 = anchor === "left" ? x : null,
    x2 = anchor === "right" ? x : null,
    ...options
  }
) {
  return axisMark(ruleY, k, data, {ariaLabel: `${k}-grid`, ariaHidden: true}, {y, x1, x2, ...gridDefaults(options)});
}

function gridKx(
  k,
  anchor,
  data,
  {
    x = k === "x" ? undefined : null,
    y = null,
    y1 = anchor === "top" ? y : null,
    y2 = anchor === "bottom" ? y : null,
    ...options
  }
) {
  return axisMark(ruleX, k, data, {ariaLabel: `${k}-grid`, ariaHidden: true}, {x, y1, y2, ...gridDefaults(options)});
}

function gridDefaults({
  color = "currentColor",
  opacity = 0.1,
  stroke = color,
  strokeOpacity = opacity,
  strokeWidth = 1,
  ...options
}) {
  return {stroke, strokeOpacity, strokeWidth, ...options};
}

function labelOptions(
  {
    fill,
    fillOpacity,
    fontFamily,
    fontSize,
    fontStyle,
    fontVariant,
    fontWeight,
    monospace,
    pointerEvents,
    shapeRendering,
    clip = false
  },
  initializer
) {
  // Only propagate these options if constant.
  [, fill] = maybeColorChannel(fill);
  [, fillOpacity] = maybeNumberChannel(fillOpacity);
  return {
    facet: "super",
    x: null,
    y: null,
    fill,
    fillOpacity,
    fontFamily,
    fontSize,
    fontStyle,
    fontVariant,
    fontWeight,
    monospace,
    pointerEvents,
    shapeRendering,
    clip,
    initializer
  };
}

function axisMark(mark, k, data, properties, options, initialize) {
  let channels;

  function axisInitializer(data, facets, _channels, scales, dimensions, context) {
    const initializeFacets = data == null && (k === "fx" || k === "fy");
    const {[k]: scale} = scales;
    if (!scale) throw new Error(`missing scale: ${k}`);
    const domain = scale.domain();
    let {interval, ticks, tickFormat, tickSpacing = k === "x" ? 80 : 35} = options;
    // For a scale with a temporal domain, also allow the ticks to be specified
    // as a string which is promoted to a time interval. In the case of ordinal
    // scales, the interval is interpreted as UTC.
    if (typeof ticks === "string" && hasTemporalDomain(scale)) (interval = ticks), (ticks = undefined);
    // The interval axis option is an alternative method of specifying ticks;
    // for example, for a numeric scale, ticks = 5 means “about 5 ticks” whereas
    // interval = 5 means “ticks every 5 units”. (This is not to be confused
    // with the interval scale option, which affects the scale’s behavior!)
    // Lastly use the tickSpacing option to infer the desired tick count.
    if (ticks === undefined) ticks = maybeRangeInterval(interval, scale.type) ?? inferTickCount(scale, tickSpacing);
    if (data == null) {
      if (isIterable(ticks)) {
        // Use explicit ticks, if specified.
        data = arrayify(ticks);
      } else if (isInterval(ticks)) {
        // Use the tick interval, if specified.
        data = inclusiveRange(ticks, ...d3.extent(domain));
      } else if (scale.interval) {
        // If the scale interval is a standard time interval such as "day", we
        // may be able to generalize the scale interval it to a larger aligned
        // time interval to create the desired number of ticks.
        let interval = scale.interval;
        if (scale.ticks) {
          const [min, max] = d3.extent(domain);
          const n = (max - min) / interval[intervalDuration]; // current tick count
          // We don’t explicitly check that given interval is a time interval;
          // in that case the generalized interval will be undefined, just like
          // a nonstandard interval. TODO Generalize integer intervals, too.
          interval = generalizeTimeInterval(interval, n / ticks) ?? interval;
          data = inclusiveRange(interval, min, max);
        } else {
          data = domain;
          const n = data.length; // current tick count
          interval = generalizeTimeInterval(interval, n / ticks) ?? interval;
          if (interval !== scale.interval) data = inclusiveRange(interval, ...d3.extent(data));
        }
        if (interval === scale.interval) {
          // If we weren’t able to generalize the scale’s interval, compute the
          // positive number n such that taking every nth value from the scale’s
          // domain produces as close as possible to the desired number of
          // ticks. For example, if the domain has 100 values and 5 ticks are
          // desired, n = 20.
          const n = Math.round(data.length / ticks);
          if (n > 1) data = data.filter((d, i) => i % n === 0);
        }
      } else if (scale.ticks) {
        data = scale.ticks(ticks);
      } else {
        // For ordinal scales, the domain will already be generated using the
        // scale’s interval, if any.
        data = domain;
      }
      if (!scale.ticks && data.length && data !== domain) {
        // For ordinal scales, intersect the ticks with the scale domain since
        // the scale is only defined on its domain. If all of the ticks are
        // removed, then warn that the ticks and scale domain may be misaligned
        // (e.g., "year" ticks and "4 weeks" interval).
        const domainSet = new d3.InternSet(domain);
        data = data.filter((d) => domainSet.has(d));
        if (!data.length) warn(`Warning: the ${k}-axis ticks appear to not align with the scale domain, resulting in no ticks. Try different ticks?`); // prettier-ignore
      }
      if (k === "y" || k === "x") {
        facets = [range(data)];
      } else {
        channels[k] = {scale: k, value: identity$1};
      }
    }
    initialize?.call(this, scale, data, ticks, tickFormat, channels);
    const initializedChannels = Object.fromEntries(
      Object.entries(channels).map(([name, channel]) => {
        return [name, {...channel, value: valueof(data, channel.value)}];
      })
    );
    if (initializeFacets) facets = context.filterFacets(data, initializedChannels);
    return {data, facets, channels: initializedChannels};
  }

  // Apply any basic initializers after the axis initializer computes the ticks.
  const basicInitializer = initializer(options).initializer;
  const m = mark(data, initializer({...options, initializer: axisInitializer}, basicInitializer));
  if (data == null) {
    channels = m.channels;
    m.channels = {};
  } else {
    channels = {};
  }
  if (properties !== undefined) Object.assign(m, properties);
  if (m.clip === undefined) m.clip = false; // don’t clip axes by default
  return m;
}

function inferTickCount(scale, tickSpacing) {
  const [min, max] = d3.extent(scale.range());
  return (max - min) / tickSpacing;
}

function inferTextChannel(scale, data, ticks, tickFormat, anchor) {
  return {value: inferTickFormat(scale, data, ticks, tickFormat, anchor)};
}

// D3’s ordinal scales simply use toString by default, but if the ordinal scale
// domain (or ticks) are numbers or dates (say because we’re applying a time
// interval to the ordinal scale), we want Plot’s default formatter. And for
// time ticks, we want to use the multi-line time format (e.g., Jan 26) if
// possible, or the default ISO format (2014-01-26). TODO We need a better way
// to infer whether the ordinal scale is UTC or local time.
function inferTickFormat(scale, data, ticks, tickFormat, anchor) {
  return typeof tickFormat === "function" && !(scale.type === "log" && scale.tickFormat)
    ? tickFormat
    : tickFormat === undefined && data && isTemporal(data)
    ? inferTimeFormat(scale.type, data, anchor) ?? formatDefault
    : scale.tickFormat
    ? scale.tickFormat(typeof ticks === "number" ? ticks : null, tickFormat)
    : tickFormat === undefined
    ? formatDefault
    : typeof tickFormat === "string"
    ? (isTemporal(scale.domain()) ? d3.utcFormat : d3.format)(tickFormat)
    : constant(tickFormat);
}

function inclusiveRange(interval, min, max) {
  return interval.range(min, interval.offset(interval.floor(max)));
}

const shapeTickBottom = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(0, l);
  }
};

const shapeTickTop = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(0, -l);
  }
};

const shapeTickLeft = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(-l, 0);
  }
};

const shapeTickRight = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(l, 0);
  }
};

// TODO Unify this with the other inferFontVariant; here we only have a scale
// function rather than a scale descriptor.
function inferFontVariant(scale) {
  return scale.bandwidth && !scale.interval ? undefined : "tabular-nums";
}

// Takes the scale label, and if this is not an ordinal scale and the label was
// inferred from an associated channel, adds an orientation-appropriate arrow.
function formatAxisLabel(k, scale, {anchor, label = scale.label, labelAnchor, labelArrow} = {}) {
  if (label == null || (label.inferred && hasTemporalDomain(scale) && /^(date|time|year)$/i.test(label))) return;
  label = String(label); // coerce to a string after checking if inferred
  if (labelArrow === "auto") labelArrow = (!scale.bandwidth || scale.interval) && !/[↑↓→←]/.test(label);
  if (!labelArrow) return label;
  if (labelArrow === true) {
    const order = inferScaleOrder(scale);
    if (order)
      labelArrow =
        /x$/.test(k) || labelAnchor === "center"
          ? /x$/.test(k) === order < 0
            ? "left"
            : "right"
          : order < 0
          ? "up"
          : "down";
  }
  switch (labelArrow) {
    case "left":
      return `← ${label}`;
    case "right":
      return `${label} →`;
    case "up":
      return anchor === "right" ? `${label} ↑` : `↑ ${label}`;
    case "down":
      return anchor === "right" ? `${label} ↓` : `↓ ${label}`;
  }
  return label;
}

function maybeLabelArrow(labelArrow = "auto") {
  return isNoneish(labelArrow)
    ? false
    : typeof labelArrow === "boolean"
    ? labelArrow
    : keyword(labelArrow, "labelArrow", ["auto", "up", "right", "down", "left"]);
}

function hasTemporalDomain(scale) {
  return isTemporal(scale.domain());
}

function maybeScale(scale, key) {
  if (key == null) return key;
  const s = scale(key);
  if (!s) throw new Error(`scale not found: ${key}`);
  return s;
}

function legendSwatches(color, {opacity, ...options} = {}) {
  if (!isOrdinalScale(color) && !isThresholdScale(color))
    throw new Error(`swatches legend requires ordinal or threshold color scale (not ${color.type})`);
  return legendItems(color, options, (selection, scale, width, height) =>
    selection
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", scale.scale)
      .attr("fill-opacity", maybeNumberChannel(opacity)[1])
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
  );
}

function legendSymbols(
  symbol,
  {
    fill = symbol.hint?.fill !== undefined ? symbol.hint.fill : "none",
    fillOpacity = 1,
    stroke = symbol.hint?.stroke !== undefined ? symbol.hint.stroke : isNoneish(fill) ? "currentColor" : "none",
    strokeOpacity = 1,
    strokeWidth = 1.5,
    r = 4.5,
    ...options
  } = {},
  scale
) {
  const [vf, cf] = maybeColorChannel(fill);
  const [vs, cs] = maybeColorChannel(stroke);
  const sf = maybeScale(scale, vf);
  const ss = maybeScale(scale, vs);
  const size = r * r * Math.PI;
  fillOpacity = maybeNumberChannel(fillOpacity)[1];
  strokeOpacity = maybeNumberChannel(strokeOpacity)[1];
  strokeWidth = maybeNumberChannel(strokeWidth)[1];
  return legendItems(symbol, options, (selection, scale, width, height) =>
    selection
      .append("svg")
      .attr("viewBox", "-8 -8 16 16")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", vf === "color" ? (d) => sf.scale(d) : cf)
      .attr("fill-opacity", fillOpacity)
      .attr("stroke", vs === "color" ? (d) => ss.scale(d) : cs)
      .attr("stroke-opacity", strokeOpacity)
      .attr("stroke-width", strokeWidth)
      .append("path")
      .attr("d", (d) => {
        const p = d3.pathRound();
        symbol.scale(d).draw(p, size);
        return p;
      })
  );
}

function legendItems(scale, options = {}, swatch) {
  let {
    columns,
    tickFormat,
    fontVariant = inferFontVariant$2(scale),
    // TODO label,
    swatchSize = 15,
    swatchWidth = swatchSize,
    swatchHeight = swatchSize,
    marginLeft = 0,
    className,
    style,
    width
  } = options;
  const context = createContext(options);
  className = maybeClassName(className);
  tickFormat = inferTickFormat(scale.scale, scale.domain, undefined, tickFormat);

  const swatches = create("div", context).attr(
    "class",
    `${className}-swatches ${className}-swatches-${columns != null ? "columns" : "wrap"}`
  );

  let extraStyle;

  if (columns != null) {
    extraStyle = `:where(.${className}-swatches-columns .${className}-swatch) {
  display: flex;
  align-items: center;
  break-inside: avoid;
  padding-bottom: 1px;
}
:where(.${className}-swatches-columns .${className}-swatch::before) {
  flex-shrink: 0;
}
:where(.${className}-swatches-columns .${className}-swatch-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}`;

    swatches
      .style("columns", columns)
      .selectAll()
      .data(scale.domain)
      .enter()
      .append("div")
      .attr("class", `${className}-swatch`)
      .call(swatch, scale, swatchWidth, swatchHeight)
      .call((item) =>
        item.append("div").attr("class", `${className}-swatch-label`).attr("title", tickFormat).text(tickFormat)
      );
  } else {
    extraStyle = `:where(.${className}-swatches-wrap) {
  display: flex;
  align-items: center;
  min-height: 33px;
  flex-wrap: wrap;
}
:where(.${className}-swatches-wrap .${className}-swatch) {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}`;

    swatches
      .selectAll()
      .data(scale.domain)
      .enter()
      .append("span")
      .attr("class", `${className}-swatch`)
      .call(swatch, scale, swatchWidth, swatchHeight)
      .append(function () {
        return this.ownerDocument.createTextNode(tickFormat.apply(this, arguments));
      });
  }

  return swatches
    .call((div) =>
      div.insert("style", "*").text(
        `:where(.${className}-swatches) {
  font-family: system-ui, sans-serif;
  font-size: 10px;
  margin-bottom: 0.5em;
}
:where(.${className}-swatch > svg) {
  margin-right: 0.5em;
  overflow: visible;
}
${extraStyle}`
      )
    )
    .style("margin-left", marginLeft ? `${+marginLeft}px` : null)
    .style("width", width === undefined ? null : `${+width}px`)
    .style("font-variant", impliedString(fontVariant, "normal"))
    .call(applyInlineStyles, style)
    .node();
}

const legendRegistry = new Map([
  ["symbol", legendSymbols],
  ["color", legendColor],
  ["opacity", legendOpacity]
]);

function legend(options = {}) {
  for (const [key, value] of legendRegistry) {
    const scale = options[key];
    if (isScaleOptions(scale)) {
      // e.g., ignore {color: "red"}
      const context = createContext(options);
      let hint;
      // For symbol legends, pass a hint to the symbol scale.
      if (key === "symbol") {
        const {fill, stroke = fill === undefined && isScaleOptions(options.color) ? "color" : undefined} = options;
        hint = {fill, stroke};
      }
      return value(normalizeScale(key, scale, hint), legendOptions(context, scale, options), (key) =>
        isScaleOptions(options[key]) ? normalizeScale(key, options[key]) : null
      );
    }
  }
  throw new Error("unknown legend type; no scale found");
}

function exposeLegends(scales, context, defaults = {}) {
  return (key, options) => {
    if (!legendRegistry.has(key)) throw new Error(`unknown legend type: ${key}`);
    if (!(key in scales)) return;
    return legendRegistry.get(key)(scales[key], legendOptions(context, defaults[key], options), (key) => scales[key]);
  };
}

function legendOptions({className, ...context}, {label, ticks, tickFormat} = {}, options) {
  return inherit(options, {className, ...context}, {label, ticks, tickFormat});
}

function legendColor(color, {legend = true, ...options}) {
  if (legend === true) legend = color.type === "ordinal" ? "swatches" : "ramp";
  if (color.domain === undefined) return; // no identity legend
  switch (`${legend}`.toLowerCase()) {
    case "swatches":
      return legendSwatches(color, options);
    case "ramp":
      return legendRamp(color, options);
    default:
      throw new Error(`unknown legend type: ${legend}`);
  }
}

function legendOpacity({type, interpolate, ...scale}, {legend = true, color = d3.rgb(0, 0, 0), ...options}) {
  if (!interpolate) throw new Error(`${type} opacity scales are not supported`);
  if (legend === true) legend = "ramp";
  if (`${legend}`.toLowerCase() !== "ramp") throw new Error(`${legend} opacity legends are not supported`);
  return legendColor({type, ...scale, interpolate: interpolateOpacity(color)}, {legend, ...options});
}

function interpolateOpacity(color) {
  const {r, g, b} = d3.rgb(color) || d3.rgb(0, 0, 0); // treat invalid color as black
  return (t) => `rgba(${r},${g},${b},${t})`;
}

function createLegends(scales, context, options) {
  const legends = [];
  for (const [key, value] of legendRegistry) {
    const o = options[key];
    if (o?.legend && key in scales) {
      const legend = value(scales[key], legendOptions(context, scales[key], o), (key) => scales[key]);
      if (legend != null) legends.push(legend);
    }
  }
  return legends;
}

const defaults$i = {
  ariaLabel: "frame",
  fill: "none",
  stroke: "currentColor",
  clip: false
};

const lineDefaults = {
  ariaLabel: "frame",
  fill: null,
  stroke: "currentColor",
  strokeLinecap: "square",
  clip: false
};

class Frame extends Mark {
  constructor(options = {}) {
    const {
      anchor = null,
      inset = 0,
      insetTop = inset,
      insetRight = inset,
      insetBottom = inset,
      insetLeft = inset,
      rx,
      ry
    } = options;
    super(singleton, undefined, options, anchor == null ? defaults$i : lineDefaults);
    this.anchor = maybeKeyword(anchor, "anchor", ["top", "right", "bottom", "left"]);
    this.insetTop = number$1(insetTop);
    this.insetRight = number$1(insetRight);
    this.insetBottom = number$1(insetBottom);
    this.insetLeft = number$1(insetLeft);
    this.rx = number$1(rx);
    this.ry = number$1(ry);
  }
  render(index, scales, channels, dimensions, context) {
    const {marginTop, marginRight, marginBottom, marginLeft, width, height} = dimensions;
    const {anchor, insetTop, insetRight, insetBottom, insetLeft, rx, ry} = this;
    const x1 = marginLeft + insetLeft;
    const x2 = width - marginRight - insetRight;
    const y1 = marginTop + insetTop;
    const y2 = height - marginBottom - insetBottom;
    return create(anchor ? "svg:line" : "svg:rect", context)
      .datum(0)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyDirectStyles, this)
      .call(applyChannelStyles, this, channels)
      .call(applyTransform, this, {})
      .call(
        anchor === "left"
          ? (line) => line.attr("x1", x1).attr("x2", x1).attr("y1", y1).attr("y2", y2)
          : anchor === "right"
          ? (line) => line.attr("x1", x2).attr("x2", x2).attr("y1", y1).attr("y2", y2)
          : anchor === "top"
          ? (line) => line.attr("x1", x1).attr("x2", x2).attr("y1", y1).attr("y2", y1)
          : anchor === "bottom"
          ? (line) => line.attr("x1", x1).attr("x2", x2).attr("y1", y2).attr("y2", y2)
          : (rect) =>
              rect
                .attr("x", x1)
                .attr("y", y1)
                .attr("width", x2 - x1)
                .attr("height", y2 - y1)
                .attr("rx", rx)
                .attr("ry", ry)
      )
      .node();
  }
}

function frame(options) {
  return new Frame(options);
}

const defaults$h = {
  ariaLabel: "tip",
  fill: "var(--plot-background)",
  stroke: "currentColor"
};

// These channels are not displayed in the default tip; see formatChannels.
const ignoreChannels = new Set(["geometry", "href", "src", "ariaLabel", "scales"]);

class Tip extends Mark {
  constructor(data, options = {}) {
    if (options.tip) options = {...options, tip: false};
    if (options.title === undefined && isIterable(data) && isTextual(data)) options = {...options, title: identity$1};
    const {
      x,
      y,
      x1,
      x2,
      y1,
      y2,
      anchor,
      preferredAnchor = "bottom",
      monospace,
      fontFamily = monospace ? "ui-monospace, monospace" : undefined,
      fontSize,
      fontStyle,
      fontVariant,
      fontWeight,
      lineHeight = 1,
      lineWidth = 20,
      frameAnchor,
      format,
      textAnchor = "start",
      textOverflow,
      textPadding = 8,
      title,
      pointerSize = 12,
      pathFilter = "drop-shadow(0 3px 4px rgba(0,0,0,0.2))"
    } = options;
    super(
      data,
      {
        x: {value: x1 != null && x2 != null ? null : x, scale: "x", optional: true}, // ignore midpoint
        y: {value: y1 != null && y2 != null ? null : y, scale: "y", optional: true}, // ignore midpoint
        x1: {value: x1, scale: "x", optional: x2 == null},
        y1: {value: y1, scale: "y", optional: y2 == null},
        x2: {value: x2, scale: "x", optional: x1 == null},
        y2: {value: y2, scale: "y", optional: y1 == null},
        title: {value: title, optional: true} // filter: defined
      },
      options,
      defaults$h
    );
    this.anchor = maybeAnchor$3(anchor, "anchor");
    this.preferredAnchor = maybeAnchor$3(preferredAnchor, "preferredAnchor");
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    this.textAnchor = impliedString(textAnchor, "middle");
    this.textPadding = +textPadding;
    this.pointerSize = +pointerSize;
    this.pathFilter = string(pathFilter);
    this.lineHeight = +lineHeight;
    this.lineWidth = +lineWidth;
    this.textOverflow = maybeTextOverflow(textOverflow);
    this.monospace = !!monospace;
    this.fontFamily = string(fontFamily);
    this.fontSize = number$1(fontSize);
    this.fontStyle = string(fontStyle);
    this.fontVariant = string(fontVariant);
    this.fontWeight = string(fontWeight);
    for (const key in defaults$h) if (key in this.channels) this[key] = defaults$h[key]; // apply default even if channel
    this.splitLines = splitter(this);
    this.clipLine = clipper(this);
    this.format = typeof format === "string" || typeof format === "function" ? {title: format} : {...format}; // defensive copy before mutate; also promote nullish to empty
  }
  render(index, scales, values, dimensions, context) {
    const mark = this;
    const {x, y, fx, fy} = scales;
    const {ownerSVGElement: svg, document} = context;
    const {anchor, monospace, lineHeight, lineWidth} = this;
    const {textPadding: r, pointerSize: m, pathFilter} = this;
    const {marginTop, marginLeft} = dimensions;

    // The anchor position is the middle of x1 & y1 and x2 & y2, if available,
    // or x & y; the former is considered more specific because it’s how we
    // disable the implicit stack and interval transforms. If any dimension is
    // unspecified, we fallback to the frame anchor. We also need to know the
    // facet offsets to detect when the tip would draw outside the plot, and
    // thus we need to change the orientation.
    const {x1: X1, y1: Y1, x2: X2, y2: Y2, x: X = X1 ?? X2, y: Y = Y1 ?? Y2} = values;
    const ox = fx ? fx(index.fx) - marginLeft : 0;
    const oy = fy ? fy(index.fy) - marginTop : 0;

    // The order of precedence for the anchor position is: the middle of x1 & y1
    // and x2 & y2; or x1 & y1 (e.g., area); or lastly x & y. If a dimension is
    // unspecified, the frame anchor is used.
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const px = anchorX$1(values, cx);
    const py = anchorY$1(values, cy);

    // Resolve the text metric implementation. We may need an ellipsis for text
    // truncation, so we optimistically compute the ellipsis width.
    const widthof = monospace ? monospaceWidth : defaultWidth;
    const ee = widthof(ellipsis);

    // If there’s a title channel, display that as-is; otherwise, show multiple
    // channels as name-value pairs.
    let sources, format;
    if ("title" in values) {
      sources = getSourceChannels.call(this, {title: values.channels.title}, scales);
      format = formatTitle;
    } else {
      sources = getSourceChannels.call(this, values.channels, scales);
      format = formatChannels;
    }

    // We don’t call applyChannelStyles because we only use the channels to
    // derive the content of the tip, not its aesthetics.
    const g = create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyIndirectTextStyles, this)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("g")
          .attr("transform", (i) => `translate(${Math.round(px(i))},${Math.round(py(i))})`) // crisp edges
          .call(applyDirectStyles, this)
          .call((g) => g.append("path").attr("filter", pathFilter))
          .call((g) =>
            g.append("text").each(function (i) {
              const that = d3.select(this);
              // prevent style inheritance (from path)
              this.setAttribute("fill", "currentColor");
              this.setAttribute("fill-opacity", 1);
              this.setAttribute("stroke", "none");
              // iteratively render each channel value
              const lines = format.call(mark, i, index, sources, scales, values);
              if (typeof lines === "string") {
                for (const line of mark.splitLines(lines)) {
                  renderLine(that, {value: mark.clipLine(line)});
                }
              } else {
                const labels = new Set();
                for (const line of lines) {
                  const {label = ""} = line;
                  if (label && labels.has(label)) continue;
                  else labels.add(label);
                  renderLine(that, line);
                }
              }
            })
          )
      );

    // Renders a single line (a name-value pair) to the tip, truncating the text
    // as needed, and adding a title if the text is truncated. Note that this is
    // just the initial layout of the text; in postrender we will compute the
    // exact text metrics and translate the text as needed once we know the
    // tip’s orientation (anchor).
    function renderLine(selection, {label, value, color, opacity}) {
      (label ??= ""), (value ??= "");
      const swatch = color != null || opacity != null;
      let title;
      let w = lineWidth * 100;
      const [j] = cut(label, w, widthof, ee);
      if (j >= 0) {
        // label is truncated
        label = label.slice(0, j).trimEnd() + ellipsis;
        title = value.trim();
        value = "";
      } else {
        if (label || (!value && !swatch)) value = " " + value;
        const [k] = cut(value, w - widthof(label), widthof, ee);
        if (k >= 0) {
          // value is truncated
          title = value.trim();
          value = value.slice(0, k).trimEnd() + ellipsis;
        }
      }
      const line = selection.append("tspan").attr("x", 0).attr("dy", `${lineHeight}em`).text("\u200b"); // zwsp for double-click
      if (label) line.append("tspan").attr("font-weight", "bold").text(label);
      if (value) line.append(() => document.createTextNode(value));
      if (swatch) line.append("tspan").text(" ■").attr("fill", color).attr("fill-opacity", opacity).style("user-select", "none"); // prettier-ignore
      if (title) line.append("title").text(title);
    }

    // Only after the plot is attached to the page can we compute the exact text
    // metrics needed to determine the tip size and orientation (anchor).
    function postrender() {
      const {width, height} = dimensions.facet ?? dimensions;
      g.selectChildren().each(function (i) {
        let {x: tx, width: w, height: h} = this.getBBox();
        (w = Math.round(w)), (h = Math.round(h)); // crisp edges
        let a = anchor; // use the specified anchor, if any
        if (a === undefined) {
          const x = px(i) + ox;
          const y = py(i) + oy;
          const fitLeft = x + w + m + r * 2 < width;
          const fitRight = x - w - m - r * 2 > 0;
          const fitTop = y + h + m + r * 2 < height;
          const fitBottom = y - h - m - r * 2 > 0;
          a =
            fitLeft && fitRight
              ? fitTop && fitBottom
                ? mark.preferredAnchor
                : fitBottom
                ? "bottom"
                : "top"
              : fitTop && fitBottom
              ? fitLeft
                ? "left"
                : "right"
              : (fitLeft || fitRight) && (fitTop || fitBottom)
              ? `${fitBottom ? "bottom" : "top"}-${fitLeft ? "left" : "right"}`
              : mark.preferredAnchor;
        }
        const path = this.firstChild; // note: assumes exactly two children!
        const text = this.lastChild; // note: assumes exactly two children!
        path.setAttribute("d", getPath(a, m, r, w, h));
        if (tx) for (const t of text.childNodes) t.setAttribute("x", -tx);
        text.setAttribute("y", `${+getLineOffset(a, text.childNodes.length, lineHeight).toFixed(6)}em`);
        text.setAttribute("transform", `translate(${getTextTranslate(a, m, r, w, h)})`);
      });
      g.attr("visibility", null);
    }

    // Wait until the plot is inserted into the page so that we can use getBBox
    // to compute the exact text dimensions. If the SVG is already connected, as
    // when the pointer interaction triggers the re-render, use a faster
    // microtask instead of an animation frame; if this SSR (e.g., JSDOM), skip
    // this step. Perhaps this could be done synchronously; getting the
    // dimensions of the SVG is easy, and although accurate text metrics are
    // hard, we could use approximate heuristics.
    if (index.length) {
      g.attr("visibility", "hidden"); // hide until postrender
      if (svg.isConnected) Promise.resolve().then(postrender);
      else if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(postrender);
    }

    return g.node();
  }
}

function tip(data, {x, y, ...options} = {}) {
  if (options.frameAnchor === undefined) [x, y] = maybeTuple(x, y);
  return new Tip(data, {...options, x, y});
}

function getLineOffset(anchor, length, lineHeight) {
  return /^top(?:-|$)/.test(anchor)
    ? 0.94 - lineHeight
    : /^bottom(?:-|$)/
    ? -0.29 - length * lineHeight
    : (length / 2) * lineHeight;
}

function getTextTranslate(anchor, m, r, width, height) {
  switch (anchor) {
    case "middle":
      return [-width / 2, height / 2];
    case "top-left":
      return [r, m + r];
    case "top":
      return [-width / 2, m / 2 + r];
    case "top-right":
      return [-width - r, m + r];
    case "right":
      return [-m / 2 - width - r, height / 2];
    case "bottom-left":
      return [r, -m - r];
    case "bottom":
      return [-width / 2, -m / 2 - r];
    case "bottom-right":
      return [-width - r, -m - r];
    case "left":
      return [r + m / 2, height / 2];
  }
}

function getPath(anchor, m, r, width, height) {
  const w = width + r * 2;
  const h = height + r * 2;
  switch (anchor) {
    case "middle":
      return `M${-w / 2},${-h / 2}h${w}v${h}h${-w}z`;
    case "top-left":
      return `M0,0l${m},${m}h${w - m}v${h}h${-w}z`;
    case "top":
      return `M0,0l${m / 2},${m / 2}h${(w - m) / 2}v${h}h${-w}v${-h}h${(w - m) / 2}z`;
    case "top-right":
      return `M0,0l${-m},${m}h${m - w}v${h}h${w}z`;
    case "right":
      return `M0,0l${-m / 2},${-m / 2}v${m / 2 - h / 2}h${-w}v${h}h${w}v${m / 2 - h / 2}z`;
    case "bottom-left":
      return `M0,0l${m},${-m}h${w - m}v${-h}h${-w}z`;
    case "bottom":
      return `M0,0l${m / 2},${-m / 2}h${(w - m) / 2}v${-h}h${-w}v${h}h${(w - m) / 2}z`;
    case "bottom-right":
      return `M0,0l${-m},${-m}h${m - w}v${-h}h${w}z`;
    case "left":
      return `M0,0l${m / 2},${-m / 2}v${m / 2 - h / 2}h${w}v${h}h${-w}v${m / 2 - h / 2}z`;
  }
}

// Note: mutates this.format!
function getSourceChannels(channels, scales) {
  const sources = {};

  // Promote x and y shorthand for paired channels (in order).
  let format = this.format;
  format = maybeExpandPairedFormat(format, channels, "x");
  format = maybeExpandPairedFormat(format, channels, "y");
  this.format = format;

  // Prioritize channels with explicit formats, in the given order.
  for (const key in format) {
    const value = format[key];
    if (value === null || value === false) {
      continue;
    } else if (key === "fx" || key === "fy") {
      sources[key] = true;
    } else {
      const source = getSource(channels, key);
      if (source) sources[key] = source;
    }
  }

  // Then fallback to all other (non-ignored) channels.
  for (const key in channels) {
    if (key in sources || key in format || ignoreChannels.has(key)) continue;
    if ((key === "x" || key === "y") && channels.geometry) continue; // ignore x & y on geo
    const source = getSource(channels, key);
    if (source) {
      // Ignore color channels if the values are all literal colors.
      if (source.scale == null && source.defaultScale === "color") continue;
      sources[key] = source;
    }
  }

  // And lastly facet channels, but only if this mark is faceted.
  if (this.facet) {
    if (scales.fx && !("fx" in format)) sources.fx = true;
    if (scales.fy && !("fy" in format)) sources.fy = true;
  }

  // Promote shorthand string formats, and materialize default formats.
  for (const key in sources) {
    const format = this.format[key];
    if (typeof format === "string") {
      const value = sources[key]?.value ?? scales[key]?.domain() ?? [];
      this.format[key] = (isTemporal(value) ? d3.utcFormat : d3.format)(format);
    } else if (format === undefined || format === true) {
      // For ordinal scales, the inferred tick format can be more concise, such
      // as only showing the year for yearly data.
      const scale = scales[key];
      this.format[key] = scale?.bandwidth ? inferTickFormat(scale, scale.domain()) : formatDefault;
    }
  }

  return sources;
}

// Promote x and y shorthand for paired channels, while preserving order.
function maybeExpandPairedFormat(format, channels, key) {
  if (!(key in format)) return format;
  const key1 = `${key}1`;
  const key2 = `${key}2`;
  if ((key1 in format || !(key1 in channels)) && (key2 in format || !(key2 in channels))) return format;
  const entries = Object.entries(format);
  const value = format[key];
  entries.splice(entries.findIndex(([name]) => name === key) + 1, 0, [key1, value], [key2, value]);
  return Object.fromEntries(entries);
}

function formatTitle(i, index, {title}) {
  return this.format.title(title.value[i], i);
}

function* formatChannels(i, index, channels, scales, values) {
  for (const key in channels) {
    if (key === "fx" || key === "fy") {
      yield {
        label: formatLabel(scales, channels, key),
        value: this.format[key](index[key], i)
      };
      continue;
    }
    if (key === "x1" && "x2" in channels) continue;
    if (key === "y1" && "y2" in channels) continue;
    const channel = channels[key];
    if (key === "x2" && "x1" in channels) {
      yield {
        label: formatPairLabel(scales, channels, "x"),
        value: formatPair(this.format.x2, channels.x1, channel, i)
      };
    } else if (key === "y2" && "y1" in channels) {
      yield {
        label: formatPairLabel(scales, channels, "y"),
        value: formatPair(this.format.y2, channels.y1, channel, i)
      };
    } else {
      const value = channel.value[i];
      const scale = channel.scale;
      if (!defined(value) && scale == null) continue;
      yield {
        label: formatLabel(scales, channels, key),
        value: this.format[key](value, i),
        color: scale === "color" ? values[key][i] : null,
        opacity: scale === "opacity" ? values[key][i] : null
      };
    }
  }
}

function formatPair(formatValue, c1, c2, i) {
  return c2.hint?.length // e.g., stackY’s y1 and y2
    ? `${formatValue(c2.value[i] - c1.value[i], i)}`
    : `${formatValue(c1.value[i], i)}–${formatValue(c2.value[i], i)}`;
}

function formatPairLabel(scales, channels, key) {
  const l1 = formatLabel(scales, channels, `${key}1`, key);
  const l2 = formatLabel(scales, channels, `${key}2`, key);
  return l1 === l2 ? l1 : `${l1}–${l2}`;
}

function formatLabel(scales, channels, key, defaultLabel = key) {
  const channel = channels[key];
  const scale = scales[channel?.scale ?? key];
  return String(scale?.label ?? channel?.label ?? defaultLabel);
}

function plot(options = {}) {
  const {facet, style, title, subtitle, caption, ariaLabel, ariaDescription} = options;

  // className for inline styles
  const className = maybeClassName(options.className);

  // Flatten any nested marks.
  const marks = options.marks === undefined ? [] : flatMarks(options.marks);

  // Add implicit tips.
  marks.push(...inferTips(marks));

  // Compute the top-level facet state. This has roughly the same structure as
  // mark-specific facet state, except there isn’t a facetsIndex, and there’s a
  // data and dataLength so we can warn the user if a different data of the same
  // length is used in a mark.
  const topFacetState = maybeTopFacet(facet, options);

  // Construct a map from (faceted) Mark instance to facet state, including:
  // channels - an {fx?, fy?} object to add to the fx and fy scale
  // groups - a possibly-nested map from facet values to indexes in the data array
  // facetsIndex - a sparse nested array of indices corresponding to the valid facets
  const facetStateByMark = new Map();
  for (const mark of marks) {
    const facetState = maybeMarkFacet(mark, topFacetState, options);
    if (facetState) facetStateByMark.set(mark, facetState);
  }

  // Compute a Map from scale name to an array of associated channels.
  const channelsByScale = new Map();
  if (topFacetState) addScaleChannels(channelsByScale, [topFacetState], options);
  addScaleChannels(channelsByScale, facetStateByMark, options);

  // Add implicit axis marks. Because this happens after faceting (because it
  // depends on whether faceting is present), we must initialize the facet state
  // of any implicit axes, too.
  const axes = flatMarks(inferAxes(marks, channelsByScale, options));
  for (const mark of axes) {
    const facetState = maybeMarkFacet(mark, topFacetState, options);
    if (facetState) facetStateByMark.set(mark, facetState);
  }
  marks.unshift(...axes);

  // All the possible facets are given by the domains of the fx or fy scales, or
  // the cross-product of these domains if we facet by both x and y. We sort
  // them in order to apply the facet filters afterwards.
  let facets = createFacets(channelsByScale, options);

  if (facets !== undefined) {
    const topFacetsIndex = topFacetState ? facetFilter(facets, topFacetState) : undefined;

    // Compute a facet index for each mark, parallel to the facets array. For
    // mark-level facets, compute an index for that mark’s data and options.
    // Otherwise, use the top-level facet index.
    for (const mark of marks) {
      if (mark.facet === null || mark.facet === "super") continue;
      const facetState = facetStateByMark.get(mark);
      if (facetState === undefined) continue;
      facetState.facetsIndex = mark.fx != null || mark.fy != null ? facetFilter(facets, facetState) : topFacetsIndex;
    }

    // The cross product of the domains of fx and fy can include fx-fy
    // combinations for which no mark has an instance associated with that
    // combination, and therefore we don’t want to render this facet (not even
    // the frame). The same can occur if you specify the domain of fx and fy
    // explicitly, but there is no mark instance associated with some values in
    // the domain. Expunge empty facets, and clear the corresponding elements
    // from the nested index in each mark.
    const nonEmpty = new Set();
    for (const {facetsIndex} of facetStateByMark.values()) {
      facetsIndex?.forEach((index, i) => {
        if (index?.length > 0) {
          nonEmpty.add(i);
        }
      });
    }

    // If all the facets are empty (as when none of the marks are actually
    // faceted), none of them are empty.
    facets.forEach(
      0 < nonEmpty.size && nonEmpty.size < facets.length
        ? (f, i) => (f.empty = !nonEmpty.has(i))
        : (f) => (f.empty = false)
    );

    // For any mark using the “exclude” facet mode, invert the index.
    for (const mark of marks) {
      if (mark.facet === "exclude") {
        const facetState = facetStateByMark.get(mark);
        if (facetState !== undefined) facetState.facetsIndex = facetExclude(facetState.facetsIndex);
      }
    }
  }

  // If a scale is explicitly declared in options, initialize its associated
  // channels to the empty array; this will guarantee that a corresponding scale
  // will be created later (even if there are no other channels). Ignore facet
  // scale declarations, which are handled above.
  for (const key of registry.keys()) {
    if (isScaleOptions(options[key]) && key !== "fx" && key !== "fy") {
      channelsByScale.set(key, []);
    }
  }

  // A Map from Mark instance to its render state, including:
  // index - the data index e.g. [0, 1, 2, 3, …]
  // channels - an array of materialized channels e.g. [["x", {value}], …]
  // faceted - a boolean indicating whether this mark is faceted
  // values - an object of scaled values e.g. {x: [40, 32, …], …}
  const stateByMark = new Map();

  // Initialize the marks’ state.
  for (const mark of marks) {
    if (stateByMark.has(mark)) throw new Error("duplicate mark; each mark must be unique");
    const {facetsIndex, channels: facetChannels} = facetStateByMark.get(mark) ?? {};
    const {data, facets, channels} = mark.initialize(facetsIndex, facetChannels, options);
    applyScaleTransforms(channels, options);
    stateByMark.set(mark, {data, facets, channels});
  }

  // Initalize the scales and dimensions.
  const scaleDescriptors = createScales(addScaleChannels(channelsByScale, stateByMark, options), options);
  const dimensions = createDimensions(scaleDescriptors, marks, options);

  autoScaleRange(scaleDescriptors, dimensions);

  const scales = createScaleFunctions(scaleDescriptors);
  const {fx, fy} = scales;
  const subdimensions = fx || fy ? innerDimensions(scaleDescriptors, dimensions) : dimensions;
  const superdimensions = fx || fy ? actualDimensions(scales, dimensions) : dimensions;

  // Initialize the context.
  const context = createContext(options);
  const document = context.document;
  const svg = d3.creator("svg").call(document.documentElement);
  let figure = svg; // replaced with the figure element, if any
  context.ownerSVGElement = svg;
  context.className = className;
  context.projection = createProjection(options, subdimensions);

  // Allows e.g. the axis mark to determine faceting lazily.
  context.filterFacets = (data, channels) => {
    return facetFilter(facets, {channels, groups: facetGroups(data, channels)});
  };

  // Allows e.g. the tip mark to reference channels and data on other marks.
  context.getMarkState = (mark) => {
    const state = stateByMark.get(mark);
    const facetState = facetStateByMark.get(mark);
    return {...state, channels: {...state.channels, ...facetState?.channels}};
  };

  // Allows e.g. the pointer transform to support viewof.
  context.dispatchValue = (value) => {
    if (figure.value === value) return;
    figure.value = value;
    figure.dispatchEvent(new Event("input", {bubbles: true}));
  };

  // Reinitialize; for deriving channels dependent on other channels.
  const newByScale = new Set();
  for (const [mark, state] of stateByMark) {
    if (mark.initializer != null) {
      const dimensions = mark.facet === "super" ? superdimensions : subdimensions;
      const update = mark.initializer(state.data, state.facets, state.channels, scales, dimensions, context);
      if (update.data !== undefined) {
        state.data = update.data;
      }
      if (update.facets !== undefined) {
        state.facets = update.facets;
      }
      if (update.channels !== undefined) {
        const {fx, fy, ...channels} = update.channels; // separate facet channels
        inferChannelScales(channels);
        Object.assign(state.channels, channels);
        for (const channel of Object.values(channels)) {
          const {scale} = channel;
          // Initializers aren’t allowed to redefine position scales as this
          // would introduce a circular dependency; so simply scale these
          // channels as-is rather than creating new scales, and assume that
          // they already have the scale’s transform applied, if any (e.g., when
          // generating ticks for the axis mark).
          if (scale != null && !isPosition(registry.get(scale))) {
            applyScaleTransform(channel, options);
            newByScale.add(scale);
          }
        }
        // If the initializer returns new mark-level facet channels, we must
        // record that the mark is now faceted. Note: we aren’t actually
        // populating the facet state, but subsequently we won’t need it.
        if (fx != null || fy != null) facetStateByMark.set(mark, true);
      }
    }
  }

  // Reconstruct scales if new scaled channels were created during
  // reinitialization. Preserve existing scale labels, if any.
  if (newByScale.size) {
    const newChannelsByScale = new Map();
    addScaleChannels(newChannelsByScale, stateByMark, options, (key) => newByScale.has(key));
    addScaleChannels(channelsByScale, stateByMark, options, (key) => newByScale.has(key));
    const newScaleDescriptors = inheritScaleLabels(createScales(newChannelsByScale, options), scaleDescriptors);
    const {scales: newExposedScales, ...newScales} = createScaleFunctions(newScaleDescriptors);
    Object.assign(scaleDescriptors, newScaleDescriptors);
    Object.assign(scales, newScales);
    Object.assign(scales.scales, newExposedScales);
  }

  // Sort and filter the facets to match the fx and fy domains; this is needed
  // because the facets were constructed prior to the fx and fy scales.
  let facetDomains, facetTranslate;
  if (facets !== undefined) {
    facetDomains = {x: fx?.domain(), y: fy?.domain()};
    facets = recreateFacets(facets, facetDomains);
    facetTranslate = facetTranslator(fx, fy, dimensions);
  }

  // Compute value objects, applying scales and projection as needed.
  for (const [mark, state] of stateByMark) {
    state.values = mark.scale(state.channels, scales, context);
  }

  const {width, height} = dimensions;

  d3.select(svg)
    .attr("class", className)
    .attr("fill", "currentColor")
    .attr("font-family", "system-ui, sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("aria-label", ariaLabel)
    .attr("aria-description", ariaDescription)
    .call((svg) =>
      // Warning: if you edit this, change defaultClassName.
      svg.append("style").text(
        `:where(.${className}) {
  --plot-background: white;
  display: block;
  height: auto;
  height: intrinsic;
  max-width: 100%;
}
:where(.${className} text),
:where(.${className} tspan) {
  white-space: pre;
}`
      )
    )
    .call(applyInlineStyles, style);

  // Render marks.
  for (const mark of marks) {
    const {channels, values, facets: indexes} = stateByMark.get(mark);

    // Render a non-faceted mark.
    if (facets === undefined || mark.facet === "super") {
      let index = null;
      if (indexes) {
        index = indexes[0];
        index = mark.filter(index, channels, values);
        if (index.length === 0) continue;
      }
      const node = mark.render(index, scales, values, superdimensions, context);
      if (node == null) continue;
      svg.appendChild(node);
    }

    // Render a faceted mark.
    else {
      let g;
      for (const f of facets) {
        if (!(mark.facetAnchor?.(facets, facetDomains, f) ?? !f.empty)) continue;
        let index = null;
        if (indexes) {
          const faceted = facetStateByMark.has(mark);
          index = indexes[faceted ? f.i : 0];
          index = mark.filter(index, channels, values);
          if (index.length === 0) continue;
          if (!faceted && index === indexes[0]) index = subarray(index); // copy before assigning fx, fy, fi
          (index.fx = f.x), (index.fy = f.y), (index.fi = f.i);
        }
        const node = mark.render(index, scales, values, subdimensions, context);
        if (node == null) continue;
        // Lazily construct the shared group (to drop empty marks).
        (g ??= d3.select(svg).append("g")).append(() => node).datum(f);
        // Promote ARIA attributes and mark transform to avoid repetition on
        // each facet; this assumes that these attributes are consistent across
        // facets, but that should be the case!
        for (const name of ["aria-label", "aria-description", "aria-hidden", "transform"]) {
          if (node.hasAttribute(name)) {
            g.attr(name, node.getAttribute(name));
            node.removeAttribute(name);
          }
        }
      }
      g?.selectChildren().attr("transform", facetTranslate);
    }
  }

  // Wrap the plot in a figure, if needed.
  const legends = createLegends(scaleDescriptors, context, options);
  const {figure: figured = title != null || subtitle != null || caption != null || legends.length > 0} = options;
  if (figured) {
    figure = document.createElement("figure");
    figure.className = `${className}-figure`;
    figure.style.maxWidth = "initial"; // avoid Observable default style
    if (title != null) figure.append(createTitleElement(document, title, "h2"));
    if (subtitle != null) figure.append(createTitleElement(document, subtitle, "h3"));
    figure.append(...legends, svg);
    if (caption != null) figure.append(createFigcaption(document, caption));
    if ("value" in svg) (figure.value = svg.value), delete svg.value;
  }

  figure.scale = exposeScales(scales.scales);
  figure.legend = exposeLegends(scaleDescriptors, context, options);

  const w = consumeWarnings();
  if (w > 0) {
    d3.select(svg)
      .append("text")
      .attr("x", width)
      .attr("y", 20)
      .attr("dy", "-1em")
      .attr("text-anchor", "end")
      .attr("font-family", "initial") // fix emoji rendering in Chrome
      .text("\u26a0\ufe0f") // emoji variation selector
      .append("title")
      .text(`${w.toLocaleString("en-US")} warning${w === 1 ? "" : "s"}. Please check the console.`);
  }

  return figure;
}

function createTitleElement(document, contents, tag) {
  if (contents.ownerDocument) return contents;
  const e = document.createElement(tag);
  e.append(contents);
  return e;
}

function createFigcaption(document, caption) {
  const e = document.createElement("figcaption");
  e.append(caption);
  return e;
}

function flatMarks(marks) {
  return marks
    .flat(Infinity)
    .filter((mark) => mark != null)
    .map(markify);
}

function markify(mark) {
  return typeof mark.render === "function" ? mark : new Render(mark);
}

class Render extends Mark {
  constructor(render) {
    if (typeof render !== "function") throw new TypeError("invalid mark; missing render function");
    super();
    this.render = render;
  }
  render() {}
}

// Note: mutates channel.value to apply the scale transform, if any.
function applyScaleTransforms(channels, options) {
  for (const name in channels) applyScaleTransform(channels[name], options);
  return channels;
}

// Note: mutates channel.value to apply the scale transform, if any. Also sets
// channel.transform to false to prevent duplicate transform application.
function applyScaleTransform(channel, options) {
  const {scale, transform: t = true} = channel;
  if (scale == null || !t) return;
  const {
    type,
    percent,
    interval,
    transform = percent ? (x) => (x == null ? NaN : x * 100) : maybeIntervalTransform(interval, type)
  } = options[scale] ?? {};
  if (transform == null) return;
  channel.value = map$1(channel.value, transform);
  channel.transform = false;
}

// An initializer may generate channels without knowing how the downstream mark
// will use them. Marks are typically responsible associated scales with
// channels, but here we assume common behavior across marks.
function inferChannelScales(channels) {
  for (const name in channels) {
    inferChannelScale(name, channels[name]);
  }
}

function addScaleChannels(channelsByScale, stateByMark, options, filter = yes) {
  for (const {channels} of stateByMark.values()) {
    for (const name in channels) {
      const channel = channels[name];
      const {scale} = channel;
      if (scale != null && filter(scale)) {
        // Geo marks affect the default x and y domains if there is no
        // projection. Skip this (as an optimization) when a projection is
        // specified, or when the domains for x and y are specified.
        if (scale === "projection") {
          if (!hasProjection(options)) {
            const gx = options.x?.domain === undefined;
            const gy = options.y?.domain === undefined;
            if (gx || gy) {
              const [x, y] = getGeometryChannels(channel);
              if (gx) addScaleChannel(channelsByScale, "x", x);
              if (gy) addScaleChannel(channelsByScale, "y", y);
            }
          }
        } else {
          addScaleChannel(channelsByScale, scale, channel);
        }
      }
    }
  }
  return channelsByScale;
}

function addScaleChannel(channelsByScale, scale, channel) {
  const scaleChannels = channelsByScale.get(scale);
  if (scaleChannels !== undefined) scaleChannels.push(channel);
  else channelsByScale.set(scale, [channel]);
}

// Returns the facet groups, and possibly fx and fy channels, associated with
// the top-level facet option {data, x, y}.
function maybeTopFacet(facet, options) {
  if (facet == null) return;
  const {x, y} = facet;
  if (x == null && y == null) return;
  const data = arrayify(facet.data);
  if (data == null) throw new Error("missing facet data");
  const channels = {};
  if (x != null) channels.fx = createChannel(data, {value: x, scale: "fx"});
  if (y != null) channels.fy = createChannel(data, {value: y, scale: "fy"});
  applyScaleTransforms(channels, options);
  const groups = facetGroups(data, channels);
  return {channels, groups, data: facet.data};
}

// Returns the facet groups, and possibly fx and fy channels, associated with a
// mark, either through top-level faceting or mark-level facet options {fx, fy}.
function maybeMarkFacet(mark, topFacetState, options) {
  if (mark.facet === null || mark.facet === "super") return;

  // This mark defines a mark-level facet. TODO There’s some code duplication
  // here with maybeTopFacet that we could reduce.
  const {fx, fy} = mark;
  if (fx != null || fy != null) {
    const data = arrayify(mark.data ?? fx ?? fy);
    if (data === undefined) throw new Error(`missing facet data in ${mark.ariaLabel}`);
    if (data === null) return; // ignore channel definitions if no data is provided TODO this right?
    const channels = {};
    if (fx != null) channels.fx = createChannel(data, {value: fx, scale: "fx"});
    if (fy != null) channels.fy = createChannel(data, {value: fy, scale: "fy"});
    applyScaleTransforms(channels, options);
    return {channels, groups: facetGroups(data, channels)};
  }

  // This mark links to a top-level facet, if present.
  if (topFacetState === undefined) return;

  // TODO Can we link the top-level facet channels here?
  const {channels, groups, data} = topFacetState;
  if (mark.facet !== "auto" || mark.data === data) return {channels, groups};

  // Warn for the common pitfall of wanting to facet mapped data with the
  // top-level facet option.
  if (
    data.length > 0 &&
    (groups.size > 1 || (groups.size === 1 && channels.fx && channels.fy && [...groups][0][1].size > 1)) &&
    arrayify(mark.data)?.length === data.length
  ) {
    warn(
      `Warning: the ${mark.ariaLabel} mark appears to use faceted data, but isn’t faceted. The mark data has the same length as the facet data and the mark facet option is "auto", but the mark data and facet data are distinct. If this mark should be faceted, set the mark facet option to true; otherwise, suppress this warning by setting the mark facet option to false.`
    );
  }
}

function derive(mark, options = {}) {
  return initializer({...options, x: null, y: null}, (data, facets, channels, scales, dimensions, context) => {
    return context.getMarkState(mark);
  });
}

function inferTips(marks) {
  const tips = [];
  for (const mark of marks) {
    let tipOptions = mark.tip;
    if (tipOptions) {
      if (tipOptions === true) tipOptions = {};
      else if (typeof tipOptions === "string") tipOptions = {pointer: tipOptions};
      let {pointer: p, preferredAnchor: a} = tipOptions;
      p = /^x$/i.test(p) ? pointerX : /^y$/i.test(p) ? pointerY : pointer; // TODO validate?
      tipOptions = p(derive(mark, tipOptions));
      tipOptions.title = null; // prevent implicit title for primitive data
      if (a === undefined) tipOptions.preferredAnchor = p === pointerY ? "left" : "bottom";
      const t = tip(mark.data, tipOptions);
      t.facet = mark.facet; // inherit facet settings
      t.facetAnchor = mark.facetAnchor; // inherit facet settings
      tips.push(t);
    }
  }
  return tips;
}

function inferAxes(marks, channelsByScale, options) {
  let {
    projection,
    x = {},
    y = {},
    fx = {},
    fy = {},
    axis,
    grid,
    facet = {},
    facet: {axis: facetAxis = axis, grid: facetGrid} = facet,
    x: {axis: xAxis = axis, grid: xGrid = xAxis === null ? null : grid} = x,
    y: {axis: yAxis = axis, grid: yGrid = yAxis === null ? null : grid} = y,
    fx: {axis: fxAxis = facetAxis, grid: fxGrid = fxAxis === null ? null : facetGrid} = fx,
    fy: {axis: fyAxis = facetAxis, grid: fyGrid = fyAxis === null ? null : facetGrid} = fy
  } = options;

  // Disable axes if the corresponding scale is not present.
  if (projection || (!isScaleOptions(x) && !hasPositionChannel("x", marks))) xAxis = xGrid = null;
  if (projection || (!isScaleOptions(y) && !hasPositionChannel("y", marks))) yAxis = yGrid = null;
  if (!channelsByScale.has("fx")) fxAxis = fxGrid = null;
  if (!channelsByScale.has("fy")) fyAxis = fyGrid = null;

  // Resolve the default implicit axes by checking for explicit ones.
  if (xAxis === undefined) xAxis = !hasAxis(marks, "x");
  if (yAxis === undefined) yAxis = !hasAxis(marks, "y");
  if (fxAxis === undefined) fxAxis = !hasAxis(marks, "fx");
  if (fyAxis === undefined) fyAxis = !hasAxis(marks, "fy");

  // Resolve the default orientation of axes.
  if (xAxis === true) xAxis = "bottom";
  if (yAxis === true) yAxis = "left";
  if (fxAxis === true) fxAxis = xAxis === "top" || xAxis === null ? "bottom" : "top";
  if (fyAxis === true) fyAxis = yAxis === "right" || yAxis === null ? "left" : "right";

  const axes = [];
  maybeGrid(axes, fyGrid, gridFy, fy);
  maybeAxis(axes, fyAxis, axisFy, "right", "left", facet, fy);
  maybeGrid(axes, fxGrid, gridFx, fx);
  maybeAxis(axes, fxAxis, axisFx, "top", "bottom", facet, fx);
  maybeGrid(axes, yGrid, gridY, y);
  maybeAxis(axes, yAxis, axisY, "left", "right", options, y);
  maybeGrid(axes, xGrid, gridX, x);
  maybeAxis(axes, xAxis, axisX, "bottom", "top", options, x);
  return axes;
}

function maybeAxis(axes, axis, axisType, primary, secondary, defaults, options) {
  if (!axis) return;
  const both = isBoth(axis);
  options = axisOptions(both ? primary : axis, defaults, options);
  const {line} = options;
  if ((axisType === axisY || axisType === axisX) && line && !isNone(line)) axes.push(frame(lineOptions(options)));
  axes.push(axisType(options));
  if (both) axes.push(axisType({...options, anchor: secondary, label: null}));
}

function maybeGrid(axes, grid, gridType, options) {
  if (!grid || isNone(grid)) return;
  axes.push(gridType(gridOptions(grid, options)));
}

function isBoth(value) {
  return /^\s*both\s*$/i.test(value);
}

function axisOptions(
  anchor,
  defaults,
  {
    line = defaults.line,
    ticks,
    tickSize,
    tickSpacing,
    tickPadding,
    tickFormat,
    tickRotate,
    fontVariant,
    ariaLabel,
    ariaDescription,
    label = defaults.label,
    labelAnchor,
    labelArrow = defaults.labelArrow,
    labelOffset
  }
) {
  return {
    anchor,
    line,
    ticks,
    tickSize,
    tickSpacing,
    tickPadding,
    tickFormat,
    tickRotate,
    fontVariant,
    ariaLabel,
    ariaDescription,
    label,
    labelAnchor,
    labelArrow,
    labelOffset
  };
}

function lineOptions(options) {
  const {anchor, line} = options;
  return {anchor, facetAnchor: anchor + "-empty", stroke: line === true ? undefined : line};
}

function gridOptions(
  grid,
  {
    stroke = isColor(grid) ? grid : undefined,
    ticks = isGridTicks(grid) ? grid : undefined,
    tickSpacing,
    ariaLabel,
    ariaDescription
  }
) {
  return {
    stroke,
    ticks,
    tickSpacing,
    ariaLabel,
    ariaDescription
  };
}

function isGridTicks(grid) {
  switch (typeof grid) {
    case "number":
      return true;
    case "string":
      return !isColor(grid);
  }
  return isIterable(grid) || typeof grid?.range === "function";
}

// Is there an explicit axis already present? TODO We probably want a more
// explicit test than looking for the ARIA label, but it does afford some
// flexibility in axis implementation which is nice.
function hasAxis(marks, k) {
  const prefix = `${k}-axis `;
  return marks.some((m) => m.ariaLabel?.startsWith(prefix));
}

function hasPositionChannel(k, marks) {
  for (const mark of marks) {
    for (const key in mark.channels) {
      const {scale} = mark.channels[key];
      if (scale === k || scale === "projection") {
        return true;
      }
    }
  }
  return false;
}

function inheritScaleLabels(newScales, scales) {
  for (const key in newScales) {
    const newScale = newScales[key];
    const scale = scales[key];
    if (newScale.label === undefined && scale) {
      newScale.label = scale.label;
    }
  }
  return newScales;
}

// This differs from the other outerDimensions in that it accounts for rounding
// and outer padding in the facet scales; we want the frame to align exactly
// with the actual range, not the desired range.
function actualDimensions({fx, fy}, dimensions) {
  const {marginTop, marginRight, marginBottom, marginLeft, width, height} = outerDimensions(dimensions);
  const fxr = fx && outerRange(fx);
  const fyr = fy && outerRange(fy);
  return {
    marginTop: fy ? fyr[0] : marginTop,
    marginRight: fx ? width - fxr[1] : marginRight,
    marginBottom: fy ? height - fyr[1] : marginBottom,
    marginLeft: fx ? fxr[0] : marginLeft,
    // Some marks, namely the x- and y-axis labels, want to know what the
    // desired (rather than actual) margins are for positioning.
    inset: {
      marginTop: dimensions.marginTop,
      marginRight: dimensions.marginRight,
      marginBottom: dimensions.marginBottom,
      marginLeft: dimensions.marginLeft
    },
    width,
    height
  };
}

function outerRange(scale) {
  const domain = scale.domain();
  let x1 = scale(domain[0]);
  let x2 = scale(domain[domain.length - 1]);
  if (x2 < x1) [x1, x2] = [x2, x1];
  return [x1, x2 + scale.bandwidth()];
}

const curves = new Map([
  ["basis", d3.curveBasis],
  ["basis-closed", d3.curveBasisClosed],
  ["basis-open", d3.curveBasisOpen],
  ["bundle", d3.curveBundle],
  ["bump-x", d3.curveBumpX],
  ["bump-y", d3.curveBumpY],
  ["cardinal", d3.curveCardinal],
  ["cardinal-closed", d3.curveCardinalClosed],
  ["cardinal-open", d3.curveCardinalOpen],
  ["catmull-rom", d3.curveCatmullRom],
  ["catmull-rom-closed", d3.curveCatmullRomClosed],
  ["catmull-rom-open", d3.curveCatmullRomOpen],
  ["linear", d3.curveLinear],
  ["linear-closed", d3.curveLinearClosed],
  ["monotone-x", d3.curveMonotoneX],
  ["monotone-y", d3.curveMonotoneY],
  ["natural", d3.curveNatural],
  ["step", d3.curveStep],
  ["step-after", d3.curveStepAfter],
  ["step-before", d3.curveStepBefore]
]);

function maybeCurve(curve = d3.curveLinear, tension) {
  if (typeof curve === "function") return curve; // custom curve
  const c = curves.get(`${curve}`.toLowerCase());
  if (!c) throw new Error(`unknown curve: ${curve}`);
  if (tension !== undefined) {
    if ("beta" in c) {
      return c.beta(tension);
    } else if ("tension" in c) {
      return c.tension(tension);
    } else if ("alpha" in c) {
      return c.alpha(tension);
    }
  }
  return c;
}

// For the “auto” curve, return a symbol instead of a curve implementation;
// we’ll use d3.geoPath to render if there’s a projection.
function maybeCurveAuto(curve = curveAuto, tension) {
  return typeof curve !== "function" && `${curve}`.toLowerCase() === "auto" ? curveAuto : maybeCurve(curve, tension);
}

// This is a special built-in curve that will use d3.geoPath when there is a
// projection, and the linear curve when there is not. You can explicitly
// opt-out of d3.geoPath and instead use d3.line with the "linear" curve.
function curveAuto(context) {
  return d3.curveLinear(context);
}

// Group on {z, fill, stroke}, then optionally on y, then bin x.
function binX(outputs = {y: "count"}, options = {}) {
  [outputs, options] = mergeOptions$2(outputs, options);
  const {x, y} = options;
  return binn(maybeBinValue(x, options, identity$1), null, null, y, outputs, maybeInsetX(options));
}

// Group on {z, fill, stroke}, then optionally on x, then bin y.
function binY(outputs = {x: "count"}, options = {}) {
  [outputs, options] = mergeOptions$2(outputs, options);
  const {x, y} = options;
  return binn(null, maybeBinValue(y, options, identity$1), x, null, outputs, maybeInsetY(options));
}

// Group on {z, fill, stroke}, then bin on x and y.
function bin(outputs = {fill: "count"}, options = {}) {
  [outputs, options] = mergeOptions$2(outputs, options);
  const {x, y} = maybeBinValueTuple(options);
  return binn(x, y, null, null, outputs, maybeInsetX(maybeInsetY(options)));
}

function maybeDenseInterval(bin, k, options = {}) {
  if (options?.interval == null) return options;
  const {reduce = reduceFirst$1} = options;
  const outputs = {filter: null};
  if (options[k] != null) outputs[k] = reduce;
  if (options[`${k}1`] != null) outputs[`${k}1`] = reduce;
  if (options[`${k}2`] != null) outputs[`${k}2`] = reduce;
  return bin(outputs, options);
}

function maybeDenseIntervalX(options = {}) {
  return maybeDenseInterval(binX, "y", withTip(options, "x"));
}

function maybeDenseIntervalY(options = {}) {
  return maybeDenseInterval(binY, "x", withTip(options, "y"));
}

function binn(
  bx, // optionally bin on x (exclusive with gx)
  by, // optionally bin on y (exclusive with gy)
  gx, // optionally group on x (exclusive with bx and gy)
  gy, // optionally group on y (exclusive with by and gx)
  {
    data: reduceData = reduceIdentity, // TODO avoid materializing when unused?
    filter = reduceCount, // return only non-empty bins by default
    sort,
    reverse,
    ...outputs // output channel definitions
  } = {},
  inputs = {} // input channels and options
) {
  bx = maybeBin(bx);
  by = maybeBin(by);

  // Compute the outputs.
  outputs = maybeBinOutputs(outputs, inputs);
  reduceData = maybeBinReduce(reduceData, identity$1);
  sort = sort == null ? undefined : maybeBinOutput("sort", sort, inputs);
  filter = filter == null ? undefined : maybeBinEvaluator("filter", filter, inputs);

  // Don’t group on a channel if an output requires it as an input!
  if (gx != null && hasOutput(outputs, "x", "x1", "x2")) gx = null;
  if (gy != null && hasOutput(outputs, "y", "y1", "y2")) gy = null;

  // Produce x1, x2, y1, and y2 output channels as appropriate (when binning).
  const [BX1, setBX1] = maybeColumn(bx);
  const [BX2, setBX2] = maybeColumn(bx);
  const [BY1, setBY1] = maybeColumn(by);
  const [BY2, setBY2] = maybeColumn(by);

  // Produce x or y output channels as appropriate (when grouping).
  const [k, gk] = gx != null ? [gx, "x"] : gy != null ? [gy, "y"] : [];
  const [GK, setGK] = maybeColumn(k);

  // Greedily materialize the z, fill, and stroke channels (if channels and not
  // constants) so that we can reference them for subdividing groups without
  // computing them more than once. We also want to consume options that should
  // only apply to this transform rather than passing them through to the next.
  const {
    x,
    y,
    z,
    fill,
    stroke,
    x1,
    x2, // consumed if x is an output
    y1,
    y2, // consumed if y is an output
    domain,
    cumulative,
    thresholds,
    interval,
    ...options
  } = inputs;
  const [GZ, setGZ] = maybeColumn(z);
  const [vfill] = maybeColorChannel(fill);
  const [vstroke] = maybeColorChannel(stroke);
  const [GF, setGF] = maybeColumn(vfill);
  const [GS, setGS] = maybeColumn(vstroke);

  return {
    ...("z" in inputs && {z: GZ || z}),
    ...("fill" in inputs && {fill: GF || fill}),
    ...("stroke" in inputs && {stroke: GS || stroke}),
    ...basic(options, (data, facets, plotOptions) => {
      const K = maybeApplyInterval(valueof(data, k), plotOptions?.[gk]);
      const Z = valueof(data, z);
      const F = valueof(data, vfill);
      const S = valueof(data, vstroke);
      const G = maybeSubgroup(outputs, {z: Z, fill: F, stroke: S});
      const groupFacets = [];
      const groupData = [];
      const GK = K && setGK([]);
      const GZ = Z && setGZ([]);
      const GF = F && setGF([]);
      const GS = S && setGS([]);
      const BX1 = bx && setBX1([]);
      const BX2 = bx && setBX2([]);
      const BY1 = by && setBY1([]);
      const BY2 = by && setBY2([]);
      const bin = bing(bx, by, data);
      let i = 0;
      for (const o of outputs) o.initialize(data);
      if (sort) sort.initialize(data);
      if (filter) filter.initialize(data);
      for (const facet of facets) {
        const groupFacet = [];
        for (const o of outputs) o.scope("facet", facet);
        if (sort) sort.scope("facet", facet);
        if (filter) filter.scope("facet", facet);
        for (const [f, I] of maybeGroup(facet, G)) {
          for (const [k, g] of maybeGroup(I, K)) {
            for (const [b, extent] of bin(g)) {
              if (G) extent.z = f;
              if (filter && !filter.reduce(b, extent)) continue;
              groupFacet.push(i++);
              groupData.push(reduceData.reduceIndex(b, data, extent));
              if (K) GK.push(k);
              if (Z) GZ.push(G === Z ? f : Z[(b.length > 0 ? b : g)[0]]);
              if (F) GF.push(G === F ? f : F[(b.length > 0 ? b : g)[0]]);
              if (S) GS.push(G === S ? f : S[(b.length > 0 ? b : g)[0]]);
              if (BX1) BX1.push(extent.x1), BX2.push(extent.x2);
              if (BY1) BY1.push(extent.y1), BY2.push(extent.y2);
              for (const o of outputs) o.reduce(b, extent);
              if (sort) sort.reduce(b, extent);
            }
          }
        }
        groupFacets.push(groupFacet);
      }
      maybeSort(groupFacets, sort, reverse);
      return {data: groupData, facets: groupFacets};
    }),
    ...(!hasOutput(outputs, "x") && (BX1 ? {x1: BX1, x2: BX2, x: mid(BX1, BX2)} : {x, x1, x2})),
    ...(!hasOutput(outputs, "y") && (BY1 ? {y1: BY1, y2: BY2, y: mid(BY1, BY2)} : {y, y1, y2})),
    ...(GK && {[gk]: GK}),
    ...Object.fromEntries(outputs.map(({name, output}) => [name, output]))
  };
}

// Allow bin options to be specified as part of outputs; merge them into options.
function mergeOptions$2({cumulative, domain, thresholds, interval, ...outputs}, options) {
  return [outputs, {cumulative, domain, thresholds, interval, ...options}];
}

function maybeBinValue(value, {cumulative, domain, thresholds, interval}, defaultValue) {
  value = {...maybeValue(value)};
  if (value.domain === undefined) value.domain = domain;
  if (value.cumulative === undefined) value.cumulative = cumulative;
  if (value.thresholds === undefined) value.thresholds = thresholds;
  if (value.interval === undefined) value.interval = interval;
  if (value.value === undefined) value.value = defaultValue;
  value.thresholds = maybeThresholds(value.thresholds, value.interval);
  return value;
}

function maybeBinValueTuple(options) {
  let {x, y} = options;
  x = maybeBinValue(x, options);
  y = maybeBinValue(y, options);
  [x.value, y.value] = maybeTuple(x.value, y.value);
  return {x, y};
}

function maybeBin(options) {
  if (options == null) return;
  const {value, cumulative, domain = d3.extent, thresholds} = options;
  const bin = (data) => {
    let V = valueof(data, value);
    let T; // bin thresholds
    if (isTemporal(V) || isTimeThresholds(thresholds)) {
      V = map$1(V, coerceDate, Float64Array); // like coerceDates, but faster
      let [min, max] = typeof domain === "function" ? domain(V) : domain;
      let t = typeof thresholds === "function" && !isInterval(thresholds) ? thresholds(V, min, max) : thresholds;
      if (typeof t === "number") t = d3.utcTickInterval(min, max, t);
      if (isInterval(t)) {
        if (domain === d3.extent) {
          min = t.floor(min);
          max = t.offset(t.floor(max));
        }
        t = t.range(min, t.offset(max));
      }
      T = t;
    } else {
      V = coerceNumbers(V);
      let [min, max] = typeof domain === "function" ? domain(V) : domain;
      let t = typeof thresholds === "function" && !isInterval(thresholds) ? thresholds(V, min, max) : thresholds;
      if (typeof t === "number") {
        // This differs from d3.ticks with regard to exclusive bounds: we want a
        // first threshold less than or equal to the minimum, and a last
        // threshold (strictly) greater than the maximum.
        if (domain === d3.extent) {
          let step = d3.tickIncrement(min, max, t);
          if (isFinite(step)) {
            if (step > 0) {
              let r0 = Math.round(min / step);
              let r1 = Math.round(max / step);
              if (!(r0 * step <= min)) --r0;
              if (!(r1 * step > max)) ++r1;
              let n = r1 - r0 + 1;
              t = new Float64Array(n);
              for (let i = 0; i < n; ++i) t[i] = (r0 + i) * step;
            } else if (step < 0) {
              step = -step;
              let r0 = Math.round(min * step);
              let r1 = Math.round(max * step);
              if (!(r0 / step <= min)) --r0;
              if (!(r1 / step > max)) ++r1;
              let n = r1 - r0 + 1;
              t = new Float64Array(n);
              for (let i = 0; i < n; ++i) t[i] = (r0 + i) / step;
            } else {
              t = [min];
            }
          } else {
            t = [min];
          }
        } else {
          t = d3.ticks(min, max, t);
        }
      } else if (isInterval(t)) {
        if (domain === d3.extent) {
          min = t.floor(min);
          max = t.offset(t.floor(max));
        }
        t = t.range(min, t.offset(max));
      }
      T = t;
    }
    const E = [];
    if (T.length === 1) E.push([T[0], T[0]]); // collapsed domain
    else for (let i = 1; i < T.length; ++i) E.push([T[i - 1], T[i]]);
    E.bin = (cumulative < 0 ? bin1cn : cumulative > 0 ? bin1cp : bin1)(E, T, V);
    return E;
  };
  bin.label = labelof(value);
  return bin;
}

function maybeThresholds(thresholds, interval, defaultThresholds = thresholdAuto) {
  if (thresholds === undefined) {
    return interval === undefined ? defaultThresholds : maybeRangeInterval(interval);
  }
  if (typeof thresholds === "string") {
    switch (thresholds.toLowerCase()) {
      case "freedman-diaconis":
        return d3.thresholdFreedmanDiaconis;
      case "scott":
        return d3.thresholdScott;
      case "sturges":
        return d3.thresholdSturges;
      case "auto":
        return thresholdAuto;
    }
    return utcInterval(thresholds);
  }
  return thresholds; // pass array, count, or function to bin.thresholds
}

function maybeBinOutputs(outputs, inputs) {
  return maybeOutputs(outputs, inputs, maybeBinOutput);
}

function maybeBinOutput(name, reduce, inputs) {
  return maybeOutput(name, reduce, inputs, maybeBinEvaluator);
}

function maybeBinEvaluator(name, reduce, inputs) {
  return maybeEvaluator(name, reduce, inputs, maybeBinReduce);
}

function maybeBinReduce(reduce, value) {
  return maybeReduce$1(reduce, value, maybeBinReduceFallback);
}

function maybeBinReduceFallback(reduce) {
  switch (`${reduce}`.toLowerCase()) {
    case "x":
      return reduceX;
    case "x1":
      return reduceX1;
    case "x2":
      return reduceX2;
    case "y":
      return reduceY;
    case "y1":
      return reduceY1;
    case "y2":
      return reduceY2;
    case "z":
      return reduceZ;
  }
  throw new Error(`invalid bin reduce: ${reduce}`);
}

function thresholdAuto(values, min, max) {
  return Math.min(200, d3.thresholdScott(values, min, max));
}

function isTimeThresholds(t) {
  return isTimeInterval(t) || (isIterable(t) && isTemporal(t));
}

function bing(bx, by, data) {
  const EX = bx?.(data);
  const EY = by?.(data);
  return EX && EY
    ? function* (I) {
        const X = EX.bin(I); // first bin on x
        for (const [ix, [x1, x2]] of EX.entries()) {
          const Y = EY.bin(X[ix]); // then bin on y
          for (const [iy, [y1, y2]] of EY.entries()) {
            yield [Y[iy], {data, x1, y1, x2, y2}];
          }
        }
      }
    : EX
    ? function* (I) {
        const X = EX.bin(I);
        for (const [i, [x1, x2]] of EX.entries()) {
          yield [X[i], {data, x1, x2}];
        }
      }
    : function* (I) {
        const Y = EY.bin(I);
        for (const [i, [y1, y2]] of EY.entries()) {
          yield [Y[i], {data, y1, y2}];
        }
      };
}

// non-cumulative distribution
function bin1(E, T, V) {
  T = coerceNumbers(T); // for faster bisection
  return (I) => {
    const B = E.map(() => []);
    for (const i of I) B[d3.bisect(T, V[i]) - 1]?.push(i); // TODO quantization?
    return B;
  };
}

// cumulative distribution
function bin1cp(E, T, V) {
  const bin = bin1(E, T, V);
  return (I) => {
    const B = bin(I);
    for (let i = 1, n = B.length; i < n; ++i) {
      const C = B[i - 1];
      const b = B[i];
      for (const j of C) b.push(j);
    }
    return B;
  };
}

// complementary cumulative distribution
function bin1cn(E, T, V) {
  const bin = bin1(E, T, V);
  return (I) => {
    const B = bin(I);
    for (let i = B.length - 2; i >= 0; --i) {
      const C = B[i + 1];
      const b = B[i];
      for (const j of C) b.push(j);
    }
    return B;
  };
}

function mid1(x1, x2) {
  const m = (+x1 + +x2) / 2;
  return x1 instanceof Date ? new Date(m) : m;
}

const reduceX = {
  reduceIndex(I, X, {x1, x2}) {
    return mid1(x1, x2);
  }
};

const reduceY = {
  reduceIndex(I, X, {y1, y2}) {
    return mid1(y1, y2);
  }
};

const reduceX1 = {
  reduceIndex(I, X, {x1}) {
    return x1;
  }
};

const reduceX2 = {
  reduceIndex(I, X, {x2}) {
    return x2;
  }
};

const reduceY1 = {
  reduceIndex(I, X, {y1}) {
    return y1;
  }
};

const reduceY2 = {
  reduceIndex(I, X, {y2}) {
    return y2;
  }
};

function maybeIdentityX(options = {}) {
  return hasX(options) ? options : {...options, x: identity$1};
}

function maybeIdentityY(options = {}) {
  return hasY(options) ? options : {...options, y: identity$1};
}

function exclusiveFacets(data, facets) {
  if (facets.length === 1) return {data, facets}; // only one facet; trivially exclusive

  const n = data.length;
  const O = new Uint8Array(n);
  let overlaps = 0;

  // Count the number of overlapping indexes across facets.
  for (const facet of facets) {
    for (const i of facet) {
      if (O[i]) ++overlaps;
      O[i] = 1;
    }
  }

  // Do nothing if the facets are already exclusive.
  if (overlaps === 0) return {data, facets}; // facets are exclusive

  // For each overlapping index (duplicate), assign a new unique index at the
  // end of the existing array, duplicating the datum. For example, [[0, 1, 2],
  // [2, 1, 3]] would become [[0, 1, 2], [4, 5, 3]]. Also attach a reindex to
  // the data to preserve the association of channel values specified as arrays.
  data = slice(data);
  const R = (data[reindex] = new Uint32Array(n + overlaps));
  facets = facets.map((facet) => slice(facet, Uint32Array));
  let j = n;
  O.fill(0);
  for (const facet of facets) {
    for (let k = 0, m = facet.length; k < m; ++k) {
      const i = facet[k];
      if (O[i]) (facet[k] = j), (data[j] = data[i]), (R[j] = i), ++j;
      else R[i] = i;
      O[i] = 1;
    }
  }

  return {data, facets};
}

function stackX(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$1(stackOptions);
  const {y1, y = y1, x, ...rest} = options; // note: consumes x!
  const [transform, Y, x1, x2] = stack(y, x, "y", "x", stackOptions, rest);
  return {...transform, y1, y: Y, x1, x2, x: mid(x1, x2)};
}

function stackX1(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$1(stackOptions);
  const {y1, y = y1, x} = options;
  const [transform, Y, X] = stack(y, x, "y", "x", stackOptions, options);
  return {...transform, y1, y: Y, x: X};
}

function stackX2(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$1(stackOptions);
  const {y1, y = y1, x} = options;
  const [transform, Y, , X] = stack(y, x, "y", "x", stackOptions, options);
  return {...transform, y1, y: Y, x: X};
}

function stackY(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$1(stackOptions);
  const {x1, x = x1, y, ...rest} = options; // note: consumes y!
  const [transform, X, y1, y2] = stack(x, y, "x", "y", stackOptions, rest);
  return {...transform, x1, x: X, y1, y2, y: mid(y1, y2)};
}

function stackY1(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$1(stackOptions);
  const {x1, x = x1, y} = options;
  const [transform, X, Y] = stack(x, y, "x", "y", stackOptions, options);
  return {...transform, x1, x: X, y: Y};
}

function stackY2(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$1(stackOptions);
  const {x1, x = x1, y} = options;
  const [transform, X, , Y] = stack(x, y, "x", "y", stackOptions, options);
  return {...transform, x1, x: X, y: Y};
}

function maybeStackX({x, x1, x2, ...options} = {}) {
  options = withTip(options, "y");
  if (x1 === undefined && x2 === undefined) return stackX({x, ...options});
  [x1, x2] = maybeZero(x, x1, x2);
  return {...options, x1, x2};
}

function maybeStackY({y, y1, y2, ...options} = {}) {
  options = withTip(options, "x");
  if (y1 === undefined && y2 === undefined) return stackY({y, ...options});
  [y1, y2] = maybeZero(y, y1, y2);
  return {...options, y1, y2};
}

// The reverse option is ambiguous: it is both a stack option and a basic
// transform. If only one options object is specified, we interpret it as a
// stack option, and therefore must remove it from the propagated options.
function mergeOptions$1(options) {
  const {offset, order, reverse, ...rest} = options;
  return [{offset, order, reverse}, rest];
}

// This is a hint to the tooltip mark that the y1 and y2 channels (for stackY,
// or conversely x1 and x2 for stackX) represent a stacked length, and that the
// tooltip should therefore show y2-y1 instead of an extent.
const lengthy = {length: true};

function stack(x, y = one, kx, ky, {offset, order, reverse}, options) {
  if (y === null) throw new Error(`stack requires ${ky}`);
  const z = maybeZ(options);
  const [X, setX] = maybeColumn(x);
  const [Y1, setY1] = column(y);
  const [Y2, setY2] = column(y);
  Y1.hint = Y2.hint = lengthy;
  offset = maybeOffset(offset);
  order = maybeOrder(order, offset, ky);
  return [
    basic(options, (data, facets, plotOptions) => {
      ({data, facets} = exclusiveFacets(data, facets));
      const X = x == null ? undefined : setX(maybeApplyInterval(valueof(data, x), plotOptions?.[kx]));
      const Y = valueof(data, y, Float64Array);
      const Z = valueof(data, z);
      const compare = order && order(data, X, Y, Z);
      const n = data.length;
      const Y1 = setY1(new Float64Array(n));
      const Y2 = setY2(new Float64Array(n));
      const facetstacks = [];
      for (const facet of facets) {
        const stacks = X ? Array.from(d3.group(facet, (i) => X[i]).values()) : [facet];
        if (compare) for (const stack of stacks) stack.sort(compare);
        for (const stack of stacks) {
          let yn = 0;
          let yp = 0;
          if (reverse) stack.reverse();
          for (const i of stack) {
            const y = Y[i];
            if (y < 0) yn = Y2[i] = (Y1[i] = yn) + y;
            else if (y > 0) yp = Y2[i] = (Y1[i] = yp) + y;
            else Y2[i] = Y1[i] = yp; // NaN or zero
          }
        }
        facetstacks.push(stacks);
      }
      if (offset) offset(facetstacks, Y1, Y2, Z);
      return {data, facets};
    }),
    X,
    Y1,
    Y2
  ];
}

function maybeOffset(offset) {
  if (offset == null) return;
  if (typeof offset === "function") return offset;
  switch (`${offset}`.toLowerCase()) {
    case "expand":
    case "normalize":
      return offsetExpand;
    case "center":
    case "silhouette":
      return offsetCenter;
    case "wiggle":
      return offsetWiggle;
  }
  throw new Error(`unknown offset: ${offset}`);
}

// Given a single stack, returns the minimum and maximum values from the given
// Y2 column. Note that this relies on Y2 always being the outer column for
// diverging values.
function extent(stack, Y2) {
  let min = 0,
    max = 0;
  for (const i of stack) {
    const y = Y2[i];
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return [min, max];
}

function offsetExpand(facetstacks, Y1, Y2) {
  for (const stacks of facetstacks) {
    for (const stack of stacks) {
      const [yn, yp] = extent(stack, Y2);
      for (const i of stack) {
        const m = 1 / (yp - yn || 1);
        Y1[i] = m * (Y1[i] - yn);
        Y2[i] = m * (Y2[i] - yn);
      }
    }
  }
}

function offsetCenter(facetstacks, Y1, Y2) {
  for (const stacks of facetstacks) {
    for (const stack of stacks) {
      const [yn, yp] = extent(stack, Y2);
      for (const i of stack) {
        const m = (yp + yn) / 2;
        Y1[i] -= m;
        Y2[i] -= m;
      }
    }
    offsetZero(stacks, Y1, Y2);
  }
  offsetCenterFacets(facetstacks, Y1, Y2);
}

function offsetWiggle(facetstacks, Y1, Y2, Z) {
  for (const stacks of facetstacks) {
    const prev = new d3.InternMap();
    let y = 0;
    for (const stack of stacks) {
      let j = -1;
      const Fi = stack.map((i) => Math.abs(Y2[i] - Y1[i]));
      const Df = stack.map((i) => {
        j = Z ? Z[i] : ++j;
        const value = Y2[i] - Y1[i];
        const diff = prev.has(j) ? value - prev.get(j) : 0;
        prev.set(j, value);
        return diff;
      });
      const Cf1 = [0, ...d3.cumsum(Df)];
      for (const i of stack) {
        Y1[i] += y;
        Y2[i] += y;
      }
      const s1 = d3.sum(Fi);
      if (s1) y -= d3.sum(Fi, (d, i) => (Df[i] / 2 + Cf1[i]) * d) / s1;
    }
    offsetZero(stacks, Y1, Y2);
  }
  offsetCenterFacets(facetstacks, Y1, Y2);
}

function offsetZero(stacks, Y1, Y2) {
  const m = d3.min(stacks, (stack) => d3.min(stack, (i) => Y1[i]));
  for (const stack of stacks) {
    for (const i of stack) {
      Y1[i] -= m;
      Y2[i] -= m;
    }
  }
}

function offsetCenterFacets(facetstacks, Y1, Y2) {
  const n = facetstacks.length;
  if (n === 1) return;
  const facets = facetstacks.map((stacks) => stacks.flat());
  const m = facets.map((I) => (d3.min(I, (i) => Y1[i]) + d3.max(I, (i) => Y2[i])) / 2);
  const m0 = d3.min(m);
  for (let j = 0; j < n; j++) {
    const p = m0 - m[j];
    for (const i of facets[j]) {
      Y1[i] += p;
      Y2[i] += p;
    }
  }
}

function maybeOrder(order, offset, ky) {
  if (order === undefined && offset === offsetWiggle) return orderInsideOut(ascendingDefined);
  if (order == null) return;
  if (typeof order === "string") {
    const negate = order.startsWith("-");
    const compare = negate ? descendingDefined : ascendingDefined;
    switch ((negate ? order.slice(1) : order).toLowerCase()) {
      case "value":
      case ky:
        return orderY(compare);
      case "z":
        return orderZ(compare);
      case "sum":
        return orderSum(compare);
      case "appearance":
        return orderAppearance(compare);
      case "inside-out":
        return orderInsideOut(compare);
    }
    return orderAccessor(field(order));
  }
  if (typeof order === "function") return (order.length === 1 ? orderAccessor : orderComparator)(order);
  if (Array.isArray(order)) return orderGiven(order);
  throw new Error(`invalid order: ${order}`);
}

// by value
function orderY(compare) {
  return (data, X, Y) => (i, j) => compare(Y[i], Y[j]);
}

// by location
function orderZ(compare) {
  return (data, X, Y, Z) => (i, j) => compare(Z[i], Z[j]);
}

// by sum of value (a.k.a. “ascending”)
function orderSum(compare) {
  return orderZDomain(compare, (data, X, Y, Z) =>
    d3.groupSort(
      range(data),
      (I) => d3.sum(I, (i) => Y[i]),
      (i) => Z[i]
    )
  );
}

// by x = argmax of value
function orderAppearance(compare) {
  return orderZDomain(compare, (data, X, Y, Z) =>
    d3.groupSort(
      range(data),
      (I) => X[d3.greatest(I, (i) => Y[i])],
      (i) => Z[i]
    )
  );
}

// by x = argmax of value, but rearranged inside-out by alternating series
// according to the sign of a running divergence of sums
function orderInsideOut(compare) {
  return orderZDomain(compare, (data, X, Y, Z) => {
    const I = range(data);
    const K = d3.groupSort(
      I,
      (I) => X[d3.greatest(I, (i) => Y[i])],
      (i) => Z[i]
    );
    const sums = d3.rollup(
      I,
      (I) => d3.sum(I, (i) => Y[i]),
      (i) => Z[i]
    );
    const Kp = [],
      Kn = [];
    let s = 0;
    for (const k of K) {
      if (s < 0) {
        s += sums.get(k);
        Kp.push(k);
      } else {
        s -= sums.get(k);
        Kn.push(k);
      }
    }
    return Kn.reverse().concat(Kp);
  });
}

function orderAccessor(f) {
  return (data) => {
    const O = valueof(data, f);
    return (i, j) => ascendingDefined(O[i], O[j]);
  };
}

function orderComparator(f) {
  return (data) => (i, j) => f(data[i], data[j]);
}

function orderGiven(domain) {
  return orderZDomain(ascendingDefined, () => domain);
}

// Given an ordering (domain) of distinct values in z that can be derived from
// the data, returns a comparator that can be used to sort stacks. Note that
// this is a series order: it will be consistent across stacks.
function orderZDomain(compare, domain) {
  return (data, X, Y, Z) => {
    if (!Z) throw new Error("missing channel: z");
    const map = new d3.InternMap(domain(data, X, Y, Z).map((d, i) => [d, i]));
    return (i, j) => compare(map.get(Z[i]), map.get(Z[j]));
  };
}

const defaults$g = {
  ariaLabel: "area",
  strokeWidth: 1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};

class Area extends Mark {
  constructor(data, options = {}) {
    const {x1, y1, x2, y2, z, curve, tension} = options;
    super(
      data,
      {
        x1: {value: x1, scale: "x"},
        y1: {value: y1, scale: "y"},
        x2: {value: x2, scale: "x", optional: true},
        y2: {value: y2, scale: "y", optional: true},
        z: {value: maybeZ(options), optional: true}
      },
      options,
      defaults$g
    );
    this.z = z;
    this.curve = maybeCurve(curve, tension);
  }
  filter(index) {
    return index;
  }
  render(index, scales, channels, dimensions, context) {
    const {x1: X1, y1: Y1, x2: X2 = X1, y2: Y2 = Y1} = channels;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales, 0, 0)
      .call((g) =>
        g
          .selectAll()
          .data(groupIndex(index, [X1, Y1, X2, Y2], this, channels))
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .call(applyGroupedChannelStyles, this, channels)
          .attr(
            "d",
            d3.area()
              .curve(this.curve)
              .defined((i) => i >= 0)
              .x0((i) => X1[i])
              .y0((i) => Y1[i])
              .x1((i) => X2[i])
              .y1((i) => Y2[i])
          )
      )
      .node();
  }
}

function area(data, options) {
  if (options === undefined) return areaY(data, {x: first, y: second});
  return new Area(data, options);
}

function areaX(data, options) {
  const {y = indexOf, ...rest} = maybeDenseIntervalY(options);
  return new Area(data, maybeStackX(maybeIdentityX({...rest, y1: y, y2: undefined})));
}

function areaY(data, options) {
  const {x = indexOf, ...rest} = maybeDenseIntervalX(options);
  return new Area(data, maybeStackY(maybeIdentityY({...rest, x1: x, x2: undefined})));
}

const defaults$f = {
  ariaLabel: "link",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};

class Link extends Mark {
  constructor(data, options = {}) {
    const {x1, y1, x2, y2, curve, tension} = options;
    super(
      data,
      {
        x1: {value: x1, scale: "x"},
        y1: {value: y1, scale: "y"},
        x2: {value: x2, scale: "x", optional: true},
        y2: {value: y2, scale: "y", optional: true}
      },
      options,
      defaults$f
    );
    this.curve = maybeCurveAuto(curve, tension);
    markers(this, options);
  }
  project(channels, values, context) {
    // For the auto curve, projection is handled at render.
    if (this.curve !== curveAuto) {
      super.project(channels, values, context);
    }
  }
  render(index, scales, channels, dimensions, context) {
    const {x1: X1, y1: Y1, x2: X2 = X1, y2: Y2 = Y1} = channels;
    const {curve} = this;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .attr(
            "d",
            curve === curveAuto && context.projection
              ? sphereLink(context.projection, X1, Y1, X2, Y2)
              : (i) => {
                  const p = d3.pathRound();
                  const c = curve(p);
                  c.lineStart();
                  c.point(X1[i], Y1[i]);
                  c.point(X2[i], Y2[i]);
                  c.lineEnd();
                  return p;
                }
          )
          .call(applyChannelStyles, this, channels)
          .call(applyMarkers, this, channels, context)
      )
      .node();
  }
}

function sphereLink(projection, X1, Y1, X2, Y2) {
  const path = d3.geoPath(projection);
  X1 = coerceNumbers(X1);
  Y1 = coerceNumbers(Y1);
  X2 = coerceNumbers(X2);
  Y2 = coerceNumbers(Y2);
  return (i) =>
    path({
      type: "LineString",
      coordinates: [
        [X1[i], Y1[i]],
        [X2[i], Y2[i]]
      ]
    });
}

function link(data, {x, x1, x2, y, y1, y2, ...options} = {}) {
  [x1, x2] = maybeSameValue(x, x1, x2);
  [y1, y2] = maybeSameValue(y, y1, y2);
  return new Link(data, {...options, x1, x2, y1, y2});
}

// If x1 and x2 are specified, return them as {x1, x2}.
// If x and x1 and specified, or x and x2 are specified, return them as {x1, x2}.
// If only x, x1, or x2 are specified, return it as {x1}.
function maybeSameValue(x, x1, x2) {
  if (x === undefined) {
    if (x1 === undefined) {
      if (x2 !== undefined) return [x2];
    } else {
      if (x2 === undefined) return [x1];
    }
  } else if (x1 === undefined) {
    return x2 === undefined ? [x] : [x, x2];
  } else if (x2 === undefined) {
    return [x, x1];
  }
  return [x1, x2];
}

const defaults$e = {
  ariaLabel: "arrow",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeMiterlimit: 1,
  strokeWidth: 1.5
};

class Arrow extends Mark {
  constructor(data, options = {}) {
    const {
      x1,
      y1,
      x2,
      y2,
      bend = 0,
      headAngle = 60,
      headLength = 8, // Disable the arrow with headLength = 0; or, use Plot.link.
      inset = 0,
      insetStart = inset,
      insetEnd = inset,
      sweep
    } = options;
    super(
      data,
      {
        x1: {value: x1, scale: "x"},
        y1: {value: y1, scale: "y"},
        x2: {value: x2, scale: "x", optional: true},
        y2: {value: y2, scale: "y", optional: true}
      },
      options,
      defaults$e
    );
    this.bend = bend === true ? 22.5 : Math.max(-90, Math.min(90, bend));
    this.headAngle = +headAngle;
    this.headLength = +headLength;
    this.insetStart = +insetStart;
    this.insetEnd = +insetEnd;
    this.sweep = maybeSweep(sweep);
  }
  render(index, scales, channels, dimensions, context) {
    const {x1: X1, y1: Y1, x2: X2 = X1, y2: Y2 = Y1, SW} = channels;
    const {strokeWidth, bend, headAngle, headLength, insetStart, insetEnd} = this;
    const sw = SW ? (i) => SW[i] : constant(strokeWidth === undefined ? 1 : strokeWidth);

    // The angle between the arrow’s shaft and one of the wings; the “head”
    // angle between the wings is twice this value.
    const wingAngle = (headAngle * radians) / 2;

    // The length of the arrowhead’s “wings” (the line segments that extend from
    // the end point) relative to the stroke width.
    const wingScale = headLength / 1.5;

    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .attr("d", (i) => {
            // The start ⟨x1,y1⟩ and end ⟨x2,y2⟩ points may be inset, and the
            // ending line angle may be altered for inset swoopy arrows.
            let x1 = X1[i],
              y1 = Y1[i],
              x2 = X2[i],
              y2 = Y2[i];
            const lineLength = Math.hypot(x2 - x1, y2 - y1);
            if (lineLength <= insetStart + insetEnd) return null;
            let lineAngle = Math.atan2(y2 - y1, x2 - x1);

            // We don’t allow the wing length to be too large relative to the
            // length of the arrow. (Plot.vector allows arbitrarily large
            // wings, but that’s okay since vectors are usually small.)
            const headLength = Math.min(wingScale * sw(i), lineLength / 3);

            // When bending, the offset between the straight line between the two points
            // and the outgoing tangent from the start point. (Also the negative
            // incoming tangent to the end point.) This must be within ±π/2. A positive
            // angle will produce a clockwise curve; a negative angle will produce a
            // counterclockwise curve; zero will produce a straight line.
            const bendAngle = this.sweep(x1, y1, x2, y2) * bend * radians;

            // The radius of the circle that intersects with the two endpoints
            // and has the specified bend angle.
            const r = Math.hypot(lineLength / Math.tan(bendAngle), lineLength) / 2;

            // Apply insets.
            if (insetStart || insetEnd) {
              if (r < 1e5) {
                // For inset swoopy arrows, compute the circle-circle
                // intersection between a circle centered around the
                // respective arrow endpoint and the center of the circle
                // segment that forms the shaft of the arrow.
                const sign = Math.sign(bendAngle);
                const [cx, cy] = pointPointCenter([x1, y1], [x2, y2], r, sign);
                if (insetStart) {
                  [x1, y1] = circleCircleIntersect([cx, cy, r], [x1, y1, insetStart], -sign * Math.sign(insetStart));
                }
                // For the end inset, rotate the arrowhead so that it aligns
                // with the truncated end of the arrow. Since the arrow is a
                // segment of the circle centered at ⟨cx,cy⟩, we can compute
                // the angular difference to the new endpoint.
                if (insetEnd) {
                  const [x, y] = circleCircleIntersect([cx, cy, r], [x2, y2, insetEnd], sign * Math.sign(insetEnd));
                  lineAngle += Math.atan2(y - cy, x - cx) - Math.atan2(y2 - cy, x2 - cx);
                  (x2 = x), (y2 = y);
                }
              } else {
                // For inset straight arrows, offset along the straight line.
                const dx = x2 - x1,
                  dy = y2 - y1,
                  d = Math.hypot(dx, dy);
                if (insetStart) (x1 += (dx / d) * insetStart), (y1 += (dy / d) * insetStart);
                if (insetEnd) (x2 -= (dx / d) * insetEnd), (y2 -= (dy / d) * insetEnd);
              }
            }

            // The angle of the arrow as it approaches the endpoint, and the
            // angles of the adjacent wings. Here “left” refers to if the
            // arrow is pointing up.
            const endAngle = lineAngle + bendAngle;
            const leftAngle = endAngle + wingAngle;
            const rightAngle = endAngle - wingAngle;

            // The endpoints of the two wings.
            const x3 = x2 - headLength * Math.cos(leftAngle);
            const y3 = y2 - headLength * Math.sin(leftAngle);
            const x4 = x2 - headLength * Math.cos(rightAngle);
            const y4 = y2 - headLength * Math.sin(rightAngle);

            // If the radius is very large (or even infinite, as when the bend
            // angle is zero), then render a straight line.
            const a = r < 1e5 ? `A${r},${r} 0,0,${bendAngle > 0 ? 1 : 0} ` : `L`;
            const h = headLength ? `M${x3},${y3}L${x2},${y2}L${x4},${y4}` : "";
            return `M${x1},${y1}${a}${x2},${y2}${h}`;
          })
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
}

// Maybe flip the bend angle, depending on the arrow orientation.
function maybeSweep(sweep = 1) {
  if (typeof sweep === "number") return constant(Math.sign(sweep));
  if (typeof sweep === "function") return (x1, y1, x2, y2) => Math.sign(sweep(x1, y1, x2, y2));
  switch (keyword(sweep, "sweep", ["+x", "-x", "+y", "-y"])) {
    case "+x":
      return (x1, y1, x2) => d3.ascending(x1, x2);
    case "-x":
      return (x1, y1, x2) => d3.descending(x1, x2);
    case "+y":
      return (x1, y1, x2, y2) => d3.ascending(y1, y2);
    case "-y":
      return (x1, y1, x2, y2) => d3.descending(y1, y2);
  }
}

// Returns the center of a circle that goes through the two given points ⟨ax,ay⟩
// and ⟨bx,by⟩ and has radius r. There are two such points; use the sign +1 or
// -1 to choose between them. Returns [NaN, NaN] if r is too small.
function pointPointCenter([ax, ay], [bx, by], r, sign) {
  const dx = bx - ax,
    dy = by - ay,
    d = Math.hypot(dx, dy);
  const k = (sign * Math.sqrt(r * r - (d * d) / 4)) / d;
  return [(ax + bx) / 2 - dy * k, (ay + by) / 2 + dx * k];
}

// Given two circles, one centered at ⟨ax,ay⟩ with radius ar, and the other
// centered at ⟨bx,by⟩ with radius br, returns a point at which the two circles
// intersect. There are typically two such points; use the sign +1 or -1 to
// chose between them. Returns [NaN, NaN] if there is no intersection.
// https://mathworld.wolfram.com/Circle-CircleIntersection.html
function circleCircleIntersect([ax, ay, ar], [bx, by, br], sign) {
  const dx = bx - ax,
    dy = by - ay,
    d = Math.hypot(dx, dy);
  const x = (dx * dx + dy * dy - br * br + ar * ar) / (2 * d);
  const y = sign * Math.sqrt(ar * ar - x * x);
  return [ax + (dx * x + dy * y) / d, ay + (dy * x - dx * y) / d];
}

function arrow(data, {x, x1, x2, y, y1, y2, ...options} = {}) {
  [x1, x2] = maybeSameValue(x, x1, x2);
  [y1, y2] = maybeSameValue(y, y1, y2);
  return new Arrow(data, {...options, x1, x2, y1, y2});
}

class AbstractBar extends Mark {
  constructor(data, channels, options = {}, defaults) {
    super(data, channels, options, defaults);
    const {inset = 0, insetTop = inset, insetRight = inset, insetBottom = inset, insetLeft = inset, rx, ry} = options;
    this.insetTop = number$1(insetTop);
    this.insetRight = number$1(insetRight);
    this.insetBottom = number$1(insetBottom);
    this.insetLeft = number$1(insetLeft);
    this.rx = impliedString(rx, "auto"); // number or percentage
    this.ry = impliedString(ry, "auto");
  }
  render(index, scales, channels, dimensions, context) {
    const {rx, ry} = this;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(this._transform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("rect")
          .call(applyDirectStyles, this)
          .attr("x", this._x(scales, channels, dimensions))
          .attr("width", this._width(scales, channels, dimensions))
          .attr("y", this._y(scales, channels, dimensions))
          .attr("height", this._height(scales, channels, dimensions))
          .call(applyAttr, "rx", rx)
          .call(applyAttr, "ry", ry)
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
  _x(scales, {x: X}, {marginLeft}) {
    const {insetLeft} = this;
    return X ? (i) => X[i] + insetLeft : marginLeft + insetLeft;
  }
  _y(scales, {y: Y}, {marginTop}) {
    const {insetTop} = this;
    return Y ? (i) => Y[i] + insetTop : marginTop + insetTop;
  }
  _width({x}, {x: X}, {marginRight, marginLeft, width}) {
    const {insetLeft, insetRight} = this;
    const bandwidth = X && x ? x.bandwidth() : width - marginRight - marginLeft;
    return Math.max(0, bandwidth - insetLeft - insetRight);
  }
  _height({y}, {y: Y}, {marginTop, marginBottom, height}) {
    const {insetTop, insetBottom} = this;
    const bandwidth = Y && y ? y.bandwidth() : height - marginTop - marginBottom;
    return Math.max(0, bandwidth - insetTop - insetBottom);
  }
}

const defaults$d = {
  ariaLabel: "bar"
};

class BarX extends AbstractBar {
  constructor(data, options = {}) {
    const {x1, x2, y} = options;
    super(
      data,
      {
        x1: {value: x1, scale: "x"},
        x2: {value: x2, scale: "x"},
        y: {value: y, scale: "y", type: "band", optional: true}
      },
      options,
      defaults$d
    );
  }
  _transform(selection, mark, {x}) {
    selection.call(applyTransform, mark, {x}, 0, 0);
  }
  _x({x}, {x1: X1, x2: X2}, {marginLeft}) {
    const {insetLeft} = this;
    return isCollapsed(x) ? marginLeft + insetLeft : (i) => Math.min(X1[i], X2[i]) + insetLeft;
  }
  _width({x}, {x1: X1, x2: X2}, {marginRight, marginLeft, width}) {
    const {insetLeft, insetRight} = this;
    return isCollapsed(x)
      ? width - marginRight - marginLeft - insetLeft - insetRight
      : (i) => Math.max(0, Math.abs(X2[i] - X1[i]) - insetLeft - insetRight);
  }
}

class BarY extends AbstractBar {
  constructor(data, options = {}) {
    const {x, y1, y2} = options;
    super(
      data,
      {
        y1: {value: y1, scale: "y"},
        y2: {value: y2, scale: "y"},
        x: {value: x, scale: "x", type: "band", optional: true}
      },
      options,
      defaults$d
    );
  }
  _transform(selection, mark, {y}) {
    selection.call(applyTransform, mark, {y}, 0, 0);
  }
  _y({y}, {y1: Y1, y2: Y2}, {marginTop}) {
    const {insetTop} = this;
    return isCollapsed(y) ? marginTop + insetTop : (i) => Math.min(Y1[i], Y2[i]) + insetTop;
  }
  _height({y}, {y1: Y1, y2: Y2}, {marginTop, marginBottom, height}) {
    const {insetTop, insetBottom} = this;
    return isCollapsed(y)
      ? height - marginTop - marginBottom - insetTop - insetBottom
      : (i) => Math.max(0, Math.abs(Y2[i] - Y1[i]) - insetTop - insetBottom);
  }
}

function barX(data, options = {}) {
  if (!hasXY(options)) options = {...options, y: indexOf, x2: identity$1};
  return new BarX(data, maybeStackX(maybeIntervalX(maybeIdentityX(options))));
}

function barY(data, options = {}) {
  if (!hasXY(options)) options = {...options, x: indexOf, y2: identity$1};
  return new BarY(data, maybeStackY(maybeIntervalY(maybeIdentityY(options))));
}

const defaults$c = {
  ariaLabel: "cell"
};

class Cell extends AbstractBar {
  constructor(data, {x, y, ...options} = {}) {
    super(
      data,
      {
        x: {value: x, scale: "x", type: "band", optional: true},
        y: {value: y, scale: "y", type: "band", optional: true}
      },
      options,
      defaults$c
    );
  }
  _transform(selection, mark) {
    // apply dx, dy
    selection.call(applyTransform, mark, {}, 0, 0);
  }
}

function cell(data, {x, y, ...options} = {}) {
  [x, y] = maybeTuple(x, y);
  return new Cell(data, {...options, x, y});
}

function cellX(data, {x = indexOf, fill, stroke, ...options} = {}) {
  if (fill === undefined && maybeColorChannel(stroke)[0] === undefined) fill = identity$1;
  return new Cell(data, {...options, x, fill, stroke});
}

function cellY(data, {y = indexOf, fill, stroke, ...options} = {}) {
  if (fill === undefined && maybeColorChannel(stroke)[0] === undefined) fill = identity$1;
  return new Cell(data, {...options, y, fill, stroke});
}

const defaults$b = {
  ariaLabel: "dot",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5
};

function withDefaultSort(options) {
  return options.sort === undefined && options.reverse === undefined ? sort({channel: "-r"}, options) : options;
}

class Dot extends Mark {
  constructor(data, options = {}) {
    const {x, y, r, rotate, symbol = d3.symbolCircle, frameAnchor} = options;
    const [vrotate, crotate] = maybeNumberChannel(rotate, 0);
    const [vsymbol, csymbol] = maybeSymbolChannel(symbol);
    const [vr, cr] = maybeNumberChannel(r, vsymbol == null ? 3 : 4.5);
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        r: {value: vr, scale: "r", filter: positive, optional: true},
        rotate: {value: vrotate, optional: true},
        symbol: {value: vsymbol, scale: "auto", optional: true}
      },
      withDefaultSort(options),
      defaults$b
    );
    this.r = cr;
    this.rotate = crotate;
    this.symbol = csymbol;
    this.frameAnchor = maybeFrameAnchor(frameAnchor);

    // Give a hint to the symbol scale; this allows the symbol scale to choose
    // appropriate default symbols based on whether the dots are filled or
    // stroked, and for the symbol legend to match the appearance of the dots.
    const {channels} = this;
    const {symbol: symbolChannel} = channels;
    if (symbolChannel) {
      const {fill: fillChannel, stroke: strokeChannel} = channels;
      symbolChannel.hint = {
        fill: fillChannel
          ? fillChannel.value === symbolChannel.value
            ? "color"
            : "currentColor"
          : this.fill ?? "currentColor",
        stroke: strokeChannel
          ? strokeChannel.value === symbolChannel.value
            ? "color"
            : "currentColor"
          : this.stroke ?? "none"
      };
    }
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, r: R, rotate: A, symbol: S} = channels;
    const {r, rotate, symbol} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const circle = symbol === d3.symbolCircle;
    const size = R ? undefined : r * r * Math.PI;
    if (negative(r)) index = [];
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append(circle ? "circle" : "path")
          .call(applyDirectStyles, this)
          .call(
            circle
              ? (selection) => {
                  selection
                    .attr("cx", X ? (i) => X[i] : cx)
                    .attr("cy", Y ? (i) => Y[i] : cy)
                    .attr("r", R ? (i) => R[i] : r);
                }
              : (selection) => {
                  selection
                    .attr(
                      "transform",
                      template`translate(${X ? (i) => X[i] : cx},${Y ? (i) => Y[i] : cy})${
                        A ? (i) => ` rotate(${A[i]})` : rotate ? ` rotate(${rotate})` : ``
                      }`
                    )
                    .attr(
                      "d",
                      R && S
                        ? (i) => {
                            const p = d3.pathRound();
                            S[i].draw(p, R[i] * R[i] * Math.PI);
                            return p;
                          }
                        : R
                        ? (i) => {
                            const p = d3.pathRound();
                            symbol.draw(p, R[i] * R[i] * Math.PI);
                            return p;
                          }
                        : S
                        ? (i) => {
                            const p = d3.pathRound();
                            S[i].draw(p, size);
                            return p;
                          }
                        : (() => {
                            const p = d3.pathRound();
                            symbol.draw(p, size);
                            return p;
                          })()
                    );
                }
          )
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
}

function dot(data, {x, y, ...options} = {}) {
  if (options.frameAnchor === undefined) [x, y] = maybeTuple(x, y);
  return new Dot(data, {...options, x, y});
}

function dotX(data, {x = identity$1, ...options} = {}) {
  return new Dot(data, maybeIntervalMidY({...options, x}));
}

function dotY(data, {y = identity$1, ...options} = {}) {
  return new Dot(data, maybeIntervalMidX({...options, y}));
}

function circle(data, options) {
  return dot(data, {...options, symbol: "circle"});
}

function hexagon(data, options) {
  return dot(data, {...options, symbol: "hexagon"});
}

const defaults$a = {
  ariaLabel: "line",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};

class Line extends Mark {
  constructor(data, options = {}) {
    const {x, y, z, curve, tension} = options;
    super(
      data,
      {
        x: {value: x, scale: "x"},
        y: {value: y, scale: "y"},
        z: {value: maybeZ(options), optional: true}
      },
      options,
      defaults$a
    );
    this.z = z;
    this.curve = maybeCurveAuto(curve, tension);
    markers(this, options);
  }
  filter(index) {
    return index;
  }
  project(channels, values, context) {
    // For the auto curve, projection is handled at render.
    if (this.curve !== curveAuto) {
      super.project(channels, values, context);
    }
  }
  render(index, scales, channels, dimensions, context) {
    const {x: X, y: Y} = channels;
    const {curve} = this;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(groupIndex(index, [X, Y], this, channels))
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .call(applyGroupedChannelStyles, this, channels)
          .call(applyGroupedMarkers, this, channels, context)
          .attr(
            "d",
            curve === curveAuto && context.projection
              ? sphereLine(context.projection, X, Y)
              : d3.line()
                  .curve(curve)
                  .defined((i) => i >= 0)
                  .x((i) => X[i])
                  .y((i) => Y[i])
          )
      )
      .node();
  }
}

function sphereLine(projection, X, Y) {
  const path = d3.geoPath(projection);
  X = coerceNumbers(X);
  Y = coerceNumbers(Y);
  return (I) => {
    let line = [];
    const lines = [line];
    for (const i of I) {
      // Check for undefined value; see groupIndex.
      if (i === -1) {
        line = [];
        lines.push(line);
      } else {
        line.push([X[i], Y[i]]);
      }
    }
    return path({type: "MultiLineString", coordinates: lines});
  };
}

function line(data, {x, y, ...options} = {}) {
  [x, y] = maybeTuple(x, y);
  return new Line(data, {...options, x, y});
}

function lineX(data, {x = identity$1, y = indexOf, ...options} = {}) {
  return new Line(data, maybeDenseIntervalY({...options, x, y}));
}

function lineY(data, {x = indexOf, y = identity$1, ...options} = {}) {
  return new Line(data, maybeDenseIntervalX({...options, x, y}));
}

const defaults$9 = {
  ariaLabel: "rect"
};

class Rect extends Mark {
  constructor(data, options = {}) {
    const {
      x1,
      y1,
      x2,
      y2,
      inset = 0,
      insetTop = inset,
      insetRight = inset,
      insetBottom = inset,
      insetLeft = inset,
      rx,
      ry
    } = options;
    super(
      data,
      {
        x1: {value: x1, scale: "x", type: x1 != null && x2 == null ? "band" : undefined, optional: true},
        y1: {value: y1, scale: "y", type: y1 != null && y2 == null ? "band" : undefined, optional: true},
        x2: {value: x2, scale: "x", optional: true},
        y2: {value: y2, scale: "y", optional: true}
      },
      options,
      defaults$9
    );
    this.insetTop = number$1(insetTop);
    this.insetRight = number$1(insetRight);
    this.insetBottom = number$1(insetBottom);
    this.insetLeft = number$1(insetLeft);
    this.rx = impliedString(rx, "auto"); // number or percentage
    this.ry = impliedString(ry, "auto");
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x1: X1, y1: Y1, x2: X2, y2: Y2} = channels;
    const {marginTop, marginRight, marginBottom, marginLeft, width, height} = dimensions;
    const {projection} = context;
    const {insetTop, insetRight, insetBottom, insetLeft, rx, ry} = this;
    const bx = (x?.bandwidth ? x.bandwidth() : 0) - insetLeft - insetRight;
    const by = (y?.bandwidth ? y.bandwidth() : 0) - insetTop - insetBottom;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {}, 0, 0)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("rect")
          .call(applyDirectStyles, this)
          .attr(
            "x",
            X1 && (projection || !isCollapsed(x))
              ? X2
                ? (i) => Math.min(X1[i], X2[i]) + insetLeft
                : (i) => X1[i] + insetLeft
              : marginLeft + insetLeft
          )
          .attr(
            "y",
            Y1 && (projection || !isCollapsed(y))
              ? Y2
                ? (i) => Math.min(Y1[i], Y2[i]) + insetTop
                : (i) => Y1[i] + insetTop
              : marginTop + insetTop
          )
          .attr(
            "width",
            X1 && (projection || !isCollapsed(x))
              ? X2
                ? (i) => Math.max(0, Math.abs(X2[i] - X1[i]) + bx)
                : bx
              : width - marginRight - marginLeft - insetRight - insetLeft
          )
          .attr(
            "height",
            Y1 && (projection || !isCollapsed(y))
              ? Y2
                ? (i) => Math.max(0, Math.abs(Y1[i] - Y2[i]) + by)
                : by
              : height - marginTop - marginBottom - insetTop - insetBottom
          )
          .call(applyAttr, "rx", rx)
          .call(applyAttr, "ry", ry)
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
}

function rect(data, options) {
  return new Rect(data, maybeTrivialIntervalX(maybeTrivialIntervalY(options)));
}

function rectX(data, options = {}) {
  if (!hasXY(options)) options = {...options, y: indexOf, x2: identity$1, interval: 1};
  return new Rect(data, maybeStackX(maybeTrivialIntervalY(maybeIdentityX(options))));
}

function rectY(data, options = {}) {
  if (!hasXY(options)) options = {...options, x: indexOf, y2: identity$1, interval: 1};
  return new Rect(data, maybeStackY(maybeTrivialIntervalX(maybeIdentityY(options))));
}

function autoSpec(data, options) {
  options = normalizeOptions(options);

  // Greedily materialize columns for type inference; we’ll need them anyway to
  // plot! Note that we don’t apply any type inference to the fx and fy
  // channels, if present; these are always ordinal (at least for now).
  const {x, y, color, size} = options;
  const X = materializeValue(data, x);
  const Y = materializeValue(data, y);
  const C = materializeValue(data, color);
  const S = materializeValue(data, size);

  // Compute the default options.
  let {
    fx,
    fy,
    x: {value: xValue, reduce: xReduce, zero: xZero, ...xOptions},
    y: {value: yValue, reduce: yReduce, zero: yZero, ...yOptions},
    color: {value: colorValue, color: colorColor, reduce: colorReduce},
    size: {value: sizeValue, reduce: sizeReduce}, // TODO constant radius?
    mark
  } = options;

  // Determine the default reducer, if any.
  if (xReduce === undefined)
    xReduce = yReduce == null && xValue == null && sizeValue == null && yValue != null ? "count" : null;
  if (yReduce === undefined)
    yReduce = xReduce == null && yValue == null && sizeValue == null && xValue != null ? "count" : null;

  // Determine the default size reducer, if any.
  if (
    sizeReduce === undefined &&
    sizeValue == null &&
    colorReduce == null &&
    xReduce == null &&
    yReduce == null &&
    (xValue == null || isOrdinal(X)) &&
    (yValue == null || isOrdinal(Y))
  ) {
    sizeReduce = "count";
  }

  // Determine the default zero-ness.
  if (xZero === undefined) xZero = isZeroReducer(xReduce) ? true : undefined;
  if (yZero === undefined) yZero = isZeroReducer(yReduce) ? true : undefined;

  // TODO Shorthand: array of primitives should result in a histogram
  if (xValue == null && yValue == null) throw new Error("must specify x or y");
  if (xReduce != null && yValue == null) throw new Error("reducing x requires y");
  if (yReduce != null && xValue == null) throw new Error("reducing y requires x");

  // Determine the default mark type.
  if (mark === undefined) {
    mark =
      sizeValue != null || sizeReduce != null
        ? "dot"
        : isZeroReducer(xReduce) || isZeroReducer(yReduce) || colorReduce != null // histogram or heatmap
        ? "bar"
        : xValue != null && yValue != null
        ? isOrdinal(X) || isOrdinal(Y) || (xReduce == null && yReduce == null && !isMonotonic(X) && !isMonotonic(Y))
          ? "dot"
          : "line"
        : xValue != null || yValue != null
        ? "rule"
        : null;
  }

  let Z; // may be set to null to disable series-by-color for line and area
  let colorMode; // "fill" or "stroke"

  // Determine the mark implementation.
  let markImpl;
  switch (mark) {
    case "dot":
      markImpl = dot;
      colorMode = "stroke";
      break;
    case "line":
      markImpl =
        (X && Y) || xReduce != null || yReduce != null // same logic as area (see below), but default to line
          ? yZero || yReduce != null || (X && isMonotonic(X))
            ? lineY
            : xZero || xReduce != null || (Y && isMonotonic(Y))
            ? lineX
            : line
          : X // 1d line by index
          ? lineX
          : lineY;
      colorMode = "stroke";
      if (isHighCardinality(C)) Z = null; // TODO only if z not set by user
      break;
    case "area":
      markImpl = !(yZero || yReduce != null) && (xZero || xReduce != null || (Y && isMonotonic(Y))) ? areaX : areaY; // favor areaY if unsure
      colorMode = "fill";
      if (isHighCardinality(C)) Z = null; // TODO only if z not set by user
      break;
    case "rule":
      markImpl = X ? ruleX : ruleY;
      colorMode = "stroke";
      break;
    case "bar":
      markImpl =
        xReduce != null // bin or group on y
          ? isOrdinal(Y)
            ? isSelectReducer(xReduce) && X && isOrdinal(X)
              ? cell
              : barX
            : rectX
          : yReduce != null // bin or group on x
          ? isOrdinal(X)
            ? isSelectReducer(yReduce) && Y && isOrdinal(Y)
              ? cell
              : barY
            : rectY
          : colorReduce != null || sizeReduce != null // bin or group on both x and y
          ? X && isOrdinal(X) && Y && isOrdinal(Y)
            ? cell
            : X && isOrdinal(X)
            ? barY
            : Y && isOrdinal(Y)
            ? barX
            : rect
          : X && isNumeric(X) && !(Y && isNumeric(Y))
          ? barX // if y is temporal, treat as ordinal
          : Y && isNumeric(Y) && !(X && isNumeric(X))
          ? barY // if x is temporal, treat as ordinal
          : cell;
      colorMode = "fill";
      break;
    default:
      throw new Error(`invalid mark: ${mark}`);
  }

  // Determine the mark options.
  let markOptions = {
    fx,
    fy,
    x: X ?? undefined, // treat null x as undefined for implicit stack
    y: Y ?? undefined, // treat null y as undefined for implicit stack
    [colorMode]: C ?? colorColor,
    z: Z,
    r: S ?? undefined, // treat null size as undefined for default constant radius
    tip: true
  };
  let transformImpl;
  let transformOptions = {[colorMode]: colorReduce ?? undefined, r: sizeReduce ?? undefined};
  if (xReduce != null && yReduce != null) {
    throw new Error(`cannot reduce both x and y`); // for now at least
  } else if (yReduce != null) {
    transformOptions.y = yReduce;
    transformImpl = isOrdinal(X) ? groupX : binX;
  } else if (xReduce != null) {
    transformOptions.x = xReduce;
    transformImpl = isOrdinal(Y) ? groupY : binY;
  } else if (colorReduce != null || sizeReduce != null) {
    if (X && Y) {
      transformImpl = isOrdinal(X) && isOrdinal(Y) ? group : isOrdinal(X) ? binY : isOrdinal(Y) ? binX : bin;
    } else if (X) {
      transformImpl = isOrdinal(X) ? groupX : binX;
    } else if (Y) {
      transformImpl = isOrdinal(Y) ? groupY : binY;
    }
  }

  // When using the bin transform, pass through additional options (e.g., thresholds).
  if (transformImpl === bin || transformImpl === binX) markOptions.x = {value: X, ...xOptions};
  if (transformImpl === bin || transformImpl === binY) markOptions.y = {value: Y, ...yOptions};

  // If zero-ness is not specified, default based on whether the resolved mark
  // type will include a zero baseline.
  if (xZero === undefined)
    xZero =
      X &&
      !(transformImpl === bin || transformImpl === binX) &&
      (markImpl === barX || markImpl === areaX || markImpl === rectX || markImpl === ruleY);
  if (yZero === undefined)
    yZero =
      Y &&
      !(transformImpl === bin || transformImpl === binY) &&
      (markImpl === barY || markImpl === areaY || markImpl === rectY || markImpl === ruleX);

  return {
    fx: fx ?? null,
    fy: fy ?? null,
    x: {
      value: xValue ?? null,
      reduce: xReduce ?? null,
      zero: !!xZero,
      ...xOptions
    },
    y: {
      value: yValue ?? null,
      reduce: yReduce ?? null,
      zero: !!yZero,
      ...yOptions
    },
    color: {
      value: colorValue ?? null,
      reduce: colorReduce ?? null,
      ...(colorColor !== undefined && {color: colorColor})
    },
    size: {
      value: sizeValue ?? null,
      reduce: sizeReduce ?? null
    },
    mark,
    markImpl: implNames[markImpl],
    markOptions,
    transformImpl: implNames[transformImpl],
    transformOptions,
    colorMode
  };
}

function auto(data, options) {
  const spec = autoSpec(data, options);
  const {
    fx,
    fy,
    x: {zero: xZero},
    y: {zero: yZero},
    markOptions,
    transformOptions,
    colorMode
  } = spec;
  const markImpl = impls[spec.markImpl];
  const transformImpl = impls[spec.transformImpl];
  // In the case of filled marks (particularly bars and areas) the frame and
  // rules should come after the mark; in the case of stroked marks
  // (particularly dots and lines) they should come before the mark.
  const frames = fx != null || fy != null ? frame({strokeOpacity: 0.1}) : null;
  const rules = [xZero ? ruleX([0]) : null, yZero ? ruleY([0]) : null];
  const mark = markImpl(data, transformImpl ? transformImpl(transformOptions, markOptions) : markOptions);
  return colorMode === "stroke" ? marks(frames, rules, mark) : marks(frames, mark, rules);
}

// TODO What about sorted within series?
function isMonotonic(values) {
  let previous;
  let previousOrder;
  for (const value of values) {
    if (value == null) continue;
    if (previous === undefined) {
      previous = value;
      continue;
    }
    const order = Math.sign(d3.ascending(previous, value));
    if (!order) continue; // skip zero, NaN
    if (previousOrder !== undefined && order !== previousOrder) return false;
    previous = value;
    previousOrder = order;
  }
  return true;
}

// Allow x and y and other dimensions to be specified as shorthand field names
// (but note that they can also be specified as a {transform} object such as
// Plot.identity). We don’t support reducers for the faceting, but for symmetry
// with x and y we allow facets to be specified as {value} objects.
function normalizeOptions({x, y, color, size, fx, fy, mark} = {}) {
  if (!isOptions(x)) x = makeOptions(x);
  if (!isOptions(y)) y = makeOptions(y);
  if (!isOptions(color)) color = isColor(color) ? {color} : makeOptions(color);
  if (!isOptions(size)) size = makeOptions(size);
  if (isOptions(fx)) ({value: fx} = makeOptions(fx));
  if (isOptions(fy)) ({value: fy} = makeOptions(fy));
  if (mark != null) mark = `${mark}`.toLowerCase();
  return {x, y, color, size, fx, fy, mark};
}

// To apply heuristics based on the data types (values), realize the columns. We
// could maybe look at the data.schema here, but Plot’s behavior depends on the
// actual values anyway, so this probably is what we want.
function materializeValue(data, options) {
  const V = valueof(data, options.value);
  if (V) V.label = labelof(options.value);
  return V;
}

function makeOptions(value) {
  return isReducer(value) ? {reduce: value} : {value};
}

// The distinct, count, sum, and proportion reducers are additive (stackable).
function isZeroReducer(reduce) {
  return /^(?:distinct|count|sum|proportion)$/i.test(reduce);
}

// The first, last, and mode reducers preserve the type of the aggregated values.
function isSelectReducer(reduce) {
  return /^(?:first|last|mode)$/i.test(reduce);
}

// https://github.com/observablehq/plot/blob/818562649280e155136f730fc496e0b3d15ae464/src/transforms/group.js#L236
function isReducer(reduce) {
  if (reduce == null) return false;
  if (typeof reduce.reduceIndex === "function") return true;
  if (typeof reduce.reduce === "function" && isObject(reduce)) return true; // N.B. array.reduce
  if (/^p\d{2}$/i.test(reduce)) return true;
  switch (`${reduce}`.toLowerCase()) {
    case "first":
    case "last":
    case "count":
    case "distinct":
    case "sum":
    case "proportion":
    case "proportion-facet": // TODO remove me?
    case "deviation":
    case "min":
    case "min-index": // TODO remove me?
    case "max":
    case "max-index": // TODO remove me?
    case "mean":
    case "median":
    case "variance":
    case "mode":
      // These are technically reducers, but I think we’d want to treat them as fields?
      // case "x":
      // case "x1":
      // case "x2":
      // case "y":
      // case "y1":
      // case "y2":
      return true;
  }
  return false;
}

function isHighCardinality(value) {
  return value ? new d3.InternSet(value).size > value.length >> 1 : false;
}

const impls = {
  dot,
  line,
  lineX,
  lineY,
  areaX,
  areaY,
  ruleX,
  ruleY,
  barX,
  barY,
  rect,
  rectX,
  rectY,
  cell,
  bin,
  binX,
  binY,
  group,
  groupX,
  groupY
};

// Instead of returning the mark or transform implementation directly, we return
// the implementation name to facilitate code compilation (“eject to explicit
// marks”). An implementation-to-name mapping needs to live somewhere for
// compilation, and by having it in Plot we can more easily introduce a new mark
// or transform implementation in Plot.auto without having to synchronize a
// downstream change in the compiler.
const implNames = Object.fromEntries(Object.entries(impls).map(([name, impl]) => [impl, name]));

function mapX(mapper, options = {}) {
  let {x, x1, x2} = options;
  if (x === undefined && x1 === undefined && x2 === undefined) options = {...options, x: (x = identity$1)};
  const outputs = {};
  if (x != null) outputs.x = mapper;
  if (x1 != null) outputs.x1 = mapper;
  if (x2 != null) outputs.x2 = mapper;
  return map(outputs, options);
}

function mapY(mapper, options = {}) {
  let {y, y1, y2} = options;
  if (y === undefined && y1 === undefined && y2 === undefined) options = {...options, y: (y = identity$1)};
  const outputs = {};
  if (y != null) outputs.y = mapper;
  if (y1 != null) outputs.y1 = mapper;
  if (y2 != null) outputs.y2 = mapper;
  return map(outputs, options);
}

function map(outputs = {}, options = {}) {
  const z = maybeZ(options);
  const channels = Object.entries(outputs).map(([key, map]) => {
    const input = maybeInput(key, options);
    if (input == null) throw new Error(`missing channel: ${key}`);
    const [output, setOutput] = column(input);
    return {key, input, output, setOutput, map: maybeMap(map)};
  });
  return {
    ...basic(options, (data, facets) => {
      const Z = valueof(data, z);
      const X = channels.map(({input}) => valueof(data, input));
      const MX = channels.map(({setOutput}) => setOutput(new Array(data.length)));
      for (const facet of facets) {
        for (const I of Z ? d3.group(facet, (i) => Z[i]).values() : [facet]) {
          channels.forEach(({map}, i) => map.mapIndex(I, X[i], MX[i]));
        }
      }
      return {data, facets};
    }),
    ...Object.fromEntries(channels.map(({key, output}) => [key, output]))
  };
}

function maybeMap(map) {
  if (map == null) throw new Error("missing map");
  if (typeof map.mapIndex === "function") return map;
  if (typeof map.map === "function" && isObject(map)) return mapMap(map); // N.B. array.map
  if (typeof map === "function") return mapFunction(taker(map));
  switch (`${map}`.toLowerCase()) {
    case "cumsum":
      return mapCumsum;
    case "rank":
      return mapFunction((I, V) => d3.rank(I, (i) => V[i]));
    case "quantile":
      return mapFunction((I, V) => rankQuantile(I, (i) => V[i]));
  }
  throw new Error(`invalid map: ${map}`);
}

function mapMap(map) {
  console.warn("deprecated map interface; implement mapIndex instead.");
  return {mapIndex: map.map.bind(map)};
}

function rankQuantile(I, f) {
  const n = d3.count(I, f) - 1;
  return d3.rank(I, f).map((r) => r / n);
}

function mapFunction(f) {
  return {
    mapIndex(I, S, T) {
      const M = f(I, S);
      if (M.length !== I.length) throw new Error("map function returned a mismatched length");
      for (let i = 0, n = I.length; i < n; ++i) T[I[i]] = M[i];
    }
  };
}

const mapCumsum = {
  mapIndex(I, S, T) {
    let sum = 0;
    for (const i of I) T[i] = sum += S[i];
  }
};

function windowX(windowOptions = {}, options) {
  if (arguments.length === 1) options = windowOptions;
  return mapX(window$1(windowOptions), options);
}

function windowY(windowOptions = {}, options) {
  if (arguments.length === 1) options = windowOptions;
  return mapY(window$1(windowOptions), options);
}

function window$1(options = {}) {
  if (typeof options === "number") options = {k: options};
  let {k, reduce, shift, anchor, strict} = options;
  if (anchor === undefined && shift !== undefined) {
    anchor = maybeShift(shift);
    warn(`Warning: the shift option is deprecated; please use anchor "${anchor}" instead.`);
  }
  if (!((k = Math.floor(k)) > 0)) throw new Error(`invalid k: ${k}`);
  return maybeReduce(reduce)(k, maybeAnchor$1(anchor, k), strict);
}

function maybeAnchor$1(anchor = "middle", k) {
  switch (`${anchor}`.toLowerCase()) {
    case "middle":
      return (k - 1) >> 1;
    case "start":
      return 0;
    case "end":
      return k - 1;
  }
  throw new Error(`invalid anchor: ${anchor}`);
}

function maybeShift(shift) {
  switch (`${shift}`.toLowerCase()) {
    case "centered":
      return "middle";
    case "leading":
      return "start";
    case "trailing":
      return "end";
  }
  throw new Error(`invalid shift: ${shift}`);
}

function maybeReduce(reduce = "mean") {
  if (typeof reduce === "string") {
    if (/^p\d{2}$/i.test(reduce)) return reduceAccessor(percentile(reduce));
    switch (reduce.toLowerCase()) {
      case "deviation":
        return reduceAccessor(d3.deviation);
      case "max":
        return reduceArray((I, V) => d3.max(I, (i) => V[i]));
      case "mean":
        return reduceMean;
      case "median":
        return reduceAccessor(d3.median);
      case "min":
        return reduceArray((I, V) => d3.min(I, (i) => V[i]));
      case "mode":
        return reduceArray((I, V) => d3.mode(I, (i) => V[i]));
      case "sum":
        return reduceSum;
      case "variance":
        return reduceAccessor(d3.variance);
      case "difference":
        return reduceDifference;
      case "ratio":
        return reduceRatio;
      case "first":
        return reduceFirst;
      case "last":
        return reduceLast;
    }
  }
  if (typeof reduce !== "function") throw new Error(`invalid reduce: ${reduce}`);
  return reduceArray(taker(reduce));
}

// Note that the subarray may include NaN in the non-strict case; we expect the
// function f to handle that itself (e.g., by filtering as needed). The D3
// reducers (e.g., min, max, mean, median) do, and it’s faster to avoid
// redundant filtering.
function reduceAccessor(f) {
  return (k, s, strict) =>
    strict
      ? {
          mapIndex(I, S, T) {
            const v = (i) => (S[i] == null ? NaN : +S[i]);
            let nans = 0;
            for (let i = 0; i < k - 1; ++i) if (isNaN(v(i))) ++nans;
            for (let i = 0, n = I.length - k + 1; i < n; ++i) {
              if (isNaN(v(i + k - 1))) ++nans;
              T[I[i + s]] = nans === 0 ? f(subarray(I, i, i + k), v) : NaN;
              if (isNaN(v(i))) --nans;
            }
          }
        }
      : {
          mapIndex(I, S, T) {
            const v = (i) => (S[i] == null ? NaN : +S[i]);
            for (let i = -s; i < 0; ++i) {
              T[I[i + s]] = f(subarray(I, 0, i + k), v);
            }
            for (let i = 0, n = I.length - s; i < n; ++i) {
              T[I[i + s]] = f(subarray(I, i, i + k), v);
            }
          }
        };
}

function reduceArray(f) {
  return (k, s, strict) =>
    strict
      ? {
          mapIndex(I, S, T) {
            let count = 0;
            for (let i = 0; i < k - 1; ++i) count += defined(S[I[i]]);
            for (let i = 0, n = I.length - k + 1; i < n; ++i) {
              count += defined(S[I[i + k - 1]]);
              if (count === k) T[I[i + s]] = f(subarray(I, i, i + k), S);
              count -= defined(S[I[i]]);
            }
          }
        }
      : {
          mapIndex(I, S, T) {
            for (let i = -s; i < 0; ++i) {
              T[I[i + s]] = f(subarray(I, 0, i + k), S);
            }
            for (let i = 0, n = I.length - s; i < n; ++i) {
              T[I[i + s]] = f(subarray(I, i, i + k), S);
            }
          }
        };
}

function reduceSum(k, s, strict) {
  return strict
    ? {
        mapIndex(I, S, T) {
          let nans = 0;
          let sum = 0;
          for (let i = 0; i < k - 1; ++i) {
            const v = S[I[i]];
            if (v === null || isNaN(v)) ++nans;
            else sum += +v;
          }
          for (let i = 0, n = I.length - k + 1; i < n; ++i) {
            const a = S[I[i]];
            const b = S[I[i + k - 1]];
            if (b === null || isNaN(b)) ++nans;
            else sum += +b;
            T[I[i + s]] = nans === 0 ? sum : NaN;
            if (a === null || isNaN(a)) --nans;
            else sum -= +a;
          }
        }
      }
    : {
        mapIndex(I, S, T) {
          let sum = 0;
          const n = I.length;
          for (let i = 0, j = Math.min(n, k - s - 1); i < j; ++i) {
            sum += +S[I[i]] || 0;
          }
          for (let i = -s, j = n - s; i < j; ++i) {
            sum += +S[I[i + k - 1]] || 0;
            T[I[i + s]] = sum;
            sum -= +S[I[i]] || 0;
          }
        }
      };
}

function reduceMean(k, s, strict) {
  if (strict) {
    const sum = reduceSum(k, s, strict);
    return {
      mapIndex(I, S, T) {
        sum.mapIndex(I, S, T);
        for (let i = 0, n = I.length - k + 1; i < n; ++i) {
          T[I[i + s]] /= k;
        }
      }
    };
  } else {
    return {
      mapIndex(I, S, T) {
        let sum = 0;
        let count = 0;
        const n = I.length;
        for (let i = 0, j = Math.min(n, k - s - 1); i < j; ++i) {
          let v = S[I[i]];
          if (v !== null && !isNaN((v = +v))) (sum += v), ++count;
        }
        for (let i = -s, j = n - s; i < j; ++i) {
          let a = S[I[i + k - 1]];
          let b = S[I[i]];
          if (a !== null && !isNaN((a = +a))) (sum += a), ++count;
          T[I[i + s]] = sum / count;
          if (b !== null && !isNaN((b = +b))) (sum -= b), --count;
        }
      }
    };
  }
}

function firstDefined(S, I, i, k) {
  for (let j = i + k; i < j; ++i) {
    const v = S[I[i]];
    if (defined(v)) return v;
  }
}

function lastDefined(S, I, i, k) {
  for (let j = i + k - 1; j >= i; --j) {
    const v = S[I[j]];
    if (defined(v)) return v;
  }
}

function firstNumber(S, I, i, k) {
  for (let j = i + k; i < j; ++i) {
    let v = S[I[i]];
    if (v !== null && !isNaN((v = +v))) return v;
  }
}

function lastNumber(S, I, i, k) {
  for (let j = i + k - 1; j >= i; --j) {
    let v = S[I[j]];
    if (v !== null && !isNaN((v = +v))) return v;
  }
}

function reduceDifference(k, s, strict) {
  return strict
    ? {
        mapIndex(I, S, T) {
          for (let i = 0, n = I.length - k; i < n; ++i) {
            const a = S[I[i]];
            const b = S[I[i + k - 1]];
            T[I[i + s]] = a === null || b === null ? NaN : b - a;
          }
        }
      }
    : {
        mapIndex(I, S, T) {
          for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
            T[I[i + s]] = lastNumber(S, I, i, k) - firstNumber(S, I, i, k);
          }
        }
      };
}

function reduceRatio(k, s, strict) {
  return strict
    ? {
        mapIndex(I, S, T) {
          for (let i = 0, n = I.length - k; i < n; ++i) {
            const a = S[I[i]];
            const b = S[I[i + k - 1]];
            T[I[i + s]] = a === null || b === null ? NaN : b / a;
          }
        }
      }
    : {
        mapIndex(I, S, T) {
          for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
            T[I[i + s]] = lastNumber(S, I, i, k) / firstNumber(S, I, i, k);
          }
        }
      };
}

function reduceFirst(k, s, strict) {
  return strict
    ? {
        mapIndex(I, S, T) {
          for (let i = 0, n = I.length - k; i < n; ++i) {
            T[I[i + s]] = S[I[i]];
          }
        }
      }
    : {
        mapIndex(I, S, T) {
          for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
            T[I[i + s]] = firstDefined(S, I, i, k);
          }
        }
      };
}

function reduceLast(k, s, strict) {
  return strict
    ? {
        mapIndex(I, S, T) {
          for (let i = 0, n = I.length - k; i < n; ++i) {
            T[I[i + s]] = S[I[i + k - 1]];
          }
        }
      }
    : {
        mapIndex(I, S, T) {
          for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
            T[I[i + s]] = lastDefined(S, I, i, k);
          }
        }
      };
}

const defaults$8 = {
  n: 20,
  k: 2,
  color: "currentColor",
  opacity: 0.2,
  strict: true,
  anchor: "end"
};

function bollingerX(
  data,
  {
    x = identity$1,
    y,
    k = defaults$8.k,
    color = defaults$8.color,
    opacity = defaults$8.opacity,
    fill = color,
    fillOpacity = opacity,
    stroke = color,
    strokeOpacity,
    strokeWidth,
    ...options
  } = {}
) {
  return marks(
    isNoneish(fill)
      ? null
      : areaX(
          data,
          map(
            {x1: bollinger({k: -k, ...options}), x2: bollinger({k, ...options})},
            {x1: x, x2: x, y, fill, fillOpacity, ...options}
          )
        ),
    isNoneish(stroke)
      ? null
      : lineX(data, map({x: bollinger(options)}, {x, y, stroke, strokeOpacity, strokeWidth, ...options}))
  );
}

function bollingerY(
  data,
  {
    x,
    y = identity$1,
    k = defaults$8.k,
    color = defaults$8.color,
    opacity = defaults$8.opacity,
    fill = color,
    fillOpacity = opacity,
    stroke = color,
    strokeOpacity,
    strokeWidth,
    ...options
  } = {}
) {
  return marks(
    isNoneish(fill)
      ? null
      : areaY(
          data,
          map(
            {y1: bollinger({k: -k, ...options}), y2: bollinger({k, ...options})},
            {x, y1: y, y2: y, fill, fillOpacity, ...options}
          )
        ),
    isNoneish(stroke)
      ? null
      : lineY(data, map({y: bollinger(options)}, {x, y, stroke, strokeOpacity, strokeWidth, ...options}))
  );
}

function bollinger({n = defaults$8.n, k = 0, strict = defaults$8.strict, anchor = defaults$8.anchor} = {}) {
  return window$1({k: n, reduce: (Y) => d3.mean(Y) + k * (d3.deviation(Y) || 0), strict, anchor});
}

const defaults$7 = {
  ariaLabel: "tick",
  fill: null,
  stroke: "currentColor"
};

class AbstractTick extends Mark {
  constructor(data, channels, options) {
    super(data, channels, options, defaults$7);
    markers(this, options);
  }
  render(index, scales, channels, dimensions, context) {
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(this._transform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("line")
          .call(applyDirectStyles, this)
          .attr("x1", this._x1(scales, channels, dimensions))
          .attr("x2", this._x2(scales, channels, dimensions))
          .attr("y1", this._y1(scales, channels, dimensions))
          .attr("y2", this._y2(scales, channels, dimensions))
          .call(applyChannelStyles, this, channels)
          .call(applyMarkers, this, channels, context)
      )
      .node();
  }
}

class TickX extends AbstractTick {
  constructor(data, options = {}) {
    const {x, y, inset = 0, insetTop = inset, insetBottom = inset} = options;
    super(
      data,
      {
        x: {value: x, scale: "x"},
        y: {value: y, scale: "y", type: "band", optional: true}
      },
      options
    );
    this.insetTop = number$1(insetTop);
    this.insetBottom = number$1(insetBottom);
  }
  _transform(selection, mark, {x}) {
    selection.call(applyTransform, mark, {x}, offset, 0);
  }
  _x1(scales, {x: X}) {
    return (i) => X[i];
  }
  _x2(scales, {x: X}) {
    return (i) => X[i];
  }
  _y1({y}, {y: Y}, {marginTop}) {
    const {insetTop} = this;
    return Y && y ? (i) => Y[i] + insetTop : marginTop + insetTop;
  }
  _y2({y}, {y: Y}, {height, marginBottom}) {
    const {insetBottom} = this;
    return Y && y ? (i) => Y[i] + y.bandwidth() - insetBottom : height - marginBottom - insetBottom;
  }
}

class TickY extends AbstractTick {
  constructor(data, options = {}) {
    const {x, y, inset = 0, insetRight = inset, insetLeft = inset} = options;
    super(
      data,
      {
        y: {value: y, scale: "y"},
        x: {value: x, scale: "x", type: "band", optional: true}
      },
      options
    );
    this.insetRight = number$1(insetRight);
    this.insetLeft = number$1(insetLeft);
  }
  _transform(selection, mark, {y}) {
    selection.call(applyTransform, mark, {y}, 0, offset);
  }
  _x1({x}, {x: X}, {marginLeft}) {
    const {insetLeft} = this;
    return X && x ? (i) => X[i] + insetLeft : marginLeft + insetLeft;
  }
  _x2({x}, {x: X}, {width, marginRight}) {
    const {insetRight} = this;
    return X && x ? (i) => X[i] + x.bandwidth() - insetRight : width - marginRight - insetRight;
  }
  _y1(scales, {y: Y}) {
    return (i) => Y[i];
  }
  _y2(scales, {y: Y}) {
    return (i) => Y[i];
  }
}

function tickX(data, {x = identity$1, ...options} = {}) {
  return new TickX(data, {...options, x});
}

function tickY(data, {y = identity$1, ...options} = {}) {
  return new TickY(data, {...options, y});
}

// Returns a composite mark for producing a horizontal box plot, applying the
// necessary statistical transforms. The boxes are grouped by y, if present.
function boxX(
  data,
  {
    x = identity$1,
    y = null,
    fill = "#ccc",
    fillOpacity,
    stroke = "currentColor",
    strokeOpacity,
    strokeWidth = 2,
    sort,
    ...options
  } = {}
) {
  const group = y != null ? groupY : groupZ$1;
  return marks(
    ruleY(data, group({x1: loqr1, x2: hiqr2}, {x, y, stroke, strokeOpacity, ...options})),
    barX(data, group({x1: "p25", x2: "p75"}, {x, y, fill, fillOpacity, ...options})),
    tickX(data, group({x: "p50"}, {x, y, stroke, strokeOpacity, strokeWidth, sort, ...options})),
    dot(data, map({x: oqr}, {x, y, z: y, stroke, strokeOpacity, ...options}))
  );
}

// Returns a composite mark for producing a vertical box plot, applying the
// necessary statistical transforms. The boxes are grouped by x, if present.
function boxY(
  data,
  {
    y = identity$1,
    x = null,
    fill = "#ccc",
    fillOpacity,
    stroke = "currentColor",
    strokeOpacity,
    strokeWidth = 2,
    sort,
    ...options
  } = {}
) {
  const group = x != null ? groupX : groupZ$1;
  return marks(
    ruleX(data, group({y1: loqr1, y2: hiqr2}, {x, y, stroke, strokeOpacity, ...options})),
    barY(data, group({y1: "p25", y2: "p75"}, {x, y, fill, fillOpacity, ...options})),
    tickY(data, group({y: "p50"}, {x, y, stroke, strokeOpacity, strokeWidth, sort, ...options})),
    dot(data, map({y: oqr}, {x, y, z: x, stroke, strokeOpacity, ...options}))
  );
}

// A map function that returns only outliers, returning NaN for non-outliers
function oqr(values) {
  const r1 = loqr1(values);
  const r2 = hiqr2(values);
  return values.map((v) => (v < r1 || v > r2 ? v : NaN));
}

function loqr1(values) {
  const lo = quartile1(values) * 2.5 - quartile3(values) * 1.5;
  return d3.min(values, (d) => (d >= lo ? d : NaN));
}

function hiqr2(values) {
  const hi = quartile3(values) * 2.5 - quartile1(values) * 1.5;
  return d3.max(values, (d) => (d <= hi ? d : NaN));
}

function quartile1(values) {
  return d3.quantile(values, 0.25);
}

function quartile3(values) {
  return d3.quantile(values, 0.75);
}

const defaults$6 = {
  ariaLabel: "raster",
  stroke: null,
  pixelSize: 1
};

function number(input, name) {
  const x = +input;
  if (isNaN(x)) throw new Error(`invalid ${name}: ${input}`);
  return x;
}

function integer(input, name) {
  const x = Math.floor(input);
  if (isNaN(x)) throw new Error(`invalid ${name}: ${input}`);
  return x;
}

class AbstractRaster extends Mark {
  constructor(data, channels, options = {}, defaults) {
    let {
      width,
      height,
      x,
      y,
      x1 = x == null ? 0 : undefined,
      y1 = y == null ? 0 : undefined,
      x2 = x == null ? width : undefined,
      y2 = y == null ? height : undefined,
      pixelSize = defaults.pixelSize,
      blur = 0,
      interpolate
    } = options;
    if (width != null) width = integer(width, "width");
    if (height != null) height = integer(height, "height");
    // These represent the (minimum) bounds of the raster; they are not
    // evaluated for each datum. Also, if x and y are not specified explicitly,
    // then these bounds are used to compute the dense linear grid.
    if (x1 != null) x1 = number(x1, "x1");
    if (y1 != null) y1 = number(y1, "y1");
    if (x2 != null) x2 = number(x2, "x2");
    if (y2 != null) y2 = number(y2, "y2");
    if (x == null && (x1 == null || x2 == null)) throw new Error("missing x");
    if (y == null && (y1 == null || y2 == null)) throw new Error("missing y");
    if (data != null && width != null && height != null) {
      // If x and y are not given, assume the data is a dense array of samples
      // covering the entire grid in row-major order. These defaults allow
      // further shorthand where x and y represent grid column and row index.
      // TODO If we know that the x and y scales are linear, then we could avoid
      // materializing these columns to improve performance.
      if (x === undefined && x1 != null && x2 != null) x = denseX(x1, x2, width);
      if (y === undefined && y1 != null && y2 != null) y = denseY(y1, y2, width, height);
    }
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        x1: {value: x1 == null ? null : [x1], scale: "x", optional: true, filter: null},
        y1: {value: y1 == null ? null : [y1], scale: "y", optional: true, filter: null},
        x2: {value: x2 == null ? null : [x2], scale: "x", optional: true, filter: null},
        y2: {value: y2 == null ? null : [y2], scale: "y", optional: true, filter: null},
        ...channels
      },
      options,
      defaults
    );
    this.width = width;
    this.height = height;
    this.pixelSize = number(pixelSize, "pixelSize");
    this.blur = number(blur, "blur");
    this.interpolate = x == null || y == null ? null : maybeInterpolate(interpolate); // interpolation requires x & y
  }
}

class Raster extends AbstractRaster {
  constructor(data, options = {}) {
    const {imageRendering} = options;
    if (data == null) {
      const {fill, fillOpacity} = options;
      if (maybeNumberChannel(fillOpacity)[0] !== undefined) options = sampler("fillOpacity", options);
      if (maybeColorChannel(fill)[0] !== undefined) options = sampler("fill", options);
    }
    super(data, undefined, options, defaults$6);
    this.imageRendering = impliedString(imageRendering, "auto");
  }
  // Ignore the color scale, so the fill channel is returned unscaled.
  scale(channels, {color, ...scales}, context) {
    return super.scale(channels, scales, context);
  }
  render(index, scales, values, dimensions, context) {
    const color = scales[values.channels.fill?.scale] ?? ((x) => x);
    const {x: X, y: Y} = values;
    const {document} = context;
    const [x1, y1, x2, y2] = renderBounds(values, dimensions, context);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const {pixelSize: k, width: w = Math.round(Math.abs(dx) / k), height: h = Math.round(Math.abs(dy) / k)} = this;
    const n = w * h;

    // Interpolate the samples to fill the raster grid. If interpolate is null,
    // then a continuous function is being sampled, and the raster grid is
    // already aligned with the canvas.
    let {fill: F, fillOpacity: FO} = values;
    let offset = 0;
    if (this.interpolate) {
      const kx = w / dx;
      const ky = h / dy;
      const IX = map$1(X, (x) => (x - x1) * kx, Float64Array);
      const IY = map$1(Y, (y) => (y - y1) * ky, Float64Array);
      if (F) F = this.interpolate(index, w, h, IX, IY, F);
      if (FO) FO = this.interpolate(index, w, h, IX, IY, FO);
    }

    // When faceting without interpolation, as when sampling a continuous
    // function, offset into the dense grid based on the current facet index.
    else if (this.data == null && index) offset = index.fi * n;

    // Render the raster grid to the canvas, blurring if needed.
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context2d = canvas.getContext("2d");
    const image = context2d.createImageData(w, h);
    const imageData = image.data;
    let {r, g, b} = d3.rgb(this.fill) ?? {r: 0, g: 0, b: 0};
    let a = (this.fillOpacity ?? 1) * 255;
    for (let i = 0; i < n; ++i) {
      const j = i << 2;
      if (F) {
        const fi = color(F[i + offset]);
        if (fi == null) {
          imageData[j + 3] = 0;
          continue;
        }
        ({r, g, b} = d3.rgb(fi));
      }
      if (FO) a = FO[i + offset] * 255;
      imageData[j + 0] = r;
      imageData[j + 1] = g;
      imageData[j + 2] = b;
      imageData[j + 3] = a;
    }
    if (this.blur > 0) d3.blurImage(image, this.blur);
    context2d.putImageData(image, 0, 0);

    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) =>
        g
          .append("image")
          .attr("transform", `translate(${x1},${y1}) scale(${Math.sign(x2 - x1)},${Math.sign(y2 - y1)})`)
          .attr("width", Math.abs(dx))
          .attr("height", Math.abs(dy))
          .attr("preserveAspectRatio", "none")
          .call(applyAttr, "image-rendering", this.imageRendering)
          .call(applyDirectStyles, this)
          .attr("xlink:href", canvas.toDataURL())
      )
      .node();
  }
}

function maybeTuples(k, data, options) {
  if (arguments.length < 3) (options = data), (data = null);
  let {x, y, [k]: z, ...rest} = options;
  // Because we use implicit x and y when z is a function of (x, y), and when
  // data is a dense grid, we must further disambiguate by testing whether data
  // contains [x, y, z?] tuples. Hence you can’t use this shorthand with a
  // transform that lazily generates tuples, but that seems reasonable since
  // this is just for convenience anyway.
  if (x === undefined && y === undefined && isTuples(data)) {
    (x = first), (y = second);
    if (z === undefined) z = third;
  }
  return [data, {...rest, x, y, [k]: z}];
}

function raster() {
  const [data, options] = maybeTuples("fill", ...arguments);
  return new Raster(
    data,
    data == null || options.fill !== undefined || options.fillOpacity !== undefined
      ? options
      : {...options, fill: identity$1}
  );
}

// See rasterBounds; this version is called during render.
function renderBounds({x1, y1, x2, y2}, dimensions, {projection}) {
  const {width, height, marginTop, marginRight, marginBottom, marginLeft} = dimensions;
  return [
    x1 && projection == null ? x1[0] : marginLeft,
    y1 && projection == null ? y1[0] : marginTop,
    x2 && projection == null ? x2[0] : width - marginRight,
    y2 && projection == null ? y2[0] : height - marginBottom
  ];
}

// If x1, y1, x2, y2 were specified, and no projection is in use (and thus the
// raster grid is necessarily an axis-aligned rectangle), then we can compute
// tighter bounds for the image, improving resolution.
function rasterBounds({x1, y1, x2, y2}, scales, dimensions, context) {
  const channels = {};
  if (x1) channels.x1 = x1;
  if (y1) channels.y1 = y1;
  if (x2) channels.x2 = x2;
  if (y2) channels.y2 = y2;
  return renderBounds(valueObject(channels, scales), dimensions, context);
}

// Evaluates the function with the given name, if it exists, on the raster grid,
// generating a channel of the same name.
function sampler(name, options = {}) {
  const {[name]: value} = options;
  if (typeof value !== "function") throw new Error(`invalid ${name}: not a function`);
  return initializer({...options, [name]: undefined}, function (data, facets, channels, scales, dimensions, context) {
    const {x, y} = scales;
    // TODO Allow projections, if invertible.
    if (!x) throw new Error("missing scale: x");
    if (!y) throw new Error("missing scale: y");
    const [x1, y1, x2, y2] = rasterBounds(channels, scales, dimensions, context);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const {pixelSize: k} = this;
    // Note: this must exactly match the defaults in render above!
    const {width: w = Math.round(Math.abs(dx) / k), height: h = Math.round(Math.abs(dy) / k)} = options;
    // TODO Hint to use a typed array when possible?
    const V = new Array(w * h * (facets ? facets.length : 1));
    const kx = dx / w;
    const ky = dy / h;
    let i = 0;
    for (const facet of facets ?? [undefined]) {
      for (let yi = 0.5; yi < h; ++yi) {
        for (let xi = 0.5; xi < w; ++xi, ++i) {
          V[i] = value(x.invert(x1 + xi * kx), y.invert(y1 + yi * ky), facet);
        }
      }
    }
    return {data: V, facets, channels: {[name]: {value: V, scale: "auto"}}};
  });
}

function maybeInterpolate(interpolate) {
  if (typeof interpolate === "function") return interpolate;
  if (interpolate == null) return interpolateNone;
  switch (`${interpolate}`.toLowerCase()) {
    case "none":
      return interpolateNone;
    case "nearest":
      return interpolateNearest;
    case "barycentric":
      return interpolatorBarycentric();
    case "random-walk":
      return interpolatorRandomWalk();
  }
  throw new Error(`invalid interpolate: ${interpolate}`);
}

// Applies a simple forward mapping of samples, binning them into pixels without
// any blending or interpolation. Note: if multiple samples map to the same
// pixel, the last one wins; this can introduce bias if the points are not in
// random order, so use Plot.shuffle to randomize the input if needed.
function interpolateNone(index, width, height, X, Y, V) {
  const W = new Array(width * height);
  for (const i of index) {
    if (X[i] < 0 || X[i] >= width || Y[i] < 0 || Y[i] >= height) continue;
    W[Math.floor(Y[i]) * width + Math.floor(X[i])] = V[i];
  }
  return W;
}

function interpolatorBarycentric({random = d3.randomLcg(42)} = {}) {
  return (index, width, height, X, Y, V) => {
    // Interpolate the interior of all triangles with barycentric coordinates
    const {points, triangles, hull} = d3.Delaunay.from(
      index,
      (i) => X[i],
      (i) => Y[i]
    );
    const W = new V.constructor(width * height).fill(NaN);
    const S = new Uint8Array(width * height); // 1 if pixel has been seen.
    const mix = mixer(V, random);

    for (let i = 0; i < triangles.length; i += 3) {
      const ta = triangles[i];
      const tb = triangles[i + 1];
      const tc = triangles[i + 2];
      const Ax = points[2 * ta];
      const Bx = points[2 * tb];
      const Cx = points[2 * tc];
      const Ay = points[2 * ta + 1];
      const By = points[2 * tb + 1];
      const Cy = points[2 * tc + 1];
      const x1 = Math.min(Ax, Bx, Cx);
      const x2 = Math.max(Ax, Bx, Cx);
      const y1 = Math.min(Ay, By, Cy);
      const y2 = Math.max(Ay, By, Cy);
      const z = (By - Cy) * (Ax - Cx) + (Ay - Cy) * (Cx - Bx);
      if (!z) continue;
      const va = V[index[ta]];
      const vb = V[index[tb]];
      const vc = V[index[tc]];
      for (let x = Math.floor(x1); x < x2; ++x) {
        for (let y = Math.floor(y1); y < y2; ++y) {
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const xp = x + 0.5; // sample pixel centroids
          const yp = y + 0.5;
          const s = Math.sign(z);
          const ga = (By - Cy) * (xp - Cx) + (yp - Cy) * (Cx - Bx);
          if (ga * s < 0) continue;
          const gb = (Cy - Ay) * (xp - Cx) + (yp - Cy) * (Ax - Cx);
          if (gb * s < 0) continue;
          const gc = z - (ga + gb);
          if (gc * s < 0) continue;
          const i = x + width * y;
          W[i] = mix(va, ga / z, vb, gb / z, vc, gc / z, x, y);
          S[i] = 1;
        }
      }
    }
    extrapolateBarycentric(W, S, X, Y, V, width, height, hull, index, mix);
    return W;
  };
}

// Extrapolate by finding the closest point on the hull.
function extrapolateBarycentric(W, S, X, Y, V, width, height, hull, index, mix) {
  X = Float64Array.from(hull, (i) => X[index[i]]);
  Y = Float64Array.from(hull, (i) => Y[index[i]]);
  V = Array.from(hull, (i) => V[index[i]]);
  const n = X.length;
  const rays = Array.from({length: n}, (_, j) => ray(j, X, Y));
  let k = 0;
  for (let y = 0; y < height; ++y) {
    const yp = y + 0.5;
    for (let x = 0; x < width; ++x) {
      const i = x + width * y;
      if (!S[i]) {
        const xp = x + 0.5;
        for (let l = 0; l < n; ++l) {
          const j = (n + k + (l % 2 ? (l + 1) / 2 : -l / 2)) % n;
          if (rays[j](xp, yp)) {
            const t = segmentProject(X.at(j - 1), Y.at(j - 1), X[j], Y[j], xp, yp);
            W[i] = mix(V.at(j - 1), t, V[j], 1 - t, V[j], 0, x, y);
            k = j;
            break;
          }
        }
      }
    }
  }
}

// Projects a point p = [x, y] onto the line segment [p1, p2], returning the
// projected coordinates p’ as t in [0, 1] with p’ = t p1 + (1 - t) p2.
function segmentProject(x1, y1, x2, y2, x, y) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const a = dx * (x2 - x) + dy * (y2 - y);
  const b = dx * (x - x1) + dy * (y - y1);
  return a > 0 && b > 0 ? a / (a + b) : +(a > b);
}

function cross(xa, ya, xb, yb) {
  return xa * yb - xb * ya;
}

function ray(j, X, Y) {
  const n = X.length;
  const xc = X.at(j - 2);
  const yc = Y.at(j - 2);
  const xa = X.at(j - 1);
  const ya = Y.at(j - 1);
  const xb = X[j];
  const yb = Y[j];
  const xd = X.at(j + 1 - n);
  const yd = Y.at(j + 1 - n);
  const dxab = xa - xb;
  const dyab = ya - yb;
  const dxca = xc - xa;
  const dyca = yc - ya;
  const dxbd = xb - xd;
  const dybd = yb - yd;
  const hab = Math.hypot(dxab, dyab);
  const hca = Math.hypot(dxca, dyca);
  const hbd = Math.hypot(dxbd, dybd);
  return (x, y) => {
    const dxa = x - xa;
    const dya = y - ya;
    const dxb = x - xb;
    const dyb = y - yb;
    return (
      cross(dxa, dya, dxb, dyb) > -1e-6 &&
      cross(dxa, dya, dxab, dyab) * hca - cross(dxa, dya, dxca, dyca) * hab > -1e-6 &&
      cross(dxb, dyb, dxbd, dybd) * hab - cross(dxb, dyb, dxab, dyab) * hbd <= 0
    );
  };
}

function interpolateNearest(index, width, height, X, Y, V) {
  const W = new V.constructor(width * height);
  const delaunay = d3.Delaunay.from(
    index,
    (i) => X[i],
    (i) => Y[i]
  );
  // memoization of delaunay.find for the line start (iy) and pixel (ix)
  let iy, ix;
  for (let y = 0.5, k = 0; y < height; ++y) {
    ix = iy;
    for (let x = 0.5; x < width; ++x, ++k) {
      ix = delaunay.find(x, y, ix);
      if (x === 0.5) iy = ix;
      W[k] = V[index[ix]];
    }
  }
  return W;
}

// https://observablehq.com/@observablehq/walk-on-spheres-precision
function interpolatorRandomWalk({random = d3.randomLcg(42), minDistance = 0.5, maxSteps = 2} = {}) {
  return (index, width, height, X, Y, V) => {
    const W = new V.constructor(width * height);
    const delaunay = d3.Delaunay.from(
      index,
      (i) => X[i],
      (i) => Y[i]
    );
    // memoization of delaunay.find for the line start (iy), pixel (ix), and wos step (iw)
    let iy, ix, iw;
    for (let y = 0.5, k = 0; y < height; ++y) {
      ix = iy;
      for (let x = 0.5; x < width; ++x, ++k) {
        let cx = x;
        let cy = y;
        iw = ix = delaunay.find(cx, cy, ix);
        if (x === 0.5) iy = ix;
        let distance; // distance to closest sample
        let step = 0; // count of steps for this walk
        while ((distance = Math.hypot(X[index[iw]] - cx, Y[index[iw]] - cy)) > minDistance && step < maxSteps) {
          const angle = random(x, y, step) * 2 * Math.PI;
          cx += Math.cos(angle) * distance;
          cy += Math.sin(angle) * distance;
          iw = delaunay.find(cx, cy, iw);
          ++step;
        }
        W[k] = V[index[iw]];
      }
    }
    return W;
  };
}

function blend(a, ca, b, cb, c, cc) {
  return ca * a + cb * b + cc * c;
}

function pick(random) {
  return (a, ca, b, cb, c, cc, x, y) => {
    const u = random(x, y);
    return u < ca ? a : u < ca + cb ? b : c;
  };
}

function mixer(F, random) {
  return isNumeric(F) || isTemporal(F) ? blend : pick(random);
}

function denseX(x1, x2, width) {
  return {
    transform(data) {
      const n = data.length;
      const X = new Float64Array(n);
      const kx = (x2 - x1) / width;
      const x0 = x1 + kx / 2;
      for (let i = 0; i < n; ++i) X[i] = (i % width) * kx + x0;
      return X;
    }
  };
}

function denseY(y1, y2, width, height) {
  return {
    transform(data) {
      const n = data.length;
      const Y = new Float64Array(n);
      const ky = (y2 - y1) / height;
      const y0 = y1 + ky / 2;
      for (let i = 0; i < n; ++i) Y[i] = (Math.floor(i / width) % height) * ky + y0;
      return Y;
    }
  };
}

const defaults$5 = {
  ariaLabel: "contour",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1,
  pixelSize: 2
};

class Contour extends AbstractRaster {
  constructor(data, {smooth = true, value, ...options} = {}) {
    const channels = styles({}, options, defaults$5);

    // If value is not specified explicitly, look for a channel to promote. If
    // more than one channel is present, throw an error. (To disambiguate,
    // specify the value option explicitly.)
    if (value === undefined) {
      for (const key in channels) {
        if (channels[key].value != null) {
          if (value !== undefined) throw new Error("ambiguous contour value");
          value = options[key];
          options[key] = "value";
        }
      }
    }

    // For any channel specified as the literal (contour threshold) "value"
    // (maybe because of the promotion above), propagate the label from the
    // original value definition.
    if (value != null) {
      const v = {transform: (D) => D.map((d) => d.value), label: labelof(value)};
      for (const key in channels) {
        if (options[key] === "value") {
          options[key] = v;
        }
      }
    }

    // If the data is null, then we’ll construct the raster grid by evaluating a
    // function for each point in a dense grid. The value channel is populated
    // by the sampler initializer, and hence is not passed to super to avoid
    // computing it before there’s data.
    if (data == null) {
      if (value == null) throw new Error("missing contour value");
      options = sampler("value", {value, ...options});
      value = null;
    }

    // Otherwise if data was provided, it represents a discrete set of spatial
    // samples (often a grid, but not necessarily). If no interpolation method
    // was specified, default to nearest.
    else {
      let {interpolate} = options;
      if (value === undefined) value = identity$1;
      if (interpolate === undefined) options.interpolate = "nearest";
    }

    // Wrap the options in our initializer that computes the contour geometries;
    // this runs after any other initializers (and transforms).
    super(data, {value: {value, optional: true}}, contourGeometry(options), defaults$5);

    // With the exception of the x, y, x1, y1, x2, y2, and value channels, this
    // mark’s channels are not evaluated on the initial data but rather on the
    // contour multipolygons generated in the initializer.
    const contourChannels = {geometry: {value: identity$1}};
    for (const key in this.channels) {
      const channel = this.channels[key];
      const {scale} = channel;
      if (scale === "x" || scale === "y" || key === "value") continue;
      contourChannels[key] = channel;
      delete this.channels[key];
    }
    this.contourChannels = contourChannels;
    this.smooth = !!smooth;
  }
  filter(index, {x, y, value, ...channels}, values) {
    // Only filter channels constructed by the contourGeometry initializer; the
    // x, y, and value channels must be filtered by the initializer itself.
    return super.filter(index, channels, values);
  }
  render(index, scales, channels, dimensions, context) {
    const {geometry: G} = channels;
    const path = d3.geoPath();
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) => {
        g.selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .attr("d", (i) => path(G[i]))
          .call(applyChannelStyles, this, channels);
      })
      .node();
  }
}

function contourGeometry({thresholds, interval, ...options}) {
  thresholds = maybeThresholds(thresholds, interval, d3.thresholdSturges);
  return initializer(options, function (data, facets, channels, scales, dimensions, context) {
    const [x1, y1, x2, y2] = rasterBounds(channels, scales, dimensions, context);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const {pixelSize: k, width: w = Math.round(Math.abs(dx) / k), height: h = Math.round(Math.abs(dy) / k)} = this;
    const kx = w / dx;
    const ky = h / dy;
    const V = channels.value.value;
    const VV = []; // V per facet

    // Interpolate the raster grid, as needed.
    if (this.interpolate) {
      const {x: X, y: Y} = applyPosition(channels, scales, context);
      // Convert scaled (screen) coordinates to grid (canvas) coordinates.
      const IX = map$1(X, (x) => (x - x1) * kx, Float64Array);
      const IY = map$1(Y, (y) => (y - y1) * ky, Float64Array);
      // The contour mark normally skips filtering on x, y, and value, so here
      // we’re careful to use different names (0, 1, 2) when filtering.
      const ichannels = [channels.x, channels.y, channels.value];
      const ivalues = [IX, IY, V];
      for (const facet of facets) {
        const index = this.filter(facet, ichannels, ivalues);
        VV.push(this.interpolate(index, w, h, IX, IY, V));
      }
    }

    // Otherwise, chop up the existing dense raster grid into facets, if needed.
    // V must be a dense grid in projected coordinates; if there are multiple
    // facets, then V must be laid out vertically as facet 0, 1, 2… etc.
    else if (facets) {
      const n = w * h;
      const m = facets.length;
      for (let i = 0; i < m; ++i) VV.push(V.slice(i * n, i * n + n));
    } else {
      VV.push(V);
    }

    // Blur the raster grid, if desired.
    if (this.blur > 0) for (const V of VV) d3.blur2({data: V, width: w, height: h}, this.blur);

    // Compute the contour thresholds.
    const T = maybeTicks(thresholds, V, ...finiteExtent(VV));
    if (T === null) throw new Error(`unsupported thresholds: ${thresholds}`);

    // Compute the (maybe faceted) contours.
    const {contour} = d3.contours().size([w, h]).smooth(this.smooth);
    const contourData = [];
    const contourFacets = [];
    for (const V of VV) {
      contourFacets.push(d3.range(contourData.length, contourData.push(...map$1(T, (t) => contour(V, t)))));
    }

    // Rescale the contour multipolygon from grid to screen coordinates.
    for (const {coordinates} of contourData) {
      for (const rings of coordinates) {
        for (const ring of rings) {
          for (const point of ring) {
            point[0] = point[0] / kx + x1;
            point[1] = point[1] / ky + y1;
          }
        }
      }
    }

    // Compute the deferred channels.
    return {
      data: contourData,
      facets: contourFacets,
      channels: createChannels(this.contourChannels, contourData)
    };
  });
}

// Apply the thresholds interval, function, or count, and return an array of
// ticks. d3-contour unlike d3-array doesn’t pass the min and max automatically,
// so we do that here to normalize, and also so we can share consistent
// thresholds across facets. When an interval is used, note that the lowest
// threshold should be below (or equal) to the lowest value, or else some data
// will be missing.
function maybeTicks(thresholds, V, min, max) {
  if (typeof thresholds?.range === "function") return thresholds.range(thresholds.floor(min), max);
  if (typeof thresholds === "function") thresholds = thresholds(V, min, max);
  if (typeof thresholds !== "number") return arrayify(thresholds);
  const tz = d3.ticks(...d3.nice(min, max, thresholds), thresholds);
  while (tz[tz.length - 1] >= max) tz.pop();
  while (tz[1] < min) tz.shift();
  return tz;
}

function contour() {
  return new Contour(...maybeTuples("value", ...arguments));
}

function finiteExtent(VV) {
  return [d3.min(VV, (V) => d3.min(V, finite)), d3.max(VV, (V) => d3.max(V, finite))];
}

function finite(x) {
  return isFinite(x) ? x : NaN;
}

function crosshair(data, options) {
  return crosshairK(pointer, data, options);
}

function crosshairX(data, options = {}) {
  return crosshairK(pointerX, data, options);
}

function crosshairY(data, options = {}) {
  return crosshairK(pointerY, data, options);
}

function crosshairK(pointer, data, options = {}) {
  const {x, y, maxRadius} = options;
  const p = pointer({px: x, py: y, maxRadius});
  const M = [];
  if (x != null) M.push(ruleX(data, ruleOptions("x", {...p, inset: -6}, options)));
  if (y != null) M.push(ruleY(data, ruleOptions("y", {...p, inset: -6}, options)));
  if (x != null) M.push(text(data, textOptions("x", {...p, dy: 9, frameAnchor: "bottom", lineAnchor: "top"}, options)));
  if (y != null) M.push(text(data, textOptions("y", {...p, dx: -9, frameAnchor: "left", textAnchor: "end"}, options)));
  for (const m of M) m.ariaLabel = `crosshair ${m.ariaLabel}`;
  return marks(...M);
}

function markOptions(
  k,
  {channels: pointerChannels, ...pointerOptions},
  {facet, facetAnchor, fx, fy, [k]: p, channels, transform, initializer}
) {
  return {
    ...pointerOptions,
    facet,
    facetAnchor,
    fx,
    fy,
    [k]: p,
    channels: {...pointerChannels, ...channels},
    transform,
    initializer: pxpy(k, initializer)
  };
}

// Wrap the initializer, if any, mapping px and py to x and y temporarily (e.g.,
// for hexbin) then mapping back to px and py for rendering.
function pxpy(k, i) {
  if (i == null) return i;
  return function (data, facets, {x: x1, y: y1, px, py, ...c1}, ...args) {
    const {channels: {x, y, ...c} = {}, ...rest} = i.call(this, data, facets, {...c1, x: px, y: py}, ...args);
    return {
      channels: {
        ...c,
        ...(x && {px: x, ...(k === "x" && {x})}),
        ...(y && {py: y, ...(k === "y" && {y})})
      },
      ...rest
    };
  };
}

function ruleOptions(k, pointerOptions, options) {
  const {
    color = "currentColor",
    opacity = 0.2,
    ruleStroke: stroke = color,
    ruleStrokeOpacity: strokeOpacity = opacity,
    ruleStrokeWidth: strokeWidth
  } = options;
  return {
    ...markOptions(k, pointerOptions, options),
    stroke,
    strokeOpacity,
    strokeWidth
  };
}

function textOptions(k, pointerOptions, options) {
  const {
    color = "currentColor",
    textFill: fill = color,
    textFillOpacity: fillOpacity,
    textStroke: stroke = "var(--plot-background)",
    textStrokeOpacity: strokeOpacity,
    textStrokeWidth: strokeWidth = 5
  } = options;
  return {
    ...markOptions(k, pointerOptions, textChannel(k, options)),
    fill,
    fillOpacity,
    stroke,
    strokeOpacity,
    strokeWidth
  };
}

// Rather than aliasing text to have the same definition as x and y, we use an
// initializer to alias the channel values, such that the text channel can be
// derived by an initializer such as hexbin.
function textChannel(source, options) {
  return initializer(options, (data, facets, channels) => {
    return {channels: {text: {value: getSource(channels, source)?.value}}};
  });
}

const delaunayLinkDefaults = {
  ariaLabel: "delaunay link",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};

const delaunayMeshDefaults = {
  ariaLabel: "delaunay mesh",
  fill: null,
  stroke: "currentColor",
  strokeOpacity: 0.2
};

const hullDefaults = {
  ariaLabel: "hull",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeMiterlimit: 1
};

const voronoiDefaults = {
  ariaLabel: "voronoi",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};

const voronoiMeshDefaults = {
  ariaLabel: "voronoi mesh",
  fill: null,
  stroke: "currentColor",
  strokeOpacity: 0.2
};

class DelaunayLink extends Mark {
  constructor(data, options = {}) {
    const {x, y, z, curve, tension} = options;
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        z: {value: z, optional: true}
      },
      options,
      delaunayLinkDefaults
    );
    this.curve = maybeCurve(curve, tension);
    markers(this, options);
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, z: Z} = channels;
    const {curve} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const xi = X ? (i) => X[i] : constant(cx);
    const yi = Y ? (i) => Y[i] : constant(cy);
    const mark = this;

    function links(index) {
      let i = -1;
      const newIndex = [];
      const newChannels = {};
      for (const k in channels) newChannels[k] = [];
      const X1 = [];
      const X2 = [];
      const Y1 = [];
      const Y2 = [];

      function link(ti, tj) {
        ti = index[ti];
        tj = index[tj];
        newIndex.push(++i);
        X1[i] = xi(ti);
        Y1[i] = yi(ti);
        X2[i] = xi(tj);
        Y2[i] = yi(tj);
        for (const k in channels) newChannels[k].push(channels[k][tj]);
      }

      const {halfedges, hull, triangles} = d3.Delaunay.from(index, xi, yi);
      for (let i = 0; i < halfedges.length; ++i) {
        // inner edges
        const j = halfedges[i];
        if (j > i) link(triangles[i], triangles[j]);
      }
      for (let i = 0; i < hull.length; ++i) {
        // convex hull
        link(hull[i], hull[(i + 1) % hull.length]);
      }

      d3.select(this)
        .selectAll()
        .data(newIndex)
        .enter()
        .append("path")
        .call(applyDirectStyles, mark)
        .attr("d", (i) => {
          const p = d3.pathRound();
          const c = curve(p);
          c.lineStart();
          c.point(X1[i], Y1[i]);
          c.point(X2[i], Y2[i]);
          c.lineEnd();
          return p;
        })
        .call(applyChannelStyles, mark, newChannels)
        .call(applyMarkers, mark, newChannels, context);
    }

    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call(
        Z
          ? (g) =>
              g
                .selectAll()
                .data(d3.group(index, (i) => Z[i]).values())
                .enter()
                .append("g")
                .each(links)
          : (g) => g.datum(index).each(links)
      )
      .node();
  }
}

class AbstractDelaunayMark extends Mark {
  constructor(data, options = {}, defaults, zof = ({z}) => z) {
    const {x, y} = options;
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        z: {value: zof(options), optional: true}
      },
      options,
      defaults
    );
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, z: Z} = channels;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const xi = X ? (i) => X[i] : constant(cx);
    const yi = Y ? (i) => Y[i] : constant(cy);
    const mark = this;

    function mesh(index) {
      const delaunay = d3.Delaunay.from(index, xi, yi);
      d3.select(this)
        .append("path")
        .datum(index[0])
        .call(applyDirectStyles, mark)
        .attr("d", mark._render(delaunay, dimensions))
        .call(applyChannelStyles, mark, channels);
    }

    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call(
        Z
          ? (g) =>
              g
                .selectAll()
                .data(d3.group(index, (i) => Z[i]).values())
                .enter()
                .append("g")
                .each(mesh)
          : (g) => g.datum(index).each(mesh)
      )
      .node();
  }
}

class DelaunayMesh extends AbstractDelaunayMark {
  constructor(data, options = {}) {
    super(data, options, delaunayMeshDefaults);
    this.fill = "none";
  }
  _render(delaunay) {
    return delaunay.render();
  }
}

class Hull extends AbstractDelaunayMark {
  constructor(data, options = {}) {
    super(data, options, hullDefaults, maybeZ);
  }
  _render(delaunay) {
    return delaunay.renderHull();
  }
}

class Voronoi extends Mark {
  constructor(data, options = {}) {
    const {x, y, z} = options;
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        z: {value: z, optional: true}
      },
      options,
      voronoiDefaults
    );
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, z: Z} = channels;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const xi = X ? (i) => X[i] : constant(cx);
    const yi = Y ? (i) => Y[i] : constant(cy);
    const mark = this;

    function cells(index) {
      const delaunay = d3.Delaunay.from(index, xi, yi);
      const voronoi = voronoiof(delaunay, dimensions);
      d3.select(this)
        .selectAll()
        .data(index)
        .enter()
        .append("path")
        .call(applyDirectStyles, mark)
        .attr("d", (_, i) => voronoi.renderCell(i))
        .call(applyChannelStyles, mark, channels);
    }

    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call(
        Z
          ? (g) =>
              g
                .selectAll()
                .data(d3.group(index, (i) => Z[i]).values())
                .enter()
                .append("g")
                .each(cells)
          : (g) => g.datum(index).each(cells)
      )
      .node();
  }
}

class VoronoiMesh extends AbstractDelaunayMark {
  constructor(data, options) {
    super(data, options, voronoiMeshDefaults);
    this.fill = "none";
  }
  _render(delaunay, dimensions) {
    return voronoiof(delaunay, dimensions).render();
  }
}

function voronoiof(delaunay, dimensions) {
  const {width, height, marginTop, marginRight, marginBottom, marginLeft} = dimensions;
  return delaunay.voronoi([marginLeft, marginTop, width - marginRight, height - marginBottom]);
}

function delaunayMark(DelaunayMark, data, {x, y, ...options} = {}) {
  [x, y] = maybeTuple(x, y);
  return new DelaunayMark(data, {...options, x, y});
}

function delaunayLink(data, options) {
  return delaunayMark(DelaunayLink, data, options);
}

function delaunayMesh(data, options) {
  return delaunayMark(DelaunayMesh, data, options);
}

function hull(data, options) {
  return delaunayMark(Hull, data, options);
}

function voronoi(data, options) {
  return delaunayMark(Voronoi, data, options);
}

function voronoiMesh(data, options) {
  return delaunayMark(VoronoiMesh, data, options);
}

const defaults$4 = {
  ariaLabel: "density",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};

class Density extends Mark {
  constructor(data, {x, y, z, weight, fill, stroke, ...options} = {}) {
    // If fill or stroke is specified as “density”, then temporarily treat these
    // as a literal color when computing defaults and maybeZ; below, we’ll unset
    // these constant colors back to undefined since they will instead be
    // populated by a channel generated by the initializer.
    const fillDensity = isDensity(fill) && ((fill = "currentColor"), true);
    const strokeDensity = isDensity(stroke) && ((stroke = "currentColor"), true);
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        z: {value: maybeZ({z, fill, stroke}), optional: true},
        weight: {value: weight, optional: true}
      },
      densityInitializer({...options, fill, stroke}, fillDensity, strokeDensity),
      defaults$4
    );
    if (fillDensity) this.fill = undefined;
    if (strokeDensity) this.stroke = undefined;
    this.z = z;
  }
  filter(index) {
    return index; // don’t filter contours constructed by initializer
  }
  render(index, scales, channels, dimensions, context) {
    const {contours} = channels;
    const path = d3.geoPath();
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {})
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .call(applyChannelStyles, this, channels)
          .attr("d", (i) => path(contours[i]))
      )
      .node();
  }
}

function density(data, {x, y, ...options} = {}) {
  [x, y] = maybeTuple(x, y);
  return new Density(data, {...options, x, y});
}

const dropChannels = new Set(["x", "y", "z", "weight"]);

function densityInitializer(options, fillDensity, strokeDensity) {
  const k = 100; // arbitrary scale factor for readability
  let {bandwidth, thresholds} = options;
  bandwidth = bandwidth === undefined ? 20 : +bandwidth;
  thresholds =
    thresholds === undefined
      ? 20
      : typeof thresholds?.[Symbol.iterator] === "function"
      ? coerceNumbers(thresholds)
      : +thresholds;
  return initializer(options, function (data, facets, channels, scales, dimensions, context) {
    const W = channels.weight ? coerceNumbers(channels.weight.value) : null;
    const Z = channels.z?.value;
    const {z} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const {width, height} = dimensions;

    // Get the (either scaled or projected) xy channels.
    const {x: X, y: Y} = applyPosition(channels, scales, context);

    // Group any of the input channels according to the first index associated
    // with each z-series or facet. Drop any channels not be needed for
    // rendering after the contours are computed.
    const newChannels = Object.fromEntries(
      Object.entries(channels)
        .filter(([key]) => !dropChannels.has(key))
        .map(([key, channel]) => [key, {...channel, value: []}])
    );

    // If the fill or stroke encodes density, construct new output channels.
    const FD = fillDensity && [];
    const SD = strokeDensity && [];

    const density = d3.contourDensity()
      .x(X ? (i) => X[i] : cx)
      .y(Y ? (i) => Y[i] : cy)
      .weight(W ? (i) => W[i] : 1)
      .size([width, height])
      .bandwidth(bandwidth);

    // Compute the grid for each facet-series.
    const facetsContours = [];
    for (const facet of facets) {
      const facetContours = [];
      facetsContours.push(facetContours);
      for (const index of Z ? groupZ(facet, Z, z) : [facet]) {
        const contour = density.contours(index);
        facetContours.push([index, contour]);
      }
    }

    // If explicit thresholds were not specified, find the maximum density of
    // all grids and use this to compute thresholds.
    let T = thresholds;
    if (!(T instanceof TypedArray)) {
      let maxValue = 0;
      for (const facetContours of facetsContours) {
        for (const [, contour] of facetContours) {
          const max = contour.max;
          if (max > maxValue) maxValue = max;
        }
      }
      T = Float64Array.from({length: thresholds - 1}, (_, i) => (maxValue * k * (i + 1)) / thresholds);
    }

    // Generate contours for each facet-series.
    const newFacets = [];
    const contours = [];
    for (const facetContours of facetsContours) {
      const newFacet = [];
      newFacets.push(newFacet);
      for (const [index, contour] of facetContours) {
        for (const t of T) {
          newFacet.push(contours.length);
          contours.push(contour(t / k));
          if (FD) FD.push(t);
          if (SD) SD.push(t);
          for (const key in newChannels) {
            newChannels[key].value.push(channels[key].value[index[0]]);
          }
        }
      }
    }

    // If the fill or stroke encodes density, ensure that a zero value is
    // included so that the default color scale domain starts at zero. Otherwise
    // if the starting range value is the same as the background color, the
    // first contour might not be visible.
    if (FD) FD.push(0);
    if (SD) SD.push(0);

    return {
      data,
      facets: newFacets,
      channels: {
        ...newChannels,
        ...(FD && {fill: {value: FD, scale: "color"}}),
        ...(SD && {stroke: {value: SD, scale: "color"}}),
        contours: {value: contours}
      }
    };
  });
}

function isDensity(value) {
  return /^density$/i.test(value);
}

function differenceX(data, options) {
  return differenceK("x", data, options);
}

function differenceY(data, options) {
  return differenceK("y", data, options);
}

function differenceK(
  k,
  data,
  {
    x1,
    x2,
    y1,
    y2,
    x = x1 === undefined && x2 === undefined ? (k === "y" ? indexOf : identity$1) : undefined,
    y = y1 === undefined && y2 === undefined ? (k === "x" ? indexOf : identity$1) : undefined,
    fill, // ignored
    positiveFill = "#3ca951",
    negativeFill = "#4269d0",
    fillOpacity = 1,
    positiveFillOpacity = fillOpacity,
    negativeFillOpacity = fillOpacity,
    stroke,
    strokeOpacity,
    z = maybeColorChannel(stroke)[0],
    clip, // optional additional clip for area
    tip,
    render,
    ...options
  } = {}
) {
  [x1, x2] = memoTuple(x, x1, x2);
  [y1, y2] = memoTuple(y, y1, y2);
  if (x1 === x2 && y1 === y2) {
    if (k === "y") y1 = memo(0);
    else x1 = memo(0);
  }
  ({tip} = withTip({tip}, k === "y" ? "x" : "y"));
  return marks(
    !isNoneish(positiveFill)
      ? Object.assign(
          area(data, {
            x1,
            x2,
            y1,
            y2,
            z,
            fill: positiveFill,
            fillOpacity: positiveFillOpacity,
            render: composeRender(render, clipDifference(k, true)),
            clip,
            ...options
          }),
          {ariaLabel: "positive difference"}
        )
      : null,
    !isNoneish(negativeFill)
      ? Object.assign(
          area(data, {
            x1,
            x2,
            y1,
            y2,
            z,
            fill: negativeFill,
            fillOpacity: negativeFillOpacity,
            render: composeRender(render, clipDifference(k, false)),
            clip,
            ...options
          }),
          {ariaLabel: "negative difference"}
        )
      : null,
    line(data, {
      x: x2,
      y: y2,
      z,
      stroke,
      strokeOpacity,
      tip,
      clip: true,
      ...options
    })
  );
}

function memoTuple(x, x1, x2) {
  if (x1 === undefined && x2 === undefined) {
    // {x} → [x, x]
    x1 = x2 = memo(x);
  } else if (x1 === undefined) {
    // {x2} → [x2, x2]
    // {x, x2} → [x, x2]
    x2 = memo(x2);
    x1 = x === undefined ? x2 : memo(x);
  } else if (x2 === undefined) {
    // {x1} → [x1, x1]
    // {x, x1} → [x1, x]
    x1 = memo(x1);
    x2 = x === undefined ? x1 : memo(x);
  } else {
    // {x1, x2} → [x1, x2]
    x1 = memo(x1);
    x2 = memo(x2);
  }
  return [x1, x2];
}

function memo(v) {
  let V;
  const {value, label = labelof(value)} = maybeValue(v);
  return {transform: (data) => V || (V = valueof(data, value)), label};
}

function clipDifference(k, positive) {
  const f = k === "x" ? "y" : "x"; // f is the flipped dimension
  const f1 = `${f}1`;
  const f2 = `${f}2`;
  const k1 = `${k}1`;
  const k2 = `${k}2`;
  return (index, scales, channels, dimensions, context, next) => {
    const {[f1]: F1, [f2]: F2} = channels;
    const K1 = new Float32Array(F1.length);
    const K2 = new Float32Array(F2.length);
    const m = dimensions[k === "y" ? "height" : "width"];
    (positive === inferScaleOrder(scales[k]) < 0 ? K1 : K2).fill(m);
    const oc = next(index, scales, {...channels, [f2]: F1, [k2]: K2}, dimensions, context);
    const og = next(index, scales, {...channels, [f1]: F2, [k1]: K1}, dimensions, context);
    const c = oc.querySelector("g") ?? oc; // applyClip
    const g = og.querySelector("g") ?? og; // applyClip
    for (let i = 0; c.firstChild; i += 2) {
      const id = getClipId();
      const clipPath = create("svg:clipPath", context).attr("id", id).node();
      clipPath.appendChild(c.firstChild);
      g.childNodes[i].setAttribute("clip-path", `url(#${id})`);
      g.insertBefore(clipPath, g.childNodes[i]);
    }
    return og;
  };
}

function centroid({geometry = identity$1, ...options} = {}) {
  const getG = memoize1((data) => valueof(data, geometry));
  return initializer(
    // Suppress defaults for x and y since they will be computed by the initializer.
    // Propagate the (memoized) geometry channel in case it’s still needed.
    {...options, x: null, y: null, geometry: {transform: getG}},
    (data, facets, channels, scales, dimensions, {projection}) => {
      const G = getG(data);
      const n = G.length;
      const X = new Float64Array(n);
      const Y = new Float64Array(n);
      const path = d3.geoPath(projection);
      for (let i = 0; i < n; ++i) [X[i], Y[i]] = path.centroid(G[i]);
      return {
        data,
        facets,
        channels: {
          x: {value: X, scale: projection == null ? "x" : null, source: null},
          y: {value: Y, scale: projection == null ? "y" : null, source: null}
        }
      };
    }
  );
}

function geoCentroid({geometry = identity$1, ...options} = {}) {
  const getG = memoize1((data) => valueof(data, geometry));
  const getC = memoize1((data) => valueof(getG(data), d3.geoCentroid));
  return {
    ...options,
    x: {transform: (data) => Float64Array.from(getC(data), ([x]) => x)},
    y: {transform: (data) => Float64Array.from(getC(data), ([, y]) => y)},
    geometry: {transform: getG}
  };
}

const defaults$3 = {
  ariaLabel: "geo",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};

class Geo extends Mark {
  constructor(data, options = {}) {
    const [vr, cr] = maybeNumberChannel(options.r, 3);
    super(
      data,
      {
        x: {value: options.tip ? options.x : null, scale: "x", optional: true},
        y: {value: options.tip ? options.y : null, scale: "y", optional: true},
        r: {value: vr, scale: "r", filter: positive, optional: true},
        geometry: {value: options.geometry, scale: "projection"}
      },
      withDefaultSort(options),
      defaults$3
    );
    this.r = cr;
  }
  render(index, scales, channels, dimensions, context) {
    const {geometry: G, r: R} = channels;
    const path = d3.geoPath(context.projection ?? scaleProjection(scales));
    const {r} = this;
    if (negative(r)) index = [];
    else if (r !== undefined) path.pointRadius(r);
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) => {
        g.selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .attr("d", R ? (i) => path.pointRadius(R[i])(G[i]) : (i) => path(G[i]))
          .call(applyChannelStyles, this, channels);
      })
      .node();
  }
}

// If no projection is specified, default to a projection that passes points
// through the x and y scales, if any.
function scaleProjection({x: X, y: Y}) {
  if (X || Y) {
    X ??= (x) => x;
    Y ??= (y) => y;
    return d3.geoTransform({
      point(x, y) {
        this.stream.point(X(x), Y(y));
      }
    });
  }
}

function geo(data, options = {}) {
  if (options.tip && options.x === undefined && options.y === undefined) options = centroid(options);
  else if (options.geometry === undefined) options = {...options, geometry: identity$1};
  return new Geo(data, options);
}

function sphere({strokeWidth = 1.5, ...options} = {}) {
  return geo({type: "Sphere"}, {strokeWidth, ...options});
}

function graticule({strokeOpacity = 0.1, ...options} = {}) {
  return geo(d3.geoGraticule10(), {strokeOpacity, ...options});
}

// We don’t want the hexagons to align with the edges of the plot frame, as that
// would cause extreme x-values (the upper bound of the default x-scale domain)
// to be rounded up into a floating bin to the right of the plot. Therefore,
// rather than centering the origin hexagon around ⟨0,0⟩ in screen coordinates,
// we offset slightly to ⟨0.5,0⟩. The hexgrid mark uses the same origin.
const ox = 0.5,
  oy = 0;

function hexbin(outputs = {fill: "count"}, {binWidth, ...options} = {}) {
  const {z} = options;

  // TODO filter e.g. to show empty hexbins?
  binWidth = binWidth === undefined ? 20 : number$1(binWidth);
  outputs = maybeGroupOutputs(outputs, options);

  // A fill output means a fill channel; declaring the channel here instead of
  // waiting for the initializer allows the mark constructor to determine that
  // the stroke should default to none (assuming a mark that defaults to fill
  // and no stroke, such as dot). Note that it’s safe to mutate options here
  // because we just created it with the rest operator above.
  if (hasOutput(outputs, "fill")) options.channels = {...options.channels, fill: {value: []}};

  // Populate default values for the r and symbol options, as appropriate.
  if (options.symbol === undefined) options.symbol = "hexagon";
  if (options.r === undefined && !hasOutput(outputs, "r")) options.r = binWidth / 2;

  return initializer(options, (data, facets, channels, scales, _, context) => {
    let {x: X, y: Y, z: Z, fill: F, stroke: S, symbol: Q} = channels;
    if (X === undefined) throw new Error("missing channel: x");
    if (Y === undefined) throw new Error("missing channel: y");

    // Get the (either scaled or projected) xy channels.
    ({x: X, y: Y} = applyPosition(channels, scales, context));

    // Extract the values for channels that are eligible for grouping; not all
    // marks define a z channel, so compute one if it not already computed. If z
    // was explicitly set to null, ensure that we don’t subdivide bins.
    Z = Z ? Z.value : valueof(data, z);
    F = F?.value;
    S = S?.value;
    Q = Q?.value;

    // Group on the first of z, fill, stroke, and symbol. Implicitly reduce
    // these channels using the first corresponding value for each bin.
    const G = maybeSubgroup(outputs, {z: Z, fill: F, stroke: S, symbol: Q});
    const GZ = Z && [];
    const GF = F && [];
    const GS = S && [];
    const GQ = Q && [];

    // Construct the hexbins and populate the output channels.
    const binFacets = [];
    const BX = [];
    const BY = [];
    let i = -1;
    for (const o of outputs) o.initialize(data);
    for (const facet of facets) {
      const binFacet = [];
      for (const o of outputs) o.scope("facet", facet);
      for (const [f, I] of maybeGroup(facet, G)) {
        for (const {index: b, extent} of hbin(data, I, X, Y, binWidth)) {
          binFacet.push(++i);
          BX.push(extent.x);
          BY.push(extent.y);
          if (Z) GZ.push(G === Z ? f : Z[b[0]]);
          if (F) GF.push(G === F ? f : F[b[0]]);
          if (S) GS.push(G === S ? f : S[b[0]]);
          if (Q) GQ.push(G === Q ? f : Q[b[0]]);
          for (const o of outputs) o.reduce(b, extent);
        }
      }
      binFacets.push(binFacet);
    }

    // Construct the output channels, and populate the radius scale hint.
    const sx = channels.x.scale;
    const sy = channels.y.scale;
    const binChannels = {
      x: {value: BX, source: scales[sx] ? {value: map$1(BX, scales[sx].invert), scale: sx} : null},
      y: {value: BY, source: scales[sy] ? {value: map$1(BY, scales[sy].invert), scale: sy} : null},
      ...(Z && {z: {value: GZ}}),
      ...(F && {fill: {value: GF, scale: "auto"}}),
      ...(S && {stroke: {value: GS, scale: "auto"}}),
      ...(Q && {symbol: {value: GQ, scale: "auto"}}),
      ...Object.fromEntries(
        outputs.map(({name, output}) => [
          name,
          {
            scale: "auto",
            label: output.label,
            radius: name === "r" ? binWidth / 2 : undefined,
            value: output.transform()
          }
        ])
      )
    };

    return {data, facets: binFacets, channels: binChannels};
  });
}

function hbin(data, I, X, Y, dx) {
  const dy = dx * (1.5 / sqrt3);
  const bins = new Map();
  for (const i of I) {
    let px = X[i],
      py = Y[i];
    if (isNaN(px) || isNaN(py)) continue;
    let pj = Math.round((py = (py - oy) / dy)),
      pi = Math.round((px = (px - ox) / dx - (pj & 1) / 2)),
      py1 = py - pj;
    if (Math.abs(py1) * 3 > 1) {
      let px1 = px - pi,
        pi2 = pi + (px < pi ? -1 : 1) / 2,
        pj2 = pj + (py < pj ? -1 : 1),
        px2 = px - pi2,
        py2 = py - pj2;
      if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) (pi = pi2 + (pj & 1 ? 1 : -1) / 2), (pj = pj2);
    }
    const key = `${pi},${pj}`;
    let bin = bins.get(key);
    if (bin === undefined) {
      bin = {index: [], extent: {data, x: (pi + (pj & 1) / 2) * dx + ox, y: pj * dy + oy}};
      bins.set(key, bin);
    }
    bin.index.push(i);
  }
  return bins.values();
}

const defaults$2 = {
  ariaLabel: "hexgrid",
  fill: "none",
  stroke: "currentColor",
  strokeOpacity: 0.1
};

function hexgrid(options) {
  return new Hexgrid(options);
}

class Hexgrid extends Mark {
  constructor({binWidth = 20, clip = true, ...options} = {}) {
    super(singleton, undefined, {clip, ...options}, defaults$2);
    this.binWidth = number$1(binWidth);
  }
  render(index, scales, channels, dimensions, context) {
    const {binWidth} = this;
    const {marginTop, marginRight, marginBottom, marginLeft, width, height} = dimensions;
    const x0 = marginLeft - ox,
      x1 = width - marginRight - ox,
      y0 = marginTop - oy,
      y1 = height - marginBottom - oy,
      rx = binWidth / 2,
      ry = rx * sqrt4_3,
      hy = ry / 2,
      wx = rx * 2,
      wy = ry * 1.5,
      i0 = Math.floor(x0 / wx),
      i1 = Math.ceil(x1 / wx),
      j0 = Math.floor((y0 + hy) / wy),
      j1 = Math.ceil((y1 - hy) / wy) + 1,
      path = `m0,${round(-ry)}l${round(rx)},${round(hy)}v${round(ry)}l${round(-rx)},${round(hy)}`;
    let d = path;
    for (let j = j0; j < j1; ++j) {
      for (let i = i0; i < i1; ++i) {
        d += `M${round(i * wx + (j & 1) * rx)},${round(j * wy)}${path}`;
      }
    }
    return create("svg:g", context)
      .datum(0)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {}, offset + ox, offset + oy)
      .call((g) => g.append("path").call(applyDirectStyles, this).call(applyChannelStyles, this, channels).attr("d", d))
      .node();
  }
}

function round(x) {
  return Math.round(x * 1e3) / 1e3;
}

const defaults$1 = {
  ariaLabel: "image",
  fill: null,
  stroke: null
};

// Tests if the given string is a path: does it start with a dot-slash
// (./foo.png), dot-dot-slash (../foo.png), or slash (/foo.png)?
function isPath(string) {
  return /^\.*\//.test(string);
}

// Tests if the given string is a URL (e.g., https://placekitten.com/200/300).
// The allowed protocols is overly restrictive, but we don’t want to allow any
// scheme here because it would increase the likelihood of a false positive with
// a field name that happens to contain a colon.
function isUrl(string) {
  return /^(blob|data|file|http|https):/i.test(string);
}

// Disambiguates a constant src definition from a channel. A path or URL string
// is assumed to be a constant; any other string is assumed to be a field name.
function maybePathChannel(value) {
  return typeof value === "string" && (isPath(value) || isUrl(value)) ? [undefined, value] : [value, undefined];
}

class Image extends Mark {
  constructor(data, options = {}) {
    let {x, y, r, width, height, rotate, src, preserveAspectRatio, crossOrigin, frameAnchor, imageRendering} = options;
    if (r == null) r = undefined;
    if (r === undefined && width === undefined && height === undefined) width = height = 16;
    else if (width === undefined && height !== undefined) width = height;
    else if (height === undefined && width !== undefined) height = width;
    const [vs, cs] = maybePathChannel(src);
    const [vr, cr] = maybeNumberChannel(r);
    const [vw, cw] = maybeNumberChannel(width, cr !== undefined ? cr * 2 : undefined);
    const [vh, ch] = maybeNumberChannel(height, cr !== undefined ? cr * 2 : undefined);
    const [va, ca] = maybeNumberChannel(rotate, 0);
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true},
        r: {value: vr, scale: "r", filter: positive, optional: true},
        width: {value: vw, filter: positive, optional: true},
        height: {value: vh, filter: positive, optional: true},
        rotate: {value: va, optional: true},
        src: {value: vs, optional: true}
      },
      withDefaultSort(options),
      defaults$1
    );
    this.src = cs;
    this.width = cw;
    this.rotate = ca;
    this.height = ch;
    this.r = cr;
    this.preserveAspectRatio = impliedString(preserveAspectRatio, "xMidYMid");
    this.crossOrigin = string(crossOrigin);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    this.imageRendering = impliedString(imageRendering, "auto");
  }
  render(index, scales, channels, dimensions, context) {
    const {x, y} = scales;
    const {x: X, y: Y, width: W, height: H, r: R, rotate: A, src: S} = channels;
    const {r, width, height, rotate} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, {x: X && x, y: Y && y})
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("image")
          .call(applyDirectStyles, this)
          .attr("x", position(X, W, R, cx, width, r))
          .attr("y", position(Y, H, R, cy, height, r))
          .attr("width", W ? (i) => W[i] : width !== undefined ? width : R ? (i) => R[i] * 2 : r * 2)
          .attr("height", H ? (i) => H[i] : height !== undefined ? height : R ? (i) => R[i] * 2 : r * 2)
          // TODO: combine x, y, rotate and transform-origin into a single transform
          .attr("transform", A ? (i) => `rotate(${A[i]})` : rotate ? `rotate(${rotate})` : null)
          .attr("transform-origin", A || rotate ? template`${X ? (i) => X[i] : cx}px ${Y ? (i) => Y[i] : cy}px` : null)
          .call(applyAttr, "href", S ? (i) => S[i] : this.src)
          .call(applyAttr, "preserveAspectRatio", this.preserveAspectRatio)
          .call(applyAttr, "crossorigin", this.crossOrigin)
          .call(applyAttr, "image-rendering", this.imageRendering)
          .call(applyAttr, "clip-path", R ? (i) => `circle(${R[i]}px)` : r !== undefined ? `circle(${r}px)` : null)
          .call(applyChannelStyles, this, channels)
      )
      .node();
  }
}

function position(X, W, R, x, w, r) {
  return W && X
    ? (i) => X[i] - W[i] / 2
    : W
    ? (i) => x - W[i] / 2
    : X && w !== undefined
    ? (i) => X[i] - w / 2
    : w !== undefined
    ? x - w / 2
    : R && X
    ? (i) => X[i] - R[i]
    : R
    ? (i) => x - R[i]
    : X
    ? (i) => X[i] - r
    : x - r;
}

function image(data, {x, y, ...options} = {}) {
  if (options.frameAnchor === undefined) [x, y] = maybeTuple(x, y);
  return new Image(data, {...options, x, y});
}

// https://github.com/jstat/jstat
//
// Copyright (c) 2013 jStat
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

function ibetainv(p, a, b) {
  var EPS = 1e-8;
  var a1 = a - 1;
  var b1 = b - 1;
  var j = 0;
  var lna, lnb, pp, t, u, err, x, al, h, w, afac;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  if (a >= 1 && b >= 1) {
    pp = p < 0.5 ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
    if (p < 0.5) x = -x;
    al = (x * x - 3) / 6;
    h = 2 / (1 / (2 * a - 1) + 1 / (2 * b - 1));
    w = (x * Math.sqrt(al + h)) / h - (1 / (2 * b - 1) - 1 / (2 * a - 1)) * (al + 5 / 6 - 2 / (3 * h));
    x = a / (a + b * Math.exp(2 * w));
  } else {
    lna = Math.log(a / (a + b));
    lnb = Math.log(b / (a + b));
    t = Math.exp(a * lna) / a;
    u = Math.exp(b * lnb) / b;
    w = t + u;
    if (p < t / w) x = Math.pow(a * w * p, 1 / a);
    else x = 1 - Math.pow(b * w * (1 - p), 1 / b);
  }
  afac = -gammaln(a) - gammaln(b) + gammaln(a + b);
  for (; j < 10; j++) {
    if (x === 0 || x === 1) return x;
    err = ibeta(x, a, b) - p;
    t = Math.exp(a1 * Math.log(x) + b1 * Math.log(1 - x) + afac);
    u = err / t;
    x -= t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x))));
    if (x <= 0) x = 0.5 * (x + t);
    if (x >= 1) x = 0.5 * (x + t + 1);
    if (Math.abs(t) < EPS * x && j > 0) break;
  }
  return x;
}

function ibeta(x, a, b) {
  // Factors in front of the continued fraction.
  var bt =
    x === 0 || x === 1 ? 0 : Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < 0 || x > 1) return false;
  if (x < (a + 1) / (a + b + 2))
    // Use continued fraction directly.
    return (bt * betacf(x, a, b)) / a;
  // else use continued fraction after making the symmetry transformation.
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function betacf(x, a, b) {
  var fpmin = 1e-30;
  var m = 1;
  var qab = a + b;
  var qap = a + 1;
  var qam = a - 1;
  var c = 1;
  var d = 1 - (qab * x) / qap;
  var m2, aa, del, h;

  // These q's will be used in factors that occur in the coefficients
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  h = d;

  for (; m <= 100; m++) {
    m2 = 2 * m;
    aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    // One step (the even one) of the recurrence
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    // Next step of the recurrence (the odd one)
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < 3e-7) break;
  }

  return h;
}

function gammaln(x) {
  var j = 0;
  var cof = [
    76.18009172947146, -86.5053203294167, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  var ser = 1.000000000190015;
  var xx, y, tmp;
  tmp = (y = xx = x) + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  for (; j < 6; j++) ser += cof[j] / ++y;
  return Math.log((2.506628274631 * ser) / xx) - tmp;
}

function qt(p, dof) {
  var x = ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5);
  x = Math.sqrt((dof * (1 - x)) / x);
  return p > 0.5 ? x : -x;
}

const defaults = {
  ariaLabel: "linear-regression",
  fill: "currentColor",
  fillOpacity: 0.1,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};

class LinearRegression extends Mark {
  constructor(data, options = {}) {
    const {x, y, z, ci = 0.95, precision = 4} = options;
    super(
      data,
      {
        x: {value: x, scale: "x"},
        y: {value: y, scale: "y"},
        z: {value: maybeZ(options), optional: true}
      },
      options,
      defaults
    );
    this.z = z;
    this.ci = +ci;
    this.precision = +precision;
    if (!(0 <= this.ci && this.ci < 1)) throw new Error(`invalid ci; not in [0, 1): ${ci}`);
    if (!(this.precision > 0)) throw new Error(`invalid precision: ${precision}`);
  }
  render(index, scales, channels, dimensions, context) {
    const {x: X, y: Y, z: Z} = channels;
    const {ci} = this;
    return create("svg:g", context)
      .call(applyIndirectStyles, this, dimensions, context)
      .call(applyTransform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(Z ? groupZ(index, Z, this.z) : [index])
          .enter()
          .call((enter) =>
            enter
              .append("path")
              .attr("fill", "none")
              .call(applyDirectStyles, this)
              .call(applyGroupedChannelStyles, this, {...channels, fill: null, fillOpacity: null})
              .attr("d", (I) => this._renderLine(I, X, Y))
              .call(
                ci && !isNone(this.fill)
                  ? (path) =>
                      path
                        .select(pathBefore)
                        .attr("stroke", "none")
                        .call(applyDirectStyles, this)
                        .call(applyGroupedChannelStyles, this, {
                          ...channels,
                          stroke: null,
                          strokeOpacity: null,
                          strokeWidth: null
                        })
                        .attr("d", (I) => this._renderBand(I, X, Y))
                  : () => {}
              )
          )
      )
      .node();
  }
}

function pathBefore() {
  return this.parentNode.insertBefore(this.ownerDocument.createElementNS(d3.namespaces.svg, "path"), this);
}

class LinearRegressionX extends LinearRegression {
  constructor(data, options) {
    super(data, options);
  }
  _renderBand(I, X, Y) {
    const {ci, precision} = this;
    const [y1, y2] = d3.extent(I, (i) => Y[i]);
    const f = linearRegressionF(I, Y, X);
    const g = confidenceIntervalF(I, Y, X, (1 - ci) / 2, f);
    return d3.area()
      .y((y) => y)
      .x0((y) => g(y, -1))
      .x1((y) => g(y, +1))(d3.range(y1, y2 - precision / 2, precision).concat(y2));
  }
  _renderLine(I, X, Y) {
    const [y1, y2] = d3.extent(I, (i) => Y[i]);
    const f = linearRegressionF(I, Y, X);
    return `M${f(y1)},${y1}L${f(y2)},${y2}`;
  }
}

class LinearRegressionY extends LinearRegression {
  constructor(data, options) {
    super(data, options);
  }
  _renderBand(I, X, Y) {
    const {ci, precision} = this;
    const [x1, x2] = d3.extent(I, (i) => X[i]);
    const f = linearRegressionF(I, X, Y);
    const g = confidenceIntervalF(I, X, Y, (1 - ci) / 2, f);
    return d3.area()
      .x((x) => x)
      .y0((x) => g(x, -1))
      .y1((x) => g(x, +1))(d3.range(x1, x2 - precision / 2, precision).concat(x2));
  }
  _renderLine(I, X, Y) {
    const [x1, x2] = d3.extent(I, (i) => X[i]);
    const f = linearRegressionF(I, X, Y);
    return `M${x1},${f(x1)}L${x2},${f(x2)}`;
  }
}

function linearRegressionX(
  data,
  {y = indexOf, x = identity$1, stroke, fill = isNoneish(stroke) ? "currentColor" : stroke, ...options} = {}
) {
  return new LinearRegressionX(data, maybeDenseIntervalY({...options, x, y, fill, stroke}));
}

function linearRegressionY(
  data,
  {x = indexOf, y = identity$1, stroke, fill = isNoneish(stroke) ? "currentColor" : stroke, ...options} = {}
) {
  return new LinearRegressionY(data, maybeDenseIntervalX({...options, x, y, fill, stroke}));
}

function linearRegressionF(I, X, Y) {
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const i of I) {
    const xi = X[i];
    const yi = Y[i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
  }
  const n = I.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return (x) => slope * x + intercept;
}

function confidenceIntervalF(I, X, Y, p, f) {
  const mean = d3.sum(I, (i) => X[i]) / I.length;
  let a = 0,
    b = 0;
  for (const i of I) {
    a += (X[i] - mean) ** 2;
    b += (Y[i] - f(X[i])) ** 2;
  }
  const sy = Math.sqrt(b / (I.length - 2));
  const t = qt(p, I.length - 2);
  return (x, k) => {
    const Y = f(x);
    const se = sy * Math.sqrt(1 / I.length + (x - mean) ** 2 / a);
    return Y + k * t * se;
  };
}

function treeNode({
  path = identity$1, // the delimited path
  delimiter, // how the path is separated
  frameAnchor,
  treeLayout = d3.tree,
  treeSort,
  treeSeparation,
  treeAnchor,
  treeFilter,
  ...options
} = {}) {
  treeAnchor = maybeTreeAnchor(treeAnchor);
  treeSort = maybeTreeSort(treeSort);
  if (treeFilter != null) treeFilter = maybeNodeValue(treeFilter);
  if (frameAnchor === undefined) frameAnchor = treeAnchor.frameAnchor;
  const normalize = normalizer(delimiter);
  const outputs = treeOutputs(options, maybeNodeValue);
  const [X, setX] = column();
  const [Y, setY] = column();
  return {
    x: X,
    y: Y,
    frameAnchor,
    ...basic(options, (data, facets) => {
      const P = normalize(valueof(data, path));
      const X = setX([]);
      const Y = setY([]);
      let treeIndex = -1;
      const treeData = [];
      const treeFacets = [];
      const rootof = d3.stratify().path((i) => P[i]);
      const layout = treeLayout();
      if (layout.nodeSize) layout.nodeSize([1, 1]);
      if (layout.separation && treeSeparation !== undefined) layout.separation(treeSeparation ?? one);
      for (const o of outputs) o[output_values] = o[output_setValues]([]);
      for (const facet of facets) {
        const treeFacet = [];
        const root = rootof(facet.filter((i) => P[i] != null)).each((node) => (node.data = data[node.data]));
        if (treeSort != null) root.sort(treeSort);
        layout(root);
        for (const node of root.descendants()) {
          if (treeFilter != null && !treeFilter(node)) continue;
          treeFacet.push(++treeIndex);
          treeData[treeIndex] = node.data;
          treeAnchor.position(node, treeIndex, X, Y);
          for (const o of outputs) o[output_values][treeIndex] = o[output_evaluate](node);
        }
        treeFacets.push(treeFacet);
      }
      return {data: treeData, facets: treeFacets};
    }),
    ...Object.fromEntries(outputs)
  };
}

function treeLink({
  path = identity$1, // the delimited path
  delimiter, // how the path is separated
  curve = "bump-x",
  stroke = "#555",
  strokeWidth = 1.5,
  strokeOpacity = 0.5,
  treeLayout = d3.tree,
  treeSort,
  treeSeparation,
  treeAnchor,
  treeFilter,
  ...options
} = {}) {
  treeAnchor = maybeTreeAnchor(treeAnchor);
  treeSort = maybeTreeSort(treeSort);
  if (treeFilter != null) treeFilter = maybeLinkValue(treeFilter);
  options = {curve, stroke, strokeWidth, strokeOpacity, ...options};
  const normalize = normalizer(delimiter);
  const outputs = treeOutputs(options, maybeLinkValue);
  const [X1, setX1] = column();
  const [X2, setX2] = column();
  const [Y1, setY1] = column();
  const [Y2, setY2] = column();
  return {
    x1: X1,
    x2: X2,
    y1: Y1,
    y2: Y2,
    ...basic(options, (data, facets) => {
      const P = normalize(valueof(data, path));
      const X1 = setX1([]);
      const X2 = setX2([]);
      const Y1 = setY1([]);
      const Y2 = setY2([]);
      let treeIndex = -1;
      const treeData = [];
      const treeFacets = [];
      const rootof = d3.stratify().path((i) => P[i]);
      const layout = treeLayout();
      if (layout.nodeSize) layout.nodeSize([1, 1]);
      if (layout.separation && treeSeparation !== undefined) layout.separation(treeSeparation ?? one);
      for (const o of outputs) o[output_values] = o[output_setValues]([]);
      for (const facet of facets) {
        const treeFacet = [];
        const root = rootof(facet.filter((i) => P[i] != null)).each((node) => (node.data = data[node.data]));
        if (treeSort != null) root.sort(treeSort);
        layout(root);
        for (const {source, target} of root.links()) {
          if (treeFilter != null && !treeFilter(target, source)) continue;
          treeFacet.push(++treeIndex);
          treeData[treeIndex] = target.data;
          treeAnchor.position(source, treeIndex, X1, Y1);
          treeAnchor.position(target, treeIndex, X2, Y2);
          for (const o of outputs) o[output_values][treeIndex] = o[output_evaluate](target, source);
        }
        treeFacets.push(treeFacet);
      }
      return {data: treeData, facets: treeFacets};
    }),
    ...Object.fromEntries(outputs)
  };
}

function maybeTreeAnchor(anchor = "left") {
  switch (`${anchor}`.trim().toLowerCase()) {
    case "left":
      return treeAnchorLeft;
    case "right":
      return treeAnchorRight;
  }
  throw new Error(`invalid tree anchor: ${anchor}`);
}

const treeAnchorLeft = {
  frameAnchor: "left",
  dx: 6,
  position({x, y}, i, X, Y) {
    X[i] = y;
    Y[i] = -x;
  }
};

const treeAnchorRight = {
  frameAnchor: "right",
  dx: -6,
  position({x, y}, i, X, Y) {
    X[i] = -y;
    Y[i] = -x;
  }
};

function maybeTreeSort(sort) {
  return sort == null || typeof sort === "function"
    ? sort
    : `${sort}`.trim().toLowerCase().startsWith("node:")
    ? nodeSort(maybeNodeValue(sort))
    : nodeSort(nodeData(sort));
}

function nodeSort(value) {
  return (a, b) => ascendingDefined(value(a), value(b));
}

function nodeData(field) {
  return (node) => node.data?.[field];
}

function normalizer(delimiter = "/") {
  delimiter = `${delimiter}`;
  if (delimiter === "/") return (P) => P; // paths are already slash-separated
  if (delimiter.length !== 1) throw new Error("delimiter must be exactly one character");
  const delimiterCode = delimiter.charCodeAt(0);
  return (P) => P.map((p) => slashDelimiter(p, delimiterCode));
}

const CODE_BACKSLASH = 92;
const CODE_SLASH = 47;

function slashDelimiter(input, delimiterCode) {
  if (delimiterCode === CODE_BACKSLASH) throw new Error("delimiter cannot be backslash");
  let afterBackslash = false;
  for (let i = 0, n = input.length; i < n; ++i) {
    switch (input.charCodeAt(i)) {
      case CODE_BACKSLASH:
        if (!afterBackslash) {
          afterBackslash = true;
          continue;
        }
        break;
      case delimiterCode:
        if (afterBackslash) {
          (input = input.slice(0, i - 1) + input.slice(i)), --i, --n; // remove backslash
        } else {
          input = input.slice(0, i) + "/" + input.slice(i + 1); // replace delimiter with slash
        }
        break;
      case CODE_SLASH:
        if (afterBackslash) {
          (input = input.slice(0, i) + "\\\\" + input.slice(i)), (i += 2), (n += 2); // add two backslashes
        } else {
          (input = input.slice(0, i) + "\\" + input.slice(i)), ++i, ++n; // add backslash
        }
        break;
    }
    afterBackslash = false;
  }
  return input;
}

function slashUnescape(input) {
  let afterBackslash = false;
  for (let i = 0, n = input.length; i < n; ++i) {
    switch (input.charCodeAt(i)) {
      case CODE_BACKSLASH:
        if (!afterBackslash) {
          afterBackslash = true;
          continue;
        }
      // eslint-disable-next-line no-fallthrough
      case CODE_SLASH:
        if (afterBackslash) {
          (input = input.slice(0, i - 1) + input.slice(i)), --i, --n; // remove backslash
        }
        break;
    }
    afterBackslash = false;
  }
  return input;
}

function isNodeValue(option) {
  return isObject(option) && typeof option.node === "function";
}

function isLinkValue(option) {
  return isObject(option) && typeof option.link === "function";
}

function maybeNodeValue(value) {
  if (isNodeValue(value)) return value.node;
  value = `${value}`.trim().toLowerCase();
  if (!value.startsWith("node:")) return;
  switch (value) {
    case "node:name":
      return nodeName;
    case "node:path":
      return nodePath;
    case "node:internal":
      return nodeInternal;
    case "node:external":
      return nodeExternal;
    case "node:depth":
      return nodeDepth;
    case "node:height":
      return nodeHeight;
  }
  throw new Error(`invalid node value: ${value}`);
}

function maybeLinkValue(value) {
  if (isNodeValue(value)) return value.node;
  if (isLinkValue(value)) return value.link;
  value = `${value}`.trim().toLowerCase();
  if (!value.startsWith("node:") && !value.startsWith("parent:")) return;
  switch (value) {
    case "parent:name":
      return parentValue(nodeName);
    case "parent:path":
      return parentValue(nodePath);
    case "parent:depth":
      return parentValue(nodeDepth);
    case "parent:height":
      return parentValue(nodeHeight);
    case "node:name":
      return nodeName;
    case "node:path":
      return nodePath;
    case "node:internal":
      return nodeInternal;
    case "node:external":
      return nodeExternal;
    case "node:depth":
      return nodeDepth;
    case "node:height":
      return nodeHeight;
  }
  throw new Error(`invalid link value: ${value}`);
}

function nodePath(node) {
  return node.id;
}

function nodeName(node) {
  return nameof(node.id);
}

function nodeDepth(node) {
  return node.depth;
}

function nodeHeight(node) {
  return node.height;
}

function nodeInternal(node) {
  return !!node.children;
}

function nodeExternal(node) {
  return !node.children;
}

function parentValue(evaluate) {
  return (child, parent) => (parent == null ? undefined : evaluate(parent));
}

// Walk backwards to find the first slash.
function nameof(path) {
  let i = path.length;
  while (--i > 0) if (slash(path, i)) break;
  return slashUnescape(path.slice(i + 1));
}

// Slashes can be escaped; to determine whether a slash is a path delimiter, we
// count the number of preceding backslashes escaping the forward slash: an odd
// number indicates an escaped forward slash.
function slash(path, i) {
  if (path[i] === "/") {
    let k = 0;
    while (i > 0 && path[--i] === "\\") ++k;
    if ((k & 1) === 0) return true;
  }
  return false;
}

// These indexes match the array returned by nodeOutputs. The first two elements
// are always the name of the output and its column value definition so that
// the outputs can be passed directly to Object.fromEntries.
const output_setValues = 2;
const output_evaluate = 3;
const output_values = 4;

function treeOutputs(options, maybeTreeValue) {
  const outputs = [];
  for (const name in options) {
    const value = options[name];
    const treeValue = maybeTreeValue(value);
    if (treeValue !== undefined) {
      outputs.push([name, ...column(value), treeValue]);
    }
  }
  return outputs;
}

function tree(
  data,
  {
    fill,
    stroke,
    strokeWidth,
    strokeOpacity,
    strokeLinejoin,
    strokeLinecap,
    strokeMiterlimit,
    strokeDasharray,
    strokeDashoffset,
    marker,
    markerStart = marker,
    markerEnd = marker,
    dot: dotDot = isNoneish(markerStart) && isNoneish(markerEnd),
    text: textText = "node:name",
    textStroke = "var(--plot-background)",
    title = "node:path",
    dx,
    dy,
    textAnchor,
    treeLayout = d3.tree,
    textLayout = treeLayout === d3.tree || treeLayout === d3.cluster ? "mirrored" : "normal",
    tip,
    ...options
  } = {}
) {
  if (dx === undefined) dx = maybeTreeAnchor(options.treeAnchor).dx;
  if (textAnchor !== undefined) throw new Error("textAnchor is not a configurable tree option");
  textLayout = keyword(textLayout, "textLayout", ["mirrored", "normal"]);

  function treeText(textOptions) {
    return text(
      data,
      treeNode({
        treeLayout,
        text: textText,
        fill: fill === undefined ? "currentColor" : fill,
        stroke: textStroke,
        dx,
        dy,
        title,
        ...textOptions,
        ...options
      })
    );
  }

  return marks(
    link(
      data,
      treeLink({
        treeLayout,
        markerStart,
        markerEnd,
        stroke: stroke !== undefined ? stroke : fill === undefined ? "node:internal" : fill,
        strokeWidth,
        strokeOpacity,
        strokeLinejoin,
        strokeLinecap,
        strokeMiterlimit,
        strokeDasharray,
        strokeDashoffset,
        ...options
      })
    ),
    dotDot
      ? dot(data, treeNode({treeLayout, fill: fill === undefined ? "node:internal" : fill, title, tip, ...options}))
      : null,
    textText != null
      ? textLayout === "mirrored"
        ? [
            treeText({textAnchor: "start", treeFilter: "node:external"}),
            treeText({textAnchor: "end", treeFilter: "node:internal", dx: -dx})
          ]
        : treeText()
      : null
  );
}

function cluster(data, options) {
  return tree(data, {...options, treeLayout: d3.cluster});
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

// (a, y, c, l, h) = (array, y[, cmp, lo, hi])

function ge(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p >= 0) { i = m; h = m - 1; } else { l = m + 1; }
  }
  return i;
}
function gt(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p > 0) { i = m; h = m - 1; } else { l = m + 1; }
  }
  return i;
}
function lt(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p < 0) { i = m; l = m + 1; } else { h = m - 1; }
  }
  return i;
}
function le(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p <= 0) { i = m; l = m + 1; } else { h = m - 1; }
  }
  return i;
}
function eq(a, y, c, l, h) {
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p === 0) { return m }
    if (p <= 0) { l = m + 1; } else { h = m - 1; }
  }
  return -1;
}
function norm(a, y, c, l, h, f) {
  if (typeof c === 'function') {
    return f(a, y, c, (l === undefined) ? 0 : l | 0, (h === undefined) ? a.length - 1 : h | 0);
  }
  return f(a, y, undefined, (c === undefined) ? 0 : c | 0, (l === undefined) ? a.length - 1 : l | 0);
}

var searchBounds = {
  ge: function(a, y, c, l, h) { return norm(a, y, c, l, h, ge)},
  gt: function(a, y, c, l, h) { return norm(a, y, c, l, h, gt)},
  lt: function(a, y, c, l, h) { return norm(a, y, c, l, h, lt)},
  le: function(a, y, c, l, h) { return norm(a, y, c, l, h, le)},
  eq: function(a, y, c, l, h) { return norm(a, y, c, l, h, eq)}
};

var bounds = searchBounds;

var NOT_FOUND = 0;
var SUCCESS = 1;
var EMPTY = 2;

var intervalTree = createWrapper;

function IntervalTreeNode(mid, left, right, leftPoints, rightPoints) {
  this.mid = mid;
  this.left = left;
  this.right = right;
  this.leftPoints = leftPoints;
  this.rightPoints = rightPoints;
  this.count = (left ? left.count : 0) + (right ? right.count : 0) + leftPoints.length;
}

var proto = IntervalTreeNode.prototype;

function copy(a, b) {
  a.mid = b.mid;
  a.left = b.left;
  a.right = b.right;
  a.leftPoints = b.leftPoints;
  a.rightPoints = b.rightPoints;
  a.count = b.count;
}

function rebuild(node, intervals) {
  var ntree = createIntervalTree(intervals);
  node.mid = ntree.mid;
  node.left = ntree.left;
  node.right = ntree.right;
  node.leftPoints = ntree.leftPoints;
  node.rightPoints = ntree.rightPoints;
  node.count = ntree.count;
}

function rebuildWithInterval(node, interval) {
  var intervals = node.intervals([]);
  intervals.push(interval);
  rebuild(node, intervals);    
}

function rebuildWithoutInterval(node, interval) {
  var intervals = node.intervals([]);
  var idx = intervals.indexOf(interval);
  if(idx < 0) {
    return NOT_FOUND
  }
  intervals.splice(idx, 1);
  rebuild(node, intervals);
  return SUCCESS
}

proto.intervals = function(result) {
  result.push.apply(result, this.leftPoints);
  if(this.left) {
    this.left.intervals(result);
  }
  if(this.right) {
    this.right.intervals(result);
  }
  return result
};

proto.insert = function(interval) {
  var weight = this.count - this.leftPoints.length;
  this.count += 1;
  if(interval[1] < this.mid) {
    if(this.left) {
      if(4*(this.left.count+1) > 3*(weight+1)) {
        rebuildWithInterval(this, interval);
      } else {
        this.left.insert(interval);
      }
    } else {
      this.left = createIntervalTree([interval]);
    }
  } else if(interval[0] > this.mid) {
    if(this.right) {
      if(4*(this.right.count+1) > 3*(weight+1)) {
        rebuildWithInterval(this, interval);
      } else {
        this.right.insert(interval);
      }
    } else {
      this.right = createIntervalTree([interval]);
    }
  } else {
    var l = bounds.ge(this.leftPoints, interval, compareBegin);
    var r = bounds.ge(this.rightPoints, interval, compareEnd);
    this.leftPoints.splice(l, 0, interval);
    this.rightPoints.splice(r, 0, interval);
  }
};

proto.remove = function(interval) {
  var weight = this.count - this.leftPoints;
  if(interval[1] < this.mid) {
    if(!this.left) {
      return NOT_FOUND
    }
    var rw = this.right ? this.right.count : 0;
    if(4 * rw > 3 * (weight-1)) {
      return rebuildWithoutInterval(this, interval)
    }
    var r = this.left.remove(interval);
    if(r === EMPTY) {
      this.left = null;
      this.count -= 1;
      return SUCCESS
    } else if(r === SUCCESS) {
      this.count -= 1;
    }
    return r
  } else if(interval[0] > this.mid) {
    if(!this.right) {
      return NOT_FOUND
    }
    var lw = this.left ? this.left.count : 0;
    if(4 * lw > 3 * (weight-1)) {
      return rebuildWithoutInterval(this, interval)
    }
    var r = this.right.remove(interval);
    if(r === EMPTY) {
      this.right = null;
      this.count -= 1;
      return SUCCESS
    } else if(r === SUCCESS) {
      this.count -= 1;
    }
    return r
  } else {
    if(this.count === 1) {
      if(this.leftPoints[0] === interval) {
        return EMPTY
      } else {
        return NOT_FOUND
      }
    }
    if(this.leftPoints.length === 1 && this.leftPoints[0] === interval) {
      if(this.left && this.right) {
        var p = this;
        var n = this.left;
        while(n.right) {
          p = n;
          n = n.right;
        }
        if(p === this) {
          n.right = this.right;
        } else {
          var l = this.left;
          var r = this.right;
          p.count -= n.count;
          p.right = n.left;
          n.left = l;
          n.right = r;
        }
        copy(this, n);
        this.count = (this.left?this.left.count:0) + (this.right?this.right.count:0) + this.leftPoints.length;
      } else if(this.left) {
        copy(this, this.left);
      } else {
        copy(this, this.right);
      }
      return SUCCESS
    }
    for(var l = bounds.ge(this.leftPoints, interval, compareBegin); l<this.leftPoints.length; ++l) {
      if(this.leftPoints[l][0] !== interval[0]) {
        break
      }
      if(this.leftPoints[l] === interval) {
        this.count -= 1;
        this.leftPoints.splice(l, 1);
        for(var r = bounds.ge(this.rightPoints, interval, compareEnd); r<this.rightPoints.length; ++r) {
          if(this.rightPoints[r][1] !== interval[1]) {
            break
          } else if(this.rightPoints[r] === interval) {
            this.rightPoints.splice(r, 1);
            return SUCCESS
          }
        }
      }
    }
    return NOT_FOUND
  }
};

function reportLeftRange(arr, hi, cb) {
  for(var i=0; i<arr.length && arr[i][0] <= hi; ++i) {
    var r = cb(arr[i]);
    if(r) { return r }
  }
}

function reportRightRange(arr, lo, cb) {
  for(var i=arr.length-1; i>=0 && arr[i][1] >= lo; --i) {
    var r = cb(arr[i]);
    if(r) { return r }
  }
}

function reportRange(arr, cb) {
  for(var i=0; i<arr.length; ++i) {
    var r = cb(arr[i]);
    if(r) { return r }
  }
}

proto.queryPoint = function(x, cb) {
  if(x < this.mid) {
    if(this.left) {
      var r = this.left.queryPoint(x, cb);
      if(r) { return r }
    }
    return reportLeftRange(this.leftPoints, x, cb)
  } else if(x > this.mid) {
    if(this.right) {
      var r = this.right.queryPoint(x, cb);
      if(r) { return r }
    }
    return reportRightRange(this.rightPoints, x, cb)
  } else {
    return reportRange(this.leftPoints, cb)
  }
};

proto.queryInterval = function(lo, hi, cb) {
  if(lo < this.mid && this.left) {
    var r = this.left.queryInterval(lo, hi, cb);
    if(r) { return r }
  }
  if(hi > this.mid && this.right) {
    var r = this.right.queryInterval(lo, hi, cb);
    if(r) { return r }
  }
  if(hi < this.mid) {
    return reportLeftRange(this.leftPoints, hi, cb)
  } else if(lo > this.mid) {
    return reportRightRange(this.rightPoints, lo, cb)
  } else {
    return reportRange(this.leftPoints, cb)
  }
};

function compareNumbers(a, b) {
  return a - b
}

function compareBegin(a, b) {
  var d = a[0] - b[0];
  if(d) { return d }
  return a[1] - b[1]
}

function compareEnd(a, b) {
  var d = a[1] - b[1];
  if(d) { return d }
  return a[0] - b[0]
}

function createIntervalTree(intervals) {
  if(intervals.length === 0) {
    return null
  }
  var pts = [];
  for(var i=0; i<intervals.length; ++i) {
    pts.push(intervals[i][0], intervals[i][1]);
  }
  pts.sort(compareNumbers);

  var mid = pts[pts.length>>1];

  var leftIntervals = [];
  var rightIntervals = [];
  var centerIntervals = [];
  for(var i=0; i<intervals.length; ++i) {
    var s = intervals[i];
    if(s[1] < mid) {
      leftIntervals.push(s);
    } else if(mid < s[0]) {
      rightIntervals.push(s);
    } else {
      centerIntervals.push(s);
    }
  }

  //Split center intervals
  var leftPoints = centerIntervals;
  var rightPoints = centerIntervals.slice();
  leftPoints.sort(compareBegin);
  rightPoints.sort(compareEnd);

  return new IntervalTreeNode(mid, 
    createIntervalTree(leftIntervals),
    createIntervalTree(rightIntervals),
    leftPoints,
    rightPoints)
}

//User friendly wrapper that makes it possible to support empty trees
function IntervalTree(root) {
  this.root = root;
}

var tproto = IntervalTree.prototype;

tproto.insert = function(interval) {
  if(this.root) {
    this.root.insert(interval);
  } else {
    this.root = new IntervalTreeNode(interval[0], null, null, [interval], [interval]);
  }
};

tproto.remove = function(interval) {
  if(this.root) {
    var r = this.root.remove(interval);
    if(r === EMPTY) {
      this.root = null;
    }
    return r !== NOT_FOUND
  }
  return false
};

tproto.queryPoint = function(p, cb) {
  if(this.root) {
    return this.root.queryPoint(p, cb)
  }
};

tproto.queryInterval = function(lo, hi, cb) {
  if(lo <= hi && this.root) {
    return this.root.queryInterval(lo, hi, cb)
  }
};

Object.defineProperty(tproto, "count", {
  get: function() {
    if(this.root) {
      return this.root.count
    }
    return 0
  }
});

Object.defineProperty(tproto, "intervals", {
  get: function() {
    if(this.root) {
      return this.root.intervals([])
    }
    return []
  }
});

function createWrapper(intervals) {
  if(!intervals || intervals.length === 0) {
    return new IntervalTree(null)
  }
  return new IntervalTree(createIntervalTree(intervals))
}

var IntervalTree$1 = /*@__PURE__*/getDefaultExportFromCjs(intervalTree);

const anchorXLeft = ({marginLeft}) => [1, marginLeft];
const anchorXRight = ({width, marginRight}) => [-1, width - marginRight];
const anchorXMiddle = ({width, marginLeft, marginRight}) => [0, (marginLeft + width - marginRight) / 2];
const anchorYTop = ({marginTop}) => [1, marginTop];
const anchorYBottom = ({height, marginBottom}) => [-1, height - marginBottom];
const anchorYMiddle = ({height, marginTop, marginBottom}) => [0, (marginTop + height - marginBottom) / 2];

function maybeAnchor(anchor) {
  return typeof anchor === "string" ? {anchor} : anchor;
}

function dodgeX(dodgeOptions = {}, options = {}) {
  if (arguments.length === 1) [dodgeOptions, options] = mergeOptions(dodgeOptions);
  let {anchor = "left", padding = 1, r = options.r} = maybeAnchor(dodgeOptions);
  switch (`${anchor}`.toLowerCase()) {
    case "left":
      anchor = anchorXLeft;
      break;
    case "right":
      anchor = anchorXRight;
      break;
    case "middle":
      anchor = anchorXMiddle;
      break;
    default:
      throw new Error(`unknown dodge anchor: ${anchor}`);
  }
  return dodge("x", "y", anchor, number$1(padding), r, options);
}

function dodgeY(dodgeOptions = {}, options = {}) {
  if (arguments.length === 1) [dodgeOptions, options] = mergeOptions(dodgeOptions);
  let {anchor = "bottom", padding = 1, r = options.r} = maybeAnchor(dodgeOptions);
  switch (`${anchor}`.toLowerCase()) {
    case "top":
      anchor = anchorYTop;
      break;
    case "bottom":
      anchor = anchorYBottom;
      break;
    case "middle":
      anchor = anchorYMiddle;
      break;
    default:
      throw new Error(`unknown dodge anchor: ${anchor}`);
  }
  return dodge("y", "x", anchor, number$1(padding), r, options);
}

function mergeOptions(options) {
  const {anchor, padding, ...rest} = options;
  const {r} = rest; // don’t consume r; allow it to propagate
  return [{anchor, padding, r}, rest];
}

function dodge(y, x, anchor, padding, r, options) {
  if (r != null && typeof r !== "number") {
    let {channels, sort, reverse} = options;
    channels = maybeNamed(channels);
    if (channels?.r === undefined) options = {...options, channels: {...channels, r: {value: r, scale: "r"}}};
    if (sort === undefined && reverse === undefined) options.sort = {channel: "-r"};
  }
  return initializer(options, function (data, facets, channels, scales, dimensions, context) {
    let {[x]: X, r: R} = channels;
    if (!channels[x]) throw new Error(`missing channel: ${x}`);
    ({[x]: X} = applyPosition(channels, scales, context));
    const cr = R ? undefined : r !== undefined ? number$1(r) : this.r !== undefined ? this.r : 3;
    if (R) R = valueof(R.value, scales[R.scale] || identity$1, Float64Array);
    let [ky, ty] = anchor(dimensions);
    const compare = ky ? compareAscending : compareSymmetric;
    const Y = new Float64Array(X.length);
    const radius = R ? (i) => R[i] : () => cr;
    for (let I of facets) {
      const tree = IntervalTree$1();
      I = I.filter(R ? (i) => finite$1(X[i]) && positive(R[i]) : (i) => finite$1(X[i]));
      const intervals = new Float64Array(2 * I.length + 2);
      for (const i of I) {
        const ri = radius(i);
        const y0 = ky ? ri + padding : 0; // offset baseline for varying radius
        const l = X[i] - ri;
        const h = X[i] + ri;

        // The first two positions are 0 to test placing the dot on the baseline.
        let k = 2;

        // For any previously placed circles that may overlap this circle, compute
        // the y-positions that place this circle tangent to these other circles.
        // https://observablehq.com/@mbostock/circle-offset-along-line
        tree.queryInterval(l - padding, h + padding, ([, , j]) => {
          const yj = Y[j] - y0;
          const dx = X[i] - X[j];
          const dr = padding + (R ? R[i] + R[j] : 2 * cr);
          const dy = Math.sqrt(dr * dr - dx * dx);
          intervals[k++] = yj - dy;
          intervals[k++] = yj + dy;
        });

        // Find the best y-value where this circle can fit.
        let candidates = intervals.slice(0, k);
        if (ky) candidates = candidates.filter((y) => y >= 0);
        out: for (const y of candidates.sort(compare)) {
          for (let j = 0; j < k; j += 2) {
            if (intervals[j] + 1e-6 < y && y < intervals[j + 1] - 1e-6) {
              continue out;
            }
          }
          Y[i] = y + y0;
          break;
        }

        // Insert the placed circle into the interval tree.
        tree.insert([l, h, i]);
      }
    }
    if (!ky) ky = 1;
    for (const I of facets) {
      for (const i of I) {
        Y[i] = Y[i] * ky + ty;
      }
    }
    return {
      data,
      facets,
      channels: {
        [y]: {value: Y, source: null}, // don’t show in tooltip
        [x]: {value: X, source: channels[x]},
        ...(R && {r: {value: R, source: channels.r}})
      }
    };
  });
}

function compareSymmetric(a, b) {
  return Math.abs(a) - Math.abs(b);
}

function compareAscending(a, b) {
  return a - b;
}

function normalizeX(basis, options) {
  if (arguments.length === 1) ({basis, ...options} = basis);
  return mapX(normalize(basis), options);
}

function normalizeY(basis, options) {
  if (arguments.length === 1) ({basis, ...options} = basis);
  return mapY(normalize(basis), options);
}

function normalize(basis) {
  if (basis === undefined) return normalizeFirst;
  if (typeof basis === "function") return normalizeBasis(taker(basis));
  if (/^p\d{2}$/i.test(basis)) return normalizeAccessor(percentile(basis));
  switch (`${basis}`.toLowerCase()) {
    case "deviation":
      return normalizeDeviation;
    case "first":
      return normalizeFirst;
    case "last":
      return normalizeLast;
    case "max":
      return normalizeMax;
    case "mean":
      return normalizeMean;
    case "median":
      return normalizeMedian;
    case "min":
      return normalizeMin;
    case "sum":
      return normalizeSum;
    case "extent":
      return normalizeExtent;
  }
  throw new Error(`invalid basis: ${basis}`);
}

function normalizeBasis(basis) {
  return {
    mapIndex(I, S, T) {
      const b = +basis(I, S);
      for (const i of I) {
        T[i] = S[i] === null ? NaN : S[i] / b;
      }
    }
  };
}

function normalizeAccessor(f) {
  return normalizeBasis((I, S) => f(I, (i) => S[i]));
}

const normalizeExtent = {
  mapIndex(I, S, T) {
    const [s1, s2] = d3.extent(I, (i) => S[i]);
    const d = s2 - s1;
    for (const i of I) {
      T[i] = S[i] === null ? NaN : (S[i] - s1) / d;
    }
  }
};

const normalizeFirst = normalizeBasis((I, S) => {
  for (let i = 0; i < I.length; ++i) {
    const s = S[I[i]];
    if (defined(s)) return s;
  }
});

const normalizeLast = normalizeBasis((I, S) => {
  for (let i = I.length - 1; i >= 0; --i) {
    const s = S[I[i]];
    if (defined(s)) return s;
  }
});

const normalizeDeviation = {
  mapIndex(I, S, T) {
    const m = d3.mean(I, (i) => S[i]);
    const d = d3.deviation(I, (i) => S[i]);
    for (const i of I) {
      T[i] = S[i] === null ? NaN : d ? (S[i] - m) / d : 0;
    }
  }
};

const normalizeMax = normalizeAccessor(d3.max);
const normalizeMean = normalizeAccessor(d3.mean);
const normalizeMedian = normalizeAccessor(d3.median);
const normalizeMin = normalizeAccessor(d3.min);
const normalizeSum = normalizeAccessor(d3.sum);

function shiftX(interval, options) {
  return shiftK("x", interval, options);
}

function shiftY(interval, options) {
  return shiftK("y", interval, options);
}

function shiftK(x, interval, options = {}) {
  let offset;
  let k = 1;
  if (typeof interval === "number") {
    k = interval;
    offset = (x, k) => +x + k;
  } else {
    if (typeof interval === "string") {
      const sign = interval.startsWith("-") ? -1 : 1;
      [interval, k] = parseTimeInterval(interval.replace(/^[+-]/, ""));
      k *= sign;
    }
    interval = maybeInterval(interval);
    offset = (x, k) => interval.offset(x, k);
  }
  const x1 = `${x}1`;
  const x2 = `${x}2`;
  const mapped = map(
    {
      [x1]: (D) => D.map((d) => offset(d, k)),
      [x2]: (D) => D
    },
    options
  );
  const t = mapped[x2].transform;
  mapped[x2].transform = () => {
    const V = t();
    const [x0, x1] = d3.extent(V);
    V.domain = k < 0 ? [x0, offset(x1, k)] : [offset(x0, k), x1];
    return V;
  };
  return mapped;
}

function select(selector, options = {}) {
  // If specified selector is a string or function, it’s a selector without an
  // input channel such as first or last.
  if (typeof selector === "string") {
    switch (selector.toLowerCase()) {
      case "first":
        return selectFirst(options);
      case "last":
        return selectLast(options);
    }
  }
  if (typeof selector === "function") {
    return selectChannel(null, selector, options);
  }
  // Otherwise the selector is an option {name: value} where name is a channel
  // name and value is a selector definition that additionally takes the given
  // channel values as input. The selector object must have exactly one key.
  let key, value;
  for (key in selector) {
    if (value !== undefined) throw new Error("ambiguous selector; multiple inputs");
    value = maybeSelector(selector[key]);
  }
  if (value === undefined) throw new Error(`invalid selector: ${selector}`);
  return selectChannel(key, value, options);
}

function maybeSelector(selector) {
  if (typeof selector === "function") return selector;
  switch (`${selector}`.toLowerCase()) {
    case "min":
      return selectorMin;
    case "max":
      return selectorMax;
  }
  throw new Error(`unknown selector: ${selector}`);
}

function selectFirst(options) {
  return selectChannel(null, selectorFirst, options);
}

function selectLast(options) {
  return selectChannel(null, selectorLast, options);
}

function selectMinX(options) {
  return selectChannel("x", selectorMin, options);
}

function selectMinY(options) {
  return selectChannel("y", selectorMin, options);
}

function selectMaxX(options) {
  return selectChannel("x", selectorMax, options);
}

function selectMaxY(options) {
  return selectChannel("y", selectorMax, options);
}

function* selectorFirst(I) {
  yield I[0];
}

function* selectorLast(I) {
  yield I[I.length - 1];
}

function* selectorMin(I, X) {
  yield d3.least(I, (i) => X[i]);
}

function* selectorMax(I, X) {
  yield d3.greatest(I, (i) => X[i]);
}

function selectChannel(v, selector, options) {
  if (v != null) {
    if (options[v] == null) throw new Error(`missing channel: ${v}`);
    v = options[v];
  }
  const z = maybeZ(options);
  return basic(options, (data, facets) => {
    const Z = valueof(data, z);
    const V = valueof(data, v);
    const selectFacets = [];
    for (const facet of facets) {
      const selectFacet = [];
      for (const I of Z ? d3.group(facet, (i) => Z[i]).values() : [facet]) {
        for (const i of selector(I, V)) {
          selectFacet.push(i);
        }
      }
      selectFacets.push(selectFacet);
    }
    return {data, facets: selectFacets};
  });
}

// Note: this side effect avoids a circular dependency.
Mark.prototype.plot = function ({marks = [], ...options} = {}) {
  return plot({...options, marks: [...marks, this]});
};

exports.Area = Area;
exports.Arrow = Arrow;
exports.BarX = BarX;
exports.BarY = BarY;
exports.Cell = Cell;
exports.Contour = Contour;
exports.Density = Density;
exports.Dot = Dot;
exports.Frame = Frame;
exports.Geo = Geo;
exports.Hexgrid = Hexgrid;
exports.Image = Image;
exports.Line = Line;
exports.Link = Link;
exports.Mark = Mark;
exports.Raster = Raster;
exports.Rect = Rect;
exports.RuleX = RuleX;
exports.RuleY = RuleY;
exports.Text = Text;
exports.TickX = TickX;
exports.TickY = TickY;
exports.Tip = Tip;
exports.Vector = Vector;
exports.area = area;
exports.areaX = areaX;
exports.areaY = areaY;
exports.arrow = arrow;
exports.auto = auto;
exports.autoSpec = autoSpec;
exports.axisFx = axisFx;
exports.axisFy = axisFy;
exports.axisX = axisX;
exports.axisY = axisY;
exports.barX = barX;
exports.barY = barY;
exports.bin = bin;
exports.binX = binX;
exports.binY = binY;
exports.bollinger = bollinger;
exports.bollingerX = bollingerX;
exports.bollingerY = bollingerY;
exports.boxX = boxX;
exports.boxY = boxY;
exports.cell = cell;
exports.cellX = cellX;
exports.cellY = cellY;
exports.centroid = centroid;
exports.circle = circle;
exports.cluster = cluster;
exports.column = column;
exports.contour = contour;
exports.crosshair = crosshair;
exports.crosshairX = crosshairX;
exports.crosshairY = crosshairY;
exports.delaunayLink = delaunayLink;
exports.delaunayMesh = delaunayMesh;
exports.density = density;
exports.differenceX = differenceX;
exports.differenceY = differenceY;
exports.dodgeX = dodgeX;
exports.dodgeY = dodgeY;
exports.dot = dot;
exports.dotX = dotX;
exports.dotY = dotY;
exports.filter = filter;
exports.find = find;
exports.formatIsoDate = formatIsoDate;
exports.formatMonth = formatMonth;
exports.formatNumber = formatNumber;
exports.formatWeekday = formatWeekday;
exports.frame = frame;
exports.geo = geo;
exports.geoCentroid = geoCentroid;
exports.graticule = graticule;
exports.gridFx = gridFx;
exports.gridFy = gridFy;
exports.gridX = gridX;
exports.gridY = gridY;
exports.group = group;
exports.groupX = groupX;
exports.groupY = groupY;
exports.groupZ = groupZ$1;
exports.hexagon = hexagon;
exports.hexbin = hexbin;
exports.hexgrid = hexgrid;
exports.hull = hull;
exports.identity = identity$1;
exports.image = image;
exports.indexOf = indexOf;
exports.initializer = initializer;
exports.interpolateNearest = interpolateNearest;
exports.interpolateNone = interpolateNone;
exports.interpolatorBarycentric = interpolatorBarycentric;
exports.interpolatorRandomWalk = interpolatorRandomWalk;
exports.legend = legend;
exports.line = line;
exports.lineX = lineX;
exports.lineY = lineY;
exports.linearRegressionX = linearRegressionX;
exports.linearRegressionY = linearRegressionY;
exports.link = link;
exports.map = map;
exports.mapX = mapX;
exports.mapY = mapY;
exports.marks = marks;
exports.normalize = normalize;
exports.normalizeX = normalizeX;
exports.normalizeY = normalizeY;
exports.numberInterval = numberInterval;
exports.plot = plot;
exports.pointer = pointer;
exports.pointerX = pointerX;
exports.pointerY = pointerY;
exports.raster = raster;
exports.rect = rect;
exports.rectX = rectX;
exports.rectY = rectY;
exports.reverse = reverse;
exports.ruleX = ruleX;
exports.ruleY = ruleY;
exports.scale = scale;
exports.select = select;
exports.selectFirst = selectFirst;
exports.selectLast = selectLast;
exports.selectMaxX = selectMaxX;
exports.selectMaxY = selectMaxY;
exports.selectMinX = selectMinX;
exports.selectMinY = selectMinY;
exports.shiftX = shiftX;
exports.shiftY = shiftY;
exports.shuffle = shuffle;
exports.sort = sort;
exports.sphere = sphere;
exports.spike = spike;
exports.stackX = stackX;
exports.stackX1 = stackX1;
exports.stackX2 = stackX2;
exports.stackY = stackY;
exports.stackY1 = stackY1;
exports.stackY2 = stackY2;
exports.text = text;
exports.textX = textX;
exports.textY = textY;
exports.tickX = tickX;
exports.tickY = tickY;
exports.timeInterval = timeInterval;
exports.tip = tip;
exports.transform = basic;
exports.tree = tree;
exports.treeLink = treeLink;
exports.treeNode = treeNode;
exports.utcInterval = utcInterval;
exports.valueof = valueof;
exports.vector = vector;
exports.vectorX = vectorX;
exports.vectorY = vectorY;
exports.version = version;
exports.voronoi = voronoi;
exports.voronoiMesh = voronoiMesh;
exports.window = window$1;
exports.windowX = windowX;
exports.windowY = windowY;

}));
