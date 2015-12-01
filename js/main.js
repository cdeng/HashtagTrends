/* 
 * The MIT License
 *
 * Copyright 2015 Cheng Deng, Xing Liu and Mi Tian
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/* global d3, topojson, moment */

// Variables
var topo,
        projection,
        path,
        svg,
        g,
        throttleTimer,
        dataPath,
        dataJson;

// Unix date converter
function dateConverter(unixTime) {
    return new Date(unixTime * 1000);
}

// Load data
dataPath = "data/parisattacks.json";
d3.json(dataPath, function (data) {
    // Pre-processing data
    var i, obj;
    dataJson = [];

    // Sort array by time
    data.sort(function (a, b) {
        return dateConverter(a.created_time) - dateConverter(b.created_time);
    });

    if (data.length > 0) {
        for (i = 0; i < data.length; i++) {
            row = data[i];
            obj = {
                "images": row.images,
                "location": row.location,
                "created_time": dateConverter(row.created_time),
                "tagCounts": i + 1
            };
            dataJson.push(obj);
        }
    }

    drawAreaChart();
});

/**
 * Map Reference
 * World Map Template with D3.js by author unknown
 * http://techslides.com/demos/d3/worldmap-template.html
 */
var zoom = d3.behavior.zoom()
        .scaleExtent([1, 9])
        .on("zoom", move);
var width = document.getElementById('hashtagTrendsMapSvg').offsetWidth;
var height = width / 2;
var graticule = d3.geo.graticule();
var tooltip = d3.select("div#hashtagTrendsMapSvg").append("div").attr("class", "tooltip hidden");

// Svg map setup
function setup(width, height) {
    projection = d3.geo.mercator()
            .translate([(width / 2), (height / 2)])
            .scale(width / 2 / Math.PI);

    path = d3.geo.path().projection(projection);

    svg = d3.select("div#hashtagTrendsMapSvg").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom)
            .on("click", click)
            .append("g");

    g = svg.append("g");
}
setup(width, height);

// Load map data
d3.json("data/world-topo-min.json", function (error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    topo = countries;
    draw(topo);
});

// Function for drawing map
function draw(topo) {
    var country;
    svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);


    g.append("path")
            .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
            .attr("class", "equator")
            .attr("d", path);

    country = g.selectAll(".country").data(topo);

    country.enter().insert("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("id", function (d, i) {
                return d.id;
            })
            .attr("title", function (d, i) {
                return d.properties.name;
            });

//    //offsets for tooltips
//    var offsetL = document.getElementById('hashtagTrendsMapSvg').offsetLeft + 20;
//    var offsetT = document.getElementById('hashtagTrendsMapSvg').offsetTop + 10;
//
//    // tooltips
//    country
//            .on("mousemove", function (d, i) {
//
//                var mouse = d3.mouse(svg.node()).map(function (d) {
//                    return parseInt(d);
//                });
//
//                tooltip.classed("hidden", false)
//                        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
//                        .html(d.properties.name);
//
//            })
//            .on("mouseout", function (d, i) {
//                tooltip.classed("hidden", true);
//            });
}

// Adjust and redraw map
function redraw() {
    width = document.getElementById('hashtagTrendsMapSvg').offsetWidth;
    height = width / 2;
    d3.select('svg').remove();
    setup(width, height);
    draw(topo);
}

// Function for map moving
function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    zscale = s;
    var h = height / 4;

    t[0] = Math.min(
            (width / height) * (s - 1),
            Math.max(width * (1 - s), t[0])
            );

    t[1] = Math.min(
            h * (s - 1) + h * s,
            Math.max(height * (1 - s) - h * s, t[1])
            );

    zoom.translate(t);
    g.attr("transform", "translate(" + t + ")scale(" + s + ")");
}

// Throttle for redraw map
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function () {
        redraw();
    }, 200);
}

// Geo translation on mouse click in map
function click() {
    var latlon = projection.invert(d3.mouse(this));
    console.log(latlon);
}

// Adjust and redraw map once window size changes
d3.select(window).on("resize", throttle);

