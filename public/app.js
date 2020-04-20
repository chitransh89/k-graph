import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';

import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

var vis = require('./js/vis.min.js');
require('./css/vis.min.css');
require('./css/switch.css');

var network, nodes, edges, json_input, searchfield; 
var deletedNodes = [];
var nodeIds = [];
uiRoutes.enable();
uiRoutes
  .when('/', {
    template
  });

var removeDuplicates =  function (myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
}

/*
 *Create Network Graph
 */
var networkState = [];
var redoArray = [];
var nodesArray_pre = [];
var edgesArray_pre = [];
var groupObj = {};
var keys = [];
var key;

			 
function saveNetwork(obj){
	//console.log('save network');
	if(obj.nw != null){
		if(networkState.length<5)
			networkState.push({'nw':JSON.parse(JSON.stringify(obj.nw.body.data)),'k':JSON.parse(JSON.stringify(obj.k))});
		else{
			networkState.shift();
			networkState.push({'nw':JSON.parse(JSON.stringify(obj.nw.body.data)),'k':JSON.parse(JSON.stringify(obj.k))});
		}
		nodeIds = Object.keys(obj.nw.body.data.nodes._data);
	}
	//console.log(nodeIds);
}
			 
function startNetwork(fieldArr) {
        // this list is kept to remove a random node.. we do not add node 1 here because it's used for changes
        //shadowState = false;
		// create an array with nodes
        
		
		//Fetching selected fields of the result
		for ( let item of json_input){
			for (let k of fieldArr){
				//.push(item._source[k].toString());
				nodesArray_pre.push({id:item._source[k].toString(), group:k, label:item._source[k].toString(), title:item._source[k].toString()});
			}
		}
		let nodesArray = removeDuplicates(nodesArray_pre,'id');
		nodeIds = nodesArray.map(x => x.id);
		for ( let item of json_input){
			for(let i of fieldArr){
				for(let j of fieldArr){
					if (i!==j){
						key = item._source[i]+';'+item._source[j];
						if (keys.indexOf(key) == -1){
							keys.push(key);
							edgesArray_pre.push({from:item._source[i].toString(),to:item._source[j].toString(), value:1, title:1})
						}
						else{
							let ind = keys.indexOf(key)
							edgesArray_pre[ind].value = edgesArray_pre[ind].value+1;
							edgesArray_pre[ind].title = edgesArray_pre[ind].value.toString();
						}
					}
						
				}
				
			}
		}
		
		nodes = new vis.DataSet(nodesArray);
		edges = new vis.DataSet(edgesArray_pre);
		// create a network
        var container = document.getElementById('mynetwork');
        var data = {
            nodes: nodes,
            edges: edges
        };
		
		/**
		icon: {
			face: 'FontAwesome',
			code: '\uf192',
			color:'#D5F5E3'  
			},
		*/
        var options = {
						nodes:{
								shape:'dot',
								font:{
									size:10
								},
								size:18,
								chosen:{
									node: function(values, id, selected, hovering){
										values.borderWidth = 4;
										values.color = '#F1948A',
										values.borderColor	="#1C2833"
									}
								}
								
								
						},
						interaction: {
							multiselect:true,
							navigationButtons: true
						},
						groups : groupObj,
						edges:{
							color:{
								color:'#BFC9CA',
								inherit:false
							},
							smooth: {
							  type: "diagonalCross",
							  roundness: 0
							}
							
						},
						physics:{
							"forceAtlas2Based": {
								  "gravitationalConstant": -700,
								  "centralGravity": 0.055,
								  "springLength": 230,
								  "springConstant": 0.04,
								  "avoidOverlap": 0.48,
								  "damping":0.62
								},
								"maxVelocity": 6,
								"minVelocity": 0.75,
								"solver": "forceAtlas2Based"
							  
						}/*,
						configure: {
								enabled: true,
								showButton: true,
								filter: function (option, path) {
								  return path.indexOf('physics') !== -1;
								},
								container: document.getElementById('physicsConfigurator')
						}*/
					  };
		network = new vis.Network(container, data, options);
		//saveNetwork(network);
    }
    
	/*
	 *Deletes a node
	 */
	function removeNode(nodeId) {
		deletedNodes.push(nodeId);
        nodes.remove({id:nodeId});
		let index = nodeIds.indexOf(nodeId);
        nodeIds.splice(index,1);
		
    }
	/**
	 *Undo network state
	 */
	function undo(){
		if(network != null){
			if(redoArray.length == 0){
			let current_network = network;
		
			redoArray.push({'nw':JSON.parse(JSON.stringify(current_network.body.data)),
						    'k':JSON.parse(JSON.stringify(keys))});
			console.log("Redo Array Incremented");
			//console.log(current_network.body.data.nodes._data);
		}
		else{
			let current_network = network;
		
			redoArray.pop();
			redoArray.push({'nw':JSON.parse(JSON.stringify(current_network.body.data)),
						    'k':JSON.parse(JSON.stringify(keys))});
		}
		networkState.pop();
		let n = networkState.pop();
		let n_data = n.nw;
		keys = n.k;
		nodeIds = Object.keys(n_data.nodes._data);
		nodes = new vis.DataSet(Object.values(n_data.nodes._data));
		edges = new vis.DataSet(Object.values(n_data.edges._data));
		
		network.setData({"nodes":nodes, 
						 "edges":edges});
		saveNetwork({'nw':network, 'k':keys});
		}
		
	}
	
	/**
	 * Redo network state
	*/
	function redo(){
		if(redoArray.length >0){
			let n = redoArray.pop();
			let n_data = n.nw;
			keys = n.k;
			nodeIds = Object.keys(n_data.nodes._data);
			network.setData({nodes:new vis.DataSet(Object.values(n_data.nodes._data)), 
							 edges:new vis.DataSet(Object.values(n_data.edges._data))});
			saveNetwork({'nw':network, 'k':keys});
			console.log('redoArray length has become',redoArray.length);
		
		}
		
	}
	
	/**
	*Add nodes
	*/
	function addNode(fieldArr){
		for ( let item of json_input){
			for (let k of fieldArr){
				if(nodeIds.indexOf(item._source[k]) == -1){
					nodes.add({id:item._source[k].toString(), group: k, label:item._source[k].toString(), title:item._source[k].toString()});
					nodeIds.push(item._source[k].toString());
					
				}	
			}
		}
		//console.log(nodes);
		
	}
	/**
	* Add Edge
	*/
	function addEdge(fieldArr){
		let edge_pre = [];
		let last_key_index = keys.length;
		for ( let item of json_input){
			for(let i of fieldArr){
				for(let j of fieldArr){
					if(item._source[j] == null || item._source[i] == null)
						continue;
					if (i!==j){
						key = item._source[i]+';'+item._source[j];
						
						if (keys.indexOf(key) == -1){
							keys.push(key);
							edge_pre.push({from:item._source[i].toString(),to:item._source[j].toString(), value:1, title:1})
						}
						else{
							let ind = keys.indexOf(key);
							try{
							edge_pre[ind - last_key_index]['value'] = edgesArray_pre[ind - last_key_index]['value']+1;
							edge_pre[ind - last_key_index].title = edgesArray_pre[ind - last_key_index]['value'].toString();
							}
							catch(e){
								console.log(e);
								//console.log(edge_pre[ind - last_key_index].value);
							}
						}
					}
						
				}
				
			}
		}
		edge_pre.forEach(element => edges.add(element));
		
	}
	
	/**
	* Add Edge Selected
	*/
	function addEdgeSelected(fieldArr){
		let edge_pre = [];
		let last_key_index = keys.length;
		for ( let item of json_input){
			for(let i of fieldArr){
				for(let j of fieldArr){
					if (i!==j){
						key = item._source[i]+';'+item._source[j];
						if (keys.indexOf(key) == -1){
							keys.push(key);
							edge_pre.push({from:item._source[i].toString(),to:item._source[j].toString(), value:1, title:1})
						}
						
					}
						
				}
				
			}
		}
		edge_pre.forEach(element => edges.add(element));

	}
