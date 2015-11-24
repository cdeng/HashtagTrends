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

/* global d3, topojson */

// Variables
var topo,
    projection,
    path,
    svg,
    g,
    throttleTimer;

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

// Area chart timeline
// Reference
// http://nyctaxi.herokuapp.com/

var margin = {top: 20, right: 20, bottom: 20, left: 40},
    areaChartWidth = width - margin.left - margin.right - 40,
    areaChartHeight = 140 - margin.top - margin.bottom;

var parseDate = d3.time.format("%d-%b-%y").parse;

var x = d3.scale.linear()
        .range([0, areaChartWidth]);

var y = d3.scale.linear()
        .range([areaChartHeight, 0]);

var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(4);

var area = d3.svg.area()
        .x(function (d) {
            return x(d.time);
        })
        .y0(areaChartHeight)
        .y1(function (d) {
            return y(d.runningFare);
        });

var areaChartSvg = d3.select("#areaChartSvg").append("svg")
        .attr("width", areaChartWidth + margin.left + margin.right)
        .attr("height", areaChartHeight + margin.top + margin.bottom)
        .attr("class", "areaChart")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var markerLine = areaChartSvg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', areaChartHeight)
        .attr("class", "markerLine");

var dummyData = [];

x.domain([0, 24]);
y.domain([0, 600]);

var chartPath = areaChartSvg.append("path")
        .datum(dummyData)
        .attr("class", "area");
//.attr("d", area);

areaChartSvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + areaChartHeight + ")")
        .call(xAxis)
        .append("text")
        .attr("y", 9)
        .attr("x", 39)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Hour");

areaChartSvg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Hashtags");