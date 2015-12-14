var SpatialHash = function(width, height, x_div, y_div) {
    this.width = width;
    this.height = height;
    
    // Number of divisions
    this.x_div = x_div;
    this.y_div = y_div;
    
    // Size of divisions
    this.x_dim = width/x_div;
    this.y_dim = height/y_div;
    
    this.grid = [];
}

SpatialHash.prototype._key = function(point) {
    return (Math.floor(point.x/this.x_dim) + Math.floor(point.y/this.y_dim) * this.x_div);
}

SpatialHash.prototype.insert = function(point) {
    var obkey = this._key(point);
    var grid = this.grid;
    
    if (!grid[obkey]) {
        grid[obkey] = [];
    }
    
    grid[obkey].push(point);
}

SpatialHash.prototype.delete = function(point) {
    var cell = this.getGrid(point);
    
    if (cell) {
        for (var i = 0; i < cell.length; i++) {
            if (point.x == cell[i].x && point.y == cell[i].y) {
                //console.log("Deleted " + point.x + " " + point.y);
                cell.splice(i, 1);
                i--;
            }
        }
    }
}

SpatialHash.prototype.getGrid = function(point) {
    return this.grid[this._key(point)];
}

SpatialHash.prototype.pointExists = function(point) {
    var cell = this.getGrid(point);
    if (cell) {
        for (var i = 0; i < cell.length; i++) {
            if (point.x == cell[i].x && point.y == cell[i].y) {
                return true;
            }
        }
    }
    return false;
}

SpatialHash.prototype.toString = function() {
    var s = "";
    this.grid.forEach(function(element) {
        element.forEach(function (p) {
            s = s + (p.x + " " + p.y) + "\n";
        });
    });
    return s;
}

/*

var g = [];
var h = new SpatialHash(1000, 1000, 100, 100);

function searchArray(point) {
    for (var i = 0; i < g.length; i++) {
        if (g[i].x == point.x && g[i].y == point.y) {
            return i;
        }
    }
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

// Spatial hash verification
var s = new Set();
for (var i = 0; i < 1000000; i++) {
    var p = new Point(Math.floor(Math.random()*1000), Math.floor(Math.random()*1000));
    s.add(p.x + " " + p.y);
    h.insert(p);
    if (Math.random() < 0.5) {
        s.delete(p.x + " " + p.y);
        h.delete(p);
    }
}

var verified = true;
for (var i = 0; i < 1000; i++) {
    for (var j = 0; j < 1000; j++) {
        var p = new Point(i, j);
        
        if (s.has(p.x + " " + p.y) != h.pointExists(p)) {
            console.log(p.x + " " + p.y + " " + s.has(p.x + " " + p.y) + " " + h.pointExists(p));
            verified = false;
        }
    }
}

console.log("Verified: " + verified);

// Array insertion
console.time("Array insertion");
for (var i = 0; i < 1000; i++) {
    for (var j = 0; j < 1000; j++) {
        g.push({x: i, y: j});
    }
}
console.timeEnd("Array insertion");

// Spatial hash insertion
console.time("Spatial hash insertion");
for (var i = 0; i < 1000; i++) {
    for (var j = 0; j < 1000; j++) {
        h.insert({x: i, y: j});
    }
}
console.timeEnd("Spatial hash insertion");


// Array lookup
console.time("Array lookup");
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 100; j++) {
        searchArray({x: i*10, y: j*10});
    }
}
console.timeEnd("Array lookup");


// Spatial hash lookup
console.time("Spatial hash lookup");
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 100; j++) {
        h.pointExists({x: i*10, y: j*10});
    }
}
console.timeEnd("Spatial hash lookup");

*/
