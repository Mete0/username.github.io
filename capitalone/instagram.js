/** * Created by Andy on 10/12/2015. */var uri = document.location.href;var indexOfHashVar = uri.indexOf("access_token=");var plot = [];var count = [];var positive = 0;var negative = 0;var neutral = 0;// 13 is the number of characters of "access_token="var token = uri.substring(indexOfHashVar + 13);$(document).ready(function () {    var tr;    var userId;    var score = 0;    $.ajax({        url: "https://api.instagram.com/v1/tags/CapitalOne/media/recent?access_token=" + token + "&count=100" + "&callback=?",        async: false,        dataType: 'json',        success: function (tags) {            useReturnData(tags)        }    });    function useReturnData(tags) {        for (var i = 0; i < tags.data.length; i++) {            (function (key) {                userId = tags.data[i].user.id;                $.ajax({                    async: false,                    url: "https://api.instagram.com/v1/users/" + userId + "/?access_token=" + token + "&callback=?",                    dataType: "json",                    success: function (users) {                        writeTable(tags, users, key);                    }                });            })(i);        }    }    function writeTable(tags, users, i) {        $.getJSON("words.json", function (words) {            var caption = tags.data[i].caption.text;            var captionArr = caption.split(" ");            for (var k = 0; k < captionArr.length; k++) {                for (var j = 0; j < words.positive.length; j++) {                    if (captionArr[k] === words.positive[j]) {                        score++;                    }                }                for (var l = 0; l < words.negative.length; l++) {                    if (captionArr[k] === words.negative[l]) {                        score--;                    }                }            }        }).done(function (d) {            tr = $('<tr/>');            tr.append("<td>" + tags.data[i].user.username + "</td>");            tr.append("<td>" + tags.data[i].likes.count + "</td>");            tr.append("<td>" + users.data.counts.media + "</td>");            tr.append("<td>" + users.data.counts.follows + "</td>");            tr.append("<td>" + users.data.counts.followed_by + "</td>");            tr.append("<td>" + score + "</td>");            $('table').append(tr);            var element = [];            element.push(tags.data[i].user.username);            element.push(score);            plot.push(element);            if (score > 0) {                positive++;            }            else if (score < 0) {                negative++;            }            else {                neutral++;            }            score = 0;            if (i === tags.data.length - 1) {                d3.select("#viz")                    .datum(plot)                    .call(columnChart());                count.push(positive);                count.push(neutral);                count.push(negative);                graph(count);            }        }).fail(function (d, textStatus, error) {            console.error("getJSON failed, status: " + textStatus + ", error: " + error)        });    }});function columnChart() {    var margin = {top: 30, right: 10, bottom: 50, left: 50},        width = 3000,        height = 400,        xRoundBands = 0.2,        xValue = function (d) {            return d[0];        },        yValue = function (d) {            return d[1];        },        xScale = d3.scale.ordinal(),        yScale = d3.scale.linear(),        yAxis = d3.svg.axis().scale(yScale).orient("left"),        xAxis = d3.svg.axis().scale(xScale);    function chart(selection) {        selection.each(function (data) {            // Convert data to standard representation greedily;            // this is needed for nondeterministic accessors.            data = data.map(function (d, i) {                return [xValue.call(data, d, i), yValue.call(data, d, i)];            });            // Update the x-scale.            xScale                .domain(data.map(function (d) {                    return d[0];                }))                .rangeRoundBands([0, width - margin.left - margin.right], xRoundBands);            // Update the y-scale.            yScale                .domain(d3.extent(data.map(function (d) {                    return d[1];                })))                .range([height - margin.top - margin.bottom, 0])                .nice();            // Select the svg element, if it exists.            var svg = d3.select(this).selectAll("svg").data([data]);            // Otherwise, create the skeletal chart.            var gEnter = svg.enter().append("svg").append("g");            gEnter.append("g").attr("class", "bars");            gEnter.append("g").attr("class", "y axis");            gEnter.append("g").attr("class", "x axis");            gEnter.append("g").attr("class", "x axis zero");            // Update the outer dimensions.            svg.attr("width", width)                .attr("height", height);            // Update the inner dimensions.            var g = svg.select("g")                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");            // Update the bars.            var bar = svg.select(".bars").selectAll(".bar").data(data);            bar.enter().append("rect");            bar.exit().remove();            bar.attr("class", function (d, i) {                return d[1] < 0 ? "bar negative" : "bar positive";            })                .attr("x", function (d) {                    return X(d);                })                .attr("y", function (d, i) {                    return d[1] < 0 ? Y0() : Y(d);                })                .attr("width", xScale.rangeBand())                .attr("height", function (d, i) {                    return Math.abs(Y(d) - Y0());                });            // x axis at the bottom of the chart            g.select(".x.axis")                .attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")                .call(xAxis.orient("bottom"));            // zero line            g.select(".x.axis.zero")                .attr("transform", "translate(0," + Y0() + ")")                .call(xAxis.tickFormat("").tickSize(0));            // Update the y-axis.            g.select(".y.axis")                .call(yAxis);        });    }// The x-accessor for the path generator; xScale ? xValue.    function X(d) {        return xScale(d[0]);    }    function Y0() {        return yScale(0);    }    // The x-accessor for the path generator; yScale ? yValue.    function Y(d) {        return yScale(d[1]);    }    chart.margin = function (_) {        if (!arguments.length) return margin;        margin = _;        return chart;    };    chart.width = function (_) {        if (!arguments.length) return width;        width = _;        return chart;    };    chart.height = function (_) {        if (!arguments.length) return height;        height = _;        return chart;    };    chart.x = function (_) {        if (!arguments.length) return xValue;        xValue = _;        return chart;    };    chart.y = function (_) {        if (!arguments.length) return yValue;        yValue = _;        return chart;    };    return chart;}function graph(plot) {    //Width and height    var w = 200;    var h = 100;    var barPadding = 1;    var dataset = count;    var xScale = d3.scale.ordinal()        .domain(["positive", "neutral", "negative"])        .rangeBands([0, w]);    var xAxis = d3.svg.axis()        .scale(xScale)        .orient("bottom");    var scaleHeight = d3.scale.linear()        .domain([0, d3.max(dataset)])        .range([0, h]);    var scaleWidth = d3.scale.ordinal()        .domain(d3.range(0, dataset.length))        .rangeBands([0, w], .1);    var colors = d3.scale.linear()        //.domain([0, array.length])        .domain([0, d3.max(dataset)])        .range(['#3399FF', '#66FF66']);    //Create SVG element    var svg = d3.select("#count")        .append("svg")        .attr("width", w)        .attr("height", h+20);    svg.selectAll("rect")        .data(dataset)        .enter().append("rect")        .attr("x", function (d, i) {            return i * (w / dataset.length);        })        .attr('y', function (d) {            return h - scaleHeight(d);        })        .attr("width", w / dataset.length - barPadding)        .attr('height', function (d) {            return scaleHeight(d);        })        .style('fill', colors);    svg.selectAll("text")        .data(dataset)        .enter()        .append("text")        .text(function (d) {            return d;        })        .attr("text-anchor", "middle")        .attr("x", function (d, i) {            return i * (w / dataset.length) + (w / dataset.length - barPadding) / 2;        })        .attr("y", function (d) {            return h - 14;        })        .attr("font-family", "sans-serif")        .attr("font-size", "11px")        .attr("fill", "black");    svg.append("g")        .attr("class", "x axis")        .attr("transform", "translate(0," + h + ")")        .call(xAxis);}