(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var figures_1 = require("./figures");
var Variable = /** @class */ (function () {
    function Variable(v) {
        this.value = v;
        this.constant = false;
    }
    Object.defineProperty(Variable.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (v) {
            if (!this.constant)
                this._value = v;
        },
        enumerable: true,
        configurable: true
    });
    return Variable;
}());
exports.Variable = Variable;
var VariablePoint = /** @class */ (function () {
    function VariablePoint(x, y) {
        this.x = new Variable(x);
        this.y = new Variable(y);
    }
    VariablePoint.prototype.toPoint = function () {
        return new figures_1.Point(this.x.value, this.y.value);
    };
    VariablePoint.prototype.has = function (v) {
        return this.x == v || this.y == v;
    };
    VariablePoint.prototype.deltaVTowards = function (v, goal) {
        if (this.x == v)
            return goal.x - v.value;
        if (this.y == v)
            return goal.y - v.value;
        return 0;
    };
    VariablePoint.fromVariables = function (x, y) {
        var v = new VariablePoint(0, 0);
        v.x = x;
        v.y = y;
        return v;
    };
    return VariablePoint;
}());
exports.VariablePoint = VariablePoint;
function sum(vals) {
    var sum = 0;
    for (var _i = 0, vals_1 = vals; _i < vals_1.length; _i++) {
        var v = vals_1[_i];
        sum += v.value;
    }
    return sum;
}
function equalGoal(vals) {
    var sum = 0;
    for (var _i = 0, vals_2 = vals; _i < vals_2.length; _i++) {
        var v = vals_2[_i];
        if (v.constant)
            return v._value;
        sum += v._value;
    }
    return sum / vals.length;
}
var EqualConstraint = /** @class */ (function () {
    function EqualConstraint(vals, name) {
        if (name === void 0) { name = "equal"; }
        this.type = "equal";
        this.name = "equal";
        this.name = name;
        this.variables = vals;
    }
    EqualConstraint.prototype.getError = function () {
        var error = 0;
        var avg = equalGoal(this.variables);
        for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
            var v = _a[_i];
            error += Math.abs(avg - v.value);
        }
        return error;
    };
    EqualConstraint.prototype.getGradient = function (v) {
        if (this.variables.indexOf(v) == -1)
            return 0;
        var avg = equalGoal(this.variables);
        return avg - v.value;
    };
    EqualConstraint.prototype.containsFigure = function (f) {
        if (f.type == "point") {
            for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
                var v = _a[_i];
                if (f.p.variablePoint.has(v))
                    return true;
            }
            return false;
        }
        else if (f.type == "line") {
            //both points
            return this.containsFigure(f.childFigures[0]) && this.containsFigure(f.childFigures[1]);
        }
        else if (f.type == "circle") {
            //just radius
            return this.variables.indexOf(f.r) != -1;
        }
        return false;
    };
    EqualConstraint.prototype.asObject = function (obj, sketch) {
        var variables = [];
        for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
            var v = _a[_i];
            variables.push(sketch.variables.indexOf(v));
        }
        return {
            "type": this.type,
            "name": this.name,
            "variables": variables
        };
    };
    EqualConstraint.fromObject = function (c, sketch) {
        var variables = [];
        for (var _i = 0, _a = c["variables"]; _i < _a.length; _i++) {
            var v = _a[_i];
            variables.push(sketch.variables[v]);
        }
        return new EqualConstraint(variables);
    };
    return EqualConstraint;
}());
exports.EqualConstraint = EqualConstraint;
var ArcPointCoincidentConstraint = /** @class */ (function () {
    function ArcPointCoincidentConstraint(center, radius, points, name) {
        if (name === void 0) { name = "point on circle"; }
        this.type = "arc-point-coincident";
        this.name = "point on circle";
        this.name = name;
        this.center = center;
        this.radius = radius;
        this.points = points;
    }
    ArcPointCoincidentConstraint.prototype.getError = function () {
        var error = 0;
        var center = this.center.toPoint();
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var p = _a[_i];
            error += Math.abs(this.radius.value - p.toPoint().distTo(center));
        }
        return error;
    };
    ArcPointCoincidentConstraint.prototype.getGradient = function (v) {
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.has(v)) {
                var center = this.center.toPoint();
                var target = p.toPoint();
                var goal = center.pointTowards(target, this.radius.value);
                return p.deltaVTowards(v, goal);
            }
        }
        if (v === this.radius) {
            var totalDist = 0;
            for (var _b = 0, _c = this.points; _b < _c.length; _b++) {
                var p = _c[_b];
                var dx = p.x.value - this.center.x.value;
                var dy = p.y.value - this.center.y.value;
                totalDist += Math.sqrt(dx * dx + dy * dy);
            }
            var averageRadius = totalDist / this.points.length;
            return averageRadius - v.value;
        }
        if (this.center.x == v) {
            var error = 0;
            for (var _d = 0, _e = this.points; _d < _e.length; _d++) {
                var p = _e[_d];
                var dist = this.center.toPoint().distTo(p.toPoint());
                if (dist == 0)
                    continue;
                var dx = this.center.x.value - p.x.value;
                var d = this.radius.value / dist;
                error += (1 - d) * dx;
            }
            return -error;
        }
        else if (this.center.y == v) {
            var error = 0;
            for (var _f = 0, _g = this.points; _f < _g.length; _f++) {
                var p = _g[_f];
                var dist = this.center.toPoint().distTo(p.toPoint());
                if (dist == 0)
                    continue;
                var dy = this.center.y.value - p.y.value;
                var d = this.radius.value / dist;
                error += (1 - d) * dy;
            }
            return -error;
        }
        return 0;
    };
    ArcPointCoincidentConstraint.prototype.containsFigure = function (f) {
        if (f.type == "point") {
            return this.points.indexOf(f.p.variablePoint) != -1;
        }
        else if (f.type == "circle") {
            //just radius
            return this.radius == f.r;
        }
        return false;
    };
    ArcPointCoincidentConstraint.prototype.asObject = function (obj, sketch) {
        var points = [];
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var p = _a[_i];
            points.push(sketch.points.indexOf(p));
        }
        return {
            "type": this.type,
            "name": this.name,
            "c": sketch.points.indexOf(this.center),
            "r": sketch.variables.indexOf(this.radius),
            "points": points
        };
    };
    ArcPointCoincidentConstraint.fromObject = function (c, sketch) {
        var ce = sketch.points[c["c"]];
        var r = sketch.variables[c["r"]];
        var points = [];
        for (var _i = 0, _a = c["points"]; _i < _a.length; _i++) {
            var p = _a[_i];
            points.push(sketch.points[p]);
        }
        return new ArcPointCoincidentConstraint(ce, r, points);
    };
    return ArcPointCoincidentConstraint;
}());
exports.ArcPointCoincidentConstraint = ArcPointCoincidentConstraint;
var MidpointConstraint = /** @class */ (function () {
    function MidpointConstraint(p1, p2, midpoint, name) {
        if (name === void 0) { name = "midpoint"; }
        this.type = "midpoint";
        this.name = "midpoint";
        this.name = name;
        this.p1 = p1;
        this.p2 = p2;
        this.midpoint = midpoint;
    }
    MidpointConstraint.prototype.getError = function () {
        //distance between midpoint and average of two points
        var avgX = (this.p1.x.value + this.p2.x.value) / 2;
        var avgY = (this.p1.y.value + this.p2.y.value) / 2;
        var dx = this.midpoint.x.value - avgX;
        var dy = this.midpoint.y.value - avgY;
        return Math.sqrt(dx * dx + dy * dy);
    };
    MidpointConstraint.prototype.getGradient = function (v) {
        if (v === this.midpoint.x) {
            var avgX = (this.p1.x.value + this.p2.x.value) / 2;
            return avgX - v.value;
        }
        else if (v === this.midpoint.y) {
            var avgY = (this.p1.y.value + this.p2.y.value) / 2;
            return avgY - v.value;
        }
        else if (this.p1.has(v)) {
            var p2 = this.p2.toPoint();
            var midpoint = this.midpoint.toPoint();
            var halfDist = p2.distTo(midpoint);
            var goalP1 = p2.pointTowards(midpoint, halfDist * 2);
            return this.p1.deltaVTowards(v, goalP1);
        }
        else if (this.p2.has(v)) {
            var p1 = this.p1.toPoint();
            var midpoint = this.midpoint.toPoint();
            var halfDist = p1.distTo(midpoint);
            var goalP2 = p1.pointTowards(midpoint, halfDist * 2);
            return this.p2.deltaVTowards(v, goalP2);
        }
        return 0;
    };
    MidpointConstraint.prototype.containsFigure = function (f) {
        if (f.type == "point") {
            return this.p1 == f.p.variablePoint ||
                this.p2 == f.p.variablePoint ||
                this.midpoint == f.p.variablePoint;
        }
        else if (f.type == "line") {
            //both points
            return this.p1 == f.p1.variablePoint && this.p2 == f.p2.variablePoint;
        }
        return false;
    };
    MidpointConstraint.prototype.asObject = function (obj, sketch) {
        return {
            "type": this.type,
            "name": this.name,
            "p1": sketch.points.indexOf(this.p1),
            "p2": sketch.points.indexOf(this.p2),
            "mp": sketch.points.indexOf(this.midpoint)
        };
    };
    MidpointConstraint.fromObject = function (c, sketch) {
        var p1 = sketch.points[c["p1"]];
        var p2 = sketch.points[c["p2"]];
        var mp = sketch.points[c["mp"]];
        return new MidpointConstraint(p1, p2, mp);
    };
    return MidpointConstraint;
}());
exports.MidpointConstraint = MidpointConstraint;
var ColinearPointsConstraint = /** @class */ (function () {
    function ColinearPointsConstraint(points, name) {
        if (name === void 0) { name = "colinear"; }
        this.type = "colinear";
        this.name = "colinear";
        this.name = name;
        this.points = points;
    }
    ColinearPointsConstraint.prototype.getError = function () {
        var regression = leastSquaresRegression(this.points);
        var error = 0;
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var point = _a[_i];
            var p = point.toPoint();
            var regressed = p.projectBetween(regression[0], regression[1]);
            error += p.distTo(regressed);
        }
        return error;
    };
    ColinearPointsConstraint.prototype.getGradient = function (v) {
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var point = _a[_i];
            if (point.has(v)) {
                var regression = leastSquaresRegression(this.points);
                var p = point.toPoint();
                var regressed = p.projectBetween(regression[0], regression[1]);
                return point.deltaVTowards(v, regressed);
            }
        }
        return 0;
    };
    ColinearPointsConstraint.prototype.containsFigure = function (f) {
        if (f.type == "point") {
            return this.points.indexOf(f.p.variablePoint) != -1;
        }
        else if (f.type == "line") {
            //both points
            return this.containsFigure(f.childFigures[0]) && this.containsFigure(f.childFigures[1]);
        }
        return false;
    };
    ColinearPointsConstraint.prototype.asObject = function (obj, sketch) {
        var points = [];
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var p = _a[_i];
            points.push(sketch.points.indexOf(p));
        }
        return {
            "type": this.type,
            "name": this.name,
            "points": points
        };
    };
    ColinearPointsConstraint.fromObject = function (c, sketch) {
        var points = [];
        for (var _i = 0, _a = c["points"]; _i < _a.length; _i++) {
            var p = _a[_i];
            points.push(sketch.points[p]);
        }
        return new ColinearPointsConstraint(points);
    };
    return ColinearPointsConstraint;
}());
exports.ColinearPointsConstraint = ColinearPointsConstraint;
var TangentLineConstraint = /** @class */ (function () {
    function TangentLineConstraint(center, radius, p1, p2, name) {
        if (name === void 0) { name = "tangent line"; }
        this.type = "tangent-line";
        this.name = "tangent line";
        this.name = name;
        this.center = center;
        this.radius = radius;
        this.p1 = p1;
        this.p2 = p2;
    }
    TangentLineConstraint.prototype.getError = function () {
        var c = this.center.toPoint();
        var projection = c.projectBetween(this.p1.toPoint(), this.p2.toPoint());
        return Math.abs(projection.distTo(c) - this.radius.value) * 10;
    };
    TangentLineConstraint.prototype.getGradient = function (v) {
        if (v == this.radius) {
            var c = this.center.toPoint();
            var projection = c.projectBetween(this.p1.toPoint(), this.p2.toPoint());
            return projection.distTo(c) - this.radius.value;
        }
        else if (this.p1.has(v) || this.p2.has(v) || this.center.has(v)) {
            var c = this.center.toPoint();
            var projection = c.projectBetween(this.p1.toPoint(), this.p2.toPoint()); //project center onto line
            var dist = projection.distTo(c) - this.radius.value; // distance from circle to projection
            var coincidentProjection = projection.pointTowards(c, dist); // point on circle closest to line
            var delta = coincidentProjection.sub(projection); // from projection to point on circle
            if (this.center.x == v)
                return -delta.x;
            if (this.center.y == v)
                return -delta.y;
            if (this.p1.has(v)) {
                // without also moving points slightly towards projection, there are situations where states cannot be solved...
                var towardsP = this.p1.deltaVTowards(v, projection) / 5000;
                if (this.p1.x == v)
                    return delta.x + towardsP;
                if (this.p1.y == v)
                    return delta.y + towardsP;
            }
            if (this.p2.has(v)) {
                var towardsP = this.p2.deltaVTowards(v, projection) / 5000;
                if (this.p2.x == v)
                    return delta.x + towardsP;
                if (this.p2.y == v)
                    return delta.y + towardsP;
            }
        }
        return 0;
    };
    TangentLineConstraint.prototype.containsFigure = function (f) {
        if (f.type == "point") {
            return this.p1 == f.p.variablePoint ||
                this.p2 == f.p.variablePoint;
        }
        else if (f.type == "line") {
            //both points
            return this.containsFigure(f.childFigures[0]) && this.containsFigure(f.childFigures[1]);
        }
        else if (f.type == "circle") {
            //just radius
            return this.radius == f.r;
        }
        return false;
    };
    TangentLineConstraint.prototype.asObject = function (obj, sketch) {
        return {
            "type": this.type,
            "name": this.name,
            "c": sketch.points.indexOf(this.center),
            "r": sketch.variables.indexOf(this.radius),
            "p1": sketch.points.indexOf(this.p1),
            "p2": sketch.points.indexOf(this.p2),
        };
    };
    TangentLineConstraint.fromObject = function (c, sketch) {
        var ce = sketch.points[c["c"]];
        var r = sketch.variables[c["r"]];
        var p1 = sketch.points[c["p1"]];
        var p2 = sketch.points[c["p2"]];
        return new TangentLineConstraint(ce, r, p1, p2);
    };
    return TangentLineConstraint;
}());
exports.TangentLineConstraint = TangentLineConstraint;
var TangentCircleConstraint = /** @class */ (function () {
    function TangentCircleConstraint(center1, radius1, center2, radius2, name) {
        if (name === void 0) { name = "tangent circles"; }
        this.type = "tangent-circle";
        this.name = "tangent circles";
        this.name = name;
        this.center1 = center1;
        this.radius1 = radius1;
        this.center2 = center2;
        this.radius2 = radius2;
    }
    TangentCircleConstraint.prototype.getError = function () {
        var dist = this.center1.toPoint().distTo(this.center2.toPoint());
        var r1 = this.radius1.value;
        var r2 = this.radius2.value;
        var maxR = Math.max(r1, r2);
        var rsum = r1 + r2;
        if (dist > maxR) {
            //circles are outside of each other.
            return Math.abs(dist - rsum);
        }
        else {
            //circle with smaller radius has center within other circle
            if (r1 < r2) {
                //circle 1 is inside circle 2
                return Math.abs(r2 - (dist + r1));
            }
            else {
                //circle 2 is inside circle 1
                return Math.abs(r1 - (dist + r2));
            }
        }
    };
    TangentCircleConstraint.prototype.getGradient = function (v) {
        if (this.radius1 == v || this.radius2 == v) {
            var dist = this.center1.toPoint().distTo(this.center2.toPoint());
            var r1 = this.radius1.value;
            var r2 = this.radius2.value;
            var maxR = Math.max(r1, r2);
            var rsum = r1 + r2;
            if (dist > maxR) {
                //circles are outside of each other.
                var delta = dist - rsum;
                if (this.radius1 == v && this.radius1.value + delta <= 0)
                    return 0;
                if (this.radius2 == v && this.radius2.value + delta <= 0)
                    return 0;
                return delta;
            }
            else {
                //circle with smaller radius has center within other circle
                if (r1 < r2) {
                    //circle 1 is inside circle 2
                    var delta = r2 - (dist + r1);
                    if (this.radius1 == v) {
                        return delta;
                    }
                    else {
                        return -delta;
                    }
                }
                else {
                    //circle 2 is inside circle 1
                    var delta = r1 - (dist + r2);
                    if (this.radius2 == v) {
                        return delta;
                    }
                    else {
                        return -delta;
                    }
                }
            }
        }
        if (this.center1.has(v) || this.center2.has(v)) {
            var dist = this.center1.toPoint().distTo(this.center2.toPoint());
            var r1 = this.radius1.value;
            var r2 = this.radius2.value;
            var maxR = Math.max(r1, r2);
            var rsum = r1 + r2;
            if (dist > maxR) {
                //circles are outside of each other.
                var delta = dist - rsum;
                if (this.center1.has(v)) {
                    var goal = this.center1.toPoint().pointTowards(this.center2.toPoint(), delta);
                    return this.center1.deltaVTowards(v, goal);
                }
                else {
                    var goal = this.center2.toPoint().pointTowards(this.center1.toPoint(), delta);
                    return this.center2.deltaVTowards(v, goal);
                }
            }
            else {
                //circle with smaller radius has center within other circle
                if (r1 < r2) {
                    //circle 1 is inside circle 2
                    var delta = r2 - (dist + r1);
                    if (this.center1.has(v)) {
                        var goal = this.center1.toPoint().pointTowards(this.center2.toPoint(), -delta);
                        return this.center1.deltaVTowards(v, goal);
                    }
                    else {
                        var goal = this.center2.toPoint().pointTowards(this.center1.toPoint(), -delta);
                        return this.center2.deltaVTowards(v, goal);
                    }
                }
                else {
                    //circle 2 is inside circle 1
                    var delta = r1 - (dist + r2);
                    if (this.center1.has(v)) {
                        var goal = this.center1.toPoint().pointTowards(this.center2.toPoint(), -delta);
                        return this.center1.deltaVTowards(v, goal);
                    }
                    else {
                        var goal = this.center2.toPoint().pointTowards(this.center1.toPoint(), -delta);
                        return this.center2.deltaVTowards(v, goal);
                    }
                }
            }
        }
        return 0;
    };
    TangentCircleConstraint.prototype.containsFigure = function (f) {
        if (f.type == "circle") {
            //just radius
            return this.radius1 == f.r ||
                this.radius2 == f.r;
        }
        return false;
    };
    TangentCircleConstraint.prototype.asObject = function (obj, sketch) {
        return {
            "type": this.type,
            "name": this.name,
            "c1": sketch.points.indexOf(this.center1),
            "r1": sketch.variables.indexOf(this.radius1),
            "c2": sketch.points.indexOf(this.center2),
            "r2": sketch.variables.indexOf(this.radius2),
        };
    };
    TangentCircleConstraint.fromObject = function (c, sketch) {
        var c1 = sketch.points[c["c1"]];
        var r1 = sketch.variables[c["r1"]];
        var c2 = sketch.points[c["c2"]];
        var r2 = sketch.variables[c["r2"]];
        return new TangentCircleConstraint(c1, r1, c2, r2);
    };
    return TangentCircleConstraint;
}());
exports.TangentCircleConstraint = TangentCircleConstraint;
var EqualLengthConstraint = /** @class */ (function () {
    function EqualLengthConstraint(pairs, name) {
        if (name === void 0) { name = "equal length"; }
        this.type = "equal-length";
        this.name = "equal length";
        this.name = name;
        this.pairs = pairs;
    }
    EqualLengthConstraint.prototype.getError = function () {
        var goal = this.getGoalLength();
        var error = 0;
        for (var _i = 0, _a = this.pairs; _i < _a.length; _i++) {
            var pair = _a[_i];
            var p1 = pair[0].toPoint();
            var p2 = pair[1].toPoint();
            error += Math.abs(goal - p1.distTo(p2));
        }
        return error;
    };
    EqualLengthConstraint.prototype.getGoalLength = function () {
        var sumDist = 0;
        for (var _i = 0, _a = this.pairs; _i < _a.length; _i++) {
            var pair = _a[_i];
            var p1 = pair[0].toPoint();
            var p2 = pair[1].toPoint();
            var dist = p1.distTo(p2);
            if (pair[0].x.constant && pair[0].y.constant && pair[1].x.constant && pair[1].y.constant) {
                return dist;
            }
            sumDist += dist;
        }
        return sumDist / this.pairs.length;
    };
    EqualLengthConstraint.prototype.getGradient = function (v) {
        for (var _i = 0, _a = this.pairs; _i < _a.length; _i++) {
            var pair = _a[_i];
            if (pair[0].has(v) || pair[1].has(v)) {
                var goal = this.getGoalLength();
                if (pair[0].has(v)) {
                    var p0 = pair[0].toPoint();
                    var goalPoint = pair[1].toPoint().pointTowards(p0, goal);
                    return pair[0].deltaVTowards(v, goalPoint);
                }
                if (pair[1].has(v)) {
                    var p1 = pair[1].toPoint();
                    var goalPoint = pair[0].toPoint().pointTowards(p1, goal);
                    return pair[1].deltaVTowards(v, goalPoint);
                }
            }
        }
        return 0;
    };
    EqualLengthConstraint.prototype.containsFigure = function (f) {
        if (f.type == "line") {
            for (var _i = 0, _a = this.pairs; _i < _a.length; _i++) {
                var pair = _a[_i];
                if (pair[0] == f.p1.variablePoint && pair[1] == f.p2.variablePoint) {
                    return true;
                }
            }
        }
        return false;
    };
    EqualLengthConstraint.prototype.asObject = function (obj, sketch) {
        var pairs = [];
        for (var _i = 0, _a = this.pairs; _i < _a.length; _i++) {
            var pair = _a[_i];
            pairs.push([sketch.points.indexOf(pair[0]), sketch.points.indexOf(pair[1])]);
        }
        return {
            "type": this.type,
            "name": this.name,
            "pairs": pairs,
        };
    };
    EqualLengthConstraint.fromObject = function (c, sketch) {
        var pairs = [];
        for (var _i = 0, _a = c["pairs"]; _i < _a.length; _i++) {
            var pair = _a[_i];
            pairs.push([sketch.points[pair[0]], sketch.points[pair[1]]]);
        }
        return new EqualLengthConstraint(pairs);
    };
    return EqualLengthConstraint;
}());
exports.EqualLengthConstraint = EqualLengthConstraint;
function leastSquaresRegression(points) {
    //hacky solution to avoid weird behavior when dragging vertical points
    var constantPoints = [];
    for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
        var p = points_1[_i];
        if (p.x.constant) {
            constantPoints.push(p.toPoint());
        }
    }
    if (constantPoints.length > 1) {
        return [constantPoints[0], constantPoints[1]];
    }
    var xs = 0;
    var ys = 0;
    var x2s = 0;
    var y2s = 0;
    var xys = 0;
    var n = points.length;
    for (var _a = 0, points_2 = points; _a < points_2.length; _a++) {
        var point = points_2[_a];
        var x = point.x.value;
        var y = point.y.value;
        xs += x;
        ys += y;
        x2s += x * x;
        y2s += y * y;
        xys += x * y;
    }
    var numerator = (n * xys) - (xs * ys);
    var denominator = n * x2s - (xs * xs);
    if (denominator == 0 || Math.abs(numerator / denominator) > 1) {
        denominator = n * y2s - (ys * ys);
        var slope_1 = numerator / denominator;
        var xintercept = (xs - slope_1 * ys) / n;
        var p1_1 = new figures_1.Point(xintercept, 0);
        var p2_1 = new figures_1.Point(xintercept + slope_1, 1);
        return [p1_1, p2_1];
    }
    var slope = numerator / denominator;
    var yintercept = (ys - slope * xs) / n;
    var p1 = new figures_1.Point(0, yintercept);
    var p2 = new figures_1.Point(1, yintercept + slope);
    return [p1, p2];
}
function constraintFromObject(c, sketch) {
    var cs;
    switch (c.type) {
        case "equal":
            cs = EqualConstraint.fromObject(c, sketch);
            break;
        case "arc-point-coincident":
            cs = ArcPointCoincidentConstraint.fromObject(c, sketch);
            break;
        case "midpoint":
            cs = MidpointConstraint.fromObject(c, sketch);
            break;
        case "colinear":
            cs = ColinearPointsConstraint.fromObject(c, sketch);
            break;
        case "tangent-line":
            cs = TangentLineConstraint.fromObject(c, sketch);
            break;
        case "tangent-circle":
            cs = TangentCircleConstraint.fromObject(c, sketch);
            break;
        case "equal-length":
            cs = EqualLengthConstraint.fromObject(c, sketch);
    }
    if (c.name)
        cs.name = c.name;
    return cs;
}
exports.constraintFromObject = constraintFromObject;

},{"./figures":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_1 = require("./constraint");
/**
 * See type definitions
 * - TypeMatches are joined by & to form a TypeMatchExpression
 * - TypeMaps take the form "type as n type" such as "line as 2 point"
 * - TypeMaps are joined by , to form a TypeMapList
 * - MappedTypedMatchExpressionLists are formed as TypeMapList:TypeMatchExpression
 * - MappedTypedMatchExpressionLists are joined by | to form
 * - MatchQuantifier can be a number, a range (number-number), number+ or * (0+) or empty (1)
 */
var FilterString = /** @class */ (function () {
    function FilterString(str) {
        this.filterString = str;
        this.filter = this.parseFilter(this.filterString);
    }
    FilterString.prototype.parseFilter = function (filterString) {
        var filter = [];
        for (var _i = 0, _a = filterString.split("|"); _i < _a.length; _i++) {
            var mappedTypeMatchExpressionList = _a[_i];
            filter.push(this.parseFilterCase(mappedTypeMatchExpressionList));
        }
        return filter;
    };
    FilterString.prototype.parseFilterCase = function (filterCase) {
        var split = filterCase.split(":");
        var mapList = split[0] ? this.parseTypeMapList(split[0]) : [];
        var matchExpressionList = this.parseTypeMatchExpressionList(split[1]);
        return { mappings: mapList, expressions: matchExpressionList };
    };
    FilterString.prototype.parseTypeMapList = function (typeMapList) {
        var maps = [];
        for (var _i = 0, _a = typeMapList.split(","); _i < _a.length; _i++) {
            var typeMap = _a[_i];
            maps.push(this.parseTypeMap(typeMap));
        }
        return maps;
    };
    FilterString.prototype.parseTypeMap = function (typeMap) {
        var split = typeMap.split(" ");
        var fromType = split[0];
        //let as = split[1];
        var toTypeCount = parseInt(split[2]);
        var toType = split[3];
        return { from: fromType, count: toTypeCount, to: toType };
    };
    FilterString.prototype.parseTypeMatchExpressionList = function (typeMatchExpressionList) {
        var expressions = [];
        for (var _i = 0, _a = typeMatchExpressionList.split(","); _i < _a.length; _i++) {
            var typeMatchExpression = _a[_i];
            expressions.push(this.parseTypeMatchExpression(typeMatchExpression));
        }
        return expressions;
    };
    FilterString.prototype.parseTypeMatchExpression = function (typeMatchExpression) {
        var matches = [];
        for (var _i = 0, _a = typeMatchExpression.split("&"); _i < _a.length; _i++) {
            var typeMatch = _a[_i];
            matches.push(this.parseTypeMatch(typeMatch));
        }
        return matches;
    };
    FilterString.prototype.parseTypeMatch = function (typeMatch) {
        for (var i = 0; i < typeMatch.length; i++) {
            if (typeMatch[i].toLowerCase() != typeMatch[i].toUpperCase()) {
                //we've hit a letter!
                var quantifier = typeMatch.substr(0, i);
                if (quantifier == "*")
                    quantifier = "0+";
                if (quantifier == "" || quantifier == undefined)
                    quantifier = "1";
                var type = typeMatch.substr(i);
                return { quantifier: quantifier, type: type };
            }
        }
        console.error("Invalid TypeMatch:", typeMatch);
        return { quantifier: "0", type: "point" };
    };
    FilterString.prototype.satisfiesFilter = function (figures) {
        var rawTypes = {};
        for (var _i = 0, figures_1 = figures; _i < figures_1.length; _i++) {
            var fig = figures_1[_i];
            if (rawTypes[fig.type] === undefined) {
                rawTypes[fig.type] = 1;
                continue;
            }
            rawTypes[fig.type] += 1;
        }
        for (var _a = 0, _b = this.filter; _a < _b.length; _a++) {
            var filterCase = _b[_a];
            var typeCopy = {};
            for (var key in rawTypes) {
                typeCopy[key] = rawTypes[key];
            }
            if (this.satisfiesFilterCase(filterCase, typeCopy))
                return true;
        }
        return false;
    };
    FilterString.prototype.satisfiesFilterCase = function (filterCase, types) {
        for (var _i = 0, _a = filterCase.mappings; _i < _a.length; _i++) {
            var typeMapping = _a[_i];
            this.mapTypes(typeMapping, types);
        }
        for (var _b = 0, _c = filterCase.expressions; _b < _c.length; _b++) {
            var expression = _c[_b];
            if (this.satisfiesTypeMatchExpression(expression, types))
                return true;
        }
        return false;
    };
    FilterString.prototype.mapTypes = function (typeMapping, types) {
        if (types[typeMapping.from] !== undefined) {
            var additionalTypes = types[typeMapping.from] * typeMapping.count;
            delete types[typeMapping.from];
            if (types[typeMapping.to] === undefined) {
                types[typeMapping.to] = additionalTypes;
            }
            else {
                types[typeMapping.to] += additionalTypes;
            }
        }
    };
    FilterString.prototype.satisfiesTypeMatchExpression = function (expression, types) {
        var addressedTypes = {};
        for (var _i = 0, expression_1 = expression; _i < expression_1.length; _i++) {
            var typeMatch = expression_1[_i];
            if (!this.satisfiesTypeMatch(typeMatch, types))
                return false;
            addressedTypes[typeMatch.type] = true;
        }
        for (var type in types) {
            //all types must be addressed.
            if (!addressedTypes[type])
                return false;
        }
        return true;
    };
    FilterString.prototype.satisfiesTypeMatch = function (typeMatch, types) {
        var count = types[typeMatch.type];
        var quantifier = typeMatch.quantifier;
        if (quantifier.indexOf("-") != -1) {
            //range
            var min = parseInt(quantifier.substr(0, quantifier.indexOf("-") - 1));
            var max = parseInt(quantifier.substr(quantifier.indexOf("-") + 1));
            return count >= min && count <= max;
        }
        if (quantifier.indexOf("+") != -1) {
            //min+
            var min = parseInt(quantifier.substr(0, quantifier.indexOf("+")));
            return count >= min;
        }
        var exact = parseInt(quantifier);
        return count == exact;
    };
    return FilterString;
}());
var HorizontalPointFilter = /** @class */ (function () {
    function HorizontalPointFilter() {
        this.name = "horizontal";
        this.filter = new FilterString(":2+point");
    }
    HorizontalPointFilter.prototype.createConstraints = function (sortedFigures) {
        var ys = [];
        for (var _i = 0, _a = sortedFigures.point; _i < _a.length; _i++) {
            var point = _a[_i];
            ys.push(point.p.variablePoint.y);
        }
        return [new constraint_1.EqualConstraint(ys, "horizontal")];
    };
    return HorizontalPointFilter;
}());
var VerticalPointFilter = /** @class */ (function () {
    function VerticalPointFilter() {
        this.name = "vertical";
        this.filter = new FilterString(":2+point");
    }
    VerticalPointFilter.prototype.createConstraints = function (sortedFigures) {
        var xs = [];
        for (var _i = 0, _a = sortedFigures.point; _i < _a.length; _i++) {
            var point = _a[_i];
            xs.push(point.p.variablePoint.x);
        }
        return [new constraint_1.EqualConstraint(xs, "vertical")];
    };
    return VerticalPointFilter;
}());
var VerticalLineFilter = /** @class */ (function () {
    function VerticalLineFilter() {
        this.name = "vertical";
        this.filter = new FilterString(":1+line");
    }
    VerticalLineFilter.prototype.createConstraints = function (sortedFigures) {
        var constraints = [];
        for (var _i = 0, _a = sortedFigures.line; _i < _a.length; _i++) {
            var line = _a[_i];
            constraints.push(new constraint_1.EqualConstraint([line.p1.variablePoint.x, line.p2.variablePoint.x], "vertical"));
        }
        return constraints;
    };
    return VerticalLineFilter;
}());
var HorizontalLineFilter = /** @class */ (function () {
    function HorizontalLineFilter() {
        this.name = "horizontal";
        this.filter = new FilterString(":1+line");
    }
    HorizontalLineFilter.prototype.createConstraints = function (sortedFigures) {
        var constraints = [];
        for (var _i = 0, _a = sortedFigures.line; _i < _a.length; _i++) {
            var line = _a[_i];
            constraints.push(new constraint_1.EqualConstraint([line.p1.variablePoint.y, line.p2.variablePoint.y], "horizontal"));
        }
        return constraints;
    };
    return HorizontalLineFilter;
}());
var CoincidentPointFilter = /** @class */ (function () {
    function CoincidentPointFilter() {
        this.name = "coincident";
        this.filter = new FilterString(":2+point");
    }
    CoincidentPointFilter.prototype.createConstraints = function (sortedFigures) {
        var xs = [];
        var ys = [];
        for (var _i = 0, _a = sortedFigures.point; _i < _a.length; _i++) {
            var fig = _a[_i];
            xs.push(fig.p.variablePoint.x);
            ys.push(fig.p.variablePoint.y);
        }
        return [new constraint_1.EqualConstraint(xs, "vertical"), new constraint_1.EqualConstraint(ys, "horizontal")];
    };
    return CoincidentPointFilter;
}());
var ArcPointFilter = /** @class */ (function () {
    function ArcPointFilter() {
        this.name = "coincident";
        this.filter = new FilterString(":circle&1+point");
    }
    ArcPointFilter.prototype.createConstraints = function (sortedFigures) {
        var points = [];
        var circle = sortedFigures.circle[0];
        for (var _i = 0, _a = sortedFigures.point; _i < _a.length; _i++) {
            var point = _a[_i];
            points.push(point.p.variablePoint);
        }
        return [new constraint_1.ArcPointCoincidentConstraint(circle.c.variablePoint, circle.r, points, "point on circle")];
    };
    return ArcPointFilter;
}());
var LineMidpointFilter = /** @class */ (function () {
    function LineMidpointFilter() {
        this.name = "midpoint";
        this.filter = new FilterString(":line&point");
    }
    LineMidpointFilter.prototype.createConstraints = function (sortedFigures) {
        var point = sortedFigures.point[0];
        var line = sortedFigures.line[0];
        return [new constraint_1.MidpointConstraint(line.p1.variablePoint, line.p2.variablePoint, point.p.variablePoint, "midpoint")];
    };
    return LineMidpointFilter;
}());
var EqualRadiusFilter = /** @class */ (function () {
    function EqualRadiusFilter() {
        this.name = "equal";
        this.filter = new FilterString(":2+circle");
    }
    EqualRadiusFilter.prototype.createConstraints = function (sortedFigures) {
        var radii = [];
        for (var _i = 0, _a = sortedFigures.circle; _i < _a.length; _i++) {
            var circle = _a[_i];
            radii.push(circle.r);
        }
        return [new constraint_1.EqualConstraint(radii, "equal radii")];
    };
    return EqualRadiusFilter;
}());
var ColinearFilter = /** @class */ (function () {
    function ColinearFilter() {
        this.name = "colinear";
        this.filter = new FilterString("line as 2 point:3+point");
    }
    ColinearFilter.prototype.createConstraints = function (sortedFigures) {
        var points = [];
        for (var _i = 0, _a = sortedFigures.point; _i < _a.length; _i++) {
            var point = _a[_i];
            points.push(point.p.variablePoint);
        }
        for (var _b = 0, _c = sortedFigures.line; _b < _c.length; _b++) {
            var line = _c[_b];
            points.push(line.p1.variablePoint);
            points.push(line.p2.variablePoint);
        }
        return [new constraint_1.ColinearPointsConstraint(points, "colinear")];
    };
    return ColinearFilter;
}());
var TangentLineFilter = /** @class */ (function () {
    function TangentLineFilter() {
        this.name = "tangent";
        this.filter = new FilterString(":circle&1+line");
    }
    TangentLineFilter.prototype.createConstraints = function (sortedFigures) {
        var circle = sortedFigures.circle[0];
        var constraints = [];
        for (var _i = 0, _a = sortedFigures.line; _i < _a.length; _i++) {
            var line = _a[_i];
            constraints.push(new constraint_1.TangentLineConstraint(circle.c.variablePoint, circle.r, line.p1.variablePoint, line.p2.variablePoint, "tangent line"));
        }
        return constraints;
    };
    return TangentLineFilter;
}());
exports.TangentLineFilter = TangentLineFilter;
var ConcentricCirclesFilter = /** @class */ (function () {
    function ConcentricCirclesFilter() {
        this.name = "concentric";
        this.filter = new FilterString(":1+circle&*point");
    }
    ConcentricCirclesFilter.prototype.createConstraints = function (sortedFigures) {
        var xs = [];
        var ys = [];
        for (var _i = 0, _a = sortedFigures.circle; _i < _a.length; _i++) {
            var circle = _a[_i];
            xs.push(circle.c.variablePoint.x);
            ys.push(circle.c.variablePoint.y);
        }
        for (var _b = 0, _c = sortedFigures.point; _b < _c.length; _b++) {
            var point = _c[_b];
            xs.push(point.p.variablePoint.x);
            ys.push(point.p.variablePoint.y);
        }
        return [new constraint_1.EqualConstraint(xs, "vertical"), new constraint_1.EqualConstraint(ys, "horizontal")];
    };
    return ConcentricCirclesFilter;
}());
exports.ConcentricCirclesFilter = ConcentricCirclesFilter;
var LineIntersectionFilter = /** @class */ (function () {
    function LineIntersectionFilter() {
        this.name = "intersection";
        this.filter = new FilterString(":point&2+line");
    }
    LineIntersectionFilter.prototype.createConstraints = function (sortedFigures) {
        var lines = sortedFigures.line;
        var point = sortedFigures.point[0];
        var constraints = [];
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            constraints.push(new constraint_1.ColinearPointsConstraint([line.p1.variablePoint, line.p2.variablePoint, point.p.variablePoint], "colinear"));
        }
        return constraints;
    };
    return LineIntersectionFilter;
}());
exports.LineIntersectionFilter = LineIntersectionFilter;
var CircleIntersectionFilter = /** @class */ (function () {
    function CircleIntersectionFilter() {
        this.name = "intersection";
        this.filter = new FilterString(":point&2+circle");
    }
    CircleIntersectionFilter.prototype.createConstraints = function (sortedFigures) {
        var circles = sortedFigures.circle;
        var point = sortedFigures.point[0];
        var constraints = [];
        for (var _i = 0, circles_1 = circles; _i < circles_1.length; _i++) {
            var circle = circles_1[_i];
            constraints.push(new constraint_1.ArcPointCoincidentConstraint(circle.c.variablePoint, circle.r, [point.p.variablePoint], "point on circle"));
        }
        return constraints;
    };
    return CircleIntersectionFilter;
}());
exports.CircleIntersectionFilter = CircleIntersectionFilter;
var TangentCirclesFilter = /** @class */ (function () {
    function TangentCirclesFilter() {
        this.name = "tangent";
        this.filter = new FilterString(":2circle");
    }
    TangentCirclesFilter.prototype.createConstraints = function (sortedFigures) {
        var circle1 = sortedFigures.circle[0];
        var circle2 = sortedFigures.circle[1];
        return [new constraint_1.TangentCircleConstraint(circle1.c.variablePoint, circle1.r, circle2.c.variablePoint, circle2.r, "tangent circles")];
    };
    return TangentCirclesFilter;
}());
exports.TangentCirclesFilter = TangentCirclesFilter;
var EqualLengthFilter = /** @class */ (function () {
    function EqualLengthFilter() {
        this.name = "equal";
        this.filter = new FilterString(":2+line");
    }
    EqualLengthFilter.prototype.createConstraints = function (sortedFigures) {
        var lines = sortedFigures.line;
        var pairs = [];
        for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
            var line = lines_2[_i];
            pairs.push([line.p1.variablePoint, line.p2.variablePoint]);
        }
        return [new constraint_1.EqualLengthConstraint(pairs, "equal lengths")];
    };
    return EqualLengthFilter;
}());
exports.EqualLengthFilter = EqualLengthFilter;
var possibleConstraints = [
    //pointy
    new CoincidentPointFilter(),
    new HorizontalPointFilter(),
    new VerticalPointFilter(),
    //liney
    new HorizontalLineFilter(),
    new VerticalLineFilter(),
    new ColinearFilter(),
    new LineIntersectionFilter(),
    new LineMidpointFilter(),
    new EqualLengthFilter(),
    //circley
    new EqualRadiusFilter(),
    new ConcentricCirclesFilter(),
    new TangentCirclesFilter(),
    new CircleIntersectionFilter(),
    new ArcPointFilter(),
    new TangentLineFilter(),
];
function sortFigureSelection(figures) {
    var sortedFigures = {
        point: [],
        line: [],
        circle: [],
    };
    for (var _i = 0, figures_2 = figures; _i < figures_2.length; _i++) {
        var f = figures_2[_i];
        sortedFigures[f.type].push(f);
    }
    return sortedFigures;
}
exports.sortFigureSelection = sortFigureSelection;
function getSatisfiedConstraintFilters(figs) {
    var possibilities = [];
    for (var _i = 0, possibleConstraints_1 = possibleConstraints; _i < possibleConstraints_1.length; _i++) {
        var pc = possibleConstraints_1[_i];
        if (pc.filter.satisfiesFilter(figs))
            possibilities.push(pc);
    }
    return possibilities;
}
exports.getSatisfiedConstraintFilters = getSatisfiedConstraintFilters;

},{"./constraint":1}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_1 = require("./constraint");
var main_1 = require("../main");
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.variablePoint = new constraint_1.VariablePoint(x, y);
    }
    Object.defineProperty(Point.prototype, "x", {
        get: function () {
            return this.variablePoint.x.value;
        },
        set: function (v) {
            this.variablePoint.x.value = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Point.prototype, "y", {
        get: function () {
            return this.variablePoint.y.value;
        },
        set: function (v) {
            this.variablePoint.y.value = v;
        },
        enumerable: true,
        configurable: true
    });
    Point.prototype.set = function (p) {
        this.x = p.x;
        this.y = p.y;
        return this;
    };
    Point.prototype.copy = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.distTo = function (o) {
        return Math.sqrt(this.distTo2(o));
    };
    Point.prototype.distTo2 = function (o) {
        var dx = o.x - this.x;
        var dy = o.y - this.y;
        return dx * dx + dy * dy;
    };
    Point.prototype.normalizeSelf = function () {
        var length = this.distTo(new Point(0, 0));
        if (length == 0) {
            this.x = 0;
            this.y = 1;
            return this;
        }
        this.x /= length;
        this.y /= length;
        return this;
    };
    Point.prototype.pointTowards = function (target, dist) {
        var diff = new Point(target.x - this.x, target.y - this.y);
        diff.normalizeSelf();
        return new Point(this.x + diff.x * dist, this.y + diff.y * dist);
    };
    Point.prototype.equals = function (o) {
        return o.x == this.x && o.y == this.y;
    };
    Point.prototype.add = function (point) {
        this.x += point.x;
        this.y += point.y;
        return this;
    };
    Point.prototype.sub = function (point) {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    };
    Point.prototype.projectBetween = function (p1, p2, cutoff) {
        if (cutoff === void 0) { cutoff = false; }
        var r = cutoff ? this.segmentFractionBetween(p1, p2) : this.projectionFactorBetween(p1, p2);
        var px = p1.x + r * (p2.x - p1.x);
        var py = p1.y + r * (p2.y - p1.y);
        return new Point(px, py);
    };
    Point.prototype.projectionFactorBetween = function (p1, p2) {
        if (p1.equals(this))
            return 0;
        if (p2.equals(this))
            return 1;
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        var len2 = dx * dx + dy * dy;
        return -((this.x - p1.x) * dx + (this.y - p1.y) * dy) / len2;
    };
    Point.prototype.segmentFractionBetween = function (p1, p2) {
        var segFrac = this.projectionFactorBetween(p1, p2);
        if (segFrac < 0)
            return 0;
        if (segFrac > 1 || isNaN(segFrac))
            return 1;
        return segFrac;
    };
    /**
     * Determine if three points are clockwise (1), counterclockwise(-1) or colinear(0)
     * @param p1
     * @param p2
     * @param p3
     */
    Point.orientation = function (p1, p2, p3) {
        var val = (p2.y - p1.y) * (p3.x - p2.x) -
            (p2.x - p1.x) * (p3.y - p2.y);
        if (Math.abs(val) < 0.1)
            return 0; // colinear
        return (val > 0) ? 1 : -1; // clock or counterclock wise
    };
    /**
     * Determine if p1 lies on the line between p2 and p3
     * @param p1
     * @param p2
     * @param p3
     */
    Point.onSegment = function (p1, p2, p3) {
        return (p2.x <= Math.max(p1.x, p3.x) && p2.x >= Math.min(p1.x, p3.x) &&
            p2.y <= Math.max(p1.y, p3.y) && p2.y >= Math.min(p1.y, p3.y));
    };
    /**
     * Returns true of the line p1q1 intersects q2p2
     * @param p1
     * @param p2
     * @param p3
     * @param p4
     */
    Point.doIntersect = function (p1, q1, p2, q2) {
        var o1 = Point.orientation(p1, q1, p2);
        var o2 = Point.orientation(p1, q1, q2);
        var o3 = Point.orientation(p2, q2, p1);
        var o4 = Point.orientation(p2, q2, q1);
        //General case
        if (o1 != o2 && o3 != o4)
            return true;
        // Special Cases
        // p1, q1 and p2 are colinear and p2 lies on segment p1q1
        if (o1 == 0 && Point.onSegment(p1, p2, q1))
            return true;
        // p1, q1 and q2 are colinear and q2 lies on segment p1q1
        if (o2 == 0 && Point.onSegment(p1, q2, q1))
            return true;
        // p2, q2 and p1 are colinear and p1 lies on segment p2q2
        if (o3 == 0 && Point.onSegment(p2, p1, q2))
            return true;
        // p2, q2 and q1 are colinear and q1 lies on segment p2q2
        if (o4 == 0 && Point.onSegment(p2, q1, q2))
            return true;
        return false; // Doesn't fall in any of the above cases
    };
    Point.fromVariablePoint = function (v) {
        var p = new Point(0, 0);
        p.variablePoint = v;
        return p;
    };
    Point.averagePoint = function () {
        var points = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            points[_i] = arguments[_i];
        }
        var x = 0;
        var y = 0;
        for (var _a = 0, points_1 = points; _a < points_1.length; _a++) {
            var point = points_1[_a];
            x += point.x;
            y += point.y;
        }
        return new Point(x / points.length, y / points.length);
    };
    return Point;
}());
exports.Point = Point;
var BasicFigure = /** @class */ (function () {
    function BasicFigure() {
        this.type = "null";
        this.name = "null";
    }
    BasicFigure.prototype.getClosestPoint = function (point) {
        return undefined;
    };
    BasicFigure.prototype.translate = function (from, to) {
    };
    BasicFigure.prototype.getRelatedFigures = function () {
        return this.getRootFigure().getDescendants();
    };
    BasicFigure.prototype.getRootFigure = function () {
        if (this.parentFigure) {
            return this.parentFigure.getRootFigure();
        }
        else {
            return this;
        }
    };
    BasicFigure.prototype.getDescendants = function () {
        var children = [this];
        for (var _i = 0, _a = this.childFigures; _i < _a.length; _i++) {
            var child = _a[_i];
            children.push(child);
            var descendants = child.getDescendants();
            for (var _b = 0, descendants_1 = descendants; _b < descendants_1.length; _b++) {
                var descendant = descendants_1[_b];
                children.push(descendant);
            }
        }
        return children;
    };
    BasicFigure.prototype.setLocked = function (lock) {
        for (var _i = 0, _a = this.childFigures; _i < _a.length; _i++) {
            var fig = _a[_i];
            fig.setLocked(lock);
        }
    };
    BasicFigure.prototype.asObject = function (obj, sketch) {
        return {
            "type": this.type,
        };
    };
    return BasicFigure;
}());
exports.BasicFigure = BasicFigure;
var PointFigure = /** @class */ (function (_super) {
    __extends(PointFigure, _super);
    function PointFigure(p, name, add) {
        if (name === void 0) { name = "point"; }
        if (add === void 0) { add = true; }
        var _this = _super.call(this) || this;
        _this.type = "point";
        _this.name = "point";
        _this.childFigures = [];
        _this.parentFigure = null;
        _this.p = p;
        _this.name = name;
        if (add)
            main_1.protractr.sketch.addPoint(_this.p.variablePoint);
        return _this;
    }
    PointFigure.prototype.getClosestPoint = function (point) {
        return this.p.copy();
    };
    PointFigure.prototype.translate = function (from, to) {
        this.p.set(to);
    };
    PointFigure.prototype.setLocked = function (lock) {
        _super.prototype.setLocked.call(this, lock);
        this.p.variablePoint.x.constant = lock;
        this.p.variablePoint.y.constant = lock;
    };
    PointFigure.prototype.asObject = function (obj, sketch) {
        var o = _super.prototype.asObject.call(this, obj, sketch);
        o["p"] = sketch.points.indexOf(this.p.variablePoint);
        return o;
    };
    return PointFigure;
}(BasicFigure));
exports.PointFigure = PointFigure;
var LineFigure = /** @class */ (function (_super) {
    __extends(LineFigure, _super);
    function LineFigure(p1, p2, name, add) {
        if (name === void 0) { name = "line"; }
        if (add === void 0) { add = true; }
        var _this = _super.call(this) || this;
        _this.type = "line";
        _this.name = "line";
        _this.p1 = p1;
        _this.p2 = p2;
        _this.name = name;
        _this.childFigures = [new PointFigure(_this.p1, "p1", add), new PointFigure(_this.p2, "p2", add)];
        _this.childFigures[0].parentFigure = _this;
        _this.childFigures[1].parentFigure = _this;
        return _this;
    }
    LineFigure.prototype.getClosestPoint = function (point) {
        var projection = point.projectBetween(this.p1, this.p2, true);
        var midpoint = Point.averagePoint(this.p1, this.p2);
        if (midpoint.distTo(point) < 5 / main_1.protractr.ui.sketchView.ctxScale) {
            return midpoint;
        }
        return projection;
    };
    LineFigure.prototype.translate = function (from, to) {
        var diff = to.sub(from).copy();
        this.p1.add(diff);
        this.p2.add(diff);
    };
    LineFigure.prototype.asObject = function (obj, sketch) {
        var o = _super.prototype.asObject.call(this, obj, sketch);
        o["p1"] = sketch.points.indexOf(this.p1.variablePoint);
        o["p2"] = sketch.points.indexOf(this.p2.variablePoint);
        return o;
    };
    return LineFigure;
}(BasicFigure));
exports.LineFigure = LineFigure;
var CircleFigure = /** @class */ (function (_super) {
    __extends(CircleFigure, _super);
    function CircleFigure(c, r, name, add) {
        if (name === void 0) { name = "circle"; }
        if (add === void 0) { add = true; }
        var _this = _super.call(this) || this;
        _this.type = "circle";
        _this.c = c;
        _this.r = new constraint_1.Variable(r);
        _this.name = name;
        if (add)
            main_1.protractr.sketch.addVariable(_this.r);
        _this.childFigures = [new PointFigure(_this.c, "center", add)];
        _this.childFigures[0].parentFigure = _this;
        return _this;
    }
    CircleFigure.prototype.getClosestPoint = function (point) {
        return this.c.pointTowards(point, this.r.value);
    };
    CircleFigure.prototype.translate = function (from, to) {
        this.r.value = to.distTo(this.c);
    };
    CircleFigure.prototype.setLocked = function (lock) {
        _super.prototype.setLocked.call(this, lock);
        this.r.constant = lock;
    };
    CircleFigure.prototype.asObject = function (obj, sketch) {
        var o = _super.prototype.asObject.call(this, obj, sketch);
        o["c"] = sketch.points.indexOf(this.c.variablePoint);
        o["r"] = sketch.variables.indexOf(this.r);
        return o;
    };
    return CircleFigure;
}(BasicFigure));
exports.CircleFigure = CircleFigure;
function getFullName(figure) {
    if (!figure)
        return "null";
    var name = figure.name;
    while (figure.parentFigure) {
        figure = figure.parentFigure;
        name += " of " + figure.name;
    }
    return name;
}
exports.getFullName = getFullName;
function figureFromObject(obj, sketch) {
    switch (obj.type) {
        case "point":
            var p = sketch.points[obj["p"]];
            return new PointFigure(Point.fromVariablePoint(p), "point", false);
        case "line":
            var p1 = sketch.points[obj["p1"]];
            var p2 = sketch.points[obj["p2"]];
            return new LineFigure(Point.fromVariablePoint(p1), Point.fromVariablePoint(p2), "line", false);
        case "circle":
            var c = sketch.points[obj["c"]];
            var r = sketch.variables[obj["r"]];
            var circle = new CircleFigure(Point.fromVariablePoint(c), 0, "circle", false);
            circle.r = r;
            return circle;
    }
    return null;
}
exports.figureFromObject = figureFromObject;

},{"../main":5,"./constraint":1}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_1 = require("./constraint");
var figures_1 = require("./figures");
var main_1 = require("../main");
var typeMagnetism = {
    circle: 0,
    line: 0,
    point: 5,
};
var Sketch = /** @class */ (function () {
    function Sketch() {
        this.constraints = [];
        this.variables = [];
        this.points = [];
        this.rootFigures = [];
    }
    Sketch.prototype.getClosestFigure = function (point, ignoreFigures, maxDist, scale) {
        if (ignoreFigures === void 0) { ignoreFigures = []; }
        if (maxDist === void 0) { maxDist = 10; }
        if (scale === void 0) { scale = 1; }
        var allFigures = [];
        for (var _i = 0, _a = this.rootFigures; _i < _a.length; _i++) {
            var fig = _a[_i];
            allFigures.push.apply(allFigures, fig.getRelatedFigures());
        }
        var filteredFigures = allFigures.filter(function (value, index, arr) {
            return ignoreFigures.indexOf(value) == -1;
        });
        if (filteredFigures.length == 0)
            return null;
        var dist = filteredFigures[0].getClosestPoint(point).distTo(point);
        var closest = filteredFigures[0];
        for (var _b = 0, filteredFigures_1 = filteredFigures; _b < filteredFigures_1.length; _b++) {
            var fig = filteredFigures_1[_b];
            var p = fig.getClosestPoint(point);
            var d = p.distTo(point) - typeMagnetism[fig.type] / scale;
            if (d < dist) {
                closest = fig;
                dist = d;
            }
        }
        if (dist <= maxDist / scale) {
            return closest;
        }
        else {
            return null;
        }
    };
    Sketch.prototype.addConstraintAndCombine = function (constraint) {
        if (constraint.type == "equal") {
            var e1 = constraint;
            var mergeables = [];
            for (var _i = 0, _a = this.constraints; _i < _a.length; _i++) {
                var c = _a[_i];
                if (c.type == "equal") {
                    var e2 = c;
                    for (var _b = 0, _c = e1.variables; _b < _c.length; _b++) {
                        var v = _c[_b];
                        if (e2.variables.indexOf(v) != -1) {
                            //intersection constraint domain
                            mergeables.push(e2);
                            break;
                        }
                    }
                }
            }
            if (mergeables.length > 0) {
                var newVariables = [];
                for (var _d = 0, mergeables_1 = mergeables; _d < mergeables_1.length; _d++) {
                    var m = mergeables_1[_d];
                    newVariables = newVariables.concat(m.variables);
                }
                for (var _e = 0, _f = e1.variables; _e < _f.length; _e++) {
                    var v = _f[_e];
                    if (newVariables.indexOf(v) == -1) {
                        //variable not present in merged intersecting constraints
                        newVariables.push(v);
                    }
                }
                var newEqual = new constraint_1.EqualConstraint(newVariables, constraint.name);
                for (var _g = 0, mergeables_2 = mergeables; _g < mergeables_2.length; _g++) {
                    var m = mergeables_2[_g];
                    this.removeConstraint(m);
                }
                this.constraints.push(newEqual);
            }
            else {
                this.constraints.push(constraint);
            }
        }
        else if (constraint.type == "colinear") {
            var cl1 = constraint;
            var mergeables = [];
            for (var _h = 0, _j = this.constraints; _h < _j.length; _h++) {
                var c = _j[_h];
                if (c.type == "colinear") {
                    var cl2 = c;
                    var count = 0;
                    for (var _k = 0, _l = cl1.points; _k < _l.length; _k++) {
                        var p = _l[_k];
                        if (cl2.points.indexOf(p) != -1) {
                            count += 1;
                            if (count >= 2) {
                                //intersection constraint domain
                                mergeables.push(cl2);
                                break;
                            }
                        }
                    }
                }
            }
            if (mergeables.length > 0) {
                var newPoints = [];
                for (var _m = 0, mergeables_3 = mergeables; _m < mergeables_3.length; _m++) {
                    var m = mergeables_3[_m];
                    newPoints = newPoints.concat(m.points);
                }
                for (var _o = 0, _p = cl1.points; _o < _p.length; _o++) {
                    var p = _p[_o];
                    if (newPoints.indexOf(p) == -1) {
                        //variable not present in merged intersecting constraints
                        newPoints.push(p);
                    }
                }
                var newColinear = new constraint_1.ColinearPointsConstraint(newPoints, constraint.name);
                for (var _q = 0, mergeables_4 = mergeables; _q < mergeables_4.length; _q++) {
                    var m = mergeables_4[_q];
                    this.removeConstraint(m);
                }
                this.constraints.push(newColinear);
            }
            else {
                this.constraints.push(constraint);
            }
        }
        else if (constraint.type == "arc-point-coincident") {
            var apc1 = constraint;
            var mergeable = void 0;
            for (var _r = 0, _s = this.constraints; _r < _s.length; _r++) {
                var c = _s[_r];
                if (c.type == "arc-point-coincident") {
                    var apc2 = c;
                    if (apc1.center == apc2.center) {
                        mergeable = apc2;
                        break;
                    }
                }
            }
            if (mergeable) {
                for (var _t = 0, _u = apc1.points; _t < _u.length; _t++) {
                    var p = _u[_t];
                    mergeable.points.push(p);
                }
            }
            else {
                this.constraints.push(constraint);
            }
        }
        else if (constraint.type == "equal-length") {
            var el1 = constraint;
            var mergeables = [];
            for (var _v = 0, _w = this.constraints; _v < _w.length; _v++) {
                var c = _w[_v];
                if (c.type == "equal-length") {
                    var el2 = c;
                    for (var _x = 0, _y = el1.pairs; _x < _y.length; _x++) {
                        var pair1 = _y[_x];
                        for (var _z = 0, _0 = el2.pairs; _z < _0.length; _z++) {
                            var pair2 = _0[_z];
                            if (pair1[0] == pair2[0] && pair1[1] == pair2[1]) {
                                mergeables.push(el2);
                            }
                        }
                    }
                }
            }
            if (mergeables.length > 0) {
                for (var _1 = 0, mergeables_5 = mergeables; _1 < mergeables_5.length; _1++) {
                    var mergeable = mergeables_5[_1];
                    for (var _2 = 0, _3 = mergeable.pairs; _2 < _3.length; _2++) {
                        var p = _3[_2];
                        el1.pairs.push(p);
                    }
                    this.removeConstraint(mergeable);
                }
            }
            this.constraints.push(constraint);
        }
        else {
            this.constraints.push(constraint);
        }
    };
    Sketch.prototype.addConstraints = function (constraints) {
        for (var _i = 0, constraints_1 = constraints; _i < constraints_1.length; _i++) {
            var c = constraints_1[_i];
            this.addConstraintAndCombine(c);
        }
        if (!this.solveConstraints(true)) {
            alert("That constraint couldn't be solved...");
        }
        main_1.protractr.ui.refresh();
    };
    Sketch.prototype.removeConstraint = function (constraint) {
        this.constraints = this.constraints.filter(function (value, index, arr) {
            return value != constraint;
        });
        main_1.protractr.ui.refresh();
    };
    Sketch.prototype.addPoint = function (point) {
        this.points.push(point);
        this.addVariable(point.x);
        this.addVariable(point.y);
    };
    Sketch.prototype.addVariable = function (variable) {
        this.variables.push(variable);
    };
    Sketch.prototype.solveConstraints = function (tirelessSolve) {
        if (tirelessSolve === void 0) { tirelessSolve = false; }
        var startTime = new Date().getTime();
        var count = 1;
        var previousError = 0;
        while (true) {
            var totalError = 0;
            for (var _i = 0, _a = this.constraints; _i < _a.length; _i++) {
                var constraint = _a[_i];
                totalError += constraint.getError();
            }
            if (totalError < 1 && count > 10)
                return true; // solved, still do a few iterations though...
            if (count > 100 && !tirelessSolve)
                return false;
            if (count % 10000 == 0) {
                var currentTime = new Date().getTime();
                if (currentTime - startTime > 1000)
                    return false; //give up after one second.
            }
            var variableGradients = [];
            var contributorCount = [];
            for (var _b = 0, _c = this.variables; _b < _c.length; _b++) {
                var variable = _c[_b];
                var gradient = 0;
                var count_1 = 0;
                for (var _d = 0, _e = this.constraints; _d < _e.length; _d++) {
                    var constraint = _e[_d];
                    var g = constraint.getGradient(variable);
                    if (g != 0) {
                        gradient += g;
                        count_1++;
                    }
                }
                variableGradients.push(gradient);
                contributorCount.push(count_1);
            }
            for (var i = 0; i < variableGradients.length; i++) {
                this.variables[i].value += variableGradients[i] / (2 + contributorCount[i]);
            }
            count += 1;
            previousError = totalError;
        }
    };
    Sketch.prototype.asObject = function () {
        var obj = {
            "variables": [],
            "points": [],
            "figures": [],
            "constraints": [],
        };
        for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
            var v = _a[_i];
            obj.variables.push(v.value);
        }
        for (var _b = 0, _c = this.points; _b < _c.length; _b++) {
            var p = _c[_b];
            var xp = this.variables.indexOf(p.x);
            var yp = this.variables.indexOf(p.y);
            obj.points.push([xp, yp]);
        }
        for (var _d = 0, _e = this.rootFigures; _d < _e.length; _d++) {
            var fig = _e[_d];
            obj.figures.push(fig.asObject(obj, this));
        }
        for (var _f = 0, _g = this.constraints; _f < _g.length; _f++) {
            var constraint = _g[_f];
            obj.constraints.push(constraint.asObject(obj, this));
        }
        return obj;
    };
    Sketch.fromObject = function (obj) {
        var sketch = new Sketch();
        for (var _i = 0, _a = obj.variables; _i < _a.length; _i++) {
            var v = _a[_i];
            sketch.variables.push(new constraint_1.Variable(v));
        }
        for (var _b = 0, _c = obj.points; _b < _c.length; _b++) {
            var p = _c[_b];
            var xv = sketch.variables[p[0]];
            var yv = sketch.variables[p[1]];
            var vp = constraint_1.VariablePoint.fromVariables(xv, yv);
            sketch.points.push(vp);
        }
        for (var _d = 0, _e = obj.figures; _d < _e.length; _d++) {
            var fig = _e[_d];
            sketch.rootFigures.push(figures_1.figureFromObject(fig, sketch));
        }
        for (var _f = 0, _g = obj.constraints; _f < _g.length; _f++) {
            var constraint = _g[_f];
            sketch.constraints.push(constraint_1.constraintFromObject(constraint, sketch));
        }
        return sketch;
    };
    return Sketch;
}());
exports.Sketch = Sketch;

},{"../main":5,"./constraint":1,"./figures":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var protractr_1 = require("./protractr");
var canvas;
var tools;
var sidePane;
function saveAs(string, filename) {
    var a = document.createElement("a");
    var data = "text/json;charset=utf-8," + encodeURIComponent(string);
    a.href = "data:" + data;
    a.download = filename;
    a.click();
}
exports.saveAs = saveAs;
var adjustCanvasResolution = function (event) {
    canvas.width = canvas.parentElement.clientWidth - 1;
    canvas.height = window.innerHeight - document.getElementsByClassName("title")[0].clientHeight - 5;
    exports.protractr.ui.sketchView.draw();
};
window.addEventListener("resize", adjustCanvasResolution);
window.addEventListener("load", function () {
    canvas = document.getElementById("canvas");
    sidePane = document.getElementById("side-pane");
    tools = document.getElementById("tools");
    exports.protractr = new protractr_1.Protractr(canvas, sidePane, tools);
    adjustCanvasResolution(null);
    console.log("________                __                        __                   " + "\n" +
        "\\_____  \\_______  _____/  |_____________    _____/  |________        " + "\n" +
        "|    ___/\\_  __ \\/  _ \\   __\\_  __ \\__  \\ _/ ___\\   __\\_  __ \\" + "\n" +
        "|   |     |  | \\(  <_> )  |  |  | \\// __ \\\\  \\___|  |  |  | \\/   " + "\n" +
        "|___|     |__|   \\____/|__|  |__|  (____  /\\___  >__|  |__|          " + "\n" +
        "                                        \\/     \\/                                    ");
    console.log("Protractr: ", exports.protractr);
    var example = document.location.search.substr(1);
    if (example.length > 0) {
        console.log("Loading ", example);
        var path = document.location.pathname;
        var origin_1 = path.substr(0, path.indexOf("/src/"));
        var url = origin_1 + "/examples/" + example;
        exports.protractr.loadFromURL(url);
    }
});

},{"./protractr":6}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sketch_1 = require("./gcs/sketch");
var ui_1 = require("./ui/ui");
var Protractr = /** @class */ (function () {
    function Protractr(canvas, sidePane, toolbar) {
        this.sketch = new sketch_1.Sketch();
        this.ui = new ui_1.UI(this, canvas, sidePane, toolbar);
    }
    Protractr.prototype.loadSketch = function (json, push) {
        if (push === void 0) { push = true; }
        if (json == undefined) {
            this.resetSketch();
            return;
        }
        this.sketch = sketch_1.Sketch.fromObject(JSON.parse(json));
        this.ui.reload();
    };
    Protractr.prototype.exportSketch = function () {
        return JSON.stringify(this.sketch.asObject());
    };
    Protractr.prototype.resetSketch = function () {
        this.sketch = new sketch_1.Sketch();
        this.ui.reload();
    };
    Protractr.prototype.loadFromURL = function (url) {
        var request = new XMLHttpRequest();
        var _this = this;
        request.addEventListener("load", function () {
            if (this.status == 200) {
                _this.loadSketch(this.responseText);
            }
            else {
                console.log("Failed to load sketch, response code != 200: ", this);
            }
        });
        request.open("GET", url);
        request.send();
    };
    return Protractr;
}());
exports.Protractr = Protractr;

},{"./gcs/sketch":4,"./ui/ui":12}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Editing history manager.  Consists of two stacks: undo and redo history.
 * New states clear redo history, are added to undo history.
 * It's possible for current state to be undefined, in which case the app should load some default state.
 */
