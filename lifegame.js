/*
 * Conway's Game of Life for JavaScript
 *
 * @author AKIYAMA Kouhei
 * @since 2009-11-12
 *
 * (The MIT License)
 * 
 * Copyright (c) 2009 AKIYAMA Kouhei.
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

var LifeGameApp = {
    getLastScriptNode: function()
    {
        var n = document;
        while(n && n.nodeName.toLowerCase() != "script") { n = n.lastChild;}
        return n;
    },

    appendLifeGameAfterLastScriptNode: function(width, height)
    {
        var game = new LifeGameApp.Game(width, height);
        
        var parent = LifeGameApp.getLastScriptNode().parentNode;
        parent.appendChild(game.element);
        return game;
    },

    appendLifeGameWithRecreatorAfterLastScriptNode: function(width, height)
    {
        var gameWithRecreator = new LifeGameApp.GameWithRecreator(width, height);
        
        var parent = LifeGameApp.getLastScriptNode().parentNode;
        parent.appendChild(gameWithRecreator.element);
        return gameWithRecreator.game;
    },

};



LifeGameApp.GameWithRecreator = function(width, height)
{
    width = width || 20;
    height = height || 20;
    
    var div = document.createElement("div");
    
    var form = document.createElement("form");
    div.appendChild(form);
    
    var inputWidth = document.createElement("input");
    inputWidth.setAttribute("type", "text");
    inputWidth.setAttribute("value", width);
    inputWidth.setAttribute("size", "4");
    form.appendChild(document.createTextNode("width:"));
    form.appendChild(inputWidth);
    
    var inputHeight = document.createElement("input");
    inputHeight.setAttribute("type", "text");
    inputHeight.setAttribute("value", height);
    inputHeight.setAttribute("size", "4");
    form.appendChild(document.createTextNode("height:"));
    form.appendChild(inputHeight);
    
    var buttonRecreate = document.createElement("input");
    buttonRecreate.setAttribute("type", "button");
    buttonRecreate.setAttribute("value", "Recreate");
    form.appendChild(buttonRecreate);

    var game = new LifeGameApp.Game(width, height);
    div.appendChild(game.element);
    
    var funcRecreate = function(){
        var w = parseInt(inputWidth.value);
        var h = parseInt(inputHeight.value);
        if(w && h && w >= 0 && h >= 0){
            div.removeChild(game.element);
            game = new LifeGameApp.Game(w, h);
            div.appendChild(game.element);
        }
    };
    if(buttonRecreate.addEventListener){
        buttonRecreate.addEventListener("click", funcRecreate, false);
    }
    else if(buttonRecreate.attachEvent){
        buttonRecreate.attachEvent("onclick", funcRecreate);
    }

    this.game = game;
    this.element = div;
}


LifeGameApp.Game = function(width, height)
{
    width = width || 20;
    height = height || 20;
        
    var model = new LifeGameApp.Model(width, height);
    
    // create simple div includes View, Control.
    var div = document.createElement("div");
    var view = new LifeGameApp.View(width, height);
    model.funcUpdate = function(){ view.update(model.cells);}
    view.addClickListener(function(x, y){ model.reverseCell(x, y);});
    var control = new LifeGameApp.Control(model);

    div.appendChild(view.element);
    div.appendChild(control.element);

    this.element = div;
    this.model = model;
    this.view = view;
    this.control = control;
};



LifeGameApp.View = function(width, height)
{
    var tbl = document.createElement("table");
    tbl.className = "lifegame-table";
    tbl.setAttribute("border", "1");
    for(var y = 0; y < height; ++y){
        var tr = document.createElement("tr");
        for(var x = 0; x < width; ++x){
            var td = document.createElement("td");
            td.className = "lifegame-cell-dead";
            tr.appendChild(td);
        }
        tbl.appendChild(tr);
    }

    this.width = width;
    this.height = height;
    this.tbl = tbl;
    this.element = tbl;
};
LifeGameApp.View.prototype = {
    update: function(cells)
    {
        for(var y = 0; y < this.height; ++y){
            for(var x = 0; x < this.width; ++x){
                var td = this.tbl.childNodes[y].childNodes[x];
                td.className = (cells[x+y*this.width]) ? "lifegame-cell-live" : "lifegame-cell-dead";
            }
        }
    },

    addClickListenerToCell: function(x, y, onclick)
    {
        var td = this.tbl.childNodes[y].childNodes[x];
        if(td.addEventListener){
            td.addEventListener("click", function(){onclick(x, y);}, false);
        }
        else if(td.attachEvent){
            td.attachEvent("onclick", function(){onclick(x, y);});
        }
    },

    addClickListener: function(onclick)
    {
        for(var y = 0; y < this.height; ++y){
            for(var x = 0; x < this.width; ++x){
                this.addClickListenerToCell(x, y, onclick);
            }
        }
    }
};



LifeGameApp.Model = function(width, height)
{
    this.width = width;
    this.height = height;
    this.cells = new Array(width*height);
    this.cellsTmp = new Array(width*height);
    this.generation = 0;
    this.funcUpdate = null;

    this.clear();
};
LifeGameApp.Model.prototype = {
    step: function()
    {
        var i = 0;
        for(var y = 0; y < this.height; ++y){
            var up = (y == 0)
                ? this.width*(this.height-1) : -this.width;
            var down
                = (y == this.height-1)
                ? -this.width*(this.height-1) : this.width;
            for(var x = 0; x < this.width; ++x, ++i){
                var left  = (x == 0)            ? ( this.width-1) : -1;
                var right = (x == this.width-1) ? (-this.width+1) :  1;

                var numLiveCells
                    = this.cells[i+left+up] + this.cells[i+up] + this.cells[i+right+up]
                    + this.cells[i+left] + this.cells[i+right]
                    + this.cells[i+left+down] + this.cells[i+down] + this.cells[i+right+down];
                
                this.cellsTmp[i] = (this.cells[i] && numLiveCells >= 2 && numLiveCells <= 3)
                    || (!this.cells[i] && numLiveCells == 3);
            }
        }

        var old = this.cells;
        this.cells = this.cellsTmp;
        this.cellsTmp = old;
        ++this.generation;

        this.notifyChanged();
    },

    clear: function()
    {
        for(var i = 0; i < this.cells.length; ++i){
            this.cells[i] = false;
        }
        this.generation = 0;
        this.notifyChanged();
    },

    reverseCell: function(x, y)
    {
        if(x >= 0 && x < this.width && y >= 0 && y < this.height){
            var i = x+y*this.width;
            this.cells[i] = !this.cells[i];
            this.notifyChanged();
        }
    },

    put: function(left, top, arr)
    {
        for(var y = 0; y < arr.length; ++y){
            var row = arr[y];
            for(var x = 0; x < row.length; ++x){
                this.cells[(left+x)+(top+y)*this.width] = (row.charAt(x) == "*");
            }
        }
        this.notifyChanged();
    },
    
    notifyChanged: function()
    {
        if(this.funcUpdate){
            this.funcUpdate();
        }
    }
};



LifeGameApp.Control = function(model)
{
    var self = this;

    var form = document.createElement("form");
    var buttonPlay = this.createButton("Start", function(){self.onClickPlay()});
    form.appendChild(buttonPlay);
    var buttonClear = this.createButton("Clear", function(){self.onClickClear()});
    form.appendChild(buttonClear);

    this.element = form;
    this.buttonPlay = buttonPlay;
    this.timer = null;
    this.model = model;
};
LifeGameApp.Control.prototype = {
    createButton: function(value, onclick)
    {
        var button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("value", value);
        if(button.addEventListener){
            button.addEventListener("click", onclick, false);
        }
        else if(button.attachEvent){
            button.attachEvent("onclick", onclick);
        }
        return button;
    },

    onClickPlay: function()
    {
        if(this.timer){
            this.stop();
        }
        else{
            this.start();
        }
    },

    start: function()
    {
        if(!this.timer){
            var self = this;
            this.timer = setInterval(function(){self.onTime();}, 200);
            this.buttonPlay.setAttribute("value", "Stop");
        }
    },

    stop: function()
    {
        if(this.timer){
            clearInterval(this.timer);
            this.timer = null;
            this.buttonPlay.setAttribute("value", "Start");
        }
    },

    onTime: function()
    {
        this.model.step();
    },

    onClickClear: function()
    {
        this.stop();
        this.model.clear();
    },
};
