 /* Vertex object
 
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

// Vertex object to be created at a position (x, y)
function Vertex(x, y)
{
    this.x = x;
    this.y = y;
    this.radius = VERTEX_RADIUS;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.text = '';
}

Vertex.prototype.draw = function(c) 
{
    // Change vertex radius if text width is too large or small
    var textWithoutSubscripts = makeSubscripts(this.text);
    var width = c.measureText(textWithoutSubscripts).width;
    if (width < 2 * VERTEX_RADIUS - VERTEX_RADIUS / 3)
    {
        this.radius = VERTEX_RADIUS;
    }
    else
    {
        this.radius = width / 2 + VERTEX_PADDING;
    }

    // Draw the vertex circle
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    c.stroke();
    
    // Draw the text
    drawText(c, this.text, this.x, this.y, null, selectedObject == this);
};

// Check if a point is inside the vertex
Vertex.prototype.contains = function(x, y) 
{
    var dx = x - this.x;
    var dy = y - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
};

// Find the nearest point on the edge of the circle to the given coordinates
Vertex.prototype.nearestCirclePoint = function(x, y)
{
    var dx = x - this.x;
    var dy = y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return {
        'x': this.x + this.radius * dx / dist,
        'y': this.y + this.radius * dy / dist
    };
};

// Keep track of start point (for moving vertices), so that later, we can move vertex without having to center it on the mouse
Vertex.prototype.setStartPoint = function(x, y)
{
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
};

// Set the position of the vertex, using the offset point set earlier
Vertex.prototype.setAnchorPoint = function(x, y)
{
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
};