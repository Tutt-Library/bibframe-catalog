function CatalogViewModel() {
	self = this;
	self.searchHeaders= ['All', 'Works',  'Instances','Agents','Topics'];
	self.sortOptions = ['Relevance','Category','A-Z','Z-A'];
	self.flash = ko.observable();
	self.from = ko.observable(0);
	self.queryPhrase = ko.observable();
	self.queryPhraseForResults = ko.observable()
	self.errorMsg = ko.observable("");
	self.searchResults = ko.observableArray();
	self.shardSize = ko.observable(8);
	self.totalResults = ko.observable(0);
	self.csrf_token = $('#csrf_token').val();
	self.search_url = $('#search-url').val();
	self.chosenBfSearchViewId = ko.observable();
	self.chosenBfSortViewId = ko.observable();
	self.chosenItemData = ko.observable();
	self.viewMode = ko.observable();
	self.sortState = ko.computed(function() {
									return self.chosenBfSortViewId();    
								}, this);
	self.resultSummary = ko.computed(function() {
										return (self.errorMsg() !== ""? self.errorMsg() : self.from() + " of " + self.totalResults() + ' for <em>' + self.queryPhraseForResults() + "</em>");
									}, this);
	
    // Behaviours    
    self.goToBfSearchView = function(bfSearchView) { 
		var queryStr = "/" + (isNotNull(self.queryPhrase())? self.queryPhrase():"#$");
        location.hash = self.chosenBfSortViewId()+ "/" + bfSearchView + queryStr;    
    };
	self.goToBfSortView = function(bfSortView) {
		var queryStr = "/" + (isNotNull(self.queryPhrase())? self.queryPhrase():"#$"); 
        location.hash = bfSortView + "/" + self.chosenBfSearchViewId() + queryStr;
    };
	
	self.goToBfResultsView = function(bfResultsView) { 
		var queryStr = "/" + (isNotNull(self.queryPhrase()) ? self.queryPhrase():"#$");
        location.hash = self.chosenBfSortViewId() + "/" + self.chosenBfSearchViewId() + queryStr;
    };
    
	self.loadResults = function() {
		if((self.from() < self.totalResults())&&(self.viewMode()=='search')) { 
			   searchCatalog();
        }
	}

    // Client-side routes    
    Sammy(function() {
        this.get('#:sort/:filter/:queryPhrase', function() {
            self.searchResults([]);
            $(".tt-dropdown-menu").hide();
            var queryStr = (this.params.queryPhrase == '#$'?"":this.params.queryPhrase);
            if (this.params.sort === "item") { //load items details into 
				self.viewMode('item');	
				$('.bf_searchToolbar').hide();
				$.get("/itemDetails",
					data = {uuid:this.params.queryPhrase,type:this.params.filter},
					function(datastore_response) {
						self.chosenItemData(datastore_response);
						//self.chosenItemData({type:'Person'});
						$('.viewItem').append(JSON.stringify(datastore_response));
					}
				);	
            } else {
				self.viewMode('search');	
				self.chosenItemData(null);
				self.chosenBfSearchViewId((isNotNull(this.params.filter)?this.params.filter:'All'));
				self.chosenBfSortViewId((isNotNull(this.params.sort)?this.params.sort:'Relevance'));
				self.queryPhrase(queryStr);		
				if (isNotNull(queryStr)) {
					$('.bf_searchToolbar').show();
					self.from(0);
					searchCatalog();
				} else {
					$('.bf_searchToolbar').hide();
				};
			};
			$(window).scrollTop(0);
        });
        this.get('', function() { this.app.runRoute('get', '#Relevance/All/#$') });
    }).run();



  
}

var Result = function(search_result) {
   this.uuid = search_result['uuid'];
   this.url = "#item/	"+search_result['url'];
   this.title = search_result['title'];
   this.author = search_result['creators'];
   this.cover_url = '/static/images/cover-placeholder.png';
   if('cover' in search_result) {
     this.cover_url = search_result['cover']['src']; 
   } 
   this.held_items = [];
   if('held_items' in search_result) {
       this.held_items = search_result['held_items'];
   }
}
	
function searchCatalog() {
	//alert("enter search function");
	$(".tt-dropdown-menu").hide();
	var data = {
	  csrfmiddlewaretoken: self.csrf_token,
	  phrase: self.queryPhrase(),
	  from: self.from(),
	  size: self.shardSize() 
        }
        if(self.chosenBfSortViewId()) {
          data['sort'] =  self.chosenBfSortViewId();
		}
        if(self.chosenBfSearchViewId()) {
          data['filter'] = self.chosenBfSearchViewId();
        }
	$.post(self.search_url, 
			data=data,
			function(datastore_response) {
				if(datastore_response['message'] == 'error') {
					self.flash(datastore_response['body']);
					self.errorMsg("Error with search!");
				} else {
					self.queryPhraseForResults(self.queryPhrase());
					self.errorMsg("");
					self.from(datastore_response['from']);
					if(datastore_response['total'] != self.totalResults()) {
						self.totalResults(datastore_response['total']);
					}
					if(self.from() > self.totalResults()){
						self.from(self.totalResults());
					}
					for(i in datastore_response['hits']) {
						var row = datastore_response['hits'][i];
						self.searchResults
						var result = new Result(row);
						self.searchResults.push(result);
					}
				}
			}
	);
}

