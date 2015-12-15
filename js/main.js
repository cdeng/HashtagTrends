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
var map,
        svg,
        g,
        circlesGroup,
        tip,
        dataJson,
        feature,
        width = $(window).width(),
        height = $(window).height(),
        startingValue,
        endingValue,
        currentTag = "#ParisAttacks";

// Unix date converter
function dateConverter(unixTime) {
    return new Date(unixTime * 1000);
}

function unixConverter(date) {
    return moment(date).unix();
}

// No image handler
function imgError(image) {
    image.onerror = "";
    image.src = "images/noimage.jpg";
    return true;
}

function setup(dataUrl, mapUrl, viewCenter, zoom) {
    // Load data
    d3.json(dataUrl, function (data) {
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
    map = new L.Map("hashtagTrendsMapSvg", {
        attributionControl: false
    })
            .setView(viewCenter, zoom);

    // Map dark matter
    // https://cartodb.com/basemaps/
    L.tileLayer(mapUrl, {
        minZoom: 2,
        maxZoom: 12
    }).addTo(map);

    // Initialize the SVG layer
    map._initPathRoot();

    // Add an SVG element to Leaflet’s overlay pane
    svg = d3.select("#hashtagTrendsMapSvg").select("svg"),
            circlesGroup = svg.append("g").attr("class", "circlesGroup");

    tip = d3.tip().attr("class", "tooltip").html(function (d, i) {
        return "<div class='row'><div class='tooltip-left col-md-5'>"
                + "<a class='example-image-link' href='" + d.images.low_resolution.url
                + "' data-lightbox=\"image-" + i
                + "\" data-title=\"" + d.caption.text
                + "(" + d.location.name + ")" + "\">"
                + "<img class=\"example-image\" onerror=\"imgError(this);\" src=\""
                + d.images.low_resolution.url + "\"></a></div>"
                + "<div class='tooltip-right col-md-7'>"
                + "<p><strong>Created on:</strong><br>" + moment(d.created_time).format("llll z") + "</p>"
                + "<p><strong>Location:</strong><br>" + d.location.name + "</p></div></div>";
    });

    svg.call(tip);
}
setup("data/parisattacks.json",
        "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", [7.8, 60], 2);

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
            .attr("class", "hashTagCircles")
            .on("mouseover", tip.show);

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
            .range([0, areaChartWidth])
            .clamp(true);

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
            .extent([startingValue, startingValue])
            .on("brush", brushed);

    var slider = areaChartSvg.append("g")
            .attr("class", "slider")
            .call(brush);

    slider.selectAll(".extent,.resize")
            .remove();

    slider.select(".background")
            .attr("height", areaChartHeight);

    var handle = slider.append("g")
            .attr("class", "handle");

    handle.append("path")
            .attr("transform", "translate(0," + areaChartHeight + ")")
            .attr("d", "M 0 -100 V 0");

    handle.append("text")
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
        handle.select("text").text(moment(value).format("MM/DD HH:mm"));

        var newData = dataJson.filter(function (circle) {
            return circle.created_time < value;
        });

        drawCircles(newData);
        showImages(newData);
    }

    function playAnimation(timeout) {

        // Show image section
        $("#hashtagTrendsDesc").addClass("hide");
        $("#hashtagImages").removeClass("hide");

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
    }

    function reset() {
        // Reset slider
        slider
                .call(brush.event)
                .call(brush.extent([startingValue, startingValue]))
                .call(brush.event);
        // Reset area chart
        d3.select("#rectClip rect")
                .attr("width", 0);
        // Reset image section
        $("#hashtagImages").html("");
        $("#hashtagImages").addClass("hide");
        $("#hashtagTrendsDesc").removeClass("hide");
    }

    $("#playButton").click(function () {
        playAnimation(20000);
        $("#playButton").attr("disabled", "disabled");
        $("#resetButton").attr("disabled", "disabled");

        setTimeout(function () {
            $("#playButton").removeAttr("disabled");
            $("#resetButton").removeAttr("disabled");
        }, 20000);
    });

    // Listen to click of reset button
    $("#resetButton").click(function () {
        reset();
    });

    // Listen to hashtag selector dropdown
    $(".dropdown-menu li a").click(function () {
        var selText = $(this).text();
        if (selText !== currentTag) {
            currentTag = selText;
            $(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');

            reset();
            // Reset map and area chart container
            map.remove();
            $("#areaChartSvg").html("");
            switch (currentTag) {
                case "#BostonStrong":
                    setup("data/bostonstrong.json",
                            "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", [7.8, 60], 2);
                    $("body").addClass("normal").removeClass("invert");
                    $("p.tagDescription").html("The hashtag #BostonStrong spread on"
                            + "Instagram after the terrorist attack of the Boston Marathon bombing.");
                    break;
                default:
                    setup("data/parisattacks.json",
                            "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", [7.8, 60], 2);
                    $("body").addClass("invert").removeClass("normal");
                    $("p.tagDescription").html("The hashtag #ParisAttacks spread on"
                            + "Instagram after a series of attacks shook Paris.");
                    break;
            }
        }
        $("body").on("click", tip.hide);
    });
}

var lastDrawnIndex = 0;

function showImages(newData) {

    // Append to element
    var elem = $("#hashtagImages");

    while (lastDrawnIndex < newData.length) {
        // some image does not have a caption
        var captionText = "";
        if (newData[lastDrawnIndex].caption !== null) {
            captionText = newData[lastDrawnIndex].caption.text;
        }

        elem.prepend("<a class=\"example-image-link\" href=\""
                + newData[lastDrawnIndex].images.low_resolution.url
                + "\" data-lightbox=\"image-" + lastDrawnIndex
                + "\" data-title=\"" + captionText
                + "(" + newData[lastDrawnIndex].location.name + ")" + "\">"
                + "<img class=\"example-image\" onerror=\"imgError(this);\" src=\""
                + newData[lastDrawnIndex].images.thumbnail.url + "\"></a>");
        lastDrawnIndex++;
    }
}

// Close tooltip when click elsewhere
$("body").on("click", tip.hide);