var History = /** @class */ (function () {
    function History(defaultState) {
        this.undoHistory = new HistoryStack();
        this.redoHistory = new HistoryStack();
        this.defaultState = defaultState;
        this.currentState = defaultState;
    }
    /**
     * A new state produced by something other than undo or redo.
     */
    History.prototype.recordStateChange = function (newState) {
        if (this.currentState != newState) {
            this.undoHistory.push(this.currentState);
            this.redoHistory.clear();
            this.currentState = newState;
        }
    };
    /**
     * moves current state into redo, pops undo onto current state
     */
    History.prototype.undo = function () {
        if (this.undoHistory.empty())
            return this.currentState;
        this.redoHistory.push(this.currentState);
        this.currentState = this.undoHistory.pop();
        return this.currentState;
    };
    /**
     * moves current state into undo, pops redo onto current state
     */
    History.prototype.redo = function () {
        if (this.redoHistory.empty())
            return this.currentState;
        this.undoHistory.push(this.currentState);
        this.currentState = this.redoHistory.pop();
        return this.currentState;
    };
    return History;
}());
exports.History = History;
/**
 * Simple stack structure.  Adjacent elements must be distinct.
 */
var HistoryStack = /** @class */ (function () {
    function HistoryStack() {
        this.stack = [];
    }
    /**
     * Get top element of stack
     */
    HistoryStack.prototype.top = function () {
        if (this.empty())
            return undefined;
        return this.stack[this.stack.length - 1];
    };
    HistoryStack.prototype.push = function (element) {
        if (this.top() != element) {
            this.stack.push(element);
        }
    };
    /**
     * Get top element of stack and remove
     */
    HistoryStack.prototype.pop = function () {
        if (this.empty())
            return undefined;
        return this.stack.pop();
    };
    HistoryStack.prototype.empty = function () {
        return this.stack.length == 0;
    };
    HistoryStack.prototype.clear = function () {
        this.stack = [];
    };
    return HistoryStack;
}());

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var figures_1 = require("../gcs/figures");
var main_1 = require("../main");
var constraint_filter_1 = require("../gcs/constraint_filter");
var Sidepane = /** @class */ (function () {
    function Sidepane(ui, sidePane) {
        this.ui = ui;
        this.sidePane = sidePane;
        this.selectedFiguresList = new SelectedFigureList(ui);
        this.sidePane.appendChild(this.selectedFiguresList.div);
        this.selectedFigureView = new FigureInfoView(ui);
        this.sidePane.appendChild(this.selectedFigureView.div);
        this.possibleNewConstraintsList = new PossibleNewConstraintsList(ui);
        this.sidePane.appendChild(this.possibleNewConstraintsList.div);
        this.existingConstraintsList = new ExistingConstraintList(ui);
        this.sidePane.appendChild(this.existingConstraintsList.div);
    }
    return Sidepane;
}());
exports.Sidepane = Sidepane;
var FigureInfoView = /** @class */ (function () {
    function FigureInfoView(ui) {
        this.ui = ui;
        this.div = document.createElement("div");
        this.fields = [];
        this.variables = [];
    }
    FigureInfoView.prototype.refresh = function () {
        for (var i = 0; i < this.variables.length; i++) {
            this.fields[i].value = "" + this.variables[i].value;
        }
    };
    FigureInfoView.prototype.setFigure = function (figure) {
        this.fields = [];
        this.variables = [];
        while (this.div.lastChild) {
            this.div.removeChild(this.div.lastChild);
        }
        if (figure) {
            switch (figure.type) {
                case "point":
                    var point = figure;
                    this.addVariable(point.p.variablePoint.x, "x");
                    this.addVariable(point.p.variablePoint.y, "y");
                    break;
                case "line":
                    var line = figure;
                    this.addVariable(line.p1.variablePoint.x, "x1");
                    this.addVariable(line.p1.variablePoint.y, "y1");
                    this.addVariable(line.p2.variablePoint.x, "x2");
                    this.addVariable(line.p2.variablePoint.y, "y2");
                    break;
                case "circle":
                    var circle = figure;
                    this.addVariable(circle.c.variablePoint.x, "center x");
                    this.addVariable(circle.c.variablePoint.y, "center y");
                    this.addVariable(circle.r, "radius");
                    break;
            }
        }
    };
    FigureInfoView.prototype.addVariable = function (variable, name) {
        var div = document.createElement("div");
        var label = document.createElement("span");
        label.innerText = name + ":";
        div.appendChild(label);
        var field = document.createElement("input");
        field.type = "number";
        field.value = "" + variable.value;
        field.step = "any";
        var _this = this;
        field.onchange = function () {
            variable.value = parseFloat(field.value);
            variable.constant = true;
            _this.ui.protractr.sketch.solveConstraints(true);
            variable.constant = false;
            _this.ui.history.recordStateChange(main_1.protractr.exportSketch());
            _this.ui.refresh();
        };
        div.appendChild(field);
        this.div.appendChild(div);
        this.fields.push(field);
        this.variables.push(variable);
    };
    return FigureInfoView;
}());
exports.FigureInfoView = FigureInfoView;
var ConstraintInfoView = /** @class */ (function () {
    function ConstraintInfoView() {
    }
    return ConstraintInfoView;
}());
exports.ConstraintInfoView = ConstraintInfoView;
var PossibleNewConstraintsList = /** @class */ (function () {
    function PossibleNewConstraintsList(ui) {
        this.ui = ui;
        this.div = document.createElement("div");
        this.constraintsDiv = document.createElement("div");
        this.title = document.createElement("p");
        this.title.innerText = "";
        this.div.appendChild(this.title);
        this.div.appendChild(this.constraintsDiv);
    }
    PossibleNewConstraintsList.prototype.update = function () {
        while (this.constraintsDiv.lastChild) {
            this.constraintsDiv.removeChild(this.constraintsDiv.lastChild);
        }
        var figs = this.ui.infoPane.selectedFiguresList.list.values;
        if (figs.length == 0) {
            this.title.innerText = "";
            this.title.style.display = "none";
            return;
        }
        this.title.style.display = "block";
        var filters = constraint_filter_1.getSatisfiedConstraintFilters(figs);
        if (filters.length == 0) {
            this.title.innerText = "No possible constraints";
            return;
        }
        this.title.innerText = "Add a constraint:";
        var _loop_1 = function (filter) {
            var b = document.createElement("button");
            b.innerText = filter.name;
            b.onclick = function () {
                main_1.protractr.sketch.addConstraints(filter.createConstraints(constraint_filter_1.sortFigureSelection(figs)));
            };
            this_1.constraintsDiv.appendChild(b);
        };
        var this_1 = this;
        for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
            var filter = filters_1[_i];
            _loop_1(filter);
        }
    };
    return PossibleNewConstraintsList;
}());
exports.PossibleNewConstraintsList = PossibleNewConstraintsList;
var ExistingConstraintList = /** @class */ (function () {
    function ExistingConstraintList(ui) {
        this.ui = ui;
        this.div = document.createElement("div");
        this.list = new TitledInteractiveList(false);
        this.list.setTitle("No constraints in sketch");
        this.list.onhover = this.ui.refresh.bind(this.ui);
        this.list.onclick = this.ui.refresh.bind(this.ui);
        this.div.appendChild(this.list.div);
    }
    ExistingConstraintList.prototype.figureInHovered = function (fig) {
        for (var _i = 0, _a = this.list.hovered; _i < _a.length; _i++) {
            var hover = _a[_i];
            if (hover.containsFigure(fig))
                return true;
        }
        return false;
    };
    ExistingConstraintList.prototype.setConstraints = function (newConstraints) {
        var elements = [];
        for (var _i = 0, newConstraints_1 = newConstraints; _i < newConstraints_1.length; _i++) {
            var constraint = newConstraints_1[_i];
            elements.push([constraint, constraint.name]);
        }
        this.list.setElements(elements);
        var count = this.ui.infoPane.selectedFiguresList.count();
        if (newConstraints.length == 0) {
            if (count == 0) {
                this.list.setTitle("No constraints in sketch");
            }
            else if (count == 1) {
                this.list.setTitle("No constraints on selected figure");
            }
            else {
                this.list.setTitle("No constraints exist between the selected figures");
            }
        }
        else {
            if (count == 0) {
                this.list.setTitle("Sketch Constraints:");
            }
            else if (count == 1) {
                this.list.setTitle("Figure Constraints:");
            }
            else {
                this.list.setTitle("Selection Constraints:");
            }
        }
    };
    ExistingConstraintList.prototype.setUnfilteredConstraints = function (constraints) {
        var filteredConstraints = [];
        for (var _i = 0, constraints_1 = constraints; _i < constraints_1.length; _i++) {
            var constraint = constraints_1[_i];
            var add = true;
            for (var _a = 0, _b = this.ui.infoPane.selectedFiguresList.list.values; _a < _b.length; _a++) {
                var figure = _b[_a];
                if (!constraint.containsFigure(figure)) {
                    add = false;
                    break;
                }
            }
            if (add)
                filteredConstraints.push(constraint);
        }
        this.setConstraints(filteredConstraints);
    };
    ExistingConstraintList.prototype.addConstraint = function (constraint) {
        this.list.addElement(constraint, constraint.name);
    };
    ExistingConstraintList.prototype.removeConstraint = function (constraint) {
        this.list.removeElement(constraint);
    };
    ExistingConstraintList.prototype.contains = function (constraint) {
        return this.list.values.indexOf(constraint) != -1;
    };
    return ExistingConstraintList;
}());
exports.ExistingConstraintList = ExistingConstraintList;
var SelectedFigureList = /** @class */ (function () {
    function SelectedFigureList(ui) {
        this.ui = ui;
        this.div = document.createElement("div");
        this.list = new TitledInteractiveList();
        this.list.onhover = this.ui.refresh.bind(this.ui);
        this.list.ondelete = this.ui.refresh.bind(this.ui);
        this.div.appendChild(this.list.div);
    }
    SelectedFigureList.prototype.clear = function () {
        this.list.clear();
        this.ui.refresh();
    };
    SelectedFigureList.prototype.setFigures = function (figures) {
        var elements = [];
        for (var _i = 0, figures_2 = figures; _i < figures_2.length; _i++) {
            var figure = figures_2[_i];
            elements.push([figure, figures_1.getFullName(figure)]);
        }
        this.list.setElements(elements);
        this.ui.refresh();
    };
    SelectedFigureList.prototype.addFigure = function (figure) {
        this.list.addElement(figure, figures_1.getFullName(figure));
        this.ui.refresh();
    };
    SelectedFigureList.prototype.updateTitle = function () {
        var count = this.count();
        if (count == 0) {
            this.list.setTitle("");
        }
        else if (count == 1) {
            this.list.setTitle("Selected Figure:");
        }
        else {
            this.list.setTitle("Selected Figures:");
        }
    };
    SelectedFigureList.prototype.removeFigure = function (figure) {
        this.list.removeElement(figure);
        this.ui.refresh();
    };
    SelectedFigureList.prototype.figureSelected = function (figure) {
        return this.list.values.indexOf(figure) != -1;
    };
    SelectedFigureList.prototype.figureHovered = function (fig) {
        return this.list.hovered.indexOf(fig) != -1;
    };
    SelectedFigureList.prototype.count = function () {
        return this.list.values.length;
    };
    return SelectedFigureList;
}());
exports.SelectedFigureList = SelectedFigureList;
var InteractiveList = /** @class */ (function () {
    function InteractiveList(deleteable) {
        if (deleteable === void 0) { deleteable = true; }
        this.deleteable = deleteable;
        this.div = document.createElement("div");
        this.list = document.createElement("div");
        this.list.classList.add("interactive-list");
        this.div.appendChild(this.list);
        this.clear();
    }
    InteractiveList.prototype.clear = function (noEvent) {
        if (noEvent === void 0) { noEvent = false; }
        this.hovered = [];
        this.values = [];
        this.elements = [];
        while (this.list.lastChild) {
            this.list.removeChild(this.list.lastChild);
        }
        if (this.onhover && !noEvent)
            this.onhover([]);
    };
    InteractiveList.prototype.setElements = function (elements) {
        var toRemove = [];
        for (var _i = 0, _a = this.values; _i < _a.length; _i++) {
            var value = _a[_i];
            var remove = true;
            for (var _b = 0, elements_1 = elements; _b < elements_1.length; _b++) {
                var element = elements_1[_b];
                if (element[0] == value) {
                    remove = false;
                    break;
                }
                ;
            }
            if (remove)
                toRemove.push(value);
        }
        for (var _c = 0, toRemove_1 = toRemove; _c < toRemove_1.length; _c++) {
            var remove = toRemove_1[_c];
            this.removeElement(remove);
        }
        for (var _d = 0, elements_2 = elements; _d < elements_2.length; _d++) {
            var element = elements_2[_d];
            if (this.values.indexOf(element[0]) == -1)
                this.addElement(element[0], element[1]);
        }
    };
    InteractiveList.prototype.addElement = function (value, name) {
        var element = new ListElement(this, value, name, this.deleteable);
        this.list.appendChild(element.div);
        this.elements.push(element);
        this.values.push(value);
    };
    InteractiveList.prototype.removeElement = function (value) {
        var index = this.values.indexOf(value);
        if (index > -1) {
            this.unhover(value);
            this.values.splice(index, 1);
            this.list.removeChild(this.elements[index].div);
            this.elements.splice(index, 1);
        }
    };
    InteractiveList.prototype.hover = function (item) {
        this.hovered.push(item);
        if (this.onhover)
            this.onhover(this.hovered);
    };
    InteractiveList.prototype.unhover = function (item) {
        var index = this.hovered.indexOf(item);
        if (index > -1) {
            this.hovered.splice(index, 1);
            if (this.onhover)
                this.onhover(this.hovered);
        }
    };
    InteractiveList.prototype.clicked = function (item) {
    };
    InteractiveList.prototype.delete = function (item) {
        this.removeElement(item);
        if (this.ondelete)
            this.ondelete(item);
    };
    return InteractiveList;
}());
exports.InteractiveList = InteractiveList;
var TitledInteractiveList = /** @class */ (function (_super) {
    __extends(TitledInteractiveList, _super);
    function TitledInteractiveList(deleteable) {
        if (deleteable === void 0) { deleteable = true; }
        var _this_1 = _super.call(this, deleteable) || this;
        _this_1.p = document.createElement("p");
        _this_1.div.prepend(_this_1.p);
        _this_1.setTitle("");
        return _this_1;
    }
    TitledInteractiveList.prototype.setTitle = function (value) {
        if (value == "") {
            this.p.style.display = "none";
            this.p.innerText = "";
        }
        else {
            this.p.style.display = "block";
            this.p.innerText = value;
        }
    };
    return TitledInteractiveList;
}(InteractiveList));
exports.TitledInteractiveList = TitledInteractiveList;
var ListElement = /** @class */ (function () {
    function ListElement(parent, value, name, deleteable) {
        if (deleteable === void 0) { deleteable = true; }
        this.value = value;
        this.parent = parent;
        this.div = document.createElement("div");
        this.div.classList.add("interactive-list-element");
        this.div.addEventListener("mouseenter", this.onmouseenter.bind(this));
        this.div.addEventListener("mouseleave", this.onmouseleave.bind(this));
        this.div.addEventListener("mousedown", this.onmousedown.bind(this));
        this.spanName = document.createElement("span");
        this.spanName.innerText = name;
        this.spanName.classList.add("element-name");
        this.div.appendChild(this.spanName);
        if (deleteable) {
            this.deleteButton = document.createElement("span");
            this.deleteButton.classList.add("element-delete");
            this.deleteButton.addEventListener("mousedown", this.delete.bind(this));
            this.div.appendChild(this.deleteButton);
        }
    }
    ListElement.prototype.onmouseenter = function (event) {
        this.parent.hover(this.value);
    };
    ListElement.prototype.onmouseleave = function (event) {
        this.parent.unhover(this.value);
    };
    ListElement.prototype.onmousedown = function (event) {
        if (event.which == 1) {
            this.parent.clicked(this.value);
        }
    };
    ListElement.prototype.delete = function (event) {
        if (event.which == 1) {
            this.parent.delete(this.value);
        }
    };
    return ListElement;
}());
exports.ListElement = ListElement;

},{"../gcs/constraint_filter":2,"../gcs/figures":3,"../main":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var figures_1 = require("../gcs/figures");
var SketchView = /** @class */ (function () {
    function SketchView(ui, canvas) {
        this.lastPanPoint = null;
        this.ui = ui;
        this.canvas = canvas;
        this.ctxScale = 1;
        this.ctxOrigin = new figures_1.Point(0, 0);
        this.ctx = this.canvas.getContext("2d");
        var mouseEventHandler = this.handleMouseEvent.bind(this);
        var events = ["mousemove", "mousedown", "mouseup", "wheel"];
        for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
            var event_1 = events_1[_i];
            this.canvas.addEventListener(event_1, mouseEventHandler);
        }
    }
    SketchView.prototype.handleZoomEvent = function (deltaY, point) {
        var originalScale = this.ctxScale;
        var s = this.ctxScale - (deltaY * 0.005 * this.ctxScale);
        this.ctxScale = Math.min(10, Math.max(0.1, s));
        var scaleChange = originalScale - this.ctxScale;
        this.ctxOrigin.x += (point.x * scaleChange);
        this.ctxOrigin.y += (point.y * scaleChange);
    };
    SketchView.prototype.handlePanEvent = function (type, offset) {
        switch (type) {
            case "mousedown":
                this.lastPanPoint = offset.copy();
                break;
            case "mousemove":
                this.ctxOrigin.x += offset.x - this.lastPanPoint.x;
                this.ctxOrigin.y += offset.y - this.lastPanPoint.y;
                this.lastPanPoint = offset.copy();
                break;
            case "mouseup":
                this.lastPanPoint = null;
                break;
        }
    };
    SketchView.prototype.handleToolEvent = function (type, point, snapFigure) {
        switch (type) {
            case "mousedown":
                this.ui.toolbar.activeTool.down(point, snapFigure);
                break;
            case "mousemove":
                this.ui.toolbar.activeTool.move(point, snapFigure);
                break;
            case "mouseup":
                this.ui.toolbar.activeTool.up(point, snapFigure);
                break;
        }
    };
    SketchView.prototype.handleMouseEvent = function (event) {
        event.preventDefault();
        var offset = new figures_1.Point(event.offsetX, event.offsetY);
        var scaled = new figures_1.Point(offset.x / this.ctxScale, offset.y / this.ctxScale);
        var point = new figures_1.Point(scaled.x - this.ctxOrigin.x / this.ctxScale, scaled.y - this.ctxOrigin.y / this.ctxScale);
        this.updateHover(point);
        var snapPoint = this.snapPoint(point);
        if (event.type == "wheel") {
            var delta = event.deltaY;
            //convert delta into pixels...
            if (event.deltaMode == WheelEvent.DOM_DELTA_LINE) {
                delta *= 16; // just a guess--depends on inaccessible user settings
            }
            else if (event.deltaMode == WheelEvent.DOM_DELTA_PAGE) {
                delta *= 800; // also just a guess--no good way to predict these...
            }
            this.handleZoomEvent(delta, point);
        }
        if (event.which == 2 || (event.type == "mousemove" && this.lastPanPoint != null)) {
            this.handlePanEvent(event.type, offset);
        }
        if (event.which == 1 || event.type == "mousemove") {
            this.handleToolEvent(event.type, snapPoint, this.hoveredFigure);
        }
        this.draw();
    };
    SketchView.prototype.updateHover = function (point) {
        var closest;
        closest = this.ui.protractr.sketch.getClosestFigure(point, [], 10, this.ctxScale);
        this.hoveredFigure = closest;
        if (this.hoveredFigure != null) {
            this.setCursor("move");
        }
        else {
            this.setCursor("default");
        }
    };
    SketchView.prototype.snapPoint = function (point) {
        if (!this.ui.toolbar.activeTool.doSnap)
            return point;
        if (!this.hoveredFigure)
            return point;
        return this.hoveredFigure.getClosestPoint(point);
    };
    SketchView.prototype.setCursor = function (cursor) {
        this.canvas.style.cursor = cursor;
    };
    SketchView.prototype.drawFigure = function (fig) {
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 2 / this.ctxScale;
        var pointSize = 3;
        if (this.ui.infoPane.selectedFiguresList.figureSelected(fig)) {
            this.ctx.strokeStyle = "#5e9cff";
        }
        if (this.hoveredFigure == fig || this.ui.infoPane.selectedFiguresList.figureHovered(fig)) {
            pointSize = 7;
            this.ctx.lineWidth = 5 / this.ctxScale;
        }
        if (this.ui.infoPane.existingConstraintsList.figureInHovered(fig)) {
            this.ctx.strokeStyle = "purple";
            pointSize = 7;
            this.ctx.lineWidth = 5 / this.ctxScale;
        }
        switch (fig.type) {
            case "line":
                var line = fig;
                this.drawLine(line.p1, line.p2);
                if (this.hoveredFigure == fig) {
                    var midpoint = figures_1.Point.averagePoint(line.p1, line.p2);
                    this.drawPoint(midpoint, pointSize, this.ctx.strokeStyle);
                    this.drawPoint(line.p1, pointSize, this.ctx.strokeStyle);
                    this.drawPoint(line.p2, pointSize, this.ctx.strokeStyle);
                }
                break;
            case "point":
                var point = fig;
                this.drawPoint(point.p, pointSize, this.ctx.strokeStyle);
                break;
            case "circle":
                var circle = fig;
                this.drawCircle(circle.c, circle.r.value);
                break;
        }
    };
    SketchView.prototype.draw = function () {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.translate(this.ctxOrigin.x, this.ctxOrigin.y);
        this.ctx.scale(this.ctxScale, this.ctxScale);
        for (var _i = 0, _a = this.ui.protractr.sketch.rootFigures; _i < _a.length; _i++) {
            var fig = _a[_i];
            for (var _b = 0, _c = fig.getRelatedFigures(); _b < _c.length; _b++) {
                var child = _c[_b];
                this.drawFigure(child);
            }
        }
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 2 / this.ctxScale;
        this.ui.toolbar.activeTool.draw(this);
        this.ui.infoPane.selectedFigureView.refresh();
    };
    SketchView.prototype.drawPoint = function (point, size, color) {
        if (size === void 0) { size = 3; }
        if (color === void 0) { color = "black"; }
        if (!point)
            return;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
        this.ctx.arc(point.x, point.y, size / this.ctxScale, 0, Math.PI * 2);
        this.ctx.fill();
    };
    SketchView.prototype.drawLine = function (p1, p2) {
        if (!p1 || !p2)
            return;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    };
    SketchView.prototype.drawCircle = function (center, radius) {
        if (!center)
            return;
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    };
    SketchView.prototype.pushState = function () {
        var s = this.ui.protractr.exportSketch();
        this.ui.history.recordStateChange(s);
    };
    return SketchView;
}());
exports.SketchView = SketchView;

},{"../gcs/figures":3}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var tools_1 = require("./tools");
var Toolbar = /** @class */ (function () {
    function Toolbar(toolbarElement, sketchView) {
        this.sketchView = sketchView;
        this.toolbarElement = toolbarElement;
        this.toolElements = [];
        this.initializeTools();
    }
    Toolbar.prototype.initializeTools = function () {
        var filters = new ToolGroup();
        this.activatableTools = new ActivatableToolGroup();
        this.activatableTools.addTool(new tools_1.SelectTool());
        this.activatableTools.addTool(new tools_1.PointTool());
        this.activatableTools.addTool(new tools_1.LineTool());
        this.activatableTools.addTool(new tools_1.RectTool());
        this.activatableTools.addTool(new tools_1.CircleTool());
        this.addToolGroup(this.activatableTools);
        var editHistory = new ToolGroup();
        editHistory.addTool(new tools_1.UndoTool());
        editHistory.addTool(new tools_1.RedoTool());
        this.addToolGroup(editHistory);
        var importExport = new ToolGroup();
        importExport.addTool(new tools_1.ImportTool());
        importExport.addTool(new tools_1.ExportTool());
        this.addToolGroup(importExport);
    };
    Toolbar.prototype.addToolGroup = function (group) {
        this.toolbarElement.appendChild(group.div);
    };
    Object.defineProperty(Toolbar.prototype, "activeTool", {
        get: function () {
            return this.activatableTools.activeTool;
        },
        enumerable: true,
        configurable: true
    });
    return Toolbar;
}());
exports.Toolbar = Toolbar;
var ToolGroup = /** @class */ (function () {
    function ToolGroup() {
        this.div = document.createElement("div");
        this.div.classList.add("tool-group");
        this.toolElements = [];
    }
    ToolGroup.prototype.addTool = function (tool) {
        var e = new ToolElement(this, tool);
        this.toolElements.push(e);
        this.div.appendChild(e.li);
    };
    return ToolGroup;
}());
var ActivatableToolGroup = /** @class */ (function (_super) {
    __extends(ActivatableToolGroup, _super);
    function ActivatableToolGroup() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ActivatableToolGroup.prototype.addTool = function (tool) {
        var e = new ActivatableToolElement(this, tool);
        this.toolElements.push(e);
        this.div.appendChild(e.li);
        this.select(this.toolElements[0]);
    };
    ActivatableToolGroup.prototype.select = function (toolElement) {
        for (var _i = 0, _a = this.toolElements; _i < _a.length; _i++) {
            var element = _a[_i];
            if (element == toolElement) {
                element.activate();
                this.activeTool = element.tool;
            }
            else {
                element.deactivate();
            }
        }
    };
    return ActivatableToolGroup;
}(ToolGroup));
var ToolElement = /** @class */ (function () {
    function ToolElement(parent, tool) {
        this.parent = parent;
        this.tool = tool;
        this.li = document.createElement("li");
        this.li.title = tool.tooltip;
        this.li.classList.add("tool");
        this.li.style.backgroundImage = "url('../image/" + tool.image + "')";
        this.li.addEventListener("mousedown", this.press.bind(this));
        this.li.addEventListener("mouseleave", this.unpress.bind(this));
        this.li.addEventListener("mouseup", this.unpress.bind(this));
        this.li.addEventListener("click", this.click.bind(this));
    }
    ToolElement.prototype.press = function () {
        this.li.classList.add("pressed");
    };
    ToolElement.prototype.unpress = function () {
        this.li.classList.remove("pressed");
    };
    ToolElement.prototype.click = function () {
        this.tool.used();
    };
    return ToolElement;
}());
var ActivatableToolElement = /** @class */ (function (_super) {
    __extends(ActivatableToolElement, _super);
    function ActivatableToolElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ActivatableToolElement.prototype.click = function () {
        this.parent.select(this);
    };
    ActivatableToolElement.prototype.activate = function () {
        this.li.classList.add("active");
    };
    ActivatableToolElement.prototype.deactivate = function () {
        this.tool.reset();
        this.li.classList.remove("active");
    };
    return ActivatableToolElement;
}(ToolElement));

},{"./tools":11}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var figures_1 = require("../gcs/figures");
var main_1 = require("../main");
var constraint_1 = require("../gcs/constraint");
var Tool = /** @class */ (function () {
    function Tool(name, tooltip, image) {
        this.name = name;
        this.tooltip = tooltip;
        this.image = image;
    }
    return Tool;
}());
exports.Tool = Tool;
var UndoTool = /** @class */ (function (_super) {
    __extends(UndoTool, _super);
    function UndoTool() {
        return _super.call(this, "Undo", "Undo an action", "undo.png") || this;
    }
    UndoTool.prototype.used = function () {
        main_1.protractr.loadSketch(main_1.protractr.ui.history.undo());
    };
    return UndoTool;
}(Tool));
exports.UndoTool = UndoTool;
var RedoTool = /** @class */ (function (_super) {
    __extends(RedoTool, _super);
    function RedoTool() {
        return _super.call(this, "Redo", "Redo an action", "redo.png") || this;
    }
    RedoTool.prototype.used = function () {
        main_1.protractr.loadSketch(main_1.protractr.ui.history.redo());
    };
    return RedoTool;
}(Tool));
exports.RedoTool = RedoTool;
var ExportTool = /** @class */ (function (_super) {
    __extends(ExportTool, _super);
    function ExportTool() {
        return _super.call(this, "Export", "Export your Sketch", "export.png") || this;
    }
    ExportTool.prototype.used = function () {
        main_1.saveAs(main_1.protractr.exportSketch(), "sketch.json");
    };
    return ExportTool;
}(Tool));
exports.ExportTool = ExportTool;
var ImportTool = /** @class */ (function (_super) {
    __extends(ImportTool, _super);
    function ImportTool() {
        return _super.call(this, "Import", "Import a Sketch from a file or web", "import.png") || this;
    }
    ImportTool.prototype.used = function () {
        var input = prompt("JSON or URL to import");
        if (input[0] == "{") {
            main_1.protractr.loadSketch(input);
        }
        else {
            main_1.protractr.loadFromURL(input);
        }
    };
    return ImportTool;
}(Tool));
exports.ImportTool = ImportTool;
var ActivatableTool = /** @class */ (function (_super) {
    __extends(ActivatableTool, _super);
    function ActivatableTool() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.doSnap = true;
        return _this;
    }
    ActivatableTool.prototype.used = function () { };
    return ActivatableTool;
}(Tool));
exports.ActivatableTool = ActivatableTool;
var SelectTool = /** @class */ (function (_super) {
    __extends(SelectTool, _super);
    function SelectTool() {
        var _this = _super.call(this, "Select", "Select and edit figures", "drag.png") || this;
        _this.doSnap = false;
        return _this;
    }
    SelectTool.prototype.down = function (point, snapFigure) {
        this.pressed = true;
        this.downFigure = snapFigure;
        if (!this.downFigure) {
            main_1.protractr.ui.infoPane.selectedFiguresList.clear();
            this.selectionStart = point;
            this.selectionEnd = point;
        }
        else {
            this.downFigure.setLocked(true);
            this.lastDrag = point.copy();
        }
    };
    SelectTool.prototype.draw = function (sketchView) {
        if (!this.selectionStart || !this.selectionEnd)
            return;
        sketchView.ctx.fillStyle = "green";
        sketchView.ctx.globalAlpha = 0.5;
        var w = this.selectionEnd.x - this.selectionStart.x;
        var h = this.selectionEnd.y - this.selectionStart.y;
        sketchView.ctx.fillRect(this.selectionStart.x, this.selectionStart.y, w, h);
        sketchView.ctx.globalAlpha = 1;
        sketchView.ctx.strokeStyle = "green";
        sketchView.ctx.strokeRect(this.selectionStart.x, this.selectionStart.y, w, h);
    };
    SelectTool.prototype.move = function (point, snapFigure) {
        if (this.pressed)
            this.dragging = true;
        if (this.downFigure && this.dragging) {
            this.downFigure.setLocked(false);
            this.downFigure.translate(this.lastDrag, point.copy());
            this.downFigure.setLocked(true);
            main_1.protractr.sketch.solveConstraints();
            this.lastDrag = point.copy();
        }
        else {
            this.selectionEnd = point;
            if (this.selectionStart) {
                var selection = [];
                for (var _i = 0, _a = main_1.protractr.sketch.rootFigures; _i < _a.length; _i++) {
                    var figure = _a[_i];
                    for (var _b = 0, _c = figure.getRelatedFigures(); _b < _c.length; _b++) {
                        var relatedFigure = _c[_b];
                        if (this.figureInSelection(relatedFigure)) {
                            selection.push(relatedFigure);
                        }
                    }
                }
                main_1.protractr.ui.infoPane.selectedFiguresList.setFigures(selection);
            }
        }
    };
    SelectTool.prototype.up = function (point, snapFigure) {
        if (this.downFigure) {
            main_1.protractr.sketch.solveConstraints();
            this.downFigure.setLocked(false);
            if (!main_1.protractr.sketch.solveConstraints(true)) {
                alert("That state couldn't be solved...");
            }
            main_1.protractr.ui.sketchView.pushState();
        }
        if (!this.dragging && this.downFigure) {
            var list = main_1.protractr.ui.infoPane.selectedFiguresList;
            if (list.figureSelected(this.downFigure)) {
                list.removeFigure(this.downFigure);
            }
            else {
                list.addFigure(this.downFigure);
            }
        }
        this.reset();
    };
    SelectTool.prototype.reset = function () {
        this.selectionEnd = null;
        this.selectionStart = null;
        this.dragging = false;
        this.pressed = false;
    };
    SelectTool.prototype.figureInSelection = function (figure) {
        if (figure.type == "point") {
            var p = figure.p;
            return ((this.selectionStart.x > p.x && this.selectionEnd.x < p.x) ||
                (this.selectionStart.x < p.x && this.selectionEnd.x > p.x)) &&
                ((this.selectionStart.y > p.y && this.selectionEnd.y < p.y) ||
                    (this.selectionStart.y < p.y && this.selectionEnd.y > p.y));
        }
        var p1 = this.selectionStart;
        var p2 = new figures_1.Point(this.selectionStart.x, this.selectionEnd.y);
        var p3 = this.selectionEnd;
        var p4 = new figures_1.Point(this.selectionEnd.x, this.selectionStart.y);
        if (figure.type == "line") {
            var line = figure;
            if (this.figureInSelection(line.childFigures[0]) || this.figureInSelection(line.childFigures[1])) {
                return true;
            }
            //test if line intersects any of the edges
            if (figures_1.Point.doIntersect(p1, p2, line.p1, line.p2))
                return true;
            if (figures_1.Point.doIntersect(p2, p3, line.p1, line.p2))
                return true;
            if (figures_1.Point.doIntersect(p3, p4, line.p1, line.p2))
                return true;
            if (figures_1.Point.doIntersect(p4, p1, line.p1, line.p2))
                return true;
            return false;
        }
        else if (figure.type == "circle") {
            var circle = figure;
            //test if circle intersects any of the edges... somehow...
            return false;
        }
        return false;
    };
    return SelectTool;
}(ActivatableTool));
exports.SelectTool = SelectTool;
var PointTool = /** @class */ (function (_super) {
    __extends(PointTool, _super);
    function PointTool() {
        return _super.call(this, "Point", "Create a point", "point.png") || this;
    }
    PointTool.prototype.down = function (point, snapFigure) {
    };
    PointTool.prototype.up = function (point, snapFigure) {
        var pointFigure = new figures_1.PointFigure(point);
        constrainPointBySnap(pointFigure.p, snapFigure);
        main_1.protractr.sketch.rootFigures.push(pointFigure);
        main_1.protractr.ui.sketchView.pushState();
    };
    PointTool.prototype.move = function (point, snapFigure) {
        this.point = point;
    };
    PointTool.prototype.draw = function (sketchView) {
        sketchView.drawPoint(this.point);
    };
    PointTool.prototype.reset = function () {
        this.point = null;
    };
    return PointTool;
}(ActivatableTool));
exports.PointTool = PointTool;
var LineTool = /** @class */ (function (_super) {
    __extends(LineTool, _super);
    function LineTool() {
        return _super.call(this, "Line", "Create a line", "line.png") || this;
    }
    LineTool.prototype.up = function (point, snapFigure) {
        if (!this.point1Set) {
            this.point1 = point;
            this.point1SnapFigure = snapFigure;
            this.point1Set = true;
            this.point2 = point;
        }
        else {
            var lineFigure = new figures_1.LineFigure(this.point1, this.point2);
            constrainPointBySnap(lineFigure.p1, this.point1SnapFigure);
            constrainPointBySnap(lineFigure.p2, snapFigure);
            main_1.protractr.sketch.rootFigures.push(lineFigure);
            main_1.protractr.ui.sketchView.pushState();
            this.reset();
        }
    };
    LineTool.prototype.move = function (point, snapFigure) {
        if (!this.point1Set) {
            this.point1 = point;
        }
        else {
            this.point2 = point;
        }
    };
    LineTool.prototype.down = function (point, snapFigure) {
    };
    LineTool.prototype.draw = function (sketchView) {
        sketchView.drawPoint(this.point1);
        if (this.point1Set) {
            sketchView.drawPoint(this.point2);
            sketchView.drawLine(this.point1, this.point2);
        }
    };
    LineTool.prototype.reset = function () {
        this.point1Set = false;
        this.point1SnapFigure = null;
        this.point1 = null;
        this.point2 = null;
    };
    return LineTool;
}(ActivatableTool));
exports.LineTool = LineTool;
var CircleTool = /** @class */ (function (_super) {
    __extends(CircleTool, _super);
    function CircleTool() {
        return _super.call(this, "Circle", "Create a circle", "circle.png") || this;
    }
    CircleTool.prototype.up = function (point, snapFigure) {
        if (!this.centerSet) {
            this.centerSet = true;
            this.center = point;
            this.centerSnapFigure = snapFigure;
        }
        else {
            this.radius = this.center.distTo(point);
            var circleFigure = new figures_1.CircleFigure(this.center, this.radius);
            constrainPointBySnap(circleFigure.c, this.centerSnapFigure);
            //constrain point on circle
            if (snapFigure && snapFigure.type == "point") {
                var r = circleFigure.r;
                var c = circleFigure.c.variablePoint;
                var p = snapFigure.p.variablePoint;
                main_1.protractr.sketch.addConstraints([new constraint_1.ArcPointCoincidentConstraint(c, r, [p])]);
            }
            main_1.protractr.sketch.rootFigures.push(circleFigure);
            main_1.protractr.ui.sketchView.pushState();
            this.reset();
        }
    };
    CircleTool.prototype.move = function (point, snapFigure) {
        if (!this.centerSet) {
            this.center = point;
        }
        else {
            this.radius = this.center.distTo(point);
        }
    };
    CircleTool.prototype.down = function (point, snapFigure) {
    };
    CircleTool.prototype.draw = function (sketchView) {
        sketchView.drawPoint(this.center);
        if (this.centerSet) {
            sketchView.drawCircle(this.center, this.radius);
        }
    };
    CircleTool.prototype.reset = function () {
        this.radius = 0;
        this.center = null;
        this.centerSet = false;
        this.centerSnapFigure = null;
    };
    return CircleTool;
}(ActivatableTool));
exports.CircleTool = CircleTool;
var RectTool = /** @class */ (function (_super) {
    __extends(RectTool, _super);
    function RectTool() {
        return _super.call(this, "Rectangle", "Create a rectangle", "rect.png") || this;
    }
    RectTool.prototype.up = function (point, snapFigure) {
        if (!this.point1Set) {
            this.point1 = point;
            this.point1SnapFigure = snapFigure;
            this.point1Set = true;
            this.point2 = point;
        }
        else {
            var p1 = this.point1;
            var p2 = new figures_1.Point(this.point2.x, this.point1.y);
            var p3 = this.point2;
            var p4 = new figures_1.Point(this.point1.x, this.point2.y);
            var h1 = new figures_1.LineFigure(p1.copy(), p2.copy());
            var v1 = new figures_1.LineFigure(p2.copy(), p3.copy());
            var h2 = new figures_1.LineFigure(p3.copy(), p4.copy());
            var v2 = new figures_1.LineFigure(p4.copy(), p1.copy());
            main_1.protractr.sketch.rootFigures.push(h1, h2, v1, v2);
            var hc1 = new constraint_1.EqualConstraint([h1.p1.variablePoint.y, h1.p2.variablePoint.y, v1.p1.variablePoint.y, v2.p2.variablePoint.y], "horizontal");
            var hc2 = new constraint_1.EqualConstraint([h2.p1.variablePoint.y, h2.p2.variablePoint.y, v2.p1.variablePoint.y, v1.p2.variablePoint.y], "horizontal");
            var vc1 = new constraint_1.EqualConstraint([v1.p1.variablePoint.x, v1.p2.variablePoint.x, h1.p2.variablePoint.x, h2.p1.variablePoint.x], "vertical");
            var vc2 = new constraint_1.EqualConstraint([v2.p1.variablePoint.x, v2.p2.variablePoint.x, h1.p1.variablePoint.x, h2.p2.variablePoint.x], "vertical");
            main_1.protractr.sketch.addConstraints([hc1, hc2, vc1, vc2]);
            constrainPointBySnap(h1.p1, this.point1SnapFigure);
            constrainPointBySnap(v2.p2, this.point1SnapFigure);
            constrainPointBySnap(v1.p2, snapFigure);
            constrainPointBySnap(h2.p1, snapFigure);
            main_1.protractr.ui.sketchView.pushState();
            this.reset();
        }
    };
    RectTool.prototype.move = function (point, snapFigure) {
        if (!this.point1Set) {
            this.point1 = point;
        }
        else {
            this.point2 = point;
        }
    };
    RectTool.prototype.down = function (point, snapFigure) {
    };
    RectTool.prototype.draw = function (sketchView) {
        sketchView.drawPoint(this.point1);
        if (this.point1Set) {
            var p3 = new figures_1.Point(this.point2.x, this.point1.y);
            var p4 = new figures_1.Point(this.point1.x, this.point2.y);
            sketchView.drawPoint(this.point2);
            sketchView.drawPoint(p3);
            sketchView.drawPoint(p4);
            sketchView.drawLine(this.point1, p3);
            sketchView.drawLine(p3, this.point2);
            sketchView.drawLine(this.point2, p4);
            sketchView.drawLine(p4, this.point1);
        }
    };
    RectTool.prototype.reset = function () {
        this.point1Set = false;
        this.point1SnapFigure = null;
        this.point1 = null;
        this.point2 = null;
    };
    return RectTool;
}(ActivatableTool));
exports.RectTool = RectTool;
function constrainPointBySnap(point, snapFigure) {
    if (!snapFigure)
        return;
    var p = point.variablePoint;
    switch (snapFigure.type) {
        case "point":
            var v1 = snapFigure.p.variablePoint;
            var ex = new constraint_1.EqualConstraint([v1.x, p.x], "vertical");
            var ey = new constraint_1.EqualConstraint([v1.y, p.y], "horizontal");
            main_1.protractr.sketch.addConstraints([ex, ey]);
            break;
        case "circle":
            var r = snapFigure.r;
            var c = snapFigure.c.variablePoint;
            main_1.protractr.sketch.addConstraints([new constraint_1.ArcPointCoincidentConstraint(c, r, [p])]);
            break;
        case "line":
            var p1 = snapFigure.p1;
            var p2 = snapFigure.p2;
            var midpoint = figures_1.Point.averagePoint(p1, p2);
            if (midpoint.distTo(point) < 5 / main_1.protractr.ui.sketchView.ctxScale) {
                main_1.protractr.sketch.addConstraints([new constraint_1.MidpointConstraint(p1.variablePoint, p2.variablePoint, p)]);
            }
            else {
                main_1.protractr.sketch.addConstraints([new constraint_1.ColinearPointsConstraint([p1.variablePoint, p2.variablePoint, p])]);
            }
            break;
    }
}

},{"../gcs/constraint":1,"../gcs/figures":3,"../main":5}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var toolbar_1 = require("./toolbar");
var sidepane_1 = require("./sidepane");
var sketchview_1 = require("./sketchview");
var history_1 = require("./history");
var UI = /** @class */ (function () {
    function UI(protractr, canvas, sidePane, toolbar) {
        this.protractr = protractr;
        this.history = new history_1.History(protractr.exportSketch());
        this.sketchView = new sketchview_1.SketchView(this, canvas);
        this.infoPane = new sidepane_1.Sidepane(this, sidePane);
        this.toolbar = new toolbar_1.Toolbar(toolbar, this.sketchView);
    }
    UI.prototype.reload = function () {
        this.sketchView.draw();
        this.infoPane.existingConstraintsList.setUnfilteredConstraints(this.protractr.sketch.constraints);
        this.infoPane.selectedFiguresList.clear();
        this.infoPane.possibleNewConstraintsList.update();
        this.infoPane.selectedFigureView.setFigure(null);
    };
    UI.prototype.refresh = function () {
        this.sketchView.draw();
        this.infoPane.existingConstraintsList.setUnfilteredConstraints(this.protractr.sketch.constraints);
        this.infoPane.possibleNewConstraintsList.update();
        this.infoPane.selectedFiguresList.updateTitle();
        if (this.infoPane.selectedFiguresList.list.values.length == 1) {
            var fig = this.infoPane.selectedFiguresList.list.values[0];
            this.infoPane.selectedFigureView.setFigure(fig);
        }
        else {
            this.infoPane.selectedFigureView.setFigure(null);
        }
    };
    return UI;
}());
exports.UI = UI;

},{"./history":7,"./sidepane":8,"./sketchview":9,"./toolbar":10}]},{},[5]);