uiModules
  .get('app/K-Graph', [])
  .controller('kGraph', function ($scope, $http) {
	$scope.title = 'K Graph';
    $scope.description = 'Play with graph';
	$scope.selection = [];
	let geoArray = [];
	let textArray = [];
	let dateArray = [];
	//$scope.groupO = {};
	$scope.Math = window.Math;
	$scope.colorPicker = [];
	$scope.cArr = {};
	$scope.maxHop = 100;
	
	//Random Color Selection
	$scope.getRandomColor = function(){
		let randomColor = '#';
		let letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			randomColor += letters[Math.floor(Math.random() * 16)];
		}
		return randomColor;
	};
	//Delete node call
	$scope.deleteNodes = function(){
		
		network.getSelectedNodes().forEach(function(nodeid){
			removeNode(nodeid);
		});
		if (nodes.length == 0){
			network = null;
			nodes = null;
			edges = null;
			nodesArray_pre = [];
			edgesArray_pre = [];
			keys = [];
			key = null;
			geoArray = [];
			textArray = [];
			dateArray = [];
		}
		saveNetwork({'nw':network, 'k':keys});
	};
	
	$scope.undo = function(){
		
		undo();
	};
	
	$scope.redo = function(){
		
		redo();
	};
	$scope.toggleSelection = function (fieldterm){
		var idx = $scope.selection.indexOf(fieldterm);
		if (idx > -1){
			$scope.selection.splice(idx,1);
		}
		else{
			$scope.selection.push(fieldterm);
		}
		//console.log($scope.selection);
	};
	$scope.indexSelect = function(){
		network = null;
		nodes = null;
		edges = null;
		nodesArray_pre = [];
		edgesArray_pre = [];
		keys = [];
		key = null;
		geoArray = [];
		textArray = [];
		dateArray = [];
		groupObj = {};
		if($scope.index != ''){
			$http.get('../api/K-Graph/mapping/'+$scope.index).then(function (resp) {
				let x = JSON.parse(JSON.stringify(resp.data.resp[$scope.index]['mappings']));
				let y = Object.keys(x);
				let z = x[y].properties;
				$scope.fields = Object.keys(z);
				
				for(let key of $scope.fields){
					if('fields' in z[key]){
						if(Object.keys(z[key]['fields']) == 'str'){
							
							textArray.push(key+'.str');
							//console.log(textArray);
						}
					}
					
				}
				
				$scope.selection = [];
				let counter = 0;
				for(let k of $scope.fields){
					counter++;
					/**This code is very much specific to current use case of searching date and schema*/
					/*Code Starts*/
					
					/*code ends*/
					if (z[k].type == 'text' || z[k].type == 'keyword'){
						textArray.push(k);
					}
					else if(z[k].type == 'geo_point'){
						geoArray.push(k);
					}
					else if(z[k].type == 'date'){
						dateArray.push(k);
					}
				}
				groupObj = $scope.cArr;
				//$scope.groupO = groupObj;
				//console.log(groupObj);
			});
		}
		
	}
	
	$http.get('../api/K-Graph/listIndex').then(function(resp){
		let x = resp.data.resp.split("\n");
		//$scope.listIndex.push('Select Index');
		let z = x.map(function(elem){return elem.split(" ")[2]}).reverse();
		$scope.listIndex = z.filter(ind => !(typeof(ind) === 'undefined' || ind.includes('.')));
	});
	$scope.selectAll = function(){
		network.selectNodes(nodeIds);
	};
	$scope.invertSelection = function(){
		let selNodes = network.getSelectedNodes();
		let nodesToSelect = [];
		for(let i = 0; i< nodeIds.length;i++){
			if(selNodes.indexOf(nodeIds[i]) == -1){
				nodesToSelect.push(nodeIds[i]);
			}
		}
		network.unselectAll();
		network.selectNodes(nodesToSelect);
	};
	$scope.unselectAll = function(){
		network.unselectAll();
	};
	
	$scope.linkSelect = function(){
		let selNodes = network.getSelectedNodes();
		selNodes.forEach(function(elem){
			let nodesToSelect = network.getConnectedNodes(elem);
			nodesToSelect.push(elem);
			network.selectNodes(nodesToSelect);
			
		});
	};
	$scope.doSearch = function(){
		let field = [];
		if(($scope.searchterm != null || $scope.searchterm != '') && $scope.selection.length > 0){
			/**
			This code will be useful to search in all fields. But ES don't support _all, use 'copy_to' field 
			Check doc @https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-all-field.html#custom-all-fields
			*/
			field.push($scope.fields);
			field.push($scope.searchterm);
			searchfield = $scope.searchterm;
			let question = {"field":textArray, "question":field[1], "sourcefield":$scope.selection, "limit": $scope.maxHop};
			$http.post('../api/K-Graph/example/'+$scope.index, question).then(function (resp) {
				try{
					json_input = resp.data.resp.hits.hits;
					
					if (network == null || (nodeIds.length == 0)){
						console.log('Calling newtork start');
						startNetwork($scope.selection);
						saveNetwork({'nw':network, 'k':keys});
						
					}
					else{
						
						console.log('Calling Add Node');
						addNode($scope.selection);
						console.log('Calling Add edge');
						addEdge($scope.selection);
						saveNetwork({'nw':network, 'k':keys});
					}
				}
				catch(err){
					console.log(err);
				}
				
			});
			
		}
		$scope.searchterm = null;
		
	}
	$scope.expand = function(){
		let selectedNodes = network.getSelectedNodes();
		//We need to create a boolean query for this
		//console.log(network);
		let question = {"field":textArray, "question":selectedNodes, "sourcefield":$scope.selection,"limit": $scope.maxHop};
		$http.post('../api/K-Graph/expandSearch/'+$scope.index, question).then(function (resp) {
				json_input = resp.data.resp.hits.hits;
					//console.log(json_input);
					addNode($scope.selection);
					addEdgeSelected($scope.selection);
					if (resp.data.resp.hits.total > 0)
						saveNetwork({'nw':network, 'k':keys});
					
			});
			
	};
    /*Demo piece to fetch external url(use fetch in server script-index.js)
	 *$http.post('../api/K-Graph/example/nlu_sample').then(function (resp) {
	 *		//console.log(resp);
     *     //$scope.currentTime = resp;
	 *  startNetwork();
     * });
	 */
    $scope.togglePhysics = function(checkStatus){
		console.log('before status',network);			
		if (network !=null){
			network.setOptions( { physics: checkStatus });
			//console.log('after status',network);
			
		}
	};
	
  });
