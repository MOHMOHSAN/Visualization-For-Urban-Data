// namespace
var COS = { 
  columns : [
    { 
      name: "Description", 
      type: "string" 
    },
    { 
      name: "Place Type", 
      type: "string" 
    },
    { 
      name: "Visitors", 
      type: 'number',
       // Define a helper for pre-processing numeric values - 
      // ensures empty cells are set to 0 and the rest are 
      // stripped of commas and turned to floats
      before: function(v){
        return (_.isUndefined(v) || _.isNull(v)) ? 
          0 : 
          parseFloat(v.replace(/\,/g, '')); 
      }  
    },
    { 
      name: "Europe" , 
      type: 'number'
    },
    { 
      name: "Americans" , 
      type: 'number'
    },
    { 
      name: "Oceania", 
      type: "number"
    },
    { 
      name: "Africa", 
      type: "number" 
    },
    { 
      name: "Southeast Asia", 
      type: "number" 
    },
    { 
      name: "North Asia", 
      type: "number" 
    },
    { 
      name: "South Asia", 
      type: "number" 
    },
    { 
      name: "Date", 
      type: "string", 
    },
    { 
      name: "Url", 
      type: "string" 
    }
  ],
  // container for our application views
  Views : {},

  // application router
  Router : Backbone.Router.extend({

    routes : {
      "" : "index"
    },

    index : function() {
      
      // configuration parameters that are used throughout the application:
      COS.config = {
        // Define the start of the period we're interested in - 01 April 2010
        startDate : "2010",

        // Define the end of the period we're interested in - 31 March 2011
        finalDate : "2010",

        // default dates, all.
        dateRanges : ["2010"],

        placeTypes : ["Paid-access Attractions"],

        // Define the maximum number of groups to be included in the chart at any time
        maxGroups : 20,

        categoryColors : [
          "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
          "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D", 
          "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B", 
          "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
         ]

      };

      // state management 
      COS.state = {
        // Store the name of the currently selected month range
        currentRange : COS.config.startDate,

        // Store the name of the column by which the data is currently grouped:
        // n.b. this is initially set as "Expense Type"
        currentPlaceType : "Paid-access Attractions"
      };

      // Define the underlying dataset for this interactive, a CSV file containing 
      COS.data = new Miso.Dataset({
        
        url: "data/visitors.csv",
        delimiter: ",",
        columns: COS.columns,

        ready : function() {

          // getting unique data from Date Column and these data are displayed inside dropdown list
          COS.config.dateRanges = _.union(
            COS.config.dateRanges, 
            _.unique(this.column("Date").data)
          );

          //getting unique data from Place Type Column and these data are displayed inside dropdown list
          COS.config.placeTypes = _.union(
            COS.config.placeTypes, 
            _.unique(this.column("Place Type").data)
          );
        }
        
      });

      
      COS.data.fetch({
        success : function() {
          COS.app = new COS.Views.Main();
          // console.log("data");
          // console.log(COS.data);
          COS.app.render();
        },
        error: function(){
          // console.log(data.url);
          COS.app.views.title.update("Failed to load data from " + data.url);

        }
      });

    }
  })
};

/**
* Main application view
*/
COS.Views.Main = Backbone.View.extend({

  initialize : function() {
    this.views = {};
  },

  render : function() {
    this.views.title = new COS.Views.Title();
    // console.log(this.views.title);
    this.views.Type = new COS.Views.PlaceTypes();
    // console.log(this.views.Type);
    this.views.dateranges = new COS.Views.DateRanges();
    // console.log(this.views.dateranges);

    this.views.treemap = new COS.Views.Treemap();

    this.views.title.render();
    this.views.Type.render();
    this.views.dateranges.render();
    this.views.treemap.render();
  } 
});


// captions on top of treemap
COS.Views.Title = Backbone.View.extend({

  el : "#legend",
  initialize : function(options) {
    options = options || {};
    this.defaultMessage = "Famous attractions in singapore";
    this.message = options.message || this.defaultMessage;
    this.setElement($(this.el));
  },
  render : function() {
    this.$el.html(this.message);
  },
  update : function(message) {
    if (typeof message !== "undefined") {
      this.message = message;
    } else {
      this.message = this.defaultMessage;
    }
    this.render();
  }
});

