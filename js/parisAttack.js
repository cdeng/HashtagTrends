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

/* global d3, L, moment */

// Variables
var topo,
        projection,
        path,
        svg,
        g,
        throttleTimer,
        dataPath,
        dataJson,
        feature,
        width = $(window).width(),
        height = $(window).height(),
        startingValue,
        endingValue;

// Unix date converter
function dateConverter(unixTime) {
    return new Date(unixTime * 1000);
}

function unixConverter(date) {
    return moment(date).unix();
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
//    console.log(data);
    if (data.length > 0) {
        for (i = 0; i < data.length; i++) {
            row = data[i];
            obj = {
                images: row.images,
                location: row.location,
                created_time: dateConverter(row.created_time),
                caption: row.caption,
                tagCounts: i + 1
            };
            dataJson.push(obj);
        }
    }

//    drawCircles();
    drawAreaChart();
    startWatchingMap();
});

/*
 * Credits
 * Leafletjs
 * Openstreetmap
 */
var map = new L.Map("hashtagTrendsMapSvg", {
    attributionControl: false
})
        .setView([7.8, 60], 2);

// Map dark matter
// https://cartodb.com/basemaps/
L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    minZoom: 2
}).addTo(map);

// Initialize the SVG layer
map._initPathRoot();

// Add an SVG element to Leaflet’s overlay pane
var svg = d3.select("#hashtagTrendsMapSvg").select("svg"),
        circlesGroup = svg.append("g").attr("class", "circlesGroup");

function drawCircles(newData) {

    newData.forEach(function (d) {
        // Lat & Lng
        if (d.location.latitude && d.location.longitude) {
            d.LatLng = new L.LatLng(d.location.latitude,
                    d.location.longitude);
        }
    });

    // Remove old circles
    circlesGroup.selectAll("circle").remove();

    // Append new circles
    feature = circlesGroup.selectAll("circle")
            .data(newData)
            .enter().append("circle")
            .attr("r", 8)
            .attr("class", "hashTagCircles");

    visUpdate();
}

function startWatchingMap() {
    map.on("viewreset", visUpdate);
    visUpdate();
}

function visUpdate() {

    feature.attr("transform",
            function (d) {
                if (d.LatLng) {
                    return "translate(" +
                            map.latLngToLayerPoint(d.LatLng).x + "," +
                            map.latLngToLayerPoint(d.LatLng).y + ")";
                }
            }
    );
}

// Function to draw area chart
function drawAreaChart() {

    // References
    // Area chart timeline
    // http://bl.ocks.org/mbostock/3883195

    var margin = {top: 40, right: 20, bottom: 40, left: 50},
    h = 180,
            areaChartWidth = width - margin.left - margin.right - 40,
            areaChartHeight = h - margin.top - margin.bottom;

    startingValue = dataJson[0].created_time;
    endingValue = dataJson[dataJson.length - 1].created_time;

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
            .tickFormat(d3.time.format("%m/%d %I%p"));

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
            .attr("width", "80%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + width + " " + h)
            .attr("preserveAspectRatio", "xMinYMid meet")
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
//            .attr("transform", "rotate(-15)")
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

    var brush = d3.svg.brush()
            .x(x)
            .extent([startingValue, endingValue])
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

        var newData = dataJson.filter(function (circle) {
            return circle.created_time < value;
        });

        drawCircles(newData);
    }

    function playAnimation(timeout) {

        // Play animated slider
        slider
                .call(brush.event)
                .transition() // gratuitous intro!
                .duration(timeout)
                .call(brush.extent([x.domain()[1], x.domain()[1]]))
                .call(brush.event);

        // Play animated area chart
        d3.select("#rectClip rect")
                .transition().duration(timeout)
                .attr("width", areaChartWidth);

        // Show images
        setIntervalforImages(timeout);
    }

    $("#playButton").click(function () {
        playAnimation(10000);
    });
}

var timeHandler,
        imageIndex = 0;

function setIntervalforImages(timeout) {
    var dt = timeout / (dataJson.length + 10);
    timeHandler = window.setInterval(showImages, dt);
}

function showImages() {

    // Append to element
    var elem = $("#hashtagImages");

    imageIndex++;

    if (imageIndex > dataJson.length - 1) {
        window.clearInterval(timeHandler);
        imageIndex = 0;
    }

    elem.append("<a class=\"example-image-link\" href=\""
            + dataJson[imageIndex].images.standard_resolution.url
            + "\" data-lightbox=\"image-" + imageIndex
            + "\" data-title=\"" + dataJson[imageIndex].caption.text
            + "(" + dataJson[imageIndex].location.name + ")" + "\">"
            + "<img class=\"example-image\" width=40px height=40px src=\""
            + dataJson[imageIndex].images.thumbnail.url + "\"></a>");
}