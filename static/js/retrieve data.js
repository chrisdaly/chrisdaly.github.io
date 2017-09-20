// Pythonic string subtitution.
String.prototype.format = function () {
  var i = 0, args = arguments;
  return this.replace(/{}/g, function () {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

// Hits zermelo.w2odst.com/api/ with query and data - synchronous.
function get_data_from_endpoint(endpoint, query, data=null){
  r = $.get({
   url: 'http://zermelo.w2odst.com/api/{}?q={}'.format(endpoint, query),
   data: data,
   dataType: 'json',
   async:false
  })
  return r
}

// Visits each node, pulls relevant data, adds node properties.
function visit_node(json, hits_size){
  for (var i = 0; i < json.length; i++) {
     var each = json[i];
     each['id'] = j;
     j++

     data = {'size': hits_size};

     if ('children' in each) {
        visit_node(each['children']);

        r = get_data_from_endpoint('search', each['query'], data=data);
        each['count'] = r.responseJSON['hits']['total'];
        if (each['count'] > 0) {
          samples = r.responseJSON['hits']['hits']
          each['samples'] = []

          samples.forEach(function(hit){
            d_temp = {
              'id': hit['_source']['id'],
              'created_at': hit['_source']['created_at'],
              'author_alias': hit['_source']['author']['alias'],
              'body': hit['_source']['body'],
              'tags': hit['_source']['tags']
              };
            each['samples'].push(d_temp)
          });
        }
        else {
          each['samples'] = null;
        }
     }
     else {
       r = get_data_from_endpoint('search', each['query'], data=data);
       each['count'] = r.responseJSON['hits']['total'];
       if (each['count'] > 0) {
         samples = r.responseJSON['hits']['hits']
         each['samples'] = []

         samples.forEach(function(hit){
           d_temp = {
               'id': hit['_source']['id'],
               'created_at': hit['_source']['created_at'],
               'author_alias': hit['_source']['author']['alias'],
               'body': hit['_source']['body'],
               'tags': hit['_source']['tags']
             };
           each['samples'].push(d_temp)
         });
       }
       else {
         each['samples'] = null;
       }
     }
   }
 return json
}

function get_raw_data(query){
  // Global that tracks id in recursion.
  j = 0;

  // Parse submitted query into json tree.
  r = get_data_from_endpoint('search/parse', query)
  data = r.responseJSON

  // Populate parsed query with extra fields.
  data = [data];
  console.log(JSON.stringify(data));

  data = visit_node(data);
  console.log('-- End of data retrieval --');

  // Wrap result a parent object.
  data = {"id": 'Results',
    "count": data[0].count,
    "children": data
  };
  return data;
}