/**
* Represents a dropdown box with a list of place Type options.
*/
COS.Views.PlaceTypes = Backbone.View.extend({

  el : '#type', 
  template : 'script#placeTypes',

  events : {
    "change" : "onChange"
  },

  initialize : function(options) {

    options       = options || {};
    this.types   = options.types || COS.config.placeTypes;
    this.template = _.template($(this.template).html());
    this.setElement($(this.el));  
  },

  render : function() {
    this.$el.parent().show();
    this.$el.html(this.template({ placeTypes : this.types }));
    return this;
  },

  onChange : function(e) {
    COS.state.currentPlaceType = $("option:selected", e.target).val();
    COS.app.views.treemap.render();
  }

});

/**
* Date range dropdown containing all possiblev values.
*/
COS.Views.DateRanges = Backbone.View.extend({
  
  el : '#range', 
  template : 'script#dateRanges',

  events : {
    "change" : "onChange"
  },

  initialize : function(options) {
    options       = options || {};
    this.ranges   = options.ranges || COS.config.dateRanges;
    this.template = _.template($(this.template).html());
    this.setElement($(this.el));  
  },

  render : function() {
    this.$el.parent().show();
    this.$el.html(this.template({ dateRanges : this.ranges }));
    return this;
  },

  onChange : function(e) {
    COS.state.currentRange = $("option:selected", e.target).val();
    COS.app.views.treemap.render();
  }

});

