 /* Undirected Edge
 
 Copyright (c) 2013 Daniel Phang
 
 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

// Undirected edge between two vertices v1 and v2
function Edge(v1, v2)
{
    this.v1 = v1;
    this.v2 = v2;
    this.text = '';
}

// Draw the edge: only a line since it's undirected
Edge.prototype.draw = function(c) 
{
    // Nearest points on v1, v2 circles
    var point1 = this.v1.nearestCirclePoint(this.v2.x, this.v2.y);
    var point2 = this.v2.nearestCirclePoint(this.v1.x, this.v1.y);
    
    c.beginPath();
    c.moveTo(point1.x, point1.y);
    c.lineTo(point2.x, point2.y);
    c.stroke();
    
    var midX = (point2.x + point1.x) / 2;
    var midY = (point2.y + point1.y) / 2;   
    var angle = Math.atan2(point2.x - point1.x, point2.y - point1.y);
    
    // Draw text
    drawText(c, this.text, midX, midY, angle, false);
};

// Check if edge contains a point (x, y)
Edge.prototype.contains = function(x, y)
{
    var dx = this.v2.x - this.v1.x;
    var dy = this.v2.y - this.v1.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    var percent = (dx * (x - this.v1.x) + dy * (y - this.v1.y)) / (length * length);
    var dist = (dx * (y - this.v1.y) - dy * (x - this.v1.x)) / length;
    return (percent > 0 && percent < 1 && Math.abs(dist) < EDGE_MARGIN);
};

// Temporary edge from a source vertex to a point
function TempEdge(vertex, dest)
{
    this.vertex = vertex;
    this.dest = dest;
}

// Drawing function for the edge
TempEdge.prototype.draw = function(c)
{
    var point = this.vertex.nearestCirclePoint(this.dest.x, this.dest.y);

    c.beginPath();
    c.moveTo(point.x, point.y);
    c.lineTo(this.dest.x, this.dest.y);
    c.stroke(); 
}


// Directed edge
function DirEdge(v1, v2)
{
    this.v1 = v1;
    this.v2 = v2;
    this.text = '';
}

// Draw a directed edge, with an arrow
DirEdge.prototype.draw = function(c) 
{
    c.beginPath();
    
    // Nearest points on vertex circles
    var point1 = this.v1.nearestCirclePoint(this.v2.x, this.v2.y);
    var point2 = this.v2.nearestCirclePoint(this.v1.x, this.v1.y);
    c.moveTo(point1.x, point1.y);
    c.lineTo(point2.x, point2.y);
    c.stroke();
    
    // Draw the arrow
    drawArrow(c, point2.x, point2.y, Math.atan2(point2.y - point1.y, point2.x - point1.x));
    
    var midX = (point2.x + point1.x) / 2;
    var midY = (point2.y + point1.y) / 2;   
    var angle = Math.atan2(point2.x - point1.x, point2.y - point1.y);
    
    // Draw text
    drawText(c, this.text, midX, midY, angle, false);
};

// Check whether the edge contains a point (x, y) (for selecting the edge)
DirEdge.prototype.contains = function(x, y)
{
    var dx = this.v2.x - this.v1.x;
    var dy = this.v2.y - this.v1.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    var percent = (dx * (x - this.v1.x) + dy * (y - this.v1.y)) / (length * length);
    var dist = (dx * (y - this.v1.y) - dy * (x - this.v1.x)) / length;
    return (percent > 0 && percent < 1 && Math.abs(dist) < EDGE_MARGIN);
};

// Temporary directed edge from a source vertex to a point
function TempDirEdge(vertex, dest)
{
    this.vertex = vertex;
    this.dest = dest;
}

// Drawing function
TempDirEdge.prototype.draw = function(c)
{
    var point = this.vertex.nearestCirclePoint(this.dest.x, this.dest.y);

    c.beginPath();
    c.moveTo(point.x, point.y);
    c.lineTo(this.dest.x, this.dest.y);
    c.stroke();
    
    drawArrow(c, this.dest.x, this.dest.y, Math.atan2(this.dest.y - point.y, this.dest.x - point.x));
}