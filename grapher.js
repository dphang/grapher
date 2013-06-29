/*
 Grapher (JavaScript tool for drawing graphs)
 Version: 1.0
 
 Description: I created this tool because I wanted to more easily
 draw graphs especially for use in LaTeX editors. Using the graphing
 and/or picture packages provided works, but they aren't exactly
 very easy to use, since I needed to type LaTeX code to draw circles and lines manually.
 
 This tool is useful for anyone needing to draw graphs, especially
 if they need to be typeset (such as in an academic paper or homework).
 
 You can easily implement this using an HTML5 canvas of a reasonable size. You also need an
 output textbox (for LaTeX code), and buttons for saving as PNG and saving as LaTeX.
 -------------------------------------------------------------------
 Directions: 
 
 Double click to create vertices
 Single click to select vertices and edges
 
 While a vertex or edge is selected:
 
 - Delete key deletes the vertex or edge
 - Typing adds text to the vertex or edge, backspace works as expected
 - To make subscripted numbers, type an underscore followed by
   numbers and then another underscore. Example: _3_
   Note that these will be automatically converted to the correct
   braces for LaTeX code.
 
 While a vertex is selected:
 
 - Moving the mouse moves the vertex
 - Pressing shift then dragging will create an undirected edge
 - Pressing control then dragging will create a directed edge
 
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

// Constants. Note these are not const because they aren't cross-browser compatible
var VERTEX_RADIUS = 30;     // Size of vertices
var VERTEX_PADDING = 10;    // Distance between text and circle edge
var FONT_SIZE = 24;         // Default font size
var FONT = 'Cambria';       // Cambria: works well for subscripted numbers
var SNAP_MARGIN = 10;       // Snap-to distance (how close should a vertex be before it snaps to another vertex's x or y coordinate)
var EDGE_MARGIN = 6;        // Selection margin for an edge (how close to an edge the mouse has to be for it to be selected)

// Keycode constants
var BACKSPACE = 8;
var SHIFT = 16;
var CTRL = 17;
var DELETE = 46;

// Canvas element
var canvas = null;

// Keep track of objects on the canvas
var selectedObject = null;  // Mouse selected object
var currentEdge = null;     // For storing a temporary edge
var sourceMouse = null;     // Keep track of original mouse position, for moving objects
var movingObject = false;   // Keep track of whether we are moving an object (vertex/edge)
var vertices = [];          // Array to store vertices
var edges = [];             // Array to store edges
var font = null;            // Font type

// Boolean variables to keep track of what keys/mouse have been pressed
var lastKey = null;
var shift = false;
var ctrl = false;
var mouseDown = false;

// Initialize our event listeners and other functions when the window has loaded
window.onload = function() 
{
    // Set our canvas (named canvas in the html file)
    canvas = document.getElementById('canvas');
    canvas.onselectstart = function () // Prevents selecting text outside canvas
    { 
        return false; 
    }
    c = canvas.getContext('2d'); // Two-dimensional drawing context
    
    // Mouse press event
    canvas.onmousedown = function(e)
    {
        // Get the mouse coordinates
        var mouse = crossBrowserRelativeMousePos(e);
        sourceMouse = mouse;
        selectedObject = selectObject(mouse.x, mouse.y); // If our mouse click is in some vertex/edge, select it
        
        if (selectedObject != null) 
        {
            if (selectedObject instanceof Vertex)
            {
                if (shift && currentEdge == null) // If shift is held, we can connect an edge from a vertex
                {
                    currentEdge = new TempEdge(selectedObject, mouse);
                }
                else if (ctrl && currentEdge == null) // If control is held, we can connect a directed edge from a vertex
                {
                    currentEdge = new TempDirEdge(selectedObject, mouse);
                }
                else // Otherwise, we are moving an object (vertex or edge)
                {
                    movingObject = true;
                
                    if (selectedObject.setStartPoint) // Keep track of the original start point of vertex
                    {
                        selectedObject.setStartPoint(mouse.x, mouse.y);
                    }

                }
            }
        }
        
        mouseDown = true;
    };
    
    // Mouse release event
    canvas.onmouseup = function(e)
    {
        // Get the mouse coordinates
        var mouse = crossBrowserRelativeMousePos(e);
        movingObject = false;
        
        if (currentEdge instanceof TempEdge || currentEdge instanceof TempDirEdge) // If edge isn't connected to anywhere, then we remove it
        {
            currentEdge = null;
        }
        else if (currentEdge instanceof Edge || currentEdge instanceof DirEdge) // If it has been connected to another vertex, add it to edge array
        {
            if (!containsEdge(currentEdge))
            {
                edges.push(currentEdge);
            }
            
            // Reset the current edge and last key pressed
            currentEdge = null;
            lastKey = null;
        }
        
        mouseDown = false;
    };
    
    // Mouse move event
    canvas.onmousemove = function(e)
    {
        // Get the mouse position
        var mouse = crossBrowserRelativeMousePos(e);
        
        if (currentEdge != null) // If we are currently creating an edge
        {
            var destVertex = selectObject(mouse.x, mouse.y); // Select an object that the mouse clicked on

            if (selectedObject != null)
            {
                if (destVertex instanceof Vertex == false) // if destVertex is not a vertex, we don't care
                {
                    destVertex = null;
                }
                
                if (currentEdge != null && selectedObject instanceof Vertex) // If we are creating an edge, do something with it
                {
                    if (destVertex == null) // Move our temp edge/directed edge to the current mouse position
                    {
                        if (lastKey == SHIFT)
                        {
                            currentEdge = new TempEdge(selectedObject, mouse);
                        }
                        else if (lastKey == CTRL)
                        {
                            currentEdge = new TempDirEdge(selectedObject, mouse);
                        }
                    }
                    else // If the destVertex is some other vertex, make an edge between both vertices
                    {
                        if (lastKey == SHIFT)
                        {
                            currentEdge = new Edge(selectedObject, destVertex);
                        }
                        else if (lastKey == CTRL)
                        {
                            currentEdge = new DirEdge(selectedObject, destVertex);
                        }
                    }
                }      
            }
        }
        
        if (movingObject) // If an object is moving, then move it
        {   
            selectedObject.setAnchorPoint(mouse.x, mouse.y); // Set the position to wherever the mouse is
            snap(selectedObject); // Snap to alignment (with other vertices)
        }
        draw();
    };
    
    canvas.ondblclick = function(e) 
    {
        // Get the mouse coordinates
        var mouse = crossBrowserRelativeMousePos(e);
        selectedObject = selectObject(mouse.x, mouse.y);

        if (selectedObject == null) // If there is nothing at the mouse position, create a new vertex
        {
          selectedObject = new Vertex(mouse.x, mouse.y);
          vertices.push(selectedObject);
          draw();
        }
    };
}

// Key down event
document.onkeydown = function(e)
{
    var key = crossBrowserKey(e);
    
    // We don't want to be able to change between directed/undirected edges while mouse is being pressed
    if (!mouseDown)
    {
        lastKey = key;
    }
    
    // Check what keys have been pressed
    if (key == SHIFT) 
    {
        shift = true;
    }
    else if (key == CTRL)
    {
        ctrl = true;
    }
    else if (selectedObject != null) 
    {
        if (key == BACKSPACE) // Delete text from the vertex or edge
        {
            selectedObject.text = selectedObject.text.substr(0 , selectedObject.text.length - 1);
            draw();
            return false;
        }
        else if (key == DELETE) // Delete the vertex or edge selected
        {
            for (var i = 0; i < vertices.length; i++) // Delete vertex selected
            {
                if (vertices[i] == selectedObject) 
                {
                  vertices.splice(i--, 1);
                }
            }
            
            for (var i = 0; i < edges.length; i++) // Delete edge selected, or edges incident on deleted vertex
            {
                if (edges[i] == selectedObject || edges[i].v1 == selectedObject || edges[i].v2 == selectedObject) 
                {
                  edges.splice(i--, 1);
                }
            }
            selectedObject = null;
            draw();
        }
    }
    
    if (key == BACKSPACE) // Prevent browser back function
    {
        return false;
    }
    
    
}

// Key up event
document.onkeyup = function(e)
{
    var key = crossBrowserKey(e);

    if (key == SHIFT) 
    {
        shift = false;
    }
    else if (key == CTRL)
    {
        ctrl = false;
    }
}

// Key press event
document.onkeypress = function(e)
{
    var key = crossBrowserKey(e);
    
    if (!canvasHasFocus)
    {
        return true;
    }
    else if (selectedObject != null && key >= 0x20 && key <= 0x7E) // A valid alphanumeric + symbols key
    {
        if (key >= 48 && key <= 57)
        {
            selectedObject.text += String.fromCharCode(key);
        }
        else
        {
            selectedObject.text += String.fromCharCode(key);
        }
        draw();
        
        return false;
    }
    else if (key == BACKSPACE) // Prevent browser back function
    {
        return false;
    }
}

// Attempt to select an object at the given (x, y) out of our added vertices and edges
function selectObject(x, y)
{
    for (var i = 0; i < vertices.length; i++)
    {
        if (vertices[i].contains(x, y))
        {
            return vertices[i];
        }
    }

    for (var i = 0; i < edges.length; i++)
    {
        if (edges[i].contains(x, y))
        {
            return edges[i];
        }
    }
}

// Snap a vertex (for aligning with other vertices)
function snap(vertex)
{
    for (var i = 0; i < vertices.length; i++)
    {
        if (Math.abs(vertex.x - vertices[i].x) < SNAP_MARGIN)
            vertex.x = vertices[i].x;
        
        if (Math.abs(vertex.y - vertices[i].y) < SNAP_MARGIN)
            vertex.y = vertices[i].y;
    }
}

// Draw based on the 2D context 
function draw() 
{
    c = canvas.getContext('2d');
    drawWith(c);
}

// Draw with a certain context (either 2D, LaTeX, etc)
function drawWith(c)
{
    // Clear the rectangle
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each vertex
    for (var i = 0; i < vertices.length; i++)
    {
        c.fillStyle = c.strokeStyle = (vertices[i] == selectedObject) ? 'green' : 'black';
        vertices[i].draw(c);
    }
    
    // Draw each edge
    for (var i = 0; i < edges.length; i++)
    {
        c.fillStyle = c.strokeStyle = (edges[i] == selectedObject) ? 'green' : 'black';
        edges[i].draw(c);
    }
    
    // If there is an edge being created, draw that
    if (currentEdge != null)
    {
        currentEdge.draw(c);
    }
}

// Draw text using the cambria font
function drawText(c, oldText, x, y, angle, isSelected)
{
    var text = makeSubscripts(oldText);
    c.font = FONT_SIZE + 'px ' + FONT + ', serif';
    var width = c.measureText(text).width;
    x -= width/2;
    
    // For placing text so it does not overlap with an edge (when it is being rotated)
    if (angle != null) 
    {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
        var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
        var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
        x += cornerPointX - sin * slide;
        y -= cornerPointY + cos * slide;
    }
    
    x = Math.round(x);
    y = Math.round(y);
    
    if ('advancedFillText' in c)
    {
        c.advancedFillText(text, oldText, x + width / 2, y, angle);
    }
    else
    {
        c.fillText(text, x, y + 6);
    }
}

// Draw the arrow head
function drawArrow(c, x, y, angle) {
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  c.fill();
  c.stroke();
}

// Prevents duplicate edges by checking if an edge has already been added
// This also means that an undirected edge must be deleted before directed edges can be added and vice versa
function containsEdge(edge)
{
    for (var i = 0; i < edges.length; i++)
    {
        if (edge.v1 == edges[i].v1 && edge.v2 == edges[i].v2 || edge.v2 == edges[i].v1 && edge.v1 == edges[i].v2)
        {
            return true;
        }
    }
    return false;
}


// Functions for getting the mouse position or key codes across multiple browsers

function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
  e = e || window.event;
  var obj = e.target || e.srcElement;
  var x = 0, y = 0;
  while(obj.offsetParent) {
    x += obj.offsetLeft;
    y += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return { 'x': x, 'y': y };
}

function crossBrowserMousePos(e) {
  e = e || window.event;
  return {
    'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
}

function crossBrowserRelativeMousePos(e) {
  var element = crossBrowserElementPos(e);
  var mouse = crossBrowserMousePos(e);
  return {
    'x': mouse.x - element.x,
    'y': mouse.y - element.y
  };
}

function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
}

function canvasHasFocus() {
  return (document.activeElement || document.body) == document.body;
}

// Exporting functions
function toPNG() 
{
  var oldSelectedObject = selectedObject;
  selectedObject = null;
  drawUsing(canvas.getContext('2d'));
  selectedObject = oldSelectedObject;
  var pngData = canvas.toDataURL('image/png');
  document.location.href = pngData;
}

// An object to help draw to LaTeX, i.e. convert to LaTeX code (via TikZ picture)
// Contains the same functions as the normal context drawing, except this writes code
function LaTeXDrawer() {
    this._points = [];
    this._texData = '';
    this._scale = 0.1; // Ensure that the TikZ picture isn't too big

    // Returns a string containing the LaTeX code that can easily be copied into a .tex file
    this.toLaTeXCode = function() 
    {
        return  '\\begin{center}\n' 
                + '\\begin{tikzpicture}[scale=0.2]\n'
                + '\\tikzstyle{every node}+=[inner sep=0pt]\n'
                + this._texData
                + '\\end{tikzpicture}\n'
                + '\\end{center}\n';
    };
    
    // Initialize drawing a line
    this.beginPath = function() 
    {
        this._points = [];
    };

    // Draw an arc
    this.arc = function(x, y, radius, startAngle, endAngle, isReversed) 
    {
        x *= this._scale;
        y *= this._scale;
        radius *= this._scale;
        
        if (endAngle - startAngle == Math.PI * 2) 
        {
            this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
        } 
        else 
        {
            if (isReversed) 
            {
            var temp = startAngle;
            startAngle = endAngle;
            endAngle = temp;
        }
        
        if (endAngle < startAngle) 
        {
        endAngle += Math.PI * 2;
        }
        
        // TikZ should have angles between -2PI and 2PI
        if (Math.min(startAngle, endAngle) < -2*Math.PI) {
            startAngle += 2*Math.PI;
            endAngle += 2*Math.PI;
        } 
        else if (Math.max(startAngle, endAngle) > 2*Math.PI) 
        {
            startAngle -= 2*Math.PI;
            endAngle -= 2*Math.PI;
        }
        
        startAngle = -startAngle;
        endAngle = -endAngle;
        this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) 
                                    + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' 
                                    + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' 
                                    + fixed(radius, 3) + ');\n';
        }
    };

    // Draw a line i.e. push a start point or end point
    this.moveTo = this.lineTo = function(x, y) 
    {
        x *= this._scale;
        y *= this._scale;
        this._points.push({ 'x': x, 'y': y });
    };

    // For each point, output its LaTeX code
    this.stroke = function() 
    {
        if (this._points.length == 0) 
        {
            return;
        }
        
        this._texData += '\\draw [' + this.strokeStyle + ']';
        
        for (var i = 0; i < this._points.length; i++) 
        {
            var p = this._points[i];
            this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
        }
        
        this._texData += ';\n';
    };

    this.fill = function() 
    {
        if (this._points.length == 0) 
        {
            return;
        }
        
        this._texData += '\\fill [' + this.strokeStyle + ']';
        
        for (var i = 0; i < this._points.length; i++) 
        {
            var p = this._points[i];
            this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
        }
        
        this._texData += ';\n';
    };
    
    // Return the width of the text
    this.measureText = function(text) 
    {
        var c = canvas.getContext('2d');
        c.font = FONT_SIZE + 'px ' + FONT + ', serif';
        return c.measureText(text);
    };
    
    // Draw text smartly, using an x, y offset
    this.advancedFillText = function(text, originalText, x, y, angle) 
    {
        if (text.replace(' ', '').length > 0) 
        {
            var nodeParams = '';

            if (angle != null) 
            {
                var width = this.measureText(text).width;
                var dx = Math.cos(angleOrNull);
                var dy = Math.sin(angleOrNull);
                if (Math.abs(dx) > Math.abs(dy)) 
                {
                    if (dx > 0) 
                    { 
                        nodeParams = '[right] '; x -= width / 2; 
                    }
                    else
                    { 
                        nodeParams = '[left] '; x += width / 2; 
                    }
                } 
                else 
                {
                    if (dy > 0) 
                    { 
                        nodeParams = '[below] '; y -= 10; 
                    }
                    else 
                    { 
                        nodeParams = '[above] '; y += 10; 
                        }
                }       
            }
            
            x *= this._scale;
            y *= this._scale;
            var subscriptedText = this.makeLaTeXSubscripts(originalText);
            this._texData += '\\draw (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' 
                            + nodeParams + '{$' + subscriptedText.replace(/ /g, '\\mbox{ }') + '$};\n';
        }
    };
    
    // Make LaTeX subscripts using regular expressions
    // Converts any numbers between _ and _ to the proper braces _{} LaTeX uses
    this.makeLaTeXSubscripts = function(text)
    {
        var subscripts = text.match(new RegExp('_[0-9]+_', 'g'));
        
        if (subscripts != null)
        {
            var replace = new Array(subscripts.length);
            
            for (var i = 0; i < subscripts.length; i++)
            {
                replace[i] = '_{';
                replace[i] += subscripts[i].replace(new RegExp('_', 'g'), '');
                replace[i] += '}';
                
                text = text.replace(new RegExp(subscripts[i], 'g'), replace[i]);
            }
        }
        
        return text;
    };

    this.translate = this.save = this.restore = this.clearRect = function(){};
}

// Export as PNG file
function saveAsPNG() 
{
  var old = selectedObject;
  selectedObject = null;
  drawWith(canvas.getContext('2d'));
  selectedObject = old;
  var png = canvas.toDataURL('image/png');
  document.location.href = png;;
}

// Export as LaTeX code
function saveAsLaTeX() 
{
  var latex = new LaTeXDrawer();
  var old = selectedObject;
  selectedObject = null;
  drawWith(latex);
  selectedObject = old;
  var texCode = latex.toLaTeXCode();
  output(texCode);
}

// To convert a number to a string with two decimals, needed to LaTeX code
function fixed(number, digits) 
{
  return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

// Output to a textbox (named output in our html file)
function output(text)
{
    var element = document.getElementById('output');
    element.style.display = 'block';
    element.value = text;
}

// Make subscripts for displaying in our canvas
// Any numbers in between two underscores are subscripts
// Example: _3_ or _123_
function makeSubscripts(text)
{
    var subscripts = text.match(new RegExp('_[0-9]+_', 'g'));
    
    if (subscripts != null)
    {
        var replace = new Array(subscripts.length);
        
        for (var i = 0; i < subscripts.length; i++)
        {
            replace[i] = subscripts[i].replace(new RegExp('_|_', 'g'), '');
            for (var j = 0; j < 10; j++)
            {
                replace[i] = replace[i].replace(new RegExp(j, 'g'), String.fromCharCode(8320 + j));
            }
            
            text = text.replace(new RegExp(String(subscripts[i]), 'g'), replace[i]);
        }
    }
    
    return text;
}