/**
* A tree map, uses d3.
*/
COS.Views.Treemap = Backbone.View.extend({

  el : "#chart", 

  initialize : function(options) {
    options = options || {};
    this.width = options.width || 970;
    this.height = options.height || 600;
    this.setElement($(this.el));
  },

  _hideGroup : function(elType, fadeTime, offset) {
    if (fadeTime) {
      offset = offset || 0;
      $(elType).each(function(index){
        $(this).delay(offset*index).fadeOut(fadeTime);
      });
    } else {
      $(elType).hide();
    }
  },

  _showGroup : function(elType, fadeTime, offset) {
    if (fadeTime) {
      offset = offset || 0;
      $(elType).each(function(index){
        $(this).delay(offset*index).fadeIn(fadeTime);
      });
    } else {
      $(elType).show();
    }
  },

  render : function() {

    // load state
    var range   = COS.state.currentRange,
      Type  = COS.state.currentPlaceType,
      maxGroups = COS.config.maxGroups;



    // Create a data subset that we are rendering
    var groupedData = COS.Utils.computeGroupedData();

  

    // === build data for d3
    var expenseData = { 
      name: Type, 
      elements: [] 
    };

    groupedData.each(function(row, index){
      if (index >= maxGroups) {
        return;
      }
      console.log(Type); // selected drop down value
      console.log(row["Description"]); // descr of one row
      expenseData.elements.push({ 
        name:  row["Description"], 
        total: row["Visitors"], 
        image: row["Url"],
        color: COS.config.categoryColors[index % COS.config.categoryColors.length] 
      });
    });

    console.log("expenseData Array");
    console.log(expenseData);

    // === build d3 chart
    // Build a treemap chart with the supplied data (using D3 to create, size, color and layout a series of DOM elements).
    // Add labels to each cell, applying dynamic styling choices according to the space available.
    // Bind custom handlers to cell highlighting and selection events.    
    this.$el.empty();
    var selected = null;

    var layout = d3.layout.treemap()
      .sort(function(a,b){ 
          return a.value - b.value; 
        })
      .children(function(d){ 
        return d.elements; 
      })
      .size([this.width, this.height])
      .sticky(true)
      .value(function(d){ 
        return d.total; 
      });

    var chart = d3.select("#chart")
      .append("div")

      // set default styles for chart
      .call(function(){
        this.attr("class", "chart")
          .style("position", "relative")
          .style("width", this.width + "px")
          .style("height", this.height + "px");
        }
      );

    // set up data for the chart
    chart.data([expenseData])
      .selectAll("div")
      .data(function(d){
        return layout.nodes(d);
      })
      .enter()
        .append("div")

        // append a div for every piece of the treemap
        .call(function(){
          this.attr("class", "cell")
            .style("left",       function(d){ return d.x + "px"; })
            .style("top",        function(d){ return d.y + "px"; })
            .style("width",      function(d){ return d.dx - 1 + "px"; })
            .style("height",     function(d){ return d.dy - 1 + "px"; })
            .style("background-image", function(d){ return ("url("+d.image+")" || "url(http://orig14.deviantart.net/d37c/f/2015/151/a/d/46880e6a621f4f1fbda1da26c1ede75f_by_rooksrookery-d8vk5ni.jpg)"); })
            .style("background-size",'cover')
            .style("background-repeat","no-repeat")
            .style("background-position","center center");
        })

        // on click just output some logging
        .on("click", function(d){
          if (selected) { 
            selected.toggleClass("selection") 
          }; 
          selected = $(this);
          selected.toggleClass("selection"); 
          // console.log(d, selected);
        })
        
        // on mouseover, fade all cells except the one being
        // selected.
        .on("mouseover", function(d){
          
          // update Title.
          COS.app.views.title.update(
            COS.Utils.toTitleCase(d.name) + " - " + 
            d.value.toFixed(0) + "%"
          );

          $(".cell").stop().fadeTo(300, 0.2); 
          $(this).stop().fadeTo(0, 1.0);
        })

        // on mouse out, unfade all cells.
        .on("mouseout", function(d) {
          $(".cell").stop().fadeTo("fast", 1.0);
          COS.app.views.title.update();
        })
        .append("p")
        // set the size for the labels for the dollar amount.
        // vary size based on size.
        .call(function(){
          this.attr("class", "label")
              .style("font-size", function(d) {
                return d.area > 55000 ? 
                  "14px" : 
                  d.area > 20000 ? 
                    "12px" : 
                    d.area > 13000 ? 
                      "10px" : 
                      "5px"; 
              })
              .style("text-transform", function(d) { 
                return d.area > 20000 ? 
                  "none" : 
                  "uppercase"; 
              });
          })

          // append dollar amounts
          .html(function(d){
            return "<span class='cost'>" + 
               d.value.toFixed(0) +" %" + 
              "</span>" + 
              COS.Utils.toTitleCase(d.name); 
          });

    // some graceful animation
    this._hideGroup("#chart .cell");  
    this._showGroup("#chart .cell", 300, 10);
  }
});

// Random Utility functions
COS.Utils = {
  // Return the string supplied with its first character converted to upper case
  toTitleCase : function(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  },


  // Compute grouped data for a specific range,
  computeGroupedData : function() {
    // load state
    var range   = COS.state.currentRange,
      Type  = COS.state.currentPlaceType,
      maxGroups = COS.config.maxGroups,
      
      // How are we selecting rows from the
      rangeSelector = (range == COS.config.startDate) ? 

        // Define a function for selecting all rows in the range between startDate and finalDate
        function(row){ 

          return ( row["Date"] === COS.config.startDate &&  row["Place Type"]=== Type ) 

        } : 
        // select the period from a specific row
        function(row){ 
          return (row["Date"] === range && row["Place Type"]=== Type) 
        };

     
  
      var groupedData = COS.data.rows(rangeSelector);
      console.log("testing.....");
      console.log(range);
      console.log(Type);
      console.log(groupedData);

    groupedData.sort({
      comparator : function(a ,b){ 
        if (b["Visitors"] > a["Visitors"]) { return  1; }
        if (b["Visitors"] < a["Visitors"]) { return -1; }
        if (b["Visitors"] === a["Visitors"]) { return 0; }
      }      
    });

    return groupedData;
  }
};

// Kick off application.
var mainRoute = new COS.Router();
Backbone.history.start();