// Draw points on map based on hashtag location data
function displayTags() {
    var sites = svg.selectAll(".site")
            .data(dataJson, function (d) {
                return d.tagCounts;
            });

    sites.enter().append("circle")
            .attr("class", "site")
            .attr("cx", function (d) {
                return projection([d.location.longitude, d.location.latitude])[0];
            })
            .attr("cy", function (d) {
                return projection([d.location.longitude, d.location.latitude])[1];
            })
            .attr("r", 1)
            .transition().duration(100)
            .attr("r", 2);
}

// Function to draw area chart
function drawAreaChart() {

    // References
    // Area chart timeline
    // http://bl.ocks.org/mbostock/3883195

    var margin = {top: 60, right: 20, bottom: 80, left: 40},
    areaChartWidth = width - margin.left - margin.right - 40,
            areaChartHeight = 246 - margin.top - margin.bottom;

    var startingValue = dataJson[0].created_time;

    // Find data range
    var xMin = d3.min(dataJson, function (d) {
        return Math.min(d.created_time);
    }),
            xMax = d3.max(dataJson, function (d) {
                return Math.max(d.created_time);
            }),
            yMin = d3.min(dataJson, function (d) {
                return Math.min(d.tagCounts);
            }),
            yMax = d3.max(dataJson, function (d) {
                return Math.max(d.tagCounts);
            });

    var x = d3.time.scale()
            .domain([xMin, xMax])
            .range([0, areaChartWidth]);

    var y = d3.scale.linear()
            .domain([yMin, yMax])
            .range([areaChartHeight, 0]);

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.time.format("%m/%d %H:00"));

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(4);

    var line = d3.svg.line()
            .interpolate("basis")
            .x(function (d) {
                return x(d.created_time);
            })
            .y(function (d) {
                return y(d.tagCounts);
            });

    var area = d3.svg.area()
            .x(function (d) {
                return x(d.created_time);
            })
            .y0(areaChartHeight)
            .y1(function (d) {
                return y(d.tagCounts);
            });

    var areaChartSvg = d3.select("#areaChartSvg").append("svg")
            .attr("width", areaChartWidth + margin.left + margin.right)
            .attr("height", areaChartHeight + margin.top + margin.bottom)
            .attr("class", "areaChart")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    areaChartSvg.append("clipPath")
            .attr("id", "rectClip")
            .append("rect")
            .attr("width", 0)
            .attr("height", areaChartHeight);

    var markerLine = areaChartSvg.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', areaChartHeight)
            .attr("class", "markerLine");

    areaChartSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + areaChartHeight + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("x", 39)
            .attr("dx", "-.8em")
            .attr("dy", ".72em")
//                .attr("transform", "rotate(-25)")
            .style("text-anchor", "end");

    areaChartSvg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Hashtags");

    areaChartSvg.append("path")
            .datum(dataJson)
            .attr("class", "line")
            .attr("d", line)
            .attr("clip-path", "url(#rectClip)");

    areaChartSvg.append("path")
            .datum(dataJson)
            .attr("class", "area")
            .attr("d", area)
            .attr("clip-path", "url(#rectClip)");

    d3.select("#rectClip rect")
            .transition().duration(10000)
            .attr("width", areaChartWidth);

    var brush = d3.svg.brush()
            .x(x)
            .extent([startingValue, startingValue])
            .on("brush", brushed);

    var slider = areaChartSvg.append("g")
            .attr("class", "slider")
            .call(brush);

    var handle = slider.append("g")
            .attr("class", "handle");

    handle.append("path")
            .attr("transform", "translate(0," + areaChartHeight + ")")
            .attr("d", "M 0 -100 V 0");

    handle.append('text')
            .text(startingValue)
            .attr("transform", "translate(" + (-18) + " ," + (areaChartHeight - 125) + ")");

    slider
            .call(brush.event);

    function brushed() {
        var value = brush.extent()[0];

        if (d3.event.sourceEvent) {
            handle.select('path');
            value = x.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
        }

        handle.attr("transform", "translate(" + x(value) + ",0)");
        handle.select("text").text(moment(value).format("LLLL"));
    }
}

$("#controlButtons :input").change(function () {
    if (this.value === "on") {
        displayTags();
    } else {
        svg.selectAll(".site").remove();
    }
});