var fetch = require('node-fetch');

export default function (server) {

  server.route({
    path: '/api/K-Graph/example/{index}',
    method: ['POST','GET'],
    handler(req, reply) {
	  let question = req.payload.question;
	  let field = req.payload.field;
	  let resultLimit = req.payload.limit;
	  
	  /*let dataObj	= 	{
			"query":{
				"multi_match": {
					"fields":["document_name","content"],
					"type": "cross_fields"
				}
			}
		}*/
	let dataObj = {
					"query":{
							"bool":{
									"must":[{
												"multi_match": {
													"query":"10 BALOCH",
													"fields":["unitName","casOfEnTps.str"],
													"type": "phrase"
												}
											}]
									}
							},
					"_source":["unitName","casOfEnTps"]
				  }
	//"fields": ["ActionName", "ConceptName", "PropertyName", "RelatedObject", "RelatedValue", "id","DocumentID"],
	  dataObj['query']['bool']['must'][0].multi_match.query=question;
	  //dataObj['size']=size;
	  dataObj['query']['bool']['must'][0].multi_match['fields']=field;
	  dataObj['query']['bool']['must'][0].multi_match['type']='phrase';
	  dataObj['_source'] = req.payload.sourcefield;
	  for (let i=0;i<req.payload.sourcefield.length;i++){
		  dataObj['query']['bool']['must'].push({"exists":{"field":req.payload.sourcefield[i]}});
	  
	  }
	  //console.log(dataObj);
	  //console.log(dataObj['query']['bool']['must']);
	  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
	  callWithRequest(req,'search', {index: req.params.index, body:dataObj,size:resultLimit}).then(function (resp) {
		  //console.log(resp);
          reply({
            ok: true,
            resp: resp
          });
        }).catch(function (resp) {
		  console.log('err',resp);
          reply({
            ok: false,
            resp: resp
          });
        });
		
      
	  /*reply (fetch('https://api.opensource.org/licenses/copyleft', {
		  method: 'GET',
		  headers: {'Content-Type': 'application/json'}
	  }).then(response => {
			return response.json();
	     }).catch(err => {console.log(err);}));*/
    }
  });
  server.route({
    path: '/api/K-Graph/mapping/{index}',
    method: 'GET',
	handler(req, reply) {
		const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
	  callWithRequest(req,'indices.getMapping', {index: req.params.index}).then(function (resp) {
		  //console.log(resp);
          reply({
            ok: true,
            resp: resp
          });
        }).catch(function (resp) {
		  //console.log(resp);
          reply({
            ok: false,
            resp: resp
          });
        });
	}
  });
	
  server.route({
    path: '/api/K-Graph/listIndex',
    method: 'GET',
	handler(req, reply) {
		const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
	  callWithRequest(req,'cat.indices').then(function (resp) {
		  //console.log(resp);
          reply({
            ok: true,
            resp: resp
          });
        }).catch(function (resp) {
		  console.log('err',resp);
          reply({
            ok: false,
            resp: resp
          });
        });
	}
  });
  server.route({
    path: '/api/K-Graph/expandSearch/{index}',
    method: 'POST',
	handler(req, reply) {
		let question = req.payload.question;
	    let field = req.payload.field;
		let resultLimit = req.payload.limit;
		let dataObj	= 	{
		 "query":{
			"bool":{
				"must":[
					
					
				]
			}
		 }
		}
		
	  //"fields": ["ActionName", "ConceptName", "PropertyName", "RelatedObject", "RelatedValue", "id","DocumentID"],
	  //dataObj['size']=size;
	  
	  let tempShouldArr = []
	  for(let q of question){
		  let dataObjSub = {
						"multi_match":{
							
							"type":"phrase"
						}
					}
		  dataObjSub.multi_match['query']=q;
		  
		  dataObjSub.multi_match['fields']=field;
		  tempShouldArr.push(dataObjSub);
		  //console.log('question',q);
	  }
	  //console.log('Should query',tempShouldArr);
	  dataObj.query.bool.must = tempShouldArr;
	  for (let i=0;i<req.payload.sourcefield.length;i++){
		  dataObj['query']['bool']['must'].push({"exists":{"field":req.payload.sourcefield[i]}});
	  
	  }
	  dataObj['_source'] = req.payload.sourcefield;
	  //console.log(dataObj);
		const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
	    callWithRequest(req,'search',{index: req.params.index, body:dataObj,size:resultLimit}).then(function (resp) {
		  //console.log(resp);
          reply({
            ok: true,
            resp: resp
          });
        }).catch(function (resp) {
		  console.log('error',resp);
          reply({
            ok: false,
            resp: resp
          });
        });
	}
  });
}
